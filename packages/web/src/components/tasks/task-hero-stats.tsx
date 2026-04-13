import type { ReactNode } from "react";
import { DeathCounter } from "./death-counter";
import { MoneyCounter } from "./money-counter";

interface TaskHeroStatsProps {
  /** Healthy life-years lost per day of delay (from impact frame). */
  perDayDalys: number | null | undefined;
  /** USD lost per day of delay (from impact frame). */
  perDayUsd?: number | null | undefined;
  /** Estimated effort hours. */
  effortHours: number | null | undefined;
  /** Due date — used as the death-counter clock origin. */
  dueAt: Date | null | undefined;
}

const YEARS_PER_AVERTED_DEATH = 40;

function formatDuration(hours: number | null | undefined): string {
  if (hours == null || hours <= 0) return "—";
  const seconds = hours * 3600;
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (hours < 24) return `${hours.toFixed(hours < 10 ? 1 : 0)} hr`;
  return `${Math.round(hours / 24)} days`;
}

interface HeroCell {
  label: string;
  bg: "red" | "green" | "pink" | "yellow" | "cyan";
  value: ReactNode;
  caption?: string;
}

const BG_CLASS: Record<HeroCell["bg"], string> = {
  red: "bg-brutal-red text-brutal-red-foreground",
  green: "bg-brutal-green text-brutal-green-foreground",
  pink: "bg-brutal-pink text-brutal-pink-foreground",
  yellow: "bg-brutal-yellow text-brutal-yellow-foreground",
  cyan: "bg-brutal-cyan text-brutal-cyan-foreground",
};

/**
 * Stat strip that crowns any task detail page. Cells are rendered
 * conditionally based on what data the task actually has. Every task is
 * either a reallocation or a positive-ROI investment in the Earth Optimization
 * Machine frame — there is no "cost" cell because there is no cost. The
 * interesting numbers are all delay costs: deaths caused by the delay,
 * taxpayer money wasted by the delay, and the time it would take to ship it.
 */
export function TaskHeroStats({
  perDayDalys,
  perDayUsd,
  effortHours,
  dueAt,
}: TaskHeroStatsProps) {
  const cells: HeroCell[] = [];

  // Death counter — only when there's a delay rate AND a due date in the past
  const yearsPerSecond =
    perDayDalys != null && perDayDalys > 0 ? perDayDalys / 86400 : null;
  const usdPerSecond =
    perDayUsd != null && perDayUsd > 0 ? perDayUsd / 86400 : null;
  const dueMs = dueAt?.getTime() ?? null;
  const isOverdue = dueMs != null && dueMs < Date.now();
  if (yearsPerSecond != null && dueMs != null && isOverdue) {
    cells.push({
      label: "💀 Deaths from delay",
      bg: "red",
      value: (
        <DeathCounter
          yearsPerSecond={yearsPerSecond}
          startMs={dueMs}
          yearsPerDeath={YEARS_PER_AVERTED_DEATH}
        />
      ),
      caption: "Preventable deaths while this task sits open.",
    });
  }

  // Money counter — taxpayer dollars wasted while the task waits
  if (usdPerSecond != null && dueMs != null && isOverdue) {
    cells.push({
      label: "🔥 Tax $ wasted by delay",
      bg: "red",
      value: <MoneyCounter usdPerSecond={usdPerSecond} startMs={dueMs} />,
      caption: "Foregone economic value every second this sits open.",
    });
  }

  // Time — only when set
  if (effortHours != null && effortHours > 0) {
    cells.push({
      label: "⏱️ Time to complete",
      bg: "yellow",
      value: formatDuration(effortHours),
    });
  }

  if (cells.length === 0) return null;

  // First (priority) cell takes 2x width; remaining cells split evenly.
  const gridCols =
    cells.length === 1
      ? "md:grid-cols-1"
      : cells.length === 2
        ? "md:grid-cols-[2fr_1fr]"
        : "md:grid-cols-[2fr_1fr_1fr]";

  return (
    <div className={`grid gap-0 border-4 border-primary ${gridCols}`}>
      {cells.map((cell, i) => {
        const isLast = i === cells.length - 1;
        const borderClass = isLast
          ? ""
          : "border-b-4 border-primary md:border-b-0 md:border-r-4";
        return (
          <div
            key={cell.label}
            className={`${BG_CLASS[cell.bg]} ${borderClass} px-6 py-6`}
          >
            <p className="text-xs font-black uppercase tracking-[0.18em]">
              {cell.label}
            </p>
            <p className="mt-2 break-all text-5xl font-black tabular-nums leading-none sm:text-6xl">
              {cell.value}
            </p>
            {cell.caption ? (
              <p className="mt-2 text-xs font-bold uppercase opacity-90">
                {cell.caption}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
