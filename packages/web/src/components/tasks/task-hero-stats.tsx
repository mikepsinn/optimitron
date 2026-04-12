import type { ReactNode } from "react";
import { DeathCounter } from "./death-counter";

interface TaskHeroStatsProps {
  /** Healthy life-years lost per day of delay (from impact frame). */
  perDayDalys: number | null | undefined;
  /** Net cash cost. Sentinel ≤ -1e17 renders as "−∞". */
  costUsd: number | null | undefined;
  /** Estimated effort hours. */
  effortHours: number | null | undefined;
  /** Due date — used as the death-counter clock origin. */
  dueAt: Date | null | undefined;
}

const NEGATIVE_INFINITY_COST_THRESHOLD = -1e17;
const YEARS_PER_AVERTED_DEATH = 40;

function formatCost(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value <= NEGATIVE_INFINITY_COST_THRESHOLD) return "−∞";
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

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
 * conditionally based on what data the task actually has — there is no
 * treaty-specific logic here. Colors reflect the *meaning* of each value:
 * red for ongoing harm (death counter), green for net-negative cost
 * (you earn money), pink for normal cost, yellow for time required.
 *
 * If a task has no impact data at all, the strip renders nothing.
 */
export function TaskHeroStats({
  perDayDalys,
  costUsd,
  effortHours,
  dueAt,
}: TaskHeroStatsProps) {
  const cells: HeroCell[] = [];

  // Death counter — only when there's a delay rate AND a due date in the past
  const yearsPerSecond =
    perDayDalys != null && perDayDalys > 0 ? perDayDalys / 86400 : null;
  const dueMs = dueAt?.getTime() ?? null;
  const isOverdue = dueMs != null && dueMs < Date.now();
  if (yearsPerSecond != null && dueMs != null && isOverdue) {
    cells.push({
      label: "Future deaths locked in by delay",
      bg: "red",
      value: (
        <DeathCounter
          yearsPerSecond={yearsPerSecond}
          startMs={dueMs}
          yearsPerDeath={YEARS_PER_AVERTED_DEATH}
        />
      ),
      caption: "Counterfactual. Each tick is a future preventable death.",
    });
  }

  // Cost — green if net-negative (you earn), pink if positive (you pay)
  if (costUsd != null) {
    const isNegative = costUsd < 0;
    cells.push({
      label: isNegative ? "Net cost (after externalities)" : "Cost",
      bg: isNegative ? "green" : "pink",
      value: formatCost(costUsd),
      caption: isNegative ? "Net positive — pays for itself" : undefined,
    });
  }

  // Time — only when set
  if (effortHours != null && effortHours > 0) {
    cells.push({
      label: "Time to complete",
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
