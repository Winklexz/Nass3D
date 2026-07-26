import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Login from '@/pages/Login'
import Painel from '@/pages/Painel'
import Calculadora from '@/pages/Calculadora'
import Materiais from '@/pages/Materiais'
import Produtos from '@/pages/Produtos'
import Pedidos from '@/pages/Pedidos'
import Vendas from '@/pages/Vendas'
import Relatorio from '@/pages/Relatorio'
import AppLayout from '@/components/layout/AppLayout'

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
