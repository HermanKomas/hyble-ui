// auth.jsx — sign-in screen. Editorial, two-column, brand-led.

function AuthScreen({ mode = "signin" }) {
  const [email, setEmail] = React.useState("");
  const [pw, setPw] = React.useState("");
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", height:"100%", background:"var(--paper)" }}>
      {/* Left — brand panel */}
      <div style={{ padding:"40px 48px", display:"flex", flexDirection:"column", background:"var(--paper-2)", borderRight:"1px solid var(--rule)" }}>
        <div style={{ display:"flex", alignItems:"baseline", gap: 6 }}>
          <span className="font-display" style={{ fontSize: 28 }}>hyble</span>
          <span className="eyebrow" style={{ fontSize: 9 }}>v2 · ai menus</span>
        </div>
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", maxWidth: 460 }}>
          <p className="font-display" style={{ fontSize: 40, lineHeight: 1.18, color:"var(--ink)", margin: 0 }}>
            Make a brand-compliant menu in the time it takes to <span style={{ color:"var(--accent)", fontStyle:"italic" }}>order one.</span>
          </p>
          <p style={{ fontSize: 14.5, color:"var(--ink-2)", lineHeight: 1.6, marginTop: 18 }}>
            Built for field reps. Brand kits, state rules, and the chargeback metadata are already in the loop — you write the prompt, we ship the print.
          </p>
        </div>
        <div className="eyebrow" style={{ marginTop:"auto" }}>Edinburgh · Hyble Tech Ltd</div>
      </div>
      {/* Right — form */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding: 40 }}>
        <div style={{ width:"100%", maxWidth: 360, display:"flex", flexDirection:"column", gap: 20 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Sign in</div>
            <div className="font-display" style={{ fontSize: 28 }}>Welcome back.</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap: 12 }}>
            <label style={{ display:"flex", flexDirection:"column", gap: 6 }}>
              <span style={{ fontSize: 12.5, color:"var(--ink-2)" }}>Work email</span>
              <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="jamie@sgws.com"/>
            </label>
            <label style={{ display:"flex", flexDirection:"column", gap: 6 }}>
              <span style={{ fontSize: 12.5, color:"var(--ink-2)", display:"flex", justifyContent:"space-between" }}><span>Password</span><a href="#" style={{ color:"var(--ink-3)", textDecoration:"none", fontSize: 11.5 }}>Forgot?</a></span>
              <input className="input" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••"/>
            </label>
          </div>
          <button className="btn btn-accent btn-lg">Sign in</button>
          <div style={{ position:"relative", textAlign:"center", color:"var(--ink-4)", fontSize: 11.5, fontFamily:"var(--font-mono)", letterSpacing:".06em" }}>
            <span style={{ background:"var(--paper)", padding:"0 10px", position:"relative", zIndex:1 }}>OR</span>
            <span style={{ position:"absolute", left: 0, right: 0, top:"50%", height: 1, background:"var(--rule)" }}/>
          </div>
          <button className="btn btn-lg">Continue with SSO <span style={{ opacity:.5, fontFamily:"var(--font-mono)", fontSize:10, marginLeft: 4 }}>v2.1</span></button>
          <div style={{ fontSize: 12, color:"var(--ink-3)", textAlign:"center", marginTop: 8 }}>
            New here? <a href="#" style={{ color:"var(--ink)" }}>Request access</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error / compliance / rate-limit states (rendered inside the chat panel)
function ErrorBlock({ kind = "api" }) {
  const map = {
    api:        { eyebrow:"Generation failed", title:"Couldn't reach the image service.", body:"The OpenAI gateway returned a 502. We didn't charge you for this attempt. Try again, or switch to Instant mode.", action:"Retry" },
    compliance: { eyebrow:"Pre-flight blocked", title:"This prompt would breach Bacardi's Illinois rules.", body:"Bacardi requires the supplier disclaimer block on any wine menu listing Bombay Sapphire. I added it back in v3 — re-running with the disclaimer included.", action:"Apply fix and retry" },
    rate:       { eyebrow:"Daily cap reached", title:"You've used 50 of 50 generations today.", body:"Your cap resets at midnight ET. Drafts are saved — pick up tomorrow, or ask Marketing Ops for a temporary lift.", action:"Save draft" },
  };
  const m = map[kind];
  return (
    <div style={{ padding:"14px 16px", borderRadius:"var(--r-3)", border:`1px solid ${kind==="compliance"?"var(--accent)":"var(--rule)"}`, background: kind==="compliance" ? "var(--accent-soft)" : "var(--paper-2)", display:"flex", flexDirection:"column", gap: 8 }}>
      <div className="eyebrow" style={{ display:"flex", alignItems:"center", gap: 6, color: kind==="compliance" ? "var(--accent)" : "var(--ink-3)" }}>
        <Ico.Alert/> {m.eyebrow}
      </div>
      <div style={{ fontFamily:"var(--font-display)", fontSize: 18, lineHeight: 1.3, color:"var(--ink)" }}>{m.title}</div>
      <div style={{ fontSize: 13, color:"var(--ink-2)", lineHeight: 1.55 }}>{m.body}</div>
      <div><button className="btn btn-sm">{m.action}</button></div>
    </div>
  );
}

Object.assign(window, { AuthScreen, ErrorBlock });
