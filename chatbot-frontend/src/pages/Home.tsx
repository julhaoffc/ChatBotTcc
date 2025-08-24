import { useNavigate } from "react-router-dom"
import ThemeToggle from "../components/ThemeToggle"

export default function Home() {
  const navigate = useNavigate()
  const email = localStorage.getItem("userEmail") || ""

  function handleLogout() {
    localStorage.removeItem("logado")
    localStorage.removeItem("userEmail")
    navigate("/login")
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <ThemeToggle />
      <button
        onClick={handleLogout}
        className="absolute top-6 left-8 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow text-sm font-semibold z-20"
        title="Sair"
      >
        Sair
      </button>

      <div className="w-full max-w-lg rounded-2xl shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur p-10 flex flex-col items-center">
        <h1 className="text-5xl font-extrabold text-blue-700 dark:text-blue-300 mb-6 text-center drop-shadow">
          ChatBot ERP
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-200 mb-8 text-center">
          Bem-vindo ao chatbot! Esta ferramenta foi desenvolvida para responder dúvidas sobre o sistema ERP, tornando o atendimento mais eficiente e moderno.
        </p>
        <div className="flex gap-4 w-full justify-center">
          <button
            className="px-8 py-3 bg-blue-700 dark:bg-blue-600 text-white rounded-full shadow-lg text-lg font-semibold hover:bg-blue-800 dark:hover:bg-blue-700 transition"
            onClick={() => navigate("/chat")}
          >
            Iniciar Chat
          </button>
          {/* Só mostra o botão de Configurações para o admin */}
          {email === "admin@admin.com" && (
            <button
              className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-blue-700 dark:text-blue-200 rounded-full shadow-lg text-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-800 transition"
              onClick={() => navigate("/config")}
            >
              Configurações
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
