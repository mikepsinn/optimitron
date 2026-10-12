// Snapshots the drug and biologic trials recruiting in each state from ClinicalTrials.gov into
// lib/state-trials.json, which the state pages read. Run it every month or so, and commit the result:
//   pnpm --filter @apps/acceleratedmedicine state-trials
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { tallyStateTrials, type CtgovStudy, type StateTrialsSnapshot } from "../lib/state-trials";

const API = "https://clinicaltrials.gov/api/v2/studies";

// Every interventional study recruiting at the study level with a US site, and only the fields the
// counts read. About 18,000 studies, in pages of 1,000.
async function recruitingUsStudies(): Promise<CtgovStudy[]> {
  const studies: CtgovStudy[] = [];
  let pageToken: string | undefined;
  do {
    const query = new URLSearchParams({
      "query.locn": "AREA[LocationCountry]United States",
      "filter.overallStatus": "RECRUITING",
      "filter.advanced": "AREA[StudyType]INTERVENTIONAL",
      fields: "NCTId,Condition,ConditionMeshTerm,ConditionAncestorTerm,InterventionType,LocationState,LocationStatus,LocationCountry",
      pageSize: "1000",
      ...(pageToken ? { pageToken } : {}),
    });
    const response = await fetch(`${API}?${query}`);
    if (!response.ok) throw new Error(`ClinicalTrials.gov returned ${response.status}: ${await response.text()}`);
    const page = (await response.json()) as { studies: CtgovStudy[]; nextPageToken?: string };
    studies.push(...page.studies);
    pageToken = page.nextPageToken;
    process.stdout.write(`\r${studies.length} studies`);
  } while (pageToken);
  process.stdout.write("\n");
  return studies;
}

const snapshot: StateTrialsSnapshot = {
  asOf: new Date().toISOString().slice(0, 10),
  states: tallyStateTrials(await recruitingUsStudies()),
};
const path = join(process.cwd(), "lib", "state-trials.json");
writeFileSync(path, `${JSON.stringify(snapshot, null, 1)}\n`);
console.log(`Wrote ${path}`);
for (const state of ["Missouri", "Illinois", "Wyoming"] as const) {
  const counts = Object.entries(snapshot.states[state]).map(([condition, trials]) => `${condition} ${trials.count}`);
  console.log(`${state}: ${counts.join(", ")}`);
}
