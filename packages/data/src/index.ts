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
 * import { fetchers } from '@optimitron/data';
 *
 * // Fetch health spending for OECD countries
 * const spending = await fetchers.fetchOECDHealthExpenditure({
 *   jurisdictions: ['USA', 'GBR', 'DEU', 'JPN'],
 * });
 * ```
 */

// Types
export * from './types';

// API fetchers (OECD, World Bank, WHO, FRED)
export * as fetchers from './fetchers/index';

// CSV loader (Gapminder-format parser).
// NOT barrel-exported — contains Node.js APIs (node:fs, node:url) that break browser bundling.
// Import directly when needed: import { parseGapminderCsv } from '@optimitron/data/csv-loader'

// Economic data catalog
export * from './catalog';

// Health data importers (Apple Health, etc.)
export * from './importers/index';

// Unit conversion system
export * from './unit-conversion';

// Daily value aggregation
export * from './daily-aggregation';

// Measurement validation
export * from './measurement-validation';

// Variable statistics (unit-level & global aggregation)
export * from './variable-statistics';

// Canonical predictor/outcome registry for explorer workflows
export * from './variable-registry';

// Curated datasets (US federal budget, evidence-based policies)
export * from './datasets/index';

// Wishocratic items registry (jurisdiction-aware item lookup)
export * from './wishocratic-items-registry';

// Jurisdiction registry
export * from './jurisdictions';

// Inflation-adjustment & per-capita conversion
export * from './inflation-adjustment';

// Misc utilities
export * from './utils/index';

// Economic model parameters, citations, and formatters (use @optimitron/data/parameters for full access)
export type { Parameter, Citation, SourceType, Confidence, ParameterName } from './parameters/index';
export type { FormatParameterOptions } from './parameters/index';

// Version
export const VERSION = '0.1.0';
export * from './pipelines/fetch-country-timeseries';
