import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "@/lib/mcp-server";
import { verifyMcpAccessToken } from "@/lib/mcp-oauth";
import { prisma } from "@/lib/prisma";
import type { McpScope } from "@/lib/mcp-scopes";

function getResourceMetadataUrl(req: Request): string {
  const base =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : new URL(req.url).origin);
  return `${base}/.well-known/oauth-protected-resource/mcp`;
}

// MCP authorization spec (2025-03-26) + RFC 9728: an unauthenticated request
// to a protected resource MUST get a 401 with a WWW-Authenticate header that
// points the client at the protected-resource metadata document. That header
// is what makes Claude.ai (and any spec-compliant MCP client) auto-discover
// the OAuth endpoints and run the authorization-code + PKCE flow.
function unauthorized(req: Request, error: "missing_token" | "invalid_token"): Response {
  const resourceMetadata = getResourceMetadataUrl(req);
  const description =
    error === "missing_token"
      ? "Authorization required. Complete the OAuth flow advertised at the resource_metadata URL."
      : "The provided access token is invalid or expired. Re-run the OAuth flow.";
  return new Response(
    JSON.stringify({ error, error_description: description, resource_metadata: resourceMetadata }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer realm="optimitron-mcp", resource_metadata="${resourceMetadata}", error="${error}"`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "WWW-Authenticate",
      },
    },
  );
}

async function handleMcpRequest(req: Request): Promise<Response> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorized(req, "missing_token");
  }

  let userId: string;
  let scopes: McpScope[];
  try {
    const result = await verifyMcpAccessToken(authHeader.slice(7));
    userId = result.sub;
    scopes = result.scopes;
  } catch {
    return unauthorized(req, "invalid_token");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  const transport = new WebStandardStreamableHTTPServerTransport();
  const server = createMcpServer(userId, scopes, { isAdmin: user?.isAdmin === true });
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
      "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version, WWW-Authenticate",
    },
  });
}
