"use client";

import { useEffect, useState } from "react";
import { SierraSlideWrapper } from "./SierraSlideWrapper";

const FRIENDS = [
  { left: "10%", top: "24%", delay: "0ms" },
  { left: "25%", top: "70%", delay: "120ms" },
  { left: "50%", top: "42%", delay: "240ms" },
  { left: "73%", top: "68%", delay: "360ms" },
  { left: "90%", top: "22%", delay: "480ms" },
] as const;

export function SlideVoteAndShare() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 250),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1700),
      setTimeout(() => setPhase(4), 2500),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SierraSlideWrapper act={2} className="text-cyan-300">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center justify-center gap-6">
        <div
          className="text-center transition-all duration-500"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "translateY(0)" : "translateY(12px)",
          }}
        >
          <div className="font-pixel text-sm uppercase tracking-[0.24em] text-amber-300 md:text-lg">
            BILLIONS MUST WORK TOGETHER
          </div>
          <h1 className="mt-4 font-pixel text-3xl text-cyan-300 md:text-6xl">
            VOTE <span className="text-zinc-500">→</span> SHARE
          </h1>
          <p className="mt-4 font-terminal text-2xl text-zinc-200 md:text-4xl">
            Make the agreement visible.
          </p>
        </div>

        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-stretch gap-4 md:gap-8">
          <div
            className="border-2 border-cyan-400 bg-black/55 p-5 text-center transition-all duration-500 md:p-7"
            style={{
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? "translateX(0)" : "translateX(-24px)",
            }}
          >
            <div className="font-pixel text-sm text-zinc-500 md:text-lg">STEP 1</div>
            <div className="mt-3 font-pixel text-3xl text-cyan-300 md:text-5xl">VOTE</div>
            <div className="mt-4 font-terminal text-2xl text-zinc-200 md:text-3xl">
              Make your choice visible.
            </div>
            <div className="mt-4 font-pixel text-sm text-amber-300 md:text-lg">30 SECONDS</div>
          </div>

          <div
            className="flex items-center font-pixel text-3xl text-zinc-500 transition-opacity duration-300 md:text-5xl"
            style={{ opacity: phase >= 3 ? 1 : 0 }}
          >
            →
          </div>

          <div
            className="border-2 border-fuchsia-400 bg-black/55 p-5 text-center transition-all duration-500 md:p-7"
            style={{
              opacity: phase >= 3 ? 1 : 0,
              transform: phase >= 3 ? "translateX(0)" : "translateX(24px)",
            }}
          >
            <div className="font-pixel text-sm text-zinc-500 md:text-lg">STEP 2</div>
            <div className="mt-3 font-pixel text-3xl text-fuchsia-300 md:text-5xl">SHARE</div>
            <div className="mt-4 font-terminal text-2xl text-zinc-200 md:text-3xl">
              Help two friends vote.
            </div>
            <div className="mt-4 font-pixel text-sm text-amber-300 md:text-lg">COPY YOUR LINK</div>
          </div>
        </div>

        <div
          className="relative h-28 w-full max-w-[980px] overflow-hidden border-y border-zinc-700 bg-black/35 transition-opacity duration-500 md:h-36"
          style={{ opacity: phase >= 4 ? 1 : 0 }}
        >
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            <line x1="10%" y1="24%" x2="50%" y2="42%" stroke="rgb(34 211 238 / 0.45)" />
            <line x1="25%" y1="70%" x2="50%" y2="42%" stroke="rgb(34 211 238 / 0.45)" />
            <line x1="50%" y1="42%" x2="73%" y2="68%" stroke="rgb(232 121 249 / 0.45)" />
            <line x1="50%" y1="42%" x2="90%" y2="22%" stroke="rgb(232 121 249 / 0.45)" />
          </svg>

          {FRIENDS.map((friend, index) => (
            <div
              key={`${friend.left}-${friend.top}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 animate-pulse border border-zinc-500 bg-zinc-950 px-3 py-2 font-pixel text-xs text-zinc-100 md:text-sm"
              style={{
                left: friend.left,
                top: friend.top,
                animationDelay: friend.delay,
              }}
            >
              {index === 2 ? "YOUR VOTE" : "FRIEND VOTED"}
            </div>
          ))}
        </div>

        <div
          className="font-pixel text-base text-emerald-300 transition-all duration-500 md:text-2xl"
          style={{
            opacity: phase >= 4 ? 1 : 0,
            transform: phase >= 4 ? "translateY(0)" : "translateY(10px)",
          }}
        >
          EACH FRIEND WHO VOTES = +1 VOTE POINT
        </div>
      </div>
    </SierraSlideWrapper>
  );
}

export default SlideVoteAndShare;
