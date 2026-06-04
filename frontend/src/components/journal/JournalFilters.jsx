import React from 'react'

const INPUT_STYLE = {
  background: 'var(--card2)',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  color: 'var(--text)',
  fontSize: '12px',
  padding: '5px 8px',
  outline: 'none',
}

export default function JournalFilters({ filters, onChange }) {
  const update = (key, val) => onChange({ ...filters, [key]: val })

  const hasActive = filters.symbol || filters.positionType ||
    filters.dateFrom || filters.dateTo || filters.minScore

  return (
    <div
      className="card reveal r-4"
      style={{ marginBottom: 'var(--gap)', padding: '12px 16px' }}
    >
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center',
      }}>
        {/* Symbol */}
        <input
          type="text"
          placeholder="Symbol (e.g. MES)"
          value={filters.symbol}
          onChange={e => update('symbol', e.target.value)}
          style={{ ...INPUT_STYLE, width: '130px' }}
        />

        {/* Direction toggle */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {['', 'LONG', 'SHORT'].map(v => (
            <button
              key={v || 'all'}
              onClick={() => update('positionType', v)}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                background: filters.positionType === v ? 'var(--accent)' : 'var(--card2)',
                color: filters.positionType === v ? 'var(--bg)' : 'var(--text-2)',
                cursor: 'pointer',
                fontWeight: filters.positionType === v ? 600 : 400,
              }}
            >
              {v || 'All'}
            </button>
          ))}
        </div>

        {/* Date range */}
        <input
          type="date"
          value={filters.dateFrom}
          onChange={e => update('dateFrom', e.target.value)}
          style={{ ...INPUT_STYLE, width: '130px' }}
        />
        <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>→</span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={e => update('dateTo', e.target.value)}
          style={{ ...INPUT_STYLE, width: '130px' }}
        />

        {/* Min score */}
        <input
          type="number"
          placeholder="Min score"
          min="1" max="10"
          value={filters.minScore}
          onChange={e => update('minScore', e.target.value)}
          style={{ ...INPUT_STYLE, width: '90px' }}
        />

        {/* Clear */}
        {hasActive && (
          <button
            onClick={() => onChange({ symbol: '', positionType: '', dateFrom: '', dateTo: '', minScore: '' })}
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-3)',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
