/**
 * The Optimitron MCP tool and scope catalog, for the campaign developer pages.
 *
 * `catalog.generated.json` is a committed snapshot of what the live MCP server
 * exposes. Regenerate it with `pnpm mcp:catalog` (see
 * `scripts/generate-mcp-catalog.ts`) after any change to a tool definition,
 * description, required scope, or admin gate.
 *
 * It is a snapshot rather than a live import because the registry lives inside
 * `apps/optimitron` next to handlers that use the Prisma client, and a package
 * may not import an app. The same data is served live at
 * `https://optimitron.com/api/mcp/tools`.
 */

import catalog from "./mcp/catalog.generated.json"

export interface McpToolSchemaProperty {
  description?: string
  enum?: unknown[]
  type?: string | string[]
}

export interface McpToolInputSchema {
  properties?: Record<string, McpToolSchemaProperty>
  required?: string[]
  type?: string
}

export interface McpCatalogTool {
  adminOnly: boolean
  description: string
  inputSchema: McpToolInputSchema
  name: string
  /** OAuth wire-format scopes, any one of which may call the tool. */
  requiredScopes: string[]
}

export interface McpCatalogScope {
  description: string
  /** OAuth wire format, e.g. `tasks:personal`. */
  wire: string
}

export const MCP_TOOLS = catalog.tools as unknown as McpCatalogTool[]
export const MCP_SCOPES = catalog.scopes as unknown as McpCatalogScope[]
export const MCP_TRANSPORT = catalog.transport
export const MCP_ENDPOINT_PATH = catalog.endpoint

export const MCP_ADMIN_TOOL_COUNT = MCP_TOOLS.filter(
  (tool) => tool.adminOnly,
).length

const PUBLIC_GROUP_LABEL = "Public (no scope)"
const ADMIN_GROUP_LABEL = "Admin-only"

/** The label a tool is listed under: admin gate first, then its primary scope. */
export function mcpToolGroupLabel(tool: McpCatalogTool): string {
  if (tool.adminOnly) return ADMIN_GROUP_LABEL
  if (tool.requiredScopes.length === 0) return PUBLIC_GROUP_LABEL
  return tool.requiredScopes[0]
}

/**
 * Tools grouped for display, in a stable order: unscoped tools, then one group
 * per scope in catalog order, then the admin-gated ones. Groups with no tools
 * are dropped so the page never prints an empty heading.
 */
export function groupMcpToolsForDisplay(): Array<{
  label: string
  tools: McpCatalogTool[]
}> {
  const groups = new Map<string, McpCatalogTool[]>()
  for (const tool of MCP_TOOLS) {
    const label = mcpToolGroupLabel(tool)
    groups.set(label, [...(groups.get(label) ?? []), tool])
  }
  return [
    PUBLIC_GROUP_LABEL,
    ...MCP_SCOPES.map((scope) => scope.wire),
    ADMIN_GROUP_LABEL,
  ]
    .filter((label) => groups.has(label))
    .map((label) => ({ label, tools: groups.get(label)! }))
}

/** `string`, `number`, `enum`, or a union — whatever the schema declares. */
export function mcpParameterTypeLabel(
  property: McpToolSchemaProperty,
): string {
  if (property.enum) return "enum"
  if (Array.isArray(property.type)) return property.type.join(" | ")
  return property.type ?? "any"
}
