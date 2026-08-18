const UNITS = [
  { value: 1e12, suffix: "T" },
  { value: 1e9, suffix: "B" },
  { value: 1e6, suffix: "M" },
  { value: 1e3, suffix: "K" },
];

interface FormatOptions {
  significantDigits?: number;
  minimumFractionDigits?: number;
}

export function formatNumberShort(
  value: number,
  options: FormatOptions = {},
): string {
  const { significantDigits = 3, minimumFractionDigits = 0 } = options;
  const abs = Math.abs(value);

  for (const unit of UNITS) {
    if (abs >= unit.value) {
      const scaled = value / unit.value;
      return `${Number(scaled.toPrecision(significantDigits)).toLocaleString("en-US", {
        minimumFractionDigits,
        maximumFractionDigits: Math.max(minimumFractionDigits, 2),
      })}${unit.suffix}`;
    }
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits,
    maximumFractionDigits: Math.max(minimumFractionDigits, 2),
  });
}

export function formatCurrencyShort(
  value: number,
  options: FormatOptions = {},
): string {
  if (Math.abs(value) < 1_000) {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  return `$${formatNumberShort(value, options)}`;
}

export function formatLives(value: number): string {
  if (value < 10) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  if (value < 1_000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return formatNumberShort(value, { significantDigits: 3 });
}

export function formatPerVoteLabel(value: number, unit: string): string {
  if (Math.abs(value) >= 1_000) {
    return `${formatNumberShort(value)} ${unit}`;
  }

  const fractionDigits = value < 10 ? 2 : 0;

  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })} ${unit}`;
}
