/**
 * Seed / sync world leader Person records from Wikidata.
 *
 * Usage: pnpm --filter @optimitron/web exec tsx scripts/sync-world-leaders.ts
 *
 * Fetches current heads of state/government, creates/updates Person records
 * with real names and photos, then links them to treaty signer tasks.
 */

import "dotenv/config";
import { syncLeaderPersons } from "../src/lib/tasks/sync-leader-persons";

async function main() {
  console.log("Fetching world leaders from Wikidata...");
  const result = await syncLeaderPersons();
  console.log(`Done. ${result.leadersSynced} leaders synced, ${result.tasksUpdated} tasks updated.`);

  for (const r of result.results) {
    const status = r.taskUpdated ? "LINKED" : "ok";
    console.log(`  [${status}] ${r.countryCode} — ${r.leaderName} (person: ${r.personId})`);
  }

  process.exit(0);
}

void main();
