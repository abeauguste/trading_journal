import React from 'react'
import { N } from '../../utils/format'

function rangePill(vsRange) {
  if (vsRange == null) return null
  const cls = vsRange === 'ABOVE PDH' ? 'pill pill-bull'
    : vsRange === 'BELOW PDL' ? 'pill pill-bear'
    : 'pill pill-gold'
  return <span className={cls} style={{ marginLeft: '8px' }}>{vsRange}</span>
}

function VwapRow({ label, vwap, vsRange, currentPrice, showRange }) {
  const above = currentPrice != null && vwap != null && currentPrice > vwap
  const below = currentPrice != null && vwap != null && currentPrice < vwap
  const toneClass = above ? 'tone-bull' : below ? 'tone-bear' : ''

  let distNode = null
  if (currentPrice != null && vwap != null) {
    const d = currentPrice - vwap
    const sign = d >= 0 ? '+' : '−'
    distNode = (
      <span className={`mono ${toneClass}`} style={{ fontSize: '11px', marginLeft: '8px' }}>
        {sign}{N(Math.abs(d), 1)}
      </span>
    )
  }

  return (
    <div className="kv-row">
      <span className="kv-key">{label}</span>
      <span style={{ display: 'flex', alignItems: 'center' }}>
        <span className={`kv-val mono ${toneClass}`}>{vwap != null ? N(vwap) : '—'}</span>
        {distNode}
        {showRange && rangePill(vsRange)}
      </span>
    </div>
  )
}

export default function VWAPContextCard({ vwapDaily, vwapWeekly, vwapMonthly, vwapQuarterly, vwapYearly, vwapPosture, vwapDailyVsRange, vwapWeeklyVsRange, vwapMonthlyVsRange, currentPrice }) {
  const allNull = vwapDaily == null && vwapWeekly == null && vwapMonthly == null && vwapQuarterly == null && vwapYearly == null

  let postureNode = null
  if (vwapPosture) {
    const upper = vwapPosture.toUpperCase()
    const cls = upper.includes('BULL') ? 'pill pill-bull'
      : upper.includes('BEAR') ? 'pill pill-bear'
      : 'pill pill-gold'
    const text = vwapPosture.split(' — ')[0] || vwapPosture
    postureNode = <span className={cls}>{text}</span>
  }

  return (
    <div className="card">
      <div className="card-hdr" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="card-title">VWAP Structure</span>
        {postureNode}
      </div>
      <div className="card-body">
        {allNull ? (
          <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>Awaiting VWAP data</div>
        ) : (
          <>
            <VwapRow label="Daily VWAP" vwap={vwapDaily} vsRange={vwapDailyVsRange} currentPrice={currentPrice} showRange />
            <VwapRow label="Weekly VWAP" vwap={vwapWeekly} vsRange={vwapWeeklyVsRange} currentPrice={currentPrice} showRange />
            <VwapRow label="Monthly VWAP" vwap={vwapMonthly} vsRange={vwapMonthlyVsRange} currentPrice={currentPrice} showRange />
            <VwapRow label="Quarterly VWAP" vwap={vwapQuarterly} currentPrice={currentPrice} />
            <VwapRow label="Yearly VWAP" vwap={vwapYearly} currentPrice={currentPrice} />
          </>
        )}
      </div>
    </div>
  )
}
