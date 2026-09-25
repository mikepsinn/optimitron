/** Axis ticks and value labels for AgencyGradeChart. */

export interface ValueAxis {
  lo: number;
  hi: number;
  ticks: number[];
}

function niceStep(span: number, targetTicks: number): number {
  const raw = span / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

/**
 * The bounds and tick values of one vertical axis. Dollar amounts always start
 * at 0. Other series start at 0 when their smallest value is at most half of
 * their largest; otherwise the axis zooms in and its labeled minimum shows that.
 */
export function valueAxis(values: number[], startAtZero: boolean): ValueAxis {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (startAtZero || (min >= 0 && min <= max / 2)) min = Math.min(0, min);
  if (min === max) max = min + 1;
  const step = niceStep(max - min, 4);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let i = 0; lo + i * step <= hi + step / 2; i++) {
    ticks.push(Number((lo + i * step).toPrecision(12)));
  }
  return { lo, hi, ticks };
}

export function yearTicks(minYear: number, maxYear: number): number[] {
  const span = maxYear - minYear;
  const step = span <= 12 ? 2 : span <= 30 ? 5 : span <= 60 ? 10 : 20;
  const ticks = [minYear];
  for (let year = Math.ceil((minYear + 1) / step) * step; year < maxYear; year += step) {
    if (year - minYear >= step / 2 && maxYear - year >= step / 2) ticks.push(year);
  }
  if (maxYear !== minYear) ticks.push(maxYear);
  return ticks;
}

export function formatUsd(value: number): string {
  const abs = Math.abs(value);
  const scaled = (n: number, suffix: string) => `$${Number(n.toPrecision(3)).toLocaleString("en-US")}${suffix}`;
  if (abs >= 1e12) return scaled(value / 1e12, "T");
  if (abs >= 1e9) return scaled(value / 1e9, "B");
  if (abs >= 1e6) return scaled(value / 1e6, "M");
  if (abs >= 1e3) return scaled(value / 1e3, "K");
  return `$${value.toLocaleString("en-US")}`;
}

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatValue(value: number): string {
  return Math.abs(value) >= 10_000
    ? compactNumber.format(value)
    : value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
