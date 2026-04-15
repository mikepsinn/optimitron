import type { ReactNode } from "react";
import { DeathCounter } from "./death-counter";
import { MoneyCounter } from "./money-counter";
import {
  DAILY_DISEASE_COST_USD,
  DAILY_DISEASE_DEATHS,
} from "@/lib/tasks/delay-attribution";

interface TaskHeroStatsProps {
  /** Estimated effort hours. */
  effortHours: number | null | undefined;
  /** Due date — used as the delay clock origin. */
  dueAt: Date | null | undefined;
  /**
   * Optional attribution share (0 to 1). For a signer task, this is the
   * country's share of global military spending. Defaults to 1 (full treaty-
   * level cost) when not provided — used on parent tasks.
   */
  attributionShare?: number;
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
 * Stat strip that crowns a task detail page. Cost of delay is computed from
 * WHO/GBD hard-market numbers: 150K deaths/day + $40.8B/day of direct medical
 * + productivity cost, scaled by the attribution share (1.0 for treaty-level
 * views, country's share of global military for signer views).
 */
export function TaskHeroStats({
  effortHours,
  dueAt,
  attributionShare = 1,
}: TaskHeroStatsProps) {
  const cells: HeroCell[] = [];

  const dueMs = dueAt?.getTime() ?? null;
  const isOverdue = dueMs != null && dueMs < Date.now();

  // Deaths from delay — per-second rate × elapsed since dueAt
  if (dueMs != null && isOverdue) {
    const deathsPerSecond = (DAILY_DISEASE_DEATHS * attributionShare) / 86400;
    cells.push({
      label: "💀 Deaths from delay",
      bg: "red",
      value: (
        <DeathCounter
          yearsPerSecond={deathsPerSecond * 40}
          startMs={dueMs}
          yearsPerDeath={40}
        />
      ),
      caption:
        attributionShare < 1
          ? "Your share of the preventable deaths, proportional to military spending."
          : "Preventable deaths while this task sits open.",
    });
  }

  // Wasted by delay — ticking dollar counter, attribution-scaled
  if (dueMs != null && isOverdue) {
    const usdPerSecond = (DAILY_DISEASE_COST_USD * attributionShare) / 86400;
    cells.push({
      label: "🔥 Wasted by delay",
      bg: "red",
      value: <MoneyCounter usdPerSecond={usdPerSecond} startMs={dueMs} />,
      caption:
        attributionShare < 1
          ? "Your share of the wasted disease dollars, proportional to military spending."
          : "Direct medical + productivity cost while this task sits open.",
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

  const gridCols =
    cells.length === 1
      ? "md:grid-cols-1"
      : cells.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-3";

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
            <p className="mt-2 break-all text-3xl font-black tabular-nums leading-none sm:text-4xl">
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
