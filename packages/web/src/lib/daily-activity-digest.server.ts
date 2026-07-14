import { unstable_cache } from "next/cache";
import { PersonhoodVerificationStatus } from "@optimitron/db";
import { createAppPasswordAgent } from "@optimitron/hypercerts";
import { getContracts } from "@optimitron/treasury-shared/addresses";
import { ethers } from "ethers";
import {
  getProvider,
  getVoterPrizeTreasuryContract,
} from "@/lib/contracts/server-client";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { buildOfficialReferendumVoteWhere } from "@/lib/referendum-vote-classification.server";
import { ROUTES } from "@/lib/routes";
import { getConfiguredSiteOrigin } from "@/lib/site";
import { getStartOfZonedDayUtc, getZonedDateParts } from "@/lib/time-zone";

const logger = createLogger("daily-activity-digest");
const DAILY_DIGEST_COLLECTION = "app.bsky.feed.post";
const DAILY_DIGEST_RKEY_PREFIX = "daily-digest-";
const DEFAULT_DIGEST_TIME_ZONE = "America/Chicago";
const ZERO_ADDRESS = /^0x0{40}$/i;

interface PrizeDepositSummary {
  count: number;
  totalAmount: string;
}

export interface DailyActivityDigestWindow {
  dateKey: string;
  label: string;
  timeZone: string;
  start: Date;
  end: Date;
}

export interface DailyActivityDigestSummary {
  dateKey: string;
  label: string;
  timeZone: string;
  totalVotes: number;
  verifiedVotes: number;
  referralSignups: number;
  prizeDepositCount: number;
  prizeDepositAmount: string;
  hasActivity: boolean;
}

export interface DailyActivityDigestRef {
  uri: string;
  cid: string | null;
  href: string;
  rkey: string;
}

export interface DailyActivityDigestPublishResult {
  status: "published" | "skipped";
  reason: "missing-atproto-credentials" | "no-activity" | null;
  summary: DailyActivityDigestSummary;
  text: string | null;
  ref: DailyActivityDigestRef | null;
}

function getDigestTimeZone() {
  return process.env.DAILY_DIGEST_TIME_ZONE ?? DEFAULT_DIGEST_TIME_ZONE;
}

function getTreasuryChainId() {
  const raw =
    process.env.TREASURY_CHAIN_ID ?? process.env.EOP_CHAIN_ID ?? "84532";
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDigestBaseUrl() {
  return getConfiguredSiteOrigin({ allowLocalFallback: true });
}

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

export function getDailyActivityDigestWindow(
  referenceDate: Date = new Date(),
): DailyActivityDigestWindow {
  const timeZone = getDigestTimeZone();
  const currentDayParts = getZonedDateParts(referenceDate, timeZone);
  const end = getStartOfZonedDayUtc(currentDayParts, timeZone);
  const previousDayReference = new Date(end.getTime() - 1);
  const previousDayParts = getZonedDateParts(previousDayReference, timeZone);
  const start = getStartOfZonedDayUtc(previousDayParts, timeZone);
  const dateKey = `${previousDayParts.year}-${padNumber(previousDayParts.month)}-${padNumber(previousDayParts.day)}`;
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(start);

  return {
    dateKey,
    label,
    timeZone,
    start,
    end,
  };
}

function formatUsdcAmount(amount: string) {
  const numeric = Number(ethers.formatUnits(BigInt(amount), 6));
  return numeric.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: numeric < 1000 && !Number.isInteger(numeric) ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

async function scanPrizeDepositSummaryForWindow(
  startIso: string,
  endIso: string,
  chainId: number,
): Promise<PrizeDepositSummary> {
  const contracts = getContracts(chainId);
  if (!contracts || ZERO_ADDRESS.test(contracts.voterPrizeTreasury)) {
    return { count: 0, totalAmount: "0" };
  }

  const start = new Date(startIso);
  const end = new Date(endIso);
  const provider = getProvider(chainId);
  const treasury = getVoterPrizeTreasuryContract(chainId, provider);
  const logs = await treasury.queryFilter(
    treasury.filters.Deposited(),
    0,
    "latest",
  );
  const blockTimeCache = new Map<number, Date>();

  let count = 0;
  let totalAmount = 0n;

  for (const log of logs) {
    if (!("args" in log) || log.blockNumber == null) {
      continue;
    }

    let occurredAt = blockTimeCache.get(log.blockNumber);
    if (!occurredAt) {
      const block = await provider.getBlock(log.blockNumber);
      if (!block) {
        continue;
      }
      occurredAt = new Date(Number(block.timestamp) * 1000);
      blockTimeCache.set(log.blockNumber, occurredAt);
    }

    if (occurredAt < start || occurredAt >= end) {
      continue;
    }

    count += 1;
    totalAmount += BigInt(log.args[1]);
  }

  return {
    count,
    totalAmount: totalAmount.toString(),
  };
}

const getCachedPrizeDepositSummaryForWindow = unstable_cache(
  scanPrizeDepositSummaryForWindow,
  ["daily-activity-prize-deposit-summary"],
  { revalidate: 3600 },
);

export async function getDailyActivityDigestSummary(
  referenceDate: Date = new Date(),
): Promise<DailyActivityDigestSummary> {
  const window = getDailyActivityDigestWindow(referenceDate);
  const createdAt = {
    gte: window.start,
    lt: window.end,
  };

  const [totalVotes, verifiedVotes, referralSignups] = await Promise.all([
    prisma.referendumVote.count({
      where: {
        ...buildOfficialReferendumVoteWhere(),
        createdAt,
      },
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
      where: {
        deletedAt: null,
        referredByUserId: { not: null },
        createdAt,
      },
    }),
  ]);

  let prizeDepositSummary: PrizeDepositSummary = { count: 0, totalAmount: "0" };
  const chainId = getTreasuryChainId();
  if (chainId !== null) {
    try {
      prizeDepositSummary = await getCachedPrizeDepositSummaryForWindow(
        window.start.toISOString(),
        window.end.toISOString(),
        chainId,
      );
    } catch (error) {
      logger.warn("Failed to scan on-chain prize deposits for digest", error);
    }
  }

  const hasActivity =
    totalVotes > 0 ||
    verifiedVotes > 0 ||
    referralSignups > 0 ||
    prizeDepositSummary.count > 0;

  return {
    dateKey: window.dateKey,
    label: window.label,
    timeZone: window.timeZone,
    totalVotes,
    verifiedVotes,
    referralSignups,
    prizeDepositCount: prizeDepositSummary.count,
    prizeDepositAmount: prizeDepositSummary.totalAmount,
    hasActivity,
  };
}

export function buildDailyActivityDigestText(
  summary: DailyActivityDigestSummary,
  baseUrl: string = getDigestBaseUrl(),
) {
  const lines = [`Optimitron daily digest for ${summary.label}`];

  if (summary.totalVotes > 0) {
    lines.push(
      `${summary.totalVotes} ${pluralize(summary.totalVotes, "vote")} cast`,
    );
  }

  if (summary.verifiedVotes > 0) {
    lines.push(`${summary.verifiedVotes} verified with personhood checks`);
  }

  if (summary.referralSignups > 0) {
    lines.push(
      `${summary.referralSignups} ${pluralize(summary.referralSignups, "referral")} captured`,
    );
  }

  if (summary.prizeDepositCount > 0) {
    lines.push(
      `${summary.prizeDepositCount} PRIZE ${pluralize(summary.prizeDepositCount, "deposit")} totaling ${formatUsdcAmount(summary.prizeDepositAmount)}`,
    );
  }

  lines.push(`${baseUrl}${ROUTES.scoreboard}`);

  return lines.join("\n");
}

function getDailyDigestPostRkey(dateKey: string) {
  return `${DAILY_DIGEST_RKEY_PREFIX}${dateKey}`;
}

function getDailyDigestPostUrl(did: string, rkey: string) {
  return `https://bsky.app/profile/${did}/post/${rkey}`;
}

export async function publishDailyActivityDigest(
  referenceDate: Date = new Date(),
): Promise<DailyActivityDigestPublishResult> {
  const summary = await getDailyActivityDigestSummary(referenceDate);
  if (!summary.hasActivity) {
    return {
      status: "skipped",
      reason: "no-activity",
      summary,
      text: null,
      ref: null,
    };
  }

  const did = process.env.ATPROTO_DID;
  const password = process.env.ATPROTO_PASSWORD;
  if (!did || !password) {
    logger.info(
      "AT Protocol credentials missing, skipping daily digest publication",
    );
    return {
      status: "skipped",
      reason: "missing-atproto-credentials",
      summary,
      text: null,
      ref: null,
    };
  }

  const text = buildDailyActivityDigestText(summary);
  const rkey = getDailyDigestPostRkey(summary.dateKey);
  const agent = await createAppPasswordAgent({
    service: process.env.ATPROTO_PDS_URL ?? "https://bsky.social",
    identifier: did,
    password,
  });

  const response = await agent.com.atproto.repo.putRecord({
    repo: did,
    collection: DAILY_DIGEST_COLLECTION,
    rkey,
    record: {
      $type: DAILY_DIGEST_COLLECTION,
      text,
      createdAt: new Date().toISOString(),
      langs: ["en"],
    },
  });

  const data = response.data as { uri: string; cid?: string };
  logger.info(`Published daily digest ${summary.dateKey}: ${data.uri}`);

  return {
    status: "published",
    reason: null,
    summary,
    text,
    ref: {
      uri: data.uri,
      cid: data.cid ?? null,
      href: getDailyDigestPostUrl(did, rkey),
      rkey,
    },
  };
}
