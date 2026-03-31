# Web App

## Summary

`packages/web` is the serverful Next.js application for Optimitron. It is the integration layer for:

- authentication
- referral capture and email
- proof-of-personhood verification
- Wishocracy voting
- politician alignment reports
- profile, census, and daily wellbeing tracking

The app should be treated as a Vercel deployment target, not a static export.

## Current Features

### Authentication

- Google sign-in/sign-up
- Email magic-link sign-in/sign-up
- Referral capture during signup and post-signin sync
- Resend-backed transactional email

The public sign-in UI is intentionally simple: Google first, then magic link by email.

### Proof of Personhood

- World ID verification after sign-in
- Verification state stored on the user/session side
- Current use is status + future sybil-resistance hook

### Wishocracy

- Pairwise comparison voting flow at `/vote`
- Persistent authenticated allocations/comparisons
- Referral sharing for vote invites
- Personal alignment report from saved preferences
- Public shareable alignment URLs at `/alignment/[identifier]`

### Profile and Census

- User profile page at `/profile`
- Location fields
- Census-style demographics and annual household income
- Daily health and happiness check-ins
- Measurement writes for health, happiness, and income

## Known Data Status

- Alignment reports now use real current federal politician identities
- Candidate/category allocations are still curated public-position coding unless database-synced data has been materialized
- Congress sync currently refreshes politician identity/provenance and benchmark rows, but full bill-level vote classification is still a next-step project

## Local Development

### Prerequisites

- Root `.env` populated from [`.env.example`](../.env.example)
- Local Postgres from `docker-compose.yml`

### Common Commands

```bash
pnpm db:setup
pnpm dev
```

Local web development is pinned to `http://localhost:3001`.

Important environment values:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_BASE_URL`
- `NEXTAUTH_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CRON_SECRET`
- `WORLD_ID_*`
- `CONGRESS_API_KEY` for politician sync jobs

## Deployment

### Vercel

- Project root directory: `packages/web`
- Build command: `pnpm run build`
- Do not force static export
- Automatic Git-based deployments from `main` are disabled in [`packages/web/vercel.json`](../packages/web/vercel.json)
- Production deploys should run through GitHub Actions in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) after `web-validate` passes
- Run `pnpm db:deploy` against production before first use

Recommended GitHub/Vercel production gate:

1. Set GitHub secret `VERCEL_TOKEN`
2. Set GitHub repository variables `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`
3. Protect `main` and require the `web-validate` check before merge
4. Optionally add required reviewers to the GitHub `production` environment so deploys need explicit approval
5. Keep Vercel project root pointed at `packages/web`

Required production envs:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_BASE_URL`
- `NEXTAUTH_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CRON_SECRET`
- `WORLD_ID_APP_ID`
- `WORLD_ID_RP_ID`
- `WORLD_ID_SIGNING_KEY`
- `WORLD_ID_ACTION`
- `WORLD_ID_ENVIRONMENT`
- `CONGRESS_API_KEY` for alignment sync

Cron routes:

- `/api/cron/referral-sequence`
- `/api/cron/alignment-politicians`

## Smoke Checklist

After auth, data, or deployment changes, verify:

1. `/vote` loads on `localhost:3001`
2. `/api/auth/providers` includes `google` when Google envs are set
3. Google login works end to end
4. Magic-link email sends and completes sign-in
5. Referral code survives signup/sign-in
6. `/profile` saves census fields and daily check-ins
7. `/alignment` loads for an authenticated user
8. `/alignment/[identifier]` loads publicly
9. World ID request/verify endpoints respond for signed-in users
10. Protected cron routes reject unauthorized requests
