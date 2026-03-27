"use client";

import { SlideBase } from "../slide-base";

const replacements = [
  {
    gov: {
      emoji: "📄🏢👔",
      name: "THE IRS",
      detail: "74,000 pages, 83,000 people",
    },
    contract: {
      emoji: "💻✨📱",
      name: "0.5% TX TAX",
      detail: "4 lines of code, 0 employees",
    },
  },
  {
    gov: {
      emoji: "🏛️📋🤷",
      name: "WELFARE",
      detail: "83 programs, 6 agencies",
    },
    contract: {
      emoji: "🌐🪪💸",
      name: "UBI via World ID",
      detail: "automatic",
    },
  },
  {
    gov: {
      emoji: "🏦🖨️📉",
      name: "FED RESERVE",
      detail: "-97% since 1913",
    },
    contract: {
      emoji: "🔒⚖️📊",
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
        <h1 className="font-pixel text-2xl md:text-4xl text-yellow-400 text-center">
          ALGORITHMIC PUBLIC ADMINISTRATION
        </h1>

        {/* Column headers */}
        <div className="flex items-stretch gap-3 w-full">
          <div className="flex-1 text-center">
            <span className="font-pixel text-xl md:text-2xl text-red-400">
              🐌 PRIMITIVE &amp; WASTEFUL
            </span>
          </div>
          <div className="w-10" /> {/* arrow spacer */}
          <div className="flex-1 text-center">
            <span className="font-pixel text-xl md:text-2xl text-emerald-400">
              ⚡ MAXIMUM EFFICIENCY
            </span>
          </div>
        </div>

        {/* Three replacement rows */}
        <div className="w-full space-y-3">
          {replacements.map((r, i) => (
            <div key={i} className="flex items-stretch gap-3 w-full">
              {/* Government side */}
              <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="text-2xl md:text-3xl mb-1">{r.gov.emoji}</div>
                <div className="font-pixel text-xl md:text-3xl text-red-400">{r.gov.name}</div>
                <div className="font-terminal text-xl md:text-2xl text-zinc-200">{r.gov.detail}</div>
              </div>

              {/* Arrow */}
              <div className="flex items-center">
                <span className="font-pixel text-3xl md:text-4xl text-yellow-500">→</span>
              </div>

              {/* Smart contract side */}
              <div className="flex-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                <div className="text-2xl md:text-3xl mb-1">{r.contract.emoji}</div>
                <div className="font-pixel text-xl md:text-3xl text-emerald-400">{r.contract.name}</div>
                <div className="font-terminal text-xl md:text-2xl text-zinc-200">{r.contract.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom line */}
        <div className="text-center space-y-1">
          <p className="font-pixel text-xl md:text-2xl text-yellow-300">
            Tax + Welfare + Money = 3 smart contracts.
          </p>
          <p className="font-pixel text-xl md:text-3xl text-zinc-200 italic">
            Your government uses 200,000 employees for this.
          </p>
        </div>
      </div>
    </SlideBase>
  );
}
