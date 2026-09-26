import type { PolicyReportJSON, PolicyReportPolicy } from "./policy-report-json.js";

export interface PolicyLegislationBrief {
  slug: string;
  title: string;
  policyName: string;
  category: string;
  summary: string;
  recommendationType: string;
  evidenceGrade: string;
  causalConfidenceScore: number;
  welfareScore: number;
  currentStatus: string;
  recommendedTarget: string;
  rationale: string;
  blockingFactors: string[];
  sourceGeneratedAt: string;
}

export interface PolicyLegislationBriefOptions {
  includeMaintain?: boolean;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toActionLabel(recommendationType: string): string {
  switch (recommendationType) {
    case "enact":
      return "to enact";
    case "replace":
    case "reallocate":
      return "to replace";
    case "repeal":
      return "to repeal";
    case "maintain":
      return "to maintain";
    default:
      return "to implement";
  }
}

type EstimatedPolicy = PolicyReportPolicy & {
  evidenceKind: 'estimate';
  evidenceGrade: string;
  causalConfidenceScore: number;
  welfareScore: number;
};

/** Assumptions and peer observations must not become certified-effect draft inputs. */
function isEstimatedPolicy(policy: PolicyReportPolicy): policy is EstimatedPolicy {
  return policy.evidenceKind === 'estimate'
    && policy.evidenceGrade !== null
    && policy.causalConfidenceScore !== null
    && Number.isFinite(policy.causalConfidenceScore)
    && policy.welfareScore !== null
    && Number.isFinite(policy.welfareScore);
}

function toBrief(policy: EstimatedPolicy, generatedAt: string): PolicyLegislationBrief {
  return {
    slug: slugify(policy.name),
    title: `Policy Brief: ${policy.name}`,
    policyName: policy.name,
    category: policy.category,
    summary:
      `${policy.name} is recommended ${toActionLabel(policy.recommendationType)} ` +
      `with evidence grade ${policy.evidenceGrade} and welfare score ${policy.welfareScore}.`,
    recommendationType: policy.recommendationType,
    evidenceGrade: policy.evidenceGrade,
    causalConfidenceScore: policy.causalConfidenceScore,
    welfareScore: policy.welfareScore,
    currentStatus: policy.currentStatus,
    recommendedTarget: policy.recommendedTarget,
    rationale: policy.rationale,
    blockingFactors: policy.blockingFactors,
    sourceGeneratedAt: generatedAt,
  };
}

export function createPolicyLegislationBriefs(
  report: PolicyReportJSON,
  options?: PolicyLegislationBriefOptions,
): PolicyLegislationBrief[] {
  const includeMaintain = options?.includeMaintain ?? false;

  return report.policies
    .filter(isEstimatedPolicy)
    .filter((policy) => includeMaintain || policy.recommendationType !== "maintain")
    .sort((left, right) => right.welfareScore - left.welfareScore)
    .map((policy) => toBrief(policy, report.generatedAt));
}
