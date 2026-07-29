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
    // `now` is deliberately left out: it's a `new Date()` created fresh every render, so adding
    // it here would make this recompute on every render (defeating the memoization) instead of
    // only when the underlying collections change. `now` is only used to derive the current
    // year-month (`ym`) for filtering this month's sales — safe to read from the render-time
    // value even though it's not tracked as a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
