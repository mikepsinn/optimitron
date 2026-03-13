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

const gradeDescriptions: Record<string, string> = {
  A: "Data supports this belief",
  F: "Data contradicts this belief",
};

const statLabels: Record<string, string> = {
  yoyCorrelation: "Year-over-year correlation",
  spendingChange: "Change in spending",
  outcomeChange: "Change in outcome",
  revenueRange: "Revenue as % of GDP",
  topRateRange: "Top tax rate range",
  usSpending: "US spending per capita",
  oecdAvg: "Wealthy-nation average",
  lifeExpGap: "Life expectancy gap",
  overspendRatio: "Overspend ratio",
  causalDirection: "Cause & effect",
  usIncarcerationRate: "US prisoners per 100k people",
  dataPoints: "Data points available",
  absoluteCorrelation: "Raw correlation (misleading)",
  correlation: "Correlation",
  co2Correlation: "CO₂ reduction correlation",
  gdpHarm: "GDP impact",
};

function correlationStrength(value: number): string {
  const abs = Math.abs(value);
  if (abs < 0.1) return "Essentially zero — no meaningful link";
  if (abs < 0.3) return "Very weak";
  if (abs < 0.5) return "Weak";
  if (abs < 0.7) return "Moderate";
  return "Strong";
}

function formatStatValue(
  key: string,
  value: string | number | undefined
): string {
  if (value === undefined) return "N/A";

  if (key === "usSpending" || (key === "oecdAvg" && typeof value === "number"))
    return `$${Number(value).toLocaleString()}`;

  if (key === "lifeExpGap") return `${value} years`;

  if (key === "usIncarcerationRate") return `${value} per 100,000`;

  if (key === "overspendRatio") return `${value}x more per outcome`;

  if (key === "gdpHarm") return value === 0 ? "None detected" : String(value);

  if (key === "dataPoints") return `${value} (very limited)`;

  if (key === "causalDirection") {
    if (value === "reverse")
      return "Reversed — spending reacts to the problem, not the other way around";
    if (value === "harmful") return "The policy appears to cause harm";
    return String(value);
  }

  if (
    key === "yoyCorrelation" ||
    key === "absoluteCorrelation" ||
    key === "correlation" ||
    key === "co2Correlation"
  ) {
    const num = Number(value);
    return `${num} — ${correlationStrength(num)}`;
  }

  return String(value);
}

function CorrelationBar({ value }: { value: number }) {
  const abs = Math.abs(value);
  const pct = Math.min(abs * 100, 100);
  const color =
    abs < 0.1
      ? "bg-gray-300"
      : abs < 0.3
        ? "bg-yellow-400"
        : abs < 0.5
          ? "bg-orange-400"
          : abs < 0.7
            ? "bg-orange-500"
            : "bg-red-500";

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400">
        {abs < 0.1 ? "No link" : abs < 0.3 ? "Weak" : abs < 0.7 ? "Moderate" : "Strong"}
      </span>
    </div>
  );
}

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
        <p className="text-gray-600 mb-2">
          I tested your species&apos; most popular policy beliefs against actual
          data. The results are&hellip; well. See for yourself.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          {data.summary.gradeFCount} of {data.summary.totalFindings} beliefs
          are flatly contradicted by the evidence. Only{" "}
          {data.summary.gradeACount} survived.
        </p>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-red-600">
              {data.summary.gradeFCount}
            </div>
            <div className="text-sm text-red-800">
              Grade F (data contradicts)
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {data.summary.gradeACount}
            </div>
            <div className="text-sm text-green-800">
              Grade A (data supports)
            </div>
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
          {filtered.map((finding) => (
            <div
              key={finding.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedId(
                    expandedId === finding.id ? null : finding.id
                  )
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
                        title={
                          gradeDescriptions[finding.grade] ||
                          `Grade ${finding.grade}`
                        }
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
                      <span className="text-xs font-normal uppercase tracking-wide text-gray-400 block mb-0.5">
                        The belief
                      </span>
                      &ldquo;{finding.myth}&rdquo;
                    </h3>
                    <div className="mt-2">
                      <span className="text-xs font-normal uppercase tracking-wide text-gray-400 block mb-0.5">
                        What the data shows
                      </span>
                      <p className="text-sm text-gray-700">
                        {finding.reality}
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400 ml-2 mt-1">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(finding.keyStats).map(([key, value]) => {
                        const isCorrelation =
                          key === "yoyCorrelation" ||
                          key === "absoluteCorrelation" ||
                          key === "correlation" ||
                          key === "co2Correlation";
                        return (
                          <div
                            key={key}
                            className="bg-gray-50 rounded p-3 text-sm"
                          >
                            <div className="text-gray-500 text-xs mb-0.5">
                              {statLabels[key] ||
                                key
                                  .replace(/([A-Z])/g, " $1")
                                  .toLowerCase()}
                            </div>
                            <div className="font-medium text-gray-900">
                              {formatStatValue(key, value)}
                            </div>
                            {isCorrelation && typeof value === "number" && (
                              <CorrelationBar value={value} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-xs text-gray-400 leading-relaxed">
                      <strong>What is correlation?</strong> A number from -1 to
                      +1. Values near 0 mean no relationship. Values near +1 or
                      -1 mean a strong relationship. &ldquo;Year-over-year&rdquo;
                      means we compare changes from one year to the next, which
                      avoids misleading long-term trends.
                    </p>
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
            We compare year-over-year percentage changes — not raw totals —
            because your species has a habit of confusing &ldquo;two things
            both went up over 50 years&rdquo; with &ldquo;one caused the
            other.&rdquo; We call this &ldquo;a statistical error.&rdquo; You
            call it &ldquo;a talking point.&rdquo;
          </p>
          <p className="text-sm text-blue-800 mt-2">
            We also test which direction causation flows — does the policy
            cause the outcome, or does the outcome drive the spending? Data
            from FRED, BLS, IRS, OMB, FBI UCR, CDC, WHO, OECD, and World Bank
            (1950&ndash;2023).
          </p>
          <p className="text-sm text-blue-800 mt-2">
            <strong>Most common mistake:</strong>{" "}
            {data.summary.topPattern}.{" "}
            <strong>Second most common:</strong>{" "}
            {data.summary.secondPattern}.
          </p>
        </div>
      </div>
    </main>
  );
}
