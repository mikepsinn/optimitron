/**
 * Sync script for the leader accountability ledger.
 *
 * Creates Person records for world leaders, backlinks existing treaty-signer
 * tasks to those Person records, and upserts VERIFIED activity tasks with
 * impact metrics (negative for harm, positive for measured benefit, null for
 * unmeasured spending).
 *
 * Usage:
 *   npx tsx packages/web/scripts/sync-leader-accountability.ts --import-db
 *   npx tsx packages/web/scripts/sync-leader-accountability.ts --import-db --country-codes=US,RU
 *   npx tsx packages/web/scripts/sync-leader-accountability.ts --print-json
 */

import "./load-env";
import { pathToFileURL } from "url";
import "../../data/src/generated/country-panel";
import { getCountryPanelLatest } from "@optimitron/data";
import { OrgType } from "@optimitron/db";
import { findOrCreateOrganization } from "../src/lib/organization.server";
import { findOrCreatePerson } from "../src/lib/person.server";
import { prisma } from "../src/lib/prisma";
import { upsertImportedTaskBundle } from "../src/lib/tasks/import-task-bundle.server";
import {
  LEADER_ACTIVITIES,
  getActivityTaskKey,
} from "../src/lib/tasks/leader-activities";
import {
  buildActivityTaskBundle,
  buildLeaderPersonDraft,
} from "../src/lib/tasks/leader-accountability-network";
import { buildFullTreatySignerSlots } from "../src/lib/tasks/treaty-signer-roster";
import { getTreatySignerTaskKey } from "../src/lib/tasks/task-keys";

const SYNC_CONCURRENCY = 8;

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface SyncOptions {
  countryCodes: string[] | null;
  importDb: boolean;
  printJson: boolean;
}

function parseArgs(argv: string[]): SyncOptions {
  const getValue = (prefix: string) =>
    argv.find((arg) => arg.startsWith(`${prefix}=`))?.slice(prefix.length + 1) ?? null;
  const countryCodeValue = getValue("--country-codes");

  return {
    countryCodes:
      countryCodeValue == null
        ? null
        : countryCodeValue
            .split(",")
            .map((v) => v.trim().toUpperCase())
            .filter(Boolean),
    importDb: argv.includes("--import-db"),
    printJson: argv.includes("--print-json"),
  };
}

function chunkArray<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size));
  }
  return chunks;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function syncLeaderAccountability(options: SyncOptions) {
  // Group activities by country
  const activitiesByCountry = new Map<string, typeof LEADER_ACTIVITIES>();
  for (const activity of LEADER_ACTIVITIES) {
    const cc = activity.countryCode.toUpperCase();
    if (!activitiesByCountry.has(cc)) {
      activitiesByCountry.set(cc, []);
    }
    activitiesByCountry.get(cc)!.push(activity);
  }

  const fullRoster = buildFullTreatySignerSlots(getCountryPanelLatest());
  const selectedSlots = fullRoster.filter((slot) => {
    const countryCode = slot.countryCode.toUpperCase();
    if (!activitiesByCountry.has(countryCode)) {
      return false;
    }

    return options.countryCodes ? options.countryCodes.includes(countryCode) : true;
  });

  if (selectedSlots.length === 0) {
    throw new Error("No treaty signer slots matched the requested filter.");
  }

  // Build summary for print/preview
  const summary = selectedSlots.map((slot) => {
    const activities = activitiesByCountry.get(slot.countryCode.toUpperCase()) ?? [];
    return {
      countryCode: slot.countryCode,
      countryName: slot.countryName,
      leader: slot.decisionMakerLabel,
      activityCount: activities.length,
      activities: activities.map((a) => ({
        taskKey: getActivityTaskKey(a.countryCode, a.activitySlug),
        title: a.title,
        impactTier: a.impactTier,
        taxpayerCostUsd: a.taxpayerCostUsd,
      })),
    };
  });

  if (options.printJson || !options.importDb) {
    console.log(JSON.stringify(summary, null, 2));
  }

  if (!options.importDb) {
    console.log(
      `\nSkip db sync (pass --import-db to persist). Would sync ${summary.reduce((n, s) => n + s.activityCount, 0)} activities for ${selectedSlots.length} leaders.`,
    );
    return;
  }

  // Sync to database
  const persisted: Array<Record<string, unknown>> = [];

  for (const chunk of chunkArray(selectedSlots, SYNC_CONCURRENCY)) {
    const chunkResults = await Promise.all(
      chunk.map(async (slot) => {
        const activities = activitiesByCountry.get(slot.countryCode.toUpperCase()) ?? [];
        if (activities.length === 0) {
          return null;
        }

        // 1. Create/find Person record for this leader
        const person = await findOrCreatePerson(buildLeaderPersonDraft(slot));

        // 2. Create/find the government Organization
        const organization = await findOrCreateOrganization({
          name: slot.governmentName,
          sourceRef: `organization:government:${slot.countryCode.toLowerCase()}`,
          sourceUrl: slot.officialSourceUrl ?? slot.contactUrl ?? slot.governmentWebsite,
          type: OrgType.GOVERNMENT,
          website: slot.governmentWebsite,
        });

        // 3. Backlink the existing treaty signer task to this Person
        const treatyTaskKey = getTreatySignerTaskKey(slot);
        await prisma.task.updateMany({
          where: {
            taskKey: treatyTaskKey,
            deletedAt: null,
          },
          data: {
            assigneePersonId: person.id,
          },
        });

        // 4. Upsert each activity task
        const activityResults: Array<{ taskKey: string; taskId: string }> = [];
        for (const activity of activities) {
          const bundle = buildActivityTaskBundle(slot, activity);
          const result = await upsertImportedTaskBundle(bundle, {
            assigneeOrganizationId: organization.id,
            assigneePersonId: person.id,
            isPublic: true,
          });

          // Set completedAt and verifiedAt for VERIFIED tasks
          await prisma.task.update({
            where: { id: result.taskId },
            data: {
              completedAt: new Date(activity.completedAt),
              verifiedAt: new Date(activity.completedAt),
            },
          });

          activityResults.push({
            taskKey: result.taskKey!,
            taskId: result.taskId,
          });
        }

        return {
          countryCode: slot.countryCode,
          leader: slot.decisionMakerLabel,
          personId: person.id,
          organizationId: organization.id,
          treatyTaskBacklinked: treatyTaskKey,
          activityTasks: activityResults,
        };
      }),
    );

    for (const result of chunkResults) {
      if (result) {
        persisted.push(result);
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        leaderCount: persisted.length,
        totalActivities: persisted.reduce(
          (n, r) => n + (r.activityTasks as unknown[]).length,
          0,
        ),
        synced: persisted,
      },
      null,
      2,
    ),
  );
}

async function main() {
  await syncLeaderAccountability(parseArgs(process.argv.slice(2)));
}

const isMain =
  process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  void main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
