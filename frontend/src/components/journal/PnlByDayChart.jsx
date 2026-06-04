import React, { useMemo } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '4px',
      padding: '8px 12px',
      fontSize: '12px',
    }}>
      <div style={{ color: 'var(--text-3)', marginBottom: '2px' }}>{label}</div>
      <div style={{ color: v >= 0 ? 'var(--bull)' : 'var(--bear)' }}>${v?.toFixed(2)}</div>
    </div>
  )
}

export default function PnlByDayChart({ byDayOfWeek }) {
  const data = useMemo(() => {
    if (!byDayOfWeek) return []
    return DAY_ORDER
      .filter(d => byDayOfWeek[d] !== undefined)
      .map(d => ({ day: d.slice(0, 3), pnl: byDayOfWeek[d] }))
  }, [byDayOfWeek])

  if (!data.length) return (
    <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
      No data
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={50} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="var(--border2)" />
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.pnl >= 0 ? 'var(--bull)' : 'var(--bear)'}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
