# [BRAND_NAME] CX Hub — Handover

A guide for running and deploying the [BRAND_NAME] CX Hub.

**Owner:** [OWNER_NAME] ([owner@brand.com])
**Stack:** Next.js (App Router) · React 19 · Prisma + Postgres · Clerk auth · Anthropic Claude API · Railway or Vercel hosting

> This repo started as a **brandless shell**. If you still see `[PLACEHOLDER]`
> text in the running app, work through **[BRAND_SETUP.md](./BRAND_SETUP.md)**.

---

## 1. What this is

A role-gated internal hub for a CX team. Surfaces data across Insights, Logs,
Playbook, Reports, and Records tabs. Includes an AI-powered **Ask AI** chat
assistant (Claude via the Anthropic API). The integration routes ship with
realistic placeholder data so the hub runs before real Shopify / Gorgias /
Skio / Loop credentials are connected.

Single-page Next.js app. Auth via Clerk (role on `publicMetadata.role`). All
API calls happen server-side via `/api/*` routes — the client never sees a token.

---

## 2. Prerequisites

- **Node.js 22.x**
- **npm**
- **A Clerk account** (free tier is fine)
- **Anthropic API key** (for Ask AI chat + AI surfaces)
- **Postgres** (for the DB-backed features and migrations)

---

## 3. Install and run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Opens on <http://localhost:3000>. Sign in with Clerk development keys, then set
your role to `Owner` in Clerk admin → Users → Public metadata:

```json
{ "role": "Owner" }
```

Hard-refresh. You'll see all tabs.

---

## 4. Environment variables

See **[.env.example](./.env.example)** — copy it to `.env.local` and fill in
real values. Clerk + Anthropic are the minimum to get past sign-in and use the
Playbook / Ask AI.

---

## 5. Deployment

**Railway:** auto-deploys on push to `main`. Build `npm run build`, start
`npm run start` (runs `prisma migrate deploy` then `next start`). Add a Postgres
plugin and set all env vars in the project settings.

**Vercel:** `vercel deploy --prod`. Use an external Postgres (Neon / Supabase).
Set all env vars in Settings → Environment Variables.

Add the production URL to Clerk's allowed redirect URLs.

---

## 6. Architecture

### Front end

- **Single big component**: `app/AppClient.jsx`. Tab routing is internal state, not URL-based.
- **Styling**: inline styles + JS colour/font constants. No CSS framework.
- **Fonts**: loaded via `next/font/google` in `app/layout.jsx`.
- **Brand palette**: the 5 colour tokens at the top of `AppClient.jsx` (and mirrored in the sign-in/up pages).

### Back end (API routes)

Everything under `app/api/`:

- `/api/insights/*` — Gorgias / Shopify / Skio / Loop data (placeholder demo data out of the box)
- `/api/logs/*` — CRUD for each log type (seed rows for demo)
- `/api/admin/*` — user management (Admin/Owner only)
- `/api/llm` — proxies the Anthropic API for Ask AI chat
- `/api/affiliates/*` — affiliate macro suggestion + telemetry
- `/api/orders/lookup`, `/api/report-notes`, `/api/kb/macros` — utility endpoints

All routes authenticated via Clerk's `auth()` helper. Role gates use `roleAtLeast()` from `lib/auth.js`.

### AI surfaces

| Endpoint | Purpose | Grounded by |
|---|---|---|
| `/api/llm` (Ask AI) | Free-form CX support chat | `lib/ask-knowledge.js` → `buildAskSystem()` |
| `/api/affiliates/suggest` | Affiliate macro suggestion | `lib/affiliates-data.js` + `lib/tone-of-voice.js` |

`lib/tone-of-voice.js` is the canonical voice guide consumed by the AI surfaces.

---

## 7. Role gates

Valid roles (ascending): `New Starter` → `Agent` → `Ops` → `Lead Agent` → `Manager` → `Admin` → `Owner`

| Tab | Minimum role |
|---|---|
| Home | Any signed-in user |
| Insights | Agent+ |
| Logs | Agent+ |
| Playbook | Agent+ |
| Ask AI | Agent+ |
| Reports | Lead Agent+ |
| Records | Manager+ |
| Affiliates | Manager+ |
| Team | Admin+ |
| Training | Hidden (feature-flagged off) |

Set roles in Clerk admin → Users → Public metadata: `{ "role": "Manager" }` etc.
The Owner is set by the `OWNER_EMAIL` env var.

---

## 8. Customising for your brand

See **[BRAND_SETUP.md](./BRAND_SETUP.md)** for the full checklist. The short version:

| What to change | Where |
|---|---|
| Brand name / wordmark | `app/AppClient.jsx`, sign-in/up pages, `app/layout.jsx` |
| Colours (5 tokens) | top of `app/AppClient.jsx` (mirror in sign-in/up pages) |
| Fonts | `app/layout.jsx` (next/font imports) + `F` constant in `AppClient.jsx` |
| Favicon | `public/favicon.svg` |
| Owner email | `OWNER_EMAIL` env var |
| Products | `lib/products-catalogue.js`, `lib/playbook-data.js` |
| Policies + Playbook | `lib/playbook-data.js` |
| Tone of voice | `lib/tone-of-voice.js` |
| Ask AI knowledge | `lib/ask-knowledge.js` |
| KB macros | `prisma/seed/macros-v2.md` |
| Demo / integration data | `app/api/insights/*` and `app/api/logs/*` |

---

## 9. Common gotchas

- **Clerk session JWTs expire in 60s** — don't copy cookies for testing. Test in the browser console.
- **"View as" preview mode** — persisted to localStorage. Owner/Admin/Manager can preview lower roles. A red banner shows while active.
- **Browser caching** — after a deploy, hard refresh (⌘/Ctrl+Shift+R). If that doesn't clear it, unregister the service worker in DevTools.
