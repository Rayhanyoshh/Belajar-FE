import { useState, useEffect } from 'react'
import Auth from './pages/Auth'
import Portal from './pages/Portal'
import Dashboard from './pages/Dashboard'
import DummyHRIS from './pages/DummyHRIS'

export type ViewState = 'auth' | 'portal' | 'gotracker' | 'hris';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'))
  const [currentView, setCurrentView] = useState<ViewState>(token ? 'portal' : 'auth')

  useEffect(() => {
    // Tangkap token dari URL jika baru kembali dari Google OAuth
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    const urlRefreshToken = params.get('refresh_token')

    if (urlToken && urlRefreshToken) {
      localStorage.setItem('jwt_token', urlToken)
      localStorage.setItem('refresh_token', urlRefreshToken)
      
      try {
        const payload = JSON.parse(atob(urlToken.split('.')[1]))
        localStorage.setItem('username', payload.username)
      } catch (e) {
        console.error("Gagal membaca token payload")
      }

      setToken(urlToken)
      // Bersihkan URL agar token tidak terlihat
      window.history.replaceState({}, document.title, "/")
    }

    const handleStorageChange = () => {
      const newToken = localStorage.getItem('jwt_token')
      setToken(newToken)
      if (!newToken) setCurrentView('auth')
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  useEffect(() => {
    if (!token) {
      setCurrentView('auth')
    } else if (currentView === 'auth') {
      setCurrentView('portal')
    }
  }, [token, currentView])

  const renderView = () => {
    switch (currentView) {
      case 'auth':
        return <Auth setToken={setToken} />
      case 'portal':
        return <Portal setToken={setToken} setCurrentView={setCurrentView} />
      case 'gotracker':
        return <Dashboard setToken={setToken} setCurrentView={setCurrentView} />
      case 'hris':
        return <DummyHRIS setToken={setToken} setCurrentView={setCurrentView} />
      default:
        return <Portal setToken={setToken} setCurrentView={setCurrentView} />
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground">
      {renderView()}
    </div>
  )
}
