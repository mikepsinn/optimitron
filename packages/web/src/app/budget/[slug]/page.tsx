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

export function generateStaticParams() {
  return data.categories.map((c) => ({ slug: slugify(c.name) }));
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(0)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

function trendIcon(trend: string): string {
  if (trend === "increasing" || trend === "improving") return "📈";
  if (trend === "decreasing" || trend === "declining") return "📉";
  return "➡️";
}

function recColor(rec: string): string {
  if (rec === "increase") return "bg-emerald-100 border-emerald-500 text-emerald-800";
  if (rec === "decrease") return "bg-red-100 border-red-500 text-red-800";
  return "bg-yellow-100 border-yellow-500 text-yellow-800";
}

function recLabel(rec: string): string {
  if (rec === "increase") return "⬆️ INCREASE FUNDING";
  if (rec === "decrease") return "⬇️ DECREASE FUNDING";
  return "➡️ MAINTAIN CURRENT LEVELS";
}

export default function BudgetCategoryPage({ params }: { params: { slug: string } }) {
  const cat = data.categories.find((c) => slugify(c.name) === params.slug);

  if (!cat) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-3xl font-black text-black mb-4">Category Not Found</h1>
        <Link href="/budget" className="text-pink-500 font-bold hover:underline">← Back to Budget</Link>
      </div>
    );
  }

  const maxVal = Math.max(cat.currentSpending, cat.optimalSpending);
  const gapAbs = Math.abs(cat.gap);
  const isUnder = cat.gap > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/budget" className="text-sm font-bold text-black/50 hover:text-pink-500 transition-colors mb-6 inline-block uppercase">
        ← All Budget Categories
      </Link>

      {/* Hero */}
      <div className="bg-white border-4 border-black p-8 mb-8" style={{ boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" }}>
        <h1 className="text-3xl md:text-4xl font-black uppercase text-black mb-2">{cat.name}</h1>
        <div className="flex flex-wrap gap-6 mt-6">
          <div>
            <div className="text-xs font-black uppercase text-black/50">Current Spending</div>
            <div className="text-3xl font-black text-black">{fmt(cat.currentSpending)}</div>
          </div>
          <div>
            <div className="text-xs font-black uppercase text-black/50">Optimal Spending</div>
            <div className="text-3xl font-black text-pink-500">{fmt(cat.optimalSpending)}</div>
          </div>
          <div>
            <div className="text-xs font-black uppercase text-black/50">Gap</div>
            <div className={`text-3xl font-black ${isUnder ? "text-emerald-600" : "text-red-600"}`}>
              {isUnder ? "+" : "-"}{fmt(gapAbs)}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className={`border-l-4 p-6 mb-8 ${recColor(cat.recommendation)}`}>
        <div className="text-lg font-black uppercase">{recLabel(cat.recommendation)}</div>
        <p className="mt-2 text-sm font-medium">
          {isUnder
            ? `This category is underfunded by ${fmt(gapAbs)} (${cat.gapPercent.toFixed(1)}%). Increasing funding would improve outcomes based on diminishing returns analysis.`
            : `This category is overfunded by ${fmt(gapAbs)} (${Math.abs(cat.gapPercent).toFixed(1)}%). Reallocating excess funding to underfunded categories would improve overall welfare.`}
        </p>
        <p className="mt-1 text-xs font-medium opacity-70">
          Marginal return: {cat.marginalReturn.toFixed(4)} welfare units per $1B
        </p>
      </div>

      {/* Current vs Optimal Bar Chart */}
      <div className="bg-white border-2 border-black p-6 mb-8" style={{ boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}>
        <h2 className="text-lg font-black uppercase text-black mb-4">📊 Current vs Optimal</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-black">Current</span>
              <span className="text-sm font-black text-black">{fmt(cat.currentSpending)}</span>
            </div>
            <div className="h-8 bg-gray-100 border-2 border-black">
              <div className="h-full bg-cyan-300" style={{ width: `${(cat.currentSpending / maxVal) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-black">Optimal</span>
              <span className="text-sm font-black text-pink-500">{fmt(cat.optimalSpending)}</span>
            </div>
            <div className="h-8 bg-gray-100 border-2 border-black">
              <div className="h-full bg-pink-400" style={{ width: `${(cat.optimalSpending / maxVal) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Outcome Metrics */}
      <div className="bg-white border-2 border-black p-6 mb-8" style={{ boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}>
        <h2 className="text-lg font-black uppercase text-black mb-4">📈 Outcome Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cat.outcomeMetrics.map((m) => (
            <div key={m.name} className="border-2 border-black p-4 bg-yellow-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-black">{m.name}</span>
                <span className="text-lg">{trendIcon(m.trend)}</span>
              </div>
              <div className="text-2xl font-black text-black mt-1">{m.value}</div>
              <div className="text-xs font-medium text-black/50 capitalize">{m.trend}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Methodology */}
      <div className="bg-white border-2 border-black p-6" style={{ boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}>
        <h2 className="text-lg font-black uppercase text-black mb-3">📐 How is Optimal Calculated?</h2>
        <div className="space-y-3 text-sm text-black/80 font-medium">
          <p>
            <strong>Diminishing Returns Model:</strong> Each budget category follows a log-linear relationship between
            spending and outcomes. The first dollar spent has the highest marginal return; each additional dollar
            produces less improvement. The "optimal" point is where marginal returns equalize across all categories.
          </p>
          <p>
            <strong>Budget Impact Score (BIS):</strong> Combines outcome elasticity (how much outcomes change per
            dollar), cost-effectiveness ratios, and current spending levels to rank where additional funding would
            have the most impact.
          </p>
          <p>
            <strong>Data Sources:</strong> Congressional Budget Office (CBO), Office of Management and Budget (OMB),
            Bureau of Labor Statistics, WHO, World Bank. Historical spending data from FY2015-FY2025.
          </p>
          <p className="text-xs text-black/50">
            See the <a href="https://obg.warondisease.org" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline">Optimal Budget Generator paper</a> for full methodology.
          </p>
        </div>
      </div>
    </div>
  );
}
