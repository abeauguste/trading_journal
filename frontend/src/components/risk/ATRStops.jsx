import React from 'react'
import { N } from '../../utils/format'

const ATR_SCALE = { '15m': 0.18, '30m': 0.28, '1H': 0.40, '4H': 0.65, 'D': 1.00 }
const FALLBACK  = { '15m': 10,   '30m': 18,   '1H': 28,   '4H': 55,   'D': 72 }
const TFS       = ['15m', '30m', '1H', '4H', 'D']
const MULTIPLIERS = [0.5, 1, 1.5, 2]

export default function ATRStops({ week, liveData }) {
  const dailyAtr = liveData?.atr && liveData.atr > 0 ? liveData.atr : null
  const isLive   = dailyAtr != null

  const rows = TFS.map(tf => ({
    tf,
    atr: isLive
      ? parseFloat((dailyAtr * ATR_SCALE[tf]).toFixed(1))
      : FALLBACK[tf],
  }))

  return (
    <div>
      {!isLive && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 12px', marginBottom: '12px',
          background: 'rgba(201,169,106,0.08)',
          border: '1px solid var(--gold-line, rgba(201,169,106,0.3))',
          borderRadius: '4px',
          fontSize: '11px', color: 'var(--gold)',
          fontFamily: 'var(--f-mono)',
        }}>
          <span>⚠</span>
          <span>Live ATR unavailable — using historical estimates</span>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="hist-tbl">
          <thead>
            <tr>
              <th>TF</th>
              <th>ATR {isLive ? '(Live)' : '(Est.)'}</th>
              {MULTIPLIERS.map(m => <th key={m}>{m}× Stop</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ tf, atr }) => (
              <tr key={tf}>
                <td style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: 'var(--f-mono)' }}>{tf}</td>
                <td className="mono" style={{ color: 'var(--text-2)' }}>{atr}</td>
                {MULTIPLIERS.map(m => {
                  const dist = parseFloat((atr * m).toFixed(1))
                  const dol  = Math.round(atr * m * 50)
                  return (
                    <td key={m}>
                      <span className="tone-bear mono">{dist} pts</span>
                      <span style={{ color: 'var(--text-3)', marginLeft: '6px', fontSize: '10px' }}>${dol}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
        {isLive && (
          <span className="pill pill-bull">Live ATR: {N(dailyAtr, 1)} pts</span>
        )}
        {isLive && liveData.price != null && (
          <span className="pill pill-gold">ES: {N(liveData.price, 2)}</span>
        )}
        {week?.weekly?.es_open_price?.value != null && (
          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
            Ref open:{' '}
            <span className="mono" style={{ color: 'var(--gold)' }}>
              {N(week.weekly.es_open_price.value)}
            </span>
          </span>
        )}
      </div>

      <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-3)' }}>
        1 ES point = $50 · Intraday ATRs scaled from daily
        {isLive ? ' via TradingView' : ' (historical estimates)'}
      </div>
    </div>
  )
}
