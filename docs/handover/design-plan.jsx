// design-plan.jsx — handoff doc, data-driven so Babel never has to parse
// nested HTML-style tags inside JSX (which standalone Babel chokes on).

const PLAN = {
  title: "Hyble AI Menu MVP",
  intro: "UX/UI design plan, ready to hand to engineering alongside PLAN.md. Maps cleanly to shadcn/ui + Tailwind. Mobile-first. Editorial typographic — original to Hyble v2, not a clone of any tool.",
  sections: [
    { n: "01", t: "Visual direction", body: [
      { kind:"p", text:"Editorial typographic. Wine-industry sophistication without the stuffy-enterprise tropes; AI is the engine but never the headline. The app's chrome is restrained so the generated menu — which carries the customer's brand — can be the hero on every screen." },
      { kind:"two", a: { label:"Mood", text:"Magazine layout meets a fast operator tool. Linear's restraint, Notion's clarity, McSweeney's serif voice. No sparkles, no gradients on chrome, no AI shimmer." },
                    b: { label:"Anti-references", text:"Anything that looks like a chat playground, a Canva-style cluttered toolbar, or a stock-SaaS card-grid dashboard." } },
    ]},
    { n: "02", t: "Design system primitives", body: [
      { kind:"p", text:"Tokens listed below; full source is in tokens.css at repo root. Every value below maps to a Tailwind arbitrary-value or shadcn theme variable. No custom CSS gymnastics required — extend tailwind.config with these and shadcn's cn() covers the rest." },
      { kind:"h", text:"Color" },
      { kind:"tok", label:"Light: paper / paper-2 / paper-3",   v:"oklch(98.6 / 96.8 / 94.0% · h 80)" },
      { kind:"tok", label:"Light: ink / ink-2 / ink-3 / ink-4", v:"oklch(20.5 / 38 / 54 / 68% · h 60)" },
      { kind:"tok", label:"Accent (oxblood)",                    v:"oklch(46% 0.135 25)" },
      { kind:"tok", label:"Dark: paper / ink",                    v:"oklch(15.5% / 94% — flipped pair)" },
      { kind:"tok", label:"Dark accent (warmer rust)",            v:"oklch(62% 0.140 30)" },
      { kind:"p", text:"Rule: the app uses one accent, period. Customer brand colors only ever appear inside the generated artwork (the menu surface), the customer dropdown badges, and Orders metadata pills. Never on app chrome." },
      { kind:"h", text:"Type" },
      { kind:"tok", label:"Display",  v:'Instrument Serif · 28–44px · -0.012em' },
      { kind:"tok", label:"UI",       v:'Geist · 13–14.5px · 1.5' },
      { kind:"tok", label:"Mono",     v:'JetBrains Mono · 10.5–12px · for eyebrows, IDs, costs, status' },
      { kind:"p", text:"Display is reserved for: the prompt sentence, screen titles, marketing surfaces (auth), empty/error headlines. Everywhere else: UI sans. Mono is metadata only." },
      { kind:"h", text:"Spacing & radius" },
      { kind:"tok", label:"Spacing",  v:"4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 (Tailwind 1–16)" },
      { kind:"tok", label:"Radius",   v:"3 · 6 · 10 · 14 · pill — favor 6px for inputs, 10–14px for cards. No 24px+." },
      { kind:"tok", label:"Shadow",   v:"paper-on-paper only — never glassy. 3 levels." },
    ]},
    { n: "03", t: "Component inventory · shadcn map", body: [
      { kind:"map", rows: [
        ["Rail nav", "Custom — wraps shadcn Button (variant=ghost) + active indicator"],
        ["Customer dropdown", "shadcn Combobox (Radix Popover + Command) — search-required at 4+ items"],
        ["Type slot, image slot", "shadcn Popover — content varies"],
        ["Prompt textarea", "shadcn Textarea (auto-grow via cmdk-style ref)"],
        ["Generate button", "shadcn Button (variant=default → mapped to oxblood accent)"],
        ["Chat composer", "Textarea + IconButton — submit on ⌘↵"],
        ["Status pill / badge", "shadcn Badge — extend variants for live/done/pending"],
        ["Skeleton (menu fill)", "shadcn Skeleton — keyed to SSE step IDs (see §07)"],
        ["Error / compliance", "shadcn Alert — variant=destructive for compliance-block"],
        ["Orders list", "shadcn Table (data-table pattern) — minimal grid, no zebra"],
        ["Order detail", "3-col layout: ScrollArea (generations) · main · ScrollArea (metadata)"],
        ["Mobile toggle", "shadcn ToggleGroup (variant=outline) styled as pill"],
        ["Auth", "2-col layout, shadcn Input + Button. SSO is a v2.1 button, disabled."],
      ]},
    ]},
    { n: "04", t: "Create flow — initial → active transition", body: [
      { kind:"p", text:"This is the most important moment in the product. The brief is right: it must feel like the original prompt becomes the first chat message — not like the page navigates somewhere else." },
      { kind:"h", text:"Animation spec" },
      { kind:"steps", items: [
        "0–60ms — button latch. The Generate button's label fades to '…' and the button locks (busy=true).",
        "60–360ms — THE MORPH. The full prompt sentence translates from page-center to the top of where the chat panel will live, scaling 1 → 0.7 along the way. transform-origin: top left. Easing: cubic-bezier(.22,.8,.28,1). Concurrently the right half of the viewport reveals the design surface from a 24px translateX, opacity 0→1.",
        "360–420ms — split layout commits. The chat panel (38% / min 380px) and design surface separate via the 1px rule. The morphed sentence settles into the first chat-message card.",
        "420ms+ — SSE stream begins. The 'Hyble · working' header appears with the per-step checklist; the menu skeleton starts filling on the right (see §07).",
      ]},
      { kind:"p", text:"The reverse — going back to 'initial' — is not exposed. New menus start a new order from the rail. No back-button on the create screen." },
      { kind:"h", text:"Active layout" },
      { kind:"p", text:"LEFT (chat) — 38% width, min 380px, max 460px. Scrolls. First message is the structured prompt rendered as an inline card with brand + state badges. Subsequent user turns are right-aligned soft cards. Assistant turns are flush-left, with a generation thumbnail attached as a clickable chip — clicking restores that generation to the right panel (it's how iteration history works)." },
      { kind:"p", text:"RIGHT (design) — fluid. Full-bleed menu preview, centered, with a thin top toolbar: Download · Regenerate · Save to order. The menu surface itself never changes its inner styling between generations; only the artwork inside changes. This is what 'feels like editing one document' looks like." },
    ]},
    { n: "05", t: "Mobile responsive", body: [
      { kind:"map", rows: [
        ["Breakpoint", "< 768px (Tailwind md). Single hard breakpoint — no tablet-specific states needed."],
        ["Layout", "Stacked. Design fills the screen; chat is the other view. They don't share screen real estate."],
        ["Toggle", "Pill-shaped segmented control at top of viewport: 'Design' / 'Chat'. 32px tall, full width minus 24px gutters. Sticky."],
        ["Gesture", "Horizontal swipe between the two views (320ms transform), in addition to the toggle. Edge-only — chat composer must NOT swallow drags."],
        ["Composer", "Sticky to the bottom. Avoids the iOS keyboard via dvh + visualViewport listener."],
        ["Hit targets", "Generate / Send / Regenerate are 44px minimum. Slot pickers expand to 80vw on mobile."],
        ["Image upload", "Native file input with capture=environment — opens camera-or-gallery sheet. Big drop zone is desktop-only."],
      ]},
    ]},
    { n: "06", t: "States — generating, error, empty", body: [
      { kind:"h", text:"Generating · skeleton-fills-progressively" },
      { kind:"p", text:"SSE events drive both the chat-side checklist and the design-side reveal. The menu skeleton renders at correct dimensions from the start — so the page never reflows when the design lands." },
      { kind:"map", rows: [
        ["reading_reference", "Top rule + customer brand band materialise."],
        ["building_prompt", "Headline + subheadline reveal."],
        ["generating", "Body items fill in row-by-row over ~2.2s. Reveal value 0.05 → 0.95."],
        ["validating", "Footer disclaimer materialises."],
        ["extracting_metadata", "Last 5%. Generation-thumbnail chip appears in the chat history."],
      ]},
      { kind:"h", text:"Error" },
      { kind:"p", text:"Three flavors, all rendered inside the chat thread (never as a global toast — preserves history):" },
      { kind:"map", rows: [
        ["API failure (502/503)", "Soft alert. 'Try again' button. Cost not charged."],
        ["Compliance block", "Accent-tinted alert with 'Apply fix and retry' — auto-applies the missing disclaimer/edit and re-runs."],
        ["Rate limit / daily cap", "Alert with cap counter and 'Save draft' action. Marketing Ops users see an admin-lift link."],
      ]},
      { kind:"h", text:"Empty" },
      { kind:"p", text:"Orders empty: a paper-textured menu placeholder with three rule lines, 'No orders yet.' headline (display serif), and a single accent CTA. No illustration. No mascot." },
    ]},
    { n: "07", t: "Orders flow", body: [
      { kind:"p", text:"LIST: search at the top-left, sort by date by default. Each row shows a 14×18 paper-color thumbnail (top rule colored by brand), customer name, brand, type, gens count, date, and order ID in mono. Drafts get an inline pill. No bulk actions in MVP." },
      { kind:"p", text:"DETAIL: 3-column layout. Left rail — generations history with v-numbers, notes derived from the user's chat turn (or 'initial' / 'regenerate'). Center — full menu render. Right — metadata grouped into Metadata, Compliance, Cost. Single action at the bottom: Send to print pipeline (Phase 5+)." },
    ]},
    { n: "08", t: "PWA shell", body: [
      { kind:"map", rows: [
        ["App icon", "Wordmark 'h' set in Instrument Serif, oxblood on cream. Maskable at 1024 + monochrome at 192/512."],
        ["Splash", "Cream background, centered wordmark. iOS theme-color matches paper. No spinner — the app boots fast enough."],
        ["Install prompt", "In-app banner appears on Orders screen after the user has saved 1 order. Dismissable; reappears once after 30 days."],
        ["Offline", "Cached shell + last 5 orders + the latest generation per order (LRU). Compose-new disabled offline with a clear paper-card 'Offline — generations resume when you reconnect' state."],
      ]},
    ]},
    { n: "09", t: "Interaction specs", body: [
      { kind:"map", rows: [
        ["Customer dropdown", "Combobox. Search-required at 4+ items (always, in production). Recent customers section above results once we have telemetry."],
        ["Image upload", "Desktop: drag-drop on the slot popover + file input. Mobile: native sheet, capture=environment. Strip EXIF and resize to ≤ 2048px before upload to control bandwidth."],
        ["Regenerate", "Always shows '~$0.04' beside the label. Holds confirm-state for 800ms after click before firing — drift-protection against a thumb double-tap on phones in dim bars."],
        ["Chat input", "Auto-grow to 200px. ⌘↵ to send. Enter alone is a newline (matches reps' ChatGPT muscle memory)."],
        ["Save to order", "On click, current generation becomes order.final_generation_id. Chat thread persists. Toast confirms."],
      ]},
    ]},
    { n: "10", t: "Open questions / pushback", body: [
      { kind:"steps", items: [
        "HYBLE BRAND KIT AVAILABILITY. I've designed an original system that uses Hyble's name and 'v2' framing only. If there's an existing visual identity to honor (logo, color, type), let me know and I'll graft it in — the token file is the only thing that needs to change.",
        "CUSTOMER COUNT. The dropdown design assumes 50–500 customers per rep. If it's tens of thousands, we need a server-side typeahead and a 'recent' cache, not a Combobox.",
        "'SAVE TO ORDER' SEMANTICS. PLAN.md treats orders and generations as separate; I've assumed every Generate creates a draft order on first run, and 'Save to order' finalises it. Confirm — or rework so generations are orphaned until explicitly saved.",
        "COST VISIBILITY. I've shown ~$0.04 next to Regenerate. Reps may not need this — could feel hostile. Consider hiding from rep-tier users; show only to Marketing Ops.",
        "IMAGE-ONLY OUTPUT FOR V1. Without img.ly, reps cannot fix a single typo without a full regeneration. Worth flagging to product — at scale this is going to bite.",
        "SSE STEP COPY. The status messages (Reading reference · Composing the prompt · Generating · Validating · Extracting metadata) are the only place AI peeks through. Locked these to active verbs in present continuous; align with whatever Anthropic agent loop names you settle on.",
        "MOBILE CAMERA FLOW. Brief flagged dim-bar photo capture. I've added capture=environment and a native sheet. Real-world testing is essential — lighting and glare on glass-laminated menus is a known pain. Plan a 1-day on-site test in Phase 5.",
        "REFERENCE-IMAGE COST. PLAN.md §6 flags this; I've shown per-call cost in the UI. Recommend also surfacing daily total in the rail footer for reps approaching their cap.",
        "COMPLIANCE UI FOR MARKETING OPS. Out-of-scope, but somebody needs to maintain disclaimers and brand kits. Phase 6+ tee-up.",
        "ARCHITECTURAL PUSHBACK (PLAN.md §3). Single Fastify service serving the PWA + API is correct for MVP. I'd push back gently on 'split into two later' — once chargeback Sprint 2 schemas land in shared/, the overhead of pnpm workspaces is the right time to also extract a serverless edge for the SSE endpoint. Streaming under load on a single Node process is the most likely first scaling pinch.",
      ]},
    ]},
  ],
};

const H4S = { fontFamily:"var(--font-display)", fontSize: 22, margin:"22px 0 6px", letterSpacing:"-0.005em" };

function DPSection(props) {
  const s = props.s;
  return (
    React.createElement("section", { style:{ marginTop: 32 } },
      React.createElement("div", { style:{ display:"flex", alignItems:"baseline", gap: 14, paddingBottom: 10, borderBottom:"1px solid var(--rule-soft)", marginBottom: 14 } },
        React.createElement("span", { className:"font-mono", style:{ fontSize: 12, color:"var(--ink-3)", letterSpacing:".1em" } }, s.n),
        React.createElement("h2", { className:"font-display", style:{ fontSize: 30, margin: 0, letterSpacing:"-0.012em" } }, s.t),
      ),
      React.createElement("div", { style:{ maxWidth: 760 } },
        s.body.map((b, i) => React.createElement(DPBlock, { key: i, b }))
      )
    )
  );
}

function DPBlock({ b }) {
  if (b.kind === "p") return <p style={{ marginTop: 10, lineHeight: 1.65 }}>{b.text}</p>;
  if (b.kind === "h") return <h4 style={H4S}>{b.text}</h4>;
  if (b.kind === "two") return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 16, marginTop: 12 }}>
      <DPCard label={b.a.label} text={b.a.text}/>
      <DPCard label={b.b.label} text={b.b.text}/>
    </div>
  );
  if (b.kind === "tok") return (
    <div style={{ display:"grid", gridTemplateColumns:"180px 1fr", gap: 12, padding: "5px 0", borderBottom:"1px dashed var(--rule-soft)" }}>
      <span style={{ fontSize: 13, color:"var(--ink-2)" }}>{b.label}</span>
      <span className="font-mono" style={{ fontSize: 12, color:"var(--ink)" }}>{b.v}</span>
    </div>
  );
  if (b.kind === "map") return (
    <div style={{ display:"flex", flexDirection:"column", borderTop:"1px solid var(--rule-soft)", marginTop: 10 }}>
      {b.rows.map((r, i) => (
        <div key={i} style={{ display:"grid", gridTemplateColumns:"180px 1fr", gap: 14, padding: "8px 0", borderBottom:"1px dashed var(--rule-soft)", fontSize: 13, lineHeight: 1.55 }}>
          <span className="font-mono" style={{ fontSize: 11.5, color:"var(--ink-3)", letterSpacing:".04em", paddingTop: 2 }}>{r[0]}</span>
          <span style={{ color:"var(--ink)" }}>{r[1]}</span>
        </div>
      ))}
    </div>
  );
  if (b.kind === "steps") return (
    <ol style={{ paddingLeft: 18, margin: "8px 0 12px", display:"flex", flexDirection:"column", gap: 8, lineHeight: 1.6 }}>
      {b.items.map((t, i) => <li key={i}>{t}</li>)}
    </ol>
  );
  return null;
}

function DPCard({ label, text }) {
  return (
    <div style={{ padding: 14, border:"1px solid var(--rule-soft)", borderRadius:"var(--r-3)", background:"var(--paper-2)" }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 13.5, color:"var(--ink-2)", lineHeight: 1.55 }}>{text}</div>
    </div>
  );
}

function DesignPlanDoc() {
  return (
    <div style={{ background:"var(--paper)", padding:"56px 64px", fontFamily:"var(--font-ui)", color:"var(--ink)", fontSize: 14, lineHeight: 1.65, minHeight:"100%" }}>
      <header style={{ marginBottom: 36, paddingBottom: 22, borderBottom:"1px solid var(--rule)" }}>
        <div className="eyebrow">Design plan · alongside PLAN.md</div>
        <h1 className="font-display" style={{ fontSize: 44, margin:"6px 0 4px", letterSpacing:"-0.015em", lineHeight:1.1 }}>{PLAN.title}</h1>
        <p style={{ color:"var(--ink-2)", fontSize: 15.5, margin:"0", maxWidth: 640 }}>{PLAN.intro}</p>
      </header>
      {PLAN.sections.map(s => <DPSection key={s.n} s={s}/>)}
      <footer style={{ marginTop: 40, paddingTop: 18, borderTop:"1px solid var(--rule)", color:"var(--ink-3)", fontSize: 12.5, fontFamily:"var(--font-mono)", letterSpacing:".04em" }}>
        END · v0.1 · review with Herman before Phase 1 kickoff
      </footer>
    </div>
  );
}

Object.assign(window, { DesignPlanDoc });
