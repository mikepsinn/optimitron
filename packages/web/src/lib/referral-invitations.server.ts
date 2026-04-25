import { nanoid } from "nanoid";
import {
  ReferralInvitationContactMethod,
  ReferralInvitationMessageFormat,
  ReferralInvitationStatus,
} from "@optimitron/db";
import { serverEnv } from "@/lib/env";
import {
  buildReferralInvitationRecipientEmail,
  getReferralInvitationRecipientDelayDays,
  REFERRAL_INVITATION_RECIPIENT_MAX_STEP,
  type ReferralInvitationRecipientEmailStep,
} from "@/lib/referral-invitation-email-sequence";
import { prisma } from "@/lib/prisma";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import {
  buildReferralInvitationMessage,
  getReferralInvitationFirstName,
} from "@/lib/referral-invitation-copy";
import { sendExternalResendEmail } from "@/lib/resend";
import { buildUserInviteReferralUrl, getBaseUrl } from "@/lib/url";
import { getUserDisplayName } from "@/lib/user-display";

const INVITE_TOKEN_SIZE = 24;
const UNSUBSCRIBE_TOKEN_SIZE = 32;
const CREATE_LIMIT_PER_HOUR = 50;
const DEFAULT_BATCH_SIZE = 50;

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

function getReferralInvitationEmailBatchSize() {
  const rawValue = Number(serverEnv.REFERRAL_EMAIL_BATCH_SIZE);
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : DEFAULT_BATCH_SIZE;
}

function getSenderInviteEmailFromAddress(senderName: string) {
  const rawFrom = serverEnv.EMAIL_FROM ?? "";
  const emailAddress = rawFrom.includes("<")
    ? rawFrom.replace(/^.*<|>.*$/g, "").trim()
    : rawFrom.trim();

  if (!emailAddress || !emailAddress.includes("@")) {
    return undefined;
  }

  const safeSenderName = senderName.replace(/[<>\r\n"]/g, "").trim() || "A voter";
  return `${safeSenderName} via War on Disease <${emailAddress}>`;
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
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
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
    select: { email: true },
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

  const referendum = await prisma.referendum.findFirst({
    where: {
      slug: input.referendumSlug || TREATY_REFERENDUM_SLUG,
      deletedAt: null,
    },
    select: { id: true },
  });

  const inviteToken = await createUniqueInviteToken();
  const recipientUnsubscribeToken = await createUniqueRecipientUnsubscribeToken();
  const recipientPerson = recipientEmail
    ? await prisma.person.upsert({
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

  return prisma.referralInvitation.create({
    data: {
      referrerUserId: input.referrerUserId,
      recipientPersonId: recipientPerson?.id ?? null,
      recipientName,
      recipientEmail,
      contactMethod: input.contactMethod ?? (recipientEmail ? ReferralInvitationContactMethod.EMAIL : null),
      messageFormat: input.messageFormat ?? ReferralInvitationMessageFormat.SINCERE,
      messageText: input.messageText?.trim() || null,
      referendumId: referendum?.id ?? null,
      taskId: input.taskId || null,
      shareAttemptId: input.shareAttemptId || null,
      inviteToken,
      recipientUnsubscribeToken,
    },
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
      status: true,
    },
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

  return prisma.referralInvitation.update({
    where: { id: invitation.id },
    data: {
      status: ReferralInvitationStatus.CONVERTED,
      convertedVoteId: input.voteId,
      convertedAt: new Date(),
      nextRecipientEmailAt: null,
      nextSenderNudgeAt: null,
    },
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
      referrer: {
        select: {
          id: true,
          name: true,
          referralCode: true,
          username: true,
          person: {
            select: {
              displayName: true,
              handle: true,
              id: true,
              image: true,
            },
          },
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
  if (invitation.convertedAt) {
    return { status: "converted" as const };
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
  const inviteUrl = buildUserInviteReferralUrl(
    invitation.referrer,
    invitation.inviteToken,
    getBaseUrl(),
  );
  const unsubscribeUrl = buildReferralInvitationUnsubscribeUrl({
    invitationId: invitation.id,
    token: invitation.recipientUnsubscribeToken,
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
    const result = await sendExternalResendEmail({
      from: getSenderInviteEmailFromAddress(senderName),
      html: email.html,
      subject: email.subject,
      text: email.text,
      to: invitation.recipientEmail,
      unsubscribeUrl,
    });

    if (result.status !== "sent") {
      return result;
    }

    const nextRecipientEmailAt = getNextRecipientEmailAt(step, now);
    const updated = await prisma.referralInvitation.update({
      where: { id: invitation.id },
      data: {
        lastRecipientEmailAt: now,
        nextRecipientEmailAt,
        recipientEmailErrorMessage: null,
        recipientEmailProviderMessageId: result.id,
        recipientEmailStep: step,
        ...(input.messageText?.trim() ? { messageText: input.messageText.trim() } : {}),
        ...(invitation.status === ReferralInvitationStatus.SENT ? {} : { sentAt: now }),
        status: ReferralInvitationStatus.SENT,
      },
    });

    return { status: "sent" as const, invitation: updated, providerMessageId: result.id };
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
  const batchSize = getReferralInvitationEmailBatchSize();
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
