import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTVerifyGetKey,
  type JWTPayload,
} from "jose";
import { McpScope } from "@optimitron/db/enums";
import { COURT_MCP_RESOURCE, COURT_MCP_SCOPES } from "./resources";

export interface CourtMcpAccessToken {
  sub: string;
  clientId: string;
  scopes: McpScope[];
  organizationIds: string[];
  resource: string;
}

export interface CourtMcpAuthContext {
  userId: string;
  clientId: string;
  grantId: string;
  isAdmin: boolean;
  scopes: McpScope[];
  resource: string;
}

function parseCourtPayload(
  payload: JWTPayload,
  resource: string,
): CourtMcpAccessToken {
  if (
    payload["type"] !== "access" ||
    payload["resource"] !== resource ||
    payload.aud !== resource ||
    typeof payload.sub !== "string" ||
    !payload.sub ||
    typeof payload["clientId"] !== "string" ||
    !payload["clientId"] ||
    !Array.isArray(payload["scopes"]) ||
    !payload["scopes"].every(
      (scope) =>
        typeof scope === "string" &&
        (COURT_MCP_SCOPES as readonly string[]).includes(scope),
    ) ||
    !Array.isArray(payload["organizationIds"]) ||
    payload["organizationIds"].length !== 0
  ) {
    throw new Error("Invalid Court MCP access token claims");
  }
  return {
    sub: payload.sub,
    clientId: payload["clientId"],
    scopes: payload["scopes"] as McpScope[],
    organizationIds: [],
    resource,
  };
}

export async function verifyCourtMcpAccessToken(
  token: string,
  options: { issuer: string; jwks: JWTVerifyGetKey; resource?: string },
): Promise<CourtMcpAccessToken> {
  const resource = options.resource ?? COURT_MCP_RESOURCE;
  const { payload } = await jwtVerify(token, options.jwks, {
    algorithms: ["RS256"],
    issuer: options.issuer,
    audience: resource,
    requiredClaims: ["exp", "iat", "sub", "aud"],
  });
  return parseCourtPayload(payload, resource);
}

/** The JWKS URL is pinned to the configured issuer, never token jku/x5u or request headers. */
export function createCourtMcpVerifier(options: {
  issuer: string;
  resource?: string;
}) {
  const jwks = createRemoteJWKSet(
    new URL("/.well-known/jwks.json", options.issuer),
  );
  return (token: string) =>
    verifyCourtMcpAccessToken(token, { ...options, jwks });
}

export interface CourtMcpGrantIdentity {
  userId: string;
  clientId: string;
  grantId: string;
  resource: string;
  scopes: readonly McpScope[];
  isAdmin: boolean;
}

/** Resolver must read a nondeleted user and an active, nonrevoked exact-resource grant. */
export async function authenticateCourtMcpRequest(
  request: Request,
  options: {
    verify: (token: string) => Promise<CourtMcpAccessToken>;
    resolveIdentity: (
      claims: CourtMcpAccessToken,
    ) => Promise<CourtMcpGrantIdentity | null>;
  },
): Promise<CourtMcpAuthContext> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer "))
    throw new Error("Missing MCP bearer token");
  const claims = await options.verify(authorization.slice(7));
  const identity = await options.resolveIdentity(claims);
  if (
    identity?.userId !== claims.sub ||
    identity.clientId !== claims.clientId ||
    identity.resource !== claims.resource
  ) {
    throw new Error("Inactive Court MCP authorization");
  }
  const scopes = claims.scopes.filter(
    (scope) =>
      identity.scopes.includes(scope) &&
      (scope !== McpScope.EARTHDATA_ADMIN || identity.isAdmin),
  );
  return {
    userId: claims.sub,
    clientId: claims.clientId,
    grantId: identity.grantId,
    isAdmin: identity.isAdmin,
    scopes,
    resource: claims.resource,
  };
}
