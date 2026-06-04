import React from 'react'

export default function WeekSelector({ weeks, selectedWeekId, onSelect }) {
  return (
    <div className="week-selector">
      {weeks.map(w => (
        <button
          key={w.id}
          className={`wbtn${selectedWeekId === w.id ? ' active' : ''}`}
          onClick={() => onSelect(w.id)}
        >
          {w.sheet}
        </button>
      ))}
    </div>
  )
}
