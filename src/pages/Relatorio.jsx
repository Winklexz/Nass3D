import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { useCollection } from '@/hooks/useCollection'
import { fmtBRL, fmtNum } from '@/lib/format'
import StatCard from '@/components/shared/StatCard'
import { generateRelatorioPdf } from '@/lib/pdf'
import { rankProductProfitability } from '@/lib/reports'

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

  const ranking = useMemo(() => rankProductProfitability(sales, products, ym), [sales, products, ym])

  async function handleExport() {
    const [yy, mm] = ym.split('-')
    let mesLabel = new Date(yy, mm - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    mesLabel = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)
    await generateRelatorioPdf({ ym, mesLabel, ...r, ranking })
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

          <div className="mb-2.5 text-[11px] uppercase tracking-wide text-muted-foreground">Lucratividade por produto</div>
          {ranking.length === 0 ? (
            <p className="mb-5 py-4 text-center text-xs text-muted-foreground">
              Nenhuma venda de um produto do catálogo neste mês.
            </p>
          ) : (
            <div className="mb-5 overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground">Produto</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground">Qtd</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground">Receita</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground">Lucro</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground">Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.map(row => (
                    <TableRow key={row.id} className="border-border/60 last:border-0">
                      <TableCell className="py-2 text-xs">{row.nome}</TableCell>
                      <TableCell className="py-2 font-mono text-xs">{row.qtd}</TableCell>
                      <TableCell className="py-2 font-mono text-xs">{fmtBRL(row.receita)}</TableCell>
                      <TableCell className={`py-2 font-mono text-xs ${row.lucro >= 0 ? 'text-success' : 'text-destructive'}`}>{fmtBRL(row.lucro)}</TableCell>
                      <TableCell className="py-2 font-mono text-xs">{fmtNum(row.margem, 0)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="mb-5 text-xs text-muted-foreground">
            Considera só vendas cujo nome do produto bate com um item cadastrado em Produtos — vendas avulsas ou vindas de um pedido personalizado não entram nesse ranking.
          </p>

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
