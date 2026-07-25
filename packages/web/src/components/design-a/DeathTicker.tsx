"use client";

import { useEffect, useState } from "react";
import { GLOBAL_DISEASE_DEATHS_PER_MINUTE } from "@optimitron/data/parameters";

const PER_SECOND = GLOBAL_DISEASE_DEATHS_PER_MINUTE.value / 60;

/**
 * Section 1's corner ticker. Counts deaths from curable diseases since the page
 * opened, at the rate carried by GLOBAL_DISEASE_DEATHS_PER_MINUTE. Pauses when
 * the tab is hidden and reports the gap on return, per the spec's technical
 * notes. Small font, corner placement; the number does the work.
 */
export function DeathTicker() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [awayCount, setAwayCount] = useState(0);

  useEffect(() => {
    let last = performance.now();
    let hiddenAt: number | null = null;

    const tick = () => {
      const now = performance.now();
      if (document.visibilityState === "visible") {
        setElapsedMs((prev) => prev + (now - last));
      }
      last = now;
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = performance.now();
        return;
      }
      last = performance.now();
      if (hiddenAt !== null) {
        const awayMs = performance.now() - hiddenAt;
        setAwayCount(Math.floor((awayMs / 1000) * PER_SECOND));
        hiddenAt = null;
      }
    };

    const id = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const dead = Math.floor((elapsedMs / 1000) * PER_SECOND);

  return (
    <p className="dsa-ticker" aria-live="off">
      <b>{dead.toLocaleString()}</b> people died of curable diseases while this
      page was open.
      {awayCount > 0 ? (
        <>
          {" "}
          <b>{awayCount.toLocaleString()}</b> more died while you were away.
        </>
      ) : null}
    </p>
  );
}
