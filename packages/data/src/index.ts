/**
 * @optimitron/data
 * 
 * Data fetchers for Optimitron - OECD, World Bank, Census, WHO, etc.
 * 
 * Provides unified access to public data sources for:
 * - Government spending by category
 * - Health outcomes (life expectancy, mortality)
 * - Economic indicators (GDP, income, unemployment)
 * - Policy data
 * 
 * @example
 * ```typescript
 * import {
 *   fetchOECDSpending,
 *   fetchWorldBankHealthData,
 *   OECD_SPENDING_CATEGORIES,
 *   WB_INDICATORS,
 * } from '@optimitron/data';
 * 
 * // Fetch health spending for OECD countries
 * const spending = await fetchOECDSpending({
 *   categories: ['HEALTH', 'EDUCATION'],
 *   period: { startYear: 2018, endYear: 2022 },
 * });
 * 
 * // Fetch health outcomes
 * const health = await fetchWorldBankHealthData({
 *   jurisdictions: ['USA', 'GBR', 'DEU', 'JPN'],
 * });
 * ```
 */

// Types
export * from './types.js';

// Data sources (legacy)
export * from './sources/index.js';

// API fetchers (OECD, World Bank, WHO, FRED)
// Exported as namespace to avoid name collisions with legacy sources
export * as fetchers from './fetchers/index.js';

// CSV loader (Gapminder-format parser)
export * from './csv-loader.js';

// Economic data catalog
export * from './catalog.js';

// Health data importers (Apple Health, etc.)
export * from './importers/index.js';

// Unit conversion system
export * from './unit-conversion.js';

// Daily value aggregation
export * from './daily-aggregation.js';

// Measurement validation
export * from './measurement-validation.js';

// Variable statistics (unit-level & global aggregation)
export * from './variable-statistics.js';

// Canonical predictor/outcome registry for explorer workflows
export * from './variable-registry.js';

// Curated datasets (US federal budget, evidence-based policies)
export * from './datasets/index.js';

// Jurisdiction registry
export * from './jurisdictions.js';

// Inflation-adjustment & per-capita conversion
export * from './inflation-adjustment.js';

// Misc utilities
export * from './utils/index.js';

// Version
export const VERSION = '0.1.0';
export * from './pipelines/fetch-country-timeseries.js';
