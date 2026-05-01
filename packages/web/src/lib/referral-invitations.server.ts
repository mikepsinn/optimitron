import { nanoid } from "nanoid";
import {
  ReferralInvitationContactMethod,
  ReferralInvitationMessageFormat,
  ReferralInvitationStatus,
  ShareSource,
  TaskCommentKind,
  TaskCommentSource,
} from "@optimitron/db/enums";
import type { Prisma } from "@optimitron/db";
import { formatShareEmailFromHeader } from "@/lib/email/from-address";
import { prisma } from "@/lib/prisma";
import {
  createReferralInvitationTask,
  verifyReferralInvitationTask,
} from "@/lib/referral-invitation-tasks.server";
import { recordShareAttempt } from "@/lib/share-attempts.server";
import {
  notifyTaskCommentRecipients,
  postTaskCommentAndNotify,
} from "@/lib/tasks/task-comment-notifications.server";
import {
  markNextHumanAssignmentSubtaskComplete,
  markUserTreatyPhoneCallComplete,
} from "@/lib/tasks/user-treaty-task-progress.server";
import { ensureUserTreatyTask } from "@/lib/tasks/user-treaty-task.server";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import {
  buildReferralInvitationMessage,
  getReferralInvitationFirstName,
} from "@/lib/referral-invitation-copy";
import { insertGeneratedReferralInviteUrl } from "@/lib/referral-invitation-message-url";
import { buildUserInviteReferralUrl, buildUserReferralUrl, getBaseUrl } from "@/lib/url";
import { getUserDisplayName, userDisplaySelect } from "@/lib/user-display";

const INVITE_TOKEN_SIZE = 24;
const CREATE_LIMIT_PER_HOUR = 50;

export function isValidInvitationEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function getFirstName(name: string): string {
  return getReferralInvitationFirstName(name);
}

export function buildDefaultReferralInvitationMessage(input: {
  recipientName: string;
  senderName?: string | null;
  treatyUrl: string;
  messageFormat?: ReferralInvitationMessageFormat;
}) {
  return buildReferralInvitationMessage({
    inviteUrl: input.treatyUrl,
    messageFormat:
      input.messageFormat === ReferralInvitationMessageFormat.TASK_NOTIFICATION
        ? "TASK_NOTIFICATION"
        : "SINCERE",
    recipientName: input.recipientName,
    senderName: input.senderName,
  });
}

async function createUniqueInviteToken() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = nanoid(INVITE_TOKEN_SIZE);
    const existing = await prisma.referralInvitation.findUnique({
      where: { inviteToken: token },
      select: { id: true },
    });
    if (!existing) return token;
  }
  throw new Error("Unable to create unique invitation token.");
}

function getTrainingContactChannel(method: ReferralInvitationContactMethod | null) {
  switch (method) {
    case ReferralInvitationContactMethod.EMAIL:
      return "email";
    case ReferralInvitationContactMethod.SMS:
      return "text";
    case ReferralInvitationContactMethod.COPY:
      return "copied/manual share";
    case ReferralInvitationContactMethod.OTHER:
      return "call/manual outreach";
    default:
      return "manual outreach";
  }
}

function buildTrainingAssignmentComment(input: {
  deliveryStatus?: "confirmed" | "queued" | "sent";
  contactMethod: ReferralInvitationContactMethod | null;
  recipientName: string;
}) {
  const channel = getTrainingContactChannel(input.contactMethod);
  const verb =
    input.deliveryStatus === "queued"
      ? "Queued"
      : input.deliveryStatus === "sent"
        ? "Sent"
        : "Confirmed";
  return `${verb} ${channel} for ${input.recipientName}. Their treaty voting task is now tracked under your 4 billion votes objective.`;
}

function getShareAttemptChannel(input: {
  contactConfirmed?: boolean;
  contactMethod: ReferralInvitationContactMethod | null;
}) {
  if (!input.contactConfirmed) return "copy-message";
  switch (input.contactMethod) {
    case ReferralInvitationContactMethod.SMS:
      return "sms";
    case ReferralInvitationContactMethod.OTHER:
      return "call-or-manual";
    case ReferralInvitationContactMethod.EMAIL:
      return "email";
    case ReferralInvitationContactMethod.COPY:
    default:
      return "manual-share";
  }
}


export async function createReferralInvitation(input: {
  referrerUserId: string;
  recipientName: string;
  recipientEmail?: string | null;
  contactMethod?: ReferralInvitationContactMethod | null;
  messageFormat?: ReferralInvitationMessageFormat;
  messageText?: string | null;
  referendumSlug?: string | null;
  taskId?: string | null;
  shareAttemptId?: string | null;
  /// Full URL the inviter was on when composing this invitation
  /// (window.location.href). Captured by the client and passed through by
  /// the API route. Stored once on insert; immutable thereafter. Variant
  /// key is derivable from the URL host on demand.
  originUrl?: string | null;
}) {
  const recipientName = input.recipientName.trim();
  if (!recipientName) {
    throw new Error("Recipient name is required.");
  }

  const recipientEmail = input.recipientEmail?.trim().toLowerCase() || null;
  if (recipientEmail && !isValidInvitationEmail(recipientEmail)) {
    throw new Error("Recipient email is invalid.");
  }

  const referrer = await prisma.user.findUnique({
    where: { id: input.referrerUserId },
    select: {
      ...userDisplaySelect,
      referralCode: true,
    },
  });

  if (!referrer) {
    throw new Error("Referrer not found.");
  }

  if (recipientEmail && referrer?.email?.toLowerCase() === recipientEmail) {
    throw new Error("Recipient email cannot be your own email.");
  }

  const recentCount = await prisma.referralInvitation.count({
    where: {
      referrerUserId: input.referrerUserId,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      deletedAt: null,
    },
  });

  if (recentCount >= CREATE_LIMIT_PER_HOUR) {
    throw new Error("Referral invitation rate limit exceeded.");
  }

  let linkedTaskId = input.taskId?.trim() || null;
  if (linkedTaskId) {
    const linkedTask = await prisma.task.findFirst({
      where: {
        id: linkedTaskId,
        deletedAt: null,
        OR: [
          { ownerUserId: input.referrerUserId },
          { isPublic: true },
        ],
      },
      select: { id: true },
    });

    if (!linkedTask) {
      throw new Error("Task not found.");
    }
  }

  const referendum = await prisma.referendum.findFirst({
    where: {
      slug: input.referendumSlug || TREATY_REFERENDUM_SLUG,
      deletedAt: null,
    },
    select: { id: true },
  });

  const inviteToken = await createUniqueInviteToken();
  const messageFormat = input.messageFormat ?? ReferralInvitationMessageFormat.SINCERE;
  const baseUrl = getBaseUrl();
  // The URL builders only inspect top-level `handle` / `referralCode`. The
  // Prisma user shape nests handle under `.person.handle`, so we adapt.
  const referrerForUrl = {
    handle: referrer.person?.handle ?? null,
    referralCode: referrer.referralCode,
  };
  const inviteUrl = buildUserInviteReferralUrl(referrerForUrl, inviteToken, baseUrl);
  const draftReferralUrl = buildUserReferralUrl(referrerForUrl, baseUrl);
  const senderName = getUserDisplayName(referrer) || "A voter";
  const rawMessageText = input.messageText?.trim() || null;
  // If the user typed a custom message, swap any draft-URL placeholders for
  // the real invite URL. Otherwise build the default template.
  const messageText = rawMessageText
    ? insertGeneratedReferralInviteUrl(rawMessageText, inviteUrl, {
        draftReferralUrl,
      })
    : null;
  const defaultMessageText = buildDefaultReferralInvitationMessage({
    messageFormat,
    recipientName,
    senderName,
    treatyUrl: inviteUrl,
  });
  const taskContactTemplate = messageText ?? defaultMessageText;

  const userTreatyTask = linkedTaskId
    ? null
    : await ensureUserTreatyTask({
        personId: referrer.person?.id ?? null,
        userId: input.referrerUserId,
      });

  const invitation = await prisma.$transaction(async (tx) => {
    const recipientPerson = recipientEmail
      ? await tx.person.upsert({
          where: { email: recipientEmail },
          update: {
            deletedAt: null,
            displayName: recipientName,
          },
          create: {
            displayName: recipientName,
            email: recipientEmail,
          },
          select: { id: true },
        })
      : null;

    if (!linkedTaskId) {
      // Keep the invite-specific task and ReferralInvitation row together.
      // The broader onboarding tree is idempotently prepared before this
      // transaction so a simple invite does not inherit the full trigger cost.
      linkedTaskId = await createReferralInvitationTask(
        {
          endpoint: {
            instructions: taskContactTemplate,
            url: inviteUrl,
          },
          inviteToken,
          ownerUserId: input.referrerUserId,
          parentTaskId: userTreatyTask?.taskId ?? null,
          recipientName,
          recipientPersonId: recipientPerson?.id ?? null,
          referendumSlug: input.referendumSlug || TREATY_REFERENDUM_SLUG,
        },
        tx,
      );
    }

    return tx.referralInvitation.create({
      data: {
        referrerUserId: input.referrerUserId,
        recipientPersonId: recipientPerson?.id ?? null,
        recipientName,
        recipientEmail,
        contactMethod:
          input.contactMethod ?? (recipientEmail ? ReferralInvitationContactMethod.EMAIL : null),
        messageFormat,
        messageText,
        referendumId: referendum?.id ?? null,
        taskId: linkedTaskId,
        shareAttemptId: input.shareAttemptId || null,
        inviteToken,
        originUrl: input.originUrl ?? null,
      },
    });
  });
  // Note: invitation creation does NOT auto-dispatch a notification email.
  // Callers that want to email the recipient must call
  // sendReferralInvitationMessage in a separate step, which only marks the
  // invitation SENT after the notification is actually dispatched.

  return invitation;
}

/**
 * Post a new message to an existing invitation's task and, if the
 * notification email actually dispatches, advance the invitation to SENT.
 *
 * Used when the user clicks "Send email" — either as the second step after
 * createReferralInvitation, or after they copied first and now want the
 * recipient to actually receive a fresh message.
 *
 * Returns a `dispatched: boolean` so callers can distinguish "email actually
 * went out" from "comment created, email skipped (rate-limited / cooldown /
 * recipient opted out / etc.)". When dispatch is skipped, status stays at
 * its previous value (typically PENDING), so dashboards correctly reflect
 * "we tried but the email did not actually go out yet."
 */
export async function sendReferralInvitationMessage(input: {
  invitationId: string;
  messageText?: string | null;
  referrerUserId: string;
  now?: Date;
}): Promise<
  | {
      status: "ok";
      dispatched: boolean;
      reason?: string;
      invitation: { id: string; status: string; sentAt: Date | null };
    }
  | { status: "not_found" }
  | { status: "missing_recipient_email" }
  | { status: "missing_task" }
> {
  const now = input.now ?? new Date();
  const invitation = await prisma.referralInvitation.findFirst({
    where: {
      id: input.invitationId,
      referrerUserId: input.referrerUserId,
      deletedAt: null,
    },
    select: {
      contactMethod: true,
      id: true,
      inviteToken: true,
      messageFormat: true,
      recipientEmail: true,
      recipientName: true,
      sentAt: true,
      status: true,
      taskId: true,
      task: { select: { parentTaskId: true } },
      referrer: { select: { ...userDisplaySelect, referralCode: true } },
    },
  });

  if (!invitation) return { status: "not_found" };
  if (!invitation.recipientEmail) return { status: "missing_recipient_email" };
  if (!invitation.taskId) return { status: "missing_task" };

  const baseUrl = getBaseUrl();
  const referrerForUrl = invitation.referrer
    ? {
        handle: invitation.referrer.person?.handle ?? null,
        referralCode: invitation.referrer.referralCode,
      }
    : null;
  const inviteUrl = buildUserInviteReferralUrl(
    referrerForUrl,
    invitation.inviteToken,
    baseUrl,
  );
  const draftReferralUrl = buildUserReferralUrl(referrerForUrl, baseUrl);
  const senderName = getUserDisplayName(invitation.referrer) || "A voter";
  const trimmed = input.messageText?.trim() || null;
  const messageBody = trimmed
    ? insertGeneratedReferralInviteUrl(trimmed, inviteUrl, {
        draftReferralUrl,
      })
    : buildDefaultReferralInvitationMessage({
        messageFormat: invitation.messageFormat,
        recipientName: invitation.recipientName,
        senderName,
        treatyUrl: inviteUrl,
      });

  const fromHeader = formatShareEmailFromHeader(senderName);
  const notifyResult = await postTaskCommentAndNotify({
    authorUserId: input.referrerUserId,
    cta: { label: "Take 30 seconds to end war and disease", url: inviteUrl },
    from: fromHeader || null,
    kind: TaskCommentKind.OUTBOUND_MESSAGE,
    message: messageBody,
    senderSignature: { name: senderName },
    source: TaskCommentSource.WEB,
    taskId: invitation.taskId,
  });

  const dispatched = notifyResult.status === "sent";

  // Persist the latest user-typed text either way (it's recorded as a comment
  // already, but mirroring it on the invitation row keeps the dashboard
  // status panel in sync). Only advance to SENT if the email actually went
  // out — skipped/failed dispatches leave the previous status untouched.
  const updated = await prisma.referralInvitation.update({
    where: { id: invitation.id },
    data: {
      ...(trimmed ? { messageText: messageBody } : {}),
      ...(dispatched
        ? { sentAt: now, status: ReferralInvitationStatus.SENT }
        : {}),
    },
    select: { id: true, sentAt: true, status: true },
  });

  if (invitation.task?.parentTaskId) {
    await prisma.taskComment.create({
      data: {
        authorUserId: input.referrerUserId,
        kind: TaskCommentKind.STATUS_UPDATE,
        message: buildTrainingAssignmentComment({
          contactMethod: invitation.contactMethod ?? ReferralInvitationContactMethod.EMAIL,
          deliveryStatus: dispatched ? "sent" : "queued",
          recipientName: invitation.recipientName,
        }),
        source: TaskCommentSource.WEB,
        taskId: invitation.task.parentTaskId,
      },
    });
  }

  if (dispatched) {
    await markNextHumanAssignmentSubtaskComplete({
      invitationId: invitation.id,
      now,
      personId: invitation.referrer.person?.id ?? null,
      recipientName: invitation.recipientName,
      userId: input.referrerUserId,
    });
  }

  return {
    status: "ok",
    dispatched,
    ...(notifyResult.status !== "sent" ? { reason: notifyResult.status } : {}),
    invitation: updated,
  };
}

export async function resolveInvitationReferrer(inviteToken: string | null | undefined) {
  const token = inviteToken?.trim();
  if (!token) return null;

  return prisma.referralInvitation.findFirst({
    where: {
      inviteToken: token,
      deletedAt: null,
    },
    select: {
      id: true,
      referrerUserId: true,
      referendumId: true,
      convertedVoteId: true,
      recipientPersonId: true,
      recipientName: true,
      status: true,
      taskId: true,
    },
  });
}

export async function markReferralInvitationCopied(input: {
  invitationId: string;
  contactConfirmed?: boolean;
  messageText?: string | null;
  referrerUserId: string;
  shareChannel?: string | null;
  shareAttemptId?: string | null;
  wasEdited?: boolean;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const invitation = await prisma.referralInvitation.findFirst({
    where: {
      id: input.invitationId,
      referrerUserId: input.referrerUserId,
      deletedAt: null,
    },
    select: {
      contactMethod: true,
      id: true,
      inviteToken: true,
      messageFormat: true,
      recipientName: true,
      shareAttemptId: true,
      status: true,
      taskId: true,
      task: { select: { parentTaskId: true } },
      referrer: {
        select: {
          ...userDisplaySelect,
          referralCode: true,
        },
      },
    },
  });

  if (!invitation) return null;

  const messageText = input.messageText?.trim() || null;
  const existingShareAttemptId = invitation.shareAttemptId?.trim() || null;
  const shareAttemptId =
    input.shareAttemptId?.trim() ||
    (input.contactConfirmed ? existingShareAttemptId : null) ||
    (messageText ? nanoid() : null);
  const shouldRecordShareAttempt =
    Boolean(messageText && shareAttemptId) && shareAttemptId !== existingShareAttemptId;
  const senderName = getUserDisplayName(invitation.referrer) || "A voter";
  const referrerForUrl = invitation.referrer
    ? {
        handle: invitation.referrer.person?.handle ?? null,
        referralCode: invitation.referrer.referralCode,
      }
    : null;
  const inviteUrl = buildUserInviteReferralUrl(referrerForUrl, invitation.inviteToken, getBaseUrl());
  const templateBody = buildDefaultReferralInvitationMessage({
    messageFormat: invitation.messageFormat,
    recipientName: invitation.recipientName,
    senderName,
    treatyUrl: inviteUrl,
  });

  return prisma.$transaction(async (tx) => {
    if (messageText && shareAttemptId && shouldRecordShareAttempt) {
      await recordShareAttempt(tx, {
        id: shareAttemptId,
        userId: input.referrerUserId,
        source: ShareSource.IN_APP,
        surface: "referral_invitation_composer",
        channel:
          input.shareChannel?.trim() ||
          getShareAttemptChannel({
            contactConfirmed: input.contactConfirmed,
            contactMethod: invitation.contactMethod,
          }),
        taskId: invitation.taskId,
        templateId: `referral_invitation:${invitation.messageFormat.toLowerCase()}`,
        templateBody,
        renderedMessage: messageText,
        wasEdited: Boolean(input.wasEdited),
        context: {
          invitationId: invitation.id,
          messageFormat: invitation.messageFormat,
          purpose: input.contactConfirmed
            ? "referral_invitation_manual_contact"
            : "referral_invitation_copy",
          recipientName: invitation.recipientName,
        } satisfies Prisma.InputJsonObject,
      });
    }

    if (input.contactConfirmed && invitation.taskId) {
      if (messageText) {
        await tx.taskComment.create({
          data: {
            authorUserId: input.referrerUserId,
            kind: TaskCommentKind.OUTBOUND_MESSAGE,
            message: messageText,
            source: TaskCommentSource.WEB,
            taskId: invitation.taskId,
          },
        });
      }

      if (invitation.task?.parentTaskId) {
        await tx.taskComment.create({
          data: {
            authorUserId: input.referrerUserId,
            kind: TaskCommentKind.STATUS_UPDATE,
            message: buildTrainingAssignmentComment({
              contactMethod: invitation.contactMethod,
              deliveryStatus: "confirmed",
              recipientName: invitation.recipientName,
            }),
            source: TaskCommentSource.WEB,
            taskId: invitation.task.parentTaskId,
          },
        });
      }

      await markNextHumanAssignmentSubtaskComplete(
        {
          invitationId: invitation.id,
          now,
          personId: invitation.referrer.person?.id ?? null,
          recipientName: invitation.recipientName,
          userId: input.referrerUserId,
        },
        tx,
      );
      if (invitation.contactMethod === ReferralInvitationContactMethod.OTHER) {
        await markUserTreatyPhoneCallComplete(
          {
            invitationId: invitation.id,
            now,
            personId: invitation.referrer.person?.id ?? null,
            recipientName: invitation.recipientName,
            userId: input.referrerUserId,
          },
          tx,
        );
      }
    }

    await tx.referralInvitation.update({
      where: { id: invitation.id },
      data: {
        copiedAt: now,
        ...(messageText ? { messageText } : {}),
        ...(shareAttemptId ? { shareAttemptId } : {}),
        ...(invitation.status === ReferralInvitationStatus.PENDING
          ? { status: ReferralInvitationStatus.COPIED }
          : {}),
      },
    });

    return tx.referralInvitation.findUnique({
      where: { id: invitation.id },
    });
  }, { timeout: 20_000 });
}

export async function convertReferralInvitationForVote(input: {
  inviteToken?: string | null;
  voterUserId: string;
  referendumId: string;
  voteId: string;
}) {
  const invitation = await resolveInvitationReferrer(input.inviteToken);
  if (!invitation) return null;
  if (invitation.referrerUserId === input.voterUserId) return null;
  if (invitation.referendumId && invitation.referendumId !== input.referendumId) {
    return null;
  }
  if (invitation.convertedVoteId) return invitation;

  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const converted = await tx.referralInvitation.update({
      where: { id: invitation.id },
      data: {
        status: ReferralInvitationStatus.CONVERTED,
        convertedVoteId: input.voteId,
        convertedAt: now,
      },
    });

    let completionNotification: {
      commentId: string;
      message: string;
      taskId: string;
    } | null = null;

    if (invitation.taskId) {
      const verification = await verifyReferralInvitationTask(tx, {
        invitationId: invitation.id,
        recipientName: invitation.recipientName,
        taskId: invitation.taskId,
        verifiedAt: now,
        verifiedByUserId: input.voterUserId,
      });
      if (verification.commentId && verification.message) {
        completionNotification = {
          commentId: verification.commentId,
          message: verification.message,
          taskId: invitation.taskId,
        };
      }
    }

    if (invitation.recipientPersonId) {
      await tx.user.updateMany({
        where: {
          id: input.voterUserId,
          personId: null,
        },
        data: {
          personId: invitation.recipientPersonId,
        },
      });
    }

    return { completionNotification, converted };
  });

  if (result.completionNotification) {
    await notifyTaskCommentRecipients({
      authorUserId: input.voterUserId,
      commentId: result.completionNotification.commentId,
      message: result.completionNotification.message,
      taskId: result.completionNotification.taskId,
    });
  }

  return result.converted;
}
