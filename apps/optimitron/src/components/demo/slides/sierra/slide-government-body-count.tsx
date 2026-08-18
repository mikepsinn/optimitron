"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { AnimatedCounter } from "../../animations/sierra/animated-counter";
import { GlitchText } from "../../animations/sierra/glitch-text";
import { ParticleEmitter } from "../../animations/sierra/particle-emitter";
import { getGovernmentsByBodyCount } from "@optimitron/data/datasets/government-report-cards";
import { useEffect, useState } from "react";

const allByBodyCount = getGovernmentsByBodyCount()
  .filter((g) => g.militaryDeathsCaused.value > 0);

const TOP_N = 8;
const topCountries = allByBodyCount.slice(0, TOP_N);
const totalDeaths = topCountries.reduce((sum, g) => sum + g.militaryDeathsCaused.value, 0);
const maxDeaths = topCountries[0]?.militaryDeathsCaused.value ?? 1;

/** Convert death count to skull string: 1 skull per 250k deaths */
function deathSkulls(deaths: number): string {
  const count = Math.max(1, Math.round(deaths / 250_000));
  return "💀".repeat(Math.min(count, 20));
}

export function SlideGovernmentBodyCount() {
  const [visibleRows, setVisibleRows] = useState(0);
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    topCountries.forEach((_, i) => {
      setTimeout(() => setVisibleRows(i + 1), 500 + i * 350);
    });
    setTimeout(() => setShowFooter(true), 500 + TOP_N * 350 + 500);
  }, []);

  return (
    <SierraSlideWrapper act={1} className="text-red-500">
      <ParticleEmitter
        emoji={["💀"]}
        rate={2}
        direction="up"
        speed={15}
        lifetime={4000}
        fadeOut
        className="opacity-15"
      />

      <div className="w-full max-w-[1700px] mx-auto space-y-4">
        {/* Title */}
        <div className="text-center">
          <GlitchText
            text="GOVERNMENT BODY COUNT"
            className="font-pixel text-3xl md:text-4xl text-red-500"
            intensity="medium"
          />
          <div className="font-terminal text-lg text-zinc-400 mt-1">
            Post-WWII military deaths caused
          </div>
        </div>

        {/* List — no ranks, no flags, skulls as bars */}
        <div className="bg-black/40 border border-red-500/30 rounded overflow-hidden">
          {topCountries.map((gov, i) => {
            const barWidth = (gov.militaryDeathsCaused.value / maxDeaths) * 100;
            return (
              <div
                key={gov.code}
                className={`flex items-center gap-3 px-4 py-2 border-b border-zinc-800/50 transition-all duration-500 ${
                  i < visibleRows ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                }`}
              >
                {/* Country name */}
                <div className="w-40 shrink-0">
                  <span className="font-pixel text-lg text-zinc-200">
                    {gov.name}
                  </span>
                </div>

                {/* Skull bar + death count */}
                <div className="flex-1 flex items-center gap-2">
                  {/* Red bar filled with skulls */}
                  <div className="flex-1 relative h-6 bg-zinc-900/50 rounded overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-red-500/20 transition-all duration-1000 flex items-center pl-1"
                      style={{ width: i < visibleRows ? `${barWidth}%` : "0%" }}
                    >
                      <span className="text-sm leading-none whitespace-nowrap">
                        {deathSkulls(gov.militaryDeathsCaused.value)}
                      </span>
                    </div>
                  </div>

                  <span className="font-pixel text-lg text-red-400 w-40 text-right shrink-0">
                    {i < visibleRows ? (
                      <AnimatedCounter
                        end={gov.militaryDeathsCaused.value}
                        duration={1500}
                        format="number"
                      />
                    ) : (
                      "0"
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer stats */}
        <div
          className={`text-center space-y-2 transition-all duration-700 ${
            showFooter ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="font-pixel text-2xl text-red-500 animate-pulse">
            KILLED WITH YOUR MONEY: {totalDeaths.toLocaleString()}
          </div>
          <div className="font-pixel text-xl text-red-400">
            WARS YOU VOTED FOR: 0
          </div>
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideGovernmentBodyCount;
