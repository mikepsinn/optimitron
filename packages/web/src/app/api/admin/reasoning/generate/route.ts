/**
 * POST /api/admin/reasoning/generate — request AI drafts for a slot.
 *
 * Validates admin auth, creates a GenerationRequest row, and queues arm
 * creation via the shared `authorArm` path. Actual AI call stubbed for
 * v1 — humans can author drafts through the admin UI in the meantime.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorArm } from "@/lib/reasoning/generator.server";

const bodySchema = z.object({
  slot: z.enum([
    "HANDOFF",
    "CHAIN_NODE",
    "OBJECTION_NODE",
    "INEVITABILITY",
    "REPLICATION_CTA",
    "DEEP_CHAIN_NODE",
  ]),
  slotKey: z.string(),
  targetVariantSetId: z.string(),
  toneProfile: z.string().optional(),
  count: z.number().int().min(1).max(10).default(3),
  referenceArmIds: z.array(z.string()).default([]),
  localeKey: z.string().default("en"),
  channel: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ ok: false, error: "not-authorized" }, { status: 403 });
  }

  const body = bodySchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ ok: false, error: "invalid-body" }, { status: 400 });
  }

  const req = await prisma.reasoningGenerationRequest.create({
    data: {
      requestedByUserId: session.user.id,
      kind: "AI",
      slot: body.data.slot,
      slotKey: body.data.slotKey,
      targetVariantSetId: body.data.targetVariantSetId,
      referenceArmIds: body.data.referenceArmIds,
      toneProfile: body.data.toneProfile,
      aiModel: "claude-opus-4-7",
      aiPrompt: `Generate ${body.data.count} candidate arm(s) for ${body.data.slot}:${body.data.slotKey}`,
    },
  });

  // TODO: call Anthropic SDK. For now, stub: create N placeholder DRAFTs
  // that humans can edit before promotion.
  const armIds: string[] = [];
  for (let i = 0; i < body.data.count; i++) {
    const result = await authorArm({
      variantSetId: body.data.targetVariantSetId,
      slot: body.data.slot,
      slotKey: body.data.slotKey,
      channel: body.data.channel ?? null,
      localeKey: body.data.localeKey,
      armKey: `ai-draft-${req.id}-${i}`,
      family: "DRY_DATA",
      content: { headline: "(AI draft pending)", body: "(AI draft pending)", sources: [] },
      generatorKind: "AI",
      generationRequestId: req.id,
    });
    armIds.push(result.armId);
  }

  await prisma.reasoningGenerationRequest.update({
    where: { id: req.id },
    data: { candidateArmIds: armIds },
  });

  return NextResponse.json({ ok: true, requestId: req.id, candidateArmIds: armIds });
}
