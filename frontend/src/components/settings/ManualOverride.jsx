import React, { useState } from 'react'
import { symbolCfg } from '../../config/symbols'

export default function ManualOverride({ liveData, symbol = 'ES', onUpdateLive, onResetLive, onShowToast }) {
  const cfg = symbolCfg(symbol)
  const [price, setPrice] = useState('')
  const [vix, setVix] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [jsonStatus, setJsonStatus] = useState('')

  const applyPrice = () => {
    const p = parseFloat(price)
    if (isNaN(p)) return
    onUpdateLive(p, null)
    if (onShowToast) onShowToast(`${cfg.code} price set to ${p}`)
  }

  const applyVix = () => {
    const v = parseFloat(vix)
    if (isNaN(v)) return
    onUpdateLive(null, v)
    if (onShowToast) onShowToast(`VIX set to ${v}`)
  }

  const applyJson = () => {
    try {
      const obj = JSON.parse(jsonText)
      const p = obj.close ?? obj.price ?? null
      const v = obj.vix ?? null
      if (p != null || v != null) {
        onUpdateLive(p, v)
        setJsonStatus('Applied successfully')
        if (onShowToast) onShowToast('JSON data applied')
      } else {
        setJsonStatus('No close/price or vix found in JSON')
      }
    } catch {
      setJsonStatus('Invalid JSON — check syntax')
    }
  }

  return (
    <div className="card">
      <div className="card-hdr">
        <span className="card-title">Manual Data Override · {cfg.code}</span>
        <span className="tag tag-manual">MANUAL</span>
      </div>
      <div className="card-body">
        <div className="settings-section">
          <div className="settings-title">Live Price Override</div>
          <p style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '10px' }}>
            Override the current {cfg.code} price shown in the header. Useful during market hours when you want to see where price sits relative to plan levels.
          </p>
          {liveData?.price != null && (
            <div style={{ marginBottom: '10px', fontSize: '11px', color: 'var(--accent)' }}>
              Current live price: <strong>{liveData.price}</strong>
              {liveData.vix != null && <> | VIX: <strong>{liveData.vix}</strong></>}
            </div>
          )}
          <div className="settings-row">
            <label>Current {cfg.code} Price</label>
            <input
              className="sinput"
              type="number"
              step="0.25"
              placeholder="e.g. 7210.50"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
            <button className="sbtn sbtn-primary" onClick={applyPrice}>Apply</button>
          </div>
          <div className="settings-row">
            <label>Current VIX</label>
            <input
              className="sinput"
              type="number"
              step="0.01"
              placeholder="e.g. 24.50"
              value={vix}
              onChange={e => setVix(e.target.value)}
            />
            <button className="sbtn sbtn-success" onClick={applyVix}>Apply</button>
          </div>
          <div className="settings-row">
            <button className="sbtn sbtn-danger" onClick={() => { onResetLive(); if (onShowToast) onShowToast('Live data cleared') }}>
              Reset Live Data
            </button>
          </div>
        </div>
        <div className="sep" />
        <div className="settings-section">
          <div className="settings-title">Paste TradingView Alert JSON</div>
          <p style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '8px' }}>
            Paste a JSON payload from a TradingView webhook alert to update live fields:
          </p>
          <textarea
            className="sinput-wide"
            rows={6}
            placeholder='{"ticker":"ES1!","close":7210.50,"vwap":7205.00,"atr":45.2,"squeeze":"long"}'
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="sbtn sbtn-primary" onClick={applyJson}>Apply JSON</button>
            <button className="sbtn sbtn-danger" onClick={() => { setJsonText(''); setJsonStatus('') }}>Clear</button>
          </div>
          {jsonStatus && (
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px' }}>{jsonStatus}</div>
          )}
        </div>
      </div>
    </div>
  )
}
