# Hyble AI Menu MVP — Build Plan

> **Audience:** Claude Code (planning, review, and execution)
> **Owner:** Herman, VP Engineering, Hyble
> **Status:** Planning — please review and challenge before building

---

## 1. Goal

Ship an AI-first, mobile-friendly PWA that lets Hyble customers create and recreate brand-compliant printable menus by prompting. This replaces the workaround flow where field sales reps generate menus in ChatGPT/Canva and upload them to Hyble for printing — that workaround damages our brand reputation, produces non-compliant designs, and loses us valuable metadata.

The MVP must:
- Match the speed and feel of ChatGPT/Canva so reps actually use it
- Inject Hyble's brand kits + 50-state legal rules into every generation
- Capture structured metadata that flows into the existing chargeback pipeline
- Stay simple: two nav items only (Create, Orders), one core flow

---

## 2. User Experience

### Navigation
- Left rail with two items: **Create**, **Orders**
- Active state, icon + label, collapsible on mobile
- No other nav. Resist scope creep.

### Create flow

**Initial state (empty):**
A centered prompt builder with a structured template that fills in like a sentence:

> Create a `[wine menu | cocktail menu]` for `[customer dropdown]` with this menu `[optional image upload]` and make the following changes: `[free-text field]`

- `customer` is selected from a predefined list — selecting a customer pulls in their brand kit (colors, fonts, logos, mandatory disclaimers) and primary state (drives legal rules)
- Image upload is optional. If present → recreate flow (60% of orders). If absent → new menu flow.
- Submit button: "Generate"

**After first generation:**
The view transitions to a split layout:
- **Left panel** — messaging UI (chat history, user turns, agent turns, status updates). The original structured prompt now appears as the first message in this thread. Subsequent input is a free-text chat box at the bottom.
- **Right panel** — the most recent generated design, full-bleed, with controls: Regenerate, Download, Save to Order.
- Each new chat turn triggers a new generation; right panel updates; left panel keeps history with thumbnails.

**Mobile layout (< 768px):**
- Stacked layout, not split. Top: design preview. Bottom: chat. A toggle/tab switches between "Design" and "Chat" full-screen views.
- The transition from "empty" to "active" is the same — just stacked instead of side-by-side.

### Orders flow
- List view of all orders for the user
- Tap into an order → see all generations for that order, the final selected design, metadata, and a link to the print pipeline (out of scope for MVP — just show the data)

---

## 3. Architecture

### High-level

```
[ PWA Frontend ]  --HTTPS-->  [ Node API ]  --calls-->  [ Anthropic API (Claude Sonnet 4.6) ]
                                   |                            |
                                   |                            +--> tool: gpt-image-2 (OpenAI)
                                   |                            +--> tool: validate_compliance
                                   |                            +--> tool: extract_metadata
                                   |
                                   +--> [ Postgres (Railway) ]
                                   +--> [ Image storage (Railway volume) ]
```

### Why a "brain" layer (Claude) on top of gpt-image-2

`gpt-image-2` is general-purpose and has no knowledge of Hyble's brand kits, state rules, or chargeback metadata schema. The Claude agent layer does four things gpt-image-2 cannot:

1. **Prompt construction** — converts user input + customer brand kit + state rules into an optimised image prompt
2. **Vision read of uploaded reference menu** — extracts existing layout/items so the edit prompt is surgical
3. **Pre-flight compliance check** — blocks non-compliant prompts before spending image generation tokens
4. **Post-generation metadata extraction** — produces structured JSON (brand mentions, supplier, format/dimensions, designation code) that flows into the chargeback pipeline. **This is the strategic point of the whole project.**

### Single service vs. split

**Recommendation: single Node service** for MVP. Fastify serves both the API (`/api/*`) and the built React PWA static assets. One Railway service, one deploy, no CORS. Split into two services later if and when we need to.

### Streaming

Use **Server-Sent Events** (SSE) from API to frontend for generation status updates. Avoid WebSockets — overkill for this. Status events: `reading_reference`, `building_prompt`, `generating`, `validating`, `extracting_metadata`, `done`, `error`.

---

## 4. Data Model (Postgres)

Align schemas with the chargeback Sprint 2 work where possible — same shape for `brand_kits`, `state_rules`, `customers` so we don't duplicate.

```
users
  id, email, password_hash, created_at

customers                          -- the bars/restaurants Hyble's customers serve
  id, name, primary_state, brand_kit_id, created_at

brand_kits                         -- per supplier (Bacardi, Diageo, etc.)
  id, supplier_name, primary_color_hex, secondary_color_hex,
  font_family, logo_url, mandatory_disclaimers (jsonb), created_at

state_rules                        -- 50-state legal rules
  state_code, rule_type, rule_value (jsonb), updated_at
  -- shape this to match chargeback Sprint 2 model

orders
  id, user_id, customer_id, menu_type ('wine' | 'cocktail'),
  status ('draft' | 'finalised'), final_generation_id, created_at, updated_at

generations
  id, order_id, parent_generation_id (nullable, for iteration chain),
  prompt_user_input (text),
  prompt_constructed (text),         -- the optimised prompt sent to gpt-image-2
  reference_image_url (nullable),
  output_image_url,
  agent_response (text),             -- the Claude chat reply shown to user
  metadata (jsonb),                  -- structured extraction for chargeback pipeline
  cost_cents, model_used, mode ('instant' | 'thinking'),
  status, created_at

messages                           -- chat history per order
  id, order_id, role ('user' | 'assistant'),
  content (text), generation_id (nullable), created_at
```

Use **Drizzle ORM** (SQL-first, lightweight, good TypeScript support). Migrations checked into the repo.

---

## 5. Agent Design (Claude Sonnet 4.6)

### Model
`claude-sonnet-4-6` via `@anthropic-ai/sdk`. Vision-enabled. Tool use enabled. Streaming on for chat responses.

> Use Opus 4.7 only if quality is meaningfully better in eval — start with Sonnet 4.6 for cost.

### System prompt
Brand-compliant menu design expert for Hyble. Knows wine and spirits industry conventions. Knows Hyble's chargeback metadata requirements. Responds in a friendly tone matched to field sales reps.

### Tools the agent can call

```ts
generate_menu_image({
  prompt: string,           // the optimised prompt
  reference_image?: string, // base64 or URL
  size: '1024x1024' | '1024x1536' | '1536x1024',
  quality: 'low' | 'medium' | 'high',
  mode: 'instant' | 'thinking'
})

validate_compliance({
  customer_id: string,
  prompt: string,
  reference_image?: string
}) -> { ok: boolean, issues: string[] }

extract_metadata({
  generation_id: string,
  image_url: string
}) -> {
  brand_mentions: [{ brand, supplier, count }],
  format: 'small' | 'large',
  dimensions: { width_in, height_in },
  designation_code: 'DNB' | 'NCB/b' | 'NCB/s' | 'none'
}
```

### Agent loop (per user turn)

1. Receive user message + order context (customer, brand kit, state rules, conversation history, latest generation if any)
2. If first turn: call `validate_compliance` first; if not ok, respond with explanation, do not generate
3. Call `generate_menu_image` (use Thinking mode by default for layout-heavy menus; Instant for minor tweaks)
4. After image returns, call `extract_metadata`
5. Persist generation row with prompt, image URL, metadata
6. Stream chat response to user describing what was generated and inviting next tweaks

### Iteration / re-prompting
On follow-up turns, the agent receives the previous generation as `reference_image` automatically and uses the `/images/edits` endpoint pattern. Same agent, same loop.

---

## 6. Image Generation (`gpt-image-2`)

### Verification before building
**Confirm in the OpenAI dashboard that `gpt-image-2` is accessible on Hyble's API key, and that API Org Verification is complete.** Some sources said "early May rollout" — verify on day one.

### Endpoints
- `/v1/images/generations` for new menus (no reference image)
- `/v1/images/edits` for recreate flow (with reference image)
- Prefer the **Responses API** with the image generation tool if we want the model to choose generate-vs-edit automatically — useful for the iteration loop

### Defaults
- `quality: 'high'` for final renders
- `quality: 'medium'` for in-progress iterations to control cost
- `mode: 'thinking'` for first generation per order (layout planning matters)
- `mode: 'instant'` for minor tweaks
- `size: '1024x1536'` for portrait menus, `1536x1024` for landscape; expose this as a customer-level default

### Cost controls
- Reference images are billed at high-fidelity input rates regardless of `quality` parameter — flag in code, log per-call cost, store in `generations.cost_cents`
- Per-user daily generation cap (configurable, default 50/day for MVP)
- Per-order generation cap (configurable, default 20)
- Daily total spend alert via env-configurable webhook

### Image persistence
**Do not rely on OpenAI's returned URLs — they expire.** Download every generated image immediately, store on Railway volume, serve through our API at a stable URL (`/api/images/:id`). Same for uploaded reference images.

---

## 7. Tech Stack

### Frontend
- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- React Router v6
- TanStack Query for server state
- `vite-plugin-pwa` for PWA manifest, service worker, offline shell
- EventSource for SSE streaming
- React Hook Form + Zod for the structured prompt builder

### Backend
- Node.js (LTS)
- Fastify
- TypeScript
- Drizzle ORM + `pg` driver
- `@anthropic-ai/sdk`
- `openai` (official SDK)
- `pino` for structured logging
- `zod` for runtime validation
- `bcrypt` for auth
- `jose` for JWT (HTTP-only cookies)

### Infrastructure (Railway)
- Single Railway service running the Fastify app
- Railway-managed Postgres
- Railway volume mounted for image storage (start with this; migrate to R2 if volume grows past a few GB)
- Environment via Railway's env management → loaded into `.env` locally for dev

### No Python anywhere in this MVP. If we hit a need for Python later (e.g. a specific image processing lib), justify and add as a separate service.

---

## 8. Repo Structure

Single repo, monolith app. Use `pnpm` workspaces if we want to split into `apps/web` and `apps/api` packages — recommended for clean separation while still single-deploy.

```
hyble-ai-menu/
├── apps/
│   ├── api/                    # Fastify server
│   │   ├── src/
│   │   │   ├── routes/         # /api/* handlers
│   │   │   ├── agent/          # Claude agent + tools
│   │   │   ├── services/       # gpt-image-2 client, storage, db
│   │   │   ├── db/             # Drizzle schema + migrations
│   │   │   └── server.ts
│   │   └── package.json
│   └── web/                    # Vite PWA
│       ├── src/
│       │   ├── routes/         # /create, /orders
│       │   ├── components/
│       │   ├── lib/            # api client, sse client
│       │   └── main.tsx
│       └── package.json
├── packages/
│   └── shared/                 # shared types, zod schemas
├── .env.example
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── railway.toml                # Railway deploy config
└── README.md
```

The Fastify server in production serves the built `apps/web/dist` as static files plus the API on `/api/*`.

---

## 9. Environment Variables

All secrets and config in `.env`. Provide `.env.example` checked into the repo. Railway env vars mirror this.

```
# App
NODE_ENV=development
PORT=3000
PUBLIC_URL=http://localhost:3000

# Auth
SESSION_SECRET=                  # random 32+ char string
JWT_SECRET=                      # random 32+ char string

# Database
DATABASE_URL=                    # Railway Postgres connection string

# AI
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-6
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-2

# Storage
IMAGE_STORAGE_PATH=/data/images  # Railway volume mount path
MAX_UPLOAD_MB=10

# Cost controls
DAILY_GENERATION_CAP_PER_USER=50
ORDER_GENERATION_CAP=20
DAILY_SPEND_ALERT_USD=200
COST_ALERT_WEBHOOK_URL=

# Logging
LOG_LEVEL=info
```

**Never commit `.env`.** `.env.example` only.

---

## 10. Build Phases

These are sequenced for incremental, demonstrable progress. Each phase ends with something runnable.

### Phase 1 — Foundation
- Repo skeleton, pnpm workspaces, TypeScript configs
- Fastify server with `/api/health`
- Vite + React PWA shell with the two-route nav
- Postgres + Drizzle schema + migrations
- Auth (email/password, JWT cookies)
- Railway deploy working end-to-end
- `.env.example` complete

### Phase 2 — Brain + text-to-image
- Anthropic SDK integration
- `generate_menu_image` tool calling gpt-image-2 generations endpoint
- Image download + persistence to Railway volume
- Create page: structured prompt builder (no reference image yet) → triggers agent → image returned and shown
- SSE for status updates
- Generation row + message row written to DB

### Phase 3 — Recreate flow (image-to-image)
- Reference image upload (validated, persisted)
- Vision-read in agent (Claude reads the reference)
- gpt-image-2 edits endpoint integration
- Iteration loop: split layout activates after first generation, follow-up chat triggers new edit calls

### Phase 4 — Compliance + metadata
- `validate_compliance` tool
- `extract_metadata` tool
- Brand kits + state rules tables seeded with real Hyble data
- Pre-flight compliance check blocks non-compliant generations
- Metadata stored in `generations.metadata` for chargeback pipeline consumption

### Phase 5 — Orders + polish
- Orders list page
- Order detail with all generations + selected final
- Cost tracking visible per order
- PWA manifest finalised, service worker, install prompt
- Mobile layout pass: stacked + toggle, touch-friendly controls
- Error states, retry, rate limit messaging

> **Timeline note:** Past evidence is that I (Herman) and Claude Code in parallel worktrees ship faster than typical estimates. Don't pad. Plan tight, adjust on signal.

---

## 11. Risks & Open Questions

For Claude Code to surface, challenge, or resolve during planning review:

1. **gpt-image-2 API access timing.** Verify on the Hyble OpenAI dashboard before Phase 2 starts. If full API access slips, fall back to `gpt-image-1.5` for development.
2. **API Org Verification.** OpenAI requires this for GPT Image models — confirm completed.
3. **Reference image cost surprise.** Edit-heavy iteration is more expensive than headline pricing suggests. Add cost telemetry from Phase 2.
4. **Image URL expiration.** OpenAI's returned image URLs expire — we must download and persist. Make this a Phase 2 invariant.
5. **State rules data shape.** Align with chargeback Sprint 2 model. Don't fork the schema. Confirm with chargeback build before seeding.
6. **Brand kit data completeness.** What's the source of truth for supplier brand kits today? If it's scattered, we may need a small admin UI in a later phase to maintain them.
7. **Mobile reference image source.** Field reps will likely photograph existing menus on phones. Image quality + lighting will vary. Test the recreate flow on real-world phone photos, not clean PDFs.
8. **Liability / legal sign-off.** Alcohol marketing has real exposure. Phase 4's compliance check is the gate that lets Hyble Legal sign off on shipping. Don't ship Phase 5 to production without Legal review.
9. **PostHog session recording.** Given the active GDPR/CCPA work — if PostHog is integrated, ensure no PII in session recordings. Probably mask the chat input field.
10. **Auth for MVP.** Email/password is fine for MVP. Plan SSO integration with Hyble's existing auth in a follow-up.

---

## 12. Out of Scope (explicitly)

To keep MVP tight:
- img.ly post-generation editing — pencil in for v2 only if user feedback shows prompting is insufficient
- Templates, history search, sharing
- Multi-user collaboration on a single order
- Native mobile apps (PWA only)
- Print pipeline integration (orders just show data; existing pipeline handles print)
- SAP integration (chargeback Sprint 4 territory)
- SSO / Hyble auth integration
- Advanced cost dashboards
- Admin UI for brand kits / state rules (use SQL or a temporary script for MVP seeding)

---

## 13. Notes for Claude Code

- **Review this plan first.** Push back on anything that feels wrong, missing, or over-engineered. Your planning review is part of the deliverable.
- **All variables in `.env`.** No hardcoded API keys, paths, model names, or cost caps anywhere in code. Use `.env.example` as the contract.
- **Node.js everywhere.** No Python. If you think we need it, justify in writing first.
- **Railway-native.** Use Railway Postgres, Railway volumes, Railway env management. No third-party infra unless justified.
- **Single service deploy** for MVP. One Fastify app serves both API and built PWA.
- **Always download and persist images.** OpenAI URLs expire. This is a hard rule.
- **Cost telemetry from day 1.** Every gpt-image-2 call logs estimated cost to `generations.cost_cents`.
- **Tight feedback loops.** Phase 1 should be runnable on Railway within a day or two. We iterate from there.
- **TypeScript strict mode.** No `any` without justification.
- **Don't pad timelines.** Past projects have shipped in 1 week what was estimated at 2 months. Plan tight.
- **Use parallel git worktrees** where phases can advance independently.

When you've reviewed: respond with (1) anything you'd change in this plan, (2) anything missing, (3) the proposed Phase 1 task list with concrete file paths.
