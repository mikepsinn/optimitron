"use client";

import { useMemo, useState } from "react";
import type { FoundationContractorTarget } from "@/lib/foundations/contractor-targets";

const ORGANIZATION_THRESHOLD = 1000;
const DEFAULT_ORGANIZATIONS = 100;
const DEFAULT_SHARE_COST_USD = 400;
const DEFAULT_PIVOTAL_DENOMINATOR = 5000;

const currency = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "USD",
});

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    style: "currency",
  }).format(value);
}

const compactNumber = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  notation: "compact",
});

const wholeNumber = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function formatCostPerDaly(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "$0";
  }

  if (value < 1) {
    return new Intl.NumberFormat("en-US", {
      currency: "USD",
      maximumSignificantDigits: 3,
      style: "currency",
    }).format(value);
  }

  return currency.format(value);
}

const percent = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  style: "percent",
});

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function parseInputNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function CalculatorStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="border border-foreground p-4">
      <p className="text-xs font-bold uppercase leading-5 text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold leading-tight">{value}</p>
      {note ? <p className="mt-2 text-xs font-bold leading-5">{note}</p> : null}
    </div>
  );
}

export function LoveLetterCalculator({
  targets,
  totalDalys,
  totalLivesSaved,
}: {
  targets: readonly FoundationContractorTarget[];
  totalDalys: number;
  totalLivesSaved: number;
}) {
  const [organizations, setOrganizations] = useState(DEFAULT_ORGANIZATIONS);
  const [shareCostUsd, setShareCostUsd] = useState(DEFAULT_SHARE_COST_USD);
  const [pivotalDenominator, setPivotalDenominator] = useState(
    DEFAULT_PIVOTAL_DENOMINATOR,
  );
  const [selectedTargetIds, setSelectedTargetIds] = useState<Set<string>>(
    () => new Set(targets.slice(0, 3).map((target) => target.id)),
  );

  const totals = useMemo(() => {
    const selectedTargets = targets.filter((target) =>
      selectedTargetIds.has(target.id),
    );
    const targetCount = Math.max(selectedTargets.length, 1);
    const letterCount = organizations * targetCount;
    const shareCount = letterCount;
    const shareBudgetUsd = shareCount * shareCostUsd;
    const totalTargetWeight = targets.reduce(
      (sum, target) => sum + target.lobbyingWeight,
      0,
    );
    const selectedTargetWeight = selectedTargets.reduce(
      (sum, target) => sum + target.lobbyingWeight,
      0,
    );
    const targetCoverage =
      totalTargetWeight > 0 ? selectedTargetWeight / totalTargetWeight : 0;
    const thresholdProgress = clampNumber(
      organizations / ORGANIZATION_THRESHOLD,
      0,
      1,
    );
    const pivotalChance = 1 / Math.max(pivotalDenominator, 1);
    const expectedDalys =
      totalDalys * thresholdProgress * targetCoverage * pivotalChance;
    const expectedLivesSaved =
      totalLivesSaved * thresholdProgress * targetCoverage * pivotalChance;
    const expectedCostPerDaly =
      expectedDalys > 0 ? shareBudgetUsd / expectedDalys : 0;

    return {
      expectedCostPerDaly,
      expectedDalys,
      expectedLivesSaved,
      letterCount,
      selectedTargets,
      shareBudgetUsd,
      shareCount,
      targetCoverage,
      thresholdProgress,
    };
  }, [
    organizations,
    pivotalDenominator,
    selectedTargetIds,
    shareCostUsd,
    targets,
    totalDalys,
    totalLivesSaved,
  ]);

  function toggleTarget(targetId: string) {
    setSelectedTargetIds((current) => {
      const next = new Set(current);

      if (next.has(targetId)) {
        next.delete(targetId);
      } else {
        next.add(targetId);
      }

      return next.size > 0 ? next : current;
    });
  }

  return (
    <div className="space-y-6 border border-foreground p-4 sm:p-5">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase leading-5 text-muted-foreground">
          Love-letter calculator
        </p>
        <h3 className="text-2xl font-bold uppercase leading-tight sm:text-3xl">
          How many shares and letters?
        </h3>
        <p className="max-w-3xl text-sm font-bold leading-6 text-muted-foreground sm:text-base sm:leading-7">
          This assumes the first real milestone is 1,000 organizations. Below
          that, it scales expected value linearly. That is probably too kind at
          tiny counts, but it makes the assumption visible instead of hiding it
          in a spreadsheet.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="block text-xs font-bold uppercase leading-5 text-muted-foreground">
            Organizations
          </span>
          <input
            className="w-full border border-foreground bg-background px-3 py-2 text-base font-bold text-foreground"
            inputMode="numeric"
            min={1}
            type="number"
            value={organizations}
            onChange={(event) =>
              setOrganizations(
                clampNumber(
                  parseInputNumber(
                    event.currentTarget.value,
                    DEFAULT_ORGANIZATIONS,
                  ),
                  1,
                  10000,
                ),
              )
            }
          />
        </label>
        <label className="space-y-2">
          <span className="block text-xs font-bold uppercase leading-5 text-muted-foreground">
            Share cost assumption
          </span>
          <input
            className="w-full border border-foreground bg-background px-3 py-2 text-base font-bold text-foreground"
            inputMode="decimal"
            min={1}
            type="number"
            value={shareCostUsd}
            onChange={(event) =>
              setShareCostUsd(
                clampNumber(
                  parseInputNumber(
                    event.currentTarget.value,
                    DEFAULT_SHARE_COST_USD,
                  ),
                  1,
                  100000,
                ),
              )
            }
          />
        </label>
        <label className="space-y-2">
          <span className="block text-xs font-bold uppercase leading-5 text-muted-foreground">
            Pivotal chance
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">1 in</span>
            <input
              className="min-w-0 flex-1 border border-foreground bg-background px-3 py-2 text-base font-bold text-foreground"
              inputMode="numeric"
              min={1}
              type="number"
              value={pivotalDenominator}
              onChange={(event) =>
                setPivotalDenominator(
                  clampNumber(
                    parseInputNumber(
                      event.currentTarget.value,
                      DEFAULT_PIVOTAL_DENOMINATOR,
                    ),
                    1,
                    100000000,
                  ),
                )
              }
            />
          </div>
        </label>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase leading-5 text-muted-foreground">
          Contractor targets
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {targets.map((target) => {
            const selected = selectedTargetIds.has(target.id);

            return (
              <label
                className="flex cursor-pointer items-center justify-between gap-3 border border-foreground p-3 text-sm font-bold"
                key={target.id}
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold">
                    {target.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {target.ticker} priority {target.lobbyingWeight}/10
                  </span>
                </span>
                <input
                  checked={selected}
                  className="h-5 w-5 shrink-0 accent-foreground"
                  type="checkbox"
                  onChange={() => toggleTarget(target.id)}
                />
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <CalculatorStat
          label="Letters"
          value={wholeNumber.format(totals.letterCount)}
          note={`${wholeNumber.format(totals.shareCount)} donated shares`}
        />
        <CalculatorStat
          label="Share budget"
          value={formatCurrency(totals.shareBudgetUsd)}
          note={`${formatCurrency(shareCostUsd)} per share assumption`}
        />
        <CalculatorStat
          label="1,000-org threshold"
          value={percent.format(totals.thresholdProgress)}
          note={`${wholeNumber.format(organizations)} organizations equipped`}
        />
        <CalculatorStat
          label="Expected DALYs avoided"
          value={compactNumber.format(totals.expectedDalys)}
          note={`After target coverage, 1 in ${wholeNumber.format(
            pivotalDenominator,
          )} chance this is pivotal`}
        />
        <CalculatorStat
          label="Expected lives saved"
          value={compactNumber.format(totals.expectedLivesSaved)}
          note="Discounted by selected contractor coverage"
        />
        <CalculatorStat
          label="Expected cost per DALY"
          value={formatCostPerDaly(totals.expectedCostPerDaly)}
          note={`${percent.format(
            totals.targetCoverage,
          )} of this target list selected`}
        />
      </div>

      <p className="text-xs font-bold leading-5 text-muted-foreground">
        One share gives an organization standing to write the board. It does not
        control the company. The point is to make the board analyze the
        shareholder case on the record, then repeat that pressure from enough
        independent organizations that ignoring it becomes more annoying than
        reading the math.
      </p>
    </div>
  );
}
