import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import DataTable, { textCell, numberCell } from '@/components/shared/DataTable'
import { useCollection } from '@/hooks/useCollection'

export default function Produtos() {
  const { data: products, add, update, remove } = useCollection('products')
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('0')
  const [custo, setCusto] = useState('0')
  const [addStatus, setAddStatus] = useState(null)

  async function handleAdd() {
    if (!nome.trim()) return
    const { error } = await add({ nome: nome.trim(), preco: parseFloat(preco) || 0, custo: parseFloat(custo) || 0 })
    if (error) {
      setAddStatus({ type: 'err', text: 'Não consegui salvar o produto — tente de novo.' })
      return
    }
    setAddStatus(null)
    setNome(''); setPreco('0'); setCusto('0')
  }

  const columns = [
    { key: 'nome', label: 'Nome', render: textCell('nome') },
    { key: 'preco', label: 'Preço', render: numberCell('preco', { step: 0.5 }) },
    { key: 'custo', label: 'Custo', render: numberCell('custo', { step: 0.5 }) },
  ]

  return (
    <div>
      <p className="mb-5 max-w-xl text-sm text-muted-foreground">
        Seu catálogo de produtos prontos — cadastre aqui e escolha direto na hora de registrar uma venda.
      </p>

      <Card className="glass-panel mb-4 p-5">
        <CardContent className="grid grid-cols-1 gap-3 p-0 md:grid-cols-4 md:items-end">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Nome do produto</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Suporte de celular" />
          </div>
          <div className="space-y-1.5">
            <Label>Preço de venda (R$)</Label>
            <Input type="number" step="0.5" min="0" value={preco} onChange={e => setPreco(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Custo estimado (R$)</Label>
            <Input type="number" step="0.5" min="0" value={custo} onChange={e => setCusto(e.target.value)} />
          </div>
          <Button onClick={handleAdd} className="md:col-span-4">Adicionar</Button>
        </CardContent>
        {addStatus && (
          <div className={`mt-2.5 rounded-lg px-3 py-2.5 text-xs leading-relaxed ${addStatus.type === 'ok' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
            {addStatus.text}
          </div>
        )}
      </Card>

      <Card className="glass-panel p-5">
        <CardContent className="p-0">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-2.5">
            <span className="font-ui text-sm font-bold uppercase tracking-wide">Meus produtos</span>
            <span className="font-mono text-xs text-muted-foreground">{products.length}</span>
          </div>
          <DataTable
            columns={columns}
            rows={products}
            onUpdate={update}
            onRemove={remove}
            emptyMessage="Nenhum produto cadastrado ainda."
          />
        </CardContent>
      </Card>
    </div>
  )
}
