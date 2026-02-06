/**
 * Pairwise Comparison Aggregation
 * 
 * Aggregates individual pairwise comparisons into a comparison matrix.
 * Uses geometric mean for ratio aggregation (standard in AHP).
 * 
 * @see Wishocracy paper: "Core Mechanism" section
 */

import type { PairwiseComparison, MatrixEntry } from './types.js';

/**
 * Aggregate raw comparisons into a comparison matrix
 * 
 * For each pair (A, B), computes:
 * - Geometric mean of allocation ratios across all participants
 * - Count of comparisons
 * - Standard deviation (consensus measure)
 */
export function aggregateComparisons(
  comparisons: PairwiseComparison[]
): MatrixEntry[] {
  // Group by pair (normalize order so A < B)
  const pairMap = new Map<string, PairwiseComparison[]>();
  
  for (const comp of comparisons) {
    const [first, second] = comp.itemAId < comp.itemBId
      ? [comp.itemAId, comp.itemBId]
      : [comp.itemBId, comp.itemAId];
    
    const key = `${first}:${second}`;
    
    if (!pairMap.has(key)) {
      pairMap.set(key, []);
    }
    pairMap.get(key)!.push(comp);
  }
  
  const entries: MatrixEntry[] = [];
  
  for (const [key, comps] of pairMap) {
    const [itemAId, itemBId] = key.split(':') as [string, string];
    
    // Calculate ratios (allocationA / allocationB)
    // Handle edge case where allocation is 0
    const ratios = comps.map(c => {
      // Normalize so itemAId is always the "first" item
      const allocA = c.itemAId === itemAId ? c.allocationA : 100 - c.allocationA;
      const allocB = 100 - allocA;
      
      // Avoid division by zero: treat 100-0 as 99-1
      const safeA = Math.max(allocA, 0.5);
      const safeB = Math.max(allocB, 0.5);
      
      return safeA / safeB;
    });
    
    // Geometric mean of ratios
    const logSum = ratios.reduce((sum, r) => sum + Math.log(r), 0);
    const geometricMean = Math.exp(logSum / ratios.length);
    
    // Standard deviation of allocations (not ratios) for interpretability
    const allocations = comps.map(c => 
      c.itemAId === itemAId ? c.allocationA : 100 - c.allocationA
    );
    const mean = allocations.reduce((a, b) => a + b, 0) / allocations.length;
    const variance = allocations.reduce((sum, a) => sum + (a - mean) ** 2, 0) / allocations.length;
    const stdDev = Math.sqrt(variance);
    
    entries.push({
      itemAId,
      itemBId,
      ratio: geometricMean,
      count: comps.length,
      stdDev,
    });
  }
  
  return entries;
}

/**
 * Build a full n×n comparison matrix from pairwise entries
 * 
 * matrix[i][j] = how much more item i is preferred over item j
 * matrix[i][i] = 1 (self-comparison)
 * matrix[i][j] = 1 / matrix[j][i] (reciprocal)
 */
export function buildComparisonMatrix(
  items: string[],
  entries: MatrixEntry[]
): number[][] {
  const n = items.length;
  const indexMap = new Map(items.map((id, i) => [id, i]));
  
  // Initialize with 1s on diagonal
  const matrix: number[][] = Array.from({ length: n }, () => 
    Array.from({ length: n }, () => 1)
  );
  
  for (const entry of entries) {
    const i = indexMap.get(entry.itemAId);
    const j = indexMap.get(entry.itemBId);
    
    if (i === undefined || j === undefined) continue;
    
    matrix[i]![j] = entry.ratio;
    matrix[j]![i] = 1 / entry.ratio;
  }
  
  return matrix;
}

/**
 * Calculate AHP Consistency Ratio
 * 
 * CR < 0.1 means the comparisons are acceptably consistent.
 * For collective aggregation, inconsistencies tend to cancel out.
 */
export function consistencyRatio(matrix: number[][]): number {
  const n = matrix.length;
  if (n <= 2) return 0; // Always consistent for 2 items
  
  // Random Index values for matrices of size n (Saaty, 1980)
  const RI: Record<number, number> = {
    1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12,
    6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
    11: 1.51, 12: 1.54, 13: 1.56, 14: 1.57, 15: 1.59,
  };
  
  const ri = RI[n] ?? 1.59;
  if (ri === 0) return 0;
  
  // Calculate principal eigenvalue (λ_max) using power method
  const weights = principalEigenvector(matrix);
  
  // λ_max = sum of (Aw)_i / w_i / n
  let lambdaMax = 0;
  for (let i = 0; i < n; i++) {
    let aw = 0;
    for (let j = 0; j < n; j++) {
      aw += (matrix[i]?.[j] ?? 1) * (weights[j] ?? 0);
    }
    const w = weights[i] ?? 1;
    if (w > 0) {
      lambdaMax += aw / w;
    }
  }
  lambdaMax /= n;
  
  // Consistency Index
  const CI = (lambdaMax - n) / (n - 1);
  
  // Consistency Ratio
  return CI / ri;
}

/**
 * Calculate principal eigenvector of comparison matrix
 * (Power iteration method)
 * 
 * Returns normalized weights that sum to 1.
 */
export function principalEigenvector(
  matrix: number[][],
  maxIterations: number = 100,
  tolerance: number = 1e-8
): number[] {
  const n = matrix.length;
  let weights = Array.from({ length: n }, () => 1 / n);
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Multiply matrix × weights
    const newWeights = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += (matrix[i]?.[j] ?? 1) * (weights[j] ?? 0);
      }
      newWeights[i] = sum;
    }
    
    // Normalize
    const sum = newWeights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < n; i++) {
      newWeights[i] = (newWeights[i] ?? 0) / sum;
    }
    
    // Check convergence
    let maxDiff = 0;
    for (let i = 0; i < n; i++) {
      maxDiff = Math.max(maxDiff, Math.abs((newWeights[i] ?? 0) - (weights[i] ?? 0)));
    }
    
    weights = newWeights;
    
    if (maxDiff < tolerance) break;
  }
  
  return weights;
}
