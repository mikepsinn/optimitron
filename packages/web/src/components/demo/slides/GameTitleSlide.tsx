"use client";

import { ScanLines } from "@/components/animations/GlitchText";
import { PulseGlow } from "@/components/animations/PulseGlow";

const ARCADE = "font-pixel";

/** 2. Game title slide — neon arcade title screen */
export default function GameTitleSlide() {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 bg-foreground overflow-hidden">
      <ScanLines />
      <PulseGlow color="rgba(255,105,180,0.4)" className="mb-8">
        <h1 className={`${ARCADE} text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-brutal-pink leading-none tracking-tight`}>
          THE EARTH
          <br />
          OPTIMIZATION
          <br />
          GAME
        </h1>
      </PulseGlow>
      <p
        className={`${ARCADE} text-2xl sm:text-3xl md:text-4xl text-background`}
        style={{ animation: "press-start-blink 1s step-end infinite" }}
      >
        PRESS START
      </p>
      <style>{`
        @keyframes press-start-blink { from, to { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
