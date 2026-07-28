import { describe, it, expect } from 'vitest'
import { toCsv, fmtCsvNumber } from './csv.js'

describe('fmtCsvNumber', () => {
  it('uses a comma as decimal separator (pt-BR / Excel convention)', () => {
    expect(fmtCsvNumber(140.5)).toBe('140,50')
  })

  it('defaults null/undefined to 0,00', () => {
    expect(fmtCsvNumber(null)).toBe('0,00')
    expect(fmtCsvNumber(undefined)).toBe('0,00')
  })

  it('rounds away floating-point noise to 2 decimals', () => {
    expect(fmtCsvNumber(3.1672000000000002)).toBe('3,17')
  })

  it('always shows exactly 2 decimals, even for whole numbers', () => {
    expect(fmtCsvNumber(1000)).toBe('1000,00')
  })
})

describe('toCsv', () => {
  const columns = [
    { key: 'nome', label: 'Nome' },
    { key: 'preco', label: 'Preço', format: (row) => fmtCsvNumber(row.preco) },
  ]

  it('builds a semicolon-delimited CSV with a UTF-8 BOM prefix', () => {
    const csv = toCsv([{ nome: 'Filamento Azul', preco: 140.5 }], columns)
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv.slice(1)).toBe('Nome;Preço\r\nFilamento Azul;140,50')
  })

  it('escapes values containing the delimiter, quotes, or newlines', () => {
    const csv = toCsv([{ nome: 'Nome; com ponto e vírgula', preco: 0 }], columns)
    expect(csv.slice(1)).toContain('"Nome; com ponto e vírgula"')
  })

  it('doubles up embedded quotes when escaping', () => {
    const csv = toCsv([{ nome: 'Aspas "internas"', preco: 0 }], columns)
    expect(csv.slice(1)).toContain('"Aspas ""internas"""')
  })

  it('produces one line per row, in order', () => {
    const csv = toCsv(
      [{ nome: 'A', preco: 1 }, { nome: 'B', preco: 2 }],
      columns
    )
    const lines = csv.slice(1).split('\r\n')
    expect(lines).toEqual(['Nome;Preço', 'A;1,00', 'B;2,00'])
  })

  it('returns just the header (plus BOM) for an empty row set', () => {
    const csv = toCsv([], columns)
    expect(csv.slice(1)).toBe('Nome;Preço')
  })
})
