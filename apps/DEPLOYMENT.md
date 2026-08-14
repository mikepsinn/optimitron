# Deploying the site apps to Vercel

## Project shape

Keep `packages/web` on its existing Vercel project. Create one additional
Vercel project for each app under `apps/*`.

`apps/warondisease` is the source of truth for the campaign site. Its rich
neobrutalist home and dashboard must pass public and authenticated visual review
before `warondisease.org` moves off the temporary `packages/web` host.

| Project                | Root Directory              | Production domain          |
| ---------------------- | --------------------------- | -------------------------- |
| `optimitron-web`       | `packages/web`              | `optimitron.com`           |
| `warondisease`         | `apps/warondisease`         | `warondisease.org`         |
| `acceleratedmedicine`  | `apps/acceleratedmedicine`  | `acceleratedmedicine.org`  |
| `trialabundancesurvey` | `apps/trialabundancesurvey` | `trialabundancesurvey.org` |
| `dfda`                 | `apps/dfda`                 | `dfda.earth`               |
| `wishocracy`           | `apps/wishocracy`           | `wishocracy.org`           |
| `curedao`              | `apps/curedao`              | `curedao.org`              |

Use Vercel's Git integration for these projects. Do not repoint the existing
`packages/web` project and do not add a workflow that redeploys every app after
every commit. Vercel can skip projects whose workspace dependencies did not
change.

## Environment variables

Use Vercel Shared Environment Variables only when the value and trust boundary
are truly shared. Link each shared variable to the projects that need it.

Good shared candidates:

- `DATABASE_URL` for War on Disease, dFDA, Wishocracy, and Trial Abundance Survey.
- `MCP_TOKEN_SECRET` for the optimitron web project and dFDA. optimitron.com signs
  MCP Bearer tokens with it; dfda.earth/api/mcp verifies them. Without it the web
  project falls back to its `NEXTAUTH_SECRET` and dfda cannot verify tokens.
  Introducing a value different from the web project's `NEXTAUTH_SECRET` rotates
  the signing key: every previously issued access and refresh token stops
  verifying and each connector re-runs OAuth once. That one-time re-auth is the
  accepted cutover cost; there is no dual-key verification window.
- A Resend API key when the same account and sending policy serve several apps.
- A Sentry DSN when several apps intentionally report to the same Sentry project.

Keep these project-specific:

- `NEXTAUTH_URL` because every app has a different canonical host.
- `NEXTAUTH_SECRET` to avoid one satellite exposing every app's sessions.
- `CRON_SECRET` because only War on Disease exposes cron routes.
- `NEXT_PUBLIC_SURVEY_ORIGIN` because only Accelerated Medicine embeds the survey.
- Analytics IDs when reports must remain separated by brand.

Provider credentials can be shared only when the provider configuration includes
every required callback URL. Separate credentials are safer when an app does not
need the provider.

The current donation page uses checked-in Stripe Payment Links, so it does not
need Stripe API secrets. The legacy checkout and webhook routes remain dormant.

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

1. Create the six projects with their root directories.
2. Add Development, Preview, and Production variables for each project.
3. Deploy `trialabundancesurvey` and verify `/embed?embed=1` before Accelerated Medicine.
4. Deploy the remaining apps to Vercel preview URLs.
5. Run page, API, and authenticated screenshot checks against each preview.
6. Move one custom domain at a time.
7. Remove that host from the old multi-host deployment only after its new project is healthy.

The production survey domain currently returns 404 for `/embed`. Accelerated
Medicine will show a working iframe only after the survey project is deployed and
that route is healthy.
