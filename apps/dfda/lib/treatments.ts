import type { TreatmentForCondition } from '@/types/treatment';
import treatmentIndex from '@/data/treatments/index.json';
import { nameToSlug } from '@/lib/path-helpers';
import { createLogger } from '@/lib/logger';

const logger = createLogger('treatments');

export interface TreatmentWithConditions {
  name: string;
  slug: string;
  conditions: Array<{
    conditionName: string;
    conditionSlug: string;
    effectiveness: number;
    safetyScore: number;
    trials: number;
    participants: number;
  }>;
  totalTrials: number;
  totalParticipants: number;
  avgEffectiveness: number;
  avgSafetyScore: number;
}

/**
 * Aggregates all treatments across all conditions.
 * Uses pre-generated treatments.json if available (for performance).
 * Falls back to runtime aggregation if not found (for development/backwards compatibility).
 */
export function getAllTreatments(): TreatmentWithConditions[] {
  // Try to load pre-generated treatments.json (much faster for 200+ conditions)
  try {
    const preGeneratedTreatments = require('@/data/treatments.json');
    if (Array.isArray(preGeneratedTreatments) && preGeneratedTreatments.length > 0) {
      return preGeneratedTreatments;
    }
  } catch (error) {
    logger.warn('treatments.json not found, falling back to runtime aggregation. Run: pnpm generate:treatments:hybrid', { error });
  }

  // FALLBACK: Runtime aggregation (slower, but works without pre-generation)
  const treatmentMap = new Map<string, TreatmentWithConditions>();

  // Iterate through all condition treatment files
  treatmentIndex.conditions.forEach((conditionSlug: string) => {
    try {
      // Dynamic import of treatment data
      const treatmentData = require(`@/data/treatments/${conditionSlug}.json`);
      const conditionName = treatmentData.conditionName;

      // Process each treatment in this condition
      treatmentData.treatments.forEach((treatment: TreatmentForCondition) => {
        const treatmentName = treatment.name;
        const treatmentSlug = nameToSlug(treatmentName);

        if (!treatmentMap.has(treatmentName)) {
          treatmentMap.set(treatmentName, {
            name: treatmentName,
            slug: treatmentSlug,
            conditions: [],
            totalTrials: 0,
            totalParticipants: 0,
            avgEffectiveness: 0,
            avgSafetyScore: 0,
          });
        }

        const aggregatedTreatment = treatmentMap.get(treatmentName)!;
        aggregatedTreatment.conditions.push({
          conditionName,
          conditionSlug,
          effectiveness: treatment.effectiveness,
          safetyScore: treatment.safetyScore,
          trials: treatment.trials,
          participants: treatment.participants,
        });

        aggregatedTreatment.totalTrials += treatment.trials;
        aggregatedTreatment.totalParticipants += treatment.participants;
      });
    } catch (error) {
      console.error(`Error loading treatment data for ${conditionSlug}:`, error);
    }
  });

  // Calculate averages and convert to array
  const treatments = Array.from(treatmentMap.values()).map((treatment) => {
    const numConditions = treatment.conditions.length;
    treatment.avgEffectiveness =
      treatment.conditions.reduce((sum, c) => sum + c.effectiveness, 0) / numConditions;
    treatment.avgSafetyScore =
      treatment.conditions.reduce((sum, c) => sum + c.safetyScore, 0) / numConditions;
    return treatment;
  });

  // Sort by total participants (most studied first)
  return treatments.sort((a, b) => b.totalParticipants - a.totalParticipants);
}

/**
 * Get a single treatment by slug with all its condition associations.
 */
export function getTreatmentBySlug(slug: string): TreatmentWithConditions | undefined {
  const allTreatments = getAllTreatments();
  return allTreatments.find((t) => t.slug === slug);
}

/**
 * Search treatments by name.
 */
export function searchTreatments(query: string): TreatmentWithConditions[] {
  const lowerQuery = query.toLowerCase();
  const allTreatments = getAllTreatments();
  return allTreatments.filter((t) => t.name.toLowerCase().includes(lowerQuery));
}
