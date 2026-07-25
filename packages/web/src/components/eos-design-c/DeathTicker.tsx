"use client";

import { useEffect, useRef, useState } from "react";
import { GLOBAL_DISEASE_DEATHS_PER_MINUTE } from "@optimitron/data/parameters";

const PER_SECOND = GLOBAL_DISEASE_DEATHS_PER_MINUTE.value / 60;

/**
 * Section 1's live counter. Small, corner-placed, ticking every second.
 * Pauses while the tab is hidden (Page Visibility API) and reports the
 * backlog when the visitor returns, so the number never lies about the
 * time they were actually looking at it.
 */
export function DeathTicker() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [awaySeconds, setAwaySeconds] = useState(0);
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt === null) return;
      setAwaySeconds(Math.round((Date.now() - hiddenAt) / 1000));
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const died = Math.floor(elapsedSeconds * PER_SECOND);
  const diedAway = Math.floor(awaySeconds * PER_SECOND);

  return (
    <p className="dc-ticker" aria-live="off">
      <b>{died.toLocaleString("en-US")}</b> people died of curable diseases
      while this page was open.
      {diedAway > 0 ? (
        <>
          {" "}
          <b>{diedAway.toLocaleString("en-US")}</b> more died while you were
          away.
        </>
      ) : null}
    </p>
  );
}
