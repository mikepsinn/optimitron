/**
 * POST /api/reasoning/outcomes
 *
 * Ingests client-side telemetry events. Writes OutcomeRecord rows.
 * Accepts anonymous sessions (guest flow) — back-fills userId on
 * later auth via sessionId → userId linkage.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const outcomeKindSchema = z.enum([
  "SURVEY_STARTED",
  "HANDOFF_CLICKED",
  "NODE_ADVANCED",
  "NODE_EXITED",
  "OBJECTION_SHOWN",
  "OBJECTION_RESOLVED",
  "PROBABILITY_CHANGED",
  "VOTE",
  "FIRST_SEND_INITIATED",
  "FIRST_SEND_CONFIRMED",
  "DOWNSTREAM_VOTE",
  "DOWNSTREAM_SEND",
  "WALK_AWAY",
]);

const outcomeEventSchema = z.object({
  sessionId: z.string().min(1),
  policyDecisionId: z.string().min(1),
  variantSetId: z.string().min(1),
  variantArmId: z.string().optional().nullable(),
  slot: z.enum([
    "HANDOFF",
    "CHAIN_NODE",
    "OBJECTION_NODE",
    "INEVITABILITY",
    "REPLICATION_CTA",
    "DEEP_CHAIN_NODE",
    "TOPOLOGY",
  ]),
  outcomeKind: outcomeKindSchema,
  value: z.number().optional().nullable(),
  localeKey: z.string().default("en"),
  hostKey: z.string().default(""),
  surface: z.string().default("hosted"),
  channel: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  audienceTag: z.string().optional().nullable(),
  relationshipBucket: z.string().optional().nullable(),
  referredByUserId: z.string().optional().nullable(),
  isControlHoldout: z.boolean().default(false),
});

const bodySchema = z.object({
  events: z.array(outcomeEventSchema).max(50),
});

export async function POST(request: NextRequest) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "invalid-body", detail: String(err) },
      { status: 400 },
    );
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const created = await prisma.$transaction(
    body.events.map((e) =>
      prisma.reasoningOutcomeRecord.create({
        data: {
          sessionId: e.sessionId,
          userId,
          variantSetId: e.variantSetId,
          variantArmId: e.variantArmId ?? undefined,
          slot: e.slot,
          outcomeKind: e.outcomeKind,
          value: e.value ?? undefined,
          localeKey: e.localeKey,
          hostKey: e.hostKey,
          surface: e.surface,
          channel: e.channel ?? undefined,
          organizationId: e.organizationId ?? undefined,
          audienceTag: e.audienceTag ?? undefined,
          relationshipBucket: e.relationshipBucket ?? undefined,
          referredByUserId: e.referredByUserId ?? undefined,
          policyDecisionId: e.policyDecisionId,
          isControlHoldout: e.isControlHoldout,
        },
      }),
    ),
  );

  return NextResponse.json({ ok: true, count: created.length });
}
