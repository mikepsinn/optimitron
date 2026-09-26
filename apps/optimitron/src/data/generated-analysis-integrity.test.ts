import { describe, expect, it } from 'vitest';
import { oecdBudgetPanelToSpendingOutcome, STRUCTURAL_POLICY_REFORMS } from '@optimitron/data';
import { BudgetAnalysisOutputSchema, PolicyAnalysisOutputSchema } from '@/lib/generated-analysis-schemas';
import { usBudgetAnalysis } from './us-budget-analysis';
import { usPolicyAnalysis } from './us-policy-analysis';

// Guards the shipped generator output, not mocked policy estimates.
describe('generated budget and policy analysis', () => {
  it('preserves source fractional assumptions and never assigns calibrated scores', () => {
    for (const source of STRUCTURAL_POLICY_REFORMS) {
      const policy = usPolicyAnalysis.policies.find(p => p.name === source.name);
      expect(policy?.evidenceKind, source.name).toBe('assumption');
      expect(policy?.incomeEffect, source.name).toBe(source.incomeEffect);
      expect(policy?.healthEffect, source.name).toBe(source.healthEffect);
    }
    for (const policy of usPolicyAnalysis.policies) {
      expect(policy.evidenceGrade, policy.name).toBeNull();
      expect(policy.causalConfidenceScore, policy.name).toBeNull();
      expect(policy.policyImpactScore, policy.name).toBeNull();
      expect(policy.welfareScore, policy.name).toBeNull();
      expect(policy.bradfordHillScores, policy.name).toEqual({});
    }
  });

  it('emits at most one comparison per field without converting peer gaps into effects', () => {
    const comparisons = usPolicyAnalysis.policies.filter(p => p.evidenceKind === 'comparison');
    expect(comparisons.length).toBeGreaterThan(0);
    const fields = comparisons.map(p => p.oecdSpendingField);
    expect(new Set(fields).size).toBe(fields.length);
    for (const policy of comparisons) {
      expect(policy.oecdSpendingField, policy.name).toBeTruthy();
      expect(policy.incomeEffect, policy.name).toBeNull();
      expect(policy.healthEffect, policy.name).toBeNull();
      expect(policy.recommendationType, policy.name).toBe('compare');
    }
  });

  it('does not publish peer ratios as optimized federal targets or fabricated frontier deciles', () => {
    expect(usBudgetAnalysis.efficientFrontier).toBeUndefined();
    for (const category of usBudgetAnalysis.categories) {
      expect(category.optimalSpendingNominal, category.id).toBeNull();
      expect(category.optimalSpendingPerCapita, category.id).toBeNull();
      expect(category.gap, category.id).toBe(0); // Legacy sentinel, not estimated savings.
      expect(category.recommendation, category.id).toBe(category.efficiency ? 'comparison_only' : 'no_comparison');
    }
    expect(usBudgetAnalysis.topRecommendations.every(text => !/saves \$|savings: \$/i.test(text))).toBe(true);
  });

  it('reports exact sparse income years without substituting life expectancy', () => {
    const incomeFields = new Set(['socialSpendingPerCapitaPpp', 'rdSpendingPerCapitaPpp']);
    const categories = usBudgetAnalysis.categories.filter(c => incomeFields.has(c.oecdBenchmark?.spendingField ?? ''));
    expect(categories.length).toBeGreaterThan(0);
    for (const category of categories) {
      const benchmark = category.oecdBenchmark!;
      const efficiency = category.efficiency!;
      expect(efficiency.outcomeName).toContain('disposable income');
      const field = benchmark.spendingField as 'socialSpendingPerCapitaPpp' | 'rdSpendingPerCapitaPpp';
      const data = oecdBudgetPanelToSpendingOutcome(field, 'afterTaxMedianIncomePpp');
      const target = data.filter(d => d.jurisdiction === 'USA').slice(-3);
      const peer = data.filter(d => d.jurisdiction === efficiency.bestCountry.code).slice(-3);
      expect(benchmark.comparisonYears).toEqual({ target: target.map(d => d.year), peer: peer.map(d => d.year) });
      expect(efficiency.outcome).toBeCloseTo(target.reduce((sum, d) => sum + d.outcome, 0) / target.length, 0);
    }
  });

  it('validates missing estimates through the shared runtime schemas', () => {
    expect(PolicyAnalysisOutputSchema.safeParse(usPolicyAnalysis).success).toBe(true);
    expect(BudgetAnalysisOutputSchema.safeParse(usBudgetAnalysis).success).toBe(true);
  });
});
