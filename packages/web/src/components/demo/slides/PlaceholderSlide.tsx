"use client";

import { useSierraGame } from "../SierraGameContext";

const ARCADE = "font-pixel";

/** Generic fallback slide — shows narration text centered on screen */
export default function PlaceholderSlide() {
  const { state } = useSierraGame();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <h2
        className={`${ARCADE} text-3xl sm:text-4xl md:text-5xl font-black uppercase text-foreground mb-6`}
      >
        ⚙️
      </h2>
      {state.narrationText && (
        <p className="text-lg sm:text-xl font-bold text-muted-foreground max-w-2xl leading-relaxed">
          {state.narrationText}
        </p>
      )}
    </div>
  );
}
