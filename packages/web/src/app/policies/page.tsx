"use client";

import { useState, useMemo } from "react";
import policyData from "@/data/us-policy-analysis.json";

interface BradfordHillScores {
  strength: number;
  consistency: number;
  temporality: number;
  gradient: number;
  experiment: number;
  plausibility: number;
  coherence: number;
  analogy: number;
  specificity: number;
}

interface Policy {
  name: string;
  type: string;
  category: string;
  description: string;
  recommendationType: string;
  evidenceGrade: string;
  causalConfidenceScore: number;
  policyImpactScore: number;
  welfareScore: number;
  incomeEffect: number;
  healthEffect: number;
  bradfordHillScores: BradfordHillScores;
  rationale: string;
  currentStatus?: string;
  recommendedTarget?: string;
  blockingFactors: string[];
}

interface PolicyData {
  jurisdiction: string;
  analysisDate: string;
  policies: Policy[];
  topRecommendations: string[];
}

const data = policyData as PolicyData;

type SortKey = "welfareScore" | "evidenceGrade" | "causalConfidenceScore" | "policyImpactScore";
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
      return (b[sortBy] as number) - (a[sortBy] as number);
    });
  }, [categoryFilter, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
          📊 Policy Rankings
        </h1>
        <p className="text-slate-400">
          {data.policies.length} policies analyzed for the {data.jurisdiction}. Ranked by welfare impact score with evidence grades (A–F).
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="welfareScore">Welfare Score</option>
            <option value="evidenceGrade">Evidence Grade</option>
            <option value="causalConfidenceScore">Causal Confidence</option>
            <option value="policyImpactScore">Policy Impact</option>
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
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold truncate">{policy.name}</h3>
                    <GradeBadge grade={policy.evidenceGrade} />
                    <span className="text-xs text-slate-500 px-2 py-0.5 rounded bg-slate-700/50">
                      {policy.category.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-1">{policy.description}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <Metric label="Welfare" value={`+${policy.welfareScore}`} />
                  <Metric label="CCS" value={(policy.causalConfidenceScore * 100).toFixed(0) + "%"} />
                  <Metric label="PIS" value={(policy.policyImpactScore * 100).toFixed(0) + "%"} />
                  <span className="text-slate-500 text-lg">
                    {expanded === policy.name ? "▲" : "▼"}
                  </span>
                </div>
              </div>
            </button>

            {expanded === policy.name && (
              <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4">
                <div>
                  <p className="text-sm text-slate-300">{policy.rationale}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Details</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-400">
                        <span className="text-slate-500">Type:</span> {policy.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-slate-400">
                        <span className="text-slate-500">Action:</span> {policy.recommendationType}
                      </p>
                      <p className="text-slate-400">
                        <span className="text-slate-500">Income Effect:</span>{" "}
                        <span className="text-emerald-400">+{(policy.incomeEffect * 100).toFixed(0)}%</span>
                      </p>
                      <p className="text-slate-400">
                        <span className="text-slate-500">Health Effect:</span>{" "}
                        <span className="text-emerald-400">+{(policy.healthEffect * 100).toFixed(0)}%</span>
                      </p>
                      {policy.currentStatus && (
                        <p className="text-slate-400">
                          <span className="text-slate-500">Current:</span> {policy.currentStatus}
                        </p>
                      )}
                      {policy.recommendedTarget && (
                        <p className="text-slate-400">
                          <span className="text-slate-500">Target:</span> {policy.recommendedTarget}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {policy.blockingFactors.map((f) => (
                          <span key={f} className="text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded">
                            {f.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                      Bradford Hill Scores
                    </h4>
                    <div className="space-y-1.5">
                      {Object.entries(policy.bradfordHillScores).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-24 capitalize">{key}</span>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${(val as number) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-10 text-right">
                            {((val as number) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-8">
        Analysis date: {data.analysisDate} · Source: Optomitron OPG (Optimal Policy Generator)
      </p>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span className={`badge-${grade} text-xs font-bold px-2 py-0.5 rounded`}>
      Grade {grade}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-sm font-bold text-white">{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}
