import { getToolDefinitions } from "@/lib/mcp-server";
import { ALL_SCOPES, MCP_SCOPE_DESCRIPTIONS, scopeToWire } from "@/lib/mcp-scopes";

export async function GET() {
  const tools = getToolDefinitions();

  // Public API — emit the OAuth wire format (`tasks:read`) keys clients expect.
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
