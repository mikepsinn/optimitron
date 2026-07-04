/**
 * Shared display formatting for task funding amounts. Extracted from
 * `app/fund/page.tsx` so the /fund price list and the landing-page service
 * counter render identical numbers.
 */

export function formatUsdCents(cents: bigint | number) {
  const dollars = Number(cents) / 100;
  if (!Number.isFinite(dollars)) return "$0";

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: dollars >= 1000 ? 0 : 2,
    notation: dollars >= 100_000 ? "compact" : "standard",
    style: "currency",
  }).format(dollars);
}

export function formatUsd(value: number) {
  if (!Number.isFinite(value)) return "$0";
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
    notation: value >= 100_000 ? "compact" : "standard",
    style: "currency",
  }).format(value);
}

export function formatRatio(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "Unranked";
  return `${formatUsd(value)} expected per $1`;
}

export function formatPercent(percent: number) {
  if (!Number.isFinite(percent) || percent <= 0) return "0%";
  if (percent >= 100) return "100%";
  return `${percent < 1 ? "<1" : Math.round(percent)}%`;
}
