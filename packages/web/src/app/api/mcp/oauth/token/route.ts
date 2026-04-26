import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPkceChallenge,
  signMcpAccessToken,
  signMcpRefreshToken,
  verifyMcpRefreshToken,
  hashRefreshToken,
  ACCESS_TOKEN_TTL,
} from "@/lib/mcp-oauth";
import { scopesToWire } from "@/lib/mcp-scopes";

export async function POST(req: Request) {
  try {
    const body = await req.formData().catch(() => null);
    const params = body
      ? Object.fromEntries(body.entries())
      : await req.json();

    const grantType = params.grant_type as string;

    if (grantType === "authorization_code") {
      return handleAuthorizationCode(params);
    }
    if (grantType === "refresh_token") {
      return handleRefreshToken(params);
    }

    return NextResponse.json(
      { error: "unsupported_grant_type" },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "server_error", error_description: message },
      { status: 500 },
    );
  }
}

async function handleAuthorizationCode(
  params: Record<string, unknown>,
) {
  const code = params.code as string;
  const clientId = params.client_id as string;
  const redirectUri = params.redirect_uri as string;
  const codeVerifier = params.code_verifier as string;

  if (!code || !clientId || !codeVerifier) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "code, client_id, and code_verifier are required" },
      { status: 400 },
    );
  }

  // Look up the auth code
  const authCode = await prisma.oAuthAuthCode.findUnique({
    where: { code },
  });

  if (!authCode) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Invalid authorization code" },
      { status: 400 },
    );
  }

  // Validate the code
  if (authCode.used) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Authorization code already used" },
      { status: 400 },
    );
  }

  if (authCode.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Authorization code expired" },
      { status: 400 },
    );
  }

  if (authCode.clientId !== clientId) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "client_id mismatch" },
      { status: 400 },
    );
  }

  if (redirectUri && authCode.redirectUri !== redirectUri) {
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

  // Mark code as used
  await prisma.oAuthAuthCode.update({
    where: { id: authCode.id },
    data: { used: true },
  });

  // Issue tokens
  const scopes = authCode.scopes;
  const accessToken = await signMcpAccessToken(authCode.userId, clientId, scopes);
  const refreshToken = await signMcpRefreshToken(authCode.userId, clientId);

  // Upsert grant record
  await prisma.oAuthGrant.upsert({
    where: {
      clientId_userId: { clientId, userId: authCode.userId },
    },
    create: {
      clientId,
      userId: authCode.userId,
      scopes,
      refreshTokenHash: hashRefreshToken(refreshToken),
      active: true,
    },
    update: {
      scopes,
      refreshTokenHash: hashRefreshToken(refreshToken),
      active: true,
      revokedAt: null,
    },
  });

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
) {
  const refreshToken = params.refresh_token as string;
  const clientId = params.client_id as string;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "refresh_token is required" },
      { status: 400 },
    );
  }

  // Verify the JWT
  let tokenPayload: { sub: string; clientId: string };
  try {
    tokenPayload = await verifyMcpRefreshToken(refreshToken);
  } catch {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Invalid or expired refresh token" },
      { status: 400 },
    );
  }

  if (clientId && tokenPayload.clientId !== clientId) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "client_id mismatch" },
      { status: 400 },
    );
  }

  // Check the grant is still active
  const grant = await prisma.oAuthGrant.findUnique({
    where: {
      refreshTokenHash: hashRefreshToken(refreshToken),
    },
  });

  if (!grant || !grant.active) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Grant has been revoked" },
      { status: 400 },
    );
  }

  // Issue new tokens
  const scopes = grant.scopes;
  const newAccessToken = await signMcpAccessToken(grant.userId, grant.clientId, scopes);
  const newRefreshToken = await signMcpRefreshToken(grant.userId, grant.clientId);

  // Rotate refresh token
  await prisma.oAuthGrant.update({
    where: { id: grant.id },
    data: { refreshTokenHash: hashRefreshToken(newRefreshToken) },
  });

  return NextResponse.json({
    access_token: newAccessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL,
    refresh_token: newRefreshToken,
    scope: scopesToWire(scopes),
  });
}
