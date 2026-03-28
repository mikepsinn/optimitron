"use client";

import { SlideBase } from "../slide-base";
import { useEffect, useState } from "react";
import {
  getGovernmentsByHALE,
  type GovernmentMetrics,
} from "@optimitron/data/datasets/government-report-cards";

const allCountries = getGovernmentsByHALE().filter((g) => g.hale?.value);
const TOP_N = 10;

interface LeaderboardRow {
  rank: number;
  name: string;
  flag: string;
  code: string;
  hale: number;
  income: number | null;
  milTrialsRatio: number | null;
  milSpending: number;
}

function computeMilTrialsRatio(g: GovernmentMetrics): number | null {
  const mil = g.militarySpendingAnnual.value;
  const trials = g.clinicalTrialSpending?.value;
  if (!trials || trials === 0) return null;
  return Math.round(mil / trials);
}

function toRow(g: GovernmentMetrics, rank: number): LeaderboardRow {
  return {
    rank,
    name: g.name,
    flag: g.flag,
    code: g.code,
    hale: g.hale!.value,
    income: g.medianIncome?.value ?? null,
    milTrialsRatio: computeMilTrialsRatio(g),
    milSpending: g.militarySpendingAnnual.value,
  };
}

const topRows = allCountries.slice(0, TOP_N).map((g, i) => toRow(g, i + 1));
const usInTop = topRows.some((r) => r.code === "US");
const usCountry = allCountries.find((g) => g.code === "US");
const usGlobalRank = allCountries.findIndex((g) => g.code === "US") + 1;

const displayRows = usInTop
  ? topRows
  : [...topRows, ...(usCountry ? [toRow(usCountry, usGlobalRank)] : [])];

function formatCompact(val: number): string {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(0)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  return `$${val.toLocaleString()}`;
}

function formatRatio(ratio: number | null): string {
  if (ratio === null) return "—";
  if (ratio >= 10000) return `${(ratio / 1000).toFixed(0)}K:1`;
  return `${ratio.toLocaleString()}:1`;
}

function formatIncome(val: number | null): string {
  if (val === null) return "—";
  return `$${Math.round(val).toLocaleString()}`;
}

export function SlideHaleLeaderboardByCountry() {
  const [animatedHale, setAnimatedHale] = useState<number[]>(
    displayRows.map(() => 0)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedHale((prev) =>
        prev.map((val, i) => {
          const target = displayRows[i].hale;
          if (val >= target) return target;
          return Math.min(val + target / 20, target);
        })
      );
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <SlideBase act={2} className="text-cyan-400">
      <div className="text-center mb-4">
        <div className="font-pixel text-xl text-cyan-400 mb-1">PART 4: ACCOUNTABILITY</div>
        <h1 className="font-pixel text-3xl md:text-4xl text-cyan-400">
          GOVERNMENT LEADERBOARD
        </h1>
        <div className="font-terminal text-xl text-zinc-200 mt-2">
          Ranked by Healthy Life Expectancy (HALE)
        </div>
      </div>

      <div className="w-full max-w-[1700px] mx-auto">
        <div className="bg-black/40 border border-cyan-500/30 rounded overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-cyan-500/10 border-b border-cyan-500/30">
            <div className="col-span-1 font-pixel text-xl text-cyan-400">#</div>
            <div className="col-span-3 font-pixel text-xl text-cyan-400">COUNTRY</div>
            <div className="col-span-2 font-pixel text-xl text-cyan-400">HALE</div>
            <div className="col-span-2 font-pixel text-xl text-cyan-400">INCOME</div>
            <div className="col-span-2 font-pixel text-xl text-cyan-400">MIL:TRIALS</div>
            <div className="col-span-2 font-pixel text-xl text-cyan-400">MIL $/YR</div>
          </div>

          {/* Rows */}
          {displayRows.map((row, i) => {
            const isUS = row.code === "US";
            const isGapRow = !usInTop && isUS;
            return (
              <div key={row.code}>
                {isGapRow && (
                  <div className="border-t-2 border-dashed border-red-500/30 mx-4 my-1" />
                )}
                <div
                  className={`grid grid-cols-12 gap-2 px-4 py-1.5 border-b border-zinc-800/50 items-center ${
                    isUS
                      ? "bg-red-500/10 border-l-4 border-l-red-500"
                      : i === 0
                      ? "bg-amber-500/10"
                      : i < 3
                      ? "bg-cyan-500/5"
                      : ""
                  }`}
                >
                  <div className="col-span-1">
                    <span
                      className={`font-pixel text-xl ${
                        row.rank === 1 ? "text-amber-400"
                          : row.rank === 2 ? "text-zinc-300"
                          : row.rank === 3 ? "text-amber-600"
                          : isUS ? "text-red-400"
                          : "text-zinc-200"
                      }`}
                    >
                      {row.rank}
                    </span>
                  </div>

                  <div className="col-span-3 flex items-center gap-2">
                    <span className="text-xl">{row.flag}</span>
                    <span className={`font-pixel text-xl truncate ${isUS ? "text-red-400" : "text-zinc-300"}`}>
                      {row.name}
                    </span>
                    {isUS && (
                      <span className="font-pixel text-xs text-red-400 bg-red-500/20 px-1 rounded">YOU</span>
                    )}
                  </div>

                  <div className="col-span-2">
                    <span className={`font-pixel text-xl ${isUS ? "text-red-400" : "text-emerald-400"}`}>
                      {animatedHale[i].toFixed(1)} yr
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className={`font-pixel text-xl ${isUS ? "text-red-400" : "text-zinc-200"}`}>
                      {formatIncome(row.income)}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`font-pixel text-xl ${
                        row.milTrialsRatio === null ? "text-zinc-500"
                          : row.milTrialsRatio > 500 ? "text-red-400"
                          : row.milTrialsRatio > 100 ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {formatRatio(row.milTrialsRatio)}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className={`font-pixel text-xl ${isUS ? "text-red-400" : "text-zinc-400"}`}>
                      {formatCompact(row.milSpending)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div className="bg-black/30 border border-zinc-800 p-3 rounded">
            <div className="font-pixel text-xl text-cyan-400">{allCountries.length}</div>
            <div className="font-pixel text-xl text-zinc-200">Countries ranked</div>
          </div>
          <div className="bg-black/30 border border-zinc-800 p-3 rounded">
            <div className="font-pixel text-xl text-red-400">US Rank: #{usGlobalRank}</div>
            <div className="font-pixel text-xl text-zinc-200">of {allCountries.length}</div>
          </div>
          <div className="bg-black/30 border border-zinc-800 p-3 rounded">
            <div className="font-pixel text-xl text-amber-400">WHO / SIPRI / OECD</div>
            <div className="font-pixel text-xl text-zinc-200">Source data</div>
          </div>
        </div>
      </div>
    </SlideBase>
  );
}
