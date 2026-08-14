/**
 * OAuth 2.1 implementation for the Optimitron MCP server.
 *
 * Issues JWT access/refresh tokens backed by the existing NextAuth identity.
 * Client registrations and grants are persisted to the database.
 */

import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { ALL_WIRE_SCOPES, type McpScope } from "./mcp-scopes";
import {
  getAllSiteConfigs,
  getRequestSiteOrigin,
  isSiteVariantOverrideHost,
} from "./site";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Codex Desktop can retain an access token for the lifetime of a task instead
// of refreshing it. A one-day token keeps long-running tasks usable while the
// refresh token remains the durable, revocable credential.
const ACCESS_TOKEN_TTL = 24 * 60 * 60; // 1 day
const REFRESH_TOKEN_TTL = 180 * 24 * 60 * 60; // 180 days
const AUTH_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getSecret() {
  // Satellite MCP resource servers (apps/dfda) verify these tokens with the
  // same key, so their deployments must carry this project's NEXTAUTH_SECRET
  // value (apps/DEPLOYMENT.md). Decided 2026-08-14: one shared secret, no
  // separate MCP signing variable.
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export function getIssuerUrl(): string {
  // OAuth belongs to the Optimitron product even though the same Vercel
  // deployment serves campaign site variants. Production stays fixed to
  // the canonical issuer regardless of MCP_OAUTH_ISSUER so a variable
  // scoped to all Vercel environments cannot move it; the override only
  // applies to local/preview environments.
  if (process.env.VERCEL_ENV === "production") return "https://optimitron.com";
  if (process.env.MCP_OAUTH_ISSUER) return process.env.MCP_OAUTH_ISSUER;
  return (
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3001")
  );
}

/**
 * Issuers accepted when verifying MCP JWTs.
 *
 * Tokens are always minted with {@link getIssuerUrl}, but older production
 * tokens were signed with campaign hosts (especially warondisease.org) before
 * the issuer was pinned to optimitron.com. Accept those legacy hosts so
 * existing Cursor/Claude connectors keep working until they refresh.
 */
export function getAcceptedMcpIssuers(): string[] {
  const canonical = getIssuerUrl();
  if (process.env.VERCEL_ENV !== "production") return [canonical];

  const legacy = ["https://warondisease.org", "https://www.warondisease.org"];
  return Array.from(new Set([canonical, ...legacy]));
}

/** Consent + NextAuth for MCP OAuth always live on the canonical issuer. */
export function buildMcpConsentAuthorizeUrl(
  params: URLSearchParams | Record<string, string | null | undefined>,
): URL {
  const url = new URL("/mcp/authorize", getIssuerUrl());
  const entries =
    params instanceof URLSearchParams
      ? params.entries()
      : Object.entries(params);
  for (const [key, value] of entries) {
    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }
  return url;
}

export function buildMcpAuthorizeSignInPath(
  authorizeParams: Record<string, string | string[] | undefined>,
): string {
  const consentUrl = buildMcpConsentAuthorizeUrl(
    Object.fromEntries(
      Object.entries(authorizeParams).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ),
  );
  // Relative callback keeps login on the same browser origin. Absolute issuer
  // URLs break local loopback aliases (localhost vs 127.0.0.1) and drop the
  // session cookie after credentials succeed.
  const callbackPath = `${consentUrl.pathname}${consentUrl.search}`;
  return `/auth/signin?callbackUrl=${encodeURIComponent(callbackPath)}`;
}

/**
 * True when `/mcp/authorize` was hit on a campaign/variant host and must move
 * to the canonical issuer before NextAuth. Loopback alias mismatches
 * (localhost vs 127.0.0.1) are ignored so local dev does not redirect-loop.
 */
export function shouldRedirectMcpAuthorizeToIssuer(
  requestOrigin: string | null | undefined,
): boolean {
  const issuer = getIssuerUrl();
  if (!requestOrigin?.trim()) return false;
  try {
    const requestUrl = new URL(requestOrigin);
    const issuerUrl = new URL(issuer);
    if (requestUrl.origin === issuerUrl.origin) return false;
    if (
      isLoopbackHost(requestUrl.hostname) &&
      isLoopbackHost(issuerUrl.hostname)
    ) {
      return false;
    }
    return (
      SERVED_MCP_HOSTS.has(requestUrl.hostname.toLowerCase()) &&
      requestUrl.hostname.toLowerCase() !== issuerUrl.hostname.toLowerCase()
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Token signing / verification
// ---------------------------------------------------------------------------

export interface McpAccessTokenPayload {
  sub: string; // userId
  clientId: string;
  scopes: McpScope[];
  organizationIds: string[];
}

export async function signMcpAccessToken(
  userId: string,
  clientId: string,
  scopes: McpScope[],
  organizationIds: string[],
): Promise<string> {
  return new SignJWT({ clientId, organizationIds, scopes, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(getIssuerUrl())
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
    .sign(getSecret());
}

export async function signMcpRefreshToken(
  userId: string,
  clientId: string,
): Promise<string> {
  return new SignJWT({ clientId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(getIssuerUrl())
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_TTL}s`)
    .sign(getSecret());
}

export async function verifyMcpAccessToken(
  token: string,
): Promise<McpAccessTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: getAcceptedMcpIssuers(),
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

export async function verifyMcpRefreshToken(
  token: string,
): Promise<{ sub: string; clientId: string }> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: getAcceptedMcpIssuers(),
  });
  if (payload.type !== "refresh") {
    throw new Error("Not a refresh token");
  }
  return {
    sub: payload.sub!,
    clientId: payload.clientId as string,
  };
}

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------

export function verifyPkceChallenge(
  codeVerifier: string,
  codeChallenge: string,
): boolean {
  const hash = createHash("sha256").update(codeVerifier).digest("base64url");
  return hash === codeChallenge;
}

// Native MCP clients such as Codex use loopback redirects with ephemeral
// callback ports. RFC 8252 allows authorization servers to accept any port for
// loopback redirect URIs, while still matching the registered scheme/path.
function isLoopbackHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1"
  );
}

function isSameLoopbackRedirect(registeredUri: string, requestedUri: string) {
  try {
    const registered = new URL(registeredUri);
    const requested = new URL(requestedUri);
    return (
      isLoopbackHost(registered.hostname) &&
      isLoopbackHost(requested.hostname) &&
      registered.protocol === requested.protocol &&
      registered.pathname === requested.pathname &&
      registered.search === requested.search
    );
  } catch {
    return false;
  }
}

export function isRedirectUriAllowed(
  registeredUris: string[],
  requestedUri: string | null | undefined,
) {
  if (!requestedUri) return false;
  return registeredUris.some(
    (registeredUri) =>
      registeredUri === requestedUri ||
      isSameLoopbackRedirect(registeredUri, requestedUri),
  );
}

export function isAuthorizationCodeRedirectMatch(
  authorizedUri: string,
  tokenRequestUri: string,
) {
  if (authorizedUri === tokenRequestUri) return true;
  try {
    const authorized = new URL(authorizedUri);
    const requested = new URL(tokenRequestUri);
    return (
      isLoopbackHost(authorized.hostname) &&
      isLoopbackHost(requested.hostname) &&
      authorized.protocol === requested.protocol &&
      authorized.port === requested.port &&
      authorized.pathname === requested.pathname &&
      authorized.search === requested.search &&
      authorized.hash === requested.hash
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Refresh token hashing
// ---------------------------------------------------------------------------

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ---------------------------------------------------------------------------
// Random code generation
// ---------------------------------------------------------------------------

export function generateAuthCode(): string {
  return randomBytes(32).toString("base64url");
}

export function generateClientId(): string {
  return `mcp_${randomBytes(16).toString("hex")}`;
}

// ---------------------------------------------------------------------------
// OAuth metadata
// ---------------------------------------------------------------------------

export function getOAuthMetadata() {
  const issuer = getIssuerUrl();
  return {
    issuer,
    authorization_endpoint: `${issuer}/api/mcp/oauth/authorize`,
    token_endpoint: `${issuer}/api/mcp/oauth/token`,
    registration_endpoint: `${issuer}/api/mcp/oauth/register`,
    revocation_endpoint: `${issuer}/api/mcp/oauth/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: ALL_WIRE_SCOPES,
  };
}

// One Vercel project serves every site variant (optimitron.com,
// warondisease.org, dfda.earth, dih.earth). RFC 9728 requires the advertised
// `resource` to equal the URL the client actually dialed, so a single
// env-derived value made every host claim to be NEXTAUTH_URL and spec-compliant
// clients refused it ("Protected resource ... does not match expected").
// The resource identity is therefore per-request. The authorization server
// stays canonical: NextAuth sessions, the consent screen, and token issuance
// only exist on one origin, and RFC 9728 explicitly allows the resource and
// its authorization server to differ.
const SERVED_MCP_HOSTS = new Set(
  getAllSiteConfigs().flatMap((site) =>
    site.domains.map((domain) => domain.toLowerCase()),
  ),
);

// Reflecting an unrecognized Host header would let a caller mint metadata
// advertising a resource identity this deployment does not own, so unknown
// hosts fall back to the canonical origin instead.
export function resolveMcpResourceOrigin(
  requestOrigin: string | null | undefined,
): string {
  const canonical = getIssuerUrl();
  if (!requestOrigin?.trim()) return canonical;

  let parsed: URL;
  try {
    parsed = new URL(requestOrigin);
  } catch {
    return canonical;
  }

  if (
    SERVED_MCP_HOSTS.has(parsed.hostname.toLowerCase()) ||
    isSiteVariantOverrideHost(parsed.host)
  ) {
    return parsed.origin;
  }

  return canonical;
}

export function getMcpRequestOrigin(req: Request): string {
  return resolveMcpResourceOrigin(
    getRequestSiteOrigin({
      forwardedHost: req.headers.get("x-forwarded-host"),
      forwardedProto: req.headers.get("x-forwarded-proto"),
      host: req.headers.get("host"),
    }),
  );
}

export function getProtectedResourceMetadata(requestOrigin?: string | null) {
  const resourceOrigin = resolveMcpResourceOrigin(requestOrigin);
  return {
    resource: `${resourceOrigin}/api/mcp`,
    authorization_servers: [getIssuerUrl()],
    scopes_supported: ALL_WIRE_SCOPES,
    bearer_methods_supported: ["header"],
    resource_name: "Optimitron MCP Server",
    resource_documentation: `${resourceOrigin}/mcp`,
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL, AUTH_CODE_TTL_MS };
