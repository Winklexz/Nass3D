# Nass3D React + shadcn/ui Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Nass3D front-end as a React (Vite) SPA with shadcn/ui, Tailwind, and Framer Motion — same Supabase backend, same functionality, new professional black/red visual system with the real logo and subtle animations.

**Architecture:** Vite + React 18 (plain JS, no TypeScript) SPA with `react-router-dom` for the 8 pages (Login + 7 app pages), a sidebar layout, an `AuthContext` gating all routes, and one generic `useCollection` hook (backed by Supabase) reused by the four CRUD collections. Business logic (pricing calculation, `.gcode` parsing, PDF generation, formatting) is ported into plain `src/lib/*.js` modules, unit-tested with Vitest where the logic is pure. Pages are verified manually in the browser (this is a UI-heavy rewrite; there is no existing UI test setup to extend).

**Tech Stack:** Vite, React 18, react-router-dom, Tailwind CSS 3, shadcn/ui (`new-york` style, JS mode), lucide-react, Framer Motion, @supabase/supabase-js, jsPDF, Vitest (for `src/lib/*` unit tests).

## Global Constraints

- No TypeScript anywhere — all files `.jsx`/`.js`.
- Supabase schema, RLS policies, and the email+password (with confirmation) auth flow are **unchanged** — same project (`zzngtfwongumucdtqwgk`), same 5 tables.
- No functional changes vs. the current app — same fields, same validations, same PDF output, same business rules (leveling time +5min, purge grams, deduct-stock, pedido/venda linkage, atraso/urgente flags).
- Colors: background `#08080a` with a subtle red radial glow; glass panels (`rgba(255,255,255,0.03)` + `backdrop-blur`) with **rounded corners** (not angular — decided against the cut-corner motif); accent red `#ff2438` with glow; semantic colors unchanged (`#35d488` green, `#35c4d4` blue, `#ffb734` salmon, `#b06bff` purple).
- Fonts: Orbitron (display), Rajdhani (UI/nav), Inter (body), JetBrains Mono (numbers) — same Google Fonts as today.
- Sidebar navigation (not top tabs), collapses to a `Sheet` drawer under 768px.
- Animations are subtle/professional: page fade+slide, list stagger, counting numbers, hover/tap micro-interactions — never blocking or flashy.
- Deploy target unchanged: `github.com/Winklexz/Nass3D` → Vercel → `nass3-d.vercel.app`. Supabase credentials move from committed `config.js` to Vercel env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), same values as today.
- Logo asset: `C:\Users\User\Downloads\logo nass3d.png` (already confirmed to match the brand).

---

## Phase A — Foundation (tooling, auth, routing shell)

### Task 1: Scaffold Vite + React + Tailwind + shadcn/ui + fonts + theme tokens

**Files:**
- Create: `package.json`, `vite.config.js`, `postcss.config.js`, `tailwind.config.js`, `jsconfig.json`, `components.json`
- Create: `index.html` (replaces the old static one — old one is removed in this task)
- Create: `src/main.jsx`, `src/index.css`, `src/lib/utils.js`
- Create: `public/logo-nass3d.png`, `public/favicon.svg`
- Delete: `style.css`, `script.js`, `auth.js`, `config.js` (superseded by the new app; `supabase-schema.sql` and `CLAUDE.md` stay)

**Interfaces:**
- Produces: `cn(...classes)` helper from `src/lib/utils.js`, used by every shadcn component in later tasks.
- Produces: Tailwind theme tokens (`bg-background`, `text-foreground`, `bg-primary`, `text-primary`, `bg-card`, `border-border`, `bg-success`/`bg-info`/`bg-warning`/`bg-accent2`) available to every component in later tasks.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "nass3d",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "@supabase/supabase-js": "^2.45.0",
    "framer-motion": "^11.3.0",
    "lucide-react": "^0.427.0",
    "jspdf": "^2.5.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0",
    "vitest": "^2.0.5",
    "tailwindcss": "^3.4.10",
    "tailwindcss-animate": "^1.0.7",
    "postcss": "^8.4.41",
    "autoprefixer": "^10.4.20"
  }
}
```

- [ ] **Step 2: Write `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Write `jsconfig.json`** (editor path-alias support)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

- [ ] **Step 4: Write `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Write `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        ui: ['Rajdhani', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: '#35d488',
        info: '#35c4d4',
        warning: '#ffb734',
        accent2: '#b06bff',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        glow: '0 0 18px hsl(var(--primary) / 0.35)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

- [ ] **Step 6: Write `components.json`** (shadcn/ui config, JS mode)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": false,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- [ ] **Step 7: Write `index.html`** (replaces the old static entry point)

```html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Nass3D — Gestão de Impressão 3D</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800&family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 8: Write `src/lib/utils.js`**

```js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 9: Write `src/index.css`** (Tailwind layers + dark theme tokens, HSL for shadcn compatibility)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 240 14% 4%;
  --foreground: 220 14% 93%;
  --card: 220 8% 100%;
  --card-foreground: 220 14% 93%;
  --primary: 353 100% 57%;
  --primary-foreground: 0 0% 100%;
  --secondary: 220 8% 12%;
  --secondary-foreground: 220 14% 93%;
  --muted: 220 8% 12%;
  --muted-foreground: 220 8% 60%;
  --accent: 353 100% 57%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84% 65%;
  --destructive-foreground: 0 0% 100%;
  --border: 220 6% 16%;
  --input: 220 6% 16%;
  --ring: 353 100% 57%;
  --radius: 0.75rem;
}

* {
  border-color: hsl(var(--border));
}

body {
  @apply bg-background text-foreground font-sans antialiased;
  background-image: radial-gradient(ellipse 900px 380px at 20% -10%, hsl(var(--primary) / 0.09), transparent 60%);
  background-attachment: fixed;
}

.glass-panel {
  @apply bg-card/[0.03] border border-white/[0.08] rounded-lg backdrop-blur-md;
}
```

Note: `--card` above intentionally isn't used as a solid fill (`bg-card/[0.03]` in `.glass-panel` uses opacity instead) — shadcn components using `bg-card` will still render legibly since we pair it with `border` + `backdrop-blur` in the composite pages; components generated in Task 1 Step 11 are adjusted for this in their own tasks where needed (Card in Task 1 Step 11 already applies `glass-panel`).

- [ ] **Step 10: Write `src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

`App.jsx` doesn't exist yet — that's fine, it's created in Task 7. This task ends at `npm install`, not at a running dev server.

- [ ] **Step 11: Copy logo assets**

```bash
cp "/c/Users/User/Downloads/logo nass3d.png" "/c/Users/User/Downloads/Nass3D/public/logo-nass3d.png"
```

Create `public/favicon.svg` (reuses the existing red hexagon/arrow mark from the old `index.html` topbar, as a standalone SVG):

```svg
<svg width="32" height="32" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="1" width="32" height="32" rx="7" fill="#0a0a0c" stroke="#ff2438" stroke-width="1.4"/>
  <path d="M17 8 L23 8 L17 19 L11 8 Z" fill="#ff2438"/>
  <rect x="9" y="22" width="16" height="2" rx="1" fill="#ff2438"/>
  <rect x="11.5" y="25.5" width="11" height="2" rx="1" fill="#ff2438" opacity="0.65"/>
  <rect x="14" y="29" width="6" height="1.6" rx="0.8" fill="#ff2438" opacity="0.35"/>
</svg>
```

- [ ] **Step 12: Remove superseded static files**

```bash
cd "/c/Users/User/Downloads/Nass3D"
git rm style.css script.js auth.js config.js
```

- [ ] **Step 13: Install dependencies**

Run: `cd "/c/Users/User/Downloads/Nass3D" && npm install`
Expected: installs without error, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 14: Install shadcn/ui components**

Run:
```bash
cd "/c/Users/User/Downloads/Nass3D"
npx shadcn@latest add button card input label table select sheet badge textarea --yes
```
Expected: creates `src/components/ui/{button,card,input,label,table,select,sheet,badge,textarea}.jsx` and adds any missing Radix/CVA dependencies to `package.json` automatically. If the CLI prompts interactively despite `--yes`, answer with the defaults already declared in `components.json` (New York style, no RSC, no TSX).

- [ ] **Step 15: Verify the toolchain boots**

Run: `npm run build`
Expected: build succeeds (it will fail only on the missing `./App.jsx` import from `main.jsx` — if so, temporarily stub `src/App.jsx` with `export default function App(){ return <div className="p-8 text-foreground">Nass3D</div> }`, rerun `npm run build`, confirm it succeeds, then leave the stub in place — Task 7 replaces it for real).

- [ ] **Step 16: Commit**

```bash
git add -A
git commit -m "Scaffold Vite + React + Tailwind + shadcn/ui, remove legacy static files"
```

---

### Task 2: `src/lib/format.js` — formatting/parsing helpers (ported from `script.js`)

**Files:**
- Create: `src/lib/format.js`
- Create: `src/lib/format.test.js`
- Create: `vitest.config.js`

**Interfaces:**
- Produces: `fmtBRL(v)`, `fmtNum(v, d=1)`, `newId()`, `resolveColorInput(str)`, `capitalizeWords(s)`, `buildFilamentName(corTexto, complemento)`, `waLink(tel)`, `pedidoRowFlag(order)`, `hexToRgb(hex)`, `colorDistance(hex1, hex2)`, `findClosestMaterial(hex, materials, threshold)` — all pure functions, consumed by every page in later tasks.

- [ ] **Step 1: Write `vitest.config.js`**

```js
import { defineConfig } from 'vite'

export default defineConfig({
  test: { environment: 'node' },
})
```

- [ ] **Step 2: Write the failing tests in `src/lib/format.test.js`**

```js
import { describe, it, expect } from 'vitest'
import {
  fmtBRL, fmtNum, resolveColorInput, capitalizeWords, buildFilamentName,
  waLink, pedidoRowFlag, hexToRgb, colorDistance, findClosestMaterial,
} from './format.js'

describe('fmtBRL', () => {
  it('formats a number as BRL currency', () => {
    expect(fmtBRL(1234.5)).toBe('R$ 1.234,50')
  })
})

describe('fmtNum', () => {
  it('formats with the given decimal places', () => {
    expect(fmtNum(3, 0)).toBe('3')
    expect(fmtNum(3.14159, 2)).toBe('3,14')
  })
})

describe('resolveColorInput', () => {
  it('resolves a hex string', () => {
    expect(resolveColorInput('#FF2438')).toBe('#ff2438')
    expect(resolveColorInput('ff2438')).toBe('#ff2438')
  })
  it('resolves a known color name', () => {
    expect(resolveColorInput('vermelho')).toBe('#e63946')
  })
  it('returns null for unknown input', () => {
    expect(resolveColorInput('cor-inexistente')).toBeNull()
  })
})

describe('capitalizeWords', () => {
  it('capitalizes each word', () => {
    expect(capitalizeWords('azul marinho')).toBe('Azul Marinho')
  })
})

describe('buildFilamentName', () => {
  it('builds a name from color and complement', () => {
    expect(buildFilamentName('azul', 'marinho')).toBe('Filamento Azul Marinho')
  })
  it('builds a name with no complement', () => {
    expect(buildFilamentName('vermelho', '')).toBe('Filamento Vermelho')
  })
})

describe('waLink', () => {
  it('prefixes Brazilian numbers with 55', () => {
    expect(waLink('11987654321')).toBe('https://wa.me/5511987654321')
  })
  it('returns null for empty input', () => {
    expect(waLink('')).toBeNull()
  })
})

describe('pedidoRowFlag', () => {
  it('flags an overdue order', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    expect(pedidoRowFlag({ prazo: yesterday, status: 'Pendente' })).toBe('atrasado')
  })
  it('does not flag a delivered order', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    expect(pedidoRowFlag({ prazo: yesterday, status: 'Entregue' })).toBe('')
  })
})

describe('hexToRgb / colorDistance', () => {
  it('converts hex to rgb', () => {
    expect(hexToRgb('#ff2438')).toEqual([255, 36, 56])
  })
  it('computes 0 distance for identical colors', () => {
    expect(colorDistance('#ff2438', '#ff2438')).toBe(0)
  })
})

describe('findClosestMaterial', () => {
  const materials = [
    { id: '1', cor: '#ff2438', nome: 'Vermelho' },
    { id: '2', cor: '#1d63d1', nome: 'Azul' },
  ]
  it('finds the closest material within threshold', () => {
    expect(findClosestMaterial('#fe2337', materials).id).toBe('1')
  })
  it('returns null when nothing is close enough', () => {
    expect(findClosestMaterial('#00ff00', materials, 10)).toBeNull()
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/format.test.js`
Expected: FAIL — `format.js` doesn't exist yet.

- [ ] **Step 4: Write `src/lib/format.js`**

```js
export function fmtBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function fmtNum(v, d = 1) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export const COLOR_NAMES = {
  vermelho: '#e63946', azul: '#1d63d1', verde: '#2ecc71', amarelo: '#f4d03f',
  preto: '#161616', branco: '#f5f5f5', cinza: '#8a8d93', roxo: '#8e44ad',
  laranja: '#e67e22', rosa: '#f78fb3', pink: '#ff2d95', marrom: '#8b5a2b',
  dourado: '#d4af37', ouro: '#d4af37', prata: '#c0c0c0', bege: '#e8d8c3',
  transparente: '#dfe6e9', natural: '#f0e6d2', ciano: '#00bcd4', turquesa: '#1abc9c',
  vinho: '#6b1d2f', grafite: '#3a3a3c', lilas: '#c9a0dc', 'lilás': '#c9a0dc',
  magenta: '#d6249f', bronze: '#cd7f32', cobre: '#b87333', creme: '#f3e5ab',
  'azul marinho': '#1b2a4a', 'azul claro': '#7ec8f2', 'azul escuro': '#0d3b8c',
  'verde claro': '#7ed957', 'verde escuro': '#1e5631', 'verde limao': '#a8e063', 'verde limão': '#a8e063',
}

export function resolveColorInput(str) {
  if (!str) return null
  const s = str.trim().toLowerCase()
  if (/^#?[0-9a-f]{6}$/i.test(s)) return '#' + s.replace('#', '')
  if (COLOR_NAMES[s]) return COLOR_NAMES[s]
  return null
}

export function capitalizeWords(s) {
  return s.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function buildFilamentName(corTexto, complemento) {
  const corLabel = corTexto.trim() ? capitalizeWords(corTexto) : ''
  let nome = corLabel ? `Filamento ${corLabel}` : 'Filamento'
  if (complemento && complemento.trim()) nome += ' ' + capitalizeWords(complemento)
  return nome
}

export function waLink(tel) {
  let digits = (tel || '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.length <= 11) digits = '55' + digits
  return `https://wa.me/${digits}`
}

export function pedidoRowFlag(o) {
  if (!o.prazo || o.status === 'Entregue' || o.status === 'Orçamento' || o.status === 'Perdido') return ''
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const prazoDate = new Date(o.prazo + 'T00:00:00')
  const diffDays = Math.round((prazoDate - today) / 86400000)
  if (diffDays < 0) return 'atrasado'
  if (diffDays <= 2) return 'urgente'
  return ''
}

export function hexToRgb(hex) {
  hex = (hex || '').replace('#', '')
  if (hex.length !== 6) return [0, 0, 0]
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
}

export function colorDistance(hex1, hex2) {
  const a = hexToRgb(hex1), b = hexToRgb(hex2)
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)
}

export function findClosestMaterial(hex, materials, threshold = 60) {
  let best = null, bestDist = Infinity
  materials.forEach(m => {
    if (!m.cor) return
    const d = colorDistance(hex, m.cor)
    if (d < bestDist) { bestDist = d; best = m }
  })
  return (best && bestDist <= threshold) ? best : null
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/format.test.js`
Expected: PASS (all 14 assertions).

- [ ] **Step 6: Commit**

```bash
git add src/lib/format.js src/lib/format.test.js vitest.config.js
git commit -m "Add format.js helpers ported from script.js, with unit tests"
```

---

### Task 3: `src/lib/tables.js` — Supabase field mapping (ported from `TABLES` in `script.js`)

**Files:**
- Create: `src/lib/tables.js`
- Create: `src/lib/tables.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `TABLES` (object keyed by `materials`/`products`/`orders`/`sales`, each `{ name, fields }`), `rowToObj(row, fields)`, `objToRow(obj, fields)` — consumed by `useCollection` (Task 10) and `useSettings` (Task 10).

- [ ] **Step 1: Write the failing tests in `src/lib/tables.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { TABLES, rowToObj, objToRow } from './tables.js'

describe('rowToObj / objToRow', () => {
  it('round-trips a materials row', () => {
    const row = { id: 'a1', nome: 'Filamento Azul', cor: '#1d63d1', preco: 140, estoque: 500, user_id: 'u1' }
    const obj = rowToObj(row, TABLES.materials.fields)
    expect(obj).toEqual({ id: 'a1', nome: 'Filamento Azul', cor: '#1d63d1', preco: 140, estoque: 500 })
    expect(objToRow(obj, TABLES.materials.fields)).toEqual({
      id: 'a1', nome: 'Filamento Azul', cor: '#1d63d1', preco: 140, estoque: 500,
    })
  })

  it('maps orders camelCase criadoEm to snake_case criado_em', () => {
    const obj = { id: 'p1', cliente: 'Maria', criadoEm: '2026-07-25T00:00:00.000Z' }
    const row = objToRow(obj, TABLES.orders.fields)
    expect(row.criado_em).toBe('2026-07-25T00:00:00.000Z')
    expect(rowToObj(row, TABLES.orders.fields).criadoEm).toBe('2026-07-25T00:00:00.000Z')
  })

  it('objToRow only includes keys present on the input object (partial update support)', () => {
    const row = objToRow({ estoque: 300 }, TABLES.materials.fields)
    expect(row).toEqual({ estoque: 300 })
  })

  it('maps sales pedidoId to pedido_id', () => {
    const row = objToRow({ pedidoId: 'ord1' }, TABLES.sales.fields)
    expect(row).toEqual({ pedido_id: 'ord1' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/tables.test.js`
Expected: FAIL — `tables.js` doesn't exist yet.

- [ ] **Step 3: Write `src/lib/tables.js`**

```js
export const TABLES = {
  materials: {
    name: 'materials',
    fields: { id: 'id', nome: 'nome', cor: 'cor', preco: 'preco', estoque: 'estoque' },
  },
  products: {
    name: 'products',
    fields: { id: 'id', nome: 'nome', preco: 'preco', custo: 'custo' },
  },
  orders: {
    name: 'orders',
    fields: {
      id: 'id', cliente: 'cliente', telefone: 'telefone', item: 'item',
      prazo: 'prazo', status: 'status', valor: 'valor', criadoEm: 'criado_em',
    },
  },
  sales: {
    name: 'sales',
    fields: {
      id: 'id', data: 'data', produto: 'produto', comprador: 'comprador',
      contato: 'contato', valor: 'valor', pedidoId: 'pedido_id',
    },
  },
}

export function rowToObj(row, fields) {
  const obj = {}
  for (const [key, col] of Object.entries(fields)) obj[key] = row[col]
  return obj
}

export function objToRow(obj, fields) {
  const row = {}
  for (const [key, col] of Object.entries(fields)) {
    if (key in obj) row[col] = obj[key]
  }
  return row
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/tables.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/tables.js src/lib/tables.test.js
git commit -m "Add tables.js field mapping for Supabase collections, with unit tests"
```

---

### Task 4: `src/lib/supabaseClient.js` — Supabase client from env vars

**Files:**
- Create: `src/lib/supabaseClient.js`
- Create: `.env.example`
- Create: `.env.local` (gitignored — real credentials)
- Modify: `.gitignore` (add `.env.local`, `.env`)

**Interfaces:**
- Produces: `supabase` (the initialized Supabase client), imported by `AuthContext` (Task 5), `useCollection`/`useSettings` (Task 10).

- [ ] **Step 1: Write `.env.example`** (committed — placeholders only)

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

- [ ] **Step 2: Write `.env.local`** (gitignored — real values, same ones currently in the deleted `config.js`)

```
VITE_SUPABASE_URL=https://zzngtfwongumucdtqwgk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6bmd0Zndvbmd1bXVjZHRxd2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NDU1NzYsImV4cCI6MjEwMDUyMTU3Nn0.7q8vfP0Livc4-GCv48sI7nTfv8oLak5cmQyoHRe1884
```

- [ ] **Step 3: Add to `.gitignore`**

```
.env.local
.env
```

- [ ] **Step 4: Write `src/lib/supabaseClient.js`**

```js
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — check .env.local')
}

export const supabase = createClient(url, anonKey)
```

- [ ] **Step 5: Verify env vars load**

Run: `npm run build`
Expected: build succeeds (no thrown "Missing VITE_SUPABASE_URL" error — confirms Vite picked up `.env.local`).

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabaseClient.js .env.example .gitignore
git commit -m "Add Supabase client using Vite env vars"
```
(`.env.local` is intentionally not committed — it's gitignored.)

---

### Task 5: `src/context/AuthContext.jsx` — session state, login/signup/logout

**Files:**
- Create: `src/context/AuthContext.jsx`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabaseClient.js` (Task 4).
- Produces: `AuthProvider` (wraps the app), `useAuth()` returning `{ user, loading, login(email, password), signup(email, password), logout() }`. `login`/`signup` return `{ error: string|null }` (`signup` also returns `needsConfirmation: boolean`). Consumed by `App.jsx` (Task 7) and `Login.jsx` (Task 6).

- [ ] **Step 1: Write `src/context/AuthContext.jsx`**

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const AuthContext = createContext(null)

function traduzErro(msg) {
  if (/Invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.'
  if (/Email not confirmed/i.test(msg)) return 'Confirme seu e-mail antes de entrar (verifique sua caixa de entrada).'
  if (/User already registered/i.test(msg)) return 'Já existe uma conta com esse e-mail — tente entrar.'
  if (/Password should be at least/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.'
  return msg
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: traduzErro(error.message) }
    setUser(data.user)
    return { error: null }
  }

  async function signup(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: traduzErro(error.message), needsConfirmation: false }
    if (data.session) {
      setUser(data.user)
      return { error: null, needsConfirmation: false }
    }
    return { error: null, needsConfirmation: true }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/AuthContext.jsx
git commit -m "Add AuthContext with Supabase session/login/signup/logout"
```

---

### Task 6: `src/pages/Login.jsx` — login/signup page

**Files:**
- Create: `src/pages/Login.jsx`

**Interfaces:**
- Consumes: `useAuth()` from Task 5.
- Produces: default-exported `Login` component, consumed by `App.jsx` (Task 7).

- [ ] **Step 1: Write `src/pages/Login.jsx`**

```jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login() {
  const { login, signup } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) { setMsg('Preencha e-mail e senha.'); setMsgType('err'); return }
    setLoading(true); setMsg('Entrando...'); setMsgType('')
    const { error } = await login(email, password)
    setLoading(false)
    if (error) { setMsg(error); setMsgType('err'); return }
    setMsg(''); setMsgType('')
  }

  async function handleSignup() {
    if (!email || !password) { setMsg('Preencha e-mail e senha.'); setMsgType('err'); return }
    if (password.length < 6) { setMsg('A senha precisa ter pelo menos 6 caracteres.'); setMsgType('err'); return }
    setLoading(true); setMsg('Criando conta...'); setMsgType('')
    const { error, needsConfirmation } = await signup(email, password)
    setLoading(false)
    if (error) { setMsg(error); setMsgType('err'); return }
    if (needsConfirmation) {
      setMsg('Conta criada! Verifique seu e-mail e clique no link de confirmação antes de entrar.')
      setMsgType('ok')
    } else {
      setMsg(''); setMsgType('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="glass-panel w-full max-w-sm p-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center mb-6">
              <img src="/logo-nass3d.png" alt="Nass3D" className="h-20 w-auto" />
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" autoComplete="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="voce@email.com"
                  onKeyDown={e => e.key === 'Enter' && document.getElementById('password')?.focus()} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" autoComplete="current-password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              </div>
              {msg && (
                <p className={
                  msgType === 'err' ? 'text-xs text-destructive' :
                  msgType === 'ok' ? 'text-xs text-success' : 'text-xs text-muted-foreground'
                }>{msg}</p>
              )}
              <div className="flex gap-2.5 pt-1">
                <Button className="flex-1" onClick={handleLogin} disabled={loading}>Entrar</Button>
                <Button className="flex-1" variant="outline" onClick={handleSignup} disabled={loading}>Criar conta</Button>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">
                Seus dados ficam vinculados a este login e sincronizados entre dispositivos.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Login.jsx
git commit -m "Add Login page"
```

---

### Task 7: `src/App.jsx` — routing shell, protected routes, verify auth gate end-to-end

**Files:**
- Modify: `src/App.jsx` (replaces the Task 1 Step 15 stub)

**Interfaces:**
- Consumes: `AuthProvider`, `useAuth()` (Task 5), `Login` (Task 6).
- Produces: the routed app shell. `<Route path="/*">` currently renders a temporary placeholder — **Task 8 replaces this placeholder with `AppLayout` and the real page routes.** This is not a "TODO" left for later — it's the explicit deliverable boundary between this task (auth gate works) and the next (real layout exists).

- [ ] **Step 1: Write `src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Login from '@/pages/Login'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/*"
        element={user ? <div className="p-8 text-foreground">Logado — layout chega na próxima tarefa.</div> : <Navigate to="/login" replace />}
      />
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
```

- [ ] **Step 2: Verify the auth gate manually**

Run: `npm run dev` (background)
- Navigate to `http://localhost:5173/` — expect redirect to `/login`, logo + form visible.
- Log in with the existing test account (`nass3d.teste.claude@gmail.com` / `TesteSeguro123`, already confirmed in Supabase from the previous session) — expect redirect to `/` showing "Logado — layout chega na próxima tarefa."
- Reload the page — expect to stay logged in (session persisted) without seeing `/login` flash.
- Click nothing else yet (logout button doesn't exist until Task 8).

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "Add routing shell with protected routes, verify auth gate works end-to-end"
```

---

## Phase B — Layout & Dashboard

### Task 8: `Sidebar.jsx` + `AppLayout.jsx` — navigation shell (desktop + mobile drawer)

**Files:**
- Create: `src/components/layout/Sidebar.jsx`
- Create: `src/components/layout/AppLayout.jsx`
- Modify: `src/App.jsx` (mount `AppLayout` for the protected `/*` route, replacing the Task 7 placeholder)

**Interfaces:**
- Consumes: `useAuth()` (Task 5), `Sheet`/`SheetContent`/`SheetTrigger` (Task 1 shadcn components), `lucide-react` icons.
- Produces: `Sidebar` (nav list, used standalone on desktop and inside the `Sheet` on mobile), `AppLayout` (renders `Sidebar` + `<Outlet />` for nested page routes) — consumed by `App.jsx` here and implicitly by every page task from here on (pages render inside `AppLayout`'s `<Outlet />`).

- [ ] **Step 1: Write `src/components/layout/Sidebar.jsx`**

```jsx
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Calculator, Boxes, Package, ClipboardList, ShoppingCart, FileBarChart, LogOut,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Painel', icon: LayoutDashboard, end: true },
  { to: '/calculadora', label: 'Calculadora', icon: Calculator },
  { to: '/materiais', label: 'Materiais', icon: Boxes },
  { to: '/produtos', label: 'Produtos', icon: Package },
  { to: '/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { to: '/relatorio', label: 'Relatório', icon: FileBarChart },
]

export default function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg">
          {/* Full logo is a square PNG with the hexagon mark on top ~62% and
              wordmark below — object-position biases the crop to show just
              the hexagon. Nudge the percentages during Step 4 manual
              verification if the crop looks off against the real asset. */}
          <img src="/logo-nass3d.png" alt="Nass3D" className="h-full w-full scale-[1.7] object-cover object-[50%_25%]" />
        </div>
        <div>
          <div className="font-display font-extrabold text-sm tracking-wide">NASS3D</div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            gestão de impressão 3d
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 font-ui text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/15 text-primary shadow-glow border border-primary/40'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border border-transparent',
            )}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <div className="mb-2 truncate font-mono text-[11px] text-muted-foreground">{user?.email}</div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 font-ui text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
        >
          <LogOut size={14} /> Sair
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `src/components/layout/AppLayout.jsx`**

```jsx
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:block md:w-60 md:shrink-0 md:border-r md:border-border">
        <Sidebar />
      </aside>

      <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
        <span className="font-display text-sm font-bold">NASS3D</span>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="rounded-lg border border-border p-2 text-muted-foreground">
              <Menu size={18} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 px-5 py-7 md:px-8 md:py-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Modify `src/App.jsx`** to mount `AppLayout` (replaces the Task 7 placeholder route)

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Login from '@/pages/Login'
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
        <Route index element={<div className="text-foreground">Painel chega na próxima tarefa.</div>} />
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
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`
- Desktop width: sidebar visible on the left with all 7 items, user email, Sair button. Click "Sair" — expect redirect to `/login`.
- Check the logo mark in the sidebar header: it should show just the red/black hexagon, not a squished full logo with cut-off text. If the crop looks off, adjust the `scale-[1.7]`/`object-[50%_25%]` values in Step 1 until only the hexagon is visible, then re-check.
- Log back in. Resize the window under 768px (or use browser devtools mobile view): sidebar disappears, hamburger button appears top-left; clicking it opens the drawer with the same nav; clicking a nav item (once real pages exist in later tasks) closes the drawer.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Sidebar.jsx src/components/layout/AppLayout.jsx src/App.jsx
git commit -m "Add Sidebar and AppLayout with mobile drawer navigation"
```

---

### Task 9: `useCountUp` hook + `StatCard`/`AlertCard` shared components

**Files:**
- Create: `src/hooks/useCountUp.js`
- Create: `src/components/shared/StatCard.jsx`
- Create: `src/components/shared/AlertCard.jsx`

**Interfaces:**
- Produces: `useCountUp(target, formatFn, duration=650)` → `string`; `<StatCard label value format color linkTo linkLabel delay />`; `<AlertCard icon text level linkTo linkLabel delay />`. Consumed by `Painel.jsx` (Task 11) and `Relatorio.jsx` (Task 23).

- [ ] **Step 1: Write `src/hooks/useCountUp.js`** (ports the easing/duration from the original `animateNumber` in `script.js`)

```js
import { useEffect, useRef, useState } from 'react'

export function useCountUp(target, formatFn, duration = 650) {
  const [display, setDisplay] = useState(formatFn(0))
  const prevTarget = useRef(0)

  useEffect(() => {
    if (target === null || target === undefined) { setDisplay('—'); return }
    const start = performance.now()
    const from = prevTarget.current
    let raf
    function tick(now) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(formatFn(from + (target - from) * eased))
      if (t < 1) { raf = requestAnimationFrame(tick) }
      else { setDisplay(formatFn(target)); prevTarget.current = target }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, formatFn, duration])

  return display
}
```

- [ ] **Step 2: Write `src/components/shared/StatCard.jsx`**

```jsx
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useCountUp } from '@/hooks/useCountUp'

export default function StatCard({ label, value, format, color = 'text-foreground', linkTo, linkLabel, delay = 0 }) {
  const display = useCountUp(value, format)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -2 }}
      className="glass-panel p-4"
    >
      <div className="mb-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-ui text-2xl font-bold ${color}`}>{display}</div>
      {linkTo && (
        <Link to={linkTo} className="mt-1.5 block text-[11.5px] text-muted-foreground transition-colors hover:text-primary">
          {linkLabel}
        </Link>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 3: Write `src/components/shared/AlertCard.jsx`**

```jsx
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const LEVEL_BORDER = { atrasado: 'border-l-destructive', urgente: 'border-l-warning', ok: 'border-l-success' }

export default function AlertCard({ icon, text, level = 'ok', linkTo, linkLabel, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`glass-panel flex items-center justify-between gap-3 border-l-[3px] px-4 py-3 text-sm ${LEVEL_BORDER[level]}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="font-medium text-foreground">{text}</span>
      </div>
      {linkTo && (
        <Link to={linkTo} className="whitespace-nowrap font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground">
          {linkLabel}
        </Link>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useCountUp.js src/components/shared/StatCard.jsx src/components/shared/AlertCard.jsx
git commit -m "Add useCountUp hook and StatCard/AlertCard shared components"
```

---

### Task 10: `useCollection` + `useSettings` hooks — Supabase data layer

**Files:**
- Create: `src/hooks/useCollection.js`
- Create: `src/hooks/useSettings.js`

**Interfaces:**
- Consumes: `supabase` (Task 4), `useAuth()` (Task 5), `TABLES`/`rowToObj`/`objToRow` (Task 3), `newId` (Task 2).
- Produces: `useCollection(key)` → `{ data, loading, add(partialItem), update(id, patch), remove(id), reload }` where `key` is `'materials' | 'products' | 'orders' | 'sales'`; `useSettings()` → `{ settings, loading, save(patch) }`. Consumed by every page from Task 11 onward.

- [ ] **Step 1: Write `src/hooks/useCollection.js`**

```js
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { TABLES, rowToObj, objToRow } from '@/lib/tables'
import { newId } from '@/lib/format'

export function useCollection(key) {
  const { user } = useAuth()
  const table = TABLES[key]
  const orderCol = key === 'orders' ? 'criado_em' : 'created_at'
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data: rows, error } = await supabase
      .from(table.name).select('*').eq('user_id', user.id).order(orderCol, { ascending: true })
    if (!error) setData((rows || []).map(r => rowToObj(r, table.fields)))
    setLoading(false)
  }, [user, table, orderCol])

  useEffect(() => { reload() }, [reload])

  async function add(partialItem) {
    const item = { id: newId(), ...partialItem }
    const row = { ...objToRow(item, table.fields), user_id: user.id }
    const { error } = await supabase.from(table.name).insert(row)
    if (!error) setData(prev => [...prev, item])
    return { error, item }
  }

  async function update(id, patch) {
    const row = objToRow(patch, table.fields)
    const { error } = await supabase.from(table.name).update(row).eq('id', id)
    if (!error) setData(prev => prev.map(x => (x.id === id ? { ...x, ...patch } : x)))
    return { error }
  }

  async function remove(id) {
    const { error } = await supabase.from(table.name).delete().eq('id', id)
    if (!error) setData(prev => prev.filter(x => x.id !== id))
    return { error }
  }

  return { data, loading, add, update, remove, reload }
}
```

- [ ] **Step 2: Write `src/hooks/useSettings.js`**

```js
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'

const DEFAULTS = { metaMensal: 1500, orcamentoNumero: 0, empresaNome: '', logoDataUrl: '' }

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
      })
    }
    setLoading(false)
  }, [user])

  useEffect(() => { reload() }, [reload])

  async function save(patch) {
    const next = { ...settings, ...patch }
    setSettings(next)
    const { error } = await supabase.from('settings').upsert({
      user_id: user.id,
      meta_mensal: next.metaMensal,
      orcamento_numero: next.orcamentoNumero,
      empresa_nome: next.empresaNome,
      logo_data_url: next.logoDataUrl,
    }, { onConflict: 'user_id' })
    return { error }
  }

  return { settings, loading, save }
}
```

- [ ] **Step 3: Verify manually**

Run `npm run dev`, log in with the test account. In the browser console: `import('/src/hooks/useCollection.js')` isn't directly testable from the console (it's a hook), so instead temporarily render `{JSON.stringify(useCollection('materials').data)}` inside the Task 7/8 placeholder route, confirm it fetches `[]` (or existing test data) without console errors, then remove the temporary debug line before committing.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useCollection.js src/hooks/useSettings.js
git commit -m "Add useCollection and useSettings Supabase-backed hooks"
```

---

### Task 11: `Painel.jsx` — dashboard page

**Files:**
- Create: `src/pages/Painel.jsx`
- Modify: `src/App.jsx` (mount `Painel` at the index route, replacing the Task 8 placeholder)

**Interfaces:**
- Consumes: `useCollection` (Task 10), `useSettings` (Task 10), `fmtBRL`/`pedidoRowFlag` (Task 2), `StatCard`/`AlertCard` (Task 9).
- Produces: default-exported `Painel` page.

- [ ] **Step 1: Write `src/pages/Painel.jsx`**

```jsx
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { PackageX, Clock, TrendingDown, CircleCheck } from 'lucide-react'
import { useCollection } from '@/hooks/useCollection'
import { useSettings } from '@/hooks/useSettings'
import { fmtBRL, pedidoRowFlag } from '@/lib/format'
import StatCard from '@/components/shared/StatCard'
import AlertCard from '@/components/shared/AlertCard'

const WEEKDAYS_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default function Painel() {
  const { data: materials } = useCollection('materials')
  const { data: products } = useCollection('products')
  const { data: orders } = useCollection('orders')
  const { data: sales } = useCollection('sales')
  const { settings, save } = useSettings()
  const [metaInput, setMetaInput] = useState(null)

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite'

  const stats = useMemo(() => {
    const ym = now.toISOString().slice(0, 7)
    let caixaMes = 0, profitSum = 0, profitCount = 0
    sales.forEach(v => {
      if (v.data && v.data.slice(0, 7) === ym) caixaMes += v.valor || 0
      const prod = products.find(p => p.nome === v.produto)
      if (prod) { profitSum += (v.valor || 0) - (prod.custo || 0); profitCount++ }
    })
    const lucroMedio = profitCount ? profitSum / profitCount : null
    const pendentes = orders.filter(o => o.status !== 'Entregue' && o.status !== 'Orçamento')
    const aReceber = pendentes.reduce((sum, o) => sum + (o.valor || 0), 0)
    const emAberto = orders.filter(o => o.status === 'Pendente').length
    const emProducao = orders.filter(o => o.status === 'Em produção').length
    const orcamentosAbertos = orders.filter(o => o.status === 'Orçamento').length
    const zeroed = materials.filter(m => (m.estoque || 0) <= 0).length
    const lowStock = materials.filter(m => (m.estoque || 0) > 0 && (m.estoque || 0) < 100).length
    const overdue = orders.filter(o => pedidoRowFlag(o) === 'atrasado').length
    return { caixaMes, lucroMedio, pendentes, aReceber, emAberto, emProducao, orcamentosAbertos, zeroed, lowStock, overdue }
  }, [materials, products, orders, sales])

  const alerts = []
  if (stats.zeroed > 0) alerts.push({ level: 'atrasado', icon: <PackageX size={16} />, text: `${stats.zeroed} cor${stats.zeroed > 1 ? 'es' : ''} zerada${stats.zeroed > 1 ? 's' : ''} no estoque`, linkTo: '/materiais', linkLabel: 'estoque →' })
  if (stats.overdue > 0) alerts.push({ level: 'atrasado', icon: <Clock size={16} />, text: `${stats.overdue} pedido${stats.overdue > 1 ? 's' : ''} com prazo vencido`, linkTo: '/pedidos', linkLabel: 'pedidos →' })
  if (stats.lowStock > 0) alerts.push({ level: 'urgente', icon: <TrendingDown size={16} />, text: `${stats.lowStock} material${stats.lowStock > 1 ? 'is' : ''} com estoque baixo`, linkTo: '/materiais', linkLabel: 'materiais →' })

  const metaMensal = settings.metaMensal || 0
  const pct = metaMensal > 0 ? Math.min(100, (stats.caixaMes / metaMensal) * 100) : 0

  return (
    <div>
      <div className="mb-3.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow" /> Painel · Nass3D · {now.getFullYear()}
      </div>
      <h1 className="mb-3.5 font-ui text-4xl font-bold uppercase leading-none md:text-5xl">
        Seu <span className="text-primary">Painel</span>
      </h1>
      <p className="mb-6 max-w-lg text-sm text-muted-foreground">
        Visão geral do negócio: pedidos, dinheiro a receber e o resumo do mês. Tudo num lugar só.
      </p>

      <div className="mb-5 flex flex-col gap-2.5">
        {alerts.length === 0
          ? <AlertCard icon={<CircleCheck size={16} />} text="Tudo em dia por aqui." level="ok" />
          : alerts.map((a, i) => <AlertCard key={i} {...a} delay={i * 0.06} />)}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel mb-5 p-5">
        <div className="mb-1 font-ui text-lg font-bold">{greeting}, chefe! 👋</div>
        <div className="mb-4 font-mono text-xs text-muted-foreground">
          {WEEKDAYS_PT[now.getDay()]}, {now.getDate()}/{now.getMonth() + 1}
        </div>
        <div className="flex items-center gap-3.5 rounded-lg border border-primary/50 bg-primary/10 px-4 py-3.5">
          <div className="text-xl">💰</div>
          <div>
            <div className="font-ui text-lg font-bold">{fmtBRL(stats.aReceber)} a receber</div>
            <div className="text-xs text-muted-foreground">
              {stats.pendentes.length} pedido{stats.pendentes.length === 1 ? '' : 's'} pendente{stats.pendentes.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Orçamentos" value={stats.orcamentosAbertos} format={v => String(Math.round(v))} linkTo="/pedidos" linkLabel="pedidos ›" />
        <StatCard label="Em aberto" value={stats.emAberto} format={v => String(Math.round(v))} color="text-warning" linkTo="/pedidos" linkLabel="pedidos ›" delay={0.03} />
        <StatCard label="Em produção" value={stats.emProducao} format={v => String(Math.round(v))} color="text-info" linkTo="/pedidos" linkLabel="pedidos ›" delay={0.06} />
        <StatCard label="A receber" value={stats.aReceber} format={fmtBRL} color="text-primary" linkTo="/pedidos" linkLabel="pedidos ›" delay={0.09} />
        <StatCard label="Caixa do mês" value={stats.caixaMes} format={fmtBRL} color="text-success" linkTo="/vendas" linkLabel="vendas ›" delay={0.12} />
        <StatCard label="Lucro médio/venda" value={stats.lucroMedio} format={v => (stats.lucroMedio === null ? '—' : fmtBRL(v))} color="text-accent2" linkTo="/vendas" linkLabel="vendas ›" delay={0.15} />
      </div>

      <div className="glass-panel p-5">
        <div className="mb-4 border-b border-border pb-2.5 font-ui text-sm font-bold uppercase tracking-wide">Meta do mês</div>
        <div className="mb-3 flex items-baseline gap-2">
          <div className="font-ui text-2xl font-bold text-success">{fmtBRL(stats.caixaMes)}</div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            de R$
            <input
              type="number" step="50" min="0"
              value={metaInput ?? metaMensal}
              onChange={e => setMetaInput(e.target.value)}
              onBlur={() => { if (metaInput !== null) { save({ metaMensal: parseFloat(metaInput) || 0 }); setMetaInput(null) } }}
              className="w-20 rounded bg-transparent px-1 py-0.5 font-mono text-sm text-muted-foreground outline-none hover:border hover:border-border focus:border focus:border-primary focus:text-foreground"
            />
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full border border-border bg-white/[0.03]">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-success"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Modify `src/App.jsx`** — replace the placeholder index route

```jsx
// replace: <Route index element={<div className="text-foreground">Painel chega na próxima tarefa.</div>} />
// with:
<Route index element={<Painel />} />
```
(add `import Painel from '@/pages/Painel'` at the top)

- [ ] **Step 3: Verify manually**

Run `npm run dev`, log in. Expect: greeting matches current time of day, "Tudo em dia por aqui" alert (empty account), all stat cards show `0`/`—`/`R$ 0,00` and count up from 0 on load, meta bar renders empty, changing the meta input and blurring persists (reload the page, confirm the new value shows).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Painel.jsx src/App.jsx
git commit -m "Add Painel dashboard page"
```

---

## Phase C — CRUD pages (Materiais, Produtos, Pedidos, Vendas)

### Task 12: `DataTable.jsx` — generic animated table + reusable inline-edit cells

**Files:**
- Create: `src/components/shared/DataTable.jsx`

**Interfaces:**
- Consumes: shadcn `Table`/`TableBody`/`TableCell`/`TableHead`/`TableHeader`/`TableRow`, `Input`, `Button` (Task 1).
- Produces: `<DataTable columns rows onUpdate onRemove emptyMessage />`, `textCell(key)`, `numberCell(key, {step})`, `selectCell(key, options)` — consumed by Materiais/Produtos/Pedidos/Vendas (Tasks 13–16). `columns` is `[{ key, label, render?(row, update) }]`; when a column has no `render`, it renders `row[key]` as plain text (used for computed/derived cells like the WhatsApp link).

- [ ] **Step 1: Write `src/components/shared/DataTable.jsx`**

```jsx
import { AnimatePresence, motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export default function DataTable({ columns, rows, onUpdate, onRemove, emptyMessage }) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-xs text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto">
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
                className="border-b border-border/60 last:border-0"
              >
                {columns.map(col => (
                  <TableCell key={col.key} className="py-2">
                    {col.render ? col.render(row, patch => onUpdate(row.id, patch)) : row[col.key]}
                  </TableCell>
                ))}
                <TableCell className="py-2 text-right">
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(row.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
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

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/DataTable.jsx
git commit -m "Add generic DataTable component with reusable inline-edit cells"
```

---

### Task 13: `Materiais.jsx` — filament CRUD page

**Files:**
- Create: `src/pages/Materiais.jsx`
- Modify: `src/App.jsx` (add `/materiais` route)

**Interfaces:**
- Consumes: `useCollection('materials')` (Task 10), `resolveColorInput`/`buildFilamentName`/`fmtNum` (Task 2), `DataTable`/`textCell`/`numberCell` (Task 12).
- Produces: default-exported `Materiais` page.

- [ ] **Step 1: Write `src/pages/Materiais.jsx`**

```jsx
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
```

- [ ] **Step 2: Modify `src/App.jsx`** — add the route (inside the `AppLayout` nested `<Route path="/*">`)

```jsx
<Route path="materiais" element={<Materiais />} />
```
(add `import Materiais from '@/pages/Materiais'`)

- [ ] **Step 3: Verify manually**

Run `npm run dev`, navigate to Materiais. Add a material typing "azul" in cor — swatch updates live. Submit — appears in the table below, count increments. Edit the estoque field to `50` and blur — turns red (low stock). Delete it — row animates out, empty state reappears.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Materiais.jsx src/App.jsx
git commit -m "Add Materiais CRUD page"
```

---

### Task 14: `Produtos.jsx` — product catalog CRUD page

**Files:**
- Create: `src/pages/Produtos.jsx`
- Modify: `src/App.jsx` (add `/produtos` route)

**Interfaces:**
- Consumes: `useCollection('products')` (Task 10), `DataTable`/`textCell`/`numberCell` (Task 12).
- Produces: default-exported `Produtos` page.

- [ ] **Step 1: Write `src/pages/Produtos.jsx`**

```jsx
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

  async function handleAdd() {
    if (!nome.trim()) return
    await add({ nome: nome.trim(), preco: parseFloat(preco) || 0, custo: parseFloat(custo) || 0 })
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
```

- [ ] **Step 2: Modify `src/App.jsx`** — add `<Route path="produtos" element={<Produtos />} />` and its import.

- [ ] **Step 3: Verify manually**

Run `npm run dev`, navigate to Produtos, add a product, confirm it appears and is editable/deletable like Materiais.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Produtos.jsx src/App.jsx
git commit -m "Add Produtos CRUD page"
```

---

### Task 15: `Pedidos.jsx` — orders CRUD page

**Files:**
- Create: `src/pages/Pedidos.jsx`
- Modify: `src/App.jsx` (add `/pedidos` route)

**Interfaces:**
- Consumes: `useCollection('orders')` (Task 10), `waLink`/`pedidoRowFlag` (Task 2), `DataTable`/`textCell`/`numberCell`/`dateCell`/`selectCell` (Task 12).
- Produces: default-exported `Pedidos` page.

- [ ] **Step 1: Write `src/pages/Pedidos.jsx`**

```jsx
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
```

- [ ] **Step 2: Modify `src/App.jsx`** — add `<Route path="pedidos" element={<Pedidos />} />` and its import.

- [ ] **Step 3: Verify manually**

Run `npm run dev`, navigate to Pedidos, add an order with a phone number and a past-due `Prazo` date — confirm the WhatsApp icon links to `wa.me/55<numbers>` and opens in a new tab, change status via the dropdown, edit/delete a row.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Pedidos.jsx src/App.jsx
git commit -m "Add Pedidos CRUD page"
```

---

### Task 16: `Vendas.jsx` — sales CRUD page (with order linkage)

**Files:**
- Create: `src/pages/Vendas.jsx`
- Modify: `src/App.jsx` (add `/vendas` route)

**Interfaces:**
- Consumes: `useCollection('sales')`, `useCollection('orders')`, `useCollection('products')` (Task 10), `fmtBRL` (Task 2), `DataTable`/`textCell`/`numberCell`/`dateCell` (Task 12).
- Produces: default-exported `Vendas` page.

- [ ] **Step 1: Write `src/pages/Vendas.jsx`**

```jsx
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import DataTable, { textCell, numberCell, dateCell } from '@/components/shared/DataTable'
import { useCollection } from '@/hooks/useCollection'
import { fmtBRL } from '@/lib/format'

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
    if (!produto.trim() && !comprador.trim()) return
    await add({
      data, produto: produto.trim(), comprador: comprador.trim(), contato: contato.trim(),
      valor: parseFloat(valor) || 0, pedidoId: pedidoId || null,
    })
    if (pedidoId) await updateOrder(pedidoId, { status: 'Entregue' })
    setPedidoId(''); setData(''); setProduto(''); setComprador(''); setContato(''); setValor('0')
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
          <Button onClick={handleAdd} className="lg:col-span-6">Registrar</Button>
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
            <span className="font-mono text-xs text-muted-foreground">{sales.length}</span>
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
```

- [ ] **Step 2: Modify `src/App.jsx`** — add `<Route path="vendas" element={<Vendas />} />` and its import.

- [ ] **Step 3: Verify manually**

Run `npm run dev`. Create a Pedido, then in Vendas select it from "Pedido relacionado" — confirm produto/comprador/valor auto-fill. Submit — confirm the sale appears, the total updates, and (navigate to Pedidos) the linked order's status is now "Entregue".

- [ ] **Step 4: Commit**

```bash
git add src/pages/Vendas.jsx src/App.jsx
git commit -m "Add Vendas CRUD page with order linkage"
```

---

## Phase D — Calculadora (pricing, `.gcode` import, PDF orçamento)

### Task 17: `src/lib/gcode.js` — `.gcode` parsing (ported from `script.js`)

**Files:**
- Create: `src/lib/gcode.js`
- Create: `src/lib/gcode.test.js`

**Interfaces:**
- Consumes: `hexToRgb`, `colorDistance`, `findClosestMaterial` (Task 2, `format.js`).
- Produces: `parseGcode(text)` → `{ timeHours, weights[], colors[], slicer, estimated, colorsFound }`, `parseTimeToHours(str)`, `lengthMetersToGrams(lengthM, densityGcm3, diameterMm)`. Consumed by `Calculadora.jsx` (Task 20).

- [ ] **Step 1: Write the failing tests in `src/lib/gcode.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { parseGcode, parseTimeToHours, lengthMetersToGrams } from './gcode.js'

describe('parseTimeToHours', () => {
  it('parses days/hours/minutes', () => {
    expect(parseTimeToHours('1d 2h 30m')).toBeCloseTo(26.5, 5)
  })
  it('parses hours and minutes only', () => {
    expect(parseTimeToHours('9h 12m')).toBeCloseTo(9.2, 5)
  })
})

describe('lengthMetersToGrams', () => {
  it('converts filament length to weight using default PLA density', () => {
    expect(lengthMetersToGrams(1)).toBeCloseTo(2.98, 1)
  })
})

describe('parseGcode', () => {
  it('parses Bambu/Orca-style time, weight, and color comments', () => {
    const text = `
; model printing time: 9h 12m
; total filament weight [g]: 130.5, 42.0
; filament_colour = #FF2438;#1D63D1
`
    const r = parseGcode(text)
    expect(r.timeHours).toBeCloseTo(9.2, 5)
    expect(r.weights).toEqual([130.5, 42.0])
    expect(r.colors).toEqual(['#ff2438', '#1d63d1'])
    expect(r.colorsFound).toBe(true)
    expect(r.estimated).toBe(false)
  })

  it('parses Cura-style time and estimates weight from filament length', () => {
    const text = `
;TIME:33120
;Filament used: 4.2m
`
    const r = parseGcode(text)
    expect(r.timeHours).toBeCloseTo(9.2, 1)
    expect(r.weights.length).toBe(1)
    expect(r.estimated).toBe(true)
    expect(r.slicer).toBe('Cura')
  })

  it('returns nulls when nothing recognizable is found', () => {
    const r = parseGcode('; just a random comment')
    expect(r.timeHours).toBeNull()
    expect(r.weights).toEqual([])
  })

  it('drops near-zero AMS slots so colors stay aligned with weights', () => {
    const text = `
; total filament weight [g]: 130.5, 0.00, 42.0
; filament_colour = #FF2438;#00FF00;#1D63D1
`
    const r = parseGcode(text)
    expect(r.weights).toEqual([130.5, 42.0])
    expect(r.colors).toEqual(['#ff2438', '#1d63d1'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/gcode.test.js`
Expected: FAIL — `gcode.js` doesn't exist yet.

- [ ] **Step 3: Write `src/lib/gcode.js`**

```js
export function parseTimeToHours(str) {
  let h = 0
  const d = str.match(/(\d+)\s*d/i); if (d) h += parseInt(d[1]) * 24
  const hh = str.match(/(\d+)\s*h/i); if (hh) h += parseInt(hh[1])
  const mm = str.match(/(\d+)\s*m(?!s)/i); if (mm) h += parseInt(mm[1]) / 60
  const ss = str.match(/(\d+)\s*s/i); if (ss) h += parseInt(ss[1]) / 3600
  return h
}

export function lengthMetersToGrams(lengthM, densityGcm3 = 1.24, diameterMm = 1.75) {
  const areaMm2 = Math.PI * Math.pow(diameterMm / 2, 2)
  const volumeMm3 = (lengthM * 1000) * areaMm2
  const volumeCm3 = volumeMm3 / 1000
  return volumeCm3 * densityGcm3
}

export function parseGcode(text) {
  const result = { timeHours: null, weights: [], colors: [], slicer: null, estimated: false, colorsFound: false }

  let m = text.match(/;\s*model printing time:\s*([^;\n]+)/i)
  if (!m) m = text.match(/;\s*total estimated time:\s*([^;\n]+)/i)
  if (!m) m = text.match(/;\s*estimated printing time \(normal mode\)\s*=\s*([^\n]+)/i)
  if (m) { result.timeHours = parseTimeToHours(m[1]); result.slicer = 'Bambu Studio / OrcaSlicer / PrusaSlicer' }

  let wm = text.match(/;\s*total filament weight \[g\]\s*:\s*([\d.,\s]+)/i)
  if (!wm) wm = text.match(/;\s*filament used \[g\]\s*=\s*([\d.,\s]+)/i)
  let rawWeights = []
  if (wm) {
    rawWeights = wm[1].split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
    if (!result.slicer) result.slicer = 'Bambu Studio / OrcaSlicer / PrusaSlicer'
  }

  let cm = text.match(/;\s*filament_colou?r\s*=\s*([^\n]+)/i)
  let rawColors = []
  if (cm) {
    rawColors = cm[1].split(/[;,]/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => (s.startsWith('#') ? s : '#' + s).slice(0, 7))
      .filter(s => /^#[0-9a-fA-F]{6}$/.test(s))
    if (rawColors.length) result.colorsFound = true
  }

  if (result.timeHours === null) {
    const tm = text.match(/;TIME:(\d+)/i)
    if (tm) { result.timeHours = parseInt(tm[1]) / 3600; result.slicer = result.slicer || 'Cura' }
  }

  if (rawWeights.length === 0) {
    const lm = text.match(/;\s*Filament used:\s*([\d.,\s m]+)/i)
    if (lm) {
      const lengths = lm[1].split(',').map(s => parseFloat(s)).filter(n => !isNaN(n))
      if (lengths.length) {
        rawWeights = lengths.map(l => Math.round(lengthMetersToGrams(l) * 100) / 100)
        result.estimated = true
        result.slicer = result.slicer || 'Cura'
      }
    }
  }

  rawWeights.forEach((w, i) => {
    if (w > 0.05) {
      result.weights.push(w)
      result.colors.push(rawColors[i] || null)
    }
  })

  return result
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/gcode.test.js`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/gcode.js src/lib/gcode.test.js
git commit -m "Add gcode.js parser ported from script.js, with unit tests"
```

---

### Task 18: `src/lib/calc.js` — pricing/margin calculation (ported from `calculate()` in `script.js`)

**Files:**
- Create: `src/lib/calc.js`
- Create: `src/lib/calc.test.js`

**Interfaces:**
- Produces: `calculatePricing(input)` → cost breakdown object (pure function — takes the calculator's form state, returns everything the result panel needs to render). Consumed by `Calculadora.jsx` (Task 20).

- [ ] **Step 1: Write the failing tests in `src/lib/calc.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { calculatePricing } from './calc.js'

const baseInput = {
  colorWeights: [130], colorPrices: [140],
  purgeGramsPerSwap: 8,
  printHours: 9, energyRate: 1,
  printerCost: 4800, printerLife: 8000,
  nozzleCost: 200, nozzleLife: 1500,
  laborRate: 1, laborHours: 1.5,
  insumos: 0, frete: 0, riscoPct: 7,
  margin: 80, sellPrice: null,
}

describe('calculatePricing', () => {
  it('computes cost breakdown and derives price from margin', () => {
    const r = calculatePricing(baseInput)
    expect(r.materialCost).toBeCloseTo((130 / 1000) * 140, 5)
    expect(r.hours).toBeCloseTo(9 + 5 / 60, 5)
    expect(r.totalWeightUsed).toBeCloseTo(130, 5)
    expect(r.price).toBeGreaterThan(r.totalCost)
    expect(r.margin).toBe(80)
  })

  it('derives margin from a manually set sell price', () => {
    const r = calculatePricing({ ...baseInput, sellPrice: 100, priceIsManual: true })
    expect(r.price).toBe(100)
    expect(r.profit).toBeCloseTo(100 - r.totalCost, 5)
  })

  it('adds purge loss for multi-color prints', () => {
    const single = calculatePricing(baseInput)
    const multi = calculatePricing({ ...baseInput, colorWeights: [80, 50], colorPrices: [140, 140] })
    expect(multi.totalWeightUsed).toBeGreaterThan(single.totalWeightUsed)
    expect(multi.totalWeightUsed).toBeCloseTo(80 + 50 + 8, 5)
  })

  it('reports a negative margin as a loss', () => {
    const r = calculatePricing({ ...baseInput, sellPrice: 1, priceIsManual: true })
    expect(r.marginOfPricePct).toBeLessThan(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/calc.test.js`
Expected: FAIL — `calc.js` doesn't exist yet.

- [ ] **Step 3: Write `src/lib/calc.js`**

```js
const LEVELING_HOURS = 5 / 60

export function calculatePricing(input) {
  const {
    colorWeights, colorPrices, purgeGramsPerSwap = 8,
    printHours, energyRate, printerCost, printerLife, nozzleCost, nozzleLife,
    laborRate, laborHours, insumos, frete, riscoPct,
    margin, sellPrice, priceIsManual = false,
  } = input

  const nColors = colorWeights.length
  let totalWeight = 0, weightedPriceSum = 0
  colorWeights.forEach((w, i) => { totalWeight += w; weightedPriceSum += colorPrices[i] })
  const avgPrice = weightedPriceSum / nColors
  const purgeGrams = nColors > 1 ? purgeGramsPerSwap * (nColors - 1) : 0

  let materialCost = 0
  colorWeights.forEach((w, i) => { materialCost += (w / 1000) * colorPrices[i] })
  materialCost += (purgeGrams / 1000) * avgPrice

  const totalWeightUsed = totalWeight + purgeGrams

  const hours = printHours + LEVELING_HOURS
  const energyCost = hours * energyRate
  const printerDep = hours * (printerCost / printerLife)
  const nozzleDep = hours * (nozzleCost / nozzleLife)
  const depreciationTotal = printerDep + nozzleDep
  const laborCost = laborRate * laborHours

  const costBeforeRisk = materialCost + energyCost + laborCost + insumos + depreciationTotal
  const riscoValue = costBeforeRisk * (riscoPct / 100)
  const totalCost = costBeforeRisk + riscoValue + frete

  let finalMargin, price
  if (priceIsManual) {
    price = sellPrice || 0
    finalMargin = totalCost > 0 ? ((price / totalCost) - 1) * 100 : 0
  } else {
    finalMargin = margin
    price = totalCost * (1 + margin / 100)
  }

  const profit = price - totalCost
  const marginOfPricePct = price > 0 ? (profit / price) * 100 : 0
  const markupPct = totalCost > 0 ? (profit / totalCost) * 100 : 0

  return {
    materialCost, energyCost, laborCost, insumos, depreciationTotal, riscoValue, frete,
    totalCost, hours, totalWeightUsed, purgeGrams,
    price, margin: finalMargin, profit, marginOfPricePct, markupPct,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/calc.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/calc.js src/lib/calc.test.js
git commit -m "Add calc.js pricing engine ported from script.js, with unit tests"
```

---

### Task 19: `src/lib/pdf.js` — orçamento/relatório PDF generation (ported from `script.js`)

**Files:**
- Create: `src/lib/pdf.js`

**Interfaces:**
- Consumes: `jsPDF` (`jspdf` package), `fmtBRL` (Task 2).
- Produces: `generateOrcamentoPdf(data)`, `generateRelatorioPdf(data)` — both call `.save(filename)` on a jsPDF document (same file-naming and layout as the original `orcExportBtn`/`relExportBtn` handlers). Consumed by `Calculadora.jsx` (Task 20) and `Relatorio.jsx` (Task 23).

- [ ] **Step 1: Write `src/lib/pdf.js`**

```js
import { jsPDF } from 'jspdf'
import { fmtBRL } from './format'

export function generateOrcamentoPdf({
  numero, empresa, logoDataUrl, cliente, descricao, material, quantidade,
  prazo, validade, forma1, desc1, forma2, desc2, obs, base,
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  let y = 20
  let textX = 15

  if (logoDataUrl) {
    try {
      const props = doc.getImageProperties(logoDataUrl)
      const w = 26, h = (props.height / props.width) * w
      doc.addImage(logoDataUrl, props.fileType, 15, y - 7, w, h)
      textX = 46
    } catch { /* skip broken image */ }
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(20)
  doc.text(empresa, textX, y)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(140)
  doc.text('Gerado por Nass3D', textX, y + 6)

  doc.setTextColor(20); doc.setFont('helvetica', 'bold'); doc.setFontSize(19)
  doc.text('ORÇAMENTO', pageW - 15, y, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(140)
  doc.text(`#${numero} · ${new Date().toLocaleDateString('pt-BR')}`, pageW - 15, y + 6, { align: 'right' })
  if (validade) doc.text(`Válido por: ${validade}`, pageW - 15, y + 11, { align: 'right' })

  y += 20
  doc.setDrawColor(225); doc.line(15, y, pageW - 15, y)
  y += 10

  doc.setTextColor(140); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('PARA', 15, y)
  doc.setTextColor(20); doc.setFont('helvetica', 'normal'); doc.setFontSize(12)
  doc.text(cliente, 15, y + 6)
  y += 18

  const rows = [
    ['Descrição', descricao],
    ['Material', material || '—'],
    ['Quantidade', String(quantidade)],
    ['Prazo de entrega', prazo || '—'],
  ]
  rows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(140)
    doc.text(label, 15, y)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(20)
    doc.text(String(val), 65, y)
    y += 7.5
  })

  y += 5
  doc.setDrawColor(225); doc.line(15, y, pageW - 15, y)
  y += 12

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.setTextColor(20)
  doc.text('Valor do orçamento', 15, y)
  doc.setFontSize(17)
  doc.text(fmtBRL(base), pageW - 15, y, { align: 'right' })
  y += 11

  if (forma1) {
    const val1 = base * (1 - desc1 / 100)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(90)
    doc.text(`${forma1}${desc1 > 0 ? ` — ${desc1}% de desconto` : ''}`, 15, y)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(20)
    doc.text(fmtBRL(val1), pageW - 15, y, { align: 'right' })
    y += 7
  }
  if (forma2) {
    const val2 = base * (1 - desc2 / 100)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(90)
    doc.text(`${forma2}${desc2 > 0 ? ` — ${desc2}% de desconto` : ''}`, 15, y)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(20)
    doc.text(fmtBRL(val2), pageW - 15, y, { align: 'right' })
    y += 7
  }

  if (obs) {
    y += 7
    doc.setDrawColor(225); doc.line(15, y, pageW - 15, y)
    y += 10
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(140)
    doc.text('OBSERVAÇÕES', 15, y)
    y += 6
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(20)
    doc.text(doc.splitTextToSize(obs, pageW - 30), 15, y)
  }

  doc.save(`orcamento-${numero}-${cliente.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}

export function generateRelatorioPdf({ ym, mesLabel, receita, lucro, totalCriados, fechados, perdidos, emAberto }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  let y = 20

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(20)
  doc.text('Relatório mensal', 15, y)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(140)
  doc.text(mesLabel, 15, y + 7)
  doc.text(`Gerado por Nass3D em ${new Date().toLocaleDateString('pt-BR')}`, pageW - 15, y, { align: 'right' })

  y += 20
  doc.setDrawColor(225); doc.line(15, y, pageW - 15, y)
  y += 14

  const rows = [
    ['Receita do mês', fmtBRL(receita)],
    ['Lucro do mês', fmtBRL(lucro)],
    ['Pedidos criados no mês', String(totalCriados)],
    ['Fechados (Entregue)', String(fechados)],
    ['Perdidos', String(perdidos)],
    ['Ainda em aberto', String(emAberto)],
  ]
  rows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(90)
    doc.text(label, 15, y)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(20)
    doc.text(val, pageW - 15, y, { align: 'right' })
    y += 10
  })

  doc.save(`relatorio-${ym}.pdf`)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/pdf.js
git commit -m "Add pdf.js PDF generators ported from script.js"
```

---

### Task 20: `Calculadora.jsx` — pricing calculator + `.gcode` import + orçamento PDF

**Files:**
- Create: `src/pages/Calculadora.jsx`
- Modify: `src/App.jsx` (add `/calculadora` route)

**Interfaces:**
- Consumes: `calculatePricing` (Task 18), `parseGcode` (Task 17), `generateOrcamentoPdf` (Task 19), `findClosestMaterial`/`fmtBRL`/`fmtNum` (Task 2), `useCollection('materials')`/`useCollection('orders')`/`useSettings` (Task 10).
- Produces: default-exported `Calculadora` page.

- [ ] **Step 1: Write `src/pages/Calculadora.jsx`**

```jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCollection } from '@/hooks/useCollection'
import { useSettings } from '@/hooks/useSettings'
import { calculatePricing } from '@/lib/calc'
import { parseGcode } from '@/lib/gcode'
import { fmtBRL, fmtNum, findClosestMaterial } from '@/lib/format'
import { generateOrcamentoPdf } from '@/lib/pdf'

const COLOR_DEFAULTS = ['#ff2438', '#35c4d4', '#b06bff', '#35d488']
const MARGIN_PRESETS = [
  { mult: 1.5, tag: 'atacado' },
  { mult: 1.8, tag: 'mínimo' },
  { mult: 2.3, tag: 'recomendado' },
  { mult: 3, tag: 'premium' },
  { mult: 4, tag: 'exclusivo' },
]
const COST_PARTS_META = [
  { key: 'materialCost', label: 'Filamento', color: '#35d488' },
  { key: 'energyCost', label: 'Energia', color: '#ff2438' },
  { key: 'laborCost', label: 'Mão de obra', color: '#35c4d4' },
  { key: 'insumos', label: 'Insumos', color: '#b06bff' },
  { key: 'depreciationTotal', label: 'Depreciação', color: '#ff5b5b' },
  { key: 'riscoValue', label: 'Risco de falha', color: '#ffb734' },
  { key: 'frete', label: 'Frete + embalagem', color: '#9195a0' },
]

export default function Calculadora() {
  const { data: materials, update: updateMaterial } = useCollection('materials')
  const { data: orders, add: addOrder } = useCollection('orders')
  const { settings, save: saveSettings } = useSettings()

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
  const [insumos, setInsumos] = useState(0)
  const [frete, setFrete] = useState(0)
  const [risco, setRisco] = useState(7)
  const [margin, setMargin] = useState(80)
  const [gcodeStatus, setGcodeStatus] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [stockMsg, setStockMsg] = useState('')
  const fileInputRef = useRef(null)

  const result = useMemo(() => calculatePricing({
    colorWeights: rows.map(r => r.weight),
    colorPrices: rows.map(r => r.price),
    purgeGramsPerSwap: purgeGrams,
    printHours, energyRate, printerCost, printerLife, nozzleCost, nozzleLife,
    laborRate, laborHours, insumos, frete, riscoPct: risco, margin,
  }), [rows, purgeGrams, printHours, energyRate, printerCost, printerLife, nozzleCost, nozzleLife, laborRate, laborHours, insumos, frete, risco, margin])

  const [sellPriceText, setSellPriceText] = useState(result.price.toFixed(2))
  const sellPriceFocused = useRef(false)
  useEffect(() => {
    if (!sellPriceFocused.current) setSellPriceText(result.price.toFixed(2))
  }, [result.price])

  function handleSellPriceInput(raw) {
    setSellPriceText(raw)
    const price = parseFloat(raw) || 0
    setMargin(result.totalCost > 0 ? Math.round(((price / result.totalCost) - 1) * 100) : 0)
  }

  function setColorCount(n) {
    n = Math.max(1, Math.min(4, n))
    setRows(prev => {
      const next = [...prev]
      while (next.length < n) next.push({ weight: 0, price: 140, colorHex: COLOR_DEFAULTS[next.length], materialId: '' })
      return next.slice(0, n)
    })
  }

  function updateRow(i, patch) { setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r))) }

  function handleMaterialSelect(i, materialId) {
    if (!materialId) { updateRow(i, { materialId: '' }); return }
    const m = materials.find(x => x.id === materialId)
    if (m) updateRow(i, { materialId, colorHex: m.cor, price: m.preco })
  }

  function processGcodeText(text, filename) {
    const r = parseGcode(text)
    if (r.timeHours === null && r.weights.length === 0) {
      setGcodeStatus({ type: 'err', text: `Não consegui identificar tempo/peso em "${filename}". Preencha os campos manualmente.` })
      return
    }
    if (r.timeHours !== null) setPrintHours(Math.round(r.timeHours * 100) / 100)
    let matchedCount = 0
    if (r.weights.length > 0) {
      const n = Math.min(4, r.weights.length)
      const newRows = r.weights.slice(0, n).map((w, i) => {
        const hex = r.colors[i]
        const m = hex ? findClosestMaterial(hex, materials) : null
        if (m) matchedCount++
        return { weight: w, price: m ? m.preco : 140, colorHex: m ? m.cor : (hex || COLOR_DEFAULTS[i]), materialId: m ? m.id : '' }
      })
      setRows(newRows)
    }
    const h = r.timeHours !== null ? `${fmtNum(r.timeHours, 2)}h` : '—'
    const wtxt = r.weights.length ? `${r.weights.map(w => fmtNum(w, 1)).join(' + ')} g (${r.weights.length} ${r.weights.length > 1 ? 'cores' : 'cor'})` : '—'
    const colorNote = (r.weights.length > 1 && !r.colorsFound) ? ' — cores reais não encontradas no arquivo, confira as cores nos seletores' : ''
    const matchNote = matchedCount > 0 ? ` · ${matchedCount} ${matchedCount > 1 ? 'materiais vinculados' : 'material vinculado'} automaticamente` : ''
    setGcodeStatus({
      type: 'ok',
      text: `Detectado via ${r.slicer} em "${filename}": ${h} (+5min de nivelamento no cálculo) · ${wtxt}${colorNote}${matchNote}${r.estimated ? ' (peso estimado a partir do comprimento — confira o valor)' : ''}`,
    })
  }

  function handleFileInput(e) {
    const f = e.target.files[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = ev => processGcodeText(ev.target.result, f.name)
    reader.readAsText(f)
  }
  function handleDrop(e) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = ev => processGcodeText(ev.target.result, f.name)
    reader.readAsText(f)
  }

  async function handleDeductStock() {
    const updates = []
    for (const row of rows) {
      if (row.materialId) {
        const m = materials.find(x => x.id === row.materialId)
        if (m) {
          await updateMaterial(m.id, { estoque: Math.max(0, (m.estoque || 0) - row.weight) })
          updates.push(`${m.nome}: -${fmtNum(row.weight, 1)}g`)
        }
      }
    }
    setStockMsg(updates.length
      ? `Estoque atualizado — ${updates.join(' · ')}`
      : 'Nenhum material vinculado nas cores desta peça — selecione um material no seletor de cada cor pra descontar do estoque.')
  }

  const currentMult = 1 + margin / 100
  const clampedMarginPct = Math.max(0, Math.min(100, result.marginOfPricePct))
  const circumference = 314.16
  const ringColor = result.marginOfPricePct < 0 ? '#ff5b5b'
    : result.marginOfPricePct < 30 ? '#ffb734'
    : result.marginOfPricePct < 50 ? '#35c4d4' : '#35d488'

  let badge
  if (result.marginOfPricePct < 0) badge = { text: 'Prejuízo. O preço não cobre o custo.', color: '#ff5b5b' }
  else if (result.marginOfPricePct < 30) badge = { text: `Margem de ${fmtNum(result.marginOfPricePct, 0)}%. Baixa — considere revisar o preço.`, color: '#ffb734' }
  else if (result.marginOfPricePct < 50) badge = { text: `Margem de ${fmtNum(result.marginOfPricePct, 0)}%. Razoável.`, color: '#35c4d4' }
  else if (result.marginOfPricePct < 70) badge = { text: `Margem de ${fmtNum(result.marginOfPricePct, 0)}%. Boa.`, color: '#35d488' }
  else badge = { text: `Margem de ${fmtNum(result.marginOfPricePct, 0)}%. Excelente.`, color: '#35d488' }

  // ---- orçamento form ----
  const [orcCliente, setOrcCliente] = useState('')
  const [orcDescricao, setOrcDescricao] = useState('')
  const [orcMaterial, setOrcMaterial] = useState('')
  const [orcQuantidade, setOrcQuantidade] = useState(1)
  const [orcPrazo, setOrcPrazo] = useState('')
  const [orcValidade, setOrcValidade] = useState('')
  const [orcForma1, setOrcForma1] = useState('')
  const [orcDesconto1, setOrcDesconto1] = useState('')
  const [orcForma2, setOrcForma2] = useState('')
  const [orcDesconto2, setOrcDesconto2] = useState('')
  const [orcObs, setOrcObs] = useState('')
  const [orcStatus, setOrcStatus] = useState(null)
  const logoInputRef = useRef(null)

  useEffect(() => {
    if (orcMaterial.trim()) return
    const names = [...new Set(rows.map(r => materials.find(m => m.id === r.materialId)?.nome).filter(Boolean))]
    if (names.length) setOrcMaterial(names.join(' + '))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, materials])

  function handleLogoFile(e) {
    const f = e.target.files[0]; if (!f) return
    if (f.size > 3 * 1024 * 1024) { setOrcStatus({ type: 'err', text: 'Essa imagem é muito grande — use um arquivo de até 3MB.' }); return }
    const reader = new FileReader()
    reader.onload = ev => saveSettings({ logoDataUrl: ev.target.result })
    reader.readAsDataURL(f)
  }

  async function handleExportOrcamento() {
    if (!orcCliente.trim() || !orcDescricao.trim()) {
      setOrcStatus({ type: 'err', text: 'Preencha ao menos o nome do cliente e a descrição do serviço.' })
      return
    }
    const numero = String((settings.orcamentoNumero || 0) + 1).padStart(3, '0')
    try {
      generateOrcamentoPdf({
        numero, empresa: settings.empresaNome || 'Minha Empresa', logoDataUrl: settings.logoDataUrl,
        cliente: orcCliente.trim(), descricao: orcDescricao.trim(), material: orcMaterial.trim(),
        quantidade: orcQuantidade, prazo: orcPrazo.trim(), validade: orcValidade.trim(),
        forma1: orcForma1.trim(), desc1: parseFloat(orcDesconto1) || 0,
        forma2: orcForma2.trim(), desc2: parseFloat(orcDesconto2) || 0,
        obs: orcObs.trim(), base: result.price,
      })
      await saveSettings({ orcamentoNumero: (settings.orcamentoNumero || 0) + 1 })
      await addOrder({
        cliente: orcCliente.trim(), telefone: '', item: `#${numero} ${orcDescricao.trim()}${orcQuantidade > 1 ? ` (${orcQuantidade}x)` : ''}`,
        prazo: '', status: 'Orçamento', valor: result.price, criadoEm: new Date().toISOString(),
      })
      setOrcStatus({ type: 'ok', text: 'PDF exportado e orçamento salvo na aba Pedidos.' })
    } catch {
      setOrcStatus({ type: 'err', text: 'Não consegui gerar o PDF agora — tente de novo.' })
    }
  }

  const val1 = result.price * (1 - (parseFloat(orcDesconto1) || 0) / 100)
  const val2 = result.price * (1 - (parseFloat(orcDesconto2) || 0) / 100)

  return (
    <div>
      <p className="mb-5 max-w-2xl text-sm text-muted-foreground">
        Preencha os campos com os dados da sua impressão ou arraste o .gcode pra puxar tempo, peso e cor de cada filamento sozinho.
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <div className="space-y-4">
          <Card className="glass-panel p-5">
            <CardContent className="p-0">
              <SectionTitle>Importar do fatiador</SectionTitle>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex cursor-pointer items-center gap-3.5 rounded-lg border border-dashed p-5 transition-colors ${dragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-primary hover:bg-primary/5'}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <UploadCloud size={18} />
                </div>
                <div>
                  <strong className="block text-sm">Arraste o .gcode aqui</strong>
                  <span className="text-xs text-muted-foreground">Bambu Studio, Orca, Prusa ou Cura — puxa tempo, peso e cor sozinho</span>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept=".gcode,.g,.gco,.txt" className="hidden" onChange={handleFileInput} />
              {gcodeStatus && (
                <div className={`mt-3 rounded-lg border px-3 py-2.5 text-xs leading-relaxed ${gcodeStatus.type === 'ok' ? 'border-success/40 bg-success/10 text-success' : 'border-destructive/40 bg-destructive/10 text-destructive'}`}>
                  {gcodeStatus.text}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel p-5">
            <CardContent className="p-0">
              <SectionTitle>Filamento</SectionTitle>
              <Label className="mb-2 block">Número de cores da peça</Label>
              <div className="mb-4 flex gap-1 rounded-lg border border-border bg-white/[0.03] p-1">
                {[1, 2, 3, 4].map(n => (
                  <button key={n} onClick={() => setColorCount(n)}
                    className={`flex-1 rounded-md py-1.5 font-mono text-sm transition-colors ${rows.length === n ? 'bg-primary font-semibold text-white' : 'text-muted-foreground hover:text-foreground'}`}>
                    {n}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {rows.map((row, i) => (
                  <div key={i} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="mb-2.5 flex items-end gap-2.5">
                      <input type="color" value={row.colorHex} onChange={e => updateRow(i, { colorHex: e.target.value, materialId: '' })}
                        className="h-9 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent p-1" />
                      <div className="flex-1 space-y-1">
                        <Label className="text-[11px]">Material salvo (opcional)</Label>
                        <Select value={row.materialId || '__none'} onValueChange={v => handleMaterialSelect(i, v === '__none' ? '' : v)}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Cor/preço manual" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">Cor/preço manual</SelectItem>
                            {materials.map(m => <SelectItem key={m.id} value={m.id}>{m.nome} — R${fmtNum(m.preco, 0)}/kg</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-[11px]">Peso cor {i + 1} (g)</Label>
                        <Input type="number" step="0.1" min="0" value={row.weight} onChange={e => updateRow(i, { weight: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Preço filamento (R$/kg)</Label>
                        <Input type="number" step="1" min="0" value={row.price} onChange={e => updateRow(i, { price: parseFloat(e.target.value) || 0 })} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {rows.length > 1 && (
                <>
                  <div className="mt-4 rounded-lg border border-primary/25 bg-primary/10 p-3 text-xs leading-relaxed text-muted-foreground">
                    🎨 Trocas de cor geram perda de filamento na purga. Some essa perda por troca abaixo — ela entra automaticamente no custo de material.
                  </div>
                  <div className="mt-3 space-y-1">
                    <Label>Perda de filamento por troca de cor (g)</Label>
                    <Input type="number" step="0.5" min="0" value={purgeGrams} onChange={e => setPurgeGrams(parseFloat(e.target.value) || 0)} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel p-5">
            <CardContent className="p-0">
              <SectionTitle>Impressão</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tempo de impressão (horas)"><Input type="number" step="0.1" min="0" value={printHours} onChange={e => setPrintHours(parseFloat(e.target.value) || 0)} /></Field>
                <Field label="Energia por hora (R$)"><Input type="number" step="0.1" min="0" value={energyRate} onChange={e => setEnergyRate(parseFloat(e.target.value) || 0)} /></Field>
              </div>
              <p className="mt-2.5 text-xs text-muted-foreground">O cálculo soma automaticamente +5 min ao tempo pra cobrir o nivelamento automático da mesa.</p>
            </CardContent>
          </Card>

          <Card className="glass-panel p-5">
            <CardContent className="p-0">
              <SectionTitle>Depreciação de equipamento</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor da impressora (R$)"><Input type="number" step="1" min="0" value={printerCost} onChange={e => setPrinterCost(parseFloat(e.target.value) || 0)} /></Field>
                <Field label="Vida útil (horas)"><Input type="number" step="1" min="1" value={printerLife} onChange={e => setPrinterLife(parseFloat(e.target.value) || 1)} /></Field>
                <Field label="Valor do bico (R$)"><Input type="number" step="1" min="0" value={nozzleCost} onChange={e => setNozzleCost(parseFloat(e.target.value) || 0)} /></Field>
                <Field label="Vida útil do bico (horas)"><Input type="number" step="1" min="1" value={nozzleLife} onChange={e => setNozzleLife(parseFloat(e.target.value) || 1)} /></Field>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel p-5">
            <CardContent className="p-0">
              <SectionTitle>Mão de obra</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor da sua hora (R$)"><Input type="number" step="0.5" min="0" value={laborRate} onChange={e => setLaborRate(parseFloat(e.target.value) || 0)} /></Field>
                <Field label="Acabamento + montagem (horas)"><Input type="number" step="0.1" min="0" value={laborHours} onChange={e => setLaborHours(parseFloat(e.target.value) || 0)} /></Field>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel p-5">
            <CardContent className="p-0">
              <SectionTitle>Custos extras</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Insumos (R$)"><Input type="number" step="0.5" min="0" value={insumos} onChange={e => setInsumos(parseFloat(e.target.value) || 0)} /></Field>
                <Field label="Frete + embalagem (R$)"><Input type="number" step="0.5" min="0" value={frete} onChange={e => setFrete(parseFloat(e.target.value) || 0)} /></Field>
              </div>
              <div className="mt-3">
                <Field label="Risco de falha (% sobre o custo)"><Input type="number" step="1" min="0" value={risco} onChange={e => setRisco(parseFloat(e.target.value) || 0)} /></Field>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel p-5">
            <CardContent className="p-0">
              <SectionTitle>Margem de lucro</SectionTitle>
              <Label className="mb-2 block">Sugestões de multiplicador</Label>
              <div className="mb-4 grid grid-cols-5 gap-2">
                {MARGIN_PRESETS.map(p => {
                  const active = Math.abs(p.mult - currentMult) < 0.02
                  return (
                    <button key={p.mult} onClick={() => setMargin(Math.round((p.mult - 1) * 100))}
                      className={`flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2.5 transition-colors ${active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                      <span className={`font-mono text-sm font-semibold ${active ? 'text-primary' : ''}`}>{fmtNum(p.mult, 1)}x</span>
                      <span className={`text-[9px] uppercase ${active ? 'text-primary' : 'text-muted-foreground'}`}>{p.tag}</span>
                    </button>
                  )
                })}
              </div>
              <Field label="Markup sobre o custo (%)">
                <Input type="number" step="1" min="0" value={margin} onChange={e => setMargin(parseFloat(e.target.value) || 0)} />
              </Field>
              <p className="mt-2 text-xs text-muted-foreground">
                {margin}% de markup = multiplicador de <b className="text-foreground">{fmtNum(currentMult, 2).replace(/,00$/, '')}x</b> sobre o custo total.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6">
          <Card className="glass-panel p-5">
            <CardContent className="p-0">
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

              <div className="mb-3.5 flex items-center gap-4 rounded-lg border p-4" style={{ borderColor: `${ringColor}40`, background: `linear-gradient(135deg, ${ringColor}18, transparent)` }}>
                <div className="relative h-[92px] w-[92px] shrink-0">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#2a2c30" strokeWidth="12" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke={ringColor} strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={circumference} strokeDashoffset={circumference * (1 - clampedMarginPct / 100)}
                      style={{ transition: 'stroke-dashoffset .5s cubic-bezier(.4,0,.2,1), stroke .3s ease' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-ui text-xl font-bold" style={{ color: ringColor }}>{fmtNum(result.marginOfPricePct, 0)}%</div>
                    <div className="font-mono text-[8px] tracking-wide text-muted-foreground">MARGEM</div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Lucro líquido</div>
                  <div className="font-mono text-2xl font-bold" style={{ color: result.profit >= 0 ? '#35d488' : ringColor }}>
                    {result.profit >= 0 ? '+' : ''}{fmtBRL(result.profit)}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">markup de <b className="text-foreground">{fmtNum(result.markupPct, 0)}%</b> sobre o custo</div>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-semibold" style={{ color: badge.color, borderColor: `${badge.color}55`, background: `${badge.color}18` }}>
                <span>{result.marginOfPricePct < 30 ? '⚠' : '✓'}</span><span>{badge.text}</span>
              </div>

              <div className="mb-2.5 flex items-baseline justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                <span>Composição do custo</span>
                <span className="font-mono text-sm font-semibold text-foreground">{fmtBRL(result.totalCost)}</span>
              </div>
              <div className="mb-4 flex h-2.5 overflow-hidden rounded-full">
                {COST_PARTS_META.map(p => {
                  const pct = result.totalCost > 0 ? (result[p.key] / result.totalCost) * 100 : 0
                  return <div key={p.key} style={{ width: `${pct}%`, background: p.color }} />
                })}
              </div>
              <div className="mb-1 space-y-2.5">
                {COST_PARTS_META.map(p => {
                  const pct = result.totalCost > 0 ? (result[p.key] / result.totalCost) * 100 : 0
                  return (
                    <div key={p.key} className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center text-muted-foreground">
                        <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />{p.label}
                      </span>
                      <span className="flex items-center gap-2.5">
                        {pct > 0 && <span className="font-mono text-[11px] text-muted-foreground">{fmtNum(pct, 0)}%</span>}
                        <span className="font-mono">{fmtBRL(result[p.key])}</span>
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="my-4 h-px bg-border" />
              <Row k="Tempo de máquina (com nivelamento)" v={`${fmtNum(result.hours, 2)}h`} />
              <Row k="Peso total usado (com purga)" v={`${fmtNum(result.totalWeightUsed, 1)} g`} />

              <Button variant="outline" className="mt-3 w-full border-primary text-primary hover:bg-primary hover:text-white" onClick={handleDeductStock}>
                Registrar impressão (descontar do estoque)
              </Button>
              {stockMsg && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{stockMsg}</p>}

              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                Cálculo simples de referência — impostos sobre a venda não estão incluídos. O desconto de estoque considera só o peso por cor vinculado a um material.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="glass-panel mt-4 p-5">
        <CardContent className="p-0">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-2.5">
            <span className="font-ui text-sm font-bold uppercase tracking-wide">📄 Gerar Orçamento em PDF</span>
            <span className="font-mono text-xs text-muted-foreground">#{String((settings.orcamentoNumero || 0) + 1).padStart(3, '0')}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Logo da sua empresa (opcional)">
              <div onClick={() => logoInputRef.current?.click()}
                className="flex min-h-[78px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-border p-4 text-center transition-colors hover:border-primary hover:bg-primary/5">
                {settings.logoDataUrl
                  ? <img src={settings.logoDataUrl} alt="logo" className="max-h-[60px] max-w-full rounded" />
                  : <div><div className="text-lg">🖼️</div><div className="text-xs text-muted-foreground">Clique para enviar sua logo</div></div>}
              </div>
              <input ref={logoInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoFile} />
              {settings.logoDataUrl && (
                <button onClick={() => saveSettings({ logoDataUrl: '' })} className="mt-1.5 text-[11px] text-muted-foreground hover:text-destructive">remover logo</button>
              )}
            </Field>
            <Field label="Sua empresa / seu nome">
              <Input value={settings.empresaNome} onChange={e => saveSettings({ empresaNome: e.target.value })} placeholder="Ex: João 3D Prints" />
            </Field>
          </div>

          <div className="mt-3"><Field label="Nome do cliente"><Input value={orcCliente} onChange={e => setOrcCliente(e.target.value)} placeholder="Ex: Maria Silva" /></Field></div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Descrição do serviço"><Input value={orcDescricao} onChange={e => setOrcDescricao(e.target.value)} placeholder="Ex: Suporte para celular" /></Field>
            <Field label="Material"><Input value={orcMaterial} onChange={e => setOrcMaterial(e.target.value)} placeholder="Ex: PLA Branco" /></Field>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Quantidade"><Input type="number" step="1" min="1" value={orcQuantidade} onChange={e => setOrcQuantidade(parseInt(e.target.value) || 1)} /></Field>
            <Field label="Prazo de entrega"><Input value={orcPrazo} onChange={e => setOrcPrazo(e.target.value)} placeholder="Ex: 5 dias úteis" /></Field>
          </div>
          <div className="mt-3"><Field label="Validade do orçamento (opcional)"><Input value={orcValidade} onChange={e => setOrcValidade(e.target.value)} placeholder="Ex: 7 dias" /></Field></div>

          <div className="mb-3 mt-5 border-b border-border pb-2.5 font-ui text-sm font-bold uppercase tracking-wide">$ Formas de Pagamento</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Forma de pagamento 1"><Input value={orcForma1} onChange={e => setOrcForma1(e.target.value)} placeholder="Ex: Pix" /></Field>
            <Field label="Desconto (opcional)"><Input type="number" step="1" min="0" max="100" value={orcDesconto1} onChange={e => setOrcDesconto1(e.target.value)} placeholder="Ex: 5" /></Field>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Forma de pagamento 2 (opcional)"><Input value={orcForma2} onChange={e => setOrcForma2(e.target.value)} placeholder="Ex: Cartão 2x" /></Field>
            <Field label="Desconto (opcional)"><Input type="number" step="1" min="0" max="100" value={orcDesconto2} onChange={e => setOrcDesconto2(e.target.value)} placeholder="Ex: 0" /></Field>
          </div>
          <div className="mt-3">
            <Field label="Observações (opcional)"><Textarea rows={3} value={orcObs} onChange={e => setOrcObs(e.target.value)} placeholder="Ex: Acabamento lixado e pintado." /></Field>
          </div>

          <div className="my-4 rounded-lg border border-border bg-white/[0.03] px-3.5 py-3 text-sm leading-relaxed text-muted-foreground">
            Valor do orçamento: <b className="text-foreground">{fmtBRL(result.price)}</b><br />
            {orcForma1 || 'Forma de pagamento 1'}{parseFloat(orcDesconto1) > 0 ? ` (${orcDesconto1}% off)` : ''}: <b className="text-foreground">{fmtBRL(val1)}</b>
            {orcForma2 && <><br />{orcForma2}{parseFloat(orcDesconto2) > 0 ? ` (${orcDesconto2}% off)` : ''}: <b className="text-foreground">{fmtBRL(val2)}</b></>}
          </div>

          <Button className="w-full" onClick={handleExportOrcamento}>📄 Exportar Orçamento em PDF</Button>
          {orcStatus && (
            <div className={`mt-2.5 rounded-lg px-3 py-2.5 text-xs leading-relaxed ${orcStatus.type === 'ok' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
              {orcStatus.text}
            </div>
          )}
          <p className="mt-2.5 text-xs text-muted-foreground">
            Gera o PDF e também salva este orçamento na aba Pedidos com status "Orçamento".
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function SectionTitle({ children }) {
  return <div className="mb-4 border-b border-border pb-2.5 font-ui text-sm font-bold uppercase tracking-wide">{children}</div>
}
function Field({ label, children }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>
}
function Row({ k, v }) {
  return <div className="mb-2 flex justify-between text-[13px]"><span className="text-muted-foreground">{k}</span><span className="font-mono">{v}</span></div>
}
```

- [ ] **Step 2: Modify `src/App.jsx`** — add `<Route path="calculadora" element={<Calculadora />} />` and its import.

- [ ] **Step 3: Verify manually**

Run `npm run dev`, navigate to Calculadora:
- Default values compute a non-zero cost/price on load, donut ring and quality badge render.
- Change "Número de cores" to 2 — a second color row appears, purge note/field appears, cost updates.
- Click a margin preset — margin field updates, preset button highlights.
- Type directly into "Quanto vou cobrar" — margin field updates to match.
- Drag-and-drop a `.gcode` file (use `Monster Branco.gcode` from `C:\Users\User\Downloads` if available, or any real slicer export) — confirm time/weight/colors populate and the status message shows.
- Fill the orçamento form (cliente + descrição required) and click "Exportar Orçamento em PDF" — confirm a PDF downloads and a new "Orçamento" order appears (check the Pedidos page).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Calculadora.jsx src/App.jsx
git commit -m "Add Calculadora page with gcode import, pricing, and orçamento PDF export"
```

---

## Phase E — Relatório, transitions, deploy migration

### Task 21: `Relatorio.jsx` — monthly report page

**Files:**
- Create: `src/pages/Relatorio.jsx`
- Modify: `src/App.jsx` (add `/relatorio` route)

**Interfaces:**
- Consumes: `useCollection('sales'/'orders'/'products')` (Task 10), `fmtBRL` (Task 2), `StatCard` (Task 9), `generateRelatorioPdf` (Task 19).
- Produces: default-exported `Relatorio` page.

- [ ] **Step 1: Write `src/pages/Relatorio.jsx`**

```jsx
import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCollection } from '@/hooks/useCollection'
import { fmtBRL } from '@/lib/format'
import StatCard from '@/components/shared/StatCard'
import { generateRelatorioPdf } from '@/lib/pdf'

function currentYm() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
}

export default function Relatorio() {
  const { data: sales } = useCollection('sales')
  const { data: orders } = useCollection('orders')
  const { data: products } = useCollection('products')
  const [ym, setYm] = useState(currentYm())

  const r = useMemo(() => {
    let receita = 0, lucro = 0
    sales.forEach(v => {
      if (v.data && v.data.slice(0, 7) === ym) {
        receita += v.valor || 0
        const prod = products.find(p => p.nome === v.produto)
        if (prod) lucro += (v.valor || 0) - (prod.custo || 0)
      }
    })
    const criadosNoMes = orders.filter(o => o.criadoEm && o.criadoEm.slice(0, 7) === ym)
    const fechados = criadosNoMes.filter(o => o.status === 'Entregue').length
    const perdidos = criadosNoMes.filter(o => o.status === 'Perdido').length
    const emAberto = criadosNoMes.length - fechados - perdidos
    return { receita, lucro, totalCriados: criadosNoMes.length, fechados, perdidos, emAberto }
  }, [sales, orders, products, ym])

  function handleExport() {
    const [yy, mm] = ym.split('-')
    let mesLabel = new Date(yy, mm - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    mesLabel = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)
    generateRelatorioPdf({ ym, mesLabel, ...r })
  }

  return (
    <div>
      <p className="mb-5 max-w-xl text-sm text-muted-foreground">
        Resumo financeiro por mês — receita, lucro e quantos pedidos fecharam ou não.
      </p>

      <Card className="glass-panel p-5">
        <CardContent className="p-0">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-2.5">
            <span className="font-ui text-sm font-bold uppercase tracking-wide">Relatório mensal</span>
            <Input type="month" value={ym} onChange={e => setYm(e.target.value)} className="w-auto" />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatCard label="Receita do mês" value={r.receita} format={fmtBRL} color="text-success" />
            <StatCard label="Lucro do mês" value={r.lucro} format={fmtBRL} color="text-primary" delay={0.03} />
            <StatCard label="Pedidos criados" value={r.totalCriados} format={v => String(Math.round(v))} delay={0.06} />
            <StatCard label="Fechados" value={r.fechados} format={v => String(Math.round(v))} color="text-success" delay={0.09} />
            <StatCard label="Perdidos" value={r.perdidos} format={v => String(Math.round(v))} color="text-destructive" delay={0.12} />
          </div>

          <div className="mb-2.5 text-[11px] uppercase tracking-wide text-muted-foreground">Pedidos criados neste mês</div>
          <div className="mb-5 flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-lg border border-border bg-white/[0.03] px-3.5 py-2.5 text-sm">
              <span>✅ Fechados (Entregue)</span><span className="font-mono font-semibold text-success">{r.fechados}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-white/[0.03] px-3.5 py-2.5 text-sm">
              <span>❌ Perdidos</span><span className="font-mono font-semibold text-destructive">{r.perdidos}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-white/[0.03] px-3.5 py-2.5 text-sm">
              <span>⏳ Ainda em aberto</span><span className="font-mono font-semibold text-warning">{r.emAberto}</span>
            </div>
          </div>

          <div className="flex gap-2.5">
            <Button className="flex-1" onClick={handleExport}>📄 Exportar relatório em PDF</Button>
            <Button variant="outline" onClick={() => window.print()}>🖨️ Imprimir</Button>
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground">
            "Pedidos criados neste mês" considera a data em que cada pedido foi cadastrado no sistema, não a data do prazo de entrega.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Modify `src/App.jsx`** — add `<Route path="relatorio" element={<Relatorio />} />` and its import. At this point every route from the spec exists; double-check the full route list in `App.jsx` matches: `index (Painel)`, `calculadora`, `materiais`, `produtos`, `pedidos`, `vendas`, `relatorio`.

- [ ] **Step 3: Verify manually**

Run `npm run dev`, navigate to Relatório. Change the month picker to a month with no data — all stats show 0. Register a sale dated in the current month (via Vendas), come back to Relatório for the current month — confirm receita/lucro reflect it. Click "Exportar relatório em PDF" — confirm a PDF downloads.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Relatorio.jsx src/App.jsx
git commit -m "Add Relatorio page"
```

---

### Task 22: Page transition animation

**Files:**
- Modify: `src/components/layout/AppLayout.jsx`

**Interfaces:**
- Consumes: `AnimatePresence`/`motion` (framer-motion), `useLocation` (react-router-dom).

- [ ] **Step 1: Modify `src/components/layout/AppLayout.jsx`** — wrap `<Outlet />` in an animated, route-keyed container

```jsx
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:block md:w-60 md:shrink-0 md:border-r md:border-border">
        <Sidebar />
      </aside>

      <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
        <span className="font-display text-sm font-bold">NASS3D</span>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="rounded-lg border border-border p-2 text-muted-foreground">
              <Menu size={18} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 px-5 py-7 md:px-8 md:py-8">
        <div className="mx-auto max-w-5xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify manually**

Run `npm run dev`, click through all 7 nav items — confirm each page fades/slides in smoothly (~250ms) with no flash of unstyled content or layout jump.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/AppLayout.jsx
git commit -m "Add page transition animation to route changes"
```

---

### Task 23: Deploy migration — Vercel env vars, push, verify production

**Files:**
- None created/modified (this task is operational: Vercel dashboard configuration + verification against the live URL).

- [ ] **Step 1: Confirm the production build works locally**

Run: `npm run build`
Expected: succeeds, produces `dist/index.html` and `dist/assets/*`.

Run: `npm run preview`
Expected: serves `dist/` locally (default `http://localhost:4173`); spot-check the login page renders.

- [ ] **Step 2: Add environment variables in the Vercel dashboard**

In the Vercel project (`nass3-d`) → Settings → Environment Variables, add for all environments (Production, Preview, Development):
- `VITE_SUPABASE_URL` = `https://zzngtfwongumucdtqwgk.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = (the same value already in `.env.local`)

This is required because `.env.local` is gitignored — without these, the deployed build throws "Missing VITE_SUPABASE_URL" at load time.

- [ ] **Step 3: Push to trigger deployment**

```bash
cd "/c/Users/User/Downloads/Nass3D"
git push origin main
```
Expected: Vercel detects the new `package.json`/Vite config on this push and switches the project's framework preset from "Other" (static) to "Vite" automatically; a new deployment starts.

- [ ] **Step 4: Verify the live deployment**

Navigate to `https://nass3-d.vercel.app` (a real `https://` URL — not `file://`, so the browser tool's network calls behave normally, unlike the static-snapshot issue hit earlier in this project's history):
- Confirm the new black/red/glass UI loads, login screen shows the real logo.
- Log in with the existing test account (`nass3d.teste.claude@gmail.com`).
- Click through all 7 pages, confirm the sidebar highlights the active page and transitions animate.
- Resize to mobile width, confirm the hamburger/drawer works.
- Spot-check one full CRUD round-trip (add a material, edit it, delete it) to confirm Supabase read/write still works end-to-end against the same tables as before.
- Confirm no errors in the browser console.

- [ ] **Step 5: Commit** (only if Step 1–4 required code fixes; otherwise this task has no commit — it's a deployment/config task)

---

### Task 24: Update `CLAUDE.md` for the new stack

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Rewrite the "Estrutura de arquivos" and related sections** to describe the React/Vite architecture instead of the old plain HTML/CSS/JS one: list `src/lib`, `src/context`, `src/hooks`, `src/components`, `src/pages` with what each directory is responsible for (mirroring the "File Structure" this plan used — `src/lib/*` for business logic, `src/hooks/useCollection.js`/`useSettings.js` for the Supabase data layer, `src/context/AuthContext.jsx` for auth, `src/components/layout` + `src/components/shared` for shared UI, `src/pages/*.jsx` one per route).
- [ ] **Step 2: Update "Persistência"** — same 5 Supabase tables/RLS as before (unchanged), but note the client-side mutation strategy changed from "resave the whole array via diff" to targeted `insert`/`update`/`delete` per row through `useCollection`.
- [ ] **Step 3: Update "Deploy"** — credentials now come from Vercel env vars (`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`) instead of a committed `config.js`; build command is `npm run build` (Vite), not zero-config static.
- [ ] **Step 4: Add a "Design" section** — the color/typography/motif decisions from this plan's Global Constraints (glass panels, rounded corners over the rejected angular motif, sidebar nav, Framer Motion animation patterns) so a future session understands *why* the UI looks the way it does, not just what the code does.
- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "Update CLAUDE.md for the React/Vite/shadcn architecture"
```
