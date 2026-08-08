import { logger } from '@/lib/logger';
import { normalizeInterventionName } from '@/lib/normalize';

export async function searchClinicalTrialConditions(condition: string): Promise<string[]> {
    try {
        const response = await fetch(`https://clinicaltrials.gov/api/int/suggest?input=${encodeURIComponent(condition)}&dictionary=Condition`);
        if (!response.ok) {
            throw new Error('Failed to fetch condition suggestions');
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        logger.error('Error fetching condition suggestions:', { error });
        return [];
    }
}

export async function searchClinicalTrialInterventions(intervention: string): Promise<string[]> {
    try {
        const response = await fetch(`https://clinicaltrials.gov/api/int/suggest?input=${encodeURIComponent(intervention)}&dictionary=InterventionName`);
        if (!response.ok) {
            throw new Error('Failed to fetch intervention suggestions');
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        logger.error('Error fetching intervention suggestions:', { error });
        return [];
    }
}

export async function searchClinicalTrialSponsors(sponsor: string): Promise<string[]> {
    try {
        const response = await fetch(`https://clinicaltrials.gov/api/int/suggest?input=${encodeURIComponent(sponsor)}&dictionary=LeadSponsorName`);
        if (!response.ok) {
            throw new Error('Failed to fetch sponsor suggestions');
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        logger.error('Error fetching sponsor suggestions:', { error });
        return [];
    }
}

export async function searchClinicalTrialLocations(facility: string): Promise<string[]> {
    try {
        const response = await fetch(`https://clinicaltrials.gov/api/int/suggest?input=${encodeURIComponent(facility)}&dictionary=LocationFacility`);
        if (!response.ok) {
            throw new Error('Failed to fetch location suggestions');
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        logger.error('Error fetching location suggestions:', { error });
        return [];
    }
}

export async function searchFdaTreatments(treatment: string): Promise<string[]> {
    try {
        const encodedTreatment = encodeURIComponent(treatment);
        const response = await fetch(`https://api.fda.gov/drug/label.json?search=indications_and_usage:"${encodedTreatment}"&limit=10`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.results || !Array.isArray(data.results)) {
            return [];
        }
        
        return data.results
            .filter((item: any) => item.openfda?.brand_name)
            .map((item: any) => item.openfda.brand_name[0]);
    } catch (error) {
        logger.error("Error in searchFdaTreatments:", { error });
        return [];
    }
}

export async function findExperimentalDrugInterventionsForCondition(
  conditionName: string,
  maxStudiesToFetch: number = 100 // Max studies to fetch to look for interventions
): Promise<string[]> {
  const LOG_PREFIX_CTG = '[findExperimentalDrugInterventionsForCondition]';
  const baseUrl = "https://clinicaltrials.gov/api/v2/studies";
  
  const fieldsToRequest = [
    "protocolSection.armsInterventionsModule.interventions.name",
    "protocolSection.armsInterventionsModule.interventions.type"
  ].join(',');

  // Essie expression for phases:
  const phaseFilter = "(AREA[Phase]EARLY_PHASE1 OR AREA[Phase]PHASE1 OR AREA[Phase]PHASE2 OR AREA[Phase]PHASE3)";
  
  const statusFilterValues = [
    "RECRUITING", 
    "NOT_YET_RECRUITING", 
    "ACTIVE_NOT_RECRUITING", 
    "ENROLLING_BY_INVITATION"
  ];

  const queryParams = new URLSearchParams({
    "query.cond": conditionName,
    "filter.advanced": phaseFilter, 
    "filter.overallStatus": statusFilterValues.join('|'), 
    "fields": fieldsToRequest,
    "pageSize": maxStudiesToFetch.toString(),
    "format": "json",
  });

  const url = `${baseUrl}?${queryParams.toString()}`;
  logger.info(`${LOG_PREFIX_CTG} Fetching from URL: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`${LOG_PREFIX_CTG} API request failed for ${conditionName}`, { status: response.status, errorText, url });
      throw new Error(`ClinicalTrials.gov API request failed: ${response.status} - ${errorText}`);
    }

    interface InterventionDetail {
      name?: string;
      type?: string;
    }
    interface ArmsInterventionsModule {
      interventions?: InterventionDetail[];
    }
    interface ProtocolSection {
      armsInterventionsModule?: ArmsInterventionsModule;
    }
    interface Study {
      protocolSection?: ProtocolSection;
    }
    interface ApiResponse {
      studies: Study[];
      nextPageToken?: string;
      totalCount?: number;
    }

    const data: ApiResponse = await response.json();
    const drugNames = new Map<string, string>();

    if (data.studies) {
      logger.info(`${LOG_PREFIX_CTG} Received ${data.studies.length} studies for condition "${conditionName}".`);
      for (const study of data.studies) {
        const interventions = study.protocolSection?.armsInterventionsModule?.interventions;
        if (interventions && Array.isArray(interventions)) {
          for (const intervention of interventions) {
            if (intervention.type === "DRUG" && intervention.name && intervention.name.trim() !== "") {
              const trimmed = intervention.name.trim();
              const norm = normalizeInterventionName(trimmed);
              if (!drugNames.has(norm)) {
                drugNames.set(norm, trimmed);
              }
            }
          }
        }
      }
    } else {
      logger.warn(`${LOG_PREFIX_CTG} No studies found or unexpected response structure for condition "${conditionName}". Data:`, { data });
    }
    
    const result = Array.from(drugNames.values())
      .filter(name => !normalizeInterventionName(name).includes('placebo'));
    logger.info(`${LOG_PREFIX_CTG} Found ${result.length} unique experimental drug interventions for "${conditionName}". Drugs: ${result.join(', ')}`);
    return result;

  } catch (error: any) {
    logger.error(`${LOG_PREFIX_CTG} Error fetching or processing experimental drug interventions for "${conditionName}":`, {
      message: error.message,
      stack: error.stack,
      url
    });
    return []; 
  }
}


