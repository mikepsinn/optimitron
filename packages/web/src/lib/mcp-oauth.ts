/**
 * OAuth 2.1 implementation for the Optimitron MCP server.
 *
 * Issues JWT access/refresh tokens backed by the existing NextAuth identity.
 * Client registrations and grants are persisted to the database.
 */

import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { ALL_WIRE_SCOPES, type McpScope } from "./mcp-scopes";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ACCESS_TOKEN_TTL = 60 * 60; // 1 hour
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days
const AUTH_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

function getIssuerUrl(): string {
  // Use NEXTAUTH_URL in dev, or infer from Vercel
  return (
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3001")
  );
}

// ---------------------------------------------------------------------------
// Token signing / verification
// ---------------------------------------------------------------------------

export interface McpAccessTokenPayload {
  sub: string; // userId
  clientId: string;
  scopes: McpScope[];
}

export async function signMcpAccessToken(
  userId: string,
  clientId: string,
  scopes: McpScope[],
): Promise<string> {
  return new SignJWT({ clientId, scopes, type: "access" })
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
    issuer: getIssuerUrl(),
  });
  if (payload.type !== "access") {
    throw new Error("Not an access token");
  }
  return {
    sub: payload.sub!,
    clientId: payload.clientId as string,
    scopes: payload.scopes as McpScope[],
  };
}

export async function verifyMcpRefreshToken(
  token: string,
): Promise<{ sub: string; clientId: string }> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: getIssuerUrl(),
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

export function getProtectedResourceMetadata() {
  const issuer = getIssuerUrl();
  return {
    resource: `${issuer}/api/mcp`,
    authorization_servers: [issuer],
    scopes_supported: ALL_WIRE_SCOPES,
    bearer_methods_supported: ["header"],
    resource_name: "Optimitron MCP Server",
    resource_documentation: `${issuer}/mcp`,
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL, AUTH_CODE_TTL_MS };
