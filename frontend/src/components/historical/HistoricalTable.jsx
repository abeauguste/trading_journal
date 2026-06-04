import React, { useState } from 'react'
import { N, postureClass } from '../../utils/format'

export default function HistoricalTable({ historical, mode = 'archive' }) {
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...historical].sort((a, b) => {
    const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    return sortDir === 'asc' ? av - bv : bv - av
  })

  const th = (key, label) => (
    <th onClick={() => handleSort(key)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      {label}{sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  )

  if (sorted.length === 0) {
    return <div className="muted" style={{ padding: '20px', fontSize: '13px' }}>No data yet.</div>
  }

  if (mode === 'forecast') {
    return (
      <table className="table">
        <thead>
          <tr>
            {th('sheet',       'Week')}
            {th('open',        'ES Price')}
            {th('weekly_bias', 'Bias')}
            {th('vwap_d',      'VWAP-D')}
            {th('vwap_w',      'VWAP-W')}
            {th('vwap_m',      'VWAP-M')}
            {th('atr_current', 'ATR')}
            {th('bull_entry',  'Bull Entry')}
            {th('bull_target', 'Bull Tgt')}
            {th('bear_entry',  'Bear Entry')}
            {th('bear_target', 'Bear Tgt')}
          </tr>
        </thead>
        <tbody>
          {sorted.map((h, i) => (
            <tr key={i}>
              <td className="mono tone-gold">{h.sheet || h.week_label || '—'}</td>
              <td className="mono">{N(h.open)}</td>
              <td>
                <span className={`pill${h.weekly_bias === 'BULL' ? ' pill-bull' : h.weekly_bias === 'BEAR' ? ' pill-bear' : ' pill-gold'}`} style={{ fontSize: '9.5px' }}>
                  {h.weekly_bias || '—'}
                </span>
              </td>
              <td className="mono tone-gold">{N(h.vwap_d)}</td>
              <td className="mono tone-gold">{N(h.vwap_w)}</td>
              <td className="mono" style={{ color: 'var(--gold-2)' }}>{N(h.vwap_m)}</td>
              <td className="mono">{h.atr_current != null ? N(h.atr_current, 1) : '—'}</td>
              <td className="mono tone-bull">{N(h.bull_entry)}</td>
              <td className="mono tone-bull">{N(h.bull_target)}</td>
              <td className="mono tone-bear">{N(h.bear_entry)}</td>
              <td className="mono tone-bear">{N(h.bear_target)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  // mode === 'archive' — original legacy columns
  return (
    <table className="table">
      <thead>
        <tr>
          {th('sheet',    'Week')}
          {th('contract', 'Contract')}
          {th('open',     'Open')}
          {th('h1',       'H1')}
          {th('h2',       'H2')}
          {th('l1',       'L1')}
          {th('l2',       'L2')}
          {th('vwap_d',   'VWAP-D')}
          {th('vwap_w',   'VWAP-W')}
          {th('vwap_m',   'VWAP-M')}
          {th('posture',  'Posture')}
          {th('plan',     'Plan')}
        </tr>
      </thead>
      <tbody>
        {sorted.map((h, i) => (
          <tr key={i}>
            <td className="mono tone-gold">{h.sheet || '—'}</td>
            <td className="mono muted">{h.contract || '—'}</td>
            <td className="mono">{N(h.open)}</td>
            <td className="mono tone-bear">{N(h.h1)}</td>
            <td className="mono tone-bear">{N(h.h2)}</td>
            <td className="mono tone-bull">{N(h.l1)}</td>
            <td className="mono tone-bull">{N(h.l2)}</td>
            <td className="mono tone-gold">{N(h.vwap_d)}</td>
            <td className="mono tone-gold">{N(h.vwap_w)}</td>
            <td className="mono" style={{ color: 'var(--gold-2)' }}>{N(h.vwap_m)}</td>
            <td className={postureClass(h.posture)}>{h.posture || '—'}</td>
            <td className={`mono ${h.plan === 'BUY' ? 'tone-bull' : h.plan === 'SELL' ? 'tone-bear' : 'tone-gold'}`}>
              {h.plan || '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
