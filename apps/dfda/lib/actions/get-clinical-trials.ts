'use server';

import { logger } from '@/lib/logger';
import {
  ClinicalTrialsIntApiResponseSchema,
  type ClinicalTrialsIntApiResponse,
} from '@/lib/schemas/clinical-trial.schema';
import type { AgeGroupKey, SexKey, StudyStatusKey, StudyTypeKey } from '@/lib/constants/clinical-trial-filters';

interface ActionError {
  error: string;
}

interface GetClinicalTrialsParams {
  condition?: string;
  intervention?: string;
  studyStatus?: StudyStatusKey;
  studyType?: StudyTypeKey;
  ageGroups?: AgeGroupKey[];
  sex?: SexKey;
  from?: number;
  limit?: number;
  // We can add location params later if needed: lat, lng, locStr, distance
  lat?: number;
  lng?: number;
  locStr?: string;
  distance?: number;
}

const studyStatusToApiCode: Record<StudyStatusKey, string> = {
  "not yet recruiting": "not",
  recruiting: "rec",
  enrolling: "enr", // Assuming 'enr' for "Enrolling by Invitation"
  active: "act", // "Active, Not Recruiting"
  suspended: "sus",
  terminated: "ter",
  completed: "com",
  "withdrawn": "wit",
  unknown: "unk",
  "available": "ava", 
  "no longer available": "nla",
  "approved for marketing": "afm",
};

const studyTypeToApiCode: Record<StudyTypeKey, string> = {
  int: "int",
  obs: "obs",
  pat: "exp", // Expanded Access seems to be 'exp' in some contexts, or might need specific handling
  all: "all", // 'all' is not typically sent as a filter value, but kept for consistency
};

const ageGroupToApiCode: Record<AgeGroupKey, string> = {
  child: "child",
  adult: "adult",
  older_adult: "older",
};

const sexToApiCode: Record<SexKey, string> = {
  all: "all", // 'all' is not typically sent as a filter value
  female: "f",
  male: "m",
};

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

export async function getClinicalTrialsAction(
  params: GetClinicalTrialsParams,
): Promise<ClinicalTrialsIntApiResponse | ActionError> {
  const { 
    condition, 
    intervention, 
    studyStatus,
    studyType,
    ageGroups,
    sex,
    from = 0, 
    limit = 10,
    lat,
    lng,
    locStr,
    distance,
  } = params;

  if (!condition && !intervention && !locStr && !(lat && lng)) {
    // Allowing empty for now, but might be too slow or rate limited if no search terms or location provided.
  }

  try {
    const queryParams = new URLSearchParams();
    if (condition) queryParams.set("cond", condition);
    if (intervention) queryParams.set("intr", intervention);

    // Location parameters for /api/int/studies
    if (lat !== undefined && lng !== undefined) {
      queryParams.set("lat", lat.toString());
      queryParams.set("lng", lng.toString());
      if (distance !== undefined) {
        queryParams.set("distance", distance.toString());
      }
      // locStr can be "Current Location" or user-entered text if lat/lng are also present
      if (locStr) {
        queryParams.set("locStr", locStr);
      }
    } else if (locStr) {
      // If only locStr is provided (e.g. user typed "New York" but didn't use current location)
      // The API might handle this as a general location search without specific radius.
      // This branch ensures locStr is passed if lat/lng are not available.
      queryParams.set("locStr", locStr);
    }

    const aggFilters: string[] = [];
    if (studyStatus && studyStatusToApiCode[studyStatus]) {
      aggFilters.push(`status:${studyStatusToApiCode[studyStatus]}`);
    }
    if (studyType && studyType !== "all" && studyTypeToApiCode[studyType]) {
      aggFilters.push(`studyType:${studyTypeToApiCode[studyType]}`);
    }
    if (ageGroups && ageGroups.length > 0) {
      const apiAgeGroups = ageGroups.map(ag => ageGroupToApiCode[ag]).filter(Boolean);
      if (apiAgeGroups.length > 0) {
        aggFilters.push(`ages:${apiAgeGroups.join(" ")}`);
      }
    }
    if (sex && sex !== "all" && sexToApiCode[sex]) {
      aggFilters.push(`sex:${sexToApiCode[sex]}`);
    }
    
    if (aggFilters.length > 0) {
      queryParams.set("aggFilters", aggFilters.join(","));
    }

    queryParams.set("from", from.toString());
    queryParams.set("limit", limit.toString());
    queryParams.set("fields", DEFAULT_FIELDS);
    queryParams.set("columns", DEFAULT_COLUMNS);
    queryParams.set("agg.synonyms", "true");
    queryParams.set("checkSpell", "true");
    queryParams.set("highlight", "true");
    queryParams.set("sort", "@relevance");
    // queryParams.set("api_key", "YOUR_API_KEY"); // If an API key becomes necessary

    const apiUrl = `https://clinicaltrials.gov/api/int/studies?${queryParams.toString()}`;
    logger.info(`Fetching clinical trials from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        `API error fetching clinical trials for query "${queryParams.toString()}": ${response.status} ${response.statusText} - ${errorText}`,
      );
      return {
        error: `Failed to fetch clinical trials. API returned ${response.status}: ${errorText.substring(0, 200)}`,
      };
    }

    const data = await response.json();
    const validationResult = ClinicalTrialsIntApiResponseSchema.safeParse(data);

    if (!validationResult.success) {
      logger.error(
        `Invalid API response structure for clinical trials query "${queryParams.toString()}": ${JSON.stringify(validationResult.error.flatten(), null, 2)}`,
      );
      // Log a snippet of the received data for debugging
      logger.debug(`Received data snippet: ${JSON.stringify(data).substring(0, 500)}`);
      return { error: "Invalid API response structure from ClinicalTrials.gov." };
    }

    return validationResult.data;
  } catch (err) {
    if (err instanceof Error) {
      logger.error(
        `Error fetching clinical trials for query params "${JSON.stringify(params)}": ${err.message}`,
        err,
      );
    } else {
      logger.error(
        `Unknown error fetching clinical trials for query params "${JSON.stringify(params)}"`,
        err,
      );
    }
    return { error: "An unexpected error occurred while fetching clinical trials." };
  }
} 