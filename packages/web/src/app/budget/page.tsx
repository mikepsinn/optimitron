"use client";

import Link from "next/link";
import budgetData from "@/data/us-budget-analysis.json";
import { slugify } from "@/lib/slugify";

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

interface BudgetData {
  jurisdiction: string;
  totalBudget: number;
  categories: Category[];
  topRecommendations: string[];
  generatedAt: string;
}

const data = budgetData as BudgetData;

function fmt(n: number): string {
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(0)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

function pct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function actionBadgeStyle(action: string): string {
  switch (action) {
    case "scale_up":
      return "bg-emerald-400 text-black";
    case "increase":
      return "bg-emerald-300 text-black";
    case "maintain":
      return "bg-gray-200 text-black";
    case "decrease":
      return "bg-orange-300 text-black";
    case "major_decrease":
      return "bg-red-300 text-black";
    default:
      return "bg-gray-200 text-black";
  }
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
    case "A": return "bg-emerald-300";
    case "B": return "bg-yellow-300";
    case "C": return "bg-amber-300";
    case "D": return "bg-orange-300";
    case "F": return "bg-red-300";
    default: return "bg-gray-200";
  }
}

export default function BudgetPage() {
  const maxSpending = Math.max(
    ...data.categories.flatMap((c) => [c.currentSpending, c.optimalSpending])
  );

  const sorted = [...data.categories].sort(
    (a, b) => Math.abs(b.gap) - Math.abs(a.gap)
  );

  const totalCurrent = data.categories.reduce((s, c) => s + c.currentSpending, 0);
  const totalOptimal = data.categories.reduce((s, c) => s + c.optimalSpending, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black mb-2">
          US Federal Budget Dashboard
        </h1>
        <p className="text-black/60 font-medium">
          Current vs. optimal spending analysis for {data.categories.length} budget categories. Total budget: {fmt(data.totalBudget)}.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <SummaryCard label="Total Current" value={fmt(totalCurrent)} />
        <SummaryCard label="Total Optimal" value={fmt(totalOptimal)} />
        <SummaryCard label="Net Reallocation" value={fmt(totalOptimal - totalCurrent)} color={totalOptimal > totalCurrent ? "text-emerald-600" : "text-red-600"} />
        <SummaryCard label="Categories Analyzed" value={String(data.categories.length)} />
      </div>

      {/* Top Recommendations */}
      <section className="mb-10">
        <h2 className="section-title">Top 5 Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.topRecommendations.slice(0, 5).map((rec, i) => (
            <div key={i} className="card border-pink-500">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-pink-500 text-white flex items-center justify-center text-sm font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {i + 1}
                </span>
                <p className="text-sm text-black/70 font-medium">{rec}</p>
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
            <Link key={cat.name} href={`/budget/${slugify(cat.name)}`} className="card block hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                <h3 className="text-sm font-black text-black">{cat.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black px-2 py-0.5 border-2 border-black ${gradeBadgeColor(cat.evidenceGrade)}`}>
                    {cat.evidenceGrade}
                  </span>
                  <span
                    className={`text-xs font-black px-2 py-0.5 border-2 border-black ${actionBadgeStyle(cat.recommendedAction)}`}
                  >
                    {actionLabel(cat.recommendedAction)} {pct(cat.gapPercent)}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-black/50 w-16 font-bold">Current</span>
                  <div className="flex-1 h-5 bg-gray-100 border border-black overflow-hidden">
                    <div
                      className="h-full bar-current"
                      style={{ width: `${(cat.currentSpending / maxSpending) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-black/60 w-20 text-right font-bold">{fmt(cat.currentSpending)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-black/50 w-16 font-bold">Optimal</span>
                  <div className="flex-1 h-5 bg-gray-100 border border-black overflow-hidden">
                    <div
                      className="h-full bar-optimal"
                      style={{ width: `${(cat.optimalSpending / maxSpending) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-black/60 w-20 text-right font-bold">{fmt(cat.optimalSpending)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Table */}
      <section>
        <h2 className="section-title">Full Category Breakdown</h2>
        <div className="overflow-x-auto border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black bg-yellow-300">
                <th className="text-left py-3 px-2 text-black font-black uppercase">Category</th>
                <th className="text-right py-3 px-2 text-black font-black uppercase">Current</th>
                <th className="text-right py-3 px-2 text-black font-black uppercase">Optimal</th>
                <th className="text-right py-3 px-2 text-black font-black uppercase">Gap %</th>
                <th className="text-center py-3 px-2 text-black font-black uppercase">Grade</th>
                <th className="text-center py-3 px-2 text-black font-black uppercase">Status</th>
                <th className="text-center py-3 px-2 text-black font-black uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((cat) => (
                <tr key={cat.name} className="border-b border-black hover:bg-cyan-50">
                  <td className="py-3 px-2 text-black font-bold">
                    <Link href={`/budget/${slugify(cat.name)}`} className="underline hover:text-pink-500 transition-colors">
                      {cat.name}
                    </Link>
                  </td>
                  <td className="py-3 px-2 text-right text-black/70 font-medium">{fmt(cat.currentSpending)}</td>
                  <td className="py-3 px-2 text-right text-black/70 font-medium">{fmt(cat.optimalSpending)}</td>
                  <td className={`py-3 px-2 text-right font-bold ${cat.gap >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {pct(cat.gapPercent)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-block px-2 py-0.5 text-xs font-black border-2 border-black ${gradeBadgeColor(cat.evidenceGrade)}`}>
                      {cat.evidenceGrade}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-xs font-bold text-black/60">
                      {cat.investmentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-black border-2 border-black ${actionBadgeStyle(cat.recommendedAction)}`}
                    >
                      {actionLabel(cat.recommendedAction)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-black/40 mt-8 font-bold">
        Generated {new Date(data.generatedAt).toLocaleDateString()} · Source: Optomitron OBG (Optimal Budget Generator)
      </p>
    </div>
  );
}

function SummaryCard({ label, value, color = "text-black" }: { label: string; value: string; color?: string }) {
  return (
    <div className="card text-center">
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-xs text-black/50 mt-1 font-bold uppercase">{label}</div>
    </div>
  );
}
