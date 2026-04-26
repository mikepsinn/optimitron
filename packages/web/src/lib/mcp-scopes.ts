/**
 * MCP scope constants and types — browser-safe.
 *
 * Lives in its own file so client components (consent UI, dev portal) can
 * import the scope catalog without dragging the server-only `mcp-server`
 * module — and its transitive Prisma/`pg` dependencies — into the client
 * bundle.
 *
 * `mcp-server.ts` re-exports from here for backward compatibility.
 */

export const MCP_SCOPES = {
  "tasks:read": "List and view public tasks, blockers, and funding stats",
  "tasks:write": "Create, update, promote tasks and set impact estimates",
  "tasks:personal": "List and manage your own tasks, claim tasks as yourself",
  "agent:run": "Log agent runs, acquire/release leases, record task communications",
  "search": "Search the Optimitron manual and ask Wishonia questions",
} as const;

export type McpScope = keyof typeof MCP_SCOPES;

export const DEFAULT_SCOPES: McpScope[] = ["tasks:read", "search"];

/// Full-trust scope set. Stdio transport passes this explicitly. HTTP must NEVER default to it
/// — unauthenticated HTTP callers get DEFAULT_SCOPES, authenticated callers get the scopes
/// granted at consent time. The deny-by-default behavior in `hasScope` enforces this.
export const ALL_SCOPES: McpScope[] = Object.keys(MCP_SCOPES) as McpScope[];
