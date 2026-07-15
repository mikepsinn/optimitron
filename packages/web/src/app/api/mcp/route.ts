import { appendFile } from "node:fs/promises";
import { join } from "node:path";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "@/lib/mcp-server";
import { verifyMcpAccessToken } from "@/lib/mcp-oauth";
import { prisma } from "@/lib/prisma";
import type { McpScope } from "@/lib/mcp-scopes";

function redactAuthorizationHeader(authHeader: string | null) {
  if (!authHeader) return null;
  const schemeEnd = authHeader.indexOf(" ");
  const scheme = schemeEnd >= 0 ? authHeader.slice(0, schemeEnd + 1) : "Bearer ";
  return `${scheme}[redacted:length=${authHeader.length}]`;
}

async function logMcpRequest(req: Request) {
  if (process.env.NODE_ENV === "production" || process.env.MCP_DEBUG_REQUESTS !== "1") return;

  const authHeader = req.headers.get("authorization");
  const entry = {
    at: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: {
      accept: req.headers.get("accept"),
      authorization: redactAuthorizationHeader(authHeader),
      contentType: req.headers.get("content-type"),
      lastEventId: req.headers.get("last-event-id"),
      mcpProtocolVersion: req.headers.get("mcp-protocol-version"),
      mcpSessionId: req.headers.get("mcp-session-id"),
      userAgent: req.headers.get("user-agent"),
    },
    bodyPreview: null as string | null,
  };

  try {
    const body = await req.clone().text();
    entry.bodyPreview =
      body.length > 1200
        ? `${body.slice(0, 1200)}...[truncated:${body.length}]`
        : body;
  } catch (error) {
    entry.bodyPreview = `[unavailable:${error instanceof Error ? error.message : String(error)}]`;
  }

  const line = `${JSON.stringify(entry)}\n`;
  console.log(`[mcp-debug] ${line.trim()}`);
  await appendFile(join(process.cwd(), ".next", "mcp-debug.log"), line, "utf8").catch(
    () => {},
  );
}

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

/// Capture an MCP-side error to Sentry without blocking the response.
/// Caller has already logged via console.error / returned an HTTP response;
/// this just enriches Sentry visibility so silent transport / auth failures
/// stop being silent. Dynamic import — Sentry might not be initialized in
/// dev or test runs.
function captureMcpError(
  error: unknown,
  ctx: { surface: string; userId?: string | null; details?: Record<string, unknown> },
) {
  void import("@sentry/nextjs")
    .then((Sentry) => {
      Sentry.withScope((scope) => {
        scope.setTag("mcp.surface", ctx.surface);
        if (ctx.userId) scope.setUser({ id: ctx.userId });
        if (ctx.details) scope.setContext("mcp", ctx.details);
        Sentry.captureException(error);
      });
    })
    .catch(() => {
      // Sentry unavailable; already logged above.
    });
}

async function handleMcpRequest(req: Request): Promise<Response> {
  try {
    await logMcpRequest(req);

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
      // Token verification failed — log + Sentry so we can see the real
      // reason (expired vs. tampered vs. unknown signing key) instead of
      // just a generic 401 in Vercel logs.
      console.error("[mcp] token verification failed:", error);
      captureMcpError(error, {
        surface: "auth_token_verification",
        details: { method: req.method, url: req.url },
      });
      return unauthorized(req, "invalid_token");
    }

    const [user, oauthGrant] = await Promise.all([
      prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { isAdmin: true },
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
    const server = createMcpServer(userId, scopes, {
      clientId,
      isAdmin: user.isAdmin === true,
      oauthGrantId: oauthGrant.id,
    });
    await server.connect(transport);
    return transport.handleRequest(req);
  } catch (error) {
    // Catch transport-level / unexpected failures that bypass the
    // tool-dispatch try/catch in mcp-server.ts (e.g. server.connect or
    // transport.handleRequest throwing). Without this, the request fails
    // with a generic 500 and Sentry's `onRequestError` may or may not
    // fire reliably for streamed responses.
    console.error("[mcp] transport-level error:", error);
    captureMcpError(error, {
      surface: "transport",
      details: { method: req.method, url: req.url },
    });
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        error: "mcp_transport_error",
        error_description: message,
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
      "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version, WWW-Authenticate",
    },
  });
}
