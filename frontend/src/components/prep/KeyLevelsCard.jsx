import React from 'react'
import { N } from '../../utils/format'

export default function KeyLevelsCard({ pdh, pdl, pdc, globexHigh, globexLow, globexOpen, weeklyOpen, monthlyOpen, roundAbove1, roundAbove2, roundBelow1, roundBelow2, currentPrice, pwh, pwl }) {
  const abovePdh = currentPrice && pdh && currentPrice > pdh
  const belowPdl = currentPrice && pdl && currentPrice < pdl
  const abovePwh = currentPrice && pwh && currentPrice > pwh
  const belowPwl = currentPrice && pwl && currentPrice < pwl

  return (
    <div className="card">
      <div className="card-hdr"><span className="card-title">Key Levels</span></div>
      <div className="card-body">
        <div style={{ fontSize: '10px', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: '8px' }}>Prior Session</div>
        <div className="kv-row">
          <span className="kv-key">PDH</span>
          <span className={`kv-val mono${abovePdh ? ' tone-bull' : ''}`}>{pdh != null ? N(pdh) : '—'}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">PDL</span>
          <span className={`kv-val mono${belowPdl ? ' tone-bear' : ''}`}>{pdl != null ? N(pdl) : '—'}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">PDC</span>
          <span className="kv-val mono">{pdc != null ? N(pdc) : '—'}</span>
        </div>

        <div style={{ height: '12px' }} />
        <div style={{ fontSize: '10px', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: '8px' }}>Prior Week</div>
        <div className="kv-row">
          <span className="kv-key">PWH</span>
          <span className={`kv-val mono${abovePwh ? ' tone-bull' : ''}`}>{pwh != null ? N(pwh) : '—'}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">PWL</span>
          <span className={`kv-val mono${belowPwl ? ' tone-bear' : ''}`}>{pwl != null ? N(pwl) : '—'}</span>
        </div>

        <div style={{ height: '12px' }} />
        <div style={{ fontSize: '10px', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: '8px' }}>Overnight / Globex</div>
        <div className="kv-row">
          <span className="kv-key">Globex High</span>
          <span className="kv-val mono">{globexHigh != null ? N(globexHigh) : '—'}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">Globex Low</span>
          <span className="kv-val mono">{globexLow != null ? N(globexLow) : '—'}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">Globex Open</span>
          <span className="kv-val mono">{globexOpen != null ? N(globexOpen) : '—'}</span>
        </div>

        <div style={{ height: '12px' }} />
        <div style={{ fontSize: '10px', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: '8px' }}>Structure Levels</div>
        <div className="kv-row">
          <span className="kv-key">Weekly Open</span>
          <span className="kv-val mono">{weeklyOpen != null ? N(weeklyOpen) : '—'}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">Monthly Open</span>
          <span className="kv-val mono">{monthlyOpen != null ? N(monthlyOpen) : '—'}</span>
        </div>

        <div style={{ height: '12px' }} />
        <div style={{ fontSize: '10px', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: '8px' }}>Round Numbers</div>
        <div className="kv-row">
          <span className="kv-key">R+2</span>
          <span className="kv-val mono" style={{ color: 'var(--text-3)' }}>{roundAbove2 != null ? N(roundAbove2) : '—'}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">R+1</span>
          <span className="kv-val mono">{roundAbove1 != null ? N(roundAbove1) : '—'}</span>
        </div>
        {currentPrice != null && (
          <div className="kv-row" style={{ background: 'rgba(100,210,255,.06)', borderRadius: '3px' }}>
            <span className="kv-key">Current</span>
            <span className="kv-val mono tone-gold">{N(currentPrice)}</span>
          </div>
        )}
        <div className="kv-row">
          <span className="kv-key">S-1</span>
          <span className="kv-val mono">{roundBelow1 != null ? N(roundBelow1) : '—'}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">S-2</span>
          <span className="kv-val mono" style={{ color: 'var(--text-3)' }}>{roundBelow2 != null ? N(roundBelow2) : '—'}</span>
        </div>
      </div>
    </div>
  )
}
