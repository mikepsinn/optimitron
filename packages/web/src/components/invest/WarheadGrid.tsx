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
 * Every warhead in the global inventory as one dot. The ~100 that end
 * civilization turn solid when the grid scrolls into view; the rest stay
 * ghosted — spares for a planet that can only be ruined once.
 *
 * The dot field is a single dangerouslySetInnerHTML container, not 12,241
 * React elements: per-dot markup stays tiny and hydration reconciles one
 * node instead of the whole field.
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

  const dotFieldHtml = useMemo(() => {
    const dots: string[] = [];
    for (let i = 0; i < TOTAL_WARHEADS; i++) {
      dots.push(
        i < LETHAL_WARHEADS
          ? `<span class="wg-dot wg-lethal" style="transition-delay:${i * SWEEP_MS_PER_DOT}ms"></span>`
          : '<span class="wg-dot"></span>',
      );
    }
    return dots.join("");
  }, []);

  return (
    <section className="mx-auto flex min-h-[90svh] max-w-4xl flex-col justify-center gap-8 px-4 py-16">
      <p className="text-center text-lg font-bold leading-8 text-foreground sm:text-2xl sm:leading-10">
        Every square is a nuclear warhead in today&apos;s global inventory. It
        takes about{" "}
        <ParameterValue
          param={NUCLEAR_WINTER_WARHEAD_THRESHOLD}
          className="font-black"
        />{" "}
        to trigger a nuclear winter that collapses civilization.
      </p>
      <div ref={ref} className="border-2 border-foreground p-3 sm:p-4">
        <div
          aria-label={`${TOTAL_WARHEADS.toLocaleString("en-US")} warheads; ${LETHAL_WARHEADS} are enough to end civilization`}
          className={`wg-field${armed ? " wg-armed" : ""}${skipSweep ? " wg-instant" : ""}`}
          role="img"
          dangerouslySetInnerHTML={{ __html: dotFieldHtml }}
        />
      </div>
      <div className="flex flex-col gap-2 text-center sm:flex-row sm:justify-center sm:gap-10">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-foreground">
          ■ The first {LETHAL_WARHEADS}: one dead civilization
        </p>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">
          ▪ The other {(TOTAL_WARHEADS - LETHAL_WARHEADS).toLocaleString("en-US")}:
          you can only ruin Earth once
        </p>
      </div>
      <style jsx global>{`
        .wg-field {
          display: flex;
          flex-wrap: wrap;
          align-content: flex-start;
          gap: 1px;
          content-visibility: auto;
        }

        .wg-field .wg-dot {
          width: 5px;
          height: 5px;
          background: var(--foreground);
          opacity: 0.15;
        }

        @media (min-width: 640px) {
          .wg-field .wg-dot {
            width: 6px;
            height: 6px;
          }
        }

        .wg-field .wg-lethal {
          transition: opacity 300ms;
        }

        .wg-field.wg-armed .wg-lethal {
          opacity: 1;
        }

        .wg-field.wg-instant .wg-lethal {
          transition: none;
          transition-delay: 0ms !important;
        }
      `}</style>
    </section>
  );
}
