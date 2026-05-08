"use client";

import { useEffect, useRef, useState } from "react";

interface DeathCounterProps {
  /** Healthy life-years lost per second of delay (continuous, unrounded). */
  yearsPerSecond: number;
  /** ms timestamp when the delay clock started (task `dueAt`). */
  startMs: number;
  /** Years of healthy life lost per averted death (used to convert YoLL → deaths). */
  yearsPerDeath?: number;
  className?: string;
}

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Live continuous counter of preventable deaths from the delay on a task.
 * Reads the wall clock and recomputes every animation frame.
 *
 * The counter is *counterfactual*: each tick represents a death that
 * would not have happened if the task had been completed on time.
 */
export function DeathCounter({
  yearsPerSecond,
  startMs,
  yearsPerDeath = 40,
  className,
}: DeathCounterProps) {
  const deathsPerSecond = yearsPerSecond / yearsPerDeath;
  // Start at null so SSR and the first client render emit the same placeholder.
  // The counter only begins ticking after mount, avoiding hydration mismatch.
  const [count, setCount] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const elapsedSec = Math.max(0, (Date.now() - startMs) / 1000);
      setCount(elapsedSec * deathsPerSecond);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [startMs, deathsPerSecond]);

  return (
    <span
      className={className}
      data-visual-mask="dynamic"
      title="Preventable deaths from this delay"
      suppressHydrationWarning
    >
      {count == null ? "…" : formatter.format(count)}
    </span>
  );
}
