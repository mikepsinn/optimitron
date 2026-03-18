# Local Database

Optimitron uses PostgreSQL for the web/API layer. The repo includes a local Docker Compose service and committed Prisma migrations.

## Defaults

The local Postgres container listens on `localhost:5432` with:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/optimitron
```

This matches the root `.env.example`.

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
pnpm db:migrate
pnpm db:seed
pnpm db:reset
```

## Notes

- `pnpm db:migrate` is for creating new development migrations after schema changes.
- `pnpm db:deploy` applies committed migrations without prompting for new ones.
- The seed script is idempotent and safe to rerun.
