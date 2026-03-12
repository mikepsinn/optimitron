import { z } from 'zod';
import { createGeminiReasoner } from './gemini.js';
import type { StructuredReasoner } from './types.js';

const SeveritySchema = z.enum(['high', 'medium', 'low']);
const StatusSchema = z.enum(['pass', 'warn', 'fail', 'inconclusive']);

export const PublicationRecommendationSchema = z.object({
  rank: z.number().int().positive(),
  predictorId: z.string().min(1),
  predictorLabel: z.string().min(1),
  score: z.number(),
  confidence: z.number(),
  adjustedPValue: z.number(),
  pairId: z.string().min(1),
  qualityTier: z.string().min(1),
  dataSufficiencyStatus: z.string().min(1),
  reliabilityBand: z.string().min(1),
  reliabilityScore: z.number(),
});

export const PublicationOutcomeReviewInputSchema = z.object({
  outcomeId: z.string().min(1),
  outcomeLabel: z.string().min(1),
  topRecommendations: z.array(PublicationRecommendationSchema).default([]),
});

export const PublicationPairReviewInputSchema = z.object({
  pairId: z.string().min(1),
  predictorLabel: z.string().min(1),
  outcomeLabel: z.string().min(1),
  decisionBest: z.number().nullable(),
  modelBest: z.number().nullable(),
  decisionTargetSource: z.string().min(1),
  evidenceGrade: z.string().min(1),
  qualityTier: z.string().min(1),
  dataSufficiencyStatus: z.string().min(1),
  reliabilityBand: z.string().min(1),
  reliabilityScore: z.number(),
  significance: z.number(),
  directionalScore: z.number(),
  extrapolative: z.boolean(),
  outsideBestObservedBin: z.boolean(),
});

export const AnalysisPublicationReviewInputSchema = z.object({
  reportKind: z.string().min(1),
  reportTitle: z.string().min(1),
  generatedAt: z.string().min(1),
  overview: z.object({
    outcomeCount: z.number().int().nonnegative(),
    pairCount: z.number().int().nonnegative(),
    extrapolativePairCount: z.number().int().nonnegative(),
    outsideBestObservedBinCount: z.number().int().nonnegative(),
    insufficientPairCount: z.number().int().nonnegative(),
    lowReliabilityPairCount: z.number().int().nonnegative(),
  }),
  outcomes: z.array(PublicationOutcomeReviewInputSchema).min(1),
  highlightedPairs: z.array(PublicationPairReviewInputSchema).default([]),
});

const ReviewFindingSchema = z.object({
  severity: SeveritySchema,
  title: z.string().min(1),
  evidence: z.array(z.string().min(1)).default([]),
});

export const AnalysisPublicationReviewSchema = z.object({
  reviewer: z.enum(['deterministic', 'gemini']),
  status: StatusSchema,
  summary: z.string().min(1),
  shouldPublish: z.boolean(),
  confidence: z.number().min(0).max(1),
  findings: z.array(ReviewFindingSchema).default([]),
  requiredDisclosures: z.array(z.string().min(1)).default([]),
  recommendedEdits: z.array(z.string().min(1)).default([]),
  flaggedPairIds: z.array(z.string().min(1)).default([]),
});

export type AnalysisPublicationReviewInput = z.infer<typeof AnalysisPublicationReviewInputSchema>;
export type AnalysisPublicationReview = z.infer<typeof AnalysisPublicationReviewSchema>;

export interface ReviewAnalysisPublicationOptions {
  apiKey?: string;
  input: AnalysisPublicationReviewInput;
  model?: string;
  reasoner?: StructuredReasoner;
}

const REVIEW_JSON_SCHEMA = {
  type: 'object',
  required: ['status', 'summary', 'shouldPublish', 'confidence', 'findings', 'requiredDisclosures', 'recommendedEdits', 'flaggedPairIds'],
  properties: {
    status: { type: 'string', enum: ['pass', 'warn', 'fail', 'inconclusive'] },
    summary: { type: 'string' },
    shouldPublish: { type: 'boolean' },
    confidence: { type: 'number' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'title', 'evidence'],
        properties: {
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          title: { type: 'string' },
          evidence: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    requiredDisclosures: { type: 'array', items: { type: 'string' } },
    recommendedEdits: { type: 'array', items: { type: 'string' } },
    flaggedPairIds: { type: 'array', items: { type: 'string' } },
  },
} as const;

function worstStatus(left: z.infer<typeof StatusSchema>, right: z.infer<typeof StatusSchema>) {
  const rank = { pass: 0, warn: 1, inconclusive: 2, fail: 3 } as const;
  return rank[left] >= rank[right] ? left : right;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function deterministicReview(input: AnalysisPublicationReviewInput): AnalysisPublicationReview {
  const pairById = new Map(input.highlightedPairs.map((pair) => [pair.pairId, pair]));
  const topPairs = input.outcomes.flatMap((outcome) => outcome.topRecommendations.slice(0, 1));
  const findings: AnalysisPublicationReview['findings'] = [];
  const requiredDisclosures: string[] = [];
  const recommendedEdits: string[] = [];
  const flaggedPairIds = new Set<string>();
  let status: z.infer<typeof StatusSchema> = 'pass';
  let shouldPublish = true;

  for (const recommendation of topPairs) {
    const pair = pairById.get(recommendation.pairId);
    if (!pair) {
      status = worstStatus(status, 'inconclusive');
      shouldPublish = false;
      findings.push({
        severity: 'high',
        title: 'Top recommendation is missing pair diagnostics',
        evidence: [`pairId=${recommendation.pairId}`],
      });
      flaggedPairIds.add(recommendation.pairId);
      continue;
    }

    if (pair.dataSufficiencyStatus !== 'sufficient') {
      status = worstStatus(status, 'fail');
      shouldPublish = false;
      findings.push({
        severity: 'high',
        title: 'Top recommendation is based on insufficient data',
        evidence: [`${pair.predictorLabel} -> ${pair.outcomeLabel}`, `status=${pair.dataSufficiencyStatus}`],
      });
      flaggedPairIds.add(pair.pairId);
      recommendedEdits.push('Do not publish top recommendations with insufficient data as actionable advice.');
    }

    if (pair.qualityTier === 'insufficient') {
      status = worstStatus(status, 'fail');
      shouldPublish = false;
      findings.push({
        severity: 'high',
        title: 'Top recommendation is still tagged as not-enough-data quality',
        evidence: [`${pair.predictorLabel} -> ${pair.outcomeLabel}`, `qualityTier=${pair.qualityTier}`],
      });
      flaggedPairIds.add(pair.pairId);
      recommendedEdits.push('Do not surface top recommendations whose quality tier is still not-enough-data.');
    }

    if (pair.reliabilityBand === 'low') {
      status = worstStatus(status, 'warn');
      findings.push({
        severity: 'medium',
        title: 'Top recommendation has low reliability',
        evidence: [`${pair.predictorLabel} -> ${pair.outcomeLabel}`, `reliability=${pair.reliabilityScore.toFixed(3)}`],
      });
      flaggedPairIds.add(pair.pairId);
      recommendedEdits.push('Downgrade or caveat low-reliability top recommendations.');
    }

    if (pair.extrapolative || pair.outsideBestObservedBin) {
      status = worstStatus(status, 'warn');
      findings.push({
        severity: 'medium',
        title: 'Top recommendation relies on extrapolation beyond strong observed support',
        evidence: [`${pair.predictorLabel} -> ${pair.outcomeLabel}`, `decision source=${pair.decisionTargetSource}`],
      });
      flaggedPairIds.add(pair.pairId);
      requiredDisclosures.push('Explicitly disclose when a recommended level is extrapolative or outside the best observed bin.');
    }

    if ((pair.evidenceGrade === 'D' || pair.evidenceGrade === 'F') && recommendation.confidence >= 0.7) {
      status = worstStatus(status, 'warn');
      findings.push({
        severity: 'medium',
        title: 'Display confidence appears stronger than the evidence grade',
        evidence: [`${pair.predictorLabel} -> ${pair.outcomeLabel}`, `grade=${pair.evidenceGrade}`, `confidence=${recommendation.confidence}`],
      });
      flaggedPairIds.add(pair.pairId);
      recommendedEdits.push('Make low evidence grades visually prominent when recommendation confidence is high.');
    }
  }

  if (input.overview.extrapolativePairCount > 0) {
    requiredDisclosures.push('State how many published pairs are extrapolative relative to observed data.');
  }
  if (input.overview.lowReliabilityPairCount > 0) {
    requiredDisclosures.push('State that some ranked pairs are exploratory because reliability is low.');
  }

  const summary = shouldPublish
    ? findings.length === 0
      ? `Deterministic checks found no major publication blockers across ${input.outcomes.length} outcomes.`
      : `Deterministic checks found caveats that should be disclosed before publishing ${input.reportTitle}.`
    : `Deterministic checks found publication blockers in ${input.reportTitle}.`;

  return {
    reviewer: 'deterministic',
    status,
    summary,
    shouldPublish,
    confidence: shouldPublish ? (findings.length === 0 ? 0.93 : 0.81) : 0.9,
    findings,
    requiredDisclosures: unique(requiredDisclosures),
    recommendedEdits: unique(recommendedEdits),
    flaggedPairIds: [...flaggedPairIds],
  };
}

export function buildAnalysisPublicationReviewPrompt(input: AnalysisPublicationReviewInput): string {
  return [
    'Review this structured analysis publication package for reasonableness and publishability.',
    'Focus on top recommendations, evidence-grade alignment, extrapolation risk, and missing disclosures.',
    'Never ignore deterministic red flags like insufficient data on top-ranked recommendations.',
    `Publication JSON:\n\n${JSON.stringify(input, null, 2)}`,
  ].join('\n\n');
}

export async function reviewAnalysisPublication(
  options: ReviewAnalysisPublicationOptions,
): Promise<AnalysisPublicationReview> {
  const input = AnalysisPublicationReviewInputSchema.parse(options.input);
  const baseline = deterministicReview(input);
  const reasoner = options.reasoner ?? (options.apiKey
    ? createGeminiReasoner({ apiKey: options.apiKey, model: options.model, temperature: 0.1, maxOutputTokens: 1800 })
    : null);
  if (!reasoner) return baseline;

  const llmReview = await reasoner.generateObject({
    schemaName: 'AnalysisPublicationReview',
    prompt: buildAnalysisPublicationReviewPrompt(input),
    responseJsonSchema: REVIEW_JSON_SCHEMA,
    parse: (value) => AnalysisPublicationReviewSchema.omit({ reviewer: true }).parse(value),
  });

  return AnalysisPublicationReviewSchema.parse({
    reviewer: 'gemini',
    status: worstStatus(baseline.status, llmReview.status),
    summary: baseline.status === 'fail' ? baseline.summary : llmReview.summary,
    shouldPublish: baseline.shouldPublish && llmReview.shouldPublish,
    confidence: Math.max(baseline.confidence, Math.min(1, llmReview.confidence)),
    findings: [...baseline.findings, ...llmReview.findings],
    requiredDisclosures: unique([...baseline.requiredDisclosures, ...llmReview.requiredDisclosures]),
    recommendedEdits: unique([...baseline.recommendedEdits, ...llmReview.recommendedEdits]),
    flaggedPairIds: unique([...baseline.flaggedPairIds, ...llmReview.flaggedPairIds]),
  });
}

export function formatAnalysisPublicationReview(review: AnalysisPublicationReview): string {
  const lines = [
    'AI publication review',
    `Reviewer: ${review.reviewer}`,
    `Status: ${review.status}`,
    `Should publish: ${review.shouldPublish ? 'yes' : 'no'}`,
    `Confidence: ${review.confidence.toFixed(2)}`,
    `Summary: ${review.summary}`,
  ];
  if (review.flaggedPairIds.length > 0) lines.push(`Flagged pairs: ${review.flaggedPairIds.join(', ')}`);
  if (review.requiredDisclosures.length > 0) lines.push(`Required disclosures: ${review.requiredDisclosures.join(' | ')}`);
  if (review.recommendedEdits.length > 0) lines.push(`Recommended edits: ${review.recommendedEdits.join(' | ')}`);
  for (const finding of review.findings) {
    lines.push(`Finding [${finding.severity}]: ${finding.title}`);
    if (finding.evidence.length > 0) lines.push(`Evidence: ${finding.evidence.join(' | ')}`);
  }
  return lines.join('\n');
}
