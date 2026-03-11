/**
 * USAspending.gov API Fetcher
 *
 * Fetches federal budget allocations by budget function from the
 * USAspending.gov Spending Explorer API. No API key required.
 *
 * Account-level data available from FY2017 Q2 onward.
 *
 * API docs: https://api.usaspending.gov/docs/endpoints
 */

import type { DataPoint, FetchOptions, SpendingData } from '../types.js';

const API_BASE = 'https://api.usaspending.gov/api/v2';

// ─── Budget Function Codes ────────────────────────────────────────────

/** All 20 federal budget function codes and titles. */
export const BUDGET_FUNCTIONS = {
  '050': 'National Defense',
  '150': 'International Affairs',
  '250': 'General Science, Space, and Technology',
  '270': 'Energy',
  '300': 'Natural Resources and Environment',
  '350': 'Agriculture',
  '370': 'Commerce and Housing Credit',
  '400': 'Transportation',
  '450': 'Community and Regional Development',
  '500': 'Education, Training, Employment, and Social Services',
  '550': 'Health',
  '570': 'Medicare',
  '600': 'Income Security',
  '650': 'Social Security',
  '700': 'Veterans Benefits and Services',
  '750': 'Administration of Justice',
  '800': 'General Government',
  '900': 'Net Interest',
  '920': 'Allowances',
  '950': 'Undistributed Offsetting Receipts',
} as const;

export type BudgetFunctionCode = keyof typeof BUDGET_FUNCTIONS;

// ─── Response Types ───────────────────────────────────────────────────

export interface SpendingExplorerResult {
  amount: number;
  id: string | null;
  type: string;
  name: string;
  code: string | null;
}

export interface SpendingExplorerResponse {
  total: number;
  end_date: string;
  results: SpendingExplorerResult[];
}

export interface BudgetFunctionItem {
  budget_function_code: string;
  budget_function_title: string;
}

export interface BudgetFunctionListResponse {
  results: BudgetFunctionItem[];
}

export interface BudgetSubfunctionItem {
  budget_subfunction_code: string;
  budget_subfunction_title: string;
}

export interface BudgetSubfunctionListResponse {
  results: BudgetSubfunctionItem[];
}

// ─── Core Fetcher ─────────────────────────────────────────────────────

/**
 * Fetch the list of budget function codes from the API.
 */
export async function fetchBudgetFunctions(): Promise<BudgetFunctionItem[]> {
  const url = `${API_BASE}/budget_functions/list_budget_functions/`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`USAspending API ${response.status}: ${response.statusText}`);
      return [];
    }
    const json = (await response.json()) as BudgetFunctionListResponse;
    return json.results;
  } catch (error) {
    console.error('USAspending budget functions fetch error:', error);
    return [];
  }
}

/**
 * Fetch subfunctions for a given budget function code.
 */
export async function fetchBudgetSubfunctions(
  budgetFunctionCode: string,
): Promise<BudgetSubfunctionItem[]> {
  const url = `${API_BASE}/budget_functions/list_budget_subfunctions/`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget_function: budgetFunctionCode }),
    });
    if (!response.ok) {
      console.warn(`USAspending API ${response.status}: ${response.statusText}`);
      return [];
    }
    const json = (await response.json()) as BudgetSubfunctionListResponse;
    return json.results;
  } catch (error) {
    console.error(`USAspending subfunctions fetch error (${budgetFunctionCode}):`, error);
    return [];
  }
}

/**
 * Fetch spending by budget function for a given fiscal year.
 *
 * Uses the Spending Explorer endpoint. Quarter 4 gives full-year totals.
 * Data available from FY2017 onward.
 */
export async function fetchSpendingByBudgetFunction(
  fiscalYear: number,
  quarter: 1 | 2 | 3 | 4 = 4,
): Promise<SpendingExplorerResponse> {
  const url = `${API_BASE}/spending/`;

  const emptyResponse: SpendingExplorerResponse = {
    total: 0,
    end_date: '',
    results: [],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'budget_function',
        filters: { fy: String(fiscalYear), quarter: String(quarter) },
      }),
    });

    if (!response.ok) {
      console.warn(`USAspending API ${response.status}: ${response.statusText}`);
      return emptyResponse;
    }

    return (await response.json()) as SpendingExplorerResponse;
  } catch (error) {
    console.error(`USAspending spending fetch error (FY${fiscalYear}):`, error);
    return emptyResponse;
  }
}

/**
 * Fetch spending by budget subfunction within a given budget function.
 */
export async function fetchSpendingBySubfunction(
  fiscalYear: number,
  budgetFunctionCode: string,
  quarter: 1 | 2 | 3 | 4 = 4,
): Promise<SpendingExplorerResponse> {
  const url = `${API_BASE}/spending/`;

  const emptyResponse: SpendingExplorerResponse = {
    total: 0,
    end_date: '',
    results: [],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'budget_subfunction',
        filters: {
          fy: String(fiscalYear),
          quarter: String(quarter),
          budget_function: budgetFunctionCode,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`USAspending API ${response.status}: ${response.statusText}`);
      return emptyResponse;
    }

    return (await response.json()) as SpendingExplorerResponse;
  } catch (error) {
    console.error(
      `USAspending subfunction spending fetch error (FY${fiscalYear}, ${budgetFunctionCode}):`,
      error,
    );
    return emptyResponse;
  }
}

// ─── Parsers ──────────────────────────────────────────────────────────

/**
 * Parse spending explorer results into SpendingData[].
 *
 * Amounts from the API are in actual dollars; we convert to billions
 * to match the convention in us-federal-budget.ts.
 */
export function parseSpendingResults(
  results: SpendingExplorerResult[],
  fiscalYear: number,
): SpendingData[] {
  return results
    .filter((r) => r.code !== null && r.name !== 'Unreported Data')
    .map((r) => ({
      jurisdictionIso3: 'USA',
      year: fiscalYear,
      category: r.name,
      amountUsd: r.amount,
      source: 'USAspending.gov',
    }));
}

/**
 * Parse spending explorer results into DataPoint[] (one per budget function).
 *
 * Each DataPoint value is the spending amount in dollars.
 */
export function parseSpendingAsDataPoints(
  results: SpendingExplorerResult[],
  fiscalYear: number,
): DataPoint[] {
  return results
    .filter((r) => r.code !== null && r.name !== 'Unreported Data')
    .map((r) => ({
      jurisdictionIso3: 'USA',
      year: fiscalYear,
      value: r.amount,
      unit: 'USD',
      source: `USAspending.gov (${r.name})`,
      sourceUrl: 'https://www.usaspending.gov/explorer/budget_function',
    }));
}

// ─── Convenience helpers ──────────────────────────────────────────────

/**
 * Fetch all budget function spending for a range of fiscal years.
 *
 * Returns SpendingData[] across all years (FY2017+ only).
 */
export async function fetchFederalBudgetByFunction(
  options: FetchOptions = {},
): Promise<SpendingData[]> {
  const { period = { startYear: 2017, endYear: 2024 } } = options;
  const startYear = Math.max(period.startYear, 2017); // API floor

  const allData: SpendingData[] = [];

  for (let fy = startYear; fy <= period.endYear; fy++) {
    const response = await fetchSpendingByBudgetFunction(fy);
    allData.push(...parseSpendingResults(response.results, fy));
  }

  return allData;
}

/**
 * Fetch spending for a single budget function as a DataPoint time series.
 *
 * Useful for feeding into the optimizer as a predictor or outcome.
 */
export async function fetchBudgetFunctionTimeSeries(
  budgetFunctionCode: BudgetFunctionCode,
  options: FetchOptions = {},
): Promise<DataPoint[]> {
  const { period = { startYear: 2017, endYear: 2024 } } = options;
  const startYear = Math.max(period.startYear, 2017);
  const functionName = BUDGET_FUNCTIONS[budgetFunctionCode];

  const points: DataPoint[] = [];

  for (let fy = startYear; fy <= period.endYear; fy++) {
    const response = await fetchSpendingByBudgetFunction(fy);
    const match = response.results.find((r) => r.code === budgetFunctionCode);
    if (match) {
      points.push({
        jurisdictionIso3: 'USA',
        year: fy,
        value: match.amount,
        unit: 'USD',
        source: `USAspending.gov (${functionName})`,
        sourceUrl: 'https://www.usaspending.gov/explorer/budget_function',
      });
    }
  }

  return points;
}

/**
 * Fetch the latest fiscal year's spending breakdown by budget function.
 *
 * Returns a map of budget function name → amount in dollars.
 */
export async function fetchLatestBudgetBreakdown(
  fiscalYear = 2024,
): Promise<Map<string, number>> {
  const response = await fetchSpendingByBudgetFunction(fiscalYear);
  const breakdown = new Map<string, number>();

  for (const result of response.results) {
    if (result.code !== null && result.name !== 'Unreported Data') {
      breakdown.set(result.name, result.amount);
    }
  }

  return breakdown;
}
