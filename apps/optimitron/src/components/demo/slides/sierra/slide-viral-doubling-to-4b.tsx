"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { ParticleEmitter } from "../../animations/sierra/particle-emitter";
import {
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@optimitron/data/parameters";
import { useEffect, useState } from "react";

const LIVES_PER_VOTE = VOTER_LIVES_SAVED.value;
const SUFFERING_HOURS_PER_VOTE = VOTER_SUFFERING_HOURS_PREVENTED.value;
const SUFFERING_YEARS_PER_VOTE = Math.round(SUFFERING_HOURS_PER_VOTE / 8_760);

export function SlideViralDoublingTo4b() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 2000);
    const t3 = setTimeout(() => setPhase(3), 4000);
    const t4 = setTimeout(() => setPhase(4), 6000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <SierraSlideWrapper act={2}>
      {/* Confetti burst */}
      {phase >= 1 && (
        <ParticleEmitter
          emoji={["🎉", "🎊", "✨", "⭐"]}
          burst={25}
          direction="radial"
          speed={80}
          lifetime={2000}
          active={false}
        />
      )}

      <div className="flex flex-col items-center gap-6 w-full max-w-[1700px] mx-auto">
        {/* Phase 1: Banner */}
        {phase >= 1 && (
          <div className="text-center slide-fade-in">
            <div className="relative inline-block">
              <div className="vote-glow absolute inset-0 blur-lg opacity-40 rounded" />
              <h1 className="relative font-pixel text-3xl md:text-5xl text-emerald-400">
                🎉 VOTE RECORDED
              </h1>
            </div>
            <p className="font-pixel text-xl md:text-3xl text-zinc-200 mt-3" />
          </div>
        )}

        {/* Phase 2: YOUR VOTE JUST... */}
        {phase >= 2 && (
          <div className="w-full slide-fade-in">
            <div className="font-pixel text-2xl md:text-3xl text-emerald-400 text-center mb-4">
              YOUR VOTE JUST:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-5 text-center">
                <div className="text-4xl md:text-5xl mb-2">❤️</div>
                <div className="font-pixel text-3xl md:text-4xl text-emerald-400">
                  {LIVES_PER_VOTE.toFixed(1)}
                </div>
                <div className="font-pixel text-xl md:text-2xl text-zinc-200 mt-1">
                  LIVES SAVED
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5 text-center">
                <div className="text-4xl md:text-5xl mb-2">⏱️</div>
                <div className="font-pixel text-3xl md:text-4xl text-amber-400">
                  {SUFFERING_YEARS_PER_VOTE.toLocaleString()}
                </div>
                <div className="font-pixel text-xl md:text-2xl text-zinc-200 mt-1">
                  YEARS OF SUFFERING PREVENTED
                </div>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-5 text-center">
                <div className="text-4xl md:text-5xl mb-2">💰</div>
                <div className="font-pixel text-3xl md:text-4xl text-cyan-400">
                  ${Math.round(LIVES_PER_VOTE * 150_000).toLocaleString()}
                </div>
                <div className="font-pixel text-xl md:text-2xl text-zinc-200 mt-1">
                  ECONOMIC VALUE CREATED
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase 3: Time investment */}
        {phase >= 3 && (
          <div className="text-center slide-fade-in space-y-2">
            <div className="font-pixel text-2xl md:text-3xl text-zinc-200">
              TIME INVESTED: <span className="text-emerald-400">30 SECONDS</span>
            </div>
            <div className="font-pixel text-2xl md:text-3xl text-zinc-400">
              Get 10 friends to vote (15 min) → multiply all numbers by 10
            </div>
          </div>
        )}

        {/* Phase 4: Action buttons */}
        {phase >= 4 && (
          <div className="flex gap-4 slide-fade-in">
            <button className="border-2 border-emerald-500/50 px-6 py-3 rounded font-pixel text-xl md:text-2xl text-emerald-400 cursor-default">
              📋 COPY LINK
            </button>
            <button className="border-2 border-emerald-500/50 px-6 py-3 rounded font-pixel text-xl md:text-2xl text-emerald-400 cursor-default">
              📱 SHARE
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-fade-in {
          animation: slide-fade-in 0.4s ease-out forwards;
        }
        .vote-glow {
          background: #34d399;
        }
      `}</style>
    </SierraSlideWrapper>
  );
}
export default SlideViralDoublingTo4b;
