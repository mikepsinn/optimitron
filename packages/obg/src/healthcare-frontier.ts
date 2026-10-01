/** Spending must use a common currency, price base, period, and accounting scope. */
export interface HealthcareFrontierObservation {
  year: number;
  totalPerCapita: number;
  publicPerCapita: number | null;
  hale: number;
}

export interface HealthcareFrontierCountry {
  id: string;
  name: string;
  totalPerCapita: number;
  publicPerCapita: number | null;
  privatePerCapita: number | null;
  externalPerCapita: number | null;
  /** A subset of private spending, not an additional cost. */
  outOfPocketPerCapita: number | null;
  /** Observed expected healthy years; this is not median healthspan. */
  hale: number;
  /** Source uncertainty bounds, retained without interpreting them as policy effects. */
  haleLow: number | null;
  haleHigh: number | null;
  observations?: readonly HealthcareFrontierObservation[];
}

export interface HealthcareFrontierInput<T extends HealthcareFrontierCountry = HealthcareFrontierCountry> {
  countries: readonly T[];
  /** Maximum shortfall from the best observed HALE, in healthy years. Defaults to one. */
  maxHealthyYearGap?: number;
}

export interface HealthcareFrontierYearSelection {
  year: number;
  selectedId: string | null;
  bestHale: number;
  targetHale: number;
  countryCount: number;
  eligibleCountryCount: number;
  selectedTotalPerCapita: number | null;
  selectedPublicPerCapita: number | null;
}

export interface HealthcareFrontierResult<T extends HealthcareFrontierCountry = HealthcareFrontierCountry> {
  /** Sorted by total cost, then higher HALE, then country id. */
  countries: T[];
  /** No other observed country improves cost or health without worsening the other. */
  frontier: T[];
  selected: T | null;
  /** Every other country meeting the same target with known public financing, in cost order. */
  alternatives: T[];
  bestHale: number | null;
  targetHale: number | null;
  maxHealthyYearGap: number;
  eligibleCountryCount: number;
  selectedIsOnFrontier: boolean;
  /** Nonempty only when the selected country is dominated by peers without public cost data. */
  selectedDominatedBy: string[];
  /** Repeats selection within each year's available countries; not a confidence interval. */
  selectionByYear: HealthcareFrontierYearSelection[];
}

type SelectionPoint = Pick<HealthcareFrontierCountry, 'id' | 'totalPerCapita' | 'publicPerCapita' | 'hale'>;

function compareCountries(a: SelectionPoint, b: SelectionPoint): number {
  return a.totalPerCapita - b.totalPerCapita || b.hale - a.hale || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

function dominates(a: SelectionPoint, b: SelectionPoint): boolean {
  return a.totalPerCapita <= b.totalPerCapita && a.hale >= b.hale
    && (a.totalPerCapita < b.totalPerCapita || a.hale > b.hale);
}

function validateNumber(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be finite and nonnegative.`);
}

function validateOptionalNumber(value: number | null, label: string): void {
  if (value !== null) validateNumber(value, label);
}

function validateCountries(countries: readonly HealthcareFrontierCountry[]): void {
  const ids = new Set<string>();
  for (const country of countries) {
    if (!country.id.trim() || country.id !== country.id.trim()) throw new Error('Country ids must be nonempty and have no surrounding whitespace.');
    if (ids.has(country.id)) throw new Error(`Duplicate country id: ${country.id}. Use one averaged observation per country.`);
    ids.add(country.id);
    validateNumber(country.totalPerCapita, `${country.id} totalPerCapita`);
    validateNumber(country.hale, `${country.id} hale`);
    for (const field of ['publicPerCapita', 'privatePerCapita', 'externalPerCapita', 'outOfPocketPerCapita', 'haleLow', 'haleHigh'] as const) {
      validateOptionalNumber(country[field], `${country.id} ${field}`);
    }
    if ((country.haleLow !== null && country.haleLow > country.hale)
      || (country.haleHigh !== null && country.haleHigh < country.hale)) {
      throw new Error(`${country.id} HALE bounds must contain the point estimate.`);
    }
    const years = new Set<number>();
    for (const observation of country.observations ?? []) {
      if (!Number.isSafeInteger(observation.year) || observation.year <= 0) throw new Error(`${country.id} observation year must be a positive integer.`);
      if (years.has(observation.year)) throw new Error(`${country.id} has duplicate observation year ${observation.year}.`);
      years.add(observation.year);
      validateNumber(observation.totalPerCapita, `${country.id} ${observation.year} totalPerCapita`);
      validateOptionalNumber(observation.publicPerCapita, `${country.id} ${observation.year} publicPerCapita`);
      validateNumber(observation.hale, `${country.id} ${observation.year} hale`);
    }
  }
}

function selectCountries<T extends SelectionPoint>(countries: readonly T[], maxHealthyYearGap: number) {
  const bestHale = countries.length ? Math.max(...countries.map(country => country.hale)) : null;
  const targetHale = bestHale === null ? null : bestHale - maxHealthyYearGap;
  const eligible = targetHale === null ? [] : countries
    .filter(country => country.hale >= targetHale && country.publicPerCapita !== null)
    .sort(compareCountries);
  return { bestHale, targetHale, eligible, selected: eligible[0] ?? null };
}

/**
 * Select the cheapest observed system within an explicit healthy-year gap of the best.
 * Total spending, including private bills, drives selection. Public financing must be
 * known to produce a public budget, but missing financing never lowers the health target.
 * The frontier describes observed country outcomes, not the causal effect of adopting them.
 */
export function calculateHealthcareFrontier<T extends HealthcareFrontierCountry>(
  input: HealthcareFrontierInput<T>,
): HealthcareFrontierResult<T> {
  const maxHealthyYearGap = input.maxHealthyYearGap ?? 1;
  validateNumber(maxHealthyYearGap, 'maxHealthyYearGap');
  validateCountries(input.countries);
  const countries = [...input.countries].sort(compareCountries);
  const frontier = countries.filter(country => !countries.some(other => dominates(other, country)));
  const { bestHale, targetHale, eligible, selected } = selectCountries(countries, maxHealthyYearGap);

  const observationsByYear = new Map<number, SelectionPoint[]>();
  for (const country of countries) {
    for (const observation of country.observations ?? []) {
      const points = observationsByYear.get(observation.year) ?? [];
      points.push({ id: country.id, ...observation });
      observationsByYear.set(observation.year, points);
    }
  }
  const selectionByYear = [...observationsByYear.entries()].sort(([a], [b]) => a - b).flatMap(([year, points]) => {
    const result = selectCountries(points, maxHealthyYearGap);
    if (result.bestHale === null || result.targetHale === null) return [];
    return [{
      year,
      selectedId: result.selected?.id ?? null,
      bestHale: result.bestHale,
      targetHale: result.targetHale,
      countryCount: points.length,
      eligibleCountryCount: result.eligible.length,
      selectedTotalPerCapita: result.selected?.totalPerCapita ?? null,
      selectedPublicPerCapita: result.selected?.publicPerCapita ?? null,
    }];
  });
  return {
    countries,
    frontier,
    selected,
    alternatives: eligible.slice(1),
    bestHale,
    targetHale,
    maxHealthyYearGap,
    eligibleCountryCount: eligible.length,
    selectedIsOnFrontier: selected !== null && frontier.some(country => country.id === selected.id),
    selectedDominatedBy: selected ? countries.filter(country => dominates(country, selected)).map(country => country.id) : [],
    selectionByYear,
  };
}
