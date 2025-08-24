import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const navigate = useNavigate()

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (
      (email === "admin@admin.com" && senha === "admin123") ||
      (email === "user@user.com" && senha === "user123")
    ) {
      localStorage.setItem("logado", "true")
      localStorage.setItem("userEmail", email)
      navigate("/")
    } else {
      setErro("Usuário ou senha inválidos")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-sm bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-6 text-center">
          Login – Protótipo TCC ChatBot ERP
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="w-full p-3 rounded border border-gray-300 dark:bg-gray-800 dark:text-gray-100"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          <input
            className="w-full p-3 rounded border border-gray-300 dark:bg-gray-800 dark:text-gray-100"
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
          />
          {erro && <div className="text-red-500">{erro}</div>}
          <button
            className="w-full py-2 bg-blue-700 dark:bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-800 dark:hover:bg-blue-700 transition"
            type="submit"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
