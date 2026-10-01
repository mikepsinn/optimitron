interface PopulationBudgetScenario {
  population: number;
  totalPerCapita: number | null;
  subtotalPerCapita: number;
  annualBudget: number | null;
  lines: { peer: { publicCostPerCapita: number } | null; annualBudget: number | null }[];
}

/** Scale annual allocations without changing reference countries, per-capita costs or metadata. */
export function scaleOptimalBudgetScenario<T extends PopulationBudgetScenario>(scenario: T, population: number): T {
  if (!Number.isSafeInteger(population) || population <= 0) throw new Error('Population must be a positive safe integer.');
  const annual = (perCapita: number | null) => {
    if (perCapita === null) return null;
    const amount = perCapita * population;
    if (!Number.isFinite(amount)) throw new Error('Budget exceeds numeric range.');
    return amount;
  };
  annual(scenario.subtotalPerCapita);
  return {
    ...scenario, population,
    annualBudget: annual(scenario.totalPerCapita),
    lines: scenario.lines.map(line => ({ ...line, annualBudget: annual(line.peer?.publicCostPerCapita ?? null) })),
  };
}
