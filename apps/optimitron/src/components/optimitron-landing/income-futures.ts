import {
  CURRENT_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_15,
  CURRENT_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_20,
  GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025,
  TREATY_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_15,
  TREATY_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_20,
} from "@optimitron/data/parameters";

/** A point on an income path: the income in `year` as a multiple of today's. */
export interface IncomeAnchor {
  year: number;
  multiple: number;
}

export const INCOME_START_YEAR = 2025;
export const INCOME_END_YEAR = 2045;

const baseIncome = GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025.value;

function pathFrom(year15: number, year20: number): readonly IncomeAnchor[] {
  return [
    { year: INCOME_START_YEAR, multiple: 1 },
    { year: INCOME_START_YEAR + 15, multiple: year15 / baseIncome },
    { year: INCOME_START_YEAR + 20, multiple: year20 / baseIncome },
  ];
}

/** The world median's after-tax income path on the current trajectory. */
export const STATUS_QUO_INCOME_PATH = pathFrom(
  CURRENT_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_15.value,
  CURRENT_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_20.value,
);

/** The world median's after-tax income path with the 1% Treaty. */
export const TREATY_INCOME_PATH = pathFrom(
  TREATY_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_15.value,
  TREATY_TRAJECTORY_MEDIAN_AFTER_TAX_INCOME_YEAR_20.value,
);

/**
 * Income multiple at `year`, with constant growth between anchors (the
 * parameters give 15- and 20-year values, not a year-by-year series). Years
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
