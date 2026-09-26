import Link from "next/link";
import { usPolicyAnalysis } from "@/data/us-policy-analysis";
import { getPolicyPath } from "@/lib/routes";

export const POLICY_ROW_LIMIT = 5;

export function topDistinctPolicies() {
  return usPolicyAnalysis.policies.filter((policy) => !policy.oecdSpendingField).slice(0, POLICY_ROW_LIMIT);
}

export function PolicyGradeTable() {
  return (
    <div className="er-panel er-ticked">
      <ul className="divide-y" style={{ borderColor: "var(--er-line)" }}>
        {topDistinctPolicies().map((policy) => (
          <li className="p-4" key={policy.name}>
            <Link href={getPolicyPath(policy.name)} className="er-body text-sm font-bold underline" style={{ color: "var(--er-cream)" }}>
              {policy.name}
            </Link>
            <p className="er-caption mt-1">{policy.recommendedTarget}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
