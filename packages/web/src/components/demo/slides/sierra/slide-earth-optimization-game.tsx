"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { useEffect, useState } from "react";

export function SlideEarthOptimizationGame() {
  const [phase, setPhase] = useState(0);
  const [blinkVisible, setBlinkVisible] = useState(true);
  const [curesPct, setCuresPct] = useState(0);
  const [fingerVisible, setFingerVisible] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),   // Title appears
      setTimeout(() => {
        setPhase(2);
        setFingerVisible(true);
        // Sweep back and forth then settle
        setTimeout(() => {
          const keyframes = [
            { target: 3, speed: 0.06 },
            { target: 0.3, speed: 0.04 },
            { target: 5, speed: 0.06 },
            { target: 0.5, speed: 0.04 },
            { target: 2, speed: 0.04 },
            { target: 1, speed: 0.02 },
          ];
          let step = 0;
          function animateToTarget() {
            const kf = keyframes[step];
            if (!kf) {
              setPhase(3);
              setTimeout(() => setPhase(4), 1000);
              return;
            }
            const interval = setInterval(() => {
              setCuresPct((prev) => {
                const diff = kf.target - prev;
                if (Math.abs(diff) < 0.03) {
                  clearInterval(interval);
                  step++;
                  setTimeout(animateToTarget, 150);
                  return kf.target;
                }
                return prev + Math.sign(diff) * kf.speed;
              });
            }, 30);
          }
          animateToTarget();
        }, 600);
      }, 1800),
    ];

    const blinkInterval = setInterval(() => {
      setBlinkVisible((prev) => !prev);
    }, 530);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(blinkInterval);
    };
  }, []);

  return (
    <SierraSlideWrapper act={1} className="text-amber-400">
      <style jsx>{`
        @keyframes scanlines {
          0%   { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }
        .scanline-overlay {
          pointer-events: none;
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.08) 2px,
            rgba(0,0,0,0.08) 4px
          );
          animation: scanlines 0.1s steps(1) infinite;
        }
        @keyframes titleGlow {
          0%, 100% { text-shadow: 0 0 10px rgba(245,158,11,0.5), 0 0 40px rgba(245,158,11,0.2); }
          50%      { text-shadow: 0 0 20px rgba(245,158,11,0.8), 0 0 60px rgba(245,158,11,0.4); }
        }
        .title-glow {
          animation: titleGlow 3s ease-in-out infinite;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeSlideUp 0.6s ease-out forwards; }
        @keyframes typeIn {
          from { max-width: 0; }
          to   { max-width: 100%; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50%      { opacity: 1; transform: scale(1); }
        }
        .sparkle-1 { animation: sparkle 1.4s ease-in-out infinite 0.0s; }
        .sparkle-2 { animation: sparkle 1.4s ease-in-out infinite 0.35s; }
        .sparkle-3 { animation: sparkle 1.4s ease-in-out infinite 0.7s; }
        .sparkle-4 { animation: sparkle 1.4s ease-in-out infinite 1.05s; }
      `}</style>

      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      <div className="flex flex-col items-center justify-center gap-6 max-w-[1700px] mx-auto relative">

        {/* Decorative top border */}
        <div className="font-pixel text-xs md:text-sm text-amber-400/40 tracking-[0.5em] text-center">
          ★ ═══════════════════════════════════════════ ★
        </div>

        {/* Main Title */}
        {phase >= 1 && (
          <div className="text-center space-y-2 fade-up">
            <div className="font-pixel text-base md:text-xl text-red-400 tracking-widest">
              🌍 WISHONIA PRESENTS 🌍
            </div>
            <h1 className="font-pixel text-4xl md:text-7xl text-amber-400 leading-relaxed tracking-wide title-glow">
              THE EARTH
              <br />
              OPTIMIZATION GAME
            </h1>
          </div>
        )}

        {/* Allocation Slider */}
        {phase >= 1 && (
          <div className="w-full max-w-5xl space-y-3 fade-up">
            <div className="relative mb-10">
              <div className="relative h-14 bg-zinc-900 border-2 border-zinc-600 rounded">
                {/* Explosions portion */}
                <div
                  className="absolute inset-y-0 left-0 bg-brutal-red transition-all duration-100 flex items-center justify-center overflow-hidden rounded-l"
                  style={{ width: `${100 - curesPct}%` }}
                >
                  <span className="font-pixel text-xl md:text-2xl text-brutal-red-foreground whitespace-nowrap">
                    💥 {(100 - curesPct).toFixed(0)}% EXPLOSIONS 💥
                  </span>
                </div>
                {/* Cures portion */}
                <div
                  className="absolute inset-y-0 right-0 bg-brutal-cyan transition-all duration-100 overflow-hidden rounded-r"
                  style={{ width: `${Math.max(curesPct, 0.2)}%` }}
                />
              </div>
              {/* Finger below the bar */}
              {fingerVisible && (
                <div
                  className="absolute top-full mt-1 z-10 pointer-events-none transition-all duration-100"
                  style={{
                    left: `${100 - curesPct}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <span className={`text-4xl ${curesPct === 0 ? "animate-bounce" : ""}`}>☝️</span>
                </div>
              )}
            </div>
            <div className="flex justify-between font-pixel text-lg md:text-xl">
              <span className="text-brutal-red">💣 {(100 - curesPct).toFixed(0)}% EXPLOSIONS</span>
              <span className="text-brutal-cyan">CURES {curesPct.toFixed(1)}% 🧬</span>
            </div>

            {/* +$27B popup */}
            <div className="h-12 flex items-center justify-center">
              {phase >= 3 && (
                <div className="font-pixel text-xl md:text-2xl text-brutal-cyan animate-bounce bg-muted border-2 border-brutal-cyan rounded px-6 py-2">
                  🧪 +$27B → CURES 🧪
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subtitle + Press Start */}
        {phase >= 4 && (
          <div className="text-center space-y-5 fade-up">
            <p className="font-pixel text-xl md:text-2xl text-zinc-300 italic max-w-4xl">
              A Point-and-Click Adventure in Civilisational Reallocation
            </p>

            {/* Decorative sparkles around PRESS START */}
            <div className="relative inline-block">
              <span className="absolute -left-8 top-1/2 -translate-y-1/2 text-amber-400 sparkle-1">✦</span>
              <span className="absolute -right-8 top-1/2 -translate-y-1/2 text-amber-400 sparkle-2">✦</span>
              <span className="absolute left-1/4 -top-4 text-amber-300 sparkle-3">✧</span>
              <span className="absolute right-1/4 -top-4 text-amber-300 sparkle-4">✧</span>
              <span
                className="font-pixel text-2xl md:text-4xl text-amber-400 tracking-widest"
                style={{ opacity: blinkVisible ? 1 : 0, transition: "opacity 0.15s" }}
              >
                ▶ INSERT COIN ◀
              </span>
            </div>
          </div>
        )}

        {/* Decorative bottom border */}
        <div className="font-pixel text-xs md:text-sm text-amber-400/40 tracking-[0.5em] text-center">
          ★ ═══════════════════════════════════════════ ★
        </div>

        {/* Retro copyright */}
        <div className="font-pixel text-xs text-zinc-600 text-center tracking-wider">
          © 4237 WISHONIA OPTIMIZATION SYSTEMS — ALL SPECIES RESERVED
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideEarthOptimizationGame;
