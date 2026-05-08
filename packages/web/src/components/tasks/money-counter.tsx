"use client";

import { useEffect, useRef, useState } from "react";

interface MoneyCounterProps {
  /** USD lost per second of delay (continuous, unrounded). */
  usdPerSecond: number;
  /** ms timestamp when the delay clock started (task `dueAt`). */
  startMs: number;
  className?: string;
}

function formatCompact(usd: number): string {
  return `$${Math.round(usd).toLocaleString()}`;
}

/**
 * Live continuous counter of taxpayer money burned during a task delay.
 * Mirrors DeathCounter — reads the wall clock, recomputes every animation
 * frame, renders a placeholder on SSR/first paint to avoid hydration mismatch.
 */
export function MoneyCounter({
  usdPerSecond,
  startMs,
  className,
}: MoneyCounterProps) {
  const [count, setCount] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const elapsedSec = Math.max(0, (Date.now() - startMs) / 1000);
      setCount(elapsedSec * usdPerSecond);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [startMs, usdPerSecond]);

  return (
    <span
      className={className}
      data-visual-mask="dynamic"
      title="Taxpayer money burned during this delay"
      suppressHydrationWarning
    >
      {count == null ? "…" : formatCompact(count)}
    </span>
  );
}
