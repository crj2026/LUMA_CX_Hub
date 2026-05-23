# IM8 CS Hub — Handover

A complete guide for cloning, running, and deploying the IM8 CX Hub from scratch. Hand this doc to a new developer or an external team and they'll have everything they need.

**Owner:** Cherie Jones (Head of CX)
**Repo:** <https://github.com/crj2026/im8-training>
**Live:** <https://im8-cs-hub-production.up.railway.app>
**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · Prisma + Postgres · Clerk auth · Anthropic Claude API · Railway hosting

---

## 1. What this is

A role-gated internal hub for the IM8 Customer Experience team. Replaces 6+ Google Sheets, surfaces live data from Gorgias / Shopify / Skio / Loop / Trustpilot, hosts an AI-powered Playbook + Ask IM8 chat, and is the system of record for issue / replacement / adverse-reaction / cancellation / feedback / order-request logs.

Single-page Next.js app. Auth via Clerk (with a role on `publicMetadata.role`). All third-party API calls happen server-side via `/api/*` routes; the React client never sees an API token.

---

## 2. Prerequisites

- **Node.js 22.x** (Railway runs node@22.22.3 in production; match locally)
- **pnpm or npm** (we use npm in production; pnpm works locally)
- **Git**
- **A Postgres database** (Neon, Supabase, Railway Postgres, local Docker — any will do)
- **A Clerk account** (free tier is fine for dev)
- **API access** to:
  - Anthropic (Claude API key)
  - Shopify Admin API (for the IM8 store)
  - Skio (subscription data)
  - Loop Returns (returns + refund data)
  - Gorgias (ticket data)

If you don't have all these, the hub will still run but the relevant tabs will show errors. Clerk + Postgres + Anthropic are the bare minimum to get past sign-in and use the Playbook / Ask IM8.

---

## 3. Clone and install

```bash
git clone https://github.com/crj2026/im8-training.git
cd im8-training
npm install
```

`postinstall` runs `prisma generate` automatically, so the Prisma client gets built on every install.

---

## 4. Environment variables

Create `.env.local` in the repo root with the following. Every key, what it does, and where to get it:

### Auth (required)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…
CLERK_SECRET_KEY=sk_test_…
```

From your Clerk dashboard → API Keys. Use **development keys** for local, **production keys** for the deployed instance.

### Database (required)

```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

Any Postgres connection string. Neon and Supabase both have free tiers that work.

### Anthropic (required for Ask IM8 + Affiliates AI)

```bash
ANTHROPIC_API_KEY=sk-ant-…
```

From console.anthropic.com → API Keys. The hub calls Claude Sonnet 4.5 directly via REST — no SDK dependency.

### Shopify (required for Insights / Reports refund + order data)

```bash
SHOPIFY_STORE_URL=im8store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_…
SHOPIFY_API_VERSION=2024-04
```

Create a custom app in Shopify admin → Apps → Develop apps. Grant the read scopes for Orders, Products, Customers, Refunds. The access token starts with `shpat_`.

### Skio (required for subscription metrics)

```bash
SKIO_API_URL=https://graphql.skio.com/v1/graphql
SKIO_API_TOKEN=…
SKIO_SITE_ID=…
```

From Skio support — they provision a GraphQL API token per merchant. Site ID is on your Skio admin URL.

### Loop Returns (required for returns / refund breakdowns)

```bash
LOOP_API_BASE=https://api.loopreturns.com/api/v1
LOOP_API_KEY=…
```

From Loop dashboard → Developer → API keys.

### Gorgias (required for ticket data)

```bash
GORGIAS_DOMAIN=prenetics
GORGIAS_USERNAME=cherie.jones@prenetics.com
GORGIAS_API_KEY=…
GORGIAS_ACCOUNT_ID=…
```

Gorgias admin → Settings → REST API. Domain is the subdomain (e.g. `prenetics` for `prenetics.gorgias.com`). Account ID is shown in the URL when you're logged in.

### Cron bypass (optional — for scheduled cache warmers)

```bash
CRON_SECRET=any-long-random-string
```

Set this to a long random string. Any cron request to the hub passes this in an `x-cron-secret` header and skips Clerk auth. Used for scheduled cache warmers in production. Skip if you're not running crons.

### NODE_ENV (auto-set by hosting)

`NODE_ENV=production` in deployed environments, `development` locally. Next.js handles this.

---

## 5. Database setup

The schema lives in `prisma/schema.prisma`. To create all tables on a fresh database:

```bash
npx prisma migrate deploy   # production / hosted
# or
npx prisma migrate dev      # local development (also generates migration files if schema changed)
```

The hub auto-runs `prisma migrate deploy` on every container start (see `package.json` → `scripts.start`), so deployed instances always have the latest schema.

**Models you'll see in the database:**

| Model | Purpose |
|---|---|
| `Announcement`, `Tip`, `Kudo`, `TeamEvent` | Home-tab social content |
| `Macro`, `Article`, `Decision`, `Policy` | Knowledge Base (Playbook) |
| `IssueLog`, `Cancellation`, `Feedback`, `Replacement`, `OrderRequest`, `AdverseReaction`, `CancelNoRefund` | Operational logs (Logs / Records tabs) |
| `CacheEntry` | Persistent app cache (survives Railway redeploys) |
| `AffiliateCopyEvent` | Per-click telemetry on Affiliates macro copy buttons |
| `ReportNote` | Free-text notes on weekly reports, keyed by (weekFrom, weekTo) |

No seeds are required — the app starts empty and fills as the team uses it. Knowledge-base content for the Playbook lives in `lib/playbook-data.js` (in source, not the DB).

---

## 6. Run locally

```bash
npm run dev
```

Opens on <http://localhost:3000>. Sign in with the Clerk development keys — first user gets no role by default (Clerk publicMetadata is empty), so set yourself to `Owner` via Clerk admin → Users → click yourself → Public metadata:

```json
{ "role": "Owner" }
```

Hard-refresh the hub. You'll now see all tabs.

Valid roles, in escalating order: `New Starter`, `Agent`, `Ops`, `Lead Agent`, `Manager`, `Admin`, `Owner`. See `lib/auth.js` for the gating logic.

---

## 7. Deployment

### Current: Railway

The hub deploys to Railway on every push to `main`. Configuration:

- **Build command:** `npm run build` (`prisma generate && next build`)
- **Start command:** `npm run start` (`prisma migrate deploy && next start -p $PORT`)
- **Runtime:** Node.js 22.x
- **Database:** Railway Postgres (linked via `DATABASE_URL`)
- **Auto-deploys:** GitHub webhook, push to main = deploy

**Known Railway gotchas** (from `~/.claude/memory/railway_gotchas.md` — internal note):

- The `start` command runs migrations on container start. If a migration is broken, the container will crash-loop and Railway will send alert emails. CHECK SETTINGS FIRST before code when Railway is misbehaving.
- The "Cron mode" project type kills the hub — must stay on "Service mode."
- Webhook delivery can drop occasionally. If a push doesn't trigger a deploy, push an empty commit (`git commit --allow-empty`) or click "Redeploy from latest commit" in the Railway dashboard.

### Alternative: Vercel

The app is a vanilla Next.js project — `vercel deploy --prod` from the repo root works fine. You'll need:

- An external Postgres (Neon, Supabase, etc.) since Vercel doesn't include one
- All env vars set in Vercel project settings
- `vercel.json` config for the `start` migration step (or run migrations manually)

### Alternative: Self-hosted / Docker

`npm run build && npm run start` works on any Node.js 22 host. Make sure `DATABASE_URL` is reachable and migrations have run.

---

## 8. Architecture cheatsheet

### Front end

- **Single big component**: `app/AppClient.jsx` (~10K lines, intentionally one file). Tab routing is internal state, not URL-based. Hash deep-links (`#records:issues`, `#affiliates`) are parsed on mount.
- **Styling**: inline styles + a small set of CSS variables (cream / burgundy / gold / ink palette). No CSS framework.
- **Fonts**: Raleway (sans) + Spectral (serif), loaded via `next/font/google` in `app/layout.jsx`.

### Back end (API routes)

Everything under `app/api/`:

- `/api/insights/*` — Gorgias / Shopify / Skio / Loop / Trustpilot data with caching
- `/api/logs/*` — CRUD for the seven log models
- `/api/affiliates/*` — AI helper + telemetry for the Affiliates playbook
- `/api/llm`, `/api/orders/lookup`, `/api/kb/macros` — utility endpoints

All authenticated via Clerk's server-side `auth()` helper. Role gates use `roleAtLeast()` from `lib/auth.js`.

### AI surfaces

Three independent Claude integrations, all hitting the Anthropic REST API directly:

| Endpoint | Purpose | Grounded by |
|---|---|---|
| `/api/llm` (Ask IM8 chat) | Free-form CS support chat | `lib/ask-im8-knowledge.js` (29 agent Q&As + 30 customer Q&As + tone guide + 9 IM8 values + escalation routing) |
| `/api/affiliates/suggest` | Affiliate email → macro recommendation + escalation flag | `lib/affiliates-data.js` (44 macros + 24-row decision tree + IM8 voice principles) |
| `/api/affiliates/suggest/refine` | Follow-up chat on edge cases | Same grounding as `/suggest` + the initial structured suggestion |
| `/api/insights/trends` | Weekly trend extraction from Gorgias tickets | Sampled customer messages → Claude categorisation |

All AI features inherit the **canonical IM8 Tone of Voice guide** (`lib/tone-of-voice.js`) — built via `buildToneOfVoiceSection()`. Single source of truth for how the hub writes to customers.

### Cache strategy

Two-tier cache via `lib/cache.js`:

1. **L1**: In-memory Node Map. Fast, dies on redeploy.
2. **L2**: `CacheEntry` table in Postgres. Persistent across redeploys so users don't pay a 5-10 min cold-load tax every push.

Most expensive integrations (Shopify GraphQL, Skio cancel reasons, trends LLM call) are cached for 1 hour. Cache keys include the date range so different windows don't collide.

---

## 9. External services — what each one does

| Service | What we use it for | Cost |
|---|---|---|
| **Clerk** | User auth, role storage on publicMetadata, sign-in UI | Free tier handles ~10K MAU |
| **Anthropic** | Claude Sonnet 4.5 for Ask IM8, Affiliates helper, trends | Pay-per-token, ~$50-100/mo at current usage |
| **Shopify Admin API** | Orders, refunds (via GraphQL `order.totalRefundedSet.shopMoney`), customer lookups | Free (included with Shopify plan) |
| **Skio GraphQL** | Active subs, cancellations, churn, cancel-flow reason analytics | Included with Skio |
| **Loop Returns API** | Returns submitted / processed / labels / handling fees | Included with Loop |
| **Gorgias REST API** | Ticket volume, CSAT, resolution time, top tags, channel mix | Included with Gorgias |
| **Trustpilot** | Static (no API) — review count + star rating hard-coded in `lib/trustpilot-stats.js`. Update manually monthly. | Free |
| **Railway** | Hosting + Postgres + auto-deploy from GitHub | ~$5-20/mo for hub + Postgres |

---

## 10. Where to find specific things

| Looking for | File |
|---|---|
| Tab routing + role gates | `app/AppClient.jsx` (top of `App` function, ~line 2110) |
| Database schema | `prisma/schema.prisma` |
| Role definitions + helpers | `lib/auth.js` |
| Tone of voice guide (canonical) | `lib/tone-of-voice.js` |
| Ask IM8 system prompt + Q&A library | `lib/ask-im8-knowledge.js` |
| Affiliates playbook (macros + decisions) | `lib/affiliates-data.js` |
| Playbook content (products, policies, shipping) | `lib/playbook-data.js` |
| Replacement form reasons taxonomy | `lib/replacement-reasons.js` |
| Product catalogue (SKUs) | `lib/products-catalogue.js` |
| Siena affiliate policy doc (for external AI) | `docs/siena-affiliate-policy.md` |
| Shopify / Skio / Loop / Gorgias helpers | `lib/{shopify,skio,loop,gorgias}.js` |
| Cache helper | `lib/cache.js` |
| Sign-in / sign-up pages | `app/sign-in/[[...sign-in]]/page.jsx`, `app/sign-up/[[...sign-up]]/page.jsx` |

---

## 11. Common gotchas (battle-tested)

- **Service Worker caching.** Browsers (especially Chrome) aggressively cache the Next.js bundle. Hard refresh (⌘+Shift+R) is usually enough. If not, DevTools → Application → Service Workers → Unregister, then Storage → Clear site data.

- **Clerk session JWTs are 60 seconds.** Don't copy a session cookie out for testing — it'll expire by the time you run the command. Test in the browser console instead (auth attached automatically).

- **Multi-currency refunds.** Shopify Payments multi-currency (IDR, KRW, etc.) hides USD amounts. Always use `order.totalRefundedSet.shopMoney.amount` from GraphQL — `tx.amount_set.shop_money` from the REST refund payload is undefined for foreign currencies and will silently undercount. See the comment block in `app/api/insights/shopify/route.js`.

- **Railway auto-deploy can drop a webhook.** If a push doesn't deploy, click Redeploy in the Railway dashboard or push an empty trigger commit.

- **Per-endpoint fetch timeouts.** Most integrations run on a 90-second timeout, but `/api/insights/trends` (the LLM call) runs on 280 seconds because customer-message reads are slow. See `lib/fetch-with-timeout.js` (if present) or check the AbortController setup in each route.

- **"View as" preview mode** lives in `App()` state, persisted to localStorage. Owner/Admin/Manager can view the hub as a lower role. UI-only — API gates still see the real Clerk role. Red banner appears at the very top while preview is active so it can't be left on by accident.

---

## 12. Quick smoke test after a fresh setup

After `npm run dev` with all env vars set:

1. Visit <http://localhost:3000> → redirected to `/sign-in`
2. Sign in with Clerk dev keys
3. Set your `role` to `Owner` in Clerk admin → publicMetadata
4. Hard-refresh the hub
5. Top of Home tab: should see "Good [morning/afternoon], [your name]" with all tab pills visible
6. Click **Insights** — should load Gorgias / Shopify / Skio numbers within ~10 seconds (longer on first cache miss)
7. Click **Playbook** — products, policy, shipping should all render
8. Click **Ask IM8** — type "what's the money-back guarantee window?" — should get a structured answer in 3-5 seconds
9. Click **Logs** → **Issues** → log a test issue with a real Shopify order ID — the Lookup button should auto-fill customer name + country

If any step errors, check the browser console + the server logs for the failing endpoint. Most errors are env-var-missing or API-credentials-wrong.

---

## 13. License + brand

Internal IM8 / Prenetics tooling. Not open source. The IM8 wordmark, brand colours, and palette are IM8 / Prenetics property.

If you're forking this for a different brand, search-and-replace:
- `IM8`, `im8health.com`, `prenetics`
- Brand colours: `BURG = #50000B`, `GOLD = #C8973A`, `CREAM = #FAF6F1`, `INK = #3A2F2C`, `RED = #A40011`
- Lightning bolt favicon → swap `public/favicon.svg`
- Wordmark "I M 8" in `app/AppClient.jsx` header and on the sign-in/sign-up pages

---

## 14. Maintenance — what to do when

| Need | What to do |
|---|---|
| Add a new product to the SKU dropdowns | Edit `lib/products-catalogue.js` and/or `lib/replacement-reasons.js` |
| Add a new affiliate macro | Edit `lib/affiliates-data.js`. Bump `ASK_IM8_VERSION` if you've also touched Ask IM8 knowledge |
| Change tone-of-voice rules | Edit `lib/tone-of-voice.js`. All three AI surfaces pick up the change automatically |
| Add a new role | Add to `ROLES` array in `lib/auth.js`. Update gates in `app/AppClient.jsx` if the new role needs different tab visibility |
| Add a new log type | New Prisma model → `npx prisma migrate dev --name add_x_log` → API routes under `app/api/logs/x/` → form panel in `AppClient.jsx` → optionally a Records config row in `buildRecordsConfig()` |
| Update Trustpilot numbers | Edit `lib/trustpilot-stats.js` manually (no API integration) |
| Rotate Anthropic key | Update `ANTHROPIC_API_KEY` in Railway env vars → automatic redeploy → done |

---

## 15. Current role gates (snapshot)

These are the live role-gate decisions across the hub. They shift with business needs — `App()` in `app/AppClient.jsx` is always the source of truth, but this table saves you a grep when onboarding.

### Tab visibility (top nav)

| Tab | Minimum role |
|---|---|
| Home | Any signed-in user |
| Insights | Agent and above |
| Logs | Agent and above (hidden for New Starter) |
| Playbook | Agent and above |
| Ask IM8 | Agent and above |
| Reports | Lead Agent and above |
| Records | Manager and above |
| Affiliates | Manager and above (bumped from Lead Agent+ on 2026-05-22 while the workstream is being re-scoped) |
| Team | Admin and above |
| Training | Hidden by default (feature-flag in `App()`) |

### Cross-cutting controls

| Capability | Minimum role |
|---|---|
| Edit cells in Records | Manager |
| Delete rows in Records (× button on each row) | Manager |
| Invite + remove users on Team | Admin |
| Grant Admin role on Team | Owner |
| "View as" role-preview dropdown (header right) | Manager and above (only previews roles strictly below the actual role; Owners also see "View as: Admin") |
| Cron-bypass via `x-cron-secret` header | N/A — secret-based, skips Clerk |

### Why these gates exist (a few worth knowing)

- **Reports → Lead Agent+** — weekly stakeholder report has commercial detail (revenue, refund %, churn). Not for new hires still ramping.
- **Records → Manager+** — editable spreadsheet of every log. Delete is destructive; gate kept tight.
- **Affiliates → Manager+** — temporarily elevated while the workstream needs a dedicated owner. To re-open to Lead Agents later: drop `"Lead Agent"` back into the `["Manager","Admin","Owner"]` arrays in two places (`App()` tab filter + `AffiliatesTab` component canView check).
- **Team → Admin+** — user management is governance. API also enforces (admin routes use `requireAdmin()`).
- **View-as → Manager+** — useful for senior roles recording training Looms ("here's what an Agent sees"). UI-only, never escalates real permissions.

---

That's the full picture. If anything breaks on the new host, the most common culprit is one of the env vars in Section 4 — check those first.

— Last updated 2026-05-23
