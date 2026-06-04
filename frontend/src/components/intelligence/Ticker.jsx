import React from 'react'
import { N } from '../../utils/format'
import { symbolCfg } from '../../config/symbols'

function TickerRow({ sym, price, sub }) {
  return (
    <div className="ticker-row">
      <span className="t-sym">{sym}</span>
      <span className="t-px">{price != null ? N(price) : '—'}</span>
      <span className="t-k">{sub}</span>
    </div>
  )
}

export default function Ticker({ liveData, symbol = 'ES' }) {
  const cfg = symbolCfg(symbol)
  const isLive = liveData?.price != null
  return (
    <div className="ticker">
      <div className="ticker-hd">
        <span className="eyebrow">
          <span className="dot" />
          {isLive ? `LIVE · ${cfg.code} WEBHOOK` : 'OFFLINE · AWAITING DATA'}
        </span>
      </div>
      <div className="ticker-rows">
        <TickerRow sym={cfg.code}  price={liveData?.price} sub={cfg.fullName} />
        <TickerRow sym="VIX" price={liveData?.vix}   sub="VOLATILITY INDEX" />
        <TickerRow sym="ATR" price={liveData?.atr}   sub="ATR(20) · CURRENT" />
      </div>
    </div>
  )
}
