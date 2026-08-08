'use server';

import { promises as fs } from 'fs';
import path from 'path';
import type { TreatmentComparisonResult } from '@/types/treatment';
import type { TreatmentWithConditions } from '@/lib/treatments';
import { getAllTreatments } from '@/lib/treatments';
import { createLogger } from '@/lib/logger';

const logger = createLogger('treatments-actions');

/**
 * Load treatment data for a specific condition by slug
 * Returns null if no treatment data exists for that condition
 */
export async function getTreatmentsByConditionSlug(
  conditionSlug: string
): Promise<TreatmentComparisonResult | null> {
  try {
    const filePath = path.join(
      process.cwd(),
      'data',
      'treatments',
      `${conditionSlug}.json`
    );

    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent) as TreatmentComparisonResult;

    return data;
  } catch (error) {
    logger.debug(`Treatment data not found for ${conditionSlug}`, { error });
    return null;
  }
}

/**
 * Get list of all conditions that have treatment data
 */
export async function getConditionSlugsWithTreatments(): Promise<string[]> {
  try {
    const indexPath = path.join(
      process.cwd(),
      'data',
      'treatments',
      'index.json'
    );

    const fileContent = await fs.readFile(indexPath, 'utf-8');
    const data = JSON.parse(fileContent) as { conditions: string[] };

    return data.conditions;
  } catch (error) {
    logger.debug('Treatment index file not found', { error });
    return [];
  }
}

/**
 * Get all aggregated treatments across all conditions
 */
export async function getTreatmentsAction(): Promise<TreatmentWithConditions[]> {
  try {
    return getAllTreatments();
  } catch (error) {
    console.error('Error fetching treatments:', error);
    throw new Error('Failed to fetch treatments');
  }
}
