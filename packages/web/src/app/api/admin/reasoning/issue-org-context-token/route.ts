import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { issueOrgContextToken } from "@/lib/organization-context-token.server";

const schema = z.object({
  organizationId: z.string().min(1),
  ttlSeconds: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ ok: false, error: "not-authorized" }, { status: 403 });
  }
  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ ok: false, error: "invalid-body" }, { status: 400 });
  }
  try {
    const token = issueOrgContextToken(body.data.organizationId, {
      ttlSeconds: body.data.ttlSeconds,
    });
    return NextResponse.json({
      ok: true,
      token: token.encoded,
      expiresAt: token.payload.expiresAt,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "signing-unavailable", detail: String(err) },
      { status: 500 },
    );
  }
}
