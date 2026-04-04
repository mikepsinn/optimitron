"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/retroui/Button";
import { SpendingBar } from "@/components/ui/spending-bar";
import { ColumnHelp } from "@/components/ui/column-help";
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

type SortKey = "name" | "ratio" | "military" | "trials" | "score";
type RankMode = "worst" | "least-bad";

function formatDollars(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value === 0) return "$0";
  return `$${value.toLocaleString()}`;
}

function formatScore(value: number): string {
  if (value === 0) return "$0";
  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatDollars(Math.abs(value))}`;
}

function formatRatio(ratio: number): string {
  if (ratio === 0) return "0:1";
  if (ratio === 1) return "1:1";
  if (ratio >= 999_999) return "∞";
  return `${ratio.toLocaleString()}:1`;
}

function getScore(s: PoliticianScore): number {
  return s.clinicalTrialDollarsVotedFor - s.militaryDollarsVotedFor;
}

interface PoliticianScorecardTableProps {
  scorecards: PoliticianScore[];
  systemWideRatio: number;
  countryCode?: string;
  /** Show only this many rows. Hides filters and ratio callout when set. */
  limit?: number;
  /** Show a dynamic heading that updates with the rank mode toggle */
  showTitle?: boolean;
  subtitle?: string;
}

const COLUMN_HELP = {
  rank: "Rank position based on current sort",
  name: "Politician name, state, and party",
  military: "Total dollars voted YEA on military/defense bills (NDAA, supplementals, omnibus military portions)",
  trials: "Dollars voted YEA on bills containing NIH clinical trial funding (3.3% of NIH budget actually funds clinical trials)",
  score: "Clinical trial spending minus military spending. Negative = more money on military than medicine.",
  ratio: "Military dollars per clinical trial dollar. Higher = worse. ∞ = voted for military but never for trials.",
} as const;

export function PoliticianScorecardTable({
  scorecards,
  systemWideRatio,
  countryCode = "US",
  limit,
  showTitle = false,
  subtitle,
}: PoliticianScorecardTableProps) {
  const compact = limit != null;
  const [rankMode, setRankMode] = useState<RankMode>("worst");
  const [sortKey, setSortKey] = useState<SortKey>("ratio");
  const [sortAsc, setSortAsc] = useState(false);
  const [chamberFilter, setChamberFilter] = useState<"all" | "Senate" | "House">("all");
  const [search, setSearch] = useState("");

  const maxMilitary = useMemo(
    () => Math.max(...scorecards.map((s) => s.militaryDollarsVotedFor), 1),
    [scorecards],
  );
  const maxTrials = useMemo(
    () => Math.max(...scorecards.map((s) => s.clinicalTrialDollarsVotedFor), 1),
    [scorecards],
  );
  const maxAbsScore = useMemo(
    () => Math.max(...scorecards.map((s) => Math.abs(getScore(s))), 1),
    [scorecards],
  );

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
      case "score": diff = getScore(a) - getScore(b); break;
    }
    return sortAsc ? diff : -diff;
  });

  const display = compact ? sorted.slice(0, limit) : sorted;

  const handleSort = (key: SortKey) => {
    if (compact) return;
    if (key === "ratio") {
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

  const dynamicTitle = rankMode === "worst" ? "Worst Players" : "Least Bad Players";

  return (
    <div className="bg-background text-foreground border-4 border-primary p-2 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {showTitle && (
        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider mb-4">
            {dynamicTitle}
          </h2>
          {subtitle && (
            <p className="text-lg sm:text-xl font-bold max-w-3xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
      )}
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
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-2 gap-2 sm:gap-4">
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
        <input
          type="text"
          placeholder="Search name or state..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-2 border-primary bg-background px-3 py-1 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brutal-pink w-full sm:w-48"
        />
      </div>
      <p className="text-xs font-bold text-muted-foreground mb-3">
        Ranked by military-to-clinical-trials spending ratio, then total military spend, then least clinical trial funding.
      </p>

      {/* Table */}
      <div className="border-2 border-primary overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-4 border-primary">
              {/* # — hidden on mobile */}
              <th className={`${hdrClass} w-8 hidden md:table-cell`}>
                #<ColumnHelp text={COLUMN_HELP.rank} />
              </th>
              <th className={hdrClass} onClick={() => handleSort("name")}>
                Name{indicator("name")}<ColumnHelp text={COLUMN_HELP.name} />
              </th>
              {/* Military — hidden on mobile */}
              <th className={`${hdrClass} text-right hidden lg:table-cell`} onClick={() => handleSort("military")}>
                {getMilitarySynonym("table-header")}{indicator("military")}<ColumnHelp text={COLUMN_HELP.military} />
              </th>
              {/* Trials — hidden on mobile */}
              <th className={`${hdrClass} text-right hidden lg:table-cell`} onClick={() => handleSort("trials")}>
                Testing Medicines{indicator("trials")}<ColumnHelp text={COLUMN_HELP.trials} />
              </th>
              {/* Score — always visible */}
              <th className={`${hdrClass} text-right`} onClick={() => handleSort("score")}>
                Score{indicator("score")}<ColumnHelp text={COLUMN_HELP.score} />
              </th>
              {/* Ratio — hidden on small mobile, visible from sm */}
              <th className={`${hdrClass} text-right hidden sm:table-cell`} onClick={() => handleSort("ratio")}>
                Ratio{indicator("ratio")}<ColumnHelp text={COLUMN_HELP.ratio} />
              </th>
            </tr>
          </thead>
          <tbody>
            {display.map((s, i) => {
              const score = getScore(s);
              return (
                <tr
                  key={s.bioguideId}
                  className="border-b border-primary last:border-b-0 hover:bg-muted transition-colors"
                >
                  {/* # — hidden on mobile */}
                  <td className="p-2 text-xs font-bold text-muted-foreground hidden md:table-cell">
                    {i + 1}
                  </td>

                  {/* Name cell — includes inline mini bars on mobile */}
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
                      <span className="text-xs font-bold text-muted-foreground hidden sm:inline">
                        {s.state}
                      </span>
                    </Link>
                    {/* Mini spending bars — visible only on mobile (below lg) */}
                    <div className="mt-1.5 space-y-1 lg:hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-brutal-red w-8 shrink-0">MIL</span>
                        <SpendingBar
                          value={s.militaryDollarsVotedFor}
                          max={maxMilitary}
                          color="red"
                          height="sm"
                          className="flex-1"
                        />
                        <span className="text-[10px] font-black text-foreground w-12 text-right shrink-0">
                          {formatDollars(s.militaryDollarsVotedFor)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-brutal-cyan w-8 shrink-0">RX</span>
                        <SpendingBar
                          value={s.clinicalTrialDollarsVotedFor}
                          max={maxTrials}
                          color="cyan"
                          height="sm"
                          className="flex-1"
                        />
                        <span className="text-[10px] font-black text-foreground w-12 text-right shrink-0">
                          {formatDollars(s.clinicalTrialDollarsVotedFor)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Military — hidden on mobile */}
                  <td className="p-2 text-right min-w-[120px] hidden lg:table-cell">
                    <div className="text-sm font-black text-foreground">
                      {formatDollars(s.militaryDollarsVotedFor)}
                    </div>
                    <SpendingBar
                      value={s.militaryDollarsVotedFor}
                      max={maxMilitary}
                      color="red"
                      height="sm"
                      className="mt-1"
                    />
                  </td>

                  {/* Trials — hidden on mobile */}
                  <td className="p-2 text-right min-w-[120px] hidden lg:table-cell">
                    <div className="text-sm font-black text-foreground">
                      {formatDollars(s.clinicalTrialDollarsVotedFor)}
                    </div>
                    <SpendingBar
                      value={s.clinicalTrialDollarsVotedFor}
                      max={maxTrials}
                      color="cyan"
                      height="sm"
                      className="mt-1"
                    />
                  </td>

                  {/* Score — always visible */}
                  <td className="p-2 text-right min-w-[80px] sm:min-w-[120px]">
                    <div className={`text-xs sm:text-sm font-black ${score >= 0 ? "text-brutal-green" : "text-brutal-red"}`}>
                      {formatScore(score)}
                    </div>
                    <SpendingBar
                      value={Math.abs(score)}
                      max={maxAbsScore}
                      color={score >= 0 ? "green" : "red"}
                      height="sm"
                      className="mt-1"
                    />
                  </td>

                  {/* Ratio — hidden on small mobile */}
                  <td className="p-2 text-right text-sm font-black text-foreground hidden sm:table-cell">
                    {formatRatio(s.ratio)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
