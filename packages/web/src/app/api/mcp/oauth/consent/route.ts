import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAuthCode, AUTH_CODE_TTL_MS, isRedirectUriAllowed } from "@/lib/mcp-oauth";
import {
  filterAllowedMcpScopes,
  isHumanApprovalOAuthRedirectUri,
  McpScope,
  scopesFromWire,
} from "@/lib/mcp-scopes";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const clientId = body.client_id as string;
  const redirectUri = body.redirect_uri as string;
  const state = body.state as string | null;
  const scope = body.scope as string;
  const codeChallenge = body.code_challenge as string;
  const approved = body.approved as boolean;
  const requestedOrganizationIds = Array.isArray(body.organization_ids)
    ? Array.from(
        new Set(
          body.organization_ids.filter(
            (value: unknown): value is string =>
              typeof value === "string" && value.trim().length > 0,
          ),
        ),
      )
    : [];

  if (!approved) {
    const url = new URL(redirectUri);
    url.searchParams.set("error", "access_denied");
    if (state) url.searchParams.set("state", state);
    return NextResponse.json({ redirect_url: url.toString() });
  }

  // Verify client exists
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });

  if (!client) {
    return NextResponse.json({ error: "Unknown client" }, { status: 400 });
  }

  if (!isRedirectUriAllowed(client.redirectUris, redirectUri)) {
    return NextResponse.json({ error: "Invalid redirect_uri" }, { status: 400 });
  }

  // Filter to known and user-allowed scopes. Unknown strings are silently
  // dropped by scopesFromWire. Public read/manual search tools need no scope.
  const code = generateAuthCode();
  const requestedScopes = scopesFromWire(scope);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });
  const scopes = filterAllowedMcpScopes(requestedScopes, user?.isAdmin === true, {
    allowHumanApproval: isHumanApprovalOAuthRedirectUri(redirectUri),
  });

  if (scopes.length === 0) {
    return NextResponse.json(
      { error: "invalid_scope", error_description: "At least one valid scope is required" },
      { status: 400 },
    );
  }

  let organizationIds: string[] = [];
  if (scopes.includes(McpScope.TASKS_ORGANIZATION)) {
    if (requestedOrganizationIds.length === 0) {
      return NextResponse.json(
        {
          error: "invalid_scope",
          error_description:
            "Select at least one organization or remove tasks:organization.",
        },
        { status: 400 },
      );
    }
    const memberships = await prisma.organizationMember.findMany({
      where: {
        organizationId: { in: requestedOrganizationIds },
        organization: { deletedAt: null },
        userId: session.user.id,
      },
      select: { organizationId: true },
    });
    const membershipIds = new Set(
      memberships.map((membership) => membership.organizationId),
    );
    if (
      membershipIds.size !== requestedOrganizationIds.length ||
      requestedOrganizationIds.some((id) => !membershipIds.has(id))
    ) {
      return NextResponse.json(
        {
          error: "invalid_scope",
          error_description:
            "One or more selected organizations are unavailable.",
        },
        { status: 400 },
      );
    }
    organizationIds = requestedOrganizationIds;
  }

  await prisma.oAuthAuthCode.create({
    data: {
      code,
      clientId,
      userId: session.user.id,
      redirectUri,
      codeChallenge,
      scopes,
      organizationIds,
      expiresAt: new Date(Date.now() + AUTH_CODE_TTL_MS),
    },
  });

  // Build redirect URL with auth code
  const url = new URL(redirectUri);
  url.searchParams.set("code", code);
  if (state) url.searchParams.set("state", state);

  return NextResponse.json({ redirect_url: url.toString() });
}
