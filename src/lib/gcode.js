export function parseTimeToHours(str) {
  let h = 0
  const d = str.match(/(\d+)\s*d/i); if (d) h += parseInt(d[1]) * 24
  const hh = str.match(/(\d+)\s*h/i); if (hh) h += parseInt(hh[1])
  const mm = str.match(/(\d+)\s*m(?!s)/i); if (mm) h += parseInt(mm[1]) / 60
  const ss = str.match(/(\d+)\s*s/i); if (ss) h += parseInt(ss[1]) / 3600
  return h
}

export function lengthMetersToGrams(lengthM, densityGcm3 = 1.24, diameterMm = 1.75) {
  const areaMm2 = Math.PI * Math.pow(diameterMm / 2, 2)
  const volumeMm3 = (lengthM * 1000) * areaMm2
  const volumeCm3 = volumeMm3 / 1000
  return volumeCm3 * densityGcm3
}

export function parseGcode(text) {
  const result = { timeHours: null, weights: [], colors: [], slicer: null, estimated: false, colorsFound: false }

  let m = text.match(/;\s*model printing time:\s*([^;\n]+)/i)
  if (!m) m = text.match(/;\s*total estimated time:\s*([^;\n]+)/i)
  if (!m) m = text.match(/;\s*estimated printing time \(normal mode\)\s*=\s*([^\n]+)/i)
  if (m) { result.timeHours = parseTimeToHours(m[1]); result.slicer = 'Bambu Studio / OrcaSlicer / PrusaSlicer' }

  let wm = text.match(/;\s*total filament weight \[g\]\s*:\s*([\d.,\s]+)/i)
  if (!wm) wm = text.match(/;\s*filament used \[g\]\s*=\s*([\d.,\s]+)/i)
  let rawWeights = []
  if (wm) {
    rawWeights = wm[1].split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
    if (!result.slicer) result.slicer = 'Bambu Studio / OrcaSlicer / PrusaSlicer'
  }

  let cm = text.match(/;\s*filament_colou?r\s*=\s*([^\n]+)/i)
  let rawColors = []
  if (cm) {
    rawColors = cm[1].split(/[;,]/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => (s.startsWith('#') ? s : '#' + s).slice(0, 7).toLowerCase())
      .filter(s => /^#[0-9a-fA-F]{6}$/.test(s))
    if (rawColors.length) result.colorsFound = true
  }

  if (result.timeHours === null) {
    const tm = text.match(/;TIME:(\d+)/i)
    if (tm) { result.timeHours = parseInt(tm[1]) / 3600; result.slicer = result.slicer || 'Cura' }
  }

  if (rawWeights.length === 0) {
    const lm = text.match(/;\s*Filament used:\s*([\d.,\s m]+)/i)
    if (lm) {
      const lengths = lm[1].split(',').map(s => parseFloat(s)).filter(n => !isNaN(n))
      if (lengths.length) {
        rawWeights = lengths.map(l => Math.round(lengthMetersToGrams(l) * 100) / 100)
        result.estimated = true
        result.slicer = result.slicer || 'Cura'
      }
    }
  }

  rawWeights.forEach((w, i) => {
    if (w > 0.05) {
      result.weights.push(w)
      result.colors.push(rawColors[i] || null)
    }
  })

  return result
}
