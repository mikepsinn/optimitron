# Earth Optimization API Plan

The Earth Optimization API should make Optimitron the shared coordination layer
for public-interest apps that need OAuth, surveys, task assignments, referrals,
people, organizations, and agent work coordination without copying the database.

Registry entry: OPT-API-01 in [FEATURES.md](./FEATURES.md).

## Shipped

- `/openapi.json` for the REST and OAuth surface
  (`packages/web/src/app/openapi.json/route.ts`).
- `/developers` as the human-readable entry point for external app and website
  builders (`packages/web/src/app/developers/page.tsx`).
- OAuth authorization-code plus PKCE flow, dynamic client registration,
  refresh token rotation, and revocation endpoints
  (`packages/web/src/lib/mcp-oauth.ts`).
- MCP and REST share one scope catalog
  (`packages/web/src/lib/mcp-scopes.ts`).

## Now

- Accept OAuth Bearer tokens on campaign APIs that already have clear user
  ownership semantics: tasks, task comments, referral invitations, treaty votes,
  profile writes, people search, and organization management.
- Name credible partner use cases: survey sites, dFDA/patient-priority sites,
  research funders, civic tools, nonprofit tools, and task-bounty workflows.

## Next

- Add a first-party app management screen for humans to see registered clients,
  revoke grants, and create named integrations without hand-posting JSON.
- Add OIDC discovery and `/userinfo` once another site needs Optimitron as a
  login provider, not just an authorization provider.
- Expose full task-economics fields over REST when partner apps need task
  bounties, EV/hr, probability, cash cost, dependency unlock value, or
  USD-equivalent welfare estimates outside MCP.
- Add a generated SDK only after one external integration starts repeating the
  same request code.
- Add embed examples for the treaty survey, dFDA survey, and task creation flow.

## Not Yet

- Do not add a generic developer marketplace before real integrations need it.
- Do not add new Prisma models or exported database types without human
  approval.
- Do not expand scopes casually. Prefer one narrow scope tied to a real app
  action.
