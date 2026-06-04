import { useState, useCallback } from 'react'
import { ACTIVE_SYMBOL_KEY } from '../config/symbols'

const VALID = ['ES', 'NQ']

function initialSymbol() {
  try {
    const stored = localStorage.getItem(ACTIVE_SYMBOL_KEY)
    if (stored && VALID.includes(stored)) return stored
  } catch (e) { /* localStorage unavailable */ }
  return 'ES'
}

export function useSymbol() {
  const [symbol, setSymbolState] = useState(initialSymbol)

  const setSymbol = useCallback((next) => {
    if (!VALID.includes(next)) return
    setSymbolState(next)
    try { localStorage.setItem(ACTIVE_SYMBOL_KEY, next) } catch (e) { /* ignore */ }
  }, [])

  return [symbol, setSymbol]
}
