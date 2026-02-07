/**
 * Overspend Ratio
 *
 * For each spending category, compute: actual spending / floor spending.
 * Countries spending above the floor have ratio > 1.0 (overspending).
 * Uses floor values from findMinimumEffectiveSpending().
 */

import type { MinimumEffectiveSpendingResult } from './minimum-effective-spending.js';

export interface CountrySpending {
  countryCode: string;
  countryName?: string;
  /** Per-category spending: categoryId → spending amount */
  spending: Record<string, number>;
}

export interface CountryOverspendResult {
  countryCode: string;
  countryName?: string;
  categoryId: string;
  categoryName?: string;
  actualSpending: number;
  floorSpending: number;
  overspendRatio: number;
  /** Absolute excess above the floor (negative means underspending) */
  excessSpending: number;
}

export interface CategoryOverspendSummary {
  categoryId: string;
  categoryName?: string;
  floorSpending: number;
  /** Average overspend ratio across all countries */
  avgOverspendRatio: number;
  /** Countries sorted by overspend ratio descending */
  countries: CountryOverspendResult[];
}

export interface CountryOverspendSummary {
  countryCode: string;
  countryName?: string;
  /** Average overspend ratio across available categories */
  avgOverspendRatio: number;
  /** Categories sorted by overspend ratio descending */
  categories: CountryOverspendResult[];
}

export interface OverspendRatioResult {
  byCategory: CategoryOverspendSummary[];
  byCountry: CountryOverspendSummary[];
}

function roundRatio(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function toCountryResult(
  floor: MinimumEffectiveSpendingResult,
  country: CountrySpending,
): CountryOverspendResult {
  const actual = country.spending[floor.categoryId]!;
  const ratio = actual / floor.floorSpending;
  return {
    countryCode: country.countryCode,
    countryName: country.countryName,
    categoryId: floor.categoryId,
    categoryName: floor.categoryName,
    actualSpending: actual,
    floorSpending: floor.floorSpending,
    overspendRatio: roundRatio(ratio),
    excessSpending: roundCurrency(actual - floor.floorSpending),
  };
}

function validCountrySpending(
  country: CountrySpending,
  categoryId: string,
): number | null {
  const spending = country.spending[categoryId];
  if (spending === undefined) return null;
  if (!Number.isFinite(spending) || spending <= 0) return null;
  return spending;
}

/**
 * Compute overspend ratios per country per category.
 *
 * @param floors - Output from findMinimumEffectiveSpending()
 * @param countries - Per-country spending data
 * @returns Overspend ratios by category and by country
 */
export function overspendRatio(
  floors: MinimumEffectiveSpendingResult[],
  countries: CountrySpending[],
): OverspendRatioResult {
  const validFloors = floors.filter((f) => f.floorSpending > 0);

  const byCategory = validFloors.map((floor) => {
    const countryResults: CountryOverspendResult[] = countries
      .filter((country) => validCountrySpending(country, floor.categoryId) !== null)
      .map((country) => toCountryResult(floor, country))
      .sort((a, b) => b.overspendRatio - a.overspendRatio);

    const avgRatio =
      countryResults.length > 0
        ? roundRatio(
            countryResults.reduce((sum, c) => sum + c.overspendRatio, 0) /
              countryResults.length,
          )
        : 0;

    return {
      categoryId: floor.categoryId,
      categoryName: floor.categoryName,
      floorSpending: floor.floorSpending,
      avgOverspendRatio: avgRatio,
      countries: countryResults,
    };
  });

  const byCountry = countries.map((country) => {
    const categories = validFloors
      .filter((floor) => validCountrySpending(country, floor.categoryId) !== null)
      .map((floor) => toCountryResult(floor, country))
      .sort((a, b) => b.overspendRatio - a.overspendRatio);

    const avgRatio =
      categories.length > 0
        ? roundRatio(categories.reduce((sum, c) => sum + c.overspendRatio, 0) / categories.length)
        : 0;

    return {
      countryCode: country.countryCode,
      countryName: country.countryName,
      avgOverspendRatio: avgRatio,
      categories,
    };
  });

  return { byCategory, byCountry };
}
