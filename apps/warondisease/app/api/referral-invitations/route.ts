import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { sendReferralInviteEmail } from "@/lib/email"
import { buildUserInviteReferralUrl } from "@/lib/url"
import {
  buildDefaultReferralInvitationMessage,
  createReferralInviteToken,
  isValidInviteEmail,
  MAX_INVITEE_CONTACT_LENGTH,
  MAX_INVITEE_NAME_LENGTH,
  MAX_INVITATION_MESSAGE_LENGTH,
  MAX_REFERRAL_INVITATION_EMAILS_PER_DAY,
  MAX_REFERRAL_INVITATIONS_PER_REQUEST,
} from "@/lib/referral-invitations"
import { createLogger } from "@/lib/logger"
import {
  EmailLogStatus,
  ReferralInvitationContactMethod,
  ReferralInvitationStatus,
} from "@optimitron/db"
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty"

const log = createLogger("referral-invitations-api")

type RawInvitation = {
  recipientName?: unknown
  inviteeContact?: unknown
  recipientEmail?: unknown
  contactMethod?: unknown
  messageText?: unknown
  originUrl?: unknown
}

export async function GET() {
  try {
    const { userId } = await requireAuth()

    const invitations = await prisma.referralInvitation.findMany({
      where: { referrerUserId: userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ invitations }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    log.error("Failed to list referral invitations", { error })
    return NextResponse.json({ error: "Failed to list referral invitations" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const rawBody: unknown = await req.json().catch(() => ({}))
    const body =
      rawBody && typeof rawBody === "object"
        ? (rawBody as Record<string, unknown>)
        : {}

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        referralCode: true,
        person: {
          select: {
            handle: true,
            displayName: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const action = body?.action === "send" ? "send" : body?.action === "copy" ? "copy" : null
    const raw: unknown[] = Array.isArray(body?.invitations) ? body.invitations : [body]

    if (raw.length === 0 || raw.length > MAX_REFERRAL_INVITATIONS_PER_REQUEST) {
      return NextResponse.json(
        { error: `Body must include 1-${MAX_REFERRAL_INVITATIONS_PER_REQUEST} invitations` },
        { status: 400 },
      )
    }

    if (action === "send" && raw.length > 1) {
      return NextResponse.json({ error: "Email send accepts one invitation at a time" }, { status: 400 })
    }

    if (action === "send") {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const sendsToday = await prisma.referralInvitation.count({
        where: {
          referrerUserId: userId,
          sentAt: { gte: since },
        },
      })
      if (sendsToday >= MAX_REFERRAL_INVITATION_EMAILS_PER_DAY) {
        return NextResponse.json({ error: "Daily referral email limit reached" }, { status: 429 })
      }
    }

    const cleaned = raw
      .map((item: unknown) => cleanInvitation(item))
      .filter((item): item is NonNullable<ReturnType<typeof cleanInvitation>> => item !== null)

    if (cleaned.length === 0) {
      return NextResponse.json({ error: "Each invitation needs a recipientName" }, { status: 400 })
    }

    const referendum = await prisma.referendum.findUnique({
      where: { slug: TREATY_REFERENDUM_SLUG },
      select: { id: true },
    })

    const now = new Date()
    const created = []

    for (const item of cleaned) {
      const inviteToken = createReferralInviteToken()
      const referralUrl = buildUserInviteReferralUrl(
        {
          handle: user.person?.handle,
          referralCode: user.referralCode,
        },
        inviteToken,
      )
      const messageText = (
        item.messageText ||
        buildDefaultReferralInvitationMessage(item.recipientName, referralUrl)
      ).slice(0, MAX_INVITATION_MESSAGE_LENGTH)

      const emailContact =
        item.contactMethod === ReferralInvitationContactMethod.EMAIL
          ? item.inviteeContact
          : null

      if (action === "send" && (!emailContact || !isValidInviteEmail(emailContact))) {
        return NextResponse.json(
          { error: "A valid invitee email is required to send" },
          { status: 400 },
        )
      }

      const invitation = await prisma.referralInvitation.create({
        data: {
          referrerUserId: userId,
          recipientName: item.recipientName,
          recipientEmail: item.inviteeContact,
          contactMethod: item.contactMethod,
          inviteToken,
          messageText,
          referendumId: referendum?.id ?? null,
          copiedAt: action === "copy" ? now : null,
          status: action === "copy" ? ReferralInvitationStatus.COPIED : ReferralInvitationStatus.PENDING,
          originUrl: item.originUrl,
        },
      })

      let emailSent = false
      if (action === "send" && emailContact) {
        const senderName = user.person?.displayName || "Someone who voted"
        const result = await sendReferralInviteEmail({
          to: emailContact,
          recipientName: invitation.recipientName,
          senderName,
          messageText,
          surveyUrl: referralUrl,
        })

        if (!result.success) {
          return NextResponse.json(
            {
              error: result.error || "Failed to send referral email",
              invitation,
              referralUrl,
            },
            { status: 503 },
          )
        }

        emailSent = true
        await prisma.referralInvitation.update({
          where: { id: invitation.id },
          data: {
            sentAt: now,
            status: ReferralInvitationStatus.SENT,
          },
        })

        await prisma.emailLog.create({
          data: {
            userId,
            toAddress: emailContact,
            templateId: "referral-invite-share",
            subject: `${senderName} wants you to not die of a horrible disease`,
            status: EmailLogStatus.SENT,
            providerMessageId: emailResultId(result.data),
            dedupeKey: `referral-invite:${invitation.id}`,
          },
        })
      }

      created.push({
        ...invitation,
        referralUrl,
        emailSent,
      })
    }

    return NextResponse.json(
      {
        invitation: created.length === 1 ? created[0] : undefined,
        invitations: created,
        created: created.length,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    log.error("Failed to create referral invitation", { error })
    const message = error instanceof Error ? error.message : "Failed to create referral invitation"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function emailResultId(result: unknown): string | null {
  if (!result || typeof result !== "object") return null
  const obj = result as { id?: string; data?: { id?: string } }
  return obj.data?.id ?? obj.id ?? null
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const rawBody: unknown = await req.json().catch(() => ({}))
    const body =
      rawBody && typeof rawBody === "object"
        ? (rawBody as Record<string, unknown>)
        : {}
    const { id, status, action } = body

    if (typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existing = await prisma.referralInvitation.findUnique({ where: { id } })
    if (!existing || existing.referrerUserId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updateData: {
      status?: ReferralInvitationStatus
      convertedAt?: Date | null
      copiedAt?: Date
      sentAt?: Date
      messageText?: string
    } = {}

    const messageText =
      typeof body.messageText === "string"
        ? body.messageText.trim().slice(0, MAX_INVITATION_MESSAGE_LENGTH)
        : null

    if (typeof status === "string") {
      const validStatuses: ReferralInvitationStatus[] = [
        ReferralInvitationStatus.PENDING,
        ReferralInvitationStatus.SENT,
        ReferralInvitationStatus.CONVERTED,
        ReferralInvitationStatus.DECLINED,
        ReferralInvitationStatus.COPIED,
        ReferralInvitationStatus.CANCELLED,
      ]
      if (!validStatuses.includes(status as ReferralInvitationStatus)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }

      updateData.status = status as ReferralInvitationStatus
      if (status === ReferralInvitationStatus.CONVERTED) {
        updateData.convertedAt = existing.convertedAt ?? new Date()
      } else if (status === ReferralInvitationStatus.SENT) {
        updateData.sentAt = existing.sentAt ?? new Date()
      }
    }

    if (action === "copy" || action === "markCopied" || action === "markManualContacted") {
      updateData.copiedAt = new Date()
      if (messageText) updateData.messageText = messageText
      if (!updateData.status) {
        updateData.status = ReferralInvitationStatus.COPIED
      }
    }

    if (action === "sendMessage") {
      if (existing.sentAt) {
        return NextResponse.json({ error: "This invitation was already sent." }, { status: 409 })
      }

      if (!existing.recipientEmail || !isValidInviteEmail(existing.recipientEmail)) {
        return NextResponse.json(
          { error: "This invitation has no recipient email." },
          { status: 400 },
        )
      }

      const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const sendsToday = await prisma.referralInvitation.count({
        where: { referrerUserId: userId, sentAt: { gte: since } },
      })
      if (sendsToday >= MAX_REFERRAL_INVITATION_EMAILS_PER_DAY) {
        return NextResponse.json({ error: "Daily referral email limit reached" }, { status: 429 })
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          referralCode: true,
          person: { select: { displayName: true, handle: true } },
        },
      })
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const referralUrl = buildUserInviteReferralUrl(
        { handle: user.person?.handle, referralCode: user.referralCode },
        existing.inviteToken,
      )
      const outboundMessage =
        messageText ||
        existing.messageText ||
        buildDefaultReferralInvitationMessage(existing.recipientName, referralUrl)
      const senderName = user.person?.displayName || "Someone who voted"
      const result = await sendReferralInviteEmail({
        to: existing.recipientEmail,
        recipientName: existing.recipientName,
        senderName,
        messageText: outboundMessage,
        surveyUrl: referralUrl,
      })
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to send referral email" },
          { status: 503 },
        )
      }

      const now = new Date()
      const invitation = await prisma.referralInvitation.update({
        where: { id },
        data: {
          messageText: outboundMessage,
          sentAt: now,
          status: ReferralInvitationStatus.SENT,
        },
      })
      await prisma.emailLog.create({
        data: {
          userId,
          toAddress: existing.recipientEmail,
          templateId: "referral-invite-share",
          subject: `${senderName} wants you to not die of a horrible disease`,
          status: EmailLogStatus.SENT,
          providerMessageId: emailResultId(result.data),
          dedupeKey: `referral-invite:${invitation.id}`,
        },
      })

      return NextResponse.json(
        { invitation, dispatched: true, status: "sent" },
        { status: 200 },
      )
    }

    // sender nudge cadence columns do not exist on optimitron ReferralInvitation —
    // accept for API compatibility without persisting.
    if (action === "sender_nudge_opt_in") {
      return NextResponse.json({ invitation: existing, nudgeOptIn: true }, { status: 200 })
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No update requested" }, { status: 400 })
    }

    const invitation = await prisma.referralInvitation.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ invitation }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    log.error("Failed to update referral invitation", { error })
    return NextResponse.json({ error: "Failed to update referral invitation" }, { status: 500 })
  }
}

function cleanInvitation(raw: unknown) {
  if (!raw || typeof raw !== "object") return null
  const obj = raw as RawInvitation
  const name = typeof obj.recipientName === "string" ? obj.recipientName.trim() : ""
  if (!name) return null

  const rawContact = obj.inviteeContact ?? obj.recipientEmail
  const contact = typeof rawContact === "string" ? rawContact.trim() : null
  const allowed: ReferralInvitationContactMethod[] = [
    ReferralInvitationContactMethod.EMAIL,
    ReferralInvitationContactMethod.SMS,
    ReferralInvitationContactMethod.COPY,
    ReferralInvitationContactMethod.OTHER,
  ]
  const explicitMethod =
    typeof obj.contactMethod === "string" &&
    allowed.includes(obj.contactMethod as ReferralInvitationContactMethod)
      ? (obj.contactMethod as ReferralInvitationContactMethod)
      : null
  const inferredMethod =
    contact && isValidInviteEmail(contact)
      ? ReferralInvitationContactMethod.EMAIL
      : explicitMethod
  const messageText = typeof obj.messageText === "string" ? obj.messageText.trim() : null
  const originUrl = typeof obj.originUrl === "string" ? obj.originUrl.trim() : null

  return {
    recipientName: name.slice(0, MAX_INVITEE_NAME_LENGTH),
    inviteeContact: contact ? contact.slice(0, MAX_INVITEE_CONTACT_LENGTH) : null,
    contactMethod: inferredMethod,
    messageText: messageText ? messageText.slice(0, MAX_INVITATION_MESSAGE_LENGTH) : null,
    originUrl: originUrl ? originUrl.slice(0, 2048) : null,
  }
}
