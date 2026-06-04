# [BRAND_NAME] CX Hub

A role-gated internal hub for a Customer Experience team. Surfaces live data
across Insights, Logs, Playbook, Reports, and Records tabs, and includes an
AI-powered **Ask AI** chat assistant (Claude via the Anthropic API).

**This is a brandless shell.** All brand-specific content has been replaced
with clearly-labelled `[PLACEHOLDERS]`. Work through **[BRAND_SETUP.md](./BRAND_SETUP.md)**
to make it your own.

**Stack:** Next.js (App Router) · React 19 · Prisma + Postgres · Clerk auth ·
Anthropic Claude API (direct REST) · deploys to Railway or Vercel.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in Clerk + Anthropic at minimum
npm run dev
```

Open <http://localhost:3000>, sign in with Clerk dev keys, then set your role
to `Owner` in Clerk admin → Users → Public metadata: `{ "role": "Owner" }`.
Hard-refresh and you'll see every tab.

The integration data routes (`/api/insights/*`, `/api/logs/*`) ship with
realistic placeholder/demo data, so the hub runs without any Shopify / Gorgias
/ Skio / Loop credentials. Wire those up when you're ready.

## Where the brand content lives

| What | File |
|---|---|
| Colours, wordmark, fonts | `app/AppClient.jsx` (top), `app/layout.jsx`, sign-in/up pages |
| Owner email | `OWNER_EMAIL` env var (see `lib/auth.js`) |
| Products / policies / FAQ | `lib/playbook-data.js` |
| Tone of voice | `lib/tone-of-voice.js` |
| Ask AI knowledge | `lib/ask-knowledge.js` → `buildAskSystem()` |
| SKU lists | `lib/products-catalogue.js` |
| Replacement reasons | `lib/replacement-reasons.js` |
| Affiliate program | `lib/affiliates-data.js` |
| KB macros | `prisma/seed/macros-v2.md` |
| Demo data | `app/api/insights/*` and `app/api/logs/*` |
| Favicon | `public/favicon.svg` |

See **[BRAND_SETUP.md](./BRAND_SETUP.md)** for the full checklist and
**[HANDOVER.md](./HANDOVER.md)** for operating the hub once it's live.

## Roles

Ascending: `New Starter` → `Agent` → `Ops` → `Lead Agent` → `Manager` →
`Admin` → `Owner`. Gating logic lives in `lib/auth.js` and `app/AppClient.jsx`.
