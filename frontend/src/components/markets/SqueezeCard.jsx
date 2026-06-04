import React from 'react'
import { N } from '../../utils/format'

function squeezeToState(raw) {
  if (!raw) return 'NEUTRAL'
  const s = raw.toLowerCase()
  if (s === 'long' || s === 'buy') return 'BULLISH'
  if (s === 'short' || s === 'sell') return 'BEARISH'
  return 'NEUTRAL'
}

function stateColor(state) {
  if (state === 'BULLISH') return 'var(--bull)'
  if (state === 'BEARISH') return 'var(--bear)'
  return 'var(--text3)'
}

export default function SqueezeCard({ squeeze, momentumData }) {
  const waveA = momentumData?.ttm_wave_a ?? null
  const squeezeState = squeezeToState(squeeze)
  const waveDirection = momentumData?.wave_direction ?? null
  const momentumRegime = momentumData?.momentum_regime ?? null
  const barsInState = momentumData?.bars_in_state ?? null

  const hasData = momentumData != null || squeeze != null

  if (!hasData) {
    return (
      <div style={{ color: 'var(--text3)', fontSize: '12px', padding: '8px 0' }}>
        No momentum data available
      </div>
    )
  }

  // Wave A bar geometry
  const absVal = Math.abs(waveA || 0)
  const fillPct = Math.min(absVal / 150 * 50, 50)
  const isPositive = (waveA || 0) >= 0
  const barColor = isPositive ? 'var(--bull)' : 'var(--bear)'

  return (
    <div>
      {/* Wave A bar */}
      <div style={{ marginBottom: '4px', fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Wave A Momentum
      </div>
      <div style={{
        position: 'relative',
        height: '8px',
        background: 'var(--border)',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '4px',
      }}>
        {waveA != null && (
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: fillPct + '%',
            background: barColor,
            ...(isPositive
              ? { left: '50%' }
              : { right: '50%' }
            ),
          }} />
        )}
        {/* Center line */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: '1px',
          background: 'var(--text3)',
          opacity: 0.4,
        }} />
      </div>
      <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '11px', color: barColor, marginBottom: '12px' }}>
        {waveA != null ? N(waveA, 2) : '—'}
      </div>

      {/* KV rows */}
      <div className="kv-row">
        <span className="kv-key">Squeeze State</span>
        <span className="kv-val" style={{ color: stateColor(squeezeState), fontWeight: 600 }}>
          {squeezeState}
        </span>
      </div>
      <div className="kv-row">
        <span className="kv-key">Wave Direction</span>
        <span className="kv-val" style={{ color: waveDirection ? stateColor(waveDirection) : 'var(--text3)' }}>
          {waveDirection ?? '—'}
        </span>
      </div>
      <div className="kv-row">
        <span className="kv-key">Regime</span>
        <span className="kv-val" style={{ fontWeight: 700 }}>
          {momentumRegime ?? '—'}
        </span>
      </div>
      <div className="kv-row">
        <span className="kv-key">Bars in State</span>
        <span className="kv-val" style={{ fontFamily: 'var(--mono)' }}>
          {barsInState != null ? barsInState : '—'}
        </span>
      </div>
    </div>
  )
}
