import Link from "next/link";
import { BudgetComparisonMethod, NationalSpendingComparisons } from "@/components/budget/NationalSpendingComparisons";
import { getNationalBudgetComparisons } from "@/lib/analysis-products";
import { getRouteMetadata } from "@/lib/metadata";
import { efficiencyLink, ROUTES } from "@/lib/routes";
import { usBudgetAnalysis } from "@/data/us-budget-analysis";

export const metadata = getRouteMetadata(efficiencyLink);

export default function EfficiencyPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Country comparisons</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">Compare spending and outcomes</h1>
        <p className="mt-3 max-w-3xl text-sm font-bold text-muted-foreground">
          Compare what countries spend with their health, education and income outcomes.
        </p>
      </header>

      <NationalSpendingComparisons comparisons={getNationalBudgetComparisons()} />
      <BudgetComparisonMethod />

      <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold" aria-label="Related analysis">
        <Link href={ROUTES.obg} className="underline underline-offset-4">Federal budget context</Link>
        <Link href={ROUTES.opg} className="underline underline-offset-4">Policy evidence</Link>
        <Link href={ROUTES.dividend} className="underline underline-offset-4">What would fund a dividend?</Link>
      </nav>
      <p className="mt-6 text-xs font-bold text-muted-foreground">Report generated {usBudgetAnalysis.generatedAt.slice(0, 10)}.</p>
    </div>
  );
}
