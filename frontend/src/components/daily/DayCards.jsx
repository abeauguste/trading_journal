import React from 'react'
import DayCard from './DayCard'

export default function DayCards({ week }) {
  if (!week) return null
  const daily = week.daily || []
  const days = Array.from({ length: 5 }, (_, i) => daily[i] || null)

  return (
    <div className="day-cards">
      {days.map((day, i) => (
        <DayCard key={i} day={day} index={i} />
      ))}
    </div>
  )
}
