/**
 * Type definitions for the policy analysis report.
 *
 * Contract between the generator and the web app.
 * The generated .ts file uses `satisfies PolicyReportJSON` for compile-time validation.
 */

export interface PolicyReportPolicy {
  name: string;
  type: string;
  category: string;
  description: string;
  recommendationType: string;
  evidenceGrade: string;
  causalConfidenceScore: number;
  policyImpactScore: number;
  welfareScore: number;
  incomeEffect: number;
  healthEffect: number;
  bradfordHillScores: Record<string, number>;
  rationale: string;
  currentStatus: string;
  recommendedTarget: string;
  blockingFactors: string[];
}

export interface PolicyReportJSON {
  jurisdiction: string;
  policies: PolicyReportPolicy[];
  generatedAt: string;
  generatedBy?: string;
  note?: string;
}
