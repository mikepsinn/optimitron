import Link from "next/link";
import { usBudgetAnalysis } from "@/data/us-budget-analysis";
import { BudgetComparisonMethod, NationalSpendingComparisons } from "@/components/budget/NationalSpendingComparisons";
import { getNationalBudgetComparisons } from "@/lib/analysis-products";
import { getRouteMetadata } from "@/lib/metadata";
import { getBudgetCategoryPath, obgLink, optimalBudgetGeneratorPaperLink, ROUTES } from "@/lib/routes";

export const metadata = getRouteMetadata(obgLink);

function money(value: number): string {
  return value >= 1e12 ? `$${(value / 1e12).toFixed(2)}T` : `$${(value / 1e9).toFixed(1)}B`;
}

export default function BudgetPage() {
  const data = usBudgetAnalysis;
  const comparisons = getNationalBudgetComparisons();
  const categories = [...data.categories].sort((a, b) => b.currentSpending - a.currentSpending);
  const displayedSpending = categories.reduce((sum, category) => sum + category.currentSpending, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Budget evidence</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">What can we learn from other countries?</h1>
        <p className="mt-3 max-w-3xl text-sm font-bold text-muted-foreground">
          Compare national spending with observed health, education and income outcomes. These comparisons identify systems worth studying; setting a budget requires evidence about specific changes and the services they would preserve.
        </p>
      </header>

      <section aria-label="National spending comparisons">
        <NationalSpendingComparisons comparisons={comparisons} />
      </section>
      <BudgetComparisonMethod />

      <details className="mt-10 border-4 border-primary bg-background p-5 sm:p-6">
        <summary className="cursor-pointer text-xl font-black text-foreground">Federal spending context</summary>
        <p className="mt-4 text-sm font-bold text-muted-foreground">
          The dataset totals {money(data.totalSpendingNominal)} in estimated federal outlays. The lines below cover {money(displayedSpending)} of that total; mandatory spending and debt interest are outside this list. Amounts are nominal US dollars, a different scope and price basis from the national comparisons above.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b-2 border-primary"><th className="py-3 pr-3">Federal line</th><th className="px-3 py-3">Fiscal year</th><th className="py-3 pl-3 text-right">Current estimate</th></tr></thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-primary">
                  <td className="py-3 pr-3 font-bold"><Link href={getBudgetCategoryPath(category.name)} className="underline underline-offset-4">{category.name}</Link></td>
                  <td className="px-3 py-3">{category.historicalRealPerCapita?.at(-1)?.year ?? "Unavailable"}</td>
                  <td className="py-3 pl-3 text-right font-bold">{money(category.currentSpending)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm font-bold"><a href="https://www.cbo.gov/data/budget-economic-data" className="underline underline-offset-4">CBO budget data ↗</a></p>
      </details>

      <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold" aria-label="Related budget evidence">
        <Link href={ROUTES.opg} className="underline underline-offset-4">Explore policy evidence</Link>
        <a href={optimalBudgetGeneratorPaperLink.href} className="underline underline-offset-4">Read the OBG research protocol ↗</a>
        <Link href={ROUTES.dividend} className="underline underline-offset-4">What would fund a dividend?</Link>
      </nav>
      <p className="mt-6 text-xs font-bold text-muted-foreground">Report generated {data.generatedAt.slice(0, 10)}. Observation years are shown for each comparison.</p>
    </div>
  );
}
