import { nanoid } from "nanoid";
import {
  EmailLogStatus,
  Prisma,
  ReferralInvitationStatus,
  VotePosition,
} from "@optimitron/db";
import { buildUnsubscribeUrl } from "@/lib/email/unsub-url";
import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/lib/routes";
import { sendResendEmail, type SendResult } from "@/lib/resend";
import {
  buildTreatyRecipientVotedEmail,
  buildTreatyMonthlyScorecardEmail,
  buildTreatyNeverSharedReengagementEmail,
  buildTreatySecondSenderReminderEmail,
  buildTreatySendOneMoreReminderEmail,
  buildTreatyVoteConfirmedEmail,
} from "@/lib/treaty-sender-email-sequence";
import { FLOW_VOTER_LIVES_SAVED_ROUNDED } from "@/lib/treaty-share-flow-parameters";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { getBaseUrl } from "@/lib/url";

const DEFAULT_TREATY_SENDER_EMAIL_BATCH_SIZE = 50;

type TreatySenderEmailStatus =
  | SendResult["status"]
  | "duplicate"
  | "missing_email"
  | "not_found";

interface TreatySenderEmailResult {
  emailLogId?: string | null;
  providerMessageId?: string | null;
  status: TreatySenderEmailStatus;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function absoluteUrl(path: string) {
  return new URL(path, getBaseUrl()).toString();
}

function formatLivesScore(invitationCount: number) {
  const value = invitationCount * FLOW_VOTER_LIVES_SAVED_ROUNDED.value;
  if (value === 0) return "0";
  return Number(value.toPrecision(3)).toLocaleString("en-US");
}

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function getTreatyMonthlyScorecardPeriodKey(now: Date) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

const sharedInvitationStatuses = [
  ReferralInvitationStatus.COPIED,
  ReferralInvitationStatus.SENT,
  ReferralInvitationStatus.CONVERTED,
];

const pendingInvitationStatuses = [
  ReferralInvitationStatus.COPIED,
  ReferralInvitationStatus.SENT,
];

async function claimTreatySenderEmail(input: {
  context: Prisma.InputJsonValue;
  emailLogId: string;
  subject: string;
  templateId: string;
  toAddress: string;
  userId: string;
  now: Date;
}) {
  try {
    await prisma.emailLog.create({
      data: {
        id: input.emailLogId,
        userId: input.userId,
        toAddress: input.toAddress,
        subject: input.subject,
        templateId: input.templateId,
        sendContext: input.context,
        status: EmailLogStatus.QUEUED,
        sentAt: input.now,
      },
    });
    return { duplicate: false as const, emailLogId: input.emailLogId };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { duplicate: true as const, emailLogId: null };
    }
    throw error;
  }
}

async function markTreatySenderEmailStatus(
  emailLogId: string,
  status: typeof EmailLogStatus[keyof typeof EmailLogStatus],
  errorMessage?: string | null,
  providerMessageId?: string | null,
) {
  await prisma.emailLog.update({
    where: { id: emailLogId },
    data: {
      errorMessage: errorMessage ?? null,
      status,
      ...(providerMessageId ? { providerMessageId } : {}),
    },
  });
}

async function sendClaimedTreatySenderEmail(input: {
  context: Prisma.InputJsonValue;
  emailLogId: string;
  html: string;
  subject: string;
  templateId: string;
  text: string;
  toAddress: string;
  userId: string;
  now?: Date;
}): Promise<TreatySenderEmailResult> {
  const now = input.now ?? new Date();
  const claim = await claimTreatySenderEmail({
    context: input.context,
    emailLogId: input.emailLogId,
    subject: input.subject,
    templateId: input.templateId,
    toAddress: input.toAddress,
    userId: input.userId,
    now,
  });

  if (claim.duplicate || !claim.emailLogId) {
    return { status: "duplicate" };
  }

  try {
    const result = await sendResendEmail({
      emailLogId: claim.emailLogId,
      html: input.html,
      scope: "referral_sequence",
      subject: input.subject,
      text: input.text,
      to: input.toAddress,
      userId: input.userId,
    });

    if (result.status === "sent") {
      await markTreatySenderEmailStatus(
        claim.emailLogId,
        EmailLogStatus.SENT,
        null,
        result.id,
      );
      return {
        emailLogId: claim.emailLogId,
        providerMessageId: result.id,
        status: "sent",
      };
    }

    const errorMessage =
      result.status === "suppressed"
        ? "suppressed:user_opt_out"
        : `send_aborted:${result.status}`;
    await markTreatySenderEmailStatus(claim.emailLogId, EmailLogStatus.FAILED, errorMessage);
    return { emailLogId: claim.emailLogId, status: result.status };
  } catch (error) {
    await markTreatySenderEmailStatus(
      claim.emailLogId,
      EmailLogStatus.FAILED,
      getErrorMessage(error),
    ).catch(() => undefined);
    throw error;
  }
}

export async function sendTreatyVoteConfirmedEmailForUser(input: {
  referendumId: string;
  userId: string;
  now?: Date;
}): Promise<TreatySenderEmailResult> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, id: true },
  });

  if (!user) return { status: "not_found" };
  if (!user.email) return { status: "missing_email" };

  const emailLogId = nanoid();
  const dashboardUrl = absoluteUrl(ROUTES.dashboard);
  const unsubscribeUrl = buildUnsubscribeUrl({
    emailLogId,
    scope: "referral_sequence",
    userId: user.id,
  });
  const email = buildTreatyVoteConfirmedEmail({
    dashboardUrl,
    unsubscribeUrl,
  });

  return sendClaimedTreatySenderEmail({
    context: {
      kind: "treaty_vote_confirmed",
      referendumId: input.referendumId,
    },
    emailLogId,
    html: email.html,
    now: input.now,
    subject: email.subject,
    templateId: `treaty_vote_confirmed:${input.referendumId}`,
    text: email.text,
    toAddress: user.email,
    userId: user.id,
  });
}

export async function sendTreatyRecipientVotedEmailForInvitation(input: {
  invitationId: string;
  now?: Date;
}): Promise<TreatySenderEmailResult> {
  const invitation = await prisma.referralInvitation.findUnique({
    where: { id: input.invitationId },
    select: {
      id: true,
      messageFormat: true,
      recipientName: true,
      referrerUserId: true,
      referrer: {
        select: {
          email: true,
          id: true,
        },
      },
    },
  });

  if (!invitation) return { status: "not_found" };
  if (!invitation.referrer.email) return { status: "missing_email" };

  const [confirmedCount, pendingCount] = await prisma.$transaction([
    prisma.referralInvitation.count({
      where: {
        convertedAt: { not: null },
        deletedAt: null,
        referrerUserId: invitation.referrerUserId,
      },
    }),
    prisma.referralInvitation.count({
      where: {
        convertedAt: null,
        deletedAt: null,
        referrerUserId: invitation.referrerUserId,
        status: {
          in: [
            ReferralInvitationStatus.PENDING,
            ReferralInvitationStatus.COPIED,
            ReferralInvitationStatus.SENT,
          ],
        },
      },
    }),
  ]);

  const emailLogId = nanoid();
  const dashboardUrl = absoluteUrl(ROUTES.dashboard);
  const unsubscribeUrl = buildUnsubscribeUrl({
    emailLogId,
    scope: "referral_sequence",
    userId: invitation.referrer.id,
  });
  const email = buildTreatyRecipientVotedEmail({
    confirmedLives: formatLivesScore(confirmedCount),
    dashboardUrl,
    messageFormat: invitation.messageFormat,
    pendingLives: formatLivesScore(pendingCount),
    recipientName: invitation.recipientName,
    unsubscribeUrl,
  });

  return sendClaimedTreatySenderEmail({
    context: {
      confirmedCount,
      invitationId: invitation.id,
      kind: "treaty_recipient_voted",
      pendingCount,
    },
    emailLogId,
    html: email.html,
    now: input.now,
    subject: email.subject,
    templateId: `treaty_recipient_voted:${invitation.id}`,
    text: email.text,
    toAddress: invitation.referrer.email,
    userId: invitation.referrer.id,
  });
}

export async function sendTreatySenderReminderEmailForInvitation(input: {
  invitationId: string;
  reminderStep: 1 | 2;
  now?: Date;
}): Promise<TreatySenderEmailResult> {
  const invitation = await prisma.referralInvitation.findUnique({
    where: { id: input.invitationId },
    select: {
      id: true,
      referrerUserId: true,
      referrer: {
        select: {
          email: true,
          id: true,
        },
      },
    },
  });

  if (!invitation) return { status: "not_found" };
  if (!invitation.referrer.email) return { status: "missing_email" };

  const [sentCount, votedCount, pendingCount] = await prisma.$transaction([
    prisma.referralInvitation.count({
      where: {
        deletedAt: null,
        referrerUserId: invitation.referrerUserId,
        status: { in: sharedInvitationStatuses },
      },
    }),
    prisma.referralInvitation.count({
      where: {
        convertedAt: { not: null },
        deletedAt: null,
        referrerUserId: invitation.referrerUserId,
      },
    }),
    prisma.referralInvitation.count({
      where: {
        convertedAt: null,
        deletedAt: null,
        referrerUserId: invitation.referrerUserId,
        status: { in: pendingInvitationStatuses },
      },
    }),
  ]);

  const sendUrl = absoluteUrl(ROUTES.send);
  const emailLogId = nanoid();
  const unsubscribeUrl = buildUnsubscribeUrl({
    emailLogId,
    scope: "referral_sequence",
    userId: invitation.referrer.id,
  });
  const email =
    input.reminderStep === 1
      ? buildTreatySendOneMoreReminderEmail({
          confirmedLives: formatLivesScore(votedCount),
          pendingLives: formatLivesScore(pendingCount),
          sendUrl,
          sentCount,
          unsubscribeUrl,
          votedCount,
        })
      : buildTreatySecondSenderReminderEmail({
          pendingCount,
          sendUrl,
          sentCount,
          unsubscribeUrl,
        });

  return sendClaimedTreatySenderEmail({
    context: {
      invitationId: invitation.id,
      kind: "treaty_sender_reminder",
      pendingCount,
      reminderStep: input.reminderStep,
      sentCount,
      votedCount,
    },
    emailLogId,
    html: email.html,
    now: input.now,
    subject: email.subject,
    templateId: `treaty_sender_reminder:${invitation.id}:${input.reminderStep}`,
    text: email.text,
    toAddress: invitation.referrer.email,
    userId: invitation.referrer.id,
  });
}

export async function sendTreatyNeverSharedReengagementEmailForVote(input: {
  referendumId: string;
  userId: string;
  now?: Date;
}): Promise<TreatySenderEmailResult> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, id: true },
  });

  if (!user) return { status: "not_found" };
  if (!user.email) return { status: "missing_email" };

  const emailLogId = nanoid();
  const sendUrl = absoluteUrl(ROUTES.send);
  const unsubscribeUrl = buildUnsubscribeUrl({
    emailLogId,
    scope: "referral_sequence",
    userId: user.id,
  });
  const email = buildTreatyNeverSharedReengagementEmail({
    sendUrl,
    unsubscribeUrl,
  });

  return sendClaimedTreatySenderEmail({
    context: {
      kind: "treaty_never_shared_reengagement",
      referendumId: input.referendumId,
    },
    emailLogId,
    html: email.html,
    now: input.now,
    subject: email.subject,
    templateId: `treaty_never_shared_reengagement:${input.referendumId}`,
    text: email.text,
    toAddress: user.email,
    userId: user.id,
  });
}

export async function processDueTreatyNeverSharedReengagementEmails(
  now: Date = new Date(),
  batchSize: number = DEFAULT_TREATY_SENDER_EMAIL_BATCH_SIZE,
) {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const candidates = await prisma.referendumVote.findMany({
    where: {
      answer: VotePosition.YES,
      createdAt: { lte: cutoff },
      deletedAt: null,
      referendum: {
        deletedAt: null,
        slug: TREATY_REFERENDUM_SLUG,
      },
      user: {
        emailLogs: {
          none: {
            templateId: { startsWith: "treaty_never_shared_reengagement:" },
          },
        },
        sentReferralInvitations: {
          none: {
            deletedAt: null,
          },
        },
      },
    },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      referendumId: true,
      userId: true,
    },
    take: batchSize,
  });

  let failures = 0;
  let sent = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    try {
      const result = await sendTreatyNeverSharedReengagementEmailForVote({
        referendumId: candidate.referendumId,
        userId: candidate.userId,
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

export async function sendTreatyMonthlyScorecardEmailForUser(input: {
  periodKey?: string;
  userId: string;
  now?: Date;
}): Promise<TreatySenderEmailResult> {
  const now = input.now ?? new Date();
  const periodKey = input.periodKey ?? getTreatyMonthlyScorecardPeriodKey(now);
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, id: true },
  });

  if (!user) return { status: "not_found" };
  if (!user.email) return { status: "missing_email" };

  const [sentCount, votedCount, pendingCount, pendingInvitations, sharedFurtherCount] =
    await prisma.$transaction([
      prisma.referralInvitation.count({
        where: {
          deletedAt: null,
          referrerUserId: user.id,
          status: { in: sharedInvitationStatuses },
        },
      }),
      prisma.referralInvitation.count({
        where: {
          convertedAt: { not: null },
          deletedAt: null,
          referrerUserId: user.id,
        },
      }),
      prisma.referralInvitation.count({
        where: {
          convertedAt: null,
          deletedAt: null,
          referrerUserId: user.id,
          status: { in: pendingInvitationStatuses },
        },
      }),
      prisma.referralInvitation.findMany({
        where: {
          convertedAt: null,
          deletedAt: null,
          referrerUserId: user.id,
          status: { in: pendingInvitationStatuses },
        },
        orderBy: [{ createdAt: "asc" }],
        select: { recipientName: true },
        take: 5,
      }),
      prisma.referralInvitation.count({
        where: {
          deletedAt: null,
          referrer: {
            referendumVotes: {
              some: {
                deletedAt: null,
                referredByUserId: user.id,
                referendum: {
                  deletedAt: null,
                  slug: TREATY_REFERENDUM_SLUG,
                },
              },
            },
          },
        },
      }),
    ]);

  const pendingNames =
    pendingInvitations.length > 0
      ? pendingInvitations.map((invitation) => invitation.recipientName).join(", ")
      : "no one";
  const chainDepth = sharedFurtherCount > 0 ? 2 : sentCount > 0 ? 1 : 0;
  const emailLogId = nanoid();
  const dashboardUrl = absoluteUrl(ROUTES.dashboard);
  const unsubscribeUrl = buildUnsubscribeUrl({
    emailLogId,
    scope: "referral_sequence",
    userId: user.id,
  });
  const email = buildTreatyMonthlyScorecardEmail({
    chainDepth,
    confirmedLifetimeCount: formatCount(votedCount),
    confirmedLives: formatLivesScore(votedCount),
    dashboardUrl,
    pendingLives: formatLivesScore(pendingCount),
    pendingNames,
    sentCount,
    sharedFurtherCount,
    totalLives: formatLivesScore(votedCount),
    unsubscribeUrl,
    votedCount,
  });

  return sendClaimedTreatySenderEmail({
    context: {
      chainDepth,
      kind: "treaty_monthly_scorecard",
      pendingCount,
      periodKey,
      sentCount,
      sharedFurtherCount,
      votedCount,
    },
    emailLogId,
    html: email.html,
    now,
    subject: email.subject,
    templateId: `treaty_monthly_scorecard:${periodKey}`,
    text: email.text,
    toAddress: user.email,
    userId: user.id,
  });
}

export async function processDueTreatyMonthlyScorecardEmails(
  now: Date = new Date(),
  batchSize: number = DEFAULT_TREATY_SENDER_EMAIL_BATCH_SIZE,
) {
  const periodKey = getTreatyMonthlyScorecardPeriodKey(now);
  const candidates = await prisma.user.findMany({
    where: {
      deletedAt: null,
      emailLogs: {
        none: {
          templateId: `treaty_monthly_scorecard:${periodKey}`,
        },
      },
      sentReferralInvitations: {
        some: {
          deletedAt: null,
          status: { in: sharedInvitationStatuses },
        },
      },
    },
    orderBy: [{ createdAt: "asc" }],
    select: { id: true },
    take: batchSize,
  });

  let failures = 0;
  let sent = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    try {
      const result = await sendTreatyMonthlyScorecardEmailForUser({
        periodKey,
        userId: candidate.id,
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
