import { createHash } from "node:crypto";
import { EmailLogStatus, Prisma, ShareSource } from "@optimitron/db";
import { nanoid } from "nanoid";
import { serverEnv } from "@/lib/env";
import { buildUnsubscribeUrl } from "@/lib/email/unsub-url";
import { prisma } from "@/lib/prisma";
import { getReferralCountsByUserIds } from "@/lib/referral.server";
import {
  buildEmailShareButton,
  buildReferralSequenceEmail,
  EMAIL_SHARE_CHANNELS,
  getReferralSequenceAction,
  pickSubjectVariant,
  REFERRAL_EMAIL_SEQUENCE_MAX_STEP,
  type EmailShareButton,
} from "@/lib/referral-email-sequence";
import { sendResendEmail, isResendConfigured } from "@/lib/resend";
import { embedShareAttemptId } from "@/lib/share-channels";
import { listTasks } from "@/lib/tasks.server";
import {
  buildTaskShareTokens,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";
import {
  countOverdueSigners,
  getOverdueSignerHighlights,
  type OverdueSignerHighlight,
} from "@/lib/tasks/overdue-signers.server";
import { renderTemplate } from "@/lib/tasks/render-template";
import {
  getUsableShareTemplates,
  type ShareTemplate,
} from "@/lib/tasks/share-templates";
import { resolveUserPresidentHighlight } from "@/lib/tasks/user-president.server";
import { buildUserReferralUrl } from "@/lib/url";
import { getUserDisplayName } from "@/lib/user-display";

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
  unsubscribedScopes?: readonly string[];
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
  emailLogId: string,
  options?: { skipSuppressionCheck?: boolean },
) {
  return sendResendEmail({
    to: user.email,
    userId: user.id,
    scope: "referral_sequence",
    emailLogId,
    subject: message.subject,
    html: message.html,
    text: message.text,
    skipSuppressionCheck: options?.skipSuppressionCheck,
  });
}

function buildHighlightsForUser(
  user: ReferralSequenceUser,
  decoratedTasks: DecoratedTaskList,
  now: Date,
): OverdueSignerHighlight[] {
  // Recipients should never see leaders from other countries in their email —
  // that's spam-feeling noise and reveals our list to users who can't act on
  // those foreign tasks anyway. Scope the highlights to the user's own
  // jurisdiction; when we don't know it, fall through to the generic
  // "N world leaders overdue → open the task queue" card.
  const countryCode = resolveUserCountryCode(user);
  if (!countryCode) return [];

  try {
    const countryLower = countryCode.trim().toLowerCase();
    const scopedTasks = decoratedTasks.filter(
      (task) => task.assigneePerson?.countryCode?.toLowerCase() === countryLower,
    );
    if (scopedTasks.length === 0) return [];

    return getOverdueSignerHighlights({
      decoratedTasks: scopedTasks,
      userCountryCode: countryCode,
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

interface BuiltReferralMessage {
  html: string;
  presidentRenderedMessage: string | null;
  subject: string;
  subjectTemplate: string;
  subjectVariantId: string;
  bodyTemplateId: string | null;
  bodyTemplateBody: string | null;
  renderedMessage: string | null;
  sendContext: Prisma.InputJsonValue;
  shareAttempts: Array<{
    id: string;
    channel: string;
    outboundMessage: string;
    renderedHash: string | null;
  }>;
  text: string;
}

/**
 * Build the email AND pre-generate the 7 share-attempt IDs that will be
 * embedded in the outbound message URL per share button. Returns both the
 * email content and the ShareAttempt metadata for batch insertion.
 */
async function buildReferralSequenceMessage(
  user: ReferralSequenceUser,
  referralCount: number,
  step: number,
  decoratedTasks: DecoratedTaskList,
  now: Date,
  emailLogId: string,
): Promise<BuiltReferralMessage> {
  const countryCode = resolveUserCountryCode(user);
  const overdueSignerCount = computeOverdueSignerCount(decoratedTasks, now);
  const highlights = buildHighlightsForUser(user, decoratedTasks, now);
  const presidentHighlight = resolveUserPresidentHighlight({
    countryCode,
    decoratedTasks,
    now,
  });

  const referralUrl = buildUserReferralUrl(user);
  const citizenName = getUserDisplayName(user);

  let template: ShareTemplate | null = null;
  let renderedBase: string | null = null;
  let tokens: Record<string, string> | null = null;

  if (presidentHighlight) {
    const presidentTask = decoratedTasks.find((t) => t.id === presidentHighlight.taskId);
    const delayStats = presidentTask ? getTaskDelayStats(presidentTask, now) : null;
    tokens = buildTaskShareTokens({
      targetLabel: presidentHighlight.leaderFullName,
      taskTitle: "Sign the 1% Treaty",
      currentDelayDays: delayStats?.currentDelayDays ?? 0,
      currentEconomicValueUsdLost: delayStats?.currentEconomicValueUsdLost ?? null,
      currentHumanLivesLost: delayStats?.currentHumanLivesLost ?? null,
      countryCode,
      citizenName,
      treatyUrl: referralUrl,
      now,
    });

    const usable = getUsableShareTemplates(tokens);
    if (usable.length > 0) {
      template = usable[Math.floor(Math.random() * usable.length)];
      renderedBase = `${renderTemplate(template.body, tokens)}\n\n${referralUrl}`.trim();
    }
  }

  // Pre-generate share-attempt IDs (one per button) and compute each button's
  // outbound message with its own sa= embedded.
  const shareAttempts: BuiltReferralMessage["shareAttempts"] = [];
  const shareButtons: EmailShareButton[] = [];

  const canPersonalize = presidentHighlight != null && template != null && renderedBase != null;
  let presidentRenderedMessage: string | null = null;

  if (canPersonalize && presidentHighlight && renderedBase) {
    const taskTitle = `Remind ${presidentHighlight.leaderFullName}`;
    const shareText = tokens?.task_title
      ? `${tokens.task_title}`
      : `Please sign the 1% Treaty, ${presidentHighlight.leaderFullName}.`;

    const copyMessageId = nanoid();
    presidentRenderedMessage = embedShareAttemptId(renderedBase, referralUrl, copyMessageId);
    shareAttempts.push({
      id: copyMessageId,
      channel: "copy-message",
      outboundMessage: presidentRenderedMessage,
      renderedHash: sha256Hex(presidentRenderedMessage),
    });

    for (const entry of EMAIL_SHARE_CHANNELS) {
      const saId = nanoid();
      const attributedReferralUrl = embedShareAttemptId(referralUrl, referralUrl, saId);
      const outboundMessage = embedShareAttemptId(renderedBase, referralUrl, saId);
      const renderedHash = sha256Hex(outboundMessage);
      shareButtons.push(
        buildEmailShareButton(
          entry.channel,
          entry.label,
          outboundMessage,
          attributedReferralUrl,
          taskTitle,
          shareText,
        ),
      );
      shareAttempts.push({
        id: saId,
        channel: entry.channel,
        outboundMessage,
        renderedHash,
      });
    }
  }

  const hasPersonalized =
    canPersonalize &&
    presidentRenderedMessage != null &&
    shareButtons.length > 0;

  const presidentFullName = presidentHighlight?.leaderFullName ?? null;
  const presidentFirstName = presidentHighlight?.leaderFirstName ?? null;

  // Uniform-random subject selection from the appropriate pool.
  const subjectPick = pickSubjectVariant({
    deathsSinceLastEmail: 0, // filled at a later iteration if we track it
    overdueSignerCount,
    presidentFirstName,
    presidentFullName,
    referralCount,
    step,
    wastedUsdSinceLastEmail: 0,
  });

  const email = buildReferralSequenceEmail({
    highlights,
    name: citizenName,
    overdueSignerCount,
    presidentHighlight: hasPersonalized ? presidentHighlight : null,
    presidentRenderedMessage,
    referralCode: user.referralCode,
    referralCount,
    shareButtons: hasPersonalized ? shareButtons : undefined,
    shareUrl: referralUrl,
    step,
    subject: subjectPick.subject,
    unsubscribeUrl: buildUnsubscribeUrl({
      userId: user.id,
      scope: "referral_sequence",
      emailLogId,
    }),
  });

  const sendContext: Prisma.InputJsonValue = {
    step,
    countryCode,
    referralCount,
    overdueSignerCount,
    daysSinceSignup: Math.round((now.getTime() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
    presidentSlug: presidentHighlight?.taskId ?? null,
    presidentFullName,
  };

  return {
    html: email.html,
    presidentRenderedMessage,
    text: email.text,
    subject: email.subject,
    subjectTemplate: subjectPick.subjectTemplate,
    subjectVariantId: subjectPick.variantId,
    bodyTemplateId: template?.id ?? null,
    bodyTemplateBody: template?.body ?? null,
    renderedMessage: presidentRenderedMessage ?? renderedBase,
    sendContext,
    shareAttempts,
  };
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function getReferralSequenceTemplateId(step: number) {
  return `referral_sequence_${step}`;
}

function getNextReferralSequenceStep(user: ReferralSequenceUser, step: number) {
  if (step === 0 && !user.newsletterSubscribed) {
    return REFERRAL_EMAIL_SEQUENCE_MAX_STEP;
  }

  return Math.min(step + 1, REFERRAL_EMAIL_SEQUENCE_MAX_STEP);
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

async function completeReferralSequenceForUser(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { referralEmailSequenceStep: REFERRAL_EMAIL_SEQUENCE_MAX_STEP },
  });
}

interface ClaimExtras {
  bodyTemplateBody: string | null;
  bodyTemplateId: string | null;
  renderedMessage: string | null;
  sendContext: Prisma.InputJsonValue;
  shareAttempts: BuiltReferralMessage["shareAttempts"];
  subjectTemplate: string;
  subjectVariantId: string;
}

async function claimReferralSequenceEmail(
  user: ReferralSequenceUser,
  step: number,
  subject: string,
  now: Date,
  extras: ClaimExtras,
  emailLogId: string,
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

      const created = await tx.emailLog.create({
        data: {
          id: emailLogId,
          userId: user.id,
          toAddress: user.email,
          subject,
          templateId,
          subjectVariantId: extras.subjectVariantId,
          subjectTemplate: extras.subjectTemplate,
          bodyTemplateId: extras.bodyTemplateId,
          sendContext: extras.sendContext,
          status: EmailLogStatus.QUEUED,
          sentAt: now,
        },
      });

      // Pre-create the ShareAttempt rows whose IDs are already embedded in the
      // outgoing email's share-button URLs. createMany is one round-trip.
      if (extras.shareAttempts.length > 0) {
        await tx.shareAttempt.createMany({
          data: extras.shareAttempts.map((sa) => ({
            id: sa.id,
            userId: user.id,
            source: ShareSource.EMAIL,
            surface: "referral_email",
            channel: sa.channel,
            emailLogId: created.id,
            templateId: extras.bodyTemplateId,
            templateHash: extras.bodyTemplateBody ? sha256Hex(extras.bodyTemplateBody) : null,
            templateBody: extras.bodyTemplateBody,
            renderedMessage: sa.outboundMessage,
            renderedHash: sa.renderedHash,
            wasEdited: false,
            context: extras.sendContext,
          })),
          skipDuplicates: true,
        });
      }

      return created;
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

  const welcomeAction = getReferralSequenceAction(
    {
      createdAt: user.createdAt,
      newsletterSubscribed: user.newsletterSubscribed,
      referralCount: 0,
      referralEmailSequenceLastSentAt: user.referralEmailSequenceLastSentAt,
      referralEmailSequenceStep: user.referralEmailSequenceStep,
      unsubscribedScopes: user.unsubscribedScopes,
    },
    now,
  );
  if (welcomeAction?.type === "complete" && welcomeAction.reason === "opted_out") {
    await completeReferralSequenceForUser(user.id);
    return { status: "suppressed" as const, reason: "user_opt_out" as const };
  }

  const decoratedTasks = await loadDecoratedTreatyTasks();
  const emailLogId = nanoid();
  const message = await buildReferralSequenceMessage(user, 0, 0, decoratedTasks, now, emailLogId);
  const claim = await claimReferralSequenceEmail(
    user,
    0,
    message.subject,
    now,
    {
      bodyTemplateBody: message.bodyTemplateBody,
      bodyTemplateId: message.bodyTemplateId,
      renderedMessage: message.renderedMessage,
      sendContext: message.sendContext,
      shareAttempts: message.shareAttempts,
      subjectTemplate: message.subjectTemplate,
      subjectVariantId: message.subjectVariantId,
    },
    emailLogId,
  );
  if (claim.duplicate) {
    return { status: "duplicate" as const };
  }

  if (!claim.emailLogId) {
    return { status: "skipped" as const };
  }

  try {
    const result = await sendReferralSequenceStep(user, message, claim.emailLogId, {
      skipSuppressionCheck: !user.newsletterSubscribed,
    });
    if (result.status === "sent") {
      await markReferralEmailStatus(claim.emailLogId, EmailLogStatus.SENT, null, result.id);
      return result;
    }

    const errorMessage =
      result.status === "suppressed" ? "suppressed:user_opt_out" : `send_aborted:${result.status}`;
    await markReferralEmailStatus(claim.emailLogId, EmailLogStatus.FAILED, errorMessage);
    if (result.status === "suppressed") {
      await completeReferralSequenceForUser(user.id);
    }

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
        lt: REFERRAL_EMAIL_SEQUENCE_MAX_STEP,
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
      unsubscribedScopes: true,
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
        data: { referralEmailSequenceStep: REFERRAL_EMAIL_SEQUENCE_MAX_STEP },
      });
      completed += 1;
      continue;
    }

    try {
      const emailLogId = nanoid();
      const message = await buildReferralSequenceMessage(user, referralCount, action.step, decoratedTasks, now, emailLogId);
      const claim = await claimReferralSequenceEmail(
        user,
        action.step,
        message.subject,
        now,
        {
          bodyTemplateBody: message.bodyTemplateBody,
          bodyTemplateId: message.bodyTemplateId,
          renderedMessage: message.renderedMessage,
          sendContext: message.sendContext,
          shareAttempts: message.shareAttempts,
          subjectTemplate: message.subjectTemplate,
          subjectVariantId: message.subjectVariantId,
        },
        emailLogId,
      );
      if (claim.duplicate || !claim.emailLogId) {
        continue;
      }

      const result = await sendReferralSequenceStep(user, message, claim.emailLogId);
      if (result.status === "sent") {
        await markReferralEmailStatus(claim.emailLogId, EmailLogStatus.SENT, null, result.id);
        sent += 1;
      } else {
        const errorMessage =
          result.status === "suppressed" ? "suppressed:user_opt_out" : `send_aborted:${result.status}`;
        await markReferralEmailStatus(claim.emailLogId, EmailLogStatus.FAILED, errorMessage);
        if (result.status === "suppressed") {
          await completeReferralSequenceForUser(user.id);
          completed += 1;
        }
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
