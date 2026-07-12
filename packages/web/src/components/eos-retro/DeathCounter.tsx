"use client";

import { useEffect, useRef, useState } from "react";
import { GLOBAL_DISEASE_DEATHS_PER_MINUTE } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";

const DEATHS_PER_MS = GLOBAL_DISEASE_DEATHS_PER_MINUTE.value / 60_000;
const TICK_MS = 250;

/**
 * Corner counter: deaths from curable disease while the page has been open.
 * Uses the Page Visibility API — the "open" count only accrues while the tab
 * is visible; time away accrues separately and is reported on return.
 */
export function DeathCounter() {
  const [openDeaths, setOpenDeaths] = useState(0);
  const [awayDeaths, setAwayDeaths] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const lastTickRef = useRef<number | null>(null);
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReducedMotion(true);
      return;
    }

    lastTickRef.current = performance.now();

    const interval = setInterval(() => {
      if (document.hidden || lastTickRef.current === null) return;
      const now = performance.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;
      setOpenDeaths((d) => d + elapsed * DEATHS_PER_MS);
    }, TICK_MS);

    const onVisibility = () => {
      if (document.hidden) {
        hiddenAtRef.current = performance.now();
        lastTickRef.current = null;
      } else {
        const hiddenAt = hiddenAtRef.current;
        if (hiddenAt !== null) {
          const awayMs = performance.now() - hiddenAt;
          setAwayDeaths((d) => d + awayMs * DEATHS_PER_MS);
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
  }, []);

  if (reducedMotion) {
    return (
      <aside aria-label="Disease death rate" className="er-death-counter">
        About{" "}
        <ParameterValue
          display="integer"
          param={GLOBAL_DISEASE_DEATHS_PER_MINUTE}
        />{" "}
        people die of curable diseases every minute.
      </aside>
    );
  }

  const opened = Math.floor(openDeaths);
  const away = Math.floor(awayDeaths);

  return (
    <aside aria-label="Deaths while this page was open" className="er-death-counter">
      <span className="er-death-n" data-volatile="page-open-deaths">
        {opened.toLocaleString()}
      </span>{" "}
      {opened === 1 ? "person" : "people"} died of curable diseases while this
      page was open.
      {away >= 1 ? (
        <>
          {" "}
          <span className="er-death-n" data-volatile="away-deaths">
            {away.toLocaleString()}
          </span>{" "}
          more died while you were away.
        </>
      ) : null}
      <span className="er-death-rate" style={{ color: "var(--er-cream-muted)" }}>
        <br />
        Rate:{" "}
        <ParameterValue
          display="integer"
          param={GLOBAL_DISEASE_DEATHS_PER_MINUTE}
        />
        /minute, every minute, including this one.
      </span>
    </aside>
  );
}
