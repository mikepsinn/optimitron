/**
 * Shared request authentication for the REST v1 tracking routes.
 *
 * Two ways in:
 *  1. Bearer JWT minted by the optimitron.com authorization server —
 *     verified and re-validated against the shared database exactly like
 *     app/api/mcp/route.ts (user exists, grant active, effective scopes =
 *     token ∩ grant, tasks:personal required).
 *  2. NextAuth session cookie — a signed-in user operates on their own
 *     data, so the personal scope is implicit. Session lookup goes through
 *     site-kit's requireAuth() (the app's standard session helper); calling
 *     getServerSession(authOptions) here directly would cross the app's and
 *     site-kit's separate next-auth instances.
 */
import { McpScope } from "@optimitron/db/enums";
import { NextResponse } from "next/server";

import { requireAuth as requireSessionAuth } from "@/lib/auth-utils";
import { getRequestOrigin, verifyMcpAccessToken } from "@/lib/mcp/auth";
import { prisma } from "@/lib/prisma";
// Side effect: points the tracking engine at this app's Prisma singleton.
import "@/lib/tracking-provider";

export interface TrackingAuth {
  userId: string;
}

// RFC 9728: the WWW-Authenticate header points at the protected-resource
// metadata so API clients can discover the optimitron.com OAuth endpoints.
function unauthorized(req: Request, message: string): NextResponse {
  const resourceMetadata = `${getRequestOrigin(req)}/.well-known/oauth-protected-resource/mcp`;
  return NextResponse.json(
    { error: { code: "unauthorized", message } },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer realm="dfda-api", resource_metadata="${resourceMetadata}"`,
      },
    },
  );
}

export async function requireTrackingAuth(
  req: Request,
): Promise<TrackingAuth | NextResponse> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    let clientId: string;
    let userId: string;
    let scopes: McpScope[];
    try {
      const payload = await verifyMcpAccessToken(authHeader.slice(7));
      clientId = payload.clientId;
      userId = payload.sub;
      scopes = payload.scopes;
    } catch (error) {
      console.error("[dfda-api] token verification failed:", error);
      return unauthorized(
        req,
        "The provided access token is invalid or expired. Re-run the OAuth flow.",
      );
    }

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
      return unauthorized(
        req,
        "The provided access token is invalid or expired. Re-run the OAuth flow.",
      );
    }
    const effectiveScopes = scopes.filter((scope) =>
      oauthGrant.scopes.includes(scope),
    );
    if (!effectiveScopes.includes(McpScope.TASKS_PERSONAL)) {
      return unauthorized(
        req,
        "This endpoint requires the tasks:personal scope.",
      );
    }
    return { userId };
  }

  // requireSessionAuth throws when there is no signed-in session.
  try {
    const { userId } = await requireSessionAuth();
    return { userId };
  } catch {
    return unauthorized(
      req,
      "Authorization required. Sign in, or complete the OAuth flow advertised at the resource_metadata URL and send the Bearer token.",
    );
  }
}
