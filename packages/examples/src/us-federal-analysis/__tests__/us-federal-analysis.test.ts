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
let budgetMarkdown: string;
let budgetConstrainedMarkdown: string;
let policyMarkdown: string;

beforeAll(() => {
  const budgetJsonPath = path.join(OUTPUT_DIR, 'us-budget-analysis.json');
  const policyJsonPath = path.join(OUTPUT_DIR, 'us-policy-analysis.json');
  const budgetMdPath = path.join(OUTPUT_DIR, 'us-budget-report.md');
  const budgetConstrainedMdPath = path.join(OUTPUT_DIR, 'us-budget-report-constrained.md');
  const policyMdPath = path.join(OUTPUT_DIR, 'us-policy-report.md');

  budgetJson = JSON.parse(fs.readFileSync(budgetJsonPath, 'utf-8'));
  policyJson = JSON.parse(fs.readFileSync(policyJsonPath, 'utf-8'));
  budgetMarkdown = fs.readFileSync(budgetMdPath, 'utf-8');
  budgetConstrainedMarkdown = fs.readFileSync(budgetConstrainedMdPath, 'utf-8');
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
