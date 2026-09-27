/** Minimum observed cost subject to explicit outcome targets, then linear population scaling. */
export interface BestPracticeCountry {
  id: string;
  name: string;
  costs: Record<string, number | null>;
  outcomes: Record<string, number | undefined>;
  /** Optional total resource cost for selecting healthcare without rewarding cost shifting. */
  totalHealthPerCapita?: number | null;
}

export interface BestPracticeCategory {
  id: string;
  name: string;
  outcomeMetrics: string[];
  selectionCost?: 'totalHealthPerCapita';
}

export interface BestPracticeBudgetInput {
  countries: BestPracticeCountry[];
  categories: BestPracticeCategory[];
  population: number;
  /** Quantile in [0, 1]. All outcome metrics must be oriented higher-is-better. */
  outcomeQuantile: number;
}

export interface BestPracticePeer {
  id: string;
  name: string;
  publicCostPerCapita: number;
  selectionCostPerCapita: number;
  outcomes: Record<string, number | undefined>;
}

export interface BestPracticeBudgetLine {
  id: string;
  name: string;
  targets: Record<string, number | null>;
  outcomeMetrics: string[];
  selectionCost: 'public' | 'totalHealthPerCapita';
  eligibleCountryCount: number;
  peer: BestPracticePeer | null;
  /** Up to three cheapest qualifying alternatives, including the selected peer. */
  alternatives: BestPracticePeer[];
  annualBudget: number | null;
  perCapitaRange: [number, number] | null;
}

function quantile(values: number[], q: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  return sorted[lower]! + (sorted[Math.ceil(position)]! - sorted[lower]!) * (position - lower);
}

/** Targets use the full outcome sample, independent of spending-data availability. */
export function calculateBestPracticeBudget(input: BestPracticeBudgetInput) {
  const { countries, categories, population, outcomeQuantile } = input;
  if (!Number.isSafeInteger(population) || population <= 0) throw new Error('Population must be a positive safe integer.');
  if (!Number.isFinite(outcomeQuantile) || outcomeQuantile < 0 || outcomeQuantile > 1) throw new Error('Outcome quantile must be between zero and one.');
  if (!categories.length || new Set(categories.map(c => c.id)).size !== categories.length) throw new Error('Budget categories must be nonempty and unique.');
  if (new Set(countries.map(c => c.id)).size !== countries.length) throw new Error('Use one observation per country, averaged over the reference period.');
  const lines: BestPracticeBudgetLine[] = categories.map(category => {
    if (!category.outcomeMetrics.length) throw new Error(`Outcome targets are required for ${category.id}.`);
    const targets = Object.fromEntries(category.outcomeMetrics.map(metric => [metric, quantile(
      countries.map(c => c.outcomes[metric]).filter((n): n is number => n !== undefined && Number.isFinite(n)), outcomeQuantile,
    )]));
    const peers: BestPracticePeer[] = countries.flatMap(country => {
      const cost = country.costs[category.id];
      const selectionCost = category.selectionCost ? country[category.selectionCost] : cost;
      if (cost === null || cost === undefined || !Number.isFinite(cost) || cost < 0 || selectionCost === null || selectionCost === undefined || !Number.isFinite(selectionCost) || selectionCost < 0) return [];
      if (!category.outcomeMetrics.every(metric => {
        const target = targets[metric];
        const outcome = country.outcomes[metric];
        return target !== null && target !== undefined && outcome !== undefined && Number.isFinite(outcome) && outcome >= target;
      })) return [];
      return [{ id: country.id, name: country.name, publicCostPerCapita: cost, selectionCostPerCapita: selectionCost, outcomes: country.outcomes }];
    }).sort((a, b) => a.selectionCostPerCapita - b.selectionCostPerCapita || a.publicCostPerCapita - b.publicCostPerCapita || a.id.localeCompare(b.id));
    const peer = peers[0] ?? null;
    const alternatives = peers.slice(0, 3);
    const costs = alternatives.map(p => p.publicCostPerCapita);
    const annualBudget = peer ? peer.publicCostPerCapita * population : null;
    if (annualBudget !== null && !Number.isFinite(annualBudget)) throw new Error('Budget exceeds numeric range.');
    return {
      id: category.id, name: category.name, targets, outcomeMetrics: category.outcomeMetrics,
      selectionCost: category.selectionCost ?? 'public', eligibleCountryCount: peers.length,
      peer, alternatives, annualBudget,
      perCapitaRange: costs.length ? [Math.min(...costs), Math.max(...costs)] : null,
    };
  });
  const complete = lines.every(line => line.peer !== null);
  const subtotalPerCapita = lines.reduce((sum, line) => sum + (line.peer?.publicCostPerCapita ?? 0), 0);
  if (!Number.isFinite(subtotalPerCapita * population)) throw new Error('Budget exceeds numeric range.');
  const range: [number, number] | null = complete ? [
    lines.reduce((sum, line) => sum + line.perCapitaRange![0], 0),
    lines.reduce((sum, line) => sum + line.perCapitaRange![1], 0),
  ] : null;
  return {
    population, outcomeQuantile, complete, lines,
    totalPerCapita: complete ? subtotalPerCapita : null,
    annualBudget: complete ? subtotalPerCapita * population : null,
    subtotalPerCapita, alternativePerCapitaRange: range,
  };
}

/** Highest preset supported by three jointly high-health/high-income reference countries. */
export function chooseSupportedOutcomeQuantile(countries: BestPracticeCountry[]): number {
  for (const q of [0.95, 0.9, 0.8]) {
    const result = calculateBestPracticeBudget({ countries: countries.map(c => ({ ...c, costs: { screening: 0 } })),
      categories: [{ id: 'screening', name: 'Health and income', outcomeMetrics: ['hale', 'income'] }], population: 1, outcomeQuantile: q });
    if (result.lines[0]!.eligibleCountryCount >= 3) return q;
  }
  // Preserve the target when coverage is thin; missing lines remain missing.
  return 0.8;
}
