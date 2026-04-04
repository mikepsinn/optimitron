import { cn } from "@/lib/utils";

const colorMap = {
  red: "bg-brutal-red",
  cyan: "bg-brutal-cyan",
  green: "bg-brutal-green",
  yellow: "bg-brutal-yellow",
} as const;

interface SpendingBarProps {
  /** Dollar amount (or abstract value) */
  value: number;
  /** Maximum value for scaling (bar fills value/max of the container) */
  max: number;
  /** Brutal color token */
  color: keyof typeof colorMap;
  /** Height variant */
  height?: "sm" | "md";
  className?: string;
}

/**
 * Neobrutalist inline progress bar for spending amounts.
 * Scales `value` relative to `max` — designed for table cells and stat cards.
 */
export function SpendingBar({
  value,
  max,
  color,
  height = "sm",
  className,
}: SpendingBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div
      className={cn(
        "w-full border-2 border-primary bg-muted",
        height === "sm" ? "h-3" : "h-5",
        className,
      )}
    >
      <div
        className={cn(colorMap[color], "h-full transition-all duration-300")}
        style={{ width: `${pct}%`, minWidth: value > 0 ? "2px" : undefined }}
      />
    </div>
  );
}
