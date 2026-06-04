import React from 'react'
import { N } from '../../utils/format'

function getDisplay(spot) {
  if (spot == null) return { tone: '', label: '—', pct: 0 }
  if (spot < 15)  return { tone: 'tone-bull', label: 'COMPLACENT', pct: spot / 15 * 25 }
  if (spot < 25)  return { tone: 'tone-gold', label: 'NORMAL RANGE', pct: 25 + (spot - 15) / 10 * 25 }
  if (spot < 35)  return { tone: 'tone-bear', label: 'ELEVATED',    pct: 50 + (spot - 25) / 10 * 25 }
  return { tone: 'tone-bear', label: 'FEAR / PANIC', pct: 100 }
}

export default function VixRegimeCard({ vix, regime }) {
  const spot = vix ?? regime?.current ?? null
  const { tone, label, pct } = getDisplay(spot)
  const markerPct = Math.min(pct, 100)

  return (
    <div>
      <span className="eyebrow">{label !== '—' ? label : 'NO DATA'}</span>
      <div className={`regime-v ${tone}`}>{spot != null ? N(spot, 2) : '—'}</div>
      <div className="regime-d">VIX Index · current reading</div>

      <div className="rs-track" style={{ marginTop: '20px' }}>
        <div className="rs-zone rs-z-1" />
        <div className="rs-zone rs-z-2" />
        <div className="rs-zone rs-z-3" />
        <div className="rs-zone rs-z-4" />
        {spot != null && <div className="rs-marker" style={{ left: `${markerPct}%` }} />}
      </div>
      <div className="rs-labels">
        <span>Complacent</span><span>Normal</span><span>Elevated</span><span>Panic</span>
      </div>

      <div style={{ marginTop: '20px' }}>
        <div className="kv-row"><span className="kv-key">ATR-14</span><span className="kv-val mono">{regime?.atr_14 != null ? N(regime.atr_14, 2) : '—'}</span></div>
        <div className="kv-row"><span className="kv-key">Wk High</span><span className="kv-val mono tone-bull">{regime?.weekly_projected_high != null ? N(regime.weekly_projected_high, 2) : '—'}</span></div>
        <div className="kv-row"><span className="kv-key">Wk Low</span><span className="kv-val mono tone-bear">{regime?.weekly_projected_low != null ? N(regime.weekly_projected_low, 2) : '—'}</span></div>
        <div className="kv-row"><span className="kv-key">Day High</span><span className="kv-val mono tone-bull">{regime?.daily_projected_high != null ? N(regime.daily_projected_high, 2) : '—'}</span></div>
        <div className="kv-row"><span className="kv-key">Day Low</span><span className="kv-val mono tone-bear">{regime?.daily_projected_low != null ? N(regime.daily_projected_low, 2) : '—'}</span></div>
      </div>
    </div>
  )
}
