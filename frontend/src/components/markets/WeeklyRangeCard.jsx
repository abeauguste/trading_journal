import React from 'react'
import { N } from '../../utils/format'

function OHLCBox({ label, value, color }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '6px 4px' }}>
      <div style={{ fontSize: '9px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 600, color: color ?? 'var(--text)' }}>
        {value != null ? N(value, 2) : '—'}
      </div>
    </div>
  )
}

function PriceInRangeBar({ curPrice, projHigh, projLow }) {
  if (curPrice == null || projHigh == null || projLow == null || projHigh <= projLow) return null

  const rangeSpan   = projHigh - projLow
  const rawPct      = (curPrice - projLow) / rangeSpan * 100
  const clampedPct  = Math.min(Math.max(rawPct, 0), 100)
  const isBreakout  = curPrice > projHigh
  const isBreakdown = curPrice < projLow
  const ptsToHigh   = projHigh - curPrice
  const ptsToLow    = curPrice - projLow

  const markerColor = isBreakout ? 'var(--bull)' : isBreakdown ? 'var(--bear)' : 'var(--accent)'

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
        Price in Range
      </div>
      <div style={{ position: 'relative', height: '20px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        {/* Mid-range zone 35–65% */}
        <div style={{ position: 'absolute', left: '35%', width: '30%', height: '100%', background: 'rgba(111,191,138,0.10)' }} />
        {/* "MID" label inside the zone */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '7px',
          color: 'rgba(111,191,138,0.35)',
          letterSpacing: '0.1em',
          pointerEvents: 'none',
          userSelect: 'none',
          lineHeight: 1,
        }}>
          MID
        </div>
        {/* Price marker */}
        <div style={{
          position: 'absolute',
          left: `calc(${clampedPct}% - 1px)`,
          top: '3px',
          bottom: '3px',
          width: '2px',
          background: markerColor,
          borderRadius: '1px',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '10px' }}>
        <span style={{ color: 'var(--text-3)' }}>
          {isBreakout || isBreakdown ? 'Out of range' : `${clampedPct.toFixed(0)}% of range`}
        </span>
        <span>
          {isBreakout ? (
            <span style={{ color: 'var(--bull)' }}>↑ BREAKOUT +{N(curPrice - projHigh, 1)} pts</span>
          ) : isBreakdown ? (
            <span style={{ color: 'var(--bear)' }}>↓ BREAKDOWN +{N(projLow - curPrice, 1)} pts</span>
          ) : (
            <>
              <span style={{ color: ptsToLow <= ptsToHigh ? 'var(--bear)' : 'var(--text-3)' }}>↓ {N(ptsToLow, 1)}</span>
              <span style={{ color: 'var(--text-3)' }}> · </span>
              <span style={{ color: ptsToHigh <= ptsToLow ? 'var(--bull)' : 'var(--text-3)' }}>↑ {N(ptsToHigh, 1)}</span>
            </>
          )}
        </span>
      </div>
    </div>
  )
}

export default function WeeklyRangeCard({ weeklyRange, livePrice }) {
  if (!weeklyRange) {
    return (
      <div style={{ color: 'var(--text-3)', fontSize: '12px', padding: '8px 0' }}>
        No weekly range data available
      </div>
    )
  }

  const {
    week_label,
    bar_open,
    bar_high,
    bar_low,
    bar_close,
    atr,
    atr_based,
    pivot_based,
  } = weeklyRange

  const displayClose = livePrice ?? bar_close
  const projHigh = atr_based?.projected_high
  const projLow  = atr_based?.projected_low

  return (
    <div>
      {/* Latest bar OHLC */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        <OHLCBox label="Open"  value={bar_open}     color="var(--text)"   />
        <OHLCBox label="High"  value={bar_high}     color="var(--bull)"   />
        <OHLCBox label="Low"   value={bar_low}      color="var(--bear)"   />
        <OHLCBox label="Last"  value={displayClose} color="var(--accent)" />
      </div>

      <div style={{ borderTop: '1px solid var(--border)', margin: '0 0 8px 0' }} />

      <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
        Projected Range
      </div>

      {/* 2-column projection grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        {/* ATR Method */}
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            ATR Method
          </div>
          <div className="kv-row">
            <span className="kv-key">Proj High</span>
            <span className="kv-val mono" style={{ color: 'var(--bull)' }}>
              {projHigh != null ? N(projHigh, 2) : '—'}
            </span>
          </div>
          <div className="kv-row">
            <span className="kv-key">Proj Low</span>
            <span className="kv-val mono" style={{ color: 'var(--bear)' }}>
              {projLow != null ? N(projLow, 2) : '—'}
            </span>
          </div>
        </div>

        {/* Pivot R2/R1/S1/S2 */}
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            Pivot Levels
          </div>
          <div className="kv-row">
            <span className="kv-key">R2</span>
            <span className="kv-val mono" style={{ color: 'var(--bull)', opacity: 0.7 }}>
              {pivot_based?.R2 != null ? N(pivot_based.R2, 2) : '—'}
            </span>
          </div>
          <div className="kv-row">
            <span className="kv-key">R1</span>
            <span className="kv-val mono" style={{ color: 'var(--bull)' }}>
              {pivot_based?.R1 != null ? N(pivot_based.R1, 2) : '—'}
            </span>
          </div>
          <div className="kv-row">
            <span className="kv-key">S1</span>
            <span className="kv-val mono" style={{ color: 'var(--bear)' }}>
              {pivot_based?.S1 != null ? N(pivot_based.S1, 2) : '—'}
            </span>
          </div>
          <div className="kv-row">
            <span className="kv-key">S2</span>
            <span className="kv-val mono" style={{ color: 'var(--bear)', opacity: 0.7 }}>
              {pivot_based?.S2 != null ? N(pivot_based.S2, 2) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Price-in-range bar */}
      <PriceInRangeBar curPrice={displayClose} projHigh={projHigh} projLow={projLow} />

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: '10px', paddingTop: '8px' }}>
        <div className="kv-row">
          <span className="kv-key">ATR</span>
          <span className="kv-val mono">{atr != null ? N(atr, 2) : '—'}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">Week</span>
          <span className="kv-val mono" style={{ fontSize: '11px' }}>{week_label ?? '—'}</span>
        </div>
      </div>
    </div>
  )
}
