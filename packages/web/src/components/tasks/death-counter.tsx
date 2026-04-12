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
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Live continuous counter of preventable future deaths "locked in" by the
 * delay on a task. Reads the wall clock and recomputes every animation frame.
 *
 * The counter is *counterfactual*: each tick represents a future death that
 * would not have happened if the task had been completed on time. Nobody is
 * dying in real time because of this delay — but the delay has already happened
 * and the future deaths it produces are accumulating at this rate.
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
      title="Future preventable deaths locked in by delay"
      suppressHydrationWarning
    >
      {count == null ? "…" : formatter.format(count)}
    </span>
  );
}
