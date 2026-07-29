import { lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Login from '@/pages/Login'
import AppLayout from '@/components/layout/AppLayout'

// Rotas autenticadas carregadas sob demanda: quem só vê a tela de login
// (sessão expirada, primeiro acesso) não baixa o código das 7 páginas do
// app inteiro de cara — cada uma vira um chunk separado, buscado só na
// primeira navegação até ela.
const Painel = lazy(() => import('@/pages/Painel'))
const Calculadora = lazy(() => import('@/pages/Calculadora'))
const Materiais = lazy(() => import('@/pages/Materiais'))
const Produtos = lazy(() => import('@/pages/Produtos'))
const Pedidos = lazy(() => import('@/pages/Pedidos'))
const Vendas = lazy(() => import('@/pages/Vendas'))
const Relatorio = lazy(() => import('@/pages/Relatorio'))

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Painel />} />
        <Route path="calculadora" element={<Calculadora />} />
        <Route path="materiais" element={<Materiais />} />
        <Route path="produtos" element={<Produtos />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="vendas" element={<Vendas />} />
        <Route path="relatorio" element={<Relatorio />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
