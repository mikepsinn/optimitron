import type { PolicyReportPolicy } from "@optimitron/opg";

/** Policy effects are fractions. Without a baseline and horizon, do not convert to dollars or years. */
export function formatPolicyEffect(effect: number | null): string {
  if (effect === null || !Number.isFinite(effect)) return "Not estimated";
  return `${effect > 0 ? "+" : ""}${Number((effect * 100).toFixed(1))}%`;
}

export function policyEvidenceLabel(kind: PolicyReportPolicy["evidenceKind"]): string {
  if (kind === "comparison") return "Country comparison";
  return kind === "estimate" ? "Evaluated policy" : "Policy proposal";
}

/** Keep existing URLs while replacing the old adoption instruction in comparison titles. */
export function policyDisplayName(policy: Pick<PolicyReportPolicy, "name" | "evidenceKind">): string {
  return policy.evidenceKind === "comparison"
    ? policy.name.replace(/: Adopt (.+)'s Approach$/, ": $1 comparison")
    : policy.name;
}
