import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, LogOut } from "lucide-react"
import { ViewState } from '../App'

export default function DummyHRIS({ setToken, setCurrentView }: { setToken: (t: string|null) => void, setCurrentView: (v: ViewState) => void }) {
  const username = localStorage.getItem('username') || 'User'

  const handleLogout = () => {
    localStorage.clear()
    setToken(null)
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl space-y-8 min-h-[90vh]">
      {/* Navbar */}
      <nav className="flex items-center justify-between py-6 mb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="bg-amber-600 p-2 rounded-lg">
            <Users className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">HRIS System</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('portal')}>
            🏠 App Portal
          </Button>
          <span className="text-sm font-medium text-muted-foreground">👋 Welcome, {username}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      {/* Content */}
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md text-center border-amber-600/20 shadow-xl bg-muted/10">
          <CardHeader>
            <CardTitle className="text-3xl text-amber-500 mb-2">Simulasi Multi-App</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Ini adalah halaman *dummy* untuk membuktikan bahwa Token SSO Anda (satu identitas) berfungsi untuk masuk ke aplikasi yang berbeda secara mulus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-8">
              Saat ini Anda login sebagai <strong className="text-foreground">{username}</strong>. Semua data di aplikasi ini terisolasi dari GoTracker, namun autentikasi tetap diatur oleh satu gerbang utama (SSO).
            </p>
            <Button onClick={() => setCurrentView('portal')} variant="secondary" className="w-full">
              Kembali ke Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
