import { usBudgetAnalysis } from "@/data/us-budget-analysis";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { obgLink, optimalBudgetGeneratorPaperLink } from "@/lib/routes";
import { slugify } from "@/lib/slugify";
import type { BudgetReportCategory } from "@optimitron/obg";

const data = usBudgetAnalysis;

function fmt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "N/A";
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

function pct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function trendIcon(trend: string): string {
  const t = trend.toLowerCase();
  if (t === "increasing" || t === "improving") return "↑";
  if (t === "decreasing" || t === "declining") return "↓";
  return "→";
}

function trendColor(trend: string): string {
  const t = trend.toLowerCase();
  if (t === "increasing" || t === "improving") return "text-background";
  if (t === "decreasing" || t === "declining") return "text-brutal-red";
  return "text-muted-foreground";
}

function actionBadgeStyle(action: string | undefined): string {
  if (!action) return "bg-muted text-foreground";
  const a = action.toLowerCase();
  if (a.includes("major increase") || a === "scale_up") return "bg-background text-foreground";
  if (a.includes("increase") || a === "increase") return "bg-background text-foreground";
  if (a.includes("maintain") || a === "maintain") return "bg-muted text-foreground";
  if (a.includes("major decrease") || a === "major_decrease") return "bg-brutal-red text-brutal-red-foreground";
  if (a.includes("decrease") || a === "decrease") return "bg-background text-foreground";
  if (a.includes("non-discretionary")) return "bg-muted text-foreground";
  if (a.includes("insufficient")) return "bg-muted text-muted-foreground";
  return "bg-muted text-foreground";
}

function actionLabel(action: string): string {
  switch (action) {
    case "scale_up":
      return "Scale Up";
    case "increase":
      return "Increase";
    case "maintain":
      return "Maintain";
    case "decrease":
      return "Decrease";
    case "major_decrease":
      return "Major Decrease";
    default:
      return action;
  }
}

function optimalSpending(cat: BudgetReportCategory): number {
  return cat.optimalSpendingNominal;
}

function isDecreaseRecommendation(cat: BudgetReportCategory): boolean {
  // Live reports store gap as |current - optimal| (always >= 0). Direction
  // comes from recommendation / current-vs-optimal, not the sign of gap.
  return (
    cat.recommendation.includes("decrease") ||
    cat.currentSpending > cat.optimalSpendingNominal
  );
}

export function generateStaticParams() {
  return data.categories.map((c) => ({ slug: slugify(c.name) }));
}

export default async function BudgetCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = data.categories.find((c) => slugify(c.name) === slug);

  if (!cat) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase text-foreground mb-4">Category Not Found</h1>
        <NavItemLink item={obgLink} variant="custom" className="text-foreground font-bold underline">
          ← Back to Budget Dashboard
        </NavItemLink>
      </div>
    );
  }

  const optimal = optimalSpending(cat);
  const maxBar = Math.max(cat.currentSpending, optimal, 1);
  const currentPct = (cat.currentSpending / maxBar) * 100;
  const optimalPct = (optimal / maxBar) * 100;
  const totalOptimal = data.categories.reduce((s, c) => s + optimalSpending(c), 0);
  const totalBudget = data.totalSpendingNominal;
  const dr = cat.diminishingReturns;
  const mr = dr?.marginalReturn;
  const hasMarginalReturn = mr != null && Number.isFinite(mr);
  const elasticity = dr?.elasticity;
  const shouldDecrease = isDecreaseRecommendation(cat);
  const gapAbs = Math.abs(cat.gap);
  const gapPctAbs = Math.abs(cat.gapPercent);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <NavItemLink
        item={obgLink}
        variant="custom"
        className="inline-block mb-6 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase"
      >
        ← All Budget Categories
      </NavItemLink>

      <div className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8 mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground mb-4">
          {cat.name}
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border-4 border-primary p-4 bg-background text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold uppercase mb-1">Current Spending</div>
            <div className="text-2xl sm:text-3xl font-black">{fmt(cat.currentSpending)}</div>
          </div>
          <div className="border-4 border-primary p-4 bg-background text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold uppercase mb-1">Optimal Spending</div>
            <div className="text-2xl sm:text-3xl font-black">{fmt(optimal)}</div>
          </div>
          <div
            className={`border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
              shouldDecrease
                ? "bg-brutal-red text-brutal-red-foreground"
                : "bg-background text-foreground"
            }`}
          >
            <div className="text-xs font-bold uppercase mb-1">Gap</div>
            <div className="text-2xl sm:text-3xl font-black">
              {fmt(gapAbs)} ({pct(shouldDecrease ? -gapPctAbs : gapPctAbs)})
            </div>
          </div>
          <div className="border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-background text-foreground">
            <div className="text-xs font-bold uppercase mb-1">Evidence</div>
            <div className="text-sm font-bold mt-1">{cat.evidenceSource}</div>
          </div>
        </div>
      </div>

      <section className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-foreground mb-4">Current vs Optimal</h2>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-foreground">Current</span>
              <span className="text-sm font-bold text-muted-foreground">{fmt(cat.currentSpending)}</span>
            </div>
            <div className="h-8 bg-muted border-4 border-primary overflow-hidden">
              <div
                className="h-full bg-background border-r-2 border-primary"
                style={{ width: `${currentPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-foreground">Optimal</span>
              <span className="text-sm font-bold text-muted-foreground">{fmt(optimal)}</span>
            </div>
            <div className="h-8 bg-muted border-4 border-primary overflow-hidden">
              <div
                className="h-full bg-background border-r-2 border-primary"
                style={{ width: `${optimalPct}%` }}
              />
            </div>
          </div>
        </div>
        {hasMarginalReturn && (
          <div className="mt-3 text-xs font-bold text-muted-foreground">
            Marginal return per dollar: {(mr * 100).toFixed(2)}%
          </div>
        )}
      </section>

      {dr && (
        <section className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
          <h2 className="text-lg font-black uppercase text-foreground mb-4">Diminishing Returns Analysis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="border-4 border-primary p-3 bg-background">
              <div className="text-xs font-bold uppercase text-muted-foreground">Model Type</div>
              <div className="text-lg font-black text-foreground">{dr.modelType}</div>
            </div>
            <div className="border-4 border-primary p-3 bg-background">
              <div className="text-xs font-bold uppercase text-muted-foreground">R² (Model Fit)</div>
              <div className="text-lg font-black text-foreground">{(dr.r2 * 100).toFixed(0)}%</div>
              <div className="mt-1 h-2 bg-muted border border-primary overflow-hidden">
                <div className="h-full bg-foreground" style={{ width: `${dr.r2 * 100}%` }} />
              </div>
            </div>
            {elasticity != null && Number.isFinite(elasticity) && (
              <div className="border-4 border-primary p-3 bg-background">
                <div className="text-xs font-bold uppercase text-muted-foreground">Elasticity</div>
                <div className="text-lg font-black text-foreground">{elasticity.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground font-bold mt-1">
                  1% spending increase → {elasticity.toFixed(2)}% outcome change
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold px-2 py-0.5 border-4 border-primary bg-muted">
              N = {dr.n} observations
            </span>
            {dr.r2 < 0.3 && (
              <span className="text-xs font-bold px-2 py-0.5 border-4 border-primary bg-background text-foreground">
                Low fit (R²&lt;0.3) — treat with caution
              </span>
            )}
            {dr.n <= 10 && (
              <span className="text-xs font-bold px-2 py-0.5 border-4 border-primary bg-background text-foreground">
                Small sample (n≤10) — may overfit
              </span>
            )}
          </div>
        </section>
      )}

      <section className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-foreground mb-4">Outcome Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cat.outcomeMetrics.map((m) => (
            <div
              key={m.name}
              className="border-4 border-primary p-4 bg-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-xs font-bold uppercase text-muted-foreground mb-1">{m.name}</div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-foreground">
                  {typeof m.value === "number" && m.value < 1
                    ? m.value.toFixed(2)
                    : m.value.toLocaleString()}
                </span>
                <span className={`text-lg font-black ${trendColor(m.trend)}`}>
                  {trendIcon(m.trend)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-bold capitalize mt-1">{m.trend}</div>
            </div>
          ))}
        </div>
      </section>

      <section
        className={`border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8 ${
          shouldDecrease
            ? "bg-brutal-red text-brutal-red-foreground"
            : "bg-background text-foreground"
        }`}
      >
        <h2 className="text-lg font-black uppercase mb-2">
          <span className={`inline-block px-2 py-0.5 mr-2 text-sm border-4 border-primary ${actionBadgeStyle(cat.recommendation)}`}>
            {actionLabel(cat.recommendation)}
          </span>
          RECOMMENDATION
        </h2>
        <p className="font-bold mb-3">
          {shouldDecrease
            ? `Spending on ${cat.name} should be decreased by ${fmt(gapAbs)} (${pct(-gapPctAbs)}) to reach the optimal allocation of ${fmt(optimal)}.`
            : `Spending on ${cat.name} should be increased by ${fmt(gapAbs)} (${pct(gapPctAbs)}) to reach the optimal allocation of ${fmt(optimal)}.`}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mt-4">
          {hasMarginalReturn && (
            <div className="border-4 border-primary p-3 bg-background">
              <div className="text-xs font-bold uppercase text-muted-foreground">Marginal Return</div>
              <div className="text-xl font-black text-foreground">{(mr * 100).toFixed(2)}%</div>
            </div>
          )}
          <div className="border-4 border-primary p-3 bg-background">
            <div className="text-xs font-bold uppercase text-muted-foreground">Share of Total Budget</div>
            <div className="text-xl font-black text-foreground">
              {((cat.currentSpending / totalBudget) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </section>

      <section className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-foreground mb-4">Budget Context</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-bold text-foreground">
            <span>Category share (current)</span>
            <span>{((cat.currentSpending / totalBudget) * 100).toFixed(1)}%</span>
          </div>
          <div className="h-4 bg-muted border-4 border-primary overflow-hidden">
            <div
              className="h-full bg-foreground"
              style={{ width: `${(cat.currentSpending / totalBudget) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-sm font-bold text-foreground mt-3">
            <span>Category share (optimal)</span>
            <span>
              {totalOptimal > 0 ? ((optimal / totalOptimal) * 100).toFixed(1) : "0.0"}%
            </span>
          </div>
          <div className="h-4 bg-muted border-4 border-primary overflow-hidden">
            <div
              className="h-full bg-background"
              style={{
                width: `${totalOptimal > 0 ? (optimal / totalOptimal) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </section>

      <section className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-foreground mb-4">
          How Is Optimal Calculated?
        </h2>
        <div className="space-y-4 text-sm text-foreground font-bold">
          <p>
            The <strong className="text-foreground">Optimal Budget Generator (OBG)</strong> uses a
            diminishing-returns framework to allocate spending across categories. Each budget
            category is modeled with a concave utility function — the first dollar spent on a
            category produces more welfare than the billionth dollar.
          </p>
          {hasMarginalReturn && (
            <div className="border-4 border-primary bg-foreground text-background p-4">
              <h3 className="text-sm font-black uppercase mb-2">
                Marginal Return ({(mr * 100).toFixed(2)}% for {cat.name})
              </h3>
              <p>
                The marginal return of{" "}
                <strong>{(mr * 100).toFixed(2)}%</strong> means
                each additional dollar currently spent on {cat.name} produces{" "}
                {(mr * 100).toFixed(2)} cents of welfare value. Categories with
                higher marginal returns are underfunded relative to their potential; those with
                lower returns are overfunded.
              </p>
            </div>
          )}
          <p>
            Federal spending is about{" "}
            <strong className="text-foreground">{fmt(totalBudget)}</strong>.
            Each category&apos;s optimal is an independent efficient-frontier estimate, not a
            fixed-budget reallocation of that total across all {data.categories.length} categories.
          </p>
          <p className="text-xs text-muted-foreground">
            See the{" "}
            <NavItemLink
              item={optimalBudgetGeneratorPaperLink}
              variant="custom"
              external
              className="text-foreground hover:underline"
            >
              Optimal Budget Generator paper
            </NavItemLink>{" "}
            for full methodology.
          </p>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <NavItemLink
          item={obgLink}
          variant="custom"
          className="inline-block border-4 border-primary bg-foreground text-background px-4 py-2 font-bold text-sm shadow-none transition-colors hover:bg-background hover:text-foreground"
        >
          ← All Categories
        </NavItemLink>
        <p className="text-xs text-muted-foreground font-bold">
          Generated {new Date(data.generatedAt).toLocaleDateString()} · Optimitron OBG
        </p>
      </div>
    </div>
  );
}
