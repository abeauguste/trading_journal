import React from 'react'
import { N } from '../../utils/format'

const ATR_BAND_PILL = {
  ABOVE_EXT: ['pill pill-bull', 'ABOVE EXT'],
  BULL_ZONE: ['pill pill-bull', 'BULL ZONE'],
  ABOVE_PDC: ['pill pill-gold', 'ABOVE PDC'],
  BELOW_PDC: ['pill pill-gold', 'BELOW PDC'],
  BEAR_ZONE: ['pill pill-bear', 'BEAR ZONE'],
  BELOW_EXT: ['pill pill-bear', 'BELOW EXT'],
}

const SECTION_LABEL_STYLE = { fontSize: '10px', fontFamily: 'var(--f-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: '8px' }

export default function RangeContextCard({ rthHigh, rthLow, currentPrice, currentAtr, priceVsPdrange, rangeUsedPts, rangePctOfAtr, pdh, pdl, atrTargetBull1, atrTargetBull2, atrTargetBear1, atrTargetBear2, priceVsAtrBand }) {
  const pct = rangePctOfAtr ?? 0
  const barColor = pct < 60 ? 'var(--bull)' : pct < 90 ? 'var(--gold)' : 'var(--bear)'
  const bandPill = priceVsAtrBand ? ATR_BAND_PILL[priceVsAtrBand] : null

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

        {atrTargetBull2 != null && (
          <>
            <div style={{ height: '12px' }} />
            <div style={SECTION_LABEL_STYLE}>ATR Projections (from PDC)</div>
            {bandPill && (
              <div style={{ marginBottom: '10px' }}>
                <span className={bandPill[0]}>{bandPill[1]}</span>
              </div>
            )}
            <div className="kv-row">
              <span className="kv-key">Bull +2×</span>
              <span className="kv-val mono tone-bull">{N(atrTargetBull2)}</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">Bull +1×</span>
              <span className="kv-val mono" style={{ color: 'var(--text-2)' }}>{atrTargetBull1 != null ? N(atrTargetBull1) : '—'}</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">Bear −1×</span>
              <span className="kv-val mono" style={{ color: 'var(--text-2)' }}>{atrTargetBear1 != null ? N(atrTargetBear1) : '—'}</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">Bear −2×</span>
              <span className="kv-val mono tone-bear">{atrTargetBear2 != null ? N(atrTargetBear2) : '—'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
