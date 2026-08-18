"use client";

import { useEffect, useState } from "react";

/**
 * Returns null for SSR and the first client render, then the browser's clock
 * after hydration. Use for visible dates/counters that would otherwise make
 * server-rendered Client Components hydrate against a different clock.
 */
export function useHydratedNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  return now;
}
