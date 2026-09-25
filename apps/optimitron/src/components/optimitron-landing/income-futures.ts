import {
  CURRENT_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_15,
  GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025,
  TREATY_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_15,
} from "@optimitron/data/parameters";

/** A point on an income path: the income in `year` as a multiple of today's. */
export interface IncomeAnchor {
  year: number;
  multiple: number;
}

export const INCOME_START_YEAR = 2025;
/** The Earth Optimization Prize deadline, so this chart matches the page's other 2040 targets. */
export const INCOME_END_YEAR = 2040;

const baseIncome = GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025.value;

function pathTo(incomeAtEnd: number): readonly IncomeAnchor[] {
  return [
    { year: INCOME_START_YEAR, multiple: 1 },
    { year: INCOME_END_YEAR, multiple: incomeAtEnd / baseIncome },
  ];
}

/** The world median's after-tax income path on the current trajectory. */
export const STATUS_QUO_INCOME_PATH = pathTo(
  CURRENT_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_15.value,
);

/** The world median's after-tax income path with the 1% Treaty. */
export const TREATY_INCOME_PATH = pathTo(
  TREATY_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_15.value,
);

/**
 * Income multiple at `year`, with constant growth between anchors (the
 * parameters give end-of-period values, not a year-by-year series). Years
 * outside the anchors clamp to the nearest end.
 */
export function incomeMultipleAt(
  path: readonly IncomeAnchor[],
  year: number,
): number {
  const first = path[0];
  const last = path[path.length - 1];
  if (!first || !last) return 1;
  if (year <= first.year) return first.multiple;
  if (year >= last.year) return last.multiple;

  for (let index = 1; index < path.length; index++) {
    const from = path[index - 1]!;
    const to = path[index]!;
    if (year <= to.year) {
      const progress = (year - from.year) / (to.year - from.year);
      return from.multiple * (to.multiple / from.multiple) ** progress;
    }
  }
  return last.multiple;
}
