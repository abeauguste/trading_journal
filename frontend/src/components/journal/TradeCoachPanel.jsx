import React from 'react'
import { N } from '../../utils/format'

// ---- Rule engine (pure functions) ----

function computeStopItems(stats, byHourDay) {
  const items = []
  const s = stats

  // Bad sessions
  Object.entries(s.by_session || {}).forEach(([session, d]) => {
    if ((d.win_rate ?? 1) < 0.5 && (d.count ?? 0) >= 3) {
      items.push(`Stop trading the '${session}' session — ${d.count} trades, $${N(d.net_pnl ?? 0, 0)} net, ${N((d.win_rate ?? 0) * 100, 0)}% win rate.`)
    }
  })

  // Drawdown
  if (s.max_drawdown_dollars != null && s.max_drawdown_dollars < -500) {
    items.push(`Stop letting single losses compound — drawdown reached $${N(Math.abs(s.max_drawdown_dollars), 0)}. Hard stop at -$100/trade.`)
  }

  // Loss streak
  if ((s.streak_max_loss ?? 0) >= 3) {
    items.push(`Stop trading through loss streaks — max consecutive losses hit ${s.streak_max_loss}. Walk away after 2 in a row.`)
  }

  // Worst hour — find the single worst-performing hour (must be a net loss)
  if (byHourDay) {
    const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday']
    const hourTotals = {}
    DAYS.forEach(day => {
      Object.entries(byHourDay[day] || {}).forEach(([h, v]) => {
        hourTotals[h] = (hourTotals[h] || 0) + v
      })
    })
    let worstHour = null, worstVal = 0
    Object.entries(hourTotals).forEach(([h, total]) => {
      if (total < worstVal) { worstVal = total; worstHour = h }
    })
    if (worstHour !== null) {
      items.push(`Stop trading at ${worstHour}:00 — this hour cost $${N(Math.abs(worstVal), 0)} across all sessions.`)
    }
  }

  if (items.length === 0) items.push('No critical stop signals — data looks clean.')
  return items
}

function computeStartItems(stats, allTrades) {
  const items = []
  const s = stats

  // Best session
  const sessions = Object.entries(s.by_session || {})
    .filter(([, d]) => (d.count ?? 0) >= 3)
    .sort((a, b) => (b[1].net_pnl ?? 0) - (a[1].net_pnl ?? 0))
  if (sessions.length > 0) {
    const [session, d] = sessions[0]
    items.push(`Start concentrating size in your '${session}' session — $${N(d.net_pnl ?? 0, 0)} net, ${N((d.win_rate ?? 0) * 100, 0)}% win rate.`)
  }

  // Avg loss > avg win
  if (s.avg_loss != null && s.avg_win != null && Math.abs(s.avg_loss) > s.avg_win) {
    items.push(`Start cutting losers faster — avg loss ($${N(Math.abs(s.avg_loss), 0)}) exceeds avg win ($${N(s.avg_win, 0)}). Target ≥1.5R.`)
  }

  // Low win rate
  if (s.win_rate_pct != null && s.win_rate_pct < 60) {
    items.push(`Start documenting your stop level before every entry — win rate of ${N(s.win_rate_pct, 0)}% signals no consistent risk plan.`)
  }

  if (items.length === 0) items.push("Data doesn't yet show a clear start signal. Continue building the dataset.")
  return items
}

function computeContinueItems(stats) {
  const items = []
  const s = stats

  if ((s.win_rate_pct ?? 0) >= 60) {
    items.push(`Continue your entry discipline — ${N(s.win_rate_pct, 0)}% win rate is a strong foundation.`)
  }
  if ((s.streak_max_win ?? 0) >= 5) {
    items.push(`Continue pressing in hot streaks — you've strung ${s.streak_max_win} wins in a row.`)
  }
  if (s.best_day_of_week) {
    items.push(`Continue ${s.best_day_of_week} discipline — this day produced your strongest results.`)
  }

  if (items.length === 0) items.push('Keep logging trades — more data unlocks deeper coaching signals.')
  return items
}

function computeInsights(stats, allTrades) {
  const items = []
  const s = stats

  // AM vs PM
  if (allTrades && allTrades.length >= 6) {
    const am = allTrades.filter(t => (t.entry_hour ?? 13) < 13)
    const pm = allTrades.filter(t => (t.entry_hour ?? 13) >= 13)
    if (am.length >= 3 && pm.length >= 3) {
      const amWR = am.filter(t => (t.net_pnl ?? 0) > 0).length / am.length
      const pmWR = pm.filter(t => (t.net_pnl ?? 0) > 0).length / pm.length
      items.push(`Your AM win rate (${N(amWR * 100, 0)}%) is ${amWR > pmWR ? 'stronger' : 'weaker'} than PM (${N(pmWR * 100, 0)}%) — ${amWR > pmWR ? 'weight AM setups heavier' : 'scrutinize PM entries more carefully'}.`)
    }
  }

  // Tail risk
  if (allTrades && allTrades.length >= 10) {
    const sorted = [...allTrades].sort((a, b) => (a.net_pnl ?? 0) - (b.net_pnl ?? 0))
    const bottomN = Math.ceil(allTrades.length * 0.10)
    const worstSum = sorted.slice(0, bottomN).reduce((sum, t) => sum + (t.net_pnl ?? 0), 0)
    const totalLoss = allTrades.filter(t => (t.net_pnl ?? 0) < 0).reduce((sum, t) => sum + (t.net_pnl ?? 0), 0)
    if (totalLoss < 0) {
      const pct = Math.abs(worstSum / totalLoss) * 100
      items.push(`Your worst ${bottomN} trade${bottomN > 1 ? 's' : ''} (bottom 10%) account for ${N(pct, 0)}% of total losses — tail risk is the primary leak.`)
    }
  }

  // Commissions
  if ((s.commissions_total ?? 0) > 0 && Math.abs(s.net_pnl ?? 0) > 0) {
    const pct = s.commissions_total / Math.abs(s.net_pnl) * 100
    items.push(`Commissions ($${N(s.commissions_total, 0)}) are ${N(pct, 0)}% of |net P&L| — ${pct > 20 ? 'negotiate pricing or reduce trade frequency' : 'commissions are manageable relative to current performance'}.`)
  }

  if (items.length === 0) items.push('Import more trades to unlock personalized insights.')
  return items
}

// ---- Component ----

export default function TradeCoachPanel({ stats, allTrades, byHourDay }) {
  if (!stats) return null

  const stopItems     = computeStopItems(stats, byHourDay)
  const startItems    = computeStartItems(stats, allTrades)
  const continueItems = computeContinueItems(stats)
  const insightItems  = computeInsights(stats, allTrades)

  const colStyle = (borderColor) => ({
    background: 'var(--card2)',
    border: '1px solid var(--border)',
    borderLeft: `3px solid ${borderColor}`,
    borderRadius: '4px',
    padding: '16px',
  })
  const colHdrStyle = {
    fontSize: '10px', fontFamily: 'var(--f-mono)', textTransform: 'uppercase',
    letterSpacing: '.12em', color: 'var(--text-3)', fontWeight: 600,
    marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)',
  }
  const listStyle = { listStyle: 'none', padding: 0, margin: 0 }
  const itemStyle = (last) => ({
    fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.6,
    paddingBottom: last ? 0 : '8px', marginBottom: last ? 0 : '8px',
    borderBottom: last ? 'none' : '1px dashed var(--border)',
  })

  return (
    <div>
      {/* Stop / Start / Continue */}
      <div className="card reveal" style={{ marginBottom: 'var(--gap)' }}>
        <div className="card-hdr">
          <span className="card-title">Trade Coach</span>
          <span className="eyebrow" style={{ color: 'var(--bear)' }}>Stop / Start / Continue</span>
        </div>
        <div className="card-body">
          <div className="grid g3">
            <div style={colStyle('var(--bear)')}>
              <div style={colHdrStyle}>✗ Stop Doing</div>
              <ul style={listStyle}>
                {stopItems.map((s, i) => <li key={i} style={itemStyle(i === stopItems.length - 1)}>{s}</li>)}
              </ul>
            </div>
            <div style={colStyle('var(--gold)')}>
              <div style={colHdrStyle}>▲ Start Doing</div>
              <ul style={listStyle}>
                {startItems.map((s, i) => <li key={i} style={itemStyle(i === startItems.length - 1)}>{s}</li>)}
              </ul>
            </div>
            <div style={colStyle('var(--bull)')}>
              <div style={colHdrStyle}>✓ Continue Doing</div>
              <ul style={listStyle}>
                {continueItems.map((s, i) => <li key={i} style={itemStyle(i === continueItems.length - 1)}>{s}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Insights */}
      <div className="card reveal" style={{ marginBottom: 'var(--gap)', borderLeft: '3px solid var(--gold)', borderRadius: '4px' }}>
        <div className="card-hdr">
          <span className="card-title">Personalized Insights</span>
          <span className="eyebrow" style={{ color: 'var(--bear)' }}>Data-Driven</span>
        </div>
        <div className="card-body">
          <ul style={{ ...listStyle, paddingLeft: '4px' }}>
            {insightItems.map((s, i) => (
              <li key={i} style={{ ...itemStyle(i === insightItems.length - 1), display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--gold)', flexShrink: 0 }}>◆</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
