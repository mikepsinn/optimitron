# @optimitron/db

Prisma 7 schema, Zod validators, and the generated client. **`prisma/schema.prisma`
is the canonical source of truth for all persisted types** — the full type-flow
contract is [docs/TYPE_SYSTEM.md](../../docs/TYPE_SYSTEM.md).

## Rules

- Schema or exported-type changes require explicit human approval.
- The `datasource` block intentionally omits `url` — the connection is
  configured at runtime via `@prisma/adapter-pg`. Never add
  `url = env("DATABASE_URL")`.
- The Prisma client is for the web/API layer only. Library packages
  (`optimizer`, `wishocracy`, `opg`, `obg`, `data`, `agent`, `hypercerts`,
  `storage`) may use `import type` from this package but never the runtime
  client.
- Zod schemas are namespaced under `schemas` and belong at runtime boundaries
  (HTTP, forms, MCP, OAuth) only.
- Every model carries a `jurisdictionId`; libraries stay
  jurisdiction-agnostic, `web` handles multi-tenancy.
- Managed/curated records live in `src/managed-data/` — the manifest is the
  source of truth for semi-permanent app records.

## Commands (from repo root)

```bash
pnpm db:generate     # regenerate the Prisma client after schema changes
pnpm db:migrate      # create/apply a dev migration
pnpm --filter @optimitron/db test
```

Local database bootstrap: [docs/LOCAL_DB.md](../../docs/LOCAL_DB.md).
Model-by-model usage audit: [docs/SCHEMA_USAGE_AUDIT.md](../../docs/SCHEMA_USAGE_AUDIT.md)
(generated — do not hand-edit).
