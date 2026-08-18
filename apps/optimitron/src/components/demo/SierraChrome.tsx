"use client";

import { useEffect, useRef } from "react";
import { DEATHS_PER_SECOND } from "@/lib/collapse-projections";
import {
  GLOBAL_HALE_CURRENT,
  TREATY_PROJECTED_HALE_YEAR_15,
  GLOBAL_AVG_INCOME_2025,
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_15,
} from "@optimitron/data/parameters";

const ARCADE = "font-pixel";

const haleCurrent = GLOBAL_HALE_CURRENT.value.toFixed(1);
const haleTarget = TREATY_PROJECTED_HALE_YEAR_15.value.toFixed(1);
const incomeCurrent = `$${Math.round(GLOBAL_AVG_INCOME_2025.value / 1000)}K`;
const incomeTarget = `$${Math.round(TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value / 1000)}K`;

// ---------------------------------------------------------------------------
// Quest Metrics (top-left) — HALE + Income with current → target
// ---------------------------------------------------------------------------

function QuestMetrics() {
  const haleProgress = (GLOBAL_HALE_CURRENT.value / TREATY_PROJECTED_HALE_YEAR_15.value) * 100;
  const incomeProgress = (GLOBAL_AVG_INCOME_2025.value / TREATY_TRAJECTORY_AVG_INCOME_YEAR_15.value) * 100;

  return (
    <div className="flex flex-col md:flex-row gap-1 md:gap-4 px-2 py-1">
      {/* HALE meter */}
      <div className="flex items-center gap-1 md:gap-2">
        <span className="text-sm md:text-lg">❤️</span>
        <div className="flex flex-col gap-0.5">
          <span className={`${ARCADE} text-[10px] md:text-xs text-background`}>
            HALE {haleCurrent}→{haleTarget}
          </span>
          <div className="w-16 md:w-28 h-1.5 md:h-2.5 bg-zinc-800 border border-background/50 rounded-sm overflow-hidden">
            <div className="h-full bg-background" style={{ width: `${haleProgress}%` }} />
          </div>
        </div>
      </div>
      {/* Income meter */}
      <div className="flex items-center gap-1 md:gap-2">
        <span className="text-sm md:text-lg">💰</span>
        <div className="flex flex-col gap-0.5">
          <span className={`${ARCADE} text-[10px] md:text-xs text-background`}>
            INCOME {incomeCurrent}→{incomeTarget}
          </span>
          <div className="w-16 md:w-28 h-1.5 md:h-2.5 bg-zinc-800 border border-background/50 rounded-sm overflow-hidden">
            <div className="h-full bg-background" style={{ width: `${incomeProgress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Death Ticker (top-right)
// ---------------------------------------------------------------------------

function DeathTicker() {
  const ref = useRef<HTMLSpanElement>(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf: number;
    function tick() {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const deaths = Math.floor(elapsed * DEATHS_PER_SECOND);
      if (el) el.textContent = deaths.toLocaleString();
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex items-center gap-1 md:gap-2 px-2 py-1 justify-end text-right">
      <div className="flex flex-col gap-0.5 items-end text-right">
        <div className="flex items-center gap-1">
          <span className="text-sm md:text-lg">💀</span>
          <span className={`${ARCADE} text-[10px] md:text-xs text-brutal-red tabular-nums`} ref={ref}>0</span>
        </div>
        <span className={`${ARCADE} text-[10px] md:text-xs text-brutal-red`}>
          HUMANS TERMINATED
        </span>
        <div className="flex items-center gap-1.5 justify-end">
          <span className={`${ARCADE} text-[8px] md:text-[10px] text-muted-foreground`}>THIS SESSION</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sierra Chrome (the wrapper)
// ---------------------------------------------------------------------------

interface SierraChromeProps {
  children: React.ReactNode;
}

export function SierraChrome({ children }: SierraChromeProps) {
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Top bar: Score + Death ticker */}
      <div className="absolute top-0 left-0 right-0 z-30 flex justify-between items-start p-2 pointer-events-none">
        <div className="pointer-events-auto">
          <QuestMetrics />
        </div>
        <div className="pointer-events-auto">
          <DeathTicker />
        </div>
      </div>

      {/* Slide content area */}
      <div className="flex-1 pt-14 overflow-hidden">{children}</div>
    </div>
  );
}
