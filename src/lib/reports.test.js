import { describe, it, expect } from 'vitest'
import { rankProductProfitability } from './reports.js'

const products = [
  { id: 'p1', nome: 'Suporte de celular', custo: 5 },
  { id: 'p2', nome: 'Vaso decorativo', custo: 10 },
]

describe('rankProductProfitability', () => {
  it('aggregates quantity, revenue, and profit for matching sales in the given month', () => {
    const sales = [
      { data: '2026-07-10', produto: 'Suporte de celular', valor: 20 },
      { data: '2026-07-15', produto: 'Suporte de celular', valor: 25 },
    ]
    const [row] = rankProductProfitability(sales, products, '2026-07')
    expect(row).toMatchObject({ id: 'p1', nome: 'Suporte de celular', qtd: 2, receita: 45, lucro: 35 })
  })

  it('computes margem as lucro/receita as a percentage', () => {
    const sales = [{ data: '2026-07-10', produto: 'Vaso decorativo', valor: 40 }]
    const [row] = rankProductProfitability(sales, products, '2026-07')
    // lucro = 40 - 10 = 30; margem = 30/40 = 75%
    expect(row.margem).toBeCloseTo(75, 5)
  })

  it('excludes sales outside the given month', () => {
    const sales = [{ data: '2026-06-30', produto: 'Suporte de celular', valor: 20 }]
    expect(rankProductProfitability(sales, products, '2026-07')).toEqual([])
  })

  it('excludes sales whose produto name has no matching catalog product', () => {
    const sales = [{ data: '2026-07-10', produto: 'Peça avulsa sob encomenda', valor: 20 }]
    expect(rankProductProfitability(sales, products, '2026-07')).toEqual([])
  })

  it('sorts by lucro descending', () => {
    const sales = [
      { data: '2026-07-01', produto: 'Suporte de celular', valor: 20 }, // lucro 15
      { data: '2026-07-02', produto: 'Vaso decorativo', valor: 40 }, // lucro 30
    ]
    const rows = rankProductProfitability(sales, products, '2026-07')
    expect(rows.map(r => r.nome)).toEqual(['Vaso decorativo', 'Suporte de celular'])
  })

  it('returns an empty array when there are no sales or no products', () => {
    expect(rankProductProfitability([], products, '2026-07')).toEqual([])
    expect(rankProductProfitability([{ data: '2026-07-01', produto: 'X', valor: 10 }], [], '2026-07')).toEqual([])
  })
})
