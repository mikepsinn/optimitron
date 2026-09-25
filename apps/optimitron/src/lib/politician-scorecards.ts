import {
  GENERATED_POLITICIAN_SCORECARD_DATA,
  type GeneratedPoliticianScorecard,
  type GeneratedPoliticianScorecardData,
} from "@optimitron/data/datasets/us-politician-scorecards";

/**
 * The generated US Congress scorecards. The politician pages used to read the
 * JSON from `process.cwd()/../data`, which stopped resolving when the app moved
 * to `apps/optimitron`, and the pages silently showed no politicians.
 */
export function getPoliticianScorecardData(): GeneratedPoliticianScorecardData {
  return GENERATED_POLITICIAN_SCORECARD_DATA;
}

/** A member's scorecard by bioguide ID, in any letter case. */
export function findPoliticianScorecard(
  bioguideId: string,
): GeneratedPoliticianScorecard | undefined {
  const id = bioguideId.toUpperCase();
  return GENERATED_POLITICIAN_SCORECARD_DATA.scorecards.find(
    (scorecard) => scorecard.bioguideId === id,
  );
}
