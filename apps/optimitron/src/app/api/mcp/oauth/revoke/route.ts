import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashRefreshToken } from "@/lib/mcp-oauth";

export async function POST(req: Request) {
  try {
    const body = await req.formData().catch(() => null);
    const formParams = body
      ? Object.fromEntries(body.entries())
      : await req.json();

    const token = formParams.token as string;
    if (!token) {
      // Per RFC 7009, invalid token revocation requests should return 200
      return NextResponse.json({ active: false });
    }

    // Try to find a grant by refresh token hash
    const tokenHash = hashRefreshToken(token);
    const grant = await prisma.oAuthGrant.findUnique({
      where: { refreshTokenHash: tokenHash },
    });

    if (grant && grant.active) {
      await prisma.oAuthGrant.update({
        where: { id: grant.id },
        data: {
          active: false,
          revokedAt: new Date(),
          refreshTokenHash: null,
        },
      });
    }

    // Per RFC 7009, always return 200 regardless of whether the token was found
    return NextResponse.json({ active: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "server_error", error_description: message },
      { status: 500 },
    );
  }
}
