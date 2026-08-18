# @optimitron/web

The Next.js 15 app: every user-facing surface (warondisease.org,
optimitron.com), the REST/OAuth API, and the MCP server.

## Surfaces

- **Campaign**: `/` and `/vote` (treaty referendum), referral/share flows,
  `/join` (organizations), `/court` (Court of Humanity), leader/signer
  reminder surfaces.
- **Personal**: task queues and execution planner over MCP, `/check-in`
  (daily measurements), dashboard.
- **Government**: `/opg`, `/obg`, `/budget`, `/agencies/dcongress/wishocracy`,
  alignment reports.
- **Developers**: `/developers`, `/openapi.json` — OAuth + PKCE, open signup.

## Key entry points

- MCP server: `src/lib/mcp-server.ts` (tool reference:
  [docs/MCP_SERVER.md](../../docs/MCP_SERVER.md))
- Task engine: `src/lib/tasks.server.ts`, `src/lib/tasks/` (ranking, planner,
  audit, impact)
- Page metadata: `src/lib/routes.ts` is the single source of truth for
  titles/descriptions via `getRouteMetadata`
- Display identity: `src/lib/user-display.ts` — reads go through `Person`

## Development

One dev server, always on port 3001 (see root `CLAUDE.md`):

```bash
pnpm --filter @optimitron/web dev:fast
pnpm --filter @optimitron/web test
pnpm check   # typecheck + lint + test, from root
```

Never run `next build` locally — the dev server handles compilation.
Copy snapshots (`page.logged-out.md`, `*.email.md`) are generated — regenerate
with `pnpm --filter @optimitron/web copy:preview`, never hand-edit.

Product spec: [docs/PRD.md](../../docs/PRD.md) · feature status:
[docs/FEATURES.md](../../docs/FEATURES.md).
