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

import React from "react";
import {
  ReferralInvitationStatus,
  ReferendumStatus,
  TaskStatus,
  VotePosition,
} from "@optimitron/db";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { SendResult } from "@/lib/email/resend";
import { sendDedupedEmail } from "@/lib/email/send-deduped-email.server";
import {
  MONTHLY_CHAIN_DIGEST_TEMPLATE_ID,
  buildMonthlyChainDigestSubject,
  type MonthlyChainDigestLeader,
  type MonthlyChainDigestPerson,
  type MonthlyChainDigestInput,
} from "@/lib/email/monthly-chain-digest-email";
import { MonthlyChainDigestReactEmail } from "@/lib/email/monthly-chain-digest-react-email";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { ROUTES } from "@/lib/routes";
import { TREATY_SIGNER_TASK_KEY_PREFIX } from "@/lib/tasks/task-keys";
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

const PENDING_INVITATION_STATUSES: ReferralInvitationStatus[] = [
  ReferralInvitationStatus.PENDING,
  ReferralInvitationStatus.COPIED,
  ReferralInvitationStatus.SENT,
];

function monthBucket(now: Date): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
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
  const windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  // Label the month the conversion data actually covers (the prior calendar
  // month when cron fires on day 1), not the month we send. The dedupe
  // bucket still uses `now` so we ship exactly one digest per recipient per
  // calendar month.
  const label = monthLabel(windowStart);

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

  const overduePresidentSnapshot = await loadOverduePresidentSnapshot(now);

  for (const recipient of recipients) {
    result.attempted += 1;
    try {
      const [
        monthlyConversionCount,
        totalConversionCount,
        completedEmployees,
        overdueEmployeeCount,
        overdueEmployees,
      ] = await Promise.all([
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
        prisma.referendumVote
          .findMany({
            where: {
              referendumId: referendum.id,
              answer: VotePosition.YES,
              referredByUserId: recipient.userId,
              deletedAt: null,
              createdAt: { gte: windowStart },
            },
            orderBy: { createdAt: "desc" },
            take: 8,
            select: {
              createdAt: true,
              person: { select: { displayName: true } },
              user: {
                select: {
                  person: { select: { displayName: true } },
                },
              },
            },
          })
          .then((votes): MonthlyChainDigestPerson[] =>
            votes.map((vote) => ({
              completedAt: vote.createdAt,
              // CLAUDE.md Display Identity: read displayName from Person only.
              // The previous chain leaked the referred user's auth email to
              // the referrer when no Person displayName was set; we use the
              // generic "Employee" placeholder instead.
              displayName:
                vote.person.displayName?.trim() ||
                vote.user.person?.displayName?.trim() ||
                "Employee",
            })),
          ),
        prisma.referralInvitation.count({
          where: {
            deletedAt: null,
            referrerUserId: recipient.userId,
            status: { in: PENDING_INVITATION_STATUSES },
            OR: [{ referendumId: referendum.id }, { referendumId: null }],
          },
        }),
        prisma.referralInvitation
          .findMany({
            where: {
              deletedAt: null,
              referrerUserId: recipient.userId,
              status: { in: PENDING_INVITATION_STATUSES },
              OR: [{ referendumId: referendum.id }, { referendumId: null }],
            },
            orderBy: { createdAt: "asc" },
            take: 8,
            select: { recipientName: true },
          })
          .then((invitations): MonthlyChainDigestPerson[] =>
            invitations.map((invitation) => ({
              displayName: invitation.recipientName,
            })),
          ),
      ]);

      const baseUrl = getBaseUrl();
      const referralUrl = buildUserReferralUrl(
        {
          handle: recipient.handle,
          referralCode: recipient.referralCode,
        },
        baseUrl,
      );

      const digestInput: MonthlyChainDigestInput = {
        completedEmployees,
        monthlyConversionCount,
        overdueEmployeeCount,
        overdueEmployees,
        overduePresidentCount: overduePresidentSnapshot.count,
        overduePresidents: overduePresidentSnapshot.presidents,
        totalConversionCount,
        referralUrl,
        dashboardUrl: `${baseUrl}${ROUTES.dashboard}`,
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
      } else {
        // disabled / suppressed — terminal, not retryable, but visible.
        result.failed += 1;
        result.errors.push(
          `${recipient.userId}: send_aborted:${sendResult.status}`,
        );
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
  const subject = buildMonthlyChainDigestSubject(input.digestInput);
  return sendDedupedEmail({
    dedupeKey: `${MONTHLY_CHAIN_DIGEST_TEMPLATE_ID}:${input.userId}:${input.monthBucket}`,
    templateId: MONTHLY_CHAIN_DIGEST_TEMPLATE_ID,
    subject,
    react: React.createElement(MonthlyChainDigestReactEmail, {
      input: input.digestInput,
    }),
    userId: input.userId,
    toAddress: input.toAddress,
    scope: "onboarding",
    skipWishoniaSignature: true,
  });
}

async function loadOverduePresidentSnapshot(
  now: Date,
): Promise<{ count: number; presidents: MonthlyChainDigestLeader[] }> {
  const where = {
    assigneePersonId: { not: null },
    deletedAt: null,
    dueAt: { lt: now },
    status: { not: TaskStatus.VERIFIED },
    taskKey: { startsWith: `${TREATY_SIGNER_TASK_KEY_PREFIX}:` },
  } as const;

  const [count, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      take: 8,
      select: {
        assigneeAffiliationSnapshot: true,
        assigneePerson: {
          select: {
            currentAffiliation: true,
            displayName: true,
          },
        },
      },
    }),
  ]);

  return {
    count,
    presidents: tasks.map((task) => ({
      countryLabel:
        task.assigneePerson?.currentAffiliation ||
        task.assigneeAffiliationSnapshot ||
        null,
      displayName: task.assigneePerson?.displayName || "President",
    })),
  };
}
