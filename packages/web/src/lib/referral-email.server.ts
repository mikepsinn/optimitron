import { serverEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getReferralCountsByUserIds } from "@/lib/referral.server";
import {
  buildReferralSequenceEmail,
  getReferralSequenceAction,
  REFERRAL_EMAIL_SEQUENCE_LENGTH,
} from "@/lib/referral-email-sequence";
import { sendResendEmail, isResendConfigured } from "@/lib/resend";
import { listTasks } from "@/lib/tasks.server";
import {
  countOverdueSigners,
  getOverdueSignerHighlights,
  type OverdueSignerHighlight,
} from "@/lib/tasks/overdue-signers.server";
import { buildUserReferralUrl } from "@/lib/url";
import { getUserDisplayName } from "@/lib/user-display";
import { EmailLogStatus, Prisma } from "@optimitron/db";

type DecoratedTaskList = Awaited<ReturnType<typeof listTasks>>;

interface ReferralSequenceUser {
  countryCode?: string | null;
  createdAt: Date;
  email: string;
  id: string;
  name: string | null;
  newsletterSubscribed: boolean;
  referralCode: string;
  referralEmailSequenceLastSentAt: Date | null;
  referralEmailSequenceStep: number;
  username: string | null;
  // Optional so callers that haven't widened their query yet still typecheck.
  // The user-display helpers tolerate a missing person and fall back to the
  // legacy User columns.
  person?: {
    id: string;
    handle: string | null;
    displayName: string | null;
    image: string | null;
    countryCode?: string | null;
  } | null;
}

async function loadDecoratedTreatyTasks(): Promise<DecoratedTaskList> {
  try {
    return await listTasks({ limit: 500, visibility: "public" });
  } catch (error) {
    console.error("[REFERRAL EMAIL] Failed to load task highlights", error);
    return [] as unknown as DecoratedTaskList;
  }
}

function resolveUserCountryCode(user: ReferralSequenceUser): string | null {
  return user.countryCode ?? user.person?.countryCode ?? null;
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

function buildHighlightsForUser(
  user: ReferralSequenceUser,
  decoratedTasks: DecoratedTaskList,
  now: Date,
): OverdueSignerHighlight[] {
  try {
    return getOverdueSignerHighlights({
      decoratedTasks,
      userCountryCode: resolveUserCountryCode(user),
      now,
      limit: 3,
    });
  } catch (error) {
    console.error("[REFERRAL EMAIL] Failed to compute signer highlights", user.id, error);
    return [];
  }
}

function computeOverdueSignerCount(decoratedTasks: DecoratedTaskList, now: Date): number {
  try {
    return countOverdueSigners(decoratedTasks, now);
  } catch (error) {
    console.error("[REFERRAL EMAIL] Failed to count overdue signers", error);
    return 0;
  }
}

function buildReferralSequenceMessage(
  user: ReferralSequenceUser,
  referralCount: number,
  step: number,
  decoratedTasks: DecoratedTaskList,
  now: Date,
) {
  return buildReferralSequenceEmail({
    highlights: buildHighlightsForUser(user, decoratedTasks, now),
    name: getUserDisplayName(user),
    overdueSignerCount: computeOverdueSignerCount(decoratedTasks, now),
    referralCode: user.referralCode,
    referralCount,
    shareUrl: buildUserReferralUrl(user),
    step,
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

  const decoratedTasks = await loadDecoratedTreatyTasks();
  const message = buildReferralSequenceMessage(user, 0, 0, decoratedTasks, now);
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
      countryCode: true,
      createdAt: true,
      email: true,
      id: true,
      name: true,
      newsletterSubscribed: true,
      referralCode: true,
      referralEmailSequenceLastSentAt: true,
      referralEmailSequenceStep: true,
      username: true,
      person: {
        select: {
          id: true,
          handle: true,
          displayName: true,
          image: true,
          countryCode: true,
        },
      },
    },
  });

  const referralCounts = await getReferralCountsByUserIds(candidates.map((user) => user.id));
  const decoratedTasks = candidates.length > 0 ? await loadDecoratedTreatyTasks() : ([] as unknown as DecoratedTaskList);
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
      const message = buildReferralSequenceMessage(user, referralCount, action.step, decoratedTasks, now);
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
