import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export default function DataTable({ columns, rows, onUpdate, onRemove, onEdit, emptyMessage, rowClassName }) {
  const [error, setError] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(null)
  // Bumped per row+campo quando uma edição inline falha, só pra trocar a `key` do Input/Select
  // daquela célula e forçar o React a remontar com o defaultValue real (desfazendo visualmente
  // o valor que o usuário digitou e que nunca foi salvo — sem isso o input não controlado
  // continuava mostrando o texto editado como se tivesse salvo, mesmo com o update falhando).
  const [cellVersions, setCellVersions] = useState({})

  async function handleUpdate(id, patch) {
    const { error: err } = await onUpdate(id, patch)
    if (err) {
      setError('Não consegui salvar a alteração — verifique sua conexão e tente de novo.')
      setCellVersions(prev => {
        const next = { ...prev }
        for (const field of Object.keys(patch)) {
          const k = `${id}:${field}`
          next[k] = (next[k] || 0) + 1
        }
        return next
      })
    } else {
      setError(null)
    }
  }

  async function handleRemove(id) {
    const { error: err } = await onRemove(id)
    setError(err ? 'Não consegui excluir — verifique sua conexão e tente de novo.' : null)
    setConfirmRemove(null)
  }

  if (rows.length === 0) {
    return <p className="py-8 text-center text-xs text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <>
      {error && (
        <div className="mb-3 rounded-lg bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive">
          {error}
        </div>
      )}
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              {columns.map(col => (
                <TableHead key={col.key} className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence initial={false}>
              {rows.map(row => (
                <motion.tr
                  key={row.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn('border-b border-border/60 last:border-0', rowClassName?.(row))}
                >
                  {columns.map(col => (
                    <TableCell key={col.key} className="py-2">
                      {col.render
                        ? col.render(row, patch => handleUpdate(row.id, patch), cellVersions[`${row.id}:${col.key}`] || 0)
                        : row[col.key]}
                    </TableCell>
                  ))}
                  <TableCell className="py-2 text-right">
                    <div className="flex justify-end gap-1">
                      {onEdit && (
                        <Button
                          variant="ghost" size="icon" aria-label="Editar"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => onEdit(row)}
                        >
                          <Pencil size={14} />
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="icon" aria-label="Excluir"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmRemove(row)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2.5 md:hidden">
        <AnimatePresence initial={false}>
          {rows.map(row => (
            <motion.div
              key={row.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn('rounded-lg border border-border/60 bg-white/[0.02] p-3', rowClassName?.(row))}
            >
              <div className="space-y-2">
                {columns.map(col => (
                  <div key={col.key} className="flex items-center justify-between gap-3">
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">{col.label}</span>
                    <div className="min-w-0 flex-1 text-right">
                      {col.render
                        ? col.render(row, patch => handleUpdate(row.id, patch), cellVersions[`${row.id}:${col.key}`] || 0)
                        : row[col.key]}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 flex justify-end gap-1 border-t border-border/60 pt-2.5">
                {onEdit && (
                  <Button
                    variant="ghost" size="icon" aria-label="Editar"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => onEdit(row)}
                  >
                    <Pencil size={15} />
                  </Button>
                )}
                <Button
                  variant="ghost" size="icon" aria-label="Excluir"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmRemove(row)}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Dialog open={!!confirmRemove} onOpenChange={(open) => { if (!open) setConfirmRemove(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir item?</DialogTitle>
            <DialogDescription>Essa ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleRemove(confirmRemove.id)}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function textCell(key, className = '') {
  return (row, update, version = 0) => (
    <Input
      key={row.id + key + ':' + version}
      defaultValue={row[key] ?? ''}
      onBlur={e => { if (e.target.value !== row[key]) update({ [key]: e.target.value }) }}
      className={`h-8 border-transparent bg-transparent text-xs hover:border-border focus-visible:border-primary ${className}`}
    />
  )
}

export function numberCell(key, { step = 1 } = {}) {
  return (row, update, version = 0) => (
    <Input
      key={row.id + key + ':' + version}
      type="number" step={step} min="0"
      defaultValue={row[key] ?? 0}
      onBlur={e => {
        const v = parseFloat(e.target.value) || 0
        if (v !== row[key]) update({ [key]: v })
      }}
      className="h-8 w-24 border-transparent bg-transparent text-xs hover:border-border focus-visible:border-primary"
    />
  )
}

export function dateCell(key) {
  return (row, update, version = 0) => (
    <Input
      key={row.id + key + ':' + version}
      type="date"
      defaultValue={row[key] ?? ''}
      onBlur={e => { if (e.target.value !== row[key]) update({ [key]: e.target.value }) }}
      className="h-8 border-transparent bg-transparent text-xs hover:border-border focus-visible:border-primary"
    />
  )
}

export function selectCell(key, options) {
  return (row, update, version = 0) => (
    <Select key={row.id + key + ':' + version} defaultValue={row[key]} onValueChange={v => update({ [key]: v })}>
      <SelectTrigger className="h-8 border-transparent bg-transparent text-xs hover:border-border">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
