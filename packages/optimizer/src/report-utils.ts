/**
 * Shared report formatting utilities.
 *
 * Used by optimizer, opg, and obg report generators to ensure consistent
 * output across all report types.
 */

/**
 * Describe the evidence grade (A–F) in human-readable terms.
 * Consistent labels used across all report generators.
 */
export function describeGrade(grade: string): string {
  switch (grade) {
    case 'A': return 'Strong causal evidence';
    case 'B': return 'Probable causal relationship';
    case 'C': return 'Possible association';
    case 'D': return 'Weak evidence';
    case 'F': return 'Insufficient evidence';
    default: return 'Unknown';
  }
}

/**
 * Format a number to a given number of decimal places.
 * Returns 'N/A' for non-finite values.
 */
export function fmt(value: number, decimals: number = 2): string {
  if (!isFinite(value)) return 'N/A';
  return value.toFixed(decimals);
}

/**
 * Return the current UTC timestamp formatted for report footers.
 * Example: "2026-03-24 15:30:00 UTC"
 */
export function reportTimestamp(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
}
