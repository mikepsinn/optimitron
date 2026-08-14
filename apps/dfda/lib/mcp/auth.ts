/**
 * Resource-server side of MCP OAuth for dfda.earth.
 *
 * dfda.earth never issues tokens. optimitron.com is the OAuth 2.1
 * authorization server; this module only verifies the Bearer JWTs it minted.
 * Reference implementation: packages/web/src/lib/mcp-oauth.ts — keep the
 * issuer list and payload checks in sync with it.
 */
import type { McpScope } from "@optimitron/db/enums";
import { jwtVerify } from "jose";

export const CANONICAL_ISSUER = "https://optimitron.com";

/**
 * Tokens are HS256 JWTs. The signing secret must match the authorization
 * server's: set MCP_TOKEN_SECRET to the same value on the optimitron web
 * project and this app. NEXTAUTH_SECRET is the legacy fallback the web
 * project signed with before MCP_TOKEN_SECRET existed — locally both apps
 * read one root .env, so the fallback just works.
 */
function getMcpTokenSecret() {
  const secret = process.env.MCP_TOKEN_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("MCP_TOKEN_SECRET (or NEXTAUTH_SECRET) is not set");
  }
  return new TextEncoder().encode(secret);
}

export function getIssuerUrl(): string {
  if (process.env.VERCEL_ENV === "production") return CANONICAL_ISSUER;
  if (process.env.MCP_OAUTH_ISSUER) return process.env.MCP_OAUTH_ISSUER;
  // Local dev: the optimitron web app issues tokens from port 3001.
  return "http://localhost:3001";
}

/** Mirrors getAcceptedMcpIssuers in packages/web/src/lib/mcp-oauth.ts. */
function getAcceptedIssuers(): string[] {
  const canonical = getIssuerUrl();
  if (process.env.VERCEL_ENV !== "production") return [canonical];
  return Array.from(
    new Set([
      canonical,
      "https://warondisease.org",
      "https://www.warondisease.org",
    ]),
  );
}

export interface McpAccessTokenPayload {
  clientId: string;
  organizationIds: string[];
  scopes: McpScope[];
  sub: string;
}

export async function verifyMcpAccessToken(
  token: string,
): Promise<McpAccessTokenPayload> {
  const { payload } = await jwtVerify(token, getMcpTokenSecret(), {
    issuer: getAcceptedIssuers(),
  });
  if (payload.type !== "access") {
    throw new Error("Not an access token");
  }
  if (
    !Array.isArray(payload.organizationIds) ||
    !payload.organizationIds.every((value) => typeof value === "string")
  ) {
    throw new Error("Access token is missing its organization allowlist");
  }
  return {
    sub: payload.sub!,
    clientId: payload.clientId as string,
    organizationIds: payload.organizationIds,
    scopes: payload.scopes as McpScope[],
  };
}

/** Origin the client actually dialed, honoring Vercel/proxy forwarding headers. */
export function getRequestOrigin(req: Request): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost ?? req.headers.get("host");
  if (host) {
    const proto =
      req.headers.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return new URL(req.url).origin;
}
