// shell.jsx — App chrome shared across screens.
// Two nav items, header with theme switch + user, the surface where
// screens render. Designed to be replaced 1:1 by a real React Router
// shell at build time.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ── Icons (hand-set strokes; no third-party icon set) ──────────
const Ico = {
  Create: ({s=18}) => (
    <svg width={s} height={s} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h7M3 7h12M3 11h9M3 15h6"/>
    </svg>
  ),
  Orders: ({s=18}) => (
    <svg width={s} height={s} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="12" height="12" rx="1.5"/>
      <path d="M3 7h12M7 3v12"/>
    </svg>
  ),
  Plus: ({s=14}) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M7 3v8M3 7h8"/></svg>
  ),
  Image: ({s=16}) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="10" rx="1.5"/>
      <circle cx="6" cy="7" r="1.2"/>
      <path d="m2.5 11.5 3.5-3 3 2.5 2-1.5 2.5 2"/>
    </svg>
  ),
  Send: ({s=16}) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8 14 2l-4 12-2-5z"/>
    </svg>
  ),
  Refresh: ({s=14}) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7a5 5 0 0 1 8.5-3.5L12 5M12 7a5 5 0 0 1-8.5 3.5L2 9"/>
      <path d="M12 2v3h-3M2 12V9h3"/>
    </svg>
  ),
  Download: ({s=14}) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2v7M4 6l3 3 3-3M2 11h10"/>
    </svg>
  ),
  Save: ({s=14}) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2h6l3 3v7H3z"/>
      <path d="M5 2v3h4M5 9h4"/>
    </svg>
  ),
  Search: ({s=14}) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="6" cy="6" r="3.5"/><path d="m9 9 3 3"/></svg>
  ),
  Sun: ({s=14}) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="7" cy="7" r="2.4"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.7 2.7l1 1M10.3 10.3l1 1M2.7 11.3l1-1M10.3 3.7l1-1"/></svg>
  ),
  Moon: ({s=14}) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 8.5A4.5 4.5 0 0 1 5.5 3a4.5 4.5 0 1 0 5.5 5.5z"/></svg>
  ),
  Check: ({s=14}) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m3 7 3 3 5-6"/></svg>
  ),
  Spinner: ({s=14}) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="7" cy="7" r="5" strokeOpacity="0.2"/>
      <path d="M12 7a5 5 0 0 0-5-5"><animateTransform attributeName="transform" type="rotate" from="0 7 7" to="360 7 7" dur="0.9s" repeatCount="indefinite"/></path>
    </svg>
  ),
  Camera: ({s=18}) => (
    <svg width={s} height={s} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="14" height="10" rx="1.5"/><circle cx="9" cy="10" r="2.6"/><path d="M6 5l1-1.5h4L12 5"/>
    </svg>
  ),
  Caret: ({s=10}) => (
    <svg width={s} height={s} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m2.5 4 2.5 2.5L7.5 4"/></svg>
  ),
  Close: ({s=12}) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3 3l6 6M9 3l-6 6"/></svg>
  ),
  Alert: ({s=14}) => (
    <svg width={s} height={s} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2 1 12h12L7 2z"/><path d="M7 6v3M7 11v.01"/></svg>
  ),
};

// ── App rail ──────────────────────────────────────────────────
function Rail({ active = "create", onChange = () => {}, compact = false }) {
  if (compact) {
    return (
      <nav style={{ display:"flex", gap:4, padding:"6px 8px", borderBottom:"1px solid var(--rule)", background:"var(--paper)" }}>
        {[
          {id:"create", label:"Create", I:Ico.Create},
          {id:"orders", label:"Orders", I:Ico.Orders},
        ].map(({id,label,I}) => (
          <button key={id} className={`rail-item${active===id?" active":""}`} onClick={() => onChange(id)} style={{ flex:1, justifyContent:"center" }}>
            <I/> <span>{label}</span>
          </button>
        ))}
      </nav>
    );
  }
  return (
    <aside style={{
      width: 200, flex: "0 0 200px", borderRight: "1px solid var(--rule)",
      background: "var(--paper)", padding: "20px 14px", display:"flex", flexDirection:"column", gap: 4
    }}>
      <div style={{ padding:"6px 10px 18px", display:"flex", alignItems:"baseline", gap:6 }}>
        <span className="font-display" style={{ fontSize: 24, lineHeight:1 }}>hyble</span>
        <span className="eyebrow" style={{ fontSize:9 }}>v2</span>
      </div>
      {[
        {id:"create", label:"Create", I:Ico.Create},
        {id:"orders", label:"Orders", I:Ico.Orders},
      ].map(({id,label,I}) => (
        <div key={id} className={`rail-item${active===id?" active":""}`} onClick={() => onChange(id)}>
          <I/> <span>{label}</span>
        </div>
      ))}
      <div style={{ flex:1 }}/>
      <div style={{ borderTop:"1px solid var(--rule)", paddingTop:12, marginTop:12, display:"flex", alignItems:"center", gap:10, padding:"12px 10px 0" }}>
        <div style={{ width:28, height:28, borderRadius:999, background:"var(--paper-3)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-mono)", fontSize:11, color:"var(--ink-2)" }}>JD</div>
        <div style={{ display:"flex", flexDirection:"column", lineHeight:1.2 }}>
          <span style={{ fontSize:12.5, color:"var(--ink)" }}>Jamie Dawson</span>
          <span style={{ fontSize:11, color:"var(--ink-3)" }}>SGWS · IL</span>
        </div>
      </div>
    </aside>
  );
}

// ── Shared header bar ────────────────────────────────────────
function HeaderBar({ title, subtitle, right }) {
  return (
    <header style={{
      display:"flex", alignItems:"center", gap:16, padding:"16px 28px",
      borderBottom:"1px solid var(--rule)", background:"var(--paper)",
      minHeight: 64
    }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", lineHeight:1.25 }}>
        <span className="eyebrow" style={{ fontSize:10 }}>{subtitle}</span>
        <span style={{ fontFamily:"var(--font-display)", fontSize:22, color:"var(--ink)" }}>{title}</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>{right}</div>
    </header>
  );
}

// Export to global scope
Object.assign(window, { Ico, Rail, HeaderBar });
