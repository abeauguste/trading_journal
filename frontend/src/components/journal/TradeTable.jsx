import React, { useState, useMemo } from 'react'
import { N } from '../../utils/format'
import { JOURNAL_PAGE_SIZE as PAGE_SIZE } from '../../api'

function formatDuration(min) {
  if (min == null) return '—'
  if (min < 60) return `${Math.round(min)}m`
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function ScorePill({ score }) {
  if (score == null) return <span style={{ color: 'var(--text-3)' }}>—</span>
  const cls = score >= 9 ? 'pill pill-gold'
            : score >= 7 ? 'pill'
            : 'pill pill-bear'
  return <span className={cls}>{score}</span>
}

function TagList({ tags }) {
  if (!tags) return null
  return (
    <span style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
      {tags.split(',').map((t, i) => (
        <span
          key={i}
          style={{
            fontSize: '10px',
            padding: '1px 5px',
            borderRadius: '3px',
            background: 'var(--card2)',
            border: '1px solid var(--border)',
            color: 'var(--text-3)',
            whiteSpace: 'nowrap',
          }}
        >
          {t.trim()}
        </span>
      ))}
    </span>
  )
}

function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col) return <span style={{ color: 'var(--text-3)', marginLeft: '3px' }}>↕</span>
  return <span style={{ color: 'var(--accent)', marginLeft: '3px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
}

const SORTABLE = ['entry_date', 'net_pnl', 'r_multiple', 'trade_quality_score']

export default function TradeTable({ trades, total, page, onPageChange, onUpdateTrade, onDeleteTrade, loading, compact = true, onToggleCompact }) {
  const [expandedId, setExpandedId] = useState(null)
  const [editState, setEditState] = useState({})
  const [sortKey, setSortKey] = useState('entry_date')
  const [sortDir, setSortDir] = useState('desc')

  const sorted = useMemo(() => {
    if (!trades?.length) return []
    return [...trades].sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey]
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [trades, sortKey, sortDir])

  const COMPACT_SIZE = 5
  const displayRows = compact ? sorted.slice(0, COMPACT_SIZE) : sorted

  const toggleSort = (col) => {
    if (sortKey === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(col); setSortDir('desc') }
  }

  const toggleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); setEditState({}) }
    else {
      const t = trades.find(x => x.id === id)
      setExpandedId(id)
      setEditState({ notes: t?.notes || '', setup_quality: t?.setup_quality || '' })
    }
  }

  const handleSave = async (id) => {
    await onUpdateTrade(id, editState)
    setExpandedId(null)
    setEditState({})
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const startRow   = (page - 1) * PAGE_SIZE + 1
  const endRow     = Math.min(page * PAGE_SIZE, total)

  const thStyle = (col) => ({
    padding: '8px 10px',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '.07em',
    color: 'var(--text-3)',
    textAlign: 'left',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    borderBottom: '1px solid var(--border)',
    cursor: SORTABLE.includes(col) ? 'pointer' : 'default',
    userSelect: 'none',
  })

  const tdStyle = {
    padding: '8px 10px',
    fontSize: '12px',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
  }

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle('entry_date')} onClick={() => toggleSort('entry_date')}>
                Date <SortIcon col="entry_date" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th style={thStyle('symbol')}>Symbol</th>
              <th style={thStyle('position_type')}>Dir</th>
              <th style={thStyle('entry_price')}>Entry</th>
              <th style={thStyle('exit_price')}>Exit</th>
              <th style={thStyle('points')}>Pts</th>
              <th style={thStyle('net_pnl')} onClick={() => toggleSort('net_pnl')}>
                Net P&L <SortIcon col="net_pnl" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th style={thStyle('r_multiple')} onClick={() => toggleSort('r_multiple')}>
                R <SortIcon col="r_multiple" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th style={thStyle('duration_min')}>Duration</th>
              <th style={thStyle('strategy_tag')}>Session</th>
              <th style={thStyle('trade_quality_score')} onClick={() => toggleSort('trade_quality_score')}>
                Score <SortIcon col="trade_quality_score" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th style={thStyle('tags')}>Tags</th>
              <th style={thStyle('actions')}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={13} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-3)', padding: '24px' }}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && sorted.length === 0 && (
              <tr>
                <td colSpan={13} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-3)', padding: '24px' }}>
                  No trades found. Adjust filters or import trades to get started.
                </td>
              </tr>
            )}
            {!loading && displayRows.map(t => (
              <React.Fragment key={t.id}>
                <tr
                  style={{
                    cursor: 'pointer',
                    background: expandedId === t.id ? 'var(--card2)' : 'transparent',
                  }}
                  onClick={() => toggleExpand(t.id)}
                >
                  <td style={tdStyle}>
                    <div style={{ color: 'var(--text-2)' }}>{t.entry_date}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{t.entry_time?.slice(0, 5)}</div>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--f-mono)', fontWeight: 600 }}>
                    {t.symbol}
                    {t.contract && <span style={{ color: 'var(--text-3)', marginLeft: '3px', fontSize: '10px' }}>{t.contract}</span>}
                  </td>
                  <td style={tdStyle}>
                    <span className={t.position_type === 'LONG' ? 'pill pill-bull' : 'pill pill-bear'}>
                      {t.position_type}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--f-mono)' }}>{N(t.entry_price)}</td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--f-mono)' }}>{N(t.exit_price)}</td>
                  <td style={{
                    ...tdStyle,
                    fontFamily: 'var(--f-mono)',
                    color: (t.points ?? 0) > 0 ? 'var(--bull)' : (t.points ?? 0) < 0 ? 'var(--bear)' : 'var(--text)',
                  }}>
                    {t.points != null ? ((t.points > 0 ? '+' : '') + N(t.points)) : '—'}
                  </td>
                  <td style={{
                    ...tdStyle,
                    fontFamily: 'var(--f-mono)',
                    fontWeight: 600,
                    color: (t.net_pnl ?? 0) > 0 ? 'var(--bull)' : (t.net_pnl ?? 0) < 0 ? 'var(--bear)' : 'var(--text)',
                  }}>
                    {t.net_pnl != null ? `$${N(t.net_pnl)}` : '—'}
                  </td>
                  <td style={{
                    ...tdStyle,
                    fontFamily: 'var(--f-mono)',
                    color: (t.r_multiple ?? 0) > 0 ? 'var(--bull)' : (t.r_multiple ?? 0) < 0 ? 'var(--bear)' : 'var(--text)',
                  }}>
                    {t.r_multiple != null ? N(t.r_multiple, 2) + 'R' : '—'}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-2)' }}>
                    {formatDuration(t.duration_min)}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-2)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.strategy_tag || '—'}
                  </td>
                  <td style={tdStyle}>
                    <ScorePill score={t.trade_quality_score} />
                  </td>
                  <td style={tdStyle}>
                    <TagList tags={t.tags} />
                  </td>
                  <td style={tdStyle} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { if (window.confirm('Delete this trade?')) onDeleteTrade(t.id) }}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--bear)',
                        cursor: 'pointer',
                      }}
                    >
                      Del
                    </button>
                  </td>
                </tr>

                {/* Expanded annotation row */}
                {expandedId === t.id && (
                  <tr>
                    <td
                      colSpan={13}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--card2)',
                        borderBottom: '1px solid var(--border)',
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <div style={{ flex: '1 1 200px' }}>
                          <label style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: '4px' }}>
                            Setup Quality
                          </label>
                          <input
                            type="text"
                            value={editState.setup_quality}
                            onChange={e => setEditState(s => ({ ...s, setup_quality: e.target.value }))}
                            placeholder="e.g. A, B, C"
                            style={{
                              width: '100%',
                              background: 'var(--card)',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              color: 'var(--text)',
                              fontSize: '12px',
                              padding: '6px 8px',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        <div style={{ flex: '3 1 300px' }}>
                          <label style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: '4px' }}>
                            Notes
                          </label>
                          <textarea
                            value={editState.notes}
                            onChange={e => setEditState(s => ({ ...s, notes: e.target.value }))}
                            rows={3}
                            placeholder="Trade notes, observations, lessons learned…"
                            style={{
                              width: '100%',
                              background: 'var(--card)',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              color: 'var(--text)',
                              fontSize: '12px',
                              padding: '6px 8px',
                              outline: 'none',
                              resize: 'vertical',
                              boxSizing: 'border-box',
                              fontFamily: 'var(--f-sans)',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', paddingBottom: '2px' }}>
                          <button
                            className="sbtn sbtn-primary"
                            onClick={() => handleSave(t.id)}
                            style={{ fontSize: '12px', padding: '6px 14px' }}
                          >
                            Save
                          </button>
                          <button
                            className="sbtn"
                            onClick={() => { setExpandedId(null); setEditState({}) }}
                            style={{ fontSize: '12px', padding: '6px 14px' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      {t.notes && (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-2)' }}>
                          <span style={{ color: 'var(--text-3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.07em' }}>Current note: </span>
                          {t.notes}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {compact && sorted.length > COMPACT_SIZE && (
              <tr>
                <td colSpan={13} style={{
                  textAlign: 'center', padding: '10px', fontSize: '11px',
                  color: 'var(--text-3)', borderTop: '1px solid var(--border)',
                }}>
                  Showing 5 of {sorted.length} — click "Show all" to expand
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!compact && total > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          fontSize: '12px',
          color: 'var(--text-3)',
        }}>
          <span>{startRow}–{endRow} of {total} trades</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: page <= 1 ? 'var(--text-3)' : 'var(--text)',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
              }}
            >
              Prev
            </button>
            <span style={{ padding: '4px 8px', color: 'var(--text-2)' }}>
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: page >= totalPages ? 'var(--text-3)' : 'var(--text)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '12px',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
