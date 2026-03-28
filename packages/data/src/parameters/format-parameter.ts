import type { Parameter } from "./parameters-calculations-citations";

const SUFFIXES: [number, string][] = [
  [1e15, "quadrillion"],
  [1e12, "trillion"],
  [1e9, "billion"],
  [1e6, "million"],
];

/** Round to N significant figures. */
function roundToSigFigs(value: number, figures: number): number {
  if (value === 0) return 0;
  const digitCount = Math.ceil(Math.log10(Math.abs(value)));
  const magnitudeMultiplier = 10 ** (figures - digitCount);
  return Math.round(value * magnitudeMultiplier) / magnitudeMultiplier;
}

/** Stringify a number with exactly N significant figures (trailing zeros). */
function formatWithSigFigs(value: number, figures: number): string {
  if (value === 0) return "0";
  const rounded = roundToSigFigs(Math.abs(value), figures);
  if (rounded >= 1) {
    const intDig = Math.max(1, Math.floor(Math.log10(rounded)) + 1);
    return rounded.toFixed(Math.max(0, figures - intDig));
  }
  return rounded.toPrecision(figures);
}

/**
 * Universal parameter formatter. Pass a Parameter, get a human-readable string.
 *
 * Reads the `unit` field to decide formatting:
 *
 *  USD / USD/year / USD/patient → "$2.72 trillion", "$929/patient"
 *  percentage / rate / percent  → "86.1%"
 *  ratio / x / multiplier      → "604x"
 *  deaths / deaths/year / years → "97.0 million deaths"
 *  (no unit)                    → "2.72 trillion"
 *
 * All values are shown to 3 significant figures by default.
 */
export function fmtParam(param: Parameter, figures = 3): string {
  const { value, unit } = param;
  const normalizedUnit = (unit ?? "").toLowerCase();

  // Percentages & rates → value is 0-1, display as 0-100%
  if (normalizedUnit === "percentage" || normalizedUnit === "rate" || normalizedUnit === "percent") {
    return `${formatWithSigFigs(roundToSigFigs(value * 100, figures), figures)}%`;
  }

  // Ratios / multipliers → "604x"
  if (normalizedUnit === "ratio" || normalizedUnit === "x" || normalizedUnit === "multiplier") {
    return `${fmtRaw(value, figures)}x`;
  }

  // Currency — "USD", "USD/year", "USD/patient"
  if (normalizedUnit === "usd" || normalizedUnit.startsWith("usd/")) {
    const perUnit = normalizedUnit.includes("/") ? `/${normalizedUnit.split("/").slice(1).join("/")}` : "";
    return `$${fmtRaw(value, figures)}${perUnit}`;
  }

  // Dimensionless
  if (!unit || normalizedUnit === "weight") return fmtRaw(value, figures);

  // Everything else — number + unit
  return `${fmtRaw(value, figures)} ${unit}`;
}

/**
 * Format a raw number with 3 sig figs and a human-readable suffix.
 *
 *   fmtRaw(2720000000000) → "2.72 trillion"
 *   fmtRaw(97000000)      → "97.0 million"
 *   fmtRaw(604.44)        → "604"
 *   fmtRaw(0.861)         → "0.861"
 */
/**
 * Format options for parameter display (used by ParameterValue component)
 */
export interface FormatParameterOptions {
  /** Number of decimal places (default: auto-detect based on magnitude) */
  precision?: number
  /** Include unit suffix (default: false) */
  includeUnit?: boolean
  /** Compact format - use K/M/B/T suffixes (default: true) */
  compact?: boolean
}

/**
 * Smart formatter that auto-detects unit type and formats accordingly.
 * Used by shared components (ImpactExplainer, ParameterValue, impact-math).
 *
 * @example
 * formatParameter(GLOBAL_MILITARY_SPENDING_ANNUAL_2024) // "$2.72 trillion"
 * formatParameter(ANTIDEPRESSANT_TRIAL_EXCLUSION_RATE) // "86.1%"
 */
export function formatParameter(
  param: Parameter,
  options: FormatParameterOptions = {}
): string {
  const { compact = true } = options

  if (!compact) {
    return fmtParam(param)
  }

  return fmtParam(param)
}

/**
 * Format confidence interval for a parameter.
 */
export function formatConfidenceInterval(param: Parameter): string | null {
  if (!param.confidenceInterval) return null

  const [low, high] = param.confidenceInterval
  const lowFormatted = fmtParam({ ...param, value: low })
  const highFormatted = fmtParam({ ...param, value: high })

  return `${lowFormatted} – ${highFormatted}`
}

/**
 * Format a parameter value WITHOUT the unit suffix/prefix.
 * Surrounding text usually provides context, so the unit is stripped.
 *
 * Keeps "$" prefix and "%" suffix since they're integral to the number.
 * Strips trailing unit words like "deaths", "years", "deaths/year".
 *
 *   fmtParamValueOnly({ value: 2.72e12, unit: "USD" })     → "$2.72 trillion"
 *   fmtParamValueOnly({ value: 0.861, unit: "percentage" }) → "86.1%"
 *   fmtParamValueOnly({ value: 604, unit: "ratio" })        → "604"
 *   fmtParamValueOnly({ value: 97e6, unit: "deaths" })      → "97.0 million"
 */
export function fmtParamValueOnly(param: Parameter, figures = 3): string {
  const unit = (param.unit ?? "").toLowerCase();

  // Percentages: keep the % since it's integral to the number
  if (unit === "percentage" || unit === "rate" || unit === "percent") {
    return fmtParam(param, figures);
  }

  const full = fmtParam(param, figures);

  // Strip trailing "x" from ratios
  if (unit === "ratio" || unit === "x" || unit === "multiplier") {
    return full.replace(/x$/, "").trim();
  }

  // Strip trailing unit words (e.g., " deaths", " years", " deaths/year")
  if (unit && !unit.startsWith("usd")) {
    const unitWord = unit.split("/")[0]!;
    const regex = new RegExp(`\\s+${unitWord}.*$`, "i");
    return full.replace(regex, "").trim();
  }

  return full;
}

export function getParameterValue(
  param: Parameter,
  transform?: "round" | "floor" | "ceil" | "percentage"
): number {
  const { value, unit } = param

  switch (transform) {
    case "round":
      return Math.round(value)
    case "floor":
      return Math.floor(value)
    case "ceil":
      return Math.ceil(value)
    case "percentage":
      return (unit === "percentage" || unit === "rate") && value <= 1
        ? value * 100
        : value
    default:
      return value
  }
}

export function fmtRaw(value: number, figures = 3): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  for (const [threshold, label] of SUFFIXES) {
    if (abs >= threshold) {
      return `${sign}${formatWithSigFigs(roundToSigFigs(abs / threshold, figures), figures)} ${label}`;
    }
  }

  // Below 1 million — use commas for thousands
  const rounded = roundToSigFigs(abs, figures);
  if (rounded >= 1000) {
    return `${sign}${rounded.toLocaleString("en-US")}`;
  }

  return `${sign}${formatWithSigFigs(abs, figures)}`;
}
