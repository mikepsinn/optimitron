# Apps

Deployable Next.js entrypoints for product brands that share `@optimitron/db`.
**`apps/warondisease` is the canonical War on Disease campaign app.**
`apps/optimitron` owns Optimitron and remains a temporary multi-host fallback until
each standalone app passes preview checks and its domain moves.

**Landing this work:** one tip branch/PR into `main` (not a stack of per-app PRs). Shared shell lives in `@optimitron/site-kit`; apps stay thin wrappers.

## Deployables

| App | Port | Domain | Owns |
|-----|------|--------|------|
| `@optimitron/web` | 3001 | optimitron.com | Optimitron UI, REST, OAuth, MCP, authorization, and server workflows |
| `@apps/warondisease` | 3010 | warondisease.org | Canonical campaign home and **full neobrutalist dashboard** (referrals/scores/badges), orgs, institutes |
| `@apps/dfda` | 3011 | dfda.earth | Clinical encyclopedia |
| `@apps/wishocracy` | 3013 | wishocracy.org | Wishocracy **allocations only** (pairbars + edit) — not the WoD campaign dashboard |
| `@apps/trialabundancesurvey` | 3014 | trialabundancesurvey.org | **Survey host** + `/embed` + lite participant home + `embed.js` |
| `@apps/curedao` | 3015 | curedao.org | Landing + product links (**no donate**) |
| `@apps/acceleratedmedicine` | 3016 | acceleratedmedicine.org | Case + **donate** + embedded survey |
| `@apps/courtofhumanity` | 3017 | courtofhumanity.org | Court of Humanity — **Humanity v. Government** case, plaintiffs, verdicts |

Architecture decisions (host vs campaign, email, embeds): **`SURVEY-AND-SATELLITES.md`**.

Keep app entrypoints focused on routes, brand assets, and configuration. Shared UI and libraries live in `@optimitron/site-kit`, `neobrutalist-ui`, `impact-params`, and `survey-embed`. Do not copy chart dumps, email templates, or campaign tests between apps.

War on Disease is the campaign exception: keep its rich home and dashboard fun,
colorful, and neobrutalist. Do not replace that dashboard with the treaty-paper
dashboard from `apps/optimitron`.

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

pnpm dev                         # :3001 — Optimitron
pnpm dev:warondisease            # :3010
pnpm dev:wishocracy              # :3013 — allocations product
pnpm dev:trialabundancesurvey    # :3014  — set NEXT_PUBLIC_SURVEY_ORIGIN=http://localhost:3014 for embeds
pnpm dev:acceleratedmedicine     # :3016
pnpm dev:courtofhumanity         # :3017
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

Job **`site-apps-static-validate`** (on peer app or `packages/db` changes):

1. verify public navigation and authenticated screenshot coverage
2. migrate + `prisma generate`
3. **`pnpm typecheck:apps`** — all seven `@apps/*`
4. **`pnpm smoke:warondisease-db`** — ReferendumVote path
5. **`pnpm test:apps:unit`** — vitest unit suites (not `tests/integration/`; not Playwright)

Job **`site-apps-build`**:

1. build every app and capture public and authenticated desktop/mobile states

The authenticated route inventory fails when a dashboard, admin, profile, or
other auth-gated page lacks screenshots or a documented no-UI exemption.
`apps/optimitron` has deeper app-specific checks because it owns more routes and
server workflows. Every app has its own Vercel preview and production project.

Local:

```bash
pnpm typecheck:apps
pnpm test:apps:unit
pnpm smoke:warondisease-db
```

Vercel deploys each affected app independently. See `DEPLOYMENT.md`.
