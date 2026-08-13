"use server"

import {
  getAllTreatments,
  getConditionSlugsWithTreatments as getConditionSlugsFromDataset,
  getTreatmentsByConditionSlug as getTreatmentsFromDataset,
  type ConditionTreatmentsFile,
  type TreatmentWithConditions,
} from "@optimitron/data/datasets/medical"
import { createLogger } from "@/lib/logger"

const logger = createLogger("treatments-actions")

/**
 * Load treatment data for a specific condition by slug.
 * Returns null if no treatment data exists for that condition.
 */
export async function getTreatmentsByConditionSlug(
  conditionSlug: string,
): Promise<ConditionTreatmentsFile | null> {
  try {
    return await getTreatmentsFromDataset(conditionSlug)
  } catch (error) {
    logger.debug(`Treatment data not found for ${conditionSlug}`, { error })
    return null
  }
}

/**
 * Get list of all conditions that have treatment data
 */
export async function getConditionSlugsWithTreatments(): Promise<string[]> {
  return getConditionSlugsFromDataset()
}

/**
 * Get all aggregated treatments across all conditions
 */
export async function getTreatmentsAction(): Promise<TreatmentWithConditions[]> {
  try {
    return getAllTreatments()
  } catch (error) {
    logger.error("Error fetching treatments", { error })
    throw new Error("Failed to fetch treatments")
  }
}
