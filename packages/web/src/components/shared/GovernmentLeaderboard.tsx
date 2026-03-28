"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import {
  type GovernmentMetrics,
  getGovernmentsByHALE,
  getMilitaryToGovernmentClinicalTrialRatio,
  getMilitaryToGovernmentMedicalResearchRatio,
} from "@optimitron/data";
import { Tooltip } from "@/components/retroui/Tooltip";
import {
  GOVERNMENT_LEADERBOARD_COLUMN_META,
  type GovernmentLeaderboardSortKey,
} from "./governmentLeaderboardColumns";

type SortKey = GovernmentLeaderboardSortKey;

function formatUSD(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

function ratioColor(
  ratio: number | null,
  denominator: "trials" | "research",
): string {
  if (ratio === null) return "text-muted-foreground";
  if (denominator === "trials") {
    if (ratio < 250) return "text-brutal-cyan";
    if (ratio < 1000) return "text-foreground";
    return "text-brutal-red";
  }
  if (ratio < 20) return "text-brutal-cyan";
  if (ratio < 100) return "text-foreground";
  return "text-brutal-red";
}

function formatRatio(ratio: number): string {
  if (ratio >= 1000) return `${Math.round(ratio).toLocaleString()}:1`;
  if (ratio >= 100) return `${ratio.toFixed(0)}:1`;
  return `${ratio.toFixed(1)}:1`;
}

const rankColumnWidthClass = "w-14 min-w-14";
const countryColumnWidthClass = "min-w-[12rem]";
const stickyRankHeaderClass =
  "sticky left-0 z-30 bg-background";
const stickyCountryHeaderClass =
  "sticky left-14 z-30 border-r-4 border-primary bg-background";
const stickyRankCellClass =
  "sticky left-0 z-10 bg-background group-hover:bg-muted";
const stickyCountryCellClass =
  "sticky left-14 z-10 border-r-4 border-primary bg-background group-hover:bg-muted";

function getSortValue(gov: GovernmentMetrics, key: SortKey): number {
  switch (key) {
    case "hale": return gov.hale?.value ?? 0;
    case "lifeExpectancy": return gov.lifeExpectancy.value;
    case "gdpPerCapita": return gov.gdpPerCapita.value;
    case "militarySpending": return gov.militarySpendingAnnual.value;
    case "healthSpending": return gov.healthSpendingPerCapita.value;
    case "trialRatio":
      return getMilitaryToGovernmentClinicalTrialRatio(gov) ?? 999_999_999;
    case "researchRatio":
      return getMilitaryToGovernmentMedicalResearchRatio(gov) ?? 999_999_999;
  }
}

function stopEventPropagation(event: {
  stopPropagation: () => void;
}): void {
  event.stopPropagation();
}

interface SortableHeaderProps {
  sortKey: SortKey;
  activeSortKey: SortKey;
  sortAsc: boolean;
  headerClass: string;
  onSort: (key: SortKey) => void;
}

function SortableHeader({
  sortKey,
  activeSortKey,
  sortAsc,
  headerClass,
  onSort,
}: SortableHeaderProps) {
  const meta = GOVERNMENT_LEADERBOARD_COLUMN_META[sortKey];
  const indicator =
    activeSortKey === sortKey ? (sortAsc ? " ↑" : " ↓") : "";

  return (
    <th
      className={`p-3 text-right ${headerClass}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="inline-flex items-center justify-end gap-1">
        <span>{meta.label}{indicator}</span>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              aria-label={`Explain ${meta.label}`}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current/40 text-[10px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={stopEventPropagation}
              onPointerDown={stopEventPropagation}
            >
              <HelpCircle className="h-3 w-3" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content
            sideOffset={8}
            className="max-w-xs border-4 border-primary bg-background p-3 text-left text-xs font-semibold text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            {meta.description}
          </Tooltip.Content>
        </Tooltip>
      </div>
    </th>
  );
}

interface GovernmentLeaderboardProps {
  /** Max rows to show (default: all) */
  limit?: number;
  /** Show compact version (fewer columns) */
  compact?: boolean;
}

export function GovernmentLeaderboard({ limit, compact = false }: GovernmentLeaderboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>("hale");
  const [sortAsc, setSortAsc] = useState(false);

  const allGovs = getGovernmentsByHALE();
  const sorted = [...allGovs].sort((a, b) => {
    const diff = getSortValue(b, sortKey) - getSortValue(a, sortKey);
    return sortAsc ? -diff : diff;
  });
  const govs = limit ? sorted.slice(0, limit) : sorted;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const headerClass =
    "text-xs font-black uppercase text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap";

  return (
    <Tooltip.Provider delayDuration={100}>
      <div className="border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-4 border-primary">
              <th
                className={`p-3 text-left text-xs font-black uppercase text-muted-foreground ${rankColumnWidthClass} ${stickyRankHeaderClass}`}
              >
                #
              </th>
              <th
                className={`p-3 text-left text-xs font-black uppercase text-muted-foreground ${countryColumnWidthClass} ${stickyCountryHeaderClass}`}
              >
                Country
              </th>
              <SortableHeader
                sortKey="hale"
                activeSortKey={sortKey}
                sortAsc={sortAsc}
                headerClass={headerClass}
                onSort={handleSort}
              />
              {!compact && (
                <SortableHeader
                  sortKey="lifeExpectancy"
                  activeSortKey={sortKey}
                  sortAsc={sortAsc}
                  headerClass={headerClass}
                  onSort={handleSort}
                />
              )}
              <SortableHeader
                sortKey="gdpPerCapita"
                activeSortKey={sortKey}
                sortAsc={sortAsc}
                headerClass={headerClass}
                onSort={handleSort}
              />
              {!compact && (
                <>
                  <SortableHeader
                    sortKey="militarySpending"
                    activeSortKey={sortKey}
                    sortAsc={sortAsc}
                    headerClass={headerClass}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    sortKey="healthSpending"
                    activeSortKey={sortKey}
                    sortAsc={sortAsc}
                    headerClass={headerClass}
                    onSort={handleSort}
                  />
                </>
              )}
              <SortableHeader
                sortKey="trialRatio"
                activeSortKey={sortKey}
                sortAsc={sortAsc}
                headerClass={headerClass}
                onSort={handleSort}
              />
              <SortableHeader
                sortKey="researchRatio"
                activeSortKey={sortKey}
                sortAsc={sortAsc}
                headerClass={headerClass}
                onSort={handleSort}
              />
            </tr>
          </thead>
          <tbody>
            {govs.map((gov, i) => {
              const clinicalTrialRatio =
                getMilitaryToGovernmentClinicalTrialRatio(gov);
              const medicalResearchRatio =
                getMilitaryToGovernmentMedicalResearchRatio(gov);
              return (
                <tr
                  key={gov.code}
                  className="group border-b-2 border-primary last:border-b-0 hover:bg-muted transition-colors"
                >
                  <td
                    className={`p-3 font-black text-muted-foreground ${rankColumnWidthClass} ${stickyRankCellClass}`}
                  >
                    {i + 1}
                  </td>
                  <td className={`p-3 ${countryColumnWidthClass} ${stickyCountryCellClass}`}>
                    <Link
                      href={`/governments/${gov.code}`}
                      className="hover:text-brutal-pink transition-colors"
                    >
                      <span className="text-xl mr-2">{gov.flag}</span>
                      <span className="font-black text-foreground">{gov.name}</span>
                    </Link>
                  </td>
                  <td className="p-3 text-right font-black text-brutal-cyan">
                    {gov.hale?.value.toFixed(1) ?? "—"}
                  </td>
                  {!compact && (
                    <td className="p-3 text-right font-bold text-foreground">
                      {gov.lifeExpectancy.value.toFixed(1)}
                    </td>
                  )}
                  <td className="p-3 text-right font-black text-foreground">
                    {formatUSD(gov.gdpPerCapita.value)}
                  </td>
                  {!compact && (
                    <>
                      <td className="p-3 text-right font-bold text-foreground">
                        {formatUSD(gov.militarySpendingAnnual.value)}
                      </td>
                      <td className="p-3 text-right font-bold text-foreground">
                        {formatUSD(gov.healthSpendingPerCapita.value)}
                      </td>
                    </>
                  )}
                  <td className={`p-3 text-right font-black ${ratioColor(clinicalTrialRatio, "trials")}`}>
                    {clinicalTrialRatio !== null ? formatRatio(clinicalTrialRatio) : "—"}
                  </td>
                  <td className={`p-3 text-right font-black ${ratioColor(medicalResearchRatio, "research")}`}>
                    {medicalResearchRatio !== null ? formatRatio(medicalResearchRatio) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Tooltip.Provider>
  );
}
