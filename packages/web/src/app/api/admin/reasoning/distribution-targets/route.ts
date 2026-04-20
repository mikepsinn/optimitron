import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  organizationId: z.string().optional().nullable(),
  localeKey: z.string().optional().nullable(),
  channel: z.string().optional().nullable(),
  surface: z.string().optional().nullable(),
  enabled: z.boolean(),
  ceilingEstimate: z.number().positive(),
  liveStatus: z.enum(["NOT_STARTED", "ONBOARDING", "LIVE", "PAUSED", "RETIRED"]),
  notes: z.string().optional(),
});

export async function GET() {
  const rows = await prisma.reasoningDistributionTarget.findMany({
    orderBy: [{ liveStatus: "asc" }, { ceilingEstimate: "desc" }],
  });
  return NextResponse.json({ ok: true, rows });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ ok: false, error: "not-authorized" }, { status: 403 });
  }
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ ok: false }, { status: 400 });

  const existing = await prisma.reasoningDistributionTarget.findFirst({
    where: {
      organizationId: body.data.organizationId ?? null,
      localeKey: body.data.localeKey ?? null,
      channel: body.data.channel ?? null,
      surface: body.data.surface ?? null,
    },
  });

  const saved = existing
    ? await prisma.reasoningDistributionTarget.update({
        where: { id: existing.id },
        data: {
          enabled: body.data.enabled,
          ceilingEstimate: body.data.ceilingEstimate,
          liveStatus: body.data.liveStatus,
          notes: body.data.notes,
        },
      })
    : await prisma.reasoningDistributionTarget.create({
        data: {
          organizationId: body.data.organizationId,
          localeKey: body.data.localeKey,
          channel: body.data.channel,
          surface: body.data.surface,
          enabled: body.data.enabled,
          ceilingEstimate: body.data.ceilingEstimate,
          liveStatus: body.data.liveStatus,
          notes: body.data.notes,
          createdByUserId: session.user.id,
        },
      });
  return NextResponse.json({ ok: true, row: saved });
}
