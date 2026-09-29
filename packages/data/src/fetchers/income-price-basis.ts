/** All real income comparisons use one declared price and PPP reference year. */
export const INCOME_PRICE_REFERENCE_YEAR = 2021;

export interface IncomePriceBasis {
  priceReferenceYear: number;
  referenceCpi: number | null;
  referencePpp: number | null;
  priceIndexSource: string;
  pppSource: string;
  nominalPppSource: string;
}

export function positiveValue(value: number | null | undefined): number | null {
  return value !== null && value !== undefined && Number.isFinite(value) && value > 0 ? value : null;
}

/** A CPI ratio cancels its index base. PPP must then refer to that price year. */
export function toReferenceYearIncome(
  nominalIncome: number,
  cpi: number | null,
  referenceCpi: number | null,
): number | null {
  const current = positiveValue(cpi);
  const reference = positiveValue(referenceCpi);
  return current !== null && reference !== null
    ? nominalIncome * reference / current
    : null;
}
