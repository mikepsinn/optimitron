"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import politiciansData from "@/data/politicians.json";

interface KeyVote {
  bill: string;
  vote: string;
  aligned: boolean;
}

interface Politician {
  id: string;
  name: string;
  party: string;
  state: string;
  chamber: string;
  alignmentScore: number;
  budgetAlignment: Record<string, number>;
  topAligned: string[];
  topMisaligned: string[];
  keyVotes: KeyVote[];
}

const politicians = politiciansData as Politician[];

const budgetCategoryLabels: Record<string, string> = {
  education: "Education",
  defense: "Defense",
  healthcare: "Healthcare",
  infrastructure: "Infrastructure",
  socialSecurity: "Social Security",
  environment: "Environment",
  interestOnDebt: "Interest on Debt",
};

function scoreColor(score: number): string {
  if (score >= 0.7) return "text-emerald-400";
  if (score >= 0.5) return "text-yellow-400";
  return "text-red-400";
}

function scoreBgColor(score: number): string {
  if (score >= 0.7) return "bg-emerald-500";
  if (score >= 0.5) return "bg-yellow-500";
  return "bg-red-500";
}

function scoreRingColor(score: number): string {
  if (score >= 0.7) return "border-emerald-500";
  if (score >= 0.5) return "border-yellow-500";
  return "border-red-500";
}

function partyColor(party: string): string {
  if (party === "D") return "bg-blue-600/20 text-blue-400 border-blue-500/30";
  if (party === "R") return "bg-red-600/20 text-red-400 border-red-500/30";
  return "bg-purple-600/20 text-purple-400 border-purple-500/30";
}

function partyLabel(party: string): string {
  if (party === "D") return "Democrat";
  if (party === "R") return "Republican";
  return "Independent";
}

function chamberLabel(chamber: string): string {
  return chamber === "senate" ? "Senate" : "House of Representatives";
}

function scoreLabel(score: number): string {
  if (score >= 0.8) return "Highly Aligned";
  if (score >= 0.7) return "Well Aligned";
  if (score >= 0.6) return "Moderately Aligned";
  if (score >= 0.5) return "Partially Aligned";
  if (score >= 0.4) return "Poorly Aligned";
  return "Misaligned";
}

export default function PoliticianDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const pol = politicians.find((p) => p.id === id);

  if (!pol) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Politician Not Found</h1>
        <p className="text-slate-400 mb-8">
          No politician found with ID &ldquo;{id}&rdquo;.
        </p>
        <Link
          href="/politicians"
          className="text-primary-400 hover:text-primary-300 font-medium"
        >
          ← Back to all politicians
        </Link>
      </div>
    );
  }

  const budgetEntries = Object.entries(pol.budgetAlignment).sort(
    ([, a], [, b]) => b - a
  );
  const maxBudgetVal = Math.max(...budgetEntries.map(([, v]) => v));
  const alignedVotes = pol.keyVotes.filter((v) => v.aligned).length;
  const totalVotes = pol.keyVotes.length;

  // Find rank among all
  const sorted = [...politicians].sort(
    (a, b) => b.alignmentScore - a.alignmentScore
  );
  const rank = sorted.findIndex((p) => p.id === pol.id) + 1;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <Link
        href="/politicians"
        className="text-sm text-slate-500 hover:text-primary-400 transition-colors mb-6 inline-block"
      >
        ← All Politicians
      </Link>

      {/* Hero header */}
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Large alignment score circle */}
          <div className="flex-shrink-0">
            <div
              className={`w-32 h-32 rounded-full border-4 ${scoreRingColor(pol.alignmentScore)} flex flex-col items-center justify-center bg-slate-800/50`}
            >
              <span className={`text-4xl font-black ${scoreColor(pol.alignmentScore)}`}>
                {(pol.alignmentScore * 100).toFixed(0)}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                / 100
              </span>
            </div>
          </div>

          {/* Name and meta */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
              {pol.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full border ${partyColor(pol.party)}`}
              >
                {partyLabel(pol.party)}
              </span>
              <span className="text-sm text-slate-400">
                {chamberLabel(pol.chamber)} · {pol.state}
              </span>
              <span className="text-sm text-slate-500">
                Rank #{rank} of {politicians.length}
              </span>
            </div>
            <p className={`text-lg font-semibold ${scoreColor(pol.alignmentScore)}`}>
              {scoreLabel(pol.alignmentScore)}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              This score measures how well {pol.name}&apos;s voting record aligns
              with average citizen budget preferences as determined by the Wishocracy
              preference aggregation system.
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex md:flex-col gap-4 flex-shrink-0">
            <div className="text-center card !p-4">
              <div className="text-xl font-bold text-white">
                {alignedVotes}/{totalVotes}
              </div>
              <div className="text-[10px] text-slate-500">Aligned Votes</div>
            </div>
            <div className="text-center card !p-4">
              <div className="text-xl font-bold text-white">
                {pol.topAligned.length}
              </div>
              <div className="text-[10px] text-slate-500">Areas Aligned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alignment question callout */}
      <div className="card mb-8 border-primary-500/30 bg-primary-600/5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🤔</span>
          <div>
            <h3 className="text-white font-semibold mb-1">
              How aligned is {pol.name} with average citizen preferences?
            </h3>
            <p className="text-sm text-slate-400">
              Based on aggregated citizen budget preferences collected through the Wishocracy
              voting system, {pol.name} has{" "}
              <span className={`font-medium ${scoreColor(pol.alignmentScore)}`}>
                {(pol.alignmentScore * 100).toFixed(0)}% alignment
              </span>{" "}
              with what citizens want. This means{" "}
              {pol.alignmentScore >= 0.7
                ? "their voting record closely matches citizen priorities."
                : pol.alignmentScore >= 0.5
                ? "their voting record partially matches citizen priorities, with notable gaps in some areas."
                : "their voting record diverges significantly from what citizens prefer in most budget categories."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Budget Alignment Bar Chart */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-1">
            📊 Budget Alignment by Category
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            How closely this politician&apos;s votes align with citizen preferences in each
            budget area
          </p>
          <div className="space-y-3">
            {budgetEntries.map(([key, val]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300">
                    {budgetCategoryLabels[key] ?? key}
                  </span>
                  <span
                    className={`text-sm font-bold ${scoreColor(val)}`}
                  >
                    {(val * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${scoreBgColor(val)}`}
                    style={{ width: `${(val / maxBudgetVal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CSS Radar-like chart (polar bar approximation) */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-1">
            🎯 Alignment Radar
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Visual breakdown of alignment across budget categories
          </p>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-64 h-64">
              {/* Background circles */}
              {[0.25, 0.5, 0.75, 1].map((ring) => (
                <div
                  key={ring}
                  className="absolute border border-slate-700/50 rounded-full"
                  style={{
                    width: `${ring * 100}%`,
                    height: `${ring * 100}%`,
                    top: `${(1 - ring) * 50}%`,
                    left: `${(1 - ring) * 50}%`,
                  }}
                />
              ))}
              {/* Category slices as positioned dots */}
              {budgetEntries.map(([key, val], i) => {
                const angle = (i / budgetEntries.length) * Math.PI * 2 - Math.PI / 2;
                const radius = val * 45; // % of container half
                const x = 50 + radius * Math.cos(angle);
                const y = 50 + radius * Math.sin(angle);
                const labelRadius = 52;
                const lx = 50 + labelRadius * Math.cos(angle);
                const ly = 50 + labelRadius * Math.sin(angle);
                return (
                  <div key={key}>
                    {/* Dot */}
                    <div
                      className={`absolute w-3 h-3 rounded-full ${scoreBgColor(val)} border-2 border-slate-900 z-10`}
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      title={`${budgetCategoryLabels[key] ?? key}: ${(val * 100).toFixed(0)}%`}
                    />
                    {/* Line from center */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox="0 0 100 100"
                    >
                      <line
                        x1="50"
                        y1="50"
                        x2={x}
                        y2={y}
                        stroke={val >= 0.7 ? "#10b981" : val >= 0.5 ? "#eab308" : "#ef4444"}
                        strokeWidth="1"
                        opacity="0.4"
                      />
                    </svg>
                    {/* Label */}
                    <span
                      className="absolute text-[9px] text-slate-500 whitespace-nowrap"
                      style={{
                        left: `${lx}%`,
                        top: `${ly}%`,
                        transform: `translate(${Math.cos(angle) > 0.1 ? "0%" : Math.cos(angle) < -0.1 ? "-100%" : "-50%"}, ${Math.sin(angle) > 0.1 ? "0%" : Math.sin(angle) < -0.1 ? "-100%" : "-50%"})`,
                      }}
                    >
                      {(budgetCategoryLabels[key] ?? key).slice(0, 10)}
                    </span>
                  </div>
                );
              })}
              {/* Center dot */}
              <div
                className="absolute w-2 h-2 rounded-full bg-slate-500"
                style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
              />
            </div>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> ≥70% Aligned
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-yellow-500" /> 50-69%
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-red-500" /> &lt;50%
            </span>
          </div>
        </div>
      </div>

      {/* Aligned / Misaligned areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-3">
            ✅ Most Aligned Areas
          </h2>
          <div className="space-y-2">
            {pol.topAligned.map((area, i) => (
              <div
                key={area}
                className="flex items-center gap-3 p-3 rounded-lg bg-emerald-600/10 border border-emerald-600/20"
              >
                <span className="w-6 h-6 rounded-full bg-emerald-600/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                  {i + 1}
                </span>
                <span className="text-sm text-emerald-300 font-medium">{area}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-3">
            ❌ Most Misaligned Areas
          </h2>
          <div className="space-y-2">
            {pol.topMisaligned.map((area, i) => (
              <div
                key={area}
                className="flex items-center gap-3 p-3 rounded-lg bg-red-600/10 border border-red-600/20"
              >
                <span className="w-6 h-6 rounded-full bg-red-600/20 flex items-center justify-center text-xs font-bold text-red-400">
                  {i + 1}
                </span>
                <span className="text-sm text-red-300 font-medium">{area}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Voting Record */}
      <div className="card mb-8">
        <h2 className="text-lg font-bold text-white mb-1">
          🗳️ Key Voting Record
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Selected votes compared to citizen preferences
        </p>
        <div className="space-y-3">
          {pol.keyVotes.map((vote) => (
            <div
              key={vote.bill}
              className={`flex items-start gap-4 p-4 rounded-xl border ${
                vote.aligned
                  ? "bg-emerald-600/5 border-emerald-600/20"
                  : "bg-red-600/5 border-red-600/20"
              }`}
            >
              <span className="text-2xl flex-shrink-0">
                {vote.aligned ? "✅" : "❌"}
              </span>
              <div className="flex-1">
                <h3 className="text-white font-medium">{vote.bill}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Voted{" "}
                  <span
                    className={`font-semibold ${
                      vote.vote === "Yea" ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {vote.vote}
                  </span>
                </p>
              </div>
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 ${
                  vote.aligned
                    ? "bg-emerald-600/20 text-emerald-400"
                    : "bg-red-600/20 text-red-400"
                }`}
              >
                {vote.aligned ? "Aligned" : "Misaligned"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Methodology note */}
      <div className="card border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">📐 Methodology</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Citizen Alignment Scores are calculated by comparing aggregated citizen preference
          weights (collected via{" "}
          <Link href="/vote" className="text-primary-400 hover:underline">
            Wishocracy voting
          </Link>
          ) against politician voting records on budget-related legislation. The score is
          1 − (weighted distance between citizen preference vector and politician voting
          vector). Category-level alignment shows how each budget area contributes to the
          overall score. For full methodology, see the{" "}
          <a
            href="https://wishocracy.warondisease.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 hover:underline"
          >
            Wishocracy paper
          </a>
          .
        </p>
      </div>
    </div>
  );
}
