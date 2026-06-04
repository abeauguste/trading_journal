import React, { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine,
} from 'recharts'

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
      color: v >= 0 ? 'var(--bull)' : 'var(--bear)',
    }}>
      <div style={{ color: 'var(--text-3)', marginBottom: '2px' }}>Trade {label}</div>
      <div>${v?.toFixed(2)}</div>
    </div>
  )
}

export default function EquityCurveChart({ trades }) {
  const data = useMemo(() => {
    if (!trades?.length) return []
    const sorted = [...trades].sort((a, b) => {
      const da = (a.entry_date || '') + (a.entry_time || '')
      const db = (b.entry_date || '') + (b.entry_time || '')
      return da < db ? -1 : da > db ? 1 : 0
    })
    let cum = 0
    return sorted.map((t, i) => {
      cum += t.net_pnl || 0
      return { idx: i + 1, equity: +cum.toFixed(2) }
    })
  }, [trades])

  if (!data.length) return (
    <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
      No data
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="eq-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--gold)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--gold)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="idx" tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={54} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="var(--border2)" strokeDasharray="4 2" />
        <Area
          type="monotone"
          dataKey="equity"
          stroke="var(--gold)"
          strokeWidth={1.5}
          fill="url(#eq-grad)"
          dot={false}
          activeDot={{ r: 3, fill: 'var(--gold)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
