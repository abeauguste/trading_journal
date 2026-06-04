import React from 'react'
import { N } from '../../utils/format'

export default function RangeContextCard({ rthHigh, rthLow, currentPrice, currentAtr, priceVsPdrange, rangeUsedPts, rangePctOfAtr, pdh, pdl }) {
  const pct = rangePctOfAtr ?? 0
  const barColor = pct < 60 ? 'var(--bull)' : pct < 90 ? 'var(--gold)' : 'var(--bear)'

  return (
    <div className="card">
      <div className="card-hdr"><span className="card-title">Range Context</span></div>
      <div className="card-body">
        {priceVsPdrange && (
          <div style={{ marginBottom: '12px' }}>
            <span className={`pill ${priceVsPdrange === 'ABOVE PDH' ? 'pill-bull' : priceVsPdrange === 'BELOW PDL' ? 'pill-bear' : 'pill-gold'}`}>
              {priceVsPdrange}
            </span>
          </div>
        )}
        <div className="kv-row">
          <span className="kv-key">Range used</span>
          <span className="kv-val mono">{rangeUsedPts != null ? N(rangeUsedPts, 2) + ' pts' : '—'}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">% of ATR</span>
          <span className={`kv-val mono ${barColor === 'var(--bull)' ? 'tone-bull' : barColor === 'var(--gold)' ? 'tone-gold' : 'tone-bear'}`}>
            {rangePctOfAtr != null ? N(rangePctOfAtr, 1) + '%' : '—'}
          </span>
        </div>
        {rangePctOfAtr != null && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ height: '4px', background: 'var(--card2)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: '2px', transition: 'width 0.4s' }} />
            </div>
          </div>
        )}
        <div style={{ height: '10px' }} />
        <div className="kv-row">
          <span className="kv-key">Session H</span>
          <span className="kv-val mono">{rthHigh != null ? N(rthHigh) : '—'}</span>
        </div>
        <div className="kv-row">
          <span className="kv-key">Session L</span>
          <span className="kv-val mono">{rthLow != null ? N(rthLow) : '—'}</span>
        </div>
      </div>
    </div>
  )
}
