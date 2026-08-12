'use server';

import { logger } from '@/lib/logger';
import { getTreatmentComparisonsAction } from './treatment-comparisons';
import { getGroundedAnswerAction } from './google-grounded-search';
import { generateOutcomesFromAI } from './generate-outcomes-ai';
import { getStandardMonitoringCost, inferConditionCategory } from '@/lib/utils/monitoring-costs';
import type { ConditionCategory } from '@/types/condition';
import { getConditionByName } from '@/lib/conditions';
import type { TreatmentComparisonResult, TreatmentForCondition, TreatmentCitation } from '@/types/treatment';
import { fetchAggregatedTrialResults } from '@/lib/fetch-trial-results';

const LOG_PREFIX = '[hybrid-treatment-data]';
const CTG_BASE_URL = 'https://clinicaltrials.gov/api/v2/studies';

/**
 * Get real trial counts from ClinicalTrials.gov
 * Also returns NCT IDs of completed trials with results for detailed data fetching
 */
async function getRealTrialCounts(
  conditionName: string,
  interventionName: string
): Promise<{ total: number; withResults: number; completedTrialIds: string[] }> {
  try {
    // Total trials
    const totalParams = new URLSearchParams({
      'query.cond': conditionName,
      'query.intr': interventionName,
      'countTotal': 'true',
      'pageSize': '1'
    });

    const totalResponse = await fetch(`${CTG_BASE_URL}?${totalParams.toString()}`);
    const totalData = await totalResponse.json();
    const total = totalData.totalCount || 0;

    // Completed trials - fetch some IDs for results extraction
    const resultsParams = new URLSearchParams({
      'query.cond': conditionName,
      'query.intr': interventionName,
      'filter.overallStatus': 'COMPLETED',
      'countTotal': 'true',
      'pageSize': '10', // Get up to 10 completed trials
      'fields': 'NCTId'
    });

    const resultsResponse = await fetch(`${CTG_BASE_URL}?${resultsParams.toString()}`);
    const resultsData = await resultsResponse.json();
    const withResults = resultsData.totalCount || 0;

    // Extract NCT IDs from completed trials
    const completedTrialIds: string[] = [];
    if (resultsData.studies && Array.isArray(resultsData.studies)) {
      for (const study of resultsData.studies) {
        const nctId = study.protocolSection?.identificationModule?.nctId;
        if (nctId) {
          completedTrialIds.push(nctId);
        }
      }
    }

    logger.info(`${LOG_PREFIX} CTG trial counts for ${interventionName}:`, { total, withResults, completedTrialsFound: completedTrialIds.length });
    return { total, withResults, completedTrialIds };
  } catch (error: any) {
    logger.error(`${LOG_PREFIX} Error getting trial counts:`, { error: error.message });
    return { total: 0, withResults: 0, completedTrialIds: [] };
  }
}

/**
 * Get citations for a treatment's effectiveness using grounded search
 */
async function getEffectivenessCitations(
  treatmentName: string,
  conditionName: string
): Promise<TreatmentCitation[]> {
  try {
    const query = `What is the clinical evidence for ${treatmentName} effectiveness in treating ${conditionName}? Include meta-analyses and systematic reviews.`;

    const groundedResult = await getGroundedAnswerAction(query);

    if (groundedResult && groundedResult.citations) {
      return groundedResult.citations.map(c => ({
        title: c.title || undefined,
        url: c.url,
        type: 'literature' as const
      }));
    }

    return [];
  } catch (error: any) {
    logger.error(`${LOG_PREFIX} Error getting citations:`, { error: error.message });
    return [];
  }
}

/**
 * Get hybrid treatment data combining Google AI + ClinicalTrials.gov
 */
export async function getHybridTreatmentDataAction(
  conditionName: string
): Promise<TreatmentComparisonResult | null> {
  logger.info(`${LOG_PREFIX} Getting hybrid treatment data for:`, { conditionName });

  // Step 1: Get AI-generated treatment list with effectiveness ratings
  const aiData = await getTreatmentComparisonsAction(conditionName);

  if (!aiData || aiData.treatments.length === 0) {
    logger.warn(`${LOG_PREFIX} No AI data available for ${conditionName}`);
    return null;
  }

  logger.info(`${LOG_PREFIX} Got ${aiData.treatments.length} treatments from AI`);

  // Get condition category for standardized monitoring costs
  const condition = getConditionByName(conditionName);
  const conditionCategory: ConditionCategory = condition?.category || inferConditionCategory(conditionName);

  // Step 2: Enhance each treatment with real CTG data, citations, and standardized costs
  const enhancedTreatments: TreatmentForCondition[] = [];

  for (const treatment of aiData.treatments) {
    logger.info(`${LOG_PREFIX} Enhancing treatment: ${treatment.name}`);

    // Get real trial counts from ClinicalTrials.gov
    const realCounts = await getRealTrialCounts(conditionName, treatment.name);

    // Try to fetch rich outcome data from completed trials with results
    let primaryOutcomes;
    let secondaryOutcomes;
    if (realCounts.completedTrialIds.length > 0) {
      logger.info(`${LOG_PREFIX} Attempting to fetch trial results from ${realCounts.completedTrialIds.length} completed trials`);
      const trialResults = await fetchAggregatedTrialResults(realCounts.completedTrialIds, 3); // Fetch from up to 3 trials
      if (trialResults && trialResults.primaryOutcomes.length > 0) {
        // Check if we have RICH outcome data (with baseline and percentageChange), not just names
        const hasRichData = trialResults.primaryOutcomes.some(
          o => o.baseline !== undefined && o.percentageChange !== undefined
        );

        if (hasRichData) {
          primaryOutcomes = trialResults.primaryOutcomes;
          secondaryOutcomes = trialResults.secondaryOutcomes;
          logger.info(`${LOG_PREFIX} Successfully fetched rich outcome data from trials: ${primaryOutcomes.length} primary + ${secondaryOutcomes.length} secondary outcomes`);
        } else {
          logger.info(`${LOG_PREFIX} Trial outcomes are name-only (no baseline/percentageChange), will use AI fallback`);
        }
      }
    }

    // Fallback: If no rich trial results but trials exist, generate AI-estimated outcomes
    if (!primaryOutcomes && realCounts.total > 0) {
      logger.info(`${LOG_PREFIX} No posted trial results available, using AI to generate plausible outcomes for ${treatment.name}`);
      const aiOutcomes = await generateOutcomesFromAI(treatment.name, conditionName);
      if (aiOutcomes) {
        primaryOutcomes = aiOutcomes.primaryOutcomes;
        secondaryOutcomes = aiOutcomes.secondaryOutcomes;
        logger.info(`${LOG_PREFIX} Successfully generated AI-estimated outcomes: ${primaryOutcomes.length} primary + ${secondaryOutcomes.length} secondary outcomes`);
      }
    }

    // Get citations for effectiveness claims
    const citations = await getEffectivenessCitations(treatment.name, conditionName);

    // Add ClinicalTrials.gov link as a citation
    const ctgSearchUrl = `https://clinicaltrials.gov/search?cond=${encodeURIComponent(conditionName)}&intr=${encodeURIComponent(treatment.name)}`;
    citations.push({
      title: `ClinicalTrials.gov: ${treatment.name} trials for ${conditionName}`,
      url: ctgSearchUrl,
      type: 'study'
    });

    // Use real trial count if available, otherwise keep AI estimate
    const finalTrialCount = realCounts.total > 0 ? realCounts.total : treatment.trials;

    // Apply standardized monitoring costs if missing
    let enhancedTreatment = { ...treatment };
    if (enhancedTreatment.healthEconomics?.annualCostOfCare) {
      const costOfCare = enhancedTreatment.healthEconomics.annualCostOfCare;
      
      // If monitoring cost is missing or zero, apply standardized estimate
      if (!costOfCare.monitoringCost || costOfCare.monitoringCost === 0) {
        const standardMonitoringCost = getStandardMonitoringCost(conditionCategory);
        costOfCare.monitoringCost = standardMonitoringCost;
        
        // Recalculate total annual cost
        costOfCare.totalAnnual = 
          (costOfCare.drugCost || 0) + 
          costOfCare.monitoringCost + 
          (costOfCare.sideEffectManagement || 0);
        
        logger.info(`${LOG_PREFIX} Applied standardized monitoring cost for ${conditionCategory}: $${standardMonitoringCost}`);
      }
    } else if (enhancedTreatment.healthEconomics) {
      // If annualCostOfCare object doesn't exist but healthEconomics does, create it
      const standardMonitoringCost = getStandardMonitoringCost(conditionCategory);
      enhancedTreatment.healthEconomics.annualCostOfCare = {
        drugCost: 0,
        monitoringCost: standardMonitoringCost,
        sideEffectManagement: 0,
        totalAnnual: standardMonitoringCost
      };
      logger.info(`${LOG_PREFIX} Created annualCostOfCare with standardized monitoring cost: $${standardMonitoringCost}`);
    }

    enhancedTreatments.push({
      ...enhancedTreatment,
      trials: finalTrialCount,
      citations: citations.length > 0 ? citations : undefined,
      primaryOutcomes: primaryOutcomes && primaryOutcomes.length > 0 ? primaryOutcomes : undefined,
      secondaryOutcomes: secondaryOutcomes && secondaryOutcomes.length > 0 ? secondaryOutcomes : undefined
    });

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  logger.info(`${LOG_PREFIX} Enhanced all treatments with real data and citations`);

  return {
    conditionName,
    treatments: enhancedTreatments,
    lastUpdated: new Date().toISOString(),
    dataSource: 'mixed'
  };
}
