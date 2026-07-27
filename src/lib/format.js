export function fmtBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function fmtNum(v, d = 1) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })
}

export function roundUpTo(value, step) {
  if (step <= 0) return value
  return Math.ceil(value / step) * step
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
