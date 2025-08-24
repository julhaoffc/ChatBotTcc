import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <button
      className="absolute top-6 right-6 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-xl shadow transition font-medium"
      onClick={() => setIsDark(d => !d)}
    >
      {isDark ? "🌙 Dark" : "☀️ Light"}
    </button>
  )
}
