"use client";

import budgetData from "@/data/us-budget-analysis.json";

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
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
          🇺🇸 US Federal Budget Dashboard
        </h1>
        <p className="text-slate-400">
          Current vs. optimal spending analysis for {data.categories.length} budget categories. Total budget: {fmt(data.totalBudget)}.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <SummaryCard label="Total Current" value={fmt(totalCurrent)} />
        <SummaryCard label="Total Optimal" value={fmt(totalOptimal)} />
        <SummaryCard label="Net Reallocation" value={fmt(totalOptimal - totalCurrent)} color={totalOptimal > totalCurrent ? "text-emerald-400" : "text-red-400"} />
        <SummaryCard label="Categories Analyzed" value={String(data.categories.length)} />
      </div>

      {/* Top Recommendations */}
      <section className="mb-10">
        <h2 className="section-title">🏆 Top 5 Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.topRecommendations.slice(0, 5).map((rec, i) => (
            <div key={i} className="card border-primary-500/30">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <p className="text-sm text-slate-300">{rec}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bar chart */}
      <section className="mb-10">
        <h2 className="section-title">📊 Current vs Optimal Spending</h2>
        <div className="space-y-4">
          {sorted.map((cat) => (
            <div key={cat.name} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">{cat.name}</h3>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    cat.recommendation === "increase"
                      ? "bg-emerald-600/20 text-emerald-400"
                      : "bg-red-600/20 text-red-400"
                  }`}
                >
                  {cat.recommendation === "increase" ? "↑ Increase" : "↓ Decrease"} {pct(cat.gapPercent)}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-16">Current</span>
                  <div className="flex-1 h-5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bar-current rounded-full"
                      style={{ width: `${(cat.currentSpending / maxSpending) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-20 text-right">{fmt(cat.currentSpending)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-16">Optimal</span>
                  <div className="flex-1 h-5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bar-optimal rounded-full"
                      style={{ width: `${(cat.optimalSpending / maxSpending) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-20 text-right">{fmt(cat.optimalSpending)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Table */}
      <section>
        <h2 className="section-title">📋 Full Category Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-2 text-slate-400 font-medium">Category</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">Current</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">Optimal</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">Gap</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">Gap %</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((cat) => (
                <tr key={cat.name} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-2 text-white font-medium">{cat.name}</td>
                  <td className="py-3 px-2 text-right text-slate-300">{fmt(cat.currentSpending)}</td>
                  <td className="py-3 px-2 text-right text-slate-300">{fmt(cat.optimalSpending)}</td>
                  <td className={`py-3 px-2 text-right font-medium ${cat.gap >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {fmt(Math.abs(cat.gap))}
                  </td>
                  <td className={`py-3 px-2 text-right ${cat.gap >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {pct(cat.gapPercent)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        cat.recommendation === "increase"
                          ? "bg-emerald-600/20 text-emerald-400"
                          : "bg-red-600/20 text-red-400"
                      }`}
                    >
                      {cat.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-slate-500 mt-8">
        Generated {new Date(data.generatedAt).toLocaleDateString()} · Source: Optomitron OBG (Optimal Budget Generator)
      </p>
    </div>
  );
}

function SummaryCard({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="card text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}
