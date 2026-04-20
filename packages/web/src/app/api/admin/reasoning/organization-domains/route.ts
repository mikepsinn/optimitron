import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  organizationId: z.string().min(1),
  host: z.string().min(3),
  surfaceType: z.enum(["hosted", "embed-parent", "both"]),
  trustedParentDomains: z.array(z.string()).default([]),
  cspAllowlist: z.array(z.string()).default([]),
});

export async function GET() {
  const rows = await prisma.reasoningOrganizationDomain.findMany({
    orderBy: [{ organizationId: "asc" }, { host: "asc" }],
  });
  return NextResponse.json({ ok: true, rows });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ ok: false, error: "not-authorized" }, { status: 403 });
  }
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ ok: false }, { status: 400 });

  const row = await prisma.reasoningOrganizationDomain.upsert({
    where: { host: body.data.host.toLowerCase() },
    create: {
      organizationId: body.data.organizationId,
      host: body.data.host.toLowerCase(),
      surfaceType: body.data.surfaceType,
      status: "PENDING_DNS",
      trustedParentDomains: body.data.trustedParentDomains,
      cspAllowlist: body.data.cspAllowlist,
      cnameVerified: false,
      tlsVerified: false,
      createdByUserId: session.user.id,
    },
    update: {
      organizationId: body.data.organizationId,
      surfaceType: body.data.surfaceType,
      trustedParentDomains: body.data.trustedParentDomains,
      cspAllowlist: body.data.cspAllowlist,
    },
  });
  return NextResponse.json({ ok: true, row });
}
