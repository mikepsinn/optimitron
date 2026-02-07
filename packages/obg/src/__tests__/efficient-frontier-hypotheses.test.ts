/**
 * Hypothesis-driven integration tests for the efficient frontier analysis suite.
 *
 * These tests encode expected real-world findings using realistic data patterns:
 * - Japan and South Korea achieve good health outcomes at low spending (efficient)
 * - The US spends far more than the floor for comparable outcomes (inefficient)
 * - Defense spending shows diminishing returns above a modest floor
 *
 * Uses all three new functions together: findMinimumEffectiveSpending,
 * efficientFrontier, and overspendRatio.
 */

import { describe, it, expect } from 'vitest';
import { findMinimumEffectiveSpending, type SpendingDecileCategory } from '../minimum-effective-spending.js';
import { efficientFrontier, type EfficiencyCategory } from '../efficient-frontier.js';
import { overspendRatio, type CountrySpending } from '../overspend-ratio.js';

// ─── Realistic health spending data (per-capita PPP, stylized) ─────────
// Based on OECD patterns: Japan/Korea spend ~$3-4k, get LE ~84.
// US spends ~$11k, gets LE ~78. Nordics spend ~$6k, get LE ~82.

const healthDeciles: SpendingDecileCategory = {
  categoryId: 'health',
  categoryName: 'Healthcare',
  deciles: [
    { decile: 1, avgSpending: 800, outcome: 65 },    // Low-income countries
    { decile: 2, avgSpending: 1500, outcome: 72 },
    { decile: 3, avgSpending: 2500, outcome: 78 },   // Floor region
    { decile: 4, avgSpending: 3200, outcome: 81 },
    { decile: 5, avgSpending: 3800, outcome: 82 },
    { decile: 6, avgSpending: 4200, outcome: 82.5 },
    { decile: 7, avgSpending: 4800, outcome: 82 },
    { decile: 8, avgSpending: 5500, outcome: 81.5 },
    { decile: 9, avgSpending: 7000, outcome: 81 },
    { decile: 10, avgSpending: 10000, outcome: 77 },  // US-dominated, worse outcomes
  ],
};

const defenseDeciles: SpendingDecileCategory = {
  categoryId: 'defense',
  categoryName: 'Defense',
  deciles: [
    { decile: 1, avgSpending: 50, outcome: 0.9 },    // Conflict risk (lower=better)
    { decile: 2, avgSpending: 200, outcome: 0.3 },
    { decile: 3, avgSpending: 400, outcome: 0.15 },   // Floor
    { decile: 4, avgSpending: 600, outcome: 0.12 },
    { decile: 5, avgSpending: 800, outcome: 0.1 },
    { decile: 6, avgSpending: 1000, outcome: 0.09 },
    { decile: 7, avgSpending: 1200, outcome: 0.08 },
    { decile: 8, avgSpending: 1500, outcome: 0.08 },
    { decile: 9, avgSpending: 1800, outcome: 0.07 },
    { decile: 10, avgSpending: 2200, outcome: 0.07 },
  ],
};

const healthCountries: EfficiencyCategory = {
  categoryId: 'health',
  categoryName: 'Healthcare',
  outcomeDirection: 'higher',
  countries: [
    { countryCode: 'JP', countryName: 'Japan', spending: 3600, outcome: 84.5 },
    { countryCode: 'KR', countryName: 'South Korea', spending: 3200, outcome: 83.7 },
    { countryCode: 'ES', countryName: 'Spain', spending: 3500, outcome: 83.2 },
    { countryCode: 'SE', countryName: 'Sweden', spending: 5800, outcome: 82.8 },
    { countryCode: 'DE', countryName: 'Germany', spending: 6700, outcome: 81.2 },
    { countryCode: 'US', countryName: 'United States', spending: 11000, outcome: 78.5 },
    { countryCode: 'GB', countryName: 'United Kingdom', spending: 4500, outcome: 81.0 },
    { countryCode: 'FR', countryName: 'France', spending: 5200, outcome: 82.5 },
  ],
};

const countrySpendingData: CountrySpending[] = [
  { countryCode: 'JP', countryName: 'Japan', spending: { health: 3600, defense: 400 } },
  { countryCode: 'KR', countryName: 'South Korea', spending: { health: 3200, defense: 750 } },
  { countryCode: 'US', countryName: 'United States', spending: { health: 11000, defense: 2200 } },
  { countryCode: 'SE', countryName: 'Sweden', spending: { health: 5800, defense: 600 } },
  { countryCode: 'DE', countryName: 'Germany', spending: { health: 6700, defense: 500 } },
  { countryCode: 'GB', countryName: 'United Kingdom', spending: { health: 4500, defense: 900 } },
];

// ─── H1: Health spending has a low floor — more spending doesn't help ──

describe('H1: Healthcare floor is much lower than top spenders', () => {
  const floors = findMinimumEffectiveSpending([healthDeciles], {
    outcomeTolerance: 2,
    outcomeDirection: 'higher',
  });

  it('finds a floor below decile 5 (midpoint)', () => {
    const health = floors[0]!;
    expect(health.floorDecile).toBeLessThanOrEqual(5);
  });

  it('floor spending is far below top spending', () => {
    const health = floors[0]!;
    expect(health.floorSpending).toBeLessThan(health.topSpending * 0.5);
  });

  it('top spenders get diminishing returns (the US problem)', () => {
    const health = floors[0]!;
    // The floor achieves nearly the same outcome as the top — proving overspending is waste
    // Gap between floor and top outcome should be small (within tolerance)
    expect(health.outcomeGap).toBeLessThanOrEqual(2);
  });
});

// ─── H2: Japan and Korea rank in the top 3 for health efficiency ───────

describe('H2: Japan/Korea are among the most efficient health spenders', () => {
  const results = efficientFrontier([healthCountries]);
  const health = results[0]!;

  it('Japan ranks in the top 3', () => {
    const jp = health.rankings.find((r) => r.countryCode === 'JP')!;
    expect(jp.rank).toBeLessThanOrEqual(3);
  });

  it('South Korea ranks in the top 3', () => {
    const kr = health.rankings.find((r) => r.countryCode === 'KR')!;
    expect(kr.rank).toBeLessThanOrEqual(3);
  });

  it('US ranks last or near-last', () => {
    const us = health.rankings.find((r) => r.countryCode === 'US')!;
    expect(us.rank).toBeGreaterThanOrEqual(health.rankings.length - 1);
  });

  it('Japan efficiency score is at least 2x the US', () => {
    const jp = health.rankings.find((r) => r.countryCode === 'JP')!;
    const us = health.rankings.find((r) => r.countryCode === 'US')!;
    expect(jp.efficiencyScore / us.efficiencyScore).toBeGreaterThanOrEqual(2);
  });
});

// ─── H3: US massively overspends on health relative to the floor ───────

describe('H3: US overspends on health; Japan is near the floor', () => {
  const floors = findMinimumEffectiveSpending([healthDeciles], {
    outcomeTolerance: 2,
    outcomeDirection: 'higher',
  });
  const results = overspendRatio(floors, countrySpendingData);
  const health = results.byCategory[0]!;

  it('US overspend ratio exceeds 2x', () => {
    const us = health.countries.find((c) => c.countryCode === 'US')!;
    expect(us.overspendRatio).toBeGreaterThan(2);
  });

  it('Japan overspend ratio is near 1.0', () => {
    const jp = health.countries.find((c) => c.countryCode === 'JP')!;
    expect(jp.overspendRatio).toBeGreaterThan(0.8);
    expect(jp.overspendRatio).toBeLessThan(2.0);
  });

  it('US is the highest overspender', () => {
    expect(health.countries[0]!.countryCode).toBe('US');
  });

  it('US excess spending is multiple thousands', () => {
    const us = health.countries.find((c) => c.countryCode === 'US')!;
    expect(us.excessSpending).toBeGreaterThan(5000);
  });
});

// ─── H4: All three functions compose correctly end-to-end ──────────────

describe('H4: End-to-end pipeline composability', () => {
  it('floor → overspend pipeline processes health category', () => {
    const floors = findMinimumEffectiveSpending([healthDeciles], {
      outcomeTolerance: 2,
      outcomeDirection: 'higher',
    });
    const results = overspendRatio(floors, countrySpendingData);
    expect(results.byCategory.length).toBeGreaterThanOrEqual(1);
    for (const r of results.byCategory) {
      expect(r.countries.length).toBeGreaterThan(0);
      expect(r.floorSpending).toBeGreaterThan(0);
    }
  });

  it('efficient frontier + overspend agree on US inefficiency', () => {
    const frontierResults = efficientFrontier([healthCountries]);
    const usRank = frontierResults[0]!.rankings.find((r) => r.countryCode === 'US')!;

    const floors = findMinimumEffectiveSpending([healthDeciles], {
      outcomeTolerance: 2,
      outcomeDirection: 'higher',
    });
    const overspend = overspendRatio(floors, countrySpendingData);
    const usOverspend = overspend.byCategory[0]!.countries.find((c) => c.countryCode === 'US')!;

    // Both analyses should flag US as inefficient
    expect(usRank.rank).toBeGreaterThanOrEqual(frontierResults[0]!.rankings.length - 1);
    expect(usOverspend.overspendRatio).toBeGreaterThan(2);
  });
});
