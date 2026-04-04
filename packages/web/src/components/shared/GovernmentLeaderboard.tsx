"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  type GovernmentMetrics,
  getGovernmentsByHALE,
  getMilitarySpendingPerCapitaPPP,
  getMilitaryToGovernmentClinicalTrialRatio,
  getMilitaryToGovernmentMedicalResearchRatio,
} from "@optimitron/data";
import { Button } from "@/components/retroui/Button";
import { SpendingBar } from "@/components/ui/spending-bar";
import { ColumnHelp } from "@/components/ui/column-help";
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

function formatRatio(ratio: number): string {
  if (ratio >= 1000) return `${Math.round(ratio).toLocaleString()}:1`;
  if (ratio >= 100) return `${ratio.toFixed(0)}:1`;
  return `${ratio.toFixed(1)}:1`;
}

function getSortValue(gov: GovernmentMetrics, key: SortKey): number {
  switch (key) {
    case "country": return 0;
    case "rank":
      return getMilitaryToGovernmentClinicalTrialRatio(gov) ?? 999_999_999;
    case "killed": return gov.militaryDeathsCaused.value;
    case "hale": return gov.hale?.value ?? 0;
    case "lifeExpectancy": return gov.lifeExpectancy.value;
    case "medianIncome": return gov.gdpPerCapita.value - gov.governmentSpendingPerCapita.value;
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

const COLUMN_HELP_TEXT: Record<string, string> = {
  country: "Country name. Click to sort alphabetically.",
  trialRatio: "Military spending per $1 of government clinical trial spending. Higher = worse.",
  rank: "Current table rank based on the default Mil/Trials ranking.",
  killed: "Estimated total people killed by that government's military actions.",
  hale: "Healthy life expectancy at birth: expected years lived in full health.",
  lifeExpectancy: "Total life expectancy at birth, including years with illness or disability.",
  medianIncome: "GDP per capita minus government spending per capita (PPP). What citizens actually keep.",
  militaryPerCapitaPPP: "Military spending per person in PPP terms.",
  militarySpending: "Annual military spending in USD.",
  healthSpending: "Annual health spending per person.",
  researchRatio: "Military spending per $1 of total government medical research spending.",
};

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

  // Compute max values for bar scaling
  const maxMilitary = useMemo(
    () => Math.max(...allGovs.map((g) => g.militarySpendingAnnual.value), 1),
    [allGovs],
  );
  const maxKilled = useMemo(
    () => Math.max(...allGovs.map((g) => g.militaryDeathsCaused.value), 1),
    [allGovs],
  );
  const maxHale = useMemo(
    () => Math.max(...allGovs.map((g) => g.hale?.value ?? 0), 1),
    [allGovs],
  );
  const maxIncome = useMemo(
    () => Math.max(...allGovs.map((g) => g.gdpPerCapita.value - g.governmentSpendingPerCapita.value), 1),
    [allGovs],
  );
  const maxTrialRatio = useMemo(
    () => Math.max(
      ...allGovs
        .map((g) => getMilitaryToGovernmentClinicalTrialRatio(g))
        .filter((r): r is number => r !== null && r < 999_999),
      1,
    ),
    [allGovs],
  );

  const searchLower = search.toLowerCase();
  const filtered = search
    ? allGovs.filter((g) => g.name.toLowerCase().includes(searchLower) || g.code.toLowerCase().includes(searchLower))
    : allGovs;
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "trialRatio" || sortKey === "rank") {
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

  const indicator = (key: SortKey) => {
    if (key === "trialRatio" || key === "rank") {
      return sortKey === key ? (rankMode === "worst" ? " ↓" : " ↑") : "";
    }
    return sortKey === key ? (sortAsc ? " ↑" : " ↓") : "";
  };

  const hdrClass = "p-2 text-xs font-black uppercase text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground transition-colors";

  return (
    <div className="bg-background text-foreground border-4 border-primary p-2 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {/* Rank mode toggle + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-2 gap-2 sm:gap-4">
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
        <input
          type="text"
          placeholder="Search country..."
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
              <th className={`${hdrClass} w-8 hidden md:table-cell`} onClick={() => handleSort("rank")}>
                #{indicator("rank")}<ColumnHelp text={COLUMN_HELP_TEXT.rank!} />
              </th>
              {/* Country — always visible, sticky */}
              <th
                className={`${hdrClass} text-left sticky left-0 z-30 bg-background border-r-4 border-primary min-w-[8rem]`}
                onClick={() => handleSort("country")}
              >
                Country{indicator("country")}<ColumnHelp text={COLUMN_HELP_TEXT.country!} />
              </th>
              {/* Military — hidden on mobile */}
              <th className={`${hdrClass} text-right hidden lg:table-cell`} onClick={() => handleSort("militarySpending")}>
                Military{indicator("militarySpending")}<ColumnHelp text={COLUMN_HELP_TEXT.militarySpending!} />
              </th>
              {/* Killed — hidden on mobile */}
              <th className={`${hdrClass} text-right hidden lg:table-cell`} onClick={() => handleSort("killed")}>
                Killed{indicator("killed")}<ColumnHelp text={COLUMN_HELP_TEXT.killed!} />
              </th>
              {/* Mil/Trials — always visible */}
              <th className={`${hdrClass} text-right`} onClick={() => handleSort("trialRatio")}>
                Mil/Trials{indicator("trialRatio")}<ColumnHelp text={COLUMN_HELP_TEXT.trialRatio!} />
              </th>
              {/* HALE — hidden on small mobile */}
              <th className={`${hdrClass} text-right hidden sm:table-cell`} onClick={() => handleSort("hale")}>
                HALE{indicator("hale")}<ColumnHelp text={COLUMN_HELP_TEXT.hale!} />
              </th>
              {/* Life Exp — hidden unless full */}
              {!compact && (
                <th className={`${hdrClass} text-right hidden xl:table-cell`} onClick={() => handleSort("lifeExpectancy")}>
                  Life Exp{indicator("lifeExpectancy")}<ColumnHelp text={COLUMN_HELP_TEXT.lifeExpectancy!} />
                </th>
              )}
              {/* What You Keep — hidden on small mobile */}
              <th className={`${hdrClass} text-right hidden sm:table-cell`} onClick={() => handleSort("medianIncome")}>
                What You Keep{indicator("medianIncome")}<ColumnHelp text={COLUMN_HELP_TEXT.medianIncome!} />
              </th>
              {!compact && (
                <>
                  <th className={`${hdrClass} text-right hidden xl:table-cell`} onClick={() => handleSort("militaryPerCapitaPPP")}>
                    Mil/cap PPP{indicator("militaryPerCapitaPPP")}<ColumnHelp text={COLUMN_HELP_TEXT.militaryPerCapitaPPP!} />
                  </th>
                  <th className={`${hdrClass} text-right hidden xl:table-cell`} onClick={() => handleSort("healthSpending")}>
                    Health/cap{indicator("healthSpending")}<ColumnHelp text={COLUMN_HELP_TEXT.healthSpending!} />
                  </th>
                </>
              )}
              <th className={`${hdrClass} text-right hidden md:table-cell`} onClick={() => handleSort("researchRatio")}>
                Mil/Research{indicator("researchRatio")}<ColumnHelp text={COLUMN_HELP_TEXT.researchRatio!} />
              </th>
            </tr>
          </thead>
          <tbody>
            {govs.map((gov, i) => {
              const clinicalTrialRatio = getMilitaryToGovernmentClinicalTrialRatio(gov);
              const medicalResearchRatio = getMilitaryToGovernmentMedicalResearchRatio(gov);
              const militaryPerCapitaPPP = getMilitarySpendingPerCapitaPPP(gov);
              const income = gov.gdpPerCapita.value - gov.governmentSpendingPerCapita.value;
              const detailHref = `/governments/${gov.code}`;
              return (
                <tr
                  key={gov.code}
                  className="group border-b border-primary last:border-b-0 hover:bg-muted transition-colors"
                >
                  {/* # — hidden on mobile */}
                  <td className="p-2 text-xs font-bold text-muted-foreground hidden md:table-cell">
                    {i + 1}
                  </td>

                  {/* Country — sticky, with inline mini bars on mobile */}
                  <td className="p-2 sticky left-0 z-10 bg-background group-hover:bg-muted border-r-4 border-primary">
                    <GovernmentRowLink href={detailHref}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg leading-none">{gov.flag}</span>
                        <span className="font-black text-foreground text-sm">{gov.name}</span>
                      </div>
                    </GovernmentRowLink>
                    {/* Mini bars — visible below lg */}
                    <div className="mt-1.5 space-y-1 lg:hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-brutal-red w-7 shrink-0">MIL</span>
                        <SpendingBar
                          value={gov.militarySpendingAnnual.value}
                          max={maxMilitary}
                          color="red"
                          height="sm"
                          className="flex-1"
                        />
                        <span className="text-[10px] font-black text-foreground w-12 text-right shrink-0">
                          {formatUSD(gov.militarySpendingAnnual.value)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-brutal-cyan w-7 shrink-0">HP</span>
                        <SpendingBar
                          value={gov.hale?.value ?? 0}
                          max={maxHale}
                          color="cyan"
                          height="sm"
                          className="flex-1"
                        />
                        <span className="text-[10px] font-black text-foreground w-12 text-right shrink-0">
                          {gov.hale?.value.toFixed(1) ?? "—"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Military — hidden on mobile */}
                  <td className="p-2 text-right min-w-[100px] hidden lg:table-cell">
                    <GovernmentRowLink href={detailHref} className="text-right">
                      <div className="text-sm font-black text-foreground">
                        {formatUSD(gov.militarySpendingAnnual.value)}
                      </div>
                      <SpendingBar
                        value={gov.militarySpendingAnnual.value}
                        max={maxMilitary}
                        color="red"
                        height="sm"
                        className="mt-1"
                      />
                    </GovernmentRowLink>
                  </td>

                  {/* Killed — hidden on mobile */}
                  <td className="p-2 text-right min-w-[100px] hidden lg:table-cell">
                    <GovernmentRowLink href={detailHref} className="text-right">
                      <div className="text-sm font-black text-foreground">
                        {gov.militaryDeathsCaused.value.toLocaleString()}
                      </div>
                      <SpendingBar
                        value={gov.militaryDeathsCaused.value}
                        max={maxKilled}
                        color="red"
                        height="sm"
                        className="mt-1"
                      />
                    </GovernmentRowLink>
                  </td>

                  {/* Mil/Trials ratio — always visible */}
                  <td className="p-2 text-right min-w-[80px] sm:min-w-[110px]">
                    <GovernmentRowLink href={detailHref} className="text-right">
                      <div className={`text-xs sm:text-sm font-black ${
                        clinicalTrialRatio !== null && clinicalTrialRatio >= 500
                          ? "text-brutal-red"
                          : "text-foreground"
                      }`}>
                        {clinicalTrialRatio !== null ? formatRatio(clinicalTrialRatio) : "—"}
                      </div>
                      {clinicalTrialRatio !== null && clinicalTrialRatio < 999_999 && (
                        <SpendingBar
                          value={clinicalTrialRatio}
                          max={maxTrialRatio}
                          color="red"
                          height="sm"
                          className="mt-1"
                        />
                      )}
                    </GovernmentRowLink>
                  </td>

                  {/* HALE — hidden on small mobile */}
                  <td className="p-2 text-right min-w-[80px] hidden sm:table-cell">
                    <GovernmentRowLink href={detailHref} className="text-right">
                      <div className="text-sm font-black text-foreground">
                        {gov.hale?.value.toFixed(1) ?? "—"}
                      </div>
                      {gov.hale && (
                        <SpendingBar
                          value={gov.hale.value}
                          max={maxHale}
                          color="cyan"
                          height="sm"
                          className="mt-1"
                        />
                      )}
                    </GovernmentRowLink>
                  </td>

                  {/* Life Exp — full only */}
                  {!compact && (
                    <td className="p-2 text-right hidden xl:table-cell">
                      <GovernmentRowLink href={detailHref} className="text-right">
                        <span className="text-sm font-bold text-foreground">
                          {gov.lifeExpectancy.value.toFixed(1)}
                        </span>
                      </GovernmentRowLink>
                    </td>
                  )}

                  {/* What You Keep — hidden on small mobile */}
                  <td className="p-2 text-right min-w-[80px] hidden sm:table-cell">
                    <GovernmentRowLink href={detailHref} className="text-right">
                      <div className="text-sm font-black text-foreground">
                        {formatUSD(income)}
                      </div>
                      <SpendingBar
                        value={Math.max(income, 0)}
                        max={maxIncome}
                        color="green"
                        height="sm"
                        className="mt-1"
                      />
                    </GovernmentRowLink>
                  </td>

                  {!compact && (
                    <>
                      <td className="p-2 text-right hidden xl:table-cell">
                        <GovernmentRowLink href={detailHref} className="text-right">
                          <span className="text-sm font-bold text-foreground">
                            {militaryPerCapitaPPP !== null ? formatUSD(militaryPerCapitaPPP) : "—"}
                          </span>
                        </GovernmentRowLink>
                      </td>
                      <td className="p-2 text-right hidden xl:table-cell">
                        <GovernmentRowLink href={detailHref} className="text-right">
                          <span className="text-sm font-bold text-foreground">
                            {formatUSD(gov.healthSpendingPerCapita.value)}
                          </span>
                        </GovernmentRowLink>
                      </td>
                    </>
                  )}

                  {/* Mil/Research — hidden on mobile */}
                  <td className={`p-2 text-right hidden md:table-cell ${
                    medicalResearchRatio !== null && medicalResearchRatio >= 100
                      ? "text-brutal-red" : ""
                  }`}>
                    <GovernmentRowLink href={detailHref} className="text-right">
                      <span className="text-sm font-black">
                        {medicalResearchRatio !== null ? formatRatio(medicalResearchRatio) : "—"}
                      </span>
                    </GovernmentRowLink>
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
