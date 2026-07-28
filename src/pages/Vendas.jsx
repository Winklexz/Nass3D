import { useState } from 'react'
import { Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import DataTable, { textCell, numberCell, dateCell } from '@/components/shared/DataTable'
import { useCollection } from '@/hooks/useCollection'
import { fmtBRL, todayStr } from '@/lib/format'
import { exportCsv, fmtCsvNumber } from '@/lib/csv'

const VENDAS_CSV_COLUMNS = [
  { key: 'data', label: 'Data' },
  { key: 'produto', label: 'Produto' },
  { key: 'comprador', label: 'Comprador' },
  { key: 'contato', label: 'Contato' },
  { key: 'valor', label: 'Valor (R$)', format: (row) => fmtCsvNumber(row.valor) },
]

export default function Vendas() {
  const { data: sales, add, update, remove } = useCollection('sales')
  const { data: orders, update: updateOrder } = useCollection('orders')
  const { data: products } = useCollection('products')

  const [pedidoId, setPedidoId] = useState('')
  const [data, setData] = useState('')
  const [produto, setProduto] = useState('')
  const [comprador, setComprador] = useState('')
  const [contato, setContato] = useState('')
  const [valor, setValor] = useState('0')
  const [submitting, setSubmitting] = useState(false)

  const pedidosAbertos = orders.filter(o => o.status !== 'Entregue')

  function handlePedidoChange(id) {
    setPedidoId(id)
    const o = orders.find(x => x.id === id)
    if (o) {
      setProduto(o.item || '')
      setComprador(o.cliente || '')
      setValor(String(o.valor || 0))
    }
  }

  async function handleAdd() {
    if (submitting) return
    if (!produto.trim() && !comprador.trim()) return
    setSubmitting(true)
    try {
      await add({
        data, produto: produto.trim(), comprador: comprador.trim(), contato: contato.trim(),
        valor: parseFloat(valor) || 0, pedidoId: pedidoId || null,
      })
      if (pedidoId) await updateOrder(pedidoId, { status: 'Entregue' })
      setPedidoId(''); setData(''); setProduto(''); setComprador(''); setContato(''); setValor('0')
    } finally {
      setSubmitting(false)
    }
  }

  const total = sales.reduce((sum, v) => sum + (v.valor || 0), 0)

  const columns = [
    { key: 'data', label: 'Data', render: dateCell('data') },
    { key: 'produto', label: 'Produto', render: textCell('produto') },
    { key: 'comprador', label: 'Comprador', render: textCell('comprador') },
    { key: 'contato', label: 'Contato', render: textCell('contato') },
    { key: 'valor', label: 'Valor', render: numberCell('valor', { step: 0.5 }) },
  ]

  return (
    <div>
      <p className="mb-5 max-w-xl text-sm text-muted-foreground">
        Registre suas vendas — produto, dados do comprador e valor.
      </p>

      <Card className="glass-panel mb-1 p-5">
        <CardContent className="grid grid-cols-1 gap-3 p-0 md:grid-cols-3 md:items-end lg:grid-cols-6">
          <div className="space-y-1.5 lg:col-span-2">
            <Label>Pedido relacionado</Label>
            <Select value={pedidoId} onValueChange={handlePedidoChange}>
              <SelectTrigger><SelectValue placeholder="Nenhum — venda avulsa" /></SelectTrigger>
              <SelectContent>
                {pedidosAbertos.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.cliente || 'Sem nome'} — {o.item || ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Data</Label>
            <Input type="date" value={data} onChange={e => setData(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Produto vendido</Label>
            <Input value={produto} onChange={e => setProduto(e.target.value)} list="produtos-datalist" placeholder="Escolha ou digite" />
            <datalist id="produtos-datalist">
              {products.map(p => <option key={p.id} value={p.nome} />)}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label>Comprador</Label>
            <Input value={comprador} onChange={e => setComprador(e.target.value)} placeholder="Nome do comprador" />
          </div>
          <div className="space-y-1.5">
            <Label>Contato</Label>
            <Input value={contato} onChange={e => setContato(e.target.value)} placeholder="WhatsApp, Instagram..." />
          </div>
          <div className="space-y-1.5">
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.5" min="0" value={valor} onChange={e => setValor(e.target.value)} />
          </div>
          <Button onClick={handleAdd} disabled={submitting} className="lg:col-span-6">Registrar</Button>
        </CardContent>
        <p className="mt-3 text-xs text-muted-foreground">
          Ligar a um pedido preenche produto, comprador e valor automaticamente, e marca o pedido como
          "Entregue" ao registrar a venda.
        </p>
      </Card>

      <Card className="glass-panel mt-4 p-5">
        <CardContent className="p-0">
          <div className="mb-3 flex items-center justify-between border-b border-border pb-2.5">
            <span className="font-ui text-sm font-bold uppercase tracking-wide">Vendas</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground">{sales.length}</span>
              {sales.length > 0 && (
                <Button
                  variant="ghost" size="sm"
                  className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => exportCsv(`vendas-${todayStr()}.csv`, sales, VENDAS_CSV_COLUMNS)}
                >
                  <Download size={13} /> Exportar CSV
                </Button>
              )}
            </div>
          </div>
          <div className="mb-3 rounded-lg border border-border bg-white/[0.03] px-3 py-2.5 font-mono text-sm text-success">
            Total vendido: {fmtBRL(total)}
          </div>
          <DataTable
            columns={columns}
            rows={sales}
            onUpdate={update}
            onRemove={remove}
            emptyMessage="Nenhuma venda registrada ainda."
          />
        </CardContent>
      </Card>
    </div>
  )
}
