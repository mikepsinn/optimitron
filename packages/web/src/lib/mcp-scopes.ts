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
import type { TaskClientAccessBoundary } from "@/lib/tasks/task-visibility.server";

export { McpScope };

/** Scopes that let a bearer client read or mutate tasks at all. */
export const TASK_CLIENT_SCOPES = [
  McpScope.TASKS_PERSONAL,
  McpScope.TASKS_ORGANIZATION,
  McpScope.TASKS_ADMIN,
] as const;

/**
 * The one scope→boundary derivation, shared by the MCP handlers and the REST
 * routes (and reused by route tests so mocked auth seams keep the real rule):
 * private-personal access needs tasks:personal; org access needs
 * tasks:organization plus the org in the token's allowlist.
 */
export function taskBoundaryFromScopes(
  scopes: readonly McpScope[] | undefined,
  organizationIds: readonly string[] | null,
): TaskClientAccessBoundary {
  return {
    allowPersonalPrivate: scopes?.includes(McpScope.TASKS_PERSONAL) === true,
    organizationIds: scopes?.includes(McpScope.TASKS_ORGANIZATION)
      ? organizationIds
      : [],
  };
}

export const MCP_SCOPE_DESCRIPTIONS: Record<McpScope, string> = {
  [McpScope.TASKS_ADMIN]: "Admin-only: create and manage public Optimitron tasks, people, organizations, estimates, and dependencies",
  [McpScope.TASKS_PERSONAL]: "Manage your private tasks, dependencies, comments, queues, and next-action recommendations",
  [McpScope.TASKS_ORGANIZATION]: "Manage private tasks for organizations where you have permission",
  [McpScope.ACTIONS_APPROVE]: "Approve exact outbound-action payloads as an authenticated human",
  [McpScope.EARTHDATA_WRITE]: "Create sourced public Earth-data records: memorials, evidence, intervention reports, organization signatories, and correction reports",
  [McpScope.EARTHDATA_ADMIN]: "Admin-only: hide, restore, merge, and resolve Earth-data records and reports",
  [McpScope.AGENT_RUN]: "Admin-only: run coordinated public-task agents with leases and run logs",
  [McpScope.GITHUB]: "Admin-only: access the configured GitHub repos via the server-side PAT (search code, read files, list directories, generic API passthrough)",
};

// Candidate scopes preselected in the OAuth consent UI. They are still filtered
// through `allowedMcpScopesForUser`, so admin scopes only appear for admins.
// Admin task-write tools (updateTask, deleteTask, etc.) gate on isAdmin alone
// via hasAdminTaskWriteAccess — TASKS_ADMIN scope is documentation/UX, not a
// security gate. Re-add it as a security gate by tightening
// hasAdminTaskWriteAccess if this app becomes multi-admin.
export const DEFAULT_CONSENT_SCOPES: McpScope[] = [
  McpScope.TASKS_PERSONAL,
];

export const ALL_SCOPES: McpScope[] = [
  McpScope.TASKS_PERSONAL,
  McpScope.TASKS_ORGANIZATION,
  McpScope.ACTIONS_APPROVE,
  McpScope.TASKS_ADMIN,
  McpScope.EARTHDATA_WRITE,
  McpScope.EARTHDATA_ADMIN,
  McpScope.AGENT_RUN,
  McpScope.GITHUB,
];

export const ADMIN_MCP_SCOPES: readonly McpScope[] = [
  McpScope.TASKS_PERSONAL,
  McpScope.TASKS_ORGANIZATION,
  McpScope.TASKS_ADMIN,
  McpScope.EARTHDATA_WRITE,
  McpScope.EARTHDATA_ADMIN,
  McpScope.AGENT_RUN,
  McpScope.GITHUB,
];

export const NON_ADMIN_MCP_SCOPES: readonly McpScope[] = [
  McpScope.TASKS_PERSONAL,
  McpScope.TASKS_ORGANIZATION,
  McpScope.EARTHDATA_WRITE,
];

export function isHumanApprovalOAuthRedirectUri(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      /^[a-p]{32}\.chromiumapp\.org$/.test(url.hostname) &&
      url.pathname === "/oauth2"
    );
  } catch {
    return false;
  }
}

export function allowedMcpScopesForUser(
  isAdmin: boolean,
  options?: { allowHumanApproval?: boolean },
): readonly McpScope[] {
  const base = isAdmin ? ADMIN_MCP_SCOPES : NON_ADMIN_MCP_SCOPES;
  return options?.allowHumanApproval
    ? [...base, McpScope.ACTIONS_APPROVE]
    : base;
}

export function filterAllowedMcpScopes(
  requested: readonly McpScope[],
  isAdmin: boolean,
  options?: { allowHumanApproval?: boolean },
): McpScope[] {
  const allowed = new Set<McpScope>(
    allowedMcpScopesForUser(isAdmin, options),
  );
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
  [McpScope.TASKS_ORGANIZATION]: "tasks:organization",
  [McpScope.ACTIONS_APPROVE]: "actions:approve",
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
