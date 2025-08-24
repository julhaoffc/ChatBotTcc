import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL

export default function Config() {
  const [contexto, setContexto] = useState("")
  const [openaiKey, setOpenaiKey] = useState("")
  const [pdfs, setPdfs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [reindexStatus, setReindexStatus] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const navigate = useNavigate()

  // Carrega configurações atuais
  useEffect(() => {
    fetch(`${API_URL}/config`)
      .then(r => r.json())
      .then(cfg => {
        setContexto(cfg.context || "")
        setOpenaiKey(cfg.openai_key || "")
        setPdfs(cfg.manuals || [])
      })
  }, [])

  function handleSave() {
    setLoading(true)
    fetch(`${API_URL}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: contexto,
        openai_key: openaiKey,
        manuals: pdfs
      })
    })
      .then(() => setMessage("Configurações salvas!"))
      .catch(() => setMessage("Erro ao salvar configurações."))
      .finally(() => setLoading(false))
  }

  function handlePDFUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    const formData = new FormData()
    files.forEach(file => {
      formData.append("files", file)
    })
    setLoading(true)
    fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData
    })
      .then(r => r.json())
      .then(data => {
        setPdfs(prev => [...prev, ...(data.filenames || [])])
        setMessage("Manuais enviados com sucesso!")
      })
      .catch(() => setMessage("Erro ao enviar manuais."))
      .finally(() => setLoading(false))
  }

  function handleRemovePDF(name: string) {
    setPdfs(prev => prev.filter(pdf => pdf !== name))
  }

  function handleReindex() {
    if (!window.confirm("Reindexar todos os PDFs? Isso pode consumir créditos da OpenAI. Deseja continuar?")) return
    setReindexStatus("Reindexando...")
    fetch(`${API_URL}/reindex`, {
      method: "POST"
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setReindexStatus("Reindexação concluída com sucesso!")
        } else {
          setReindexStatus("Erro ao reindexar: " + data.error)
        }
      })
      .catch(() => setReindexStatus("Erro na requisição de reindexação."))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-xl bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-xl p-8 relative">

        {/* Botão Voltar */}
        <button
          className="absolute top-6 right-6 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-xl shadow hover:bg-gray-300 dark:hover:bg-gray-700 transition font-medium"
          onClick={() => navigate("/")}
        >
          ← Voltar
        </button>

        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-6">Configuração do Chatbot</h2>

        {message && <div className="mb-4 text-green-700 dark:text-green-400 font-semibold">{message}</div>}

        <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
          Contexto do Bot:
          <textarea
            className="w-full mt-1 p-2 rounded border border-gray-300 dark:bg-gray-800 dark:text-gray-100"
            rows={4}
            value={contexto}
            onChange={e => setContexto(e.target.value)}
          />
        </label>

        <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
          OpenAI API Key:
          <input
            className="w-full mt-1 p-2 rounded border border-gray-300 dark:bg-gray-800 dark:text-gray-100"
            type="password"
            placeholder="sk-..."
            value={openaiKey}
            onChange={e => setOpenaiKey(e.target.value)}
          />
        </label>

        <div className="mb-6">
          <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Manuais lidos pelo Bot:
          </label>
          <ul className="mb-2">
            {pdfs.map(pdf => (
              <li key={pdf} className="flex items-center justify-between mb-1 text-gray-700 dark:text-gray-200">
                {pdf}
                <button
                  className="text-red-500 hover:underline ml-2 text-sm"
                  onClick={() => handleRemovePDF(pdf)}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={handlePDFUpload}
            className="block mt-1"
            disabled={loading}
          />
        </div>

        <button
          className="w-full py-2 bg-blue-700 dark:bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-800 dark:hover:bg-blue-700 transition disabled:opacity-60"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar Configurações"}
        </button>

        <button
          className="w-full mt-4 py-2 bg-green-700 dark:bg-green-600 text-white font-semibold rounded-xl hover:bg-green-800 dark:hover:bg-green-700 transition"
          onClick={handleReindex}
        >
          Reindexar Base de PDFs
        </button>

        {reindexStatus && (
          <div className="mt-4 text-blue-800 dark:text-blue-300">{reindexStatus}</div>
        )}
      </div>
    </div>
  )
}
