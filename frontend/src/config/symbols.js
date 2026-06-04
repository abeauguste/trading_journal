export const SYMBOLS = {
  ES: { code: 'ES', label: 'ES', fullName: 'E-MINI S&P 500',    tvSymbol: 'CME_MINI:ES1!', root: 'ES' },
  NQ: { code: 'NQ', label: 'NQ', fullName: 'E-MINI NASDAQ-100', tvSymbol: 'CME_MINI:NQ1!', root: 'NQ' },
}
export const symbolCfg = (s) => SYMBOLS[s] || SYMBOLS.ES
export const ACTIVE_SYMBOL_KEY = 'aa_active_symbol'
