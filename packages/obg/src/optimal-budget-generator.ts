import { selectBudgetReferences, chooseSupportedOutcomeQuantile } from './budget-references.js';
import type { BudgetReferenceCategory, BudgetReferenceCountry, BudgetReferencePeer, BudgetReferenceLine } from './budget-references.js';
import { calculateHealthcareFrontier } from './healthcare-frontier.js';
import type { HealthcareFrontierCountry } from './healthcare-frontier.js';
import { scaleOptimalBudgetScenario } from './optimal-budget-scaling.js';

/** All costs must share a reference period, currency and purchasing-power base. */
export interface OptimalBudgetInput<T extends HealthcareFrontierCountry = HealthcareFrontierCountry> {
  countries: (BudgetReferenceCountry & { subcategoryCosts: Record<string, number | null> })[];
  categories: { id: string; name: string }[];
  subcategories: { id: string; name: string; parentId: string }[];
  healthcareCountries: T[];
  /** COFOG public allocations, separate from the current-care costs used for selection. */
  healthcareBudgets: { countryId: string; publicPerCapita: number | null; subcategoryCosts: Record<string, number | null> }[];
  incomeUnit: string;
  population?: number;
}

const categoryNames: Record<string, string> = {
  GF01: 'Government, research and debt', GF02: 'Weapons and Military',
  GF03: 'Police, courts and fire services', GF04: 'Transport, energy and industry',
  GF05: 'Waste, pollution and nature', GF06: 'Housing and community services',
  GF07: 'Healthcare', GF08: 'Culture, recreation and religion',
  GF09: 'Education', GF10: 'Pensions and social support',
};

/** Generate the population-scaled public budget and all supported outcome/healthcare scenarios.
 * Data is supplied by the caller; this function has no filesystem, network or application dependencies.
 */
export function generateOptimalBudget<T extends HealthcareFrontierCountry>(input: OptimalBudgetInput<T>) {
  const population = input.population ?? 1;
  if (!input.categories.length || new Set(input.categories.map(category => category.id)).size !== input.categories.length) {
    throw new Error('Budget categories must be nonempty and unique.');
  }
  const outcomeDefinitions: Record<string, { label: string; unit: string }> = {
    hale: { label: 'Healthy life expectancy', unit: 'years (WHO HALE, population average)' },
    income: { label: 'Median disposable income', unit: input.incomeUnit },
    mathProficiency: { label: 'Students reaching basic maths proficiency', unit: '% of 15-year-olds (PISA 2018, Level 2+)' },
  };

  const categories: BudgetReferenceCategory[] = input.categories.map(category => ({
    ...category,
    name: categoryNames[category.id] ?? category.name,
    outcomeMetrics: category.id === 'GF07' ? ['hale'] : category.id === 'GF09' ? ['mathProficiency'] : ['hale', 'income'],
    ...(category.id === 'GF07' ? { selectionCost: 'totalHealthPerCapita' as const } : {}),
  }));

  // Friendly display names do not alter source identifiers or the saved raw input.
  const countryName = (id: string, name: string) => id === 'KOR' ? 'South Korea' : name;
  const healthCountries = input.healthcareCountries.map(country => ({ ...country, name: countryName(country.id, country.name) }));
  const publicHealth = new Map<string, { publicPerCapita: number | null; subcategoryCosts: Record<string, number | null> }>([
    ...input.countries.map(country => [country.id, { publicPerCapita: country.costs['GF07'] ?? null, subcategoryCosts: country.subcategoryCosts }] as const),
    ...input.healthcareBudgets.map(country => [country.countryId, country] as const),
  ]);
  const defaultQuantile = chooseSupportedOutcomeQuantile(input.countries);
  const healthcareOptions = [1, 0, 0.5, 1.5, 2].map(maxHealthyYearGap => {
    const { countries: _countries, frontier, ...result } = calculateHealthcareFrontier({ countries: healthCountries, maxHealthyYearGap });
    return { ...result, frontierIds: frontier.map(country => country.id) };
  });
  const scenarios = [0.8, 0.9, 0.95].flatMap(outcomeQuantile => {
    const nationalCategories = categories.filter(category => category.id !== 'GF07');
    const nationalLines = nationalCategories.length
      ? selectBudgetReferences({ countries: input.countries, categories: nationalCategories, population, outcomeQuantile }).lines
      : [];
    return healthcareOptions.map(health => {
      const peer = (country: NonNullable<typeof health.selected>): BudgetReferencePeer | null => {
        const allocation = publicHealth.get(country.id);
        return allocation?.publicPerCapita != null && Number.isFinite(allocation.publicPerCapita) && allocation.publicPerCapita >= 0 ? {
          id: country.id, name: country.name, publicCostPerCapita: allocation.publicPerCapita,
          selectionCostPerCapita: country.totalPerCapita, outcomes: { hale: country.hale },
        } : null;
      };
      const selectedPeer = health.selected ? peer(health.selected) : null;
      const healthPeers = health.selected ? [health.selected, ...health.alternatives].flatMap(country => {
        const reference = peer(country);
        return reference ? [reference] : [];
      }).slice(0, 3) : [];
      const lines = categories.map(category => {
        const updated: BudgetReferenceLine = category.id === 'GF07' ? {
          id: category.id, name: category.name, outcomeMetrics: ['hale'], selectionCost: 'totalHealthPerCapita',
          targets: { hale: health.targetHale }, peer: selectedPeer,
          eligibleCountryCount: health.eligibleCountryCount, alternatives: healthPeers,
          annualBudget: null,
          perCapitaRange: healthPeers.length ? [Math.min(...healthPeers.map(p => p.publicCostPerCapita)), Math.max(...healthPeers.map(p => p.publicCostPerCapita))] : null,
        } : nationalLines.find(line => line.id === category.id)!;
        const reference = input.countries.find(country => country.id === updated.peer?.id);
        const subcategoryCosts = updated.id === 'GF07' ? publicHealth.get(updated.peer?.id ?? '')?.subcategoryCosts : reference?.subcategoryCosts;
        const breakdown = input.subcategories.filter(child => child.parentId === category.id).map(child => ({
          id: child.id, name: child.name, perCapita: subcategoryCosts?.[child.id] ?? null,
        }));
        const known = breakdown.reduce((sum, child) => sum + (child.perCapita ?? 0), 0);
        const remainder = updated.peer && breakdown.length ? updated.peer.publicCostPerCapita - known : null;
        return { ...updated, breakdown, breakdownRemainder: remainder };
      });
      const complete = lines.every(line => line.peer !== null);
      const subtotalPerCapita = lines.reduce((sum, line) => sum + (line.peer?.publicCostPerCapita ?? 0), 0);
      return scaleOptimalBudgetScenario({
        population, outcomeQuantile, annualBudget: null, lines, complete, maxHealthyYearGap: health.maxHealthyYearGap, subtotalPerCapita,
        totalPerCapita: complete ? subtotalPerCapita : null,
        alternativePerCapitaRange: complete ? [lines.reduce((sum, line) => sum + line.perCapitaRange![0], 0), lines.reduce((sum, line) => sum + line.perCapitaRange![1], 0)] as [number, number] : null,
      }, population);
    });
  });
  return {
    countryCount: input.countries.length,
    healthcare: { countries: healthCountries, scenarios: healthcareOptions, defaultMaxHealthyYearGap: 1 },
    defaultQuantile, outcomeDefinitions, scenarios,
  };
}

export type OptimalBudgetResult = ReturnType<typeof generateOptimalBudget>;
export type OptimalBudgetScenario = OptimalBudgetResult['scenarios'][number];
