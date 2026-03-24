"use client";

import { useState } from "react";
import Link from "next/link";

interface PoliticianScore {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  chamber: string;
  militaryDollarsVotedFor: number;
  clinicalTrialDollarsVotedFor: number;
  ratio: number;
  grade: string;
}

type SortKey = "name" | "ratio" | "military" | "trials" | "party";

function formatDollars(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value === 0) return "$0";
  return `$${value.toLocaleString()}`;
}

function formatRatio(ratio: number): string {
  if (ratio === 0) return "0:1";
  if (ratio === 1) return "1:1";
  if (ratio >= 999_999) return "∞";
  return `${ratio.toLocaleString()}:1`;
}

interface PoliticianScorecardTableProps {
  scorecards: PoliticianScore[];
  systemWideRatio: number;
  countryCode?: string;
}

export function PoliticianScorecardTable({
  scorecards,
  systemWideRatio,
  countryCode = "US",
}: PoliticianScorecardTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("ratio");
  const [sortAsc, setSortAsc] = useState(true);
  const [chamberFilter, setChamberFilter] = useState<"all" | "Senate" | "House">("all");

  const filtered = chamberFilter === "all"
    ? scorecards
    : scorecards.filter((s) =>
        chamberFilter === "Senate"
          ? s.chamber === "Senate"
          : s.chamber.includes("House"),
      );

  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    switch (sortKey) {
      case "name": diff = a.name.localeCompare(b.name); break;
      case "ratio": diff = a.ratio - b.ratio; break;
      case "military": diff = a.militaryDollarsVotedFor - b.militaryDollarsVotedFor; break;
      case "trials": diff = a.clinicalTrialDollarsVotedFor - b.clinicalTrialDollarsVotedFor; break;
      case "party": diff = a.party.localeCompare(b.party); break;
    }
    return sortAsc ? diff : -diff;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === "name" || key === "party"); }
  };

  const indicator = (key: SortKey) => sortKey === key ? (sortAsc ? " ↑" : " ↓") : "";

  const hdrClass = "p-2 text-xs font-black uppercase text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap text-left";

  return (
    <div>
      {/* System ratio callout */}
      <div className="border-4 border-primary bg-brutal-red p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 text-center">
        <span className="text-xs font-black uppercase text-brutal-red-foreground">
          System-Wide Ratio
        </span>
        <div className="text-3xl font-black text-brutal-red-foreground">
          {systemWideRatio.toLocaleString()}:1
        </div>
        <p className="text-sm font-bold text-brutal-red-foreground">
          Military spending to clinical trial spending. This is the ratio your government chooses.
        </p>
      </div>

      {/* Chamber filter */}
      <div className="flex gap-2 mb-4">
        {(["all", "Senate", "House"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setChamberFilter(c)}
            className={`px-3 py-1 text-xs font-black uppercase border-2 border-primary transition-all ${
              chamberFilter === c
                ? "bg-brutal-pink text-brutal-pink-foreground"
                : "bg-background text-foreground hover:bg-muted"
            }`}
          >
            {c === "all" ? `All (${scorecards.length})` : c}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-4 border-primary">
              <th className={`${hdrClass} w-8`}>#</th>
              <th className={hdrClass} onClick={() => handleSort("name")}>
                Name{indicator("name")}
              </th>
              <th className={hdrClass} onClick={() => handleSort("party")}>
                Party{indicator("party")}
              </th>
              <th className={`${hdrClass} text-right`} onClick={() => handleSort("military")}>
                Military $ Voted For{indicator("military")}
              </th>
              <th className={`${hdrClass} text-right`} onClick={() => handleSort("trials")}>
                Trial $ Voted For{indicator("trials")}
              </th>
              <th className={`${hdrClass} text-right`} onClick={() => handleSort("ratio")}>
                Ratio{indicator("ratio")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr
                key={s.bioguideId}
                className="border-b border-primary last:border-b-0 hover:bg-muted transition-colors"
              >
                <td className="p-2 text-xs font-bold text-muted-foreground">{i + 1}</td>
                <td className="p-2">
                  <Link
                    href={`/governments/${countryCode}/politicians/${s.bioguideId}`}
                    className="font-black text-foreground text-sm hover:text-brutal-pink transition-colors"
                  >
                    {s.name}
                  </Link>
                  <span className="text-xs font-bold text-muted-foreground ml-2">{s.state}</span>
                </td>
                <td className="p-2 text-xs font-bold text-muted-foreground">{s.party}</td>
                <td className={`p-2 text-right text-sm font-black ${
                  s.militaryDollarsVotedFor > 0 ? "text-brutal-red" : "text-brutal-cyan"
                }`}>
                  {formatDollars(s.militaryDollarsVotedFor)}
                </td>
                <td className={`p-2 text-right text-sm font-black ${
                  s.clinicalTrialDollarsVotedFor > 0 ? "text-brutal-cyan" : "text-muted-foreground"
                }`}>
                  {formatDollars(s.clinicalTrialDollarsVotedFor)}
                </td>
                <td className={`p-2 text-right text-sm font-black ${
                  s.ratio >= 100 ? "text-brutal-red" : s.ratio <= 1 ? "text-brutal-cyan" : "text-foreground"
                }`}>
                  {formatRatio(s.ratio)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
