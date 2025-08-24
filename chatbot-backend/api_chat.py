import os
import json
import pickle
import faiss
import openai
import numpy as np
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import subprocess

CONFIG_PATH = "config.json"
PDF_FOLDER = "pdfs"
INDEX_PATH = "faiss_index.bin"
META_PATH = "faiss_meta.pkl"

app = Flask(__name__)
CORS(app)

# --- CONFIG MANAGEMENT ---

def load_config():
    if not os.path.exists(CONFIG_PATH):
        return {
            "openai_key": "",
            "context": "",
            "manuals": []
        }
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_config(cfg):
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)

def get_openai_key():
    cfg = load_config()
    key = cfg.get("openai_key", "").strip()
    if not key:
        raise RuntimeError("Chave OpenAI não encontrada!")
    return key

def get_context():
    cfg = load_config()
    return cfg.get("context", "")

# --- FILES MANAGEMENT ---

@app.route("/config", methods=["GET", "POST"])
def config():
    if request.method == "GET":
        return jsonify(load_config())
    # POST (salvar configurações)
    cfg = request.json
    save_config(cfg)
    return jsonify({"ok": True})

@app.route("/upload", methods=["POST"])
def upload_pdf():
    if 'files' not in request.files:
        return jsonify({"ok": False, "error": "Nenhum arquivo enviado."}), 400

    files = request.files.getlist("files")
    if not files:
        return jsonify({"ok": False, "error": "Nenhum arquivo encontrado na requisição."}), 400

    os.makedirs(PDF_FOLDER, exist_ok=True)
    saved_files = []
    for f in files:
        if f.filename == "" or not f.filename.lower().endswith('.pdf'):
            continue  # Pula arquivos inválidos
        path = os.path.join(PDF_FOLDER, f.filename)
        f.save(path)
        saved_files.append(f.filename)

    if not saved_files:
        return jsonify({"ok": False, "error": "Nenhum PDF válido enviado."}), 400

    return jsonify({"ok": True, "filenames": saved_files})

@app.route("/reindex", methods=["POST"])
def reindex():
    """
    Executa o script generate_embeddings.py para reindexar todos os PDFs presentes na pasta.
    Retorna sucesso/erro.
    """
    try:
        result = subprocess.run(
            ["python", "generate_embeddings.py"],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return jsonify({
            "ok": True,
            "msg": "Reindexação concluída.",
            "output": result.stdout
        })
    except subprocess.CalledProcessError as e:
        return jsonify({
            "ok": False,
            "error": e.stderr or str(e)
        }), 500

# --- CHATBOT ENDPOINT ---

def load_index_and_meta():
    if not (os.path.exists(INDEX_PATH) and os.path.exists(META_PATH)):
        raise RuntimeError("Índice ou metadados não encontrados. Reindexe primeiro.")
    index = faiss.read_index(INDEX_PATH)
    with open(META_PATH, "rb") as f:
        meta = pickle.load(f)
    return index, meta["chunks"]

def embed_query(text: str) -> np.ndarray:
    openai.api_key = get_openai_key()
    resp = openai.embeddings.create(
        model="text-embedding-3-small",
        input=[text]
    )
    return np.array(resp.data[0].embedding, dtype="float32")

def build_prompt(context: str, question: str, docs: str) -> str:
    return f"""{context}

Contexto extraído dos manuais:
{docs}

Pergunta do usuário: {question}
"""


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    question = data.get("question", "").strip()
    if not question:
        return jsonify({"error": "Pergunta vazia."}), 400

    try:
        openai.api_key = get_openai_key()
        context = get_context()
        index, chunks = load_index_and_meta()
        q_emb = embed_query(question)

        K_RESULTS = 5
        D, I = index.search(q_emb[np.newaxis, :], K_RESULTS)
        matches = [chunks[i] for i in I[0]]
        context_docs = "\n\n".join(matches)
        prompt = build_prompt(context, question, context_docs)

        def stream_openai_response():
            response = openai.chat.completions.create(
                model="gpt-4.1-nano",
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": question}
                ],
                temperature=0,
                stream=True  
            )
            for chunk in response:
                delta = chunk.choices[0].delta
                content = getattr(delta, "content", None)
                if content:
                    yield content

        return Response(stream_with_context(stream_openai_response()), mimetype="text/plain")
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- MAIN ---
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
