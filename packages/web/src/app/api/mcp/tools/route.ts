import { getToolCatalog } from "@/lib/mcp-server";
import { ALL_SCOPES, MCP_SCOPE_DESCRIPTIONS, scopeToWire } from "@/lib/mcp-scopes";

export async function GET() {
  // Access-aware catalog: same registry/scope-map/admin-set the live server
  // enforces, with wire-format scope keys. Additive relative to the previous
  // raw-definitions payload, so existing consumers keep working.
  const tools = getToolCatalog().map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    requiredScopes: (tool.scopes ?? []).map((scope) => scopeToWire(scope)),
    adminOnly: tool.adminOnly,
  }));

  // Public API — emit OAuth wire-format scope keys clients expect.
  const scopes = Object.fromEntries(
    ALL_SCOPES.map((s) => [scopeToWire(s), MCP_SCOPE_DESCRIPTIONS[s]]),
  );

  return Response.json({
    tools,
    scopes,
    endpoint: "/api/mcp",
    transport: "Streamable HTTP (MCP 2025-03-26)",
  });
}
