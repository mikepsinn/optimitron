/**
 * LLM-Reviewed Policy Evaluation — Gemini sanity-checks the outputs
 *
 * Runs the full 3-layer policy evaluation pipeline, then asks Gemini
 * to review the results for domain reasonableness:
 * - Do effect directions make scientific sense?
 * - Are effect sizes in plausible ranges?
 * - Does the evidence grade match the data quality?
 * - Are there any red flags or nonsensical numbers?
 *
 * Skipped when GOOGLE_GENERATIVE_AI_API_KEY is not set.
 */

import { describe, it, expect } from 'vitest';
import { askGemini } from '@optimitron/agent';
import { NATURAL_EXPERIMENTS } from '@optimitron/data';
import {
  runCountryAnalysis,
  type AnnualTimeSeries,
} from '@optimitron/obg';
import {
  convertNaturalExperimentData,
  evaluatePolicy,
  buildPanelAnalysis,
  type OutcomeMetric,
  type PolicyEvaluation,
} from '@optimitron/opg';

// ─── Config ──────────────────────────────────────────────────────────

const API_KEY = process.env['GOOGLE_GENERATIVE_AI_API_KEY'];

/** Simple seeded PRNG for reproducible noise */
function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

const rng = seededRng(42);

// ─── Helpers ─────────────────────────────────────────────────────────

function syntheticSeries(
  jurisdictionId: string,
  jurisdictionName: string,
  variableId: string,
  variableName: string,
  unit: string,
  startYear: number,
  endYear: number,
  baseFn: (year: number) => number,
): AnnualTimeSeries {
  const annualValues = new Map<number, number>();
  for (let y = startYear; y <= endYear; y++) {
    annualValues.set(y, baseFn(y));
  }
  return { jurisdictionId, jurisdictionName, variableId, variableName, unit, annualValues };
}

async function queryGemini(prompt: string): Promise<string> {
  return askGemini({ prompt, apiKey: API_KEY });
}

function buildReviewPrompt(evaluation: PolicyEvaluation): string {
  const summary = {
    policy: evaluation.policy,
    description: evaluation.description,
    category: evaluation.category,
    expectedOutcomes: evaluation.expectedOutcomes.map(o => ({
      name: o.name,
      direction: o.direction,
      unit: o.unit,
    })),
    naturalExperiments: evaluation.naturalExperiments.map(ne => ({
      jurisdiction: ne.jurisdiction,
      policy: ne.policy,
      metric: ne.outcomeMetric.name,
      direction: ne.outcomeMetric.direction,
      preMean: Number(ne.preMean.toFixed(2)),
      postMean: Number(ne.postMean.toFixed(2)),
      percentChange: Number(ne.percentChange.toFixed(1)),
      correlation: Number(ne.analysisResult.forwardPearson.toFixed(3)),
      pValue: Number(ne.analysisResult.pValue.toFixed(4)),
      dataPoints: ne.preDataPoints + ne.postDataPoints,
    })),
    crossJurisdiction: evaluation.crossJurisdiction
      ? {
          jurisdictionCount: evaluation.crossJurisdiction.jurisdictionCount,
          spendingCategory: evaluation.crossJurisdiction.spendingCategory,
          averageCorrelation: Number(evaluation.crossJurisdiction.averageCorrelation.toFixed(3)),
        }
      : null,
    aggregate: {
      weightedEffectSize: Number(evaluation.aggregate.weightedEffectSize.toFixed(4)),
      evidenceSources: evaluation.aggregate.evidenceSources,
      jurisdictionCount: evaluation.aggregate.jurisdictionCount,
      evidenceGrade: evaluation.aggregate.evidenceGrade,
      confidence: Number(evaluation.aggregate.confidence.toFixed(2)),
      verdict: evaluation.aggregate.verdict,
    },
  };

  return `You are a quantitative policy analyst reviewing automated causal analysis outputs.

Below is the JSON output of a 3-layer policy evaluation system that analyzes whether drug enforcement spending affects drug-induced deaths. The system uses:
- Layer 2: Natural experiments (Portugal drug decriminalization, before/after comparison)
- Layer 3: Cross-jurisdiction panel analysis (5 countries, spending vs death rates over time)

Review the following output for REASONABLENESS and SCIENTIFIC VALIDITY:

\`\`\`json
${JSON.stringify(summary, null, 2)}
\`\`\`

Answer with a JSON object (no markdown fences) containing exactly these fields:
{
  "pass": true/false,
  "score": <0-100 reasonableness score>,
  "issues": ["list of specific problems found, empty if none"],
  "checks": {
    "effect_directions_sensible": true/false,
    "effect_sizes_plausible": true/false,
    "grade_matches_evidence": true/false,
    "no_nonsensical_numbers": true/false,
    "verdict_coherent": true/false
  },
  "explanation": "1-2 sentence summary of your assessment"
}

Rules:
- "pass" should be true if the results are broadly reasonable for a policy analysis system, even if imperfect
- Effect directions: for "lower is better" outcomes (deaths), a negative percent change after decriminalization is GOOD
- A positive correlation between enforcement spending and deaths means more spending correlates with more deaths (plausible given the drug war debate)
- Effect sizes between 1% and 90% are plausible for drug policy changes over decades
- Evidence grades A-C are reasonable with 3+ evidence sources across 5+ jurisdictions
- Flag anything that seems impossible (e.g., negative death counts, correlation > 1, confidence > 1)`;
}

// ─── Test data ───────────────────────────────────────────────────────

const PORTUGAL = NATURAL_EXPERIMENTS.find(e => e.jurisdictionCode === 'PRT')!;

const expectedOutcomes: OutcomeMetric[] = [
  { name: 'Drug-Induced Deaths', id: 'drug-induced-deaths', unit: 'per million', direction: 'lower' },
];

const COUNTRIES = [
  { id: 'USA', name: 'United States', spendBase: 400, deathBase: 25 },
  { id: 'GBR', name: 'United Kingdom', spendBase: 200, deathBase: 12 },
  { id: 'DEU', name: 'Germany', spendBase: 150, deathBase: 8 },
  { id: 'FRA', name: 'France', spendBase: 180, deathBase: 10 },
  { id: 'CAN', name: 'Canada', spendBase: 250, deathBase: 15 },
];

// Add realistic noise to prevent near-perfect correlations
const predictors: AnnualTimeSeries[] = COUNTRIES.map(c =>
  syntheticSeries(
    c.id, c.name,
    'drug-enforcement-spending', 'Drug Enforcement Spending', 'USD per capita PPP',
    2000, 2019,
    year => c.spendBase + (year - 2000) * 5 + (rng() - 0.5) * 40,
  ),
);

const outcomes: AnnualTimeSeries[] = COUNTRIES.map(c =>
  syntheticSeries(
    c.id, c.name,
    'drug-deaths', 'Drug-Induced Deaths', 'per million',
    2000, 2019,
    year => c.deathBase + (year - 2000) * 0.3 + (rng() - 0.5) * 3,
  ),
);

// ─── Tests ───────────────────────────────────────────────────────────

const describeWithKey = API_KEY ? describe : describe.skip;

describeWithKey('LLM-Reviewed Policy Evaluation (Gemini)', () => {
  // Build the full 3-layer evaluation
  const countryResult = runCountryAnalysis({ predictors, outcomes });

  const panel = buildPanelAnalysis({
    jurisdictionCount: countryResult.aggregate.n,
    jurisdictions: countryResult.jurisdictions.map(j => j.jurisdictionId),
    spendingCategory: 'Drug Enforcement',
    averageCorrelation: countryResult.aggregate.meanForwardPearson,
  });

  const portugalDef = convertNaturalExperimentData(PORTUGAL);

  const evaluation = evaluatePolicy({
    policy: 'Drug Enforcement Spending',
    description: 'Evaluates whether increased drug enforcement spending reduces drug deaths',
    category: 'justice',
    expectedOutcomes,
    naturalExperiments: [portugalDef],
    crossJurisdiction: panel,
  });

  it('should pass Gemini reasonableness review', async () => {
    const prompt = buildReviewPrompt(evaluation);
    const raw = await queryGemini(prompt);

    // Parse the LLM response — strip markdown fences if present
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    let review: {
      pass: boolean;
      score: number;
      issues: string[];
      checks: Record<string, boolean>;
      explanation: string;
    };

    try {
      review = JSON.parse(cleaned);
    } catch {
      throw new Error(`Gemini returned unparseable response:\n${raw}`);
    }

    // Log the review for visibility
    console.log('\n=== Gemini Review ===');
    console.log(`Score: ${review.score}/100`);
    console.log(`Pass: ${review.pass}`);
    console.log(`Explanation: ${review.explanation}`);
    if (review.issues.length > 0) {
      console.log(`Issues: ${review.issues.join('; ')}`);
    }
    console.log('Checks:', JSON.stringify(review.checks, null, 2));
    console.log('=====================\n');

    // The test passes if Gemini says the results are reasonable
    expect(review.pass).toBe(true);
    expect(review.score).toBeGreaterThanOrEqual(60);

    // All individual checks should pass
    for (const [check, passed] of Object.entries(review.checks)) {
      expect(passed, `Gemini flagged check "${check}" as failed`).toBe(true);
    }
  }, 30_000); // 30s timeout for API call
});
