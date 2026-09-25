"use client";

import { useEffect, useRef } from "react";
import { GLOBAL_DISEASE_DEATHS_DAILY } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import {
  DEATHS_PER_SECOND,
  DYSFUNCTION_TAX_PER_SECOND,
} from "@/lib/collapse-projections";
import { alarmTextClass } from "./LandingSection";
import { useLiveMotion } from "./use-live-motion";

const moneyPerSecond = `$${(DYSFUNCTION_TAX_PER_SECOND / 1e6).toFixed(1)} million`;

/**
 * What the bill costs while the reader is on the page. Counting starts at
 * zero on load; outside live motion (automation, reduced motion, before
 * hydration) the tile shows the rates instead of a moving count.
 */
export function LiveBillTickers() {
  const live = useLiveMotion();
  const moneyRef = useRef<HTMLSpanElement>(null);
  const deathsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!live) return;
    const startedAt = performance.now();
    let frame = 0;
    const tick = () => {
      const seconds = (performance.now() - startedAt) / 1000;
      if (moneyRef.current) {
        moneyRef.current.textContent = `$${Math.floor(seconds * DYSFUNCTION_TAX_PER_SECOND).toLocaleString("en-US")}`;
      }
      if (deathsRef.current) {
        deathsRef.current.textContent = Math.floor(
          seconds * DEATHS_PER_SECOND,
        ).toLocaleString("en-US");
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [live]);

  const numberClass =
    "font-mono text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl";

  if (!live) {
    return (
      <div className="grid gap-6 border-t border-foreground/15 pt-6 sm:grid-cols-2">
        <div>
          <p className={numberClass}>{moneyPerSecond}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            lost to bad policy every second
          </p>
        </div>
        <div>
          <p className={numberClass}>
            <ParameterValue param={GLOBAL_DISEASE_DEATHS_DAILY} />
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            people die of disease and aging every day
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 border-t border-foreground/15 pt-6 sm:grid-cols-2">
      <div>
        <p className={numberClass}>
          <span data-volatile="governance waste" ref={moneyRef}>
            $0
          </span>
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          lost to bad policy since you opened this page, at{" "}
          <span className="font-bold text-foreground">{moneyPerSecond}</span> a
          second
        </p>
      </div>
      <div>
        <p className={`${numberClass} ${alarmTextClass}`}>
          <span data-volatile="deaths" ref={deathsRef}>
            0
          </span>
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          died of disease and aging since you opened this page, out of{" "}
          <ParameterValue
            className="font-bold text-foreground"
            param={GLOBAL_DISEASE_DEATHS_DAILY}
          />{" "}
          a day
        </p>
      </div>
    </div>
  );
}
