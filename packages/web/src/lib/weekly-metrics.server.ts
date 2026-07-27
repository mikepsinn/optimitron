/**
 * Weekly funnel snapshot — the feedback signal for the improvement loop.
 *
 * The daily activity digest (`daily-activity-digest.server.ts`) computes
 * similar numbers but exists to market: it posts to Bluesky and deliberately
 * skips days with no activity. A feedback loop needs the opposite contract:
 * zeros are the most important data points and must always be reported.
 * Hence a separate module with an always-report contract instead of a flag
 * bolted onto the digest.
 *
 * Consumed by `/api/metrics/weekly`, which the weekly GitHub Actions
 * workflow polls and forwards to Slack together with CI health it computes
 * on its own side (the GitHub token and Slack webhook live there, not here).
 */
import {
  ExternalActionRequestStatus,
  PersonhoodVerificationStatus,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { buildOfficialReferendumVoteWhere } from "@/lib/referendum-vote-classification.server";

export interface WeeklyFunnelWindow {
  /** ISO instant, inclusive. */
  start: string;
  /** ISO instant, exclusive. */
  end: string;
  /** Treaty votes cast (official classification, same as the daily digest). */
  votes: number;
  /** Votes whose voter has a verified personhood check. */
  verifiedVotes: number;
  /** Referral signups attributed to a referrer. */
  referrals: number;
  /** New user accounts. */
  signups: number;
  /** Agent-requested external actions awaiting human approval at query time.
   *  Point-in-time for the current window; historical windows report the
   *  count created within the window instead, since PENDING state does not
   *  survive to be observed retroactively. */
  externalActionsPending: number;
}

export interface WeeklyMetricsSnapshot {
  generatedAt: string;
  current: WeeklyFunnelWindow;
  previous: WeeklyFunnelWindow;
}

/**
 * UTC week windows: current = the 7 days ending at `reference`, previous =
 * the 7 days before that. Exported for the boundary test — the off-by-one
 * here is the classic way a metrics series silently double-counts a day.
 */
export function getWeeklyWindows(reference: Date) {
  const end = reference;
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    current: { gte: start, lt: end },
    previous: { gte: prevStart, lt: start },
  };
}

async function countWindow(
  createdAt: { gte: Date; lt: Date },
  pendingIsPointInTime: boolean,
): Promise<WeeklyFunnelWindow> {
  const [votes, verifiedVotes, referrals, signups, externalActionsPending] =
    await Promise.all([
      prisma.referendumVote.count({
        where: { ...buildOfficialReferendumVoteWhere(), createdAt },
      }),
      prisma.referendumVote.count({
        where: {
          ...buildOfficialReferendumVoteWhere(),
          createdAt,
          user: {
            personhoodVerifications: {
              some: {
                status: PersonhoodVerificationStatus.VERIFIED,
                deletedAt: null,
              },
            },
          },
        },
      }),
      prisma.referral.count({
        where: { deletedAt: null, referredByUserId: { not: null }, createdAt },
      }),
      prisma.user.count({ where: { createdAt } }),
      pendingIsPointInTime
        ? prisma.externalActionRequest.count({
            where: {
              status: ExternalActionRequestStatus.PENDING,
              deletedAt: null,
            },
          })
        : prisma.externalActionRequest.count({
            where: { createdAt, deletedAt: null },
          }),
    ]);

  return {
    start: createdAt.gte.toISOString(),
    end: createdAt.lt.toISOString(),
    votes,
    verifiedVotes,
    referrals,
    signups,
    externalActionsPending,
  };
}

export async function getWeeklyMetricsSnapshot(
  reference: Date = new Date(),
): Promise<WeeklyMetricsSnapshot> {
  const windows = getWeeklyWindows(reference);
  const [current, previous] = await Promise.all([
    countWindow(windows.current, true),
    countWindow(windows.previous, false),
  ]);
  return { generatedAt: reference.toISOString(), current, previous };
}
