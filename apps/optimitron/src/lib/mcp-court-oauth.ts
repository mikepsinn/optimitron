import { randomUUID } from "node:crypto";
import {
  createLocalJWKSet,
  importPKCS8,
  jwtVerify,
  SignJWT,
  type JWK,
} from "jose";
import {
  COURT_MCP_RESOURCE,
  COURT_MCP_RESOURCE_NAME,
  COURT_MCP_SCOPES,
  courtMcpResource,
  LEGACY_MCP_RESOURCE,
} from "@optimitron/mcp/resources";
import { McpScope } from "@optimitron/db/enums";
import { getIssuerUrl, ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from "./mcp-oauth";
import { getAllSiteConfigs } from "./site";

export { LEGACY_MCP_RESOURCE };

export function getCourtMcpResource() {
  return courtMcpResource(
    process.env.VERCEL_ENV,
    process.env.MCP_COURT_RESOURCE,
  );
}

export function isCourtMcpEnabled() {
  return process.env.MCP_COURT_RESOURCE_ENABLED === "1";
}

/** Legacy clients keep their existing shared grant. Court opts into an exact resource. */
export function resolveOAuthResource(
  value: unknown,
  allowDisabledCourt = false,
): string {
  if (value == null || value === "") return LEGACY_MCP_RESOURCE;
  if (typeof value !== "string") throw new Error("Invalid OAuth resource");
  const courtResource =
    process.env.VERCEL_ENV === "production" || process.env.MCP_COURT_RESOURCE
      ? getCourtMcpResource()
      : null;
  if (value === courtResource) {
    if (!allowDisabledCourt && !isCourtMcpEnabled())
      throw new Error("Court MCP authorization is not enabled");
    return value;
  }
  if (value === COURT_MCP_RESOURCE)
    throw new Error("Court MCP resource does not match this environment");
  const legacyResources = new Set([
    `${getIssuerUrl()}/api/mcp`,
    ...getAllSiteConfigs().flatMap((site) =>
      site.domains.map((domain) => `https://${domain}/api/mcp`),
    ),
  ]);
  const issuer = new URL(getIssuerUrl());
  const loopbackHosts = ["localhost", "127.0.0.1", "[::1]"];
  if (loopbackHosts.includes(issuer.hostname)) {
    for (const hostname of loopbackHosts) {
      const alias = new URL("/api/mcp", issuer);
      alias.hostname = hostname;
      legacyResources.add(alias.toString());
      // dFDA's local MCP server runs on 3011, separately from the OAuth issuer.
      legacyResources.add(`http://${hostname}:3011/api/mcp`);
    }
  }
  if (legacyResources.has(value)) return LEGACY_MCP_RESOURCE;
  throw new Error("Unknown OAuth resource");
}

/**
 * Site name to show on the consent screen, given a resolved OAuth resource.
 *
 * Only an isolated resource gets a name. The legacy resource is one shared
 * grant across Optimitron and every legacy site, so naming a single site would
 * tell the user the grant is narrower than it is.
 */
export function resolveOAuthResourceName(resource: string): string | null {
  // resolveOAuthResource returns either the legacy sentinel or Court's resource.
  return resource === LEGACY_MCP_RESOURCE ? null : COURT_MCP_RESOURCE_NAME;
}

export function filterCourtMcpScopes(
  scopes: readonly McpScope[],
  isAdmin: boolean,
): McpScope[] {
  return scopes.filter(
    (scope) =>
      (COURT_MCP_SCOPES as readonly string[]).includes(scope) &&
      (scope !== McpScope.EARTHDATA_ADMIN || isAdmin),
  );
}

/** Project only public RSA members even if a misconfigured JWKS contains private material. */
export function getCourtPublicJwks(): { keys: JWK[] } {
  const configured = process.env.MCP_COURT_SIGNING_PUBLIC_JWKS;
  if (!configured) {
    if (isCourtMcpEnabled())
      throw new Error("Court MCP public JWKS is missing");
    return { keys: [] };
  }
  const parsed = JSON.parse(configured) as { keys?: JWK[] };
  if (!Array.isArray(parsed.keys) || parsed.keys.length === 0)
    throw new Error("Invalid Court MCP JWKS");
  const seen = new Set<string>();
  return {
    keys: parsed.keys.map((key) => {
      if (
        key.kty !== "RSA" ||
        !key.kid ||
        !key.n ||
        !key.e ||
        seen.has(key.kid)
      ) {
        throw new Error("Invalid Court MCP public signing key");
      }
      seen.add(key.kid);
      return {
        kty: "RSA",
        kid: key.kid,
        n: key.n,
        e: key.e,
        alg: "RS256",
        use: "sig",
      };
    }),
  };
}

export async function signCourtMcpToken(input: {
  userId: string;
  clientId: string;
  type: "access" | "refresh";
  scopes?: McpScope[];
}) {
  if (!isCourtMcpEnabled())
    throw new Error("Court MCP authorization is not enabled");
  const pem = process.env.MCP_COURT_SIGNING_PRIVATE_KEY;
  const kid = process.env.MCP_COURT_SIGNING_KEY_ID;
  if (
    !pem ||
    !kid ||
    !getCourtPublicJwks().keys.some((key) => key.kid === kid)
  ) {
    throw new Error("Court MCP signing configuration is incomplete");
  }
  const resource = getCourtMcpResource();
  const privateKey = await importPKCS8(pem.replace(/\\n/g, "\n"), "RS256");
  const token = await new SignJWT({
    clientId: input.clientId,
    type: input.type,
    resource,
    ...(input.type === "access"
      ? { scopes: input.scopes ?? [], organizationIds: [] }
      : {}),
  })
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuer(getIssuerUrl())
    .setSubject(input.userId)
    .setAudience(resource)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(
      `${input.type === "access" ? ACCESS_TOKEN_TTL : REFRESH_TOKEN_TTL}s`,
    )
    .sign(privateKey);
  // Detect mismatched configured public/private keys before returning a credential.
  await jwtVerify(token, createLocalJWKSet(getCourtPublicJwks()), {
    algorithms: ["RS256"],
    issuer: getIssuerUrl(),
    audience: resource,
  });
  return token;
}

export async function verifyCourtMcpRefreshToken(token: string) {
  if (!isCourtMcpEnabled())
    throw new Error("Court MCP authorization is not enabled");
  const resource = getCourtMcpResource();
  const { payload } = await jwtVerify(
    token,
    createLocalJWKSet(getCourtPublicJwks()),
    {
      algorithms: ["RS256"],
      issuer: getIssuerUrl(),
      audience: resource,
      requiredClaims: ["exp", "iat", "sub", "aud"],
    },
  );
  if (
    payload.type !== "refresh" ||
    payload.resource !== resource ||
    payload.aud !== resource ||
    typeof payload.sub !== "string" ||
    !payload.sub ||
    typeof payload.clientId !== "string" ||
    !payload.clientId
  ) {
    throw new Error("Invalid Court MCP refresh token claims");
  }
  return { sub: payload.sub, clientId: payload.clientId, resource };
}
