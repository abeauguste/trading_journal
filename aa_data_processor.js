/**
 * AA Trading Intelligence – Data Processor
 *
 * Core ETL engine: parses fills from broker exports, builds round-turn trades
 * via FIFO matching, computes KPIs, deduplicates, and exposes a normalized
 * dataset to the dashboard.
 *
 * Browser-safe (no Node deps). Used by aa_upload_handler.js and the dashboard.
 *
 * Public API:
 *   AADataProcessor.detectFormat(rows)           → "schwab" | "tos" | "ibkr" | "generic" | "aa-clean"
 *   AADataProcessor.normalizeFills(rows, fmt)    → [{ ts, symbol, contract, side:"BUY"|"SELL", qty, price, order_id, raw }]
 *   AADataProcessor.buildTrades(fills, cfg)      → [round-turn trade objects]
 *   AADataProcessor.computeKPIs(trades, cfg)     → KPI object
 *   AADataProcessor.dedupe(existing, incoming)   → merged unique trades (by Trade ID + Entry/Exit Order ID)
 *   AADataProcessor.scoreTrades(trades)          → mutates trades adding Trade Quality Score and Tags
 *
 * (c) AA Trading Intelligence – 2026
 */
(function (root) {
  'use strict';

  const DEFAULT_CFG = {
    starting_equity: 8500,
    commission_side: 1.50,
    multiplier: 5.0,            // /MES = $5/pt; override per symbol
    risk_pts_default: 20,
    fifo_per_contract: true
  };

  // ---------- format detection ----------
  function detectFormat(rows) {
    if (!rows || !rows.length) return "unknown";
    const headers = Object.keys(rows[0] || {}).map(h => (h || '').toString().toLowerCase());
    const has = (k) => headers.some(h => h.includes(k));

    if (has("trade id") && has("net p&l") && has("position type")) return "aa-clean";
    if (has("symbol") && has("fill") && has("description") && has("status")) return "schwab";
    if (has("symb") && has("trade date") && has("price") && has("qty")) return "tos-history";
    if (has("symbol") && has("date/time") && has("quantity") && has("trade price")) return "ibkr";
    if (has("date") && has("symbol") && has("price") && (has("side") || has("action"))) return "generic";
    return "unknown";
  }

  // ---------- normalize fills ----------
  function normalizeFills(rows, fmt) {
    const out = [];
    if (fmt === "aa-clean") {
      return { type: "trades", rows };
    }
    if (fmt === "schwab") {
      let carrySymbol = null, carryTime = null, carryId = null;
      for (const r of rows) {
        if ((r.Status || '').trim() !== "Filled") continue;
        let symbol = r.Symbol, ts = r.Time, oid = r.ID;
        if (!symbol || symbol === "--") {
          if (!ts || ts === "--") continue;
          symbol = carrySymbol; ts = carryTime; oid = carryId;
        } else { carrySymbol = symbol; carryTime = ts; carryId = oid; }
        const m = (r.Fill || '').match(/^\s*(\d+)\s*@\s*([0-9.]+)\s*$/);
        if (!m) continue;
        const qty = parseInt(m[1], 10), price = parseFloat(m[2]);
        const sm = (r.Description || '').match(/\b(Buy|Sell)\b/i);
        if (!sm) continue;
        const side = sm[1].toUpperCase();
        const cm = (r.Description || '').match(/\/MES([A-Z]\d)/);
        const contract = cm ? cm[1] : "";
        const dt = parseDateTime(ts);
        if (!dt) continue;
        for (let i = 0; i < qty; i++) {
          out.push({ ts: dt, symbol: "MES", contract, side, qty: 1, price, order_id: oid, raw: r });
        }
      }
      return { type: "fills", rows: out.sort((a, b) => a.ts - b.ts) };
    }
    if (fmt === "ibkr") {
      for (const r of rows) {
        const q = parseFloat(r.Quantity);
        if (!q || isNaN(q)) continue;
        const dt = parseDateTime(r["Date/Time"] || r.DateTime);
        if (!dt) continue;
        for (let i = 0; i < Math.abs(q); i++) {
          out.push({
            ts: dt, symbol: r.Symbol, contract: r.Symbol,
            side: q > 0 ? "BUY" : "SELL", qty: 1,
            price: parseFloat(r["TradePrice"] || r["Trade Price"]),
            order_id: r.OrderID || r.IbOrderID || ("IBKR-" + dt.getTime()),
            raw: r
          });
        }
      }
      return { type: "fills", rows: out.sort((a, b) => a.ts - b.ts) };
    }
    if (fmt === "generic" || fmt === "tos-history") {
      for (const r of rows) {
        const dt = parseDateTime(r.Date || r["Trade Date"] || r.Datetime || r.Time);
        if (!dt) continue;
        const sideRaw = (r.Side || r.Action || r.B_S || '').toString().toUpperCase();
        const side = sideRaw.includes("S") ? "SELL" : "BUY";
        const qty = parseInt(r.Qty || r.Quantity || r.Size || '1', 10) || 1;
        const price = parseFloat(r.Price || r["Trade Price"] || r["Fill Price"]);
        if (!price || isNaN(price)) continue;
        for (let i = 0; i < qty; i++) {
          out.push({
            ts: dt, symbol: r.Symbol || r.Symb || "UNKNOWN", contract: r.Contract || r.Symbol || "",
            side, qty: 1, price,
            order_id: r["Order ID"] || r.OrderID || r.ID || ("GEN-" + dt.getTime() + "-" + i),
            raw: r
          });
        }
      }
      return { type: "fills", rows: out.sort((a, b) => a.ts - b.ts) };
    }
    return { type: "fills", rows: [] };
  }

  function parseDateTime(s) {
    if (!s) return null;
    if (s instanceof Date) return s;
    s = s.toString().trim();
    let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2}):?(\d{2})?\s*(AM|PM)?$/i);
    if (m) {
      let h = parseInt(m[4], 10);
      const ap = (m[7] || '').toUpperCase();
      if (ap === "PM" && h < 12) h += 12;
      if (ap === "AM" && h === 12) h = 0;
      return new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2]), h, parseInt(m[5]), parseInt(m[6] || 0));
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // ---------- FIFO build round-turn trades ----------
  function buildTrades(fills, cfg) {
    cfg = Object.assign({}, DEFAULT_CFG, cfg || {});
    const trades = [];
    const groups = {};
    fills.forEach(f => { (groups[f.contract || f.symbol || ""] ||= []).push(f); });

    let tid = 1;
    for (const key in groups) {
      const arr = groups[key].sort((a, b) => a.ts - b.ts);
      const longQ = [], shortQ = [];
      arr.forEach(o => {
        if (o.side === "BUY") {
          if (shortQ.length) trades.push(closeTrade(tid++, "SHORT", shortQ.shift(), o, key, cfg));
          else longQ.push(o);
        } else {
          if (longQ.length) trades.push(closeTrade(tid++, "LONG", longQ.shift(), o, key, cfg));
          else shortQ.push(o);
        }
      });
    }
    scoreTrades(trades);
    return trades;
  }

  function closeTrade(tid, dir, entry, exit_, contract, cfg) {
    const pts = dir === "LONG" ? (exit_.price - entry.price) : (entry.price - exit_.price);
    const gross = pts * cfg.multiplier;
    const fees = cfg.commission_side * 2;
    const dur_min = (exit_.ts - entry.ts) / 60000;
    const hr = entry.ts.getHours();
    const session =
      hr < 7 ? "Overnight/Asia" :
      hr < 9 ? "Pre-Market" :
      hr < 11 ? "NY Open" :
      hr < 13 ? "Morning" :
      hr < 15 ? "Lunch/Mid" :
      hr < 17 ? "Afternoon Close" : "Evening";
    const risk_pts = cfg.risk_pts_default;
    const risk_dollars = risk_pts * cfg.multiplier;
    const r_mult = pts / risk_pts;
    const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][entry.ts.getDay()];
    return {
      "Trade ID": "T" + String(tid).padStart(4, "0"),
      "Entry Date": entry.ts.toISOString().slice(0, 10),
      "Entry Time": entry.ts.toTimeString().slice(0, 8),
      "Exit Date":  exit_.ts.toISOString().slice(0, 10),
      "Exit Time":  exit_.ts.toTimeString().slice(0, 8),
      "Symbol": entry.symbol,
      "Contract": contract,
      "Asset Class": "Futures (Equity Index)",
      "Position Type": dir,
      "Entry Price": entry.price,
      "Exit Price":  exit_.price,
      "Stop Loss": "",
      "Take Profit": "",
      "Position Size": 1,
      "Risk ($)": risk_dollars,
      "Risk (%)": +(risk_dollars / cfg.starting_equity * 100).toFixed(3),
      "Fees/Commission": fees,
      "Slippage": "",
      "Points": +pts.toFixed(2),
      "Gross P&L": +gross.toFixed(2),
      "Net P&L":   +(gross - fees).toFixed(2),
      "R Multiple": +r_mult.toFixed(3),
      "Duration (min)": +dur_min.toFixed(1),
      "Duration (hrs)": +(dur_min / 60).toFixed(2),
      "Day of Week": dayName,
      "Entry Hour": hr,
      "Strategy Tag": session,
      "Setup Quality": "",
      "Entry Order ID": entry.order_id,
      "Exit Order ID":  exit_.order_id
    };
  }

  function scoreTrades(trades) {
    const strong = new Set(["Pre-Market", "NY Open", "Morning"]);
    trades.forEach(r => {
      let s = 5;
      if (r["Net P&L"] > 0) s += 2;
      if (r["R Multiple"] >= 1) s += 1;
      const d = r["Duration (min)"];
      if (d >= 10 && d <= 240) s += 1;
      if (strong.has(r["Strategy Tag"])) s += 1;
      if (r["R Multiple"] <= -1) s -= 2;
      if (d < 2) s -= 1;
      if (r["Strategy Tag"] === "Overnight/Asia" || r["Strategy Tag"] === "Evening") s -= 1;
      r["Trade Quality Score"] = Math.max(1, Math.min(10, s));
      const tags = [r["Net P&L"] > 0 ? "Win" : (r["Net P&L"] < 0 ? "Loss" : "Breakeven")];
      if (r["Trade Quality Score"] >= 9) tags.push("A+ Setup");
      if (r["R Multiple"] <= -1) tags.push("Mistake");
      if (d < 2) tags.push("Scalp");
      if (r["Strategy Tag"] === "Overnight/Asia" || r["Strategy Tag"] === "Evening") tags.push("Off-Hours");
      r.Tags = tags.join(", ");
    });
    return trades;
  }

  // ---------- KPIs ----------
  function computeKPIs(trades, cfg) {
    cfg = Object.assign({}, DEFAULT_CFG, cfg || {});
    const n = trades.length;
    const pnl = trades.map(t => +t["Net P&L"]);
    const wins = pnl.filter(v => v > 0);
    const losses = pnl.filter(v => v < 0);
    const sum = arr => arr.reduce((a, b) => a + b, 0);
    const mean = arr => arr.length ? sum(arr) / arr.length : 0;
    const winSum = sum(wins), lossSum = sum(losses);
    const equity = pnl.reduce((acc, v, i) => { acc.push((acc[i - 1] || cfg.starting_equity) + v); return acc; }, []);
    let peak = -Infinity, mdd = 0, mddPct = 0;
    equity.forEach(v => {
      if (v > peak) peak = v;
      const d = v - peak;
      if (d < mdd) { mdd = d; mddPct = d / peak; }
    });
    return {
      "Total Trades": n,
      "Winning Trades": wins.length,
      "Losing Trades": losses.length,
      "Win Rate %": +(wins.length / n * 100).toFixed(2),
      "Net P&L $": +sum(pnl).toFixed(2),
      "Profit Factor": lossSum < 0 ? +(winSum / -lossSum).toFixed(3) : null,
      "Expectancy $/trade": +mean(pnl).toFixed(2),
      "Avg Win $": +mean(wins).toFixed(2),
      "Avg Loss $": +mean(losses).toFixed(2),
      "Largest Win $": Math.max(...wins, 0),
      "Largest Loss $": Math.min(...losses, 0),
      "Max Drawdown $": +mdd.toFixed(2),
      "Max Drawdown %": +(mddPct * 100).toFixed(2),
      "Ending Equity $": equity.length ? equity[equity.length - 1] : cfg.starting_equity,
      "Total Return %": +(sum(pnl) / cfg.starting_equity * 100).toFixed(2)
    };
  }

  // ---------- Dedupe by composite key ----------
  function dedupe(existing, incoming) {
    const seen = new Set(existing.map(t =>
      `${t["Trade ID"]}|${t["Entry Order ID"]}|${t["Exit Order ID"]}|${t["Entry Date"]}|${t["Entry Time"]}|${t["Exit Price"]}`
    ));
    const merged = existing.slice();
    let added = 0;
    for (const t of incoming) {
      const key = `${t["Trade ID"]}|${t["Entry Order ID"]}|${t["Exit Order ID"]}|${t["Entry Date"]}|${t["Entry Time"]}|${t["Exit Price"]}`;
      const altKey = `${t["Entry Order ID"]}|${t["Exit Order ID"]}`;
      const hasAlt = existing.some(e => `${e["Entry Order ID"]}|${e["Exit Order ID"]}` === altKey);
      if (!seen.has(key) && !hasAlt) {
        merged.push(t); added++;
      }
    }
    return { merged, added, skipped: incoming.length - added };
  }

  root.AADataProcessor = {
    detectFormat, normalizeFills, buildTrades, computeKPIs,
    dedupe, scoreTrades, parseDateTime, DEFAULT_CFG
  };

})(typeof window !== 'undefined' ? window : globalThis);
