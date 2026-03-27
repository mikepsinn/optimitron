"use client";

import { SlideBase } from "../slide-base";

const replacements = [
  {
    gov: {
      icon: "🏛",
      name: "THE IRS",
      detail: "74,000 pages, 83,000 people",
    },
    contract: {
      icon: "📜",
      name: "0.5% TX TAX",
      detail: "4 lines of code, 0 employees",
    },
  },
  {
    gov: {
      icon: "🏛",
      name: "WELFARE",
      detail: "83 programs, 6 agencies",
    },
    contract: {
      icon: "📜",
      name: "UBI via World ID",
      detail: "automatic",
    },
  },
  {
    gov: {
      icon: "🏛",
      name: "FED RESERVE",
      detail: "-97% since 1913",
    },
    contract: {
      icon: "📜",
      name: "0% INFLATION",
      detail: "algorithmic, productivity-anchored",
    },
  },
];

export function SlideWishToken() {
  return (
    <SlideBase act={2} className="text-yellow-400">
      <div className="flex flex-col items-center justify-center gap-5 max-w-[1700px] mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-xl md:text-2xl text-yellow-400 text-center">
          $WISH TOKEN — THREE REPLACEMENTS
        </h1>

        {/* Three replacement rows */}
        <div className="w-full space-y-3">
          {replacements.map((r, i) => (
            <div key={i} className="flex items-stretch gap-3 w-full">
              {/* Government side */}
              <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{r.gov.icon}</span>
                  <span className="font-pixel text-sm md:text-base text-red-400">{r.gov.name}</span>
                </div>
                <div className="font-terminal text-sm md:text-base text-zinc-500">{r.gov.detail}</div>
              </div>

              {/* Arrow */}
              <div className="flex items-center">
                <span className="font-pixel text-xl text-yellow-500/60">→</span>
              </div>

              {/* Smart contract side */}
              <div className="flex-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{r.contract.icon}</span>
                  <span className="font-pixel text-sm md:text-base text-emerald-400">{r.contract.name}</span>
                </div>
                <div className="font-terminal text-sm md:text-base text-zinc-400">{r.contract.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom line */}
        <div className="text-center space-y-1">
          <p className="font-pixel text-base md:text-lg text-yellow-300">
            Tax + Welfare + Money = 3 smart contracts.
          </p>
          <p className="font-pixel text-sm md:text-base text-zinc-500 italic">
            Your government uses 200,000 employees for this.
          </p>
        </div>
      </div>
    </SlideBase>
  );
}
