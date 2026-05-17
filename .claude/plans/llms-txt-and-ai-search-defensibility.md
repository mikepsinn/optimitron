# LLMs.txt and AI Search Defensibility

Slug: `llms-txt-and-ai-search-defensibility`
Branch: `feature/plaintiffs-variant-1-and-copy-hooks`
Date: 2026-05-16
Author: Codex
Status: APPROVED — Mike said "just do this now and add it to whatever pull request we're on" on 2026-05-16; folding into feature/plaintiffs-variant-1-and-copy-hooks branch

## Mike approved

Mike's verbatim approval (2026-05-16):
> "just do this now and add it to whatever pull request we're on. it's not. it's not a big deal. don't make a big whole new pull request for trivia. little stuff like this"

Scope confirmed: bundle into current branch alongside /treaty fix. No separate PR.

## Brief

Build agent-readable campaign infrastructure so AI search engines and browsing agents can answer the core War on Disease questions from canonical `warondisease.org` sources instead of guessing from rendered pages, stale snippets, or social copies.

The first target questions are:

- "What is the 1% Treaty?"
- "What is Humanity v Government?"
- "How do I register a plaintiff?"
- "What is the health and wealth math?"

This is a plan only. Do not implement until autoplan critique is complete and Mike explicitly approves the final plan.

## Research log

Queries run:

- `llms.txt specification llms-full.txt 2026 standard official`
- `Next.js App Router JSON-LD metadata route handlers sitemap docs`
- `schema.org LegalCase FAQPage Petition type JSON-LD`
- `OpenAI GPTBot user agent Anthropic ClaudeBot PerplexityBot user agent docs`
- `Google AI crawler user agents Gemini robots.txt Google-Extended GoogleOther official documentation`

Current docs checked:

- `https://llmstxt.org/` - root `/llms.txt` proposal, Markdown format, curated link lists, optional `.md` mirrors, and note that `llms.txt` complements sitemap/robots rather than replacing them. Published 2024-09-03.
- `https://nextjs.org/docs/app/guides/json-ld` - Next recommends native `<script type="application/ld+json">` in App Router layouts/pages and sanitizing `<` in JSON-LD strings. Last updated 2026-03-31.
- `https://nextjs.org/docs/app/api-reference/file-conventions/route` - route handlers are the right mechanism for non-UI text/JSON responses; GET handlers are dynamic by default as of v15. Last updated 2026-03-31.
- `https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap` - `app/sitemap.ts` is the right programmable sitemap hook; special route handler, cached unless it uses request APIs or dynamic config. Last updated 2026-03-31.
- `https://schema.org/FAQPage`, `https://schema.org/VoteAction`, `https://schema.org/Claim`, `https://schema.org/Legislation` - current Schema.org has strong FAQ, vote/action, claim, and legislation/legal-document shapes. I did not find native `Petition`, `CourtCase`, or `LegalCase` types in the current public hierarchy, so the plan should not invent those `@type` values.
- `https://developers.openai.com/api/docs/bots` - OpenAI separates `OAI-SearchBot` for ChatGPT search visibility, `GPTBot` for training, and `ChatGPT-User` for user-triggered fetches. Search visibility should allow `OAI-SearchBot`; training policy can be handled separately.
- `https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler` - Anthropic separates `ClaudeBot`, `Claude-User`, and `Claude-SearchBot`; disabling search/user agents reduces visibility in those flows.
- `https://docs.perplexity.ai/docs/resources/perplexity-crawlers` - Perplexity documents `PerplexityBot` for search and `Perplexity-User` for user-triggered retrieval, with current IP JSON endpoints.
- `https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers` - Google documents `GoogleOther`, `Google-CloudVertexBot`, and `Google-Extended`; `Google-Extended` is a robots product token and does not have its own HTTP user-agent string. Last updated 2026-04-23.

Repo facts checked:

- `packages/web/src/app/sitemap.ts` is already host-aware and dynamic via `headers()` plus `getSitemapForSite(site)` and `getPublicDetailSitemapEntries(site)`.
- `packages/web/src/lib/site-sitemap.ts` already includes campaign routes such as `/treaty`, `/court`, `/humanity-v-government`, `/vote`, `/questions`, `/signatories`, and `/plaintiffs`.
- `packages/web/src/lib/site-structured-data.ts` currently emits only site-level `Organization` and `WebSite` JSON-LD through `SiteStructuredData` in `packages/web/src/app/layout.tsx`.
- `packages/web/src/lib/site-assets.ts` currently disallows `/api` in robots, so `/api/agent/*` will be invisible to compliant crawlers unless this is explicitly allowed.
- No `/llms.txt`, `/llms-full.txt`, or public markdown mirror routes exist today.
- Existing data sources to reuse: `getReferendumPageContent`, `getReferendumSiteHomeData`, `getHumanityVGovernmentPlaintiffCount`, `getHumanityVGovernmentVerdictStats`, and `buildTreatyParameterExport`.

## Current state (ASCII)

```text
warondisease.org request
  |
  +-- app/layout.tsx
  |     |
  |     +-- SiteStructuredData
  |           |
  |           +-- buildSiteStructuredData(site)
  |                 |
  |                 +-- Organization
  |                 +-- WebSite
  |
  +-- app/sitemap.ts
  |     |
  |     +-- getSitemapForSite(site)
  |     |     +-- public campaign routes
  |     |
  |     +-- getPublicDetailSitemapEntries(site)
  |           +-- public org/person/task detail URLs
  |
  +-- app/robots.ts
        |
        +-- getSiteRobots(site)
              |
              +-- Allow: /
              +-- Disallow: /api
              +-- Disallow: /admin, /auth, /dashboard, /profile, /settings

Missing:
  - /llms.txt
  - /llms-full.txt
  - Markdown mirrors like /treaty.md or /humanity-v-government.md
  - Route-level JSON-LD for treaty, court/case, and FAQ content
  - Public /api/agent/* contracts
  - AI crawler/referral log classification
```

## Proposed state (ASCII)

```text
warondisease.org
  |
  +-- /llms.txt
  |     +-- short canonical Markdown map for agents
  |
  +-- /llms-full.txt
  |     +-- expanded campaign context
  |     +-- links to markdown mirrors
  |     +-- links to /api/agent/* JSON contracts
  |
  +-- Markdown mirrors
  |     +-- /treaty.md
  |     +-- /court.md
  |     +-- /humanity-v-government.md
  |     +-- /plaintiffs.md
  |     +-- /questions.md or /faq.md
  |
  +-- JSON-LD on major pages
  |     +-- /treaty and /vote: WebPage + Legislation + VoteAction
  |     +-- /court and /humanity-v-government: WebPage + Claim graph
  |     +-- /questions or /faq: FAQPage only if matching Q/A is visible
  |
  +-- /api/agent/*
  |     +-- /api/agent/manifest
  |     +-- /api/agent/campaign-state
  |     +-- /api/agent/signatories
  |     +-- /api/agent/plaintiffs
  |     +-- /api/agent/parameters
  |
  +-- sitemap.xml
  |     +-- normal human pages
  |     +-- llms files
  |     +-- markdown mirrors
  |     +-- agent JSON endpoints
  |
  +-- server logs
        +-- aiCrawlerFamily=openai|anthropic|perplexity|google|other
        +-- aiCrawlerPurpose=search|training|user_fetch|unknown
        +-- pathname, host, referrer, userAgent token
```

Mechanism decisions:

- Use App Router route handlers for `/llms.txt`, `/llms-full.txt`, markdown mirrors, and `/api/agent/*`. These are non-UI text/JSON surfaces and need custom content types.
- Keep builders in pure server-side library files under `packages/web/src/lib/agent-readable/` so route handlers, sitemap tests, and structured-data tests use the same canonical definitions.
- Use page/layout native JSON-LD scripts, not Next metadata fields, because Next's current JSON-LD guide recommends native script tags for structured data.
- Use host-aware dynamic route handlers for `/llms.txt` and `/llms-full.txt` so `warondisease.org` is canonical and other hosts can either point back to it or emit host-appropriate minimal context.
- Use cached data fetchers or `unstable_cache` wrappers for DB-backed agent APIs. Do not add Prisma schema fields for measurement in this PR.
- Use server-log classification for AI measurement first. Do not persist IP addresses, emails, cookies, or raw query strings.

## Step list

- [ ] Create `packages/web/src/lib/agent-readable/campaign-canon.ts`.
  - Define canonical campaign identity, authoritative URLs, target questions, core page list, and the rule that `warondisease.org` is the canonical public answer source during campaign mode.
  - Reuse existing constants from `routes.ts`, `site.ts`, `@optimitron/data/campaign`, referendum content, and generated parameters. Do not hardcode major numbers that already exist as parameters.

- [ ] Create `packages/web/src/lib/agent-readable/llms-text.ts`.
  - Build `buildLlmsTxt(site)` and `buildLlmsFullTxt(site)` from the canonical registry.
  - `/llms.txt` should be short: H1, summary blockquote, key links, API endpoints, and optional links.
  - `/llms-full.txt` should include expanded context for the four target question families, with markdown links to source pages and JSON endpoints.

- [ ] Add route handlers for `/llms.txt` and `/llms-full.txt`.
  - Create `packages/web/src/app/llms.txt/route.ts`.
  - Create `packages/web/src/app/llms-full.txt/route.ts`.
  - Return `text/plain; charset=utf-8`.
  - Set conservative cache headers such as `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
  - Use `headers()` and `getSiteFromHeaders()` for host-aware canonical URLs.

- [ ] Create the markdown mirror builders.
  - Create `packages/web/src/lib/agent-readable/markdown-mirrors.ts`.
  - Implement mirrors for:
    - `/treaty.md`: what the 1% Treaty is, how to sign/vote, canonical HTML route, source treaty body.
    - `/court.md`: Court of Humanity question and body.
    - `/humanity-v-government.md`: case caption, claims, verdict vote, settlement relation to the 1% Treaty.
    - `/plaintiffs.md`: how to register a plaintiff, what data is public, what the plaintiff count means.
    - `/questions.md` or `/faq.md`: FAQ answers used for `FAQPage` JSON-LD.
  - Prefer existing treaty/court text from `getReferendumPageContent` and `@optimitron/data/referendums` over newly invented prose.

- [ ] Add route handlers for markdown mirrors.
  - Create `packages/web/src/app/treaty.md/route.ts`.
  - Create `packages/web/src/app/court.md/route.ts`.
  - Create `packages/web/src/app/humanity-v-government.md/route.ts`.
  - Create `packages/web/src/app/plaintiffs.md/route.ts`.
  - Create either `packages/web/src/app/questions.md/route.ts` or `packages/web/src/app/faq.md/route.ts` after autoplan decides the visible FAQ location.
  - Return `text/markdown; charset=utf-8` and no private data.

- [ ] Create public agent API response builders.
  - Create `packages/web/src/lib/agent-readable/agent-api.server.ts`.
  - Reuse existing data fetchers where possible:
    - Vote counts from `getReferendumSiteHomeData` and `getVerifiedVoteSummary`-style helpers.
    - Signatories from the same ranked public signatory data behind `/signatories`.
    - Plaintiff counts from `getHumanityVGovernmentPlaintiffCount`.
    - Parameters from `buildTreatyParameterExport` and `getTreatyParameterSetHash`.
  - Include `sourceUrls`, `generatedAt`, `cacheSeconds`, and `contentHash`/`parameterSetHash` where available.
  - Exclude emails, auth state, cookies, private votes, admin fields, and unpublished records.

- [ ] Add `/api/agent/*` route handlers.
  - Create `packages/web/src/app/api/agent/manifest/route.ts`.
  - Create `packages/web/src/app/api/agent/campaign-state/route.ts`.
  - Create `packages/web/src/app/api/agent/signatories/route.ts`.
  - Create `packages/web/src/app/api/agent/plaintiffs/route.ts`.
  - Create `packages/web/src/app/api/agent/parameters/route.ts`.
  - Use `Response.json(...)` or `NextResponse.json(...)` with public cache headers.
  - Keep these read-only and unauthenticated.

- [ ] Update robots rules for agent endpoints.
  - Modify `packages/web/src/lib/site-assets.ts`.
  - Keep `/api` blocked generally.
  - Add an explicit allow for `/api/agent/`.
  - Add separate allow rules for search/retrieval bots where useful: `OAI-SearchBot`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Perplexity-User`, and normal Googlebot/GoogleOther behavior.
  - Do not accidentally block `/vote`, `/treaty`, `.md` mirrors, or `/llms.txt`.

- [ ] Add route-level JSON-LD helpers.
  - Create `packages/web/src/lib/campaign-structured-data.ts`.
  - Create a small `JsonLdScript` component that stringifies and replaces `<` with `\\u003c`.
  - Keep `buildSiteStructuredData` for global Organization/WebSite JSON-LD.
  - Add route graphs for:
    - Petition/treaty: `WebPage` + `Legislation` + `VoteAction`.
    - Court/case: `WebPage` + `Claim` nodes for the indictment/verdict/settlement; do not use nonexistent `CourtCase` or `LegalCase` types.
    - FAQ: `FAQPage` + `Question`/`Answer` nodes, only if the same Q/A text is visible on the page or in the chosen public FAQ route.

- [ ] Attach JSON-LD on major pages.
  - Modify `packages/web/src/app/treaty/page.tsx`.
  - Modify `packages/web/src/app/vote/page.tsx` only if the vote action needs its own `VoteAction` target.
  - Modify `packages/web/src/app/court/page.tsx`.
  - Modify `packages/web/src/app/humanity-v-government/page.tsx`.
  - Modify `packages/web/src/app/questions/page.tsx` or create a new visible FAQ page if autoplan decides `/questions` is not actually an FAQ.

- [ ] Extend sitemap discovery.
  - Modify `packages/web/src/lib/site-sitemap.ts` or add `packages/web/src/lib/agent-readable/agent-sitemap.ts`.
  - Include `/llms.txt`, `/llms-full.txt`, markdown mirrors, and public `/api/agent/*` endpoints for the War on Disease site.
  - Keep non-campaign site variants from inheriting War on Disease-only endpoints unless they explicitly point back to `https://warondisease.org`.

- [ ] Add AI crawler detection.
  - Create `packages/web/src/lib/agent-readable/ai-crawler-detection.ts`.
  - Classify these tokens:
    - OpenAI: `OAI-SearchBot`, `GPTBot`, `ChatGPT-User`, fallback substring `OpenAI`.
    - Anthropic: `ClaudeBot`, `Claude-User`, `Claude-SearchBot`, fallback substring `Anthropic`.
    - Perplexity: `PerplexityBot`, `Perplexity-User`.
    - Google/Gemini: `GoogleOther`, `Google-CloudVertexBot`, `Googlebot`, and robots-only note for `Google-Extended`.
  - Return provider, purpose, bot token, and `isKnownAiCrawler`.

- [ ] Add server-log measurement.
  - Modify `packages/web/src/middleware.ts`.
  - Log only for public GET/HEAD requests and `/api/agent/*`.
  - Include host, pathname, provider, purpose, token, referrer origin, and a coarse timestamp.
  - Do not log cookies, raw full URLs with arbitrary query params, IP addresses, email addresses, or authorization headers.
  - Keep log volume controlled: either log only known AI crawlers or gate verbose unknown-agent logs behind an env var.

- [ ] Add focused tests.
  - Add `packages/web/src/lib/__tests__/agent-readable.test.ts` for `/llms.txt`, `/llms-full.txt`, mirror URLs, and no private/admin links.
  - Add `packages/web/src/lib/__tests__/campaign-structured-data.test.ts` for JSON-LD graph shape and supported Schema.org types.
  - Update `packages/web/src/lib/__tests__/site-sitemap.test.ts` to assert War on Disease sitemap includes llms/mirror/API discovery URLs.
  - Update `packages/web/src/lib/__tests__/site-assets.test.ts` to assert robots allows `/api/agent/` while keeping private `/api`, `/admin`, `/auth`, `/dashboard`, `/profile`, and `/settings` blocked.
  - Add `packages/web/src/lib/__tests__/ai-crawler-detection.test.ts` for known bot tokens and purpose classification.

- [ ] Add validation commands to the implementation handoff.
  - `pnpm --filter @optimitron/web test -- src/lib/__tests__/agent-readable.test.ts src/lib/__tests__/campaign-structured-data.test.ts src/lib/__tests__/site-sitemap.test.ts src/lib/__tests__/site-assets.test.ts src/lib/__tests__/ai-crawler-detection.test.ts`
  - `pnpm --filter @optimitron/web typecheck:fast`
  - With a local server on port 3001, curl:
    - `http://127.0.0.1:3001/llms.txt`
    - `http://127.0.0.1:3001/llms-full.txt`
    - `http://127.0.0.1:3001/treaty.md`
    - `http://127.0.0.1:3001/api/agent/campaign-state`
    - `http://127.0.0.1:3001/api/agent/parameters`
  - Inspect rendered page source for JSON-LD script tags on affected pages.

## Risks

- **Schema.org type mismatch:** `Petition`, `CourtCase`, and `LegalCase` do not appear to be current Schema.org types. Use supported types and explain the mapping in comments/tests. Do not ship invalid `@type` values just because the human concept is "petition" or "court case."
- **FAQPage abuse:** `FAQPage` should match visible Q/A content. If `/questions` remains just an interactive vote flow, adding invisible FAQ JSON-LD is risky. Either add visible FAQ content with copy approval or create a real FAQ route.
- **Robots conflict:** Current robots disallows `/api`. `/api/agent/*` needs an explicit allow or compliant crawlers will skip the exact endpoints built for them.
- **Private data leak:** Agent APIs must only expose public aggregate or already-public signatory data. No emails, auth status, private votes, unpublished organizations, raw DB IDs unless they already appear in public URLs.
- **Canonical drift:** llms files, markdown mirrors, JSON endpoints, and visible pages can diverge. Centralize definitions in `campaign-canon.ts` and use tests for shared URLs, titles, and hashes.
- **Hardcoded campaign numbers:** Use generated parameters and formatter helpers where available. If a needed number is not in parameters, name that as a follow-up instead of typing a naked number into public copy.
- **Measurement noise:** User-agent strings can be spoofed. Treat server logs as directional discovery metrics, not proof that a request came from the named company unless IP verification is added later.
- **Log privacy:** Do not turn measurement into surveillance. No IP persistence, no cookie logging, no full query-string dumps.
- **Crawler product split:** Search bots, training bots, and user-triggered fetchers have different effects. Robots rules and logging labels must not blur them.
- **Site variant bleed:** `optimitron.com`, `dfda.earth`, and local variant overrides should not accidentally publish War on Disease-only facts as their own canonical context.
- **Visible copy approval:** Any new public FAQ or canonical campaign prose must go through Mike review before commit under the repo copy rules.

## Files to touch

Plan file only now:

- `.claude/plans/llms-txt-and-ai-search-defensibility.md`

Expected implementation files later:

- `packages/web/src/lib/agent-readable/campaign-canon.ts` (new)
- `packages/web/src/lib/agent-readable/llms-text.ts` (new)
- `packages/web/src/lib/agent-readable/markdown-mirrors.ts` (new)
- `packages/web/src/lib/agent-readable/agent-api.server.ts` (new)
- `packages/web/src/lib/agent-readable/agent-sitemap.ts` (new or fold into `site-sitemap.ts`)
- `packages/web/src/lib/agent-readable/ai-crawler-detection.ts` (new)
- `packages/web/src/lib/campaign-structured-data.ts` (new)
- `packages/web/src/components/site/JsonLdScript.tsx` (new)
- `packages/web/src/app/llms.txt/route.ts` (new)
- `packages/web/src/app/llms-full.txt/route.ts` (new)
- `packages/web/src/app/treaty.md/route.ts` (new)
- `packages/web/src/app/court.md/route.ts` (new)
- `packages/web/src/app/humanity-v-government.md/route.ts` (new)
- `packages/web/src/app/plaintiffs.md/route.ts` (new)
- `packages/web/src/app/questions.md/route.ts` or `packages/web/src/app/faq.md/route.ts` (new, decision pending)
- `packages/web/src/app/api/agent/manifest/route.ts` (new)
- `packages/web/src/app/api/agent/campaign-state/route.ts` (new)
- `packages/web/src/app/api/agent/signatories/route.ts` (new)
- `packages/web/src/app/api/agent/plaintiffs/route.ts` (new)
- `packages/web/src/app/api/agent/parameters/route.ts` (new)
- `packages/web/src/app/treaty/page.tsx`
- `packages/web/src/app/vote/page.tsx`
- `packages/web/src/app/court/page.tsx`
- `packages/web/src/app/humanity-v-government/page.tsx`
- `packages/web/src/app/questions/page.tsx` if used for visible FAQ content
- `packages/web/src/lib/site-assets.ts`
- `packages/web/src/lib/site-sitemap.ts`
- `packages/web/src/middleware.ts`
- `packages/web/src/lib/__tests__/agent-readable.test.ts` (new)
- `packages/web/src/lib/__tests__/campaign-structured-data.test.ts` (new)
- `packages/web/src/lib/__tests__/ai-crawler-detection.test.ts` (new)
- `packages/web/src/lib/__tests__/site-sitemap.test.ts`
- `packages/web/src/lib/__tests__/site-assets.test.ts`

No planned Prisma schema changes.

## ALERTS

(empty)

## Agent log

(empty)
