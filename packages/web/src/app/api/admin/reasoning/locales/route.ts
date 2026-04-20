import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const putSchema = z.object({
  localeKey: z.string().min(1),
  displayName: z.string().min(1),
  enabled: z.boolean().default(false),
  fallbackChain: z.array(z.string()).default([]),
  bannedPhrases: z.array(z.string()).default([]),
  reviewerUserIds: z.array(z.string()).default([]),
  audienceEstimate: z.number().int().optional(),
});

export async function GET() {
  const rows = await prisma.reasoningLocaleConfig.findMany({
    orderBy: { localeKey: "asc" },
  });
  return NextResponse.json({ ok: true, rows });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ ok: false, error: "not-authorized" }, { status: 403 });
  }
  const body = putSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ ok: false, error: "invalid-body" }, { status: 400 });
  }
  const upserted = await prisma.reasoningLocaleConfig.upsert({
    where: { localeKey: body.data.localeKey },
    create: {
      localeKey: body.data.localeKey,
      displayName: body.data.displayName,
      enabled: body.data.enabled,
      fallbackChain: body.data.fallbackChain,
      bannedPhrases: body.data.bannedPhrases,
      reviewerUserIds: body.data.reviewerUserIds,
      audienceEstimate: body.data.audienceEstimate,
      createdByUserId: session.user.id,
    },
    update: {
      displayName: body.data.displayName,
      enabled: body.data.enabled,
      fallbackChain: body.data.fallbackChain,
      bannedPhrases: body.data.bannedPhrases,
      reviewerUserIds: body.data.reviewerUserIds,
      audienceEstimate: body.data.audienceEstimate,
    },
  });
  return NextResponse.json({ ok: true, row: upserted });
}
