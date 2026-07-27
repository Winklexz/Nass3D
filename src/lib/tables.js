export const TABLES = {
  materials: {
    name: 'materials',
    fields: { id: 'id', nome: 'nome', cor: 'cor', preco: 'preco', estoque: 'estoque', tipo: 'tipo' },
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
