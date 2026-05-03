import "./load-env";

import { PersonLifeStatus } from "@optimitron/db";
import { matchEfficacyLagForMemorial } from "../src/lib/efficacy-lag-matcher.server";
import { prisma } from "../src/lib/prisma";

/**
 * Recompute PersonEfficacyLagEvidence rows for every deceased memorial.
 *
 * Run after seeding new InterventionApprovalTimeline rows or after the
 * matcher logic changes. Safe to re-run — the matcher upserts on
 * (memorialId, interventionApprovalTimelineId).
 *
 * Usage:
 *   pnpm --filter @optimitron/web exec tsx scripts/recompute-efficacy-lag.ts
 */
async function main() {
  const memorials = await prisma.personMemorial.findMany({
    where: {
      deletedAt: null,
      person: {
        deletedAt: null,
        lifeStatus: PersonLifeStatus.DECEASED,
        deathDate: { not: null },
      },
    },
    select: { id: true, person: { select: { displayName: true } } },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${memorials.length} deceased memorials. Recomputing efficacy-lag matches...`);

  let totalMatches = 0;
  let memorialsWithMatch = 0;
  for (const memorial of memorials) {
    try {
      // Run the matcher inside a transaction so the upserts batch together.
      const matches = await prisma.$transaction((tx) =>
        matchEfficacyLagForMemorial(tx, memorial.id),
      );
      if (matches.length > 0) {
        memorialsWithMatch++;
        totalMatches += matches.length;
        console.log(
          `  ✓ ${memorial.person.displayName} (${memorial.id}) — ${matches.length} match${matches.length === 1 ? "" : "es"}`,
        );
      }
    } catch (error) {
      console.error(`  ✗ Failed for memorial ${memorial.id}`, error);
    }
  }

  console.log(
    `\nDone. ${memorialsWithMatch} memorials flagged, ${totalMatches} total matches written.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
