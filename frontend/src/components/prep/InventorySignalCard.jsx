import React from 'react'

export default function InventorySignalCard({ inventorySignal, inventoryDetail, currentPrice, pdc }) {
  // Nothing meaningful to show until we have an actual signal.
  if (inventorySignal == null) return null

  const pillClass = inventorySignal === 'LONG' ? 'pill pill-bull'
    : inventorySignal === 'SHORT' ? 'pill pill-bear'
    : 'pill pill-gold'

  return (
    <div className="card">
      <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <span className="eyebrow">Overnight Inventory</span>
        <span className={pillClass} style={{ fontSize: '13px', fontWeight: 600 }}>
          {inventorySignal || '—'}
        </span>
        {inventorySignal != null && (
          <span style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--f-mono)' }}>
            {inventoryDetail}
          </span>
        )}
      </div>
    </div>
  )
}
