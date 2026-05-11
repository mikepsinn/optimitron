"use client";

import { useEffect, useState } from "react";

interface LiveCounterProps {
  /** Per-second growth rate. */
  ratePerSecond: number;
  /** Wall-clock ms when the tick clock started (task dueAt). */
  startMs: number;
  /** Display mode: integer with commas or USD with commas (no decimals). */
  mode: "integer" | "currency";
  className?: string;
}

/** Tick every 250ms — 4 updates/sec, smooth enough to feel live, cheap on CPU. */
const TICK_INTERVAL_MS = 250;

/**
 * Visual-review placeholders. The e2e visual-regression spec uses both
 * mechanisms in tandem:
 *   - CSS swap on `data-visual-mask="dynamic"` to render the
 *     `data-visual-placeholder` attribute as the displayed text.
 *   - `window.__OPTIMITRON_VISUAL_REVIEW__` runtime flag so the component
 *     itself stops ticking, avoiding layout jitter from the underlying span
 *     width changing as values grow.
 *
 * `data-volatile` is also kept because `scripts/render-pages-to-markdown.ts`
 * relies on that attribute to substitute deterministic placeholders into the
 * generated markdown previews (`pnpm copy:preview`).
 *
 * death-counter / money-counter follow the same triple-pattern.
 *
 * Placeholder widths are sized to typical PER-TASK real values, not to
 * absolute worst case. LiveCounter is used in task-row.tsx inside narrow
 * columns (`w-40 break-all`) where overflow chunks numbers into vertical
 * fragments. Real per-task wasted-by-delay amounts are in the thousands to
 * single-millions; real per-task deaths-from-delay counts are in the tens
 * to thousands. Keep these placeholders representative of that range.
 */
const VISUAL_REVIEW_INTEGER_PLACEHOLDER = "1,234";
const VISUAL_REVIEW_CURRENCY_PLACEHOLDER = "$1,234,567";

function isVisualReviewMode(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(
      (window as Window & { __OPTIMITRON_VISUAL_REVIEW__?: boolean })
        .__OPTIMITRON_VISUAL_REVIEW__,
    )
  );
}

const intFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatCurrency(value: number): string {
  return `$${intFormatter.format(Math.max(0, Math.floor(value)))}`;
}

function formatInteger(value: number): string {
  return intFormatter.format(Math.max(0, Math.floor(value)));
}

/**
 * A single live-updating counter throttled to 4 updates/sec. Integer mode
 * renders comma-separated integers; currency mode prefixes "$". Renders "…"
 * on SSR + first client paint to avoid hydration mismatch, then starts
 * ticking on mount.
 *
 * Designed to be safe at ~40 concurrent instances (e.g. a paginated signer
 * leaderboard with 20 rows × 2 counters each).
 */
export function LiveCounter({
  ratePerSecond,
  startMs,
  mode,
  className,
}: LiveCounterProps) {
  const visualReviewMode = isVisualReviewMode();
  const placeholder =
    mode === "currency"
      ? VISUAL_REVIEW_CURRENCY_PLACEHOLDER
      : VISUAL_REVIEW_INTEGER_PLACEHOLDER;
  const [displayValue, setDisplayValue] = useState<string | null>(null);

  useEffect(() => {
    if (visualReviewMode) return;

    const tick = () => {
      const elapsedSec = Math.max(0, (Date.now() - startMs) / 1000);
      const value = elapsedSec * ratePerSecond;
      setDisplayValue(mode === "currency" ? formatCurrency(value) : formatInteger(value));
    };
    tick();
    const interval = window.setInterval(tick, TICK_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [ratePerSecond, startMs, mode, visualReviewMode]);

  return (
    <span
      className={className}
      data-visual-mask="dynamic"
      data-visual-placeholder={placeholder}
      data-volatile={mode === "currency" ? "money" : "count"}
      suppressHydrationWarning
    >
      {visualReviewMode ? placeholder : (displayValue ?? "…")}
    </span>
  );
}
