import { z } from 'zod';
import type { CausalConfidenceScore } from './bradford-hill.js';

export const PolicyEvidenceGradeSchema = z.enum(['A', 'B', 'C', 'D', 'F']);
export type PolicyEvidenceGrade = z.infer<typeof PolicyEvidenceGradeSchema>;

export function derivePolicyEvidenceGrade(
  causalConfidenceScore: CausalConfidenceScore,
  predictivePearson: number,
): PolicyEvidenceGrade {
  const weightedScore = 0.6 * causalConfidenceScore + 0.4 * Math.abs(predictivePearson);

  if (weightedScore >= 0.5) return 'A';
  if (weightedScore >= 0.3) return 'B';
  if (weightedScore >= 0.1) return 'C';
  if (weightedScore >= 0.05) return 'D';
  return 'F';
}
