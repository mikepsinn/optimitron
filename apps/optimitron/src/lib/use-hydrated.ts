"use client";

import { useEffect, useState } from "react";

/**
 * Returns false for SSR and the first client render, then true after hydration.
 * Use it to defer browser-only rendering choices without changing hydration HTML.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
