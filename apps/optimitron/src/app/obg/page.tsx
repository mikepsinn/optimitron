"use client";

import Link from "next/link";
import { usBudgetAnalysis } from "@/data/us-budget-analysis";
import { getBudgetCategoryPath, ROUTES } from "@/lib/routes";
import { PrizeCTA } from "@/components/prize/PrizeCTA";
import { PRIZE_CTA_COPY } from "@/lib/messaging";
import { EfficientFrontierChart, EfficientFrontierSummary } from "@/components/landing/EfficientFrontierChart";

// All types flow from @optimitron/obg via the generated .ts file.
// No local interfaces — if OBG changes, tsc catches it.
const data = usBudgetAnalysis;

function fmt(n: number | undefined | null): string {
  if (n == null) return "N/A";
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(0)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

/** "Total R&D spending" → "total R&D spending" */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function pct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function actionBadgeStyle(action: string | undefined): string {
  if (!action) return "bg-muted text-foreground";
  const a = action.toLowerCase();
  if (a.includes("major increase") || a === "scale_up") return "bg-background text-foreground";
  if (a.includes("increase") || a === "increase") return "bg-background text-foreground";
  if (a.includes("maintain") || a === "maintain") return "bg-muted text-foreground";
  if (a.includes("modest decrease") || a === "decrease") return "bg-background text-foreground";
  if (a.includes("major decrease") || a === "major_decrease") return "bg-brutal-red text-brutal-red-foreground";
  if (a.includes("decrease")) return "bg-background text-foreground";
  if (a.includes("non-discretionary")) return "bg-muted text-foreground";
  if (a.includes("insufficient")) return "bg-muted text-muted-foreground";
  return "bg-muted text-foreground";
}

function actionLabel(action: string): string {
  switch (action) {
    case "scale_up": return "Scale Up";
    case "increase": return "Increase";
    case "maintain": return "Maintain";
    case "decrease": return "Decrease";
    case "major_decrease": return "Major Decrease";
    case "no_line_benchmark": return "No Line Benchmark";
    default: return action;
  }
}

export default function BudgetPage() {
  const sorted = [...data.categories].sort(
    (a, b) => Math.abs(b.gap) - Math.abs(a.gap)
  );

  const totalCurrent = data.categories.reduce((s, c) => s + c.currentSpending, 0);
  // Only lines with a line-specific benchmark have an optimal. The rest are
  // compared with whole national systems, which says nothing about the line.
  const benchmarked = data.categories.filter(c => c.optimalSpendingNominal != null);
  const benchmarkedCurrent = benchmarked.reduce((s, c) => s + c.currentSpending, 0);
  const benchmarkedOptimal = benchmarked.reduce((s, c) => s + (c.optimalSpendingNominal ?? 0), 0);

  const maxSpending = Math.max(
    ...data.categories.flatMap(c => [c.currentSpending, c.optimalSpendingNominal ?? 0])
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground mb-2">
          The US Federal Budget, Diagnosed
        </h1>
        <p className="text-muted-foreground font-bold">
          Your government&apos;s {fmt(data.totalSpendingNominal)} shopping list, reviewed by someone who&apos;s actually done the maths. {data.categories.length} categories. {benchmarked.length} of them can be compared line for line with other countries. The rest only have whole-country comparisons, so they get no line-item target.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <SummaryCard label="Total Current" value={fmt(totalCurrent)} />
        <SummaryCard label="Line-Specific Benchmarks" value={`${benchmarked.length} of ${data.categories.length}`} />
        <SummaryCard label="Optimal, Benchmarked Lines" value={fmt(benchmarkedOptimal)} />
        <SummaryCard label="Net Reallocation, Benchmarked Lines" value={fmt(benchmarkedOptimal - benchmarkedCurrent)} color={benchmarkedOptimal > benchmarkedCurrent ? "text-background" : "text-brutal-red"} />
      </div>

      <section className="mb-10">
        <h2 className="section-title">Related Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <RelatedLink
            href={ROUTES.dividend}
            title="Optimization Dividend"
            description="See the savings land in your household as cash."
          />
          <RelatedLink
            href={ROUTES.efficiency}
            title="Efficiency Rankings"
            description="See the comparator countries behind each overspend claim."
          />
          <RelatedLink
            href={ROUTES.governmentSize}
            title="Government Size"
            description="Switch from federal line items to whole-government floor analysis."
          />
          <RelatedLink
            href={ROUTES.legislation}
            title="Model Legislation"
            description="Read the drafted bills built from this analysis."
          />
        </div>
      </section>

      {/* Top Recommendations */}
      <section className="mb-10">
        <h2 className="section-title">Top 5 Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.topRecommendations.slice(0, 5).map((rec, i) => (
            <div key={i} className="card border-primary">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-foreground text-background flex items-center justify-center text-sm font-black border-4 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground font-bold">{rec}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bar chart */}
      <section className="mb-10">
        <h2 className="section-title">Current vs Optimal Spending</h2>
        <div className="space-y-4">
          {sorted.map((cat) => (
            <Link key={cat.name} href={getBudgetCategoryPath(cat.name)} className="card block hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                <h3 className="text-sm font-black text-foreground">{cat.name}</h3>
                <div className="flex items-center gap-2">
                  {cat.optimalSpendingNominal != null && cat.efficiency && (
                    <span className="text-xs font-black px-2 py-0.5 border-4 border-primary bg-background text-foreground">
                      {cat.efficiency.overspendRatio.toFixed(1)}× overspend
                    </span>
                  )}
                  <span className={`text-xs font-black px-2 py-0.5 border-4 border-primary ${actionBadgeStyle(cat.recommendation)}`}>
                    {actionLabel(cat.recommendation)}
                    {cat.optimalSpendingNominal != null && ` ${pct(-cat.gapPercent)}`}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16 font-bold">Current</span>
                  <div className="flex-1 h-5 bg-muted border border-primary overflow-hidden">
                    <div className="h-full bg-brutal-red" style={{ width: `${(cat.currentSpending / maxSpending) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-20 text-right font-bold">{fmt(cat.currentSpending)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16 font-bold">Optimal</span>
                  {cat.optimalSpendingNominal != null ? (
                    <>
                      <div className="flex-1 h-5 bg-muted border border-primary overflow-hidden">
                        <div className="h-full bg-brutal-green" style={{ width: `${(cat.optimalSpendingNominal / maxSpending) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-20 text-right font-bold">{fmt(cat.optimalSpendingNominal)}</span>
                    </>
                  ) : (
                    <span className="flex-1 text-xs text-muted-foreground font-bold">
                      No line-specific benchmark. Only comparison: {cat.oecdBenchmark ? lowerFirst(cat.oecdBenchmark.fieldLabel) : "a national total"}.
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Table */}
      <section>
        <h2 className="section-title">Full Category Breakdown</h2>
        <div className="overflow-x-auto border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-primary bg-background text-foreground">
                <th className="text-left py-3 px-2 font-black uppercase">Category</th>
                <th className="text-right py-3 px-2 font-black uppercase">Current</th>
                <th className="text-right py-3 px-2 font-black uppercase">Optimal</th>
                <th className="text-right py-3 px-2 font-black uppercase">Gap %</th>
                <th className="text-right py-3 px-2 font-black uppercase">Overspend</th>
                <th className="text-center py-3 px-2 font-black uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((cat) => (
                <tr key={cat.name} className="border-b border-primary hover:bg-background">
                  <td className="py-3 px-2 text-foreground font-bold">
                    <Link href={getBudgetCategoryPath(cat.name)} className="underline hover:text-foreground transition-colors">
                      {cat.name}
                    </Link>
                  </td>
                  <td className="py-3 px-2 text-right text-foreground font-bold">{fmt(cat.currentSpending)}</td>
                  <td className="py-3 px-2 text-right text-foreground font-bold">{cat.optimalSpendingNominal != null ? fmt(cat.optimalSpendingNominal) : "—"}</td>
                  <td className={`py-3 px-2 text-right font-bold ${cat.optimalSpendingNominal == null ? "text-muted-foreground" : cat.gap >= 0 ? "text-background" : "text-brutal-red"}`}>
                    {cat.optimalSpendingNominal != null ? pct(-cat.gapPercent) : "—"}
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-foreground">
                    {cat.optimalSpendingNominal != null && cat.efficiency ? `${cat.efficiency.overspendRatio.toFixed(1)}×` : "—"}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-block px-2 py-0.5 text-xs font-black border-4 border-primary ${actionBadgeStyle(cat.recommendation)}`}>
                      {actionLabel(cat.recommendation)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3 font-bold">
          No line benchmark: the only international comparison for this line covers a whole
          national system, such as all health spending, public and private. That system&apos;s
          overspend is not this line&apos;s, so no line-item target is shown.
        </p>
      </section>

      <p className="text-xs text-muted-foreground mt-8 font-bold">
        Generated {new Date(data.generatedAt).toLocaleDateString()} · Source: Optimitron OBG (Optimal Budget Generator)
      </p>

      {/* Efficient Frontier */}
      <div className="mt-10 mb-10">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2">
          The Efficient Frontier
        </h2>
        <p className="text-sm font-bold text-muted-foreground mb-6 max-w-3xl">
          Every country is a data point. The frontier shows what the best-performing
          countries achieve at each spending level, measured by life expectancy — the
          metric that actually tells you if people are alive and functional. The US is
          spending 2.6x what the frontier countries spend — for worse outcomes. On my
          planet, we call this &ldquo;paying extra to be worse at things.&rdquo;
        </p>
        <EfficientFrontierSummary className="mb-6" />
        <h3 className="text-lg font-black uppercase text-foreground mt-6 mb-4">
          Spending vs Life Expectancy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border-4 border-primary bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h4 className="text-xs font-black uppercase text-muted-foreground mb-2">Health Spending</h4>
            <EfficientFrontierChart category="health" outcome="lifeExpectancy" />
          </div>
          <div className="border-4 border-primary bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h4 className="text-xs font-black uppercase text-muted-foreground mb-2">Education Spending</h4>
            <EfficientFrontierChart category="education" outcome="lifeExpectancy" />
          </div>
        </div>
        <h3 className="text-lg font-black uppercase text-foreground mb-4">
          Spending vs Median Income
        </h3>
        <p className="text-xs font-bold text-muted-foreground mb-4">
          Real median after-tax income from household surveys (World Bank PIP,
          2017 PPP dollars). Not GDP — because you can increase GDP by building
          nuclear bombs and blowing up the rainforest.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-primary bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h4 className="text-xs font-black uppercase text-muted-foreground mb-2">Health Spending</h4>
            <EfficientFrontierChart category="health" outcome="medianIncome" />
          </div>
          <div className="border-4 border-primary bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h4 className="text-xs font-black uppercase text-muted-foreground mb-2">Education Spending</h4>
            <EfficientFrontierChart category="education" outcome="medianIncome" />
          </div>
        </div>
      </div>

      {/* BudgetGapChart removed — referenced old schema */}

      <div className="mt-10">
        <PrizeCTA
          headline="The gap between current and optimal won't close itself."
          body={`Every misallocated dollar above is a life not saved. The 1% Treaty referendum proves demand for evidence-based budgeting. ${PRIZE_CTA_COPY.depositAndRecruit}`}
          variant="dark"
        />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color = "text-foreground" }: { label: string; value: string; color?: string }) {
  return (
    <div className="card text-center">
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1 font-bold uppercase">{label}</div>
    </div>
  );
}

function RelatedLink({
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
      className="card block hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-shadow"
    >
      <div className="text-lg font-black uppercase text-foreground">{title}</div>
      <div className="mt-2 text-sm font-bold text-muted-foreground">{description}</div>
    </Link>
  );
}
