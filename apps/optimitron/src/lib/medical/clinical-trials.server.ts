import { createLogger } from "@/lib/logger";
import {
  ClinicalTrialsIntApiResponseSchema,
  type ClinicalTrialsIntApiResponse,
} from "@/lib/medical/clinical-trials.schema";

export const STUDY_STATUSES = {
  "not yet recruiting": "not",
  recruiting: "rec",
  enrolling: "enr",
  active: "act",
  suspended: "sus",
  terminated: "ter",
  completed: "com",
  withdrawn: "wit",
  unknown: "unk",
  available: "ava",
  "no longer available": "nla",
  "approved for marketing": "afm",
} as const;

export const STUDY_TYPES = {
  int: "int",
  obs: "obs",
  pat: "exp",
  all: "all",
} as const;

export const AGE_GROUPS = {
  child: "child",
  adult: "adult",
  older_adult: "older",
} as const;

export const SEX_OPTIONS = {
  all: "all",
  female: "f",
  male: "m",
} as const;

export type StudyStatusKey = keyof typeof STUDY_STATUSES;
export type StudyTypeKey = keyof typeof STUDY_TYPES;
export type AgeGroupKey = keyof typeof AGE_GROUPS;
export type SexKey = keyof typeof SEX_OPTIONS;

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

const DEFAULT_FIELDS = [
  "NCTId", "BriefTitle", "OverallStatus", "LastKnownStatus", "StatusVerifiedDate", "HasResults",
  "Condition", "InterventionType", "InterventionName",
  "LocationFacility", "LocationCity", "LocationState", "LocationCountry", "LocationStatus",
  "LocationZip", "LocationGeoPoint", "LocationContactName", "LocationContactRole", "LocationContactPhone",
  "LocationContactPhoneExt", "LocationContactEMail", "CentralContactName", "CentralContactRole",
  "CentralContactPhone", "CentralContactPhoneExt", "CentralContactEMail",
  "Gender", "MinimumAge", "MaximumAge", "StdAge", "StudyType", "LeadSponsorName", "Acronym",
  "EnrollmentCount", "StartDate", "PrimaryCompletionDate", "CompletionDate", "StudyFirstPostDate",
  "ResultsFirstPostDate", "LastUpdatePostDate", "OrgStudyId", "SecondaryId", "Phase",
  "LargeDocLabel", "LargeDocFilename", "PrimaryOutcomeMeasure", "SecondaryOutcomeMeasure",
  "DesignAllocation", "DesignInterventionModel", "DesignMasking", "DesignWhoMasked",
  "DesignPrimaryPurpose", "DesignObservationalModel", "DesignTimePerspective",
  "LeadSponsorClass", "CollaboratorClass",
].join(",");

const DEFAULT_COLUMNS = ["conditions", "interventions", "collaborators"].join(",");

export function buildClinicalTrialsGovUrl(
  params: GetClinicalTrialsParams,
): URL {
  const queryParams = new URLSearchParams();

  if (params.condition) queryParams.set("cond", params.condition);
  if (params.intervention) queryParams.set("intr", params.intervention);
  if (params.lat !== undefined && params.lng !== undefined) {
    queryParams.set("lat", params.lat.toString());
    queryParams.set("lng", params.lng.toString());
    if (params.distance !== undefined) {
      queryParams.set("distance", params.distance.toString());
    }
    if (params.locStr) queryParams.set("locStr", params.locStr);
  } else if (params.locStr) {
    queryParams.set("locStr", params.locStr);
  }

  const aggFilters: string[] = [];
  if (params.studyStatus) {
    aggFilters.push(`status:${STUDY_STATUSES[params.studyStatus]}`);
  }
  if (params.studyType && params.studyType !== "all") {
    aggFilters.push(`studyType:${STUDY_TYPES[params.studyType]}`);
  }
  if (params.ageGroups?.length) {
    aggFilters.push(
      `ages:${params.ageGroups.map((ageGroup) => AGE_GROUPS[ageGroup]).join(" ")}`,
    );
  }
  if (params.sex && params.sex !== "all") {
    aggFilters.push(`sex:${SEX_OPTIONS[params.sex]}`);
  }
  if (aggFilters.length > 0) {
    queryParams.set("aggFilters", aggFilters.join(","));
  }

  queryParams.set("from", String(params.from ?? 0));
  queryParams.set("limit", String(params.limit ?? 10));
  queryParams.set("fields", DEFAULT_FIELDS);
  queryParams.set("columns", DEFAULT_COLUMNS);
  queryParams.set("agg.synonyms", "true");
  queryParams.set("checkSpell", "true");
  queryParams.set("highlight", "true");
  queryParams.set("sort", "@relevance");

  return new URL(`https://clinicaltrials.gov/api/int/studies?${queryParams}`);
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
  return ClinicalTrialsIntApiResponseSchema.parse(data);
}
