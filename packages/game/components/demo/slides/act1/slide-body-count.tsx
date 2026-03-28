"use client";

import { SlideBase } from "../slide-base";
import { AnimatedCounter } from "../../animations/animated-counter";
import { GlitchText } from "../../animations/glitch-text";
import { ParticleEmitter } from "../../animations/particle-emitter";
import { getGovernmentsByBodyCount } from "@optimitron/data/datasets/government-report-cards";
import { useEffect, useState } from "react";

const allByBodyCount = getGovernmentsByBodyCount()
  .filter((g) => g.militaryDeathsCaused.value > 0);

const TOP_N = 8;
const topCountries = allByBodyCount.slice(0, TOP_N);
const totalDeaths = topCountries.reduce((sum, g) => sum + g.militaryDeathsCaused.value, 0);
const maxDeaths = topCountries[0]?.militaryDeathsCaused.value ?? 1;

export function SlideBodyCount() {
  const [visibleRows, setVisibleRows] = useState(0);
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    // Stagger row reveals
    topCountries.forEach((_, i) => {
      setTimeout(() => setVisibleRows(i + 1), 500 + i * 400);
    });
    // Footer after all rows
    setTimeout(() => setShowFooter(true), 500 + TOP_N * 400 + 500);
  }, []);

  return (
    <SlideBase act={1} className="text-red-500">
      {/* Skull particles */}
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
          <div className="font-terminal text-xl text-zinc-400 mt-2">
            Post-WWII military deaths caused
          </div>
        </div>

        {/* Ranked list */}
        <div className="bg-black/40 border border-red-500/30 rounded overflow-hidden">
          {topCountries.map((gov, i) => {
            const isUS = gov.code === "US";
            const barWidth = (gov.militaryDeathsCaused.value / maxDeaths) * 100;
            return (
              <div
                key={gov.code}
                className={`grid grid-cols-12 gap-2 px-4 py-2 border-b border-zinc-800/50 items-center transition-all duration-500 ${
                  i < visibleRows ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                } ${isUS ? "bg-red-500/10 border-l-4 border-l-red-500" : ""}`}
              >
                {/* Rank */}
                <div className="col-span-1">
                  <span className={`font-pixel text-xl ${isUS ? "text-red-400" : "text-zinc-400"}`}>
                    {i + 1}
                  </span>
                </div>

                {/* Country */}
                <div className="col-span-3 flex items-center gap-2">
                  <span className="text-xl">{gov.flag}</span>
                  <span className={`font-pixel text-xl ${isUS ? "text-red-400" : "text-zinc-300"}`}>
                    {gov.name}
                  </span>
                </div>

                {/* Death count + bar */}
                <div className="col-span-5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-4 bg-zinc-900 rounded overflow-hidden">
                      <div
                        className="h-full bg-red-500/80 transition-all duration-1000"
                        style={{ width: i < visibleRows ? `${barWidth}%` : "0%" }}
                      />
                    </div>
                    <span className="font-pixel text-xl text-red-400 w-28 text-right">
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

                {/* Countries bombed */}
                <div className="col-span-3">
                  {gov.countriesBombed && gov.countriesBombed.count > 0 && (
                    <span className="font-pixel text-xl text-zinc-500">
                      💣 {gov.countriesBombed.count} countries
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className={`text-center transition-all duration-700 ${
            showFooter ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="font-pixel text-2xl text-red-500 animate-pulse">
            COMBINED: {totalDeaths.toLocaleString()} DEAD
          </div>
          <div className="font-pixel text-xl text-red-400 mt-1">
            0 REFERENDUMS HELD
          </div>
        </div>
      </div>
    </SlideBase>
  );
}
