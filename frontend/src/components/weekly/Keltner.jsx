import React from 'react'
import { N } from '../../utils/format'

const ATR_PRESETS = {
  '15m': 10,
  '30m': 18,
  '1H': 28,
  '4H': 55,
}

export default function Keltner({ week }) {
  if (!week) return null
  const w = week.weekly
  const open = w.es_open_price?.value

  return (
    <div>
      <div style={{ marginBottom: '10px', fontSize: '10px', color: 'var(--text3)' }}>
        Based on ES Open: <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{N(open)}</span>
        &nbsp;| 1 pt = $50
      </div>
      <div className="atr-row" style={{ fontWeight: 600 }}>
        <span className="atr-lbl" style={{ color: 'var(--text2)' }}>Timeframe</span>
        <span className="atr-lbl" style={{ color: 'var(--text2)' }}>ATR Est.</span>
        <span className="atr-lbl" style={{ color: 'var(--bull)' }}>+1ATR</span>
        <span className="atr-lbl" style={{ color: 'var(--bear)' }}>-1ATR</span>
        <span className="atr-lbl" style={{ color: 'var(--bull)' }}>+2ATR</span>
        <span className="atr-lbl" style={{ color: 'var(--bear)' }}>-2ATR</span>
      </div>
      {Object.entries(ATR_PRESETS).map(([tf, atr]) => {
        const up1 = open != null ? open + atr : null
        const dn1 = open != null ? open - atr : null
        const up2 = open != null ? open + atr * 2 : null
        const dn2 = open != null ? open - atr * 2 : null
        return (
          <div className="atr-row" key={tf}>
            <span className="atr-lbl">{tf}</span>
            <span className="atr-val">{atr} pts</span>
            <span className="atr-val n-bull">{N(up1)}</span>
            <span className="atr-val n-bear">{N(dn1)}</span>
            <span className="atr-val n-bull">{N(up2)}</span>
            <span className="atr-val n-bear">{N(dn2)}</span>
          </div>
        )
      })}
      {w.es_daily_proj_price?.value && (
        <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(88,166,255,.06)', borderRadius: '5px', fontSize: '11px' }}>
          <span style={{ color: 'var(--text3)' }}>Daily Projected Price:</span>{' '}
          <span className="num n-accent">{N(w.es_daily_proj_price.value)}</span>
          {w.es_daily_proj_price.note && (
            <span style={{ color: 'var(--text3)', marginLeft: '8px' }}>— {w.es_daily_proj_price.note}</span>
          )}
        </div>
      )}
    </div>
  )
}
