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

function getReferralEmailBatchSize() {
  const rawValue = Number(serverEnv.REFERRAL_EMAIL_BATCH_SIZE);
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 50;
}

async function sendReferralSequenceStep(
  user: ReferralSequenceUser,
  referralCount: number,
  step: number,
) {
  const message = buildReferralSequenceEmail({
    step,
    referralCount,
    name: user.name,
    shareUrl: buildUserReferralUrl(user),
  });

  return sendResendEmail({
    to: user.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}

async function advanceReferralSequence(userId: string, nextStep: number, now: Date) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      referralEmailSequenceStep: nextStep,
      referralEmailSequenceLastSentAt: now,
    },
  });
}

export async function sendWelcomeReferralEmailForUser(
  user: ReferralSequenceUser,
  now: Date = new Date(),
) {
  const result = await sendReferralSequenceStep(user, 0, 0);
  if (result.status !== "sent") {
    return result;
  }

  const nextStep = user.newsletterSubscribed ? 1 : REFERRAL_EMAIL_SEQUENCE_LENGTH;
  await advanceReferralSequence(user.id, nextStep, now);

  return result;
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

    // Claim by advancing the step BEFORE sending. If another cron
    // invocation (or the welcome handler) already advanced, count === 0.
    const nextStep = action.step + 1;
    const { count } = await prisma.user.updateMany({
      where: { id: user.id, referralEmailSequenceStep: action.step },
      data: {
        referralEmailSequenceStep: nextStep,
        referralEmailSequenceLastSentAt: now,
      },
    });

    if (count === 0) {
      continue;
    }

    try {
      const result = await sendReferralSequenceStep(user, referralCount, action.step);
      if (result.status === "sent") {
        sent += 1;
      }
    } catch (error) {
      // Roll back so the next cron run retries this step
      await prisma.user
        .updateMany({
          where: { id: user.id, referralEmailSequenceStep: nextStep },
          data: {
            referralEmailSequenceStep: action.step,
            referralEmailSequenceLastSentAt: user.referralEmailSequenceLastSentAt,
          },
        })
        .catch((revertError) => {
          console.error("[REFERRAL EMAIL] Revert failed", user.id, revertError);
        });
      failures += 1;
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
