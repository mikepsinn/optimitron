// Universal formatting functions for the demo

export type NumberStyle =
  | "compact"
  | "full"
  | "currency"
  | "currency-full"
  | "percent"
  | "years"
  | "ratio";

/**
 * Format a number with various styles
 * @param n - The number to format
 * @param style - The formatting style to apply
 * @returns Formatted string
 *
 * @example
 * formatNumber(2_720_000_000_000, 'currency') // "$2.7T"
 * formatNumber(150_000, 'compact') // "150K"
 * formatNumber(604, 'ratio') // "604:1"
 * formatNumber(63.3, 'years') // "63.3 years"
 */
export function formatNumber(
  n: number,
  style: NumberStyle = "full"
): string {
  switch (style) {
    case "compact":
      return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(n);

    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(n);

    case "currency-full":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);

    case "percent":
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(n / 100);

    case "years":
      return `${n} ${n === 1 ? "year" : "years"}`;

    case "ratio":
      return `${n}:1`;

    case "full":
    default:
      return new Intl.NumberFormat("en-US").format(n);
  }
}

/**
 * Format a large number with a specific suffix for display
 * @param n - The number to format
 * @returns Object with value and suffix separated
 */
export function formatLargeNumber(n: number): {
  value: string;
  suffix: string;
  full: string;
} {
  if (n >= 1_000_000_000_000) {
    const t = n / 1_000_000_000_000;
    const formatted = t % 1 === 0 ? t.toFixed(0) : t.toFixed(1);
    return {
      value: formatted,
      suffix: "T",
      full: `${formatted}T`,
    };
  }
  if (n >= 1_000_000_000) {
    return {
      value: (n / 1_000_000_000).toFixed(1),
      suffix: "B",
      full: `${(n / 1_000_000_000).toFixed(1)}B`,
    };
  }
  if (n >= 1_000_000) {
    return {
      value: (n / 1_000_000).toFixed(1),
      suffix: "M",
      full: `${(n / 1_000_000).toFixed(1)}M`,
    };
  }
  if (n >= 1_000) {
    return {
      value: (n / 1_000).toFixed(0),
      suffix: "K",
      full: `${(n / 1_000).toFixed(0)}K`,
    };
  }
  return {
    value: n.toString(),
    suffix: "",
    full: n.toString(),
  };
}

/**
 * Format currency with dollar sign and appropriate suffix
 * @param n - The number to format
 * @returns Formatted currency string
 */
export function formatCurrency(n: number): string {
  const { value, suffix } = formatLargeNumber(n);
  return `$${value}${suffix}`;
}

/**
 * Format a duration in seconds to mm:ss
 * @param seconds - Duration in seconds
 * @returns Formatted time string
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Interpolate between two numbers
 * @param start - Starting value
 * @param end - Ending value
 * @param progress - Progress from 0 to 1
 * @returns Interpolated value
 */
export function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * Math.min(1, Math.max(0, progress));
}

/**
 * Easing function for animations
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}
