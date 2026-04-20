import { useState, useEffect } from 'react'
import Landing from './components/Landing.jsx'
import Dashboard from './components/Dashboard.jsx'

export default function App() {
  const [page, setPage] = useState(() =>
    window.location.pathname === '/dashboard' ? 'dashboard' : 'landing'
  )

  useEffect(() => {
    const handler = () => setPage(window.location.pathname === '/dashboard' ? 'dashboard' : 'landing')
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      const a = e.target.closest('a')
      if (!a) return
      const href = a.getAttribute('href')
      if (href === '/dashboard') {
        e.preventDefault()
        window.history.pushState({}, '', '/dashboard')
        setPage('dashboard')
      } else if (href === '/' || href === '') {
        e.preventDefault()
        window.history.pushState({}, '', '/')
        setPage('landing')
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return page === 'dashboard' ? <Dashboard /> : <Landing />
}
