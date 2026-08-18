import { cn } from "@/lib/utils";

export interface StatBarProps {
  label: string;
  /** Value from 0–10 */
  value: number;
  /** Maximum value (default 10) */
  max?: number;
  className?: string;
}

/**
 * RPG-style stat bar rendered as filled/empty block characters.
 *
 * Usage:
 *   <StatBar label="IMPACT" value={8} />
 *   → IMPACT  ████████░░  8/10
 */
export function StatBar({ label, value, max = 10, className }: StatBarProps) {
  const clamped = Math.max(0, Math.min(value, max));
  const filled = Math.round(clamped);
  const empty = max - filled;

  return (
    <div
      className={cn(
        "flex items-center gap-2 font-pixel text-[10px] leading-none",
        className,
      )}
    >
      <span className="w-[72px] shrink-0 uppercase tracking-wider">
        {label}
      </span>
      <span className="tracking-[-0.05em]" aria-label={`${filled} out of ${max}`}>
        {"█".repeat(filled)}
        <span className="opacity-30">{"░".repeat(empty)}</span>
      </span>
      <span className="tabular-nums">
        {filled}/{max}
      </span>
    </div>
  );
}

export interface StatBarGroupProps {
  stats: StatBarProps[];
  className?: string;
}

/**
 * Vertical stack of stat bars.
 */
export function StatBarGroup({ stats, className }: StatBarGroupProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {stats.map((stat) => (
        <StatBar key={stat.label} {...stat} />
      ))}
    </div>
  );
}
