import {
  authenticateCourtMcpRequest,
  createCourtMcpVerifier,
} from "@optimitron/mcp/auth";
import { courtMcpResource } from "@optimitron/mcp/resources";
import { prisma } from "@/lib/prisma";

export function courtMcpConfig() {
  return {
    issuer:
      process.env.VERCEL_ENV === "production"
        ? "https://optimitron.com"
        : (process.env.MCP_OAUTH_ISSUER ?? "https://optimitron.com"),
    resource: courtMcpResource(
      process.env.VERCEL_ENV,
      process.env.MCP_COURT_RESOURCE,
    ),
  };
}

let cachedVerifier:
  | { key: string; verify: ReturnType<typeof createCourtMcpVerifier> }
  | undefined;

export function authenticateCourtRequest(request: Request) {
  const config = courtMcpConfig();
  const key = `${config.issuer}|${config.resource}`;
  if (cachedVerifier?.key !== key)
    cachedVerifier = { key, verify: createCourtMcpVerifier(config) };
  return authenticateCourtMcpRequest(request, {
    verify: cachedVerifier.verify,
    resolveIdentity: async (claims) => {
      const [user, grant] = await Promise.all([
        prisma.user.findFirst({
          where: { id: claims.sub, deletedAt: null },
          select: { id: true, isAdmin: true },
        }),
        prisma.oAuthGrant.findFirst({
          where: {
            userId: claims.sub,
            clientId: claims.clientId,
            resource: config.resource,
            active: true,
            revokedAt: null,
          },
          select: { id: true, scopes: true },
        }),
      ]);
      return user && grant
        ? {
            userId: user.id,
            clientId: claims.clientId,
            grantId: grant.id,
            resource: config.resource,
            scopes: grant.scopes,
            isAdmin: user.isAdmin === true,
          }
        : null;
    },
  });
}

export function courtResourceMetadata() {
  const { issuer, resource } = courtMcpConfig();
  return {
    resource,
    authorization_servers: [issuer],
    scopes_supported: ["earthdata:write", "earthdata:admin"],
    bearer_methods_supported: ["header"],
    resource_name: "Court of Humanity MCP",
    resource_documentation: new URL("/mcp", resource).href,
  };
}
