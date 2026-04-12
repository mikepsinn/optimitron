/**
 * Sync world leader Person records from Wikidata.
 *
 * Fetches current heads of state/government, creates/updates Person records
 * with names and photos, then links them to treaty signer tasks.
 */

import { fetchWorldLeaders } from "@optimitron/data/fetchers/world-leaders";
import { findOrCreatePerson } from "@/lib/person.server";
import { prisma } from "@/lib/prisma";
import { getTreatySignerTaskKey } from "./task-keys";

/**
 * For each country, fetch the current leader from Wikidata, create/update
 * a Person record, and link it to the corresponding treaty signer task.
 */
export async function syncLeaderPersons() {
  const leaders = await fetchWorldLeaders();

  const results: Array<{
    countryCode: string;
    leaderName: string;
    personId: string;
    taskUpdated: boolean;
  }> = [];

  for (const leader of leaders) {
    const sourceRef = `wikidata:${leader.wikidataId}`;

    const person = await findOrCreatePerson({
      countryCode: leader.countryCode,
      currentAffiliation: `Government of ${leader.countryName}`,
      displayName: leader.leaderName,
      image: leader.leaderImageUrl,
      isPublicFigure: true,
      roleTitle: leader.roleTitle,
      sourceRef,
    });

    // Find the treaty signer task for this country code
    const signerTaskKey = getTreatySignerTaskKey({
      countryCode: leader.countryCode,
    });
    const task = await prisma.task.findFirst({
      where: {
        taskKey: signerTaskKey,
        deletedAt: null,
      },
      select: { id: true, assigneePersonId: true },
    });

    let taskUpdated = false;
    if (task && task.assigneePersonId !== person.id) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          assigneePersonId: person.id,
          assigneeAffiliationSnapshot: `Government of ${leader.countryName}`,
          roleTitle: leader.roleTitle,
        },
      });
      taskUpdated = true;
    }

    results.push({
      countryCode: leader.countryCode,
      leaderName: leader.leaderName,
      personId: person.id,
      taskUpdated,
    });
  }

  return {
    leadersSynced: results.length,
    tasksUpdated: results.filter((r) => r.taskUpdated).length,
    results,
  };
}
