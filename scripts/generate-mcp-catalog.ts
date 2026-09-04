/**
 * Regenerate the MCP catalog the campaign developer pages render.
 *
 *   pnpm mcp:catalog
 *
 * The MCP server itself stays on optimitron.com, and its tool registry lives in
 * `apps/optimitron/src/lib/mcp-server.ts` — 14k lines whose tool definitions are
 * interleaved with handlers that talk to Prisma. warondisease.org cannot import
 * that, and importing an app from a package would invert the dependency graph,
 * so the catalog is snapshotted here into a JSON file that site-kit reads.
 *
 * Rerun this whenever a tool, description, scope, or admin gate changes. The
 * output is the same payload `GET /api/mcp/tools` serves, so the page shows what
 * the live server enforces as of the last regeneration.
 */

import { writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getToolCatalog } from "../apps/optimitron/src/lib/mcp-server"
import {
  ALL_SCOPES,
  MCP_SCOPE_DESCRIPTIONS,
  scopeToWire,
} from "../apps/optimitron/src/lib/mcp-scopes"

const OUTPUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../packages/site-kit/src/lib/mcp/catalog.generated.json",
)

const catalog = {
  endpoint: "/api/mcp",
  scopes: ALL_SCOPES.map((scope) => ({
    description: MCP_SCOPE_DESCRIPTIONS[scope],
    wire: scopeToWire(scope),
  })),
  tools: getToolCatalog().map((tool) => ({
    adminOnly: tool.adminOnly,
    description: tool.description,
    inputSchema: tool.inputSchema,
    name: tool.name,
    requiredScopes: (tool.scopes ?? []).map((scope) => scopeToWire(scope)),
  })),
  transport: "Streamable HTTP (MCP 2025-03-26)",
}

writeFileSync(OUTPUT, `${JSON.stringify(catalog, null, 2)}\n`, "utf8")
console.log(
  `Wrote ${catalog.tools.length} tools and ${catalog.scopes.length} scopes to ${OUTPUT}`,
)
