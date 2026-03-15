import budgetData from "@/data/us-budget-analysis.json";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { budgetLink, optimalBudgetGeneratorPaperLink } from "@/lib/routes";
import { slugify } from "@/lib/slugify";

/* ------------------------------------------------------------------ */
/*  Types & Data                                                      */
/* ------------------------------------------------------------------ */

interface Category {
  name: string;
  currentSpending: number;
  optimalSpending: number;
  gap: number;
  gapPercent: number;
  marginalReturn: number;
  recommendation: string;
  recommendedAction: string;
  evidenceGrade: string;
  evidenceDescription: string;
  investmentStatus: string;
  priorityScore: number;
  elasticity?: number;
  discretionary: boolean;
  wesMethodology: string;
  diminishingReturns?: {
    modelType: string;
    r2: number;
    n: number;
    lowFit: boolean;
    smallSample: boolean;
  };
  welfareEffect: { incomeEffect: number; healthEffect: number };
  oslCiLow?: number;
  oslCiHigh?: number;
  outcomeMetrics: { name: string; value: number; trend: string }[];
}

interface ConstrainedCategory {
  name: string;
  currentSpending: number;
  constrainedOptimal: number;
  reallocation: number;
  reallocationPercent: number;
  action: string;
  evidenceGrade: string;
  isNonDiscretionary: boolean;
}

interface CausalEvidenceEntry {
  name: string;
  forwardPearson: number;
  nCountries: number;
  positiveCount: number;
  negativeCount: number;
  meanPercentChange: number;
  bhStrength: number;
  bhTemporality: number;
  bhGradient: number;
  wesScore: number;
  evidenceGrade: string;
}

interface DomesticEvidenceEntry {
  name: string;
  bestOutcomeName: string;
  correlation: number;
  nYears: number;
  bhStrength: number;
  wesScore: number;
  evidenceGrade: string;
}

interface BudgetData {
  jurisdiction: string;
  totalBudget: number;
  categories: Category[];
  constrainedReallocation: {
    totalBudget: number;
    nonDiscretionaryTotal: number;
    actionableBudget: number;
    categories: ConstrainedCategory[];
  };
  causalEvidenceDetail: CausalEvidenceEntry[];
  domesticEvidenceDetail: DomesticEvidenceEntry[];
  topRecommendations: string[];
  generatedAt: string;
}

const data = budgetData as BudgetData;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

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
  if (t === "increasing" || t === "improving") return "text-brutal-cyan";
  if (t === "decreasing") return "text-brutal-red";
  return "text-black/50";
}

function gradeBg(grade: string): string {
  switch (grade) {
    case "A": return "bg-brutal-cyan";
    case "B": return "bg-brutal-yellow";
    case "C": return "bg-brutal-yellow";
    case "D": return "bg-brutal-red/60";
    case "F": return "bg-brutal-red";
    default: return "bg-muted";
  }
}

function actionBadgeStyle(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("major increase") || a === "scale_up") return "bg-brutal-cyan text-black";
  if (a.includes("increase") || a === "increase") return "bg-brutal-cyan text-black";
  if (a.includes("maintain") || a === "maintain") return "bg-muted text-black";
  if (a.includes("major decrease") || a === "major_decrease") return "bg-brutal-red text-black";
  if (a.includes("decrease") || a === "decrease") return "bg-brutal-yellow text-black";
  if (a.includes("non-discretionary")) return "bg-muted text-black";
  if (a.includes("insufficient")) return "bg-muted text-black/50";
  return "bg-muted text-black";
}

function actionLabel(action: string): string {
  switch (action) {
    case "scale_up": return "Scale Up";
    case "increase": return "Increase";
    case "maintain": return "Maintain";
    case "decrease": return "Decrease";
    case "major_decrease": return "Major Decrease";
    default: return action;
  }
}

function barColor(val: number): string {
  if (val >= 0.7) return "bg-brutal-cyan";
  if (val >= 0.4) return "bg-brutal-yellow";
  return "bg-brutal-red";
}

function wesMethodologyLabel(m: string): string {
  switch (m) {
    case "causal": return "Causal (N-of-1)";
    case "domestic": return "Domestic (US)";
    case "estimated": return "Estimated";
    case "non-discretionary": return "Non-discretionary";
    default: return m;
  }
}

/* ------------------------------------------------------------------ */
/*  Static params                                                     */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return data.categories.map((c) => ({ slug: slugify(c.name) }));
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

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
        <h1 className="text-3xl font-black uppercase text-black mb-4">Category Not Found</h1>
        <NavItemLink item={budgetLink} variant="custom" className="text-brutal-pink font-bold underline">
          ← Back to Budget Dashboard
        </NavItemLink>
      </div>
    );
  }

  const maxBar = Math.max(cat.currentSpending, cat.optimalSpending);
  const currentPct = (cat.currentSpending / maxBar) * 100;
  const optimalPct = (cat.optimalSpending / maxBar) * 100;
  const totalOptimal = data.categories.reduce((s, c) => s + c.optimalSpending, 0);
  const dr = cat.diminishingReturns;

  // Constrained reallocation data for this category
  const constrainedCat = data.constrainedReallocation.categories.find(
    (c) => c.name === cat.name
  );

  // Causal / domestic evidence for this category
  const causalEvidence = data.causalEvidenceDetail.find(
    (e) => e.name === cat.name
  );
  const domesticEvidence = data.domesticEvidenceDetail.find(
    (e) => e.name === cat.name
  );
  const hasEvidence = causalEvidence !== undefined || domesticEvidence !== undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <NavItemLink
        item={budgetLink}
        variant="custom"
        className="inline-block mb-6 text-sm font-bold text-black/50 hover:text-black transition-colors uppercase"
      >
        ← All Budget Categories
      </NavItemLink>

      {/* Hero */}
      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8 mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-black mb-4">
          {cat.name}
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border-2 border-black p-4 bg-brutal-cyan shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold uppercase text-black/60 mb-1">Current Spending</div>
            <div className="text-2xl sm:text-3xl font-black text-black">{fmt(cat.currentSpending)}</div>
          </div>
          <div className="border-2 border-black p-4 bg-brutal-yellow shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-bold uppercase text-black/60 mb-1">Optimal Spending</div>
            <div className="text-2xl sm:text-3xl font-black text-black">{fmt(cat.optimalSpending)}</div>
            {cat.oslCiLow !== undefined && cat.oslCiHigh !== undefined && (
              <div className="text-xs font-bold text-black/40 mt-1">
                95% CI: {fmt(cat.oslCiLow)} – {fmt(cat.oslCiHigh)}
              </div>
            )}
          </div>
          <div
            className={`border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
              cat.gap >= 0 ? "bg-brutal-cyan" : "bg-brutal-red"
            }`}
          >
            <div className="text-xs font-bold uppercase text-black/60 mb-1">Gap</div>
            <div className="text-2xl sm:text-3xl font-black text-black">
              {fmt(Math.abs(cat.gap))} ({pct(cat.gapPercent)})
            </div>
            <div className="text-xs font-bold text-black/50 mt-1">{cat.investmentStatus}</div>
          </div>
          <div className={`border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${gradeBg(cat.evidenceGrade)}`}>
            <div className="text-xs font-bold uppercase text-black/60 mb-1">Evidence Grade</div>
            <div className="text-2xl sm:text-3xl font-black text-black">{cat.evidenceGrade}</div>
            <div className="text-xs font-bold text-black/50 mt-1">{cat.evidenceDescription}</div>
            <div className="text-xs font-bold text-black/40 mt-0.5">
              {wesMethodologyLabel(cat.wesMethodology)}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed-Budget Reallocation */}
      {constrainedCat && (
        <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
          <h2 className="text-lg font-black uppercase text-black mb-4">Fixed-Budget Reallocation</h2>
          {constrainedCat.isNonDiscretionary ? (
            <div className="border-2 border-black p-4 bg-muted">
              <p className="text-sm text-black/60 font-medium">
                This is a non-discretionary entitlement, excluded from reallocation.
                Spending is held at the current level of {fmt(constrainedCat.currentSpending)}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border-2 border-black p-4 bg-white">
                <div className="text-xs font-bold uppercase text-black/50 mb-1">Constrained Optimal</div>
                <div className="text-xl font-black text-black">{fmt(constrainedCat.constrainedOptimal)}</div>
              </div>
              <div className={`border-2 border-black p-4 ${constrainedCat.reallocation >= 0 ? "bg-brutal-cyan" : "bg-brutal-red"}`}>
                <div className="text-xs font-bold uppercase text-black/50 mb-1">Reallocation</div>
                <div className={`text-xl font-black ${constrainedCat.reallocation >= 0 ? "text-black" : "text-white"}`}>
                  {constrainedCat.reallocation >= 0 ? "+" : ""}{fmt(constrainedCat.reallocation)}
                </div>
                <div className="text-xs font-bold text-black/40 mt-1">
                  {pct(constrainedCat.reallocationPercent)} of current
                </div>
              </div>
              <div className="border-2 border-black p-4 bg-white">
                <div className="text-xs font-bold uppercase text-black/50 mb-1">Action</div>
                <span className={`inline-block px-3 py-1 text-sm font-black border-2 border-black ${actionBadgeStyle(constrainedCat.action)}`}>
                  {constrainedCat.action}
                </span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Bar chart: Current vs Optimal */}
      <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-black mb-4">Current vs Optimal</h2>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-black">Current</span>
              <span className="text-sm font-bold text-black/60">{fmt(cat.currentSpending)}</span>
            </div>
            <div className="h-8 bg-muted border-2 border-black overflow-hidden">
              <div
                className="h-full bg-brutal-cyan border-r-2 border-black"
                style={{ width: `${currentPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-black">Optimal</span>
              <span className="text-sm font-bold text-black/60">{fmt(cat.optimalSpending)}</span>
            </div>
            <div className="h-8 bg-muted border-2 border-black overflow-hidden">
              <div
                className="h-full bg-brutal-yellow border-r-2 border-black"
                style={{ width: `${optimalPct}%` }}
              />
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs font-bold text-black/40">
          Marginal return per dollar: {(cat.marginalReturn * 100).toFixed(2)}%
        </div>
      </section>

      {/* Diminishing Returns */}
      {dr && (
        <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
          <h2 className="text-lg font-black uppercase text-black mb-4">Diminishing Returns Analysis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="border-2 border-black p-3 bg-white">
              <div className="text-xs font-bold uppercase text-black/50">Model Type</div>
              <div className="text-lg font-black text-black">{dr.modelType}</div>
            </div>
            <div className="border-2 border-black p-3 bg-white">
              <div className="text-xs font-bold uppercase text-black/50">R² (Model Fit)</div>
              <div className="text-lg font-black text-black">{(dr.r2 * 100).toFixed(0)}%</div>
              <div className="mt-1 h-2 bg-muted border border-black overflow-hidden">
                <div className="h-full bg-brutal-pink" style={{ width: `${dr.r2 * 100}%` }} />
              </div>
            </div>
            {cat.elasticity !== undefined && (
              <div className="border-2 border-black p-3 bg-white">
                <div className="text-xs font-bold uppercase text-black/50">Elasticity</div>
                <div className="text-lg font-black text-black">{cat.elasticity.toFixed(2)}</div>
                <div className="text-xs text-black/40 font-bold mt-1">
                  1% spending increase → {cat.elasticity.toFixed(2)}% outcome change
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold px-2 py-0.5 border-2 border-black bg-muted">
              N = {dr.n} observations
            </span>
            {dr.lowFit && (
              <span className="text-xs font-bold px-2 py-0.5 border-2 border-black bg-brutal-yellow">
                Low fit (R²&lt;0.3) — treat with caution
              </span>
            )}
            {dr.smallSample && (
              <span className="text-xs font-bold px-2 py-0.5 border-2 border-black bg-brutal-yellow">
                Small sample (n≤10) — may overfit
              </span>
            )}
          </div>
        </section>
      )}

      {/* Causal Evidence Detail */}
      {hasEvidence && (
        <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
          <h2 className="text-lg font-black uppercase text-black mb-4">Causal Evidence Detail</h2>

          {causalEvidence && (
            <div className="mb-6">
              <h3 className="text-sm font-black uppercase text-black/60 mb-3">
                OECD Cross-Country Analysis (N-of-1)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="border-2 border-black p-3 bg-white">
                  <div className="text-xs font-bold uppercase text-black/50">Mean r</div>
                  <div className="text-lg font-black text-black">{causalEvidence.forwardPearson.toFixed(3)}</div>
                </div>
                <div className="border-2 border-black p-3 bg-white">
                  <div className="text-xs font-bold uppercase text-black/50">Countries</div>
                  <div className="text-lg font-black text-black">{causalEvidence.nCountries}</div>
                  <div className="text-xs text-black/40 font-bold">
                    +{causalEvidence.positiveCount} / -{causalEvidence.negativeCount}
                  </div>
                </div>
                <div className="border-2 border-black p-3 bg-white">
                  <div className="text-xs font-bold uppercase text-black/50">Mean % Change</div>
                  <div className={`text-lg font-black ${causalEvidence.meanPercentChange >= 0 ? "text-brutal-cyan" : "text-brutal-red"}`}>
                    {causalEvidence.meanPercentChange >= 0 ? "+" : ""}{causalEvidence.meanPercentChange.toFixed(1)}%
                  </div>
                </div>
                <div className="border-2 border-black p-3 bg-white">
                  <div className="text-xs font-bold uppercase text-black/50">WES Score</div>
                  <div className="text-lg font-black text-black">{(causalEvidence.wesScore * 100).toFixed(0)}%</div>
                </div>
              </div>

              {/* Bradford Hill bars */}
              <h4 className="text-xs font-black uppercase text-black/50 mb-2">Bradford Hill Scores</h4>
              <div className="space-y-2">
                {([
                  ["Strength", causalEvidence.bhStrength],
                  ["Temporality", causalEvidence.bhTemporality],
                  ["Gradient", causalEvidence.bhGradient],
                ] as [string, number][]).map(([label, val]) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-black">{label}</span>
                      <span className="text-xs font-black text-black">{(val * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-4 bg-muted border-2 border-black overflow-hidden">
                      <div className={`h-full ${barColor(val)}`} style={{ width: `${val * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {domesticEvidence && (
            <div>
              <h3 className="text-sm font-black uppercase text-black/60 mb-3">
                US Domestic Time Series (2000-2023)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="border-2 border-black p-3 bg-white">
                  <div className="text-xs font-bold uppercase text-black/50">Best Outcome</div>
                  <div className="text-sm font-black text-black">{domesticEvidence.bestOutcomeName}</div>
                </div>
                <div className="border-2 border-black p-3 bg-white">
                  <div className="text-xs font-bold uppercase text-black/50">Correlation (r)</div>
                  <div className="text-lg font-black text-black">{domesticEvidence.correlation.toFixed(3)}</div>
                </div>
                <div className="border-2 border-black p-3 bg-white">
                  <div className="text-xs font-bold uppercase text-black/50">Data Points</div>
                  <div className="text-lg font-black text-black">{domesticEvidence.nYears} years</div>
                </div>
                <div className="border-2 border-black p-3 bg-white">
                  <div className="text-xs font-bold uppercase text-black/50">BH Strength</div>
                  <div className="text-lg font-black text-black">{(domesticEvidence.bhStrength * 100).toFixed(0)}%</div>
                  <div className="mt-1 h-2 bg-muted border border-black overflow-hidden">
                    <div className={`h-full ${barColor(domesticEvidence.bhStrength)}`} style={{ width: `${domesticEvidence.bhStrength * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Outcome Metrics */}
      <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-black mb-4">Outcome Metrics</h2>
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
          cat.gap >= 0 ? "bg-brutal-cyan" : "bg-brutal-red"
        }`}
      >
        <h2 className="text-lg font-black uppercase text-black mb-2">
          <span className={`inline-block px-2 py-0.5 mr-2 text-sm border-2 border-black ${actionBadgeStyle(cat.recommendedAction)}`}>
            {actionLabel(cat.recommendedAction)}
          </span>
          RECOMMENDATION
        </h2>
        <p className="text-black/70 font-medium mb-3">
          {cat.gap >= 0
            ? `Spending on ${cat.name} should be increased by ${fmt(Math.abs(cat.gap))} (${pct(cat.gapPercent)}) to reach the optimal allocation of ${fmt(cat.optimalSpending)}.`
            : `Spending on ${cat.name} should be decreased by ${fmt(Math.abs(cat.gap))} (${pct(Math.abs(cat.gapPercent))}) to reach the optimal allocation of ${fmt(cat.optimalSpending)}.`}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="border-2 border-black p-3 bg-white">
            <div className="text-xs font-bold uppercase text-black/50">Marginal Return</div>
            <div className="text-xl font-black text-black">{(cat.marginalReturn * 100).toFixed(2)}%</div>
          </div>
          <div className="border-2 border-black p-3 bg-white">
            <div className="text-xs font-bold uppercase text-black/50">Share of Total Budget</div>
            <div className="text-xl font-black text-black">
              {((cat.currentSpending / data.totalBudget) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="border-2 border-black p-3 bg-white">
            <div className="text-xs font-bold uppercase text-black/50">Income Effect</div>
            <div className={`text-xl font-black ${cat.welfareEffect.incomeEffect >= 0 ? "text-brutal-cyan" : "text-brutal-red"}`}>
              {cat.welfareEffect.incomeEffect >= 0 ? "+" : ""}{(cat.welfareEffect.incomeEffect * 100).toFixed(0)}%
            </div>
            <div className="mt-1 h-2 bg-muted border border-black overflow-hidden">
              <div
                className={`h-full ${cat.welfareEffect.incomeEffect >= 0 ? "bg-brutal-cyan" : "bg-brutal-red"}`}
                style={{ width: `${Math.min(Math.abs(cat.welfareEffect.incomeEffect) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="border-2 border-black p-3 bg-white">
            <div className="text-xs font-bold uppercase text-black/50">Health Effect</div>
            <div className={`text-xl font-black ${cat.welfareEffect.healthEffect >= 0 ? "text-brutal-cyan" : "text-brutal-red"}`}>
              {cat.welfareEffect.healthEffect >= 0 ? "+" : ""}{(cat.welfareEffect.healthEffect * 100).toFixed(0)}%
            </div>
            <div className="mt-1 h-2 bg-muted border border-black overflow-hidden">
              <div
                className={`h-full ${cat.welfareEffect.healthEffect >= 0 ? "bg-brutal-cyan" : "bg-brutal-red"}`}
                style={{ width: `${Math.min(Math.abs(cat.welfareEffect.healthEffect) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Budget Context */}
      <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-black mb-4">Budget Context</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-bold text-black/70">
            <span>Category share (current)</span>
            <span>{((cat.currentSpending / data.totalBudget) * 100).toFixed(1)}%</span>
          </div>
          <div className="h-4 bg-muted border-2 border-black overflow-hidden">
            <div
              className="h-full bg-brutal-pink"
              style={{ width: `${(cat.currentSpending / data.totalBudget) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-sm font-bold text-black/70 mt-3">
            <span>Category share (optimal)</span>
            <span>
              {((cat.optimalSpending / totalOptimal) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-4 bg-muted border-2 border-black overflow-hidden">
            <div
              className="h-full bg-brutal-yellow"
              style={{ width: `${(cat.optimalSpending / totalOptimal) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
        <h2 className="text-lg font-black uppercase text-black mb-4">
          How Is Optimal Calculated?
        </h2>
        <div className="space-y-4 text-sm text-black/70 font-medium">
          <p>
            The <strong className="text-black">Optimal Budget Generator (OBG)</strong> uses a
            diminishing-returns framework to allocate spending across categories. Each budget
            category is modeled with a concave utility function — the first dollar spent on a
            category produces more welfare than the billionth dollar.
          </p>
          <div className="border-2 border-black bg-brutal-yellow p-4">
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
          <div className="border-2 border-black bg-brutal-cyan p-4">
            <h3 className="text-sm font-black text-black uppercase mb-2">
              Diminishing Returns Model
            </h3>
            <p>
              Spending follows a logarithmic utility curve:{" "}
              <code className="bg-black text-white px-1 text-xs font-bold">U(x) = α · ln(x + 1)</code>{" "}
              where α is calibrated from the category&apos;s marginal return coefficient. The optimal
              allocation equalizes the marginal utility per dollar across all categories — the
              point where reallocating $1 from any category to another would not improve total
              welfare.
            </p>
          </div>
          <div className="border-2 border-black bg-brutal-pink p-4">
            <h3 className="text-sm font-black text-black uppercase mb-2">
              Marginal Return ({(cat.marginalReturn * 100).toFixed(2)}% for {cat.name})
            </h3>
            <p>
              The marginal return of{" "}
              <strong className="text-black">{(cat.marginalReturn * 100).toFixed(2)}%</strong> means
              each additional dollar currently spent on {cat.name} produces{" "}
              {(cat.marginalReturn * 100).toFixed(2)} cents of welfare value. Categories with
              higher marginal returns are underfunded relative to their potential; those with
              lower returns are overfunded.
            </p>
          </div>
          <p>
            The total budget constraint is maintained at{" "}
            <strong className="text-black">{fmt(data.totalBudget)}</strong>.
            The optimizer reallocates within this envelope to maximize aggregate welfare measured
            by the BIS-weighted outcome metrics across all {data.categories.length} categories.
          </p>
          <p className="text-xs text-black/50">
            See the{" "}
            <NavItemLink
              item={optimalBudgetGeneratorPaperLink}
              variant="custom"
              external
              className="text-brutal-pink hover:underline"
            >
              Optimal Budget Generator paper
            </NavItemLink>{" "}
            for full methodology.
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <NavItemLink
          item={budgetLink}
          variant="custom"
          className="inline-block border-2 border-black bg-black text-white px-4 py-2 font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none transition-shadow"
        >
          ← All Categories
        </NavItemLink>
        <p className="text-xs text-black/40 font-bold">
          Generated {new Date(data.generatedAt).toLocaleDateString()} · Optomitron OBG
        </p>
      </div>
    </div>
  );
}
