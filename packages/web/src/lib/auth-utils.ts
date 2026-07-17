import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyMcpAccessToken } from "@/lib/mcp-oauth";
import { McpScope } from "@/lib/mcp-scopes";
import { prisma } from "@/lib/prisma";
import type { TaskClientAccessBoundary } from "@/lib/tasks/task-visibility.server";

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
  const [user, grant] = await Promise.all([
    prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: { email: true, id: true },
    }),
    prisma.oAuthGrant.findFirst({
      where: {
        active: true,
        clientId: payload.clientId,
        revokedAt: null,
        userId: payload.sub,
      },
      select: { organizationIds: true, scopes: true },
    }),
  ]);
  if (!user || !grant) {
    throw new Error("Unauthorized");
  }
  const activeScopes = payload.scopes.filter((scope) =>
    grant.scopes.includes(scope),
  );
  if (!hasAnyScope(activeScopes, requiredScopes)) {
    throw new Error("Unauthorized");
  }

  const tokenOrganizationIds = payload.organizationIds ?? [];
  const currentMemberships =
    tokenOrganizationIds.length === 0
      ? []
      : await prisma.organizationMember.findMany({
          where: {
            organizationId: { in: tokenOrganizationIds },
            organization: { deletedAt: null },
            userId: user.id,
          },
          select: { organizationId: true },
        });
  const grantedOrganizationIds = new Set(grant.organizationIds ?? []);
  const currentOrganizationIds = new Set(
    currentMemberships.map((membership) => membership.organizationId),
  );
  const organizationIds = tokenOrganizationIds.filter(
    (organizationId) =>
      grantedOrganizationIds.has(organizationId) &&
      currentOrganizationIds.has(organizationId),
  );

  return {
    clientId: payload.clientId,
    organizationIds,
    scopes: activeScopes,
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
    return prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
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
  return prisma.user.findFirst({
    where: { id: sessionUserId, deletedAt: null },
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

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { email: true, id: true },
  });
  if (!user) throw new Error("Unauthorized");

  return { userId: user.id, userEmail: user.email };
}

export const TASK_CLIENT_SCOPES = [
  McpScope.TASKS_PERSONAL,
  McpScope.TASKS_ORGANIZATION,
  McpScope.TASKS_ADMIN,
] as const;

/** Same boundary derivation as the MCP handlers (getMcpTaskClientBoundary):
 * private-personal access needs tasks:personal, org access needs
 * tasks:organization plus the org in the token's allowlist. */
function taskBoundaryFromScopes(
  scopes: readonly McpScope[],
  organizationIds: readonly string[],
): TaskClientAccessBoundary {
  return {
    allowPersonalPrivate: scopes.includes(McpScope.TASKS_PERSONAL),
    organizationIds: scopes.includes(McpScope.TASKS_ORGANIZATION)
      ? organizationIds
      : [],
  };
}

/**
 * Auth for REST routes that read or mutate tasks. Bearer clients resolve to
 * the user plus the client access boundary from their grant; session users
 * act as themselves with no boundary.
 */
export async function requireTaskRequestAuth(
  request: Request,
  requiredScopes: readonly McpScope[] = TASK_CLIENT_SCOPES,
): Promise<{
  clientAccessBoundary?: TaskClientAccessBoundary;
  userId: string;
}> {
  const auth = await requireAuth(request, requiredScopes);
  if (!("scopes" in auth)) {
    return { userId: auth.userId };
  }
  return {
    clientAccessBoundary: taskBoundaryFromScopes(
      auth.scopes,
      auth.organizationIds,
    ),
    userId: auth.userId,
  };
}

/** Like requireTaskRequestAuth, but anonymous/session-less requests resolve
 * to a null user instead of throwing — for routes with public GET access. */
export async function getTaskRequestIdentity(
  request: Request,
  requiredScopes: readonly McpScope[] = TASK_CLIENT_SCOPES,
): Promise<{
  clientAccessBoundary?: TaskClientAccessBoundary;
  userId: string | null;
}> {
  if (hasBearerAuthorization(request)) {
    return requireTaskRequestAuth(request, requiredScopes);
  }
  const session = await getServerSession(authOptions);
  return { userId: session?.user?.id ?? null };
}
