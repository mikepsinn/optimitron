"use client";

import { useState, useMemo } from "react";
import type { CIACoup } from "@optimitron/data/datasets/us-cia-coups";
import { BrutalCard } from "@/components/ui/brutal-card";

interface CoupTableProps {
  coups: CIACoup[];
}

type SortKey = "year" | "estimatedDeaths" | "yearsOfDictatorship";
type SortDir = "asc" | "desc";

function formatNumber(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
}

/**
 * Sortable table of CIA-backed coups and regime changes.
 * Columns: Flag, Country, Year, Deaths, Displaced, Dictatorship (years), Corporate Beneficiary.
 * Summary at bottom: total democracies overthrown, total deaths, total years of dictatorship.
 */
export function CoupTable({ coups }: CoupTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("estimatedDeaths");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    return [...coups].sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [coups, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const totalDeaths = coups.reduce((s, c) => s + c.estimatedDeaths, 0);
  const totalDemocracies = coups.filter((c) =>
    c.leaderOverthrown.toLowerCase().includes("democrat"),
  ).length;
  const totalDictatorshipYears = coups.reduce(
    (s, c) => s + (c.yearsOfDictatorship ?? 0),
    0,
  );
  const totalDisplaced = coups.reduce(
    (s, c) => s + (c.estimatedDisplaced ?? 0),
    0,
  );

  const headerClass =
    "text-left text-[10px] font-black uppercase text-muted-foreground px-3 py-2 cursor-pointer hover:text-foreground transition-colors select-none";
  const staticHeaderClass =
    "text-left text-[10px] font-black uppercase text-muted-foreground px-3 py-2";
  const arrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <BrutalCard bgColor="default" shadowSize={8} padding="md">
      <h3 className="text-lg font-black uppercase text-foreground mb-4">
        CIA-Backed Coups &amp; Regime Changes
      </h3>

      <div className="overflow-x-auto -mx-6">
        <table className="w-full min-w-[750px]">
          <thead>
            <tr className="border-b-4 border-primary">
              <th className={staticHeaderClass}>Flag</th>
              <th className={staticHeaderClass}>Country</th>
              <th className={headerClass} onClick={() => handleSort("year")}>
                Year{arrow("year")}
              </th>
              <th
                className={headerClass}
                onClick={() => handleSort("estimatedDeaths")}
              >
                Deaths{arrow("estimatedDeaths")}
              </th>
              <th className={staticHeaderClass}>Displaced</th>
              <th
                className={headerClass}
                onClick={() => handleSort("yearsOfDictatorship")}
              >
                Dictatorship (yrs){arrow("yearsOfDictatorship")}
              </th>
              <th className={`${staticHeaderClass} hidden md:table-cell`}>
                Corporate Beneficiary
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id} className="border-b-2 border-primary">
                <td className="px-3 py-3 text-xl">{c.flag}</td>
                <td className="px-3 py-3">
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-black text-foreground hover:text-foreground transition-colors"
                  >
                    {c.country} ↗
                  </a>
                </td>
                <td className="px-3 py-3 text-sm font-bold text-foreground">
                  {c.year}
                </td>
                <td className="px-3 py-3 text-sm font-black text-brutal-red">
                  {formatNumber(c.estimatedDeaths)}
                </td>
                <td className="px-3 py-3 text-sm font-bold text-muted-foreground">
                  {c.estimatedDisplaced
                    ? formatNumber(c.estimatedDisplaced)
                    : "—"}
                </td>
                <td className="px-3 py-3 text-sm font-black text-foreground">
                  {c.yearsOfDictatorship ?? "—"}
                </td>
                <td className="px-3 py-3 text-xs font-bold text-muted-foreground hidden md:table-cell">
                  {c.corporateBeneficiary ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary bar */}
      <div className="mt-4 pt-4 border-t-4 border-primary grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-[10px] font-black uppercase text-muted-foreground">
            Democracies Overthrown
          </p>
          <p className="text-xl font-black text-brutal-red">
            {totalDemocracies}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-muted-foreground">
            Total Deaths
          </p>
          <p className="text-xl font-black text-brutal-red">
            {formatNumber(totalDeaths)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-muted-foreground">
            Total Displaced
          </p>
          <p className="text-xl font-black text-background">
            {formatNumber(totalDisplaced)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-muted-foreground">
            Years of Dictatorship
          </p>
          <p className="text-xl font-black text-background">
            {totalDictatorshipYears}
          </p>
        </div>
      </div>
    </BrutalCard>
  );
}
