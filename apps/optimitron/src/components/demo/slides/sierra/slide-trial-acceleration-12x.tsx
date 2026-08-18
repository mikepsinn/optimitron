"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import {
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  DFDA_QUEUE_CLEARANCE_YEARS,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  DFDA_FIRST_TREATMENTS_PER_YEAR,
} from "@optimitron/data/parameters";
import { useEffect, useState } from "react";

const accelerationFactor = Math.round(DFDA_TRIAL_CAPACITY_MULTIPLIER.value * 10) / 10;
const currentDurationAllDiseases = Math.round(STATUS_QUO_QUEUE_CLEARANCE_YEARS.value);
const acceleratedDurationAllDiseases = Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value);
const currentFirstTreatments = Math.round(NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR.value);
const acceleratedFirstTreatments = Math.round(DFDA_FIRST_TREATMENTS_PER_YEAR.value);

// Stuck Windows-style messages for the centralized FDA
const STUCK_MESSAGES = [
  "Reviewing application...",
  "Forming committee...",
  "Scheduling meeting about the meeting...",
  "Awaiting congressional approval...",
  "Filing Form 3500A (page 1 of 47)...",
  "Faxing results...",
  "Please do not turn off your government...",
  "Estimated time remaining: 8.2 years",
  "Rebooting committee...",
  "Your call is important to us...",
];

export function SlideTrialAcceleration12x() {
  const [phase, setPhase] = useState(0);
  const [slowProgress, setSlowProgress] = useState(0);
  const [fastProgress, setFastProgress] = useState(0);
  const [stuckMsgIdx, setStuckMsgIdx] = useState(0);
  const [skullCount, setSkullCount] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase(1), 500));
    timers.push(setTimeout(() => setPhase(2), 1500));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Slow bar: crawls to ~18% then gets stuck (you die before it finishes)
  useEffect(() => {
    if (phase < 2) return;
    const interval = setInterval(() => {
      setSlowProgress((prev) => {
        if (prev >= 18) { clearInterval(interval); return 18; }
        return prev + 0.3;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [phase]);

  // Fast bar: zooms to 100%
  useEffect(() => {
    if (phase < 2) return;
    const interval = setInterval(() => {
      setFastProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 3;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [phase]);

  // Rotate stuck messages
  useEffect(() => {
    if (phase < 2) return;
    const interval = setInterval(() => {
      setStuckMsgIdx((prev) => (prev + 1) % STUCK_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [phase]);

  // Skulls accumulate beside the slow bar
  useEffect(() => {
    if (phase < 2) return;
    const interval = setInterval(() => {
      setSkullCount((prev) => {
        if (prev >= 8) { clearInterval(interval); return 8; }
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [phase]);

  const fastDone = fastProgress >= 100;

  return (
    <SierraSlideWrapper act={2} className="text-cyan-400">
      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.4s ease-out forwards; }
        @keyframes skull-pop {
          from { opacity: 0; transform: scale(0.3); }
          to   { opacity: 1; transform: scale(1); }
        }
        .skull-pop { animation: skull-pop 0.3s ease-out forwards; }
        @keyframes happy-bounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        .happy-bounce { animation: happy-bounce 0.6s ease-in-out infinite; }
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        .blink-cursor::after {
          content: '_';
          animation: blink-cursor 0.8s step-end infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .spin-slow { animation: spin-slow 2s linear infinite; }
      `}</style>

      <div className="flex flex-col items-center gap-4 w-full max-w-[1700px] mx-auto">
        {/* Title */}
        {phase >= 1 && (
          <h1 className="font-pixel text-2xl md:text-4xl text-cyan-400 text-center fade-up">
            {accelerationFactor}x FASTER TRIALS
          </h1>
        )}

        {/* Comparison header */}
        {phase >= 1 && (
          <div className="grid grid-cols-2 gap-8 w-full fade-up">
            <div className="text-center">
              <div className="text-4xl mb-1 opacity-50">⏳</div>
              <div className="font-pixel text-lg text-zinc-200">CENTRALIZED FDA</div>
              <div className="font-pixel text-lg text-red-400">
                {currentDurationAllDiseases} years / {currentFirstTreatments} diseases per yr
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-1 spin-slow">⌛</div>
              <div className="font-pixel text-lg text-emerald-400">DECENTRALIZED FDA</div>
              <div className="font-pixel text-lg text-emerald-400">
                {acceleratedDurationAllDiseases} years / {acceleratedFirstTreatments} diseases per yr
              </div>
            </div>
          </div>
        )}

        {/* Race bars */}
        {phase >= 2 && (
          <div className="w-full space-y-6 fade-up">
            {/* CENTRALIZED FDA — stuck, Windows-update style */}
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="font-pixel text-lg text-red-400">CENTRALIZED FDA</span>
                <span className="font-pixel text-lg text-red-400">{Math.min(slowProgress, 100).toFixed(0)}%</span>
              </div>

              {/* The bar */}
              <div className="h-10 bg-zinc-900 border border-red-500/40 rounded relative overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-200"
                  style={{ width: `${Math.min(slowProgress, 100)}%` }}
                />
                {/* Fake Windows-style loading spinner */}
                {slowProgress >= 18 && (
                  <div className="absolute inset-0 flex items-center justify-center gap-2">
                    <span className="text-lg spin-slow">⚙️</span>
                    <span className="font-terminal text-sm text-red-300 blink-cursor">
                      {STUCK_MESSAGES[stuckMsgIdx]}
                    </span>
                  </div>
                )}
              </div>

              {/* Skulls accumulating below the slow bar */}
              <div className="flex items-center gap-1 mt-2 min-h-[28px]">
                {Array.from({ length: skullCount }).map((_, i) => (
                  <span key={i} className="text-xl skull-pop" style={{ animationDelay: `${i * 80}ms` }}>
                    {i % 3 === 0 ? "🪦" : i % 3 === 1 ? "💀" : "☠️"}
                  </span>
                ))}
                {skullCount > 0 && (
                  <span className="font-terminal text-sm text-red-400 ml-2">
                    patients who died waiting
                  </span>
                )}
              </div>
            </div>

            {/* DECENTRALIZED FDA — zooms to completion */}
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="font-pixel text-lg text-emerald-400">DECENTRALIZED FDA</span>
                <span className="font-pixel text-lg text-emerald-400">
                  {Math.min(fastProgress, 100).toFixed(0)}%
                  {fastDone && " — APPROVED"}
                </span>
              </div>

              <div className="h-10 bg-zinc-900 border border-emerald-500/40 rounded relative overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-100"
                  style={{ width: `${Math.min(fastProgress, 100)}%` }}
                />
                {fastDone && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-pixel text-lg text-white animate-pulse">
                      ✅ APPROVED
                    </span>
                  </div>
                )}
              </div>

              {/* Happy patients below the fast bar */}
              {fastDone && (
                <div className="flex items-center gap-1 mt-2">
                  {["😊", "🎉", "💪", "🩺", "😊", "🎊", "💊", "🥳"].map((e, i) => (
                    <span key={i} className="text-xl happy-bounce" style={{ animationDelay: `${i * 100}ms` }}>
                      {e}
                    </span>
                  ))}
                  <span className="font-terminal text-sm text-emerald-400 ml-2">
                    patients who lived
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats row */}
        {phase >= 2 && fastDone && (
          <div className="grid grid-cols-3 gap-4 w-full fade-up">
            <div className="text-center p-3 bg-cyan-500/10 border border-cyan-500/30 rounded">
              <div className="font-pixel text-2xl text-cyan-400">{acceleratedFirstTreatments}</div>
              <div className="font-pixel text-sm text-zinc-200">treatments/year</div>
              <div className="font-pixel text-xs text-zinc-400">(vs {currentFirstTreatments} now)</div>
            </div>
            <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/30 rounded">
              <div className="font-pixel text-2xl text-emerald-400">44x</div>
              <div className="font-pixel text-sm text-zinc-200">cheaper</div>
            </div>
            <div className="text-center p-3 bg-amber-500/10 border border-amber-500/30 rounded">
              <div className="font-pixel text-2xl text-amber-400">{accelerationFactor}x</div>
              <div className="font-pixel text-sm text-zinc-200">more capacity</div>
            </div>
          </div>
        )}
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideTrialAcceleration12x;
