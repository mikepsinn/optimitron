import Link from "next/link";
import { notFound } from "next/navigation";
import { usBudgetAnalysis } from "@/data/us-budget-analysis";
import { NationalSpendingComparison } from "@/components/budget/NationalSpendingComparisons";
import { getNationalBudgetComparisons } from "@/lib/analysis-products";
import { optimalBudgetGeneratorPaperLink, ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/slugify";

function money(value: number): string {
  return value >= 1e12 ? `$${(value / 1e12).toFixed(2)}T` : `$${(value / 1e9).toFixed(1)}B`;
}

export function generateStaticParams() {
  return usBudgetAnalysis.categories.map((category) => ({ slug: slugify(category.name) }));
}

export default async function BudgetCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = usBudgetAnalysis.categories.find((row) => slugify(row.name) === slug);
  if (!category) notFound();

  const history = category.historicalRealPerCapita ?? [];
  const comparison = getNationalBudgetComparisons().find(
    (row) => row.spendingField === category.oecdBenchmark?.spendingField,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href={ROUTES.obg} className="text-sm font-bold underline underline-offset-4">← Budget comparisons</Link>
      <header className="mt-6 mb-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Federal spending context</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">{category.name}</h1>
        <p className="mt-4 text-3xl font-black text-foreground">{money(category.currentSpending)}</p>
        <p className="mt-2 text-sm font-bold text-muted-foreground">
          Current estimate{history.at(-1) ? ` for FY${history.at(-1)!.year}` : ""}, nominal US dollars.
          {" "}{((category.currentSpending / usBudgetAnalysis.totalSpendingNominal) * 100).toFixed(1)}% of the dataset&apos;s estimated federal outlays.
        </p>
      </header>

      {comparison ? (
        <section aria-label="Related national comparison">
          <h2 className="mb-4 text-xl font-black text-foreground">The national comparison</h2>
          <NationalSpendingComparison comparison={comparison} />
        </section>
      ) : (
        <p className="border-4 border-primary p-5 text-sm font-bold text-muted-foreground">No comparable national spending and outcome series is available for this line.</p>
      )}

      {history.length > 0 && (
        <details className="mt-8 border-4 border-primary p-5 sm:p-6">
          <summary className="cursor-pointer text-xl font-black text-foreground">Federal spending history</summary>
          <p className="mt-3 text-sm font-bold text-muted-foreground">Latest year is an estimate. Earlier values are the recorded historical series. Inflation-adjusted amounts use constant 2017 US dollars per person per year.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b-2 border-primary"><th className="py-3 pr-3">Fiscal year</th><th className="px-3 py-3 text-right">Nominal spending</th><th className="py-3 pl-3 text-right">Real spending / person</th></tr></thead>
              <tbody>
                {history.map((point) => (
                  <tr key={point.year} className="border-b border-primary">
                    <td className="py-3 pr-3">{point.year}</td>
                    <td className="px-3 py-3 text-right font-bold">{money(point.nominalBillions * 1e9)}</td>
                    <td className="py-3 pl-3 text-right font-bold">${Math.round(point.realPerCapita).toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <a href="https://www.cbo.gov/data/budget-economic-data" className="mt-4 inline-block text-sm font-bold underline underline-offset-4">CBO budget data ↗</a>
        </details>
      )}

      <section className="mt-8 border-t-4 border-primary pt-6">
        <a href={optimalBudgetGeneratorPaperLink.href} className="mt-4 inline-block text-sm font-bold underline underline-offset-4">Read the OBG research protocol ↗</a>
      </section>
      <p className="mt-6 text-xs font-bold text-muted-foreground">Report generated {usBudgetAnalysis.generatedAt.slice(0, 10)}.</p>
    </div>
  );
}
