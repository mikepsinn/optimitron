import "./load-env";
import { pathToFileURL } from "url";
import { ReferendumStatus, VotePosition } from "@optimitron/db";
import { ensureHumanityVGovernmentPlaintiffParty } from "../src/lib/humanity-v-government-case.server";
import { prisma } from "../src/lib/prisma";
import { ensureSubjectForPerson } from "../src/lib/subject.server";
import { TREATY_REFERENDUM_SLUG } from "../src/lib/treaty";

/**
 * Backfill registers every existing YES voter on the 1% Treaty referendum
 * as a NAMED_PLAINTIFF on the *Humanity v. Government* case.
 *
 * The auto-register hook on POST /api/referendums/[slug]/vote only fires
 * for *new* YES votes. Voters who voted before that hook shipped (anyone
 * who voted before the corresponding deploy) are missing from the case
 * party table, which makes the live plaintiff count on
 * `/humanity-v-government` artificially low. This script closes that gap.
 *
 * Idempotent: `ensureHumanityVGovernmentPlaintiffParty` upserts on
 * `(caseId, role, subjectId)`. Running it a second time is a no-op
 * (re-touches `displayName`, `isPublic`, `createdByUserId`).
 *
 * Run with: pnpm --dir packages/web tsx scripts/backfill-court-plaintiffs.ts [--dry-run]
 */

interface BackfillSummary {
  cursor: string | null;
  examined: number;
  registered: number;
  skipped: number;
  errors: number;
}

interface BackfillOptions {
  batchSize: number;
  dryRun: boolean;
}

function parseArgs(argv: string[]): BackfillOptions {
  const dryRun = argv.includes("--dry-run");
  const batchArg = argv.find((arg) => arg.startsWith("--batch="));
  const batchSize = batchArg
    ? Math.max(1, Number(batchArg.split("=")[1]) || 200)
    : 200;
  return { batchSize, dryRun };
}

async function backfillCourtPlaintiffs(
  options: BackfillOptions,
): Promise<BackfillSummary> {
  const summary: BackfillSummary = {
    cursor: null,
    examined: 0,
    registered: 0,
    skipped: 0,
    errors: 0,
  };

  const referendum = await prisma.referendum.findUnique({
    where: { slug: TREATY_REFERENDUM_SLUG },
    select: { id: true, status: true, deletedAt: true, slug: true },
  });
  if (!referendum) {
    throw new Error(
      `Treaty referendum not found by slug ${TREATY_REFERENDUM_SLUG}.`,
    );
  }
  if (referendum.deletedAt) {
    throw new Error(`Treaty referendum is soft-deleted.`);
  }
  if (referendum.status !== ReferendumStatus.ACTIVE) {
    console.warn(
      `Treaty referendum status is ${referendum.status}, not ACTIVE — backfilling anyway.`,
    );
  }

  let cursor: string | undefined;
  while (true) {
    const votes = await prisma.referendumVote.findMany({
      where: {
        referendumId: referendum.id,
        answer: VotePosition.YES,
        deletedAt: null,
      },
      orderBy: { id: "asc" },
      take: options.batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        userId: true,
        person: {
          select: {
            id: true,
            displayName: true,
            isPublic: true,
            deletedAt: true,
          },
        },
      },
    });

    if (votes.length === 0) break;
    summary.examined += votes.length;

    for (const vote of votes) {
      cursor = vote.id;
      summary.cursor = vote.id;
      if (!vote.person || vote.person.deletedAt) {
        summary.skipped += 1;
        continue;
      }
      if (!vote.userId) {
        summary.skipped += 1;
        continue;
      }
      if (options.dryRun) {
        summary.registered += 1;
        continue;
      }
      try {
        await prisma.$transaction(async (tx) => {
          const subject = await ensureSubjectForPerson(tx, {
            displayName: vote.person!.displayName,
            id: vote.person!.id,
          });
          await ensureHumanityVGovernmentPlaintiffParty(tx, {
            createdByUserId: vote.userId!,
            displayName: vote.person!.displayName,
            isPublic: vote.person!.isPublic,
            subjectId: subject.id,
          });
        });
        summary.registered += 1;
      } catch (error) {
        summary.errors += 1;
        console.error(
          `[backfill] failed for vote ${vote.id} (person ${vote.person.id}):`,
          error,
        );
      }
    }

    if (votes.length < options.batchSize) break;
  }

  return summary;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  console.log(
    `Backfilling Humanity v. Government plaintiffs from treaty YES votes${
      options.dryRun ? " (dry-run)" : ""
    }; batch=${options.batchSize}.`,
  );
  const summary = await backfillCourtPlaintiffs(options);
  console.log(JSON.stringify(summary, null, 2));
  await prisma.$disconnect();
}

const isMain =
  process.argv[1] != null &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  void main().catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
}
