/**
 * US Federal Budget Optimization Analysis
 *
 * Loads real FY2025 budget data, runs OBG diminishing-returns modelling
 * for each spending category using cross-country historical data,
 * calculates optimal allocation & gap analysis, computes Welfare Evidence
 * Scores, and outputs both a markdown report and a website-ready JSON file.
 *
 * @see https://obg.warondisease.org
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  fitLogModel,
  fitSaturationModel,
  findOSL,
  marginalReturn,
  predictOutcome,
  type SpendingOutcomePoint,
  type DiminishingReturnsModel,
} from '@optomitron/obg';

import {
  calculateWES,
  calculatePriorityScore,
  scoreToGrade,
  type EffectEstimate as WESEffectEstimate,
} from '@optomitron/obg';

import {
  generateBudgetReport,
  type BudgetOptimizationResult,
  type CategoryAnalysis,
} from '@optomitron/obg';

import {
  runCountryAnalysis,
  type AnnualTimeSeries,
  type AggregateAnalysis,
} from '@optomitron/obg';

import type {
  SpendingCategory,
  SpendingGap,
  OSLEstimate,
} from '@optomitron/obg';

import type { EvidenceGrade } from '@optomitron/opg';

import {
  oecdBudgetPanelToSpendingOutcome,
  OECD_BUDGET_PANEL,
  type OECDBudgetPanelDataPoint,
  US_BUDGET_CATEGORIES,
  US_OUTCOME_DATA,
  type USBudgetCategoryDataPoint,
  type USOutcomeDataPoint,
} from '@optomitron/data';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../output');

const FISCAL_YEAR = 2025;
const TOTAL_BUDGET_USD = 6_750_000_000_000; // $6.75 T
const US_POPULATION = 336_000_000;
const US_GDP = 29_000_000_000_000; // ~$29 T
const OPPORTUNITY_COST = 0.03; // 3 %

// ---------------------------------------------------------------------------
// Real FY2025 US Federal Budget Data (CBO / OMB estimates)
// Amounts in USD billions → converted to raw USD below
// ---------------------------------------------------------------------------

interface CategorySeed {
  id: string;
  name: string;
  spendingBillions: number;
  spendingType: 'program' | 'transfer' | 'investment' | 'regulatory';
  /** Whether this is discretionary spending (can be reallocated). Default true. */
  discretionary?: boolean;
  /** Cross-country spending→outcome data points for diminishing-returns */
  historicalData: SpendingOutcomePoint[];
  /** Evidence estimates for WES calculation */
  effectEstimates: WESEffectEstimate[];
  /** Outcome metrics for website JSON */
  outcomeMetrics: { name: string; value: number; trend: string }[];
}

/**
 * Cross-country spending→outcome data for each category.
 * Spending is per-capita USD (approximately real from OECD/World Bank).
 *
 * WARNING: Outcome scores (0-100 indices) are ESTIMATED — they are not
 * sourced from any published dataset. They were hand-constructed to
 * approximate expected relationships. Categories with OECD mappings
 * (see OECD_DATA_MAPPINGS) replace this data with real observations.
 */
const CATEGORIES: CategorySeed[] = [
  {
    id: 'social_security',
    name: 'Social Security',
    spendingBillions: 1_418,
    spendingType: 'transfer',
    discretionary: false,
    historicalData: [
      { spending: 2_800, outcome: 62, jurisdiction: 'US', year: 2020 },
      { spending: 3_200, outcome: 65, jurisdiction: 'US', year: 2022 },
      { spending: 3_600, outcome: 67, jurisdiction: 'US', year: 2024 },
      { spending: 4_200, outcome: 68, jurisdiction: 'US', year: 2025 },
      { spending: 2_500, outcome: 58, jurisdiction: 'UK', year: 2023 },
      { spending: 3_800, outcome: 72, jurisdiction: 'DE', year: 2023 },
      { spending: 4_500, outcome: 75, jurisdiction: 'FR', year: 2023 },
      { spending: 1_800, outcome: 50, jurisdiction: 'JP', year: 2023 },
      { spending: 5_200, outcome: 78, jurisdiction: 'DK', year: 2023 },
      { spending: 4_800, outcome: 76, jurisdiction: 'SE', year: 2023 },
    ],
    effectEstimates: [
      { beta: 0.35, standardError: 0.08, method: 'difference_in_differences', year: 2021 },
      { beta: 0.30, standardError: 0.10, method: 'event_study', year: 2019 },
      { beta: 0.28, standardError: 0.12, method: 'before_after', year: 2017 },
    ],
    outcomeMetrics: [
      { name: 'Elderly Poverty Rate', value: 10.2, trend: 'decreasing' },
      { name: 'Retirement Security Index', value: 67, trend: 'stable' },
    ],
  },
  {
    id: 'medicare',
    name: 'Medicare',
    spendingBillions: 874,
    spendingType: 'program',
    discretionary: false,
    historicalData: [
      { spending: 2_000, outcome: 70, jurisdiction: 'US', year: 2020 },
      { spending: 2_200, outcome: 71, jurisdiction: 'US', year: 2022 },
      { spending: 2_500, outcome: 72, jurisdiction: 'US', year: 2024 },
      { spending: 2_600, outcome: 72.5, jurisdiction: 'US', year: 2025 },
      { spending: 3_500, outcome: 82, jurisdiction: 'DE', year: 2023 },
      { spending: 3_800, outcome: 85, jurisdiction: 'FR', year: 2023 },
      { spending: 4_200, outcome: 83, jurisdiction: 'SE', year: 2023 },
      { spending: 2_800, outcome: 81, jurisdiction: 'JP', year: 2023 },
      { spending: 1_500, outcome: 65, jurisdiction: 'KR', year: 2023 },
      { spending: 3_200, outcome: 80, jurisdiction: 'AU', year: 2023 },
    ],
    effectEstimates: [
      { beta: 0.42, standardError: 0.06, method: 'regression_discontinuity', year: 2022 },
      { beta: 0.38, standardError: 0.09, method: 'difference_in_differences', year: 2020 },
    ],
    outcomeMetrics: [
      { name: 'Life Expectancy at 65', value: 19.4, trend: 'stable' },
      { name: 'Uninsured Rate (65+)', value: 1.0, trend: 'stable' },
      { name: 'Preventable Hospitalizations per 1000', value: 48, trend: 'decreasing' },
    ],
  },
  {
    id: 'medicaid',
    name: 'Medicaid & CHIP',
    spendingBillions: 575,
    spendingType: 'program',
    discretionary: false,
    historicalData: [
      { spending: 1_200, outcome: 55, jurisdiction: 'US', year: 2020 },
      { spending: 1_400, outcome: 58, jurisdiction: 'US', year: 2022 },
      { spending: 1_600, outcome: 60, jurisdiction: 'US', year: 2024 },
      { spending: 1_710, outcome: 61, jurisdiction: 'US', year: 2025 },
      { spending: 2_500, outcome: 78, jurisdiction: 'UK', year: 2023 },
      { spending: 3_000, outcome: 82, jurisdiction: 'CA', year: 2023 },
      { spending: 2_200, outcome: 75, jurisdiction: 'AU', year: 2023 },
      { spending: 800, outcome: 45, jurisdiction: 'MX', year: 2023 },
      { spending: 3_200, outcome: 85, jurisdiction: 'NO', year: 2023 },
    ],
    effectEstimates: [
      { beta: 0.50, standardError: 0.07, method: 'regression_discontinuity', year: 2023 },
      { beta: 0.45, standardError: 0.10, method: 'difference_in_differences', year: 2021 },
      { beta: 0.40, standardError: 0.15, method: 'before_after', year: 2018 },
    ],
    outcomeMetrics: [
      { name: 'Uninsured Rate (Low-Income)', value: 12.5, trend: 'decreasing' },
      { name: 'Infant Mortality Rate', value: 5.4, trend: 'decreasing' },
      { name: 'Child Health Coverage Rate', value: 95.2, trend: 'increasing' },
    ],
  },
  {
    id: 'military',
    name: 'Military',
    spendingBillions: 886,
    spendingType: 'program',
    // Per-capita spending. US spends ~$2,637/cap — far above peers.
    // ESTIMATED outcome scores — replaced at runtime by OECD life expectancy data.
    historicalData: [
      { spending: 2_200, outcome: 85, jurisdiction: 'US', year: 2020 },
      { spending: 2_400, outcome: 86, jurisdiction: 'US', year: 2022 },
      { spending: 2_550, outcome: 86.5, jurisdiction: 'US', year: 2024 },
      { spending: 2_640, outcome: 87, jurisdiction: 'US', year: 2025 },
      { spending: 900, outcome: 80, jurisdiction: 'UK', year: 2023 },
      { spending: 800, outcome: 78, jurisdiction: 'FR', year: 2023 },
      { spending: 650, outcome: 75, jurisdiction: 'DE', year: 2023 },
      { spending: 400, outcome: 72, jurisdiction: 'JP', year: 2023 },
      { spending: 600, outcome: 73, jurisdiction: 'KR', year: 2023 },
      { spending: 1_500, outcome: 82, jurisdiction: 'AU', year: 2023 },
    ],
    effectEstimates: [
      { beta: 0.12, standardError: 0.15, method: 'cross_sectional', year: 2022 },
      { beta: 0.10, standardError: 0.20, method: 'before_after', year: 2019 },
    ],
    outcomeMetrics: [
      { name: 'Global Firepower Index Rank', value: 1, trend: 'stable' },
      { name: 'Military Readiness Score', value: 87, trend: 'stable' },
    ],
  },
  {
    id: 'net_interest',
    name: 'Net Interest on Debt',
    spendingBillions: 881,
    spendingType: 'transfer',
    discretionary: false,
    // Non-discretionary: analysis is skipped entirely for this category.
    // No historical data needed — the model doesn't run on debt interest.
    historicalData: [],
    effectEstimates: [
      { beta: -0.20, standardError: 0.05, method: 'event_study', year: 2023 },
    ],
    outcomeMetrics: [
      { name: 'Debt-to-GDP Ratio', value: 124, trend: 'increasing' },
      { name: 'Sovereign Credit Rating (S&P)', value: 85, trend: 'stable' },
    ],
  },
  {
    id: 'income_security',
    name: 'Income Security (SNAP, Housing)',
    spendingBillions: 304,
    spendingType: 'transfer',
    historicalData: [
      { spending: 600, outcome: 52, jurisdiction: 'US', year: 2020 },
      { spending: 750, outcome: 56, jurisdiction: 'US', year: 2022 },
      { spending: 850, outcome: 58, jurisdiction: 'US', year: 2024 },
      { spending: 905, outcome: 59, jurisdiction: 'US', year: 2025 },
      { spending: 1_800, outcome: 78, jurisdiction: 'DK', year: 2023 },
      { spending: 1_500, outcome: 74, jurisdiction: 'SE', year: 2023 },
      { spending: 1_200, outcome: 70, jurisdiction: 'DE', year: 2023 },
      { spending: 400, outcome: 45, jurisdiction: 'MX', year: 2023 },
      { spending: 900, outcome: 62, jurisdiction: 'UK', year: 2023 },
    ],
    effectEstimates: [
      { beta: 0.55, standardError: 0.08, method: 'rct', year: 2022 },
      { beta: 0.48, standardError: 0.10, method: 'difference_in_differences', year: 2020 },
      { beta: 0.42, standardError: 0.12, method: 'event_study', year: 2018 },
    ],
    outcomeMetrics: [
      { name: 'Food Insecurity Rate', value: 12.8, trend: 'decreasing' },
      { name: 'Poverty Rate', value: 11.5, trend: 'stable' },
      { name: 'Homelessness per 10K', value: 18, trend: 'increasing' },
    ],
  },
  {
    id: 'veterans',
    name: 'Veterans Benefits',
    spendingBillions: 270,
    spendingType: 'program',
    discretionary: false,
    // Non-discretionary: legally mandated entitlements. Analysis skipped.
    historicalData: [],
    effectEstimates: [
      { beta: 0.30, standardError: 0.10, method: 'before_after', year: 2021 },
      { beta: 0.35, standardError: 0.12, method: 'event_study', year: 2019 },
    ],
    outcomeMetrics: [
      { name: 'Veteran Unemployment Rate', value: 3.5, trend: 'decreasing' },
      { name: 'VA Healthcare Satisfaction', value: 67, trend: 'increasing' },
    ],
  },
  {
    id: 'education',
    name: 'Education',
    spendingBillions: 238,
    spendingType: 'investment',
    // ESTIMATED outcome scores — no OECD mapping; hand-constructed estimates
    historicalData: [
      { spending: 1_800, outcome: 60, jurisdiction: 'US', year: 2020 },
      { spending: 1_900, outcome: 61, jurisdiction: 'US', year: 2022 },
      { spending: 2_000, outcome: 62, jurisdiction: 'US', year: 2024 },
      { spending: 2_100, outcome: 62.5, jurisdiction: 'US', year: 2025 },
      { spending: 3_500, outcome: 82, jurisdiction: 'FI', year: 2023 },
      { spending: 3_200, outcome: 78, jurisdiction: 'SE', year: 2023 },
      { spending: 3_000, outcome: 76, jurisdiction: 'DE', year: 2023 },
      { spending: 2_800, outcome: 75, jurisdiction: 'CA', year: 2023 },
      { spending: 2_500, outcome: 72, jurisdiction: 'UK', year: 2023 },
      { spending: 1_500, outcome: 55, jurisdiction: 'MX', year: 2023 },
    ],
    effectEstimates: [
      { beta: 0.60, standardError: 0.08, method: 'rct', year: 2023 },
      { beta: 0.52, standardError: 0.10, method: 'regression_discontinuity', year: 2021 },
      { beta: 0.48, standardError: 0.12, method: 'difference_in_differences', year: 2019 },
    ],
    outcomeMetrics: [
      { name: 'PISA Average Score', value: 489, trend: 'decreasing' },
      { name: 'College Completion Rate', value: 62.2, trend: 'increasing' },
      { name: 'Student Debt per Graduate ($K)', value: 37.6, trend: 'increasing' },
    ],
  },
  {
    id: 'transportation',
    name: 'Transportation & Infrastructure',
    spendingBillions: 168,
    spendingType: 'investment',
    // ESTIMATED outcome scores — no OECD mapping; hand-constructed estimates
    historicalData: [
      { spending: 800, outcome: 55, jurisdiction: 'US', year: 2020 },
      { spending: 900, outcome: 57, jurisdiction: 'US', year: 2022 },
      { spending: 1_000, outcome: 58, jurisdiction: 'US', year: 2024 },
      { spending: 1_050, outcome: 58.5, jurisdiction: 'US', year: 2025 },
      { spending: 2_000, outcome: 82, jurisdiction: 'CH', year: 2023 },
      { spending: 1_800, outcome: 78, jurisdiction: 'DE', year: 2023 },
      { spending: 1_500, outcome: 75, jurisdiction: 'JP', year: 2023 },
      { spending: 1_200, outcome: 68, jurisdiction: 'UK', year: 2023 },
      { spending: 600, outcome: 48, jurisdiction: 'MX', year: 2023 },
    ],
    effectEstimates: [
      { beta: 0.45, standardError: 0.10, method: 'difference_in_differences', year: 2022 },
      { beta: 0.40, standardError: 0.12, method: 'synthetic_control', year: 2020 },
    ],
    outcomeMetrics: [
      { name: 'Infrastructure Quality Index', value: 58.5, trend: 'stable' },
      { name: 'Bridge Deficiency Rate', value: 7.5, trend: 'decreasing' },
      { name: 'Commute Time (minutes)', value: 27.6, trend: 'increasing' },
    ],
  },
  {
    id: 'health_research',
    name: 'Health Research (NIH, CDC)',
    spendingBillions: 102,
    spendingType: 'investment',
    // Per-capita spending. US ~$304/cap. ESTIMATED outcome scores —
    // replaced at runtime by OECD life expectancy data.
    historicalData: [
      { spending: 250, outcome: 72, jurisdiction: 'US', year: 2020 },
      { spending: 275, outcome: 74, jurisdiction: 'US', year: 2022 },
      { spending: 290, outcome: 75, jurisdiction: 'US', year: 2024 },
      { spending: 304, outcome: 76, jurisdiction: 'US', year: 2025 },
      { spending: 180, outcome: 68, jurisdiction: 'UK', year: 2023 },
      { spending: 160, outcome: 65, jurisdiction: 'DE', year: 2023 },
      { spending: 140, outcome: 62, jurisdiction: 'FR', year: 2023 },
      { spending: 120, outcome: 58, jurisdiction: 'CA', year: 2023 },
      { spending: 500, outcome: 85, jurisdiction: 'CH', year: 2023 },
      { spending: 600, outcome: 88, jurisdiction: 'IS', year: 2023 },
    ],
    effectEstimates: [
      { beta: 0.70, standardError: 0.06, method: 'rct', year: 2023 },
      { beta: 0.65, standardError: 0.08, method: 'regression_discontinuity', year: 2022 },
      { beta: 0.60, standardError: 0.10, method: 'difference_in_differences', year: 2020 },
      { beta: 0.55, standardError: 0.12, method: 'event_study', year: 2018 },
    ],
    outcomeMetrics: [
      { name: 'NIH-Funded Publications', value: 85_000, trend: 'increasing' },
      { name: 'Drug Approvals (FDA)', value: 55, trend: 'increasing' },
      { name: 'Life Expectancy', value: 77.5, trend: 'stable' },
    ],
  },
  {
    id: 'science_space',
    name: 'Science & Space (NASA, NSF)',
    spendingBillions: 81,
    spendingType: 'investment',
    // Per-capita spending. US ~$241/cap. ESTIMATED outcome scores —
    // replaced at runtime by OECD GDP data.
    historicalData: [
      { spending: 200, outcome: 70, jurisdiction: 'US', year: 2020 },
      { spending: 215, outcome: 72, jurisdiction: 'US', year: 2022 },
      { spending: 230, outcome: 73, jurisdiction: 'US', year: 2024 },
      { spending: 241, outcome: 74, jurisdiction: 'US', year: 2025 },
      { spending: 160, outcome: 67, jurisdiction: 'EU', year: 2023 },
      { spending: 120, outcome: 62, jurisdiction: 'JP', year: 2023 },
      { spending: 80, outcome: 55, jurisdiction: 'CA', year: 2023 },
      { spending: 400, outcome: 82, jurisdiction: 'CH', year: 2023 },
      { spending: 450, outcome: 84, jurisdiction: 'IS', year: 2023 },
      { spending: 350, outcome: 78, jurisdiction: 'KR', year: 2023 },
    ],
    effectEstimates: [
      { beta: 0.55, standardError: 0.09, method: 'event_study', year: 2022 },
      { beta: 0.50, standardError: 0.12, method: 'before_after', year: 2020 },
    ],
    outcomeMetrics: [
      { name: 'Patent Applications', value: 350_000, trend: 'increasing' },
      { name: 'STEM Graduates per 100K', value: 28, trend: 'increasing' },
    ],
  },
  {
    id: 'environment',
    name: 'Environment & EPA',
    spendingBillions: 68,
    spendingType: 'regulatory',
    // ESTIMATED outcome scores — no OECD mapping; hand-constructed estimates
    historicalData: [
      { spending: 120, outcome: 60, jurisdiction: 'US', year: 2020 },
      { spending: 130, outcome: 62, jurisdiction: 'US', year: 2022 },
      { spending: 140, outcome: 63, jurisdiction: 'US', year: 2024 },
      { spending: 150, outcome: 63.5, jurisdiction: 'US', year: 2025 },
      { spending: 300, outcome: 82, jurisdiction: 'SE', year: 2023 },
      { spending: 280, outcome: 80, jurisdiction: 'DK', year: 2023 },
      { spending: 250, outcome: 78, jurisdiction: 'DE', year: 2023 },
      { spending: 200, outcome: 72, jurisdiction: 'UK', year: 2023 },
      { spending: 80, outcome: 52, jurisdiction: 'MX', year: 2023 },
    ],
    effectEstimates: [
      { beta: 0.48, standardError: 0.10, method: 'difference_in_differences', year: 2022 },
      { beta: 0.42, standardError: 0.12, method: 'interrupted_time_series', year: 2020 },
    ],
    outcomeMetrics: [
      { name: 'Air Quality Index (avg)', value: 63.5, trend: 'improving' },
      { name: 'CO2 Emissions (Mt)', value: 4_900, trend: 'decreasing' },
      { name: 'Clean Water Access %', value: 99.2, trend: 'stable' },
    ],
  },
  {
    id: 'agriculture',
    name: 'Agriculture & Food Safety',
    spendingBillions: 38,
    spendingType: 'program',
    // ESTIMATED outcome scores — no OECD mapping; hand-constructed estimates
    historicalData: [
      { spending: 200, outcome: 72, jurisdiction: 'US', year: 2020 },
      { spending: 210, outcome: 73, jurisdiction: 'US', year: 2022 },
      { spending: 215, outcome: 73.5, jurisdiction: 'US', year: 2024 },
      { spending: 220, outcome: 74, jurisdiction: 'US', year: 2025 },
      { spending: 300, outcome: 78, jurisdiction: 'FR', year: 2023 },
      { spending: 250, outcome: 76, jurisdiction: 'DE', year: 2023 },
      { spending: 150, outcome: 65, jurisdiction: 'UK', year: 2023 },
      { spending: 100, outcome: 55, jurisdiction: 'MX', year: 2023 },
    ],
    effectEstimates: [
      { beta: 0.25, standardError: 0.15, method: 'before_after', year: 2020 },
    ],
    outcomeMetrics: [
      { name: 'Food Safety Violations per 1000', value: 3.2, trend: 'decreasing' },
      { name: 'Farm Income Stability Index', value: 74, trend: 'stable' },
    ],
  },
  {
    id: 'justice',
    name: 'Justice & Law Enforcement',
    spendingBillions: 68,
    spendingType: 'program',
    // ESTIMATED outcome scores — no OECD mapping; hand-constructed estimates
    historicalData: [
      { spending: 300, outcome: 55, jurisdiction: 'US', year: 2020 },
      { spending: 320, outcome: 56, jurisdiction: 'US', year: 2022 },
      { spending: 330, outcome: 56.5, jurisdiction: 'US', year: 2024 },
      { spending: 340, outcome: 57, jurisdiction: 'US', year: 2025 },
      { spending: 400, outcome: 72, jurisdiction: 'UK', year: 2023 },
      { spending: 350, outcome: 68, jurisdiction: 'DE', year: 2023 },
      { spending: 450, outcome: 75, jurisdiction: 'NO', year: 2023 },
      { spending: 250, outcome: 50, jurisdiction: 'MX', year: 2023 },
    ],
    effectEstimates: [
      { beta: 0.18, standardError: 0.15, method: 'cross_sectional', year: 2022 },
    ],
    outcomeMetrics: [
      { name: 'Violent Crime Rate per 100K', value: 380, trend: 'decreasing' },
      { name: 'Incarceration Rate per 100K', value: 531, trend: 'decreasing' },
    ],
  },
  {
    id: 'foreign_aid',
    name: 'International Affairs & Aid',
    spendingBillions: 68,
    spendingType: 'program',
    // ESTIMATED outcome scores — no OECD mapping; hand-constructed estimates
    historicalData: [
      { spending: 150, outcome: 52, jurisdiction: 'US', year: 2020 },
      { spending: 160, outcome: 53, jurisdiction: 'US', year: 2022 },
      { spending: 170, outcome: 54, jurisdiction: 'US', year: 2024 },
      { spending: 175, outcome: 54.5, jurisdiction: 'US', year: 2025 },
      { spending: 500, outcome: 78, jurisdiction: 'SE', year: 2023 },
      { spending: 400, outcome: 75, jurisdiction: 'NO', year: 2023 },
      { spending: 350, outcome: 72, jurisdiction: 'DK', year: 2023 },
      { spending: 300, outcome: 68, jurisdiction: 'UK', year: 2023 },
      { spending: 250, outcome: 65, jurisdiction: 'DE', year: 2023 },
    ],
    effectEstimates: [
      { beta: 0.35, standardError: 0.12, method: 'difference_in_differences', year: 2021 },
      { beta: 0.30, standardError: 0.15, method: 'before_after', year: 2018 },
    ],
    outcomeMetrics: [
      { name: 'Aid as % of GNI', value: 0.17, trend: 'decreasing' },
      { name: 'Global Influence Index', value: 54.5, trend: 'stable' },
    ],
  },
  {
    id: 'energy',
    name: 'Energy Programs',
    spendingBillions: 54,
    spendingType: 'investment',
    // ESTIMATED outcome scores — no OECD mapping; hand-constructed estimates
    historicalData: [
      { spending: 80, outcome: 50, jurisdiction: 'US', year: 2020 },
      { spending: 100, outcome: 54, jurisdiction: 'US', year: 2022 },
      { spending: 120, outcome: 57, jurisdiction: 'US', year: 2024 },
      { spending: 130, outcome: 58, jurisdiction: 'US', year: 2025 },
      { spending: 300, outcome: 80, jurisdiction: 'DE', year: 2023 },
      { spending: 350, outcome: 82, jurisdiction: 'DK', year: 2023 },
      { spending: 250, outcome: 75, jurisdiction: 'SE', year: 2023 },
      { spending: 200, outcome: 70, jurisdiction: 'UK', year: 2023 },
    ],
    effectEstimates: [
      { beta: 0.50, standardError: 0.10, method: 'synthetic_control', year: 2023 },
      { beta: 0.45, standardError: 0.12, method: 'difference_in_differences', year: 2021 },
    ],
    outcomeMetrics: [
      { name: 'Renewable Energy Share %', value: 21, trend: 'increasing' },
      { name: 'Energy Independence Index', value: 58, trend: 'increasing' },
    ],
  },
  {
    id: 'housing',
    name: 'Community & Regional Development',
    spendingBillions: 41,
    spendingType: 'investment',
    // ESTIMATED outcome scores — no OECD mapping; hand-constructed estimates
    historicalData: [
      { spending: 80, outcome: 48, jurisdiction: 'US', year: 2020 },
      { spending: 90, outcome: 50, jurisdiction: 'US', year: 2022 },
      { spending: 100, outcome: 51, jurisdiction: 'US', year: 2024 },
      { spending: 110, outcome: 52, jurisdiction: 'US', year: 2025 },
      { spending: 400, outcome: 80, jurisdiction: 'SE', year: 2023 },
      { spending: 350, outcome: 78, jurisdiction: 'FI', year: 2023 },
      { spending: 300, outcome: 74, jurisdiction: 'NL', year: 2023 },
      { spending: 200, outcome: 65, jurisdiction: 'UK', year: 2023 },
    ],
    effectEstimates: [
      { beta: 0.45, standardError: 0.10, method: 'difference_in_differences', year: 2022 },
      { beta: 0.40, standardError: 0.12, method: 'event_study', year: 2020 },
    ],
    outcomeMetrics: [
      { name: 'Housing Affordability Index', value: 52, trend: 'decreasing' },
      { name: 'Community Development Score', value: 55, trend: 'stable' },
    ],
  },
  {
    id: 'immigration_enforcement',
    name: 'Immigration & Customs Enforcement',
    spendingBillions: 9,
    spendingType: 'program',
    // Per-capita spending. Most OECD peers spend far less on enforcement.
    // Weak or zero relationship to median welfare outcomes.
    historicalData: [
      { spending: 25, outcome: 77, jurisdiction: 'US', year: 2020 },
      { spending: 26, outcome: 77, jurisdiction: 'US', year: 2022 },
      { spending: 27, outcome: 77.5, jurisdiction: 'US', year: 2024 },
      { spending: 27, outcome: 77.5, jurisdiction: 'US', year: 2025 },
      { spending: 8, outcome: 82, jurisdiction: 'DE', year: 2023 },
      { spending: 6, outcome: 83, jurisdiction: 'SE', year: 2023 },
      { spending: 10, outcome: 81, jurisdiction: 'UK', year: 2023 },
      { spending: 5, outcome: 84, jurisdiction: 'NO', year: 2023 },
      { spending: 12, outcome: 80, jurisdiction: 'AU', year: 2023 },
    ],
    effectEstimates: [
      { beta: 0.05, standardError: 0.20, method: 'cross_sectional', year: 2022 },
    ],
    outcomeMetrics: [
      { name: 'Deportations per Year', value: 170_000, trend: 'increasing' },
      { name: 'Border Encounters per Year', value: 2_000_000, trend: 'increasing' },
    ],
  },
  {
    id: 'farm_subsidies',
    name: 'Farm Subsidies',
    spendingBillions: 30,
    spendingType: 'transfer',
    // Cross-country data. Evidence suggests farm subsidies raise food prices
    // for consumers and primarily benefit large landowners.
    historicalData: [
      { spending: 80, outcome: 77, jurisdiction: 'US', year: 2020 },
      { spending: 85, outcome: 77, jurisdiction: 'US', year: 2022 },
      { spending: 88, outcome: 77.5, jurisdiction: 'US', year: 2024 },
      { spending: 89, outcome: 77.5, jurisdiction: 'US', year: 2025 },
      { spending: 120, outcome: 82, jurisdiction: 'FR', year: 2023 },
      { spending: 100, outcome: 81, jurisdiction: 'DE', year: 2023 },
      { spending: 60, outcome: 83, jurisdiction: 'NZ', year: 2023 },
      { spending: 40, outcome: 84, jurisdiction: 'AU', year: 2023 },
      { spending: 70, outcome: 80, jurisdiction: 'UK', year: 2023 },
    ],
    effectEstimates: [
      { beta: -0.05, standardError: 0.18, method: 'cross_sectional', year: 2021 },
    ],
    outcomeMetrics: [
      { name: 'Farm Income Index', value: 74, trend: 'stable' },
      { name: 'Food Price Index', value: 108, trend: 'increasing' },
      { name: 'Subsidy per Capita', value: 89, trend: 'stable' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Analysis pipeline
// ---------------------------------------------------------------------------

function runCategoryAnalysis(seed: CategorySeed): CategoryAnalysis {
  const currentSpendingUsd = seed.spendingBillions * 1_000_000_000;
  const currentPerCapita = currentSpendingUsd / US_POPULATION;

  // 1. Build SpendingCategory
  const category: SpendingCategory = {
    id: seed.id,
    name: seed.name,
    spendingType: seed.spendingType,
    currentSpendingUsd,
    fiscalYear: FISCAL_YEAR,
    dataSource: 'CBO/OMB FY2025 estimates',
    discretionary: seed.discretionary ?? true,
  };

  // Non-discretionary categories (e.g. Net Interest on Debt) cannot be
  // reallocated by Congress. Skip the diminishing-returns model entirely —
  // it produces nonsensical results for obligations that aren't investments.
  if (seed.discretionary === false) {
    const wesResult = calculateWES(seed.effectEstimates);
    const oslEstimate: OSLEstimate = {
      categoryId: seed.id,
      estimationMethod: 'diminishing_returns',
      oslUsd: currentSpendingUsd,
      oslPerCapita: currentPerCapita,
      oslPctGdp: (currentSpendingUsd / US_GDP) * 100,
      evidenceGrade: wesResult.grade,
      welfareEvidenceScore: wesResult.score,
      methodologyNotes: 'Non-discretionary — excluded from optimization',
    };
    const gap: SpendingGap = {
      categoryId: seed.id,
      categoryName: seed.name,
      currentSpendingUsd,
      oslUsd: currentSpendingUsd,
      gapUsd: 0,
      gapPct: 0,
      welfareEvidenceScore: wesResult.score,
      priorityScore: 0,
      welfareEffect: { incomeEffect: 0, healthEffect: 0 },
      recommendedAction: 'maintain',
    };
    return {
      category,
      oslEstimate,
      gap,
      diminishingReturnsModel: { type: 'log', alpha: 0, beta: 0, r2: 0, n: 0 },
      marginalReturn: 0,
      wesResult,
    };
  }

  // 2. Fit diminishing-returns model (both types, pick best)
  //    Historical data is per-capita, so OSL result is per-capita too
  const logModel = fitLogModel(seed.historicalData);
  const satModel = fitSaturationModel(seed.historicalData);
  const drModel: DiminishingReturnsModel =
    logModel.r2 >= satModel.r2 ? logModel : satModel;

  // 3. Find OSL (per-capita) then scale to absolute USD
  //    We use a two-step approach:
  //    a) Fit the diminishing-returns model to get the marginal return curve
  //    b) Find the OSL where marginal return equals the average marginal return
  //       across the dataset multiplied by an efficiency threshold (0.5 = half
  //       of average returns, meaning we stop scaling up when returns drop below
  //       this level relative to the average).
  //    This is robust to different outcome scale units.

  const avgMR = seed.historicalData.reduce(
    (sum, d) => sum + Math.abs(marginalReturn(d.spending, drModel)), 0,
  ) / seed.historicalData.length;

  // Target marginal return = 50% of average observed
  const targetMR = avgMR * 0.5;
  let oslPerCapita: number;
  if (drModel.beta <= 0) {
    // Spending has zero or negative marginal benefit.
    // Recommend moving toward the minimum observed spending level —
    // the data shows peers spending less with equal or better outcomes.
    const sortedSpending = [...seed.historicalData.map(d => d.spending)].sort((a, b) => a - b);
    oslPerCapita = sortedSpending[0]!;
  } else if (targetMR > 0) {
    // For log model: β/S = targetMR → S = β/targetMR
    // For saturation: β×γ/(S+γ)² = targetMR → solve
    oslPerCapita = findOSL(drModel, targetMR);
    if (oslPerCapita <= 0 || !isFinite(oslPerCapita)) {
      oslPerCapita = currentPerCapita;
    }
  } else {
    oslPerCapita = currentPerCapita;
  }

  // Clamp to observed data range: don't extrapolate beyond 150% of max observed value
  // This is methodologically defensible — we avoid recommending spending levels
  // that have never been observed in cross-country data
  const maxObservedSpending = Math.max(...seed.historicalData.map(d => d.spending));
  const minObservedSpending = Math.min(...seed.historicalData.map(d => d.spending));
  const upperBound = maxObservedSpending * 1.5;
  const lowerBound = Math.max(minObservedSpending * 0.5, 0);
  oslPerCapita = Math.max(lowerBound, Math.min(oslPerCapita, upperBound));

  // Additional constraint for low-quality models: don't recommend large moves
  // when the model barely fits the data
  if (drModel.r2 < 0.3) {
    const lowFitUpper = currentPerCapita * 2;
    const lowFitLower = currentPerCapita * 0.5;
    oslPerCapita = Math.max(lowFitLower, Math.min(oslPerCapita, lowFitUpper));
  }

  const oslUsd = oslPerCapita * US_POPULATION;
  const mr = marginalReturn(currentPerCapita, drModel);

  // Compute elasticity: ε = MR × (spending / predicted_outcome)
  // Dimensionless: 1% spending increase → ε% outcome increase
  const predicted = predictOutcome(currentPerCapita, drModel);
  const elasticity = predicted !== 0 ? mr * (currentPerCapita / predicted) : undefined;

  // 4. Calculate WES
  const wesResult = calculateWES(seed.effectEstimates);
  wesResult.methodology = 'literature';

  // 5. Gap analysis
  const gapUsd = oslUsd - currentSpendingUsd;
  const gapPct =
    currentSpendingUsd > 0 ? (gapUsd / currentSpendingUsd) * 100 : 0;

  // Determine recommended action based on gap percentage.
  // Low model fit is handled by WES: weak evidence → low WES → low priority
  // for underspend, high priority for overspend. No need to force "maintain".
  let recommendedAction: SpendingGap['recommendedAction'];
  if (gapPct > 50) {
    recommendedAction = 'scale_up';
  } else if (gapPct > 10) {
    recommendedAction = 'increase';
  } else if (gapPct > -10) {
    recommendedAction = 'maintain';
  } else if (gapPct > -50) {
    recommendedAction = 'decrease';
  } else {
    recommendedAction = 'major_decrease';
  }

  const priorityScore = calculatePriorityScore(gapUsd, wesResult.score);

  // Welfare effect estimate (proportional to marginal return & WES)
  const incomeEffect = mr * wesResult.score * 0.5;
  const healthEffect = mr * wesResult.score * 0.3;

  // Build methodology notes with quality flags
  const notes: string[] = [`${drModel.type} model, R²=${drModel.r2.toFixed(3)}, N=${drModel.n}`];
  if (drModel.r2 < 0.1) {
    notes.push('LOW FIT: weak model — recommendation driven by WES priority');
  }
  const beyondData = oslPerCapita > maxObservedSpending;
  if (beyondData) {
    notes.push('OSL capped — beyond observed data range');
  }

  const oslEstimate: OSLEstimate = {
    categoryId: seed.id,
    estimationMethod: 'diminishing_returns',
    oslUsd,
    oslPerCapita: oslUsd / US_POPULATION,
    oslPctGdp: (oslUsd / US_GDP) * 100,
    evidenceGrade: wesResult.grade,
    welfareEvidenceScore: wesResult.score,
    methodologyNotes: notes.join(' — '),
  };

  const gap: SpendingGap = {
    categoryId: seed.id,
    categoryName: seed.name,
    currentSpendingUsd,
    oslUsd,
    gapUsd,
    gapPct,
    welfareEvidenceScore: wesResult.score,
    priorityScore,
    welfareEffect: {
      incomeEffect,
      healthEffect,
    },
    recommendedAction,
  };

  return {
    category,
    oslEstimate,
    gap,
    diminishingReturnsModel: drModel,
    marginalReturn: mr,
    elasticity,
    wesResult,
  };
}

// ---------------------------------------------------------------------------
// Website JSON types
// ---------------------------------------------------------------------------

interface WebsiteBudgetData {
  jurisdiction: string;
  totalBudget: number;
  categories: {
    name: string;
    currentSpending: number;
    optimalSpending: number;
    gap: number;
    gapPercent: number;
    marginalReturn: number;
    recommendation: 'increase' | 'decrease' | 'maintain';
    outcomeMetrics: { name: string; value: number; trend: string }[];
  }[];
  topRecommendations: string[];
  generatedAt: string;
}

export interface BudgetAnalysisArtifacts {
  result: BudgetOptimizationResult;
  websiteData: WebsiteBudgetData;
  reportMarkdown: string;
  outputPaths: {
    markdownConstrained: string;
    markdown: string;
    json: string;
  };
}

export interface BudgetAnalysisOptions {
  outputDir?: string;
  writeFiles?: boolean;
  logSummary?: boolean;
}

function mapRecommendation(
  action: SpendingGap['recommendedAction'],
): 'increase' | 'decrease' | 'maintain' {
  switch (action) {
    case 'scale_up':
    case 'increase':
      return 'increase';
    case 'decrease':
    case 'major_decrease':
      return 'decrease';
    default:
      return 'maintain';
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// OECD Panel → AnnualTimeSeries converter for causal engine
// ---------------------------------------------------------------------------

/** ISO3 → country name for display in causal analysis reports */
const ISO3_NAMES: Record<string, string> = {
  USA: 'United States', GBR: 'United Kingdom', FRA: 'France',
  DEU: 'Germany', JPN: 'Japan', CAN: 'Canada', ITA: 'Italy',
  AUS: 'Australia', NLD: 'Netherlands', BEL: 'Belgium',
  SWE: 'Sweden', NOR: 'Norway', DNK: 'Denmark', FIN: 'Finland',
  AUT: 'Austria', CHE: 'Switzerland', ESP: 'Spain', PRT: 'Portugal',
  IRL: 'Ireland', NZL: 'New Zealand', KOR: 'South Korea',
  ISR: 'Israel', CZE: 'Czech Republic',
};

/**
 * Convert the OECD budget panel into AnnualTimeSeries per country,
 * suitable for runCountryAnalysis.
 *
 * Groups rows by jurisdictionIso3 and builds year→value maps,
 * skipping rows where either field is null.
 */
function oecdPanelToCountryInput(
  spendingField: keyof OECDBudgetPanelDataPoint,
  outcomeField: keyof OECDBudgetPanelDataPoint,
  negateOutcome?: boolean,
): { predictors: AnnualTimeSeries[]; outcomes: AnnualTimeSeries[] } {
  // Group by country
  const byCountry = new Map<string, OECDBudgetPanelDataPoint[]>();
  for (const row of OECD_BUDGET_PANEL) {
    if (row[spendingField] == null || row[outcomeField] == null) continue;
    const existing = byCountry.get(row.jurisdictionIso3);
    if (existing) {
      existing.push(row);
    } else {
      byCountry.set(row.jurisdictionIso3, [row]);
    }
  }

  const predictors: AnnualTimeSeries[] = [];
  const outcomes: AnnualTimeSeries[] = [];

  for (const [iso3, rows] of byCountry) {
    const spendingValues = new Map<number, number>();
    const outcomeValues = new Map<number, number>();

    for (const row of rows) {
      spendingValues.set(row.year, row[spendingField] as number);
      const rawOutcome = row[outcomeField] as number;
      outcomeValues.set(row.year, negateOutcome ? 100 - rawOutcome : rawOutcome);
    }

    const name = ISO3_NAMES[iso3] ?? iso3;

    predictors.push({
      jurisdictionId: iso3,
      jurisdictionName: name,
      variableId: String(spendingField),
      variableName: String(spendingField),
      unit: 'USD PPP per capita',
      annualValues: spendingValues,
    });

    outcomes.push({
      jurisdictionId: iso3,
      jurisdictionName: name,
      variableId: String(outcomeField),
      variableName: String(outcomeField),
      unit: negateOutcome ? 'inverted index' : 'value',
      annualValues: outcomeValues,
    });
  }

  return { predictors, outcomes };
}

/**
 * OECD panel data mappings for categories that have matching cross-country data.
 * Each entry maps a category ID to the OECD spending/outcome fields to use.
 * These replace the hardcoded ~6-10 data points with 300+ real observations.
 */
const OECD_DATA_MAPPINGS: Record<string, {
  spendingField: 'healthSpendingPerCapitaPpp' | 'educationSpendingPerCapitaPpp' | 'militarySpendingPerCapitaPpp' | 'socialSpendingPerCapitaPpp' | 'rdSpendingPerCapitaPpp';
  outcomeField: 'lifeExpectancyYears' | 'gdpPerCapitaPpp' | 'infantMortalityPer1000' | 'giniIndex';
  /** When true, outcome is inverted (100 - value) so that higher = better */
  negateOutcome?: boolean;
}> = {
  medicare: { spendingField: 'healthSpendingPerCapitaPpp', outcomeField: 'lifeExpectancyYears' },
  medicaid: { spendingField: 'healthSpendingPerCapitaPpp', outcomeField: 'infantMortalityPer1000', negateOutcome: true },
  military: { spendingField: 'militarySpendingPerCapitaPpp', outcomeField: 'lifeExpectancyYears' },
  social_security: { spendingField: 'socialSpendingPerCapitaPpp', outcomeField: 'lifeExpectancyYears' },
  income_security: { spendingField: 'socialSpendingPerCapitaPpp', outcomeField: 'giniIndex', negateOutcome: true },
  science_space: { spendingField: 'rdSpendingPerCapitaPpp', outcomeField: 'gdpPerCapitaPpp' },
  education: { spendingField: 'educationSpendingPerCapitaPpp', outcomeField: 'gdpPerCapitaPpp' },
  // health_research intentionally omitted: NIH/CDC research funding ≠ total health spending.
  // Without a mapping, Health Research uses curve-fitting WES from its effect estimates,
  // avoiding identical results to Medicare (which correctly maps to healthSpendingPerCapitaPpp).
};

// ---------------------------------------------------------------------------
// Domestic (US-only) time series for N-of-1 causal analysis
// ---------------------------------------------------------------------------

/** Maps category IDs to fields in US_BUDGET_CATEGORIES */
const DOMESTIC_SPENDING_MAPPINGS: Record<string, keyof USBudgetCategoryDataPoint> = {
  education: 'educationSpendingBillions',
  military: 'militarySpendingBillions',
  transportation: 'infrastructureSpendingBillions',
  health_research: 'rdSpendingBillions',
  science_space: 'rdSpendingBillions',
  environment: 'environmentalSpendingBillions',
  justice: 'criminalJusticeSpendingBillions',
  foreign_aid: 'foreignAidSpendingBillions',
  income_security: 'socialBenefitsSpendingBillions',
  farm_subsidies: 'agricultureSubsidiesBillions',
};

/** Outcome metrics to try for each domestic analysis */
const DOMESTIC_OUTCOME_FIELDS: { field: keyof USOutcomeDataPoint; name: string; negate: boolean }[] = [
  { field: 'lifeExpectancyYears', name: 'Life Expectancy', negate: false },
  { field: 'realMedianHouseholdIncome', name: 'Median Income', negate: false },
  { field: 'infantMortalityPer1000', name: 'Infant Mortality', negate: true },
  { field: 'povertyRatePercent', name: 'Poverty Rate', negate: true },
  { field: 'homicideRatePer100k', name: 'Homicide Rate', negate: true },
];

/** Domestic causal evidence result */
interface DomesticCausalEvidence {
  wesScore: number;
  wesGrade: EvidenceGrade;
  bestOutcomeName: string;
  bestCorrelation: number;
  nYears: number;
  bradfordHill: AggregateAnalysis['meanBradfordHill'];
}

/**
 * Build a pair of AnnualTimeSeries from US domestic data for a given
 * spending field and outcome field.
 */
function buildDomesticTimeSeries(
  spendingField: keyof USBudgetCategoryDataPoint,
  outcomeField: keyof USOutcomeDataPoint,
  negate: boolean,
): { predictor: AnnualTimeSeries; outcome: AnnualTimeSeries } | null {
  const spendingValues = new Map<number, number>();
  const outcomeValues = new Map<number, number>();

  for (const budgetRow of US_BUDGET_CATEGORIES) {
    const spendingVal = budgetRow[spendingField];
    if (typeof spendingVal !== 'number') continue;
    spendingValues.set(budgetRow.year, spendingVal);
  }

  for (const outcomeRow of US_OUTCOME_DATA) {
    const outcomeVal = outcomeRow[outcomeField];
    if (typeof outcomeVal !== 'number') continue;
    outcomeValues.set(outcomeRow.year, negate ? -outcomeVal : outcomeVal);
  }

  if (spendingValues.size < 5 || outcomeValues.size < 5) return null;

  return {
    predictor: {
      jurisdictionId: 'USA',
      jurisdictionName: 'United States',
      variableId: String(spendingField),
      variableName: String(spendingField),
      unit: 'USD billions',
      annualValues: spendingValues,
    },
    outcome: {
      jurisdictionId: 'USA',
      jurisdictionName: 'United States',
      variableId: String(outcomeField),
      variableName: String(outcomeField),
      unit: negate ? 'inverted value' : 'value',
      annualValues: outcomeValues,
    },
  };
}

/**
 * Compute domestic causal evidence for a category using US-only time series.
 *
 * Tries each outcome metric, picks the one with the strongest positive
 * forward Pearson correlation (after negation for "lower is better" metrics).
 */
function computeDomesticCausalEvidence(seed: CategorySeed): DomesticCausalEvidence | null {
  const spendingField = DOMESTIC_SPENDING_MAPPINGS[seed.id];
  if (!spendingField) return null;

  let bestResult: {
    outcomeName: string;
    forwardPearson: number;
    aggregate: AggregateAnalysis;
    nYears: number;
  } | null = null;

  for (const outcomeSpec of DOMESTIC_OUTCOME_FIELDS) {
    const ts = buildDomesticTimeSeries(spendingField, outcomeSpec.field, outcomeSpec.negate);
    if (!ts) continue;

    const result = runCountryAnalysis({
      predictors: [ts.predictor],
      outcomes: [ts.outcome],
    });

    if (result.aggregate.n < 1) continue;

    const pearson = result.aggregate.meanForwardPearson;
    // We want positive correlation (after negation), indicating spending helps
    if (!bestResult || pearson > bestResult.forwardPearson) {
      // Count overlapping years
      const spendingYears = new Set(ts.predictor.annualValues.keys());
      let overlap = 0;
      for (const y of ts.outcome.annualValues.keys()) {
        if (spendingYears.has(y)) overlap++;
      }
      bestResult = {
        outcomeName: outcomeSpec.name,
        forwardPearson: pearson,
        aggregate: result.aggregate,
        nYears: overlap,
      };
    }
  }

  if (!bestResult || bestResult.forwardPearson <= 0) return null;

  const { aggregate } = bestResult;
  const bh = aggregate.meanBradfordHill;

  // WES from Bradford Hill: strength × consistency-from-N=1 (fixed 0.10)
  // N=1 country means no cross-country consistency, so we rely on
  // BH strength (correlation magnitude) and temporality
  const consistencyFromN = 1 - Math.exp(-1 / 10); // ~0.095 for N=1
  const wesScore = Math.min(1, Math.max(0,
    bh.strength * consistencyFromN * (1 + bh.temporality),
  ));
  const wesGrade = scoreToGrade(wesScore);

  return {
    wesScore,
    wesGrade,
    bestOutcomeName: bestResult.outcomeName,
    bestCorrelation: bestResult.forwardPearson,
    nYears: bestResult.nYears,
    bradfordHill: bh,
  };
}

/** Enrich categories with real OECD panel data where available */
function enrichWithOECDData(categories: CategorySeed[]): CategorySeed[] {
  return categories.map(cat => {
    const mapping = OECD_DATA_MAPPINGS[cat.id];
    if (!mapping) return cat;

    let oecdData = oecdBudgetPanelToSpendingOutcome(
      mapping.spendingField,
      mapping.outcomeField,
    );

    // For metrics where lower = better (infant mortality, gini),
    // invert so that higher outcome = better for the model
    if (mapping.negateOutcome) {
      oecdData = oecdData.map(d => ({ ...d, outcome: 100 - d.outcome }));
    }

    // Only replace if we got substantially more data
    if (oecdData.length > cat.historicalData.length * 2) {
      return { ...cat, historicalData: oecdData };
    }
    return cat;
  });
}

/**
 * Causal evidence from N-of-1 country analysis.
 * Used to compute WES from actual within-country temporal correlations,
 * replacing the hand-constructed effect estimates.
 */
interface CausalEvidence {
  wesScore: number;
  wesGrade: EvidenceGrade;
  forwardPearson: number;
  nCountries: number;
  nSkipped: number;
  positiveCount: number;
  negativeCount: number;
  meanEffectSize: number;
  meanPercentChange: number;
  bradfordHill: AggregateAnalysis['meanBradfordHill'];
  methodologyNotes: string;
}

/**
 * Compute causal Welfare Evidence Score for a category using N-of-1 country analysis.
 *
 * Uses Bradford Hill strength × cross-country consistency × temporality to produce
 * a WES that differentiates well: health spending (r≈0.9) → high WES; military (r≈-0.1) → low WES.
 *
 * Returns null if the category has no OECD mapping or insufficient data.
 */
function computeCausalWES(seed: CategorySeed): CausalEvidence | null {
  if (seed.discretionary === false) return null;

  const mapping = OECD_DATA_MAPPINGS[seed.id];
  if (!mapping) return null;

  const { predictors, outcomes } = oecdPanelToCountryInput(
    mapping.spendingField,
    mapping.outcomeField,
    mapping.negateOutcome,
  );

  if (predictors.length < 3) return null;

  const causalResult = runCountryAnalysis({ predictors, outcomes });

  if (causalResult.aggregate.n < 3) return null;

  const { aggregate } = causalResult;
  const { meanBradfordHill: bh } = aggregate;

  // WES from Bradford Hill: strength × directional consistency × sample size saturation
  // directionalConsistency = fraction of countries with positive correlation
  // This penalizes categories with negative correlations:
  //   Health (r≈0.9, 23/23 positive): 0.94 × 1.0 × 0.90 ≈ 0.85 (A)
  //   Military (r≈-0.1, 10/23 positive): 0.78 × 0.43 × 0.90 ≈ 0.30 (D)
  const directionalConsistency = aggregate.n > 0
    ? aggregate.positiveCount / aggregate.n
    : 0;
  const consistencyFromN = 1 - Math.exp(-aggregate.n / 10);
  const wesScore = Math.min(1, Math.max(0,
    bh.strength * directionalConsistency * consistencyFromN,
  ));
  const wesGrade = scoreToGrade(wesScore);

  const notes = [
    `Causal WES: BH strength=${bh.strength.toFixed(2)} × dirConsistency(${aggregate.positiveCount}/${aggregate.n})=${directionalConsistency.toFixed(2)} × sampleSat(N=${aggregate.n})=${consistencyFromN.toFixed(2)}`,
    `r=${aggregate.meanForwardPearson.toFixed(3)}, +/${aggregate.positiveCount}/-${aggregate.negativeCount}`,
  ];
  if (aggregate.skipped > 0) {
    notes.push(`${aggregate.skipped} countries skipped (insufficient data)`);
  }

  return {
    wesScore,
    wesGrade,
    forwardPearson: aggregate.meanForwardPearson,
    nCountries: aggregate.n,
    nSkipped: aggregate.skipped,
    positiveCount: aggregate.positiveCount,
    negativeCount: aggregate.negativeCount,
    meanEffectSize: aggregate.meanEffectSize,
    meanPercentChange: aggregate.meanPercentChange,
    bradfordHill: bh,
    methodologyNotes: notes.join(' — '),
  };
}

export function generateBudgetAnalysisArtifacts(
  options: BudgetAnalysisOptions = {},
): BudgetAnalysisArtifacts {
  const {
    outputDir = OUTPUT_DIR,
    writeFiles = true,
    logSummary = true,
  } = options;

  // Enrich categories with real OECD panel data where available
  const enrichedCategories = enrichWithOECDData(CATEGORIES);

  // Hybrid pipeline: always curve-fit for OSL, overlay causal WES for OECD-mapped categories
  const causalEvidenceMap = new Map<string, CausalEvidence>();
  const categoryAnalyses = enrichedCategories.map(seed => {
    // Always run curve-fitting for OSL (or non-discretionary short-circuit)
    const analysis = runCategoryAnalysis(seed);

    // For OECD-mapped categories, replace WES with causal evidence
    const causal = computeCausalWES(seed);
    if (causal) {
      causalEvidenceMap.set(seed.id, causal);
      analysis.oslEstimate.welfareEvidenceScore = causal.wesScore;
      analysis.oslEstimate.evidenceGrade = causal.wesGrade;
      analysis.oslEstimate.methodologyNotes = causal.methodologyNotes;
      analysis.gap.welfareEvidenceScore = causal.wesScore;
      analysis.gap.priorityScore = calculatePriorityScore(analysis.gap.gapUsd, causal.wesScore);
      analysis.wesResult = {
        score: causal.wesScore,
        grade: causal.wesGrade,
        qualityWeight: causal.bradfordHill.strength,
        precisionWeight: causal.nCountries,
        recencyWeight: causal.bradfordHill.temporality,
        estimateCount: causal.nCountries,
        methodology: 'causal',
      };
    }

    return analysis;
  });

  // For discretionary categories without OECD causal evidence, try domestic N-of-1
  const domesticEvidenceMap = new Map<string, DomesticCausalEvidence>();
  for (let idx = 0; idx < categoryAnalyses.length; idx++) {
    const analysis = categoryAnalyses[idx]!;
    const seed = enrichedCategories[idx]!;
    if (causalEvidenceMap.has(seed.id)) continue; // Already has OECD causal
    if (seed.discretionary === false) continue;

    const domestic = computeDomesticCausalEvidence(seed);
    if (!domestic) continue;

    domesticEvidenceMap.set(seed.id, domestic);
    analysis.oslEstimate.welfareEvidenceScore = domestic.wesScore;
    analysis.oslEstimate.evidenceGrade = domestic.wesGrade;
    analysis.gap.welfareEvidenceScore = domestic.wesScore;
    analysis.gap.priorityScore = calculatePriorityScore(analysis.gap.gapUsd, domestic.wesScore);
    analysis.wesResult = {
      score: domestic.wesScore,
      grade: domestic.wesGrade,
      qualityWeight: domestic.bradfordHill.strength,
      precisionWeight: 1, // N=1 country
      recencyWeight: domestic.bradfordHill.temporality,
      estimateCount: domestic.nYears,
      methodology: 'domestic',
    };
  }

  // Categories with neither OECD nor domestic causal evidence: flag as 'estimated'
  for (const analysis of categoryAnalyses) {
    if (analysis.category.discretionary === false) continue;
    if (causalEvidenceMap.has(analysis.category.id)) continue;
    if (domesticEvidenceMap.has(analysis.category.id)) continue;
    if (analysis.wesResult) {
      analysis.wesResult.methodology = 'estimated';
    }
  }

  // Sort by priority score (descending)
  categoryAnalyses.sort((a, b) => b.gap.priorityScore - a.gap.priorityScore);

  const totalOptimalUsd = categoryAnalyses.reduce(
    (sum, ca) => sum + ca.oslEstimate.oslUsd,
    0,
  );

  // Welfare improvement: budget-weighted reallocation potential
  // = Σ(|gapUsd| × WES) / totalBudget × 100
  // This gives "% of budget that should move, weighted by evidence quality"
  const welfareImprovementPct =
    categoryAnalyses.reduce(
      (sum, ca) =>
        sum + Math.abs(ca.gap.gapUsd) * ca.oslEstimate.welfareEvidenceScore,
      0,
    ) / Math.max(TOTAL_BUDGET_USD, 1) * 100;

  const result: BudgetOptimizationResult = {
    jurisdictionName: 'United States of America',
    jurisdictionId: 'US',
    fiscalYear: FISCAL_YEAR,
    totalBudgetUsd: TOTAL_BUDGET_USD,
    totalOptimalUsd,
    welfareImprovementPct,
    categories: categoryAnalyses,
  };

  const appendEvidenceDetailSections = (baseReport: string): string => {
    let reportWithEvidence = baseReport;

    // Append Causal Evidence Detail section for OECD-mapped categories
    if (causalEvidenceMap.size > 0) {
      const causalLines: string[] = [];
      causalLines.push('');
      causalLines.push('## Causal Evidence Detail (OECD-Mapped Categories)');
      causalLines.push('');
      causalLines.push('| Category | r | N | +/- | % Change | BH Strength | BH Temporality | BH Gradient | WES | Grade |');
      causalLines.push('|----------|---|---|-----|----------|-------------|----------------|-------------|-----|-------|');

      // Sort by WES descending
      const sortedCausal = [...causalEvidenceMap.entries()].sort(
        (a, b) => b[1].wesScore - a[1].wesScore,
      );
      for (const [catId, ev] of sortedCausal) {
        const catName = CATEGORIES.find(c => c.id === catId)?.name ?? catId;
        causalLines.push(
          `| ${catName} ` +
          `| ${ev.forwardPearson.toFixed(3)} ` +
          `| ${ev.nCountries} ` +
          `| ${ev.positiveCount}/${ev.negativeCount} ` +
          `| ${ev.meanPercentChange >= 0 ? '+' : ''}${ev.meanPercentChange.toFixed(1)}% ` +
          `| ${ev.bradfordHill.strength.toFixed(2)} ` +
          `| ${ev.bradfordHill.temporality.toFixed(2)} ` +
          `| ${ev.bradfordHill.gradient.toFixed(2)} ` +
          `| ${ev.wesScore.toFixed(2)} ` +
          `| ${ev.wesGrade} |`,
        );
      }
      causalLines.push('');
      causalLines.push('r = mean forward Pearson across countries (within-country temporal correlation)');
      causalLines.push('N = countries analyzed; +/- = countries with positive/negative correlation');
      causalLines.push('% Change = mean outcome change when spending above country\'s own baseline');
      causalLines.push('BH = Bradford Hill criteria scores (0-1 saturation scale)');
      causalLines.push('');

      reportWithEvidence += causalLines.join('\n');
    }

    // Append Domestic Evidence Detail section
    if (domesticEvidenceMap.size > 0) {
      const domesticLines: string[] = [];
      domesticLines.push('');
      domesticLines.push('## Domestic Evidence Detail (US Time Series 2000-2023)');
      domesticLines.push('');
      domesticLines.push('| Category | Best Outcome | r | N years | BH Strength | WES | Grade |');
      domesticLines.push('|----------|-------------|---|---------|-------------|-----|-------|');

      const sortedDomestic = [...domesticEvidenceMap.entries()].sort(
        (a, b) => b[1].wesScore - a[1].wesScore,
      );
      for (const [catId, ev] of sortedDomestic) {
        const catName = CATEGORIES.find(c => c.id === catId)?.name ?? catId;
        domesticLines.push(
          `| ${catName} ` +
          `| ${ev.bestOutcomeName} ` +
          `| ${ev.bestCorrelation.toFixed(3)} ` +
          `| ${ev.nYears} ` +
          `| ${ev.bradfordHill.strength.toFixed(2)} ` +
          `| ${ev.wesScore.toFixed(2)} ` +
          `| ${ev.wesGrade} |`,
        );
      }
      domesticLines.push('');
      domesticLines.push('r = forward Pearson correlation (US domestic spending vs outcome, 2000-2023)');
      domesticLines.push('N years = overlapping data points between spending and outcome time series');
      domesticLines.push('BH = Bradford Hill strength score (0-1 saturation scale)');
      domesticLines.push('');

      reportWithEvidence += domesticLines.join('\n');
    }

    return reportWithEvidence;
  };

  // Primary report: unconstrained OSL benchmark
  const report = appendEvidenceDetailSections(generateBudgetReport(result));
  // Secondary report: constrained reallocation for fixed-budget scenarios
  const constrainedReport = appendEvidenceDetailSections(
    generateBudgetReport(result, { constrainToCurrentBudget: true }),
  );

  // Generate website JSON
  const websiteData: WebsiteBudgetData = {
    jurisdiction: 'United States of America',
    totalBudget: TOTAL_BUDGET_USD,
    categories: categoryAnalyses.map((ca, idx) => ({
      name: ca.category.name,
      currentSpending: ca.category.currentSpendingUsd,
      optimalSpending: ca.oslEstimate.oslUsd,
      gap: ca.gap.gapUsd,
      gapPercent: ca.gap.gapPct,
      marginalReturn: ca.marginalReturn ?? 0,
      recommendation: mapRecommendation(ca.gap.recommendedAction),
      outcomeMetrics: CATEGORIES[
        CATEGORIES.findIndex(c => c.id === ca.category.id)
      ]?.outcomeMetrics ?? [],
    })),
    topRecommendations: categoryAnalyses
      .filter(
        ca =>
          ca.gap.recommendedAction !== 'maintain' &&
          ca.category.discretionary !== false &&
          ca.oslEstimate.evidenceGrade !== 'F',
      )
      .slice(0, 10)
      .map(
        ca =>
          `${ca.gap.recommendedAction === 'scale_up' || ca.gap.recommendedAction === 'increase' ? 'Increase' : 'Decrease'} ${ca.category.name} by $${Math.abs(ca.gap.gapUsd / 1e9).toFixed(1)}B (${ca.gap.gapPct > 0 ? '+' : ''}${ca.gap.gapPct.toFixed(1)}%)`,
      ),
    generatedAt: new Date().toISOString(),
  };

  const outputPaths = {
    markdownConstrained: path.join(outputDir, 'us-budget-report-constrained.md'),
    markdown: path.join(outputDir, 'us-budget-report.md'),
    json: path.join(outputDir, 'us-budget-analysis.json'),
  };

  if (writeFiles) {
    fs.mkdirSync(outputDir, { recursive: true });

    fs.writeFileSync(outputPaths.markdown, report, 'utf-8');
    console.log(`✅ Markdown report written to ${outputPaths.markdown}`);

    fs.writeFileSync(outputPaths.markdownConstrained, constrainedReport, 'utf-8');
    console.log(`✅ Constrained markdown report written to ${outputPaths.markdownConstrained}`);

    fs.writeFileSync(
      outputPaths.json,
      JSON.stringify(websiteData, null, 2),
      'utf-8',
    );
    console.log(`✅ JSON analysis written to ${outputPaths.json}`);
  }

  if (logSummary) {
    console.log('\n--- Budget Optimization Summary ---');
    console.log(`Categories analyzed: ${categoryAnalyses.length}`);
    console.log(
      `Total current budget: $${(TOTAL_BUDGET_USD / 1e12).toFixed(2)}T`,
    );
    console.log(
      `Total optimal budget: $${(totalOptimalUsd / 1e12).toFixed(2)}T`,
    );
    console.log(
      `Welfare improvement potential: ${welfareImprovementPct.toFixed(1)}%`,
    );
    console.log('\nTop 5 recommendations:');
    websiteData.topRecommendations.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r}`);
    });
  }

  return {
    result,
    websiteData,
    reportMarkdown: report,
    outputPaths,
  };
}

function main(): void {
  generateBudgetAnalysisArtifacts();
}

main();
