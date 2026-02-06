import { describe, it, expect } from 'vitest';
import { analyseConvergence } from '../convergence.js';
import type { PairwiseComparison } from '../types.js';

// ─── Helper ──────────────────────────────────────────────────────────
function comp(
  participantId: string,
  itemAId: string,
  itemBId: string,
  allocationA: number,
  id?: string,
): PairwiseComparison {
  return {
    id: id ?? `${participantId}-${itemAId}-${itemBId}`,
    participantId,
    itemAId,
    itemBId,
    allocationA,
    timestamp: Date.now(),
  };
}

function generateComparisons(
  n: number,
  items: string[],
  trueWeights: number[],
  noise: number = 5,
  seed: number = 42,
): PairwiseComparison[] {
  // Simple seeded PRNG for reproducibility
  let s = seed;
  const rng = () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };

  const comps: PairwiseComparison[] = [];
  for (let c = 0; c < n; c++) {
    const i = Math.floor(rng() * items.length);
    let j = Math.floor(rng() * items.length);
    while (j === i) j = Math.floor(rng() * items.length);

    // True allocation based on weights + noise
    const trueAlloc = (trueWeights[i]! / (trueWeights[i]! + trueWeights[j]!)) * 100;
    const noisyAlloc = Math.max(0, Math.min(100, trueAlloc + (rng() - 0.5) * noise * 2));

    comps.push(
      comp(`user-${c}`, items[i]!, items[j]!, noisyAlloc, `comp-${c}`),
    );
  }
  return comps;
}

// =====================================================================
// analyseConvergence
// =====================================================================
describe('analyseConvergence', () => {
  it('returns converged for empty input', () => {
    const result = analyseConvergence([]);
    expect(result.isConverged).toBe(true);
    expect(result.minComparisons).toBe(0);
    expect(result.weightVariance).toBe(0);
  });

  it('returns a result with expected shape', () => {
    const comps = [
      comp('u1', 'A', 'B', 70),
      comp('u2', 'A', 'B', 65),
      comp('u3', 'A', 'B', 75),
    ];
    const result = analyseConvergence(comps, { seed: 42 });
    expect(result).toHaveProperty('minComparisons');
    expect(result).toHaveProperty('weightVariance');
    expect(result).toHaveProperty('isConverged');
    expect(result).toHaveProperty('perItemVariance');
    expect(result).toHaveProperty('meanWeights');
    expect(typeof result.weightVariance).toBe('number');
    expect(typeof result.isConverged).toBe('boolean');
  });

  it('weightVariance is non-negative', () => {
    const comps = generateComparisons(50, ['A', 'B', 'C'], [0.5, 0.3, 0.2], 10, 123);
    const result = analyseConvergence(comps, { seed: 123 });
    expect(result.weightVariance).toBeGreaterThanOrEqual(0);
  });

  it('converges with many consistent comparisons', () => {
    const items = ['A', 'B', 'C'];
    const trueWeights = [0.6, 0.3, 0.1];
    // 500 comparisons with low noise should converge
    const comps = generateComparisons(500, items, trueWeights, 3, 99);
    const result = analyseConvergence(comps, {
      seed: 99,
      bootstrapIterations: 30,
      convergenceThreshold: 1e-3,
    });
    expect(result.isConverged).toBe(true);
    expect(result.minComparisons).toBeLessThan(500);
  });

  it('does NOT converge with very few noisy comparisons', () => {
    const items = ['A', 'B', 'C', 'D', 'E'];
    const trueWeights = [0.3, 0.25, 0.2, 0.15, 0.1];
    // Only 5 comparisons across 5 items with high noise
    const comps = generateComparisons(5, items, trueWeights, 40, 77);
    const result = analyseConvergence(comps, {
      seed: 77,
      bootstrapIterations: 30,
      convergenceThreshold: 1e-5,
    });
    expect(result.isConverged).toBe(false);
  });

  it('mean weights approximately reflect true preference ordering', () => {
    const items = ['health', 'education', 'defense'];
    const trueWeights = [0.5, 0.3, 0.2];
    const comps = generateComparisons(300, items, trueWeights, 5, 42);
    const result = analyseConvergence(comps, { seed: 42, bootstrapIterations: 40 });

    // Mean weights should roughly preserve ordering
    expect(result.meanWeights['health']!).toBeGreaterThan(result.meanWeights['education']!);
    expect(result.meanWeights['education']!).toBeGreaterThan(result.meanWeights['defense']!);
  });

  it('perItemVariance keys match items', () => {
    const comps = [
      comp('u1', 'X', 'Y', 60),
      comp('u2', 'Y', 'Z', 55),
      comp('u3', 'X', 'Z', 70),
    ];
    const result = analyseConvergence(comps, { seed: 10 });
    expect(Object.keys(result.perItemVariance).sort()).toEqual(['X', 'Y', 'Z']);
    expect(Object.keys(result.meanWeights).sort()).toEqual(['X', 'Y', 'Z']);
  });

  it('minComparisons decreases with stricter threshold being harder to meet', () => {
    const items = ['A', 'B', 'C'];
    const comps = generateComparisons(200, items, [0.5, 0.3, 0.2], 5, 55);

    const loose = analyseConvergence(comps, {
      seed: 55,
      convergenceThreshold: 0.01,
      bootstrapIterations: 30,
    });
    const strict = analyseConvergence(comps, {
      seed: 55,
      convergenceThreshold: 1e-6,
      bootstrapIterations: 30,
    });

    // Stricter threshold should require at least as many comparisons
    expect(strict.minComparisons).toBeGreaterThanOrEqual(loose.minComparisons);
  });

  it('seed produces deterministic results', () => {
    const comps = generateComparisons(100, ['A', 'B'], [0.6, 0.4], 10, 321);
    const r1 = analyseConvergence(comps, { seed: 42, bootstrapIterations: 20 });
    const r2 = analyseConvergence(comps, { seed: 42, bootstrapIterations: 20 });
    expect(r1.weightVariance).toEqual(r2.weightVariance);
    expect(r1.minComparisons).toEqual(r2.minComparisons);
    expect(r1.meanWeights).toEqual(r2.meanWeights);
  });

  it('custom sampleFractions are respected', () => {
    const comps = generateComparisons(100, ['A', 'B'], [0.7, 0.3], 5, 111);
    const result = analyseConvergence(comps, {
      seed: 111,
      sampleFractions: [0.5, 1.0],
      bootstrapIterations: 20,
    });
    // minComparisons should be one of the tested sizes: 50 or 100
    expect([50, 100]).toContain(result.minComparisons);
  });

  // ── Alice scenario from the paper ──
  it('Alice scenario: convergence with 3-item federal budget', () => {
    const items = ['medical_research', 'military', 'drug_enforcement'];
    // Simulate many citizens with similar views to Alice
    const comps: PairwiseComparison[] = [];
    for (let i = 0; i < 100; i++) {
      comps.push(comp(`user-${i}`, 'medical_research', 'military', 80 + (i % 10), `c-${i}-1`));
      comps.push(comp(`user-${i}`, 'military', 'drug_enforcement', 55 + (i % 10), `c-${i}-2`));
      comps.push(comp(`user-${i}`, 'medical_research', 'drug_enforcement', 88 + (i % 5), `c-${i}-3`));
    }

    const result = analyseConvergence(comps, {
      seed: 42,
      bootstrapIterations: 30,
      convergenceThreshold: 1e-3,
    });

    expect(result.isConverged).toBe(true);
    // Medical research should have highest mean weight
    expect(result.meanWeights['medical_research']!).toBeGreaterThan(
      result.meanWeights['military']!,
    );
    expect(result.meanWeights['military']!).toBeGreaterThan(
      result.meanWeights['drug_enforcement']!,
    );
  });
});
