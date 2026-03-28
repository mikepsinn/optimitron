"use client";

import { SlideBase } from "../slide-base";
import { useEffect, useState } from "react";
import {
  getGovernmentsByHALE,
  getMilitaryToHealthRatio,
} from "@optimitron/data/datasets/government-report-cards";

const allCountries = getGovernmentsByHALE();
const TOP_N = 12;

interface LeaderboardRow {
  rank: number;
  name: string;
  flag: string;
  code: string;
  hale: number;
  milHealthRatio: number | null;
  milSpending: number;
}

const leaderboardData: LeaderboardRow[] = allCountries
  .filter((g) => g.hale?.value)
  .slice(0, TOP_N)
  .map((g, i) => ({
    rank: i + 1,
    name: g.name,
    flag: g.flag,
    code: g.code,
    hale: g.hale!.value,
    milHealthRatio: getMilitaryToHealthRatio(g),
    milSpending: g.militarySpendingAnnual.value,
  }));

const usRow = leaderboardData.find((r) => r.code === "US");
const usRank = usRow ? usRow.rank : leaderboardData.length + 1;
const maxHale = Math.max(...leaderboardData.map((r) => r.hale));

function formatMilSpending(val: number): string {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(0)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  return `$${val.toLocaleString()}`;
}

export function SlideLeaderboard() {
  const [animatedHale, setAnimatedHale] = useState<number[]>(
    leaderboardData.map(() => 0)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedHale((prev) =>
        prev.map((val, i) => {
          const target = leaderboardData[i].hale;
          if (val >= target) return target;
          return Math.min(val + target / 20, target);
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <SlideBase act={2} className="text-cyan-400">
      {/* Title */}
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
        {/* Table */}
        <div className="bg-black/40 border border-cyan-500/30 rounded overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-cyan-500/10 border-b border-cyan-500/30">
            <div className="col-span-1 font-pixel text-xl text-cyan-400">#</div>
            <div className="col-span-3 font-pixel text-xl text-cyan-400">COUNTRY</div>
            <div className="col-span-4 font-pixel text-xl text-cyan-400">HALE (YEARS)</div>
            <div className="col-span-2 font-pixel text-xl text-cyan-400">MIL:HEALTH</div>
            <div className="col-span-2 font-pixel text-xl text-cyan-400">MIL $/YR</div>
          </div>

          {/* Rows */}
          {leaderboardData.map((row, i) => {
            const isUS = row.code === "US";
            return (
              <div
                key={row.code}
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
                {/* Rank */}
                <div className="col-span-1">
                  <span
                    className={`font-pixel text-xl ${
                      row.rank === 1
                        ? "text-amber-400"
                        : row.rank === 2
                        ? "text-zinc-300"
                        : row.rank === 3
                        ? "text-amber-600"
                        : isUS
                        ? "text-red-400"
                        : "text-zinc-200"
                    }`}
                  >
                    {row.rank}
                  </span>
                </div>

                {/* Country */}
                <div className="col-span-3 flex items-center gap-2">
                  <span className="text-xl">{row.flag}</span>
                  <span className={`font-pixel text-xl truncate ${isUS ? "text-red-400" : "text-zinc-300"}`}>
                    {row.name}
                  </span>
                  {isUS && (
                    <span className="font-pixel text-xs text-red-400 bg-red-500/20 px-1 rounded">
                      YOU
                    </span>
                  )}
                </div>

                {/* HALE bar */}
                <div className="col-span-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isUS ? "bg-red-500" : i === 0 ? "bg-amber-500" : "bg-cyan-500"
                        }`}
                        style={{ width: `${(animatedHale[i] / maxHale) * 100}%` }}
                      />
                    </div>
                    <span className={`font-pixel text-xl w-12 text-right ${isUS ? "text-red-400" : "text-zinc-200"}`}>
                      {animatedHale[i].toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Military:Health ratio */}
                <div className="col-span-2">
                  <span
                    className={`font-pixel text-xl ${
                      row.milHealthRatio === null
                        ? "text-zinc-500"
                        : row.milHealthRatio > 1
                        ? "text-red-400"
                        : row.milHealthRatio > 0.5
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {row.milHealthRatio !== null ? `${row.milHealthRatio.toFixed(1)}:1` : "N/A"}
                  </span>
                </div>

                {/* Military spending */}
                <div className="col-span-2">
                  <span className={`font-pixel text-xl ${isUS ? "text-red-400" : "text-zinc-400"}`}>
                    {formatMilSpending(row.milSpending)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div className="bg-black/30 border border-zinc-800 p-3 rounded">
            <div className="font-pixel text-xl text-cyan-400">{allCountries.length}</div>
            <div className="font-pixel text-xl text-zinc-200">Countries ranked</div>
          </div>
          <div className="bg-black/30 border border-zinc-800 p-3 rounded">
            <div className="font-pixel text-xl text-red-400">US Rank: #{usRank}</div>
            <div className="font-pixel text-xl text-zinc-200">of {leaderboardData.length}</div>
          </div>
          <div className="bg-black/30 border border-zinc-800 p-3 rounded">
            <div className="font-pixel text-xl text-amber-400">WHO / SIPRI</div>
            <div className="font-pixel text-xl text-zinc-200">Source data</div>
          </div>
        </div>

        <div className="text-center mt-4 font-terminal text-xl text-zinc-200">
          Japan: 74 years of healthy life, zero wars. US: 66 years, $886B murder budget.
        </div>
      </div>
    </SlideBase>
  );
}
