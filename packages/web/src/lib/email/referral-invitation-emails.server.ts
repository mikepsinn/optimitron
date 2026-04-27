import { nanoid } from "nanoid";
import {
  ReferralInvitationStatus,
  ShareSource,
  TaskCommunicationAudience,
  TaskCommunicationFormat,
  TaskCommunicationPurpose,
} from "@optimitron/db/enums";
import type { Prisma } from "@optimitron/db";
import { getReferralEmailBatchSize } from "@/lib/email/batch";
import { getConfiguredFromAddress, sanitizeDisplayName } from "@/lib/email/from-address";
import {
  buildReferralInvitationRecipientEmail,
  getReferralInvitationRecipientDelayDays,
  REFERRAL_INVITATION_RECIPIENT_MAX_STEP,
  type ReferralInvitationRecipientEmailStep,
} from "@/lib/email/referral-invitation-email-sequence";
import { prisma } from "@/lib/prisma";
import { buildReferralInvitationUnsubscribeUrl } from "@/lib/referral-invitations.server";
import { recordShareAttempt } from "@/lib/share-attempts.server";
import { embedShareAttemptId } from "@/lib/share-channels";
import { sendTaskNotification } from "@/lib/tasks/task-notifications.server";
import { sendTreatySenderReminderEmailForInvitation } from "@/lib/email/treaty-sender-emails.server";
import { MS_PER_DAY } from "@/lib/time";
import { buildUserInviteReferralUrl, getBaseUrl } from "@/lib/url";
import { getUserDisplayName, userDisplaySelect } from "@/lib/user-display";

const SENDER_REMINDER_MAX_STEP = 2;
export const SENDER_REMINDER_DELAY_DAYS = 7;

function getSenderInviteEmailFromAddress(senderName: string): string | undefined {
  const address = getConfiguredFromAddress();
  if (!address) return undefined;
  return `${sanitizeDisplayName(senderName, "A voter")} via War on Disease <${address}>`;
}

function getNextRecipientEmailStep(currentStep: number): ReferralInvitationRecipientEmailStep | null {
  const nextStep = currentStep + 1;
  if (nextStep < 1 || nextStep > REFERRAL_INVITATION_RECIPIENT_MAX_STEP) {
    return null;
  }
  return nextStep as ReferralInvitationRecipientEmailStep;
}

function getNextRecipientEmailAt(sentStep: ReferralInvitationRecipientEmailStep, now: Date) {
  const nextStep = getNextRecipientEmailStep(sentStep);
  if (!nextStep) return null;

  const days = getReferralInvitationRecipientDelayDays(nextStep);
  return new Date(now.getTime() + days * MS_PER_DAY);
}

function getNextSenderReminderStep(currentStep: number): 1 | 2 | null {
  const nextStep = currentStep + 1;
  if (nextStep < 1 || nextStep > SENDER_REMINDER_MAX_STEP) return null;
  return nextStep as 1 | 2;
}

function getNextSenderReminderAt(sentStep: 1 | 2, now: Date) {
  if (sentStep >= SENDER_REMINDER_MAX_STEP) return null;
  return new Date(now.getTime() + SENDER_REMINDER_DELAY_DAYS * MS_PER_DAY);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function toTaskCommunicationFormat(messageFormat: string) {
  return messageFormat === "TASK_NOTIFICATION"
    ? TaskCommunicationFormat.TASK_NOTIFICATION
    : TaskCommunicationFormat.SINCERE;
}

export async function sendReferralInvitationEmail(input: {
  invitationId: string;
  manualInitialOnly?: boolean;
  messageText?: string | null;
  referrerUserId?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const invitation = await prisma.referralInvitation.findFirst({
    where: {
      id: input.invitationId,
      ...(input.referrerUserId ? { referrerUserId: input.referrerUserId } : {}),
      deletedAt: null,
    },
    select: {
      convertedAt: true,
      id: true,
      inviteToken: true,
      messageFormat: true,
      recipientEmail: true,
      recipientEmailStep: true,
      recipientName: true,
      recipientUnsubscribeToken: true,
      recipientUnsubscribedAt: true,
      taskId: true,
      referrer: {
        select: {
          ...userDisplaySelect,
          referralCode: true,
        },
      },
      status: true,
    },
  });

  if (!invitation) {
    return { status: "not_found" as const };
  }
  if (!invitation.recipientEmail) {
    return { status: "missing_recipient_email" as const };
  }
  if (!invitation.taskId) {
    return { status: "missing_task" as const };
  }
  if (invitation.convertedAt) {
    return { status: "converted" as const };
  }
  if (
    invitation.status === ReferralInvitationStatus.DECLINED ||
    invitation.status === ReferralInvitationStatus.CANCELLED
  ) {
    return { status: "inactive" as const };
  }
  if (invitation.recipientUnsubscribedAt) {
    return { status: "unsubscribed" as const };
  }
  if (input.manualInitialOnly && invitation.recipientEmailStep > 0) {
    return { status: "already_sent" as const };
  }

  const step = getNextRecipientEmailStep(invitation.recipientEmailStep);
  if (!step) {
    return { status: "maxed" as const };
  }

  const senderName = getUserDisplayName(invitation.referrer) || "A voter";
  const baseInviteUrl = buildUserInviteReferralUrl(
    invitation.referrer,
    invitation.inviteToken,
    getBaseUrl(),
  );
  const shareAttemptId = nanoid();
  const inviteUrl = embedShareAttemptId(baseInviteUrl, baseInviteUrl, shareAttemptId);
  const unsubscribeUrl = buildReferralInvitationUnsubscribeUrl({
    invitationId: invitation.id,
    token: invitation.recipientUnsubscribeToken,
  });
  const templateEmail = buildReferralInvitationRecipientEmail({
    inviteUrl: baseInviteUrl,
    messageFormat: invitation.messageFormat,
    recipientName: invitation.recipientName,
    senderName,
    step,
    unsubscribeUrl,
  });
  const email = buildReferralInvitationRecipientEmail({
    inviteUrl,
    messageFormat: invitation.messageFormat,
    recipientName: invitation.recipientName,
    senderName,
    step,
    unsubscribeUrl,
  });

  try {
    const result = await sendTaskNotification({
      audience: TaskCommunicationAudience.RECIPIENT,
      from: getSenderInviteEmailFromAddress(senderName),
      format: toTaskCommunicationFormat(invitation.messageFormat),
      html: email.html,
      metadataJson: {
        inviteUrl,
        messageFormat: invitation.messageFormat,
        provider: "resend",
        recipientEmailStep: step,
      } satisfies Prisma.InputJsonObject,
      now,
      purpose: TaskCommunicationPurpose.INVITATION,
      recipientEmail: invitation.recipientEmail,
      recipientName: invitation.recipientName,
      referralInvitationId: invitation.id,
      senderName,
      step,
      subject: email.subject,
      taskId: invitation.taskId,
      text: email.text,
      unsubscribeUrl,
    });

    if (result.status !== "sent") {
      return result;
    }

    const nextRecipientEmailAt = getNextRecipientEmailAt(step, now);
    const updated = await prisma.$transaction(async (tx) => {
      await recordShareAttempt(tx, {
        id: shareAttemptId,
        userId: invitation.referrer.id,
        source: ShareSource.EMAIL,
        surface: "referral_invitation_email",
        channel: "email",
        taskId: invitation.taskId,
        templateId: `referral_invitation:${invitation.messageFormat.toLowerCase()}:recipient_step_${step}`,
        templateBody: templateEmail.text,
        renderedMessage: email.text,
        wasEdited: false,
        context: {
          communicationId: result.communication.id,
          invitationId: invitation.id,
          messageFormat: invitation.messageFormat,
          providerMessageId: result.providerMessageId,
          purpose: "referral_invitation_email",
          recipientEmailStep: step,
          recipientName: invitation.recipientName,
          subject: email.subject,
        } satisfies Prisma.InputJsonObject,
      });

      const updatedInvitation = await tx.referralInvitation.update({
        where: { id: invitation.id },
        data: {
          lastRecipientEmailAt: now,
          nextRecipientEmailAt,
          recipientEmailErrorMessage: null,
          recipientEmailProviderMessageId: result.providerMessageId,
          recipientEmailStep: step,
          shareAttemptId,
          ...(input.messageText?.trim() ? { messageText: input.messageText.trim() } : {}),
          ...(invitation.status === ReferralInvitationStatus.SENT ? {} : { sentAt: now }),
          status: ReferralInvitationStatus.SENT,
        },
      });

      await tx.taskCommunication.update({
        where: { id: result.communication.id },
        data: {
          shareAttemptId,
        },
      });

      return updatedInvitation;
    });

    return {
      status: "sent" as const,
      communicationId: result.communication.id,
      invitation: updated,
      providerMessageId: result.providerMessageId,
    };
  } catch (error) {
    await prisma.referralInvitation.update({
      where: { id: invitation.id },
      data: {
        recipientEmailErrorMessage: getErrorMessage(error),
      },
    });
    throw error;
  }
}

export async function processDueReferralInvitationRecipientEmails(now: Date = new Date()) {
  const batchSize = getReferralEmailBatchSize();
  const candidates = await prisma.referralInvitation.findMany({
    where: {
      convertedAt: null,
      deletedAt: null,
      nextRecipientEmailAt: { lte: now },
      recipientEmail: { not: null },
      recipientEmailStep: { lt: REFERRAL_INVITATION_RECIPIENT_MAX_STEP },
      recipientUnsubscribedAt: null,
      status: ReferralInvitationStatus.SENT,
    },
    orderBy: [{ nextRecipientEmailAt: "asc" }],
    select: { id: true },
    take: batchSize,
  });

  let failures = 0;
  let sent = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    try {
      const result = await sendReferralInvitationEmail({
        invitationId: candidate.id,
        now,
      });
      if (result.status === "sent") {
        sent += 1;
      } else {
        skipped += 1;
      }
    } catch {
      failures += 1;
    }
  }

  return {
    failures,
    scanned: candidates.length,
    sent,
    skipped,
  };
}

export async function processDueReferralInvitationSenderEmails(now: Date = new Date()) {
  const batchSize = getReferralEmailBatchSize();
  const candidates = await prisma.referralInvitation.findMany({
    where: {
      convertedAt: null,
      deletedAt: null,
      nextSenderReminderAt: { lte: now },
      senderReminderOptedInAt: { not: null },
      senderReminderStep: { lt: SENDER_REMINDER_MAX_STEP },
      status: {
        in: [
          ReferralInvitationStatus.COPIED,
          ReferralInvitationStatus.SENT,
        ],
      },
    },
    orderBy: [{ nextSenderReminderAt: "asc" }],
    select: {
      id: true,
      senderReminderStep: true,
    },
    take: batchSize,
  });

  let failures = 0;
  let sent = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const reminderStep = getNextSenderReminderStep(candidate.senderReminderStep);
    if (!reminderStep) {
      skipped += 1;
      continue;
    }

    try {
      const result = await sendTreatySenderReminderEmailForInvitation({
        invitationId: candidate.id,
        now,
        reminderStep,
      });

      if (result.status === "sent") {
        sent += 1;
      } else {
        skipped += 1;
      }

      if (
        result.status === "sent" ||
        result.status === "duplicate" ||
        result.status === "suppressed" ||
        result.status === "missing_email" ||
        result.status === "not_found"
      ) {
        await prisma.referralInvitation.update({
          where: { id: candidate.id },
          data: {
            lastSenderReminderAt: now,
            nextSenderReminderAt:
              result.status === "sent" || result.status === "duplicate"
                ? getNextSenderReminderAt(reminderStep, now)
                : null,
            senderReminderStep:
              result.status === "sent" || result.status === "duplicate"
                ? reminderStep
                : SENDER_REMINDER_MAX_STEP,
          },
        });
      }
    } catch {
      failures += 1;
    }
  }

  return {
    failures,
    scanned: candidates.length,
    sent,
    skipped,
  };
}
