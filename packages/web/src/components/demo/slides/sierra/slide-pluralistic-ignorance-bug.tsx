"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";

const ROWS = [
  "PERSON 1",
  "PERSON 2",
  "PERSON 3",
  "PERSON 4",
  "PERSON 5",
  "...",
  "PERSON 8,000,000,000",
];

const QUOTE = "I agree we should cure diseases instead of blowing everything up, but no one else would agree to this.";

export function SlidePluralisticIgnoranceBug() {
  return (
    <SierraSlideWrapper act={2}>
      <div className="flex flex-col items-center justify-center gap-6 max-w-[1500px] mx-auto w-full">
        <h1 className="font-pixel text-2xl md:text-4xl text-brutal-yellow text-center">
          🐛 BUG: EVERYONE THINKS EVERYONE ELSE THINKS THIS IS CRAZY
        </h1>

        <div className="w-full space-y-2">
          {ROWS.map((label, i) => {
            if (label === "...") {
              return (
                <div key={i} className="font-terminal text-2xl text-muted-foreground text-center">
                  ...
                </div>
              );
            }
            return (
              <div key={i} className="flex items-start gap-3 px-2">
                <span className="text-xl shrink-0">👤</span>
                <div className="font-terminal text-lg md:text-xl">
                  <span className="text-muted-foreground">{label}: </span>
                  <span className="text-brutal-cyan">&quot;{QUOTE}&quot;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default SlidePluralisticIgnoranceBug;
