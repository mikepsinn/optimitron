import { getNationalBudgetComparisons } from "@/lib/analysis-products";

function dollars(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/** Observed health-spending comparison; no fitted frontier or fiscal savings. */
export function BudgetFrontierExhibit() {
  const comparison = getNationalBudgetComparisons().find(
    (row) => row.spendingField === "healthSpendingPerCapitaPpp",
  );
  if (!comparison?.category.efficiency) return null;
  const efficiency = comparison.category.efficiency;

  const period = comparison.category.oecdBenchmark?.comparisonYears;
  const countries = [
    { name: "United States", spending: efficiency.spendingPerCapita, outcome: efficiency.outcome, years: period?.target },
    { name: efficiency.bestCountry.name, spending: efficiency.bestCountry.spendingPerCapita, outcome: efficiency.bestCountry.outcome, years: period?.peer },
  ];
  const maxSpending = Math.max(...countries.map((country) => country.spending), 1);

  return (
    <div>
      <p className="er-card-title">Healthcare: spending and observed outcomes</p>
      <p className="er-body mt-3 text-sm">
        Compare total health spending, public and private, with life expectancy.
        This is a starting point for studying prices, access and population health.
      </p>
      <div className="mt-6 space-y-5">
        {countries.map((country, index) => (
          <div key={index}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="er-card-title">{country.name}</p>
              <p className="er-mono text-sm">{dollars(country.spending)} / person / year</p>
            </div>
            <div className="er-bar-track mt-2">
              <div className="er-bar-fill" style={{ width: `${country.spending / maxSpending * 100}%`, background: index === 0 ? "var(--er-orange)" : "var(--er-gold)" }} />
            </div>
            <p className="er-caption mt-2">
              Life expectancy: {country.outcome.toFixed(1)} years · Observations: {country.years?.join(", ") ?? "unavailable"}
            </p>
          </div>
        ))}
      </div>
      <p className="er-caption mt-4">
        Spending: constant 2017 international dollars per person per year (PPP).
        Average of up to three latest available observations per country.
        The comparison does not establish the effect of cutting spending.
      </p>
      <p className="er-body mt-5 text-sm">
        A useful budget recommendation needs evidence about a specific reform
        and the services it would preserve. These national differences cannot
        be added into a government savings total.
      </p>
      <a className="er-caption mt-3 inline-block underline underline-offset-4" href="https://data.worldbank.org/indicator/SH.XPD.CHEX.GD.ZS">World Bank health expenditure ↗</a>
    </div>
  );
}
