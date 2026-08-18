import type { EarthExecutionPolicy } from "@optimitron/agent";

function parseCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseNonNegativeNumber(value: string | undefined, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

export function getEarthExecutionPolicy(): EarthExecutionPolicy {
  const defaultLawfulSpendTypes = parseCsv(process.env.OPTIMIZE_EARTH_DEFAULT_LAWFUL_SPEND_TYPES)
    .map((value) => value.toUpperCase());

  return {
    allowlistedAutoSpendTypes: parseCsv(process.env.OPTIMIZE_EARTH_AUTO_SPEND_TYPES).map((value) =>
      value.toUpperCase(),
    ),
    authenticatedCounterpartiesOnly:
      process.env.OPTIMIZE_EARTH_AUTHENTICATED_COUNTERPARTIES_ONLY !== "false",
    availableExternalBudgetUsd: parseNonNegativeNumber(
      process.env.OPTIMIZE_EARTH_AVAILABLE_EXTERNAL_BUDGET_USD,
      0,
    ),
    dailyAutoSpendCapUsd: parseNonNegativeNumber(
      process.env.OPTIMIZE_EARTH_AUTO_SPEND_DAILY_USD,
      0,
    ),
    defaultExternalLaborRateUsdPerHour: parseNonNegativeNumber(
      process.env.OPTIMIZE_EARTH_DEFAULT_EXTERNAL_LABOR_RATE_USD,
      75,
    ),
    defaultLawfulSpendTypes:
      defaultLawfulSpendTypes.length > 0
        ? defaultLawfulSpendTypes
        : ["LABOR", "COMPUTE", "ADS", "SOFTWARE", "SERVICES", "OTHER_LAWFUL"],
    perTaskAutoSpendCapUsd: parseNonNegativeNumber(
      process.env.OPTIMIZE_EARTH_AUTO_SPEND_PER_TASK_USD,
      0,
    ),
  };
}
