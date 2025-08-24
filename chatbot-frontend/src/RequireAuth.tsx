import { Navigate, useLocation } from "react-router-dom"

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const isLogged = localStorage.getItem("logado") === "true"
  const location = useLocation()

  if (!isLogged) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}
