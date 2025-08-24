import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import ThemeToggle from "../components/ThemeToggle"

interface ChatMessage {
  role: "user" | "bot"
  content: string
}

// Pega a URL da API do backend do .env:
const API_URL = import.meta.env.VITE_API_URL

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content: "Olá! 👋 Sou o assistente virtual da Empresa. Como posso te ajudar no sistema hoje?"
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput("")
    setLoading(true)

    setMessages(prev => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "bot", content: "⏳ Pensando..." }
    ])

    // ---- STREAMING ----
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage }),
      })

      if (!response.body) {
        throw new Error("Resposta do backend não contém body para streaming")
      }

      // Leitura de stream
      const reader = response.body.getReader()
      let botMessage = ""
      setMessages(prev => prev) 

      // Remover o "⏳ Pensando..." enquanto streama
      let streamingMsgs = (prevMsgs: ChatMessage[]) =>
        prevMsgs.slice(0, -1).concat({ role: "bot", content: botMessage })

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = new TextDecoder("utf-8").decode(value)
        botMessage += chunk
        setMessages(prev => streamingMsgs(prev))
      }

      setMessages(prev => streamingMsgs(prev))
    } catch (err: any) {
      setMessages(prev =>
        prev.slice(0, -1).concat({
          role: "bot",
          content: "❌ Erro ao buscar resposta do assistente."
        })
      )
    } finally {
      setLoading(false)
    }
  }

  function handleEndChat() {
    window.location.href = ""
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center transition-colors">
      <ThemeToggle />
      <div className="w-full max-w-2xl h-[80vh] bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-700 dark:bg-blue-900">
          <button
            className="text-white px-3 py-1 rounded hover:bg-blue-600 transition"
            onClick={() => navigate("/")}
          >
            ← Voltar
          </button>
          <h2 className="text-xl font-bold text-white tracking-wide drop-shadow">Chat Bot</h2>
          <button
            onClick={handleEndChat}
            className="ml-4 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition text-sm"
            title="Encerrar e Avaliar Conversa"
          >
            Encerrar Conversa
          </button>
        </div>

        {/* Chat messages */}
        <div className="flex-1 px-6 py-6 overflow-y-auto space-y-4 bg-white dark:bg-gray-900 transition-colors">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`
                max-w-[75%] px-5 py-3 rounded-2xl shadow
                ${msg.role === "user"
                  ? "bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-200 rounded-br-none"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-bl-none"}
              `}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form
          className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex gap-2 transition-colors"
          onSubmit={e => { e.preventDefault(); handleSend() }}
        >
          <input
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white shadow transition-colors"
            type="text"
            placeholder="Digite sua dúvida..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-700 dark:bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-800 dark:hover:bg-blue-700 transition shadow disabled:opacity-60"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  )
}
