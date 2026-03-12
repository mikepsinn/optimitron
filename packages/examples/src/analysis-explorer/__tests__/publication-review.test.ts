import { describe, expect, it, vi } from 'vitest';
import { buildMegaStudyPublicationReviewInput, reviewMegaStudyApiPayload } from '../publication-review.js';
import type { MegaStudyApiPayload } from '../mega-study-generator.js';

const basePayload: MegaStudyApiPayload = {
  schemaVersion: '2026-02-14',
  generatedAt: '2026-03-12T00:00:00.000Z',
  outcomes: [{
    outcomeId: 'outcome.happiness',
    outcomeLabel: 'Happiness',
    outcomeMarkdownFile: 'outcome-happiness.md',
    rows: [{
      rank: 1,
      predictorId: 'predictor.sleep',
      predictorLabel: 'Sleep',
      score: 0.82,
      confidence: 0.77,
      adjustedPValue: 0.03,
      qualityTier: 'strong',
      dataSufficiencyStatus: 'sufficient',
      reliabilityScore: 0.88,
      reliabilityBand: 'high',
      pairId: 'pair_1',
      pairMarkdownFile: 'pair_1.md',
    }],
  }],
  pairs: [{
    pairId: 'pair_1',
    predictor: { id: 'predictor.sleep', label: 'Sleep', unit: 'hours' },
    outcome: { id: 'outcome.happiness', label: 'Happiness', unit: 'score' },
    targets: {
      decisionBest: 8,
      decisionTargetSource: 'support_constrained',
      modelBest: 8.2,
      observedSupportBest: 8,
      robustBest: 7.9,
      minimumEffectiveDose: 7,
      diminishingReturnsKnee: 8.5,
      saturationStart: 8,
      saturationEnd: 9,
    },
    diagnostics: {
      qualityTier: 'strong',
      evidenceGrade: 'B',
      significance: 0.91,
      directionalScore: 0.73,
      direction: 'positive',
      includedSubjects: 120,
      totalPairs: 5000,
      extrapolative: false,
      outsideBestObservedBin: false,
      dataSufficiencyStatus: 'sufficient',
      reliabilityScore: 0.88,
      reliabilityBand: 'high',
    },
    links: { markdownFile: 'pair_1.md' },
  }],
};

describe('mega study publication review adapter', () => {
  it('builds a compact review input from the mega study payload', () => {
    const input = buildMegaStudyPublicationReviewInput(basePayload);

    expect(input.reportKind).toBe('mega-study-api');
    expect(input.overview.pairCount).toBe(1);
    expect(input.outcomes[0]?.topRecommendations[0]?.pairId).toBe('pair_1');
    expect(input.highlightedPairs[0]?.pairId).toBe('pair_1');
  });

  it('surfaces risky highlighted pairs even when they are not top recommendations', () => {
    const input = buildMegaStudyPublicationReviewInput({
      ...basePayload,
      pairs: [
        ...basePayload.pairs,
        {
          ...basePayload.pairs[0]!,
          pairId: 'pair_2',
          predictor: { id: 'predictor.tax', label: 'Taxation', unit: '%' },
          diagnostics: {
            ...basePayload.pairs[0]!.diagnostics,
            extrapolative: true,
            reliabilityBand: 'low',
            reliabilityScore: 0.21,
          },
        },
      ],
    });

    expect(input.highlightedPairs.map((pair) => pair.pairId)).toContain('pair_2');
  });

  it('returns a formatted deterministic review without requiring an API key', async () => {
    const result = await reviewMegaStudyApiPayload(basePayload);

    expect(result.review.status).toBe('pass');
    expect(result.formatted).toContain('AI publication review');
  });
});
