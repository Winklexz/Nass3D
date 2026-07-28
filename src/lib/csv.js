function escapeCsvField(value) {
  const s = String(value ?? '')
  if (/[;"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

export function fmtCsvNumber(v) {
  // toFixed(2) both strips floating-point noise (e.g. 3.1672000000000002) and keeps every
  // value at a uniform 2 decimals (140 -> "140,00"), consistent for a spreadsheet/accountant.
  return (v ?? 0).toFixed(2).replace('.', ',')
}

export function toCsv(rows, columns) {
  const header = columns.map(c => escapeCsvField(c.label)).join(';')
  const lines = rows.map(row =>
    columns.map(c => escapeCsvField(c.format ? c.format(row) : row[c.key])).join(';')
  )
  // Leading BOM so Excel (including pt-BR locale) opens the file as UTF-8 instead of
  // guessing a legacy codepage and mangling accented characters.
  return '﻿' + [header, ...lines].join('\r\n')
}

export function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportCsv(filename, rows, columns) {
  downloadCsv(filename, toCsv(rows, columns))
}
