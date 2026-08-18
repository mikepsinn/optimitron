import {
  createAlignmentHypercertDraft,
  publishAlignmentHypercertDraft,
  type AlignmentHypercertInput,
} from "@optimitron/hypercerts";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { serverEnv } from "@/lib/env";

const logger = createLogger("score-publication");

export interface ScorePublicationResult {
  aggregationRunId: string;
  published: number;
  skipped: number;
  errors: string[];
}

/**
 * Publish aggregate alignment scores as Hypercert attestations via AT Protocol.
 *
 * For each AlignmentScore in the given run, creates and publishes a Hypercert
 * bundle, then stores the returned CID in the score's onChainRef field.
 *
 * Requires AT Protocol credentials:
 * - ATPROTO_DID: the DID of the publishing identity
 * - ATPROTO_PASSWORD: app password for authentication
 * - ATPROTO_PDS_URL: PDS endpoint (defaults to bsky.social)
 */
export async function publishAggregateScoresToHypercerts(
  aggregationRunId: string,
): Promise<ScorePublicationResult> {
  const contributorDid = serverEnv.ATPROTO_DID;
  if (!contributorDid) {
    throw new Error("ATPROTO_DID is required to publish alignment Hypercerts");
  }

  const run = await prisma.aggregationRun.findUnique({
    where: { id: aggregationRunId },
    include: {
      jurisdiction: { select: { id: true, name: true, code: true } },
      alignmentScores: {
        where: { deletedAt: null },
        include: {
          politician: {
            select: {
              id: true,
              name: true,
              party: true,
              title: true,
              chamber: true,
              externalId: true,
            },
          },
          itemScores: {
            select: { itemId: true, score: true },
          },
        },
      },
    },
  });

  if (!run) {
    throw new Error(`AggregationRun not found: ${aggregationRunId}`);
  }

  let published = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const score of run.alignmentScores) {
    // Skip already-published scores
    if (score.onChainRef) {
      skipped++;
      continue;
    }

    try {
      const input: AlignmentHypercertInput = {
        politicianId: score.politician.externalId ?? score.politicianId,
        politicianName: score.politician.name,
        party: score.politician.party ?? undefined,
        title: score.politician.title ?? undefined,
        chamber: score.politician.chamber ?? undefined,
        jurisdictionId: run.jurisdiction.id,
        jurisdictionName: run.jurisdiction.name,
        alignmentScore: score.score,
        votesCompared: score.votesCompared,
        participantCount: run.participantCount,
        itemScores: score.itemScores.map((cs) => ({
          itemId: cs.itemId,
          score: cs.score,
        })),
        contributorDid,
        evaluatorDid: "did:plc:wishocracy-aggregate",
      };

      const draft = createAlignmentHypercertDraft(input);

      let draftRef = `draft:${aggregationRunId}:${score.politicianId}`;

      if (serverEnv.ATPROTO_PASSWORD) {
        const { createAppPasswordAgent, createAtprotoPublisher } = await import("@optimitron/hypercerts");
        const agent = await createAppPasswordAgent({
          service: serverEnv.ATPROTO_PDS_URL ?? "https://bsky.social",
          identifier: contributorDid,
          password: serverEnv.ATPROTO_PASSWORD,
        });
        const publisher = createAtprotoPublisher(agent);
        const bundle = await publishAlignmentHypercertDraft(publisher, contributorDid, draft);
        draftRef = bundle.refs.activity.cid;
        logger.info(`Published Hypercert for ${score.politician.name}: ${draftRef}`);
      }
      await prisma.alignmentScore.update({
        where: { id: score.id },
        data: {
          publishedAt: new Date(),
          onChainRef: draftRef,
        },
      });

      published++;
    } catch (error) {
      const msg = `Failed to publish score for ${score.politician.name}: ${error}`;
      logger.error(msg);
      errors.push(msg);
    }
  }

  logger.info(
    `Published ${published} scores, skipped ${skipped}, errors: ${errors.length}`,
  );

  return {
    aggregationRunId,
    published,
    skipped,
    errors,
  };
}
