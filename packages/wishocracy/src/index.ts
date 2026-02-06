/**
 * @optomitron/wishocracy
 * 
 * RAPPA: Randomized Aggregated Pairwise Preference Allocation
 * 
 * Pure calculation engine — no database dependency.
 * 
 * @see https://zenodo.org/records/18205882
 */

export * from './types.js';
export * from './pairwise.js';
export * from './alignment.js';
export * from './convergence.js';
export * from './matrix-completion.js';
export * from './bootstrap-ci.js';
export * from './manipulation.js';
export * from './pair-selection.js';

export const VERSION = '0.1.0';
