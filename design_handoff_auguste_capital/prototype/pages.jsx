// pages.jsx — Auguste Capital · 7 dashboard tabs
// Intelligence (with hero) · Weekly · Daily · Markets · Historical · Risk · Settings

/* ─── INTELLIGENCE TAB (with retained hero) ─────────────── */

function IntelligenceTab({ tweaks }) {
  const layout = tweaks.heroLayout || "split";
  return (
    <div className="tab tab-intelligence">

      {/* HERO — retained from marketing version */}
      <section className={"hero hero-" + layout}>
        <div className="container">
          <div className="hero-grid">
            <div className="hero-text">
              <div className="eyebrow reveal r-1"><span className="dot" />ES · MAR26 · LIVE · 10:42:08 ET</div>
              {layout === "split" && (
                <h1 className="h-display reveal r-2">
                  An operating&nbsp;system<br/>
                  for <em>disciplined</em><br/>
                  capital.
                </h1>
              )}
              {layout === "centered" && (
                <h1 className="h-display hero-centered reveal r-2">
                  Disciplined<br/>
                  <em>capital,</em> encoded.
                </h1>
              )}
              {layout === "editorial" && (
                <h1 className="h-display hero-editorial reveal r-2">
                  Signal.<br/>Posture.<br/><em>Position.</em>
                </h1>
              )}
              <p className="lede reveal r-3">
                A research and trading platform built around a single conviction —
                that durable returns are an output of process, not prediction.
                Markets are instrumented; posture is encoded; action is patient.
              </p>
              <div className="hero-meta mono reveal r-5">
                <span>STRATEGY · ES futures</span>
                <span className="dim">/</span>
                <span>HORIZON · 1–10 sessions</span>
                <span className="dim">/</span>
                <span>SESSION · RTH · MON 23 MAY 2026</span>
              </div>
            </div>
            <aside className="hero-aside reveal r-4">
              <Ticker />
            </aside>
          </div>
        </div>
      </section>

      <div className="container"><div className="hairline" /></div>

      {/* POSTURE STRIP */}
      <section className="section section-tight">
        <div className="container">
          <div className="section-hd">
            <div className="eyebrow"><span className="dot" />MARKET POSTURE · LIVE</div>
            <span className="mono dim">UPDATED 10:42:08 ET · PUSH</span>
          </div>
          <PostureStrip />
        </div>
      </section>

      {/* DASHBOARD PANELS */}
      <section className="section section-tight">
        <div className="container">
          <DashboardPreview />
        </div>
      </section>

      {/* VWAP STACK DETAIL */}
      <section className="section section-tight">
        <div className="container">
          <div className="section-hd">
            <div className="eyebrow">VWAP STACK · ANCHORS</div>
            <h2 className="h-section">Price relative to <em>value.</em></h2>
          </div>
          <div className="vwap-grid">
            {[
              { k: "DAILY", v: "4811.20", d: "+16.30 above", tone: "bull", desc: "Session anchor · holds bull stack" },
              { k: "WEEKLY", v: "4794.80", d: "+32.70 above", tone: "bull", desc: "Confirms direction · prior week pivot" },
              { k: "MONTHLY", v: "4748.60", d: "+78.90 above", tone: "bull", desc: "Trend anchor · regime intact" },
            ].map(a => (
              <div className="vwap-card" key={a.k}>
                <div className="eyebrow">{a.k} VWAP</div>
                <div className="vwap-px mono">{a.v}</div>
                <div className={"mono " + ("tone-" + a.tone)}>{a.d}</div>
                <div className="muted" style={{marginTop: 8, fontSize: 13}}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MOMENTUM */}
      <section className="section section-tight" style={{paddingBottom: "var(--pad-section)"}}>
        <div className="container">
          <div className="section-hd">
            <div className="eyebrow">MOMENTUM · TTM SQUEEZE</div>
            <h2 className="h-section">Compression released <em>three bars ago.</em></h2>
          </div>
          <div className="momentum-card">
            <div className="momentum-state">
              <div className="eyebrow">CURRENT STATE</div>
              <div className="momentum-v gold">RELEASE ↑</div>
              <div className="muted">Long signal · 3 bars sustained · histogram expanding</div>
            </div>
            <div className="momentum-bars">
              {Array.from({length: 24}).map((_, i) => {
                const v = Math.sin(i * 0.4) * 30 + (i > 18 ? (i - 18) * 8 : 0) + (Math.random() - 0.5) * 10;
                const h = Math.abs(v);
                const up = v > 0;
                const fired = i >= 20;
                return (
                  <div className="mom-col" key={i}>
                    <div className={"mom-bar " + (up ? "mom-up" : "mom-down") + (fired ? " mom-fired" : "")}
                         style={{height: Math.max(2, h) + "%"}} />
                  </div>
                );
              })}
            </div>
            <div className="momentum-axis mono dim">
              <span>−24 bars</span>
              <span>−12 bars</span>
              <span>now</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── WEEKLY TAB ────────────────────────────────────────── */

function WeeklyTab() {
  return (
    <div className="tab tab-weekly">
      <section className="section pg-hero">
        <div className="container">
          <div className="tab-hd">
            <div>
              <div className="eyebrow reveal r-1"><span className="dot" />WEEKLY · 19–23 MAY 2026 · GENERATED MON 07:30 ET</div>
              <h1 className="h-display reveal r-2">
                Bull stack into <em>expansion.</em>
              </h1>
              <p className="lede reveal r-3" style={{marginTop: 18}}>
                Last week closed at the upper band of the projected range with VWAP
                stack fully aligned. ATR has begun to expand from compressed
                conditions — a posture that historically pays in continuation
                rather than reversal. We carry a long bias; we do not chase.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container"><div className="hairline" /></div>

      <section className="section">
        <div className="container">
          <div className="weekly-grid">
            <div className="card weekly-summary">
              <div className="dash-card-hd">
                <span className="eyebrow">PROJECTED RANGE</span>
                <span className="pill pill-gold">ATR × 2.5</span>
              </div>
              <div className="range-display">
                <div className="range-bound mono">
                  <span className="eyebrow">UPPER</span>
                  <span className="range-v">4862.00</span>
                </div>
                <div className="range-track">
                  <div className="range-fill" style={{height: "82%"}} />
                  <div className="range-marker" style={{bottom: "82%"}}>
                    <span className="range-now mono">4827.50 · NOW</span>
                  </div>
                </div>
                <div className="range-bound mono">
                  <span className="eyebrow">LOWER</span>
                  <span className="range-v">4790.00</span>
                </div>
              </div>
              <div className="range-meta mono">
                <span className="muted">USED</span><span className="gold">82%</span>
                <span className="muted">REMAINING</span><span>34.50</span>
                <span className="muted">DAYS LEFT</span><span>1 of 5</span>
              </div>
            </div>

            <div className="card weekly-thesis">
              <div className="dash-card-hd"><span className="eyebrow">WEEKLY THESIS</span><span className="pill pill-bull">FULL BULL</span></div>
              <div className="thesis-points">
                <div className="thesis-point">
                  <span className="thesis-pt mono">i.</span>
                  <div>
                    <h4>VWAP anchors confirm</h4>
                    <p className="muted">D / W / M VWAPs all sloping positive. Price comfortably above all three. The stack has not been broken in 9 sessions.</p>
                  </div>
                </div>
                <div className="thesis-point">
                  <span className="thesis-pt mono">ii.</span>
                  <div>
                    <h4>ATR opening from compression</h4>
                    <p className="muted">20-bar percentile reached 72 from a basin of 28 last week. Range expansion off a compressed base favors trend follow-through.</p>
                  </div>
                </div>
                <div className="thesis-point">
                  <span className="thesis-pt mono">iii.</span>
                  <div>
                    <h4>Volatility complacent · 14.82</h4>
                    <p className="muted">VIX in low-teens regime; size moderately up while regime holds. Watch for 18+ as the first sign of regime change.</p>
                  </div>
                </div>
                <div className="thesis-point">
                  <span className="thesis-pt mono">iv.</span>
                  <div>
                    <h4>Plan</h4>
                    <p className="muted">Buy dips toward 4811 D-VWAP. Stop below 4790 W-VWAP. Trail to 4827 once 4845 prints. Avoid initiating after 14:30 ET.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── DAILY TAB ─────────────────────────────────────────── */

function DailyTab() {
  const days = [
    { d: "MON", date: "19 MAY", bias: "FULL BULL", r1: "4842", piv: "4815", s1: "4778", tone: "bull",  state: "executed" },
    { d: "TUE", date: "20 MAY", bias: "FULL BULL", r1: "4855", piv: "4823", s1: "4790", tone: "bull",  state: "executed" },
    { d: "WED", date: "21 MAY", bias: "MIXED",     r1: "4848", piv: "4820", s1: "4788", tone: "gold",  state: "executed" },
    { d: "THU", date: "22 MAY", bias: "FULL BULL", r1: "4862", piv: "4827", s1: "4794", tone: "bull",  state: "executed" },
    { d: "FRI", date: "23 MAY", bias: "FULL BULL", r1: "4862", piv: "4827", s1: "4790", tone: "bull",  state: "today" },
  ];
  return (
    <div className="tab tab-daily">
      <section className="section pg-hero">
        <div className="container">
          <div className="tab-hd">
            <div>
              <div className="eyebrow reveal r-1"><span className="dot" />DAILY · 5-SESSION PLAN · ROLLING</div>
              <h1 className="h-display reveal r-2">
                Five sessions.<br/>One <em>posture.</em>
              </h1>
            </div>
          </div>
        </div>
      </section>

      <div className="container"><div className="hairline" /></div>

      <section className="section">
        <div className="container">
          <div className="daily-grid">
            {days.map(d => (
              <div className={"daily-card" + (d.state === "today" ? " is-today" : "")} key={d.d}>
                <div className="daily-hd">
                  <div>
                    <div className="daily-d mono">{d.d}</div>
                    <div className="muted mono daily-date">{d.date}</div>
                  </div>
                  <div className={"pill pill-" + (d.tone === "bull" ? "bull" : "gold")}>{d.bias}</div>
                </div>
                <div className="daily-levels">
                  <div className="daily-row"><span className="plan-k mono">R1</span><span className="mono">{d.r1}</span></div>
                  <div className="daily-row"><span className="plan-k mono">PIVOT</span><span className="mono gold">{d.piv}</span></div>
                  <div className="daily-row"><span className="plan-k mono">S1</span><span className="mono">{d.s1}</span></div>
                </div>
                <div className="daily-state mono">
                  {d.state === "today"
                    ? <span className="gold">● TODAY · LIVE</span>
                    : <span className="dim">executed</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="section-hd">
            <div className="eyebrow">SUMMARY TABLE · 5 SESSIONS</div>
            <h2 className="h-section">What the week <em>actually paid.</em></h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Session</th><th>Bias</th><th>Range used</th><th>R1 hit</th><th>S1 hit</th><th>VWAP held</th><th>P&amp;L (R)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>MON 19</td><td className="n-bull">BULL</td><td>78%</td><td>✓</td><td>—</td><td>✓</td><td className="n-bull">+1.4R</td></tr>
                <tr><td>TUE 20</td><td className="n-bull">BULL</td><td>62%</td><td>—</td><td>—</td><td>✓</td><td className="n-bull">+0.6R</td></tr>
                <tr><td>WED 21</td><td className="gold">MIXED</td><td>34%</td><td>—</td><td>—</td><td>—</td><td className="muted">flat</td></tr>
                <tr><td>THU 22</td><td className="n-bull">BULL</td><td>71%</td><td>✓</td><td>—</td><td>✓</td><td className="n-bull">+1.1R</td></tr>
                <tr><td>FRI 23</td><td className="n-bull">BULL</td><td>82%</td><td className="gold">…</td><td>—</td><td>✓</td><td className="dim">live</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── MARKETS TAB ────────────────────────────────────────── */

function MarketsTab() {
  return (
    <div className="tab tab-markets">
      <section className="section pg-hero">
        <div className="container">
          <div className="tab-hd">
            <div>
              <div className="eyebrow reveal r-1"><span className="dot" />MARKETS · REGIME · LIVE</div>
              <h1 className="h-display reveal r-2">
                Three regimes.<br/><em>One</em> read.
              </h1>
            </div>
          </div>
        </div>
      </section>

      <div className="container"><div className="hairline" /></div>

      <section className="section">
        <div className="container">
          <div className="regime-grid">
            <div className="card regime-card">
              <div className="dash-card-hd">
                <span className="eyebrow">VIX REGIME</span>
                <span className="pill pill-bull">COMPLACENT</span>
              </div>
              <div className="regime-v mono">14.<span className="gold">82</span></div>
              <div className="muted regime-d">Risk-on bias · size moderately up</div>
              <div className="regime-scale">
                <div className="rs-track">
                  <div className="rs-zone rs-z-1" />
                  <div className="rs-zone rs-z-2" />
                  <div className="rs-zone rs-z-3" />
                  <div className="rs-zone rs-z-4" />
                  <div className="rs-marker" style={{left: "29%"}} />
                </div>
                <div className="rs-labels mono dim">
                  <span>&lt;15 complacent</span>
                  <span>15–25 elevated</span>
                  <span>25–35 fear</span>
                  <span>&gt;35 panic</span>
                </div>
              </div>
            </div>

            <div className="card regime-card">
              <div className="dash-card-hd">
                <span className="eyebrow">SQUEEZE · TTM</span>
                <span className="pill pill-bull">RELEASE ↑</span>
              </div>
              <div className="regime-v mono gold">3<span className="muted" style={{fontSize: "0.4em"}}> bars</span></div>
              <div className="muted regime-d">Long signal sustained · histogram expanding</div>
              <div className="momentum-bars" style={{marginTop: 20, height: 80}}>
                {Array.from({length: 18}).map((_, i) => {
                  const v = Math.sin(i * 0.45) * 25 + (i > 14 ? (i - 14) * 10 : 0);
                  const fired = i >= 15;
                  return (
                    <div className="mom-col" key={i}>
                      <div className={"mom-bar " + (v > 0 ? "mom-up" : "mom-down") + (fired ? " mom-fired" : "")}
                           style={{height: Math.max(2, Math.abs(v)) + "%"}} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card regime-card">
              <div className="dash-card-hd">
                <span className="eyebrow">WEEKLY RANGE</span>
                <span className="pill pill-gold">82% USED</span>
              </div>
              <div className="regime-v mono">82<span className="muted" style={{fontSize: "0.4em"}}>%</span></div>
              <div className="muted regime-d">4,790 — 4,862 projected · 34.50 remaining</div>
              <div className="range-line">
                <div className="rl-track">
                  <div className="rl-fill" style={{width: "82%"}} />
                </div>
                <div className="rl-meta mono dim">
                  <span>4790 S</span>
                  <span>4862 R</span>
                </div>
              </div>
            </div>
          </div>

          <div className="markets-ticker">
            <Ticker compact />
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── HISTORICAL TAB ─────────────────────────────────────── */

function HistoricalTab() {
  const rows = [
    { d: "23 MAY", c: "4827.50", v: "1.2M", atr: "22.4", vix: "14.82", post: "BULL", pl: "+1.1R", tone: "bull" },
    { d: "22 MAY", c: "4815.20", v: "1.4M", atr: "21.8", vix: "15.10", post: "BULL", pl: "+0.6R", tone: "bull" },
    { d: "21 MAY", c: "4798.40", v: "0.9M", atr: "19.2", vix: "16.40", post: "MIXED", pl: "0.0R", tone: "gold" },
    { d: "20 MAY", c: "4811.60", v: "1.1M", atr: "20.1", vix: "15.20", post: "BULL", pl: "+1.4R", tone: "bull" },
    { d: "19 MAY", c: "4790.80", v: "1.3M", atr: "18.8", vix: "15.40", post: "BULL", pl: "+0.8R", tone: "bull" },
    { d: "16 MAY", c: "4768.20", v: "1.0M", atr: "17.6", vix: "16.10", post: "MIXED", pl: "−0.4R", tone: "gold" },
    { d: "15 MAY", c: "4751.40", v: "1.5M", atr: "18.4", vix: "17.20", post: "BEAR",  pl: "−1.2R", tone: "bear" },
    { d: "14 MAY", c: "4762.80", v: "1.2M", atr: "17.8", vix: "17.00", post: "MIXED", pl: "0.0R", tone: "gold" },
  ];
  return (
    <div className="tab tab-historical">
      <section className="section pg-hero">
        <div className="container">
          <div className="tab-hd">
            <div>
              <div className="eyebrow reveal r-1"><span className="dot" />HISTORICAL · ATR SNAPSHOTS · 90D</div>
              <h1 className="h-display reveal r-2">
                The tape <em>remembered.</em>
              </h1>
            </div>
          </div>
        </div>
      </section>

      <div className="container"><div className="hairline" /></div>

      <section className="section section-tight">
        <div className="container">
          <div className="hist-stats">
            <div className="stat-cell"><div className="eyebrow">WIN RATE</div><div className="stat-v mono gold">68<span className="muted" style={{fontSize: "0.5em"}}>%</span></div></div>
            <div className="stat-cell"><div className="eyebrow">AVG R</div><div className="stat-v mono tone-bull">+0.74</div></div>
            <div className="stat-cell"><div className="eyebrow">SESSIONS</div><div className="stat-v mono">62</div></div>
            <div className="stat-cell"><div className="eyebrow">BULL DAYS</div><div className="stat-v mono">41</div></div>
            <div className="stat-cell"><div className="eyebrow">BEAR DAYS</div><div className="stat-v mono">8</div></div>
            <div className="stat-cell"><div className="eyebrow">FLAT</div><div className="stat-v mono">13</div></div>
          </div>
        </div>
      </section>

      <section className="section section-tight" style={{paddingBottom: "var(--pad-section)"}}>
        <div className="container">
          <div className="section-hd">
            <div className="eyebrow">SNAPSHOTS · 8 OF 62</div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Session</th><th>Close</th><th>Vol</th><th>ATR(20)</th><th>VIX</th><th>Posture</th><th>P&amp;L</th></tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.d}>
                    <td>{r.d}</td>
                    <td className="mono">{r.c}</td>
                    <td className="mono dim">{r.v}</td>
                    <td className="mono">{r.atr}</td>
                    <td className="mono">{r.vix}</td>
                    <td className={"tone-" + r.tone}>{r.post}</td>
                    <td className={"mono " + (r.pl.startsWith("+") ? "tone-bull" : r.pl.startsWith("−") ? "tone-bear" : "dim")}>{r.pl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── RISK TAB ──────────────────────────────────────────── */

function RiskTab() {
  return (
    <div className="tab tab-risk">
      <section className="section pg-hero">
        <div className="container">
          <div className="tab-hd">
            <div>
              <div className="eyebrow reveal r-1"><span className="dot" />RISK · UNIT SIZING · POSITION</div>
              <h1 className="h-display reveal r-2">
                A unit<br/>is <em>permission</em> to be wrong.
              </h1>
            </div>
          </div>
        </div>
      </section>

      <div className="container"><div className="hairline" /></div>

      <section className="section">
        <div className="container">
          <div className="risk-grid">
            <div className="card">
              <div className="dash-card-hd"><span className="eyebrow">UNIT DEFINITION · TODAY</span><span className="pill pill-gold">VIX ADJUSTED</span></div>
              <div className="kv kv-lg"><span className="kv-k">Capital at risk per unit</span><span className="kv-v mono">$200</span></div>
              <div className="kv kv-lg"><span className="kv-k">Contracts per unit</span><span className="kv-v mono">2 ES</span></div>
              <div className="kv kv-lg"><span className="kv-k">Stop distance</span><span className="kv-v mono">4 pts · 16 ticks</span></div>
              <div className="kv kv-lg"><span className="kv-k">Target distance (1R)</span><span className="kv-v mono">4 pts</span></div>
              <div className="kv kv-lg"><span className="kv-k">VIX adjustment</span><span className="kv-v mono gold">× 1.0 (complacent)</span></div>
            </div>

            <div className="card">
              <div className="dash-card-hd"><span className="eyebrow">EXPOSURE · NOW</span><span className="pill pill-bull">WITHIN LIMITS</span></div>
              <div className="risk-exposure">
                <div className="risk-meter">
                  <div className="rm-track">
                    <div className="rm-fill" style={{width: "42%"}} />
                  </div>
                  <div className="rm-labels mono">
                    <span className="dim">0%</span>
                    <span className="gold">42% · 1.5 units open</span>
                    <span className="dim">100% · 3.5 max</span>
                  </div>
                </div>
                <div className="kv kv-lg"><span className="kv-k">Open contracts</span><span className="kv-v mono">3 ES</span></div>
                <div className="kv kv-lg"><span className="kv-k">Capital at risk</span><span className="kv-v mono">$300</span></div>
                <div className="kv kv-lg"><span className="kv-k">Day P&amp;L</span><span className="kv-v mono tone-bull">+$210</span></div>
                <div className="kv kv-lg"><span className="kv-k">Week P&amp;L</span><span className="kv-v mono tone-bull">+$1,840 · +9.2R</span></div>
              </div>
            </div>
          </div>

          <div className="card risk-rules" style={{marginTop: 32}}>
            <div className="dash-card-hd"><span className="eyebrow">RULES · SESSION</span></div>
            <div className="rules">
              <div className="rule"><span className="rule-n mono">i.</span>Max 3.5 units exposure during RTH.</div>
              <div className="rule"><span className="rule-n mono">ii.</span>No new entries after 14:30 ET.</div>
              <div className="rule"><span className="rule-n mono">iii.</span>Hard stop −2R on the day. Flat the book.</div>
              <div className="rule"><span className="rule-n mono">iv.</span>VIX &gt; 25 halves unit size automatically.</div>
              <div className="rule"><span className="rule-n mono">v.</span>Trades against VWAP stack require explicit override note.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── SETTINGS TAB ──────────────────────────────────────── */

function SettingsTab() {
  const [esPx, setEsPx] = React.useState("4827.50");
  const [vix, setVix] = React.useState("14.82");
  const [override, setOverride] = React.useState(false);
  return (
    <div className="tab tab-settings">
      <section className="section pg-hero">
        <div className="container">
          <div className="tab-hd">
            <div>
              <div className="eyebrow reveal r-1"><span className="dot" />SETTINGS · MANUAL OVERRIDE</div>
              <h1 className="h-display reveal r-2">
                Override<br/><em>with intent.</em>
              </h1>
            </div>
          </div>
        </div>
      </section>

      <div className="container"><div className="hairline" /></div>

      <section className="section">
        <div className="container settings-grid">
          <div className="settings-form card">
            <div className="dash-card-hd"><span className="eyebrow">LIVE DATA OVERRIDE</span>
              <span className={"pill " + (override ? "pill-gold" : "")}>{override ? "ACTIVE" : "INACTIVE"}</span>
            </div>
            <div className="field">
              <label className="eyebrow">ES price</label>
              <input value={esPx} onChange={e => setEsPx(e.target.value)} />
            </div>
            <div className="field">
              <label className="eyebrow">VIX</label>
              <input value={vix} onChange={e => setVix(e.target.value)} />
            </div>
            <div className="field">
              <label className="eyebrow">Apply override</label>
              <div className="toggle-row">
                <button type="button"
                  className={"role-pill" + (!override ? " is-active" : "")}
                  onClick={() => setOverride(false)}>Use webhook (live)</button>
                <button type="button"
                  className={"role-pill" + (override ? " is-active" : "")}
                  onClick={() => setOverride(true)}>Use manual values</button>
              </div>
            </div>
            <div className="field">
              <button className="btn btn-primary" style={{width: "100%", justifyContent: "center"}}>
                Save and broadcast <span className="arrow">→</span>
              </button>
            </div>
          </div>
          <aside className="settings-side">
            <div className="eyebrow">WEBHOOK STATUS</div>
            <div className="kv kv-lg"><span className="kv-k">Endpoint</span><span className="kv-v mono">api/webhook/es</span></div>
            <div className="kv kv-lg"><span className="kv-k">Last alert</span><span className="kv-v mono">10:42:08 ET</span></div>
            <div className="kv kv-lg"><span className="kv-k">Alerts today</span><span className="kv-v mono gold">78</span></div>
            <div className="kv kv-lg"><span className="kv-k">Latency p95</span><span className="kv-v mono">142ms</span></div>

            <div className="eyebrow" style={{marginTop: 36}}>SCHEDULER</div>
            <div className="kv kv-lg"><span className="kv-k">Mon 07:30 ET</span><span className="kv-v mono tone-bull">forecast · ok</span></div>
            <div className="kv kv-lg"><span className="kv-k">Mon–Fri 18:00 ET</span><span className="kv-v mono tone-bull">advance · ok</span></div>
            <div className="kv kv-lg"><span className="kv-k">Next run</span><span className="kv-v mono">FRI 18:00 · 7h 18m</span></div>

            <div className="eyebrow" style={{marginTop: 36}}>BUILD</div>
            <div className="kv kv-lg"><span className="kv-k">Version</span><span className="kv-v mono">2026.05 · 84b1c0</span></div>
            <div className="kv kv-lg"><span className="kv-k">Tunnel</span><span className="kv-v mono tone-bull">trading-journal · up</span></div>
          </aside>
        </div>
      </section>
    </div>
  );
}

/* ─── DASHBOARD PREVIEW (reused) ──────────────────────── */

function DashboardPreview() {
  return (
    <div className="dash">
      <div className="dash-chrome">
        <div className="dash-dots"><span/><span/><span/></div>
        <div className="dash-url mono">augustecapital.net / intelligence · live</div>
        <div className="dash-actions mono dim">⌘K · SEARCH</div>
      </div>
      <div className="dash-body">
        <div className="dash-top">
          <div>
            <div className="eyebrow"><span className="dot" />ES · MAR26 · LIVE</div>
            <div className="dash-px mono">4,827.<span className="gold">50</span></div>
            <div className="mono"><span className="n-bull">+20.25</span> <span className="dim">(+0.42%)</span></div>
          </div>
          <div className="dash-meta">
            <KV k="VWAP D" v="4811.20" tone="bull" />
            <KV k="VWAP W" v="4794.80" tone="bull" />
            <KV k="VWAP M" v="4748.60" tone="bull" />
            <KV k="ATR(20)" v="22.4" tone="gold" />
            <KV k="VIX" v="14.82" tone="bull" />
            <KV k="SQUEEZE" v="RELEASE ↑" tone="bull" />
          </div>
        </div>
        <div className="dash-grid">
          <div className="dash-card dash-chart">
            <div className="dash-card-hd">
              <span className="eyebrow">PRICE · 5m · VWAP STACK</span>
              <span className="mono dim">D · W · M anchors visible</span>
            </div>
            <PriceChart height={260} />
            <div className="dash-axis mono dim">
              <span>09:30</span><span>10:00</span><span>10:30</span><span>11:00</span><span>11:30</span><span>12:00</span>
            </div>
          </div>
          <div className="dash-card dash-side">
            <div className="dash-card-hd"><span className="eyebrow">TODAY'S PLAN</span><span className="pill pill-bull">FULL BULL</span></div>
            <div className="plan-row"><span className="plan-k mono">BIAS</span><span className="gold">Buy dips to 4811 D-VWAP</span></div>
            <div className="plan-row"><span className="plan-k mono">R1</span><span className="mono">4862.00</span></div>
            <div className="plan-row"><span className="plan-k mono">PIVOT</span><span className="mono">4827.50</span></div>
            <div className="plan-row"><span className="plan-k mono">S1</span><span className="mono">4790.00</span></div>
            <div className="plan-row"><span className="plan-k mono">RISK/UNIT</span><span className="mono">2 ES · $400</span></div>
            <div className="dash-card-hd" style={{marginTop: 18}}><span className="eyebrow">REGIME</span></div>
            <div className="plan-row"><span className="plan-k mono">ATR</span><span className="gold">EXPANDED · p72</span></div>
            <div className="plan-row"><span className="plan-k mono">VIX</span><span className="n-bull">COMPLACENT</span></div>
            <div className="plan-row"><span className="plan-k mono">RANGE USED</span><span className="mono">82% · 4790/4862</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── EXPORT ──────────────────────────────────────────── */

Object.assign(window, {
  IntelligenceTab, WeeklyTab, DailyTab, MarketsTab, HistoricalTab, RiskTab, SettingsTab,
  DashboardPreview,
});
