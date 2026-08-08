# Apps

Deployable Next.js entrypoints for product brands that share `@optimitron/db`.
**`packages/web` remains the main optimitron multi-site product.**

## Deployables

| App | Port | Domain | Owns |
|-----|------|--------|------|
| `@apps/warondisease` | 3010 | warondisease.org | Campaign: home, full dashboard (scores/badges), soldiers, orgs, institutes |
| `@apps/dfda` | 3011 | dfda.earth | Clinical encyclopedia |
| `@apps/wishocracy` | 3013 | wishocracy.org | Wishocracy allocation |
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
| `@optimitron/site-kit` | Shared shell: landing, auth helpers, layout, site lib |
| `@optimitron/survey-embed` | `<SurveyEmbed />` + `embed.js` for partners |
| `@optimitron/chat-ui` | Health chat |

## Dev

```bash
pnpm install
pnpm db:up && pnpm db:deploy && pnpm db:generate

pnpm dev:warondisease            # :3010
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

Job **`apps-warondisease-validate`**: migrate → typecheck warondisease → DB smoke.  
Deploy production still **`packages/web` only**. See `DEPLOYMENT.md`.
