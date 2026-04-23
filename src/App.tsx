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
