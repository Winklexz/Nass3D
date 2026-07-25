import { describe, it, expect } from 'vitest'
import { calculatePricing } from './calc.js'

const baseInput = {
  colorWeights: [130], colorPrices: [140],
  purgeGramsPerSwap: 8,
  printHours: 9, energyRate: 1,
  printerCost: 4800, printerLife: 8000,
  nozzleCost: 200, nozzleLife: 1500,
  laborRate: 1, laborHours: 1.5,
  insumos: 0, frete: 0, riscoPct: 7,
  margin: 80, sellPrice: null,
}

describe('calculatePricing', () => {
  it('computes cost breakdown and derives price from margin', () => {
    const r = calculatePricing(baseInput)
    expect(r.materialCost).toBeCloseTo((130 / 1000) * 140, 5)
    expect(r.hours).toBeCloseTo(9 + 5 / 60, 5)
    expect(r.totalWeightUsed).toBeCloseTo(130, 5)
    expect(r.price).toBeGreaterThan(r.totalCost)
    expect(r.margin).toBe(80)
  })

  it('derives margin from a manually set sell price', () => {
    const r = calculatePricing({ ...baseInput, sellPrice: 100, priceIsManual: true })
    expect(r.price).toBe(100)
    expect(r.profit).toBeCloseTo(100 - r.totalCost, 5)
  })

  it('adds purge loss for multi-color prints', () => {
    const single = calculatePricing(baseInput)
    const multi = calculatePricing({ ...baseInput, colorWeights: [80, 50], colorPrices: [140, 140] })
    expect(multi.totalWeightUsed).toBeGreaterThan(single.totalWeightUsed)
    expect(multi.totalWeightUsed).toBeCloseTo(80 + 50 + 8, 5)
  })

  it('reports a negative margin as a loss', () => {
    const r = calculatePricing({ ...baseInput, sellPrice: 1, priceIsManual: true })
    expect(r.marginOfPricePct).toBeLessThan(0)
  })
})
