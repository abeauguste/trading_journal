import React from 'react'

const TABS = [
  { id: 'intelligence', label: '🧠 Intelligence' },
  { id: 'weekly',       label: '📊 Weekly Plan' },
  { id: 'daily',        label: '📅 Daily Plans' },
  { id: 'markets',      label: '📈 Markets' },
  { id: 'historical',   label: '🕐 Historical' },
  { id: 'risk',         label: '⚖️ Risk Calc' },
  { id: 'settings',     label: '⚙️ Settings' },
]

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <div className="tabs">
      {TABS.map(t => (
        <div
          key={t.id}
          className={`tab${activeTab === t.id ? ' active' : ''}`}
          onClick={() => onTabChange(t.id)}
        >
          {t.label}
        </div>
      ))}
    </div>
  )
}
