"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import {
  type GovernmentMetrics,
  getGovernmentsByHALE,
  getMilitarySpendingPerCapitaPPP,
  getMilitaryToGovernmentClinicalTrialRatio,
  getMilitaryToGovernmentMedicalResearchRatio,
} from "@optimitron/data";
import { Button } from "@/components/retroui/Button";
import { Tooltip } from "@/components/retroui/Tooltip";
import {
  GOVERNMENT_LEADERBOARD_COLUMN_META,
  GOVERNMENT_LEADERBOARD_DEFAULT_SORT_ASC,
  GOVERNMENT_LEADERBOARD_DEFAULT_SORT_KEY,
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
    if (ratio < 250) return "text-foreground";
    if (ratio < 1000) return "text-foreground";
    return "text-brutal-red";
  }
  if (ratio < 20) return "text-foreground";
  if (ratio < 100) return "text-foreground";
  return "text-brutal-red";
}

function formatRatio(ratio: number): string {
  if (ratio >= 1000) return `${Math.round(ratio).toLocaleString()}:1`;
  if (ratio >= 100) return `${ratio.toFixed(0)}:1`;
  return `${ratio.toFixed(1)}:1`;
}

const rankColumnWidthClass = "w-14 min-w-14";
const countryColumnWidthClass = "min-w-[10rem]";
const stickyRankHeaderClass =
  "";
const stickyCountryHeaderClass =
  "sticky left-0 z-30 border-r-4 border-primary bg-background";
const stickyRankCellClass =
  "";
const stickyCountryCellClass =
  "sticky left-0 z-10 border-r-4 border-primary bg-background group-hover:bg-muted";

function getSortValue(gov: GovernmentMetrics, key: SortKey): number {
  switch (key) {
    case "country": return 0;
    case "rank":
      return getMilitaryToGovernmentClinicalTrialRatio(gov) ?? 999_999_999;
    case "killed": return gov.militaryDeathsCaused.value;
    case "hale": return gov.hale?.value ?? 0;
    case "lifeExpectancy": return gov.lifeExpectancy.value;
    case "gdpPerCapita": return gov.gdpPerCapita.value;
    case "militaryPerCapitaPPP":
      return getMilitarySpendingPerCapitaPPP(gov) ?? 0;
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
  align?: "left" | "right";
  onSort: (key: SortKey) => void;
}

function SortableHeader({
  sortKey,
  activeSortKey,
  sortAsc,
  headerClass,
  align = "right",
  onSort,
}: SortableHeaderProps) {
  const meta = GOVERNMENT_LEADERBOARD_COLUMN_META[sortKey];
  const indicator =
    activeSortKey === sortKey ? (sortAsc ? " ↑" : " ↓") : "";
  const alignmentClass = align === "left" ? "text-left" : "text-right";
  const justifyClass = align === "left" ? "justify-start" : "justify-end";

  return (
    <th
      className={`p-3 ${alignmentClass} ${headerClass}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`inline-flex items-center gap-1 ${justifyClass}`}>
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

type RankMode = "worst" | "least-bad";

interface GovernmentLeaderboardProps {
  /** Max rows to show (default: all) */
  limit?: number;
  /** Show compact version (fewer columns) */
  compact?: boolean;
}

function GovernmentRowLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`block -m-3 p-3 transition-colors hover:text-brutal-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}

export function GovernmentLeaderboard({ limit, compact = false }: GovernmentLeaderboardProps) {
  const [rankMode, setRankMode] = useState<RankMode>("worst");
  const [sortKey, setSortKey] = useState<SortKey>(
    GOVERNMENT_LEADERBOARD_DEFAULT_SORT_KEY,
  );
  const [sortAsc, setSortAsc] = useState(
    GOVERNMENT_LEADERBOARD_DEFAULT_SORT_ASC,
  );
  const [search, setSearch] = useState("");

  const allGovs = getGovernmentsByHALE();
  const searchLower = search.toLowerCase();
  const filtered = search
    ? allGovs.filter((g) => g.name.toLowerCase().includes(searchLower) || g.code.toLowerCase().includes(searchLower))
    : allGovs;
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "trialRatio" || sortKey === "rank") {
      // Multi-key: ratio, then military spend, then least clinical trial
      const dir = rankMode === "worst" ? 1 : -1;
      const aRatio = getSortValue(a, "trialRatio");
      const bRatio = getSortValue(b, "trialRatio");
      if (aRatio !== bRatio) return dir * (bRatio - aRatio);
      const milDiff = b.militarySpendingAnnual.value - a.militarySpendingAnnual.value;
      if (milDiff !== 0) return dir * milDiff;
      return -dir * ((b.clinicalTrialSpending?.value ?? 0) - (a.clinicalTrialSpending?.value ?? 0));
    }
    if (sortKey === "country") {
      const comparison = a.name.localeCompare(b.name);
      return sortAsc ? comparison : -comparison;
    }
    const diff = getSortValue(b, sortKey) - getSortValue(a, sortKey);
    return sortAsc ? -diff : diff;
  });
  const govs = limit ? sorted.slice(0, limit) : sorted;

  const handleSort = (key: SortKey) => {
    if (key === "trialRatio" || key === "rank") {
      const next: RankMode = rankMode === "worst" ? "least-bad" : "worst";
      setRankMode(next);
      setSortKey(key);
    } else if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "country");
    }
  };

  const handleRankMode = (mode: RankMode) => {
    setRankMode(mode);
    setSortKey("trialRatio");
  };

  const headerClass =
    "text-xs font-black uppercase text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap";

  return (
    <Tooltip.Provider delayDuration={100}>
      {/* Rank mode toggle + search */}
      <div className="flex items-end justify-between mb-2 gap-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={rankMode === "worst" ? "default" : "outline"}
            onClick={() => handleRankMode("worst")}
            className="text-xs font-black uppercase"
          >
            Worst Governments
          </Button>
          <Button
            size="sm"
            variant={rankMode === "least-bad" ? "default" : "outline"}
            onClick={() => handleRankMode("least-bad")}
            className="text-xs font-black uppercase"
          >
            Least Bad Governments
          </Button>
        </div>
        {!compact && (
          <input
            type="text"
            placeholder="Search country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-2 border-primary bg-background px-3 py-1 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brutal-pink w-48"
          />
        )}
      </div>
      <p className="text-xs font-bold text-muted-foreground mb-3">
        Ranked by military-to-clinical-trials spending ratio, then total military spend, then least clinical trial funding.
      </p>
      <div className="border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-4 border-primary">
              <SortableHeader
                sortKey="country"
                activeSortKey={sortKey}
                sortAsc={sortAsc}
                headerClass={`${headerClass} ${countryColumnWidthClass} ${stickyCountryHeaderClass}`}
                align="left"
                onSort={handleSort}
              />
              <SortableHeader
                sortKey="trialRatio"
                activeSortKey={sortKey}
                sortAsc={sortAsc}
                headerClass={headerClass}
                onSort={handleSort}
              />
              <SortableHeader
                sortKey="rank"
                activeSortKey={sortKey}
                sortAsc={sortAsc}
                headerClass={`${headerClass} ${rankColumnWidthClass} ${stickyRankHeaderClass}`}
                onSort={handleSort}
              />
              <SortableHeader
                sortKey="killed"
                activeSortKey={sortKey}
                sortAsc={sortAsc}
                headerClass={headerClass}
                onSort={handleSort}
              />
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
                    sortKey="militaryPerCapitaPPP"
                    activeSortKey={sortKey}
                    sortAsc={sortAsc}
                    headerClass={headerClass}
                    onSort={handleSort}
                  />
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
              const militaryPerCapitaPPP =
                getMilitarySpendingPerCapitaPPP(gov);
              const detailHref = `/governments/${gov.code}`;
              return (
                <tr
                  key={gov.code}
                  className="group border-b-2 border-primary last:border-b-0 hover:bg-muted transition-colors cursor-pointer"
                >
                  <td className={`p-3 ${countryColumnWidthClass} ${stickyCountryCellClass}`}>
                    <GovernmentRowLink href={detailHref}>
                      <span className="font-black text-foreground">{gov.name}</span>
                    </GovernmentRowLink>
                  </td>
                  <td className={`p-3 text-right font-black ${ratioColor(clinicalTrialRatio, "trials")}`}>
                    <GovernmentRowLink href={detailHref} className="text-right">
                      {clinicalTrialRatio !== null ? formatRatio(clinicalTrialRatio) : "—"}
                    </GovernmentRowLink>
                  </td>
                  <td
                    className={`p-3 text-right font-black text-muted-foreground ${rankColumnWidthClass} ${stickyRankCellClass}`}
                  >
                    <GovernmentRowLink href={detailHref} className="text-right">
                      {i + 1}
                    </GovernmentRowLink>
                  </td>
                  <td className="p-3 text-right font-black text-foreground">
                    <GovernmentRowLink href={detailHref} className="text-right">
                      {gov.militaryDeathsCaused.value.toLocaleString()}
                    </GovernmentRowLink>
                  </td>
                  <td className="p-3 text-right font-black text-foreground">
                    <GovernmentRowLink href={detailHref} className="text-right">
                      {gov.hale?.value.toFixed(1) ?? "—"}
                    </GovernmentRowLink>
                  </td>
                  {!compact && (
                    <td className="p-3 text-right font-bold text-foreground">
                      <GovernmentRowLink href={detailHref} className="text-right">
                        {gov.lifeExpectancy.value.toFixed(1)}
                      </GovernmentRowLink>
                    </td>
                  )}
                  <td className="p-3 text-right font-black text-foreground">
                    <GovernmentRowLink href={detailHref} className="text-right">
                      {formatUSD(gov.gdpPerCapita.value)}
                    </GovernmentRowLink>
                  </td>
                  {!compact && (
                    <>
                      <td className="p-3 text-right font-bold text-foreground">
                        <GovernmentRowLink href={detailHref} className="text-right">
                          {militaryPerCapitaPPP !== null
                            ? formatUSD(militaryPerCapitaPPP)
                            : "—"}
                        </GovernmentRowLink>
                      </td>
                      <td className="p-3 text-right font-bold text-foreground">
                        <GovernmentRowLink href={detailHref} className="text-right">
                          {formatUSD(gov.militarySpendingAnnual.value)}
                        </GovernmentRowLink>
                      </td>
                      <td className="p-3 text-right font-bold text-foreground">
                        <GovernmentRowLink href={detailHref} className="text-right">
                          {formatUSD(gov.healthSpendingPerCapita.value)}
                        </GovernmentRowLink>
                      </td>
                    </>
                  )}
                  <td className={`p-3 text-right font-black ${ratioColor(medicalResearchRatio, "research")}`}>
                    <GovernmentRowLink href={detailHref} className="text-right">
                      {medicalResearchRatio !== null ? formatRatio(medicalResearchRatio) : "—"}
                    </GovernmentRowLink>
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
