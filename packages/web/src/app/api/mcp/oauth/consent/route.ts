import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAuthCode, AUTH_CODE_TTL_MS } from "@/lib/mcp-oauth";
import { MCP_SCOPES, type McpScope } from "@/lib/mcp-server";

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

  if (!client.redirectUris.includes(redirectUri)) {
    return NextResponse.json({ error: "Invalid redirect_uri" }, { status: 400 });
  }

  // Filter to known scopes only — the consent form lets the user pick any scope, so
  // validate here rather than trusting the bundle. Unknown strings are silently dropped.
  const code = generateAuthCode();
  const scopes = scope
    .split(" ")
    .filter(Boolean)
    .filter((s): s is McpScope => s in MCP_SCOPES);

  if (scopes.length === 0) {
    return NextResponse.json(
      { error: "invalid_scope", error_description: "At least one valid scope is required" },
      { status: 400 },
    );
  }

  await prisma.oAuthAuthCode.create({
    data: {
      code,
      clientId,
      userId: session.user.id,
      redirectUri,
      codeChallenge,
      scopes,
      expiresAt: new Date(Date.now() + AUTH_CODE_TTL_MS),
    },
  });

  // Build redirect URL with auth code
  const url = new URL(redirectUri);
  url.searchParams.set("code", code);
  if (state) url.searchParams.set("state", state);

  return NextResponse.json({ redirect_url: url.toString() });
}
