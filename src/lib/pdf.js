import { jsPDF } from 'jspdf'
import { fmtBRL } from './format'

const BRAND_RED = [255, 36, 56]
const BRAND_BLACK = [13, 13, 15]
const GRAY_DARK = [40, 40, 44]
const GRAY_MED = [130, 130, 138]
const GRAY_LIGHT = [235, 235, 238]

export function generateOrcamentoPdf({
  numero, empresa, logoDataUrl, cliente, descricao, material, quantidade,
  prazo, validade, forma1, desc1, forma2, desc2, obs, base,
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  const marginX = 15

  const headerH = 40
  doc.setFillColor(...BRAND_BLACK)
  doc.rect(0, 0, pageW, headerH, 'F')
  doc.setFillColor(...BRAND_RED)
  doc.rect(0, headerH, pageW, 1.2, 'F')

  let logoW = 0
  if (logoDataUrl) {
    try {
      const props = doc.getImageProperties(logoDataUrl)
      const chipSize = 26
      const chipX = marginX, chipY = (headerH - chipSize) / 2
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(chipX, chipY, chipSize, chipSize, 3, 3, 'F')
      const w = chipSize - 6, h = Math.min((props.height / props.width) * w, chipSize - 6)
      doc.addImage(logoDataUrl, props.fileType, chipX + 3, chipY + (chipSize - h) / 2, w, h)
      logoW = chipSize + 8
    } catch { /* skip broken image */ }
  }

  const textX = marginX + logoW
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16)
  doc.text(empresa, textX, headerH / 2 - 2)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(180, 180, 186)
  doc.text('Gerado por Nass3D', textX, headerH / 2 + 5)

  doc.setTextColor(...BRAND_RED); doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.text('ORÇAMENTO', pageW - marginX, headerH / 2 - 3, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(190, 190, 196)
  doc.text(`#${numero} · ${new Date().toLocaleDateString('pt-BR')}`, pageW - marginX, headerH / 2 + 4, { align: 'right' })
  if (validade) doc.text(`Válido por: ${validade}`, pageW - marginX, headerH / 2 + 9, { align: 'right' })

  let y = headerH + 14

  doc.setTextColor(...GRAY_MED); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('PARA', marginX, y)
  doc.setTextColor(...GRAY_DARK); doc.setFont('helvetica', 'normal'); doc.setFontSize(13)
  doc.text(cliente, marginX, y + 7)
  y += 18

  const tableX = marginX, tableW = pageW - marginX * 2
  const rowH = 9
  const rows = [
    ['Descrição', descricao],
    ['Material', material || '—'],
    ['Quantidade', String(quantidade)],
    ['Prazo de entrega', prazo || '—'],
  ]
  rows.forEach(([label, val], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...GRAY_LIGHT)
      doc.rect(tableX, y - 6, tableW, rowH, 'F')
    }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...GRAY_MED)
    doc.text(label, tableX + 3, y)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(...GRAY_DARK)
    doc.text(String(val), tableX + 60, y)
    y += rowH
  })

  y += 8

  doc.setFillColor(...BRAND_BLACK)
  doc.roundedRect(tableX, y - 9, tableW, 20, 2, 2, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(220, 220, 224)
  doc.text('VALOR DO ORÇAMENTO', tableX + 6, y - 1.5)
  doc.setFontSize(19); doc.setTextColor(...BRAND_RED)
  doc.text(fmtBRL(base), tableX + tableW - 6, y + 5, { align: 'right' })
  y += 20

  const options = []
  if (forma1) options.push({ forma: forma1, desc: desc1 || 0, val: base * (1 - (desc1 || 0) / 100) })
  if (forma2) options.push({ forma: forma2, desc: desc2 || 0, val: base * (1 - (desc2 || 0) / 100) })

  if (options.length) {
    y += 10
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...GRAY_MED)
    doc.text('FORMAS DE PAGAMENTO', marginX, y)
    y += 6
    const colW = tableW / options.length - 4
    options.forEach((opt, i) => {
      const x = tableX + i * (colW + 4)
      doc.setDrawColor(...GRAY_LIGHT); doc.setLineWidth(0.4)
      doc.roundedRect(x, y, colW, 22, 2, 2)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...GRAY_DARK)
      doc.text(opt.forma, x + 4, y + 8)
      if (opt.desc > 0) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...BRAND_RED)
        doc.text(`${opt.desc}% de desconto`, x + 4, y + 13)
      }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.setTextColor(...GRAY_DARK)
      doc.text(fmtBRL(opt.val), x + 4, y + 19)
    })
    y += 30
  } else {
    y += 6
  }

  if (obs) {
    doc.setDrawColor(...GRAY_LIGHT); doc.setLineWidth(0.3)
    doc.line(marginX, y, pageW - marginX, y)
    y += 8
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...GRAY_MED)
    doc.text('OBSERVAÇÕES', marginX, y)
    y += 6
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...GRAY_DARK)
    doc.text(doc.splitTextToSize(obs, pageW - marginX * 2), marginX, y)
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
