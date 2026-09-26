import { describe, expect, it } from 'vitest';
import { createPolicyLegislationBriefs } from '../policy-legislation-brief.js';
import type { PolicyReportJSON, PolicyReportPolicy } from '../policy-report-json.js';

const estimated: PolicyReportPolicy = {
  name: 'Evaluated policy', type: 'regulation', category: 'health', description: 'Evaluation result',
  recommendationType: 'enact', evidenceKind: 'estimate', evidenceGrade: 'B',
  causalConfidenceScore: 0.7, policyImpactScore: 0.6, welfareScore: 2,
  incomeEffect: 0.01, healthEffect: 0.01, bradfordHillScores: {},
  rationale: 'Evaluated evidence', currentStatus: 'Proposed', recommendedTarget: 'Adopt', blockingFactors: [],
};

function report(policies: PolicyReportPolicy[]): PolicyReportJSON {
  return { jurisdiction: 'Example', generatedAt: '2026-09-26T00:00:00Z', policies };
}

describe('policy legislation brief selection', () => {
  it('does not draft assumptions or comparisons as evaluated policy effects', () => {
    expect(createPolicyLegislationBriefs(report([
      { ...estimated, evidenceKind: 'assumption' },
      { ...estimated, evidenceKind: 'comparison', evidenceGrade: null, causalConfidenceScore: null, welfareScore: null },
    ]))).toEqual([]);
  });

  it('keeps valid evaluated recommendations and their rank without converting missing scores to zero', () => {
    const briefs = createPolicyLegislationBriefs(report([
      { ...estimated, name: 'Missing score', welfareScore: null },
      estimated,
      { ...estimated, name: 'Higher score', welfareScore: 3 },
      { ...estimated, name: 'Non-finite score', welfareScore: Number.NaN },
    ]));
    expect(briefs.map(brief => brief.policyName)).toEqual(['Higher score', 'Evaluated policy']);
    expect(briefs[1]?.welfareScore).toBe(2);
    expect(briefs[1]?.evidenceGrade).toBe('B');
  });
});
