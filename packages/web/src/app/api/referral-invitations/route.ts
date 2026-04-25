import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ReferralInvitationContactMethod,
  ReferralInvitationMessageFormat,
  ReferralInvitationStatus,
} from "@optimitron/db";
import { requireAuth } from "@/lib/auth-utils";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  createReferralInvitation,
  sendReferralInvitationEmail,
} from "@/lib/referral-invitations.server";

export const runtime = "nodejs";
const log = createLogger("referral-invitations");

const createInvitationSchema = z.object({
  recipientName: z.string().trim().min(1).max(160),
  recipientEmail: z.string().trim().email().max(320).nullish(),
  contactMethod: z.nativeEnum(ReferralInvitationContactMethod).nullish(),
  messageFormat: z.nativeEnum(ReferralInvitationMessageFormat).optional(),
  messageText: z.string().trim().max(10_000).nullish(),
  referendumSlug: z.string().trim().min(1).max(128).nullish(),
  taskId: z.string().trim().min(1).max(128).nullish(),
  shareAttemptId: z.string().trim().min(1).max(128).nullish(),
});

const patchInvitationSchema = z.object({
  id: z.string().min(1).max(128),
  action: z.enum(["markCopied", "decline", "cancel", "nudgeOptIn", "sendEmail"]),
  messageText: z.string().trim().max(10_000).nullish(),
  shareAttemptId: z.string().trim().min(1).max(128).nullish(),
});

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const invitations = await prisma.referralInvitation.findMany({
      where: {
        referrerUserId: userId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    log.error("Failed to list", error);
    return NextResponse.json({ error: "Failed to list invitations." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const parsed = createInvitationSchema.parse(await request.json());

    const invitation = await createReferralInvitation({
      referrerUserId: userId,
      recipientName: parsed.recipientName,
      recipientEmail: parsed.recipientEmail,
      contactMethod: parsed.contactMethod,
      messageFormat: parsed.messageFormat,
      messageText: parsed.messageText,
      referendumSlug: parsed.referendumSlug,
      taskId: parsed.taskId,
      shareAttemptId: parsed.shareAttemptId,
    });

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid invitation payload.", details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message.includes("Recipient")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("rate limit")) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    log.error("Failed to create", error);
    return NextResponse.json({ error: "Failed to create invitation." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await requireAuth();
    const parsed = patchInvitationSchema.parse(await request.json());
    const now = new Date();

    if (parsed.action === "sendEmail") {
      const result = await sendReferralInvitationEmail({
        invitationId: parsed.id,
        manualInitialOnly: true,
        messageText: parsed.messageText,
        referrerUserId: userId,
        now,
      });

      if (result.status === "not_found") {
        return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
      }
      if (result.status === "missing_recipient_email") {
        return NextResponse.json({ error: "This invitation has no recipient email." }, { status: 400 });
      }
      if (result.status === "unsubscribed") {
        return NextResponse.json({ error: "Recipient unsubscribed from this invitation." }, { status: 409 });
      }
      if (result.status === "converted") {
        return NextResponse.json({ error: "This invitation already converted." }, { status: 409 });
      }
      if (result.status === "maxed") {
        return NextResponse.json({ error: "Recipient reminder cap reached." }, { status: 409 });
      }
      if (result.status === "already_sent") {
        return NextResponse.json({ error: "This invitation email was already sent." }, { status: 409 });
      }

      return NextResponse.json(result);
    }

    if (parsed.action === "markCopied") {
      const data = {
        copiedAt: now,
        messageText: parsed.messageText ?? undefined,
        shareAttemptId: parsed.shareAttemptId ?? undefined,
      };

      let result = await prisma.referralInvitation.updateMany({
        where: {
          id: parsed.id,
          referrerUserId: userId,
          deletedAt: null,
          status: ReferralInvitationStatus.PENDING,
        },
        data: {
          ...data,
          status: ReferralInvitationStatus.COPIED,
        },
      });

      if (result.count === 0) {
        result = await prisma.referralInvitation.updateMany({
          where: {
            id: parsed.id,
            referrerUserId: userId,
            deletedAt: null,
          },
          data,
        });
      }

      if (result.count === 0) {
        return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
      }

      const invitation = await prisma.referralInvitation.findUnique({
        where: { id: parsed.id },
      });

      return NextResponse.json({ invitation });
    }

    const data =
      parsed.action === "decline"
        ? { status: ReferralInvitationStatus.DECLINED }
        : parsed.action === "cancel"
          ? { status: ReferralInvitationStatus.CANCELLED, deletedAt: now }
          : {
              senderNudgeOptedInAt: now,
              nextSenderNudgeAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            };

    const result = await prisma.referralInvitation.updateMany({
      where: {
        id: parsed.id,
        referrerUserId: userId,
        deletedAt: null,
      },
      data,
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    }

    const invitation = await prisma.referralInvitation.findUnique({
      where: { id: parsed.id },
    });

    return NextResponse.json({ invitation });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid invitation update payload.", details: error.issues },
        { status: 400 },
      );
    }
    log.error("Failed to update", error);
    return NextResponse.json({ error: "Failed to update invitation." }, { status: 500 });
  }
}
