import {
  buildClinicalTrialsSearchUrl,
  toClinicalTrialsOffsetPage,
  type ClinicalTrialAgeGroupKey,
  type ClinicalTrialSexKey,
  type ClinicalTrialStatusKey,
  type ClinicalTrialStudyTypeKey,
} from "@optimitron/data/fetchers/clinical-trials-gov";

import { createLogger } from "@/lib/logger";
import {
  ClinicalTrialsIntApiResponseSchema,
  type ClinicalTrialsIntApiResponse,
} from "@/lib/medical/clinical-trials.schema";

export type StudyStatusKey = ClinicalTrialStatusKey;
export type StudyTypeKey = ClinicalTrialStudyTypeKey;
export type AgeGroupKey = ClinicalTrialAgeGroupKey;
export type SexKey = ClinicalTrialSexKey;

export interface GetClinicalTrialsParams {
  ageGroups?: AgeGroupKey[];
  condition?: string;
  distance?: number;
  from?: number;
  intervention?: string;
  lat?: number;
  limit?: number;
  lng?: number;
  locStr?: string;
  sex?: SexKey;
  studyStatus?: StudyStatusKey;
  studyType?: StudyTypeKey;
}

const log = createLogger("clinical-trials");

export function buildClinicalTrialsGovUrl(
  params: GetClinicalTrialsParams,
): URL {
  return buildClinicalTrialsSearchUrl(params);
}

export async function fetchClinicalTrials(
  params: GetClinicalTrialsParams,
): Promise<ClinicalTrialsIntApiResponse> {
  const url = buildClinicalTrialsGovUrl(params);
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error("ClinicalTrials.gov error", response.status, errorText);
    throw new Error(`ClinicalTrials.gov returned ${response.status}`);
  }

  const data = await response.json();
  return ClinicalTrialsIntApiResponseSchema.parse(
    toClinicalTrialsOffsetPage(data, { from: params.from, limit: params.limit }),
  );
}
