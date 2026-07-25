import { describe, it, expect } from 'vitest'
import { parseGcode, parseTimeToHours, lengthMetersToGrams } from './gcode.js'

describe('parseTimeToHours', () => {
  it('parses days/hours/minutes', () => {
    expect(parseTimeToHours('1d 2h 30m')).toBeCloseTo(26.5, 5)
  })
  it('parses hours and minutes only', () => {
    expect(parseTimeToHours('9h 12m')).toBeCloseTo(9.2, 5)
  })
})

describe('lengthMetersToGrams', () => {
  it('converts filament length to weight using default PLA density', () => {
    expect(lengthMetersToGrams(1)).toBeCloseTo(2.98, 1)
  })
})

describe('parseGcode', () => {
  it('parses Bambu/Orca-style time, weight, and color comments', () => {
    const text = `
; model printing time: 9h 12m
; total filament weight [g]: 130.5, 42.0
; filament_colour = #FF2438;#1D63D1
`
    const r = parseGcode(text)
    expect(r.timeHours).toBeCloseTo(9.2, 5)
    expect(r.weights).toEqual([130.5, 42.0])
    expect(r.colors).toEqual(['#ff2438', '#1d63d1'])
    expect(r.colorsFound).toBe(true)
    expect(r.estimated).toBe(false)
  })

  it('parses Cura-style time and estimates weight from filament length', () => {
    const text = `
;TIME:33120
;Filament used: 4.2m
`
    const r = parseGcode(text)
    expect(r.timeHours).toBeCloseTo(9.2, 1)
    expect(r.weights.length).toBe(1)
    expect(r.estimated).toBe(true)
    expect(r.slicer).toBe('Cura')
  })

  it('returns nulls when nothing recognizable is found', () => {
    const r = parseGcode('; just a random comment')
    expect(r.timeHours).toBeNull()
    expect(r.weights).toEqual([])
  })

  it('drops near-zero AMS slots so colors stay aligned with weights', () => {
    const text = `
; total filament weight [g]: 130.5, 0.00, 42.0
; filament_colour = #FF2438;#00FF00;#1D63D1
`
    const r = parseGcode(text)
    expect(r.weights).toEqual([130.5, 42.0])
    expect(r.colors).toEqual(['#ff2438', '#1d63d1'])
  })
})
