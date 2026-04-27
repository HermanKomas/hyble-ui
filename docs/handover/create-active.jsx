// create-active.jsx — Split layout shown after first generation.
// Left = chat thread (first message is the structured prompt rendered
// as a card). Right = MenuPreviewSurface. Mobile collapses to stacked
// + toggle.

const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;

function PromptAsMessage({ values }) {
  return (
    <div style={{
      padding:"14px 16px", borderRadius:"var(--r-3)",
      background:"var(--paper-2)", border:"1px solid var(--rule-soft)"
    }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>You · {new Date().toLocaleTimeString([], { hour:"numeric", minute:"2-digit" })}</div>
      <div style={{ fontFamily:"var(--font-display)", fontSize: 19, lineHeight: 1.4, color:"var(--ink)" }}>
        Create a <span style={{ color:"var(--accent)" }}>{values.type?.label}</span> for <span style={{ color:"var(--accent)" }}>{values.customer?.label}</span>
        {values.image && <> with <span style={{ color:"var(--accent)" }}>{values.image.name}</span> as reference</>}
        {values.notes && <>. Notes: <span style={{ color:"var(--ink-2)", fontStyle:"italic" }}>"{values.notes}"</span></>}
      </div>
      <div style={{ display:"flex", gap: 6, marginTop: 10 }}>
        <span className="badge"><span style={{ width:8, height:8, borderRadius:2, background: values.customer?.brand==="Bacardi" ? "#a51c30" : values.customer?.brand==="Diageo" ? "#2a2a2a" : "#0b3d2e"}}/>{values.customer?.brand}</span>
        <span className="badge">{values.customer?.state} rules</span>
      </div>
    </div>
  );
}

function AssistantMessage({ kind, status, stepIdx, generation, onSelectGen, isCurrent }) {
  // kind: "generating" | "result"
  if (kind === "generating") {
    return (
      <div style={{ padding:"4px 4px 4px 4px", display:"flex", flexDirection:"column", gap: 10 }}>
        <div className="eyebrow" style={{ display:"flex", alignItems:"center", gap: 8 }}>
          Hyble · working
          <span className="status-pill live" style={{ textTransform:"none", fontSize:10.5, letterSpacing:".04em", padding:"2px 8px" }}>
            {SSE_STEPS[stepIdx]?.label || "Composing"}
          </span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap: 6, paddingLeft: 4 }}>
          {SSE_STEPS.map((s, i) => {
            const state = i < stepIdx ? "done" : i === stepIdx ? "active" : "pending";
            return (
              <div key={s.id} style={{ display:"flex", alignItems:"center", gap: 10, fontSize: 12.5, color: state==="pending"?"var(--ink-4)":"var(--ink-2)" }}>
                {state === "done" ? <Ico.Check/> : state === "active" ? <Ico.Spinner/> : <span style={{ width:14, height:14, display:"inline-block", border:"1px dashed var(--rule)", borderRadius:999 }}/>}
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding:"4px 0", display:"flex", flexDirection:"column", gap: 10 }}>
      <div className="eyebrow">Hyble · {generation?.time}</div>
      <div style={{ fontSize: 14, lineHeight: 1.55, color:"var(--ink)" }}>
        {generation?.message}
      </div>
      {generation?.thumb && (
        <button onClick={() => onSelectGen?.(generation)} style={{
          display:"flex", alignItems:"center", gap: 10, padding: 8, marginTop: 4,
          width:"100%", textAlign:"left",
          border:`1px solid ${isCurrent ? "var(--ink)" : "var(--rule)"}`,
          background:"var(--paper)", borderRadius:"var(--r-2)", cursor:"pointer",
          transition:"all 140ms"
        }}>
          <div style={{
            width: 44, aspectRatio: "8.5 / 11", background:"#fbf8f1",
            border:`2px solid ${generation.brandColor || "#5b1a1f"}`,
            borderRadius: 2, flexShrink: 0
          }}/>
          <div style={{ display:"flex", flexDirection:"column", lineHeight: 1.25 }}>
            <span style={{ fontSize: 12.5, color:"var(--ink)" }}>{generation.title}</span>
            <span className="font-mono" style={{ fontSize: 10.5, color:"var(--ink-3)" }}>{generation.meta}</span>
          </div>
          {isCurrent && <span style={{ marginLeft:"auto", fontSize: 10.5, fontFamily:"var(--font-mono)", color:"var(--accent)", letterSpacing:".08em", textTransform:"uppercase" }}>Showing</span>}
        </button>
      )}
    </div>
  );
}

function ChatComposer({ onSend, disabled }) {
  const [v, setV] = useStateA("");
  const taRef = useRefA(null);
  useEffectA(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 200) + "px";
  }, [v]);
  const submit = () => { if (v.trim() && !disabled) { onSend(v.trim()); setV(""); } };
  return (
    <div style={{ borderTop:"1px solid var(--rule)", padding: 14, background:"var(--paper)" }}>
      <div style={{
        display:"flex", alignItems:"flex-end", gap: 8, padding: 10,
        border:"1px solid var(--rule)", borderRadius:"var(--r-3)",
        background:"var(--paper-2)", transition:"border-color 140ms"
      }}>
        <button className="btn btn-icon btn-ghost btn-sm" title="Attach reference"><Ico.Image s={15}/></button>
        <textarea
          ref={taRef}
          value={v}
          onChange={e => setV(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
          placeholder="Tweak it — change colors, swap items, add a section…"
          rows={1}
          style={{
            flex:1, border:"none", outline:"none", resize:"none",
            background:"transparent", padding:"6px 0", maxHeight: 200,
            fontFamily:"var(--font-ui)", fontSize: 14, lineHeight: 1.5, color:"var(--ink)"
          }}/>
        <button className="btn btn-icon btn-accent btn-sm" disabled={!v.trim() || disabled} onClick={submit} title="Send (⌘↵)"><Ico.Send s={14}/></button>
      </div>
    </div>
  );
}

function ChatPanel({ values, messages, generating, stepIdx, currentGenId, onSelectGen, onSend }) {
  const scrollRef = useRefA(null);
  useEffectA(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, generating, stepIdx]);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", minWidth: 0 }}>
      <div ref={scrollRef} style={{ flex:1, overflow:"auto", padding:"20px 20px 8px", display:"flex", flexDirection:"column", gap: 18 }}>
        <PromptAsMessage values={values}/>
        {messages.map((m, i) => (
          m.role === "user" ? (
            <div key={i} style={{ padding:"12px 16px", borderRadius:"var(--r-3)", background:"var(--paper-2)", border:"1px solid var(--rule-soft)", alignSelf:"flex-end", maxWidth: "85%" }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>You · {m.time}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>{m.content}</div>
            </div>
          ) : (
            <AssistantMessage key={i} kind={m.kind} stepIdx={stepIdx} generation={m.generation} onSelectGen={onSelectGen} isCurrent={m.generation?.id === currentGenId}/>
          )
        ))}
        {generating && <AssistantMessage kind="generating" stepIdx={stepIdx}/>}
      </div>
      <ChatComposer onSend={onSend} disabled={generating}/>
    </div>
  );
}

Object.assign(window, { ChatPanel, PromptAsMessage });
