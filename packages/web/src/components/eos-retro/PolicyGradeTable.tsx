import { usPolicyAnalysis } from "@/data/us-policy-analysis";

/**
 * Top rows of the live Optimal Policy Generator output, graded A to F.
 * Adapted from demo/slides/sierra/slide-optimal-policy-generator.tsx with
 * the Sierra chrome stripped and the hardcoded demo rows replaced by the
 * generated usPolicyAnalysis dataset (same source as /opg).
 */

const ROW_LIMIT = 4;

type PolicyRowData = (typeof usPolicyAnalysis.policies)[number];

/**
 * The generator emits near-duplicate "Adopt X's approach" rows for sibling
 * budget categories with identical effect sizes; dedupe on the effect pair
 * so the exhibit shows four distinct recommendations.
 */
export function topDistinctPolicies(): PolicyRowData[] {
  const seen = new Set<string>();
  const rows: PolicyRowData[] = [];
  for (const policy of usPolicyAnalysis.policies) {
    const signature = `${policy.healthEffect}|${policy.incomeEffect}`;
    if (seen.has(signature)) continue;
    seen.add(signature);
    rows.push(policy);
    if (rows.length >= ROW_LIMIT) break;
  }
  return rows;
}

function gradeTier(grade: string): "good" | "mid" | "bad" {
  if (grade === "A" || grade === "B") return "good";
  if (grade === "C") return "mid";
  return "bad";
}

function actionFor(recommendationType: string): {
  label: string;
  kind: "enact" | "reallocate" | "repeal";
} {
  switch (recommendationType) {
    case "implement":
      return { label: "Enact", kind: "enact" };
    case "repeal":
    case "eliminate":
      return { label: "Repeal", kind: "repeal" };
    default:
      return { label: "Reallocate", kind: "reallocate" };
  }
}

function fmtEffect(value: number, unit: string): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)} ${unit}`;
}

export function PolicyGradeTable() {
  const rows = topDistinctPolicies();

  return (
    <div className="er-panel er-ticked">
      <div className="er-table-scroll">
        <table className="er-table">
          <thead>
            <tr>
              <th scope="col">Policy</th>
              <th scope="col">Health</th>
              <th scope="col">Income</th>
              <th scope="col">Grade</th>
              <th scope="col">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const action = actionFor(row.recommendationType);
              return (
                <tr key={row.name}>
                  <td>
                    <p className="er-body text-sm font-bold" style={{ color: "var(--er-cream)" }}>
                      {row.name}
                    </p>
                  </td>
                  <td className="er-td-num">
                    <span className={row.healthEffect >= 0 ? "er-effect-up" : "er-effect-down"}>
                      {fmtEffect(row.healthEffect, "yrs")}
                    </span>
                  </td>
                  <td className="er-td-num">
                    <span className={row.incomeEffect >= 0 ? "er-effect-up" : "er-effect-down"}>
                      {fmtEffect(row.incomeEffect, "pp/yr")}
                    </span>
                  </td>
                  <td>
                    <span className="er-grade" data-tier={gradeTier(row.evidenceGrade)}>
                      {row.evidenceGrade}
                    </span>
                  </td>
                  <td>
                    <span className="er-action" data-kind={action.kind}>
                      {action.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="er-caption border-t px-3 py-2" style={{ borderColor: "var(--er-line)" }}>
        Health = healthy life-years gained per person. Income = added income
        growth in percentage points per year. Grade = evidence strength, A to
        F. Live output for {usPolicyAnalysis.jurisdiction}; the full ranking
        runs {usPolicyAnalysis.policies.length} policies deep.
      </p>
    </div>
  );
}
