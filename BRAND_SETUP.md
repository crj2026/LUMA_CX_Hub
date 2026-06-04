# Brand Setup — turning the shell into your hub

This codebase is a **brandless shell**. Everything brand-specific has been
replaced with clearly-labelled placeholders. Search the repo for `[` to find
them. This doc lists every placeholder and where to set it.

## Placeholder reference

| Placeholder | Meaning | Where to set it |
|---|---|---|
| `[BRAND_NAME]` | Your brand name / wordmark | `app/AppClient.jsx`, `app/layout.jsx`, sign-in/up pages, lib content files, demo routes |
| `[BRAND_TAGLINE]` | Sign-in/up tagline | `app/sign-in/.../page.jsx`, `app/sign-up/.../page.jsx` |
| `[BRAND_DOMAIN]` | Your web domain (e.g. `brand.com`) | `app/AppClient.jsx`, lib content files |
| `[PRIMARY_COLOR]` `[ACCENT_COLOR]` `[BACKGROUND_COLOR]` `[SURFACE_COLOR]` `[ALERT_COLOR]` | The 5 palette colours | Top of `app/AppClient.jsx`; mirror the hex values in the sign-in/up pages |
| `[BRAND_FONT_SANS]` `[BRAND_FONT_SERIF]` | Typography | `app/layout.jsx` (next/font) + `F` constant in `app/AppClient.jsx` |
| `[LOGO_URL]` / favicon | Brand mark | `public/favicon.svg` |
| `[OWNER_EMAIL]` | Email that gets the Owner role | `OWNER_EMAIL` env var (see `.env.example`) |
| `[GORGIAS_SUBDOMAIN]` | Your Gorgias subdomain | `GORGIAS_DOMAIN` env var / `lib/gorgias.js` |
| `[BRAND_TAG]` | Gorgias tag marking your tickets (multi-brand accounts) | `BRAND_TICKET_TAG` env var / `lib/insights.js` |
| `[HUB_URL]` | Deployed app URL | `APP_URL` env var |

## Step-by-step

### 1. Brand identity (≈ half a day)
- [ ] Replace the 5 colour hex values at the top of `app/AppClient.jsx` (labelled `[PRIMARY_COLOR]` etc.) and mirror them in `app/sign-in/[[...sign-in]]/page.jsx` and `app/sign-up/[[...sign-up]]/page.jsx`.
- [ ] Replace `[BRAND_NAME]` everywhere (global find-and-replace is fine — it's only ever a string literal, never an identifier).
- [ ] Set `[BRAND_TAGLINE]` on the sign-in/up pages.
- [ ] Swap `public/favicon.svg` for the brand mark.
- [ ] Update fonts in `app/layout.jsx` and the `F` constant in `app/AppClient.jsx` if the brand uses different typography.
- [ ] Update `title` / `description` in `app/layout.jsx`.

### 2. Auth & roles
- [ ] Set `OWNER_EMAIL` in your environment. Keep the `ROLES` hierarchy in `lib/auth.js` unless the team structure is fundamentally different.

### 3. Brand content (the long pole — plan a few days of CX writing)
- [ ] `lib/playbook-data.js` — products, policies, shipping, escalation, FAQs.
- [ ] `lib/ask-knowledge.js` — Ask AI grounding: voice rules, decision tree, escalation, products, save plays. Bump `ASK_VERSION` whenever you edit it.
- [ ] `lib/tone-of-voice.js` — the canonical voice guide (consumed by all AI surfaces).
- [ ] `lib/products-catalogue.js` — SKU lists for the log forms.
- [ ] `lib/replacement-reasons.js` — adjust the (mostly generic) reason taxonomy.
- [ ] `lib/affiliates-data.js` — affiliate program data (or delete it + the Affiliates tab).
- [ ] `prisma/seed/macros-v2.md` — KB macro library.
- [ ] Training content embedded in `app/AppClient.jsx`: `MODULES`, `BOOTCAMP_DAYS`, `SCENARIOS`, `COMPARE_ROWS`, `TEAM`, `ANNOUNCEMENTS`, and the `SIM_*` / `TICKET_SYSTEM` prompts. (Training is hidden by default.)

### 4. Integration data
- [ ] Connect Clerk, Anthropic, Postgres, and any of Shopify / Gorgias / Skio / Loop you use (see `.env.example`).
- [ ] The `app/api/insights/*` and `app/api/logs/*` routes return placeholder demo data — replace with real integration calls or DB queries when ready.

### 5. Ship it
- [ ] `npm run build` to confirm it compiles.
- [ ] Deploy (Railway or Vercel — see HANDOVER.md), set env vars, add the prod URL to Clerk redirect URLs.
- [ ] Invite the team via the Team tab.

## Sanity check

```bash
# Should return only intentional matches once you're done:
grep -rn "\[BRAND_NAME\]" app lib
```
