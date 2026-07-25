import { jsPDF } from 'jspdf'
import { fmtBRL } from './format'

export function generateOrcamentoPdf({
  numero, empresa, logoDataUrl, cliente, descricao, material, quantidade,
  prazo, validade, forma1, desc1, forma2, desc2, obs, base,
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  let y = 20
  let textX = 15

  if (logoDataUrl) {
    try {
      const props = doc.getImageProperties(logoDataUrl)
      const w = 26, h = (props.height / props.width) * w
      doc.addImage(logoDataUrl, props.fileType, 15, y - 7, w, h)
      textX = 46
    } catch { /* skip broken image */ }
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(20)
  doc.text(empresa, textX, y)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(140)
  doc.text('Gerado por Nass3D', textX, y + 6)

  doc.setTextColor(20); doc.setFont('helvetica', 'bold'); doc.setFontSize(19)
  doc.text('ORÇAMENTO', pageW - 15, y, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(140)
  doc.text(`#${numero} · ${new Date().toLocaleDateString('pt-BR')}`, pageW - 15, y + 6, { align: 'right' })
  if (validade) doc.text(`Válido por: ${validade}`, pageW - 15, y + 11, { align: 'right' })

  y += 20
  doc.setDrawColor(225); doc.line(15, y, pageW - 15, y)
  y += 10

  doc.setTextColor(140); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('PARA', 15, y)
  doc.setTextColor(20); doc.setFont('helvetica', 'normal'); doc.setFontSize(12)
  doc.text(cliente, 15, y + 6)
  y += 18

  const rows = [
    ['Descrição', descricao],
    ['Material', material || '—'],
    ['Quantidade', String(quantidade)],
    ['Prazo de entrega', prazo || '—'],
  ]
  rows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(140)
    doc.text(label, 15, y)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(20)
    doc.text(String(val), 65, y)
    y += 7.5
  })

  y += 5
  doc.setDrawColor(225); doc.line(15, y, pageW - 15, y)
  y += 12

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.setTextColor(20)
  doc.text('Valor do orçamento', 15, y)
  doc.setFontSize(17)
  doc.text(fmtBRL(base), pageW - 15, y, { align: 'right' })
  y += 11

  if (forma1) {
    const val1 = base * (1 - desc1 / 100)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(90)
    doc.text(`${forma1}${desc1 > 0 ? ` — ${desc1}% de desconto` : ''}`, 15, y)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(20)
    doc.text(fmtBRL(val1), pageW - 15, y, { align: 'right' })
    y += 7
  }
  if (forma2) {
    const val2 = base * (1 - desc2 / 100)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(90)
    doc.text(`${forma2}${desc2 > 0 ? ` — ${desc2}% de desconto` : ''}`, 15, y)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(20)
    doc.text(fmtBRL(val2), pageW - 15, y, { align: 'right' })
    y += 7
  }

  if (obs) {
    y += 7
    doc.setDrawColor(225); doc.line(15, y, pageW - 15, y)
    y += 10
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(140)
    doc.text('OBSERVAÇÕES', 15, y)
    y += 6
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(20)
    doc.text(doc.splitTextToSize(obs, pageW - 30), 15, y)
  }

  doc.save(`orcamento-${numero}-${cliente.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}

export function generateRelatorioPdf({ ym, mesLabel, receita, lucro, totalCriados, fechados, perdidos, emAberto }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  let y = 20

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(20)
  doc.text('Relatório mensal', 15, y)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(140)
  doc.text(mesLabel, 15, y + 7)
  doc.text(`Gerado por Nass3D em ${new Date().toLocaleDateString('pt-BR')}`, pageW - 15, y, { align: 'right' })

  y += 20
  doc.setDrawColor(225); doc.line(15, y, pageW - 15, y)
  y += 14

  const rows = [
    ['Receita do mês', fmtBRL(receita)],
    ['Lucro do mês', fmtBRL(lucro)],
    ['Pedidos criados no mês', String(totalCriados)],
    ['Fechados (Entregue)', String(fechados)],
    ['Perdidos', String(perdidos)],
    ['Ainda em aberto', String(emAberto)],
  ]
  rows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(90)
    doc.text(label, 15, y)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(20)
    doc.text(val, pageW - 15, y, { align: 'right' })
    y += 10
  })

  doc.save(`relatorio-${ym}.pdf`)
}
