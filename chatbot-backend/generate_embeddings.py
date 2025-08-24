# generate_embeddings.py — Indexador otimizado para ERP (OpenAI + FAISS + OCR)

import os
import uuid
import pickle
import time
import fitz
import openai
import faiss
import numpy as np
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

import pytesseract
from PIL import Image
import io

# ------------- CONFIGURAÇÃO DINÂMICA -------------
CONFIG_PATH = "config.json"
PDF_FOLDER = "pdfs"
INDEX_PATH = "faiss_index.bin"
META_PATH = "faiss_meta.pkl"
EMBED_DIM = 1536
CHUNK_SIZE = 2000
CHUNK_OVERLAP = 400
BATCH_SIZE = 64
MAX_RETRIES = 5
TIMEOUT = 30
MAX_WORKERS = 4
# --------------------------------------------------

def get_openai_key():
    import json
    if not os.path.exists(CONFIG_PATH):
        raise RuntimeError("Arquivo config.json não encontrado! Configure a API Key via painel.")
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    key = cfg.get("openai_key", "").strip()
    if not key:
        raise RuntimeError("Chave OpenAI não encontrada em config.json!")
    return key

openai.api_key = get_openai_key()

def extract_text_and_images(pdf_path):
    """
    Lê todo o texto do PDF e faz OCR em cada imagem das páginas.
    """
    doc = fitz.open(pdf_path)
    full_text = ""
    for page_num in range(len(doc)):
        page = doc[page_num]
        # Texto normal da página
        full_text += page.get_text()
        # OCR em imagens da página
        for img in page.get_images(full=True):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            try:
                img_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                ocr_text = pytesseract.image_to_string(img_pil, lang="por")
                if ocr_text.strip():
                    full_text += f"\n[IMAGEM OCR - página {page_num+1}]:\n" + ocr_text.strip() + "\n"
            except Exception as e:
                print(f"[WARN] Falha ao processar imagem na página {page_num + 1}: {e}")
    return full_text

def load_pdf(path: str) -> str:
    return extract_text_and_images(path)

def split_sentences(text: str) -> list[str]:
    """Divide o texto em sentenças com regex."""
    return [s.strip() for s in re.split(r'(?<=[\.\?\!])\s+', text) if s.strip()]

def chunk_text(text: str) -> list[str]:
    """
    Agrupa sentenças em chunks de até CHUNK_SIZE,
    mantendo sobreposição de CHUNK_OVERLAP.
    """
    chunks, buffer = [], ""
    for sent in split_sentences(text):
        if len(buffer) + len(sent) > CHUNK_SIZE:
            chunks.append(buffer.strip())
            buffer = buffer[-CHUNK_OVERLAP:]
        buffer += sent + " "
    if buffer:
        chunks.append(buffer.strip())
    return chunks

def embed_batch(texts: list[str]) -> list[np.ndarray]:
    """
    Gera embeddings para um batch, com retry exponencial e timeout.
    """
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = openai.embeddings.create(
                model="text-embedding-3-small",
                input=texts,
                timeout=TIMEOUT
            )
            return [np.array(r.embedding, dtype="float32") for r in resp.data]
        except Exception as e:
            wait = 2 ** attempt
            print(f"  [ERRO] Embedding batch failed (try {attempt}): {e}. Retry em {wait}s...")
            time.sleep(wait)
    raise RuntimeError("Embedding falhou após múltiplos retries.")

def main():
    all_chunks, all_ids = [], []

    # Coleta e chunkificação de todos os PDFs
    for fname in os.listdir(PDF_FOLDER):
        if not fname.lower().endswith(".pdf"):
            continue
        print(f"-> Processando: {fname}")
        text = load_pdf(os.path.join(PDF_FOLDER, fname))
        for chunk in chunk_text(text):
            all_chunks.append(chunk)
            all_ids.append(str(uuid.uuid4()))
    total = len(all_chunks)
    print(f"Total de chunks criados: {total}")

    # Geração de embeddings em paralelo, por batches
    embeddings = [None] * total
    batches = [(i, all_chunks[i : i + BATCH_SIZE]) for i in range(0, total, BATCH_SIZE)]

    with ThreadPoolExecutor(MAX_WORKERS) as executor:
        futures = {executor.submit(embed_batch, batch): idx for idx, batch in batches}
        for fut in as_completed(futures):
            idx = futures[fut]
            embs = fut.result()
            embeddings[idx : idx + len(embs)] = embs
            print(f"[OK] Batch {idx}-{idx+len(embs)} incorporado.")

    # Montagem e persistência do índice FAISS
    index = faiss.IndexFlatL2(EMBED_DIM)
    index.add(np.stack(embeddings))
    faiss.write_index(index, INDEX_PATH)

    # Salvamento dos metadados (chunks + IDs)
    with open(META_PATH, "wb") as f:
        pickle.dump({"ids": all_ids, "chunks": all_chunks}, f)

    print(f"[OK] Índice FAISS criado com {total} vetores.")
    print(f"   - {INDEX_PATH}")
    print(f"   - {META_PATH}")

if __name__ == "__main__":
    main()
