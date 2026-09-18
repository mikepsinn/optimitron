import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashRefreshToken } from "@/lib/mcp-oauth";
import { resolveOAuthResource } from "@/lib/mcp-court-oauth";

export async function POST(req: Request) {
  try {
    const body = await req.formData().catch(() => null);
    const formParams = body
      ? Object.fromEntries(body.entries())
      : await req.json();
    let resource: string | undefined;
    try {
      if (formParams.resource != null)
        resource = resolveOAuthResource(formParams.resource, true);
    } catch {
      return NextResponse.json({ active: false });
    }

    const token = formParams.token as string;
    if (!token) {
      // Per RFC 7009, invalid token revocation requests should return 200
      return NextResponse.json({ active: false });
    }

    // Try to find a grant by refresh token hash
    const tokenHash = hashRefreshToken(token);
    const grant = await prisma.oAuthGrant.findFirst({
      where: {
        refreshTokenHash: tokenHash,
        ...(resource ? { resource } : {}),
        ...(typeof formParams.client_id === "string"
          ? { clientId: formParams.client_id }
          : {}),
      },
    });

    if (grant && grant.active) {
      await prisma.oAuthGrant.updateMany({
        where: {
          id: grant.id,
          resource: grant.resource,
          refreshTokenHash: tokenHash,
        },
        data: {
          active: false,
          revokedAt: new Date(),
          refreshTokenHash: null,
        },
      });
    }

    // Per RFC 7009, always return 200 regardless of whether the token was found
    return NextResponse.json({ active: false });
  } catch {
    console.error("[oauth/revoke] unexpected failure");
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
