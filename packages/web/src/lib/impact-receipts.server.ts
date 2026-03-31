import { unstable_cache } from "next/cache";
import { ethers } from "ethers";
import { getContracts } from "@optimitron/treasury-shared/addresses";
import { getProvider, getVoterPrizeTreasuryContract } from "@/lib/contracts/server-client";
import { createLogger } from "@/lib/logger";
import { getPersonhoodProviderLabel } from "@/lib/personhood";
import { getPersonhoodSummary } from "@/lib/personhood.server";
import { prisma } from "@/lib/prisma";
import { getPublishedPrizeDepositActivity } from "@/lib/prize-deposit-hypercert.server";
import { ROUTES } from "@/lib/routes";
import { getVerifiedVoteStats } from "@/lib/verified-votes.server";
import type {
  DashboardImpactReceipt,
  DashboardImpactReceipts,
} from "@/types/dashboard";

const logger = createLogger("impact-receipts");
const ZERO_ADDRESS = /^0x0{40}$/i;

interface CachedPrizeDepositReceipt {
  amount: string;
  chainId: number;
  depositorAddress: string;
  href: string | null;
  id: string;
  occurredAtIso: string;
  txHash: string;
  title: string;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return `${Math.floor(seconds / 604800)} weeks ago`;
}

function normalizeWalletAddress(walletAddress: string | null | undefined) {
  if (!walletAddress) return null;

  try {
    return ethers.getAddress(walletAddress);
  } catch {
    return null;
  }
}

function formatWalletAddress(walletAddress: string) {
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
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

function getChainLabel(chainId: number) {
  switch (chainId) {
    case 84532:
      return "Base Sepolia";
    case 8453:
      return "Base";
    case 11155111:
      return "Sepolia";
    case 31337:
      return "Localhost";
    default:
      return `Chain ${chainId}`;
  }
}

function getTransactionExplorerUrl(chainId: number, txHash: string) {
  switch (chainId) {
    case 84532:
      return `https://sepolia.basescan.org/tx/${txHash}`;
    case 8453:
      return `https://basescan.org/tx/${txHash}`;
    case 11155111:
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    default:
      return null;
  }
}

function getTreasuryChainId() {
  const raw = process.env.TREASURY_CHAIN_ID ?? process.env.VOTE_TOKEN_CHAIN_ID ?? "84532";
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function createWalletKey(walletAddresses: string[]) {
  return Array.from(new Set(walletAddresses.map((wallet) => wallet.toLowerCase())))
    .sort()
    .join(",");
}

async function scanPrizeDepositsForWallets(
  chainId: number,
  walletKey: string,
): Promise<CachedPrizeDepositReceipt[]> {
  const contracts = getContracts(chainId);
  if (!contracts || ZERO_ADDRESS.test(contracts.voterPrizeTreasury)) {
    return [];
  }

  const walletAddresses = walletKey
    .split(",")
    .filter(Boolean)
    .map((wallet) => normalizeWalletAddress(wallet))
    .filter((wallet): wallet is string => wallet !== null);

  if (walletAddresses.length === 0) {
    return [];
  }

  const provider = getProvider(chainId);
  const treasury = getVoterPrizeTreasuryContract(chainId, provider);
  const blockCache = new Map<number, Date>();
  const dedupedReceipts = new Map<string, CachedPrizeDepositReceipt>();

  const settledLogs = await Promise.allSettled(
    walletAddresses.map(async (walletAddress) => ({
      walletAddress,
      logs: await treasury.queryFilter(
        treasury.filters.Deposited(walletAddress),
        0,
        "latest",
      ),
    })),
  );

  for (const result of settledLogs) {
    if (result.status !== "fulfilled") {
      logger.warn("Failed to query deposit receipts for one wallet", result.reason);
      continue;
    }

    for (const log of result.value.logs) {
      if (!("args" in log) || log.blockNumber == null || !log.transactionHash) {
        continue;
      }

      let occurredAt = blockCache.get(log.blockNumber);
      if (!occurredAt) {
        const block = await provider.getBlock(log.blockNumber);
        if (!block) {
          continue;
        }
        occurredAt = new Date(Number(block.timestamp) * 1000);
        blockCache.set(log.blockNumber, occurredAt);
      }

      const depositorAddress = normalizeWalletAddress(String(log.args[0]));
      if (!depositorAddress) {
        continue;
      }

      const receipt: CachedPrizeDepositReceipt = {
        id: `prize-deposit:${log.transactionHash}`,
        chainId,
        depositorAddress,
        amount: BigInt(log.args[1]).toString(),
        href: getTransactionExplorerUrl(chainId, log.transactionHash),
        occurredAtIso: occurredAt.toISOString(),
        txHash: log.transactionHash,
        title: `PRIZE deposit ${formatUsdcAmount(BigInt(log.args[1]).toString())}`,
      };

      dedupedReceipts.set(receipt.id, receipt);
    }
  }

  return Array.from(dedupedReceipts.values()).sort(
    (left, right) =>
      new Date(right.occurredAtIso).getTime() - new Date(left.occurredAtIso).getTime(),
  );
}

const getCachedPrizeDepositReceipts = unstable_cache(
  scanPrizeDepositsForWallets,
  ["dashboard-prize-deposit-receipts"],
  { revalidate: 300 },
);

export async function getImpactReceipts(
  userId: string,
): Promise<DashboardImpactReceipts> {
  const [walletSource, voteMintWallets, personhoodSummary, referralStats] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          socialAccounts: {
            where: {
              deletedAt: null,
              walletAddress: { not: null },
            },
            select: { walletAddress: true },
          },
        },
      }),
      prisma.voteTokenMint.findMany({
        where: {
          userId,
          deletedAt: null,
        },
        select: { walletAddress: true },
      }),
      getPersonhoodSummary(userId),
      getVerifiedVoteStats(userId),
    ]);

  const walletAddresses = Array.from(
    new Set(
      [
        ...(walletSource?.socialAccounts ?? []).map((account) => account.walletAddress),
        ...voteMintWallets.map((mint) => mint.walletAddress),
      ]
        .map((walletAddress) => normalizeWalletAddress(walletAddress))
        .filter((walletAddress): walletAddress is string => walletAddress !== null),
    ),
  );

  const items: DashboardImpactReceipt[] = [];

  if (personhoodSummary.isVerified) {
    const providerLabel = getPersonhoodProviderLabel(personhoodSummary.personhoodProvider);
    const verifiedAt = personhoodSummary.personhoodVerifiedAt
      ? new Date(personhoodSummary.personhoodVerifiedAt)
      : null;

    items.push({
      id: "personhood",
      title: "Verified personhood",
      description: `${providerLabel} is attached to your profile for sybil resistance and receipt eligibility.`,
      statusLabel: "VERIFIED",
      statusTone: "success",
      icon: "🌐",
      timeLabel: verifiedAt ? formatTimeAgo(verifiedAt) : null,
      href: ROUTES.profile,
      external: false,
    });
  }

  if (referralStats.totalReferrals > 0) {
    const verifiedVotes = referralStats.verifiedVotes;
    const pendingVerification = referralStats.pendingVerification;
    const title =
      verifiedVotes > 0
        ? `Referral impact: ${verifiedVotes} verified voter${verifiedVotes === 1 ? "" : "s"}`
        : `Referral pipeline: ${referralStats.totalReferrals} signup${referralStats.totalReferrals === 1 ? "" : "s"}`;
    const description =
      verifiedVotes > 0
        ? pendingVerification > 0
          ? `${verifiedVotes} referred voter${verifiedVotes === 1 ? "" : "s"} already verified. ${pendingVerification} more still need personhood verification.`
          : `${verifiedVotes} referred voter${verifiedVotes === 1 ? "" : "s"} already verified through your referral link.`
        : `${referralStats.totalReferrals} referral${referralStats.totalReferrals === 1 ? "" : "s"} captured so far. These convert into impact once those users verify personhood.`;

    items.push({
      id: "referrals",
      title,
      description,
      statusLabel: verifiedVotes > 0 ? "TRACKED" : "PENDING",
      statusTone: verifiedVotes > 0 ? "success" : "muted",
      icon: "🤝",
      timeLabel: null,
      href: "#referral",
      external: false,
    });
  }

  const chainId = getTreasuryChainId();
  if (chainId !== null && walletAddresses.length > 0) {
    try {
      const depositReceipts = await getCachedPrizeDepositReceipts(
        chainId,
        createWalletKey(walletAddresses),
      );

      const publishedRefs = await Promise.all(
        depositReceipts.slice(0, 5).map(async (receipt) => {
          try {
            return await getPublishedPrizeDepositActivity(receipt.txHash);
          } catch (error) {
            logger.warn("Failed to resolve published prize deposit hypercert", error);
            return null;
          }
        }),
      );

      items.push(...depositReceipts.slice(0, 5).map((receipt, index) => {
        const publishedRef = publishedRefs[index];

        return {
          id: receipt.id,
          title: receipt.title,
          description: publishedRef
            ? `${formatWalletAddress(receipt.depositorAddress)} funded the Earth Optimization Prize on ${getChainLabel(receipt.chainId)}. Published as an AT Protocol hypercert receipt.`
            : `${formatWalletAddress(receipt.depositorAddress)} funded the Earth Optimization Prize on ${getChainLabel(receipt.chainId)}.`,
          statusLabel: publishedRef ? "PUBLISHED" : "ON-CHAIN",
          statusTone: publishedRef ? ("success" as const) : ("accent" as const),
          icon: "🏆",
          timeLabel: formatTimeAgo(new Date(receipt.occurredAtIso)),
          href: publishedRef?.href ?? receipt.href,
          external: (publishedRef?.href ?? receipt.href) !== null,
        };
      }));
    } catch (error) {
      logger.warn("Failed to scan on-chain prize deposits", error);
    }
  }

  return {
    items,
    walletCount: walletAddresses.length,
  };
}
