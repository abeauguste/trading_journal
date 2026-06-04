import React from 'react'
import { N } from '../../utils/format'

export default function GapCard({ gapPts, gapPct, gapDir, pdc, rthOpen }) {
  const pillClass = gapDir === 'GAP UP' ? 'pill pill-bull' : gapDir === 'GAP DOWN' ? 'pill pill-bear' : 'pill pill-gold'
  const hasData = gapPts != null

  return (
    <div className="card">
      <div className="card-hdr"><span className="card-title">Opening Gap</span></div>
      <div className="card-body">
        {!hasData ? (
          <div className="eyebrow" style={{ color: 'var(--text-3)' }}>RTH open pending</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span className={pillClass} style={{ fontSize: '11px' }}>{gapDir || 'FLAT'}</span>
            </div>
            <div className="kv-row">
              <span className="kv-key">Gap pts</span>
              <span className={`kv-val mono ${gapPts > 0 ? 'tone-bull' : gapPts < 0 ? 'tone-bear' : ''}`}>
                {gapPts > 0 ? '+' : ''}{N(gapPts, 2)}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-key">Gap %</span>
              <span className={`kv-val mono ${gapPct > 0 ? 'tone-bull' : gapPct < 0 ? 'tone-bear' : ''}`}>
                {gapPct > 0 ? '+' : ''}{N(gapPct, 3)}%
              </span>
            </div>
            {pdc != null && <div className="kv-row"><span className="kv-key">PDC</span><span className="kv-val mono">{N(pdc)}</span></div>}
            {rthOpen != null && <div className="kv-row"><span className="kv-key">RTH Open</span><span className="kv-val mono">{N(rthOpen)}</span></div>}
          </>
        )}
      </div>
    </div>
  )
}
