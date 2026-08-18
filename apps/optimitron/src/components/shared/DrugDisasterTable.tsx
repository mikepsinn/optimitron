"use client";

import { useState, useMemo } from "react";
import type { FDAApprovedDrugDisaster } from "@optimitron/data/datasets/us-fda-approved-drug-deaths";
import { BrutalCard } from "@/components/ui/brutal-card";

interface DrugDisasterTableProps {
  disasters: FDAApprovedDrugDisaster[];
}

type SortKey = "drug" | "yearsOnMarket" | "estimatedDeaths" | "fineAmount" | "revenueWhileOnMarket";
type SortDir = "asc" | "desc";

function formatUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  if (n === 0) return "$0";
  return `$${n.toLocaleString()}`;
}

function formatNumber(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
}

const HIGH_DEATH_THRESHOLD = 5000;

/**
 * Sortable table of FDA-approved drug disasters.
 * Red-bordered rows for drugs with high death tolls. "Jail Time" is always "Zero."
 */
export function DrugDisasterTable({ disasters }: DrugDisasterTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("estimatedDeaths");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    return [...disasters].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const aN = Number(aVal);
      const bN = Number(bVal);
      return sortDir === "asc" ? aN - bN : bN - aN;
    });
  }, [disasters, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const totalDeaths = disasters.reduce((s, d) => s + d.estimatedDeaths, 0);
  const totalFines = disasters.reduce((s, d) => s + d.fineAmount, 0);
  const costPerDeath = totalDeaths > 0 ? Math.round(totalFines / totalDeaths) : 0;

  const headerClass =
    "text-left text-[10px] font-black uppercase text-muted-foreground px-3 py-2 cursor-pointer hover:text-foreground transition-colors select-none";
  const arrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <BrutalCard bgColor="default" shadowSize={8} padding="md">
      <h3 className="text-lg font-black uppercase text-foreground mb-4">
        FDA-Approved Drug Disasters
      </h3>

      <div className="overflow-x-auto -mx-6">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b-4 border-primary">
              <th className={headerClass} onClick={() => handleSort("drug")}>
                Drug{arrow("drug")}
              </th>
              <th className={`${headerClass} hidden sm:table-cell`}>Manufacturer</th>
              <th className={headerClass} onClick={() => handleSort("yearsOnMarket")}>
                Years On Market{arrow("yearsOnMarket")}
              </th>
              <th className={headerClass} onClick={() => handleSort("estimatedDeaths")}>
                Deaths{arrow("estimatedDeaths")}
              </th>
              <th className={headerClass} onClick={() => handleSort("fineAmount")}>
                Fine{arrow("fineAmount")}
              </th>
              <th className={`${headerClass} hidden md:table-cell`} onClick={() => handleSort("revenueWhileOnMarket")}>
                Revenue{arrow("revenueWhileOnMarket")}
              </th>
              <th className={headerClass}>Jail Time</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => {
              const isHighDeath = d.estimatedDeaths >= HIGH_DEATH_THRESHOLD;
              return (
                <tr
                  key={d.drug}
                  className={`border-b-2 ${isHighDeath ? "border-brutal-red bg-brutal-red/5" : "border-primary"}`}
                >
                  <td className="px-3 py-3">
                    <a
                      href={d.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-black text-foreground hover:text-foreground transition-colors"
                    >
                      {d.drug} ↗
                    </a>
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-muted-foreground hidden sm:table-cell">
                    {d.manufacturer}
                  </td>
                  <td className="px-3 py-3 text-sm font-black text-foreground">
                    {d.yearsOnMarket}
                  </td>
                  <td className={`px-3 py-3 text-sm font-black ${isHighDeath ? "text-brutal-red" : "text-foreground"}`}>
                    {formatNumber(d.estimatedDeaths)}
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-muted-foreground">
                    {formatUsd(d.fineAmount)}
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-muted-foreground hidden md:table-cell">
                    {formatUsd(d.revenueWhileOnMarket)}
                  </td>
                  <td className="px-3 py-3 text-sm font-black text-brutal-red">
                    Zero
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary bar */}
      <div className="mt-4 pt-4 border-t-4 border-primary grid grid-cols-3 gap-4 text-center">
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
            Total Fines
          </p>
          <p className="text-xl font-black text-background">
            {formatUsd(totalFines)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-muted-foreground">
            Cost Per Death
          </p>
          <p className="text-xl font-black text-background">
            {formatUsd(costPerDeath)}
          </p>
        </div>
      </div>
    </BrutalCard>
  );
}
