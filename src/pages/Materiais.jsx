import { useState } from 'react'
import { Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import DataTable from '@/components/shared/DataTable'
import { useCollection } from '@/hooks/useCollection'
import { resolveColorInput, buildFilamentName, fmtNum, todayStr } from '@/lib/format'
import { exportCsv, fmtCsvNumber } from '@/lib/csv'

const MATERIALS_CSV_COLUMNS = [
  { key: 'nome', label: 'Nome' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'cor', label: 'Cor' },
  { key: 'preco', label: 'Preço/kg (R$)', format: (row) => fmtCsvNumber(row.preco) },
  { key: 'estoque', label: 'Estoque (g)', format: (row) => fmtCsvNumber(row.estoque) },
]

const TIPOS = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'Nylon', 'Outro']

export default function Materiais() {
  const { data: materials, error: loadError, add, update, remove } = useCollection('materials')
  const [corPicker, setCorPicker] = useState('#ff2438')
  const [corTexto, setCorTexto] = useState('')
  const [complemento, setComplemento] = useState('')
  const [tipo, setTipo] = useState('PLA')
  const [tipoOutro, setTipoOutro] = useState('')
  const [preco, setPreco] = useState('140')
  const [estoque, setEstoque] = useState('1000')

  const [editing, setEditing] = useState(null)
  const [addStatus, setAddStatus] = useState(null)

  function handleCorTextoChange(v) {
    setCorTexto(v)
    const hex = resolveColorInput(v)
    if (hex) setCorPicker(hex)
  }

  async function handleAdd() {
    if (!corTexto.trim()) return
    const { error } = await add({
      nome: buildFilamentName(corTexto, complemento),
      cor: corPicker,
      tipo: tipo === 'Outro' ? (tipoOutro.trim() || 'Outro') : tipo,
      preco: parseFloat(preco) || 0,
      estoque: parseFloat(estoque) || 0,
    })
    if (error) {
      setAddStatus({ type: 'err', text: 'Não consegui salvar o material — tente de novo.' })
      return
    }
    setAddStatus(null)
    setCorTexto(''); setComplemento(''); setEstoque('1000'); setTipo('PLA'); setTipoOutro('')
  }

  const columns = [
    {
      key: 'cor', label: 'Cor',
      render: (row) => (
        <span className="inline-block h-5 w-7 rounded border border-border" style={{ background: row.cor }} />
      ),
    },
    { key: 'nome', label: 'Nome', render: (row) => <span className="text-xs">{row.nome}</span> },
    { key: 'tipo', label: 'Tipo', render: (row) => <span className="text-xs text-muted-foreground">{row.tipo || 'PLA'}</span> },
    { key: 'preco', label: 'Preço/kg', render: (row) => <span className="font-mono text-xs">R$ {fmtNum(row.preco || 0, 2)}</span> },
    {
      key: 'estoque', label: 'Estoque (g)',
      render: (row) => {
        const low = (row.estoque || 0) < 100
        return <span className={`font-mono text-xs ${low ? 'font-semibold text-destructive' : ''}`}>{fmtNum(row.estoque || 0, 0)}</span>
      },
    },
  ]

  return (
    <div>
      <p className="mb-5 max-w-xl text-sm text-muted-foreground">
        Escreva a cor (nome ou hex) e o filamento já muda na hora. O nome é gerado sozinho como
        "Filamento &lt;Cor&gt;" — use o complemento pra detalhar (ex: roxo + lavanda).
      </p>

      {loadError && (
        <div aria-live="polite" className="mb-5 rounded-lg bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive">
          Não consegui carregar seus dados — verifique sua conexão e recarregue a página.
        </div>
      )}

      <Card className="glass-panel mb-4 p-5">
        <CardContent className="grid grid-cols-1 gap-3 p-0 md:grid-cols-6 md:items-end">
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
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {tipo === 'Outro' && (
              <Input className="mt-1.5" value={tipoOutro} onChange={e => setTipoOutro(e.target.value)} placeholder="Qual tipo?" />
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Preço/kg (R$)</Label>
            <Input type="number" step="1" min="0" value={preco} onChange={e => setPreco(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Estoque (g)</Label>
            <Input type="number" step="10" min="0" value={estoque} onChange={e => setEstoque(e.target.value)} />
          </div>
          <Button onClick={handleAdd} className="md:col-span-6">Adicionar</Button>
        </CardContent>
        <p className="mt-3 text-xs text-muted-foreground">
          Nome: <span className="font-mono font-semibold text-primary">{buildFilamentName(corTexto, complemento)}</span>
        </p>
        {addStatus && (
          <div className={`mt-2.5 rounded-lg px-3 py-2.5 text-xs leading-relaxed ${addStatus.type === 'ok' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
            {addStatus.text}
          </div>
        )}
      </Card>

      <Card className="glass-panel p-5">
        <CardContent className="p-0">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-2.5">
            <span className="font-ui text-sm font-bold uppercase tracking-wide">Meus materiais</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground">{materials.length}</span>
              {materials.length > 0 && (
                <Button
                  variant="ghost" size="sm"
                  className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => exportCsv(`materiais-${todayStr()}.csv`, materials, MATERIALS_CSV_COLUMNS)}
                >
                  <Download size={13} /> Exportar CSV
                </Button>
              )}
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={materials}
            onUpdate={update}
            onRemove={remove}
            onEdit={setEditing}
            emptyMessage="Nenhum material cadastrado ainda."
          />
        </CardContent>
      </Card>

      <EditMaterialDialog
        material={editing}
        onClose={() => setEditing(null)}
        onSave={update}
      />
    </div>
  )
}

function EditMaterialDialog({ material, onClose, onSave }) {
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState('#ff2438')
  const [tipo, setTipo] = useState('PLA')
  const [tipoOutro, setTipoOutro] = useState('')
  const [preco, setPreco] = useState('0')
  const [estoque, setEstoque] = useState('0')
  const [addEstoque, setAddEstoque] = useState('')
  const [openedFor, setOpenedFor] = useState(null)
  const [saveStatus, setSaveStatus] = useState(null)

  if (material && openedFor !== material.id) {
    setOpenedFor(material.id)
    setNome(material.nome || '')
    setCor(material.cor || '#ff2438')
    const knownTipo = TIPOS.includes(material.tipo) ? material.tipo : (material.tipo ? 'Outro' : 'PLA')
    setTipo(knownTipo)
    setTipoOutro(knownTipo === 'Outro' ? (material.tipo || '') : '')
    setPreco(String(material.preco ?? 0))
    setEstoque(String(material.estoque ?? 0))
    setAddEstoque('')
    setSaveStatus(null)
  } else if (!material && openedFor !== null) {
    // Reset the sentinel when the dialog closes so the next open — even for the same
    // material — re-triggers the pre-fill block above instead of showing stale state
    // (e.g. an estoque value from before the previous save).
    setOpenedFor(null)
  }

  async function handleSave() {
    const estoqueBase = parseFloat(estoque) || 0
    const soma = parseFloat(addEstoque) || 0
    const { error } = await onSave(material.id, {
      nome: nome.trim() || material.nome,
      cor,
      tipo: tipo === 'Outro' ? (tipoOutro.trim() || 'Outro') : tipo,
      preco: parseFloat(preco) || 0,
      estoque: estoqueBase + soma,
    })
    if (error) {
      setSaveStatus({ type: 'err', text: 'Não consegui salvar — tente de novo.' })
      return
    }
    onClose()
  }

  return (
    <Dialog open={!!material} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar material</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cor</Label>
              <input type="color" value={cor} onChange={e => setCor(e.target.value)}
                className="h-9 w-full cursor-pointer rounded border border-border bg-transparent p-1" />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              {tipo === 'Outro' && (
                <Input className="mt-1.5" value={tipoOutro} onChange={e => setTipoOutro(e.target.value)} placeholder="Qual tipo?" />
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Preço/kg (R$)</Label>
              <Input type="number" step="1" min="0" value={preco} onChange={e => setPreco(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Estoque atual (g)</Label>
              <Input type="number" step="10" min="0" value={estoque} onChange={e => setEstoque(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5 rounded-lg border border-primary/25 bg-primary/10 p-3">
            <Label>+ Adicionar ao estoque (g)</Label>
            <Input type="number" step="10" min="0" value={addEstoque} onChange={e => setAddEstoque(e.target.value)}
              placeholder="Ex: 1000 (comprou mais um rolo)" />
            <p className="text-[11px] text-muted-foreground">Soma ao estoque atual em vez de substituir — use isso quando comprar mais do mesmo filamento.</p>
          </div>
        </div>
        {saveStatus?.type === 'err' && (
          <p className="text-xs text-destructive">{saveStatus.text}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
