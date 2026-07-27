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

  it('maps materials tipo field', () => {
    const row = { id: 'm1', nome: 'Filamento Azul', cor: '#1d63d1', preco: 140, estoque: 500, tipo: 'PETG' }
    const obj = rowToObj(row, TABLES.materials.fields)
    expect(obj.tipo).toBe('PETG')
    expect(objToRow({ tipo: 'ABS' }, TABLES.materials.fields)).toEqual({ tipo: 'ABS' })
  })
})
