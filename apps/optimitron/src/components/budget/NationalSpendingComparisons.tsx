import Link from "next/link";
import type { NationalBudgetComparison } from "@/lib/analysis-products";
import { getBudgetCategoryPath } from "@/lib/routes";

const FIELD_CONTEXT: Record<string, { source: string; sourceName: string; question: string }> = {
  healthSpendingPerCapitaPpp: {
    source: "https://data.worldbank.org/indicator/SH.XPD.CHEX.GD.ZS",
    sourceName: "World Bank health expenditure",
    question: "Compare prices, access and population health before estimating what a specific reform could save.",
  },
  educationSpendingPerCapitaPpp: {
    source: "https://data.worldbank.org/indicator/SE.XPD.TOTL.GD.ZS",
    sourceName: "World Bank education expenditure",
    question: "Check student demographics, school coverage and spending per student before transferring a result.",
  },
  militarySpendingPerCapitaPpp: {
    source: "https://data.worldbank.org/indicator/MS.MIL.XPND.GD.ZS",
    sourceName: "World Bank military expenditure",
    question: "Life expectancy does not measure security commitments or military effectiveness. This comparison cannot set a defense budget.",
  },
  rdSpendingPerCapitaPpp: {
    source: "https://data.worldbank.org/indicator/GB.XPD.RSDV.GD.ZS",
    sourceName: "World Bank R&D expenditure",
    question: "Separate business and government research, and account for the years between research spending and its benefits.",
  },
  socialSpendingPerCapitaPpp: {
    source: "https://www.oecd.org/en/data/datasets/social-expenditure-database-socx.html",
    sourceName: "OECD Social Expenditure Database",
    question: "Check pension coverage, population age and health spending overlap before comparing specific programs.",
  },
};

function money(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function years(values: number[] | undefined): string {
  return values?.length ? [...values].sort((a, b) => a - b).join(", ") : "Years unavailable";
}

export function NationalSpendingComparison({ comparison }: { comparison: NationalBudgetComparison }) {
  const { category, spendingField, label, relatedCategories } = comparison;
  const efficiency = category.efficiency;
  const context = FIELD_CONTEXT[spendingField];
  const comparisonYears = category.oecdBenchmark?.comparisonYears;
  const incomeOutcome = spendingField === "rdSpendingPerCapitaPpp" || spendingField === "socialSpendingPerCapitaPpp";
  const outcomeSource = incomeOutcome
    ? { name: "OECD Income Distribution Database", href: "https://www.oecd.org/en/data/datasets/income-distribution-database.html" }
    : spendingField === "educationSpendingPerCapitaPpp"
      ? { name: "OECD PISA data", href: "https://www.oecd.org/en/about/programmes/pisa/pisa-data.html" }
      : { name: "World Bank life expectancy", href: "https://data.worldbank.org/indicator/SP.DYN.LE00.IN" };

  return (
    <article id={spendingField} className="scroll-mt-24 border-4 border-primary bg-background p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-lg font-black text-foreground">{label}</h3>
      {efficiency ? (
        <>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            {efficiency.bestCountry.name} has the lowest spending among the top quarter for {efficiency.outcomeName.toLowerCase()} in this {efficiency.totalCountries}-country comparison.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              { name: "United States", spending: efficiency.spendingPerCapita, outcome: efficiency.outcome, period: comparisonYears?.target },
              { name: efficiency.bestCountry.name, spending: efficiency.bestCountry.spendingPerCapita, outcome: efficiency.bestCountry.outcome, period: comparisonYears?.peer },
            ].map((country, index) => (
              <div key={index} className="border-2 border-primary p-4">
                <p className="text-sm font-black text-foreground">{country.name}</p>
                <p className="mt-2 text-2xl font-black text-foreground">{money(country.spending)}<span className="text-sm"> / person / year</span></p>
                <p className="mt-2 text-sm font-bold text-foreground">{efficiency.outcomeName}: {country.outcome.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
                <p className="mt-2 text-xs font-bold text-muted-foreground">Observations: {years(country.period)}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs font-bold text-muted-foreground">
            Average of up to three latest available annual observations per country. Spending is in constant 2017 international dollars per person per year (PPP); the years can differ. This is an observed comparison, with no estimated causal effect or uncertainty interval.
          </p>
          {incomeOutcome && <p className="mt-2 text-xs font-bold text-muted-foreground">Income uses measured OECD disposable household income, adjusted for household size and OECD real PPP. Its unit and price basis differ from the spending series.</p>}
        </>
      ) : (
        <p className="mt-3 text-sm font-bold text-muted-foreground">
          Comparable outcome data are unavailable for this field. No country ranking or spending target is reported.
        </p>
      )}
      {context && (
        <div className="mt-5 border-t-2 border-primary pt-4">
          <p className="text-sm font-bold text-foreground">{context.question}</p>
          <a href={context.source} className="mt-3 inline-block text-sm font-bold underline underline-offset-4">{context.sourceName} ↗</a>
          <a href={outcomeSource.href} className="mt-2 block text-sm font-bold underline underline-offset-4">{outcomeSource.name} ↗</a>
        </div>
      )}
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-bold text-foreground">Related federal spending</summary>
        <p className="mt-2 text-xs font-bold text-muted-foreground">These lines provide budget context. The national comparison does not estimate their individual effects or recommend cuts.</p>
        <ul className="mt-3 space-y-2">
          {relatedCategories.map((row) => (
            <li key={row.id}><Link href={getBudgetCategoryPath(row.name)} className="font-bold underline underline-offset-4">{row.name}</Link></li>
          ))}
        </ul>
      </details>
    </article>
  );
}

export function NationalSpendingComparisons({ comparisons }: { comparisons: NationalBudgetComparison[] }) {
  return <div className="grid gap-6 lg:grid-cols-2">{comparisons.map((comparison) => <NationalSpendingComparison key={comparison.spendingField} comparison={comparison} />)}</div>;
}

export function BudgetComparisonMethod() {
  return (
    <section className="mt-10 border-t-4 border-primary pt-6">
      <h2 className="text-xl font-black text-foreground">How to read these comparisons</h2>
      <p className="mt-3 max-w-4xl text-sm font-bold text-muted-foreground">
        A country spending less with a good outcome is a place to investigate. It does not show what would happen if the US copied its budget. The selection does not adjust for demographics, institutions, security commitments or other differences between countries.
      </p>
      <p className="mt-3 max-w-4xl text-sm font-bold text-muted-foreground">The health comparison uses life expectancy at birth; healthy life expectancy is a separate measure. Income comparisons use measured household disposable income where a compatible series is available.</p>
      <p className="mt-3 max-w-4xl text-sm font-bold text-muted-foreground">
        These fields overlap and cover different payers: healthcare and R&D include private spending, education includes state and local government, and social spending includes health. Their spending differences cannot be added into federal savings or a household dividend.
      </p>
    </section>
  );
}
