import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { EmailLogStatus } from "@optimitron/db"
import { sendVoteConfirmedImpactEmail } from "@/lib/email"
import { getBaseUrl } from "@/lib/url"
import { createLogger } from "@/lib/logger"
import { ensurePersonForUser } from "@/lib/person.server"

const log = createLogger("complete-signup-api")

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth()

    const { name, newsletterSubscribed } = await req.json()

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        newsletterSubscribed: true,
        person: {
          select: {
            displayName: true,
          },
        },
      },
    })

    if (typeof name === "string" && name.trim() && !user?.person?.displayName) {
      await ensurePersonForUser(userId, { displayName: name.trim() })
      const person = await prisma.user.findUnique({
        where: { id: userId },
        select: { personId: true },
      })
      if (person?.personId) {
        await prisma.person.update({
          where: { id: person.personId },
          data: { displayName: name.trim() },
        })
      }
    }

    if (typeof newsletterSubscribed === "boolean") {
      await prisma.user.update({
        where: { id: userId },
        data: { newsletterSubscribed },
      })
    }

    if (user?.email && user.newsletterSubscribed !== false) {
      sendVoteConfirmedImpactEmail({
        to: user.email,
        dashboardUrl: `${getBaseUrl()}/dashboard`,
      })
        .then((result) => {
          if (result.success && result.data) {
            const providerMessageId =
              (result.data as { data?: { id?: string }; id?: string }).data?.id ??
              (result.data as { id?: string }).id ??
              null
            prisma.emailLog
              .create({
                data: {
                  userId,
                  toAddress: user.email,
                  templateId: "vote-confirmed-impact",
                  subject: "Vote counted. Here's what it's worth.",
                  status: EmailLogStatus.SENT,
                  providerMessageId,
                  dedupeKey: `vote-confirmed-impact:${userId}`,
                },
              })
              .catch((err) => {
                log.error("Failed to log vote confirmed impact email", { error: err })
              })
          }
        })
        .catch((error) => {
          log.error("Failed to send vote confirmed impact email", { error })
        })
    }

    return NextResponse.json(
      { message: "Vote verification completed successfully" },
      { status: 200 },
    )
  } catch (error) {
    log.error("Complete vote verification error", { error })
    return NextResponse.json({ error: "Failed to verify vote" }, { status: 500 })
  }
}
