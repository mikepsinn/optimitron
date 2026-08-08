import { logger } from '@/lib/logger';
import type { OutcomeMeasure } from '@/types/treatment';

const LOG_PREFIX = '[fetch-trial-results]';

/**
 * Fetch detailed results for a specific clinical trial from ClinicalTrials.gov API v2
 * Returns parsed outcome measures with baseline and change data
 */
export async function fetchTrialResults(nctId: string): Promise<{
  primaryOutcomes: OutcomeMeasure[];
  secondaryOutcomes: OutcomeMeasure[];
} | null> {
  try {
    const fieldsToRequest = [
      'protocolSection.identificationModule.nctId',
      'protocolSection.identificationModule.briefTitle',
      'resultsSection.outcomeMeasuresModule.outcomeMeasures',
      'hasResults'
    ].join(',');

    const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}?fields=${fieldsToRequest}&format=json`;

    logger.info(`${LOG_PREFIX} Fetching results for ${nctId}`);

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      logger.warn(`${LOG_PREFIX} Failed to fetch ${nctId}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Check if trial has results
    if (!data.hasResults) {
      logger.debug(`${LOG_PREFIX} Trial ${nctId} has no posted results`);
      return null;
    }

    const outcomeMeasures = data.resultsSection?.outcomeMeasuresModule?.outcomeMeasures;
    if (!outcomeMeasures || !Array.isArray(outcomeMeasures)) {
      logger.debug(`${LOG_PREFIX} No outcome measures found for ${nctId}`);
      return null;
    }

    const primaryOutcomes: OutcomeMeasure[] = [];
    const secondaryOutcomes: OutcomeMeasure[] = [];

    for (const outcome of outcomeMeasures) {
      const parsed = parseOutcomeMeasure(outcome);
      if (parsed) {
        if (outcome.type === 'PRIMARY') {
          primaryOutcomes.push(parsed);
        } else if (outcome.type === 'SECONDARY') {
          secondaryOutcomes.push(parsed);
        }
      }
    }

    logger.info(`${LOG_PREFIX} Parsed ${primaryOutcomes.length} primary + ${secondaryOutcomes.length} secondary outcomes from ${nctId}`);

    return {
      primaryOutcomes,
      secondaryOutcomes,
    };
  } catch (error) {
    logger.error(`${LOG_PREFIX} Error fetching results for ${nctId}:`, error);
    return null;
  }
}

/**
 * Parse a single outcome measure from CT.gov results data
 * Attempts to extract baseline, percentage change, and absolute change
 */
function parseOutcomeMeasure(outcome: any): OutcomeMeasure | null {
  try {
    const title = outcome.title || outcome.measure;
    if (!title) return null;

    // Try to extract numerical data from outcome classes/categories/measurements
    const classes = outcome.classes;
    if (!classes || !Array.isArray(classes) || classes.length === 0) {
      return null;
    }

    // Look for baseline and change data in the first class
    const firstClass = classes[0];
    const categories = firstClass.categories;
    if (!categories || !Array.isArray(categories)) {
      return null;
    }

    // Try to find baseline and endpoint measurements
    let baselineValue: number | null = null;
    let endpointValue: number | null = null;
    let unit: string | null = null;

    // Extract unit from measure
    const unitMatch = outcome.unitOfMeasure || outcome.paramType;
    if (unitMatch) {
      unit = unitMatch;
    }

    // Simple heuristic: if we have 2 categories, often one is baseline and one is endpoint
    // This is a simplified parser - real data is more complex
    for (const category of categories) {
      const measurements = category.measurements;
      if (!measurements || !Array.isArray(measurements) || measurements.length === 0) {
        continue;
      }

      const measurement = measurements[0]; // Use first measurement group
      const value = parseFloat(measurement.value);

      if (!isNaN(value)) {
        const categoryTitle = (category.title || '').toLowerCase();

        if (categoryTitle.includes('baseline') || categoryTitle.includes('pre')) {
          baselineValue = value;
        } else if (categoryTitle.includes('end') || categoryTitle.includes('post') || categoryTitle.includes('final')) {
          endpointValue = value;
        } else if (baselineValue === null) {
          // Assume first value is baseline if not explicitly labeled
          baselineValue = value;
        } else if (endpointValue === null) {
          endpointValue = value;
        }
      }
    }

    // If we found both baseline and endpoint, calculate change
    if (baselineValue !== null && endpointValue !== null && baselineValue !== 0) {
      const absoluteChange = endpointValue - baselineValue;
      const percentageChange = ((endpointValue - baselineValue) / baselineValue) * 100;

      // Determine if change is positive based on outcome title
      const lowerTitle = title.toLowerCase();
      const isReduction = lowerTitle.includes('reduction') ||
                         lowerTitle.includes('decrease') ||
                         lowerTitle.includes('cholesterol') ||
                         lowerTitle.includes('pain') ||
                         lowerTitle.includes('symptom');

      const isIncrease = lowerTitle.includes('increase') ||
                        lowerTitle.includes('improvement') ||
                        lowerTitle.includes('quality of life');

      const isPositive = isReduction ? absoluteChange < 0 : (isIncrease ? absoluteChange > 0 : undefined);

      return {
        name: title,
        baseline: unit ? `${baselineValue} ${unit}` : `${baselineValue}`,
        percentageChange: Math.round(percentageChange),
        absoluteChange: unit ? `${absoluteChange > 0 ? '+' : ''}${absoluteChange.toFixed(1)} ${unit}` : `${absoluteChange}`,
        isPositive,
        dataSource: 'trial' as const,
      };
    }

    // If we couldn't parse full data, at least return the title
    return {
      name: title,
      dataSource: 'trial' as const,
    };
  } catch (error) {
    logger.debug(`${LOG_PREFIX} Error parsing outcome measure:`, error);
    return null;
  }
}

/**
 * Fetch results from multiple trials and aggregate
 * Returns the most common/representative outcome measures
 */
export async function fetchAggregatedTrialResults(
  nctIds: string[],
  maxTrialsToFetch: number = 5
): Promise<{
  primaryOutcomes: OutcomeMeasure[];
  secondaryOutcomes: OutcomeMeasure[];
} | null> {
  const primaryOutcomesMap = new Map<string, OutcomeMeasure[]>();
  const secondaryOutcomesMap = new Map<string, OutcomeMeasure[]>();

  let fetchedCount = 0;

  for (const nctId of nctIds.slice(0, maxTrialsToFetch)) {
    const results = await fetchTrialResults(nctId);
    if (results) {
      fetchedCount++;

      // Group by outcome name
      for (const outcome of results.primaryOutcomes) {
        if (!primaryOutcomesMap.has(outcome.name)) {
          primaryOutcomesMap.set(outcome.name, []);
        }
        primaryOutcomesMap.get(outcome.name)!.push(outcome);
      }

      for (const outcome of results.secondaryOutcomes) {
        if (!secondaryOutcomesMap.has(outcome.name)) {
          secondaryOutcomesMap.set(outcome.name, []);
        }
        secondaryOutcomesMap.get(outcome.name)!.push(outcome);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  if (fetchedCount === 0) {
    return null;
  }

  // For each outcome name, average the values
  const aggregatedPrimary = aggregateOutcomes(primaryOutcomesMap);
  const aggregatedSecondary = aggregateOutcomes(secondaryOutcomesMap);

  logger.info(`${LOG_PREFIX} Aggregated results from ${fetchedCount} trials: ${aggregatedPrimary.length} primary + ${aggregatedSecondary.length} secondary outcomes`);

  return {
    primaryOutcomes: aggregatedPrimary,
    secondaryOutcomes: aggregatedSecondary,
  };
}

function aggregateOutcomes(outcomesMap: Map<string, OutcomeMeasure[]>): OutcomeMeasure[] {
  const result: OutcomeMeasure[] = [];

  for (const [name, outcomes] of outcomesMap.entries()) {
    const validOutcomes = outcomes.filter(o =>
      o.percentageChange !== undefined &&
      o.baseline !== undefined
    );

    if (validOutcomes.length === 0) {
      // If no valid data, just use the name
      result.push({ name });
      continue;
    }

    if (validOutcomes.length === 1) {
      // Single measurement - use as-is
      result.push(validOutcomes[0]);
      continue;
    }

    // Multiple measurements - average them
    const avgPercentageChange = validOutcomes.reduce((sum, o) => sum + (o.percentageChange || 0), 0) / validOutcomes.length;

    // Use the most common baseline format
    const baseline = validOutcomes[0].baseline;

    // Determine positivity (most common value)
    const positiveCount = validOutcomes.filter(o => o.isPositive === true).length;
    const isPositive = positiveCount > validOutcomes.length / 2 ? true : undefined;

    result.push({
      name,
      baseline,
      percentageChange: Math.round(avgPercentageChange),
      isPositive,
      dataSource: 'trial' as const,
    });
  }

  return result;
}
