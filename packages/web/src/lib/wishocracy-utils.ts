"use client"

import { BudgetCategoryId, BUDGET_CATEGORIES } from "./wishocracy-data"

// ============================================================================
// PAIR MANAGEMENT UTILITIES
// ============================================================================

/**
 * Generate all possible unique pairs from a set of categories
 * Uses combination formula C(n,2) = n×(n-1)/2
 */
export function generateAllPairsFromCategories(
  categories: Set<BudgetCategoryId> | BudgetCategoryId[]
): Array<[BudgetCategoryId, BudgetCategoryId]> {
  const categoryArray = Array.isArray(categories) ? categories : Array.from(categories)
  const pairs: Array<[BudgetCategoryId, BudgetCategoryId]> = []

  for (let i = 0; i < categoryArray.length; i++) {
    for (let j = i + 1; j < categoryArray.length; j++) {
      pairs.push([categoryArray[i], categoryArray[j]])
    }
  }

  return pairs
}

/**
 * Shuffle pairs randomly using Fisher-Yates algorithm
 */
export function shufflePairs<T>(pairs: T[]): T[] {
  const shuffled = [...pairs]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Filter pairs to exclude those involving rejected categories
 */
export function filterRejectedPairs(
  pairs: Array<[BudgetCategoryId, BudgetCategoryId]>,
  rejectedCategories: Set<BudgetCategoryId>
): Array<[BudgetCategoryId, BudgetCategoryId]> {
  return pairs.filter(
    pair => !rejectedCategories.has(pair[0]) && !rejectedCategories.has(pair[1])
  )
}

/**
 * Filter out pairs that have already been compared
 */
export function filterCompletedPairs(
  allPairs: Array<[BudgetCategoryId, BudgetCategoryId]>,
  completedComparisons: Array<{ categoryA: string; categoryB: string }>
): Array<[BudgetCategoryId, BudgetCategoryId]> {
  const completedPairKeys = new Set(
    completedComparisons.map((c) => `${c.categoryA}_${c.categoryB}`)
  )

  return allPairs.filter(
    pair =>
      !completedPairKeys.has(`${pair[0]}_${pair[1]}`) &&
      !completedPairKeys.has(`${pair[1]}_${pair[0]}`)
  )
}

/**
 * Calculate total possible unique pairs for a given number of categories
 * Formula: C(n,2) = n×(n-1)/2
 */
export function calculateTotalPairs(categoryCount: number): number {
  return (categoryCount * (categoryCount - 1)) / 2
}

/**
 * Generate random sample of pairs for user to compare
 * Returns N random pairs from all possible combinations
 * Ensures Military vs Pragmatic Clinical Trials is included
 */
export function generateRandomPairs(count: number = 25): Array<[BudgetCategoryId, BudgetCategoryId]> {
  // Generate all possible pairs from all budget categories
  const allPairs = generateAllPairsFromCategories(Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[])
  const shuffled = shufflePairs(allPairs)

  // Ensure Military vs Pragmatic Clinical Trials is in the sample
  const militaryVsTrialsPair: [BudgetCategoryId, BudgetCategoryId] = ['PRAGMATIC_CLINICAL_TRIALS', 'MILITARY_OPERATIONS']
  const filteredPairs = shuffled.filter(
    pair => !(
      (pair[0] === militaryVsTrialsPair[0] && pair[1] === militaryVsTrialsPair[1]) ||
      (pair[0] === militaryVsTrialsPair[1] && pair[1] === militaryVsTrialsPair[0])
    )
  )

  // Take count-1 random pairs and add the guaranteed military vs trials pair
  const randomSample = filteredPairs.slice(0, count - 1)
  randomSample.push(militaryVsTrialsPair)

  // Shuffle again so the guaranteed pair isn't always last
  return shufflePairs(randomSample)
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if a category ID exists in BUDGET_CATEGORIES
 */
function isCategoryValid(categoryId: string): boolean {
  return BUDGET_CATEGORIES[categoryId as BudgetCategoryId] !== undefined
}

/**
 * Validate that both categories in a pair exist in BUDGET_CATEGORIES
 */
export function isValidPair(pair: [BudgetCategoryId, BudgetCategoryId]): boolean {
  return isCategoryValid(pair[0]) && isCategoryValid(pair[1])
}

/**
 * Filter pairs to only include those with valid categories
 */
export function filterValidPairs(
  pairs: Array<[string, string]>
): Array<[BudgetCategoryId, BudgetCategoryId]> {
  return pairs.filter(pair =>
    isValidPair(pair as [BudgetCategoryId, BudgetCategoryId])
  ) as Array<[BudgetCategoryId, BudgetCategoryId]>
}

/**
 * Filter comparisons to only include valid categories
 * Generic to preserve all fields from input type
 */
export function filterValidComparisons<T extends { categoryA: string; categoryB: string }>(
  comparisons: T[],
  validCategories?: Set<BudgetCategoryId>
): T[] {
  return comparisons.filter(comp => {
    const catA = comp.categoryA as BudgetCategoryId
    const catB = comp.categoryB as BudgetCategoryId

    const exists = isCategoryValid(catA) && isCategoryValid(catB)
    const inValidSet = validCategories
      ? validCategories.has(catA) && validCategories.has(catB)
      : true

    return exists && inValidSet
  })
}
