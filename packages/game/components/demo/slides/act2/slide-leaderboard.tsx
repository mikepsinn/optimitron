"use client";

import { SlideBase } from "../slide-base";
import { useEffect, useState } from "react";

interface Country {
  rank: number;
  name: string;
  flag: string;
  score: number;
  allocation: number;
  change: "up" | "down" | "same";
}

const initialLeaderboard: Country[] = [
  { rank: 1, name: "Denmark", flag: "🇩🇰", score: 9420, allocation: 1.2, change: "same" },
  { rank: 2, name: "New Zealand", flag: "🇳🇿", score: 8850, allocation: 1.1, change: "up" },
  { rank: 3, name: "Costa Rica", flag: "🇨🇷", score: 8340, allocation: 1.0, change: "up" },
  { rank: 4, name: "Finland", flag: "🇫🇮", score: 7920, allocation: 0.9, change: "down" },
  { rank: 5, name: "Portugal", flag: "🇵🇹", score: 7510, allocation: 0.8, change: "same" },
  { rank: 6, name: "Canada", flag: "🇨🇦", score: 6890, allocation: 0.7, change: "up" },
  { rank: 7, name: "Japan", flag: "🇯🇵", score: 6420, allocation: 0.6, change: "same" },
  { rank: 8, name: "Germany", flag: "🇩🇪", score: 5980, allocation: 0.5, change: "down" },
];

export function SlideLeaderboard() {
  const [countries, setCountries] = useState(initialLeaderboard);
  const [animatedScores, setAnimatedScores] = useState<number[]>(
    initialLeaderboard.map(() => 0)
  );

  useEffect(() => {
    // Animate scores filling in
    const interval = setInterval(() => {
      setAnimatedScores((prev) =>
        prev.map((score, i) => {
          const target = countries[i].score;
          if (score >= target) return target;
          return Math.min(score + Math.floor(target / 20), target);
        })
      );
    }, 50);

    // Simulate live updates
    const updateInterval = setInterval(() => {
      setCountries((prev) => {
        const updated = [...prev];
        const randomIndex = Math.floor(Math.random() * updated.length);
        updated[randomIndex] = {
          ...updated[randomIndex],
          score: updated[randomIndex].score + Math.floor(Math.random() * 100),
        };
        return updated.sort((a, b) => b.score - a.score).map((c, i) => ({ ...c, rank: i + 1 }));
      });
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(updateInterval);
    };
  }, [countries]);

  const maxScore = Math.max(...countries.map((c) => c.score));

  return (
    <SlideBase act={2} className="text-cyan-400">
      {/* Title */}
      <div className="text-center mb-4">
        <div className="font-pixel text-xl text-cyan-400 mb-1">PART 4: ACCOUNTABILITY</div>
        <h1 className="font-pixel text-3xl md:text-4xl text-cyan-400">
          GOVERNMENT LEADERBOARD
        </h1>
        <div className="font-terminal text-xl text-zinc-200 mt-2">
          Ranked by health optimization score
        </div>
      </div>

      <div className="w-full max-w-[1700px] mx-auto">
        {/* Leaderboard table */}
        <div className="bg-black/40 border border-cyan-500/30 rounded overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-cyan-500/10 border-b border-cyan-500/30">
            <div className="col-span-1 font-pixel text-xl text-cyan-400">#</div>
            <div className="col-span-4 font-pixel text-xl text-cyan-400">COUNTRY</div>
            <div className="col-span-4 font-pixel text-xl text-cyan-400">SCORE</div>
            <div className="col-span-2 font-pixel text-xl text-cyan-400">% GDP</div>
            <div className="col-span-1 font-pixel text-xl text-cyan-400">Δ</div>
          </div>

          {/* Rows */}
          {countries.map((country, i) => (
            <div
              key={country.name}
              className={`grid grid-cols-12 gap-2 px-4 py-2 border-b border-zinc-800/50 items-center ${
                i === 0 ? "bg-amber-500/10" : i < 3 ? "bg-cyan-500/5" : ""
              }`}
            >
              {/* Rank */}
              <div className="col-span-1">
                <span
                  className={`font-pixel text-xl ${
                    country.rank === 1
                      ? "text-amber-400"
                      : country.rank === 2
                      ? "text-zinc-300"
                      : country.rank === 3
                      ? "text-amber-600"
                      : "text-zinc-200"
                  }`}
                >
                  {country.rank}
                </span>
              </div>

              {/* Country */}
              <div className="col-span-4 flex items-center gap-2">
                <span className="text-xl">{country.flag}</span>
                <span className="font-pixel text-xl text-zinc-300 truncate">
                  {country.name}
                </span>
              </div>

              {/* Score bar */}
              <div className="col-span-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        i === 0 ? "bg-amber-500" : "bg-cyan-500"
                      }`}
                      style={{ width: `${(animatedScores[i] / maxScore) * 100}%` }}
                    />
                  </div>
                  <span className="font-pixel text-xl text-zinc-200 w-12 text-right">
                    {animatedScores[i].toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Allocation */}
              <div className="col-span-2">
                <span className="font-pixel text-xl text-emerald-400">
                  {country.allocation}%
                </span>
              </div>

              {/* Change indicator */}
              <div className="col-span-1">
                <span
                  className={`font-pixel text-xl ${
                    country.change === "up"
                      ? "text-emerald-400"
                      : country.change === "down"
                      ? "text-red-400"
                      : "text-zinc-200"
                  }`}
                >
                  {country.change === "up" ? "↑" : country.change === "down" ? "↓" : "–"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div className="bg-black/30 border border-zinc-800 p-3 rounded">
            <div className="font-pixel text-xl text-cyan-400">147</div>
            <div className="font-pixel text-xl text-zinc-200">Countries ranked</div>
          </div>
          <div className="bg-black/30 border border-zinc-800 p-3 rounded">
            <div className="font-pixel text-xl text-emerald-400">0.6%</div>
            <div className="font-pixel text-xl text-zinc-200">Avg allocation</div>
          </div>
          <div className="bg-black/30 border border-zinc-800 p-3 rounded">
            <div className="font-pixel text-xl text-amber-400">LIVE</div>
            <div className="font-pixel text-xl text-zinc-200">Updated realtime</div>
          </div>
        </div>

        {/* Bottom message */}
        <div className="text-center mt-4 font-terminal text-xl text-zinc-200">
          Public accountability drives competition for better health outcomes
        </div>
      </div>
    </SlideBase>
  );
}
