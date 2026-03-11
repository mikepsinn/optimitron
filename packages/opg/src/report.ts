/**
 * Markdown Report Generator for Policy Ranking
 *
 * Produces a human-readable markdown report from policy analysis results.
 *
 * @see https://opg.warondisease.org
 */

import type { PolicyRecommendation, Policy, EvidenceGrade } from './policy.js';
import type { Jurisdiction } from './jurisdiction.js';
import type { BradfordHillScores } from './bradford-hill.js';

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface PolicyAnalysis {
  policy: Policy;
  recommendation: PolicyRecommendation;
  bradfordHillScores?: BradfordHillScores;
  causalConfidenceScore?: number;
}

export interface PolicyRankingResult {
  jurisdiction: Jurisdiction;
  analysisDate: string;
  policies: PolicyAnalysis[];
  overallWelfareScore?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Describe the evidence grade.
 */
function describeGrade(grade: EvidenceGrade): string {
  switch (grade) {
    case 'A': return 'Strong causal evidence';
    case 'B': return 'Probable causal relationship';
    case 'C': return 'Possible association';
    case 'D': return 'Weak evidence';
    case 'F': return 'Insufficient evidence';
    default: return 'Unknown';
  }
}

/**
 * Describe causal confidence as a human-readable label.
 */
function describeCausalConfidence(ccs?: number): string {
  if (ccs === undefined || ccs === null) return '—';
  if (ccs >= 0.80) return 'Very High';
  if (ccs >= 0.60) return 'High';
  if (ccs >= 0.40) return 'Moderate';
  if (ccs >= 0.20) return 'Low';
  return 'Very Low';
}

/**
 * Format a number with fixed decimals, handling non-finite values.
 */
function fmt(value: number, decimals: number = 1): string {
  if (!isFinite(value)) return 'N/A';
  return value.toFixed(decimals);
}

/**
 * Describe the recommendation type in human terms.
 */
function describeRecommendationType(type: string): string {
  switch (type) {
    case 'enact': return 'Enact';
    case 'replace': return 'Modify';
    case 'repeal': return 'Repeal';
    case 'maintain': return 'Maintain';
    default: return type;
  }
}

/**
 * Calculate welfare score from welfare effect (simple composite).
 */
function welfareScore(rec: PolicyRecommendation): number {
  return (rec.welfareEffect.incomeEffect + rec.welfareEffect.healthEffect) * 100;
}

/**
 * Calculate welfare score confidence interval when component CIs are available.
 */
function welfareScoreConfidenceInterval(
  rec: PolicyRecommendation,
): [number, number] | null {
  const {
    incomeEffectCILow,
    incomeEffectCIHigh,
    healthEffectCILow,
    healthEffectCIHigh,
  } = rec.welfareEffect;

  if (
    incomeEffectCILow === undefined ||
    incomeEffectCIHigh === undefined ||
    healthEffectCILow === undefined ||
    healthEffectCIHigh === undefined
  ) {
    return null;
  }

  return [
    (incomeEffectCILow + healthEffectCILow) * 100,
    (incomeEffectCIHigh + healthEffectCIHigh) * 100,
  ];
}

/**
 * Describe a Bradford Hill criterion score.
 */
function describeBHScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A';
  return fmt(score, 2);
}

/**
 * Describe Bradford Hill criterion strength label.
 */
function describeBHAssessment(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'Not available';
  if (score >= 0.8) return 'Strong';
  if (score >= 0.5) return 'Moderate';
  if (score >= 0.2) return 'Weak';
  return 'Minimal';
}

/**
 * Format blocking factors into a readable string.
 */
function formatBlockingFactors(factors?: string[]): string {
  if (!factors || factors.length === 0) return 'None identified';
  return factors.map(f => f.replace(/_/g, ' ')).join(', ');
}

/**
 * Summarize recommendation counts.
 */
function recommendationCounts(policies: PolicyAnalysis[]): {
  enact: number;
  replace: number;
  repeal: number;
  maintain: number;
} {
  let enact = 0;
  let replace = 0;
  let repeal = 0;
  let maintain = 0;
  for (const { recommendation } of policies) {
    switch (recommendation.recommendationType) {
      case 'enact': enact += 1; break;
      case 'replace': replace += 1; break;
      case 'repeal': repeal += 1; break;
      case 'maintain': maintain += 1; break;
      default: break;
    }
  }
  return { enact, replace, repeal, maintain };
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

/**
 * Generate a human-readable markdown report from a PolicyRankingResult.
 *
 * The report includes:
 * - Top Policies by Welfare Impact table
 * - Bradford Hill Assessment for each policy
 * - Recommendations sorted by priority
 *
 * @param analysis - Complete policy ranking result
 * @returns Markdown-formatted report string
 */
export function generatePolicyReport(analysis: PolicyRankingResult): string {
  const lines: string[] = [];
  const { jurisdiction, policies, analysisDate } = analysis;

  // --- Title ---
  lines.push(`# Policy Ranking Report: ${jurisdiction.name}`);
  lines.push('');

  // --- Summary ---
  lines.push('## Summary');
  lines.push('');
  lines.push(`Analysis of ${policies.length} policies for **${jurisdiction.name}** (${jurisdiction.type}).`);
  if (analysisDate) {
    lines.push(`Analysis date: ${analysisDate}.`);
  }
  if (jurisdiction.population) {
    lines.push(`Population: ${jurisdiction.population.toLocaleString()}.`);
  }
  if (analysis.overallWelfareScore !== undefined) {
    lines.push(`Overall welfare score: **${fmt(analysis.overallWelfareScore)}**.`);
  }
  if (policies.length > 0) {
    const counts = recommendationCounts(policies);
    lines.push(
      `Actions: ${counts.enact} enact, ${counts.replace} modify, ` +
      `${counts.repeal} repeal, ${counts.maintain} maintain.`
    );
  }
  lines.push('');

  // --- Top Policies by Welfare Impact ---
  if (policies.length > 0) {
    // Sort by welfare score descending
    const ranked = [...policies].sort(
      (a, b) => welfareScore(b.recommendation) - welfareScore(a.recommendation)
    );

    lines.push('## Top Policies by Welfare Impact');
    lines.push('');
    lines.push('| Rank | Policy | Recommendation | Welfare Score | Welfare 95% CI | Evidence | Causal Confidence |');
    lines.push('|------|--------|----------------|--------------|----------------|----------|-------------------|');

    for (let i = 0; i < ranked.length; i++) {
      const p = ranked[i]!;
      const ws = welfareScore(p.recommendation);
      const wsCi = welfareScoreConfidenceInterval(p.recommendation);
      const grade = p.recommendation.evidenceGrade;
      const confidence = describeCausalConfidence(p.causalConfidenceScore);

      lines.push(
        `| ${i + 1} ` +
        `| ${p.policy.name} ` +
        `| ${describeRecommendationType(p.recommendation.recommendationType)} ` +
        `| ${fmt(ws)} ` +
        `| ${wsCi ? `[${fmt(wsCi[0])}, ${fmt(wsCi[1])}]` : '—'} ` +
        `| ${grade} (${describeGrade(grade)}) ` +
        `| ${confidence} |`
      );
    }
    lines.push('');

    // --- Bradford Hill Assessment ---
    const policiesWithBH = ranked.filter(p => p.bradfordHillScores);
    if (policiesWithBH.length > 0) {
      lines.push('## Bradford Hill Assessment');
      lines.push('');

      for (const p of policiesWithBH) {
        const bh = p.bradfordHillScores!;
        lines.push(`### ${p.policy.name}`);
        lines.push('');
        lines.push(`**Evidence Grade:** ${p.recommendation.evidenceGrade} — ${describeGrade(p.recommendation.evidenceGrade)}`);
        if (p.causalConfidenceScore !== undefined) {
          lines.push(`**Causal Confidence Score:** ${fmt(p.causalConfidenceScore, 2)} (${describeCausalConfidence(p.causalConfidenceScore)})`);
        }
        lines.push('');
        lines.push('| Criterion | Score | Assessment |');
        lines.push('|-----------|-------|------------|');
        lines.push(`| Strength | ${describeBHScore(bh.strength)} | ${describeBHAssessment(bh.strength)} |`);
        lines.push(`| Consistency | ${describeBHScore(bh.consistency)} | ${describeBHAssessment(bh.consistency)} |`);
        lines.push(`| Temporality | ${describeBHScore(bh.temporality)} | ${describeBHAssessment(bh.temporality)} |`);
        lines.push(`| Gradient | ${describeBHScore(bh.gradient)} | ${describeBHAssessment(bh.gradient)} |`);
        lines.push(`| Experiment | ${describeBHScore(bh.experiment)} | ${describeBHAssessment(bh.experiment)} |`);
        lines.push(`| Plausibility | ${describeBHScore(bh.plausibility)} | ${describeBHAssessment(bh.plausibility)} |`);
        lines.push(`| Coherence | ${describeBHScore(bh.coherence)} | ${describeBHAssessment(bh.coherence)} |`);
        lines.push(`| Analogy | ${describeBHScore(bh.analogy)} | ${describeBHAssessment(bh.analogy)} |`);
        lines.push(`| Specificity | ${describeBHScore(bh.specificity)} | ${describeBHAssessment(bh.specificity)} |`);
        lines.push('');
      }
      lines.push(
        '> **Note:** Temporality scores 1.0 for all policies because evidence selection requires ' +
        'temporal precedence. This criterion differentiates against confounded associations ' +
        '(reverse causality) rather than between well-designed studies.',
      );
      lines.push('');
    } else {
      lines.push('## Bradford Hill Assessment');
      lines.push('');
      lines.push('No Bradford Hill scores available for this analysis.');
      lines.push('');
    }

    // --- Recommendations ---
    lines.push('## Recommendations');
    lines.push('');

    // Group by recommendation type
    const actionable = ranked.filter(
      p => p.recommendation.recommendationType !== 'maintain'
    ).sort((a, b) => b.recommendation.priorityScore - a.recommendation.priorityScore);

    const maintained = ranked.filter(
      p => p.recommendation.recommendationType === 'maintain'
    );

    if (actionable.length === 0 && maintained.length === 0) {
      lines.push('No recommendations available.');
      lines.push('');
    } else {
      if (actionable.length > 0) {
        for (let i = 0; i < actionable.length; i++) {
          const p = actionable[i]!;
          const rec = p.recommendation;
          const action = describeRecommendationType(rec.recommendationType);
          const grade = rec.evidenceGrade;
          const ws = welfareScore(rec);
          const confidence = describeCausalConfidence(p.causalConfidenceScore);

          lines.push(
            `${i + 1}. **${action}: ${p.policy.name}** — ` +
            `${describeGrade(grade)} (Grade ${grade}), ` +
            `welfare impact: ${fmt(ws)}`
          );
          lines.push(`   - Priority score: ${fmt(rec.priorityScore, 2)}; Policy impact score: ${fmt(rec.policyImpactScore, 2)}`);
          const welfareCi = welfareScoreConfidenceInterval(rec);
          if (welfareCi) {
            lines.push(`   - Welfare 95% CI: ${fmt(welfareCi[0])} to ${fmt(welfareCi[1])}`);
          }

          if (rec.rationale) {
            lines.push(`   - ${rec.rationale}`);
          }
          if (rec.currentStatus && rec.recommendedTarget) {
            lines.push(`   - Current: ${rec.currentStatus} → Recommended: ${rec.recommendedTarget}`);
          }
          if (rec.blockingFactors && rec.blockingFactors.length > 0) {
            lines.push(`   - Blocking factors: ${formatBlockingFactors(rec.blockingFactors)}`);
          }
          if (rec.similarJurisdictions && rec.similarJurisdictions.length > 0) {
            lines.push(`   - Similar jurisdictions: ${rec.similarJurisdictions.join(', ')}`);
          }
          if (confidence !== '—') {
            lines.push(`   - Causal confidence: ${confidence} (${fmt(p.causalConfidenceScore ?? NaN, 2)})`);
          }
        }
        lines.push('');
      }

      if (maintained.length > 0) {
        lines.push('**Policies already well-aligned:**');
        for (const p of maintained) {
          lines.push(`- ${p.policy.name} (Grade ${p.recommendation.evidenceGrade})`);
        }
        lines.push('');
      }
    }
  } else {
    lines.push('## Top Policies by Welfare Impact');
    lines.push('');
    lines.push('No policies to analyze.');
    lines.push('');
    lines.push('## Bradford Hill Assessment');
    lines.push('');
    lines.push('No Bradford Hill scores available for this analysis.');
    lines.push('');
    lines.push('## Recommendations');
    lines.push('');
    lines.push('No recommendations available.');
    lines.push('');
  }

  return lines.join('\n');
}
