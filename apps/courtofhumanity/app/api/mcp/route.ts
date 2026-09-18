import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { authenticateCourtRequest, courtMcpConfig } from "@/lib/mcp/auth";
import { createCourtMcpServer } from "@/lib/mcp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, mcp-session-id, Last-Event-ID, mcp-protocol-version",
  "Access-Control-Expose-Headers":
    "mcp-session-id, mcp-protocol-version, WWW-Authenticate",
};

async function handleRequest(request: Request) {
  let context;
  try {
    context = await authenticateCourtRequest(request);
  } catch {
    const metadata = new URL(
      "/.well-known/oauth-protected-resource/api/mcp",
      courtMcpConfig().resource,
    ).href;
    return Response.json(
      { error: "invalid_token", resource_metadata: metadata },
      {
        status: 401,
        headers: {
          ...cors,
          "WWW-Authenticate": `Bearer resource_metadata="${metadata}", scope="earthdata:write"`,
        },
      },
    );
  }
  const server = createCourtMcpServer(context);
  const transport = new WebStandardStreamableHTTPServerTransport();
  await server.connect(transport);
  const response = await transport.handleRequest(request);
  for (const [name, value] of Object.entries(cors))
    response.headers.set(name, value);
  return response;
}

export const GET = handleRequest;
export const POST = handleRequest;
export const DELETE = handleRequest;
export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}
