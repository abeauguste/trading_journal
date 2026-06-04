import React from 'react'
import { N } from '../../utils/format'

export default function Scenarios({ week }) {
  if (!week) return null
  const w = week.weekly

  const open = w.es_open_price?.value
  const h1 = w.es_weekly_h1?.value
  const l1 = w.es_weekly_l1?.value
  const vwapW = w.vwap_weekly?.value
  const buyZone = w.buy_level?.value
  const sellZone = w.sell_level?.value
  const posture = (w.es_weekly_posture?.value || '').toLowerCase()

  const isBull = posture.includes('buy')
  const isBear = posture.includes('sell')

  const bullTarget = h1 ?? (open != null ? open + 100 : null)
  const bearTarget = l1 ?? (open != null ? open - 100 : null)

  return (
    <div>
      <div className="scenario sc-bull">
        <div className="sc-title">Bull Scenario</div>
        <div className="sc-body">
          Price holds above <strong className="hl">{N(vwapW ?? open)}</strong> (VWAP-W/Open).
          Look for long setups targeting <strong className="hl">{N(bullTarget)}</strong> (H1)
          {sellZone ? ` while avoiding sell zone at ${N(sellZone)}` : ''}.
          {buyZone ? ` Buy zone confluence at ${N(buyZone)}.` : ''}
          {isBull ? ' CURRENT POSTURE SUPPORTS BULL CASE.' : ''}
        </div>
      </div>
      <div className="scenario sc-bear">
        <div className="sc-title">Bear Scenario</div>
        <div className="sc-body">
          Price fails below <strong className="hl">{N(vwapW ?? open)}</strong> (VWAP-W/Open).
          Watch for shorts targeting <strong className="hl">{N(bearTarget)}</strong> (L1).
          {w.es_bear_trap_zone?.value ? ` Bear trap zone at ${N(w.es_bear_trap_zone.value)} — low sell volume area.` : ''}
          {isBear ? ' CURRENT POSTURE SUPPORTS BEAR CASE.' : ''}
        </div>
      </div>
      <div className="scenario sc-neutral">
        <div className="sc-title">Neutral / Range</div>
        <div className="sc-body">
          Chop between <strong className="hl">{N(l1)}</strong> and <strong className="hl">{N(h1)}</strong>.
          VWAP-D at <strong className="hl">{N(w.vwap_daily?.value)}</strong> acts as magnet.
          Avoid trading in the first 15 minutes. Wait for posture clarity.
          {w.es_squeeze?.value === 'no' || w.es_squeeze?.value === 'No' ? ' No active squeeze — reduced momentum conditions.' : ''}
        </div>
      </div>
    </div>
  )
}
