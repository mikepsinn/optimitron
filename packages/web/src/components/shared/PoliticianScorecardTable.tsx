"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/retroui/Button";
import { getMilitarySynonym } from "@/lib/messaging";

interface PoliticianScore {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  chamber: string;
  militaryDollarsVotedFor: number;
  clinicalTrialDollarsVotedFor: number;
  ratio: number;
}

type SortKey = "name" | "ratio" | "military" | "trials";
type RankMode = "worst" | "least-bad";

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
  /** Show only this many rows. Hides filters and ratio callout when set. */
  limit?: number;
}

export function PoliticianScorecardTable({
  scorecards,
  systemWideRatio,
  countryCode = "US",
  limit,
}: PoliticianScorecardTableProps) {
  const compact = limit != null;
  const [rankMode, setRankMode] = useState<RankMode>("worst");
  const [sortKey, setSortKey] = useState<SortKey>("ratio");
  const [sortAsc, setSortAsc] = useState(false);
  const [chamberFilter, setChamberFilter] = useState<"all" | "Senate" | "House">("all");
  const [search, setSearch] = useState("");

  const searchLower = search.toLowerCase();
  const filtered = scorecards.filter((s) => {
    if (!compact && chamberFilter !== "all") {
      if (chamberFilter === "Senate" && s.chamber !== "Senate") return false;
      if (chamberFilter === "House" && !s.chamber.includes("House")) return false;
    }
    if (searchLower && !s.name.toLowerCase().includes(searchLower) && !s.state.toLowerCase().includes(searchLower)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "ratio") {
      // Multi-key: ratio, then military spend, then trials (inverse)
      const dir = rankMode === "worst" ? -1 : 1;
      const ratioDiff = a.ratio - b.ratio;
      if (ratioDiff !== 0) return dir * ratioDiff;
      const milDiff = a.militaryDollarsVotedFor - b.militaryDollarsVotedFor;
      if (milDiff !== 0) return dir * milDiff;
      return -dir * (a.clinicalTrialDollarsVotedFor - b.clinicalTrialDollarsVotedFor);
    }
    let diff = 0;
    switch (sortKey) {
      case "name": diff = a.name.localeCompare(b.name); break;
      case "military": diff = a.militaryDollarsVotedFor - b.militaryDollarsVotedFor; break;
      case "trials": diff = a.clinicalTrialDollarsVotedFor - b.clinicalTrialDollarsVotedFor; break;
    }
    return sortAsc ? diff : -diff;
  });

  const display = compact ? sorted.slice(0, limit) : sorted;

  const handleSort = (key: SortKey) => {
    if (compact) return;
    if (key === "ratio") {
      // Toggle rank mode instead of raw asc/desc
      const next: RankMode = rankMode === "worst" ? "least-bad" : "worst";
      setRankMode(next);
      setSortKey("ratio");
    } else if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "name");
    }
  };

  const handleRankMode = (mode: RankMode) => {
    setRankMode(mode);
    setSortKey("ratio");
  };

  const indicator = (key: SortKey) => {
    if (compact) return "";
    if (key === "ratio") return sortKey === "ratio" ? (rankMode === "worst" ? " ↓" : " ↑") : "";
    return sortKey === key ? (sortAsc ? " ↑" : " ↓") : "";
  };

  const hdrClass = `p-2 text-xs font-black uppercase text-muted-foreground whitespace-nowrap text-left${compact ? "" : " cursor-pointer hover:text-foreground transition-colors"}`;

  return (
    <div>
      {/* Chamber filter — hidden in compact mode */}
      {!compact && (
        <div className="flex gap-2 mb-4">
          {(["all", "Senate", "House"] as const).map((c) => (
            <Button
              key={c}
              size="sm"
              variant={chamberFilter === c ? "default" : "outline"}
              onClick={() => setChamberFilter(c)}
              className="text-xs font-black uppercase"
            >
              {c === "all" ? `All (${scorecards.length})` : c}
            </Button>
          ))}
        </div>
      )}

      {/* Rank mode toggle + search */}
      <div className="flex items-end justify-between mb-2 gap-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={rankMode === "worst" ? "default" : "outline"}
            onClick={() => handleRankMode("worst")}
            className="text-xs font-black uppercase"
          >
            Worst Players
          </Button>
          <Button
            size="sm"
            variant={rankMode === "least-bad" ? "default" : "outline"}
            onClick={() => handleRankMode("least-bad")}
            className="text-xs font-black uppercase"
          >
            Least Bad Players
          </Button>
        </div>
        {!compact && (
          <input
            type="text"
            placeholder="Search name or state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-2 border-primary bg-background px-3 py-1 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brutal-pink w-48"
          />
        )}
      </div>
      <p className="text-xs font-bold text-muted-foreground mb-3">
        Ranked by military-to-clinical-trials spending ratio, then total military spend, then least clinical trial funding.
      </p>

      {/* Table */}
      <div className="border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-4 border-primary">
              <th className={`${hdrClass} w-8`}>#</th>
              <th className={hdrClass} onClick={() => handleSort("name")}>
                Name{indicator("name")}
              </th>
              <th className={`${hdrClass} text-right`} onClick={() => handleSort("military")}>
                {getMilitarySynonym("table-header")}{indicator("military")}
              </th>
              <th className={`${hdrClass} text-right`} onClick={() => handleSort("trials")}>
                Testing Medicines{indicator("trials")}
              </th>
              <th className={`${hdrClass} text-right`} onClick={() => handleSort("ratio")}>
                Ratio{indicator("ratio")}
              </th>
            </tr>
          </thead>
          <tbody>
            {display.map((s, i) => (
              <tr
                key={s.bioguideId}
                className="border-b border-primary last:border-b-0 hover:bg-muted transition-colors"
              >
                <td className="p-2 text-xs font-bold text-muted-foreground">{i + 1}</td>
                <td className="p-2">
                  <Link
                    href={`/governments/${countryCode}/politicians/${s.bioguideId}`}
                    className="flex items-center gap-2 hover:text-brutal-pink transition-colors"
                  >
                    <Image
                      src={`https://bioguide.congress.gov/bioguide/photo/${s.bioguideId[0]?.toUpperCase() ?? "X"}/${s.bioguideId}.jpg`}
                      alt={s.name}
                      width={28}
                      height={34}
                      className="w-7 h-[34px] object-cover border-2 border-primary shrink-0"
                      unoptimized
                    />
                    <span className="font-black text-foreground text-sm">{s.name}</span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {s.state}
                    </span>
                  </Link>
                </td>
                <td className="p-2 text-right text-sm font-black text-foreground">
                  {formatDollars(s.militaryDollarsVotedFor)}
                </td>
                <td className="p-2 text-right text-sm font-black text-foreground">
                  {formatDollars(s.clinicalTrialDollarsVotedFor)}
                </td>
                <td className="p-2 text-right text-sm font-black text-foreground">
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
