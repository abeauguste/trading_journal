import React, { useState } from 'react'
import { symbolCfg } from '../../config/symbols'

const PINE_TEMPLATE = `{
  "ticker": "{{ticker}}",
  "open": {{open}},
  "high": {{high}},
  "low": {{low}},
  "close": {{close}},
  "volume": {{volume}},
  "vwap": {{plot_0}},
  "vwap_weekly": {{plot_1}},
  "vwap_monthly": {{plot_2}},
  "vwap_quarterly": {{plot_3}},
  "vwap_yearly": {{plot_4}},
  "secret_key": "my_secret",
  "time": "{{timenow}}"
}`

const VIX_PINE_TEMPLATE = `{"vix": {{close}}}`

const VIX_STORAGE_KEY = 'vix_webhook_url'
const DEFAULT_VIX_URL = 'https://api.augustecapital.net/webhook/vix'

// Per-symbol localStorage key. ES preserves the legacy 'es_webhook_url'.
const urlStorageKey = (symbol) => `${symbol.toLowerCase()}_webhook_url`
const defaultUrl = (cfg) => `https://api.augustecapital.net/webhook/${cfg.root.toLowerCase()}`

function connStatus(source) {
  const isTv = source?.startsWith('tradingview')
  if (isTv) return { cls: 'conn-status conn-connected', text: '● Connected' }
  if (source === 'manual') return { cls: 'conn-status conn-pending', text: '● Manual Override' }
  return { cls: 'conn-status conn-disconnected', text: '● Disconnected' }
}

// One instrument's webhook block (URL + alert template). Reused per symbol.
function InstrumentBlock({ symbol, liveData, copy, copiedKey }) {
  const cfg = symbolCfg(symbol)
  const storageKey = urlStorageKey(symbol)
  const [url, setUrl] = useState(() => localStorage.getItem(storageKey) || defaultUrl(cfg))
  const saveUrl = (next) => { setUrl(next); localStorage.setItem(storageKey, next) }
  const status = connStatus(liveData?.source)

  return (
    <div className="card">
      <div className="card-hdr">
        <span className="card-title">{cfg.code} · TradingView Connection</span>
        <span className={status.cls}>{status.text}</span>
      </div>
      <div className="card-body">
        <div className="settings-section">
          <div className="settings-title">{cfg.code} Webhook Endpoint</div>
          <div className="settings-row" style={{ marginBottom: '10px' }}>
            <label>{cfg.fullName}</label>
            <input
              className="sinput"
              type="text"
              value={url}
              onChange={(e) => saveUrl(e.target.value)}
              style={{ color: 'var(--accent)' }}
              placeholder={defaultUrl(cfg)}
            />
            <button className="sbtn sbtn-primary" onClick={() => copy(url, `url-${symbol}`)}>
              {copiedKey === `url-${symbol}` ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="sep" />

        <div className="settings-section">
          <div className="settings-title">{cfg.code} Alert Template</div>
          <p style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '8px' }}>
            Use this in your {cfg.code} Futures alert message:
          </p>
          <div className="code-block">{PINE_TEMPLATE}</div>
          <button className="sbtn sbtn-success" style={{ marginTop: '8px' }} onClick={() => copy(PINE_TEMPLATE, `tmpl-${symbol}`)}>
            {copiedKey === `tmpl-${symbol}` ? 'Copied!' : 'Copy Template'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Shared VIX block (one feed for all instruments).
function VixBlock({ copy, copiedKey }) {
  const [vixUrl, setVixUrl] = useState(() => localStorage.getItem(VIX_STORAGE_KEY) || DEFAULT_VIX_URL)
  const saveVixUrl = (url) => { setVixUrl(url); localStorage.setItem(VIX_STORAGE_KEY, url) }

  return (
    <div className="card">
      <div className="card-hdr">
        <span className="card-title">VIX · TradingView Connection</span>
      </div>
      <div className="card-body">
        <div className="settings-section">
          <div className="settings-title">VIX Webhook Endpoint</div>
          <div className="settings-row">
            <label>VIX</label>
            <input
              className="sinput"
              type="text"
              value={vixUrl}
              onChange={(e) => saveVixUrl(e.target.value)}
              style={{ color: 'var(--bear)' }}
              placeholder={DEFAULT_VIX_URL}
            />
            <button className="sbtn sbtn-primary" onClick={() => copy(vixUrl, 'vix')}>
              {copiedKey === 'vix' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '8px' }}>
            In TradingView: create a separate alert on your CBOE:VIX chart → Notifications → Webhook URL → paste the VIX URL above.
          </p>
        </div>

        <div className="sep" />

        <div className="settings-section">
          <div className="settings-title">VIX Alert Template</div>
          <p style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '8px' }}>
            Use this in your CBOE:VIX alert message:
          </p>
          <div className="code-block">{VIX_PINE_TEMPLATE}</div>
          <button className="sbtn sbtn-success" style={{ marginTop: '8px' }} onClick={() => copy(VIX_PINE_TEMPLATE, 'vix-tmpl')}>
            {copiedKey === 'vix-tmpl' ? 'Copied!' : 'Copy Template'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TVConnection({ symbol, liveData, onShowToast, variant = 'instrument' }) {
  const [copiedKey, setCopiedKey] = useState(null)

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key)
      if (onShowToast) onShowToast('Copied to clipboard!')
      setTimeout(() => setCopiedKey(null), 2000)
    })
  }

  if (variant === 'vix') {
    return <VixBlock copy={copy} copiedKey={copiedKey} />
  }
  return <InstrumentBlock symbol={symbol} liveData={liveData} copy={copy} copiedKey={copiedKey} />
}
