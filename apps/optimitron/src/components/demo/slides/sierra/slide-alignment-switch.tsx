"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { AnimatedLineChart } from "../../animations/sierra/animated-line-chart";
import { ParticleEmitter } from "../../animations/sierra/particle-emitter";
import React, { useEffect, useState } from "react";

// Exponential income data: starts flat, then rockets after "switch on" year
const incomeData = Array.from({ length: 25 }, (_, i) => ({
  x: 2025 + i,
  y: i < 5
    ? 77_500 + i * 500 // flat-ish before switch
    : 77_500 + Math.pow(1.18, i - 4) * 15_000, // exponential after
}));

// Healthy life years data: similar pattern
const haleData = Array.from({ length: 25 }, (_, i) => ({
  x: 2025 + i,
  y: i < 5
    ? 63.3 + i * 0.1 // flat-ish before switch
    : 63.3 + Math.pow(1.12, i - 4) * 2.5, // exponential after
}));

export function SlideAlignmentSwitch() {
  const [phase, setPhase] = useState(0);
  const [leverOn, setLeverOn] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), 500));
    timers.push(setTimeout(() => setPhase(2), 1500));
    timers.push(setTimeout(() => setPhase(3), 2500));
    // THE SWITCH appears
    timers.push(setTimeout(() => setPhase(4), 4000));
    // Lever flips + charts appear
    timers.push(setTimeout(() => {
      setPhase(5);
      setLeverOn(true);
    }, 5500));
    // Closing lines
    timers.push(setTimeout(() => setPhase(6), 7500));
    timers.push(setTimeout(() => setPhase(7), 8700));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SierraSlideWrapper act={2}>
      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .fade-up { animation: fade-up 0.5s ease-out forwards; }
        .lever {
          transform-origin: center bottom;
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .lever-off { transform: rotate(30deg); }
        .lever-on  { transform: rotate(-30deg); }
        @keyframes screen-flash {
          0%   { opacity: 0; }
          15%  { opacity: 0.7; }
          100% { opacity: 0; }
        }
        .screen-flash { animation: screen-flash 0.5s ease-out forwards; }
        @keyframes fade-in-slow {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .fade-in-slow { animation: fade-in-slow 0.8s ease-out forwards; }
      `}</style>

      <div className="flex flex-col items-center gap-4 w-full max-w-[1700px] mx-auto text-center">
        {/* Lines 1–3 */}
        <div className="space-y-3">
          {phase >= 1 && (
            <p className="font-pixel text-xl md:text-2xl text-zinc-300 fade-up">
              TWO NUMBERS ON A SCOREBOARD
            </p>
          )}
          {phase >= 2 && (
            <p className="font-pixel text-xl md:text-2xl text-zinc-300 fade-up">
              AND PIECES OF PAPER WITH PRESIDENTS ON THEM
            </p>
          )}
          {phase >= 3 && (
            <p className="font-pixel text-xl md:text-3xl text-amber-400 fade-up leading-snug">
              DID WHAT NO COMMITTEE, NO CHARITY,<br />
              AND NO CENTRAL PLAN HAS EVER DONE.
            </p>
          )}
        </div>

        {/* Switch + Charts side by side */}
        {phase >= 4 && (
          <div className="fade-up w-full">
            <p className="font-pixel text-2xl md:text-4xl text-emerald-400 animate-pulse tracking-widest mb-4">
              HERE IS THE SWITCH
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              {/* LEFT chart — Median Income (appears after switch) */}
              <div className={`text-center flex-1 transition-opacity duration-1000 ${leverOn ? "opacity-100" : "opacity-0"}`}>
                <div className="font-pixel text-xl md:text-2xl text-emerald-400 mb-2">
                  💰 MEDIAN INCOME
                </div>
                <AnimatedLineChart
                  lines={[
                    { points: incomeData, color: "#34d399" },
                  ]}
                  width={400}
                  height={200}
                  animate
                  duration={2500}
                  delay={200}
                  showArea
                  showGrid
                  formatX={(v) => `${Math.round(v)}`}
                  formatY={(v) => `$${Math.round(v / 1000)}K`}
                  xAxisLabel="Year"
                  yAxisLabel="Income"
                />
              </div>

              {/* CENTER — Switch housing */}
              <div className="flex flex-col items-center gap-2 border-2 border-emerald-500 bg-zinc-900/80 px-6 py-4 rounded shrink-0">
                <div className="font-pixel text-xl tracking-widest">
                  <span className={leverOn ? "text-zinc-300" : "text-red-400"}>OFF</span>
                  <span className="text-zinc-300 mx-3">·</span>
                  <span className={leverOn ? "text-emerald-400" : "text-zinc-300"}>ON</span>
                </div>
                <div className="relative flex items-center justify-center" style={{ width: 48, height: 80 }}>
                  <div className="absolute inset-x-0 mx-auto w-2 h-full bg-zinc-700 rounded-full" style={{ left: "calc(50% - 4px)" }} />
                  <div className={`lever absolute bottom-0 ${leverOn ? "lever-on" : "lever-off"}`} style={{ width: 16, height: 56, left: "calc(50% - 8px)" }}>
                    <div className={`w-full h-full rounded-sm transition-colors duration-500 ${leverOn ? "bg-emerald-400" : "bg-red-500"}`} />
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 transition-colors duration-500 ${leverOn ? "bg-emerald-300 border-emerald-200" : "bg-red-400 border-red-300"}`} />
                  </div>
                </div>
                <div className={`w-10 h-3 rounded-full blur-sm transition-all duration-500 ${leverOn ? "bg-emerald-400 opacity-80" : "bg-red-500 opacity-40"}`} />
              </div>

              {/* RIGHT chart — Healthy Life Years (appears after switch) */}
              <div className={`text-center flex-1 transition-opacity duration-1000 ${leverOn ? "opacity-100" : "opacity-0"}`}>
                <div className="font-pixel text-xl md:text-2xl text-cyan-400 mb-2">
                  ❤️ HEALTHY LIFE YEARS
                </div>
                <AnimatedLineChart
                  lines={[
                    { points: haleData, color: "#22d3ee" },
                  ]}
                  width={400}
                  height={200}
                  animate
                  duration={2500}
                  delay={400}
                  showArea
                  showGrid
                  yMinOverride={55}
                  formatX={(v) => `${Math.round(v)}`}
                  formatY={(v) => `${v.toFixed(0)} yrs`}
                  xAxisLabel="Year"
                  yAxisLabel="HALE"
                />
              </div>
            </div>
          </div>
        )}

        {/* Closing lines */}
        {phase >= 6 && (
          <p className="font-terminal text-2xl text-zinc-200 fade-in-slow">
            You do not need to build the machinery.
          </p>
        )}
        {phase >= 7 && (
          <p className="font-terminal text-2xl md:text-3xl text-emerald-400 fade-in-slow">
            You need to turn it on.
          </p>
        )}
      </div>

      {/* Particle burst on flip */}
      {phase >= 5 && (
        <ParticleEmitter
          emoji={["✨", "🌟", "💫"]}
          burst={40}
          direction="radial"
          speed={120}
          lifetime={3000}
          active={false}
        />
      )}

      {/* Screen flash */}
      {phase >= 5 && (
        <div
          className="absolute inset-0 pointer-events-none screen-flash z-20"
          style={{ backgroundColor: "rgb(255,255,255)" }}
          aria-hidden
        />
      )}
    </SierraSlideWrapper>
  );
}
export default SlideAlignmentSwitch;
