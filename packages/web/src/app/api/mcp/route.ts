import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "@/lib/mcp-server";
import { verifyMcpAccessToken } from "@/lib/mcp-oauth";
import { DEFAULT_SCOPES, type McpScope } from "@/lib/mcp-scopes";

async function handleMcpRequest(req: Request): Promise<Response> {
  // Unauthenticated callers get DEFAULT_SCOPES (read-only public tasks + manual search).
  // A valid Bearer token replaces these with the scopes granted at OAuth consent time.
  let userId: string | undefined;
  let scopes: McpScope[] = DEFAULT_SCOPES;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const result = await verifyMcpAccessToken(authHeader.slice(7));
      userId = result.sub;
      scopes = result.scopes;
    } catch {
      return new Response(
        JSON.stringify({ error: "invalid_token" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "WWW-Authenticate": 'Bearer error="invalid_token"',
          },
        },
      );
    }
  }

  const transport = new WebStandardStreamableHTTPServerTransport();
  const server = createMcpServer(userId, scopes);
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function GET(req: Request) {
  return handleMcpRequest(req);
}

export async function POST(req: Request) {
  return handleMcpRequest(req);
}

export async function DELETE(req: Request) {
  return handleMcpRequest(req);
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, mcp-session-id, Last-Event-ID, mcp-protocol-version",
      "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
    },
  });
}
