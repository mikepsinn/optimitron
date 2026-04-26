/**
 * MCP scope catalog — browser-safe.
 *
 * `McpScope` itself is the Prisma enum, imported from the browser-safe
 * `@optimitron/db/enums` subpath so client components (consent UI, dev portal)
 * don't drag the Prisma client into the browser bundle.
 *
 * Wire-format helpers translate between the Prisma identifier (`TASKS_READ`,
 * what app code and JWTs see) and the OAuth wire string (`tasks:read`, what
 * URL params, OAuth metadata, and the DB store via `@map`).
 */

import { McpScope } from "@optimitron/db/enums";

export { McpScope };

export const MCP_SCOPE_DESCRIPTIONS: Record<McpScope, string> = {
  [McpScope.TASKS_READ]: "List and view public tasks, blockers, and funding stats",
  [McpScope.TASKS_WRITE]: "Create, update, promote tasks and set impact estimates",
  [McpScope.TASKS_PERSONAL]: "List and manage your own tasks, claim tasks as yourself",
  [McpScope.AGENT_RUN]: "Log agent runs, acquire/release leases, record task communications",
  [McpScope.SEARCH]: "Search the Optimitron manual and ask Wishonia questions",
};

export const DEFAULT_SCOPES: McpScope[] = [McpScope.TASKS_READ, McpScope.SEARCH];

/// Full-trust scope set. Stdio transport passes this explicitly. HTTP must NEVER default to it
/// — unauthenticated HTTP callers get DEFAULT_SCOPES, authenticated callers get the scopes
/// granted at consent time. The deny-by-default behavior in `hasScope` enforces this.
export const ALL_SCOPES: McpScope[] = Object.values(McpScope) as McpScope[];

// ---------------------------------------------------------------------------
// Wire-format conversion
//
// The Prisma enum uses `@map("tasks:read")` so the DB stores the wire format,
// but the generated TS type sees the identifier (`TASKS_READ`). These helpers
// bridge the two at the OAuth boundary (URL params, JWT payload, OAuth
// metadata response).
// ---------------------------------------------------------------------------

const ENUM_TO_WIRE: Record<McpScope, string> = {
  [McpScope.TASKS_READ]: "tasks:read",
  [McpScope.TASKS_WRITE]: "tasks:write",
  [McpScope.TASKS_PERSONAL]: "tasks:personal",
  [McpScope.AGENT_RUN]: "agent:run",
  [McpScope.SEARCH]: "search",
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
    .split(" ")
    .filter(Boolean)
    .map(scopeFromWire)
    .filter((x): x is McpScope => x !== null);
}

export const ALL_WIRE_SCOPES: string[] = ALL_SCOPES.map(scopeToWire);
