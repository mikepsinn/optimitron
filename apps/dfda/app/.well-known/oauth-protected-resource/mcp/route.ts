import { getIssuerUrl, getRequestOrigin } from "@/lib/mcp/auth";

// RFC 9728 protected-resource metadata for the dFDA tracking MCP server.
// `resource` must reflect the host the client dialed, so never cache this.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = getRequestOrigin(req);
  return Response.json(
    {
      resource: `${origin}/api/mcp`,
      authorization_servers: [getIssuerUrl()],
      scopes_supported: ["tasks:personal"],
      bearer_methods_supported: ["header"],
      resource_name: "dFDA Tracking MCP Server",
      resource_documentation: origin,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
