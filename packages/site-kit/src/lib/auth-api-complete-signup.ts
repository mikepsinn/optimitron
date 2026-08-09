import { NextResponse } from "next/server"
import { requireAuth } from "./auth-utils"
import { prisma } from "./prisma"
import { EmailLogStatus } from "@optimitron/db"
import { createLogger } from "./logger"
import { ensurePersonForUser } from "./person.server"
import { getBaseUrl } from "./url"

export type VoteConfirmedEmailSender = (args: {
  to: string
  dashboardUrl: string
}) => Promise<{ success?: boolean; data?: unknown }>

export type CompleteSignupOptions = {
  sendVoteConfirmedEmail?: VoteConfirmedEmailSender
  successMessage?: string
}

/**
 * Shared complete-signup POST: set display name + newsletter; optional impact email.
 */
export function createCompleteSignupHandler(options: CompleteSignupOptions = {}) {
  const log = createLogger("complete-signup-api")
  const successMessage = options.successMessage ?? "Signup completed"

  async function POST(req: Request) {
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

      if (
        options.sendVoteConfirmedEmail &&
        user?.email &&
        user.newsletterSubscribed !== false
      ) {
        void options
          .sendVoteConfirmedEmail({
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
                    toAddress: user.email!,
                    templateId: "vote-confirmed-impact",
                    subject: "Vote counted. Here's what it's worth.",
                    status: EmailLogStatus.SENT,
                    providerMessageId,
                    dedupeKey: `vote-confirmed-impact:${userId}`,
                  },
                })
                .catch((err: unknown) => {
                  log.error("Failed to log vote confirmed impact email", { error: err })
                })
            }
          })
          .catch((error: unknown) => {
            log.error("Failed to send vote confirmed impact email", { error })
          })
      }

      return NextResponse.json({ message: successMessage }, { status: 200 })
    } catch (error) {
      log.error("Complete signup error", { error })
      return NextResponse.json(
        { error: "Failed to complete signup" },
        { status: 500 },
      )
    }
  }

  return { POST }
}
