"use client";

import Image from "next/image";
import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { AnimatedCounter } from "../../animations/sierra/animated-counter";
import {
  POLITICIAN_SCORECARDS,
  SYSTEM_WIDE_MILITARY_TO_TRIALS_RATIO,
  BUDGET_ITEMS,
} from "@optimitron/data/datasets/us-politician-scorecards";
import { useEffect, useState } from "react";

// Pick 6 politicians spanning parties for the display
const DISPLAY_POLITICIANS = POLITICIAN_SCORECARDS.slice(0, 6);

function formatBillions(val: number): string {
  if (val >= 1e9) return `$${(val / 1e9).toFixed(0)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  return `$${val.toLocaleString()}`;
}

export function SlideCongressMilitaryTrialsRatio() {
  const [showRatio, setShowRatio] = useState(false);
  const [visibleRows, setVisibleRows] = useState(0);
  const [showPunchline, setShowPunchline] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowRatio(true), 500);

    DISPLAY_POLITICIANS.forEach((_, i) => {
      setTimeout(() => setVisibleRows(i + 1), 2500 + i * 300);
    });

    setTimeout(() => setShowPunchline(true), 2500 + DISPLAY_POLITICIANS.length * 300 + 500);
  }, []);

  return (
    <SierraSlideWrapper act={2} className="text-cyan-400">
      <div className="w-full max-w-[1700px] mx-auto space-y-4">
        {/* Title */}
        <div className="text-center">
          <h1 className="font-pixel text-3xl md:text-4xl text-cyan-400">
            🇺🇸 US CONGRESSIONAL REPORT CARD
          </h1>
          <div className="font-terminal text-xl text-zinc-400 mt-1">
            For every $1 on clinical trials, Congress spends...
          </div>
        </div>

        {/* Giant ratio */}
        <div
          className={`text-center transition-all duration-700 ${
            showRatio ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
        >
          <div className="font-pixel text-6xl md:text-8xl text-red-500">
            {showRatio && (
              <AnimatedCounter
                end={SYSTEM_WIDE_MILITARY_TO_TRIALS_RATIO}
                duration={2000}
                format="number"
              />
            )}
            <span className="text-4xl md:text-5xl text-red-400">:1</span>
          </div>
          <div className="font-terminal text-xl text-zinc-400 mt-1">
            ...on the military
          </div>
          <div className="font-pixel text-xl text-zinc-500 mt-1">
            {formatBillions(BUDGET_ITEMS.NDAA_DEFENSE)} NDAA / {formatBillions(BUDGET_ITEMS.NIH_CLINICAL_TRIALS)} NIH trials
          </div>
        </div>

        {/* Politician table */}
        <div className="bg-black/40 border border-cyan-500/30 rounded overflow-x-auto">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-3 md:px-4 py-2 bg-cyan-500/10 border-b border-cyan-500/30 min-w-[520px]">
            <div className="col-span-5 font-pixel text-sm md:text-xl text-cyan-400">NAME</div>
            <div className="col-span-3 font-pixel text-sm md:text-xl text-cyan-400 text-right">MIL $</div>
            <div className="col-span-2 font-pixel text-sm md:text-xl text-cyan-400 text-right">TRIALS $</div>
            <div className="col-span-2 font-pixel text-sm md:text-xl text-cyan-400 text-right">RATIO</div>
          </div>

          {DISPLAY_POLITICIANS.map((pol, i) => (
            <div
              key={pol.id}
              className={`grid grid-cols-12 gap-2 px-3 md:px-4 py-2 border-b border-zinc-800/50 items-center transition-all duration-500 min-w-[520px] ${
                i < visibleRows ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              }`}
            >
              {/* Name */}
              <div className="col-span-5 flex items-center gap-2">
                <Image
                  src={`https://bioguide.congress.gov/bioguide/photo/${pol.id[0]?.toUpperCase() ?? "X"}/${pol.id.toUpperCase()}.jpg`}
                  alt={pol.name}
                  width={24}
                  height={30}
                  className="w-6 h-[30px] object-cover border border-cyan-500/30 shrink-0"
                  unoptimized
                />
                <a
                  href={`https://optimitron.com/governments/US/politicians/${pol.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-pixel text-sm md:text-xl text-zinc-200 hover:text-cyan-400 transition-colors"
                >
                  {pol.name}
                </a>
              </div>

              {/* Military $ voted for */}
              <div className="col-span-3 text-right">
                <span className={`font-pixel text-xl ${
                  pol.destructiveDollarsVotedFor > 0 ? "text-red-400" : "text-cyan-400"
                }`}>
                  {formatBillions(pol.destructiveDollarsVotedFor)}
                </span>
              </div>

              {/* Trials $ voted for */}
              <div className="col-span-2 text-right">
                <span className={`font-pixel text-xl ${
                  pol.clinicalTrialDollarsVotedFor > 0 ? "text-cyan-400" : "text-zinc-500"
                }`}>
                  {formatBillions(pol.clinicalTrialDollarsVotedFor)}
                </span>
              </div>

              {/* Ratio */}
              <div className="col-span-2 text-right">
                <span className={`font-pixel text-xl ${
                  pol.militaryToTrialsRatio >= 100 ? "text-red-400" : pol.militaryToTrialsRatio <= 1 ? "text-cyan-400" : "text-zinc-200"
                }`}>
                  {pol.militaryToTrialsRatio === 0 ? "0:1" : pol.militaryToTrialsRatio === 1 ? "1:1" : `${pol.militaryToTrialsRatio.toLocaleString()}:1`}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Punchline */}
        <div
          className={`text-center transition-all duration-700 ${
            showPunchline ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="font-pixel text-xl md:text-2xl text-amber-400">
            Both parties voted for this. It is not a left-right problem. It is a math problem.
          </div>
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideCongressMilitaryTrialsRatio;
