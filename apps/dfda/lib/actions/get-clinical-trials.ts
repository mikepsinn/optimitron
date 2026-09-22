'use server';

import {
  CLINICAL_TRIALS_MAX_STUDIES,
  buildClinicalTrialsSearchUrl,
  toClinicalTrialsOffsetPage,
} from '@optimitron/data/fetchers/clinical-trials-gov';

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

  if (from >= CLINICAL_TRIALS_MAX_STUDIES) {
    return {
      error: `Results past the first ${CLINICAL_TRIALS_MAX_STUDIES} studies are not available. Narrow the search to see more.`,
    };
  }

  try {
    const apiUrl = buildClinicalTrialsSearchUrl({
      ageGroups,
      condition,
      distance,
      from,
      intervention,
      lat,
      limit,
      lng,
      locStr,
      sex,
      studyStatus,
      studyType,
    });
    logger.info(`Fetching clinical trials from: ${apiUrl.toString()}`);

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
        `API error fetching clinical trials for "${apiUrl.search}": ${response.status} ${response.statusText} - ${errorText}`,
      );
      return {
        error: `Failed to fetch clinical trials. API returned ${response.status}: ${errorText.substring(0, 200)}`,
      };
    }

    const data = await response.json();
    const validationResult = ClinicalTrialsIntApiResponseSchema.safeParse(
      toClinicalTrialsOffsetPage(data, { from, limit }),
    );

    if (!validationResult.success) {
      logger.error(
        `Invalid API response structure for clinical trials query "${apiUrl.search}": ${JSON.stringify(validationResult.error.flatten(), null, 2)}`,
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