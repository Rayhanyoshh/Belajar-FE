import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const API_URL_SSO = import.meta.env.VITE_API_URL_SSO || 'http://localhost:8081'

export default function Auth({ setToken }: { setToken: (token: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')

  const handleSubmit = async (e: React.FormEvent, mode: 'login' | 'register') => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL_SSO}/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Terjadi kesalahan')
        return
      }

      if (mode === 'login') {
        localStorage.setItem('jwt_token', data.token)
        const payload = JSON.parse(atob(data.token.split('.')[1]))
        localStorage.setItem('username', payload.username)
        setToken(data.token) // Memicu re-render ke halaman Dashboard
      } else {
        setSuccess('Registrasi berhasil! Silakan login.')
        setActiveTab('login')
        setPassword('')
      }
    } catch (err) {
      setError('Gagal terhubung ke Server SSO')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/20">
      <Card className="w-full max-w-md shadow-2xl border-primary/10">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold tracking-tight">🔐 GoTracker</CardTitle>
          <CardDescription>Sistem Pemantauan Terpadu</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={(e) => handleSubmit(e, 'login')} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-user">Username</Label>
                  <Input id="login-user" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-pass">Password</Label>
                  <Input id="login-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                {success && <p className="text-sm text-emerald-500 font-medium">{success}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={(e) => handleSubmit(e, 'register')} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-user">Username Baru</Label>
                  <Input id="reg-user" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-pass">Password</Label>
                  <Input id="reg-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Membuat Akun...' : 'Buat Akun Baru'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
