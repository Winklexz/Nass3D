import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import DataTable, { textCell, numberCell, dateCell, selectCell } from '@/components/shared/DataTable'
import { useCollection } from '@/hooks/useCollection'
import { waLink, pedidoRowFlag } from '@/lib/format'

const STATUS_OPTIONS = ['Orçamento', 'Pendente', 'Em produção', 'Pronto', 'Entregue', 'Perdido']

export default function Pedidos() {
  const { data: orders, add, update, remove } = useCollection('orders')
  const [cliente, setCliente] = useState('')
  const [telefone, setTelefone] = useState('')
  const [item, setItem] = useState('')
  const [prazo, setPrazo] = useState('')
  const [status, setStatus] = useState('Pendente')
  const [valor, setValor] = useState('0')

  async function handleAdd() {
    if (!cliente.trim() && !item.trim()) return
    await add({
      cliente: cliente.trim(), telefone: telefone.trim(), item: item.trim(),
      prazo, status, valor: parseFloat(valor) || 0, criadoEm: new Date().toISOString(),
    })
    setCliente(''); setTelefone(''); setItem(''); setPrazo(''); setStatus('Pendente'); setValor('0')
  }

  const columns = [
    { key: 'cliente', label: 'Cliente', render: textCell('cliente') },
    {
      key: 'telefone', label: 'Telefone',
      render: (row, upd) => (
        <div className="flex items-center gap-1.5">
          {textCell('telefone', 'flex-1')(row, upd)}
          {row.telefone && (
            <a href={waLink(row.telefone)} target="_blank" rel="noreferrer"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-success/15 text-success transition-colors hover:bg-success hover:text-white">
              <MessageCircle size={13} />
            </a>
          )}
        </div>
      ),
    },
    { key: 'item', label: 'Item', render: textCell('item') },
    { key: 'prazo', label: 'Prazo', render: dateCell('prazo') },
    { key: 'status', label: 'Status', render: selectCell('status', STATUS_OPTIONS) },
    { key: 'valor', label: 'Valor', render: numberCell('valor', { step: 0.5 }) },
  ]

  return (
    <div>
      <p className="mb-5 max-w-xl text-sm text-muted-foreground">
        Acompanhe os pedidos em produção, do cliente até a entrega.
      </p>

      <Card className="glass-panel mb-4 p-5">
        <CardContent className="grid grid-cols-1 gap-3 p-0 md:grid-cols-3 md:items-end lg:grid-cols-6">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nome do cliente" />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="11987654321" />
          </div>
          <div className="space-y-1.5">
            <Label>Item</Label>
            <Input value={item} onChange={e => setItem(e.target.value)} placeholder="O que vai ser impresso" />
          </div>
          <div className="space-y-1.5">
            <Label>Prazo</Label>
            <Input type="date" value={prazo} onChange={e => setPrazo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.5" min="0" value={valor} onChange={e => setValor(e.target.value)} />
          </div>
          <Button onClick={handleAdd} className="lg:col-span-6">Adicionar</Button>
        </CardContent>
      </Card>

      <Card className="glass-panel p-5">
        <CardContent className="p-0">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-2.5">
            <span className="font-ui text-sm font-bold uppercase tracking-wide">Pedidos</span>
            <span className="font-mono text-xs text-muted-foreground">{orders.length}</span>
          </div>
          <DataTable
            columns={columns}
            rows={orders.map(o => ({ ...o, _flag: pedidoRowFlag(o) }))}
            onUpdate={update}
            onRemove={remove}
            emptyMessage="Nenhum pedido em aberto."
          />
        </CardContent>
      </Card>
    </div>
  )
}
