import { Prisma, ShareSource } from "@optimitron/db"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

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
})

/**
 * Log a share-button press from `TreatyReminderComposer`.
 *
 * The client pre-generates `id` and embeds `?sa=<id>` in the outbound referral
 * URL before opening the third-party share window, so this is fire-and-forget
 * from the client's side. A failed insert leaves an orphan `sa=` in the URL,
 * which `/vote/[code]` already tolerates.
 *
 * Diverges from Optimitron's route by omitting the two Optimitron-only side
 * effects — the wish grant and the user-treaty-task sync. Those write to
 * gamification surfaces that exist only on optimitron.com; the campaign site
 * has no page that reads them. This mirrors how `/api/votes/sync` already
 * diverges here.
 */
export async function POST(request: Request) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 })
  }

  let parsed: z.infer<typeof shareAttemptSchema>
  try {
    const body = await request.json()
    parsed = shareAttemptSchema.parse(body)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid share attempt payload.",
        details: error instanceof z.ZodError ? error.issues : undefined,
      },
      { status: 400 },
    )
  }

  try {
    await prisma.shareAttempt.create({
      data: {
        id: parsed.id,
        userId: sessionUser.id,
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
    })
  } catch (error) {
    // Duplicate IDs (user double-clicks) are benign — keep it quiet.
    const code = (error as { code?: string } | null)?.code
    if (code !== "P2002") {
      console.error("[SHARE ATTEMPT] Failed to persist:", error)
      return NextResponse.json({ error: "Failed to log share." }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
