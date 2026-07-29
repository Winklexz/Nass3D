import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e?.preventDefault()
    if (!email || !password) { setMsg('Preencha e-mail e senha.'); setMsgType('err'); return }
    setLoading(true); setMsg('Entrando...'); setMsgType('')
    const { error } = await login(email, password)
    setLoading(false)
    if (error) { setMsg(error); setMsgType('err'); return }
    setMsg(''); setMsgType('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="glass-panel w-full max-w-sm p-2">
          <CardContent className="pt-6">
            <h1 className="sr-only">Nass3D — Gestão de Impressão 3D</h1>
            <div className="flex items-center justify-center mb-6">
              <img src="/logo-nass3d.webp" alt="Nass3D" className="h-20 w-auto" />
            </div>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" autoComplete="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="voce@email.com"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('password')?.focus() } }} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" autoComplete="current-password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              {msg && (
                <p role="status" className={
                  msgType === 'err' ? 'text-xs text-destructive' :
                  msgType === 'ok' ? 'text-xs text-success' : 'text-xs text-muted-foreground'
                }>{msg}</p>
              )}
              <div className="pt-1">
                <Button type="submit" className="w-full" disabled={loading}>Entrar</Button>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">
                Não tem conta? Peça um convite para quem administra o Nass3D.
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
