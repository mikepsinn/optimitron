"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import {
  DEATHS_PER_SECOND,
  DEATHS_PER_DAY,
  DYSFUNCTION_TAX_PER_SECOND,
  DYSFUNCTION_TAX_PER_YEAR,
  DESTRUCTIVE_PER_SECOND,
  DESTRUCTIVE_BASE_T,
} from "@/data/collapse-constants";

function formatDollars(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.floor(n).toLocaleString()}`;
}

interface CounterConfig {
  rate: number;
  format: (n: number) => string;
  color: string;
  label: string;
  quip: string;
  staticFallback: string;
}

const counters: CounterConfig[] = [
  {
    rate: DEATHS_PER_SECOND,
    format: (n) => Math.floor(n).toLocaleString(),
    color: "text-brutal-yellow",
    label: "Died from treatable diseases since you opened this page",
    quip: "Each one had a name. But sure, take your time.",
    staticFallback: `~${DEATHS_PER_DAY.toLocaleString()} deaths per day (~${DEATHS_PER_SECOND.toFixed(1)}/sec)`,
  },
  {
    rate: DYSFUNCTION_TAX_PER_SECOND,
    format: formatDollars,
    color: "text-brutal-red",
    label: "Burned by misaligned governments since you opened this page",
    quip: "That's your money, by the way. You earned it. They wasted it.",
    staticFallback: `$${Math.round(DYSFUNCTION_TAX_PER_YEAR / 1e12)}T/yr in governance dysfunction (~$${(DYSFUNCTION_TAX_PER_SECOND / 1e6).toFixed(1)}M/sec)`,
  },
  {
    rate: DESTRUCTIVE_PER_SECOND,
    format: formatDollars,
    color: "text-brutal-yellow",
    label: "Spent on destruction instead of cures since you opened this page",
    quip: "Every dollar here creates the next cybercriminal. It's a lovely system you've built.",
    staticFallback: `$${DESTRUCTIVE_BASE_T.toFixed(1)}T/yr on military + cybercrime (~$${Math.round(DESTRUCTIVE_PER_SECOND / 1e3)}K/sec)`,
  },
];

export function LiveDeathTicker({ className = "" }: { className?: string }) {
  const refs = [
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
  ];
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const accumulated = [0, 0, 0];
    const interval = setInterval(() => {
      for (let i = 0; i < counters.length; i++) {
        accumulated[i] += counters[i]!.rate * 0.05;
        const el = refs[i]!.current;
        if (el) {
          el.textContent = counters[i]!.format(accumulated[i]!);
        }
      }
    }, 50);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 text-center ${className}`}>
        {counters.map((c) => (
          <div key={c.label}>
            <p className={`text-sm font-bold ${c.color}/80 uppercase tracking-wider`}>
              {c.staticFallback}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 text-center ${className}`}>
      {counters.map((c, i) => (
        <div key={c.label}>
          <div
            className={`text-3xl sm:text-4xl font-black ${c.color}`}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            <span ref={refs[i]}>{c.format(0)}</span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-2 uppercase tracking-wider max-w-xs mx-auto">
            {c.label}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1 italic max-w-xs mx-auto">
            {c.quip}
          </p>
        </div>
      ))}
    </div>
  );
}
