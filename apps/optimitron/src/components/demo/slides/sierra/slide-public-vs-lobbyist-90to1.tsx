"use client";

import { useEffect, useState } from "react";
import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import { GLOBAL_HOUSEHOLD_WEALTH_USD } from "@optimitron/data/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

const publicWealth = GLOBAL_HOUSEHOLD_WEALTH_USD.value;
const defenceWealth = GAME_PARAMS.defenceWealth;

const PUBLIC_COLS = 10;
const TOTAL_PUBLIC = 90; // 90 public emojis : 1 lobbyist = 90:1 ratio
const PUBLIC_ROWS = Math.ceil(TOTAL_PUBLIC / PUBLIC_COLS);

const RATIO = Math.round(publicWealth / defenceWealth);

// Phase timing (ms)
const PHASE_1_DELAY = 500;
const PHASE_2_DELAY = 1500;
const EMOJI_STAGGER = 30; // ms between each public emoji appearing
const PHASE_3_DELAY = PHASE_2_DELAY + TOTAL_PUBLIC * EMOJI_STAGGER + 300;
const PHASE_4_DELAY = 4500;
const PHASE_5_DELAY = 6000;

export function SlidePublicVsLobbyist90to1() {
  const [phase, setPhase] = useState(0);
  const [visiblePublic, setVisiblePublic] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), PHASE_1_DELAY));
    timers.push(setTimeout(() => setPhase(2), PHASE_2_DELAY));

    // Stagger-fade the public emoji grid
    for (let i = 0; i < TOTAL_PUBLIC; i++) {
      timers.push(
        setTimeout(
          () => setVisiblePublic(i + 1),
          PHASE_2_DELAY + i * EMOJI_STAGGER
        )
      );
    }

    timers.push(setTimeout(() => setPhase(3), PHASE_3_DELAY));
    timers.push(setTimeout(() => setPhase(4), PHASE_4_DELAY));
    timers.push(setTimeout(() => setPhase(5), PHASE_5_DELAY));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SierraSlideWrapper act={2}>
      <style jsx>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.4);
          }
          70% {
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes ratioGlow {
          0%,
          100% {
            text-shadow:
              0 0 8px rgba(251, 191, 36, 0.8),
              0 0 20px rgba(251, 191, 36, 0.4);
          }
          50% {
            text-shadow:
              0 0 16px rgba(251, 191, 36, 1),
              0 0 40px rgba(251, 191, 36, 0.6),
              0 0 60px rgba(251, 191, 36, 0.3);
          }
        }
        .fade-slide-up {
          animation: fadeSlideUp 0.4s ease-out forwards;
        }
        .pop-in {
          animation: popIn 0.25s ease-out forwards;
        }
        .ratio-glow {
          animation: ratioGlow 2s ease-in-out infinite;
        }
      `}</style>

      <div className="flex flex-col items-center justify-center gap-4 max-w-[1700px] mx-auto w-full">
        {/* Phase 1: Title */}
        {phase >= 1 && (
          <h1 className="font-pixel text-2xl md:text-4xl text-amber-400 text-center fade-slide-up">
            ⚔️ BATTLE REPORT
          </h1>
        )}

        {/* Phase 2: The two sides */}
        {phase >= 2 && (
          <div className="grid grid-cols-[2fr_1fr] gap-6 w-full fade-slide-up">
            {/* LEFT: The Public — larger emojis with more horizontal room */}
            <div className="flex flex-col items-center gap-3 p-4 bg-slate-900/60 border border-emerald-500/30 rounded">
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${PUBLIC_COLS}, 1fr)` }}
              >
                {Array.from({ length: TOTAL_PUBLIC }).map((_, i) => (
                  <span
                    key={i}
                    className="text-4xl md:text-5xl leading-none"
                    style={{
                      opacity: i < visiblePublic ? 1 : 0,
                      animation:
                        i < visiblePublic
                          ? "popIn 0.25s ease-out forwards"
                          : "none",
                    }}
                  >
                    👤
                  </span>
                ))}
              </div>
              <div className="font-pixel text-2xl text-emerald-400 tracking-widest mt-1">
                THE PUBLIC
              </div>
            </div>

            {/* RIGHT: The Lobbyists — 1 emoji, same size as public emojis */}
            <div className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-900/60 border border-red-500/30 rounded">
              <div className="text-4xl md:text-5xl">🤵</div>
              <div className="font-pixel text-2xl text-red-400 tracking-widest">
                LOBBYISTS
              </div>
            </div>
          </div>
        )}

        {/* Phase 3: Stats below each side */}
        {phase >= 3 && (
          <div className="grid grid-cols-[2fr_1fr] gap-6 w-full fade-slide-up">
            {/* Public stats */}
            <div className="space-y-1 text-center">
              <div className="font-pixel text-xl md:text-3xl text-emerald-400">
                {formatCurrency(publicWealth)}
              </div>
              <div className="font-terminal text-xl text-emerald-600">
                Want: health + wealth
              </div>
            </div>

            {/* Lobbyist stats */}
            <div className="space-y-1 text-center">
              <div className="font-pixel text-xl md:text-3xl text-red-400">
                {formatCurrency(defenceWealth)}
              </div>
              <div className="font-terminal text-xl text-red-600">
                Want: your money
              </div>
            </div>
          </div>
        )}

        {/* Phase 4: The ratio */}
        {phase >= 4 && (
          <div className="text-center fade-slide-up">
            <div className="font-pixel text-5xl md:text-7xl text-amber-400 ratio-glow">
              {RATIO} : 1
            </div>
          </div>
        )}

        {/* Phase 5: The punchline */}
        {phase >= 5 && (
          <div className="w-full bg-black/60 border border-amber-500/30 rounded p-4 fade-slide-up">
            <div className="font-pixel text-xl md:text-3xl text-red-400 text-center mb-2">
              CURRENT STATUS: They are winning.
            </div>
            <div className="font-terminal text-xl md:text-3xl text-amber-400 text-center">
              REASON: They have a group chat.
            </div>
            <div className="font-terminal text-xl md:text-2xl text-amber-300 text-center font-bold mt-1">
              You do not.
            </div>
          </div>
        )}
      </div>
    </SierraSlideWrapper>
  );
}
export default SlidePublicVsLobbyist90to1;
