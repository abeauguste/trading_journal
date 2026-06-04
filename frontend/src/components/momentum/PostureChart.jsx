import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell
} from 'recharts'
import { postureScore } from '../../utils/format'

export default function PostureChart({ allWeeks = [] }) {
  const data = allWeeks.map(w => ({
    week: w.sheet?.replace('Week of ', '') || '',
    score: postureScore(w.weekly.es_weekly_posture?.value),
    posture: w.weekly.es_weekly_posture?.value || '—',
  }))

  if (data.length === 0) {
    return <div className="chart-placeholder">No posture data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="week" tick={{ fill: 'var(--text3)', fontSize: 9 }} />
        <YAxis
          domain={[-3, 3]}
          ticks={[-3, -2, -1, 0, 1, 2, 3]}
          tick={{ fill: 'var(--text3)', fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--card2)',
            border: '1px solid var(--border2)',
            color: 'var(--text)',
            fontSize: '11px',
          }}
          formatter={(val, _, props) => [props.payload.posture, 'Posture']}
        />
        <Bar dataKey="score" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.score >= 0 ? 'var(--bull)' : 'var(--bear)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
