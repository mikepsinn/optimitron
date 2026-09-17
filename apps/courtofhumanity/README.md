# @apps/courtofhumanity

Court of Humanity project directory for [courtofhumanity.org](https://courtofhumanity.org).

- Local port: `3017`
- Start: `pnpm --filter @apps/courtofhumanity dev`

## Backend ownership

Court owns its eight MCP case tools, case authorization/validation, jury creation,
plaintiff registration and management, agent Markdown mirrors, and plaintiff
backfill script. The tools are defined in `lib/mcp/tools.ts`; `lib/court-data.server.ts`
enforces access and transactions regardless of the calling transport.

- MCP: `/api/mcp`; public catalog: `/api/mcp/tools`.
- Connection help: `/mcp`; reference: `/developers/tools`.
- Discovery: `/.well-known/oauth-protected-resource/api/mcp`.
- Agent entry points: `/llms.txt`, `/court.md`, `/humanity-v-government.md`,
  `/plaintiffs.md`, and `/api/agent/plaintiffs`.

Optimitron remains the OAuth issuer and shared account authority. Court verifies
RS256 tokens against Optimitron JWKS, requires its own resource audience, and
rereads the user and exact-resource grant for each request. Session login retains
the existing `NEXTAUTH_SECRET`. See `docs/COURT_MCP_CUTOVER.md` before rollout.

The shared `@optimitron/mcp` package contains injected authentication, result, and
audit primitives. It has no application imports or database connection. The
transaction-aware plaintiff enrollment helper lives in site-kit so campaign
transactions can enroll their own signer without importing this app. Court owns
its behavior and integration tests. Generic people/tasks/provenance remain shared
or Optimitron-owned.

Run `pnpm --filter @apps/courtofhumanity test:unit` and `test:integration`.
Integration tests require a disposable local PostgreSQL database whose name
contains `test`. Never run the historical backfill automatically during migration.
