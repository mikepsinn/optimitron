import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildMcpConsentAuthorizeUrl,
  isRedirectUriAllowed,
} from "@/lib/mcp-oauth";

/**
 * OAuth authorization endpoint. Validates the request parameters and redirects
 * to the consent page where the user can authorize/deny access.
 *
 * Consent always lives on the canonical Optimitron issuer origin, even when
 * the client discovered MCP on a campaign host like warondisease.org. Mixing
 * those hosts breaks NextAuth cookies and the post-login return to consent.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientId = url.searchParams.get("client_id");
  const redirectUri = url.searchParams.get("redirect_uri");
  const responseType = url.searchParams.get("response_type");
  const state = url.searchParams.get("state");
  const scope = url.searchParams.get("scope");
  const codeChallenge = url.searchParams.get("code_challenge");
  const codeChallengeMethod = url.searchParams.get("code_challenge_method");

  // Validate required parameters
  if (responseType !== "code") {
    return NextResponse.json(
      { error: "unsupported_response_type" },
      { status: 400 },
    );
  }

  if (!clientId || !redirectUri || !codeChallenge) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description:
          "client_id, redirect_uri, and code_challenge are required",
      },
      { status: 400 },
    );
  }

  if (codeChallengeMethod && codeChallengeMethod !== "S256") {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "Only S256 code_challenge_method is supported",
      },
      { status: 400 },
    );
  }

  // Validate client exists and redirect_uri is registered
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });

  if (!client) {
    return NextResponse.json(
      { error: "invalid_client", error_description: "Unknown client_id" },
      { status: 400 },
    );
  }

  if (!isRedirectUriAllowed(client.redirectUris, redirectUri)) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "redirect_uri not registered for this client",
      },
      { status: 400 },
    );
  }

  const consentUrl = buildMcpConsentAuthorizeUrl({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope,
    code_challenge: codeChallenge,
    client_name: client.clientName ?? clientId,
  });

  return NextResponse.redirect(consentUrl.toString());
}
