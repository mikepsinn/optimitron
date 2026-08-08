# Deploying brand apps (warondisease / dfda / wishocracy)

## Situation

| Surface | Code | Vercel today |
|---------|------|--------------|
| Optimitron product | `packages/web` | **Existing** project — `rootDirectory: packages/web`, domains optimitron.com (+ warondisease.org host multi-site in web today) |
| DIH-style UI apps | `apps/warondisease` etc. | **Not wired** — workspace members only; no deploy step yet |

Production CI (`deploy-production` in `.github/workflows/ci.yml`) deploys **only** the existing Vercel project with `VERCEL_PROJECT_ID` and expects `rootDirectory === packages/web`. **Do not** repoint that project at `apps/*` — it will break optimitron.com.

## Smoke / CI strategy

| Layer | What | Where |
|-------|------|--------|
| Static gate | Typecheck `@apps/warondisease` when `apps/**` or `packages/db/**` change | Job `apps-warondisease-validate` in `ci.yml` |
| Package CI | Packages except web **and** apps | `core-validate` excludes `@apps/*` |
| Web e2e + visual | packages/web Playwright smoke | Unchanged |
| Deploy smoke | Hits ready Vercel deployment URL | `smoke-deploy.yml` (vercel[bot] for the **one** project) |

**Post-deploy HTTP smoke for apps/warondisease** only makes sense after a **second** Vercel project exists. Until then, local/`next build` is the deployability check.

### Future: second project smoke

1. Create Vercel project `optimitron-warondisease` with Root Directory `apps/warondisease`.
2. Share Neon `DATABASE_URL` (same Optimitron DB / managed seed).
3. Set `NEXTAUTH_URL` / OAuth callbacks to that project's URL.
4. Add env `VERCEL_WARONDISEASE_PROJECT_ID` (do not overwrite `VERCEL_PROJECT_ID`).
5. Optionally extend `smoke-deploy.yml` to accept that project's deployment URLs.

Until step 1–4 land, warondisease stays monorepo+CI-typecheck only.

## Recommended order

1. Ship code so `apps/warondisease` typechecks in CI (this PR lane).
2. Manually `pnpm --filter @apps/warondisease build` with a real `.env` offline.
3. Create separate Vercel project **after** browser vote smoke against shared DB.
4. Point `warondisease.org` at the new project only when packages/web multi-host can safely drop that host (cutover plan — separate PR).

# Local database (one compose, shared)

## Recommendation: **one shared Postgres**

| Choice | Verdict |
|--------|---------|
| Separate Docker Compose per brand app | **No** — same Prisma schema, same User/ReferendumVote |
| Separate DB names per app on one Postgres | **Optional only** (`optimitron_test` for wipeable tests). Dev should share `optimitron` |
| One `docker-compose.yml` at monorepo root | **Yes** (already: `pnpm db:up`) |

All brand apps + `packages/web` should point at the **same** `DATABASE_URL` in development so referrals, treaty votes, and people match production.

```bash
# From monorepo root
pnpm db:up          # postgres:postgres@localhost:5432/optimitron
pnpm db:deploy
pnpm db:generate
# optional full seed (includes one-percent-treaty when managed data applies):
# pnpm db:sync:managed-data -- --apply

# Brand app smoke (create+delete smoke vote):
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/optimitron
pnpm smoke:warondisease-db
```

`apps/*/.env.test` uses that same URL (not the old DIH `localhost:15432`).

## GitHub Actions

Job **`apps-warondisease-validate`** when `apps/**` or `packages/db/**` change:

1. Ephemeral Postgres 16 (same as web CI shape)
2. `pnpm db:deploy` + `pnpm db:generate`
3. Typecheck `@apps/warondisease`
4. **`pnpm smoke:warondisease-db`** (hard fail)
5. Unit tests (soft until cleaned)

This is a **shared schema** smoke, not a separate database per app.


## Auth

Same NextAuth pattern per app domain (`NEXTAUTH_URL` per host). Shared cookie SSO across domains is **out of scope** until a dedicated IdP; shared `User` rows are enough for identity continuity after re-login.
