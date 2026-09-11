"use client";

import { useEffect, useState } from "react";

/**
 * Returns null for SSR and the first client render, then the browser's clock
 * after hydration. Use for visible dates/counters that would otherwise make
 * server-rendered Client Components hydrate against a different clock.
 * Pass an interval to refresh live counters from the actual clock each tick.
 */
export function useHydratedNow(refreshIntervalMs?: number): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    if (refreshIntervalMs == null) return;
    const interval = setInterval(() => setNow(new Date()), refreshIntervalMs);
    return () => clearInterval(interval);
  }, [refreshIntervalMs]);

  return now;
}
