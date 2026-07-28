function escapeCsvField(value) {
  const s = String(value ?? '')
  if (/[;"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

export function fmtCsvNumber(v) {
  // Round to 2 decimals to strip floating-point noise (e.g. 3.1672000000000002) before
  // handing the value to a spreadsheet/accountant.
  const rounded = Math.round((v ?? 0) * 100) / 100
  return String(rounded).replace('.', ',')
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
