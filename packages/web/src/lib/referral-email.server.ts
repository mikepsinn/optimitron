import { serverEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getReferralCountsByUserIds } from "@/lib/referral.server";
import {
  buildReferralSequenceEmail,
  getReferralSequenceAction,
  REFERRAL_EMAIL_SEQUENCE_LENGTH,
} from "@/lib/referral-email-sequence";
import { sendResendEmail, isResendConfigured } from "@/lib/resend";
import { buildUserReferralUrl } from "@/lib/url";
import { EmailLogStatus, Prisma } from "@optimitron/db";

interface ReferralSequenceUser {
  createdAt: Date;
  email: string;
  id: string;
  name: string | null;
  newsletterSubscribed: boolean;
  referralCode: string;
  referralEmailSequenceLastSentAt: Date | null;
  referralEmailSequenceStep: number;
  username: string | null;
}

interface ReferralSequenceMessage {
  html: string;
  subject: string;
  text: string;
}

interface ReferralEmailClaim {
  duplicate: boolean;
  emailLogId: string | null;
}

function getReferralEmailBatchSize() {
  const rawValue = Number(serverEnv.REFERRAL_EMAIL_BATCH_SIZE);
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 50;
}

async function sendReferralSequenceStep(
  user: ReferralSequenceUser,
  message: ReferralSequenceMessage,
) {
  return sendResendEmail({
    to: user.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}

function buildReferralSequenceMessage(
  user: ReferralSequenceUser,
  referralCount: number,
  step: number,
) {
  return buildReferralSequenceEmail({
    step,
    referralCount,
    name: user.name,
    shareUrl: buildUserReferralUrl(user),
  });
}

function getReferralSequenceTemplateId(step: number) {
  return `referral_sequence_${step}`;
}

function getNextReferralSequenceStep(user: ReferralSequenceUser, step: number) {
  if (step === 0 && !user.newsletterSubscribed) {
    return REFERRAL_EMAIL_SEQUENCE_LENGTH;
  }

  return Math.min(step + 1, REFERRAL_EMAIL_SEQUENCE_LENGTH);
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function markReferralEmailStatus(
  emailLogId: string,
  status: typeof EmailLogStatus[keyof typeof EmailLogStatus],
  errorMessage?: string | null,
) {
  await prisma.emailLog.update({
    where: { id: emailLogId },
    data: {
      errorMessage: errorMessage ?? null,
      status,
    },
  });
}

async function claimReferralSequenceEmail(
  user: ReferralSequenceUser,
  step: number,
  subject: string,
  now: Date,
): Promise<ReferralEmailClaim> {
  const templateId = getReferralSequenceTemplateId(step);
  const nextStep = getNextReferralSequenceStep(user, step);

  try {
    const emailLog = await prisma.$transaction(async (tx) => {
      const { count } = await tx.user.updateMany({
        where: { id: user.id, referralEmailSequenceStep: step },
        data: {
          referralEmailSequenceStep: nextStep,
          referralEmailSequenceLastSentAt: now,
        },
      });

      if (count === 0) {
        return null;
      }

      return tx.emailLog.create({
        data: {
          userId: user.id,
          toAddress: user.email,
          subject,
          templateId,
          status: EmailLogStatus.QUEUED,
          sentAt: now,
        },
      });
    });

    return {
      duplicate: false,
      emailLogId: emailLog?.id ?? null,
    };
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const existingLog = await prisma.emailLog.findUnique({
      where: {
        userId_templateId: {
          userId: user.id,
          templateId,
        },
      },
      select: {
        sentAt: true,
      },
    });

    if (existingLog) {
      await prisma.user.updateMany({
        where: { id: user.id, referralEmailSequenceStep: step },
        data: {
          referralEmailSequenceStep: nextStep,
          referralEmailSequenceLastSentAt: existingLog.sentAt,
        },
      });
    }

    return {
      duplicate: true,
      emailLogId: null,
    };
  }
}

export async function sendWelcomeReferralEmailForUser(
  user: ReferralSequenceUser,
  now: Date = new Date(),
) {
  if (!isResendConfigured()) {
    return { status: "disabled" as const };
  }

  const message = buildReferralSequenceMessage(user, 0, 0);
  const claim = await claimReferralSequenceEmail(user, 0, message.subject, now);
  if (claim.duplicate) {
    return { status: "duplicate" as const };
  }

  if (!claim.emailLogId) {
    return { status: "skipped" as const };
  }

  try {
    const result = await sendReferralSequenceStep(user, message);
    if (result.status !== "sent") {
      return result;
    }

    await markReferralEmailStatus(claim.emailLogId, EmailLogStatus.SENT);

    return result;
  } catch (error) {
    await markReferralEmailStatus(
      claim.emailLogId,
      EmailLogStatus.FAILED,
      getErrorMessage(error),
    ).catch((updateError) => {
      console.error("[REFERRAL EMAIL] Failed to mark welcome email log", user.id, updateError);
    });
    throw error;
  }
}

export async function processDueReferralSequenceEmails(now: Date = new Date()) {
  if (!isResendConfigured()) {
    return {
      disabled: true,
      completed: 0,
      failures: 0,
      scanned: 0,
      sent: 0,
    };
  }

  const batchSize = getReferralEmailBatchSize();
  const candidates = await prisma.user.findMany({
    where: {
      deletedAt: null,
      referralEmailSequenceStep: {
        lt: REFERRAL_EMAIL_SEQUENCE_LENGTH,
      },
    },
    orderBy: [{ createdAt: "asc" }],
    take: batchSize * 4,
    select: {
      createdAt: true,
      email: true,
      id: true,
      name: true,
      newsletterSubscribed: true,
      referralCode: true,
      referralEmailSequenceLastSentAt: true,
      referralEmailSequenceStep: true,
      username: true,
    },
  });

  const referralCounts = await getReferralCountsByUserIds(candidates.map((user) => user.id));
  let completed = 0;
  let failures = 0;
  let sent = 0;

  for (const user of candidates) {
    if (sent >= batchSize) {
      break;
    }

    const referralCount = referralCounts.get(user.id) ?? 0;
    const action = getReferralSequenceAction(
      {
        ...user,
        referralCount,
      },
      now,
    );

    if (!action) {
      continue;
    }

    if (action.type === "complete") {
      await prisma.user.update({
        where: { id: user.id },
        data: { referralEmailSequenceStep: REFERRAL_EMAIL_SEQUENCE_LENGTH },
      });
      completed += 1;
      continue;
    }

    try {
      const message = buildReferralSequenceMessage(user, referralCount, action.step);
      const claim = await claimReferralSequenceEmail(user, action.step, message.subject, now);
      if (claim.duplicate || !claim.emailLogId) {
        continue;
      }

      const result = await sendReferralSequenceStep(user, message);
      if (result.status === "sent") {
        await markReferralEmailStatus(claim.emailLogId, EmailLogStatus.SENT);
        sent += 1;
      }
    } catch (error) {
      failures += 1;
      const templateId = getReferralSequenceTemplateId(action.step);
      await prisma.emailLog
        .updateMany({
          where: {
            userId: user.id,
            templateId,
            status: EmailLogStatus.QUEUED,
          },
          data: {
            errorMessage: getErrorMessage(error),
            status: EmailLogStatus.FAILED,
          },
        })
        .catch((updateError) => {
          console.error("[REFERRAL EMAIL] Failed to mark email log", user.id, updateError);
        });
      console.error("[REFERRAL EMAIL] Failed to send step", action.step, user.id, error);
    }
  }

  return {
    disabled: false,
    completed,
    failures,
    scanned: candidates.length,
    sent,
  };
}
