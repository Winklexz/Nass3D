const LEVELING_HOURS = 5 / 60

export function calculatePricing(input) {
  const {
    colorWeights, colorPrices, purgeGramsPerSwap = 8,
    printHours, energyRate, printerCost, printerLife, nozzleCost, nozzleLife,
    laborRate, laborHours, insumos, frete, riscoPct,
    margin, sellPrice, priceIsManual = false,
  } = input

  const nColors = colorWeights.length
  let totalWeight = 0, weightedPriceSum = 0
  colorWeights.forEach((w, i) => { totalWeight += w; weightedPriceSum += colorPrices[i] })
  const avgPrice = weightedPriceSum / nColors
  const purgeGrams = nColors > 1 ? purgeGramsPerSwap * (nColors - 1) : 0

  let materialCost = 0
  colorWeights.forEach((w, i) => { materialCost += (w / 1000) * colorPrices[i] })
  materialCost += (purgeGrams / 1000) * avgPrice

  const totalWeightUsed = totalWeight + purgeGrams

  const hours = printHours + LEVELING_HOURS
  const energyCost = hours * energyRate
  const printerDep = hours * (printerCost / printerLife)
  const nozzleDep = hours * (nozzleCost / nozzleLife)
  const depreciationTotal = printerDep + nozzleDep
  const laborCost = laborRate * laborHours

  const costBeforeRisk = materialCost + energyCost + laborCost + insumos + depreciationTotal
  const riscoValue = costBeforeRisk * (riscoPct / 100)
  const totalCost = costBeforeRisk + riscoValue + frete

  let finalMargin, price
  if (priceIsManual) {
    price = sellPrice || 0
    finalMargin = totalCost > 0 ? ((price / totalCost) - 1) * 100 : 0
  } else {
    finalMargin = margin
    price = totalCost * (1 + margin / 100)
  }

  const profit = price - totalCost
  const marginOfPricePct = price > 0 ? (profit / price) * 100 : 0
  const markupPct = totalCost > 0 ? (profit / totalCost) * 100 : 0

  return {
    materialCost, energyCost, laborCost, insumos, depreciationTotal, riscoValue, frete,
    totalCost, hours, totalWeightUsed, purgeGrams,
    price, margin: finalMargin, profit, marginOfPricePct, markupPct,
  }
}
