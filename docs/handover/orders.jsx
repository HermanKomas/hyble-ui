// orders.jsx — list + detail. Static, lower-fi than Create but coherent.

const { useState: useStateO } = React;

const ORDERS = [
  { id:"O-1042", customer:"Oakridge Tavern",      brand:"Bacardi",       state:"IL", type:"wine",     status:"finalised", date:"Apr 24", gens: 4, image: "#a51c30" },
  { id:"O-1041", customer:"La Playa Cantina",     brand:"Bacardi",       state:"FL", type:"cocktail", status:"draft",     date:"Apr 24", gens: 2, image: "#a51c30" },
  { id:"O-1039", customer:"Saltgrass Steakhouse", brand:"Diageo",        state:"TX", type:"wine",     status:"finalised", date:"Apr 22", gens: 6, image: "#1a1a1a" },
  { id:"O-1037", customer:"North Pier Hotel Bar", brand:"Pernod Ricard", state:"NY", type:"cocktail", status:"finalised", date:"Apr 21", gens: 3, image: "#0b3d2e" },
  { id:"O-1036", customer:"Gilt Lounge",          brand:"Diageo",        state:"CA", type:"cocktail", status:"draft",     date:"Apr 20", gens: 1, image: "#1a1a1a" },
  { id:"O-1031", customer:"The Daisy",            brand:"Bacardi",       state:"IL", type:"wine",     status:"finalised", date:"Apr 17", gens: 5, image: "#a51c30" },
];

function OrdersList({ onOpen, empty = false }) {
  const [q, setQ] = useStateO("");
  const filtered = ORDERS.filter(o => (o.customer + o.id + o.brand).toLowerCase().includes(q.toLowerCase()));

  if (empty) {
    return (
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding: 40, background:"var(--paper)" }}>
        <div style={{ maxWidth: 380, textAlign:"center" }}>
          <div style={{ width: 84, height: 100, border:"1.5px dashed var(--rule)", borderRadius: 4, margin:"0 auto 18px", position:"relative", background:"var(--paper-2)" }}>
            <div style={{ position:"absolute", top: 8, left: 12, right: 12, height: 3, background:"var(--rule)", borderRadius: 2 }}/>
            <div style={{ position:"absolute", top: 18, left: 12, right: 24, height: 2, background:"var(--rule)", borderRadius: 2 }}/>
            <div style={{ position:"absolute", top: 26, left: 12, right: 18, height: 2, background:"var(--rule)", borderRadius: 2 }}/>
          </div>
          <div style={{ fontFamily:"var(--font-display)", fontSize: 26, marginBottom: 6 }}>No orders yet.</div>
          <div style={{ fontSize: 13.5, color:"var(--ink-3)", lineHeight: 1.6, marginBottom: 16 }}>Create a menu and save it. Anything you ship to print will show up here, with metadata flowing through to chargeback.</div>
          <button className="btn btn-accent">Create your first menu</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"var(--paper)", overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", gap: 10, padding:"12px 24px", borderBottom:"1px solid var(--rule)" }}>
        <div style={{ display:"flex", alignItems:"center", gap: 8, padding:"0 10px", height: 32, border:"1px solid var(--rule)", borderRadius:"var(--r-2)", background:"var(--paper-2)", flex:1, maxWidth: 320 }}>
          <Ico.Search/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search orders, customers…" style={{ flex:1, border:"none", outline:"none", background:"transparent", fontFamily:"var(--font-ui)", fontSize: 13, color:"var(--ink)" }}/>
        </div>
        <span style={{ flex:1 }}/>
        <span className="eyebrow">{filtered.length} orders</span>
      </div>
      <div style={{ flex:1, overflow:"auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"22px 1fr 140px 100px 80px 90px 60px", gap: 16, padding:"10px 24px", borderBottom:"1px solid var(--rule-soft)", color:"var(--ink-3)", fontFamily:"var(--font-mono)", fontSize: 10.5, letterSpacing:".12em", textTransform:"uppercase" }}>
            <span></span><span>Customer</span><span>Brand</span><span>Type</span><span>Gens</span><span>Date</span><span style={{textAlign:"right"}}>ID</span>
        </div>
        {filtered.map(o => (
          <button key={o.id} onClick={() => onOpen?.(o)} style={{
            display:"grid", gridTemplateColumns:"22px 1fr 140px 100px 80px 90px 60px", gap: 16, alignItems:"center",
            padding:"14px 24px", borderBottom:"1px solid var(--rule-soft)",
            width:"100%", background:"var(--paper)", border:"none", borderBottom:"1px solid var(--rule-soft)",
            cursor:"pointer", textAlign:"left", color:"var(--ink)", transition:"background 120ms"
          }} onMouseEnter={e => e.currentTarget.style.background = "var(--paper-2)"} onMouseLeave={e => e.currentTarget.style.background = "var(--paper)"}>
            <span style={{ width: 14, height: 18, background:"#fbf8f1", borderTop:`3px solid ${o.image}`, borderRadius: 1 }}/>
            <span style={{ fontSize: 14, display:"flex", alignItems:"center", gap: 10 }}>
              {o.customer}
              {o.status === "draft" && <span className="badge" style={{ background:"transparent", color:"var(--ink-3)" }}>Draft</span>}
            </span>
            <span style={{ fontSize: 13, color:"var(--ink-2)" }}>{o.brand}</span>
            <span style={{ fontSize: 13, color:"var(--ink-2)", textTransform:"capitalize" }}>{o.type}</span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize: 12, color:"var(--ink-3)" }}>{o.gens}</span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize: 12, color:"var(--ink-3)" }}>{o.date}</span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize: 11, color:"var(--ink-4)", textAlign:"right" }}>{o.id}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function OrderDetail({ order = ORDERS[0], onBack }) {
  const [selected, setSelected] = useStateO(0);
  const gens = Array.from({length: order.gens}).map((_, i) => ({
    id: `g${i+1}`, time: ["2:14 PM","2:21 PM","2:28 PM","2:35 PM","2:41 PM","2:48 PM"][i], note: ["initial","portrait","drop IPA section","oxblood swap","tighten leading","final"][i] || "iteration"
  }));
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"var(--paper)", overflow:"hidden" }}>
      <div style={{ padding:"14px 24px", borderBottom:"1px solid var(--rule)", display:"flex", alignItems:"center", gap: 12 }}>
        <button className="btn btn-sm btn-ghost" onClick={onBack}>← Back</button>
        <div style={{ display:"flex", flexDirection:"column", lineHeight: 1.25 }}>
          <span className="eyebrow">{order.id}</span>
          <span style={{ fontFamily:"var(--font-display)", fontSize: 22 }}>{order.customer}</span>
        </div>
        <span style={{ flex:1 }}/>
        <span className="badge"><span style={{ width:8, height:8, borderRadius:2, background: order.image }}/>{order.brand}</span>
        <span className="badge">{order.state} rules</span>
        <span className="badge" style={{ background: order.status === "finalised" ? "var(--accent-soft)" : "transparent", color: order.status === "finalised" ? "var(--accent)" : "var(--ink-3)" }}>{order.status}</span>
      </div>
      <div style={{ flex:1, display:"grid", gridTemplateColumns: "260px 1fr 320px", minHeight: 0 }}>
        {/* Generations rail */}
        <div style={{ borderRight:"1px solid var(--rule)", overflow:"auto", padding: 12, display:"flex", flexDirection:"column", gap: 8 }}>
          <div className="eyebrow" style={{ padding:"4px 4px 8px" }}>generations · {gens.length}</div>
          {gens.map((g, i) => (
            <button key={g.id} onClick={() => setSelected(i)} style={{
              display:"flex", gap: 10, padding: 8, alignItems:"center",
              background: selected===i ? "var(--paper-2)" : "transparent",
              border: selected===i ? "1px solid var(--rule)" : "1px solid transparent",
              borderRadius:"var(--r-2)", cursor:"pointer", textAlign:"left", color:"var(--ink)"
            }}>
              <div style={{ width: 36, aspectRatio:"8.5/11", background:"#fbf8f1", borderTop:`3px solid ${order.image}`, borderRadius: 1, flexShrink: 0 }}/>
              <div style={{ display:"flex", flexDirection:"column", lineHeight: 1.2 }}>
                <span style={{ fontSize: 13 }}>v{i+1} · {g.note}</span>
                <span className="font-mono" style={{ fontSize: 10.5, color:"var(--ink-3)" }}>{g.time} · $0.04</span>
              </div>
              {i === gens.length - 1 && <span className="font-mono" style={{ marginLeft:"auto", fontSize: 9.5, color:"var(--accent)", letterSpacing:".1em" }}>FINAL</span>}
            </button>
          ))}
        </div>
        {/* Big preview */}
        <div style={{ overflow:"auto", padding: "32px", display:"flex", alignItems:"flex-start", justifyContent:"center", background:"var(--paper-2)" }}>
          <MenuArt customer={{ label: order.customer, brand: order.brand, state: order.state }} type={{ v: order.type }} reveal={1}/>
        </div>
        {/* Metadata */}
        <div style={{ borderLeft:"1px solid var(--rule)", overflow:"auto", padding: 20, display:"flex", flexDirection:"column", gap: 18 }}>
          <Section label="Metadata">
            <Field k="Format" v={order.type === "wine" ? "Large" : "Small"}/>
            <Field k="Dimensions" v="8.5 × 11 in"/>
            <Field k="Designation" v="NCB/b"/>
            <Field k="Supplier" v={order.brand}/>
            <Field k="Brand mentions" v="Bacardi (4) · Bombay (2) · Patrón (1)"/>
          </Section>
          <Section label="Compliance">
            <Field k="State rules" v={`${order.state} ABC · passed`} ok/>
            <Field k="Disclaimer" v="Applied"/>
            <Field k="Restricted brands" v="None flagged"/>
          </Section>
          <Section label="Cost">
            <Field k="Generations" v={`${order.gens} × ~$0.04`}/>
            <Field k="Total" v={`$${(order.gens * 0.04).toFixed(2)}`} mono/>
          </Section>
          <button className="btn btn-accent" style={{ marginTop:"auto" }}>Send to print pipeline</button>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap: 6 }}>
      <div className="eyebrow" style={{ paddingBottom: 6, borderBottom:"1px solid var(--rule-soft)" }}>{label}</div>
      <div style={{ display:"flex", flexDirection:"column", gap: 4 }}>{children}</div>
    </div>
  );
}
function Field({ k, v, ok, mono }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", gap: 12, padding: "4px 0", fontSize: 12.5 }}>
      <span style={{ color:"var(--ink-3)" }}>{k}</span>
      <span style={{ color: ok ? "var(--accent)" : "var(--ink)", fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)", textAlign:"right" }}>{v}</span>
    </div>
  );
}

Object.assign(window, { OrdersList, OrderDetail });
