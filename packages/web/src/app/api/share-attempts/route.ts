import { Prisma, ShareSource } from "@optimitron/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { grantWishes } from "@/lib/wishes.server";

export const runtime = "nodejs";

const shareAttemptSchema = z.object({
  id: z.string().min(10).max(64),
  source: z.nativeEnum(ShareSource).default(ShareSource.IN_APP),
  surface: z.string().min(1).max(128).nullish(),
  channel: z.string().min(1).max(64).nullish(),
  taskId: z.string().min(1).max(64).nullish(),
  emailLogId: z.string().min(1).max(64).nullish(),
  templateId: z.string().min(1).max(128).nullish(),
  templateHash: z.string().length(64).nullish(),
  templateBody: z.string().max(10_000).nullish(),
  renderedMessage: z.string().max(10_000).nullish(),
  renderedHash: z.string().length(64).nullish(),
  wasEdited: z.boolean().optional().default(false),
  context: z.record(z.string(), z.unknown()).nullish(),
});

/**
 * Log a share-button press from an in-app surface (TaskRowShare,
 * PostVoteReminders, etc.). The client pre-generates the `id` as a cuid2 and
 * embeds `?sa=<id>` in the outbound referral URL before opening the
 * third-party share window — so this endpoint is fire-and-forget from the
 * client's perspective. Failed inserts leave an orphan `sa=` in the URL,
 * which `/r/[code]` tolerates gracefully.
 */
export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }

  let parsed: z.infer<typeof shareAttemptSchema>;
  try {
    const body = await request.json();
    parsed = shareAttemptSchema.parse(body);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid share attempt payload.", details: error instanceof z.ZodError ? error.issues : undefined },
      { status: 400 },
    );
  }

  try {
    await prisma.shareAttempt.create({
      data: {
        id: parsed.id,
        userId: currentUser.id,
        source: parsed.source,
        surface: parsed.surface ?? null,
        channel: parsed.channel ?? null,
        taskId: parsed.taskId ?? null,
        emailLogId: parsed.emailLogId ?? null,
        templateId: parsed.templateId ?? null,
        templateHash: parsed.templateHash ?? null,
        templateBody: parsed.templateBody ?? null,
        renderedMessage: parsed.renderedMessage ?? null,
        renderedHash: parsed.renderedHash ?? null,
        wasEdited: parsed.wasEdited ?? false,
        context: parsed.context ? (parsed.context as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    // Duplicate IDs (user double-clicks) are benign — keep it quiet.
    const code = (error as { code?: string } | null)?.code;
    if (code !== "P2002") {
      console.error("[SHARE ATTEMPT] Failed to persist:", error);
      return NextResponse.json({ error: "Failed to log share." }, { status: 500 });
    }
  }

  // Gamification side effect: grant a wish point for sharing (one-time per user).
  let wishesEarned = 0;
  try {
    const result = await grantWishes({
      userId: currentUser.id,
      reason: "SHARE_REPORT",
      amount: 1,
      dedupeKey: `share-${currentUser.id}`,
      metadata: parsed.templateId ? { templateLabel: parsed.templateId } : undefined,
    });
    if (result) wishesEarned = result.amount;
  } catch (wishError) {
    console.error("[SHARE ATTEMPT] Wish grant error:", wishError);
  }

  return NextResponse.json({ success: true, wishesEarned });
}
