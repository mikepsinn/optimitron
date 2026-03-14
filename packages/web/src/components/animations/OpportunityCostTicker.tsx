"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import {
  DYSFUNCTION_TAX_PER_SECOND,
  CLINICAL_TRIAL_COST,
} from "@/data/collapse-constants";

/**
 * Shows clinical trials that could have been funded with governance waste,
 * ticking up in real-time. Contextualizes money as treatments.
 */
export function OpportunityCostTicker({
  className = "",
}: {
  className?: string;
}) {
  const trialsRef = useRef<HTMLSpanElement>(null);
  const dollarsRef = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    let accumulated = 0;
    const interval = setInterval(() => {
      accumulated += DYSFUNCTION_TAX_PER_SECOND * 0.05;
      const trials = accumulated / CLINICAL_TRIAL_COST;
      if (trialsRef.current) {
        trialsRef.current.textContent = trials.toFixed(1);
      }
      if (dollarsRef.current) {
        const millions = accumulated / 1e6;
        dollarsRef.current.textContent = `$${millions.toFixed(1)}M`;
      }
    }, 50);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-sm font-bold text-black/60">
          ~2 million clinical trials could be funded per year with the money
          governments waste. That&apos;s every disease. Every treatment. Every person
          currently told &ldquo;there&apos;s nothing we can do.&rdquo;
        </p>
      </div>
    );
  }

  return (
    <div
      className={`p-4 bg-white/80 border-2 border-red-300 text-center ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
        <div>
          <span className="text-xs font-bold text-black/40 uppercase tracking-wider">
            Since you opened this page,{" "}
          </span>
          <span
            ref={dollarsRef}
            className="text-lg sm:text-xl font-black text-red-600"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            $0.0M
          </span>
          <span className="text-xs font-bold text-black/40 uppercase tracking-wider">
            {" "}in governance waste could have funded{" "}
          </span>
          <span
            ref={trialsRef}
            className="text-lg sm:text-xl font-black text-emerald-600"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            0.0
          </span>
          <span className="text-xs font-bold text-black/40 uppercase tracking-wider">
            {" "}clinical trials
          </span>
        </div>
      </div>
      <p className="text-[10px] text-black/30 mt-1 italic">
        At $50M per trial. 95% of diseases have zero approved treatments.
        The money exists. It&apos;s just being set on fire.
      </p>
    </div>
  );
}
