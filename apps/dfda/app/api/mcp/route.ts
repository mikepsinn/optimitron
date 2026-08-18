/**
 * MCP endpoint for dfda.earth — a resource server over the shared database.
 * Token issuance and consent stay on the canonical authorization server
 * (optimitron.com); this route verifies its Bearer JWTs, re-validates the
 * grant, and serves the tracking tool family only.
 * Reference: apps/optimitron/src/app/api/mcp/route.ts.
 */
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { McpScope } from "@optimitron/db/enums";

import { getRequestOrigin, verifyMcpAccessToken } from "@/lib/mcp/auth";
import { createDfdaMcpServer } from "@/lib/mcp/server";
import { prisma } from "@/lib/prisma";

function getResourceMetadataUrl(req: Request): string {
  return `${getRequestOrigin(req)}/.well-known/oauth-protected-resource/mcp`;
}

// RFC 9728: unauthenticated requests get a 401 whose WWW-Authenticate header
// points at the protected-resource metadata, which is what lets MCP clients
// auto-discover the optimitron.com OAuth endpoints and run PKCE.
function unauthorized(
  req: Request,
  error: "missing_token" | "invalid_token",
): Response {
  const resourceMetadata = getResourceMetadataUrl(req);
  const description =
    error === "missing_token"
      ? "Authorization required. Complete the OAuth flow advertised at the resource_metadata URL."
      : "The provided access token is invalid or expired. Re-run the OAuth flow.";
  return new Response(
    JSON.stringify({
      error,
      error_description: description,
      resource_metadata: resourceMetadata,
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer realm="dfda-mcp", resource_metadata="${resourceMetadata}", error="${error}"`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "WWW-Authenticate",
      },
    },
  );
}

async function handleMcpRequest(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return unauthorized(req, "missing_token");
    }

    let clientId: string;
    let userId: string;
    let scopes: McpScope[];
    try {
      const result = await verifyMcpAccessToken(authHeader.slice(7));
      clientId = result.clientId;
      userId = result.sub;
      scopes = result.scopes;
    } catch (error) {
      console.error("[dfda-mcp] token verification failed:", error);
      return unauthorized(req, "invalid_token");
    }

    // Re-validate against the shared database: the user must exist and the
    // grant must still be active; effective scopes are token ∩ grant. The
    // tracking tools are personal-only, so organization scoping is not used.
    const [user, oauthGrant] = await Promise.all([
      prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { id: true },
      }),
      prisma.oAuthGrant.findFirst({
        where: { active: true, clientId, revokedAt: null, userId },
        select: { id: true, scopes: true },
      }),
    ]);
    if (!user || !oauthGrant) {
      return unauthorized(req, "invalid_token");
    }
    scopes = scopes.filter((scope) => oauthGrant.scopes.includes(scope));

    const transport = new WebStandardStreamableHTTPServerTransport();
    const server = createDfdaMcpServer(userId, scopes);
    await server.connect(transport);
    return transport.handleRequest(req);
  } catch (error) {
    console.error("[dfda-mcp] transport-level error:", error);
    return new Response(
      JSON.stringify({
        error: "mcp_transport_error",
        error_description: "Request failed. See server logs for details.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
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
      "Access-Control-Expose-Headers":
        "mcp-session-id, mcp-protocol-version, WWW-Authenticate",
    },
  });
}
