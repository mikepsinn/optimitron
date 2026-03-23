"use client";

import { useState } from "react";
import Link from "next/link";
import budgetData from "@/data/us-budget-analysis.json";
import { getBudgetCategoryPath } from "@/lib/routes";
import { PrizeCTA } from "@/components/prize/PrizeCTA";
// BudgetGapChart deleted — referenced old schema
import { EfficientFrontierChart, EfficientFrontierSummary } from "@/components/landing/EfficientFrontierChart";

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

interface ConstrainedReallocation {
  totalBudget: number;
  nonDiscretionaryTotal: number;
  actionableBudget: number;
  categories: ConstrainedCategory[];
}

interface BudgetData {
  jurisdiction: string;
  totalBudget: number;
  categories: Category[];
  constrainedReallocation: ConstrainedReallocation;
  topRecommendations: string[];
  generatedAt: string;
}

const data = budgetData as unknown as BudgetData;

function fmt(n: number | undefined | null): string {
  if (n == null) return "N/A";
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(0)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

function pctSafe(n: number | undefined | null): string {
  if (n == null) return "N/A";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function pct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function actionBadgeStyle(action: string | undefined): string {
  if (!action) return "bg-muted text-foreground";
  const a = action.toLowerCase();
  if (a.includes("major increase") || a === "scale_up") return "bg-brutal-cyan text-foreground";
  if (a.includes("increase") || a === "increase") return "bg-brutal-cyan text-foreground";
  if (a.includes("maintain") || a === "maintain") return "bg-muted text-foreground";
  if (a.includes("modest decrease") || a === "decrease") return "bg-brutal-yellow text-foreground";
  if (a.includes("major decrease") || a === "major_decrease") return "bg-brutal-red text-foreground";
  if (a.includes("decrease")) return "bg-brutal-yellow text-foreground";
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
    default: return action;
  }
}

function gradeBadgeColor(grade: string): string {
  switch (grade) {
    case "A": return "bg-brutal-cyan";
    case "B": return "bg-brutal-yellow";
    case "C": return "bg-brutal-yellow";
    case "D": return "bg-brutal-red";
    case "F": return "bg-brutal-red";
    default: return "bg-muted";
  }
}

export default function BudgetPage() {
  const [view, setView] = useState<"constrained" | "unconstrained">("constrained");

  const isConstrained = view === "constrained";
  const cr = data.constrainedReallocation;

  const sorted = [...data.categories].sort(
    (a, b) => Math.abs(b.gap) - Math.abs(a.gap)
  );

  const totalCurrent = data.categories.reduce((s, c) => s + c.currentSpending, 0);
  const totalOptimal = data.categories.reduce((s, c) => s + (c.optimalSpending ?? 0), 0);

  // For constrained view, sort by reallocation amount
  const constrainedSorted = cr
    ? [...cr.categories].sort((a, b) => Math.abs(b.reallocation) - Math.abs(a.reallocation))
    : [];

  // Separate non-discretionary from discretionary for constrained view
  const constrainedActionable = constrainedSorted.filter(c => !c.isNonDiscretionary);
  const constrainedNonDisc = constrainedSorted.filter(c => c.isNonDiscretionary);

  const maxSpending = isConstrained
    ? Math.max(...constrainedActionable.flatMap(c => [c.currentSpending, c.constrainedOptimal]))
    : Math.max(...data.categories.flatMap(c => [c.currentSpending, c.optimalSpending]));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground mb-2">
          The US Federal Budget, Diagnosed
        </h1>
        <p className="text-muted-foreground font-bold">
          Your government&apos;s {fmt(data.totalBudget)} shopping list, reviewed by someone who&apos;s actually done the maths. {data.categories.length} categories. Most of them wrong.
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView("constrained")}
          className={`px-4 py-2 text-sm font-black uppercase border-4 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
            isConstrained ? "bg-brutal-pink text-brutal-pink-foreground" : "bg-background text-foreground hover:bg-brutal-cyan"
          }`}
        >
          Fixed Budget
        </button>
        <button
          onClick={() => setView("unconstrained")}
          className={`px-4 py-2 text-sm font-black uppercase border-4 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
            !isConstrained ? "bg-brutal-pink text-brutal-pink-foreground" : "bg-background text-foreground hover:bg-brutal-cyan"
          }`}
        >
          Unconstrained
        </button>
      </div>

      {/* Summary cards */}
      {isConstrained && cr ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <SummaryCard label="Total Budget" value={fmt(cr.totalBudget)} />
          <SummaryCard label="Non-Discretionary" value={fmt(cr.nonDiscretionaryTotal)} />
          <SummaryCard label="Actionable Budget" value={fmt(cr.actionableBudget)} />
          <SummaryCard label="Net Reallocation" value="$0" color="text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <SummaryCard label="Total Current" value={fmt(totalCurrent)} />
          <SummaryCard label="Total Optimal" value={fmt(totalOptimal)} />
          <SummaryCard label="Net Reallocation" value={fmt(totalOptimal - totalCurrent)} color={totalOptimal > totalCurrent ? "text-brutal-cyan" : "text-brutal-red"} />
          <SummaryCard label="Categories Analyzed" value={String(data.categories.length)} />
        </div>
      )}

      {/* Top Recommendations */}
      <section className="mb-10">
        <h2 className="section-title">Top 5 Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.topRecommendations.slice(0, 5).map((rec, i) => (
            <div key={i} className="card border-primary">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-brutal-pink text-brutal-pink-foreground flex items-center justify-center text-sm font-black border-4 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
        <h2 className="section-title">
          {isConstrained ? "Current vs Constrained Optimal" : "Current vs Optimal Spending"}
        </h2>

        {isConstrained && cr ? (
          <div className="space-y-4">
            {constrainedActionable.map((cat) => (
              <Link key={cat.name} href={getBudgetCategoryPath(cat.name)} className="card block hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-foreground">{cat.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black px-2 py-0.5 border-4 border-primary ${gradeBadgeColor(cat.evidenceGrade)}`}>
                      {cat.evidenceGrade}
                    </span>
                    <span className={`text-xs font-black px-2 py-0.5 border-4 border-primary ${actionBadgeStyle(cat.action)}`}>
                      {cat.action} {pct(cat.reallocationPercent)}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16 font-bold">Current</span>
                    <div className="flex-1 h-5 bg-muted border border-primary overflow-hidden">
                      <div className="h-full bar-current" style={{ width: `${(cat.currentSpending / maxSpending) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-right font-bold">{fmt(cat.currentSpending)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16 font-bold">Optimal</span>
                    <div className="flex-1 h-5 bg-muted border border-primary overflow-hidden">
                      <div className="h-full bar-optimal" style={{ width: `${(cat.constrainedOptimal / maxSpending) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-right font-bold">{fmt(cat.constrainedOptimal)}</span>
                  </div>
                </div>
              </Link>
            ))}
            {/* Non-discretionary section */}
            {constrainedNonDisc.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-black uppercase text-muted-foreground mb-3 tracking-wider">
                  Non-Discretionary (Excluded from Reallocation)
                </h3>
                <div className="space-y-2">
                  {constrainedNonDisc.map((cat) => (
                    <Link key={cat.name} href={getBudgetCategoryPath(cat.name)} className="card block opacity-60 hover:opacity-80 transition-opacity">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-muted-foreground">{cat.name}</h3>
                        <span className="text-sm font-bold text-muted-foreground">{fmt(cat.currentSpending)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((cat) => (
              <Link key={cat.name} href={getBudgetCategoryPath(cat.name)} className="card block hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-foreground">{cat.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black px-2 py-0.5 border-4 border-primary ${gradeBadgeColor(cat.evidenceGrade)}`}>
                      {cat.evidenceGrade}
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 border-4 border-primary ${actionBadgeStyle(cat.recommendedAction)}`}
                    >
                      {actionLabel(cat.recommendedAction)} {pct(cat.gapPercent)}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16 font-bold">Current</span>
                    <div className="flex-1 h-5 bg-muted border border-primary overflow-hidden">
                      <div
                        className="h-full bar-current"
                        style={{ width: `${(cat.currentSpending / maxSpending) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-right font-bold">{fmt(cat.currentSpending)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16 font-bold">Optimal</span>
                    <div className="flex-1 h-5 bg-muted border border-primary overflow-hidden">
                      <div
                        className="h-full bar-optimal"
                        style={{ width: `${(cat.optimalSpending / maxSpending) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-right font-bold">{fmt(cat.optimalSpending)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Table */}
      <section>
        <h2 className="section-title">Full Category Breakdown</h2>
        <div className="overflow-x-auto border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-primary bg-brutal-yellow">
                <th className="text-left py-3 px-2 text-foreground font-black uppercase">Category</th>
                <th className="text-right py-3 px-2 text-foreground font-black uppercase">Current</th>
                <th className="text-right py-3 px-2 text-foreground font-black uppercase">
                  {isConstrained ? "Constrained" : "Optimal"}
                </th>
                <th className="text-right py-3 px-2 text-foreground font-black uppercase">
                  {isConstrained ? "Reallocation" : "Gap %"}
                </th>
                <th className="text-center py-3 px-2 text-foreground font-black uppercase">Grade</th>
                <th className="text-center py-3 px-2 text-foreground font-black uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {isConstrained && cr ? (
                constrainedSorted.map((cat) => (
                  <tr key={cat.name} className={`border-b border-primary hover:bg-brutal-cyan ${cat.isNonDiscretionary ? "opacity-50" : ""}`}>
                    <td className="py-3 px-2 text-foreground font-bold">
                      <Link href={getBudgetCategoryPath(cat.name)} className="underline hover:text-brutal-pink transition-colors">
                        {cat.name}
                      </Link>
                      {cat.isNonDiscretionary && (
                        <span className="text-xs text-muted-foreground ml-1">(non-disc.)</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right text-foreground font-bold">{fmt(cat.currentSpending)}</td>
                    <td className="py-3 px-2 text-right text-foreground font-bold">{fmt(cat.constrainedOptimal)}</td>
                    <td className={`py-3 px-2 text-right font-bold ${cat.reallocation >= 0 ? "text-brutal-cyan" : "text-brutal-red"}`}>
                      {cat.isNonDiscretionary ? "—" : `${cat.reallocation >= 0 ? "+" : ""}${fmt(cat.reallocation)}`}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-2 py-0.5 text-xs font-black border-4 border-primary ${gradeBadgeColor(cat.evidenceGrade)}`}>
                        {cat.evidenceGrade}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-2 py-0.5 text-xs font-black border-4 border-primary ${actionBadgeStyle(cat.action)}`}>
                        {cat.action}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                sorted.map((cat) => (
                  <tr key={cat.name} className="border-b border-primary hover:bg-brutal-cyan">
                    <td className="py-3 px-2 text-foreground font-bold">
                      <Link href={getBudgetCategoryPath(cat.name)} className="underline hover:text-brutal-pink transition-colors">
                        {cat.name}
                      </Link>
                    </td>
                    <td className="py-3 px-2 text-right text-foreground font-bold">{fmt(cat.currentSpending)}</td>
                    <td className="py-3 px-2 text-right text-foreground font-bold">{fmt(cat.optimalSpending)}</td>
                    <td className={`py-3 px-2 text-right font-bold ${cat.gap >= 0 ? "text-brutal-cyan" : "text-brutal-red"}`}>
                      {pct(cat.gapPercent)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-2 py-0.5 text-xs font-black border-4 border-primary ${gradeBadgeColor(cat.evidenceGrade)}`}>
                        {cat.evidenceGrade}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-black border-4 border-primary ${actionBadgeStyle(cat.recommendedAction)}`}
                      >
                        {actionLabel(cat.recommendedAction)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
          body="Every misallocated dollar above is a life not saved. The 1% Treaty referendum proves demand for evidence-based budgeting. Deposit USDC, recruit verified voters, earn VOTE points."
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
