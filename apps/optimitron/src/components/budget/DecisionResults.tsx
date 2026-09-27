import Link from "next/link";
import type { PolicyDecisionResult, SimulationSummary } from "@optimitron/obg";
import { usDecisionAnalysis as report } from "@/data/us-decision-analysis";

const money = (value: number) => {
  const magnitude = Math.abs(value);
  const scale =
    magnitude >= 1e12
      ? 1e12
      : magnitude >= 1e9
        ? 1e9
        : magnitude >= 1e6
          ? 1e6
          : 1;
  return `${value < 0 ? "−" : ""}$${(magnitude / scale).toLocaleString("en-US", { maximumFractionDigits: scale === 1 ? 0 : 2 })}${scale === 1e12 ? "T" : scale === 1e9 ? "B" : scale === 1e6 ? "M" : ""}`;
};
const number = (value: number) =>
  value.toLocaleString("en-US", { maximumFractionDigits: 0 });
const inputNumber = (value: number) =>
  value.toLocaleString("en-US", { maximumSignificantDigits: 8 });
const range = (estimate: SimulationSummary, format = money) =>
  `${format(estimate.p05)} to ${format(estimate.p95)}`;

export function PolicyDecisionSummary({
  policy,
  expanded = false,
}: {
  policy: PolicyDecisionResult;
  expanded?: boolean;
}) {
  const native = policy.metrics.filter(
    (metric) =>
      !metric.label.includes("benchmark") &&
      !metric.label.includes("canonical") &&
      !metric.label.startsWith("Discounted") &&
      !metric.label.startsWith("Added treatment"),
  );
  return (
    <section
      className="mt-5 border-t border-foreground/20 pt-4"
      aria-label="Modeled policy benefits"
    >
      <p className="text-xs font-bold uppercase tracking-wide">
        {policy.allocationEligible
          ? "Modeled benefit"
          : "Modeled renter savings"}
      </p>
      <p className="mt-1 text-2xl font-black tabular-nums">
        {money(policy.benefit.mean)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        90% model range: {range(policy.benefit)}
      </p>
      <p className="mt-2 text-xs">
        Present value from {money(policy.referenceBudgetUsd)} in additional
        funding.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {policy.referenceCase}
      </p>
      {expanded && (
        <>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            {native.map((metric) => (
              <div key={metric.label}>
                <dt className="text-sm font-bold">{metric.label}</dt>
                <dd className="mt-1 text-xl font-black tabular-nums">
                  {metric.unit.includes("USD")
                    ? money(metric.estimate.mean)
                    : number(metric.estimate.mean)}
                </dd>
                <dd className="mt-1 text-xs text-muted-foreground">
                  90% range:{" "}
                  {range(
                    metric.estimate,
                    metric.unit.includes("USD") ? money : number,
                  )}
                </dd>
              </div>
            ))}
            {policy.netBenefit && (
              <div>
                <dt className="text-sm font-bold">
                  Net benefit after financing costs
                </dt>
                <dd className="mt-1 text-xl font-black">
                  {money(policy.netBenefit.mean)}
                </dd>
                <dd className="mt-1 text-xs text-muted-foreground">
                  90% range: {range(policy.netBenefit)}
                </dd>
              </div>
            )}
          </dl>
          <p className="mt-5 text-sm leading-relaxed">{policy.method}</p>
          <details className="mt-5 text-sm">
            <summary className="cursor-pointer font-bold">
              Inputs, sources and uncertainty
            </summary>
            <p className="mt-3">
              {report.draws.toLocaleString("en-US")} simulations. Scenario
              ranges describe explicit assumptions; published statistical
              intervals retain their source. Clinical results assume the funded
              program is implemented.
            </p>
            <ul className="mt-4 space-y-3">
              {policy.assumptions.map((input) => (
                <li key={input.id}>
                  <a
                    href={input.source}
                    className="font-semibold underline underline-offset-4"
                  >
                    {input.label}
                  </a>
                  : {inputNumber(input.low)} / {inputNumber(input.mode)} /{" "}
                  {inputNumber(input.high)} {input.unit}.{" "}
                  <span className="text-muted-foreground">
                    {input.evidence === "scenario"
                      ? "Scenario assumption. "
                      : ""}
                    {input.rationale}
                  </span>
                </li>
              ))}
            </ul>
            <ul className="mt-5 list-disc space-y-2 pl-5">
              {policy.limitations.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
            <p className="mt-4">
              <a
                className="font-bold underline"
                href="/reports/us-budget-policy-decision.md"
              >
                Download the full model and report
              </a>
            </p>
          </details>
        </>
      )}
    </section>
  );
}

export function BudgetDecisionResults() {
  const result = report.scenarios.find(
    (scenario) => scenario.id === report.recommendedScenarioId,
  )!;
  return (
    <section
      className="mb-12 border-2 border-foreground p-5 sm:p-6"
      aria-label="Budget optimization with uncertainty"
    >
      <h2 className="text-xl font-black sm:text-2xl">
        The model&apos;s preferred allocation
      </h2>
      <p className="mt-3 text-sm">
        Move {money(result.annualCostUsd)} from the military budget into the
        programs below. Total estimated FY{report.fiscalYear} outlays stay at{" "}
        {money(report.baselineOutlaysUsd)}.
      </p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-sm font-bold">Expected net present benefit</p>
          <p className="mt-1 text-3xl font-black tabular-nums">
            {money(result.netBenefit.mean)}
          </p>
          <p className="mt-2 text-sm">
            90% model range: {range(result.netBenefit)}
          </p>
        </div>
        <div>
          <p className="text-sm font-bold">
            Probability of positive net benefit
          </p>
          <p className="mt-1 text-3xl font-black tabular-nums">
            {(result.netBenefit.probabilityPositive * 100).toFixed(0)}%
          </p>
          <p className="mt-2 text-sm">
            Conditional on implementation and the stated assumptions.
          </p>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-foreground">
              <th className="py-3 pr-4">Additional program funding</th>
              <th className="py-3 text-right">Allocation</th>
            </tr>
          </thead>
          <tbody>
            {result.allocations.map((row) => (
              <tr key={row.policyId} className="border-b border-foreground/20">
                <td className="py-3 pr-4">
                  {row.policyId === "clinical-joint" ? (
                    row.name
                  ) : (
                    <Link
                      className="font-semibold underline underline-offset-4"
                      href={`/opg/${row.policyId}`}
                    >
                      {row.name}
                    </Link>
                  )}
                </td>
                <td className="py-3 text-right font-bold tabular-nums">
                  {money(row.amountUsd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        These are the best choices within the modeled program sizes. Clinical
        benefits cover 20 years; they are valued health gains, not government
        cash savings.
      </p>
      <details className="mt-5 text-sm">
        <summary className="cursor-pointer font-bold">
          Full budget and sensitivity analysis
        </summary>
        <p className="mt-4">
          Other programs and the{" "}
          {money(
            result.ledger.find((row) => row.id === "unreconciled_other_outlays")
              ?.baselineUsd ?? 0,
          )}{" "}
          accounting residual remain fixed. The baseline is a reconciled
          estimate, not an audited appropriation crosswalk.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-foreground">
                <th className="py-3 pr-4">Federal line</th>
                <th className="py-3 pr-4 text-right">Baseline</th>
                <th className="py-3 text-right">Proposed</th>
              </tr>
            </thead>
            <tbody>
              {result.ledger.map((row) => (
                <tr key={row.id} className="border-b border-foreground/20">
                  <td className="py-2 pr-4">{row.name}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {money(row.baselineUsd)}
                  </td>
                  <td className="py-2 text-right font-bold tabular-nums">
                    {money(row.proposedUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="mt-6 font-bold">What changes the recommendation?</h3>
        <ul className="mt-3 space-y-3">
          {report.sensitivity.map((scenario) => (
            <li key={scenario.name}>
              <strong>{scenario.name}:</strong> allocate{" "}
              {money(scenario.annualCostUsd)}; expected net benefit{" "}
              {money(scenario.netBenefit.mean)} ({range(scenario.netBenefit)}).
            </li>
          ))}
        </ul>
        <p className="mt-4">
          Higher funding ceilings do not create evidence for larger programs.
          The report preserves each capacity limit and shows the 0%, 1%, 5% and
          10% funding scenarios.
        </p>
      </details>
      <a
        href="/reports/us-budget-policy-decision.md"
        className="mt-6 inline-block font-bold underline underline-offset-4"
      >
        Download calculations, assumptions and sources →
      </a>
    </section>
  );
}
