import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import DataTable, { textCell, numberCell } from '@/components/shared/DataTable'
import { useCollection } from '@/hooks/useCollection'
import { resolveColorInput, buildFilamentName, fmtNum } from '@/lib/format'

export default function Materiais() {
  const { data: materials, add, update, remove } = useCollection('materials')
  const [corPicker, setCorPicker] = useState('#ff2438')
  const [corTexto, setCorTexto] = useState('')
  const [complemento, setComplemento] = useState('')
  const [preco, setPreco] = useState('140')
  const [estoque, setEstoque] = useState('1000')

  function handleCorTextoChange(v) {
    setCorTexto(v)
    const hex = resolveColorInput(v)
    if (hex) setCorPicker(hex)
  }

  async function handleAdd() {
    if (!corTexto.trim()) return
    await add({
      nome: buildFilamentName(corTexto, complemento),
      cor: corPicker,
      preco: parseFloat(preco) || 0,
      estoque: parseFloat(estoque) || 0,
    })
    setCorTexto(''); setComplemento(''); setEstoque('1000')
  }

  const columns = [
    {
      key: 'cor', label: 'Cor',
      render: (row) => (
        <input
          type="color" defaultValue={row.cor}
          onBlur={e => e.target.value !== row.cor && update(row.id, { cor: e.target.value })}
          className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent p-0.5"
        />
      ),
    },
    { key: 'nome', label: 'Nome', render: textCell('nome') },
    { key: 'preco', label: 'Preço/kg', render: numberCell('preco') },
    {
      key: 'estoque', label: 'Estoque (g)',
      render: (row, upd) => {
        const low = (row.estoque || 0) < 100
        return (
          <Input
            type="number" step="10" min="0" defaultValue={row.estoque ?? 0}
            onBlur={e => { const v = parseFloat(e.target.value) || 0; if (v !== row.estoque) upd({ estoque: v }) }}
            className={`h-8 w-24 border-transparent bg-transparent text-xs hover:border-border focus-visible:border-primary ${low ? 'text-destructive font-semibold' : ''}`}
          />
        )
      },
    },
  ]

  return (
    <div>
      <p className="mb-5 max-w-xl text-sm text-muted-foreground">
        Escreva a cor (nome ou hex) e o filamento já muda na hora. O nome é gerado sozinho como
        "Filamento &lt;Cor&gt;" — use o complemento pra detalhar (ex: roxo + lavanda).
      </p>

      <Card className="glass-panel mb-4 p-5">
        <CardContent className="grid grid-cols-1 gap-3 p-0 md:grid-cols-5 md:items-end">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Cor</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={corPicker} onChange={e => setCorPicker(e.target.value)}
                className="h-9 w-10 cursor-pointer rounded border border-border bg-transparent p-1" />
              <Input value={corTexto} onChange={e => handleCorTextoChange(e.target.value)} placeholder="vermelho, #ff2438..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Complemento</Label>
            <Input value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="lavanda, água..." />
          </div>
          <div className="space-y-1.5">
            <Label>Preço/kg (R$)</Label>
            <Input type="number" step="1" min="0" value={preco} onChange={e => setPreco(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Estoque (g)</Label>
            <Input type="number" step="10" min="0" value={estoque} onChange={e => setEstoque(e.target.value)} />
          </div>
          <Button onClick={handleAdd} className="md:col-span-5">Adicionar</Button>
        </CardContent>
        <p className="mt-3 text-xs text-muted-foreground">
          Nome: <span className="font-mono font-semibold text-primary">{buildFilamentName(corTexto, complemento)}</span>
        </p>
      </Card>

      <Card className="glass-panel p-5">
        <CardContent className="p-0">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-2.5">
            <span className="font-ui text-sm font-bold uppercase tracking-wide">Meus materiais</span>
            <span className="font-mono text-xs text-muted-foreground">{materials.length}</span>
          </div>
          <DataTable
            columns={columns}
            rows={materials}
            onUpdate={update}
            onRemove={remove}
            emptyMessage="Nenhum material cadastrado ainda."
          />
        </CardContent>
      </Card>
    </div>
  )
}
