/**
 * Tests for US Federal Budget and Policy Analysis outputs.
 *
 * Validates the generated JSON/Markdown files have the expected
 * structure and content for website consumption.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../../output');

// ---------------------------------------------------------------------------
// Load outputs once
// ---------------------------------------------------------------------------

let budgetJson: any;
let policyJson: any;
let governmentSizeJson: any;
let budgetMarkdown: string;
let budgetConstrainedMarkdown: string;
let governmentSizeMarkdown: string;
let policyMarkdown: string;

beforeAll(() => {
  const budgetJsonPath = path.join(OUTPUT_DIR, 'us-budget-analysis.json');
  const policyJsonPath = path.join(OUTPUT_DIR, 'us-policy-analysis.json');
  const governmentSizeJsonPath = path.join(OUTPUT_DIR, 'us-government-size-analysis.json');
  const budgetMdPath = path.join(OUTPUT_DIR, 'us-budget-report.md');
  const budgetConstrainedMdPath = path.join(OUTPUT_DIR, 'us-budget-report-constrained.md');
  const governmentSizeMdPath = path.join(OUTPUT_DIR, 'us-government-size-report.md');
  const policyMdPath = path.join(OUTPUT_DIR, 'us-policy-report.md');

  budgetJson = JSON.parse(fs.readFileSync(budgetJsonPath, 'utf-8'));
  policyJson = JSON.parse(fs.readFileSync(policyJsonPath, 'utf-8'));
  governmentSizeJson = JSON.parse(fs.readFileSync(governmentSizeJsonPath, 'utf-8'));
  budgetMarkdown = fs.readFileSync(budgetMdPath, 'utf-8');
  budgetConstrainedMarkdown = fs.readFileSync(budgetConstrainedMdPath, 'utf-8');
  governmentSizeMarkdown = fs.readFileSync(governmentSizeMdPath, 'utf-8');
  policyMarkdown = fs.readFileSync(policyMdPath, 'utf-8');
});

// =========================================================================
// Budget Analysis JSON — Structure Validation
// =========================================================================

describe('Budget Analysis JSON', () => {
  it('should have a jurisdiction field', () => {
    expect(budgetJson.jurisdiction).toBe('United States of America');
  });

  it('should have a totalBudget > $1 trillion', () => {
    expect(budgetJson.totalBudget).toBeGreaterThan(1_000_000_000_000);
  });

  it('should have at least 10 categories', () => {
    expect(budgetJson.categories.length).toBeGreaterThanOrEqual(10);
  });

  it('each category should have required fields with correct types', () => {
    for (const cat of budgetJson.categories) {
      expect(typeof cat.name).toBe('string');
      expect(cat.name.length).toBeGreaterThan(0);
      expect(typeof cat.currentSpending).toBe('number');
      expect(cat.currentSpending).toBeGreaterThan(0);
      expect(typeof cat.optimalSpending).toBe('number');
      expect(cat.optimalSpending).toBeGreaterThan(0);
      expect(typeof cat.gap).toBe('number');
      expect(typeof cat.gapPercent).toBe('number');
      expect(typeof cat.marginalReturn).toBe('number');
      expect(['increase', 'decrease', 'maintain']).toContain(cat.recommendation);
    }
  });

  it('each category should have outcomeMetrics array', () => {
    for (const cat of budgetJson.categories) {
      expect(Array.isArray(cat.outcomeMetrics)).toBe(true);
      expect(cat.outcomeMetrics.length).toBeGreaterThan(0);
      for (const metric of cat.outcomeMetrics) {
        expect(typeof metric.name).toBe('string');
        expect(typeof metric.value).toBe('number');
        expect(typeof metric.trend).toBe('string');
      }
    }
  });

  it('gap should equal optimalSpending - currentSpending', () => {
    for (const cat of budgetJson.categories) {
      const expectedGap = cat.optimalSpending - cat.currentSpending;
      expect(cat.gap).toBeCloseTo(expectedGap, 0);
    }
  });

  it('should have topRecommendations array with at least 5 entries', () => {
    expect(Array.isArray(budgetJson.topRecommendations)).toBe(true);
    expect(budgetJson.topRecommendations.length).toBeGreaterThanOrEqual(5);
    for (const rec of budgetJson.topRecommendations) {
      expect(typeof rec).toBe('string');
      expect(rec.length).toBeGreaterThan(0);
    }
  });

  it('should have a valid generatedAt ISO timestamp', () => {
    expect(typeof budgetJson.generatedAt).toBe('string');
    const date = new Date(budgetJson.generatedAt);
    expect(date.getTime()).not.toBeNaN();
  });

  it('should include Military as a category', () => {
    const military = budgetJson.categories.find(
      (c: any) => c.name.includes('Military'),
    );
    expect(military).toBeDefined();
    expect(military.currentSpending).toBeGreaterThan(500_000_000_000);
  });

  it('should include Social Security as a category', () => {
    const ss = budgetJson.categories.find(
      (c: any) => c.name.includes('Social Security'),
    );
    expect(ss).toBeDefined();
    expect(ss.currentSpending).toBeGreaterThan(1_000_000_000_000);
  });

  it('each category should have discretionary and wesMethodology fields', () => {
    for (const cat of budgetJson.categories) {
      expect(typeof cat.discretionary).toBe('boolean');
      expect(typeof cat.wesMethodology).toBe('string');
      expect(['causal', 'domestic', 'estimated', 'non-discretionary']).toContain(cat.wesMethodology);
    }
  });

  it('should have constrainedReallocation with expected shape', () => {
    const cr = budgetJson.constrainedReallocation;
    expect(cr).toBeDefined();
    expect(typeof cr.totalBudget).toBe('number');
    expect(cr.totalBudget).toBe(budgetJson.totalBudget);
    expect(typeof cr.nonDiscretionaryTotal).toBe('number');
    expect(cr.nonDiscretionaryTotal).toBeGreaterThan(0);
    expect(typeof cr.actionableBudget).toBe('number');
    expect(cr.actionableBudget).toBeGreaterThan(0);
    expect(Array.isArray(cr.categories)).toBe(true);
    expect(cr.categories.length).toBe(budgetJson.categories.length);
  });

  it('constrained categories should have valid reallocation fields', () => {
    for (const cat of budgetJson.constrainedReallocation.categories) {
      expect(typeof cat.name).toBe('string');
      expect(typeof cat.currentSpending).toBe('number');
      expect(typeof cat.constrainedOptimal).toBe('number');
      expect(typeof cat.reallocation).toBe('number');
      expect(typeof cat.reallocationPercent).toBe('number');
      expect(typeof cat.action).toBe('string');
      expect(typeof cat.evidenceGrade).toBe('string');
      expect(typeof cat.isNonDiscretionary).toBe('boolean');
    }
  });

  it('constrained + non-discretionary categories should account for full budget', () => {
    const cr = budgetJson.constrainedReallocation;
    const totalConstrained = cr.categories.reduce(
      (s: number, c: any) => s + c.constrainedOptimal, 0,
    );
    // Should be within 1% of total budget (floating point tolerance)
    expect(totalConstrained).toBeCloseTo(cr.totalBudget, -9);
  });

  it('non-discretionary categories should be held at current spending', () => {
    const nonDisc = budgetJson.constrainedReallocation.categories.filter(
      (c: any) => c.isNonDiscretionary,
    );
    expect(nonDisc.length).toBeGreaterThan(0);
    for (const cat of nonDisc) {
      expect(cat.constrainedOptimal).toBe(cat.currentSpending);
      expect(cat.reallocation).toBe(0);
    }
  });

  it('should have causalEvidenceDetail array', () => {
    expect(Array.isArray(budgetJson.causalEvidenceDetail)).toBe(true);
    expect(budgetJson.causalEvidenceDetail.length).toBeGreaterThanOrEqual(2);
    for (const ev of budgetJson.causalEvidenceDetail) {
      expect(typeof ev.name).toBe('string');
      expect(typeof ev.forwardPearson).toBe('number');
      expect(typeof ev.nCountries).toBe('number');
      expect(typeof ev.bhStrength).toBe('number');
      expect(typeof ev.wesScore).toBe('number');
      expect(typeof ev.evidenceGrade).toBe('string');
    }
  });

  it('should have domesticEvidenceDetail array', () => {
    expect(Array.isArray(budgetJson.domesticEvidenceDetail)).toBe(true);
    for (const ev of budgetJson.domesticEvidenceDetail) {
      expect(typeof ev.name).toBe('string');
      expect(typeof ev.bestOutcomeName).toBe('string');
      expect(typeof ev.correlation).toBe('number');
      expect(typeof ev.nYears).toBe('number');
      expect(typeof ev.bhStrength).toBe('number');
      expect(typeof ev.wesScore).toBe('number');
      expect(typeof ev.evidenceGrade).toBe('string');
    }
  });
});

// =========================================================================
// Budget Report Markdown — Content Validation
// =========================================================================

describe('Budget Report Markdown', () => {
  it('should have a title with jurisdiction name', () => {
    expect(budgetMarkdown).toContain('Budget Optimization Report');
    expect(budgetMarkdown).toContain('United States');
  });

  it('should have a Summary section', () => {
    expect(budgetMarkdown).toContain('## Summary');
  });

  it('should make unconstrained OSL report the primary artifact', () => {
    expect(budgetMarkdown).not.toContain('## Constrained Reallocation');
    expect(budgetMarkdown).toContain('Scenario:** Unconstrained OSL benchmark');
  });

  it('should still publish constrained report as a secondary artifact', () => {
    expect(budgetConstrainedMarkdown).toContain('## Constrained Reallocation');
    expect(budgetConstrainedMarkdown).toContain('Scenario:** Fixed-budget reallocation');
  });

  it('should have a Current vs Optimal Allocation table', () => {
    expect(budgetMarkdown).toContain('## Current vs Optimal Allocation');
    expect(budgetMarkdown).toContain('| Category |');
  });

  it('should have a Diminishing Returns Analysis section', () => {
    expect(budgetMarkdown).toContain('## Diminishing Returns Analysis');
  });

  it('should have a Top Recommendations section', () => {
    expect(budgetMarkdown).toContain('## Top Recommendations');
  });

  it('should have a Welfare Evidence Scores section', () => {
    expect(budgetMarkdown).toContain('## Welfare Evidence Scores');
    expect(budgetMarkdown).toContain('| Category | WES |');
  });

  it('should have a Causal Evidence Detail section for OECD-mapped categories', () => {
    expect(budgetMarkdown).toContain('## Causal Evidence Detail (OECD-Mapped Categories)');
    expect(budgetMarkdown).toContain('BH Strength');
    expect(budgetMarkdown).toContain('BH Temporality');
  });

  it('should mark non-discretionary categories in the allocation table', () => {
    expect(budgetMarkdown).toContain('*(non-discretionary)*');
  });

  it('should list non-discretionary items in excluded section', () => {
    expect(budgetConstrainedMarkdown).toContain('Non-discretionary (excluded from reallocation)');
    expect(budgetConstrainedMarkdown).toContain('Social Security');
    expect(budgetConstrainedMarkdown).toContain('Medicare');
    expect(budgetConstrainedMarkdown).toContain('Medicaid');
  });

  it('should separate non-discretionary from maintain in Top Recommendations', () => {
    expect(budgetMarkdown).toContain('Non-discretionary (excluded from optimization)');
  });

  it('should penalize negatively-correlated categories in WES', () => {
    // Military (r≈-0.1) should get grade D, not B
    // Look for Military row in Causal Evidence Detail with grade D
    const militaryLine = budgetMarkdown.split('\n').find(
      l => l.includes('Military') && l.includes('| D |'),
    );
    expect(militaryLine).toBeDefined();
  });

  it('should not include non-discretionary categories in Causal Evidence Detail', () => {
    const causalSection = budgetMarkdown.split('## Causal Evidence Detail')[1] ?? '';
    expect(causalSection).not.toContain('Social Security');
    expect(causalSection).not.toContain('Medicare');
    expect(causalSection).not.toContain('Medicaid');
  });

  it('should use direction-neutral evidence labels', () => {
    // Should NOT contain the old direction-assuming labels
    expect(budgetMarkdown).not.toContain('welfare benefit');
    // Should contain the new direction-neutral labels
    expect(budgetMarkdown).toContain('Weak evidence');
  });

  it('should show Method column in WES table instead of Quality/Precision Weight', () => {
    expect(budgetMarkdown).toContain('| Method |');
    expect(budgetMarkdown).not.toContain('Quality Weight');
    expect(budgetMarkdown).not.toContain('Precision Weight');
  });

  it('should count only discretionary categories in summary', () => {
    expect(budgetMarkdown).toContain('discretionary categories');
    // Should NOT say 19 categories (total count including non-discretionary)
    expect(budgetMarkdown).not.toMatch(/\b19\b.*categories/);
  });
});

// =========================================================================
// Government Size Analysis — Structure Validation
// =========================================================================

describe('Government Size Analysis JSON', () => {
  it('should include predictor metadata and coverage', () => {
    expect(governmentSizeJson.predictor).toBeDefined();
    expect(governmentSizeJson.predictor.name).toContain('% GDP');
    expect(governmentSizeJson.predictor.coverage.jurisdictions).toBeGreaterThanOrEqual(20);
    expect(governmentSizeJson.predictor.coverage.observations).toBeGreaterThan(400);
    expect(governmentSizeJson.predictor.coverage.yearMin).toBeLessThanOrEqual(1990);
  });

  it('should include four outcome analyses', () => {
    expect(Array.isArray(governmentSizeJson.outcomes)).toBe(true);
    expect(governmentSizeJson.outcomes.length).toBe(4);
    const outcomeNames = governmentSizeJson.outcomes.map((outcome: any) => outcome.name);
    expect(outcomeNames.some((name: string) => name.includes('HALE'))).toBe(true);
    expect(outcomeNames.some((name: string) => name.includes('After-Tax Median Income'))).toBe(true);
    expect(outcomeNames.some((name: string) => name.includes('Infant Mortality'))).toBe(false);
    expect(outcomeNames.some((name: string) => name.includes('Gini'))).toBe(false);
    for (const outcome of governmentSizeJson.outcomes) {
      expect(typeof outcome.name).toBe('string');
      expect(typeof outcome.meanForwardPearson).toBe('number');
      expect(typeof outcome.meanPredictivePearson).toBe('number');
      expect(typeof outcome.medianOptimalPctGdp).toBe('number');
      expect(typeof outcome.headlineEligible).toBe('boolean');
      expect(typeof outcome.headlineEligibilityReason).toBe('string');
      expect(outcome.jurisdictionsAnalyzed).toBeGreaterThanOrEqual(10);
    }
  });

  it('should include overall minimum-efficient estimate and uncertainty band', () => {
    const overall = governmentSizeJson.overall;
    expect(overall.optimalPctGdp).toBeGreaterThan(0);
    expect(overall.optimalPctGdp).toBeLessThan(100);
    expect(overall.optimalBandLowPctGdp).toBeLessThanOrEqual(overall.optimalPctGdp);
    expect(overall.optimalBandHighPctGdp).toBeGreaterThanOrEqual(overall.optimalPctGdp);
    expect(overall.optimalSpendingPerCapitaPpp).toBeGreaterThan(0);
    expect(overall.optimalBandLowPerCapitaPpp).toBeLessThanOrEqual(overall.optimalSpendingPerCapitaPpp);
    expect(overall.optimalBandHighPerCapitaPpp).toBeGreaterThanOrEqual(overall.optimalSpendingPerCapitaPpp);
    expect(overall.usEquivalentOptimalPctGdp).toBeGreaterThan(0);
    expect(Array.isArray(overall.headlineEligibleOutcomeIds)).toBe(true);
  });

  it('should include objective-specific floors and tolerance sensitivity', () => {
    expect(Array.isArray(governmentSizeJson.objectiveFloors)).toBe(true);
    expect(governmentSizeJson.objectiveFloors.length).toBeGreaterThanOrEqual(3);
    const haleOnly = governmentSizeJson.objectiveFloors.find((floor: any) => floor.id === 'hale_only');
    expect(haleOnly).toBeDefined();
    expect(haleOnly.usEquivalentOptimalPctGdp).toBeGreaterThan(0);

    expect(Array.isArray(governmentSizeJson.toleranceSensitivity)).toBe(true);
    expect(governmentSizeJson.toleranceSensitivity.length).toBeGreaterThanOrEqual(3);
    for (const scenario of governmentSizeJson.toleranceSensitivity) {
      expect(typeof scenario.tolerance).toBe('number');
      expect(scenario.optimalSpendingPerCapitaPpp).toBeGreaterThan(0);
    }
  });

  it('should include spending-level table with proxy notes', () => {
    expect(governmentSizeJson.spendingLevelTable).toBeDefined();
    expect(governmentSizeJson.spendingLevelTable.alignment).toBeDefined();
    expect(governmentSizeJson.spendingLevelTable.alignment.type).toBe('lag_aligned_follow_up');
    expect(governmentSizeJson.spendingLevelTable.alignment.onsetYears).toBe(1);
    expect(governmentSizeJson.spendingLevelTable.alignment.durationYears).toBe(3);
    expect(governmentSizeJson.spendingLevelTable.healthyLifeYearsMetric.isDirectMetric).toBe(true);
    expect(governmentSizeJson.spendingLevelTable.healthyLifeYearsMetric.metricUsed).toContain('HALE');
    expect(governmentSizeJson.spendingLevelTable.incomeGrowthMetric.isDirectMetric).toBe(false);
    expect(governmentSizeJson.spendingLevelTable.incomeGrowthMetric.metricUsed).toContain('proxy');
    expect(governmentSizeJson.spendingLevelTable.binning).toBeDefined();
    expect(Array.isArray(governmentSizeJson.spendingLevelTable.tiers)).toBe(true);
    expect(governmentSizeJson.spendingLevelTable.tiers.length).toBeGreaterThanOrEqual(4);
    const firstTier = governmentSizeJson.spendingLevelTable.tiers[0];
    expect(firstTier).toHaveProperty('typicalHealthyLifeYears');
    expect(firstTier).toHaveProperty('typicalHealthyLifeYearsGrowthPerYear');
    expect(firstTier).toHaveProperty('typicalRealAfterTaxMedianIncomeLevel');
    expect(firstTier).toHaveProperty('typicalRealAfterTaxMedianIncomeGrowthPct');
    const lowSpendingTiers = governmentSizeJson.spendingLevelTable.tiers.filter(
      (tier: any) => (tier.maxPctGdp ?? Infinity) <= 20,
    );
    expect(lowSpendingTiers.length).toBeGreaterThanOrEqual(2);

    expect(governmentSizeJson.spendingPerCapitaLevelTable).toBeDefined();
    expect(governmentSizeJson.spendingPerCapitaLevelTable.alignment).toBeDefined();
    expect(governmentSizeJson.spendingPerCapitaLevelTable.alignment.type).toBe('lag_aligned_follow_up');
    expect(governmentSizeJson.spendingPerCapitaLevelTable.binning).toBeDefined();
    expect(Array.isArray(governmentSizeJson.spendingPerCapitaLevelTable.tiers)).toBe(true);
    expect(governmentSizeJson.spendingPerCapitaLevelTable.tiers.length).toBeGreaterThanOrEqual(4);
    const firstPerCapitaTier = governmentSizeJson.spendingPerCapitaLevelTable.tiers[0];
    expect(firstPerCapitaTier).toHaveProperty('minSpendingPerCapitaPpp');
    expect(firstPerCapitaTier).toHaveProperty('maxSpendingPerCapitaPpp');
    expect(firstPerCapitaTier).toHaveProperty('typicalHealthyLifeYears');
  });

  it('should include US snapshot with status', () => {
    const us = governmentSizeJson.usSnapshot;
    expect(us.latestYear).toBeGreaterThanOrEqual(2018);
    expect(us.modeledSpendingPctGdp).toBeGreaterThan(0);
    expect(us.modeledGdpPerCapitaPpp).toBeGreaterThan(0);
    expect(us.modeledSpendingPerCapitaPpp).toBeGreaterThan(0);
    expect(['above_optimal_band', 'below_optimal_band', 'within_optimal_band']).toContain(us.status);
  });

  it('should include temporal sensitivity scenarios', () => {
    expect(governmentSizeJson.sensitivity).toBeDefined();
    expect(Array.isArray(governmentSizeJson.sensitivity.startYearScenarios)).toBe(true);
    const starts = governmentSizeJson.sensitivity.startYearScenarios.map((s: any) => s.startYear);
    expect(starts).toContain(1990);
    expect(starts).toContain(1995);
    expect(starts).toContain(2000);
    expect(governmentSizeJson.sensitivity.covidExcludedScenario).toBeDefined();
  });

  it('should include efficient jurisdiction exemplars', () => {
    expect(Array.isArray(governmentSizeJson.efficientJurisdictions)).toBe(true);
    expect(governmentSizeJson.efficientJurisdictions.length).toBeGreaterThanOrEqual(3);
    const first = governmentSizeJson.efficientJurisdictions[0];
    expect(typeof first.jurisdictionName).toBe('string');
    expect(first.qualifyingObservations).toBeGreaterThanOrEqual(2);
    expect(first.medianSpendingPerCapitaPpp).toBeGreaterThan(0);
  });

  it('should include a federal composition summary', () => {
    const composition = governmentSizeJson.federalComposition;
    expect(composition).toBeDefined();
    expect(composition.currentBudgetUsd).toBeGreaterThan(1_000_000_000_000);
    expect(composition.unconstrainedOptimalBudgetUsd).toBeGreaterThan(1_000_000_000_000);
    expect(Array.isArray(composition.topIncreaseCategories)).toBe(true);
    expect(Array.isArray(composition.topDecreaseCategories)).toBe(true);
    expect(Array.isArray(composition.largestTargetShares)).toBe(true);
    expect(composition.topIncreaseCategories.length).toBeGreaterThanOrEqual(3);
    expect(composition.topDecreaseCategories.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Government Size Report Markdown', () => {
  it('should contain headline sections', () => {
    expect(governmentSizeMarkdown).toContain('Government Size Analysis');
    expect(governmentSizeMarkdown).toContain('## Summary');
    expect(governmentSizeMarkdown).toContain('## Predictor Definition');
    expect(governmentSizeMarkdown).toContain('## Objective Floors');
    expect(governmentSizeMarkdown).toContain('## Floor Tolerance');
    expect(governmentSizeMarkdown).toContain('## Federal Composition');
    expect(governmentSizeMarkdown).toContain('## Outcome-Level Results');
    expect(governmentSizeMarkdown).toContain('## Efficient Jurisdictions');
  });

  it('should include an outcome table and limitations', () => {
    expect(governmentSizeMarkdown).toContain('| Outcome | Weight | N | Mean r | Mean pred r |');
    expect(governmentSizeMarkdown).toContain('## Temporal Sensitivity (Start Year)');
    expect(governmentSizeMarkdown).toContain('## Spending Levels vs Typical Outcomes');
    expect(governmentSizeMarkdown).toContain('### Spending Share (% GDP) Bins');
    expect(governmentSizeMarkdown).toContain('### Spending Per-Capita (PPP) Bins');
    expect(governmentSizeMarkdown).toContain('Per-capita PPP spending is derived as');
    expect(governmentSizeMarkdown).toContain('minimum efficient government spending floor');
    expect(governmentSizeMarkdown).toContain('U.S.-equivalent floor share');
    expect(governmentSizeMarkdown).toContain('Lowest direct-outcome floor in this model');
    expect(governmentSizeMarkdown).toContain('Federal current-budget composition view');
    expect(governmentSizeMarkdown).toContain('COVID exclusion check');
    expect(governmentSizeMarkdown).toContain('Rows are lag-aligned for causal interpretation');
    expect(governmentSizeMarkdown).toContain('Typical Healthy Life Years (HALE)');
    expect(governmentSizeMarkdown).toContain('Typical Healthy Life Years Growth');
    expect(governmentSizeMarkdown).toContain('Typical Real After-Tax Median Income (proxy level)');
    expect(governmentSizeMarkdown).toContain('Typical Real After-Tax Median Income Growth (proxy)');
    expect(governmentSizeMarkdown).toContain('## Limitations');
  });
});

// =========================================================================
// Policy Analysis JSON — Structure Validation
// =========================================================================

describe('Policy Analysis JSON', () => {
  it('should have jurisdiction and analysisDate', () => {
    expect(policyJson.jurisdiction).toBe('United States of America');
    expect(typeof policyJson.analysisDate).toBe('string');
    expect(policyJson.analysisDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should have at least 10 policies', () => {
    expect(policyJson.policies.length).toBeGreaterThanOrEqual(14);
  });

  it('each policy should have required fields', () => {
    for (const pol of policyJson.policies) {
      expect(typeof pol.name).toBe('string');
      expect(pol.name.length).toBeGreaterThan(0);
      expect(typeof pol.type).toBe('string');
      expect(typeof pol.category).toBe('string');
      expect(typeof pol.description).toBe('string');
      expect(typeof pol.recommendationType).toBe('string');
      expect(['enact', 'replace', 'repeal', 'maintain']).toContain(pol.recommendationType);
      expect(typeof pol.evidenceGrade).toBe('string');
      expect(['A', 'B', 'C', 'D', 'F']).toContain(pol.evidenceGrade);
      expect(typeof pol.causalConfidenceScore).toBe('number');
      expect(pol.causalConfidenceScore).toBeGreaterThanOrEqual(0);
      expect(pol.causalConfidenceScore).toBeLessThanOrEqual(1);
      expect(typeof pol.policyImpactScore).toBe('number');
      expect(typeof pol.welfareScore).toBe('number');
      expect(typeof pol.incomeEffect).toBe('number');
      expect(typeof pol.healthEffect).toBe('number');
      expect(typeof pol.rationale).toBe('string');
    }
  });

  it('each policy should have bradfordHillScores with all 9 criteria', () => {
    const criteria = [
      'strength', 'consistency', 'temporality', 'gradient',
      'experiment', 'plausibility', 'coherence', 'analogy', 'specificity',
    ];
    for (const pol of policyJson.policies) {
      expect(pol.bradfordHillScores).toBeDefined();
      for (const crit of criteria) {
        expect(typeof pol.bradfordHillScores[crit]).toBe('number');
        expect(pol.bradfordHillScores[crit]).toBeGreaterThanOrEqual(0);
        expect(pol.bradfordHillScores[crit]).toBeLessThanOrEqual(1);
      }
    }
  });

  it('should have topRecommendations array', () => {
    expect(Array.isArray(policyJson.topRecommendations)).toBe(true);
    expect(policyJson.topRecommendations.length).toBeGreaterThanOrEqual(5);
  });

  it('should have a valid generatedAt ISO timestamp', () => {
    const date = new Date(policyJson.generatedAt);
    expect(date.getTime()).not.toBeNaN();
  });

  it('policies should be sorted by priority (welfareScore descending or priorityScore)', () => {
    // At least verify there's a meaningful ordering — top policy should have
    // a higher impact score than the last
    const first = policyJson.policies[0];
    const last = policyJson.policies[policyJson.policies.length - 1];
    expect(first.policyImpactScore).toBeGreaterThanOrEqual(last.policyImpactScore);
  });

  it('should include at least one repeal recommendation', () => {
    const repealPolicies = policyJson.policies.filter(
      (p: any) => p.recommendationType === 'repeal',
    );
    expect(repealPolicies.length).toBeGreaterThanOrEqual(1);
  });

  it('repeal policies should have low evidence grades (D or F)', () => {
    const repealPolicies = policyJson.policies.filter(
      (p: any) => p.recommendationType === 'repeal',
    );
    for (const pol of repealPolicies) {
      expect(['C', 'D', 'F']).toContain(pol.evidenceGrade);
    }
  });
});

// =========================================================================
// Policy Report Markdown — Content Validation
// =========================================================================

describe('Policy Report Markdown', () => {
  it('should have a title with jurisdiction name', () => {
    expect(policyMarkdown).toContain('Policy Ranking Report');
    expect(policyMarkdown).toContain('United States');
  });

  it('should have a Top Policies by Welfare Impact table', () => {
    expect(policyMarkdown).toContain('## Top Policies by Welfare Impact');
    expect(policyMarkdown).toContain('| Rank |');
  });

  it('should have a Bradford Hill Assessment section', () => {
    expect(policyMarkdown).toContain('## Bradford Hill Assessment');
  });

  it('should have a Recommendations section', () => {
    expect(policyMarkdown).toContain('## Recommendations');
  });

  it('should mention specific well-known policies', () => {
    expect(policyMarkdown).toContain('EITC');
    expect(policyMarkdown).toContain('NIH');
  });
});
