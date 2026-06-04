import React from 'react'
import { SYMBOLS } from '../../config/symbols'

export default function SymbolToggle({ symbol, onChange }) {
  return (
    <div className="sym-toggle" role="group" aria-label="Instrument">
      {Object.keys(SYMBOLS).map((code) => (
        <button
          key={code}
          type="button"
          className={`sym-seg${symbol === code ? ' is-active' : ''}`}
          aria-pressed={symbol === code}
          onClick={() => onChange(code)}
        >
          {SYMBOLS[code].label}
        </button>
      ))}
    </div>
  )
}
