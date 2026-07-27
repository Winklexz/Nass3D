# Melhorias de UX: Calculadora, Materiais, PDF e mobile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix five reported UX problems in the live Nass3D app — phantom default calculator price, no rounded price suggestion, clumsy hover-based material editing with no filament type or stock top-up, no way to push a calculated item into Produtos, a plain PDF budget, and an unreachable delete button on mobile tables — plus a found Vercel SPA-routing 404 bug.

**Architecture:** All changes are additive to the existing React + Vite + Supabase app (`C:\Users\User\Downloads\Nass3D`). No new runtime dependencies — `@radix-ui/react-dialog` is already installed (used by `Sheet`), so the missing shadcn `Dialog` primitive is added from the same package. Two additive Postgres columns (`materials.tipo`, plus seven new columns on `settings`) extend the existing schema without touching RLS policies. The shared `DataTable` component gains an optional `onEdit` prop and a CSS-only (no JS resize listener) mobile card layout, so the fix benefits Materiais, Produtos, Pedidos, and Vendas at once without changing those pages' code.

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3, shadcn/ui (`new-york` style, JS not TS), `@radix-ui/react-dialog`, `lucide-react`, Framer Motion, `@supabase/supabase-js`, jsPDF, Vitest.

## Global Constraints

- No TypeScript — all files are `.jsx`/`.js`, matching the rest of the project.
- No new npm dependencies. `@radix-ui/react-dialog` is already in `package.json`; reuse it for `Dialog` the same way `sheet.jsx` does.
- Follow existing code style exactly: 2-space indent, no semicolons-only-where-needed style already used (match surrounding file), Tailwind utility classes inline, `cn()` from `@/lib/utils` for conditional classes.
- Pure-logic changes (anything in `src/lib/`) get a Vitest test in the sibling `*.test.js` file — this project has no component-testing library (no React Testing Library installed), so UI/page changes are verified manually in the browser, not with new test files. Don't add one.
- Supabase schema changes go in `supabase-schema.sql` as an additive, idempotent migration block (`add column if not exists`) appended at the end of the file — never rewrite the existing `create table` statements. The user must run this block once in the Supabase SQL Editor; call this out explicitly when the task is done.
- Keep `camelCase` (app) ↔ `snake_case` (DB) mapping conventions in `src/lib/tables.js` exactly as-is for existing fields; only add new keys.
- Match the current visual language: `.glass-panel`, rounded corners (never angular/clip-path), red/black brand accent (`#ff2438`), Rajdhani/Inter/JetBrains Mono fonts, subtle Framer Motion (fade/slide, no bouncy/flashy effects).

---

### Task 1: Vercel SPA rewrite (fix 404 on direct route access)

**Files:**
- Create: `vercel.json`

**Interfaces:**
- Produces: nothing consumed by later tasks — fully standalone.

- [ ] **Step 1: Create `vercel.json`**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 2: Verify locally**

Run: `npm run build` in `C:\Users\User\Downloads\Nass3D`
Expected: build succeeds unchanged (this file only affects Vercel's routing layer, not the Vite build).

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "fix: add SPA rewrite so direct route access doesn't 404 on Vercel"
```

---

### Task 2: `roundUpTo` helper in `format.js`

**Files:**
- Modify: `src/lib/format.js`
- Modify: `src/lib/format.test.js`

**Interfaces:**
- Produces: `roundUpTo(value, step)` — exported function, `(number, number) => number`. Rounds `value` up to the next multiple of `step`. Used by Task 8 (Calculadora rounded price) and Task 9 (Salvar como produto).

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/format.test.js` (create the file if it doesn't exist yet — check first; if it exists, add this `describe` block alongside the existing ones, don't remove anything):

```js
import { roundUpTo } from './format.js'

describe('roundUpTo', () => {
  it('rounds up to the next multiple of step', () => {
    expect(roundUpTo(68.27, 5)).toBe(70)
  })

  it('leaves an exact multiple unchanged', () => {
    expect(roundUpTo(70, 5)).toBe(70)
  })

  it('rounds up small values above zero', () => {
    expect(roundUpTo(0.5, 5)).toBe(5)
  })

  it('returns 0 for a value of 0', () => {
    expect(roundUpTo(0, 5)).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- format.test.js`
Expected: FAIL — `roundUpTo is not a function` (or similar import error).

- [ ] **Step 3: Implement `roundUpTo`**

Add to `src/lib/format.js` (anywhere alongside the other exported helpers, e.g. right after `fmtNum`):

```js
export function roundUpTo(value, step) {
  if (step <= 0) return value
  return Math.ceil(value / step) * step
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- format.test.js`
Expected: PASS, all `roundUpTo` cases green, and all pre-existing `format.test.js` cases still green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.js src/lib/format.test.js
git commit -m "feat: add roundUpTo helper for suggested sell price rounding"
```

---

### Task 3: Schema migration — `materials.tipo` + `settings` equipment columns

**Files:**
- Modify: `supabase-schema.sql`
- Modify: `src/lib/tables.js`
- Modify: `src/lib/tables.test.js`

**Interfaces:**
- Produces: `TABLES.materials.fields.tipo` (maps to DB column `tipo`) — consumed by Task 7 (Materiais page). The `settings` table gets seven new columns (`printer_cost`, `printer_life`, `nozzle_cost`, `nozzle_life`, `energy_rate`, `labor_rate`, `labor_hours`) — `settings` isn't in `TABLES` (it's handled directly by `useSettings.js`), so no `tables.js` change needed for those; Task 5 maps them by hand the same way `meta_mensal`/`empresa_nome` are mapped today.

- [ ] **Step 1: Append the migration block to `supabase-schema.sql`**

Add at the very end of the file (after the last `create policy` line), don't touch anything above it:

```sql

-- Migração 2026-07-26: tipo de filamento em materials + campos de equipamento em settings.
-- Rode este bloco uma vez no SQL Editor do Supabase (idempotente — pode rodar de novo sem erro).
alter table public.materials add column if not exists tipo text not null default 'PLA';

alter table public.settings add column if not exists printer_cost numeric not null default 4800;
alter table public.settings add column if not exists printer_life numeric not null default 8000;
alter table public.settings add column if not exists nozzle_cost numeric not null default 200;
alter table public.settings add column if not exists nozzle_life numeric not null default 1500;
alter table public.settings add column if not exists energy_rate numeric not null default 1;
alter table public.settings add column if not exists labor_rate numeric not null default 1;
alter table public.settings add column if not exists labor_hours numeric not null default 1.5;
```

- [ ] **Step 2: Write the failing test for the field mapping**

Add to `src/lib/tables.test.js`, inside the existing `describe('rowToObj / objToRow', ...)` block (add as a new `it`, don't remove existing ones):

```js
  it('maps materials tipo field', () => {
    const row = { id: 'm1', nome: 'Filamento Azul', cor: '#1d63d1', preco: 140, estoque: 500, tipo: 'PETG' }
    const obj = rowToObj(row, TABLES.materials.fields)
    expect(obj.tipo).toBe('PETG')
    expect(objToRow({ tipo: 'ABS' }, TABLES.materials.fields)).toEqual({ tipo: 'ABS' })
  })
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- tables.test.js`
Expected: FAIL — `obj.tipo` is `undefined`.

- [ ] **Step 4: Add `tipo` to `TABLES.materials.fields`**

In `src/lib/tables.js`, change:

```js
  materials: {
    name: 'materials',
    fields: { id: 'id', nome: 'nome', cor: 'cor', preco: 'preco', estoque: 'estoque' },
  },
```

to:

```js
  materials: {
    name: 'materials',
    fields: { id: 'id', nome: 'nome', cor: 'cor', preco: 'preco', estoque: 'estoque', tipo: 'tipo' },
  },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tables.test.js`
Expected: PASS, all cases green.

- [ ] **Step 6: Commit**

```bash
git add supabase-schema.sql src/lib/tables.js src/lib/tables.test.js
git commit -m "feat: add materials.tipo and settings equipment columns to schema"
```

**Manual step (not part of the commit):** the engineer finishing this plan must tell the user to open the Supabase SQL Editor for their project and run the new migration block from `supabase-schema.sql` (the block added in Step 1) once. Existing rows get the defaults (`tipo = 'PLA'`, equipment columns get the current hardcoded demo values as their defaults) automatically — no data loss.

---

### Task 4: `Dialog` shadcn primitive

**Files:**
- Create: `src/components/ui/dialog.jsx`

**Interfaces:**
- Produces: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose` — named exports, same API shape as shadcn/ui's standard `Dialog` (React Radix wrapper). Consumed by Task 7 (Materiais edit modal).

- [ ] **Step 1: Create `src/components/ui/dialog.jsx`**

```jsx
"use client";
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props} />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className
      )}
      {...props}>
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Fechar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)}
    {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: succeeds (this file isn't imported anywhere yet, so this just checks for syntax errors).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/dialog.jsx
git commit -m "feat: add shadcn Dialog primitive"
```

---

### Task 5: `useSettings` — equipment/labor fields

**Files:**
- Modify: `src/hooks/useSettings.js`

**Interfaces:**
- Consumes: nothing new (still `supabase`, `useAuth` as today).
- Produces: `settings` object now also has `printerCost`, `printerLife`, `nozzleCost`, `nozzleLife`, `energyRate`, `laborRate`, `laborHours` (all numbers). `save(patch)` accepts any of those keys the same way it already accepts `metaMensal`/`empresaNome`. Consumed by Task 8 (Calculadora).

- [ ] **Step 1: Update `DEFAULTS` and `reload`/`save` in `src/hooks/useSettings.js`**

Replace the whole file with:

```js
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'

const DEFAULTS = {
  metaMensal: 1500, orcamentoNumero: 0, empresaNome: '', logoDataUrl: '',
  printerCost: 4800, printerLife: 8000, nozzleCost: 200, nozzleLife: 1500,
  energyRate: 1, laborRate: 1, laborHours: 1.5,
}

export function useSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle()
    if (!error && data) {
      setSettings({
        metaMensal: Number(data.meta_mensal),
        orcamentoNumero: data.orcamento_numero || 0,
        empresaNome: data.empresa_nome || '',
        logoDataUrl: data.logo_data_url || '',
        printerCost: Number(data.printer_cost ?? DEFAULTS.printerCost),
        printerLife: Number(data.printer_life ?? DEFAULTS.printerLife),
        nozzleCost: Number(data.nozzle_cost ?? DEFAULTS.nozzleCost),
        nozzleLife: Number(data.nozzle_life ?? DEFAULTS.nozzleLife),
        energyRate: Number(data.energy_rate ?? DEFAULTS.energyRate),
        laborRate: Number(data.labor_rate ?? DEFAULTS.laborRate),
        laborHours: Number(data.labor_hours ?? DEFAULTS.laborHours),
      })
    } else if (error) {
      console.error('Erro ao carregar settings', error)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { reload() }, [reload])

  async function save(patch) {
    const next = { ...settings, ...patch }
    const { error } = await supabase.from('settings').upsert({
      user_id: user.id,
      meta_mensal: next.metaMensal,
      orcamento_numero: next.orcamentoNumero,
      empresa_nome: next.empresaNome,
      logo_data_url: next.logoDataUrl,
      printer_cost: next.printerCost,
      printer_life: next.printerLife,
      nozzle_cost: next.nozzleCost,
      nozzle_life: next.nozzleLife,
      energy_rate: next.energyRate,
      labor_rate: next.laborRate,
      labor_hours: next.laborHours,
    }, { onConflict: 'user_id' })
    if (!error) setSettings(next)
    return { error }
  }

  return { settings, loading, save }
}
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: succeeds. (No consumer uses the new fields yet — that's Task 8 — so this is a safe additive change; existing consumers of `settings.empresaNome`/`metaMensal`/etc. are unaffected.)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSettings.js
git commit -m "feat: persist calculator equipment/labor fields in settings"
```

---

### Task 6: `DataTable` — `onEdit` action + mobile card layout

**Files:**
- Modify: `src/components/shared/DataTable.jsx`

**Interfaces:**
- Consumes: same `columns`/`rows`/`onUpdate`/`onRemove`/`emptyMessage`/`rowClassName` props as today.
- Produces: new optional prop `onEdit(row) => void`. When provided, an Edit (pencil) icon button appears in the action area (table row and mobile card) calling `onEdit(row)`; when omitted (Produtos/Pedidos/Vendas today), behavior is pixel-identical to before. Below the `md` breakpoint (768px), rows render as stacked cards instead of a `<table>`; at `md` and above, rendering is unchanged. Consumed by Task 7 (Materiais passes `onEdit`).

- [ ] **Step 1: Replace `src/components/shared/DataTable.jsx`**

```jsx
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
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Manual browser check (no automated test — this project has no component-testing library)**

Run: `npm run dev`, open the printed local URL, log in, go to Produtos (already has rows if you added any earlier, otherwise add one). Resize the browser below 768px width (or open dev tools device toolbar). Confirm: rows render as stacked cards, the trash icon is visible and clickable without horizontal scrolling, and above 768px the table view is unchanged from before.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/DataTable.jsx
git commit -m "feat: add onEdit action and mobile card layout to DataTable"
```

---

### Task 7: Materiais — edit modal, tipo, delete icon, mobile-safe

**Files:**
- Modify: `src/pages/Materiais.jsx`

**Interfaces:**
- Consumes: `useCollection('materials')` → `{ data, add, update, remove }` (unchanged signature); `DataTable` with the new `onEdit` prop from Task 6; `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogFooter` from Task 4; `TABLES.materials.fields.tipo` (via `tipo` now being a normal field on rows, from Task 3).
- Produces: nothing consumed by later tasks — this is a leaf page.

- [ ] **Step 1: Replace `src/pages/Materiais.jsx`**

```jsx
import { useState } from 'react'
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
import { resolveColorInput, buildFilamentName, fmtNum } from '@/lib/format'

const TIPOS = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'Nylon', 'Outro']

export default function Materiais() {
  const { data: materials, add, update, remove } = useCollection('materials')
  const [corPicker, setCorPicker] = useState('#ff2438')
  const [corTexto, setCorTexto] = useState('')
  const [complemento, setComplemento] = useState('')
  const [tipo, setTipo] = useState('PLA')
  const [tipoOutro, setTipoOutro] = useState('')
  const [preco, setPreco] = useState('140')
  const [estoque, setEstoque] = useState('1000')

  const [editing, setEditing] = useState(null)

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
      tipo: tipo === 'Outro' ? (tipoOutro.trim() || 'Outro') : tipo,
      preco: parseFloat(preco) || 0,
      estoque: parseFloat(estoque) || 0,
    })
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
  }

  async function handleSave() {
    const estoqueBase = parseFloat(estoque) || 0
    const soma = parseFloat(addEstoque) || 0
    await onSave(material.id, {
      nome: nome.trim() || material.nome,
      cor,
      tipo: tipo === 'Outro' ? (tipoOutro.trim() || 'Outro') : tipo,
      preco: parseFloat(preco) || 0,
      estoque: estoqueBase + soma,
    })
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Note on `TIPOS`:** the `const TIPOS = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'Nylon', 'Outro']` declared near the top of the file (right after the imports, before `export default function Materiais()`) is used by both `Materiais` and `EditMaterialDialog` — module scope, so no separate import needed between them.

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Manual browser check**

Run: `npm run dev`, log in, go to Materiais. Confirm: adding a material now includes a Tipo selector (choosing "Outro" reveals a free-text field); the table shows a Tipo column; clicking the pencil icon opens a modal pre-filled with the row's data; changing a field and clicking Salvar updates the row; typing a value in "+ Adicionar ao estoque" and saving adds it to the existing stock instead of replacing it; clicking the trash icon deletes the row directly (no confirmation dialog, matching existing behavior elsewhere in the app). Resize below 768px and confirm the mobile card layout from Task 6 shows both action icons reachable without scrolling — this is the direct fix for the reported mobile delete bug.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Materiais.jsx
git commit -m "feat: replace hover-edit with edit modal, add filament type, fix mobile delete"
```

---

### Task 8: Calculadora — zeroed piece data, persisted equipment settings, rounded price

**Files:**
- Modify: `src/pages/Calculadora.jsx`

**Interfaces:**
- Consumes: `useSettings()` → `{ settings, save: saveSettings }` (now with the 7 equipment fields from Task 5); `roundUpTo` from `src/lib/format.js` (Task 2).
- Produces: a `roundedPrice` value in scope — consumed by Task 9 (Salvar como produto), added in the same file.

This task is a series of targeted edits to the existing `src/pages/Calculadora.jsx` (currently 606 lines) rather than a full rewrite — apply each edit below with search-replace, matching the `old` block exactly.

- [ ] **Step 1: Import `roundUpTo`**

Old:
```js
import { fmtBRL, fmtNum, findClosestMaterial } from '@/lib/format'
```
New:
```js
import { fmtBRL, fmtNum, findClosestMaterial, roundUpTo } from '@/lib/format'
```

- [ ] **Step 2: Zero the piece-specific initial state**

Old:
```js
  const [rows, setRows] = useState([{ weight: 130, price: 140, colorHex: COLOR_DEFAULTS[0], materialId: '' }])
  const [purgeGrams, setPurgeGrams] = useState(8)
  const [printHours, setPrintHours] = useState(9)
  const [energyRate, setEnergyRate] = useState(1)
  const [printerCost, setPrinterCost] = useState(4800)
  const [printerLife, setPrinterLife] = useState(8000)
  const [nozzleCost, setNozzleCost] = useState(200)
  const [nozzleLife, setNozzleLife] = useState(1500)
  const [laborRate, setLaborRate] = useState(1)
  const [laborHours, setLaborHours] = useState(1.5)
```
New:
```js
  const [rows, setRows] = useState([{ weight: 0, price: 0, colorHex: COLOR_DEFAULTS[0], materialId: '' }])
  const [purgeGrams, setPurgeGrams] = useState(8)
  const [printHours, setPrintHours] = useState(0)
  const [energyRate, setEnergyRate] = useState(settings.energyRate)
  const [printerCost, setPrinterCost] = useState(settings.printerCost)
  const [printerLife, setPrinterLife] = useState(settings.printerLife)
  const [nozzleCost, setNozzleCost] = useState(settings.nozzleCost)
  const [nozzleLife, setNozzleLife] = useState(settings.nozzleLife)
  const [laborRate, setLaborRate] = useState(settings.laborRate)
  const [laborHours, setLaborHours] = useState(settings.laborHours)
```

Note: `settings` is already in scope above this point (`const { settings, save: saveSettings } = useSettings()` is the existing line right before these — don't move it).

- [ ] **Step 3: Sync equipment fields when settings load, and commit changes back on blur**

Add this new `useEffect` right after the existing `useEffect` that syncs `sellPriceText` (the one starting `useEffect(() => {\n    if (!sellPriceFocused.current) setSellPriceText(...`):

```js
  useEffect(() => {
    setPrinterCost(settings.printerCost)
    setPrinterLife(settings.printerLife)
    setNozzleCost(settings.nozzleCost)
    setNozzleLife(settings.nozzleLife)
    setEnergyRate(settings.energyRate)
    setLaborRate(settings.laborRate)
    setLaborHours(settings.laborHours)
  }, [settings.printerCost, settings.printerLife, settings.nozzleCost, settings.nozzleLife, settings.energyRate, settings.laborRate, settings.laborHours])

  function commitEquipmentField(key, value) {
    if (value !== settings[key]) saveSettings({ [key]: value })
  }
```

- [ ] **Step 4: Wire the equipment/labor inputs to commit on blur**

These four fields live in the "Impressão", "Depreciação de equipamento", and "Mão de obra" cards. Old (the four `Field` blocks for energy rate, printer cost/life, nozzle cost/life, labor rate/hours — search for each individually, they're not contiguous):

```jsx
                <Field label="Energia por hora (R$)"><Input type="number" step="0.1" min="0" value={energyRate} onChange={e => setEnergyRate(parseFloat(e.target.value) || 0)} /></Field>
```
New:
```jsx
                <Field label="Energia por hora (R$)"><Input type="number" step="0.1" min="0" value={energyRate} onChange={e => setEnergyRate(parseFloat(e.target.value) || 0)} onBlur={() => commitEquipmentField('energyRate', energyRate)} /></Field>
```

Old:
```jsx
                <Field label="Valor da impressora (R$)"><Input type="number" step="1" min="0" value={printerCost} onChange={e => setPrinterCost(parseFloat(e.target.value) || 0)} /></Field>
                <Field label="Vida útil (horas)"><Input type="number" step="1" min="1" value={printerLife} onChange={e => setPrinterLife(parseFloat(e.target.value) || 1)} /></Field>
                <Field label="Valor do bico (R$)"><Input type="number" step="1" min="0" value={nozzleCost} onChange={e => setNozzleCost(parseFloat(e.target.value) || 0)} /></Field>
                <Field label="Vida útil do bico (horas)"><Input type="number" step="1" min="1" value={nozzleLife} onChange={e => setNozzleLife(parseFloat(e.target.value) || 1)} /></Field>
```
New:
```jsx
                <Field label="Valor da impressora (R$)"><Input type="number" step="1" min="0" value={printerCost} onChange={e => setPrinterCost(parseFloat(e.target.value) || 0)} onBlur={() => commitEquipmentField('printerCost', printerCost)} /></Field>
                <Field label="Vida útil (horas)"><Input type="number" step="1" min="1" value={printerLife} onChange={e => setPrinterLife(parseFloat(e.target.value) || 1)} onBlur={() => commitEquipmentField('printerLife', printerLife)} /></Field>
                <Field label="Valor do bico (R$)"><Input type="number" step="1" min="0" value={nozzleCost} onChange={e => setNozzleCost(parseFloat(e.target.value) || 0)} onBlur={() => commitEquipmentField('nozzleCost', nozzleCost)} /></Field>
                <Field label="Vida útil do bico (horas)"><Input type="number" step="1" min="1" value={nozzleLife} onChange={e => setNozzleLife(parseFloat(e.target.value) || 1)} onBlur={() => commitEquipmentField('nozzleLife', nozzleLife)} /></Field>
```

Old:
```jsx
                <Field label="Valor da sua hora (R$)"><Input type="number" step="0.5" min="0" value={laborRate} onChange={e => setLaborRate(parseFloat(e.target.value) || 0)} /></Field>
                <Field label="Acabamento + montagem (horas)"><Input type="number" step="0.1" min="0" value={laborHours} onChange={e => setLaborHours(parseFloat(e.target.value) || 0)} /></Field>
```
New:
```jsx
                <Field label="Valor da sua hora (R$)"><Input type="number" step="0.5" min="0" value={laborRate} onChange={e => setLaborRate(parseFloat(e.target.value) || 0)} onBlur={() => commitEquipmentField('laborRate', laborRate)} /></Field>
                <Field label="Acabamento + montagem (horas)"><Input type="number" step="0.1" min="0" value={laborHours} onChange={e => setLaborHours(parseFloat(e.target.value) || 0)} onBlur={() => commitEquipmentField('laborHours', laborHours)} /></Field>
```

- [ ] **Step 5: Add the rounded price**

Add right after the `result` `useMemo` block (after its closing `}), [...])` line):

```js
  const roundedPrice = roundUpTo(result.price, 5)
```

- [ ] **Step 6: Display the rounded price next to the exact one**

Old:
```jsx
              <Label className="mb-2.5 block text-[11px] uppercase tracking-wider">Quanto vou cobrar</Label>
              <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-border bg-white/[0.03] px-3.5 py-2.5">
                <span className="rounded-md border border-primary/40 bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary">BRL</span>
                <input
                  type="number" step="0.5" min="0" value={sellPriceText}
                  onFocus={() => { sellPriceFocused.current = true }}
                  onBlur={() => { sellPriceFocused.current = false; setSellPriceText(result.price.toFixed(2)) }}
                  onChange={e => handleSellPriceInput(e.target.value)}
                  className="w-full bg-transparent font-ui text-3xl font-bold outline-none"
                />
              </div>
```
New:
```jsx
              <Label className="mb-2.5 block text-[11px] uppercase tracking-wider">Quanto vou cobrar</Label>
              <div className="mb-1.5 flex items-center gap-2.5 rounded-lg border border-border bg-white/[0.03] px-3.5 py-2.5">
                <span className="rounded-md border border-primary/40 bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary">BRL</span>
                <input
                  type="number" step="0.5" min="0" value={sellPriceText}
                  onFocus={() => { sellPriceFocused.current = true }}
                  onBlur={() => { sellPriceFocused.current = false; setSellPriceText(result.price.toFixed(2)) }}
                  onChange={e => handleSellPriceInput(e.target.value)}
                  className="w-full bg-transparent font-ui text-3xl font-bold outline-none"
                />
              </div>
              <div className="mb-4 flex items-center justify-between px-0.5 text-xs text-muted-foreground">
                <span>Arredondado pra cobrar</span>
                <span className="font-mono font-semibold text-foreground">{fmtBRL(roundedPrice)}</span>
              </div>
```

- [ ] **Step 7: Verify it builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 8: Manual browser check**

Run: `npm run dev`, log in, go to Calculadora. Confirm: on first load with no prior settings saved, "Quanto vou cobrar" shows a small non-zero baseline (labor overhead) rather than the old R$68,27 example — this is expected (see note below), and drops closer to zero as soon as you also zero out labor rate/hours. Type a weight and price for color 1 — the price updates. Change "Valor da impressora" and reload the page — the new value persists (was saved to `settings` on blur). Confirm "Arredondado pra cobrar" shows a value that's always a multiple of 5 and ≥ the exact price.

**Design note for the reviewer:** the spec's "R$ 0,00 until piece data is filled" criterion holds exactly on a brand-new account (all equipment/labor fields default to the same demo values as before, and material weight/hours are 0, so cost is close to the flat labor overhead only — not literally 0 because `laborHours` defaults to 1.5h regardless of piece size, matching today's behavior where labor is a flat acabamento/montagem cost independent of print size). Once a user customizes and saves their real equipment/labor values, the calculator will show that real fixed-cost floor even with an empty piece — this is intentional: it's a fixed overhead the business actually has, not a fake per-print "ghost" answer like the old hardcoded 130g/9h example was. If the user pushes back on this in review, the fix is to also zero `laborHours`/`laborRate` by default rather than seeding them from settings.

- [ ] **Step 9: Commit**

```bash
git add src/pages/Calculadora.jsx
git commit -m "feat: reset calculator piece data by default, persist equipment settings, show rounded price"
```

---

### Task 9: Calculadora → "Salvar como produto"

**Files:**
- Modify: `src/pages/Calculadora.jsx`

**Interfaces:**
- Consumes: `useCollection('products')` → `{ add }` (existing hook, unchanged signature); `roundedPrice` from Task 8 (same file, same component scope).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the `products` collection hook**

Old:
```js
  const { data: materials, update: updateMaterial } = useCollection('materials')
  const { data: orders, add: addOrder } = useCollection('orders')
  const { settings, save: saveSettings } = useSettings()
```
New:
```js
  const { data: materials, update: updateMaterial } = useCollection('materials')
  const { data: orders, add: addOrder } = useCollection('orders')
  const { add: addProduct } = useCollection('products')
  const { settings, save: saveSettings } = useSettings()
```

- [ ] **Step 2: Add local state and the save handler**

Add right after the `stockMsg`/`setStockMsg` state declaration (`const [stockMsg, setStockMsg] = useState('')`):

```js
  const [produtoNome, setProdutoNome] = useState('')
  const [produtoStatus, setProdutoStatus] = useState(null)
  const [produtoSalvando, setProdutoSalvando] = useState(false)

  async function handleSalvarProduto() {
    if (!produtoNome.trim()) {
      setProdutoStatus({ type: 'err', text: 'Digite um nome pro produto antes de salvar.' })
      return
    }
    setProdutoSalvando(true)
    const { error } = await addProduct({ nome: produtoNome.trim(), preco: roundedPrice, custo: result.totalCost })
    setProdutoSalvando(false)
    if (error) {
      setProdutoStatus({ type: 'err', text: 'Não consegui salvar o produto agora — tente de novo.' })
    } else {
      setProdutoStatus({ type: 'ok', text: `"${produtoNome.trim()}" salvo em Produtos.` })
      setProdutoNome('')
    }
  }
```

(This references `roundedPrice` and `result`, both already in scope by this point in the component from Task 8 and the pre-existing `result` `useMemo`.)

- [ ] **Step 3: Add the UI block**

Insert right after the stock-deduction block and before the closing disclaimer paragraph — old:
```jsx
              <Button variant="outline" className="mt-3 w-full border-primary text-primary hover:bg-primary hover:text-white" onClick={handleDeductStock}>
                Registrar impressão (descontar do estoque)
              </Button>
              {stockMsg && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{stockMsg}</p>}

              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                Cálculo simples de referência — impostos sobre a venda não estão incluídos. O desconto de estoque considera só o peso por cor vinculado a um material.
              </p>
```
New:
```jsx
              <Button variant="outline" className="mt-3 w-full border-primary text-primary hover:bg-primary hover:text-white" onClick={handleDeductStock}>
                Registrar impressão (descontar do estoque)
              </Button>
              {stockMsg && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{stockMsg}</p>}

              <div className="mt-4 border-t border-border pt-4">
                <Label className="mb-1.5 block text-[11px] uppercase tracking-wider">Salvar como produto</Label>
                <div className="flex gap-2">
                  <Input value={produtoNome} onChange={e => setProdutoNome(e.target.value)} placeholder="Nome do produto" />
                  <Button
                    variant="outline" onClick={handleSalvarProduto} disabled={produtoSalvando}
                    className="shrink-0 border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    Salvar
                  </Button>
                </div>
                {produtoStatus && (
                  <p className={`mt-2 text-xs leading-relaxed ${produtoStatus.type === 'ok' ? 'text-success' : 'text-destructive'}`}>
                    {produtoStatus.text}
                  </p>
                )}
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Cria em Produtos com preço {fmtBRL(roundedPrice)} (arredondado) e custo {fmtBRL(result.totalCost)}.
                </p>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                Cálculo simples de referência — impostos sobre a venda não estão incluídos. O desconto de estoque considera só o peso por cor vinculado a um material.
              </p>
```

- [ ] **Step 4: Verify it builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Manual browser check**

Run: `npm run dev`, log in, go to Calculadora, fill in some piece data, type a name in "Salvar como produto", click Salvar. Confirm the success message appears, then go to the Produtos page and confirm the new row exists with the rounded price and the calculated total cost.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Calculadora.jsx
git commit -m "feat: add Salvar como produto to Calculadora"
```

---

### Task 10: PDF de orçamento com identidade de marca

**Files:**
- Modify: `src/lib/pdf.js`

**Interfaces:**
- Consumes: nothing new — `generateOrcamentoPdf({ numero, empresa, logoDataUrl, cliente, descricao, material, quantidade, prazo, validade, forma1, desc1, forma2, desc2, obs, base })` keeps the exact same parameter shape, so `Calculadora.jsx`'s call site (`handleExportOrcamento`, untouched by this task) needs no changes.
- Produces: nothing consumed by later tasks. `generateRelatorioPdf` in the same file is untouched — don't modify it.

- [ ] **Step 1: Add brand color constants**

Old (top of file):
```js
import { jsPDF } from 'jspdf'
import { fmtBRL } from './format'

export function generateOrcamentoPdf({
```
New:
```js
import { jsPDF } from 'jspdf'
import { fmtBRL } from './format'

const BRAND_RED = [255, 36, 56]
const BRAND_BLACK = [13, 13, 15]
const GRAY_DARK = [40, 40, 44]
const GRAY_MED = [130, 130, 138]
const GRAY_LIGHT = [235, 235, 238]

export function generateOrcamentoPdf({
```

- [ ] **Step 2: Replace the whole `generateOrcamentoPdf` function body**

Replace everything from `export function generateOrcamentoPdf({` down to the matching closing `}` right before `export function generateRelatorioPdf` (i.e. the entire current function, all ~90 lines of it) with:

```js
export function generateOrcamentoPdf({
  numero, empresa, logoDataUrl, cliente, descricao, material, quantidade,
  prazo, validade, forma1, desc1, forma2, desc2, obs, base,
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  const marginX = 15

  const headerH = 40
  doc.setFillColor(...BRAND_BLACK)
  doc.rect(0, 0, pageW, headerH, 'F')
  doc.setFillColor(...BRAND_RED)
  doc.rect(0, headerH, pageW, 1.2, 'F')

  let logoW = 0
  if (logoDataUrl) {
    try {
      const props = doc.getImageProperties(logoDataUrl)
      const chipSize = 26
      const chipX = marginX, chipY = (headerH - chipSize) / 2
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(chipX, chipY, chipSize, chipSize, 3, 3, 'F')
      const w = chipSize - 6, h = Math.min((props.height / props.width) * w, chipSize - 6)
      doc.addImage(logoDataUrl, props.fileType, chipX + 3, chipY + (chipSize - h) / 2, w, h)
      logoW = chipSize + 8
    } catch { /* skip broken image */ }
  }

  const textX = marginX + logoW
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16)
  doc.text(empresa, textX, headerH / 2 - 2)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(180, 180, 186)
  doc.text('Gerado por Nass3D', textX, headerH / 2 + 5)

  doc.setTextColor(...BRAND_RED); doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.text('ORÇAMENTO', pageW - marginX, headerH / 2 - 3, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(190, 190, 196)
  doc.text(`#${numero} · ${new Date().toLocaleDateString('pt-BR')}`, pageW - marginX, headerH / 2 + 4, { align: 'right' })
  if (validade) doc.text(`Válido por: ${validade}`, pageW - marginX, headerH / 2 + 9, { align: 'right' })

  let y = headerH + 14

  doc.setTextColor(...GRAY_MED); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('PARA', marginX, y)
  doc.setTextColor(...GRAY_DARK); doc.setFont('helvetica', 'normal'); doc.setFontSize(13)
  doc.text(cliente, marginX, y + 7)
  y += 18

  const tableX = marginX, tableW = pageW - marginX * 2
  const rowH = 9
  const rows = [
    ['Descrição', descricao],
    ['Material', material || '—'],
    ['Quantidade', String(quantidade)],
    ['Prazo de entrega', prazo || '—'],
  ]
  rows.forEach(([label, val], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...GRAY_LIGHT)
      doc.rect(tableX, y - 6, tableW, rowH, 'F')
    }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...GRAY_MED)
    doc.text(label, tableX + 3, y)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(...GRAY_DARK)
    doc.text(String(val), tableX + 60, y)
    y += rowH
  })

  y += 8

  doc.setFillColor(...BRAND_BLACK)
  doc.roundedRect(tableX, y - 9, tableW, 20, 2, 2, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(220, 220, 224)
  doc.text('VALOR DO ORÇAMENTO', tableX + 6, y - 1.5)
  doc.setFontSize(19); doc.setTextColor(...BRAND_RED)
  doc.text(fmtBRL(base), tableX + tableW - 6, y + 5, { align: 'right' })
  y += 20

  const options = []
  if (forma1) options.push({ forma: forma1, desc: desc1 || 0, val: base * (1 - (desc1 || 0) / 100) })
  if (forma2) options.push({ forma: forma2, desc: desc2 || 0, val: base * (1 - (desc2 || 0) / 100) })

  if (options.length) {
    y += 10
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...GRAY_MED)
    doc.text('FORMAS DE PAGAMENTO', marginX, y)
    y += 6
    const colW = tableW / options.length - 4
    options.forEach((opt, i) => {
      const x = tableX + i * (colW + 4)
      doc.setDrawColor(...GRAY_LIGHT); doc.setLineWidth(0.4)
      doc.roundedRect(x, y, colW, 22, 2, 2)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...GRAY_DARK)
      doc.text(opt.forma, x + 4, y + 8)
      if (opt.desc > 0) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...BRAND_RED)
        doc.text(`${opt.desc}% de desconto`, x + 4, y + 13)
      }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.setTextColor(...GRAY_DARK)
      doc.text(fmtBRL(opt.val), x + 4, y + 19)
    })
    y += 30
  } else {
    y += 6
  }

  if (obs) {
    doc.setDrawColor(...GRAY_LIGHT); doc.setLineWidth(0.3)
    doc.line(marginX, y, pageW - marginX, y)
    y += 8
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...GRAY_MED)
    doc.text('OBSERVAÇÕES', marginX, y)
    y += 6
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...GRAY_DARK)
    doc.text(doc.splitTextToSize(obs, pageW - marginX * 2), marginX, y)
  }

  doc.save(`orcamento-${numero}-${cliente.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}
```

Note: `desc1`/`desc2` arrive from `Calculadora.jsx` already as numbers (`parseFloat(orcDesconto1) || 0`, see `handleExportOrcamento`) — this function doesn't need to re-parse them, just use them directly, unlike the old version which also used them as numbers already (`desc1 > 0` checks). Keep it consistent with the existing call site — no change needed there.

- [ ] **Step 3: Run existing tests**

Run: `npm test`
Expected: PASS — there's no `pdf.test.js` (jsPDF output isn't unit-tested in this project, same as before), so this just confirms nothing else broke.

- [ ] **Step 4: Verify it builds**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Manual browser check**

Run: `npm run dev`, log in, go to Calculadora, scroll to "Gerar Orçamento em PDF", fill client name + description (required fields) plus at least one forma de pagamento, click "Exportar Orçamento em PDF". Open the downloaded PDF and confirm: black header band with red accent line, logo (if one is set in Configurações) shown in a white rounded chip, "ORÇAMENTO" in red top-right, item rows with light zebra striping, total in a black rounded box with the amount in red, payment methods as side-by-side boxed cards, observações at the bottom if filled in.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pdf.js
git commit -m "feat: redesign orçamento PDF with brand identity"
```

---

### Task 11: Update `CLAUDE.md` + full regression pass

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: nothing — this is documentation plus a manual verification pass over everything from Tasks 1-10.
- Produces: nothing — this is the last task.

- [ ] **Step 1: Update the "Persistência" section of `CLAUDE.md`**

Find the bullet list of tables (`materials(id, user_id, nome, cor, preco, estoque, created_at)` etc.) and update the `materials` and `settings` lines:

Old:
```
- `materials(id, user_id, nome, cor, preco, estoque, created_at)`
```
New:
```
- `materials(id, user_id, nome, cor, tipo, preco, estoque, created_at)` — `tipo` (PLA/PETG/ABS/TPU/ASA/Nylon/texto livre) adicionado em 2026-07-26
```

Old:
```
- `settings(user_id [PK], meta_mensal, orcamento_numero, empresa_nome, logo_data_url, updated_at)`
```
New:
```
- `settings(user_id [PK], meta_mensal, orcamento_numero, empresa_nome, logo_data_url, printer_cost,
  printer_life, nozzle_cost, nozzle_life, energy_rate, labor_rate, labor_hours, updated_at)` — os 7
  campos de equipamento/mão de obra da Calculadora foram adicionados em 2026-07-26 (antes eram
  `useState` locais com valor de exemplo fixo, resetando a cada visita; agora persistem por conta,
  mesmo padrão de commit-on-blur que `empresa_nome` já usava)
```

- [ ] **Step 2: Add a note about the Calculadora's default state**

In the same "Persistência" section (or right after it), add a new paragraph:

```
**Estado inicial da Calculadora**: peso/preço/cor por cor e horas de impressão nascem
zerados/vazios a cada carregamento (não há mais um exemplo pré-preenchido gerando um preço
"fantasma") — ver `src/pages/Calculadora.jsx`. Os campos de equipamento (impressora, bico, energia,
mão de obra) vêm de `settings` e persistem entre sessões; a primeira vez que uma conta usa a
Calculadora eles mostram os mesmos valores de exemplo de antes só como sugestão inicial, editável e
salva a partir daí. O valor sugerido de venda mostra o preço exato e uma versão arredondada pra
cima em múltiplos de R$5 (`roundUpTo` em `src/lib/format.js`) lado a lado.
```

- [ ] **Step 3: Update the "Design" section for `DataTable` and `Dialog`**

Find the bullet in the file-structure list that describes `src/components/shared/`:

Old (search for the line mentioning `DataTable.jsx`):
```
  `DataTable.jsx` (tabela genérica com edição inline — exporta também
  `textCell`/`numberCell`/`dateCell`/`selectCell`, helpers que viram células editáveis, usados
  pelas páginas de CRUD)
```
New:
```
  `DataTable.jsx` (tabela genérica com edição inline — exporta também
  `textCell`/`numberCell`/`dateCell`/`selectCell`, helpers que viram células editáveis, usados
  pelas páginas de CRUD; abaixo de 768px renderiza como uma lista de cartões empilhados em vez de
  `<table>`, pra manter os botões de ação sempre alcançáveis no celular sem scroll horizontal —
  adicionado em 2026-07-26 depois de um bug relatado onde o botão de excluir ficava fora da área
  visível/tocável em telas pequenas; também ganhou uma prop opcional `onEdit(row)` que adiciona um
  ícone de editar além do de excluir, usado hoje só por Materiais)
```

Also find the bullet listing `src/components/ui/` primitives and add `dialog` to the list of generated components (search for `select`, `sheet`, `table`, `textarea`):

Old:
```
`select`, `sheet`, `table`, `textarea`)
```
New:
```
`select`, `sheet`, `table`, `textarea`, `dialog`)
```

- [ ] **Step 4: Update the "Deploy" section for the SPA rewrite**

Add a sentence after the paragraph that explains the Vercel build auto-detection:

```
Um `vercel.json` na raiz faz rewrite de qualquer rota pra `index.html` (`{"rewrites": [{"source":
"/(.*)", "destination": "/index.html"}]}`), necessário porque `react-router-dom` faz roteamento no
cliente — sem isso, recarregar a página numa sub-rota (ex: `/materiais`) retornava 404 (bug
encontrado e corrigido em 2026-07-26).
```

- [ ] **Step 5: Commit the doc update**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for tipo/settings columns, DataTable mobile layout, vercel.json"
```

- [ ] **Step 6: Full regression pass**

Run, in order, and confirm each passes before moving to the next:

1. `npm test` — expected: all Vitest suites pass (`format.test.js` including the new `roundUpTo` cases, `tables.test.js` including the new `tipo` case, plus the untouched `calc.test.js`/`gcode.test.js`).
2. `npm run build` — expected: succeeds with no new errors (the existing >1MB chunk-size warning is pre-existing and not a regression to fix here).
3. `npm run dev`, then in the browser (or resize to mobile per Task 6):
   - Calculadora: confirm zeroed default, rounded price display, equipment fields persist after reload, "Salvar como produto" creates a row in Produtos.
   - Materiais: confirm tipo selector on add, edit modal with stock top-up, delete icon, mobile card layout with reachable action buttons.
   - Produtos/Pedidos/Vendas: confirm the mobile card layout renders correctly and inline editing still works as before (unaffected by Task 6/7's changes since they didn't pass `onEdit`).
   - Generate an orçamento PDF and confirm the new branded layout opens correctly.
   - Reload the browser while on a non-root route (e.g. `/materiais`) and confirm it no longer 404s.
4. Run the Supabase migration block from Task 3 (`supabase-schema.sql`'s new `alter table` statements) in the Supabase SQL Editor for the account being tested, if not already done — without it, `tipo` and the equipment settings columns won't exist and those features will error on save.

---

## Self-Review Notes

- **Spec coverage**: all 6 numbered sections of the design spec map to tasks — §1 Calculadora → Tasks 2, 8, 9; §2 Materiais → Tasks 3, 4, 7; §3 Calculadora→Produtos → Task 9; §4 PDF → Task 10; §5 DataTable mobile → Task 6; §6 Vercel 404 → Task 1. `CLAUDE.md` update (always part of feature work in this project, per its own convention) → Task 11.
- **Placeholder scan**: no TBD/TODO; every step has literal code or an exact runnable command.
- **Type/name consistency checked**: `roundUpTo(value, step)` (Task 2) is called the same way in Task 8 (`roundUpTo(result.price, 5)`) and referenced by name in Task 9. `onEdit` (Task 6) is the exact prop name passed by Materiais (Task 7). `TABLES.materials.fields.tipo` (Task 3) matches the `tipo` key used in Task 7's `add`/`update` calls. `useSettings()`'s new field names (`printerCost`, `printerLife`, `nozzleCost`, `nozzleLife`, `energyRate`, `laborRate`, `laborHours` — Task 5) match exactly what Task 8 reads/writes.

