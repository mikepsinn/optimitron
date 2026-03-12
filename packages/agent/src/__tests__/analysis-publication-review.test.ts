import { describe, expect, it, vi } from 'vitest';
import {
  buildAnalysisPublicationReviewPrompt,
  formatAnalysisPublicationReview,
  reviewAnalysisPublication,
  type AnalysisPublicationReviewInput,
} from '../analysis-publication-review.js';

const baseInput: AnalysisPublicationReviewInput = {
  reportKind: 'mega-study-api',
  reportTitle: 'Mega Study Explorer',
  generatedAt: '2026-03-12T00:00:00.000Z',
  overview: {
    outcomeCount: 1,
    pairCount: 1,
    extrapolativePairCount: 0,
    outsideBestObservedBinCount: 0,
    insufficientPairCount: 0,
    lowReliabilityPairCount: 0,
  },
  outcomes: [{
    outcomeId: 'outcome.happiness',
    outcomeLabel: 'Happiness',
    topRecommendations: [{
      rank: 1,
      predictorId: 'predictor.sleep',
      predictorLabel: 'Sleep',
      score: 0.82,
      confidence: 0.76,
      adjustedPValue: 0.03,
      pairId: 'pair_1',
      qualityTier: 'strong',
      dataSufficiencyStatus: 'sufficient',
      reliabilityBand: 'high',
      reliabilityScore: 0.88,
    }],
  }],
  highlightedPairs: [{
    pairId: 'pair_1',
    predictorLabel: 'Sleep',
    outcomeLabel: 'Happiness',
    decisionBest: 8,
    modelBest: 8.2,
    decisionTargetSource: 'support_constrained',
    evidenceGrade: 'B',
    qualityTier: 'strong',
    dataSufficiencyStatus: 'sufficient',
    reliabilityBand: 'high',
    reliabilityScore: 0.88,
    significance: 0.91,
    directionalScore: 0.73,
    extrapolative: false,
    outsideBestObservedBin: false,
  }],
};

describe('analysis publication review', () => {
  it('passes deterministic review for healthy top recommendations', async () => {
    await expect(reviewAnalysisPublication({ input: baseInput })).resolves.toMatchObject({
      reviewer: 'deterministic',
      status: 'pass',
      shouldPublish: true,
    });
  });

  it('fails deterministic review when a top recommendation has insufficient data', async () => {
    const review = await reviewAnalysisPublication({
      input: {
        ...baseInput,
        overview: { ...baseInput.overview, insufficientPairCount: 1 },
        outcomes: [{
          ...baseInput.outcomes[0]!,
          topRecommendations: [{
            ...baseInput.outcomes[0]!.topRecommendations[0]!,
            dataSufficiencyStatus: 'insufficient_data',
          }],
        }],
        highlightedPairs: [{
          ...baseInput.highlightedPairs[0]!,
          dataSufficiencyStatus: 'insufficient_data',
        }],
      },
    });

    expect(review.status).toBe('fail');
    expect(review.shouldPublish).toBe(false);
    expect(review.flaggedPairIds).toContain('pair_1');
  });

  it('fails deterministic review when a top recommendation is tagged not-enough-data quality', async () => {
    const review = await reviewAnalysisPublication({
      input: {
        ...baseInput,
        outcomes: [{
          ...baseInput.outcomes[0]!,
          topRecommendations: [{
            ...baseInput.outcomes[0]!.topRecommendations[0]!,
            qualityTier: 'insufficient',
          }],
        }],
        highlightedPairs: [{
          ...baseInput.highlightedPairs[0]!,
          qualityTier: 'insufficient',
        }],
      },
    });

    expect(review.status).toBe('fail');
    expect(review.shouldPublish).toBe(false);
    expect(review.flaggedPairIds).toContain('pair_1');
  });

  it('uses the provided reasoner and keeps deterministic blockers', async () => {
    const generateObject = vi.fn(async ({ parse }: { parse: (value: unknown) => unknown }) =>
      parse({
        status: 'pass',
        summary: 'LLM review looked fine.',
        shouldPublish: true,
        confidence: 0.7,
        findings: [],
        requiredDisclosures: [],
        recommendedEdits: [],
        flaggedPairIds: [],
      }),
    );

    const review = await reviewAnalysisPublication({
      input: {
        ...baseInput,
        outcomes: [{
          ...baseInput.outcomes[0]!,
          topRecommendations: [{
            ...baseInput.outcomes[0]!.topRecommendations[0]!,
            dataSufficiencyStatus: 'insufficient_data',
          }],
        }],
        highlightedPairs: [{
          ...baseInput.highlightedPairs[0]!,
          dataSufficiencyStatus: 'insufficient_data',
        }],
      },
      reasoner: { generateObject },
    });

    expect(generateObject).toHaveBeenCalledTimes(1);
    expect(review.reviewer).toBe('gemini');
    expect(review.status).toBe('fail');
    expect(review.shouldPublish).toBe(false);
  });

  it('formats the review for terminal output', async () => {
    const review = await reviewAnalysisPublication({ input: baseInput });
    const formatted = formatAnalysisPublicationReview(review);

    expect(formatted).toContain('AI publication review');
    expect(formatted).toContain('Should publish');
  });

  it('builds a prompt with the structured input payload', () => {
    const prompt = buildAnalysisPublicationReviewPrompt(baseInput);
    expect(prompt).toContain('Mega Study Explorer');
    expect(prompt).toContain('"reportKind": "mega-study-api"');
  });
});
