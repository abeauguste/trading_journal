/**
 * ES Module adapter for aa_data_processor.js + aa_upload_handler.js
 * Uses npm papaparse + xlsx instead of CDN globals.
 *
 * Inlines the full logic from aa_data_processor.js as plain ES functions.
 */
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

// ---- Configuration defaults ----
const DEFAULT_CFG = {
  starting_equity: 8500,
  commission_side: 1.50,
  multiplier: 5.0,
  risk_pts_default: 20,
  fifo_per_contract: true,
}

// ---- Format detection ----
function detectFormat(rows) {
  if (!rows || !rows.length) return 'unknown'
  const headers = Object.keys(rows[0] || {}).map(h => (h || '').toString().toLowerCase())
  const has = (k) => headers.some(h => h.includes(k))

  if (has('trade id') && has('net p&l') && has('position type')) return 'aa-clean'
  if (has('symbol') && has('fill') && has('description') && has('status')) return 'schwab'
  if (has('symb') && has('trade date') && has('price') && has('qty')) return 'tos-history'
  if (has('symbol') && has('date/time') && has('quantity') && has('trade price')) return 'ibkr'
  if (has('date') && has('symbol') && has('price') && (has('side') || has('action'))) return 'generic'
  return 'unknown'
}

// ---- Parse date/time strings ----
function parseDateTime(s) {
  if (!s) return null
  if (s instanceof Date) return s
  s = s.toString().trim()
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2}):?(\d{2})?\s*(AM|PM)?$/i)
  if (m) {
    let h = parseInt(m[4], 10)
    const ap = (m[7] || '').toUpperCase()
    if (ap === 'PM' && h < 12) h += 12
    if (ap === 'AM' && h === 12) h = 0
    return new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2]), h, parseInt(m[5]), parseInt(m[6] || 0))
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

// ---- Normalize fills from broker format ----
function normalizeFills(rows, fmt) {
  const out = []
  if (fmt === 'aa-clean') {
    return { type: 'trades', rows }
  }
  if (fmt === 'schwab') {
    let carrySymbol = null, carryTime = null, carryId = null
    for (const r of rows) {
      if ((r.Status || '').trim() !== 'Filled') continue
      let symbol = r.Symbol, ts = r.Time, oid = r.ID
      if (!symbol || symbol === '--') {
        if (!ts || ts === '--') continue
        symbol = carrySymbol; ts = carryTime; oid = carryId
      } else {
        carrySymbol = symbol; carryTime = ts; carryId = oid
      }
      const m = (r.Fill || '').match(/^\s*(\d+)\s*@\s*([0-9.]+)\s*$/)
      if (!m) continue
      const qty = parseInt(m[1], 10), price = parseFloat(m[2])
      const sm = (r.Description || '').match(/\b(Buy|Sell)\b/i)
      if (!sm) continue
      const side = sm[1].toUpperCase()
      const cm = (r.Description || '').match(/\/MES([A-Z]\d)/)
      const contract = cm ? cm[1] : ''
      const dt = parseDateTime(ts)
      if (!dt) continue
      for (let i = 0; i < qty; i++) {
        out.push({ ts: dt, symbol: 'MES', contract, side, qty: 1, price, order_id: oid, raw: r })
      }
    }
    return { type: 'fills', rows: out.sort((a, b) => a.ts - b.ts) }
  }
  if (fmt === 'ibkr') {
    for (const r of rows) {
      const q = parseFloat(r.Quantity)
      if (!q || isNaN(q)) continue
      const dt = parseDateTime(r['Date/Time'] || r.DateTime)
      if (!dt) continue
      for (let i = 0; i < Math.abs(q); i++) {
        out.push({
          ts: dt, symbol: r.Symbol, contract: r.Symbol,
          side: q > 0 ? 'BUY' : 'SELL', qty: 1,
          price: parseFloat(r['TradePrice'] || r['Trade Price']),
          order_id: r.OrderID || r.IbOrderID || ('IBKR-' + dt.getTime()),
          raw: r,
        })
      }
    }
    return { type: 'fills', rows: out.sort((a, b) => a.ts - b.ts) }
  }
  if (fmt === 'generic' || fmt === 'tos-history') {
    for (const r of rows) {
      const dt = parseDateTime(r.Date || r['Trade Date'] || r.Datetime || r.Time)
      if (!dt) continue
      const sideRaw = (r.Side || r.Action || r.B_S || '').toString().toUpperCase()
      const side = sideRaw.includes('S') ? 'SELL' : 'BUY'
      const qty = parseInt(r.Qty || r.Quantity || r.Size || '1', 10) || 1
      const price = parseFloat(r.Price || r['Trade Price'] || r['Fill Price'])
      if (!price || isNaN(price)) continue
      for (let i = 0; i < qty; i++) {
        out.push({
          ts: dt, symbol: r.Symbol || r.Symb || 'UNKNOWN', contract: r.Contract || r.Symbol || '',
          side, qty: 1, price,
          order_id: r['Order ID'] || r.OrderID || r.ID || ('GEN-' + dt.getTime() + '-' + i),
          raw: r,
        })
      }
    }
    return { type: 'fills', rows: out.sort((a, b) => a.ts - b.ts) }
  }
  return { type: 'fills', rows: [] }
}

// ---- Close a single round-turn trade ----
function closeTrade(tid, dir, entry, exit_, contract, cfg) {
  const pts = dir === 'LONG' ? (exit_.price - entry.price) : (entry.price - exit_.price)
  const gross = pts * cfg.multiplier
  const fees = cfg.commission_side * 2
  const dur_min = (exit_.ts - entry.ts) / 60000
  const hr = entry.ts.getHours()
  const session =
    hr < 7  ? 'Overnight/Asia' :
    hr < 9  ? 'Pre-Market' :
    hr < 11 ? 'NY Open' :
    hr < 13 ? 'Morning' :
    hr < 15 ? 'Lunch/Mid' :
    hr < 17 ? 'Afternoon Close' : 'Evening'
  const risk_pts = cfg.risk_pts_default
  const risk_dollars = risk_pts * cfg.multiplier
  const r_mult = pts / risk_pts
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][entry.ts.getDay()]
  return {
    'Trade ID':           'T' + String(tid).padStart(4, '0'),
    'Entry Date':         entry.ts.toISOString().slice(0, 10),
    'Entry Time':         entry.ts.toTimeString().slice(0, 8),
    'Exit Date':          exit_.ts.toISOString().slice(0, 10),
    'Exit Time':          exit_.ts.toTimeString().slice(0, 8),
    'Symbol':             entry.symbol,
    'Contract':           contract,
    'Asset Class':        'Futures (Equity Index)',
    'Position Type':      dir,
    'Entry Price':        entry.price,
    'Exit Price':         exit_.price,
    'Stop Loss':          '',
    'Take Profit':        '',
    'Position Size':      1,
    'Risk ($)':           risk_dollars,
    'Risk (%)':           +(risk_dollars / cfg.starting_equity * 100).toFixed(3),
    'Fees/Commission':    fees,
    'Slippage':           '',
    'Points':             +pts.toFixed(2),
    'Gross P&L':          +gross.toFixed(2),
    'Net P&L':            +(gross - fees).toFixed(2),
    'R Multiple':         +r_mult.toFixed(3),
    'Duration (min)':     +dur_min.toFixed(1),
    'Duration (hrs)':     +(dur_min / 60).toFixed(2),
    'Day of Week':        dayName,
    'Entry Hour':         hr,
    'Strategy Tag':       session,
    'Setup Quality':      '',
    'Entry Order ID':     entry.order_id,
    'Exit Order ID':      exit_.order_id,
  }
}

// ---- Score trades in-place ----
function scoreTrades(trades) {
  const strong = new Set(['Pre-Market', 'NY Open', 'Morning'])
  trades.forEach(r => {
    let s = 5
    if (r['Net P&L'] > 0) s += 2
    if (r['R Multiple'] >= 1) s += 1
    const d = r['Duration (min)']
    if (d >= 10 && d <= 240) s += 1
    if (strong.has(r['Strategy Tag'])) s += 1
    if (r['R Multiple'] <= -1) s -= 2
    if (d < 2) s -= 1
    if (r['Strategy Tag'] === 'Overnight/Asia' || r['Strategy Tag'] === 'Evening') s -= 1
    r['Trade Quality Score'] = Math.max(1, Math.min(10, s))
    const tags = [r['Net P&L'] > 0 ? 'Win' : (r['Net P&L'] < 0 ? 'Loss' : 'Breakeven')]
    if (r['Trade Quality Score'] >= 9) tags.push('A+ Setup')
    if (r['R Multiple'] <= -1) tags.push('Mistake')
    if (d < 2) tags.push('Scalp')
    if (r['Strategy Tag'] === 'Overnight/Asia' || r['Strategy Tag'] === 'Evening') tags.push('Off-Hours')
    r['Tags'] = tags.join(', ')
  })
  return trades
}

// ---- FIFO build round-turn trades ----
function buildTrades(fills, cfg) {
  cfg = Object.assign({}, DEFAULT_CFG, cfg || {})
  const trades = []
  const groups = {}
  fills.forEach(f => {
    const key = f.contract || f.symbol || ''
    if (!groups[key]) groups[key] = []
    groups[key].push(f)
  })

  let tid = 1
  for (const key in groups) {
    const arr = groups[key].sort((a, b) => a.ts - b.ts)
    const longQ = [], shortQ = []
    arr.forEach(o => {
      if (o.side === 'BUY') {
        if (shortQ.length) trades.push(closeTrade(tid++, 'SHORT', shortQ.shift(), o, key, cfg))
        else longQ.push(o)
      } else {
        if (longQ.length) trades.push(closeTrade(tid++, 'LONG', longQ.shift(), o, key, cfg))
        else shortQ.push(o)
      }
    })
  }
  scoreTrades(trades)
  return trades
}

// ---- KPI computation ----
function computeKPIs(trades, cfg) {
  cfg = Object.assign({}, DEFAULT_CFG, cfg || {})
  const n = trades.length
  const pnl = trades.map(t => +t['Net P&L'])
  const wins = pnl.filter(v => v > 0)
  const losses = pnl.filter(v => v < 0)
  const sum = arr => arr.reduce((a, b) => a + b, 0)
  const mean = arr => arr.length ? sum(arr) / arr.length : 0
  const winSum = sum(wins), lossSum = sum(losses)
  const equity = pnl.reduce((acc, v, i) => {
    acc.push((acc[i - 1] || cfg.starting_equity) + v)
    return acc
  }, [])
  let peak = -Infinity, mdd = 0, mddPct = 0
  equity.forEach(v => {
    if (v > peak) peak = v
    const d = v - peak
    if (d < mdd) { mdd = d; mddPct = d / peak }
  })
  return {
    'Total Trades':        n,
    'Winning Trades':      wins.length,
    'Losing Trades':       losses.length,
    'Win Rate %':          +(wins.length / n * 100).toFixed(2),
    'Net P&L $':           +sum(pnl).toFixed(2),
    'Profit Factor':       lossSum < 0 ? +(winSum / -lossSum).toFixed(3) : null,
    'Expectancy $/trade':  +mean(pnl).toFixed(2),
    'Avg Win $':           +mean(wins).toFixed(2),
    'Avg Loss $':          +mean(losses).toFixed(2),
    'Largest Win $':       Math.max(...wins, 0),
    'Largest Loss $':      Math.min(...losses, 0),
    'Max Drawdown $':      +mdd.toFixed(2),
    'Max Drawdown %':      +(mddPct * 100).toFixed(2),
    'Ending Equity $':     equity.length ? equity[equity.length - 1] : cfg.starting_equity,
    'Total Return %':      +(sum(pnl) / cfg.starting_equity * 100).toFixed(2),
  }
}

// ---- Dedupe by composite key ----
function dedupe(existing, incoming) {
  const seen = new Set(existing.map(t =>
    `${t['Trade ID']}|${t['Entry Order ID']}|${t['Exit Order ID']}|${t['Entry Date']}|${t['Entry Time']}|${t['Exit Price']}`
  ))
  const merged = existing.slice()
  let added = 0
  for (const t of incoming) {
    const key = `${t['Trade ID']}|${t['Entry Order ID']}|${t['Exit Order ID']}|${t['Entry Date']}|${t['Entry Time']}|${t['Exit Price']}`
    const altKey = `${t['Entry Order ID']}|${t['Exit Order ID']}`
    const hasAlt = existing.some(e => `${e['Entry Order ID']}|${e['Exit Order ID']}` === altKey)
    if (!seen.has(key) && !hasAlt) {
      merged.push(t); added++
    }
  }
  return { merged, added, skipped: incoming.length - added }
}

// ---- File reading helpers ----
function isCSV(name)  { return /\.csv$/i.test(name) }
function isXLSX(name) { return /\.xlsx?$/i.test(name) }

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Could not read ' + file.name))
    if (isXLSX(file.name)) reader.readAsArrayBuffer(file)
    else reader.readAsText(file)
  })
}

function parseRows(file, content) {
  if (isCSV(file.name)) {
    const allLines  = content.split('\n')
    const dataLines = allLines.filter(l => !l.trim().startsWith('#'))
    const tryParse = lines => {
      const r = Papa.parse(lines.join('\n').trim(), { header: true, skipEmptyLines: true, dynamicTyping: false })
      return r?.data?.length ? r.data : []
    }
    let rows = tryParse(dataLines)
    if (rows.length && detectFormat(rows) === 'unknown') {
      const retry = tryParse(dataLines.slice(1))
      if (retry.length && detectFormat(retry) !== 'unknown') rows = retry
    }
    return rows
  }
  if (isXLSX(file.name)) {
    const wb    = XLSX.read(content, { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    return XLSX.utils.sheet_to_json(sheet, { defval: '' })
  }
  throw new Error('Unsupported file type: ' + file.name)
}

// ---- Compute ISO week label from "YYYY-MM-DD" ----
// Uses Thursday-based ISO 8601 calculation: week belongs to the year of its Thursday.
function toWeekLabel(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T12:00:00')
  // Find the Thursday of the same ISO week (day 0=Sun → offset to Thu)
  const thu = new Date(d)
  thu.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3)
  const yearStart = new Date(thu.getFullYear(), 0, 1)
  const week = Math.ceil(((thu - yearStart) / 86400000 + 1) / 7)
  return `${thu.getFullYear()}-W${String(week).padStart(2, '0')}`
}

/**
 * Main entry point. Processes one or more files.
 * Returns { trades, formatDetected, rawFillCount }
 */
export async function processFiles(files, cfg = {}) {
  const mergedCfg = { ...DEFAULT_CFG, ...cfg }
  let allTrades = []
  let lastFormat = 'unknown'
  let totalFillCount = 0

  for (const file of Array.from(files)) {
    const content = await readFileAsync(file)
    const rows    = parseRows(file, content)
    if (!rows.length) continue
    const fmt = detectFormat(rows)
    if (fmt === 'unknown') throw new Error(`Unrecognized format in ${file.name}`)
    lastFormat = fmt
    const norm = normalizeFills(rows, fmt)

    let trades
    if (norm.type === 'trades') {
      trades = norm.rows
    } else {
      totalFillCount += norm.rows.length
      trades = buildTrades(norm.rows, mergedCfg)
    }

    // Attach week_label derived from entry_date
    trades = trades.map(t => ({
      ...t,
      week_label: toWeekLabel(t['Entry Date'] || t.entry_date),
    }))

    allTrades = allTrades.concat(trades)
  }

  return { trades: allTrades, formatDetected: lastFormat, rawFillCount: totalFillCount }
}

/**
 * Map processor field names (camelCase / "Space Name") to snake_case for the API.
 */
export function mapTradeToApi(t) {
  const safeFloat = (v) => {
    const n = parseFloat(v)
    return isNaN(n) ? null : n
  }
  const safeInt = (v) => {
    const n = parseInt(v)
    return isNaN(n) ? null : n
  }

  // Generate deterministic synthetic IDs when real order IDs are absent.
  // Same CSV re-imported → same IDs → deduplication still works correctly.
  const entryDate  = t['Entry Date']  || t.entry_date  || ''
  const entryTime  = t['Entry Time']  || t.entry_time  || ''
  const exitDate   = t['Exit Date']   || t.exit_date   || ''
  const exitTime   = t['Exit Time']   || t.exit_time   || ''
  const symbol     = t['Symbol']      || t.symbol      || ''
  const entryPrice = t['Entry Price'] || t.entry_price || ''
  const exitPrice  = t['Exit Price']  || t.exit_price  || ''

  const rawEntryId = t['Entry Order ID'] || t.entry_order_id || ''
  const rawExitId  = t['Exit Order ID']  || t.exit_order_id  || ''

  const entry_order_id = rawEntryId.trim()
    || `SYN-${symbol}-${entryDate}-${entryTime}-${entryPrice}`.replace(/\s+/g, 'T')
  const exit_order_id = rawExitId.trim()
    || `SYN-${symbol}-${exitDate}-${exitTime}-${exitPrice}`.replace(/\s+/g, 'T')

  return {
    entry_order_id,
    exit_order_id,
    trade_id_label:      t['Trade ID']       || t.trade_id_label || null,
    entry_date:          t['Entry Date']     || t.entry_date,
    entry_time:          t['Entry Time']     || t.entry_time,
    exit_date:           t['Exit Date']      || t.exit_date,
    exit_time:           t['Exit Time']      || t.exit_time,
    symbol:              t['Symbol']         || t.symbol,
    contract:            t['Contract']       || t.contract       || null,
    asset_class:         t['Asset Class']    || t.asset_class    || null,
    position_type:       t['Position Type']  || t.position_type,
    entry_price:         safeFloat(t['Entry Price'] || t.entry_price),
    exit_price:          safeFloat(t['Exit Price']  || t.exit_price),
    stop_loss:           safeFloat(t['Stop Loss']   || t.stop_loss),
    take_profit:         safeFloat(t['Take Profit'] || t.take_profit),
    position_size:       safeFloat(t['Position Size'] || t.position_size),
    risk_dollars:        safeFloat(t['Risk ($)']    || t.risk_dollars),
    risk_pct:            safeFloat(t['Risk (%)']    || t.risk_pct),
    fees_commission:     safeFloat(t['Fees/Commission'] || t.fees_commission),
    slippage:            safeFloat(t['Slippage']    || t.slippage),
    points:              safeFloat(t['Points']      || t.points),
    gross_pnl:           safeFloat(t['Gross P&L']   || t.gross_pnl),
    net_pnl:             safeFloat(t['Net P&L']     || t.net_pnl),
    r_multiple:          safeFloat(t['R Multiple']  || t.r_multiple),
    duration_min:        safeFloat(t['Duration (min)'] || t.duration_min),
    duration_hrs:        safeFloat(t['Duration (hrs)'] || t.duration_hrs),
    day_of_week:         t['Day of Week']   || t.day_of_week   || null,
    entry_hour:          safeInt(t['Entry Hour'] || t.entry_hour),
    strategy_tag:        t['Strategy Tag']  || t.strategy_tag  || null,
    setup_quality:       t['Setup Quality'] || t.setup_quality || null,
    trade_quality_score: safeInt(t['Trade Quality Score'] || t.trade_quality_score),
    tags:                t['Tags']          || t.tags          || null,
    week_label:          t['week_label']    || t.week_label    || null,
    notes:               t['notes']         || t.notes         || null,
  }
}
