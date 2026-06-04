export function calcRisk({ account, pct, maxContracts, dailyLimit, stopDist, rr }) {
  const dolRisk = account * (pct / 100)
  const perContract = stopDist * 50  // 1 ES point = $50
  const contracts = Math.max(1, Math.min(Math.floor(dolRisk / (perContract || 1)), maxContracts))
  const actualRisk = contracts * perContract
  const targetPts = stopDist * rr
  const targetDol = contracts * targetPts * 50
  const tradesPerDay = dailyLimit > 0 ? Math.floor(dailyLimit / (actualRisk || 1)) : 0
  return { contracts, actualRisk, targetPts, targetDol, tradesPerDay, stopDist }
}
