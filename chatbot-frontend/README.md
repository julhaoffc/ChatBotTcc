# Chatbot ERP (React + TypeScript + Flask + OpenAI)

Este projeto é um chatbot integrado a manuais em PDF, utilizando **OpenAI**, **FAISS** para busca semântica e **React + Vite** no front-end.

---

## 🚀 Funcionalidades

- Upload de PDFs para base de conhecimento.
- Indexação dos documentos usando embeddings OpenAI.
- Respostas contextuais baseadas nos manuais.
- Tema claro/escuro (Dark Mode).
- Login simples para controle de acesso.
- Painel de configuração (contexto + PDFs + reindexação).

---

## 🛠 Tecnologias

- **Front-end:** React, TypeScript, TailwindCSS, Vite
- **Back-end:** Flask, OpenAI API, FAISS
- **OCR:** PyMuPDF + Tesseract

---

## ⚠️ Aviso Importante

**NÃO COMMITAR arquivos sensíveis:**
- `config.json` (contém a chave da OpenAI)
- Arquivos PDF internos
- Index FAISS (`faiss_index.bin`, `faiss_meta.pkl`)
- `.env`

Adicione-os ao `.gitignore`.

---

## 📂 Estrutura do Projeto

