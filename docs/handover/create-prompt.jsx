// create-prompt.jsx — Initial Create state.
// Editorial sentence-shaped prompt builder. The MOST IMPORTANT component
// in the product. Each slot is a popover trigger. Filled slots become
// inline accent text. The Generate button is offered the moment any
// required slot is set.

const { useState: useStateP, useRef: useRefP, useEffect: useEffectP } = React;

// Lightweight popover (no Radix needed at design fidelity)
function Popover({ open, anchorRef, onClose, children, width = 280, align = "left" }) {
  const ref = useRefP(null);
  const [pos, setPos] = useStateP({ left: 0, top: 0 });
  useEffectP(() => {
    if (!open || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const containerRect = anchorRef.current.closest("[data-popover-root]")?.getBoundingClientRect();
    const ox = containerRect ? containerRect.left : 0;
    const oy = containerRect ? containerRect.top : 0;
    setPos({ left: r.left - ox + (align==="right" ? r.width - width : 0), top: r.bottom - oy + 8 });
  }, [open]);
  useEffectP(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !anchorRef.current?.contains(e.target)) onClose();
    };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  if (!open) return null;
  return (
    <div ref={ref} style={{
      position:"absolute", left:pos.left, top:pos.top, width, zIndex:50,
      background:"var(--paper)", border:"1px solid var(--rule)",
      borderRadius:"var(--r-3)", boxShadow:"var(--shadow-3)",
      padding: 6, animation: "fadeUp 180ms var(--ease-out) both"
    }}>{children}</div>
  );
}

const TYPES = [
  { v:"wine",     label:"wine menu",     hint:"by-the-glass + bottle" },
  { v:"cocktail", label:"cocktail menu", hint:"signature + classics" },
];

const CUSTOMERS = [
  { v:"oakridge",  label:"Oakridge Tavern",      brand:"Bacardi",       state:"IL" },
  { v:"laplaya",   label:"La Playa Cantina",     brand:"Bacardi",       state:"FL" },
  { v:"saltgrass", label:"Saltgrass Steakhouse", brand:"Diageo",        state:"TX" },
  { v:"northpier", label:"North Pier Hotel Bar", brand:"Pernod Ricard", state:"NY" },
  { v:"gilt",      label:"Gilt Lounge",          brand:"Diageo",        state:"CA" },
  { v:"thedaisy",  label:"The Daisy",            brand:"Bacardi",       state:"IL" },
];

function TypePicker({ value, onChange, anchorRef, open, onClose }) {
  return (
    <Popover open={open} anchorRef={anchorRef} onClose={onClose} width={240}>
      <div className="eyebrow" style={{ padding:"6px 8px 4px" }}>menu type</div>
      {TYPES.map(t => (
        <button key={t.v} onClick={() => { onChange(t); onClose(); }} style={{
          display:"flex", flexDirection:"column", width:"100%", gap:2,
          padding:"8px 10px", borderRadius:"var(--r-2)", background: value?.v===t.v?"var(--paper-2)":"transparent",
          border:"none", textAlign:"left", cursor:"pointer", color:"var(--ink)"
        }}>
          <span style={{ fontSize:14 }}>{t.label}</span>
          <span style={{ fontSize:11.5, color:"var(--ink-3)" }}>{t.hint}</span>
        </button>
      ))}
    </Popover>
  );
}

function CustomerPicker({ value, onChange, anchorRef, open, onClose }) {
  const [q, setQ] = useStateP("");
  const filtered = CUSTOMERS.filter(c => c.label.toLowerCase().includes(q.toLowerCase()) || c.brand.toLowerCase().includes(q.toLowerCase()));
  const inputRef = useRefP(null);
  useEffectP(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); }, [open]);
  return (
    <Popover open={open} anchorRef={anchorRef} onClose={onClose} width={320}>
      <div style={{ padding:"4px 4px 6px", display:"flex", alignItems:"center", gap:8, borderBottom:"1px solid var(--rule-soft)" }}>
        <Ico.Search/>
        <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search customers…" style={{
          flex:1, border:"none", outline:"none", background:"transparent",
          fontFamily:"var(--font-ui)", fontSize:14, color:"var(--ink)", padding:"4px 0"
        }}/>
      </div>
      <div style={{ maxHeight:280, overflow:"auto", paddingTop:4 }}>
        {filtered.length === 0 && (
          <div style={{ padding:"12px 10px", fontSize:13, color:"var(--ink-3)" }}>No customers match "{q}".</div>
        )}
        {filtered.map(c => (
          <button key={c.v} onClick={() => { onChange(c); onClose(); }} style={{
            display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%",
            padding:"8px 10px", borderRadius:"var(--r-2)", background: value?.v===c.v?"var(--paper-2)":"transparent",
            border:"none", textAlign:"left", cursor:"pointer", color:"var(--ink)"
          }}>
            <span style={{ display:"flex", flexDirection:"column", gap:2 }}>
              <span style={{ fontSize:14 }}>{c.label}</span>
              <span style={{ fontSize:11.5, color:"var(--ink-3)" }}>{c.brand} · {c.state}</span>
            </span>
            {value?.v===c.v && <Ico.Check/>}
          </button>
        ))}
      </div>
    </Popover>
  );
}

function ImageSlot({ value, onChange, anchorRef, open, onClose }) {
  return (
    <Popover open={open} anchorRef={anchorRef} onClose={onClose} width={300}>
      <div style={{ padding:8 }}>
        <div className="eyebrow" style={{ marginBottom:8 }}>add a reference</div>
        <label style={{
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8,
          padding:"24px 12px", borderRadius:"var(--r-2)",
          border:"1.5px dashed var(--rule)", cursor:"pointer", background:"var(--paper-2)"
        }}>
          <Ico.Image s={22}/>
          <span style={{ fontSize:13.5, color:"var(--ink)" }}>Drag a menu image here</span>
          <span style={{ fontSize:11.5, color:"var(--ink-3)" }}>or click to choose · JPG/PNG/PDF</span>
          <input type="file" accept="image/*,application/pdf" style={{ display:"none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { onChange({ name: f.name, src: URL.createObjectURL(f) }); onClose(); } }}/>
        </label>
        <div style={{ display:"flex", gap:6, marginTop:8 }}>
          <button className="btn btn-sm" style={{ flex:1 }} onClick={() => { onChange({ name:"old-menu.jpg", placeholder:true }); onClose(); }}>
            <Ico.Image s={13}/> Use sample
          </button>
          {value && <button className="btn btn-sm btn-ghost" onClick={() => { onChange(null); onClose(); }}><Ico.Close/> Remove</button>}
        </div>
      </div>
    </Popover>
  );
}

// The big sentence
function PromptSentence({ values, setValues, onGenerate, busy }) {
  const [openSlot, setOpenSlot] = useStateP(null);
  const tRef = useRefP(null), cRef = useRefP(null), iRef = useRefP(null);
  const noteRef = useRefP(null);
  const ready = values.type && values.customer;

  return (
    <div data-popover-root style={{ position:"relative", maxWidth: 760, margin:"0 auto", padding:"40px 24px" }}>
      <div className="eyebrow" style={{ marginBottom: 18, textAlign:"center" }}>Let's build a menu</div>
      <p className="prompt-sentence">
        <span className="static">Create a </span>
        <span ref={tRef} className={`slot${values.type?" filled":""}`} onClick={() => setOpenSlot(s => s==="type"?null:"type")}>
          {values.type?.label || "menu type"} <Ico.Caret/>
        </span>
        <span className="static"> for </span>
        <span ref={cRef} className={`slot${values.customer?" filled":""}`} onClick={() => setOpenSlot(s => s==="customer"?null:"customer")}>
          {values.customer?.label || "a customer"} <Ico.Caret/>
        </span>
        <span className="static">. </span>
        <span style={{ display:"block", height: 14 }}/>
        <span ref={iRef} className={`slot${values.image?" filled":""}`} onClick={() => setOpenSlot(s => s==="image"?null:"image")} style={{ fontSize:"0.62em", verticalAlign:"middle" }}>
          {values.image ? (
            <span><Ico.Image s={14}/> {values.image.name}</span>
          ) : (
            <span><Ico.Plus/> attach an existing menu (optional)</span>
          )}
        </span>
      </p>

      {/* Free-text note */}
      <div ref={noteRef} style={{ marginTop: 28, position:"relative" }}>
        <div className="eyebrow" style={{ marginBottom:8 }}>changes or notes <span style={{ color:"var(--ink-4)", textTransform:"none", letterSpacing:"normal", fontFamily:"var(--font-ui)", fontSize:11.5 }}>· optional</span></div>
        <textarea
          value={values.notes || ""}
          onChange={e => setValues(v => ({ ...v, notes: e.target.value }))}
          placeholder="e.g. portrait orientation, swap the Buffalo Trace for Eagle Rare, drop the IPA section, add a seasonal cocktails block at the top…"
          rows={3}
          style={{
            width:"100%", padding:"14px 16px", borderRadius:"var(--r-3)",
            border:"1px solid var(--rule)", background:"var(--paper-2)",
            color:"var(--ink)", fontFamily:"var(--font-ui)", fontSize:14.5,
            lineHeight:1.55, resize:"vertical", outline:"none",
            transition:"border-color 140ms"
          }}
          onFocus={e => e.target.style.borderColor = "var(--ink)"}
          onBlur={e => e.target.style.borderColor = "var(--rule)"}
        />
      </div>

      {/* Submit row */}
      <div style={{ marginTop: 22, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"var(--ink-3)" }}>
          {values.customer ? (
            <>
              <span className="badge"><span style={{ width:8, height:8, borderRadius:2, background: values.customer.brand==="Bacardi" ? "#a51c30" : values.customer.brand==="Diageo" ? "#2a2a2a" : "#0b3d2e"}}/>{values.customer.brand}</span>
              <span className="badge">{values.customer.state} rules</span>
            </>
          ) : (
            <span style={{ fontStyle:"italic" }}>brand kit + state rules apply automatically</span>
          )}
        </div>
        <button className="btn btn-accent btn-lg" disabled={!ready || busy} onClick={onGenerate}>
          {busy ? <><Ico.Spinner/> Generating…</> : <>Generate <span style={{ opacity:.7, fontFamily:"var(--font-mono)", fontSize:11, marginLeft:4 }}>⌘↵</span></>}
        </button>
      </div>

      {/* Popovers */}
      <TypePicker value={values.type} onChange={v => setValues(s => ({ ...s, type:v }))} anchorRef={tRef} open={openSlot==="type"} onClose={() => setOpenSlot(null)}/>
      <CustomerPicker value={values.customer} onChange={v => setValues(s => ({ ...s, customer:v }))} anchorRef={cRef} open={openSlot==="customer"} onClose={() => setOpenSlot(null)}/>
      <ImageSlot value={values.image} onChange={v => setValues(s => ({ ...s, image:v }))} anchorRef={iRef} open={openSlot==="image"} onClose={() => setOpenSlot(null)}/>
    </div>
  );
}

Object.assign(window, { PromptSentence });
