# Apps

Deployable Next.js entrypoints for product brands that share `@optimitron/db`.
**`packages/web` remains the main optimitron multi-site product.**

**Landing this work:** one tip branch/PR into `main` (not a stack of per-app PRs). Shared shell lives in `@optimitron/site-kit`; apps stay thin wrappers.

## Deployables

| App | Port | Domain | Owns |
|-----|------|--------|------|
| `@apps/warondisease` | 3010 | warondisease.org | Campaign: home, **full** dashboard (referrals/scores/badges), soldiers, orgs, institutes |
| `@apps/dfda` | 3011 | dfda.earth | Clinical encyclopedia |
| `@apps/wishocracy` | 3013 | wishocracy.org | Wishocracy **allocations only** (pairbars + edit) — not the WoD campaign dashboard |
| `@apps/trialabundancesurvey` | 3014 | trialabundancesurvey.org | **Survey host** + `/embed` + lite participant home + `embed.js` |
| `@apps/curedao` | 3015 | curedao.org | Landing + product links (**no donate**) |
| `@apps/acceleratedmedicine` | 3016 | acceleratedmedicine.org | Case + **donate** + embedded survey |

Architecture decisions (host vs campaign, email, embeds): **`SURVEY-AND-SATELLITES.md`**.

Satellite apps should stay thin: routes + brand `public/` + config. Shared UI/lib lives in `@optimitron/site-kit` / `neobrutalist-ui` / `impact-params` / `survey-embed`. Do not re-copy chart dumps, email templates, or campaign tests into satellites.

## Shared packages

| Package | Role |
|---------|------|
| `@optimitron/db` | Schema + client + `TREATY_REFERENDUM_SLUG` |
| `@optimitron/neobrutalist-ui` | Shared UI primitives (`cn`, shadcn-style) |
| `@optimitron/impact-params` | Treaty model params |
| `@optimitron/site-kit` | Shared shell: landing, auth/middleware factories, auth API cores, **WoD dashboard suite**, site lib |
| `@optimitron/survey-embed` | `<SurveyEmbed />` + `embed.js` for partners |
| `@optimitron/chat-ui` | Health chat |

### site-kit surfaces

| Shared | App-local |
|--------|-----------|
| `createAuthMiddleware` / `createLandingMiddleware` | Brand `middleware.ts` wrappers |
| NextAuth + signup/complete-signup handlers | Brand welcome copy + email injection (WoD) |
| Full campaign `components/dashboard/*` + `dashboard-actions` | **warondisease only** consumes |
| Auth helpers, layout, landing, site-config | Wishocracy RAPPA UI + alloc APIs stay in `apps/wishocracy` |

## Dev

```bash
pnpm install
pnpm db:up && pnpm db:deploy && pnpm db:generate

pnpm dev:warondisease            # :3010
pnpm dev:wishocracy              # :3013 — allocations product
pnpm dev:trialabundancesurvey    # :3014  — set NEXT_PUBLIC_SURVEY_ORIGIN=http://localhost:3014 for embeds
pnpm dev:acceleratedmedicine     # :3016
pnpm dev:curedao                 # :3015

pnpm smoke:warondisease-db
```

Partner snippet (after survey is deployed):

```html
<div id="trial-abundance-survey"></div>
<script
  src="https://trialabundancesurvey.org/embed.js"
  data-ref="YOUR_REF"
  async></script>
```

## CI

Job **`apps-brand-validate`** (on `apps/**` / `packages/db` changes):

1. migrate + `prisma generate`
2. **`pnpm typecheck:apps`** — all six `@apps/*`
3. **`pnpm smoke:warondisease-db`** — ReferendumVote path
4. **`pnpm test:apps:unit`** — vitest unit suites (not `tests/integration/`; not Playwright)

`packages/web` still has **web-static-validate**, **web-e2e-validate**, and deploy smoke. Brand production deploys are not CI-gated yet.

Local:

```bash
pnpm typecheck:apps
pnpm test:apps:unit
pnpm smoke:warondisease-db
```

Deploy production still **`packages/web` only**. See `DEPLOYMENT.md`.
