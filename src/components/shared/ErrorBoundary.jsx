import { Component } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Erro não tratado na interface:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <Card className="glass-panel w-full max-w-sm p-2">
          <CardContent className="pt-6 text-center">
            <p className="mb-1.5 font-display text-sm font-bold">Algo deu errado</p>
            <p className="mb-5 text-xs text-muted-foreground">
              Ocorreu um erro inesperado. Recarregar a página costuma resolver.
            </p>
            <Button className="w-full" onClick={() => window.location.reload()}>Recarregar página</Button>
          </CardContent>
        </Card>
      </div>
    )
  }
}
