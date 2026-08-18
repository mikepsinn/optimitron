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

const VISUAL_REVIEW_DEATH_PLACEHOLDER = "123,456";

function isVisualReviewMode(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(
      (window as Window & { __OPTIMITRON_VISUAL_REVIEW__?: boolean })
        .__OPTIMITRON_VISUAL_REVIEW__,
    )
  );
}

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
  const visualReviewMode = isVisualReviewMode();
  // Start at null so SSR and the first client render emit the same placeholder.
  // The counter only begins ticking after mount, avoiding hydration mismatch.
  const [count, setCount] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (visualReviewMode) return;

    const tick = () => {
      const elapsedSec = Math.max(0, (Date.now() - startMs) / 1000);
      setCount(elapsedSec * deathsPerSecond);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [startMs, deathsPerSecond, visualReviewMode]);

  return (
    <span
      className={className}
      data-visual-mask="dynamic"
      data-visual-placeholder={VISUAL_REVIEW_DEATH_PLACEHOLDER}
      data-volatile="deaths"
      title="Preventable deaths from this delay"
      suppressHydrationWarning
    >
      {visualReviewMode
        ? VISUAL_REVIEW_DEATH_PLACEHOLDER
        : count == null ? "…" : formatter.format(count)}
    </span>
  );
}
