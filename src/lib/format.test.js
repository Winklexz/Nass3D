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
    const d = new Date(); d.setDate(d.getDate() - 1)
    const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    expect(pedidoRowFlag({ prazo: yesterday, status: 'Pendente' })).toBe('atrasado')
  })
  it('does not flag a delivered order', () => {
    const d = new Date(); d.setDate(d.getDate() - 1)
    const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
