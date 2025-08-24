import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Chat from "./pages/Chat"
import Config from "./pages/Config"
import Login from "./pages/Login"
import RequireAuth from "./RequireAuth"

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <RequireAuth>
          <Home />
        </RequireAuth>
      } />
      <Route path="/chat" element={
        <RequireAuth>
          <Chat />
        </RequireAuth>
      } />
      <Route path="/config" element={
        <RequireAuth>
          <Config />
        </RequireAuth>
      } />
    </Routes>
  )
}
