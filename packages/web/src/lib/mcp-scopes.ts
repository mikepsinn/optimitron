/**
 * MCP scope catalog - browser-safe.
 *
 * `McpScope` itself is the Prisma enum, imported from the browser-safe
 * `@optimitron/db/enums` subpath so client components (consent UI, dev portal)
 * don't drag the Prisma client into the browser bundle.
 *
 * Wire-format helpers translate between the Prisma identifier (`TASKS_PERSONAL`,
 * what app code and JWTs see) and the OAuth wire string (`tasks:personal`, what
 * URL params, OAuth metadata, and the DB store via `@map`).
 */

import { McpScope } from "@optimitron/db/enums";

export { McpScope };

export const MCP_SCOPE_DESCRIPTIONS: Record<McpScope, string> = {
  [McpScope.TASKS_ADMIN]: "Admin-only: create and manage public Optimitron tasks, people, organizations, estimates, dependencies, and milestones",
  [McpScope.TASKS_PERSONAL]: "Manage your private tasks, dependencies, comments, queues, and next-action recommendations",
  [McpScope.EARTHDATA_WRITE]: "Create sourced public Earth-data records: memorials, evidence, intervention reports, organization signatories, and correction reports",
  [McpScope.EARTHDATA_ADMIN]: "Admin-only: hide, restore, merge, and resolve Earth-data records and reports",
  [McpScope.AGENT_RUN]: "Admin-only: run coordinated public-task agents with leases and run logs",
  [McpScope.GITHUB]: "Admin-only: access the configured GitHub repos via the server-side PAT (search code, read files, list directories, generic API passthrough)",
};

export const DEFAULT_SCOPES: McpScope[] = [McpScope.TASKS_PERSONAL];

export const ALL_SCOPES: McpScope[] = [
  McpScope.TASKS_PERSONAL,
  McpScope.TASKS_ADMIN,
  McpScope.EARTHDATA_WRITE,
  McpScope.EARTHDATA_ADMIN,
  McpScope.AGENT_RUN,
  McpScope.GITHUB,
];

export const ADMIN_MCP_SCOPES: readonly McpScope[] = [
  McpScope.TASKS_PERSONAL,
  McpScope.TASKS_ADMIN,
  McpScope.EARTHDATA_WRITE,
  McpScope.EARTHDATA_ADMIN,
  McpScope.AGENT_RUN,
  McpScope.GITHUB,
];

export const NON_ADMIN_MCP_SCOPES: readonly McpScope[] = [
  McpScope.TASKS_PERSONAL,
  McpScope.EARTHDATA_WRITE,
];

export function allowedMcpScopesForUser(isAdmin: boolean): readonly McpScope[] {
  return isAdmin ? ADMIN_MCP_SCOPES : NON_ADMIN_MCP_SCOPES;
}

export function filterAllowedMcpScopes(
  requested: readonly McpScope[],
  isAdmin: boolean,
): McpScope[] {
  const allowed = new Set<McpScope>(allowedMcpScopesForUser(isAdmin));
  return requested.filter((scope) => allowed.has(scope));
}

// ---------------------------------------------------------------------------
// Wire-format conversion
//
// The Prisma enum uses `@map("tasks:personal")` so the DB stores the wire format,
// but the generated TS type sees the identifier (`TASKS_PERSONAL`). These helpers
// bridge the two at the OAuth boundary (URL params, JWT payload, OAuth
// metadata response).
// ---------------------------------------------------------------------------

const ENUM_TO_WIRE: Record<McpScope, string> = {
  [McpScope.TASKS_PERSONAL]: "tasks:personal",
  [McpScope.TASKS_ADMIN]: "tasks:admin",
  [McpScope.EARTHDATA_WRITE]: "earthdata:write",
  [McpScope.EARTHDATA_ADMIN]: "earthdata:admin",
  [McpScope.AGENT_RUN]: "agent:run",
  [McpScope.GITHUB]: "github",
};

const WIRE_TO_ENUM: Record<string, McpScope> = Object.fromEntries(
  (Object.entries(ENUM_TO_WIRE) as [McpScope, string][]).map(([k, v]) => [v, k]),
);

export function scopeToWire(scope: McpScope): string {
  return ENUM_TO_WIRE[scope];
}

export function scopeFromWire(s: string): McpScope | null {
  return WIRE_TO_ENUM[s] ?? null;
}

export function scopesToWire(scopes: McpScope[]): string {
  return scopes.map(scopeToWire).join(" ");
}

export function scopesFromWire(s: string): McpScope[] {
  return s
    .split(/[,\s]+/)
    .filter(Boolean)
    .map(scopeFromWire)
    .filter((x): x is McpScope => x !== null);
}

export const ALL_WIRE_SCOPES: string[] = ALL_SCOPES.map(scopeToWire);
