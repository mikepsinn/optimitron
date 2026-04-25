import { nanoid } from "nanoid";
import {
  ReferralInvitationContactMethod,
  ReferralInvitationMessageFormat,
  ReferralInvitationStatus,
  ShareSource,
  TaskCategory,
  TaskClaimPolicy,
  TaskDifficulty,
  TaskStatus,
} from "@optimitron/db";
import type { Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { recordShareAttempt } from "@/lib/share-attempts.server";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import {
  buildReferralInvitationMessage,
  getReferralInvitationFirstName,
} from "@/lib/referral-invitation-copy";
import { buildUserInviteReferralUrl, getBaseUrl } from "@/lib/url";
import { getUserDisplayName, userDisplaySelect } from "@/lib/user-display";

const INVITE_TOKEN_SIZE = 24;
const UNSUBSCRIBE_TOKEN_SIZE = 32;
const CREATE_LIMIT_PER_HOUR = 50;
const REFERRAL_INVITATION_TASK_KEY_PREFIX = "program:one-percent-treaty:referral-invitation";

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

async function createUniqueRecipientUnsubscribeToken() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = nanoid(UNSUBSCRIBE_TOKEN_SIZE);
    const existing = await prisma.referralInvitation.findUnique({
      where: { recipientUnsubscribeToken: token },
      select: { id: true },
    });
    if (!existing) return token;
  }
  throw new Error("Unable to create unique invitation unsubscribe token.");
}

export function buildReferralInvitationUnsubscribeUrl(input: {
  baseUrl?: string;
  invitationId: string;
  token: string;
}) {
  const baseUrl = input.baseUrl ?? getBaseUrl();
  const url = new URL("/api/referral-invitations/unsubscribe", baseUrl);
  url.searchParams.set("i", input.invitationId);
  url.searchParams.set("t", input.token);
  return url.toString();
}

function buildReferralInvitationTaskKey(inviteToken: string) {
  return `${REFERRAL_INVITATION_TASK_KEY_PREFIX}:${inviteToken}`;
}

function buildReferralInvitationTaskTitle(recipientName: string) {
  const firstName = getReferralInvitationFirstName(recipientName) || recipientName;
  return `Invite ${firstName} to vote on the 1% Treaty`;
}

function buildReferralInvitationTaskDescription(recipientName: string) {
  const firstName = getReferralInvitationFirstName(recipientName) || recipientName;
  return [
    `${firstName} was invited to vote on the 1% Treaty.`,
    "The task is complete when their verified vote converts the invitation.",
  ].join("\n\n");
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
  const recipientUnsubscribeToken = await createUniqueRecipientUnsubscribeToken();
  const messageFormat = input.messageFormat ?? ReferralInvitationMessageFormat.SINCERE;
  const inviteUrl = buildUserInviteReferralUrl(referrer, inviteToken, getBaseUrl());
  const senderName = getUserDisplayName(referrer) || "A voter";
  const messageText = input.messageText?.trim() || null;
  const taskContactTemplate =
    messageText ??
    buildDefaultReferralInvitationMessage({
      messageFormat,
      recipientName,
      senderName,
      treatyUrl: inviteUrl,
    });

  return prisma.$transaction(async (tx) => {
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
      const task = await tx.task.create({
        data: {
          assigneeAffiliationSnapshot: recipientName,
          assigneePersonId: recipientPerson?.id ?? null,
          category: TaskCategory.OUTREACH,
          claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
          contactLabel: "Complete treaty vote",
          contactTemplate: taskContactTemplate,
          contactUrl: inviteUrl,
          contextJson: {
            inviteToken,
            kind: "referral_invitation",
            referendumSlug: input.referendumSlug || TREATY_REFERENDUM_SLUG,
          },
          description: buildReferralInvitationTaskDescription(recipientName),
          difficulty: TaskDifficulty.TRIVIAL,
          estimatedEffortHours: 0.01,
          interestTags: ["one-percent-treaty", "war-on-disease"],
          isPublic: false,
          ownerUserId: input.referrerUserId,
          roleTitle: "Referred treaty voter",
          skillTags: ["voting"],
          status: TaskStatus.ACTIVE,
          taskKey: buildReferralInvitationTaskKey(inviteToken),
          title: buildReferralInvitationTaskTitle(recipientName),
        },
        select: { id: true },
      });
      linkedTaskId = task.id;
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
        recipientUnsubscribeToken,
      },
    });
  });
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
  messageText?: string | null;
  referrerUserId: string;
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
      id: true,
      inviteToken: true,
      messageFormat: true,
      recipientName: true,
      status: true,
      taskId: true,
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
  const shareAttemptId = input.shareAttemptId?.trim() || (messageText ? nanoid() : null);
  const senderName = getUserDisplayName(invitation.referrer) || "A voter";
  const inviteUrl = buildUserInviteReferralUrl(invitation.referrer, invitation.inviteToken, getBaseUrl());
  const templateBody = buildDefaultReferralInvitationMessage({
    messageFormat: invitation.messageFormat,
    recipientName: invitation.recipientName,
    senderName,
    treatyUrl: inviteUrl,
  });

  return prisma.$transaction(async (tx) => {
    if (messageText && shareAttemptId) {
      await recordShareAttempt(tx, {
        id: shareAttemptId,
        userId: input.referrerUserId,
        source: ShareSource.IN_APP,
        surface: "referral_invitation_composer",
        channel: "copy-message",
        taskId: invitation.taskId,
        templateId: `referral_invitation:${invitation.messageFormat.toLowerCase()}`,
        templateBody,
        renderedMessage: messageText,
        wasEdited: Boolean(input.wasEdited),
        context: {
          invitationId: invitation.id,
          messageFormat: invitation.messageFormat,
          purpose: "referral_invitation_copy",
          recipientName: invitation.recipientName,
        } satisfies Prisma.InputJsonObject,
      });
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
  });
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
  return prisma.$transaction(async (tx) => {
    const converted = await tx.referralInvitation.update({
      where: { id: invitation.id },
      data: {
        status: ReferralInvitationStatus.CONVERTED,
        convertedVoteId: input.voteId,
        convertedAt: now,
        nextRecipientEmailAt: null,
        nextSenderReminderAt: null,
      },
    });

    if (invitation.taskId) {
      await tx.task.updateMany({
        where: {
          id: invitation.taskId,
          deletedAt: null,
          status: { not: TaskStatus.VERIFIED },
        },
        data: {
          actualEffortSeconds: 30,
          completedAt: now,
          completionEvidence:
            `${invitation.recipientName} verified a vote through referral invitation ${invitation.id}.`,
          status: TaskStatus.VERIFIED,
          verifiedAt: now,
          verifiedByUserId: input.voterUserId,
        },
      });
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

    return converted;
  });
}

export async function unsubscribeReferralInvitationRecipient(input: {
  invitationId: string;
  token: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const updated = await prisma.referralInvitation.updateMany({
    where: {
      id: input.invitationId,
      recipientUnsubscribeToken: input.token,
      deletedAt: null,
    },
    data: {
      nextRecipientEmailAt: null,
      recipientUnsubscribedAt: now,
    },
  });

  return updated.count > 0;
}
