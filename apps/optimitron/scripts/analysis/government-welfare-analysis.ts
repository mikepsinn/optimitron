import { runCountryAnalysis, type AnnualTimeSeries } from "@optimitron/obg";
import { isEligibleCountryPanelIncomeRecord } from "@optimitron/data";
import type { MedianIncomeSeriesRecord } from "@optimitron/data/datasets/median-income-series";
import type {
  GovernmentSizeAnalysis,
  GovernmentWelfareInterval,
  GovernmentWelfareOutcome,
  HistoricalGovernmentSizeAnalysis,
} from "../../src/lib/government-size-analysis";

export interface WelfareObservation {
  jurisdictionIso3: string;
  jurisdictionName: string;
  year: number;
  value: number;
  source: string;
  sourceUrl: string;
}

export interface GovernmentWelfareSourceCache {
  schemaVersion: 1;
  sourceMode: string;
  sourceSnapshots: GovernmentSizeAnalysis["sourceSnapshots"];
  spending: WelfareObservation[];
  hale: WelfareObservation[];
  income: MedianIncomeSeriesRecord[];
}

const IMF_URL = "https://www.imf.org/external/datamapper/G_X_G01_GDP_PT";
const WHO_URL = "https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates";
const WINDOW = { startYear: 2000, endYear: 2023 };
const CONFIG = { onsetDelayDays: 365, durationOfActionDays: 1095, fillingType: "none" as const, minimumDataPoints: 8 };

function validYear(point: { year: number; value: number }): boolean {
  return Number.isInteger(point.year) && point.year >= WINDOW.startYear && point.year <= WINDOW.endYear && Number.isFinite(point.value);
}

/** Keep one survey source per country; never derive household income from government spending. */
export function selectStrictIncomeSeries(records: MedianIncomeSeriesRecord[]): WelfareObservation[] {
  const byCountry = new Map<string, Map<string, MedianIncomeSeriesRecord[]>>();
  for (const record of records) {
    if (!validYear(record) || !isEligibleCountryPanelIncomeRecord(record)) continue;
    const sources = byCountry.get(record.jurisdictionIso3) ?? new Map<string, MedianIncomeSeriesRecord[]>();
    const seriesKey = [record.source, record.unit, record.methodology, record.definition, record.priceIndexNote, record.pppBasisNote].join('|');
    const rows = sources.get(seriesKey) ?? [];
    rows.push(record);
    sources.set(seriesKey, rows);
    byCountry.set(record.jurisdictionIso3, sources);
  }
  return [...byCountry.values()].flatMap(sources => {
    const selected = [...sources.entries()].sort((a, b) =>
      new Set(b[1].map(row => row.year)).size - new Set(a[1].map(row => row.year)).size || a[0].localeCompare(b[0]),
    )[0]?.[1] ?? [];
    return [...new Map(selected.map(record => [record.year, record])).values()].map(record => ({
      jurisdictionIso3: record.jurisdictionIso3,
      jurisdictionName: record.jurisdictionName,
      year: record.year,
      value: record.value,
      source: record.source,
      sourceUrl: record.sourceUrl,
    }));
  }).sort((a, b) => a.jurisdictionIso3.localeCompare(b.jurisdictionIso3) || a.year - b.year);
}

function annualSeries(points: WelfareObservation[], id: string, name: string, unit: string): AnnualTimeSeries[] {
  const series = new Map<string, AnnualTimeSeries>();
  for (const point of points.filter(validYear)) {
    const country = series.get(point.jurisdictionIso3) ?? {
      jurisdictionId: point.jurisdictionIso3,
      jurisdictionName: point.jurisdictionName,
      variableId: id,
      variableName: name,
      unit,
      annualValues: new Map<number, number>(),
    };
    country.annualValues.set(point.year, point.value);
    series.set(point.jurisdictionIso3, country);
  }
  return [...series.values()].sort((a, b) => a.jurisdictionId.localeCompare(b.jurisdictionId));
}

/** Resample entire country estimates, retaining dependence among years within each country. */
export function countryBootstrap(values: number[], draws: number, seed: number): GovernmentWelfareInterval | null {
  if (values.length < 2) return null;
  if (!Number.isInteger(draws) || draws < 100) throw new Error("Use at least 100 bootstrap draws.");
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const samples = Array.from({ length: draws }, () => {
    let total = 0;
    for (let index = 0; index < values.length; index++) total += values[Math.floor(random() * values.length)]!;
    return total / values.length;
  }).sort((a, b) => a - b);
  const percentile = (fraction: number) => {
    const position = fraction * (samples.length - 1);
    const lower = Math.floor(position);
    return samples[lower]! + (samples[Math.ceil(position)]! - samples[lower]!) * (position - lower);
  };
  return { mean: values.reduce((sum, value) => sum + value, 0) / values.length, low: percentile(0.025), high: percentile(0.975) };
}

function analyzeOutcome(
  cache: GovernmentWelfareSourceCache,
  points: WelfareObservation[],
  spec: Pick<GovernmentWelfareOutcome, "id" | "name" | "unit" | "definition">,
  draws: number,
  seed: number,
): GovernmentWelfareOutcome {
  const filtered = points.filter(validYear);
  const predictors = annualSeries(cache.spending.filter(point => point.value > 0), "general_government_expenditure_pct_gdp", "General government expenditure", "% GDP");
  const result = runCountryAnalysis({ predictors, outcomes: annualSeries(filtered, spec.id, spec.name, spec.unit), config: CONFIG });
  const pointsByCountry = new Map<string, WelfareObservation[]>();
  for (const point of filtered) {
    const rows = pointsByCountry.get(point.jurisdictionIso3) ?? [];
    rows.push(point);
    pointsByCountry.set(point.jurisdictionIso3, rows);
  }
  const countries: GovernmentWelfareOutcome["countries"] = result.jurisdictions.map(country => {
    const baseline = country.analysis.baselineFollowup;
    const quality = country.analysis.dataQuality;
    const rows = pointsByCountry.get(country.jurisdictionId)!;
    const difference = baseline.outcomeFollowUpAverage - baseline.outcomeBaselineAverage;
    return {
      id: country.jurisdictionId,
      name: country.jurisdictionName,
      source: rows[0]!.source,
      sourceUrl: rows[0]!.sourceUrl,
      sourceObservations: rows.length,
      pairedYears: country.analysis.numberOfPairs,
      correlation: country.analysis.forwardPearson,
      outcomeDifference: spec.id === 'real_after_tax_median_income_ppp'
        ? 100 * difference / baseline.outcomeBaselineAverage : difference,
      lowerSpendingPctGdp: baseline.predictorBaselineAverage,
      higherSpendingPctGdp: baseline.predictorFollowUpAverage,
      dataQualityPassed: quality.isValid,
      // Exploratory annual summaries preserve the generic <30-pair warning.
      // They are descriptive; no evidence-qualified recommendation is inferred.
      includedInSummary: country.analysis.numberOfPairs >= CONFIG.minimumDataPoints &&
        quality.hasPredicorVariance && quality.hasOutcomeVariance &&
        quality.hasAdequateBaseline && quality.hasAdequateFollowUp,
      warnings: quality.failureReasons,
    };
  }).filter(country => [country.correlation, country.outcomeDifference, country.lowerSpendingPctGdp, country.higherSpendingPctGdp].every(Number.isFinite));
  const included = countries.filter(country => country.includedInSummary);
  const includedIds = new Set(included.map(country => country.id));
  const includedPoints = filtered.filter(point => includedIds.has(point.jurisdictionIso3));
  const years = includedPoints.map(point => point.year);
  return {
    ...spec,
    countryCount: included.length,
    excludedCountryCount: predictors.length - included.length,
    sourceObservationCount: includedPoints.length,
    yearRange: years.length ? [Math.min(...years), Math.max(...years)] : null,
    meanCorrelation: countryBootstrap(included.map(country => country.correlation), draws, seed),
    meanOutcomeDifference: countryBootstrap(included.map(country => country.outcomeDifference), draws, seed),
    countries,
  };
}

export function generateGovernmentWelfareAnalysis(
  cache: GovernmentWelfareSourceCache,
  options: { generatedAt?: string; draws?: number; seed?: number; historicalBenchmark?: HistoricalGovernmentSizeAnalysis | null } = {},
): GovernmentSizeAnalysis {
  if (cache.schemaVersion !== 1 || !Array.isArray(cache.spending) || !Array.isArray(cache.hale) || !Array.isArray(cache.income)) {
    throw new Error("Invalid government welfare source cache.");
  }
  const draws = options.draws ?? 2000;
  const seed = options.seed ?? 20260926;
  const income = selectStrictIncomeSeries(cache.income);
  return {
    schemaVersion: 2,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    sourceMode: cache.sourceMode,
    sourceSnapshots: cache.sourceSnapshots,
    predictor: { id: "general_government_expenditure_pct_gdp", name: "General government expenditure (% GDP)", definition: "IMF Fiscal Monitor: central, state, local government and social security combined." },
    outcomes: [
      analyzeOutcome(cache, cache.hale, {
        id: "healthy_life_expectancy_years", name: "Healthy life expectancy (HALE)", unit: "years",
        definition: "WHO expected healthy years at birth, both sexes. HALE is a population expectation, not median individual healthspan.",
      }, draws, seed),
      analyzeOutcome(cache, income, {
        id: "real_after_tax_median_income_ppp", name: "Real after-tax median income", unit: "% of lower-spending baseline income",
        definition: "Survey-based median disposable income after direct taxes and cash transfers, adjusted for prices and purchasing power. One OECD or Eurostat series per country; no spending-derived income or PIP fallback.",
      }, draws, seed),
    ],
    methodology: {
      ...CONFIG,
      bootstrapDraws: draws,
      seed,
      intervalDescription: "95% percentile bootstrap interval for the equally weighted mean of country estimates; whole countries are resampled. It does not include source measurement error or identify a causal policy effect.",
      notes: [
        "Each country is compared with itself over 2000–2023 using retained OBG runCountryAnalysis and optimizer algorithms. No interpolation or extrapolation is added.",
        "Higher-spending years are above that country's own mean spending share. Outcome difference compares the following 1–4 years after higher versus lower spending. Health differences are in years; income differences are percentages of each country's own baseline, not pooled dollars across incompatible price bases.",
        "Exploratory annual summaries require at least eight aligned pairs, variation in both series and at least 10% of pairs in each exposure group. The generic optimizer's 30-pair quality check and its warnings remain in the country diagnostics; these summaries are not evidence-qualified policy recommendations.",
        "Country trends and time-varying confounding can explain these associations. The report compares observed outcomes; it does not solve a joint national budget or convert total healthy years into median healthspan.",
        "Income source metadata specifies inflation and PPP conversion bases. Annual PPP factors and different OECD/Eurostat price bases limit comparisons across countries and across time.",
      ],
    },
    historicalBenchmark: options.historicalBenchmark ?? null,
  };
}

export function generateGovernmentWelfareMarkdown(report: GovernmentSizeAnalysis): string {
  const number = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 3 });
  const interval = (value: GovernmentWelfareInterval | null) => value ? `${number(value.mean)} [${number(value.low)}, ${number(value.high)}]` : "Insufficient countries";
  const lines = [
    "# Government spending, health and income", "",
    `Generated: ${report.generatedAt}`, `Source mode: ${report.sourceMode}`, "",
    `Predictor: ${report.predictor.name}. ${report.predictor.definition}`, "",
    "| Outcome | Countries | Source observations | Years | Within-country correlation, mean [95% interval] | Outcome difference, mean [95% interval] |",
    "| --- | ---: | ---: | --- | --- | --- |",
    ...report.outcomes.map(outcome => `| ${outcome.name} | ${outcome.countryCount} | ${outcome.sourceObservationCount} | ${outcome.yearRange?.join("–") ?? "Unavailable"} | ${interval(outcome.meanCorrelation)} | ${interval(outcome.meanOutcomeDifference)} ${outcome.unit} |`),
    "", "## Data and calculation", "",
    ...report.sourceSnapshots.map(source => `- [${source.name}](${source.url}), snapshot generated ${source.generatedAt}.`),
    "", ...report.outcomes.map(outcome => `- **${outcome.name}:** ${outcome.definition}`),
    "", ...report.methodology.notes.map(note => `- ${note}`), "",
    report.methodology.intervalDescription,
    `Bootstrap draws: ${report.methodology.bootstrapDraws}; seed: ${report.methodology.seed}.`,
  ];
  for (const outcome of report.outcomes) {
    lines.push("", `## ${outcome.name}: country results`, "",
      "| Country | Survey/source | Paired years | Lower / higher spending (% GDP) | Correlation | Outcome difference | Included in average |",
      "| --- | --- | ---: | --- | ---: | ---: | --- |",
      ...outcome.countries.map(country => `| ${country.name} | [${country.source}](${country.sourceUrl}) | ${country.pairedYears} | ${number(country.lowerSpendingPctGdp)} / ${number(country.higherSpendingPctGdp)} | ${number(country.correlation)} | ${number(country.outcomeDifference)} ${outcome.unit} | ${country.includedInSummary ? "Exploratory summary" : "Excluded"}; ${country.warnings.join("; ") || "quality checks passed"} |`));
  }
  if (report.historicalBenchmark) {
    lines.push("", "## Earlier spending-floor hypothesis", "",
      `Original report generated: ${report.historicalBenchmark.generatedAt}.`,
      "The earlier calculation chose the lowest spending bin near the best observed composite score. These historical hypotheses are retained for comparison, not recalculated as national welfare-maximizing budgets.", "",
      "| Earlier objective | US-equivalent floor (% GDP) | Band (% GDP) | Qualifying jurisdictions |", "| --- | ---: | --- | ---: |",
      ...report.historicalBenchmark.objectiveFloors.map(floor => `| ${floor.name} | ${floor.usEquivalentOptimalPctGdp == null ? "Unavailable" : number(floor.usEquivalentOptimalPctGdp)} | ${floor.usEquivalentBandLowPctGdp == null ? "Unavailable" : number(floor.usEquivalentBandLowPctGdp)}–${floor.usEquivalentBandHighPctGdp == null ? "Unavailable" : number(floor.usEquivalentBandHighPctGdp)} | ${floor.qualifyingJurisdictions} |`));
  }
  return `${lines.join("\n")}\n`;
}

export const GOVERNMENT_WELFARE_SOURCE_URLS = { imf: IMF_URL, who: WHO_URL };
