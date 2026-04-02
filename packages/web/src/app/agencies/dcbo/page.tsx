"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usPolicyAnalysis } from "@/data/us-policy-analysis";
import { getPolicyPath } from "@/lib/routes";
import { PrizeCTA } from "@/components/prize/PrizeCTA";
import { GLOBAL_AVG_INCOME_2025, GLOBAL_HALE_CURRENT } from "@optimitron/data/parameters";

// All types flow from @optimitron/opg via the generated .ts file.
const data = usPolicyAnalysis;

const MEDIAN_INCOME = GLOBAL_AVG_INCOME_2025.value;
const HALE_YEARS = GLOBAL_HALE_CURRENT.value;

/** Translate abstract effect percentages into dollar/year amounts per person */
function incomePerYear(effect: number): number {
  return Math.round(effect * MEDIAN_INCOME);
}
function haleMonths(effect: number): number {
  return Math.round(effect * 12 * 10); // effect is fraction, ×10 years scale ×12 months
}

type SortKey = "welfareScore" | "evidenceGrade" | "causalConfidenceScore" | "policyImpactScore" | "incomeEffect" | "healthEffect";
const gradeOrder: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, F: 5 };

export default function PoliciesPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("welfareScore");

  const categories = useMemo(
    () => ["all", ...new Set(data.policies.map((p) => p.category))],
    []
  );

  const filtered = useMemo(() => {
    let list = categoryFilter === "all"
      ? data.policies
      : data.policies.filter((p) => p.category === categoryFilter);

    return [...list].sort((a, b) => {
      if (sortBy === "evidenceGrade") {
        return (gradeOrder[a.evidenceGrade] ?? 9) - (gradeOrder[b.evidenceGrade] ?? 9);
      }
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return bVal - aVal;
      }
      return 0;
    });
  }, [categoryFilter, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground mb-2">
          Policy Rankings
        </h1>
        <p className="text-muted-foreground font-bold">
          I ranked {data.policies.length} of your policies by whether they actually work. Spoiler: most of them don&apos;t.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <label className="text-xs text-muted-foreground block mb-1 font-bold uppercase">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-background border-4 border-primary px-3 py-2 text-sm text-foreground font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1 font-bold uppercase">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="bg-background border-4 border-primary px-3 py-2 text-sm text-foreground font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <option value="welfareScore">Welfare Score</option>
            <option value="evidenceGrade">Evidence Grade</option>
            <option value="causalConfidenceScore">Causal Confidence</option>
            <option value="policyImpactScore">Policy Impact</option>
            <option value="incomeEffect">Income Benefit ($)</option>
            <option value="healthEffect">Health Benefit (HALE)</option>
          </select>
        </div>
      </div>

      {/* Policy list */}
      <div className="space-y-3">
        {filtered.map((policy, i) => (
          <div key={policy.name} className="card">
            <button
              onClick={() => setExpanded(expanded === policy.name ? null : policy.name)}
              className="w-full text-left"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-foreground flex items-center justify-center text-sm font-black text-background">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Link href={getPolicyPath(policy.name)} className="text-foreground font-black truncate hover:text-brutal-pink transition-colors underline" onClick={(e) => e.stopPropagation()}>{policy.name}</Link>
                    <GradeBadge grade={policy.evidenceGrade} />
                    <RecommendationBadge type={policy.recommendationType} />
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted border border-primary font-bold">
                      {policy.category.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 font-bold">{policy.description}</p>
                  {(policy.currentStatus || policy.recommendedTarget) && (
                    <p className="text-xs text-muted-foreground font-bold mt-1">
                      {policy.currentStatus && <>Current: {policy.currentStatus}</>}
                      {policy.currentStatus && policy.recommendedTarget && " → "}
                      {policy.recommendedTarget && <>Target: {policy.recommendedTarget}</>}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <Metric label="Income" value={`+$${incomePerYear(policy.incomeEffect).toLocaleString()}/yr`} highlight />
                  <Metric label="Health" value={`+${haleMonths(policy.healthEffect)}mo HALE`} highlight />
                  <Metric label="Evidence" value={policy.evidenceGrade} />
                  <span className="text-muted-foreground text-lg font-black">
                    {expanded === policy.name ? "▲" : "▼"}
                  </span>
                </div>
              </div>
            </button>

            {expanded === policy.name && (
              <div className="mt-4 pt-4 border-t-2 border-primary space-y-4">
                <div>
                  <p className="text-sm text-foreground font-bold">{policy.rationale}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-black">Details</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground font-bold">
                        <span className="text-muted-foreground font-bold">Type:</span> {policy.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-muted-foreground font-bold">
                        <span className="text-muted-foreground font-bold">Action:</span> {policy.recommendationType}
                      </p>
                      <p className="text-muted-foreground font-bold">
                        <span className="text-muted-foreground font-bold">Income Effect:</span>{" "}
                        <span className="text-brutal-cyan font-black">+${incomePerYear(policy.incomeEffect).toLocaleString()}/yr</span>
                        <span className="text-muted-foreground"> ({(policy.incomeEffect * 100).toFixed(0)}% of median income)</span>
                      </p>
                      <p className="text-muted-foreground font-bold">
                        <span className="text-muted-foreground font-bold">Health Effect:</span>{" "}
                        <span className="text-brutal-cyan font-black">+{haleMonths(policy.healthEffect)} months</span>
                        <span className="text-muted-foreground"> healthy life expectancy</span>
                      </p>
                      <p className="text-muted-foreground font-bold">
                        <span className="text-muted-foreground font-bold">Welfare Score:</span>{" "}
                        <span className="text-foreground font-black">+{policy.welfareScore}</span>
                        <span className="text-muted-foreground"> (CCS: {(policy.causalConfidenceScore * 100).toFixed(0)}%)</span>
                      </p>
                      {policy.currentStatus && (
                        <p className="text-muted-foreground font-bold">
                          <span className="text-muted-foreground font-bold">Current:</span> {policy.currentStatus}
                        </p>
                      )}
                      {policy.recommendedTarget && (
                        <p className="text-muted-foreground font-bold">
                          <span className="text-muted-foreground font-bold">Target:</span> {policy.recommendedTarget}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {policy.blockingFactors.map((f) => (
                          <span key={f} className="text-xs bg-brutal-red text-brutal-red-foreground px-2 py-0.5 border border-primary font-bold">
                            {f.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-black">
                      Bradford Hill Scores
                    </h4>
                    <div className="space-y-1.5">
                      {Object.entries(policy.bradfordHillScores).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-24 capitalize font-bold">{key}</span>
                          <div className="flex-1 h-2 bg-muted border border-primary overflow-hidden">
                            <div
                              className="h-full bg-brutal-pink"
                              style={{ width: `${(val as number) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right font-bold">
                            {((val as number) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Link
                  href={getPolicyPath(policy.name)}
                  className="inline-block mt-2 border-4 border-primary bg-brutal-pink text-brutal-pink-foreground px-4 py-2 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-shadow"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Full Analysis →
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-8 font-bold">
        Analysis date: {data.generatedAt} · Source: Optimitron OPG (Optimal Policy Generator)
      </p>

      <div className="mt-10">
        <PrizeCTA
          headline="These recommendations need political will to implement."
          body="The bottleneck is pluralistic ignorance — everyone wants evidence-based policy, nobody knows everyone else does. Deposit USDC, recruit verified voters for the 1% Treaty referendum, earn VOTE points."
          variant="yellow"
        />
      </div>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span className={`badge-${grade} text-xs font-black px-2 py-0.5`}>
      Grade {grade}
    </span>
  );
}

function RecommendationBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    enact: "bg-brutal-cyan text-brutal-cyan-foreground",
    modify: "bg-brutal-yellow text-brutal-yellow-foreground",
    repeal: "bg-brutal-red text-brutal-red-foreground",
    maintain: "bg-muted",
  };
  return (
    <span className={`text-xs font-black px-2 py-0.5 border border-primary ${styles[type] ?? "bg-muted"}`}>
      {type}
    </span>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-sm font-black ${highlight ? "text-brutal-cyan" : "text-foreground"}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground font-bold uppercase">{label}</div>
    </div>
  );
}
