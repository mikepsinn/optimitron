import { unstable_cache } from "next/cache";
import { ethers } from "ethers";
import {
  ACTIVITY_COLLECTION,
  buildHyperscanDataUrl,
  createAppPasswordAgent,
  createAtprotoPublisher,
  createDepositHypercertDraft,
  publishDepositHypercertDraft,
} from "@optimitron/hypercerts";
import { getProvider, getVoterPrizeTreasuryContract } from "@/lib/contracts/server-client";
import { createLogger } from "@/lib/logger";

const logger = createLogger("prize-deposit-hypercert");
const TX_HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;
const ACTIVITY_RKEY_PREFIX = "prize-deposit-";
const MEASUREMENT_RKEY_PREFIX = "prize-deposit-m-";

export interface PrizeDepositEvent {
  txHash: string;
  chainId: number;
  depositorAddress: string;
  amount: string;
  sharesReceived: string;
}

export interface PublishedPrizeDepositHypercertRef {
  uri: string;
  cid: string | null;
  href: string;
  rkey: string;
}

export interface PrizeDepositHypercertPublicationResult {
  status: "published" | "already-published" | "skipped";
  ref: PublishedPrizeDepositHypercertRef | null;
}

function getTreasuryChainId() {
  const raw = process.env.TREASURY_CHAIN_ID ?? process.env.VOTE_TOKEN_CHAIN_ID ?? "84532";
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 84532;
}

function getAtprotoContributorDid() {
  return process.env.ATPROTO_DID ?? null;
}

function getAtprotoServiceUrl() {
  return process.env.ATPROTO_PDS_URL ?? "https://bsky.social";
}

function getActivityRkey(txHash: string) {
  return `${ACTIVITY_RKEY_PREFIX}${txHash.toLowerCase().replace(/^0x/, "")}`;
}

function getMeasurementRkey(txHash: string) {
  return `${MEASUREMENT_RKEY_PREFIX}${txHash.toLowerCase().replace(/^0x/, "")}`;
}

async function fetchPublishedPrizeDepositActivity(
  txHash: string,
): Promise<PublishedPrizeDepositHypercertRef | null> {
  if (!TX_HASH_PATTERN.test(txHash)) {
    return null;
  }

  const did = getAtprotoContributorDid();
  if (!did) {
    return null;
  }

  const rkey = getActivityRkey(txHash);
  const url = new URL("/xrpc/com.atproto.repo.getRecord", getAtprotoServiceUrl());
  url.searchParams.set("repo", did);
  url.searchParams.set("collection", ACTIVITY_COLLECTION);
  url.searchParams.set("rkey", rkey);

  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`AT Protocol lookup failed with ${response.status}`);
  }

  const data = (await response.json()) as { uri: string; cid?: string };

  return {
    uri: data.uri,
    cid: data.cid ?? null,
    href: buildHyperscanDataUrl(did, ACTIVITY_COLLECTION, rkey),
    rkey,
  };
}

export const getPublishedPrizeDepositActivity = unstable_cache(
  fetchPublishedPrizeDepositActivity,
  ["published-prize-deposit-activity"],
  { revalidate: 300 },
);

export async function resolvePrizeDepositEvent(
  txHash: string,
  chainId: number = getTreasuryChainId(),
): Promise<PrizeDepositEvent | null> {
  if (!TX_HASH_PATTERN.test(txHash)) {
    return null;
  }

  const provider = getProvider(chainId);
  const treasury = getVoterPrizeTreasuryContract(chainId, provider);
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
    return null;
  }

  const treasuryAddress = String(treasury.target).toLowerCase();
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== treasuryAddress) {
      continue;
    }

    try {
      const parsed = treasury.interface.parseLog({
        topics: log.topics,
        data: log.data,
      });

      if (!parsed || parsed.name !== "Deposited") {
        continue;
      }

      return {
        txHash,
        chainId,
        depositorAddress: ethers.getAddress(String(parsed.args[0])),
        amount: BigInt(parsed.args[1]).toString(),
        sharesReceived: BigInt(parsed.args[2]).toString(),
      };
    } catch {
      continue;
    }
  }

  return null;
}

export async function publishPrizeDepositHypercert(
  deposit: PrizeDepositEvent,
  options: { depositorName?: string } = {},
): Promise<PrizeDepositHypercertPublicationResult> {
  const contributorDid = getAtprotoContributorDid();
  const password = process.env.ATPROTO_PASSWORD;
  if (!contributorDid || !password) {
    return { status: "skipped", ref: null };
  }

  const existing = await getPublishedPrizeDepositActivity(deposit.txHash);
  if (existing) {
    return { status: "already-published", ref: existing };
  }

  const activityRkey = getActivityRkey(deposit.txHash);
  const measurementRkey = getMeasurementRkey(deposit.txHash);
  const agent = await createAppPasswordAgent({
    service: getAtprotoServiceUrl(),
    identifier: contributorDid,
    password,
  });
  const publisher = createAtprotoPublisher(agent);
  const draft = createDepositHypercertDraft({
    depositorAddress: deposit.depositorAddress,
    depositorName: options.depositorName,
    amount: deposit.amount,
    sharesReceived: deposit.sharesReceived,
    txHash: deposit.txHash,
    chainId: deposit.chainId,
    contributorDid,
  });

  const bundle = await publishDepositHypercertDraft(publisher, contributorDid, draft, {
    activityRkey,
    measurementRkey,
  });

  const ref: PublishedPrizeDepositHypercertRef = {
    uri: bundle.refs.activity.uri,
    cid: bundle.refs.activity.cid,
    href: buildHyperscanDataUrl(contributorDid, ACTIVITY_COLLECTION, activityRkey),
    rkey: activityRkey,
  };

  logger.info(`Published prize deposit hypercert for ${deposit.txHash}: ${bundle.refs.activity.cid}`);

  return {
    status: "published",
    ref,
  };
}
