import Link from "next/link";
import {
  getOptimizationDividendSummary,
  US_ADULT_POPULATION,
} from "@/lib/analysis-products";
import { DividendCalculator } from "@/components/landing/DividendCalculator";
import { getRouteMetadata } from "@/lib/metadata";
import {
  dividendLink,
  getBudgetCategoryPath,
  getLegislationPath,
  ROUTES,
} from "@/lib/routes";
import { usBudgetAnalysis } from "@/data/us-budget-analysis";

export const metadata = getRouteMetadata(dividendLink);

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export default function DividendPage() {
  const summary = getOptimizationDividendSummary();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground">
          Optimization Dividend
        </p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
          Your government is overcharging you. Here is the refund.
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-bold text-muted-foreground">
          On my planet, when the state buys a service for triple the going rate, the difference goes back to the household. So we did the math for yours. We line up every category against the cheapest country that gets better results, and split the overspend per adult. That is your dividend.
        </p>
      </div>

      <div className="mb-10 grid gap-4 md:grid-cols-4">
        <StatCard label="Monthly per adult" value={formatCurrency(summary.monthlyPerAdult)} accent="pink" />
        <StatCard label="Annual per adult" value={formatCurrency(summary.annualPerAdult)} accent="cyan" />
        <StatCard label="Total annual savings" value={formatCurrency(summary.annualTotal)} accent="yellow" />
        <StatCard label="Adult population used" value={US_ADULT_POPULATION.toLocaleString("en-US")} accent="foreground" />
      </div>

      <div className="mb-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black uppercase text-foreground">Breakdown</h2>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            Every row: your government pays more and gets worse results than a country that already solved it. Pick the cheaper one.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-primary bg-background text-foreground">
                  <th className="px-3 py-2 text-left font-black uppercase">Category</th>
                  <th className="px-3 py-2 text-left font-black uppercase">Model</th>
                  <th className="px-3 py-2 text-right font-black uppercase">Overspend</th>
                  <th className="px-3 py-2 text-right font-black uppercase">Savings / adult</th>
                  <th className="px-3 py-2 text-right font-black uppercase">Savings / year</th>
                </tr>
              </thead>
              <tbody>
                {summary.breakdown.map((row) => (
                  <tr key={row.category.id} className="border-t border-primary">
                    <td className="px-3 py-3 font-bold text-foreground">
                      <div className="flex flex-col gap-1">
                        <Link href={getBudgetCategoryPath(row.category.name)} className="underline underline-offset-4">
                          {row.label}
                        </Link>
                        {row.legislationSlug ? (
                          <Link
                            href={getLegislationPath(row.legislationSlug)}
                            className="text-xs font-black uppercase tracking-wide text-foreground underline underline-offset-4"
                          >
                            View model legislation
                          </Link>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-bold text-muted-foreground">{row.modelCountry}</td>
                    <td className="px-3 py-3 text-right font-black text-foreground">
                      {row.overspendRatio.toFixed(1)}x
                    </td>
                    <td className="px-3 py-3 text-right font-black text-background">
                      {formatCurrency(row.annualSavingsPerAdult)}
                    </td>
                    <td className="px-3 py-3 text-right font-black text-foreground">
                      {formatCurrency(row.annualSavingsTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <DividendCalculator
          categories={summary.breakdown.map((row) => ({
            name: row.label,
            modelCountry: row.modelCountry,
            annualSavingsPerAdult: row.annualSavingsPerAdult,
            overspendRatio: row.overspendRatio,
            includedByDefault: true,
          }))}
        />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <LinkCard
          href={ROUTES.obg}
          title="Budget analysis"
          description="Every category, every number, every country that does it cheaper. The receipts."
        />
        <LinkCard
          href={ROUTES.efficiency}
          title="Efficiency rankings"
          description="Who delivers more for less, and where the US actually ranks in each category."
        />
        <LinkCard
          href={ROUTES.legislation}
          title="Model legislation"
          description="The bills that turn the overspend into law. Already written."
        />
      </section>

      <p className="mt-8 text-xs font-bold text-muted-foreground">
        Generated {new Date(usBudgetAnalysis.generatedAt).toLocaleDateString()} from live public spending data.
      </p>
    </div>
  );
}

function LinkCard({
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

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "pink" | "cyan" | "yellow" | "foreground";
}) {
  const accents: Record<typeof accent, string> = {
    pink: "bg-foreground text-background",
    cyan: "bg-background text-foreground",
    yellow: "bg-background text-foreground",
    foreground: "bg-foreground text-background",
  };

  return (
    <div className={`border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${accents[accent]}`}>
      <div className="text-2xl font-black md:text-3xl">{value}</div>
      <div className="mt-1 text-xs font-black uppercase tracking-wide">{label}</div>
    </div>
  );
}
