/**
 * Monthly chain digest publisher. Iterates every user who has voted YES on
 * the 1% Treaty and has an email; for each one, counts direct conversions
 * in the past 30 days and sends the appropriate variant via
 * `sendMonthlyChainDigestEmail`.
 *
 * `EmailLog.dedupeKey` keyed on `{userId}:{yyyy-mm}` guarantees one digest
 * per user per calendar month even if the cron runs multiple times.
 *
 * Driven by `app/api/cron/monthly-chain-digest/route.ts`.
 */

import { nanoid } from "nanoid";
import { ReferendumStatus, VotePosition } from "@optimitron/db";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  claimEmailLog,
  markEmailLogStatus,
} from "@/lib/email/email-log.server";
import { sendResendEmail, type SendResult } from "@/lib/email/resend";
import {
  MONTHLY_CHAIN_DIGEST_TEMPLATE_ID,
  buildMonthlyChainDigestHtml,
  buildMonthlyChainDigestSubject,
  buildMonthlyChainDigestText,
  type MonthlyChainDigestInput,
} from "@/lib/email/monthly-chain-digest-email";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { ROUTES } from "@/lib/routes";
import { buildUserReferralUrl, getBaseUrl } from "@/lib/url";

const log = createLogger("monthly-chain-digest");

export interface MonthlyChainDigestPublishResult {
  status: "ok" | "no-treaty" | "no-eligible-users";
  attempted: number;
  sent: number;
  duplicate: number;
  failed: number;
  errors: string[];
}

interface DigestRecipient {
  userId: string;
  email: string;
  handle: string | null;
  referralCode: string | null;
}

function monthBucket(now: Date): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function monthLabel(now: Date): string {
  return now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function publishMonthlyChainDigest(input?: {
  now?: Date;
}): Promise<MonthlyChainDigestPublishResult> {
  const now = input?.now ?? new Date();
  const bucket = monthBucket(now);
  const label = monthLabel(now);
  const windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const referendum = await prisma.referendum.findUnique({
    where: { slug: TREATY_REFERENDUM_SLUG },
    select: { id: true, status: true },
  });

  if (!referendum) {
    return {
      status: "no-treaty",
      attempted: 0,
      sent: 0,
      duplicate: 0,
      failed: 0,
      errors: [],
    };
  }

  if (referendum.status !== ReferendumStatus.ACTIVE) {
    log.info("Treaty referendum is not ACTIVE — skipping digest", {
      status: referendum.status,
    });
    return {
      status: "no-treaty",
      attempted: 0,
      sent: 0,
      duplicate: 0,
      failed: 0,
      errors: [],
    };
  }

  // Eligible recipients: users who cast a YES vote on the treaty referendum
  // at any point. `User.email` is non-nullable in the schema so no null
  // filter is needed. Even if their conversion count this month is 0, they
  // receive the resend-the-forward-kit variant.
  const recipientRows = await prisma.user.findMany({
    where: {
      deletedAt: null,
      isSystem: false,
      referendumVotes: {
        some: {
          referendumId: referendum.id,
          answer: VotePosition.YES,
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
      email: true,
      referralCode: true,
      person: { select: { handle: true } },
    },
  });

  const recipients: DigestRecipient[] = recipientRows
    .filter((row) => row.email.length > 0)
    .map((row) => ({
      userId: row.id,
      email: row.email,
      handle: row.person?.handle ?? null,
      referralCode: row.referralCode,
    }));

  if (recipients.length === 0) {
    return {
      status: "no-eligible-users",
      attempted: 0,
      sent: 0,
      duplicate: 0,
      failed: 0,
      errors: [],
    };
  }

  const result: MonthlyChainDigestPublishResult = {
    status: "ok",
    attempted: 0,
    sent: 0,
    duplicate: 0,
    failed: 0,
    errors: [],
  };

  for (const recipient of recipients) {
    result.attempted += 1;
    try {
      const [monthlyConversionCount, totalConversionCount] = await Promise.all(
        [
          prisma.referendumVote.count({
            where: {
              referendumId: referendum.id,
              answer: VotePosition.YES,
              referredByUserId: recipient.userId,
              deletedAt: null,
              createdAt: { gte: windowStart },
            },
          }),
          prisma.referendumVote.count({
            where: {
              referendumId: referendum.id,
              answer: VotePosition.YES,
              referredByUserId: recipient.userId,
              deletedAt: null,
            },
          }),
        ],
      );

      const referralUrl = buildUserReferralUrl({
        handle: recipient.handle,
        referralCode: recipient.referralCode,
      });

      const digestInput: MonthlyChainDigestInput = {
        monthlyConversionCount,
        totalConversionCount,
        referralUrl,
        dashboardUrl: `${getBaseUrl()}${ROUTES.dashboard}`,
        monthLabel: label,
      };

      const sendResult = await sendMonthlyChainDigestEmail({
        userId: recipient.userId,
        toAddress: recipient.email,
        monthBucket: bucket,
        digestInput,
      });

      if (sendResult.status === "duplicate") {
        result.duplicate += 1;
      } else if (sendResult.status === "sent") {
        result.sent += 1;
      }
    } catch (error) {
      result.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`${recipient.userId}: ${message}`);
      log.error("Failed to send monthly digest", {
        userId: recipient.userId,
        error: message,
      });
    }
  }

  return result;
}

async function sendMonthlyChainDigestEmail(input: {
  userId: string;
  toAddress: string;
  monthBucket: string;
  digestInput: MonthlyChainDigestInput;
}): Promise<SendResult | { status: "duplicate" }> {
  const emailLogId = nanoid();
  const dedupeKey = `${MONTHLY_CHAIN_DIGEST_TEMPLATE_ID}:${input.userId}:${input.monthBucket}`;
  const subject = buildMonthlyChainDigestSubject(input.digestInput);

  const claimed = await claimEmailLog({
    dedupeKey,
    id: emailLogId,
    now: new Date(),
    subject,
    templateId: MONTHLY_CHAIN_DIGEST_TEMPLATE_ID,
    toAddress: input.toAddress,
    userId: input.userId,
  });

  if (claimed.duplicate || !claimed.emailLogId) {
    return { status: "duplicate" };
  }

  try {
    const result = await sendResendEmail({
      emailLogId: claimed.emailLogId,
      html: buildMonthlyChainDigestHtml(input.digestInput),
      scope: "onboarding",
      skipWishoniaSignature: true,
      subject,
      text: buildMonthlyChainDigestText(input.digestInput),
      to: input.toAddress,
      userId: input.userId,
    });

    if (result.status === "sent") {
      await markEmailLogStatus({
        emailLogId: claimed.emailLogId,
        providerMessageId: result.id,
        status: "SENT",
      });
    }
    return result;
  } catch (error) {
    await markEmailLogStatus({
      emailLogId: claimed.emailLogId,
      errorMessage: error instanceof Error ? error.message : String(error),
      status: "FAILED",
    });
    throw error;
  }
}
