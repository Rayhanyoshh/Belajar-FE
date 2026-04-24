import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Activity, LogOut, Plus, RefreshCw } from "lucide-react"

const API_URL_TRACKER = import.meta.env.VITE_API_URL_TRACKER || 'http://localhost:8080'

interface Website {
  id: number;
  url: string;
}

interface StatusData {
  url: string;
  status: string;
}

export default function Dashboard({ setToken, setCurrentView }: { setToken: (token: string | null) => void, setCurrentView: (view: any) => void }) {
  const [websites, setWebsites] = useState<Website[]>([])
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  
  const username = localStorage.getItem('username') || 'User'

  const fetchWebsites = async () => {
    try {
      const res = await fetch(`${API_URL_TRACKER}/websites`)
      if (res.ok) {
        const data = await res.json()
        setWebsites(data || [])
        triggerCheck() // Langsung cek status
      }
    } catch (err) {
      console.error("Gagal memuat website")
    }
  }

  // Wrapper pintar untuk melakukan fetch yang otomatis me-refresh token jika 401
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    let currentToken = localStorage.getItem('jwt_token')
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${currentToken}`
    }

    let res = await fetch(url, { ...options, headers })

    if (res.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        handleLogout()
        return res
      }

      const API_URL_SSO = import.meta.env.VITE_API_URL_SSO || 'http://localhost:8081'
      const refreshRes = await fetch(`${API_URL_SSO}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      if (refreshRes.ok) {
        const data = await refreshRes.json()
        localStorage.setItem('jwt_token', data.token)
        localStorage.setItem('refresh_token', data.refresh_token)
        
        // Ulangi request aslinya dengan token baru
        headers['Authorization'] = `Bearer ${data.token}`
        res = await fetch(url, { ...options, headers })
      } else {
        handleLogout()
      }
    }
    return res
  }

  const triggerCheck = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth(`${API_URL_TRACKER}/check`, { method: 'POST' })
      if (res.ok) {
        const data: StatusData[] = await res.json()
        const statusMap: Record<string, string> = {}
        data.forEach(s => statusMap[s.url] = s.status)
        setStatuses(statusMap)
      }
    } catch (err) {
      console.error("Gagal mengecek status")
    } finally {
      setLoading(false)
    }
  }

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetchWithAuth(`${API_URL_TRACKER}/websites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl })
      })
      
      if (res.ok) {
        setNewUrl('')
        fetchWebsites()
      } else {
        alert('Gagal menambahkan website (URL mungkin sudah ada atau token tidak valid).')
      }
    } catch (err) {
      alert('Koneksi ke server bermasalah.')
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    setToken(null)
  }

  useEffect(() => {
    fetchWebsites()
    // Polling otomatis setiap 15 detik (meniru worker backend)
    const interval = setInterval(() => triggerCheck(), 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto p-4 max-w-5xl space-y-8">
      {/* Navbar Premium */}
      <nav className="flex items-center justify-between py-6 mb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">GoTracker</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('portal')} className="text-muted-foreground hover:text-foreground">
            🏠 App Portal
          </Button>
          <span className="text-sm font-medium text-muted-foreground">👋 Welcome, {username}</span>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-primary/20 hover:bg-primary/10">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      {/* Main Content Layout */}
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        
        {/* Sidebar Kiri */}
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Tambah Target</CardTitle>
              <CardDescription>Masukkan URL untuk dipantau secara otomatis oleh Goroutines.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddWebsite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">URL Website</Label>
                  <Input 
                    id="url" 
                    type="url" 
                    placeholder="https://example.com" 
                    value={newUrl} 
                    onChange={e => setNewUrl(e.target.value)} 
                    required 
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Tambahkan
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-transparent shadow-none">
            <CardContent className="p-4 text-sm text-muted-foreground text-center">
              Aplikasi ini ditenagai oleh <strong>Go Microservices</strong>, <strong>PostgreSQL</strong>, dan di-orkestrasi menggunakan <strong>Docker Compose</strong>.
            </CardContent>
          </Card>
        </div>

        {/* Tabel Kanan */}
        <div>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="space-y-1">
                <CardTitle className="text-xl">Daftar Pantauan</CardTitle>
                <CardDescription>Status real-time dari website Anda.</CardDescription>
              </div>
              <Button onClick={triggerCheck} disabled={loading} variant="secondary" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin text-primary' : ''}`} />
                Segarkan Data
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Target URL</TableHead>
                      <TableHead className="text-right">Indikator Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {websites.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                          Belum ada website yang dipantau.
                        </TableCell>
                      </TableRow>
                    ) : (
                      websites.map(web => (
                        <TableRow key={web.id}>
                          <TableCell className="font-medium text-muted-foreground">#{web.id}</TableCell>
                          <TableCell className="font-medium">{web.url}</TableCell>
                          <TableCell className="text-right">
                            {!statuses[web.url] ? (
                              <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                                ⏳ Menunggu...
                              </Badge>
                            ) : statuses[web.url] === 'UP' ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-transparent">
                                🟢 ONLINE
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-transparent shadow-none">
                                🔴 OFFLINE
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
