"use client";

import { SlideBase } from "../slide-base";

const badges = [
  { id: "trial-2301", label: "TRIAL #2,301", result: "HIV prophylaxis", efficacy: "89%", color: "purple" },
  { id: "trial-3112", label: "TRIAL #3,112", result: "TB rapid diagnostic", efficacy: "97%", color: "blue" },
  { id: "trial-4847", label: "TRIAL #4,847", result: "Malaria vaccine", efficacy: "94%", featured: true, color: "emerald" },
  { id: "trial-5200", label: "TRIAL #5,200", result: "Alzheimer gene therapy", efficacy: "72%", color: "cyan" },
  { id: "trial-6033", label: "TRIAL #6,033", result: "Diabetes reversal", efficacy: "91%", color: "yellow" },
  { id: "trial-7891", label: "TRIAL #7,891", result: "Cancer immunotherapy", efficacy: "86%", color: "orange" },
];

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
  emerald: { bg: "bg-emerald-500/15", border: "border-emerald-500/50", text: "text-emerald-400" },
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400" },
  yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
};

export function SlideHypercerts() {
  return (
    <SlideBase act={2} className="text-purple-400">
      <div className="flex flex-col items-center justify-center gap-5 max-w-7xl mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-lg md:text-2xl text-purple-400 text-center">
          HYPERCERTS: VERIFIABLE IMPACT
        </h1>

        {/* Badge grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
          {badges.map((badge) => {
            const colors = colorMap[badge.color];
            return (
              <div
                key={badge.id}
                className={`${colors.bg} border ${
                  badge.featured ? "border-2 " + colors.border : colors.border
                } rounded-lg p-3 text-center ${badge.featured ? "ring-1 ring-emerald-400/20" : ""}`}
              >
                <div className="font-pixel text-xs text-zinc-500 mb-1">{badge.label}</div>
                <div className={`font-pixel text-sm ${colors.text}`}>{badge.result}</div>
                <div className="font-pixel text-lg text-zinc-300 mt-1">{badge.efficacy}</div>
                {badge.featured && (
                  <div className="font-pixel text-xs text-emerald-400 mt-1 animate-pulse">
                    VERIFIED ON-CHAIN
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Featured badge detail */}
        <div className="bg-emerald-500/10 border-2 border-emerald-500/40 rounded-lg p-4 w-full">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-pixel text-2xl">🏆</span>
            <div className="font-pixel text-sm text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
              MINTING NOW
            </div>
          </div>
          <div className="font-terminal text-xs text-zinc-300 leading-relaxed">
            <span className="text-emerald-400 font-pixel">TRIAL #4,847:</span>{" "}
            Malaria vaccine pragmatic trial. 12,000 patients. 94% efficacy. Verified on-chain.
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-pixel text-lg">✅</span>
            <span className="font-pixel text-sm text-emerald-400">STAMP OF APPROVAL</span>
          </div>
        </div>

        {/* Key text */}
        <p className="font-pixel text-xs md:text-sm text-zinc-400 text-center italic max-w-xl leading-relaxed">
          If a charity tells you they saved ten thousand lives, you ask for the
          Hypercert. If they do not have one, they did not save ten thousand
          lives.
        </p>
      </div>
    </SlideBase>
  );
}
