// menu-preview.jsx — The generated design surface.
// Three states: empty, generating (progressive skeleton driven by SSE
// status events), final. We mock SSE with a setTimeout chain.

const { useState: useStateM, useEffect: useEffectM, useRef: useRefM } = React;

const SSE_STEPS = [
  { id:"reading_reference",   label:"Reading reference menu",  ms: 900 },
  { id:"building_prompt",     label:"Composing the prompt",     ms: 700 },
  { id:"generating",          label:"Generating design",         ms: 2200 },
  { id:"validating",          label:"Validating compliance",    ms: 700 },
  { id:"extracting_metadata", label:"Extracting metadata",      ms: 600 },
];

function useGenerationStream(active, opts = {}) {
  const [stepIdx, setStepIdx] = useStateM(-1);
  const [done, setDone] = useStateM(false);
  const tref = useRefM([]);
  useEffectM(() => {
    tref.current.forEach(t => clearTimeout(t));
    tref.current = [];
    if (!active) { setStepIdx(-1); setDone(false); return; }
    setDone(false); setStepIdx(0);
    let acc = 0;
    SSE_STEPS.forEach((s, i) => {
      acc += s.ms;
      tref.current.push(setTimeout(() => {
        if (i === SSE_STEPS.length - 1) { setDone(true); opts.onDone?.(); }
        else setStepIdx(i + 1);
      }, acc));
    });
    return () => tref.current.forEach(t => clearTimeout(t));
  }, [active]);
  return { stepIdx, done, steps: SSE_STEPS };
}

// A printable menu mock — the "design" the agent would return.
// Hand-set in HTML so the skeleton can fill in progressively. Uses the
// CUSTOMER's brand color when known, else default oxblood. Two layouts:
// wine and cocktail.
function MenuArt({ customer, type, reveal = 1.0 }) {
  // reveal is 0..1 — how much of the design has materialised.
  const brandColor =
    customer?.brand === "Bacardi" ? "#a51c30" :
    customer?.brand === "Diageo" ? "#1a1a1a" :
    customer?.brand === "Pernod Ricard" ? "#0b3d2e" : "#5b1a1f";
  const customerName = customer?.label || "Sample Bar";
  const wine = type?.v !== "cocktail";

  // helper: a block is shown if reveal > threshold; else a skeleton bar
  const Reveal = ({ t, children, h = 14 }) => {
    if (reveal >= t) return <span style={{ animation:"fadeUp 320ms var(--ease-out) both" }}>{children}</span>;
    return <span className="skeleton" style={{ display:"inline-block", height:h, width:"100%", verticalAlign:"middle" }}/>;
  };

  return (
    <div style={{
      width:"100%", aspectRatio: "8.5 / 11", maxWidth: 520, margin:"0 auto",
      background:"#fbf8f1", color:"#1a1410", borderRadius: 4,
      boxShadow:"var(--shadow-3)", padding:"40px 36px 32px",
      display:"flex", flexDirection:"column", gap: 18, position:"relative",
      fontFamily:'"Cormorant Garamond", "Times New Roman", serif',
      overflow:"hidden"
    }}>
      {/* Top rule */}
      <div style={{ height: 6, background: brandColor, alignSelf:"stretch", marginBottom: 4 }}/>
      {/* Header */}
      <div style={{ textAlign:"center", lineHeight:1.1 }}>
        <div style={{ fontFamily:'"JetBrains Mono", monospace', fontSize: 9.5, letterSpacing:".24em", textTransform:"uppercase", opacity:.6 }}>
          <Reveal t={0.2} h={10}>{wine ? "By the glass · By the bottle" : "Signature · Classics · Spirit-free"}</Reveal>
        </div>
        <div style={{ fontSize: 32, marginTop: 6, fontWeight: 500 }}>
          <Reveal t={0.25} h={28}>{wine ? "Wine List" : "Cocktails"}</Reveal>
        </div>
        <div style={{ fontFamily:'"JetBrains Mono", monospace', fontSize: 10, letterSpacing:".18em", textTransform:"uppercase", opacity:.55, marginTop: 4 }}>
          <Reveal t={0.3} h={10}>{customerName}</Reveal>
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", gap: 22, marginTop: 10 }}>
        {[0,1].map(col => (
          <div key={col} style={{ display:"flex", flexDirection:"column", gap: 18 }}>
            <div className="font-mono" style={{ fontSize: 10, letterSpacing:".22em", textTransform:"uppercase", color: brandColor, paddingBottom: 6, borderBottom:`1px solid ${brandColor}33` }}>
              <Reveal t={0.45 + col*0.05} h={9}>{wine ? (col===0 ? "Whites & Rosé" : "Reds") : (col===0 ? "Signature" : "Classics")}</Reveal>
            </div>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ display:"flex", flexDirection:"column", gap: 4 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>
                    <Reveal t={0.55 + (col*5+i)*0.025} h={14}>{wine ? WINE_NAMES[col*5+i] : COCK_NAMES[col*5+i]}</Reveal>
                  </span>
                  <span style={{ fontFamily:'"JetBrains Mono", monospace', fontSize: 11, opacity: .8 }}>
                    <Reveal t={0.6 + (col*5+i)*0.025} h={10}>{wine ? (12 + i*2) : (14 + i)}</Reveal>
                  </span>
                </div>
                <div style={{ fontSize: 11.5, fontStyle:"italic", color:"#5a4a3a", lineHeight: 1.4 }}>
                  <Reveal t={0.7 + (col*5+i)*0.02} h={11}>{wine ? WINE_NOTES[(col*5+i) % WINE_NOTES.length] : COCK_NOTES[(col*5+i) % COCK_NOTES.length]}</Reveal>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer disclaimer (compliance-driven) */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #1a141022", textAlign:"center", fontFamily:'"JetBrains Mono", monospace', fontSize: 8.5, letterSpacing:".12em", color:"#5a4a3a" }}>
        <Reveal t={0.92} h={9}>PLEASE DRINK RESPONSIBLY · {customer?.state || "STATE"} ABC · MUST BE 21+</Reveal>
      </div>
    </div>
  );
}

const WINE_NAMES = ["Domaine Tempier Bandol","Sancerre, Vacheron","Etna Bianco, Pietradolce","Riesling, Donnhoff","Chablis, Raveneau","Barolo, Cavallotto","Côte-Rôtie, Guigal","Pinot Noir, Drouhin","Brunello, Soldera","Mencia, Raul Perez"];
const WINE_NOTES = ["Mineral, brisk citrus, salt-air finish.","Cool stone fruit and white flowers.","Volcanic ash, pear skin, crushed shell.","Slate and lime, racy and long.","Aged in concrete, sea-spray length.","Tar, rose, dark cherry, fine tannin.","Smoked violet, olive, peppered plum.","Bramble, beetroot, gentle oak."];
const COCK_NAMES = ["Smoked Old Fashioned","Garden Negroni","Oaxacan Sour","Espresso Martini","Paloma de la Casa","Rum Manhattan","Pisco Sour","French 75","Bee's Knees","Mezcal Last Word"];
const COCK_NOTES = ["Bourbon, demerara, applewood smoke.","Gin, Campari, basil oil.","Mezcal, lime, agave, egg white.","Vodka, espresso, brown butter.","Tequila, grapefruit, cherry salt.","Rum, vermouth, walnut bitters.","Pisco, lime, frothed white.","Gin, lemon, brut champagne."];

function MenuPreviewSurface({ customer, type, status, hasFinal, onRegen, onSave, onDownload }) {
  // status: "empty" | "generating" | "final"
  const reveal =
    status === "final" ? 1
    : status === "generating" && typeof status.reveal === "number" ? status.reveal
    : 0;

  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      background:"var(--paper-2)", borderLeft:"1px solid var(--rule)",
      minWidth: 0
    }}>
      <div style={{ display:"flex", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid var(--rule)", gap: 10 }}>
        <span className="eyebrow">Design</span>
        <span style={{ flex:1 }}/>
        <button className="btn btn-sm" disabled={!hasFinal} onClick={onDownload}><Ico.Download/>Download</button>
        <button className="btn btn-sm" disabled={!hasFinal} onClick={onRegen}><Ico.Refresh/>Regenerate <span style={{opacity:.5, fontFamily:"var(--font-mono)", fontSize:10, marginLeft:2}}>~$0.04</span></button>
        <button className="btn btn-sm btn-accent" disabled={!hasFinal} onClick={onSave}><Ico.Save/>Save to order</button>
      </div>
      <div style={{ flex:1, overflow:"auto", padding:"36px 32px", display:"flex", alignItems:"flex-start", justifyContent:"center" }}>
        {status === "empty" ? (
          <div style={{ alignSelf:"center", textAlign:"center", color:"var(--ink-3)", maxWidth: 320 }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize: 28, color:"var(--ink-2)", marginBottom: 8 }}>The page begins empty.</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>Fill in the sentence on the left. Your menu will appear here as it's generated.</div>
          </div>
        ) : (
          <MenuArt customer={customer} type={type} reveal={reveal}/>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { MenuArt, MenuPreviewSurface, useGenerationStream, SSE_STEPS });
