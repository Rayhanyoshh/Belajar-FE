import { useState, useEffect } from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, Activity, Users, Box } from "lucide-react"
import { ViewState } from '../App'

const API_URL_SSO = import.meta.env.VITE_API_URL_SSO || 'http://localhost:8081'

interface Application {
  id: number;
  app_name: string;
  description: string;
  icon_name: string;
  action_key: string;
}

const IconMap: Record<string, any> = {
  'Activity': Activity,
  'Users': Users,
  'Box': Box
}

export default function Portal({ setToken, setCurrentView }: { setToken: (t: string|null) => void, setCurrentView: (v: ViewState) => void }) {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const username = localStorage.getItem('username') || 'User'

  useEffect(() => {
    const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
      let currentToken = localStorage.getItem('jwt_token')
      const headers = { ...options.headers, 'Authorization': `Bearer ${currentToken}` }
      let res = await fetch(url, { ...options, headers })

      if (res.status === 401) {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          localStorage.clear()
          setToken(null)
          return res
        }

        const refreshRes = await fetch(`${API_URL_SSO}/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        })

        if (refreshRes.ok) {
          const data = await refreshRes.json()
          localStorage.setItem('jwt_token', data.token)
          localStorage.setItem('refresh_token', data.refresh_token)
          headers['Authorization'] = `Bearer ${data.token}`
          res = await fetch(url, { ...options, headers })
        } else {
          localStorage.clear()
          setToken(null)
        }
      }
      return res
    }

    const fetchApps = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL_SSO}/applications`)
        if (res.ok) {
          const data = await res.json()
          setApps(data)
        }
      } catch (err) {
        console.error("Gagal mengambil daftar aplikasi", err)
      } finally {
        setLoading(false)
      }
    }
    fetchApps()
  }, [setToken])

  const handleLogout = () => {
    localStorage.clear()
    setToken(null)
  }

  const navigateToApp = (actionKey: string) => {
    if (actionKey === 'gotracker' || actionKey === 'hris') {
      setCurrentView(actionKey as ViewState)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl space-y-8 min-h-[90vh] flex flex-col">
      {/* Navbar Portal */}
      <nav className="flex items-center justify-between py-6 mb-8 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Box className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">App Portal</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">👋 Welcome, {username}</span>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-primary/20 hover:bg-primary/10">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      {/* Greeting */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold tracking-tight">Silakan Pilih Aplikasi</h2>
        <p className="text-muted-foreground mt-3 text-lg">Satu akses aman untuk seluruh ekosistem perusahaan Anda.</p>
      </div>

      {/* Grid Aplikasi */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center text-muted-foreground animate-pulse">Memuat daftar aplikasi yang diizinkan...</div>
        ) : apps.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground">Tidak ada aplikasi yang tersedia.</div>
        ) : (
          apps.map(app => {
            const IconComponent = IconMap[app.icon_name] || Box
            return (
              <Card 
                key={app.id} 
                className="group cursor-pointer border-border/50 bg-muted/20 hover:bg-background hover:border-primary/50 hover:shadow-xl transition-all duration-300"
                onClick={() => navigateToApp(app.action_key)}
              >
                <CardHeader>
                  <div className="mb-4 bg-muted w-14 h-14 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                    <IconComponent className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl">{app.app_name}</CardTitle>
                  <CardDescription className="min-h-[3rem] mt-2 line-clamp-2 leading-relaxed">
                    {app.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })
        )}
      </div>
      <div className="mt-auto text-center py-8 text-sm text-muted-foreground/50">
        Secured by GoTracker SSO Architecture
      </div>
    </div>
  )
}
