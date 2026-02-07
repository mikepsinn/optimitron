"use client";

import { useState, useMemo } from "react";
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

type SortKey = "alignmentScore" | "name" | "state";

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

function partyColor(party: string): string {
  if (party === "D") return "bg-blue-600/20 text-blue-400";
  if (party === "R") return "bg-red-600/20 text-red-400";
  return "bg-purple-600/20 text-purple-400";
}

function partyLabel(party: string): string {
  if (party === "D") return "Democrat";
  if (party === "R") return "Republican";
  return "Independent";
}

function chamberLabel(chamber: string): string {
  return chamber === "senate" ? "Senate" : "House";
}

const budgetCategoryLabels: Record<string, string> = {
  education: "Education",
  defense: "Defense",
  healthcare: "Healthcare",
  infrastructure: "Infrastructure",
  socialSecurity: "Social Security",
  environment: "Environment",
  interestOnDebt: "Interest on Debt",
};

export default function PoliticiansPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [partyFilter, setPartyFilter] = useState("all");
  const [chamberFilter, setChamberFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("alignmentScore");
  const [sortAsc, setSortAsc] = useState(false);

  const states = useMemo(
    () => ["all", ...Array.from(new Set(politicians.map((p) => p.state))).sort()],
    []
  );

  const filtered = useMemo(() => {
    let list = politicians;
    if (partyFilter !== "all") list = list.filter((p) => p.party === partyFilter);
    if (chamberFilter !== "all") list = list.filter((p) => p.chamber === chamberFilter);
    if (stateFilter !== "all") list = list.filter((p) => p.state === stateFilter);

    return [...list].sort((a, b) => {
      let cmp: number;
      if (sortBy === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortBy === "state") {
        cmp = a.state.localeCompare(b.state);
      } else {
        cmp = b.alignmentScore - a.alignmentScore;
      }
      return sortAsc ? -cmp : cmp;
    });
  }, [partyFilter, chamberFilter, stateFilter, sortBy, sortAsc]);

  const avgScore =
    filtered.length > 0
      ? filtered.reduce((s, p) => s + p.alignmentScore, 0) / filtered.length
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
          🏛️ Politician Alignment Scores
        </h1>
        <p className="text-slate-400">
          How well do politicians represent average citizen preferences? Scores compare voting
          records to aggregated citizen budget priorities from the{" "}
          <Link href="/vote" className="text-primary-400 hover:underline">
            Wishocracy voting system
          </Link>
          .
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <SummaryCard label="Politicians Tracked" value={String(politicians.length)} />
        <SummaryCard
          label="Average Alignment"
          value={`${(avgScore * 100).toFixed(0)}%`}
          color={scoreColor(avgScore)}
        />
        <SummaryCard
          label="Most Aligned"
          value={[...politicians].sort((a, b) => b.alignmentScore - a.alignmentScore)[0]?.name ?? "—"}
        />
        <SummaryCard
          label="Least Aligned"
          value={[...politicians].sort((a, b) => a.alignmentScore - b.alignmentScore)[0]?.name ?? "—"}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Party</label>
          <select
            value={partyFilter}
            onChange={(e) => setPartyFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="all">All Parties</option>
            <option value="D">Democrat</option>
            <option value="R">Republican</option>
            <option value="I">Independent</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Chamber</label>
          <select
            value={chamberFilter}
            onChange={(e) => setChamberFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="all">Both Chambers</option>
            <option value="senate">Senate</option>
            <option value="house">House</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">State</label>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            {states.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All States" : s}
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
            <option value="alignmentScore">Alignment Score</option>
            <option value="name">Name</option>
            <option value="state">State</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Order</label>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
          >
            {sortAsc ? "↑ Ascending" : "↓ Descending"}
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500 mb-4">
        Showing {filtered.length} of {politicians.length} politicians
      </p>

      {/* Politician list */}
      <div className="space-y-3">
        {filtered.map((pol, i) => (
          <div key={pol.id} className="card">
            <button
              onClick={() => setExpanded(expanded === pol.id ? null : pol.id)}
              className="w-full text-left"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Rank */}
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                  {i + 1}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Link
                      href={`/politicians/${pol.id}`}
                      className="text-white font-semibold hover:text-primary-400 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {pol.name}
                    </Link>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${partyColor(pol.party)}`}>
                      {partyLabel(pol.party)}
                    </span>
                    <span className="text-xs text-slate-500 px-2 py-0.5 rounded bg-slate-700/50">
                      {chamberLabel(pol.chamber)}
                    </span>
                    <span className="text-xs text-slate-500">{pol.state}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pol.topAligned.slice(0, 3).map((area) => (
                      <span
                        key={area}
                        className="text-[10px] bg-emerald-600/20 text-emerald-400 px-1.5 py-0.5 rounded"
                      >
                        ✓ {area}
                      </span>
                    ))}
                    {pol.topMisaligned.slice(0, 2).map((area) => (
                      <span
                        key={area}
                        className="text-[10px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded"
                      >
                        ✗ {area}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${scoreColor(pol.alignmentScore)}`}>
                      {(pol.alignmentScore * 100).toFixed(0)}%
                    </div>
                    <div className="text-[10px] text-slate-500">Alignment</div>
                  </div>
                  {/* Score bar */}
                  <div className="w-24 hidden sm:block">
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${scoreBgColor(pol.alignmentScore)}`}
                        style={{ width: `${pol.alignmentScore * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-slate-500 text-lg">
                    {expanded === pol.id ? "▲" : "▼"}
                  </span>
                </div>
              </div>
            </button>

            {/* Expanded detail */}
            {expanded === pol.id && (
              <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Budget Alignment */}
                  <div>
                    <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                      Budget Category Alignment
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(pol.budgetAlignment).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 w-28 truncate">
                            {budgetCategoryLabels[key] ?? key}
                          </span>
                          <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${scoreBgColor(val)}`}
                              style={{ width: `${val * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs w-10 text-right font-medium ${scoreColor(val)}`}>
                            {(val * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Votes */}
                  <div>
                    <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                      Key Votes
                    </h4>
                    <div className="space-y-2">
                      {pol.keyVotes.map((vote) => (
                        <div
                          key={vote.bill}
                          className={`flex items-start gap-2 p-2 rounded-lg ${
                            vote.aligned
                              ? "bg-emerald-600/10 border border-emerald-600/20"
                              : "bg-red-600/10 border border-red-600/20"
                          }`}
                        >
                          <span className="flex-shrink-0 mt-0.5">
                            {vote.aligned ? "✅" : "❌"}
                          </span>
                          <div>
                            <p className="text-sm text-slate-300">{vote.bill}</p>
                            <p className="text-xs text-slate-500">
                              Voted <span className="font-medium text-slate-400">{vote.vote}</span>
                              {" · "}
                              {vote.aligned ? (
                                <span className="text-emerald-400">Aligned with citizens</span>
                              ) : (
                                <span className="text-red-400">Misaligned with citizens</span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Link to detail page */}
                <div className="pt-2">
                  <Link
                    href={`/politicians/${pol.id}`}
                    className="inline-flex items-center text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    View full profile →
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">No politicians match the selected filters.</p>
        </div>
      )}

      <p className="text-xs text-slate-500 mt-8">
        Alignment scores compare politician voting records to aggregated citizen preferences.
        Scores are illustrative; production scores use the{" "}
        <a
          href="https://wishocracy.warondisease.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-400 hover:underline"
        >
          Wishocracy algorithm
        </a>
        .
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="card text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}
