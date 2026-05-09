import Link from "next/link";
import type { Metadata } from "next";
import {
  BUDGET_LEGISLATION_SLUGS,
  deduplicateEfficiencyCategories,
} from "@/lib/analysis-products";
import { getBudgetCategoryPath, getLegislationPath, ROUTES } from "@/lib/routes";
import { usBudgetAnalysis } from "@/data/us-budget-analysis";

export const metadata: Metadata = {
  title: "Efficiency Rankings",
  description: "Cheapest high-performing comparators for the current US budget analysis.",
};

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export default function EfficiencyPage() {
  const rows = deduplicateEfficiencyCategories().sort(
    (left, right) => right.efficiency.overspendRatio - left.efficiency.overspendRatio,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground">
          Efficiency Rankings
        </p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
          Cheapest high performers, not wishful thinking
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-bold text-muted-foreground">
          These are the comparator countries the current OBG output is using when it says the US is overspending.
          Each row links back to the underlying budget category and, where available, the drafted legislation.
        </p>
      </div>

      <div className="mb-10 grid gap-4 md:grid-cols-3">
        <SummaryCard label="Categories shown" value={String(rows.length)} />
        <SummaryCard
          label="Worst overspend"
          value={`${rows[0]?.efficiency.overspendRatio.toFixed(1) ?? "0.0"}x`}
        />
        <SummaryCard
          label="Total savings covered"
          value={formatCurrency(rows.reduce((sum, row) => sum + row.efficiency.potentialSavingsTotal, 0))}
        />
      </div>

      <div className="overflow-x-auto border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background text-foreground">
              <th className="px-3 py-3 text-left font-black uppercase">Category</th>
              <th className="px-3 py-3 text-left font-black uppercase">Best country</th>
              <th className="px-3 py-3 text-right font-black uppercase">US spend / cap</th>
              <th className="px-3 py-3 text-right font-black uppercase">Best spend / cap</th>
              <th className="px-3 py-3 text-right font-black uppercase">US rank</th>
              <th className="px-3 py-3 text-right font-black uppercase">Overspend</th>
              <th className="px-3 py-3 text-right font-black uppercase">Savings / year</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const legislationSlug = BUDGET_LEGISLATION_SLUGS[row.id];

              return (
                <tr key={row.id} className="border-t border-primary">
                  <td className="px-3 py-3 font-bold text-foreground">
                    <div className="flex flex-col gap-1">
                      <Link href={getBudgetCategoryPath(row.name)} className="underline underline-offset-4">
                        {row.name}
                      </Link>
                      {legislationSlug ? (
                        <Link
                          href={getLegislationPath(legislationSlug)}
                          className="text-xs font-black uppercase tracking-wide text-foreground underline underline-offset-4"
                        >
                          Open legislation
                        </Link>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-bold text-muted-foreground">
                    {row.efficiency.bestCountry.name}
                    <div className="mt-1 text-xs">
                      {row.efficiency.outcomeName}: {row.efficiency.bestCountry.outcome}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-foreground">
                    ${row.efficiency.spendingPerCapita.toLocaleString("en-US")}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-muted-foreground">
                    ${row.efficiency.bestCountry.spendingPerCapita.toLocaleString("en-US")}
                  </td>
                  <td className="px-3 py-3 text-right font-black text-foreground">
                    {row.efficiency.rank}/{row.efficiency.totalCountries}
                  </td>
                  <td className="px-3 py-3 text-right font-black text-background">
                    {row.efficiency.overspendRatio.toFixed(1)}x
                  </td>
                  <td className="px-3 py-3 text-right font-black text-foreground">
                    {formatCurrency(row.efficiency.potentialSavingsTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <NavCard href={ROUTES.obg} title="Back to OBG" description="Full category-by-category spending analysis." />
        <NavCard href={ROUTES.dividend} title="Optimization Dividend" description="Translate the savings into household-level payouts." />
        <NavCard href={ROUTES.governmentSize} title="Government Size" description="Look at the whole-government floor instead of individual budget lines." />
      </section>

      <p className="mt-8 text-xs font-bold text-muted-foreground">
        Generated {new Date(usBudgetAnalysis.generatedAt).toLocaleDateString()} from the live web analysis pipeline.
      </p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-4 border-primary bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="text-3xl font-black text-foreground">{value}</div>
      <div className="mt-1 text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function NavCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
    >
      <p className="text-lg font-black uppercase text-foreground">{title}</p>
      <p className="mt-2 text-sm font-bold text-muted-foreground">{description}</p>
    </Link>
  );
}
