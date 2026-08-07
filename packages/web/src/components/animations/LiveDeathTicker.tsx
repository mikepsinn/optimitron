"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import {
  DEATHS_PER_SECOND,
  DEATHS_PER_DAY,
  DYSFUNCTION_TAX_PER_SECOND,
  DYSFUNCTION_TAX_PER_YEAR,
  DESTRUCTIVE_PER_SECOND,
  DESTRUCTIVE_BASE_T,
} from "@/lib/collapse-projections";
import { useHydrated } from "@/lib/use-hydrated";

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
  volatileLabel: string;
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
    volatileLabel: "deaths",
  },
  {
    rate: DYSFUNCTION_TAX_PER_SECOND,
    format: formatDollars,
    lightSurfaceColor: "text-foreground",
    darkSurfaceColor: "text-foreground",
    emoji: "🔥",
    label: "Burned by misaligned governments",
    staticFallback: `$${Math.round(DYSFUNCTION_TAX_PER_YEAR / 1e12)}T/yr governance waste`,
    volatileLabel: "governance waste",
  },
  {
    rate: DESTRUCTIVE_PER_SECOND,
    format: formatDollars,
    lightSurfaceColor: "text-foreground",
    darkSurfaceColor: "text-background",
    emoji: "💣",
    label: "Spent on destruction instead of cures",
    staticFallback: `$${DESTRUCTIVE_BASE_T.toFixed(1)}T/yr military + cybercrime`,
    volatileLabel: "destruction spend",
  },
];

type TickerRefs = ReadonlyArray<RefObject<HTMLSpanElement | null>>;

const activeTickerRefs = new Set<TickerRefs>();
let tickerStartedAt: number | null = null;
let tickerInterval: ReturnType<typeof setInterval> | null = null;

function updateTickerRefs(refs: TickerRefs, elapsedSeconds: number) {
  for (let i = 0; i < counters.length; i++) {
    const el = refs[i]?.current;
    if (el) {
      el.textContent = counters[i]!.format(counters[i]!.rate * elapsedSeconds);
    }
  }
}

function startTickerLoop() {
  if (tickerStartedAt == null) tickerStartedAt = performance.now();
  if (tickerInterval != null) return;

  const tick = () => {
    const elapsedSeconds = Math.max(0, (performance.now() - tickerStartedAt!) / 1000);
    for (const refs of activeTickerRefs) {
      updateTickerRefs(refs, elapsedSeconds);
    }
  };

  tick();
  tickerInterval = setInterval(tick, 50);
}

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
  const hasHydrated = useHydrated();
  // Automation (screenshots, copy previews, e2e) must capture a deterministic
  // frame: the live count's digit width varies with capture timing, shifting
  // this centered row between runs. Serve the static fallback there, same as
  // reduced motion. Lazy-initialized (not effect-set) so it's already correct
  // on the first client render the ticker-starting effect below observes —
  // an effect-set value lags a render, letting the interval start briefly
  // under automation before tearing back down. hasHydrated still gates the
  // rendered output, so server and first-client-render HTML still match.
  const [isAutomation] = useState(
    () => typeof navigator !== "undefined" && navigator.webdriver === true,
  );

  useEffect(() => {
    if (prefersReducedMotion || isAutomation) return;

    activeTickerRefs.add(refs);
    startTickerLoop();

    return () => {
      activeTickerRefs.delete(refs);
      if (activeTickerRefs.size === 0 && tickerInterval != null) {
        clearInterval(tickerInterval);
        tickerInterval = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion, isAutomation]);

  if (!hasHydrated || prefersReducedMotion || isAutomation) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 text-center ${className}`}>
        {counters.map((c) => (
          <div key={c.label}>
            <span className="text-3xl mr-2">{c.emoji}</span>
            <span
              className={`text-lg font-bold ${surface === "dark" ? c.darkSurfaceColor : c.lightSurfaceColor}`}
              data-volatile={c.volatileLabel}
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
              data-volatile={c.volatileLabel}
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
