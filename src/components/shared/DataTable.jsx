import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export default function DataTable({ columns, rows, onUpdate, onRemove, onEdit, emptyMessage, rowClassName }) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-xs text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <>
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
                      {col.render ? col.render(row, patch => onUpdate(row.id, patch)) : row[col.key]}
                    </TableCell>
                  ))}
                  <TableCell className="py-2 text-right">
                    <div className="flex justify-end gap-1">
                      {onEdit && (
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => onEdit(row)}
                        >
                          <Pencil size={14} />
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(row.id)}
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
                      {col.render ? col.render(row, patch => onUpdate(row.id, patch)) : row[col.key]}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 flex justify-end gap-1 border-t border-border/60 pt-2.5">
                {onEdit && (
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => onEdit(row)}
                  >
                    <Pencil size={15} />
                  </Button>
                )}
                <Button
                  variant="ghost" size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(row.id)}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}

export function textCell(key, className = '') {
  return (row, update) => (
    <Input
      key={row.id + key}
      defaultValue={row[key] ?? ''}
      onBlur={e => { if (e.target.value !== row[key]) update({ [key]: e.target.value }) }}
      className={`h-8 border-transparent bg-transparent text-xs hover:border-border focus-visible:border-primary ${className}`}
    />
  )
}

export function numberCell(key, { step = 1 } = {}) {
  return (row, update) => (
    <Input
      key={row.id + key}
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
  return (row, update) => (
    <Input
      key={row.id + key}
      type="date"
      defaultValue={row[key] ?? ''}
      onBlur={e => { if (e.target.value !== row[key]) update({ [key]: e.target.value }) }}
      className="h-8 border-transparent bg-transparent text-xs hover:border-border focus-visible:border-primary"
    />
  )
}

export function selectCell(key, options) {
  return (row, update) => (
    <Select defaultValue={row[key]} onValueChange={v => update({ [key]: v })}>
      <SelectTrigger className="h-8 border-transparent bg-transparent text-xs hover:border-border">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
