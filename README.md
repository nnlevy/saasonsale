# SaaS on Sale (saasonsale.com)

AI-powered platform for discovering the best seasonal SaaS deals, analyzing your tool stack for savings opportunities, and delivering delightful, actionable recommendations. Part of Nir's automated domains revenue platform.

Built with the same framework as doting.co and watershortcut.com: React + Vite + Hono on Cloudflare Workers, shared portfolio D1/KV/AI/Billing services.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/vite-react-template)

This template provides a minimal setup for building a React application with TypeScript and Vite, designed to run on Cloudflare Workers. It features hot module replacement, ESLint integration, and the flexibility of Workers deployments.

![React + TypeScript + Vite + Cloudflare Workers](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/fc7b4b62-442b-4769-641b-ad4422d74300/public)

<!-- dash-content-start -->

🚀 Supercharge your web development with this powerful stack:

- [**React**](https://react.dev/) - A modern UI library for building interactive interfaces
- [**Vite**](https://vite.dev/) - Lightning-fast build tooling and development server
- [**Hono**](https://hono.dev/) - Ultralight, modern backend framework
- [**Cloudflare Workers**](https://developers.cloudflare.com/workers/) - Edge computing platform for global deployment

### ✨ Key Features

- 🔥 Hot Module Replacement (HMR) for rapid development
- 📦 TypeScript support out of the box
- 🛠️ ESLint configuration included
- ⚡ Zero-config deployment to Cloudflare's global network
- 🎯 API routes with Hono's elegant routing
- 🔄 Full-stack development setup
- 🔎 Built-in Observability to monitor your Worker

Get started in minutes with local development or deploy directly via the Cloudflare dashboard. Perfect for building modern, performant web applications at the edge.

<!-- dash-content-end -->

## Getting Started

To start a new project with this template, run:

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/vite-react-template
```

A live deployment of this template is available at:
[https://react-vite-template.templates.workers.dev](https://react-vite-template.templates.workers.dev)

## Development

Install dependencies:

```bash
npm install
```

Start the development server with:

```bash
npm run dev
```

Your application will be available at [http://localhost:5173](http://localhost:5173).

## Production

Build your project for production:

```bash
npm run build
```

Preview your build locally:

```bash
npm run preview
```

Deploy your project to Cloudflare Workers:

```bash
npm run build && npm run deploy
```

This Worker should prefer the shared `PORTFOLIO_AI_SERVICE` binding to `riskfreettrial#PortfolioAIService` for AI calls. Keep `OPENAI_API_KEY` only as a temporary legacy fallback while migrating or recovering production.

Monitor your workers:

```bash
npx wrangler tail
```

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/)
- [Hono Documentation](https://hono.dev/)

## AI agent workflow guidance

Agent-specific product and UX guardrails live in [`AGENTS.md`](./AGENTS.md).  
Use it as the source of truth for:
- navigation behavior expectations,
- credits/premium interaction rules,
- personalization and copy quality constraints,
- required verification commands before completing a change.


## Greeting card tiny URLs

The greeting card generator stores full AI-generated card configurations in your shared D1 database (`DOMAINS_D1_DB`) and uses the shared KV namespace (`USER_SESSIONS_KV_ACROSS_DOMAINS`) as a read-through cache.

1. Ensure your `wrangler.json` bindings point at your existing shared resources:
   - D1: `DOMAINS_D1_DB` → database `users_across_domains` (id `b41e909b-ad01-4fd5-84ca-d8d014706942`)
   - KV: `USER_SESSIONS_KV_ACROSS_DOMAINS` → namespace `User_Sessions_Across_Domains` (id `ce39949d2f244c78b3e19967288f44fb`)

2. Apply the D1 migration to create the table used by this app:

```bash
npx wrangler d1 migrations apply DOMAINS_D1_DB --remote
```

3. Run the app as usual (`npm run dev`). The frontend will call `/api/cards` to save card configs and `/api/cards/:id` to load shared cards.

## AdSense backend controls and ad-free premium behavior

This project includes a backend-managed AdSense settings system so ad placement can be toggled without redeploying frontend code.

### 1) Apply the ad settings migration

```bash
npx wrangler d1 migrations apply DOMAINS_D1_DB --remote
```

This creates `ad_settings` and seeds defaults that keep ads hidden on `home` and `premium`.

### 2) Configure ad settings

Use the app's **Ad controls** section (near the bottom of the page) to set:
- `AdSense client ID`
- global ad enable/disable
- excluded placements (comma-separated)
- per-placement ad unit slot IDs (onboarding, streak, cards, knowledge, footer)

Ads only render for placements that have a slot ID configured.

Settings are persisted in D1 and cached in KV via `/api/ad-settings`.

> `PUT /api/ad-settings` is admin-protected. Set the Worker secret `AD_SETTINGS_ADMIN_TOKEN` and send it as `Authorization: Bearer <token>` when saving settings.

### 3) Paid membership always hides ads

When a user is in premium mode, ad slots are not rendered on any screen.

### 4) Add ads.txt

The required AdSense entry is included at `public/ads.txt` and is served from the site root:

```txt
google.com, pub-1860356577073395, DIRECT, f08c47fec0942fa0
```

## First-party funnel analytics

This app now records a lightweight first-party funnel to the shared D1 database for:

- `page_view`
- `cta_click`
- `form_start`
- `form_complete`
- `credit_pack_view`
- `checkout_start`
- `payment_result`

The worker still accepts legacy `form_submit` events so older clients can report until all callers are updated.

Storage:

- Table: `doting_analytics_events`
- Endpoint: `POST /api/analytics/events`

Tracked flows:

- landing + shared-card page loads
- hero and nav `Get started` CTA clicks
- onboarding questionnaire start + completion
- hero chat start + submit
- greeting card generator start + submit
- credit upsell views, checkout launches, and billing return results

Apply the migration in production:

```bash
npx wrangler d1 migrations apply DOMAINS_D1_DB --remote
```

## Quick live preview (while full bundle deploy is sorted)
1. `cat minimal-live-worker.js | pbcopy` (or copy the file)
2. Go to Cloudflare Workers → Create Worker → paste the JS → Deploy as "saasonsale"
3. Add custom domain saasonsale.com (or www) to the Worker.
4. Visit https://saasonsale.com — you'll get a clean, on-brand landing with working demo analyzer + deals that matches the vision and uses the same value prop / trust language as your best domains.

Once you have a token with full permissions or use dashboard "Upload" for the real bundled output from `npm run build`, replace with the full source (which has the React UI, real /api/ai/chat via shared service, D1 analytics, ad-settings admin, etc.).

## D1 (one time)
npx wrangler d1 migrations apply DOMAINS_D1_DB --remote
(Applies ad_settings + saason_analytics_events tables)

## After live
- Run portfolio health / gstack browse /qa on it.
- Add to outreach approval flow (drafts already in outreach_outputs/).
- Wire into daily content or promotion crons if desired.

This is now a first-class member of the 75-domain revenue platform.
