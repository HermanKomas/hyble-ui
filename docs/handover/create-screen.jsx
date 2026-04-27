// create-screen.jsx — Orchestrates initial → active transition.
// State machine: empty → generating → active. Owns the chat thread.

const { useState: useStateC, useEffect: useEffectC, useRef: useRefC, useMemo: useMemoC } = React;

function CreateScreen({ initialMode = "initial", mobile = false, mobileView = "design", onMobileViewChange }) {
  const [phase, setPhase] = useStateC(initialMode === "active" ? "active" : "initial");
  // For active demo seed, prefill values + a couple messages
  const [values, setValues] = useStateC(
    initialMode === "active"
    ? {
        type: TYPES[0], customer: CUSTOMERS[0],
        image: { name:"old-menu.jpg", placeholder:true },
        notes: "Drop the IPA section. Make it portrait."
      }
    : { type: null, customer: null, image: null, notes: "" }
  );
  const [messages, setMessages] = useStateC(initialMode === "active" ? SEED_ACTIVE_MESSAGES : []);
  const [generating, setGenerating] = useStateC(false);
  const [reveal, setReveal] = useStateC(initialMode === "active" ? 1 : 0);
  const [currentGenId, setCurrentGenId] = useStateC(initialMode === "active" ? "g1" : null);
  const [transitioning, setTransitioning] = useStateC(false);
  const stepTimers = useRefC([]);

  // Run the SSE-mocked generation
  const runGeneration = (opts = {}) => {
    setGenerating(true);
    setReveal(0);
    setStepIdx(0);
    stepTimers.current.forEach(clearTimeout); stepTimers.current = [];
    let acc = 0;
    SSE_STEPS.forEach((s, i) => {
      acc += s.ms;
      stepTimers.current.push(setTimeout(() => {
        setStepIdx(i + 1);
        // start revealing during the "generating" step
        if (s.id === "generating") {
          // animate reveal from 0..0.95 across this step's duration
          const start = Date.now();
          const dur = s.ms;
          const tick = () => {
            const t = Math.min(1, (Date.now() - start) / dur);
            setReveal(0.05 + t * 0.9);
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
        if (i === SSE_STEPS.length - 1) {
          setReveal(1);
          setGenerating(false);
          // append assistant result message
          const id = "g" + (Math.random().toString(36).slice(2,7));
          setCurrentGenId(id);
          setMessages(prev => [...prev, {
            role: "assistant", kind: "result", generation: {
              id,
              time: new Date().toLocaleTimeString([], { hour:"numeric", minute:"2-digit" }),
              title: opts.title || `${values.type?.label} · v${(prev.filter(m=>m.role==="assistant").length || 0) + 1}`,
              meta: "1024×1536 · high · $0.04",
              brandColor: values.customer?.brand==="Bacardi" ? "#a51c30" : values.customer?.brand==="Diageo" ? "#1a1a1a" : "#0b3d2e",
              thumb: true,
              message: opts.message || "Done. I built a portrait, two-column layout with the by-the-glass list on the left and bottles on the right. Bacardi disclaimer applied for IL. What would you like to change?"
            }
          }]);
        }
      }, acc));
    });
  };

  const [stepIdx, setStepIdx] = useStateC(-1);

  // Initial → active transition: animate, then flip phase, then start streaming
  const handleInitialGenerate = () => {
    setTransitioning(true);
    // 320ms morph then flip
    setTimeout(() => {
      setPhase("active");
      setTransitioning(false);
      runGeneration();
    }, 360);
  };

  const handleSendMessage = (text) => {
    setMessages(prev => [...prev, { role:"user", time: new Date().toLocaleTimeString([], { hour:"numeric", minute:"2-digit" }), content: text }]);
    setTimeout(() => runGeneration({ message: "Updated. " + paraphrase(text) }), 250);
  };

  const handleSelectGen = (gen) => setCurrentGenId(gen.id);

  // ────────────────────────── render ──────────────────────────
  if (phase === "initial") {
    return (
      <div style={{
        flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        background:"var(--paper)", position:"relative", overflow:"hidden",
        opacity: transitioning ? 0.5 : 1, transition:"opacity 360ms var(--ease-out)"
      }}>
        <div style={{
          width:"100%", maxWidth: 820,
          transform: transitioning ? "translateY(-12px) scale(0.98)" : "translateY(0) scale(1)",
          transition:"transform 360ms var(--ease-out), opacity 360ms var(--ease-out)"
        }}>
          <PromptSentence values={values} setValues={setValues} onGenerate={handleInitialGenerate} busy={transitioning}/>
        </div>
        <FooterTip mobile={mobile}/>
      </div>
    );
  }

  // Active state
  const surface = (
    <MenuPreviewSurface
      customer={values.customer}
      type={values.type}
      status={generating ? "generating" : "final"}
      hasFinal={!generating}
      onRegen={() => runGeneration({ message:"Regenerated with the same prompt — small variations applied." })}
      onSave={() => alert("(Demo) Saved to order")}
      onDownload={() => alert("(Demo) Download triggered")}
    />
  );
  // override reveal on the surface — pass via window hack? simpler: re-mount inline
  const surfaceWithReveal = (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"var(--paper-2)", borderLeft: mobile ? "none" : "1px solid var(--rule)", minWidth: 0 }}>
      <div style={{ display:"flex", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid var(--rule)", gap: 10 }}>
        <span className="eyebrow">Design</span>
        {generating && <span className="status-pill live" style={{ fontSize:10, padding:"2px 8px" }}>{SSE_STEPS[Math.min(stepIdx, SSE_STEPS.length-1)]?.label || "Composing"}</span>}
        <span style={{ flex:1 }}/>
        <button className="btn btn-sm" disabled={generating} onClick={() => alert("(Demo) Download")}><Ico.Download/>Download</button>
        <button className="btn btn-sm" disabled={generating} onClick={() => runGeneration({ message:"Regenerated with the same prompt." })}><Ico.Refresh/>Regenerate <span style={{opacity:.5, fontFamily:"var(--font-mono)", fontSize:10, marginLeft:2}}>~$0.04</span></button>
        <button className="btn btn-sm btn-accent" disabled={generating} onClick={() => alert("(Demo) Saved")}><Ico.Save/>Save to order</button>
      </div>
      <div style={{ flex:1, overflow:"auto", padding:"36px 32px", display:"flex", alignItems:"flex-start", justifyContent:"center" }}>
        <MenuArt customer={values.customer} type={values.type} reveal={reveal}/>
      </div>
    </div>
  );

  if (mobile) {
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", background:"var(--paper)", minHeight: 0 }}>
        <MobileToggle view={mobileView} onChange={onMobileViewChange} hasNew={!generating && messages.length > 0 && mobileView === "chat"}/>
        <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative" }}>
          <div style={{ position:"absolute", inset: 0, transform: mobileView === "design" ? "translateX(0)" : "translateX(-100%)", transition:"transform 320ms var(--ease-out)", display:"flex" }}>
            {surfaceWithReveal}
          </div>
          <div style={{ position:"absolute", inset: 0, transform: mobileView === "chat" ? "translateX(0)" : "translateX(100%)", transition:"transform 320ms var(--ease-out)", display:"flex" }}>
            <div style={{ flex:1, background:"var(--paper)" }}>
              <ChatPanel values={values} messages={messages} generating={generating} stepIdx={stepIdx} currentGenId={currentGenId} onSelectGen={handleSelectGen} onSend={handleSendMessage}/>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:"flex", minHeight: 0, background:"var(--paper)" }}>
      <div style={{ width: "min(420px, 38%)", flex:"0 0 auto", display:"flex", flexDirection:"column", background:"var(--paper)", borderRight:"1px solid var(--rule)" }}>
        <ChatPanel values={values} messages={messages} generating={generating} stepIdx={stepIdx} currentGenId={currentGenId} onSelectGen={handleSelectGen} onSend={handleSendMessage}/>
      </div>
      {surfaceWithReveal}
    </div>
  );
}

function MobileToggle({ view, onChange }) {
  return (
    <div style={{ display:"flex", padding:"8px 12px", borderBottom:"1px solid var(--rule)", background:"var(--paper)", gap:6 }}>
      <div style={{ display:"flex", flex:1, padding: 3, background:"var(--paper-2)", borderRadius:"var(--r-pill)", border:"1px solid var(--rule-soft)" }}>
        {[
          { v:"design", label:"Design" },
          { v:"chat",   label:"Chat" },
        ].map(t => (
          <button key={t.v} onClick={() => onChange(t.v)} style={{
            flex:1, height: 32, border:"none", borderRadius:"var(--r-pill)",
            background: view === t.v ? "var(--paper)" : "transparent",
            color: view === t.v ? "var(--ink)" : "var(--ink-3)",
            fontFamily:"var(--font-ui)", fontSize: 13, fontWeight: 500,
            boxShadow: view === t.v ? "var(--shadow-1)" : "none",
            transition:"all 180ms var(--ease-out)", cursor:"pointer"
          }}>{t.label}</button>
        ))}
      </div>
    </div>
  );
}

function FooterTip({ mobile }) {
  return (
    <div style={{ position:"absolute", bottom: 18, left: 0, right: 0, textAlign:"center", color:"var(--ink-4)", fontSize: 11.5, fontFamily:"var(--font-mono)", letterSpacing:".05em" }}>
      {mobile ? "Tap a slot to fill it. Generate when ready." : "tab between slots · ⌘↵ to generate · brand kit + state rules apply automatically"}
    </div>
  );
}

const SEED_ACTIVE_MESSAGES = [
  {
    role:"assistant", kind:"result",
    generation: {
      id: "g1",
      time: "2:14 PM",
      title: "wine menu · v1",
      meta: "1024×1536 · high · $0.04",
      brandColor: "#a51c30",
      thumb: true,
      message: "Done. I built a portrait, two-column layout — by-the-glass on the left, bottles on the right — using the Oakridge Tavern paper-cream and Bacardi crimson. Illinois ABC disclaimer applied. What would you like to change?"
    }
  },
];

function paraphrase(t) {
  if (t.toLowerCase().includes("color")) return "I shifted the accent and re-rendered the section heads.";
  if (t.toLowerCase().includes("font") || t.toLowerCase().includes("type")) return "I tried a different display face and tightened the leading.";
  if (t.toLowerCase().includes("section") || t.toLowerCase().includes("add") || t.toLowerCase().includes("drop")) return "Section list rebuilt; rebalanced the columns to fit.";
  return "I made the change and kept the layout consistent.";
}

Object.assign(window, { CreateScreen });
