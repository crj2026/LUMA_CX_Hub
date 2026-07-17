# Luma CX Hub — Handover

A complete guide for running and deploying the Luma CX Hub from scratch.

**Owner:** Cherie Jones  
**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · Clerk auth · Anthropic Claude API · Vercel hosting  
**Note:** This is a sales demo build — all data is mocked. No database required.

---

## 1. What this is

A role-gated internal hub for a CX team. Surfaces mock data across Insights, Logs, Playbook, Reports, and Records tabs. Includes an AI-powered Ask Luma chat assistant (Claude via Anthropic API). All API integrations return realistic hardcoded demo data — no real Shopify/Gorgias/Skio/Loop credentials needed.

Single-page Next.js app. Auth via Clerk (with a role on `publicMetadata.role`). All API calls happen server-side via `/api/*` routes.

---

## 2. Prerequisites

- **Node.js 22.x**
- **npm**
- **A Clerk account** (free tier is fine)
- **Anthropic API key** (for Ask Luma chat)

That's it. No database, no third-party service credentials.

---

## 3. Install and run locally

```bash
npm install
npm run dev
```

Opens on <http://localhost:3000>. Sign in with Clerk development keys, then set your role to `Owner` in Clerk admin → Users → Public metadata:

```json
{ "role": "Owner" }
```

Hard-refresh. You'll see all tabs.

---

## 4. Environment variables

Create `.env.local` in the repo root:

```bash
# Auth (required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…
CLERK_SECRET_KEY=sk_test_…

# AI — Ask Luma chat (required for Ask Luma tab)
ANTHROPIC_API_KEY=sk-ant-…

# Optional — email that gets Owner role on first sign-in
OWNER_EMAIL=your@email.com
```

No database URL needed. No Shopify/Gorgias/Skio/Loop credentials needed — all those tabs return mock data.

---

## 5. Vercel deployment

```bash
vercel deploy --prod
```

Set all env vars from Section 4 in Vercel project settings (Settings → Environment Variables).

Vercel auto-detects Next.js — no `vercel.json` needed. Build command is `next build`, output is `.next`.

---

## 6. Architecture

### Front end

- **Single big component**: `app/AppClient.jsx`. Tab routing is internal state, not URL-based.
- **Styling**: inline styles + JS color/font constants. No CSS framework.
- **Fonts**: DM Sans (sans) + Cormorant Garamond (serif), loaded via `next/font/google`.
- **Design tokens**: `INK=#0A0A09`, `CREAM=#F4F0E8`, `GOLD=#C4A96B`, `W=#FAF8F3`, `SOFT_BORDER=#DDD8CE`

### Back end (API routes)

Everything under `app/api/`:

- `/api/insights/*` — mock Gorgias / Shopify / Skio / Loop data (hardcoded realistic numbers)
- `/api/logs/*` — in-memory CRUD with seed rows for demo
- `/api/llm` — proxies Anthropic API for Ask Luma chat
- `/api/orders/lookup` — mock Shopify order lookup
- `/api/report-notes` — in-memory notes (lost on server restart — fine for demo)

All routes authenticated via Clerk's `auth()` helper.

### AI surfaces

| Endpoint | Purpose | Grounded by |
|---|---|---|
| `/api/llm` (Ask Luma) | Free-form CX support chat | `lib/ask-luma-knowledge.js` |
| `/api/affiliates/suggest` | Affiliate macro suggestion | `lib/affiliates-data.js` |

---

## 7. Role gates

Valid roles (ascending): `New Starter` → `Agent` → `Ops` → `Lead Agent` → `Manager` → `Admin` → `Owner`

| Surface | Minimum role |
|---|---|
| Home (warm start-my-day) | Any signed-in user (Agent tier) |
| Home (Impact / Value Ledger) | Manager+ (automatic) |
| Insights (incl. Retention Cohorts) | Agent+ |
| Logs (incl. 3PL Claim) | Agent+ |
| Playbook | Agent+ |
| Training | Everyone (role-aware: New Starter path / reference / review / edit) |
| Ask LUMÉ | Everyone — slide-over via floating button or Cmd+K (no tab) |
| Reports (Weekly Summary · Recovery · Voice of Customer) | Lead Agent+ |
| Reports · Impact (Value Ledger) | Manager+ |
| Records (incl. Claims) | Manager+ |
| Affiliates | Hidden (feature-flagged off) |
| Team (+ Security & access, Owner) | Admin+ |

Set roles in Clerk admin → Users → Public metadata: `{ "role": "Manager" }` etc.

---

## 8. Customising for a real client

To swap in a real client's branding and data:

| What to change | Where |
|---|---|
| Brand name ("Luma CX") | `app/AppClient.jsx` header, sign-in/sign-up pages |
| Colors | `INK`, `CREAM`, `GOLD`, `W`, `SOFT_BORDER` constants in `AppClient.jsx` |
| Fonts | `app/layout.jsx` (next/font imports) |
| Products | `lib/products-catalogue.js` |
| Policies + Playbook | `lib/playbook-data.js` |
| Tone of voice | `lib/tone-of-voice.js` |
| Ask Luma system prompt | `lib/ask-luma-knowledge.js` → `buildAskLumaSystem()` |
| Insights mock data | `lib/demo-insights.js` (single source — routes + client) |
| Log seed rows | `lib/demo-logs.js` (relative-dated seed functions) |
| Claims / ledger / VoC / retention | `lib/demo-claims.js`, `lib/demo-ledger.js`, `lib/demo-voc.js`, `lib/demo-retention.js` |
| Chart helpers | `lib/chart-utils.js` (seeded series, sparkline paths) |
| Real DB (if needed) | Add Prisma, swap mock routes for real queries |

---

## 9. Common gotchas

- **Clerk session JWTs expire in 60s** — don't copy cookies for testing. Test in the browser console.
- **"View as" preview mode** — persisted to localStorage. Owner/Admin/Manager can preview lower roles. Red banner appears while active.
- **Log data is in-memory** — server restart clears any POSTed logs. Seed rows always reappear. For a persistent demo, commit new entries to `SEED_ROWS` in the route files.

---

— Last updated 2026-07-17 (Update Pack v2: relative-dated seeds, charts, Cmd+K, Ask LUMÉ slide-over, Value Ledger, Modules A–D, mobile pass)
