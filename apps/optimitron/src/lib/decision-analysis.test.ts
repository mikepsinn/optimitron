import { describe, expect, it } from 'vitest';
import {
  formatDecisionInterval,
  formatDecisionMoney,
  generateDecisionMarkdown,
  type DecisionReport,
  type SimulationSummary,
} from '@optimitron/obg';
import { scenarioInputs } from '../../../../packages/data/src/datasets/us-policy-scenario-inputs.js';
import { generateDecisionAnalysis } from '../../scripts/analysis/generate-decision-analysis.js';
import { FEDERAL_BUDGET_BASELINE, MILITARY_FUNDING_SCENARIOS } from '../../scripts/analysis/budget-baseline.js';

const options = { draws: 300, seed: 317, generatedAt: '2026-09-26T00:00:00.000Z' };
const report = generateDecisionAnalysis(options);
const cents = (value: number) => Math.round(value * 100);

function expectFiniteSummary(summary: SimulationSummary): void {
  expect(Object.values(summary).every(Number.isFinite)).toBe(true);
  expect(summary.p05).toBeLessThanOrEqual(summary.median);
  expect(summary.median).toBeLessThanOrEqual(summary.p95);
  expect(summary.probabilityPositive).toBeGreaterThanOrEqual(0);
  expect(summary.probabilityPositive).toBeLessThanOrEqual(1);
}

describe('integrated budget and policy decision report', () => {
  it('reproduces the complete serialized result from the same seed and generation date', () => {
    expect(generateDecisionAnalysis(options)).toEqual(report);
    expect(report.seed).toBe(options.seed);
    expect(report.draws).toBe(options.draws);
    expect(report.generatedAt).toBe(options.generatedAt);
  });

  it('balances the entire federal ledger under every funding ceiling while protecting existing accounts', () => {
    expect(report.scenarios.map(scenario => scenario.id)).toEqual(MILITARY_FUNDING_SCENARIOS.map(scenario => scenario.id));
    expect(report.baselineOutlaysUsd).toBe(FEDERAL_BUDGET_BASELINE.totalOutlaysUsd);
    for (const scenario of report.scenarios) {
      const source = MILITARY_FUNDING_SCENARIOS.find(candidate => candidate.id === scenario.id)!;
      expect(scenario.budgetCeilingUsd).toBe(source.maximumReallocationUsd);
      expect(scenario.annualCostUsd).toBeGreaterThanOrEqual(0);
      expect(scenario.annualCostUsd).toBeLessThanOrEqual(scenario.budgetCeilingUsd);
      expect(cents(scenario.unspentUsd + scenario.annualCostUsd)).toBe(cents(scenario.budgetCeilingUsd));
      expect(scenario.ledger).toHaveLength(FEDERAL_BUDGET_BASELINE.lines.length);
      expect(new Set(scenario.ledger.map(line => line.id)).size).toBe(scenario.ledger.length);
      expect(scenario.ledger.reduce((sum, line) => sum + cents(line.baselineUsd), 0)).toBe(cents(report.baselineOutlaysUsd));
      expect(scenario.ledger.reduce((sum, line) => sum + cents(line.proposedUsd), 0)).toBe(cents(report.baselineOutlaysUsd));
      expect(scenario.allocations.reduce((sum, allocation) => sum + cents(allocation.amountUsd), 0)).toBe(cents(scenario.annualCostUsd));
      expect(scenario.selectedOptionIds).toHaveLength(scenario.allocations.length);
      for (const baseline of FEDERAL_BUDGET_BASELINE.lines) {
        const line = scenario.ledger.find(candidate => candidate.id === baseline.id)!;
        expect(line.baselineUsd).toBe(baseline.annualOutlaysUsd);
        expect(line.proposedUsd).toBeGreaterThanOrEqual(0);
        if (baseline.protected) expect(line.proposedUsd).toBeGreaterThanOrEqual(line.baselineUsd);
        if (baseline.sourceType === 'mandatory' || baseline.sourceType === 'net_interest' || baseline.sourceType === 'reconciliation') {
          expect(line.proposedUsd).toBe(line.baselineUsd);
        }
        if (baseline.id === 'military') {
          expect(cents(line.baselineUsd - line.proposedUsd)).toBe(cents(scenario.annualCostUsd));
        }
      }
    }
    const statusQuo = report.scenarios.find(scenario => scenario.budgetCeilingUsd === 0)!;
    expect(statusQuo.allocations).toEqual([]);
    expect(statusQuo.annualCostUsd).toBe(0);
    expect(statusQuo.netBenefit.mean).toBe(0);
  });

  it('selects at most one clinical alternative and excludes noncomparable housing transfers', () => {
    const clinicalIds = report.policies.filter(policy => policy.overlapGroup === 'clinical-trial-discovery').map(policy => policy.id);
    expect(clinicalIds).toHaveLength(2);
    const isClinical = (optionId: string) => optionId === 'clinical-joint' || clinicalIds.some(id => optionId === id || optionId.startsWith(`${id}:`));
    const ineligible = report.policies.filter(policy => !policy.allocationEligible).map(policy => policy.id);
    expect(ineligible).toContain('housing-supply-deregulation');
    for (const scenario of [...report.scenarios, ...report.sensitivity]) {
      expect(scenario.selectedOptionIds.filter(isClinical).length).toBeLessThanOrEqual(1);
      for (const id of ineligible) expect(scenario.selectedOptionIds.some(option => option.startsWith(`${id}:`))).toBe(false);
    }
    for (const scenario of report.scenarios) {
      for (const allocation of scenario.allocations) {
        const cap = allocation.policyId === 'clinical-joint'
          ? report.policies.filter(policy => clinicalIds.includes(policy.id)).reduce((sum, policy) => sum + policy.annualFundingCapUsd, 0)
          : report.policies.find(policy => policy.id === allocation.policyId)!.annualFundingCapUsd;
        expect(allocation.amountUsd).toBeGreaterThan(0);
        expect(allocation.amountUsd).toBeLessThanOrEqual(cap);
      }
    }
  });

  it('retains global benchmarks without adding them to US allocation benefits or native metrics', () => {
    const trial = scenarioInputs.find(input => input.policyId === 'pragmatic-clinical-trial-funding-reform')!;
    const benchmarkPrior = trial.parameters.find(parameter => parameter.id === 'RECOVERY_TRIAL_GLOBAL_LIVES_SAVED')!;
    const saved = { low: benchmarkPrior.low, mode: benchmarkPrior.mode, high: benchmarkPrior.high };
    let changed: DecisionReport;
    try {
      // Perturb the actual benchmark source prior, retaining all common draws.
      // This must alter the displayed global reference, not US policy benefits.
      Object.assign(benchmarkPrior, { low: saved.low * 2, mode: saved.mode * 2, high: saved.high * 2 });
      changed = generateDecisionAnalysis(options);
    } finally {
      Object.assign(benchmarkPrior, saved);
    }
    const originalPolicy = report.policies.find(policy => policy.id === trial.policyId)!;
    const changedPolicy = changed.policies.find(policy => policy.id === trial.policyId)!;
    const originalBenchmark = originalPolicy.metrics.find(metric => metric.unit === 'global QALYs')!;
    const changedBenchmark = changedPolicy.metrics.find(metric => metric.unit === 'global QALYs')!;
    expect(changedBenchmark.estimate.mean / originalBenchmark.estimate.mean).toBeCloseTo(2, 10);
    expect(changedPolicy.benefit).toEqual(originalPolicy.benefit);
    expect(changedPolicy.netBenefit).toEqual(originalPolicy.netBenefit);
    expect(changed.scenarios).toEqual(report.scenarios);
    expect(changed.recommendedScenarioId).toBe(report.recommendedScenarioId);
    for (const scenario of report.scenarios) {
      expect(scenario.metrics.every(metric => !/global/i.test(`${metric.label} ${metric.unit}`))).toBe(true);
    }
  });

  it('preserves finite uncertainty summaries and chooses by expected net benefit', () => {
    const preferred = report.scenarios.find(scenario => scenario.id === report.recommendedScenarioId)!;
    expect(preferred.netBenefit.mean).toBe(Math.max(...report.scenarios.map(scenario => scenario.netBenefit.mean)));
    for (const scenario of report.scenarios) {
      for (const summary of [scenario.benefit, scenario.financingLoss, scenario.netBenefit, ...scenario.metrics.map(metric => metric.estimate)]) {
        expectFiniteSummary(summary);
      }
      expect(scenario.netBenefit.mean).toBeCloseTo(scenario.benefit.mean - scenario.financingLoss.mean, 2);
    }
    for (const policy of report.policies) {
      if (policy.allocationEligible) {
        expect(policy.netBenefit).not.toBeNull();
        expect(policy.benefitCostRatio).not.toBeNull();
        expectFiniteSummary(policy.netBenefit!);
        expectFiniteSummary(policy.benefitCostRatio!);
      } else {
        expect(policy.netBenefit).toBeNull();
        expect(policy.benefitCostRatio).toBeNull();
      }
      for (const summary of [policy.benefit, ...policy.metrics.map(metric => metric.estimate)]) {
        expectFiniteSummary(summary);
      }
    }
  });

  it('renders the serialized allocation, full ledger, and intervals in its Markdown download', () => {
    const serialized = JSON.parse(JSON.stringify(report)) as DecisionReport;
    const markdown = generateDecisionMarkdown(serialized);
    const preferred = serialized.scenarios.find(scenario => scenario.id === serialized.recommendedScenarioId)!;
    expect(markdown).toBe(generateDecisionMarkdown(report));
    expect(markdown).toContain(`Expected net present benefit: ${formatDecisionInterval(preferred.netBenefit)}`);
    expect(markdown).toContain(`reallocate ${formatDecisionMoney(preferred.annualCostUsd)}`);
    for (const allocation of preferred.allocations) {
      expect(markdown).toContain(`| ${allocation.name} | ${formatDecisionMoney(allocation.amountUsd)} |`);
    }
    for (const line of preferred.ledger) {
      expect(markdown).toContain(`| ${line.name} | ${formatDecisionMoney(line.baselineUsd)} | ${formatDecisionMoney(line.proposedUsd)} | ${formatDecisionMoney(line.proposedUsd - line.baselineUsd)} |`);
    }
    for (const scenario of serialized.scenarios) {
      expect(markdown).toContain(`| ${scenario.name} | ${formatDecisionMoney(scenario.annualCostUsd)} | ${formatDecisionInterval(scenario.netBenefit)} |`);
    }
    expect(markdown).toContain(`| **Total** | **${formatDecisionMoney(serialized.baselineOutlaysUsd)}** | **${formatDecisionMoney(serialized.baselineOutlaysUsd)}** | **$0** |`);
    expect(markdown).toContain(serialized.generatedAt);
  });
});
