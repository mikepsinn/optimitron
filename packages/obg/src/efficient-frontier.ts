/**
 * Efficient Frontier Ranking
 *
 * Ranks countries by outcome-per-dollar within each spending category.
 */

export interface CountryEfficiencyDatum {
  countryCode: string;
  countryName?: string;
  spending: number;
  outcome: number;
}

export interface EfficiencyCategory {
  categoryId: string;
  categoryName?: string;
  outcomeDirection?: 'higher' | 'lower';
  countries: CountryEfficiencyDatum[];
}

export interface EfficiencyFrontierConfig {
  outcomeDirection?: 'higher' | 'lower';
}

export interface CountryEfficiencyScore {
  countryCode: string;
  countryName?: string;
  spending: number;
  outcome: number;
  efficiencyScore: number;
  rank: number;
}

export interface EfficiencyCategoryResult {
  categoryId: string;
  categoryName?: string;
  rankings: CountryEfficiencyScore[];
}

const DEFAULT_CONFIG: Required<EfficiencyFrontierConfig> = {
  outcomeDirection: 'higher',
};

function normalizeCountries(
  countries: CountryEfficiencyDatum[],
  direction: 'higher' | 'lower',
): CountryEfficiencyDatum[] {
  return countries.filter((c) => {
    if (!Number.isFinite(c.spending) || !Number.isFinite(c.outcome)) return false;
    if (c.spending <= 0) return false;
    if (direction === 'lower' && c.outcome <= 0) return false;
    return true;
  });
}

function computeEfficiency(
  outcome: number,
  spending: number,
  direction: 'higher' | 'lower',
): number {
  if (direction === 'higher') return outcome / spending;
  return (1 / outcome) / spending;
}

function sortRankings(
  rankings: CountryEfficiencyScore[],
  direction: 'higher' | 'lower',
): CountryEfficiencyScore[] {
  return [...rankings].sort((a, b) => {
    if (b.efficiencyScore !== a.efficiencyScore) {
      return b.efficiencyScore - a.efficiencyScore;
    }
    if (a.outcome !== b.outcome) {
      return direction === 'higher' ? b.outcome - a.outcome : a.outcome - b.outcome;
    }
    if (a.spending !== b.spending) {
      return a.spending - b.spending;
    }
    return a.countryCode.localeCompare(b.countryCode);
  });
}

/**
 * Rank countries by outcome-per-dollar for each spending category.
 */
export function efficientFrontier(
  categories: EfficiencyCategory[],
  config: EfficiencyFrontierConfig = {},
): EfficiencyCategoryResult[] {
  const defaultDirection = config.outcomeDirection ?? DEFAULT_CONFIG.outcomeDirection;

  return categories.map((category) => {
    const direction = category.outcomeDirection ?? defaultDirection;
    const valid = normalizeCountries(category.countries, direction);

    const rankings = sortRankings(
      valid.map((c) => ({
        countryCode: c.countryCode,
        countryName: c.countryName,
        spending: c.spending,
        outcome: c.outcome,
        efficiencyScore: computeEfficiency(c.outcome, c.spending, direction),
        rank: 0,
      })),
      direction,
    ).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return {
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      rankings,
    };
  });
}
