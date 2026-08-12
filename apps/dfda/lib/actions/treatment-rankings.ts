'use server';

import { logger } from '@/lib/logger';
import { normalizeInterventionName } from '@/lib/normalize';

const LOG_PREFIX = '[treatment-rankings]';

export interface TreatmentRanking {
  name: string;
  trialCount: number;
  phase: string[];
  recentTrials: {
    title: string;
    nctId: string;
    status: string;
  }[];
}

export async function getTreatmentRankingsAction(
  conditionName: string,
  maxStudies: number = 100
): Promise<TreatmentRanking[]> {
  logger.info(`${LOG_PREFIX} Fetching treatment rankings for: ${conditionName}`);

  const baseUrl = "https://clinicaltrials.gov/api/v2/studies";

  const fieldsToRequest = [
    "protocolSection.armsInterventionsModule.interventions.name",
    "protocolSection.armsInterventionsModule.interventions.type",
    "protocolSection.designModule.phases",
    "protocolSection.identificationModule.nctId",
    "protocolSection.identificationModule.briefTitle",
    "protocolSection.statusModule.overallStatus"
  ].join(',');

  const phaseFilter = "(AREA[Phase]EARLY_PHASE1 OR AREA[Phase]PHASE1 OR AREA[Phase]PHASE2 OR AREA[Phase]PHASE3 OR AREA[Phase]PHASE4)";

  const statusFilterValues = [
    "RECRUITING",
    "NOT_YET_RECRUITING",
    "ACTIVE_NOT_RECRUITING",
    "ENROLLING_BY_INVITATION",
    "COMPLETED"
  ];

  const queryParams = new URLSearchParams({
    "query.cond": conditionName,
    "filter.advanced": phaseFilter,
    "filter.overallStatus": statusFilterValues.join('|'),
    "fields": fieldsToRequest,
    "pageSize": maxStudies.toString(),
    "format": "json",
  });

  const url = `${baseUrl}?${queryParams.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`${LOG_PREFIX} API request failed`, { status: response.status, errorText });
      throw new Error(`ClinicalTrials.gov API request failed: ${response.status}`);
    }

    interface InterventionDetail {
      name?: string;
      type?: string;
    }

    interface Study {
      protocolSection?: {
        armsInterventionsModule?: {
          interventions?: InterventionDetail[];
        };
        designModule?: {
          phases?: string[];
        };
        identificationModule?: {
          nctId?: string;
          briefTitle?: string;
        };
        statusModule?: {
          overallStatus?: string;
        };
      };
    }

    interface ApiResponse {
      studies: Study[];
    }

    const data: ApiResponse = await response.json();

    // Track interventions with their trials
    const interventionMap = new Map<string, {
      displayName: string;
      trialCount: number;
      phases: Set<string>;
      trials: Array<{
        title: string;
        nctId: string;
        status: string;
      }>;
    }>();

    if (data.studies) {
      logger.info(`${LOG_PREFIX} Processing ${data.studies.length} studies`);

      for (const study of data.studies) {
        const interventions = study.protocolSection?.armsInterventionsModule?.interventions;
        const phases = study.protocolSection?.designModule?.phases || [];
        const nctId = study.protocolSection?.identificationModule?.nctId || '';
        const title = study.protocolSection?.identificationModule?.briefTitle || '';
        const status = study.protocolSection?.statusModule?.overallStatus || '';

        if (interventions && Array.isArray(interventions)) {
          for (const intervention of interventions) {
            if (intervention.type === "DRUG" && intervention.name && intervention.name.trim() !== "") {
              const displayName = intervention.name.trim();
              const normalizedName = normalizeInterventionName(displayName);

              // Skip placebo
              if (normalizedName.includes('placebo')) continue;

              if (!interventionMap.has(normalizedName)) {
                interventionMap.set(normalizedName, {
                  displayName,
                  trialCount: 0,
                  phases: new Set(),
                  trials: []
                });
              }

              const entry = interventionMap.get(normalizedName)!;
              entry.trialCount++;
              phases.forEach(phase => entry.phases.add(phase));

              // Store up to 3 recent trials per intervention
              if (entry.trials.length < 3) {
                entry.trials.push({ title, nctId, status });
              }
            }
          }
        }
      }
    }

    // Convert to array and sort by trial count
    const rankings: TreatmentRanking[] = Array.from(interventionMap.entries())
      .map(([_normalizedName, value]) => ({
        name: value.displayName,
        trialCount: value.trialCount,
        phase: Array.from(value.phases).sort(),
        recentTrials: value.trials
      }))
      .sort((a, b) => b.trialCount - a.trialCount)
      .slice(0, 20); // Top 20 treatments

    logger.info(`${LOG_PREFIX} Found ${rankings.length} ranked treatments for ${conditionName}`);
    return rankings;

  } catch (error: any) {
    logger.error(`${LOG_PREFIX} Error fetching treatment rankings:`, {
      message: error.message,
      stack: error.stack
    });
    return [];
  }
}
