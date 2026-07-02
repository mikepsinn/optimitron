# Local Database

Optimitron uses PostgreSQL for the web/API layer. The repo includes a local Docker Compose service and committed Prisma migrations.

## Defaults

The local Postgres container listens on `localhost:5432` with:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/optimitron
```

This matches the root `.env.example`.

Keep the root `.env` pointed at this local database for normal development.
Production credentials belong in Vercel/GitHub secrets or an explicit one-off
shell session, not in the default local `.env`.

The web dev server refuses to start against a non-local `DATABASE_URL` unless
`OPTIMITRON_ALLOW_REMOTE_DEV_DATABASE=1` is set. Use that override only for an
intentional remote or preview database session.

The same dev guard refuses live Stripe keys in local dev unless
`OPTIMITRON_ALLOW_LIVE_STRIPE_DEV=1` is set. Use Stripe test-mode keys locally,
or leave Stripe keys blank for UI-only review.

## Bootstrap

1. Copy `.env.example` to `.env`.
2. Run:

```bash
pnpm db:setup
```

That will:
- start Docker Compose and wait for Postgres health
- apply committed Prisma migrations
- run the seed script

## Useful Commands

```bash
pnpm db:up
pnpm db:down
pnpm db:logs
pnpm db:deploy
pnpm db:test
pnpm db:migrate
pnpm db:sync:managed-data -- --apply
pnpm db:reset
```

## Notes

- `pnpm db:migrate` is for creating new development migrations after schema changes.
- `pnpm db:deploy` applies committed migrations without prompting for new ones.
- The seed script is idempotent and safe to rerun.
- `pnpm db:test` starts the local Docker Postgres if needed, applies committed
  migrations, and runs the DB-backed integration test suite.
- Do not sync raw production data into local development. If production-shaped
  data is needed, use a masked Neon preview branch after the anonymization
  workflow in `docs/PREVIEW_DATA_PRIVACY.md` has passed.
