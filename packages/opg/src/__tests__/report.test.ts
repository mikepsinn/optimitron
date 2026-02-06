import { describe, it, expect } from 'vitest';
import {
  generatePolicyReport,
  type PolicyRankingResult,
  type PolicyAnalysis,
} from '../report.js';
import type { Policy, PolicyRecommendation } from '../policy.js';
import type { Jurisdiction } from '../jurisdiction.js';
import type { BradfordHillScores } from '../bradford-hill.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeJurisdiction(overrides: Partial<Jurisdiction> = {}): Jurisdiction {
  return {
    id: 'TX',
    name: 'Texas',
    type: 'state',
    population: 30_000_000,
    gdpPerCapita: 65_000,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<Policy> = {}): Policy {
  return {
    id: 'universal-prek',
    name: 'Universal Pre-K',
    type: 'law',
    isContinuous: false,
    ...overrides,
  };
}

function makeRecommendation(overrides: Partial<PolicyRecommendation> = {}): PolicyRecommendation {
  return {
    jurisdictionId: 'TX',
    policyId: 'universal-prek',
    recommendationType: 'enact',
    welfareEffect: {
      incomeEffect: 0.25,
      healthEffect: 0.15,
    },
    evidenceGrade: 'A',
    policyImpactScore: 0.85,
    priorityScore: 0.90,
    ...overrides,
  };
}

function makeBradfordHill(overrides: Partial<BradfordHillScores> = {}): BradfordHillScores {
  return {
    strength: 0.85,
    consistency: 0.78,
    temporality: 1.0,
    gradient: 0.65,
    experiment: 0.90,
    plausibility: 0.80,
    coherence: 0.72,
    analogy: 0.60,
    specificity: 0.55,
    ...overrides,
  };
}

function makePolicyAnalysis(overrides: Partial<PolicyAnalysis> = {}): PolicyAnalysis {
  return {
    policy: makePolicy(),
    recommendation: makeRecommendation(),
    bradfordHillScores: makeBradfordHill(),
    causalConfidenceScore: 0.82,
    ...overrides,
  };
}

function makeFullResult(overrides: Partial<PolicyRankingResult> = {}): PolicyRankingResult {
  const preK = makePolicyAnalysis();
  const tobaccoTax = makePolicyAnalysis({
    policy: makePolicy({
      id: 'tobacco-tax',
      name: 'Tobacco Excise Tax',
      type: 'tax_policy',
      isContinuous: true,
    }),
    recommendation: makeRecommendation({
      policyId: 'tobacco-tax',
      recommendationType: 'replace',
      currentStatus: '$1.41/pack',
      recommendedTarget: '$2.50/pack',
      welfareEffect: {
        incomeEffect: -0.02,
        healthEffect: 0.25,
      },
      evidenceGrade: 'A',
      policyImpactScore: 0.85,
      priorityScore: 0.80,
      blockingFactors: ['political'],
      rationale: 'Below-median tobacco tax with strong evidence for increase',
    }),
    bradfordHillScores: makeBradfordHill({ strength: 0.92, gradient: 0.88 }),
    causalConfidenceScore: 0.78,
  });
  const seatBelt = makePolicyAnalysis({
    policy: makePolicy({
      id: 'primary-seatbelt',
      name: 'Primary Seat Belt Enforcement',
      type: 'law',
    }),
    recommendation: makeRecommendation({
      policyId: 'primary-seatbelt',
      recommendationType: 'enact',
      welfareEffect: {
        incomeEffect: 0.02,
        healthEffect: 0.15,
      },
      evidenceGrade: 'A',
      policyImpactScore: 0.81,
      priorityScore: 0.75,
      similarJurisdictions: ['FL', 'CA'],
    }),
    bradfordHillScores: makeBradfordHill({ strength: 0.70, consistency: 0.85 }),
    causalConfidenceScore: 0.65,
  });
  const duiThreshold = makePolicyAnalysis({
    policy: makePolicy({
      id: 'dui-threshold',
      name: 'DUI BAC Threshold',
      type: 'regulation',
    }),
    recommendation: makeRecommendation({
      policyId: 'dui-threshold',
      recommendationType: 'maintain',
      welfareEffect: { incomeEffect: 0, healthEffect: 0 },
      evidenceGrade: 'A',
      policyImpactScore: 0.90,
      priorityScore: 0,
    }),
    causalConfidenceScore: 0.88,
    bradfordHillScores: undefined,
  });

  return {
    jurisdiction: makeJurisdiction(),
    analysisDate: '2024-06-15',
    policies: [preK, tobaccoTax, seatBelt, duiThreshold],
    overallWelfareScore: 72.5,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generatePolicyReport', () => {
  it('contains report title with jurisdiction name', () => {
    const report = generatePolicyReport(makeFullResult());
    expect(report).toContain('# Policy Ranking Report: Texas');
  });

  it('contains summary section with metadata', () => {
    const report = generatePolicyReport(makeFullResult());
    expect(report).toContain('## Summary');
    expect(report).toContain('4 policies');
    expect(report).toContain('Texas');
    expect(report).toContain('state');
    expect(report).toContain('2024-06-15');
    expect(report).toContain('30,000,000');
    expect(report).toContain('72.5');
  });

  it('contains top policies welfare impact table', () => {
    const report = generatePolicyReport(makeFullResult());
    expect(report).toContain('## Top Policies by Welfare Impact');
    expect(report).toContain('| Rank | Policy | Welfare Score | Evidence Grade | Causal Confidence |');
    expect(report).toContain('Universal Pre-K');
    expect(report).toContain('Tobacco Excise Tax');
    expect(report).toContain('Primary Seat Belt Enforcement');
  });

  it('ranks policies by welfare score descending', () => {
    const report = generatePolicyReport(makeFullResult());
    // Universal Pre-K welfare: (0.25+0.15)*100 = 40
    // Tobacco Tax welfare: (-0.02+0.25)*100 = 23
    // Seat Belt welfare: (0.02+0.15)*100 = 17
    // DUI: 0
    const tableSection = report.split('## Top Policies by Welfare Impact')[1]!
      .split('##')[0]!;
    const rankLines = tableSection.split('\n').filter(l => l.startsWith('| ') && /^\| \d/.test(l));
    expect(rankLines[0]).toContain('Universal Pre-K');
    expect(rankLines[1]).toContain('Tobacco Excise Tax');
    expect(rankLines[2]).toContain('Primary Seat Belt');
    expect(rankLines[3]).toContain('DUI BAC Threshold');
  });

  it('shows correct welfare scores', () => {
    const report = generatePolicyReport(makeFullResult());
    // Pre-K: (0.25+0.15)*100 = 40.0
    expect(report).toContain('40.0');
  });

  it('shows causal confidence labels', () => {
    const report = generatePolicyReport(makeFullResult());
    expect(report).toContain('Very High'); // 0.82
    expect(report).toContain('High');      // 0.65 or 0.78
  });

  it('contains Bradford Hill Assessment section', () => {
    const report = generatePolicyReport(makeFullResult());
    expect(report).toContain('## Bradford Hill Assessment');
  });

  it('shows Bradford Hill scores for each policy with BH data', () => {
    const report = generatePolicyReport(makeFullResult());
    // Pre-K has BH scores
    expect(report).toContain('### Universal Pre-K');
    expect(report).toContain('### Tobacco Excise Tax');
    expect(report).toContain('### Primary Seat Belt Enforcement');
  });

  it('does not show Bradford Hill section for policies without BH data', () => {
    const report = generatePolicyReport(makeFullResult());
    // DUI Threshold has no BH scores
    expect(report).not.toContain('### DUI BAC Threshold');
  });

  it('shows all 9 Bradford Hill criteria in table', () => {
    const report = generatePolicyReport(makeFullResult());
    expect(report).toContain('| Strength |');
    expect(report).toContain('| Consistency |');
    expect(report).toContain('| Temporality |');
    expect(report).toContain('| Gradient |');
    expect(report).toContain('| Experiment |');
    expect(report).toContain('| Plausibility |');
    expect(report).toContain('| Coherence |');
    expect(report).toContain('| Analogy |');
    expect(report).toContain('| Specificity |');
  });

  it('includes evidence grade description in Bradford Hill section', () => {
    const report = generatePolicyReport(makeFullResult());
    expect(report).toContain('Strong causal evidence');
  });

  it('contains recommendations section', () => {
    const report = generatePolicyReport(makeFullResult());
    expect(report).toContain('## Recommendations');
  });

  it('sorts recommendations by priority score', () => {
    const report = generatePolicyReport(makeFullResult());
    const recSection = report.split('## Recommendations')[1]!;
    const numberedLines = recSection.split('\n').filter(l => /^\d+\./.test(l));
    // Pre-K priority: 0.90, Tobacco: 0.80, Seat Belt: 0.75
    expect(numberedLines[0]).toContain('Universal Pre-K');
    expect(numberedLines[1]).toContain('Tobacco Excise Tax');
    expect(numberedLines[2]).toContain('Primary Seat Belt');
  });

  it('excludes maintain policies from numbered recommendations', () => {
    const report = generatePolicyReport(makeFullResult());
    const recSection = report.split('## Recommendations')[1]!;
    const numberedLines = recSection.split('\n').filter(l => /^\d+\./.test(l));
    const duiRecs = numberedLines.filter(l => l.includes('DUI'));
    expect(duiRecs).toHaveLength(0);
  });

  it('shows maintained policies separately', () => {
    const report = generatePolicyReport(makeFullResult());
    expect(report).toContain('already well-aligned');
    expect(report).toContain('DUI BAC Threshold');
  });

  it('shows recommendation type labels', () => {
    const report = generatePolicyReport(makeFullResult());
    expect(report).toContain('**Enact: Universal Pre-K**');
    expect(report).toContain('**Modify: Tobacco Excise Tax**');
  });

  it('shows rationale when present', () => {
    const report = generatePolicyReport(makeFullResult());
    expect(report).toContain('Below-median tobacco tax with strong evidence for increase');
  });

  it('shows current → recommended for replace recommendations', () => {
    const report = generatePolicyReport(makeFullResult());
    expect(report).toContain('Current: $1.41/pack');
    expect(report).toContain('Recommended: $2.50/pack');
  });

  it('shows blocking factors when present', () => {
    const report = generatePolicyReport(makeFullResult());
    expect(report).toContain('Blocking factors: political');
  });

  // --- Edge cases ---

  it('handles empty policies array', () => {
    const result = makeFullResult({ policies: [] });
    const report = generatePolicyReport(result);
    expect(report).toContain('0 policies');
    expect(report).toContain('No policies to analyze');
    expect(report).toContain('No Bradford Hill scores available');
    expect(report).toContain('No recommendations available');
  });

  it('handles single policy', () => {
    const result = makeFullResult({
      policies: [makePolicyAnalysis()],
    });
    const report = generatePolicyReport(result);
    expect(report).toContain('1 policies');
    expect(report).toContain('Universal Pre-K');
    const rankLines = report.split('\n').filter(l => /^\| 1 /.test(l));
    expect(rankLines.length).toBeGreaterThanOrEqual(1);
  });

  it('handles all-maintain policies', () => {
    const maintained = makePolicyAnalysis({
      recommendation: makeRecommendation({
        recommendationType: 'maintain',
        priorityScore: 0,
        welfareEffect: { incomeEffect: 0, healthEffect: 0 },
      }),
    });
    const result = makeFullResult({ policies: [maintained] });
    const report = generatePolicyReport(result);
    expect(report).toContain('already well-aligned');
  });

  it('handles policies without Bradford Hill scores', () => {
    const noBH = makePolicyAnalysis({
      bradfordHillScores: undefined,
      causalConfidenceScore: undefined,
    });
    const result = makeFullResult({ policies: [noBH] });
    const report = generatePolicyReport(result);
    expect(report).toContain('No Bradford Hill scores available');
    expect(report).toContain('—'); // Causal confidence shows dash
  });

  it('handles jurisdiction without population', () => {
    const result = makeFullResult({
      jurisdiction: makeJurisdiction({ population: undefined }),
    });
    const report = generatePolicyReport(result);
    expect(report).not.toContain('Population:');
  });

  it('handles no overall welfare score', () => {
    const result = makeFullResult({ overallWelfareScore: undefined });
    const report = generatePolicyReport(result);
    expect(report).not.toContain('Overall welfare score');
  });

  it('handles repeal recommendation', () => {
    const repeal = makePolicyAnalysis({
      policy: makePolicy({ id: 'bad-policy', name: 'Harmful Regulation' }),
      recommendation: makeRecommendation({
        policyId: 'bad-policy',
        recommendationType: 'repeal',
        welfareEffect: { incomeEffect: 0.10, healthEffect: 0.05 },
        evidenceGrade: 'B',
        priorityScore: 0.60,
      }),
    });
    const result = makeFullResult({ policies: [repeal] });
    const report = generatePolicyReport(result);
    expect(report).toContain('**Repeal: Harmful Regulation**');
    expect(report).toContain('Probable causal relationship');
  });

  it('formats blocking factors with underscores replaced by spaces', () => {
    const pol = makePolicyAnalysis({
      recommendation: makeRecommendation({
        blockingFactors: ['federal_preemption', 'implementation_capacity'],
        priorityScore: 0.5,
      }),
    });
    const result = makeFullResult({ policies: [pol] });
    const report = generatePolicyReport(result);
    expect(report).toContain('federal preemption');
    expect(report).toContain('implementation capacity');
  });

  it('produces valid markdown (no broken table rows)', () => {
    const report = generatePolicyReport(makeFullResult());
    const lines = report.split('\n');
    for (const line of lines) {
      if (line.startsWith('|') && line.endsWith('|')) {
        const pipeCount = (line.match(/\|/g) || []).length;
        expect(pipeCount).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
