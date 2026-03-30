"use client";

import { useState } from "react";
import Image from "next/image";

interface PoliticianRow {
  politicianId: string;
  externalId: string | null;
  name: string;
  party: string | null;
  title: string | null;
  chamber: string | null;
  district: string | null;
  score: number;
  votesCompared: number;
  itemScores: Record<string, number>;
  rank: number;
  onChainRef: string | null;
}

type SortField = "rank" | "name" | "party" | "score" | "votesCompared";
type SortDirection = "asc" | "desc";

interface AlignmentScoreTableProps {
  politicians: PoliticianRow[];
}

function scoreColorClass(score: number): string {
  if (score > 70) return "bg-brutal-cyan text-green-900 border-green-600";
  if (score >= 40) return "bg-yellow-400/20 text-yellow-900 border-yellow-600";
  return "bg-brutal-red text-red-900 border-red-600";
}

function scoreBgClass(score: number): string {
  if (score > 70) return "bg-brutal-cyan";
  if (score >= 40) return "bg-yellow-500";
  return "bg-brutal-red";
}

export function AlignmentScoreTable({ politicians }: AlignmentScoreTableProps) {
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "score" ? "desc" : "asc");
    }
  }

  const sorted = [...politicians].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    switch (sortField) {
      case "rank":
        return mul * (a.rank - b.rank);
      case "name":
        return mul * a.name.localeCompare(b.name);
      case "party":
        return mul * (a.party ?? "").localeCompare(b.party ?? "");
      case "score":
        return mul * (a.score - b.score);
      case "votesCompared":
        return mul * (a.votesCompared - b.votesCompared);
      default:
        return 0;
    }
  });

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return "";
    return sortDir === "asc" ? " \u25B2" : " \u25BC";
  };

  if (politicians.length === 0) {
    return (
      <p className="text-sm font-bold text-muted-foreground">
        No politician scores available yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-primary">
            {(
              [
                { field: "rank" as const, label: "Rank" },
                { field: "name" as const, label: "Name" },
                { field: "party" as const, label: "Party" },
                { field: "score" as const, label: "Score" },
                { field: "votesCompared" as const, label: "Votes Compared" },
              ] as const
            ).map(({ field, label }) => (
              <th
                key={field}
                onClick={() => handleSort(field)}
                className="cursor-pointer select-none px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
                {sortIndicator(field)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((pol) => (
            <tr
              key={pol.politicianId}
              className="border-b border-primary hover:bg-muted transition-colors"
            >
              <td className="px-3 py-3 text-sm font-black text-muted-foreground">
                #{pol.rank}
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  {pol.externalId && (
                    <Image
                      src={`https://bioguide.congress.gov/bioguide/photo/${pol.externalId[0]?.toUpperCase() ?? "X"}/${pol.externalId}.jpg`}
                      alt={pol.name}
                      width={28}
                      height={34}
                      className="w-7 h-[34px] object-cover border-2 border-primary shrink-0"
                      unoptimized
                    />
                  )}
                  <div>
                    <div className="text-sm font-black text-foreground">{pol.name}</div>
                    {pol.title ? (
                      <div className="text-xs font-bold text-muted-foreground">
                        {pol.title}
                        {pol.district ? ` \u00B7 ${pol.district}` : ""}
                      </div>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="px-3 py-3 text-sm font-bold text-foreground">
                {pol.party ?? "\u2014"}
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 overflow-hidden border border-primary bg-muted">
                    <div
                      className={`h-full ${scoreBgClass(pol.score)}`}
                      style={{ width: `${Math.min(pol.score, 100)}%` }}
                    />
                  </div>
                  <span
                    className={`inline-flex items-center border px-2 py-0.5 text-xs font-black ${scoreColorClass(pol.score)}`}
                  >
                    {pol.score.toFixed(1)}
                  </span>
                </div>
              </td>
              <td className="px-3 py-3 text-sm font-bold text-muted-foreground">
                {pol.votesCompared}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
