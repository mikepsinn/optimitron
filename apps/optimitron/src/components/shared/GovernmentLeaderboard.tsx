"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  type GovernmentMetrics,
  getGovernmentsByHALE,
} from "@optimitron/data/datasets/government-report-cards";
import {
  getMilitarySpendingPerCapitaPPP,
  getMilitaryToGovernmentClinicalTrialRatio,
  getMilitaryToGovernmentMedicalResearchRatio,
} from "@optimitron/data/datasets/government-spending-ratios";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { Popover } from "@/components/retroui/Popover";
import { Checkbox } from "@/components/retroui/Checkbox";
import { Select } from "@/components/retroui/Select";
import { SpendingBar } from "@/components/ui/spending-bar";
import { ColumnHelp } from "@/components/ui/column-help";
import {
  GOVERNMENT_LEADERBOARD_COLUMN_META,
  GOVERNMENT_LEADERBOARD_COLUMN_ORDER,
  GOVERNMENT_LEADERBOARD_COLUMN_VISIBILITY,
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

function getSortValue(
  gov: GovernmentMetrics,
  key: SortKey,
  memorialAttributionsByCountry?: Record<string, number>,
): number {
  switch (key) {
    case "country": return 0;
    case "rank":
      return getMilitaryToGovernmentClinicalTrialRatio(gov) ?? 999_999_999;
    case "killed": return gov.militaryDeathsCaused.value;
    case "hale": return gov.hale?.value ?? 0;
    case "lifeExpectancy": return gov.lifeExpectancy.value;
    case "medianIncome": return gov.medianIncome?.value ?? (gov.gdpPerCapita.value - gov.governmentSpendingPerCapita.value);
    case "militaryPerCapitaPPP":
      return getMilitarySpendingPerCapitaPPP(gov) ?? 0;
    case "militarySpending": return gov.militarySpendingAnnual.value;
    case "healthSpending": return gov.healthSpendingPerCapita.value;
    case "trialRatio":
      return getMilitaryToGovernmentClinicalTrialRatio(gov) ?? 999_999_999;
    case "researchRatio":
      return getMilitaryToGovernmentMedicalResearchRatio(gov) ?? 999_999_999;
    case "memorialDeaths":
      return memorialAttributionsByCountry?.[gov.code] ?? 0;
  }
}

type RankMode = "worst" | "least-bad";

interface GovernmentLeaderboardProps {
  /** Max rows to show (default: all) */
  limit?: number;
  /** Show compact version (fewer columns) */
  compact?: boolean;
  /**
   * Per-government memorial counts, keyed by ISO country code. When provided,
   * the "Memorial 👻" column is rendered and sortable. Fetched server-side via
   * `getMemorialAttributionsByGovernment` from `lib/prosecution-data.server.ts`.
   */
  memorialAttributionsByCountry?: Record<string, number>;
  /**
   * ISO country codes whose 1% Treaty signer task is verified. Omit when the
   * server cannot load treaty signer status.
   */
  signedCountryCodes?: string[];
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
      className={`block -m-3 p-3 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}

type ColumnVisibilityOverride = "default" | "show" | "hide";

function getColumnVisibility(
  key: SortKey,
  compact: boolean,
  overrides: Partial<Record<SortKey, ColumnVisibilityOverride>>,
): { visible: boolean; className: string } {
  const config = GOVERNMENT_LEADERBOARD_COLUMN_VISIBILITY[key];
  const override = overrides[key] ?? "default";

  if (compact && config.compactHidden && override !== "show") {
    return { visible: false, className: "" };
  }

  switch (override) {
    case "show":
      return { visible: true, className: "table-cell" };
    case "hide":
      return { visible: false, className: "" };
    default:
      return { visible: true, className: config.defaultHiddenClass };
  }
}

function ColumnPicker({
  compact,
  overrides,
  onToggle,
}: {
  compact: boolean;
  overrides: Partial<Record<SortKey, ColumnVisibilityOverride>>;
  onToggle: (key: SortKey) => void;
}) {
  return (
    <Popover>
      <Popover.Trigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-xs font-black uppercase gap-1.5"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Columns
        </Button>
      </Popover.Trigger>
      <Popover.Content align="end" className="w-56 border-2 border-primary p-3">
        <p className="text-xs font-black uppercase text-muted-foreground mb-2">
          Toggle Columns
        </p>
        <div className="flex flex-col gap-1">
          {GOVERNMENT_LEADERBOARD_COLUMN_ORDER.filter(
            (key) => GOVERNMENT_LEADERBOARD_COLUMN_VISIBILITY[key].toggleable,
          ).map((key) => {
            const meta = GOVERNMENT_LEADERBOARD_COLUMN_META[key];
            const config = GOVERNMENT_LEADERBOARD_COLUMN_VISIBILITY[key];
            const override = overrides[key] ?? "default";
            const isChecked =
              override === "show" ||
              (override === "default" && !(compact && config.compactHidden));

            return (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer py-1 px-1 hover:bg-muted transition-colors"
              >
                <Checkbox
                  size="sm"
                  variant="solid"
                  checked={isChecked}
                  onCheckedChange={() => onToggle(key)}
                />
                <span className="text-sm font-bold text-foreground">
                  {meta.label}
                </span>
              </label>
            );
          })}
        </div>
      </Popover.Content>
    </Popover>
  );
}

const COLUMN_HELP_TEXT: Record<string, string> = {
  country: "Country name. Click to sort alphabetically.",
  trialRatio: "Military spending per $1 of government clinical trial spending. Higher = worse.",
  rank: "Current table rank based on the default Mil/Trials ranking.",
  killed: "Estimated total people killed by that government's military actions.",
  hale: "Healthy life expectancy at birth: expected years lived in full health.",
  lifeExpectancy: "Total life expectancy at birth, including years with illness or disability.",
  medianIncome: "After-tax median disposable income (PPP). What a typical citizen actually takes home.",
  militaryPerCapitaPPP: "Military spending per person in PPP terms.",
  militarySpending: "Annual military spending in USD.",
  healthSpending: "Annual health spending per person.",
  researchRatio: "Military spending per $1 of total government medical research spending.",
};

const MOBILE_SORT_KEY_ORDER: SortKey[] = [
  "trialRatio",
  "killed",
  "militarySpending",
  "memorialDeaths",
  "hale",
  "medianIncome",
  "lifeExpectancy",
  "militaryPerCapitaPPP",
  "healthSpending",
  "researchRatio",
  "country",
];

const MOBILE_DETAIL_KEY_ORDER: SortKey[] = [
  "trialRatio",
  "killed",
  "militarySpending",
  "memorialDeaths",
  "hale",
  "lifeExpectancy",
  "medianIncome",
  "militaryPerCapitaPPP",
  "healthSpending",
  "researchRatio",
];

function getAvailableMetricKeys(
  memorialAttributionsByCountry?: Record<string, number>,
): SortKey[] {
  return MOBILE_DETAIL_KEY_ORDER.filter(
    (key) => key !== "memorialDeaths" || memorialAttributionsByCountry != null,
  );
}

function getAvailableSortKeys(
  memorialAttributionsByCountry?: Record<string, number>,
): SortKey[] {
  return MOBILE_SORT_KEY_ORDER.filter(
    (key) => key !== "memorialDeaths" || memorialAttributionsByCountry != null,
  );
}

function getMobilePrimaryMetricKey(
  sortKey: SortKey,
  memorialAttributionsByCountry?: Record<string, number>,
): SortKey {
  if (
    sortKey !== "country" &&
    sortKey !== "rank" &&
    (sortKey !== "memorialDeaths" || memorialAttributionsByCountry != null)
  ) {
    return sortKey;
  }

  return GOVERNMENT_LEADERBOARD_DEFAULT_SORT_KEY;
}

function getMetricValueText(
  gov: GovernmentMetrics,
  key: SortKey,
  memorialAttributionsByCountry?: Record<string, number>,
): string {
  const income =
    gov.medianIncome?.value ??
    (gov.gdpPerCapita.value - gov.governmentSpendingPerCapita.value);

  switch (key) {
    case "country":
      return gov.name;
    case "rank":
      return formatRatio(getMilitaryToGovernmentClinicalTrialRatio(gov) ?? 0);
    case "killed":
      return gov.militaryDeathsCaused.value.toLocaleString();
    case "hale":
      return gov.hale?.value.toFixed(1) ?? "—";
    case "lifeExpectancy":
      return gov.lifeExpectancy.value.toFixed(1);
    case "medianIncome":
      return formatUSD(income);
    case "militaryPerCapitaPPP": {
      const value = getMilitarySpendingPerCapitaPPP(gov);
      return value !== null ? formatUSD(value) : "—";
    }
    case "militarySpending":
      return formatUSD(gov.militarySpendingAnnual.value);
    case "healthSpending":
      return formatUSD(gov.healthSpendingPerCapita.value);
    case "trialRatio": {
      const value = getMilitaryToGovernmentClinicalTrialRatio(gov);
      return value !== null ? formatRatio(value) : "—";
    }
    case "researchRatio": {
      const value = getMilitaryToGovernmentMedicalResearchRatio(gov);
      return value !== null ? formatRatio(value) : "—";
    }
    case "memorialDeaths":
      return (memorialAttributionsByCountry?.[gov.code] ?? 0).toLocaleString();
  }
}

function GovernmentMobileSort({
  sortKey,
  onSortKeyChange,
  memorialAttributionsByCountry,
}: {
  sortKey: SortKey;
  onSortKeyChange: (key: SortKey) => void;
  memorialAttributionsByCountry?: Record<string, number>;
}) {
  const sortId = useId();
  const options = getAvailableSortKeys(memorialAttributionsByCountry);
  const selectedSortKey = options.includes(sortKey)
    ? sortKey
    : GOVERNMENT_LEADERBOARD_DEFAULT_SORT_KEY;

  return (
    <div className="flex w-full flex-col gap-1 lg:hidden">
      <label
        htmlFor={sortId}
        className="text-xs font-black uppercase text-muted-foreground"
      >
        Sort by
      </label>
      <Select
        value={selectedSortKey}
        onValueChange={(value) => onSortKeyChange(value as SortKey)}
      >
        <Select.Trigger
          id={sortId}
          className="h-10 w-full rounded-none border-2 border-primary bg-background text-sm font-black uppercase text-foreground"
        >
          <Select.Value />
        </Select.Trigger>
        <Select.Content className="border-2 border-primary">
          {options.map((key) => (
            <Select.Item
              key={key}
              value={key}
              className="text-sm font-bold text-foreground"
            >
              {GOVERNMENT_LEADERBOARD_COLUMN_META[key].label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  );
}

function GovernmentMobileRows({
  govs,
  sortKey,
  memorialAttributionsByCountry,
  signedCountryCodes,
}: {
  govs: GovernmentMetrics[];
  sortKey: SortKey;
  memorialAttributionsByCountry?: Record<string, number>;
  signedCountryCodes?: string[];
}) {
  const primaryMetricKey = getMobilePrimaryMetricKey(
    sortKey,
    memorialAttributionsByCountry,
  );
  const detailMetricKeys = getAvailableMetricKeys(memorialAttributionsByCountry);
  const signedCountryCodeSet = useMemo(
    () => new Set(signedCountryCodes?.map((code) => code.toUpperCase()) ?? []),
    [signedCountryCodes],
  );
  const hasTreatyStatus = signedCountryCodes != null;

  return (
    <div className="space-y-2 lg:hidden">
      {govs.map((gov, index) => {
        const detailHref = `/governments/${gov.code}`;
        const treatySigned = signedCountryCodeSet.has(gov.code.toUpperCase());

        return (
          <details
            key={gov.code}
            className="group border-2 border-primary bg-background text-foreground"
          >
            <summary className="cursor-pointer list-none px-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-xs font-black text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="shrink-0 text-lg leading-none">{gov.flag}</span>
                    <span className="truncate text-sm font-black text-foreground">
                      {gov.name}
                    </span>
                  </div>
                  {hasTreatyStatus && (
                    <p className="mt-1 text-xs font-black uppercase text-muted-foreground">
                      Treaty: {treatySigned ? "Signed" : "Unsigned"}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[0.65rem] font-black uppercase text-muted-foreground">
                    {GOVERNMENT_LEADERBOARD_COLUMN_META[primaryMetricKey].label}
                  </div>
                  <div className="text-sm font-black text-foreground">
                    {getMetricValueText(
                      gov,
                      primaryMetricKey,
                      memorialAttributionsByCountry,
                    )}
                  </div>
                </div>
                <ChevronDown
                  aria-hidden="true"
                  className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                />
              </div>
            </summary>

            <div className="border-t-2 border-primary px-3 py-3">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                {hasTreatyStatus && (
                  <div>
                    <dt className="text-[0.65rem] font-black uppercase text-muted-foreground">
                      1% Treaty
                    </dt>
                    <dd className="text-sm font-black text-foreground">
                      {treatySigned ? "Signed" : "Unsigned"}
                    </dd>
                  </div>
                )}
                {detailMetricKeys.map((key) => (
                  <div key={key}>
                    <dt className="text-[0.65rem] font-black uppercase text-muted-foreground">
                      {GOVERNMENT_LEADERBOARD_COLUMN_META[key].label}
                    </dt>
                    <dd className="text-sm font-black text-foreground">
                      {getMetricValueText(
                        gov,
                        key,
                        memorialAttributionsByCountry,
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <Link
                href={detailHref}
                className="mt-3 inline-flex border-2 border-primary px-3 py-2 text-xs font-black uppercase text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Open report card
              </Link>
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function GovernmentLeaderboard({
  limit,
  compact = false,
  memorialAttributionsByCountry,
  signedCountryCodes,
}: GovernmentLeaderboardProps) {
  const [rankMode, setRankMode] = useState<RankMode>("worst");
  const [sortKey, setSortKey] = useState<SortKey>(
    GOVERNMENT_LEADERBOARD_DEFAULT_SORT_KEY,
  );
  const [sortAsc, setSortAsc] = useState(
    GOVERNMENT_LEADERBOARD_DEFAULT_SORT_ASC,
  );
  const [search, setSearch] = useState("");
  const [columnOverrides, setColumnOverrides] = useState<
    Partial<Record<SortKey, ColumnVisibilityOverride>>
  >({});

  const colVis = useMemo(() => {
    const result = {} as Record<SortKey, { visible: boolean; className: string }>;
    for (const key of GOVERNMENT_LEADERBOARD_COLUMN_ORDER) {
      result[key] = getColumnVisibility(key, compact, columnOverrides);
    }
    return result;
  }, [compact, columnOverrides]);

  const handleColumnToggle = (key: SortKey) => {
    setColumnOverrides((prev) => {
      const current = prev[key] ?? "default";
      const config = GOVERNMENT_LEADERBOARD_COLUMN_VISIBILITY[key];
      const isDefaultVisible = !(compact && config.compactHidden);
      const isCurrentlyVisible =
        current === "show" || (current === "default" && isDefaultVisible);

      let next: ColumnVisibilityOverride;
      if (isCurrentlyVisible) {
        next = isDefaultVisible ? "hide" : "default";
      } else {
        next = isDefaultVisible ? "default" : "show";
      }

      return { ...prev, [key]: next };
    });
  };

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
    () => Math.max(...allGovs.map((g) => g.medianIncome?.value ?? (g.gdpPerCapita.value - g.governmentSpendingPerCapita.value)), 1),
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
    const diff =
      getSortValue(b, sortKey, memorialAttributionsByCountry) -
      getSortValue(a, sortKey, memorialAttributionsByCountry);
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

  const handleMobileSort = (key: SortKey) => {
    setSortKey(key);
    if (key === "country") {
      setSortAsc(true);
    } else if (key !== "trialRatio" && key !== "rank") {
      setSortAsc(false);
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
    <div className="bg-background text-foreground border-0 sm:border-4 sm:border-primary p-0 sm:p-4 sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {/* Rank mode toggle + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-2 gap-2 sm:gap-4">
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Button
            size="sm"
            variant={rankMode === "worst" ? "default" : "outline"}
            onClick={() => handleRankMode("worst")}
            className="w-full text-xs font-black uppercase sm:w-auto"
          >
            Worst Governments
          </Button>
          <Button
            size="sm"
            variant={rankMode === "least-bad" ? "default" : "outline"}
            onClick={() => handleRankMode("least-bad")}
            className="w-full text-xs font-black uppercase sm:w-auto"
          >
            Least Bad Governments
          </Button>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto lg:flex-row lg:items-end">
          <GovernmentMobileSort
            sortKey={sortKey}
            onSortKeyChange={handleMobileSort}
            memorialAttributionsByCountry={memorialAttributionsByCountry}
          />
          <div className="hidden lg:block">
            <ColumnPicker
              compact={compact}
              overrides={columnOverrides}
              onToggle={handleColumnToggle}
            />
          </div>
          <input
            type="text"
            placeholder="Search country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-2 border-primary bg-background px-3 py-1 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground flex-1 sm:w-48"
          />
        </div>
      </div>
      <p className="text-xs font-bold text-muted-foreground mb-3">
        Ranked by military-to-clinical-trials spending ratio, then total military spend, then least clinical trial funding.
      </p>

      <GovernmentMobileRows
        govs={govs}
        sortKey={sortKey}
        memorialAttributionsByCountry={memorialAttributionsByCountry}
        signedCountryCodes={signedCountryCodes}
      />

      {/* Table */}
      <div className="hidden overflow-x-auto border-2 border-primary lg:block">
        <table className="w-full">
          <thead>
            <tr className="border-b-4 border-primary">
              {colVis.rank.visible && (
                <th className={`${hdrClass} w-8 ${colVis.rank.className}`} onClick={() => handleSort("rank")}>
                  #{indicator("rank")}<ColumnHelp text={COLUMN_HELP_TEXT.rank!} />
                </th>
              )}
              <th
                className={`${hdrClass} text-left sticky left-0 z-30 bg-background border-r-4 border-primary min-w-[8rem]`}
                onClick={() => handleSort("country")}
              >
                Country{indicator("country")}<ColumnHelp text={COLUMN_HELP_TEXT.country!} />
              </th>
              {colVis.militarySpending.visible && (
                <th className={`${hdrClass} text-right ${colVis.militarySpending.className}`} onClick={() => handleSort("militarySpending")}>
                  Military{indicator("militarySpending")}<ColumnHelp text={COLUMN_HELP_TEXT.militarySpending!} />
                </th>
              )}
              {colVis.killed.visible && (
                <th className={`${hdrClass} text-right ${colVis.killed.className}`} onClick={() => handleSort("killed")}>
                  Killed{indicator("killed")}<ColumnHelp text={COLUMN_HELP_TEXT.killed!} />
                </th>
              )}
              {colVis.trialRatio.visible && (
                <th className={`${hdrClass} text-right ${colVis.trialRatio.className}`} onClick={() => handleSort("trialRatio")}>
                  Mil/Trials{indicator("trialRatio")}<ColumnHelp text={COLUMN_HELP_TEXT.trialRatio!} />
                </th>
              )}
              {colVis.memorialDeaths.visible && memorialAttributionsByCountry && (
                <th className={`${hdrClass} text-right ${colVis.memorialDeaths.className}`} onClick={() => handleSort("memorialDeaths")}>
                  Memorial 👻{indicator("memorialDeaths")}<ColumnHelp text="Public memorials in the Invisible Graveyard attributed to this government." />
                </th>
              )}
              {colVis.hale.visible && (
                <th className={`${hdrClass} text-right ${colVis.hale.className}`} onClick={() => handleSort("hale")}>
                  HALE{indicator("hale")}<ColumnHelp text={COLUMN_HELP_TEXT.hale!} />
                </th>
              )}
              {colVis.lifeExpectancy.visible && (
                <th className={`${hdrClass} text-right ${colVis.lifeExpectancy.className}`} onClick={() => handleSort("lifeExpectancy")}>
                  Life Exp{indicator("lifeExpectancy")}<ColumnHelp text={COLUMN_HELP_TEXT.lifeExpectancy!} />
                </th>
              )}
              {colVis.medianIncome.visible && (
                <th className={`${hdrClass} text-right ${colVis.medianIncome.className}`} onClick={() => handleSort("medianIncome")}>
                  Median Income{indicator("medianIncome")}<ColumnHelp text={COLUMN_HELP_TEXT.medianIncome!} />
                </th>
              )}
              {colVis.militaryPerCapitaPPP.visible && (
                <th className={`${hdrClass} text-right ${colVis.militaryPerCapitaPPP.className}`} onClick={() => handleSort("militaryPerCapitaPPP")}>
                  Mil/cap PPP{indicator("militaryPerCapitaPPP")}<ColumnHelp text={COLUMN_HELP_TEXT.militaryPerCapitaPPP!} />
                </th>
              )}
              {colVis.healthSpending.visible && (
                <th className={`${hdrClass} text-right ${colVis.healthSpending.className}`} onClick={() => handleSort("healthSpending")}>
                  Health/cap{indicator("healthSpending")}<ColumnHelp text={COLUMN_HELP_TEXT.healthSpending!} />
                </th>
              )}
              {colVis.researchRatio.visible && (
                <th className={`${hdrClass} text-right ${colVis.researchRatio.className}`} onClick={() => handleSort("researchRatio")}>
                  Mil/Research{indicator("researchRatio")}<ColumnHelp text={COLUMN_HELP_TEXT.researchRatio!} />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {govs.map((gov, i) => {
              const clinicalTrialRatio = getMilitaryToGovernmentClinicalTrialRatio(gov);
              const medicalResearchRatio = getMilitaryToGovernmentMedicalResearchRatio(gov);
              const militaryPerCapitaPPP = getMilitarySpendingPerCapitaPPP(gov);
              const income = gov.medianIncome?.value ?? (gov.gdpPerCapita.value - gov.governmentSpendingPerCapita.value);
              const detailHref = `/governments/${gov.code}`;
              return (
                <tr
                  key={gov.code}
                  className="group border-b border-primary last:border-b-0 hover:bg-muted transition-colors"
                >
                  {colVis.rank.visible && (
                    <td className={`p-2 text-xs font-bold text-muted-foreground ${colVis.rank.className}`}>
                      {i + 1}
                    </td>
                  )}

                  <td className="p-2 sticky left-0 z-10 bg-background group-hover:bg-muted border-r-4 border-primary">
                    <GovernmentRowLink href={detailHref}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg leading-none">{gov.flag}</span>
                        <span className="font-black text-foreground text-sm">{gov.name}</span>
                      </div>
                    </GovernmentRowLink>
                  </td>

                  {colVis.militarySpending.visible && (
                    <td className={`p-2 text-right min-w-[100px] ${colVis.militarySpending.className}`}>
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
                  )}

                  {colVis.killed.visible && (
                    <td className={`p-2 text-right min-w-[100px] ${colVis.killed.className}`}>
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
                  )}

                  {colVis.trialRatio.visible && (
                    <td className={`p-2 text-right min-w-[80px] sm:min-w-[110px] ${colVis.trialRatio.className}`}>
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
                  )}

                  {colVis.memorialDeaths.visible && memorialAttributionsByCountry && (
                    <td className={`p-2 text-right min-w-[80px] ${colVis.memorialDeaths.className}`}>
                      <GovernmentRowLink href={detailHref} className="text-right">
                        <div className="text-sm font-black text-foreground tabular-nums">
                          {(memorialAttributionsByCountry[gov.code] ?? 0).toLocaleString()}
                        </div>
                      </GovernmentRowLink>
                    </td>
                  )}

                  {colVis.hale.visible && (
                    <td className={`p-2 text-right min-w-[80px] ${colVis.hale.className}`}>
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
                  )}

                  {colVis.lifeExpectancy.visible && (
                    <td className={`p-2 text-right ${colVis.lifeExpectancy.className}`}>
                      <GovernmentRowLink href={detailHref} className="text-right">
                        <span className="text-sm font-bold text-foreground">
                          {gov.lifeExpectancy.value.toFixed(1)}
                        </span>
                      </GovernmentRowLink>
                    </td>
                  )}

                  {colVis.medianIncome.visible && (
                    <td className={`p-2 text-right min-w-[80px] ${colVis.medianIncome.className}`}>
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
                  )}

                  {colVis.militaryPerCapitaPPP.visible && (
                    <td className={`p-2 text-right ${colVis.militaryPerCapitaPPP.className}`}>
                      <GovernmentRowLink href={detailHref} className="text-right">
                        <span className="text-sm font-bold text-foreground">
                          {militaryPerCapitaPPP !== null ? formatUSD(militaryPerCapitaPPP) : "—"}
                        </span>
                      </GovernmentRowLink>
                    </td>
                  )}

                  {colVis.healthSpending.visible && (
                    <td className={`p-2 text-right ${colVis.healthSpending.className}`}>
                      <GovernmentRowLink href={detailHref} className="text-right">
                        <span className="text-sm font-bold text-foreground">
                          {formatUSD(gov.healthSpendingPerCapita.value)}
                        </span>
                      </GovernmentRowLink>
                    </td>
                  )}

                  {colVis.researchRatio.visible && (
                    <td className={`p-2 text-right ${colVis.researchRatio.className} ${
                      medicalResearchRatio !== null && medicalResearchRatio >= 100
                        ? "text-brutal-red" : ""
                    }`}>
                      <GovernmentRowLink href={detailHref} className="text-right">
                        <span className="text-sm font-black">
                          {medicalResearchRatio !== null ? formatRatio(medicalResearchRatio) : "—"}
                        </span>
                      </GovernmentRowLink>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
