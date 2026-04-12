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
} from "@/lib/collapse-projections";

function formatDollars(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.floor(n).toLocaleString()}`;
}

interface CounterConfig {
  rate: number;
  format: (n: number) => string;
  lightSurfaceColor: string;
  darkSurfaceColor: string;
  emoji: string;
  label: string;
  staticFallback: string;
}

const counters: CounterConfig[] = [
  {
    rate: DEATHS_PER_SECOND,
    format: (n) => Math.floor(n).toLocaleString(),
    lightSurfaceColor: "text-brutal-red",
    darkSurfaceColor: "text-brutal-red",
    emoji: "💀",
    label: "Humans terminated",
    staticFallback: `~${DEATHS_PER_DAY.toLocaleString()} humans terminated/day`,
  },
  {
    rate: DYSFUNCTION_TAX_PER_SECOND,
    format: formatDollars,
    lightSurfaceColor: "text-foreground",
    darkSurfaceColor: "text-brutal-pink",
    emoji: "🔥",
    label: "Burned by misaligned governments",
    staticFallback: `$${Math.round(DYSFUNCTION_TAX_PER_YEAR / 1e12)}T/yr governance waste`,
  },
  {
    rate: DESTRUCTIVE_PER_SECOND,
    format: formatDollars,
    lightSurfaceColor: "text-foreground",
    darkSurfaceColor: "text-brutal-cyan",
    emoji: "💣",
    label: "Spent on destruction instead of cures",
    staticFallback: `$${DESTRUCTIVE_BASE_T.toFixed(1)}T/yr military + cybercrime`,
  },
];

export function LiveDeathTicker({
  className = "",
  surface = "light",
}: {
  className?: string;
  surface?: "light" | "dark";
}) {
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
            <span className="text-3xl mr-2">{c.emoji}</span>
            <span
              className={`text-lg font-bold ${surface === "dark" ? c.darkSurfaceColor : c.lightSurfaceColor}`}
            >
              {c.staticFallback}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 text-center ${className}`}>
      {counters.map((c, i) => (
        <div key={c.label}>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl sm:text-5xl">{c.emoji}</span>
            <span
              className={`text-3xl sm:text-4xl font-black ${surface === "dark" ? c.darkSurfaceColor : c.lightSurfaceColor}`}
              style={{ fontVariantNumeric: "tabular-nums" }}
              ref={refs[i]}
            >
              {c.format(0)}
            </span>
          </div>
          <p
            className={`mt-2 mx-auto max-w-xs text-sm font-bold uppercase tracking-wider sm:text-base ${
              surface === "dark" ? "text-zinc-100" : "text-muted-foreground"
            }`}
          >
            {c.label}
          </p>
        </div>
      ))}
    </div>
  );
}
