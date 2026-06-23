# SaaS on Sale (saasonsale.com) AI Agent Principles

This file defines product and implementation principles for future AI agents working in this repo. Follow the global PORTFOLIO_REVENUE_BUSINESS_MANIFESTO.md and the same framework as doting.co / watershortcut.com.

## Product intent
saasonsale.com helps visitors and customers discover, evaluate, and act on the best seasonal SaaS deals with AI-powered analysis. Core value: turn "I spend too much on tools" into "here are the exact switches and sales that will save me $X this year" - delightful, specific, actionable, automated.

Deliver delightful real value:
- Free: deal discovery, Stack Analyzer (AI recs + savings forecast), Deal IQ scoring, seasonal calendar.
- Converted (credits/premium via shared billing): unlimited analyses, saved stacks + alerts, negotiation kits, ad-free, exportable reports, deeper personalization.

Fully automated AI: shared PortfolioAIService powers stack analysis, deal enrichment, brief generation, recommendations. Content and recs improve via learnings from usage/feedback.

Monetization: high-intent affiliates (SaaS referrals), AdSense on free surfaces (controlled via /api/ad-settings), credits/subs for power users who save real money.

## Marketing ready state (June 2026)
Delight boosted from GATED (~47) to target >=65-70 via:
- Expanded content library (added 6 new guides: voice-notes-that-connect, client-gratitude-notes, repair-after-small-drifts, daily-positivity-buffer, ai-mood-coach-in-real-life + kb index/sitemap/public sync).
- Embedded high-value AI widget: Mood AI Coach (5 one-tap moods → instant nurture response via shared /api/ai/chat flywheel → one-click "Create card from this" that seeds the generator).
- Phone-first enhancements (5-col mobile mood grid, tap targets, responsive CSS, no layout shift per rules).
- Strategic cross-cluster links (hub mentions, kb ↔ studio flows, vibe→curator).
- Publisher: refreshed sitemap.xml + dynamic sitemapEntries with new slugs + existing GA4/AdSense.
- Verified: gstack /browse interactive (vibes, coach, curator, chat, kb pages), build/lint/test pass, no new errors.
Note lingering card-store 4xx/5xx from prior D1 state (migrations attempted); full audit recommended. See receipt: /Users/nirlevy/.openclaw/workspace/reports/portfolio_factory/receipts/doting-marketing-ready-20260622.md . Run full /qa + /review + D1 perms + live credit flow tests next.

## Non-negotiable UX rules
1. **Navigation must be literal and predictable**
   - Header logo always routes to `/`.
   - `Moments` routes to `/moments` (never hash-only deep-links as primary behavior).
   - Hero "Create a Card" routes to a create-focused experience (`/create-card`).
   - Profile/avatar routes to `/profile`.

2. **Single-action progression beats dense screens**
   - Prioritize one obvious next action per surface (especially Moments and next-step flows).
   - When introducing a new flow, include a clear return path and avoid hidden state jumps.

3. **Credits must be visible, truthful, and eventful**
   - Default local credits start at `10`.
   - Free card allowance remains separately tracked (`FREE_CARD_LIMIT = 3`).
   - Any credit change should animate briefly (pulse + floating delta) and then settle.
   - If an action consumes a credit, gate before action execution and explain why.

4. **Personalization must persist**
   - Persist lightweight profile selections (emoji, onboarding context) in localStorage.
   - Reuse this context in AI prompts to reduce repetitive or generic responses.

5. **Language quality standards**
   - Generated copy must be grammatical and emotionally natural.
   - Avoid awkward constructions like "Happy love".
   - Prefer direct recipient-first warmth and concrete specificity.

6. **Card readability over decoration**
   - No text clipping/cropping in previews.
   - Overlay/content must remain readable across viewport sizes.
   - Visual motifs should relate to occasion/theme/style notes, not generic filler art.

7. **Animation standards**
   - Animations should be subtle, short, smooth, and non-disruptive.
   - Never animate in ways that cause layout shift for primary actions.

8. **Premium clarity**
   - Locked UI should clearly state cost (e.g. `1 Credit to Unlock`).
   - Surface an explicit list of credit costs in settings/premium surfaces.

## Engineering guardrails
1. **Do not claim tests you did not run.**
2. Required verification for UX changes:
   - `npm run build`
   - `npm run lint`
   - `npm test`
3. Keep route/state behavior deterministic (pathname + tab/view state should stay in sync).
4. Preserve backwards compatibility for existing stored localStorage keys where possible.

## Done criteria for future agent PRs
A change is not done unless:
- New or modified flow has a working entry point and return path.
- Credit usage behavior is explicit and consistent with UI copy.
- Mobile + desktop layouts are both validated for clipping/overlap.
- Build/lint/tests pass and are reported accurately.

Source control: GitHub nnlevy, main branch, hygiene enforced via portfolio flywheel.
