import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyMcpAccessToken } from "@/lib/mcp-oauth";
import type { McpScope } from "@/lib/mcp-scopes";
import { prisma } from "@/lib/prisma";

export function hasBearerAuthorization(request?: Request) {
  const authHeader = request?.headers.get("authorization");
  return /^Bearer\b/iu.test(authHeader?.trim() ?? "");
}

function getBearerToken(request?: Request) {
  const authHeader = request?.headers.get("authorization");
  if (!authHeader) return null;

  const trimmed = authHeader.trim();
  if (!/^Bearer\b/iu.test(trimmed)) return null;

  const match = /^Bearer\s+(.+)$/iu.exec(trimmed);
  const token = match?.[1]?.trim();
  if (!token) throw new Error("Unauthorized");

  return token;
}

function hasAnyScope(granted: readonly McpScope[], required: readonly McpScope[]) {
  if (required.length === 0) return true;
  return required.some((scope) => granted.includes(scope));
}

async function getOAuthIdentity(
  request: Request | undefined,
  requiredScopes: readonly McpScope[],
) {
  const token = getBearerToken(request);
  if (!token) return null;

  const payload = await verifyMcpAccessToken(token).catch(() => {
    throw new Error("Unauthorized");
  });
  if (!hasAnyScope(payload.scopes, requiredScopes)) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { email: true, id: true },
  });
  if (!user) {
    throw new Error("Unauthorized");
  }

  return {
    clientId: payload.clientId,
    scopes: payload.scopes,
    userEmail: user.email,
    userId: user.id,
  };
}

export async function getCurrentUser(
  request?: Request,
  requiredScopes: readonly McpScope[] = [],
) {
  const oauth = await getOAuthIdentity(request, requiredScopes);
  const userId = oauth?.userId;
  if (userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        person: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            image: true,
          },
        },
      },
    });
  }

  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    return null;
  }

  // Include the linked Person so display reads (handle / displayName /
  // image) work directly off the returned object. Returning the full User
  // row preserves account-level field access for callers that need it.
  return prisma.user.findUnique({
    where: { id: sessionUserId },
    include: {
      person: {
        select: {
          id: true,
          handle: true,
          displayName: true,
          image: true,
        },
      },
    },
  });
}

export async function requireAuth(
  request?: Request,
  requiredScopes: readonly McpScope[] = [],
) {
  const oauth = await getOAuthIdentity(request, requiredScopes);
  if (oauth) {
    return oauth;
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return {
    userId,
    userEmail: session.user.email,
  };
}
