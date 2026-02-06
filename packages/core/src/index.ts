/**
 * @optomitron/core
 * 
 * Optimal Policy & Budget Generator - Evidence-based governance calculations
 * 
 * This library implements the algorithms from:
 * - Optimocracy: https://optimocracy.warondisease.org
 * - Optimal Policy Generator (OPG): https://opg.warondisease.org
 * - Optimal Budget Generator (OBG): https://obg.warondisease.org
 * 
 * @example
 * ```typescript
 * import { calculateCCS, estimateOSL, calculateBIS } from '@optomitron/core';
 * 
 * // Calculate policy causal confidence
 * const ccs = calculateCCS(bradfordHillScores);
 * 
 * // Estimate optimal spending level
 * const osl = estimateOSL(spendingData);
 * 
 * // Calculate budget impact score
 * const bis = calculateBIS(effectEstimates);
 * ```
 */

// Types
export * from './types/index.js';

// Optimal Policy Generator
export * from './opg/index.js';

// Optimal Budget Generator
export * from './obg/index.js';

// Version
export const VERSION = '0.1.0';
