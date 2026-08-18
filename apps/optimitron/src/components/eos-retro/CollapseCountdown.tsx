"use client";

import { useEffect, useState } from "react";

/**
 * Live countdown to the destructive-economy crossover year. Renders
 * nothing until mounted so the SSR output (and copy previews) stay
 * stable; the static year beside it carries the content without JS.
 */
export function CollapseCountdown({ targetYear }: { targetYear: number }) {
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const target = new Date(`${targetYear}-01-01T00:00:00Z`).getTime();
    function tick() {
      const diff = Math.max(0, target - Date.now());
      const s = Math.floor(diff / 1000);
      const years = Math.floor(s / (365.25 * 86400));
      const days = Math.floor((s % (365.25 * 86400)) / 86400);
      const hrs = Math.floor((s % 86400) / 3600);
      const mins = Math.floor((s % 3600) / 60);
      const secs = s % 60;
      setDisplay(
        `${years}y ${String(days).padStart(3, "0")}d ${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
      );
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetYear]);

  if (display === null) return null;

  return (
    <p className="er-countdown mt-3" data-volatile="collapse-countdown">
      T minus {display}
    </p>
  );
}
