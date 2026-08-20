/**
 * Compact parameter formatting — "$2.72T", "86%", "1.27M".
 *
 * Deliberately separate from `./format-parameter`, which renders the verbose
 * register ("$2.72 trillion", "86.1%", "1.27 million deaths"). Dense UI
 * (cards, charts, counters) needs the compact form; prose needs the verbose
 * one. Both are real display registers, so both live here.
 *
 * NOT re-exported from `./index` — the two modules export the same symbol
 * names on purpose. Import the register you want by its own subpath.
 */
import type { Parameter } from "./parameters-calculations-citations"

/**
 * Format options for parameter display
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
 * Format a number with N significant figures, stripping unnecessary trailing zeros
 * e.g., for 3 sig figs: 416 → "416", 2.88 → "2.88", 2.0 → "2", 41.6 → "41.6"
 */
function toSigFigs(value: number, sigFigs: number = 3): string {
  if (value === 0) return "0"

  const absValue = Math.abs(value)

  // Determine how many decimal places we need
  let decimals: number
  if (absValue >= 100) {
    decimals = Math.max(0, sigFigs - 3)
  } else if (absValue >= 10) {
    decimals = Math.max(0, sigFigs - 2)
  } else if (absValue >= 1) {
    decimals = Math.max(0, sigFigs - 1)
  } else {
    decimals = sigFigs
  }

  // Format and strip trailing zeros (but keep at least one digit after decimal if needed for rounding)
  const formatted = value.toFixed(decimals)

  // Strip trailing zeros after decimal point
  if (formatted.includes('.')) {
    return formatted.replace(/\.?0+$/, '')
  }
  return formatted
}

/**
 * Smart formatter that auto-detects unit type and formats accordingly
 *
 * @example
 * formatParameter(GLOBAL_MILITARY_SPENDING_ANNUAL_2024) // "$2.7T"
 * formatParameter(ANTIDEPRESSANT_TRIAL_EXCLUSION_RATE) // "86%"
 * formatParameter(DFDA_ROI_RD_ONLY) // "637:1"
 * formatParameter(EFFICACY_LAG_YEARS) // "8.2"
 */
export function formatParameter(
  param: Parameter,
  options: FormatParameterOptions = {}
): string {
  const {
    precision,
    includeUnit = false,
    compact = true,
  } = options

  const { value, unit } = param

  // Handle currency (USD)
  if (unit?.includes("USD")) {
    return formatCurrency(value, { precision, compact, includeUnit, unit })
  }

  // Handle percentages
  if (unit === "percentage" || unit === "percent" || unit === "rate") {
    return formatPercentage(value, { precision })
  }

  // Handle ratios (":1" suffix) vs multipliers ("x" suffix)
  if (unit === "ratio") {
    return formatRatio(value, { precision, suffix: ":1" })
  }
  if (unit === "multiplier" || unit === "x") {
    return formatRatio(value, { precision, suffix: "x" })
  }

  // Handle lives/deaths (check before years to handle "lives/year" correctly)
  if (unit?.includes("lives") || unit?.includes("deaths") || unit?.includes("patients")) {
    return formatCount(value, { precision, compact, includeUnit, unit })
  }

  // Handle years (only if it's a pure years unit, not something like "lives/year")
  if (unit === "years" || (unit?.includes("year") && !unit.includes("/"))) {
    return formatYears(value, { precision, includeUnit })
  }

  // Handle DALYs/QALYs
  if (unit?.includes("DALY") || unit?.includes("QALY")) {
    return formatCount(value, { precision, compact, includeUnit, unit })
  }

  // Handle trials
  if (unit?.includes("trial")) {
    return formatCount(value, { precision, compact, includeUnit, unit })
  }

  // Default: format as number
  return formatNumber(value, { precision, compact })
}

/**
 * Format currency values with appropriate suffix
 */
function formatCurrency(
  value: number,
  options: { precision?: number; compact?: boolean; includeUnit?: boolean; unit?: string }
): string {
  const { precision, compact = true, includeUnit, unit } = options

  if (!compact) {
    return `$${value.toLocaleString()}`
  }

  const absValue = Math.abs(value)
  let formatted: string

  if (absValue >= 1e15) {
    const scaled = value / 1e15
    formatted = precision !== undefined ? `$${scaled.toFixed(precision)} Quadrillion` : `$${toSigFigs(scaled)} Quadrillion`
  } else if (absValue >= 1e12) {
    const scaled = value / 1e12
    formatted = precision !== undefined ? `$${scaled.toFixed(precision)}T` : `$${toSigFigs(scaled)}T`
  } else if (absValue >= 1e9) {
    const scaled = value / 1e9
    formatted = precision !== undefined ? `$${scaled.toFixed(precision)}B` : `$${toSigFigs(scaled)}B`
  } else if (absValue >= 1e6) {
    const scaled = value / 1e6
    formatted = precision !== undefined ? `$${scaled.toFixed(precision)}M` : `$${toSigFigs(scaled)}M`
  } else if (absValue >= 1e3) {
    const scaled = value / 1e3
    formatted = precision !== undefined ? `$${scaled.toFixed(precision)}K` : `$${toSigFigs(scaled)}K`
  } else {
    formatted = `$${value.toLocaleString()}`
  }

  if (includeUnit && unit) {
    // Extract time component if present (e.g., "USD/year" -> "/year")
    const timeMatch = unit.match(/\/(year|month|day|hour)/)
    if (timeMatch) {
      formatted += `/${timeMatch[1]}`
    }
  }

  return formatted
}

/**
 * Format percentage values (0.861 -> "86%")
 */
function formatPercentage(
  value: number,
  options: { precision?: number }
): string {
  const { precision } = options

  // If value is already in percentage form (> 1), don't multiply
  const pctValue = value <= 1 ? value * 100 : value
  const p = precision ?? (pctValue % 1 === 0 ? 0 : 1)

  return `${pctValue.toFixed(p)}%`
}

/**
 * Format ratio/multiplier values
 * - ratio: 636.8 -> "637:1"
 * - multiplier: 82.3 -> "82x"
 */
function formatRatio(
  value: number,
  options: { precision?: number; suffix?: string }
): string {
  const { precision, suffix = "" } = options

  let formatted: string
  if (value >= 1e6) {
    const scaled = value / 1e6
    formatted = precision !== undefined ? `${scaled.toFixed(precision)}M` : `${toSigFigs(scaled)}M`
  } else if (value >= 1e3) {
    formatted = `${Math.round(value).toLocaleString()}`
  } else {
    const p = precision ?? 0
    formatted = `${value.toFixed(p)}`
  }

  return `${formatted}${suffix}`
}

/**
 * Format year values
 */
function formatYears(
  value: number,
  options: { precision?: number; includeUnit?: boolean }
): string {
  const { precision, includeUnit } = options
  const p = precision ?? (value % 1 === 0 ? 0 : 1)
  const formatted = value.toFixed(p)
  return includeUnit ? `${formatted} years` : formatted
}

/**
 * Format count values (lives, deaths, patients, etc.)
 */
function formatCount(
  value: number,
  options: { precision?: number; compact?: boolean; includeUnit?: boolean; unit?: string }
): string {
  const { precision, compact = true, includeUnit, unit } = options

  let formatted: string
  if (!compact) {
    formatted = value.toLocaleString()
  } else {
    const absValue = Math.abs(value)
    if (absValue >= 1e15) {
      const scaled = value / 1e15
      formatted = precision !== undefined ? `${scaled.toFixed(precision)} Quadrillion` : `${toSigFigs(scaled)} Quadrillion`
    } else if (absValue >= 1e12) {
      const scaled = value / 1e12
      formatted = precision !== undefined ? `${scaled.toFixed(precision)}T` : `${toSigFigs(scaled)}T`
    } else if (absValue >= 1e9) {
      const scaled = value / 1e9
      formatted = precision !== undefined ? `${scaled.toFixed(precision)}B` : `${toSigFigs(scaled)}B`
    } else if (absValue >= 1e6) {
      const scaled = value / 1e6
      formatted = precision !== undefined ? `${scaled.toFixed(precision)}M` : `${toSigFigs(scaled)}M`
    } else if (absValue >= 1e3) {
      const scaled = value / 1e3
      formatted = precision !== undefined ? `${scaled.toFixed(precision)}K` : `${toSigFigs(scaled)}K`
    } else {
      formatted = value.toLocaleString()
    }
  }

  if (includeUnit && unit) {
    formatted += ` ${unit}`
  }

  return formatted
}

/**
 * Format generic number
 */
function formatNumber(
  value: number,
  options: { precision?: number; compact?: boolean }
): string {
  const { precision, compact = true } = options

  if (!compact) {
    return precision !== undefined ? value.toFixed(precision) : value.toLocaleString()
  }

  const absValue = Math.abs(value)
  if (absValue >= 1e15) {
    const scaled = value / 1e15
    return precision !== undefined ? `${scaled.toFixed(precision)} Quadrillion` : `${toSigFigs(scaled)} Quadrillion`
  } else if (absValue >= 1e12) {
    const scaled = value / 1e12
    return precision !== undefined ? `${scaled.toFixed(precision)}T` : `${toSigFigs(scaled)}T`
  } else if (absValue >= 1e9) {
    const scaled = value / 1e9
    return precision !== undefined ? `${scaled.toFixed(precision)}B` : `${toSigFigs(scaled)}B`
  } else if (absValue >= 1e6) {
    const scaled = value / 1e6
    return precision !== undefined ? `${scaled.toFixed(precision)}M` : `${toSigFigs(scaled)}M`
  } else if (absValue >= 1e3) {
    const scaled = value / 1e3
    return precision !== undefined ? `${scaled.toFixed(precision)}K` : `${toSigFigs(scaled)}K`
  } else {
    if (precision !== undefined) return value.toFixed(precision)
    return value % 1 === 0 ? String(value) : toSigFigs(value)
  }
}

/**
 * Get raw numeric value from parameter, optionally transformed
 */
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
      // Convert rate (0.861) to percentage (86.1)
      return (unit === "percentage" || unit === "percent" || unit === "rate") && value <= 1
        ? value * 100
        : value
    default:
      return value
  }
}

/**
 * Format confidence interval
 */
export function formatConfidenceInterval(param: Parameter): string | null {
  if (!param.confidenceInterval) return null

  const [low, high] = param.confidenceInterval
  const lowFormatted = formatParameter({ ...param, value: low })
  const highFormatted = formatParameter({ ...param, value: high })

  return `${lowFormatted} – ${highFormatted}`
}
