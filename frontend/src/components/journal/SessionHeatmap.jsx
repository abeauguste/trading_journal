import React, { useMemo } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload ?? {}
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '4px',
      padding: '8px 12px',
      fontSize: '12px',
    }}>
      <div style={{ color: 'var(--text-2)', fontWeight: 600, marginBottom: '4px' }}>{label}</div>
      <div style={{ color: 'var(--text-3)' }}>Win Rate: <span style={{ color: 'var(--text)' }}>{(d.win_rate * 100).toFixed(1)}%</span></div>
      <div style={{ color: 'var(--text-3)' }}>Trades: <span style={{ color: 'var(--text)' }}>{d.count}</span></div>
      <div style={{ color: 'var(--text-3)' }}>Avg P&L: <span style={{ color: d.avg_pnl >= 0 ? 'var(--bull)' : 'var(--bear)' }}>${d.avg_pnl?.toFixed(2)}</span></div>
    </div>
  )
}

function sessionColor(wr) {
  if (wr >= 0.55) return 'var(--bull)'
  if (wr >= 0.45) return 'var(--gold)'
  return 'var(--bear)'
}

export default function SessionHeatmap({ bySession }) {
  const data = useMemo(() => {
    if (!bySession) return []
    return Object.entries(bySession)
      .map(([sess, obj]) => ({
        session: sess,
        win_rate_pct: +(obj.win_rate * 100).toFixed(1),
        win_rate: obj.win_rate,
        count: obj.count,
        avg_pnl: obj.avg_pnl,
      }))
      .sort((a, b) => b.win_rate_pct - a.win_rate_pct)
  }, [bySession])

  if (!data.length) return (
    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
      No data
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: 'var(--text-3)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="session"
          tick={{ fontSize: 10, fill: 'var(--text-3)' }}
          tickLine={false}
          axisLine={false}
          width={90}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine x={50} stroke="var(--border2)" strokeDasharray="4 2" />
        <Bar dataKey="win_rate_pct" radius={[0, 3, 3, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={sessionColor(entry.win_rate)}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
