"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import policyData from "@/data/us-policy-analysis.json";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black mb-2">
          📊 Policy Rankings
        </h1>
        <p className="text-black/60 font-medium">
          {data.policies.length} policies analyzed for the {data.jurisdiction}. Ranked by welfare impact score with evidence grades (A–F).
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <label className="text-xs text-black/50 block mb-1 font-bold uppercase">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border-2 border-black px-3 py-2 text-sm text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-black/50 block mb-1 font-bold uppercase">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="bg-white border-2 border-black px-3 py-2 text-sm text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
                <span className="flex-shrink-0 w-8 h-8 bg-black flex items-center justify-center text-sm font-black text-white">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Link href={`/policies/${slugify(policy.name)}`} className="text-black font-black truncate hover:text-pink-500 transition-colors underline" onClick={(e) => e.stopPropagation()}>{policy.name}</Link>
                    <GradeBadge grade={policy.evidenceGrade} />
                    <span className="text-xs text-black/50 px-2 py-0.5 bg-gray-100 border border-black font-bold">
                      {policy.category.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-black/60 line-clamp-1 font-medium">{policy.description}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <Metric label="Welfare" value={`+${policy.welfareScore}`} />
                  <Metric label="CCS" value={(policy.causalConfidenceScore * 100).toFixed(0) + "%"} />
                  <Metric label="PIS" value={(policy.policyImpactScore * 100).toFixed(0) + "%"} />
                  <span className="text-black/50 text-lg font-black">
                    {expanded === policy.name ? "▲" : "▼"}
                  </span>
                </div>
              </div>
            </button>

            {expanded === policy.name && (
              <div className="mt-4 pt-4 border-t-2 border-black space-y-4">
                <div>
                  <p className="text-sm text-black/70 font-medium">{policy.rationale}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs text-black/50 uppercase tracking-wider mb-2 font-black">Details</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-black/60 font-medium">
                        <span className="text-black/40 font-bold">Type:</span> {policy.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-black/60 font-medium">
                        <span className="text-black/40 font-bold">Action:</span> {policy.recommendationType}
                      </p>
                      <p className="text-black/60 font-medium">
                        <span className="text-black/40 font-bold">Income Effect:</span>{" "}
                        <span className="text-emerald-600 font-black">+{(policy.incomeEffect * 100).toFixed(0)}%</span>
                      </p>
                      <p className="text-black/60 font-medium">
                        <span className="text-black/40 font-bold">Health Effect:</span>{" "}
                        <span className="text-emerald-600 font-black">+{(policy.healthEffect * 100).toFixed(0)}%</span>
                      </p>
                      {policy.currentStatus && (
                        <p className="text-black/60 font-medium">
                          <span className="text-black/40 font-bold">Current:</span> {policy.currentStatus}
                        </p>
                      )}
                      {policy.recommendedTarget && (
                        <p className="text-black/60 font-medium">
                          <span className="text-black/40 font-bold">Target:</span> {policy.recommendedTarget}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {policy.blockingFactors.map((f) => (
                          <span key={f} className="text-xs bg-red-200 text-red-800 px-2 py-0.5 border border-red-800 font-bold">
                            {f.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs text-black/50 uppercase tracking-wider mb-2 font-black">
                      Bradford Hill Scores
                    </h4>
                    <div className="space-y-1.5">
                      {Object.entries(policy.bradfordHillScores).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs text-black/50 w-24 capitalize font-bold">{key}</span>
                          <div className="flex-1 h-2 bg-gray-100 border border-black overflow-hidden">
                            <div
                              className="h-full bg-pink-500"
                              style={{ width: `${(val as number) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-black/60 w-10 text-right font-bold">
                            {((val as number) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/policies/${slugify(policy.name)}`}
                  className="inline-block mt-2 border-2 border-black bg-pink-500 text-white px-4 py-2 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-shadow"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Full Analysis →
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-black/40 mt-8 font-bold">
        Analysis date: {data.analysisDate} · Source: Optomitron OPG (Optimal Policy Generator)
      </p>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-sm font-black text-black">{value}</div>
      <div className="text-[10px] text-black/50 font-bold uppercase">{label}</div>
    </div>
  );
}
