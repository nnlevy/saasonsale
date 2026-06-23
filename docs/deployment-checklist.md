# saasonsale.com Deployment

1. D1: `npx wrangler d1 migrations apply DOMAINS_D1_DB --remote` (applies 0005_saason_analytics_and_ad.sql and prior ad_settings)
2. KV already shared.
3. AI + Billing service bindings in wrangler.json point to riskfreetrial (already).
4. Deploy: wrangler deploy (use full scoped token if current limited).
5. After deploy, add custom domain saasonsale.com to the Worker in CF dashboard (or routes).
6. Point DNS if needed (currently CF full zone).
7. Seed initial ad settings via /api/ad-settings PUT with admin token (set AD_SETTINGS_ADMIN_TOKEN secret).
8. Verify: /api/health , analyzer flow, ad settings.
9. Outreach: use contacts/ + portfolio promotion cycle for revenue asks (affiliate partners, SaaS vendors for listings).
10. Add daily/periodic content cron later for "this week's SaaS sales brief".

Framework applied: shared services, ad controls, analytics to D1, premium/credits, delightful AI tool (stack analyzer + deal IQ), SEO basics, min human input for ops.