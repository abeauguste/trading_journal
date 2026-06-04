import React from 'react'
import { N } from '../../utils/format'

function regimeColor(r) {
  if (r === 'COMPRESSED') return 'var(--gold)'
  if (r === 'EXPANDED')   return 'var(--bear)'
  return 'var(--text-2)'   // NORMAL — distinct from default text but not alarming
}

const CONTEXT = {
  EXPANDED:   'Wide ranges — size down, use wider stops.',
  COMPRESSED: 'Tight ranges — breakout potential, watch squeeze.',
  NORMAL:     'Normal volatility — standard ATR-based sizing.',
}

export default function AtrRegimeCard({ atrRegime }) {
  const regime     = atrRegime?.regime
  const pct        = atrRegime?.percentile ?? null   // 0–100
  const clampedPct = pct != null ? Math.min(Math.max(pct, 0), 100) : null

  return (
    <div className="card reveal r-3">
      <div className="card-hdr">
        <span className="card-title">ATR Regime</span>
        <span className="eyebrow muted">Volatility Percentile</span>
      </div>
      <div className="card-body">
        {(!atrRegime || regime == null) ? (
          <div style={{ color: 'var(--text-3)', fontSize: '12px' }}>
            ATR data not yet available
          </div>
        ) : (
          <>
            <div className="mono" style={{ fontSize: '26px', fontWeight: 700, color: regimeColor(regime), marginBottom: '4px' }}>
              {regime}
            </div>

            {/* Percentile gauge bar */}
            {clampedPct != null && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Percentile Rank
                </div>
                <div style={{ position: 'relative', height: '10px', borderRadius: '5px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  {/* Compressed zone 0–25% */}
                  <div style={{ position: 'absolute', left: 0, width: '25%', height: '100%', background: 'rgba(201,169,106,0.18)' }} />
                  {/* Normal zone 25–75% */}
                  <div style={{ position: 'absolute', left: '25%', width: '50%', height: '100%', background: 'rgba(255,255,255,0.04)' }} />
                  {/* Expanded zone 75–100% */}
                  <div style={{ position: 'absolute', left: '75%', width: '25%', height: '100%', background: 'rgba(200,102,92,0.18)' }} />
                  {/* Marker */}
                  <div style={{
                    position: 'absolute',
                    left: `calc(${clampedPct}% - 1px)`,
                    top: 0,
                    width: '2px',
                    height: '100%',
                    background: 'var(--accent)',
                    borderRadius: '1px',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontSize: '9px', color: 'var(--text-3)' }}>
                  <span>Compressed</span>
                  <span className="mono">{clampedPct.toFixed(0)}th pct</span>
                  <span>Expanded</span>
                </div>
              </div>
            )}

            <div className="kv-row">
              <span className="kv-key">Current ATR</span>
              <span className="kv-val mono">{atrRegime.atr_value != null ? N(atrRegime.atr_value, 2) : '—'}</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">20-bar Avg</span>
              <span className="kv-val mono">{atrRegime.rolling_avg != null ? N(atrRegime.rolling_avg, 2) : '—'}</span>
            </div>
            {/* No bull/bear coloring on High/Low — the labels carry the meaning */}
            <div className="kv-row">
              <span className="kv-key">20-bar High</span>
              <span className="kv-val mono">{atrRegime.rolling_max != null ? N(atrRegime.rolling_max, 2) : '—'}</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">20-bar Low</span>
              <span className="kv-val mono">{atrRegime.rolling_min != null ? N(atrRegime.rolling_min, 2) : '—'}</span>
            </div>

            {CONTEXT[regime] && (
              <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--text-3)', fontStyle: 'italic' }}>
                {CONTEXT[regime]}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
