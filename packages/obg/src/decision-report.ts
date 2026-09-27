import type {
  SimulationSummary,
  UncertainAllocation,
} from "./uncertain-allocation.js";

export interface DecisionMetric {
  label: string;
  unit: string;
  estimate: SimulationSummary;
}

export interface DecisionParameter {
  id: string;
  label: string;
  unit: string;
  low: number;
  mode: number;
  high: number;
  evidence: string;
  source: string;
  rationale: string;
  rangeKind?: string;
  confidenceLevel?: number;
}

export interface PolicyDecisionResult {
  id: string;
  name: string;
  referenceCase: string;
  referenceBudgetUsd: number;
  annualFundingCapUsd: number;
  allocationEligible: boolean;
  benefit: SimulationSummary;
  netBenefit: SimulationSummary | null;
  benefitCostRatio: SimulationSummary | null;
  metrics: DecisionMetric[];
  assumptions: DecisionParameter[];
  method: string;
  limitations: string[];
  overlapGroup?: string;
}

export interface BudgetDecisionScenario extends UncertainAllocation {
  id: string;
  name: string;
  fundingFraction: number;
  allocations: { policyId: string; name: string; amountUsd: number }[];
  metrics: DecisionMetric[];
  ledger: {
    id: string;
    name: string;
    baselineUsd: number;
    proposedUsd: number;
  }[];
}

/** One serialized result feeds both the website and its Markdown download. */
export interface DecisionReport {
  version: 1;
  jurisdiction: string;
  fiscalYear: number;
  baselineOutlaysUsd: number;
  generatedAt: string;
  seed: number;
  draws: number;
  gridUsd: number;
  objective: string;
  valueBasis: string;
  recommendedScenarioId: string;
  policies: PolicyDecisionResult[];
  scenarios: BudgetDecisionScenario[];
  sensitivity: ({ name: string } & UncertainAllocation)[];
  assumptions: DecisionParameter[];
  limitations: string[];
}

export function formatDecisionMoney(value: number): string {
  const abs = Math.abs(value);
  const scale = abs >= 1e12 ? 1e12 : abs >= 1e9 ? 1e9 : abs >= 1e6 ? 1e6 : 1;
  const suffix =
    scale === 1e12 ? "T" : scale === 1e9 ? "B" : scale === 1e6 ? "M" : "";
  return `${value < 0 ? "−" : ""}$${(abs / scale).toLocaleString("en-US", { maximumFractionDigits: scale === 1 ? 0 : 2 })}${suffix}`;
}

export function formatDecisionInterval(
  value: SimulationSummary,
  money = true,
): string {
  const format = money
    ? formatDecisionMoney
    : (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return `${format(value.mean)} (${format(value.p05)}–${format(value.p95)})`;
}

export function generateDecisionMarkdown(report: DecisionReport): string {
  const chosen = report.scenarios.find(
    (scenario) => scenario.id === report.recommendedScenarioId,
  )!;
  const lines = [
    `# ${report.jurisdiction}: budget and policy decisions under uncertainty`,
    "",
    `Baseline: FY${report.fiscalYear} estimate, ${formatDecisionMoney(report.baselineOutlaysUsd)}.`,
    "",
    `Objective: ${report.objective}`,
    "",
    `Value basis: ${report.valueBasis}`,
    "",
    `Simulation: ${report.draws.toLocaleString("en-US")} common draws; seed ${report.seed}; allocation grid ${formatDecisionMoney(report.gridUsd)}.`,
    "Intervals below are the 5th–95th percentiles of the specified model. They combine evidence with explicit scenario assumptions; they are not clinical confidence intervals.",
    "",
    "## Preferred allocation within the modeled choices",
    "",
    `${chosen.name}: reallocate ${formatDecisionMoney(chosen.annualCostUsd)} once from the military baseline, keeping total outlays unchanged.`,
    `Expected net present benefit: ${formatDecisionInterval(chosen.netBenefit)}.`,
    `P(net benefit > 0 | model): ${(chosen.netBenefit.probabilityPositive * 100).toFixed(1)}%.`,
    "",
    "| Program | Additional appropriation |",
    "|---|---:|",
    ...chosen.allocations.map(
      (row) => `| ${row.name} | ${formatDecisionMoney(row.amountUsd)} |`,
    ),
    "",
    "## Full budget ledger",
    "",
    "| Line | Baseline | Proposed | Change |",
    "|---|---:|---:|---:|",
    ...chosen.ledger.map(
      (row) =>
        `| ${row.name} | ${formatDecisionMoney(row.baselineUsd)} | ${formatDecisionMoney(row.proposedUsd)} | ${formatDecisionMoney(row.proposedUsd - row.baselineUsd)} |`,
    ),
    `| **Total** | **${formatDecisionMoney(report.baselineOutlaysUsd)}** | **${formatDecisionMoney(chosen.ledger.reduce((sum, row) => sum + row.proposedUsd, 0))}** | **$0** |`,
    "",
    "## Funding-envelope sensitivity",
    "",
    "| Maximum military reallocation | Actual reallocation | Net present benefit, mean (90% model interval) |",
    "|---|---:|---:|",
    ...report.scenarios.map(
      (row) =>
        `| ${row.name} | ${formatDecisionMoney(row.annualCostUsd)} | ${formatDecisionInterval(row.netBenefit)} |`,
    ),
    "",
    "## Other sensitivity checks",
    "",
    "| Assumption | Reallocation | Net present benefit |",
    "|---|---:|---:|",
    ...report.sensitivity.map(
      (row) =>
        `| ${row.name} | ${formatDecisionMoney(row.annualCostUsd)} | ${formatDecisionInterval(row.netBenefit)} |`,
    ),
    "",
    "## Policy reference cases",
    "",
    "Reference cases are standalone comparisons. Clinical-trial access and funding overlap; their standalone benefits must not be added.",
    "",
  ];
  for (const policy of report.policies) {
    lines.push(
      `### ${policy.name}`,
      "",
      `Reference case: ${policy.referenceCase}`,
      `Reference appropriation: ${formatDecisionMoney(policy.referenceBudgetUsd)}. Funding cap: ${formatDecisionMoney(policy.annualFundingCapUsd)}.`,
      `Present ${policy.allocationEligible ? "benefit" : "gross renter benefit"}: ${formatDecisionInterval(policy.benefit)}.`,
      ...(policy.benefitCostRatio
        ? [
            `Benefit net of downstream costs per public dollar: ${formatDecisionInterval(policy.benefitCostRatio, false)}.`,
          ]
        : []),
      ...(policy.netBenefit
        ? [
            `Net benefit after financing opportunity cost: ${formatDecisionInterval(policy.netBenefit)}.`,
          ]
        : [
            "Net social benefit is not estimated; gross transfers are excluded from the allocation objective.",
          ]),
      "",
      policy.method,
      "",
      "| Native outcome | Mean (90% model interval) | Unit |",
      "|---|---:|---|",
      ...policy.metrics.map(
        (metric) =>
          `| ${metric.label} | ${formatDecisionInterval(metric.estimate, false)} | ${metric.unit} |`,
      ),
      "",
      ...policy.limitations.map((text) => `- ${text}`),
      "",
      "<details><summary>Inputs and sources</summary>",
      "",
      "| Input | Low / mode / high | Basis | Source |",
      "|---|---|---|---|",
      ...policy.assumptions.map(
        (p) =>
          `| ${p.label} (${p.unit}) | ${p.low} / ${p.mode} / ${p.high} | ${p.evidence}; ${p.rangeKind ?? "scenario range"}. ${p.rationale.replaceAll("|", "/")} | [Source](${p.source}) |`,
      ),
      "",
      "</details>",
      "",
    );
  }
  lines.push(
    "## Shared assumptions",
    "",
    ...report.assumptions.map(
      (p) =>
        `- **${p.label}:** ${p.low} / ${p.mode} / ${p.high} ${p.unit}. ${p.rationale} [Source](${p.source}).`,
    ),
    "",
    "## Scope and interpretation",
    "",
    ...report.limitations.map((text) => `- ${text}`),
    "",
    `Generated ${report.generatedAt}.`,
    "",
  );
  return lines.join("\n");
}
