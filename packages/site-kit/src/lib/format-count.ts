/**
 * Locale-aware integer formatter used by every vote-counter / signer-count
 * surface. Lifted from `app/people/page.tsx` so the formatting stays consistent
 * wherever counts appear.
 */
export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

/**
 * Round to significant figures, then group thousands.
 *
 * `ParameterValue` formats large "years"/count parameters through
 * compact-format's `toSigFigs`, which only trims digits *after* the decimal
 * point and adds no separators — so 37,777.78 renders as "37778". Pass the
 * result of this as `valueOverride` to print what the parameter's own
 * calculation shows ("37,800"). Fixing `toSigFigs` itself would move numbers
 * on every site's copy snapshots, so that stays a separate change.
 */
export function formatSignificantFigures(
  value: number,
  figures: number,
): string {
  return Number(value.toPrecision(figures)).toLocaleString("en-US");
}
