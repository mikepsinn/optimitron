"use client";

import { useEffect, useRef, useState } from "react";
import { GLOBAL_DISEASE_DEATHS_PER_MINUTE } from "@optimitron/data/parameters";

const DEATHS_PER_MS = GLOBAL_DISEASE_DEATHS_PER_MINUTE.value / 60_000;
const TICK_MS = 250;

/**
 * Deaths from curable disease since mount, ticking every 250ms.
 * Shared by `eos-retro/DeathCounter` and `donate/DeathTicker` so the
 * rate math lives in one place.
 *
 * - `trackVisibility: false` (default): `open` is one wall-clock count;
 *   it keeps accruing while the tab is hidden and catches up on return.
 * - `trackVisibility: true`: `open` accrues only while the tab is visible
 *   (Page Visibility API); `away` accrues the hidden time, credited when
 *   the visitor returns.
 * - `enabled: false`: no interval runs; both counts hold (reduced motion).
 */
export function useDeathTick({
  enabled = true,
  trackVisibility = false,
}: { enabled?: boolean; trackVisibility?: boolean } = {}): {
  open: number;
  away: number;
} {
  const [open, setOpen] = useState(0);
  const [away, setAway] = useState(0);
  const lastTickRef = useRef<number | null>(null);
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (!trackVisibility) {
      const startedAt = Date.now();
      const interval = setInterval(() => {
        setOpen((Date.now() - startedAt) * DEATHS_PER_MS);
      }, TICK_MS);
      return () => clearInterval(interval);
    }

    lastTickRef.current = performance.now();

    const interval = setInterval(() => {
      if (document.hidden || lastTickRef.current === null) return;
      const now = performance.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;
      setOpen((d) => d + elapsed * DEATHS_PER_MS);
    }, TICK_MS);

    const onVisibility = () => {
      if (document.hidden) {
        hiddenAtRef.current = performance.now();
        lastTickRef.current = null;
      } else {
        const hiddenAt = hiddenAtRef.current;
        if (hiddenAt !== null) {
          setAway((d) => d + (performance.now() - hiddenAt) * DEATHS_PER_MS);
          hiddenAtRef.current = null;
        }
        lastTickRef.current = performance.now();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, trackVisibility]);

  return { open, away };
}
