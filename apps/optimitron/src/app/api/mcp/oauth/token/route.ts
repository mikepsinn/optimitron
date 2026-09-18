import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPkceChallenge,
  signMcpAccessToken,
  signMcpRefreshToken,
  verifyMcpRefreshToken,
  hashRefreshToken,
  isAuthorizationCodeRedirectMatch,
  ACCESS_TOKEN_TTL,
} from "@/lib/mcp-oauth";
import { scopesToWire } from "@/lib/mcp-scopes";
import {
  resolveOAuthResource,
  LEGACY_MCP_RESOURCE,
  signCourtMcpToken,
  verifyCourtMcpRefreshToken,
  filterCourtMcpScopes,
} from "@/lib/mcp-court-oauth";

export async function POST(req: Request) {
  try {
    const body = await req.formData().catch(() => null);
    const params = body ? Object.fromEntries(body.entries()) : await req.json();
    let resource: string;
    try {
      if (body && body.getAll("resource").length > 1)
        throw new Error("Multiple resources");
      resource = resolveOAuthResource(params.resource);
    } catch {
      return NextResponse.json({ error: "invalid_target" }, { status: 400 });
    }

    const grantType = params.grant_type as string;

    if (grantType === "authorization_code") {
      return await handleAuthorizationCode(params, resource);
    }
    if (grantType === "refresh_token") {
      return await handleRefreshToken(params, resource);
    }

    return NextResponse.json(
      { error: "unsupported_grant_type" },
      { status: 400 },
    );
  } catch {
    // Never echo internal error text (Prisma/config details) to an
    // unauthenticated token-endpoint caller.
    console.error("[oauth/token] unexpected failure");
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

async function handleAuthorizationCode(
  params: Record<string, unknown>,
  resource: string,
) {
  const code = params.code as string;
  const clientId = params.client_id as string;
  const redirectUri = params.redirect_uri as string;
  const codeVerifier = params.code_verifier as string;

  if (!code || !clientId || !redirectUri || !codeVerifier) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description:
          "code, client_id, redirect_uri, and code_verifier are required",
      },
      { status: 400 },
    );
  }

  // Look up the auth code
  const authCode = await prisma.oAuthAuthCode.findUnique({
    where: { code },
  });

  if (!authCode || authCode.resource !== resource) {
    return NextResponse.json(
      {
        error: "invalid_grant",
        error_description: "Invalid authorization code",
      },
      { status: 400 },
    );
  }

  // Validate the code
  if (authCode.used) {
    return NextResponse.json(
      {
        error: "invalid_grant",
        error_description: "Authorization code already used",
      },
      { status: 400 },
    );
  }

  if (authCode.expiresAt < new Date()) {
    return NextResponse.json(
      {
        error: "invalid_grant",
        error_description: "Authorization code expired",
      },
      { status: 400 },
    );
  }

  if (authCode.clientId !== clientId) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "client_id mismatch" },
      { status: 400 },
    );
  }

  if (!isAuthorizationCodeRedirectMatch(authCode.redirectUri, redirectUri)) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "redirect_uri mismatch" },
      { status: 400 },
    );
  }

  // Verify PKCE
  if (!verifyPkceChallenge(codeVerifier, authCode.codeChallenge)) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "PKCE verification failed" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findFirst({
    where: { id: authCode.userId, deletedAt: null },
    select: { isAdmin: true },
  });
  if (!user)
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });

  // Issue tokens
  const isCourt = resource !== LEGACY_MCP_RESOURCE;
  const scopes = isCourt
    ? filterCourtMcpScopes(authCode.scopes, user.isAdmin)
    : authCode.scopes;
  const organizationIds = isCourt ? [] : authCode.organizationIds;
  const accessToken = isCourt
    ? await signCourtMcpToken({
        userId: authCode.userId,
        clientId,
        scopes,
        type: "access",
      })
    : await signMcpAccessToken(
        authCode.userId,
        clientId,
        scopes,
        organizationIds,
      );
  const refreshToken = isCourt
    ? await signCourtMcpToken({
        userId: authCode.userId,
        clientId,
        type: "refresh",
      })
    : await signMcpRefreshToken(authCode.userId, clientId);

  // Claim the code and write its exact-resource grant atomically. Concurrent
  // exchanges cannot both succeed, and a failed grant write leaves it unused.
  const consumed = await prisma.$transaction(async (tx) => {
    const claimed = await tx.oAuthAuthCode.updateMany({
      where: {
        id: authCode.id,
        resource,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: { used: true },
    });
    if (claimed.count !== 1) return false;
    const existingGrant = await tx.oAuthGrant.findFirst({
      where: { clientId, userId: authCode.userId, resource },
      select: { id: true },
    });
    const grantData = {
      scopes,
      organizationIds,
      refreshTokenHash: hashRefreshToken(refreshToken),
      active: true,
      revokedAt: null,
    };
    // Do not let native upsert select the old (clientId,userId) unique index
    // while both phase-one uniqueness constraints coexist.
    if (existingGrant) {
      await tx.oAuthGrant.update({
        where: { id: existingGrant.id, resource },
        data: grantData,
      });
    } else {
      await tx.oAuthGrant.create({
        data: { clientId, userId: authCode.userId, resource, ...grantData },
      });
    }
    return true;
  });
  if (!consumed)
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });

  return NextResponse.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL,
    refresh_token: refreshToken,
    scope: scopesToWire(scopes),
  });
}

async function handleRefreshToken(
  params: Record<string, unknown>,
  resource: string,
) {
  const refreshToken = params.refresh_token as string;
  const clientId = params.client_id as string;

  if (!refreshToken) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "refresh_token is required",
      },
      { status: 400 },
    );
  }

  // Verify the JWT
  let tokenPayload: { sub: string; clientId: string };
  try {
    tokenPayload =
      resource === LEGACY_MCP_RESOURCE
        ? await verifyMcpRefreshToken(refreshToken)
        : await verifyCourtMcpRefreshToken(refreshToken);
  } catch {
    return NextResponse.json(
      {
        error: "invalid_grant",
        error_description: "Invalid or expired refresh token",
      },
      { status: 400 },
    );
  }

  if (clientId && tokenPayload.clientId !== clientId) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "client_id mismatch" },
      { status: 400 },
    );
  }

  const grant = await prisma.oAuthGrant.findFirst({
    where: {
      refreshTokenHash: hashRefreshToken(refreshToken),
      resource,
      clientId: tokenPayload.clientId,
      userId: tokenPayload.sub,
      revokedAt: null,
      active: true,
    },
  });

  if (!grant || !grant.active) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Grant has been revoked" },
      { status: 400 },
    );
  }
  const user = await prisma.user.findFirst({
    where: { id: grant.userId, deletedAt: null },
    select: { isAdmin: true },
  });
  if (!user)
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });

  // Issue new tokens
  const isCourt = resource !== LEGACY_MCP_RESOURCE;
  const scopes = isCourt
    ? filterCourtMcpScopes(grant.scopes, user.isAdmin)
    : grant.scopes;
  const newAccessToken = isCourt
    ? await signCourtMcpToken({
        userId: grant.userId,
        clientId: grant.clientId,
        scopes,
        type: "access",
      })
    : await signMcpAccessToken(
        grant.userId,
        grant.clientId,
        scopes,
        grant.organizationIds,
      );

  return NextResponse.json({
    access_token: newAccessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL,
    // Codex Desktop caches credentials per task. Keeping the refresh token
    // stable prevents one task's refresh from invalidating every other task.
    refresh_token: refreshToken,
    scope: scopesToWire(scopes),
  });
}
