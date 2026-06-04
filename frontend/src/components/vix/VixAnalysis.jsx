import React from 'react'
import { N } from '../../utils/format'

function getVixRegime(vixVal, posture) {
  const v = vixVal ?? 0
  const p = (posture || '').toLowerCase()

  if (v >= 40) return {
    regime: 'EXTREME FEAR',
    color: 'var(--bear)',
    description: 'VIX above 40 signals extreme market panic. ES likely in freefall or bottoming. Watch for reversal setups — these are generational buying opportunities if posture confirms.',
    bias: 'CONTRARIAN LONG WATCH',
  }
  if (v >= 30) return {
    regime: 'HIGH FEAR',
    color: 'var(--bear)',
    description: 'VIX above 30 indicates elevated fear. Expect large intraday swings. ES rallies will be sold, but watch for capitulation lows. Reduce position size significantly.',
    bias: 'CAUTIOUS — WIDE STOPS',
  }
  if (v >= 20) return {
    regime: 'ELEVATED VOLATILITY',
    color: 'var(--neutral)',
    description: 'VIX between 20-30 signals above-average volatility. ES moves are meaningful but not chaotic. Use ATR-based stops. Normal plan execution with caution.',
    bias: p.includes('buy') ? 'TACTICAL LONGS' : 'TACTICAL SHORTS',
  }
  if (v >= 15) return {
    regime: 'NORMAL RANGE',
    color: 'var(--bull)',
    description: 'VIX 15-20 is the normal operating range. ES trending with moderate momentum. Execute the plan with confidence. ATR stops are appropriate.',
    bias: p.includes('buy') ? 'TREND LONG' : p.includes('sell') ? 'TREND SHORT' : 'FOLLOW POSTURE',
  }
  return {
    regime: 'LOW VOLATILITY',
    color: 'var(--accent)',
    description: 'VIX below 15 signals complacency. ES may grind higher but watch for sudden spikes. Smaller position sizes, tighter stops. Trend is your friend until it ends.',
    bias: 'GRIND HIGHER — STAY NIMBLE',
  }
}

export default function VixAnalysis({ week }) {
  if (!week) return null
  const w = week.weekly
  const vixProj = w.vix_weekly_proj_price?.value
  const posture = w.vix_weekly_posture?.value
  const regime = getVixRegime(vixProj, posture)

  return (
    <div>
      <div style={{ marginBottom: '14px', padding: '12px', background: 'rgba(248,81,73,.06)', border: '1px solid rgba(248,81,73,.2)', borderRadius: '7px' }}>
        <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.7px' }}>VIX Regime</div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: regime.color, marginTop: '4px' }}>{regime.regime}</div>
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
          VIX Target: <span style={{ color: 'var(--bear)', fontFamily: 'var(--mono)' }}>{N(vixProj)}</span>
        </div>
      </div>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '9px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '6px' }}>Trading Bias</div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: regime.color }}>{regime.bias}</div>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.7 }}>{regime.description}</div>
      {w.vix_monthly_posture?.note && (
        <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text3)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
          <strong style={{ color: 'var(--text2)' }}>Monthly context:</strong> {w.vix_monthly_posture.note}
        </div>
      )}
      {w.vix_weekly_posture?.note && (
        <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text3)' }}>
          <strong style={{ color: 'var(--text2)' }}>Weekly context:</strong> {w.vix_weekly_posture.note}
        </div>
      )}
    </div>
  )
}
