export function getVixRegime(vix) {
  if (vix == null) return { regime: 'UNKNOWN', label: 'No VIX data', color: 'var(--text3)' }
  if (vix < 15) return { regime: 'COMPLACENT', label: 'VIX < 15 — Complacent, sell premium', color: 'var(--bull)' }
  if (vix < 25) return { regime: 'ELEVATED',   label: 'VIX 15-25 — Elevated fear, trade with stops', color: 'var(--neutral)' }
  if (vix < 35) return { regime: 'FEAR',        label: 'VIX 25-35 — High fear, reduce size', color: 'var(--orange)' }
  return { regime: 'PANIC', label: 'VIX > 35 — Panic, defensive only', color: 'var(--bear)' }
}
