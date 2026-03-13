"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { DEATHS_PER_SECOND } from "@/data/collapse-constants";

export function LiveDeathTicker({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    let accumulated = 0;
    const interval = setInterval(() => {
      accumulated += DEATHS_PER_SECOND * 0.05;
      if (ref.current) {
        ref.current.textContent = Math.floor(accumulated).toLocaleString();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-sm font-bold text-red-600/80 uppercase tracking-wider">
          ~150,000 deaths per day (~1.7 per second) from treatable diseases
        </p>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      <div
        className="text-4xl sm:text-5xl font-black text-red-600 tabular-nums"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <span ref={ref}>0</span>
      </div>
      <p className="text-xs sm:text-sm font-bold text-red-600/70 mt-2 uppercase tracking-wider max-w-md mx-auto">
        People who died from treatable diseases since you opened this page
      </p>
      <p className="text-xs text-black/40 mt-1 italic max-w-sm mx-auto">
        Each one had a name. But sure, take your time.
      </p>
    </div>
  );
}
