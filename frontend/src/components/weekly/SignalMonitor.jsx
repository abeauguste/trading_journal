import React from 'react'
import { N } from '../../utils/format'

function signalStatus(val) {
  if (val == null) return { cls: 's-warn', label: '—' }
  const s = String(val).toLowerCase()
  if (s === 'yes' || s === 'true' || s === 'on') return { cls: 's-on', label: 'YES' }
  if (s === 'no' || s === 'false' || s === 'off') return { cls: 's-off', label: 'NO' }
  return { cls: 's-warn', label: String(val) }
}

export default function SignalMonitor({ week }) {
  if (!week) return null
  const w = week.weekly

  const indicators = [
    {
      label: '15-30-45-1H Green Push',
      field: w.es_green_push,
      type: 'signal',
    },
    {
      label: 'Squeeze ≤1hr',
      field: w.es_squeeze,
      type: 'signal',
    },
    {
      label: 'Bear Trap Zone',
      field: w.es_bear_trap_zone,
      type: 'price',
      color: 'var(--bull)',
    },
    {
      label: 'Bull Trap Zone',
      field: w.es_bull_trap_zone,
      type: 'price',
      color: 'var(--bear)',
    },
    {
      label: 'Major Economic Event',
      field: w.major_economic_event,
      type: 'text',
    },
  ]

  return (
    <div>
      {indicators.map((ind, i) => {
        const { cls, label: statusLabel } = signalStatus(ind.field?.value)
        return (
          <div className="ind-row" key={i}>
            <div>
              <div className="ind-label">{ind.label}</div>
              {ind.field?.note && <div className="ind-sub">{ind.field.note}</div>}
            </div>
            {ind.type === 'signal' && (
              <span className={`ind-status ${cls}`}>{statusLabel}</span>
            )}
            {ind.type === 'price' && (
              <span className="num" style={{ color: ind.color }}>
                {N(ind.field?.value)}
              </span>
            )}
            {ind.type === 'text' && (
              <span style={{ fontSize: '11px', color: ind.field?.value ? 'var(--neutral)' : 'var(--text3)', fontWeight: 600, maxWidth: '120px', textAlign: 'right' }}>
                {ind.field?.value || '—'}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
