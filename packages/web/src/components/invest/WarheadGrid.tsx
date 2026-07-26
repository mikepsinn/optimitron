"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import {
  GLOBAL_WARHEAD_COUNT,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";

const TOTAL_WARHEADS = Math.round(GLOBAL_WARHEAD_COUNT.value);
const LETHAL_WARHEADS = Math.round(NUCLEAR_WINTER_WARHEAD_THRESHOLD.value);
// Sweep the ~100 lethal marks in over ~1.2s once the grid is on screen.
const SWEEP_MS_PER_DOT = 12;

/**
 * Every warhead on Earth as one dot. The ~100 that end civilization turn
 * solid when the grid scrolls into view; the rest stay ghosted — spares
 * for a planet that can only be ruined once.
 */
export function WarheadGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const prefersReducedMotion = useReducedMotion();
  // Automation (screenshots, copy previews) never scrolls, so arm the grid
  // immediately there — captures must show the final state, not the intro.
  const [autoArmed, setAutoArmed] = useState(false);
  useEffect(() => {
    if (navigator.webdriver) setAutoArmed(true);
  }, []);
  const armed = inView || autoArmed;
  const skipSweep = prefersReducedMotion || autoArmed;

  const dots = useMemo(
    () =>
      Array.from({ length: TOTAL_WARHEADS }, (_, i) => i < LETHAL_WARHEADS),
    [],
  );

  return (
    <section className="mx-auto flex min-h-[90svh] max-w-4xl flex-col justify-center gap-8 px-4 py-16">
      <p className="text-center text-lg font-bold leading-8 text-foreground sm:text-2xl sm:leading-10">
        Every square is a live nuclear warhead. It takes about{" "}
        <ParameterValue
          param={NUCLEAR_WINTER_WARHEAD_THRESHOLD}
          className="font-black"
        />{" "}
        to trigger a nuclear winter that collapses civilization.
      </p>
      <div ref={ref} className="border-2 border-foreground p-3 sm:p-4">
        <div
          aria-label={`${TOTAL_WARHEADS.toLocaleString()} warheads; ${LETHAL_WARHEADS} are enough to end civilization`}
          className="flex flex-wrap content-start gap-px"
          role="img"
        >
          {dots.map((lethal, i) => (
            <span
              key={i}
              className={
                lethal
                  ? `h-[5px] w-[5px] transition-colors duration-300 sm:h-1.5 sm:w-1.5 ${
                      armed ? "bg-foreground" : "bg-foreground/15"
                    }`
                  : "h-[5px] w-[5px] bg-foreground/15 sm:h-1.5 sm:w-1.5"
              }
              style={
                lethal && armed && !skipSweep
                  ? { transitionDelay: `${i * SWEEP_MS_PER_DOT}ms` }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 text-center sm:flex-row sm:justify-center sm:gap-10">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-foreground">
          ■ The first {LETHAL_WARHEADS}: one dead civilization
        </p>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">
          ▪ The other {(TOTAL_WARHEADS - LETHAL_WARHEADS).toLocaleString()}:
          you can only ruin Earth once
        </p>
      </div>
    </section>
  );
}
