import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts'

export default function VixChart({ allWeeks = [] }) {
  const data = allWeeks.map(w => ({
    week: w.sheet?.replace('Week of ', '') || '',
    monthly: w.weekly.vix_monthly_proj_price?.value,
    weekly: w.weekly.vix_weekly_proj_price?.value,
    daily: w.weekly.vix_daily_proj_price?.value,
  })).filter(d => d.monthly != null || d.weekly != null || d.daily != null)

  if (data.length === 0) {
    return <div className="chart-placeholder">No VIX data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="week" tick={{ fill: 'var(--text3)', fontSize: 9 }} />
        <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            background: 'var(--card2)',
            border: '1px solid var(--border2)',
            color: 'var(--text)',
            fontSize: '11px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '10px', color: 'var(--text3)' }} />
        <Line type="monotone" dataKey="monthly" name="Monthly" stroke="var(--bear)" strokeWidth={1.5} dot={false} connectNulls />
        <Line type="monotone" dataKey="weekly" name="Weekly" stroke="var(--neutral)" strokeWidth={1.5} dot={false} connectNulls />
        <Line type="monotone" dataKey="daily" name="Daily" stroke="var(--accent)" strokeWidth={1.5} dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}
