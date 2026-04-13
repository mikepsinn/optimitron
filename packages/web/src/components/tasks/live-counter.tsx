"use client";

import { useEffect, useState } from "react";

interface LiveCounterProps {
  /** Per-second growth rate. */
  ratePerSecond: number;
  /** Wall-clock ms when the tick clock started (task dueAt). */
  startMs: number;
  /** Display mode: integer with commas or USD with commas (no decimals). */
  mode: "integer" | "currency";
  className?: string;
}

/** Tick every 250ms — 4 updates/sec, smooth enough to feel live, cheap on CPU. */
const TICK_INTERVAL_MS = 250;

const intFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatCurrency(value: number): string {
  return `$${intFormatter.format(Math.max(0, Math.floor(value)))}`;
}

function formatInteger(value: number): string {
  return intFormatter.format(Math.max(0, Math.floor(value)));
}

/**
 * A single live-updating counter throttled to 4 updates/sec. Integer mode
 * renders comma-separated integers; currency mode prefixes "$". Renders "…"
 * on SSR + first client paint to avoid hydration mismatch, then starts
 * ticking on mount.
 *
 * Designed to be safe at ~40 concurrent instances (e.g. a paginated signer
 * leaderboard with 20 rows × 2 counters each).
 */
export function LiveCounter({
  ratePerSecond,
  startMs,
  mode,
  className,
}: LiveCounterProps) {
  const [displayValue, setDisplayValue] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const elapsedSec = Math.max(0, (Date.now() - startMs) / 1000);
      const value = elapsedSec * ratePerSecond;
      setDisplayValue(mode === "currency" ? formatCurrency(value) : formatInteger(value));
    };
    tick();
    const interval = window.setInterval(tick, TICK_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [ratePerSecond, startMs, mode]);

  return (
    <span className={className} suppressHydrationWarning>
      {displayValue ?? "…"}
    </span>
  );
}
