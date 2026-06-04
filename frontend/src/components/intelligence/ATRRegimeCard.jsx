import React from 'react'
import { N } from '../../utils/format'

export default function ATRRegimeCard({ atrRegime, liveData }) {
  const atr = atrRegime?.current_atr ?? liveData?.atr
  const regime = (atrRegime?.regime ?? 'UNKNOWN').toLowerCase()
  const pct = atrRegime?.percentile_rank ?? 0.5
  const rows = [
    { label: 'Current ATR',  value: atr },
    { label: 'Weekly High',  value: atrRegime?.weekly_high },
    { label: 'Monthly High', value: atrRegime?.monthly_high },
    { label: '20-Event Avg', value: atrRegime?.rolling_20_avg },
  ]
  const fillColor = regime === 'expanded' ? 'var(--bear)' : regime === 'compressed' ? 'var(--accent)' : 'var(--bull)'
  return (
    <div className="card">
      <div className="card-hdr">
        <span className="card-title">ATR Regime</span>
        {regime !== 'unknown' && <span className={`regime-badge regime-${regime}`}>{regime.toUpperCase()}</span>}
      </div>
      <div className="card-body">
        {!atr && <div className="no-data-placeholder">Waiting for first ATR from webhook…</div>}
        {atr && <>
          {rows.map(({ label, value }) => (
            <div key={label} className="atr-row">
              <span className="atr-lbl">{label}</span>
              <span className="atr-val num">{value != null ? N(value, 1) : '—'}</span>
            </div>
          ))}
          <div style={{marginTop:'8px'}}>
            <div style={{fontSize:'9px',color:'var(--text3)',marginBottom:'3px'}}>ATR PERCENTILE vs LAST 100 EVENTS</div>
            <div className="percentile-bar">
              <div className="percentile-fill" style={{width:`${Math.round(pct*100)}%`,background:fillColor}} />
            </div>
            <div style={{fontSize:'10px',color:'var(--text3)',textAlign:'right'}}>{Math.round(pct*100)}th percentile</div>
          </div>
        </>}
      </div>
    </div>
  )
}
