import React from 'react'

const FLASK_CODE = `from flask import Flask, request, jsonify
import json

app = Flask(__name__)

@app.route('/webhook/es', methods=['POST'])
def webhook():
    data = request.get_json()
    print(f"Received: {json.dumps(data, indent=2)}")
    # Forward to FastAPI or process locally
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(port=5000)`

export default function IntegrationGuide() {
  return (
    <div className="card">
      <div className="card-hdr"><span className="card-title">Integration Guide</span></div>
      <div className="card-body">
        <div className="grid g3">
          <div style={{ background: 'var(--card2)', borderRadius: '7px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', marginBottom: '8px' }}>
              ① TradingView Alert Setup
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: 1.7 }}>
              1. Open TradingView and add your ES Futures chart<br />
              2. Create a Pine Script indicator with VWAP, ATR, TTM Squeeze logic<br />
              3. Set an alert on your indicator condition<br />
              4. In the alert dialog, choose <strong style={{ color: 'var(--text)' }}>Webhook URL</strong><br />
              5. Paste your server webhook URL<br />
              6. Use the JSON template from the panel above
            </div>
          </div>
          <div style={{ background: 'var(--card2)', borderRadius: '7px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', marginBottom: '8px' }}>
              ② Webhook Server Options
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--bull)' }}>This FastAPI server</strong> — Run locally on port 8000 (default). TradingView cannot reach localhost — use ngrok or a cloud server.<br /><br />
              <strong style={{ color: 'var(--neutral)' }}>ngrok</strong> — Run <code style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>ngrok http 8000</code> to get a public URL.<br /><br />
              <strong style={{ color: 'var(--accent)' }}>Cloud Deploy</strong> — Deploy to Railway, Render, or Fly.io for permanent public endpoint.
            </div>
          </div>
          <div style={{ background: 'var(--card2)', borderRadius: '7px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', marginBottom: '8px' }}>
              ③ Flask Receiver (Alternative)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: 1.5, marginBottom: '8px' }}>
              Simple Flask server to receive and process webhooks:
            </div>
            <div className="code-block" style={{ fontSize: '10px' }}>{FLASK_CODE}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
