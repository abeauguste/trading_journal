import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts'

export default function HistoricalChart({ historical }) {
  const data = historical.map(h => ({
    week: h.sheet?.replace('Week of ', '') || h.date || '',
    open: h.open,
    vwap_d: h.vwap_d,
    vwap_w: h.vwap_w,
    vwap_m: h.vwap_m,
  }))

  if (data.length === 0) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '8px',
      }}>
        <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>No forecast snapshots yet</span>
        <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>
          Go to Weekly tab → Refresh to generate your first forecast. Chart populates automatically.
        </span>
      </div>
    )
  }

  const allVals = data.flatMap(d => [d.open, d.vwap_d, d.vwap_w, d.vwap_m].filter(v => v != null))
  const minVal = allVals.length > 0 ? Math.min(...allVals) - 50 : 'auto'
  const maxVal = allVals.length > 0 ? Math.max(...allVals) + 50 : 'auto'

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="week" tick={{ fill: 'var(--text3)', fontSize: 9 }} />
        <YAxis domain={[minVal, maxVal]} tick={{ fill: 'var(--text3)', fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            background: 'var(--card2)',
            border: '1px solid var(--border2)',
            color: 'var(--text)',
            fontSize: '11px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '10px', color: 'var(--text3)' }} />
        <Line type="monotone" dataKey="open" name="ES Open" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
        <Line type="monotone" dataKey="vwap_d" name="VWAP Daily" stroke="rgba(88,166,255,.5)" strokeWidth={1} strokeDasharray="4 4" dot={false} connectNulls />
        <Line type="monotone" dataKey="vwap_w" name="VWAP Weekly" stroke="rgba(88,166,255,.35)" strokeWidth={1} strokeDasharray="6 3" dot={false} connectNulls />
        <Line type="monotone" dataKey="vwap_m" name="VWAP Monthly" stroke="var(--gold)" strokeWidth={1.5} strokeDasharray="8 4" dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}
