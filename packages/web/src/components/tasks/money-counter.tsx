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
  if (usd >= 1e12) return `$${(usd / 1e12).toFixed(2)}T`;
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(1)}M`;
  if (usd >= 1e3) return `$${Math.round(usd / 1e3).toLocaleString()}K`;
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
      title="Taxpayer money burned during this delay"
      suppressHydrationWarning
    >
      {count == null ? "…" : formatCompact(count)}
    </span>
  );
}
