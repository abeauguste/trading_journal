import React from 'react'
import { N } from '../../utils/format'

function ORSection({ label, high, low, sealed, priceVsOr, currentPrice }) {
  let pillClass = 'pill'
  let pillText = 'NO DATA'
  if (high == null) {
    pillClass = 'pill'; pillText = 'NO DATA'
  } else if (!sealed) {
    pillClass = 'pill pill-gold'; pillText = 'BUILDING'
  } else if (priceVsOr === 'ABOVE') {
    pillClass = 'pill pill-bull'; pillText = 'ABOVE ORH'
  } else if (priceVsOr === 'BELOW') {
    pillClass = 'pill pill-bear'; pillText = 'BELOW ORL'
  } else {
    pillClass = 'pill'; pillText = 'IN RANGE'
  }

  const showDist = sealed && high != null && currentPrice != null

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: '6px' }}>{label}</div>
      <div style={{ marginBottom: '10px' }}>
        <span className={pillClass}>{pillText}</span>
      </div>
      <div className="kv-row">
        <span className="kv-key">ORH</span>
        <span className="kv-val mono tone-bull">{high != null ? N(high) : '—'}</span>
      </div>
      <div className="kv-row">
        <span className="kv-key">ORL</span>
        <span className="kv-val mono tone-bear">{low != null ? N(low) : '—'}</span>
      </div>
      {showDist && (
        <>
          <div className="kv-row">
            <span className="kv-key">→ ORH</span>
            <span className="kv-val mono">{N(high - currentPrice, 2)} pts</span>
          </div>
          {low != null && (
            <div className="kv-row">
              <span className="kv-key">→ ORL</span>
              <span className="kv-val mono">{N(currentPrice - low, 2)} pts</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function OpeningRangeCard({ or5High, or5Low, or5Sealed, or15High, or15Low, or15Sealed, currentPrice, priceVsOr5, priceVsOr15 }) {
  return (
    <div className="card">
      <div className="card-hdr"><span className="card-title">Opening Range</span></div>
      <div className="card-body">
        <div className="grid g2">
          <ORSection
            label="5-Min OR" high={or5High} low={or5Low} sealed={or5Sealed}
            priceVsOr={priceVsOr5} currentPrice={currentPrice}
          />
          <ORSection
            label="15-Min OR" high={or15High} low={or15Low} sealed={or15Sealed}
            priceVsOr={priceVsOr15} currentPrice={currentPrice}
          />
        </div>
      </div>
    </div>
  )
}
