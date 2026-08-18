"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { useEffect, useState } from "react";

const cityElements = [
  { id: "hospital", emoji: "🏥", label: "Hospitals", x: 20, y: 30 },
  { id: "school", emoji: "🏫", label: "Schools", x: 70, y: 25 },
  { id: "home", emoji: "🏠", label: "Housing", x: 40, y: 50 },
  { id: "factory", emoji: "🏭", label: "Industry", x: 80, y: 60 },
  { id: "power", emoji: "⚡", label: "Power Grid", x: 15, y: 70 },
  { id: "water", emoji: "💧", label: "Water", x: 55, y: 75 },
  { id: "road", emoji: "🛣️", label: "Roads", x: 35, y: 35 },
  { id: "people", emoji: "👥", label: "Population", x: 60, y: 45 },
];

export function SlideGlobalFailedState() {
  const [decayProgress, setDecayProgress] = useState(0);
  const [failedElements, setFailedElements] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Gradually decay elements
    const interval = setInterval(() => {
      setDecayProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Elements fail as decay progresses
    const threshold = [10, 20, 30, 40, 50, 60, 70, 80];
    const newFailed = new Set<string>();
    
    cityElements.forEach((el, i) => {
      if (decayProgress >= threshold[i]) {
        newFailed.add(el.id);
      }
    });

    setFailedElements(newFailed);
  }, [decayProgress]);

  return (
    <SierraSlideWrapper act={1} className="text-zinc-200">
      {/* Title */}
      <h1 className="font-pixel text-2xl md:text-4xl text-zinc-200 mb-4 text-center">
        INFRASTRUCTURE COLLAPSE
      </h1>

      {/* City visualization */}
      <div className="relative w-full max-w-[1700px] aspect-video bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
        {/* Sky gradient that desaturates */}
        <div
          className="absolute inset-0 transition-all duration-1000"
          style={{
            background: `linear-gradient(to bottom,
              hsl(220, ${Math.max(0, 50 - decayProgress * 0.5)}%, ${Math.max(10, 20 - decayProgress * 0.1)}%),
              hsl(220, ${Math.max(0, 30 - decayProgress * 0.3)}%, ${Math.max(6, 12 - decayProgress * 0.06)}%))`,
          }}
        />

        {/* City elements */}
        {cityElements.map((el) => {
          const failed = failedElements.has(el.id);
          return (
            <div
              key={el.id}
              className={`absolute transition-all duration-500 ${
                failed ? "grayscale opacity-60" : "opacity-100"
              }`}
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="text-6xl md:text-8xl lg:text-9xl relative">
                {el.emoji}
                {failed && (
                  <span className="absolute inset-0 flex items-center justify-center text-red-400 text-7xl md:text-9xl lg:text-[10rem]">
                    ✕
                  </span>
                )}
              </div>
              <div
                className={`font-pixel text-xl md:text-2xl lg:text-3xl text-center mt-1 ${
                  failed ? "text-red-400 line-through" : "text-zinc-200"
                }`}
              >
                {el.label}
              </div>
            </div>
          );
        })}

        {/* Decay progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-100"
            style={{ width: `${decayProgress}%` }}
          />
        </div>

        {/* Status overlay */}
        <div className="absolute top-4 left-4 font-pixel text-2xl">
          <div className="text-red-400">
            SYSTEMS FAILING: {failedElements.size}/{cityElements.length}
          </div>
          <div className="text-zinc-200">
            DECAY: {decayProgress.toFixed(0)}%
          </div>

        </div>

        {/* Failed state text overlay */}
        {decayProgress >= 70 && (
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <div className="font-pixel text-2xl text-red-500 bg-black/80 mx-4 px-3 py-2 border border-red-500/40 animate-pulse">
              WHEN DESTRUCTION &gt; PRODUCTION: GLOBAL FAILED STATE
            </div>
          </div>
        )}
      </div>

      {/* World map showing collapse */}
      <div className="mt-6 w-full max-w-[1700px]">
        <div className="font-pixel text-2xl text-zinc-200 mb-2 text-center">
          NATIONS ENTERING FAILED STATE STATUS
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "Venezuela",
            "Lebanon",
            "Sri Lanka",
            "Pakistan",
            "Argentina",
            "Turkey",
            "Egypt",
            "...",
          ].map((country, i) => (
            <div
              key={country}
              className={`font-pixel text-2xl px-2 py-1 border transition-all duration-500 ${
                decayProgress > (i + 1) * 10
                  ? "border-red-500/50 bg-red-500/20 text-red-400"
                  : "border-zinc-700 text-zinc-300"
              }`}
            >
              {country}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom text */}
      <div className="mt-6 text-center">
        <div className="font-pixel text-2xl text-zinc-200">
          Without intervention, healthcare systems collapse first
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideGlobalFailedState;
