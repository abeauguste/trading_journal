// app.jsx — Auguste Capital · dashboard root with retained hero

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "logoVariant": "wordmark-italic",
  "heroLayout": "split",
  "density": "editorial",
  "typePairing": "instrument",
  "motion": 35
}/*EDITMODE-END*/;

const TABS = ["intelligence","weekly","daily","markets","historical","risk","settings"];
const TAB_LABELS = {
  intelligence: "Intelligence", weekly: "Weekly", daily: "Daily",
  markets: "Markets", historical: "Historical", risk: "Risk", settings: "Settings"
};

const TYPE_PAIRINGS = {
  instrument: {
    display: '"Instrument Serif", Georgia, serif',
    sans:    '"Geist", ui-sans-serif, system-ui, sans-serif',
    mono:    '"JetBrains Mono", ui-monospace, monospace',
    google:  "Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500"
  },
  newsreader: {
    display: '"Newsreader", Georgia, serif',
    sans:    '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
    mono:    '"IBM Plex Mono", ui-monospace, monospace',
    google:  "Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,400&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@300;400;500"
  },
  grotesque: {
    display: '"Geist", ui-sans-serif, system-ui, sans-serif',
    sans:    '"Geist", ui-sans-serif, system-ui, sans-serif',
    mono:    '"JetBrains Mono", ui-monospace, monospace',
    google:  "Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500"
  }
};

function applyTypePairing(name) {
  const tp = TYPE_PAIRINGS[name] || TYPE_PAIRINGS.instrument;
  document.documentElement.style.setProperty("--f-display", tp.display);
  document.documentElement.style.setProperty("--f-sans",    tp.sans);
  document.documentElement.style.setProperty("--f-mono",    tp.mono);
  const id = "tp-link-" + name;
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id; link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${tp.google}&display=swap`;
    document.head.appendChild(link);
  }
}

function MobileTabs({ route, onNav }) {
  return (
    <div className="nav-tabs-mobile">
      <div className="nav-tabs-mobile-inner">
        {TABS.map(t => (
          <a key={t}
             className={"nav-link" + (route === t ? " is-active" : "")}
             onClick={() => onNav(t)}>{TAB_LABELS[t]}</a>
        ))}
      </div>
    </div>
  );
}

function Footer({ logoVariant }) {
  return (
    <footer className="footer footer-slim">
      <div className="hairline" />
      <div className="container footer-slim-inner">
        <div className="footer-brand-row">
          <Logo variant={logoVariant} size={18} />
          <span className="muted footer-slim-tag">An operating system for disciplined capital.</span>
        </div>
        <div className="footer-slim-meta mono">
          <span className="pill pill-live">SYSTEMS · NOMINAL</span>
          <span className="dim">v2026.05 · build 84b1c0</span>
          <span className="dim">© 2026 Auguste Capital</span>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState(() => {
    const h = (window.location.hash || "").replace("#/", "").replace("#", "");
    return TABS.includes(h) ? h : "intelligence";
  });

  React.useEffect(() => {
    window.location.hash = "/" + route;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [route]);

  React.useEffect(() => {
    const onPop = () => {
      const h = (window.location.hash || "").replace("#/", "").replace("#", "");
      if (TABS.includes(h)) setRoute(h);
    };
    window.addEventListener("hashchange", onPop);
    return () => window.removeEventListener("hashchange", onPop);
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-density", t.density || "editorial");
  }, [t.density]);

  React.useEffect(() => {
    document.documentElement.style.setProperty("--m", (Math.max(0, Math.min(100, t.motion)) / 100).toFixed(2));
  }, [t.motion]);

  React.useEffect(() => { applyTypePairing(t.typePairing); }, [t.typePairing]);

  const onNav = (id) => setRoute(id);

  let TabEl = null;
  if (route === "intelligence") TabEl = <IntelligenceTab tweaks={t} />;
  if (route === "weekly")       TabEl = <WeeklyTab />;
  if (route === "daily")        TabEl = <DailyTab />;
  if (route === "markets")      TabEl = <MarketsTab />;
  if (route === "historical")   TabEl = <HistoricalTab />;
  if (route === "risk")         TabEl = <RiskTab />;
  if (route === "settings")     TabEl = <SettingsTab />;

  return (
    <div className="shell">
      <div className="grain" />
      <Nav route={route} onNav={onNav} logoVariant={t.logoVariant} />
      <MobileTabs route={route} onNav={onNav} />
      <main className="page" key={route}>
        {TabEl}
      </main>
      <Footer logoVariant={t.logoVariant} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Identity" />
        <TweakSelect
          label="Logo"
          value={t.logoVariant}
          options={[
            { value: "wordmark-italic", label: "Italic ligature" },
            { value: "wordmark-caps",   label: "Tracked caps" },
            { value: "monogram",        label: "Monogram + word" },
            { value: "glyph",           label: "Glyph + caps" },
          ]}
          onChange={(v) => setTweak("logoVariant", v)}
        />
        <TweakSelect
          label="Type pairing"
          value={t.typePairing}
          options={[
            { value: "instrument", label: "Instrument Serif + Geist" },
            { value: "newsreader", label: "Newsreader + IBM Plex" },
            { value: "grotesque",  label: "Geist only (grotesque)" },
          ]}
          onChange={(v) => setTweak("typePairing", v)}
        />

        <TweakSection label="Hero" />
        <TweakRadio
          label="Layout"
          value={t.heroLayout}
          options={[
            { value: "split",     label: "Split" },
            { value: "centered",  label: "Centered" },
            { value: "editorial", label: "Editorial" },
          ]}
          onChange={(v) => setTweak("heroLayout", v)}
        />

        <TweakSection label="Density" />
        <TweakRadio
          label="Mode"
          value={t.density}
          options={[
            { value: "compact",   label: "Compact" },
            { value: "editorial", label: "Editorial" },
          ]}
          onChange={(v) => setTweak("density", v)}
        />

        <TweakSection label="Motion" />
        <TweakSlider
          label="Intensity"
          value={t.motion}
          min={0} max={100} step={5}
          onChange={(v) => setTweak("motion", v)}
        />
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
