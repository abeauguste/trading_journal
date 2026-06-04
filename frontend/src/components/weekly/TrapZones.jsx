import React from 'react'
import { N } from '../../utils/format'

export default function TrapZones({ week }) {
  if (!week) return null
  const w = week.weekly

  return (
    <div>
      <div className="trap-row t-bull" style={{ marginBottom: '7px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bear)' }}>Bull Trap Zone</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '3px' }}>
            {w.es_bull_trap_zone?.note || 'False breakout area above resistance'}
          </div>
        </div>
        <span className="num n-bear" style={{ fontSize: '18px' }}>
          {N(w.es_bull_trap_zone?.value)}
        </span>
      </div>
      <div className="trap-row t-bear">
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bull)' }}>Bear Trap Zone</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '3px' }}>
            {w.es_bear_trap_zone?.note || 'False breakdown area below support'}
          </div>
        </div>
        <span className="num n-bull" style={{ fontSize: '18px' }}>
          {N(w.es_bear_trap_zone?.value)}
        </span>
      </div>
      <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text3)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text2)' }}>Note:</strong> Bull traps form when price breaks above resistance only to reverse — short opportunity.
        Bear traps form when price breaks below support only to recover — long opportunity.
      </div>
    </div>
  )
}
