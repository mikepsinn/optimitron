import {
  createReferralHypercertDraft,
  publishReferralHypercertDraft,
  type ReferralHypercertInput,
} from "@optimitron/hypercerts";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { serverEnv } from "@/lib/env";
import { getVerifiedVoteStats } from "@/lib/verified-votes.server";

const logger = createLogger("referral-hypercert-publication");

export interface ReferralHypercertPublicationResult {
  published: number;
  skipped: number;
  errors: string[];
}

/**
 * Publish referral recruitment impact as Hypercert attestations via AT Protocol.
 *
 * For each referrer with verified votes, creates and publishes a Hypercert
 * bundle documenting their voter recruitment impact. Publishes a fresh
 * snapshot on every run — AT Protocol records are free to create and read.
 *
 * Requires AT Protocol credentials:
 * - ATPROTO_DID: the DID of the publishing identity
 * - ATPROTO_PASSWORD: app password for authentication
 * - ATPROTO_PDS_URL: PDS endpoint (defaults to bsky.social)
 */
export async function publishReferralHypercerts(): Promise<ReferralHypercertPublicationResult> {
  const contributorDid = serverEnv.ATPROTO_DID;
  if (!contributorDid) {
    throw new Error("ATPROTO_DID is required to publish referral Hypercerts");
  }

  if (!serverEnv.ATPROTO_PASSWORD) {
    logger.info("ATPROTO_PASSWORD not set, skipping referral hypercert publication");
    return { published: 0, skipped: 0, errors: [] };
  }

  // Find all users who have referred verified voters
  const referrers = await prisma.referendumVote.groupBy({
    by: ["referredByUserId"],
    where: {
      referredByUserId: { not: null },
      deletedAt: null,
      user: {
        personhoodVerifications: {
          some: {
            status: "VERIFIED",
            deletedAt: null,
          },
        },
      },
    },
    _count: { _all: true },
  });

  if (referrers.length === 0) {
    logger.info("No referrers with verified votes found");
    return { published: 0, skipped: 0, errors: [] };
  }

  const { createAppPasswordAgent, createAtprotoPublisher } = await import("@optimitron/hypercerts");
  const agent = await createAppPasswordAgent({
    service: serverEnv.ATPROTO_PDS_URL ?? "https://bsky.social",
    identifier: contributorDid,
    password: serverEnv.ATPROTO_PASSWORD,
  });
  const publisher = createAtprotoPublisher(agent);

  let published = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const entry of referrers) {
    const referrerId = entry.referredByUserId;
    if (!referrerId) continue;

    try {
      const stats = await getVerifiedVoteStats(referrerId);
      if (stats.verifiedVotes === 0) {
        skipped++;
        continue;
      }

      const referrer = await prisma.user.findUnique({
        where: { id: referrerId },
        select: { id: true, name: true, username: true },
      });

      if (!referrer) {
        skipped++;
        continue;
      }

      const input: ReferralHypercertInput = {
        referrerId: referrer.id,
        referrerName: referrer.username ?? referrer.name ?? "Anonymous",
        referendumId: "global",
        referendumTitle: "Global Health Reallocation Treaty",
        verifiedVotesRecruited: stats.verifiedVotes,
        totalReferrals: stats.totalReferrals,
        contributorDid,
        evaluatorDid: "did:plc:wishocracy-aggregate",
      };

      const draft = createReferralHypercertDraft(input);
      const bundle = await publishReferralHypercertDraft(publisher, contributorDid, draft);
      logger.info(`Published Hypercert for ${referrer.username ?? referrer.id}: ${bundle.refs.activity.cid}`);
      published++;
    } catch (error) {
      const msg = `Failed to publish hypercert for referrer ${referrerId}: ${error}`;
      logger.error(msg);
      errors.push(msg);
    }
  }

  logger.info(
    `Published ${published} referral hypercerts, skipped ${skipped}, errors: ${errors.length}`,
  );

  return { published, skipped, errors };
}
