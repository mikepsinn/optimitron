"use client";

import { useState } from "react";
import Link from "next/link";
import { usPolicyAnalysis } from "@/data/us-policy-analysis";
import { getPolicyPath } from "@/lib/routes";
import { getNationalBudgetComparisons, type NationalBudgetComparison } from "@/lib/analysis-products";
import { policyDisplayName, policyEvidenceLabel } from "@/lib/policy-presentation";

const comparisons = new Map(getNationalBudgetComparisons().map((comparison) => [comparison.spendingField, comparison]));

function CountryComparison({ comparison }: { comparison: NationalBudgetComparison }) {
  const { efficiency, oecdBenchmark } = comparison.category;
  if (!efficiency) return null;

  const incomeOutcome = comparison.spendingField === "rdSpendingPerCapitaPpp" || comparison.spendingField === "socialSpendingPerCapitaPpp";
  const outcomeLabel = incomeOutcome
    ? "Median disposable income"
    : comparison.spendingField === "educationSpendingPerCapitaPpp" ? "PISA math score" : "Life expectancy";
  const countries = [
    { name: usPolicyAnalysis.jurisdiction, spending: efficiency.spendingPerCapita, outcome: efficiency.outcome, years: oecdBenchmark?.comparisonYears?.target },
    { name: efficiency.bestCountry.name, spending: efficiency.bestCountry.spendingPerCapita, outcome: efficiency.bestCountry.outcome, years: oecdBenchmark?.comparisonYears?.peer },
  ];
  const maxSpending = Math.max(...countries.map((country) => country.spending));

  return (
    <div className="mt-5">
      <p className="mb-3 text-sm font-semibold">{comparison.label}</p>
      <div className="grid grid-cols-2 gap-4">
        {countries.map((country) => (
          <div key={country.name} className="min-w-0">
            <h3 className="border-b border-foreground/20 pb-2 text-sm font-bold">{country.name}</h3>
            <dl>
              <div className="mt-3">
                <dt className="text-xs text-muted-foreground"><p>Spending / person / year</p></dt>
                <dd className="mt-1 text-2xl font-black tabular-nums">
                  <p>${Math.round(country.spending).toLocaleString("en-US")}</p>
                  <span aria-hidden="true" className="my-3 block h-2 bg-muted">
                    <span className="block h-full bg-foreground" style={{ width: `${maxSpending > 0 ? country.spending / maxSpending * 100 : 0}%` }} />
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground"><p>{outcomeLabel}</p></dt>
                <dd className="mt-1 text-lg font-bold tabular-nums">
                  <p>
                    {incomeOutcome ? "$" : ""}{country.outcome.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: incomeOutcome ? 2 : 0 })}
                    {!incomeOutcome && comparison.spendingField !== "educationSpendingPerCapitaPpp" ? <span className="text-sm font-normal"> years</span> : null}
                  </p>
                </dd>
              </div>
              <div className="mt-3">
                <dt className="text-xs text-muted-foreground"><p>Observation years</p></dt>
                <dd className="mt-1 text-xs tabular-nums"><p>{country.years?.length ? country.years.join(", ") : "Unavailable"}</p></dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Spending: constant 2017 international dollars (PPP). Averages over the observation years shown.</p>
      {incomeOutcome ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Income: after-tax household median, adjusted for household size; OECD real PPP, with a different price basis from spending.</p> : null}
    </div>
  );
}

export default function PoliciesPage() {
  const [category, setCategory] = useState("all");
  const policies = usPolicyAnalysis.policies.filter((policy) => category === "all" || policy.category === category);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex flex-col gap-6 border-b-2 border-foreground pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-3 text-3xl font-black uppercase tracking-tight md:text-4xl">Policy evidence</h1>
          <p className="max-w-lg text-muted-foreground">Explore policy proposals for better health and higher incomes.</p>
        </div>
        <div className="shrink-0">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide" htmlFor="policy-category">Category</label>
          <select id="policy-category" value={category} onChange={(event) => setCategory(event.target.value)}
            className="w-full max-w-full border-2 border-foreground bg-background px-3 py-2.5 text-sm font-semibold md:w-56">
            <option value="all">All categories</option>
            {[...new Set(usPolicyAnalysis.policies.map((policy) => policy.category))].map((value) => (
              <option key={value} value={value}>{value.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {policies.map((policy) => {
          const comparison = policy.evidenceKind === "comparison" && policy.oecdSpendingField ? comparisons.get(policy.oecdSpendingField) : undefined;
          return (
            <article key={policy.name} className="flex min-w-0 flex-col border-2 border-foreground bg-card shadow-[3px_3px_0_0_var(--foreground)]">
              <div className="flex-1 p-5 sm:p-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{policyEvidenceLabel(policy.evidenceKind)}</p>
                <h2 className="text-xl font-black leading-snug tracking-tight">
                  <Link className="underline-offset-4 hover:underline focus-visible:underline" href={getPolicyPath(policy.name)}>{policyDisplayName(policy)}</Link>
                </h2>
                {comparison?.category.efficiency ? (
                  <CountryComparison comparison={comparison} />
                ) : (
                  <>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{policy.description}</p>
                    {policy.evidenceKind !== "comparison" ? <dl className="mt-5 space-y-4 border-l-2 border-foreground/20 pl-4">
                      {policy.currentStatus ? (
                        <div>
                          <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground"><p>Today</p></dt>
                          <dd className="mt-1 text-sm leading-relaxed"><p>{policy.currentStatus}</p></dd>
                        </div>
                      ) : null}
                      {policy.recommendedTarget ? (
                        <div>
                          <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground"><p>Proposed change</p></dt>
                          <dd className="mt-1 text-sm font-semibold leading-relaxed"><p>{policy.recommendedTarget}</p></dd>
                        </div>
                      ) : null}
                    </dl> : null}
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/20 bg-muted/40 px-5 py-4 sm:px-6">
                {policy.evidenceKind === "comparison" ? <p className="text-xs text-muted-foreground">{policy.recommendedTarget}</p> : null}
                <Link className="ml-auto inline-flex min-h-6 items-center gap-3 text-sm font-bold underline-offset-4 hover:underline focus-visible:underline" href={getPolicyPath(policy.name)}>View analysis <span aria-hidden="true">→</span></Link>
              </div>
            </article>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground mt-8">
        <Link href="/obg" className="underline">Compare spending and outcomes.</Link>
      </p>
      <p className="text-xs text-muted-foreground mt-4">Generated: {usPolicyAnalysis.generatedAt.slice(0, 10)}</p>
    </div>
  );
}
