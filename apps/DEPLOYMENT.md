# Deploying apps to Vercel

## Project shape

Treat every directory under `apps/*` as a peer application with its own Vercel
project. Keep `apps/optimitron` on its existing project because its domains and
history already live there. Create one project for each other app.

`apps/warondisease` is the source of truth for the campaign site. Its rich
neobrutalist home and dashboard must pass public and authenticated visual review
before `warondisease.org` moves off the temporary `apps/optimitron` host.

| Project                | Root Directory              | Production domain          |
| ---------------------- | --------------------------- | -------------------------- |
| `optimitron-web`       | `apps/optimitron`           | `optimitron.com`           |
| `warondisease`         | `apps/warondisease`         | `warondisease.org`         |
| `acceleratedmedicine`  | `apps/acceleratedmedicine`  | `acceleratedmedicine.org`  |
| `courtofhumanity`      | `apps/courtofhumanity`      | `courtofhumanity.org`      |
| `trialabundancesurvey` | `apps/trialabundancesurvey` | `trialabundancesurvey.org` |
| `dfda`                 | `apps/dfda`                 | `dfda.earth`               |
| `wishocracy`           | `apps/wishocracy`           | `wishocracy.org`           |
| `curedao`              | `apps/curedao`              | `curedao.org`              |

Use Vercel's Git integration for these projects. Update the existing
`optimitron-web` project's Root Directory to `apps/optimitron`; do not create a
replacement project. Do not add a workflow that redeploys every app after every
commit. Vercel can skip projects whose workspace dependencies did not change.

Run `pnpm vercel:projects` to audit this project topology. Run
`pnpm vercel:projects -- --apply` to create missing projects and repair their
deployment settings. The `Reconcile Vercel app projects` workflow provides the
same audit or apply operation with the Production environment's Vercel token.
The reconciler does not move domains or copy secrets.

Affected-project deployments are enabled for every project. Vercel uses the
pnpm workspace graph and each app's declared internal dependencies to decide
which projects need a preview or production deployment. Root configuration and
lockfile changes can still affect every project. Every app disables deployment
from `gh-pages` because that branch contains generated visual-review files.

All projects use Standard build machines with on-demand concurrency disabled.
Builds share the included queue, prioritize production, and skip stale queued
commits when a newer commit reaches the same branch. The project reconciler
repairs drift from these settings.

Preview deployments build automatically only for `optimitron-web`,
`warondisease`, and `acceleratedmedicine` — the surfaces under active
iteration. The other apps skip previews unless the commit message contains
`[preview:<app>]` (for example `[preview:dfda]`) or `[preview:all]`. This keeps
a shared `site-kit` push from queueing seven sequential builds on the shared
queue. Production deployments are never gated this way, and GitHub Actions
still builds every affected app on each pull request. Copy-review snapshots
(`page.logged-out.md`, `*.email.md`) are generated from the rendered site and
never trigger deployments.

Vercel treats changes outside the pnpm workspace as global. Each app therefore
uses the same dependency-aware ignore script to reject documentation, review
automation, and unrelated app changes before build CPU starts. App source,
transitive workspace dependencies, and root dependency files still build.
Preview deployments compare the whole branch with `main`'s merge base, so a
skipped or canceled commit cannot hide an earlier app change. App tests, browser
fixtures, screenshots, and Optimitron's current visual-review assembler do not
trigger app deployment. The script treats the full tracked tree as changed only
when it cannot load that base, so a Git outage can overbuild but cannot cause an
unsafe skip. Production also rejects a previous deployment SHA outside history.

GitHub Actions also builds and captures every relevant app for pull request
visual review. This local fixture-based review is broader than the live Vercel
previews and remains available when Vercel correctly skips an unaffected app.
The review packet resolves a separate live preview URL for each affected app,
and each screenshot route links to the matching app instead of a shared host.

`optimitron-web` temporarily uses a custom production workflow so production
database migrations and managed-data sync finish before deployment. It uses the
same affected-input check before it builds. This is a deployment-ordering
exception, not a difference in application importance.

## Environment variables

Use Vercel Shared Environment Variables only when the value and trust boundary
are truly shared. Link each shared variable to the projects that need it.

Good shared candidates:

- `DATABASE_URL` for War on Disease, dFDA, Wishocracy, Trial Abundance Survey,
  and Court of Humanity. Court of Humanity authenticates against the same shared
  database, so it needs this variable before its first production deploy.
- `NEXTAUTH_SECRET` for the optimitron web project and dFDA only. optimitron.com
  signs MCP Bearer tokens with it and dfda.earth/api/mcp verifies them, so those
  two projects must share one value (decided 2026-08-14: one secret, no separate
  MCP signing variable; if it ever leaks, rotate it and every connector re-runs
  OAuth once). The other apps keep their own per-project values.
- A Resend API key when the same account and sending policy serve several apps.
- A Sentry DSN when several apps intentionally report to the same Sentry project.

Keep these project-specific:

- Production `NEXTAUTH_URL` because every app has a different canonical host.
  Preview deployments use Vercel's per-deployment `VERCEL_URL` fallback.
- `NEXTAUTH_SECRET` for each app that ships authentication, except Optimitron
  and dFDA (see the shared list above), so one app cannot expose every app's
  sessions.
- `CRON_SECRET` because only War on Disease exposes cron routes.
- `NEXT_PUBLIC_SURVEY_ORIGIN` because only Accelerated Medicine embeds the survey.
- Analytics IDs when reports must remain separated by brand.

Provider credentials can be shared only when the provider configuration includes
every required callback URL. Separate credentials are safer when an app does not
need the provider.

The current donation page uses checked-in Stripe Payment Links, so it does not
need Stripe API secrets. The legacy checkout, session, and webhook routes were
removed; nothing reacts to a completed donation server-side. Payment Links are
generated by `scripts/setup-stripe-products.ts`, which refuses to run against
any Stripe account whose business_type is not "non_profit".

Do not give Preview deployments the production database by default. Use a Neon
preview branch or another disposable database. Production apps can share the
production schema because votes, people, and referrals are shared records.

## Source of truth

Each app's `.env.example` lists only the variables its shipped capabilities
need. Vercel remains the value store. The example files are the reviewable
contract and contain no real secrets. Accelerated Medicine and CureDAO do not
receive database or authentication secrets because they do not ship those
capabilities.

Vercel sets `NODE_ENV`, `VERCEL_URL`, and related platform variables. Do not add
them manually. `NEXT_PUBLIC_SITE_VARIANT` is fixed in each app's Next config.

## Cutover order

1. Create the seven projects with their root directories.
2. Add Development, Preview, and Production variables for each project.
3. Deploy `trialabundancesurvey` and verify `/embed?embed=1` before Accelerated Medicine.
4. Deploy the remaining apps to Vercel preview URLs.
5. Run page, API, and authenticated screenshot checks against each preview.
6. Move one custom domain at a time.
7. Remove that host from the old multi-host deployment only after its new project is healthy.

The production survey domain currently returns 404 for `/embed`. Accelerated
Medicine will show a working iframe only after the survey project is deployed and
that route is healthy.
