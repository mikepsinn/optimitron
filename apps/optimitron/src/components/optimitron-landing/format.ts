const compactUsdFormat = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumSignificantDigits: 3,
  notation: "compact",
  style: "currency",
});

const wholeUsdFormat = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

/** $101T, $886B, $4.4B: short money for receipts, tiles, and tables. */
export function compactUsd(value: number): string {
  return compactUsdFormat.format(value);
}

/** $85,097: whole dollars for personal-scale amounts. */
export function wholeUsd(value: number): string {
  return wholeUsdFormat.format(value);
}
