import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const AuthContext = createContext(null)

function traduzErro(msg) {
  if (/Invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.'
  if (/Email not confirmed/i.test(msg)) return 'Confirme seu e-mail antes de entrar (verifique sua caixa de entrada).'
  if (/User already registered/i.test(msg)) return 'Já existe uma conta com esse e-mail — tente entrar.'
  if (/Password should be at least/i.test(msg)) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (/for security purposes.*only request this after/i.test(msg)) return 'Muitas tentativas seguidas — aguarde um momento e tente de novo.'
  if (/Failed to fetch|NetworkError|network request failed/i.test(msg)) return 'Não foi possível conectar — verifique sua internet e tente de novo.'
  return 'Não foi possível completar a ação — tente de novo.'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: traduzErro(error.message) }
    setUser(data.user)
    return { error: null }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
