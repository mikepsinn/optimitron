"use client";

import { useState, useMemo } from "react";
import misconceptionData from "../../../public/data/misconceptions.json";
import { PrizeCTA } from "@/components/prize/PrizeCTA";

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
  "criminal-justice": "bg-brutal-red text-brutal-red-foreground",
  economics: "bg-brutal-cyan text-brutal-cyan-foreground",
  healthcare: "bg-brutal-cyan text-brutal-cyan-foreground",
  education: "bg-brutal-pink text-brutal-pink-foreground",
  international: "bg-brutal-yellow text-brutal-yellow-foreground",
  environment: "bg-brutal-cyan text-brutal-cyan-foreground",
};

const gradeColors: Record<string, string> = {
  A: "bg-brutal-cyan text-brutal-cyan-foreground",
  B: "bg-brutal-cyan text-brutal-cyan-foreground",
  C: "bg-brutal-yellow text-brutal-yellow-foreground",
  D: "bg-brutal-red text-brutal-red-foreground",
  F: "bg-brutal-red text-brutal-red-foreground",
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
      ? "bg-muted"
      : abs < 0.3
        ? "bg-brutal-yellow"
        : abs < 0.5
          ? "bg-brutal-yellow"
          : abs < 0.7
            ? "bg-brutal-yellow"
            : "bg-brutal-red";

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="w-24 h-2 bg-muted overflow-hidden">
        <div
          className={`h-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">
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
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-foreground mb-2">
          {data.title}
        </h1>
        <p className="text-muted-foreground mb-2">
          I tested your species&apos; most popular policy beliefs against actual
          data. The results are&hellip; well. See for yourself.
        </p>
        <p className="text-muted-foreground text-sm mb-8">
          {data.summary.gradeFCount} of {data.summary.totalFindings} beliefs
          are flatly contradicted by the evidence. Only{" "}
          {data.summary.gradeACount} survived.
        </p>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-brutal-red text-brutal-red-foreground border-4 border-primary p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black">
              {data.summary.gradeFCount}
            </div>
            <div className="text-sm">
              Grade F (data contradicts)
            </div>
          </div>
          <div className="bg-brutal-cyan text-brutal-cyan-foreground border-4 border-primary p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black">
              {data.summary.gradeACount}
            </div>
            <div className="text-sm">
              Grade A (data supports)
            </div>
          </div>
          <div className="bg-brutal-cyan text-brutal-cyan-foreground border-4 border-primary p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black">
              {data.summary.totalFindings}
            </div>
            <div className="text-sm">Total analyzed</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 text-sm font-black transition-colors ${
                filter === cat
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground hover:bg-brutal-yellow"
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
              className="bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-4 border-primary overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedId(
                    expandedId === finding.id ? null : finding.id
                  )
                }
                className="w-full text-left p-4 hover:bg-brutal-cyan transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 text-sm font-black ${
                          gradeColors[finding.grade] || "bg-muted"
                        }`}
                        title={
                          gradeDescriptions[finding.grade] ||
                          `Grade ${finding.grade}`
                        }
                      >
                        {finding.grade}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-black ${
                          categoryColors[finding.category] || "bg-muted"
                        }`}
                      >
                        {finding.category.replace("-", " ")}
                      </span>
                    </div>
                    <h3 className="font-black text-foreground mt-1">
                      <span className="text-xs font-normal uppercase tracking-wide text-muted-foreground block mb-0.5">
                        The belief
                      </span>
                      &ldquo;{finding.myth}&rdquo;
                    </h3>
                    <div className="mt-2">
                      <span className="text-xs font-normal uppercase tracking-wide text-muted-foreground block mb-0.5">
                        What the data shows
                      </span>
                      <p className="text-sm text-foreground">
                        {finding.reality}
                      </p>
                    </div>
                  </div>
                  <span className="text-muted-foreground ml-2 mt-1">
                    {expandedId === finding.id ? "▼" : "▶"}
                  </span>
                </div>
              </button>

              {expandedId === finding.id && (
                <div className="px-4 pb-4 border-t border-primary">
                  <div className="mt-3">
                    <h4 className="text-sm font-black text-foreground mb-2">
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
                            className="bg-background p-3 text-sm"
                          >
                            <div className="text-muted-foreground text-xs mb-0.5">
                              {statLabels[key] ||
                                key
                                  .replace(/([A-Z])/g, " $1")
                                  .toLowerCase()}
                            </div>
                            <div className="font-black text-foreground">
                              {formatStatValue(key, value)}
                            </div>
                            {isCorrelation && typeof value === "number" && (
                              <CorrelationBar value={value} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                      <strong>What is correlation?</strong> A number from -1 to
                      +1. Values near 0 mean no relationship. Values near +1 or
                      -1 mean a strong relationship. &ldquo;Year-over-year&rdquo;
                      means we compare changes from one year to the next, which
                      avoids misleading long-term trends.
                    </p>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Dataset: {finding.dataset}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Methodology note */}
        <div className="mt-8 border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="font-black mb-2">Methodology</h3>
          <p className="text-sm">
            We compare year-over-year percentage changes — not raw totals —
            because your species has a habit of confusing &ldquo;two things
            both went up over 50 years&rdquo; with &ldquo;one caused the
            other.&rdquo; We call this &ldquo;a statistical error.&rdquo; You
            call it &ldquo;a talking point.&rdquo;
          </p>
          <p className="text-sm mt-2">
            We also test which direction causation flows — does the policy
            cause the outcome, or does the outcome drive the spending? Data
            from FRED, BLS, IRS, OMB, FBI UCR, CDC, WHO, OECD, and World Bank
            (1950&ndash;2023).
          </p>
          <p className="text-sm mt-2">
            <strong>Most common mistake:</strong>{" "}
            {data.summary.topPattern}.{" "}
            <strong>Second most common:</strong>{" "}
            {data.summary.secondPattern}.
          </p>
        </div>

        <div className="mt-10">
          <PrizeCTA
            headline="The evidence is clear. The only irrational response is to do nothing."
            body="Every misconception above persists because everyone assumes everyone else believes it. Eight billion people waiting for permission to want what they already want. The referendum is the moment they find out they are everyone."
            variant="pink"
          />
        </div>
      </div>
    </main>
  );
}
