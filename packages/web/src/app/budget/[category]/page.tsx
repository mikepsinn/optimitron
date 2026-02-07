import Link from "next/link";
import budgetData from "@/data/us-budget-analysis.json";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function fmt(n: number): string {
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
  if (t === "decreasing") return "↓";
  return "→";
}

function trendColor(trend: string): string {
  const t = trend.toLowerCase();
  if (t === "increasing" || t === "improving") return "text-emerald-600";
  if (t === "decreasing") return "text-red-600";
  return "text-black/50";
}

/* ------------------------------------------------------------------ */
/*  Static params                                                     */
/* ------------------------------------------------------------------ */

interface Category {
  name: string;
  currentSpending: number;
  optimalSpending: number;
  gap: number;
  gapPercent: number;
  marginalReturn: number;
  recommendation: string;
  outcomeMetrics: { name: string; value: number; trend: string }[];
}

const data = budgetData as {
  jurisdiction: string;
  totalBudget: number;
  categories: Category[];
  topRecommendations: string[];
  generatedAt: string;
};

export function generateStaticParams() {
  return data.categories.map((cat) => ({
    category: slugify(cat.name),
  }));
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default async function BudgetCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const cat = data.categories.find((c) => slugify(c.name) === slug);

  if (!cat) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase text-black mb-4">Category Not Found</h1>
        <Link href="/budget" className="text-pink-500 font-bold underline">
          ← Back to Budget Dashboard
        </Link>
      </div>
    );
  }

  const maxBar = Math.max(cat.currentSpending, cat.optimalSpending);
  const currentPct = (cat.currentSpending / maxBar) * 100;
  const optimalPct = (cat.optimalSpending / maxBar) * 100;
  const isIncrease = cat.recommendation === "increase";

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <Link
        href="/budget"
        className="inline-block mb-6 text-sm font-bold text-black/50 hover:text-black transition-colors"
      >
        ← Back to Budget Dashboard
      </Link>

      {/* Hero */}
      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8 mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-black mb-4">
          {cat.name}
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border-2 border-black p-4 bg-cyan-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold uppercase text-black/60 mb-1">Current Spending</div>
            <div className="text-2xl sm:text-3xl font-black text-black">{fmt(cat.currentSpending)}</div>
          </div>
          <div className="border-2 border-black p-4 bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold uppercase text-black/60 mb-1">Optimal Spending</div>
            <div className="text-2xl sm:text-3xl font-black text-black">{fmt(cat.optimalSpending)}</div>
          </div>
          <div
            className={`border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
              isIncrease ? "bg-emerald-300" : "bg-red-300"
            }`}
          >
            <div className="text-xs font-bold uppercase text-black/60 mb-1">Gap</div>
            <div className="text-2xl sm:text-3xl font-black text-black">
              {fmt(Math.abs(cat.gap))} ({pct(cat.gapPercent)})
            </div>
          </div>
        </div>
      </div>

      {/* Bar chart: Current vs Optimal */}
      <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-black mb-4">📊 Current vs Optimal</h2>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-black">Current</span>
              <span className="text-sm font-bold text-black/60">{fmt(cat.currentSpending)}</span>
            </div>
            <div className="h-8 bg-gray-100 border-2 border-black overflow-hidden">
              <div
                className="h-full bg-cyan-300 border-r-2 border-black"
                style={{ width: `${currentPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-black">Optimal</span>
              <span className="text-sm font-bold text-black/60">{fmt(cat.optimalSpending)}</span>
            </div>
            <div className="h-8 bg-gray-100 border-2 border-black overflow-hidden">
              <div
                className="h-full bg-yellow-300 border-r-2 border-black"
                style={{ width: `${optimalPct}%` }}
              />
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs font-bold text-black/40">
          Marginal return per dollar: {(cat.marginalReturn * 100).toFixed(2)}%
        </div>
      </section>

      {/* Outcome Metrics */}
      <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-black mb-4">📈 Outcome Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cat.outcomeMetrics.map((m) => (
            <div
              key={m.name}
              className="border-2 border-black p-4 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-xs font-bold uppercase text-black/50 mb-1">{m.name}</div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-black">
                  {typeof m.value === "number" && m.value < 1
                    ? m.value.toFixed(2)
                    : m.value.toLocaleString()}
                </span>
                <span className={`text-lg font-black ${trendColor(m.trend)}`}>
                  {trendIcon(m.trend)}
                </span>
              </div>
              <div className="text-xs text-black/40 font-bold capitalize mt-1">{m.trend}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommendation Callout */}
      <section
        className={`border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8 ${
          isIncrease ? "bg-emerald-100" : "bg-red-100"
        }`}
      >
        <h2 className="text-lg font-black uppercase text-black mb-2">
          {isIncrease ? "↑ RECOMMENDATION: INCREASE" : "↓ RECOMMENDATION: DECREASE"}
        </h2>
        <p className="text-black/70 font-medium mb-3">
          {isIncrease
            ? `Spending on ${cat.name} should be increased by ${fmt(Math.abs(cat.gap))} (${pct(cat.gapPercent)}) to reach the optimal allocation of ${fmt(cat.optimalSpending)}.`
            : `Spending on ${cat.name} should be decreased by ${fmt(Math.abs(cat.gap))} (${pct(Math.abs(cat.gapPercent))}) to reach the optimal allocation of ${fmt(cat.optimalSpending)}.`}
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="border-2 border-black p-3 bg-white">
            <div className="text-xs font-bold uppercase text-black/50">Marginal Return</div>
            <div className="text-xl font-black text-black">{(cat.marginalReturn * 100).toFixed(2)}%</div>
          </div>
          <div className="border-2 border-black p-3 bg-white">
            <div className="text-xs font-bold uppercase text-black/50">
              Share of Total Budget
            </div>
            <div className="text-xl font-black text-black">
              {((cat.currentSpending / data.totalBudget) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </section>

      {/* Spending Context: relative to total */}
      <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-black mb-4">💰 Budget Context</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-bold text-black/70">
            <span>Category share (current)</span>
            <span>{((cat.currentSpending / data.totalBudget) * 100).toFixed(1)}%</span>
          </div>
          <div className="h-4 bg-gray-100 border-2 border-black overflow-hidden">
            <div
              className="h-full bg-pink-500"
              style={{ width: `${(cat.currentSpending / data.totalBudget) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-sm font-bold text-black/70 mt-3">
            <span>Category share (optimal)</span>
            <span>
              {((cat.optimalSpending / data.categories.reduce((s, c) => s + c.optimalSpending, 0)) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-4 bg-gray-100 border-2 border-black overflow-hidden">
            <div
              className="h-full bg-yellow-300"
              style={{
                width: `${
                  (cat.optimalSpending /
                    data.categories.reduce((s, c) => s + c.optimalSpending, 0)) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-black mb-4">
          🔬 How Is Optimal Calculated?
        </h2>
        <div className="space-y-4 text-sm text-black/70 font-medium">
          <p>
            The <strong className="text-black">Optimal Budget Generator (OBG)</strong> uses a
            diminishing-returns framework to allocate spending across categories. Each budget
            category is modeled with a concave utility function — the first dollar spent on a
            category produces more welfare than the billionth dollar.
          </p>
          <div className="border-2 border-black bg-yellow-50 p-4">
            <h3 className="text-sm font-black text-black uppercase mb-2">
              Budget Impact Score (BIS)
            </h3>
            <p>
              Each category&apos;s <strong className="text-black">BIS</strong> is computed from
              outcome metrics weighted by their importance to overall welfare. The BIS captures
              how effectively each marginal dollar translates into measurable improvements in
              health, education, security, and quality of life.
            </p>
          </div>
          <div className="border-2 border-black bg-cyan-50 p-4">
            <h3 className="text-sm font-black text-black uppercase mb-2">
              Diminishing Returns Model
            </h3>
            <p>
              Spending follows a logarithmic utility curve: <code className="bg-black text-white px-1 text-xs font-bold">U(x) = α · ln(x + 1)</code> where
              α is calibrated from the category&apos;s marginal return coefficient. The optimal
              allocation equalizes the marginal utility per dollar across all categories — the
              point where reallocating $1 from any category to another would not improve total
              welfare.
            </p>
          </div>
          <div className="border-2 border-black bg-pink-50 p-4">
            <h3 className="text-sm font-black text-black uppercase mb-2">
              Marginal Return ({(cat.marginalReturn * 100).toFixed(2)}% for {cat.name})
            </h3>
            <p>
              The marginal return of <strong className="text-black">{(cat.marginalReturn * 100).toFixed(2)}%</strong> means
              each additional dollar currently spent on {cat.name} produces{" "}
              {(cat.marginalReturn * 100).toFixed(2)} cents of welfare value. Categories with
              higher marginal returns are underfunded relative to their potential; those with
              lower returns are overfunded.
            </p>
          </div>
          <p>
            The total budget constraint is maintained at <strong className="text-black">{fmt(data.totalBudget)}</strong>.
            The optimizer reallocates within this envelope to maximize aggregate welfare measured
            by the BIS-weighted outcome metrics across all {data.categories.length} categories.
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Link
          href="/budget"
          className="inline-block border-2 border-black bg-black text-white px-4 py-2 font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none transition-shadow"
        >
          ← All Categories
        </Link>
        <p className="text-xs text-black/40 font-bold">
          Generated {new Date(data.generatedAt).toLocaleDateString()} · Optomitron OBG
        </p>
      </div>
    </div>
  );
}
