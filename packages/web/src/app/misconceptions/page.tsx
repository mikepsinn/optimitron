"use client";

import { useState, useMemo } from "react";
import misconceptionData from "../../../public/data/misconceptions.json";

interface KeyStats {
  [key: string]: string | number | undefined;
}

interface Finding {
  id: string;
  myth: string;
  reality: string;
  grade: string;
  category: string;
  dataset: string;
  keyStats: KeyStats;
}

interface MisconceptionData {
  title: string;
  findings: Finding[];
  summary: {
    totalFindings: number;
    gradeFCount: number;
    gradeACount: number;
    topPattern: string;
    secondPattern: string;
  };
}

const data = misconceptionData as MisconceptionData;

const categoryColors: Record<string, string> = {
  "criminal-justice": "bg-red-100 text-red-800",
  economics: "bg-blue-100 text-blue-800",
  healthcare: "bg-green-100 text-green-800",
  education: "bg-purple-100 text-purple-800",
  international: "bg-yellow-100 text-yellow-800",
  environment: "bg-emerald-100 text-emerald-800",
};

const gradeColors: Record<string, string> = {
  A: "bg-green-500 text-white",
  B: "bg-green-300 text-green-900",
  C: "bg-yellow-300 text-yellow-900",
  D: "bg-orange-300 text-orange-900",
  F: "bg-red-500 text-white",
};

type FilterCategory = "all" | string;

export default function MisconceptionsPage() {
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(data.findings.map((f) => f.category));
    return ["all", ...Array.from(cats).sort()];
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return data.findings;
    return data.findings.filter((f) => f.category === filter);
  }, [filter]);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {data.title}
        </h1>
        <p className="text-gray-600 mb-8">
          {data.summary.gradeFCount} of {data.summary.totalFindings} popular
          policy beliefs are contradicted by empirical data. Only{" "}
          {data.summary.gradeACount} grades A.
        </p>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-red-600">
              {data.summary.gradeFCount}
            </div>
            <div className="text-sm text-red-800">Grade F (data contradicts)</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {data.summary.gradeACount}
            </div>
            <div className="text-sm text-green-800">Grade A (data supports)</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {data.summary.totalFindings}
            </div>
            <div className="text-sm text-blue-800">Total analyzed</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === cat
                  ? "bg-gray-800 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {cat === "all" ? "All" : cat.replace("-", " ")}
            </button>
          ))}
        </div>

        {/* Findings */}
        <div className="space-y-4">
          {filtered.map((finding, index) => (
            <div
              key={finding.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedId(expandedId === finding.id ? null : finding.id)
                }
                className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          gradeColors[finding.grade] || "bg-gray-200"
                        }`}
                      >
                        {finding.grade}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          categoryColors[finding.category] || "bg-gray-100"
                        }`}
                      >
                        {finding.category.replace("-", " ")}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mt-1">
                      {finding.myth}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {finding.reality}
                    </p>
                  </div>
                  <span className="text-gray-400 ml-2">
                    {expandedId === finding.id ? "▼" : "▶"}
                  </span>
                </div>
              </button>

              {expandedId === finding.id && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Key Statistics
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(finding.keyStats).map(([key, value]) => (
                        <div
                          key={key}
                          className="bg-gray-50 rounded p-2 text-sm"
                        >
                          <span className="text-gray-500">
                            {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                          </span>{" "}
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    Dataset: {finding.dataset}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Methodology note */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Methodology</h3>
          <p className="text-sm text-blue-800">
            Year-over-year percentage change correlations eliminate spurious
            trends. Causal direction scoring via forward/reverse Predictive
            Pearson identifies reactive vs. causal spending. Data from FRED,
            BLS, IRS, OMB, FBI UCR, CDC, WHO, OECD, World Bank (1950–2023).
          </p>
          <p className="text-sm text-blue-800 mt-2">
            <strong>Top pattern:</strong> {data.summary.topPattern}.{" "}
            <strong>Second:</strong> {data.summary.secondPattern}.
          </p>
        </div>
      </div>
    </main>
  );
}
