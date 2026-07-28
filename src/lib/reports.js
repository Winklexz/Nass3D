// Matches sales to catalog products by exact name (row.produto === product.nome) — the same
// convention already used for the monthly "lucro" stat elsewhere in Relatorio.jsx. Sales whose
// produto text doesn't match any catalog product (e.g. one-off jobs from a pedido's freeform
// item description) are excluded from this ranking, not counted as an error.
export function rankProductProfitability(sales, products, ym) {
  const byProduct = new Map()

  sales.forEach(v => {
    if (!v.data || v.data.slice(0, 7) !== ym) return
    const prod = products.find(p => p.nome === v.produto)
    if (!prod) return

    const entry = byProduct.get(prod.id) || { id: prod.id, nome: prod.nome, qtd: 0, receita: 0, lucro: 0 }
    entry.qtd += 1
    entry.receita += v.valor || 0
    entry.lucro += (v.valor || 0) - (prod.custo || 0)
    byProduct.set(prod.id, entry)
  })

  return Array.from(byProduct.values())
    .map(p => ({ ...p, margem: p.receita > 0 ? (p.lucro / p.receita) * 100 : 0 }))
    .sort((a, b) => b.lucro - a.lucro)
}
