"use client";

import { SlideBase } from "../slide-base";
import { useEffect, useState } from "react";

const YOUR_ACTIONS = [
  {
    action: "RECRUITED 7 verified voters",
    emoji: "✊",
    hypercert: "Voter Recruitment: 7 verified, 12 total, 58.3% verification rate",
    impact: "Published to AT Protocol — permanent, auditable",
    color: "emerald",
  },
  {
    action: "DEPOSITED $500 to Prize Pool",
    emoji: "💰",
    hypercert: "PRIZE Pool Contribution: $500 USDC — funding the campaign",
    impact: "On-chain deposit + AT Protocol attestation",
    color: "amber",
  },
  {
    action: "SCORED 87% Alignment on Rep. Smith",
    emoji: "🔍",
    hypercert: "Citizen Alignment: 14 votes compared, 412 participants",
    impact: "Politician accountability, verifiable on Bluesky",
    color: "purple",
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  emerald: { bg: "bg-brutal-cyan/10", border: "border-brutal-cyan/40", text: "text-brutal-cyan" },
  amber: { bg: "bg-brutal-yellow/10", border: "border-brutal-yellow/40", text: "text-brutal-yellow" },
  purple: { bg: "bg-brutal-pink/10", border: "border-brutal-pink/40", text: "text-brutal-pink" },
};

export function SlideHypercerts() {
  const [phase, setPhase] = useState(0);
  const [visibleCards, setVisibleCards] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), 500));
    timers.push(setTimeout(() => setPhase(2), 1500));
    YOUR_ACTIONS.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCards(i + 1), 2000 + i * 800));
    });
    timers.push(setTimeout(() => setPhase(3), 5000));
    timers.push(setTimeout(() => setPhase(4), 7000));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SlideBase act={2} className="text-purple-400">
      <div className="flex flex-col items-center justify-center gap-5 max-w-[1700px] mx-auto w-full">
        {/* Title */}
        <h1
          className="font-pixel text-3xl md:text-5xl text-purple-400 text-center transition-opacity duration-500"
          style={{ opacity: phase >= 1 ? 1 : 0 }}
        >
          🏆 YOUR IMPACT, ON-CHAIN
        </h1>

        {/* Subtitle */}
        <div
          className="font-terminal text-xl md:text-2xl text-zinc-200 text-center transition-opacity duration-500"
          style={{ opacity: phase >= 2 ? 1 : 0 }}
        >
          Every action you take mints a <span className="text-purple-400 font-pixel">Hypercert</span> —
          permanent, verifiable proof of your contribution
        </div>

        {/* Action → Hypercert cards */}
        <div className="w-full space-y-4">
          {YOUR_ACTIONS.slice(0, visibleCards).map((item, i) => {
            const colors = colorMap[item.color];
            return (
              <div
                key={i}
                className={`${colors.bg} border-2 ${colors.border} rounded-lg p-5 flex items-start gap-5 card-in`}
              >
                {/* Emoji */}
                <div className="text-4xl md:text-5xl shrink-0">{item.emoji}</div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="font-pixel text-xl md:text-2xl text-zinc-200">
                    YOU {item.action.toUpperCase()}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-pixel text-xl text-purple-400">HYPERCERT:</span>
                    <span className={`font-terminal text-xl md:text-2xl ${colors.text}`}>
                      {item.hypercert}
                    </span>
                  </div>
                  <div className="font-terminal text-xl text-zinc-300">
                    Verified impact: {item.impact}
                  </div>
                </div>

                {/* On-chain badge */}
                <div className="shrink-0 text-center">
                  <div className="text-3xl">⛓️</div>
                  <div className="font-pixel text-xl text-emerald-400">ON-CHAIN</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Properties */}
        {phase >= 3 && (
          <div className="flex justify-center gap-6 md:gap-10 card-in">
            <div className="text-center">
              <div className="text-3xl">🔒</div>
              <div className="font-pixel text-xl text-zinc-200">PERMANENT</div>
            </div>
            <div className="text-center">
              <div className="text-3xl">🔍</div>
              <div className="font-pixel text-xl text-zinc-200">VERIFIABLE</div>
            </div>
            <div className="text-center">
              <div className="text-3xl">🦋</div>
              <div className="font-pixel text-xl text-zinc-200">ON BLUESKY</div>
            </div>
            <div className="text-center">
              <div className="text-3xl">📊</div>
              <div className="font-pixel text-xl text-zinc-200">AUDITABLE</div>
            </div>
          </div>
        )}

        {/* Punchline */}
        {phase >= 4 && (
          <p className="font-pixel text-xl md:text-2xl text-zinc-200 text-center italic max-w-4xl leading-relaxed card-in">
            If a charity tells you they saved ten thousand lives, you ask for the
            Hypercert. If they do not have one, they did not save ten thousand lives.
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes card-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card-in {
          animation: card-in 0.4s ease-out forwards;
        }
      `}</style>
    </SlideBase>
  );
}
