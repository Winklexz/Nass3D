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
          {/* Full logo is a square PNG with the hexagon mark occupying roughly
              the top 17%-62% band and the wordmark below that. Because the
              <img> and its container share the same 1:1 aspect ratio,
              object-fit: cover never overflows, so object-position alone
              can't crop anything here — the actual pan+zoom is done with
              scale() anchored at a non-center transform-origin (origin-*).
              scale-[2.15] + origin-[50%_28%] were measured against the real
              asset (pixel-sampled hexagon bounds) to frame just the hexagon
              with a small margin, well clear of the wordmark. Re-tune both
              together if the source logo file ever changes. */}
          <img src="/logo-nass3d.webp" alt="Nass3D" className="h-full w-full origin-[50%_28%] scale-[2.15] object-cover" />
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
