/**
 * Government spending metric source comparison.
 *
 * Documents competing "government spending" definitions and coverage, then
 * recommends the default international-comparative predictor for analysis.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  fetchers,
  TOP_COUNTRIES,
  type DataPoint,
} from '@optimitron/data';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../output');

const DEFAULT_START_YEAR = 1990;
const DEFAULT_END_YEAR = 2023;
const DEFAULT_JURISDICTIONS = [...TOP_COUNTRIES];
const FREDGRAPH_USER_AGENT = 'Mozilla/5.0';

type YearWindow = {
  startYear: number;
  endYear: number;
};

type CoverageSummary = {
  observations: number;
  jurisdictions: number;
  yearMin: number | null;
  yearMax: number | null;
  medianYearsPerJurisdiction: number;
};

type WorldBankMetricSnapshot = {
  id: string;
  label: string;
  scope: 'international_comparable';
  source: string;
  definition: string;
  indicatorCode: string;
  panelCoverage: CoverageSummary;
  globalCoverage: CoverageSummary;
  usLatest: {
    year: number;
    value: number;
    unit: string;
  } | null;
};

type UsContextMetricSnapshot = {
  id: string;
  label: string;
  scope: 'us_context_only';
  source: string;
  definition: string;
  latest: {
    date: string;
    value: number;
    unit: string;
  } | null;
  latestCalendarYearAverage: {
    year: number;
    value: number;
    unit: string;
  } | null;
  notes: string[];
};

type GovernmentSpendingMetricComparisonData = {
  generatedAt: string;
  window: YearWindow;
  analysisJurisdictions: number;
  worldBankMetrics: WorldBankMetricSnapshot[];
  usContextMetrics: UsContextMetricSnapshot[];
  recommendation: {
    primaryInternationalMetricId: string;
    companionMetrics: string[];
    rationale: string[];
    caveats: string[];
  };
};

type MetricComparisonArtifacts = {
  markdown: string;
  json: GovernmentSpendingMetricComparisonData;
  outputPaths: {
    markdown: string;
    json: string;
  };
};

type FredObservation = {
  date: string;
  value: number;
};

type MetricComparisonOptions = {
  outputDir?: string;
  writeFiles?: boolean;
  logSummary?: boolean;
  startYear?: number;
  endYear?: number;
  jurisdictions?: string[];
};

function keyFor(jurisdictionIso3: string, year: number): string {
  return `${jurisdictionIso3}::${year}`;
}

function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo] ?? 0;
  const loVal = sorted[lo] ?? 0;
  const hiVal = sorted[hi] ?? 0;
  return loVal + (hiVal - loVal) * (idx - lo);
}

function formatNumber(value: number, fractionDigits: number = 1): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function formatValue(value: number, unit: string): string {
  if (unit.includes('$')) {
    return `$${Math.round(value).toLocaleString('en-US')}`;
  }
  if (unit.includes('%')) {
    return `${formatNumber(value, 1)}%`;
  }
  return formatNumber(value, 2);
}

export function summarizeCoverage(points: DataPoint[]): CoverageSummary {
  const byJurisdictionYears = new Map<string, Set<number>>();

  for (const point of points) {
    if (!Number.isFinite(point.value)) continue;
    const existing = byJurisdictionYears.get(point.jurisdictionIso3);
    if (existing) {
      existing.add(point.year);
    } else {
      byJurisdictionYears.set(point.jurisdictionIso3, new Set([point.year]));
    }
  }

  const yearCounts = [...byJurisdictionYears.values()].map(years => years.size);
  const years = points.map(point => point.year);

  return {
    observations: points.length,
    jurisdictions: byJurisdictionYears.size,
    yearMin: years.length > 0 ? Math.min(...years) : null,
    yearMax: years.length > 0 ? Math.max(...years) : null,
    medianYearsPerJurisdiction: yearCounts.length > 0 ? quantile(yearCounts, 0.5) : 0,
  };
}

function latestUsValue(points: DataPoint[], unit: string): { year: number; value: number; unit: string } | null {
  const latest = points
    .filter(point => point.jurisdictionIso3 === 'USA' && Number.isFinite(point.value))
    .sort((a, b) => b.year - a.year)[0];

  if (!latest) return null;
  return {
    year: latest.year,
    value: latest.value,
    unit,
  };
}

export function computeDerivedGovSpendingPerCapitaPpp(
  spendingPctPoints: DataPoint[],
  gdpPerCapitaPppPoints: DataPoint[],
): DataPoint[] {
  const gdpByCountryYear = new Map<string, DataPoint>();
  for (const point of gdpPerCapitaPppPoints) {
    if (!Number.isFinite(point.value)) continue;
    gdpByCountryYear.set(keyFor(point.jurisdictionIso3, point.year), point);
  }

  return spendingPctPoints.flatMap((spendingPoint): DataPoint[] => {
      if (!Number.isFinite(spendingPoint.value)) return [];
      const gdp = gdpByCountryYear.get(keyFor(spendingPoint.jurisdictionIso3, spendingPoint.year));
      if (!gdp || !Number.isFinite(gdp.value)) return [];

      return [{
        jurisdictionIso3: spendingPoint.jurisdictionIso3,
        year: spendingPoint.year,
        value: (spendingPoint.value / 100) * gdp.value,
        unit: 'international $/person',
        source: 'Derived (GC.XPN.TOTL.GD.ZS/100)*NY.GDP.PCAP.PP.CD',
      } satisfies DataPoint];
    });
}

export function parseFredGraphCsv(csv: string): FredObservation[] {
  const lines = csv.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0 || !lines[0]?.startsWith('observation_date,')) {
    return [];
  }

  return lines
    .slice(1)
    .map(line => {
      const [date, rawValue] = line.split(',');
      if (!date || !rawValue || rawValue === '.') return null;
      const value = Number(rawValue);
      if (!Number.isFinite(value)) return null;
      return { date, value } satisfies FredObservation;
    })
    .filter((observation): observation is FredObservation => observation !== null);
}

async function fetchFredGraphSeries(seriesId: string): Promise<FredObservation[]> {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': FREDGRAPH_USER_AGENT },
  });
  if (!response.ok) return [];
  return parseFredGraphCsv(await response.text());
}

function latestFredObservation(observations: FredObservation[]): FredObservation | null {
  if (observations.length === 0) return null;
  return [...observations].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? null;
}

function averageValueForYear(observations: FredObservation[], year: number): number | null {
  const values = observations
    .filter(observation => observation.date.startsWith(`${year}-`))
    .map(observation => observation.value);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildMarkdown(data: GovernmentSpendingMetricComparisonData): string {
  const lines: string[] = [];

  lines.push('# Government Spending Metric Comparison');
  lines.push('');
  lines.push(`Window: ${data.window.startYear}-${data.window.endYear}, jurisdictions: ${data.analysisJurisdictions}`);
  lines.push('');
  lines.push('## Internationally Comparable Metrics');
  lines.push('');
  lines.push('| Metric | Source | US Latest | Analysis Coverage | Global Coverage |');
  lines.push('|--------|--------|-----------|------------------|-----------------|');

  for (const metric of data.worldBankMetrics) {
    const usLatest = metric.usLatest
      ? `${metric.usLatest.year}: ${formatValue(metric.usLatest.value, metric.usLatest.unit)}`
      : 'N/A';
    const panelCoverage = `${metric.panelCoverage.observations} obs / ${metric.panelCoverage.jurisdictions} jurisdictions`;
    const globalCoverage = `${metric.globalCoverage.observations} obs / ${metric.globalCoverage.jurisdictions} jurisdictions`;
    lines.push(`| ${metric.label} | ${metric.source} | ${usLatest} | ${panelCoverage} | ${globalCoverage} |`);
  }

  lines.push('');
  lines.push('## US-Only Context Metrics (Not Cross-Country Comparable Defaults)');
  lines.push('');
  lines.push('| Metric | Source | Latest | Latest Calendar-Year Average |');
  lines.push('|--------|--------|--------|------------------------------|');
  for (const metric of data.usContextMetrics) {
    const latest = metric.latest
      ? `${metric.latest.date}: ${formatValue(metric.latest.value, metric.latest.unit)}`
      : 'N/A';
    const annual = metric.latestCalendarYearAverage
      ? `${metric.latestCalendarYearAverage.year}: ${formatValue(metric.latestCalendarYearAverage.value, metric.latestCalendarYearAverage.unit)}`
      : 'N/A';
    lines.push(`| ${metric.label} | ${metric.source} | ${latest} | ${annual} |`);
  }

  lines.push('');
  lines.push('## Recommendation');
  lines.push('');
  lines.push(`Primary default for international comparison: \`${data.recommendation.primaryInternationalMetricId}\``);
  lines.push('');
  for (const rationale of data.recommendation.rationale) {
    lines.push(`- ${rationale}`);
  }
  lines.push('');
  lines.push('Caveats:');
  for (const caveat of data.recommendation.caveats) {
    lines.push(`- ${caveat}`);
  }
  lines.push('');

  return lines.join('\n');
}

export async function generateGovernmentSpendingMetricComparisonArtifacts(
  options: MetricComparisonOptions = {},
): Promise<MetricComparisonArtifacts> {
  const {
    outputDir = OUTPUT_DIR,
    writeFiles = true,
    logSummary = true,
    startYear = DEFAULT_START_YEAR,
    endYear = DEFAULT_END_YEAR,
    jurisdictions = DEFAULT_JURISDICTIONS,
  } = options;

  const window: YearWindow = { startYear, endYear };
  const fetchOptions = { jurisdictions, period: window };
  const globalFetchOptions = { period: window };

  const [govExpensePanel, govExpenseGlobal, govConsumptionPanel, govConsumptionGlobal, gdpPerCapitaPanel, gdpPerCapitaGlobal] = await Promise.all([
    fetchers.fetchGovExpenditure(fetchOptions),
    fetchers.fetchGovExpenditure(globalFetchOptions),
    fetchers.fetchWorldBankIndicator('NE.CON.GOVT.ZS', fetchOptions),
    fetchers.fetchWorldBankIndicator('NE.CON.GOVT.ZS', globalFetchOptions),
    fetchers.fetchGdpPerCapita(fetchOptions),
    fetchers.fetchGdpPerCapita(globalFetchOptions),
  ]);

  const govExpensePerCapitaPanel = computeDerivedGovSpendingPerCapitaPpp(govExpensePanel, gdpPerCapitaPanel);
  const govExpensePerCapitaGlobal = computeDerivedGovSpendingPerCapitaPpp(govExpenseGlobal, gdpPerCapitaGlobal);

  const worldBankMetrics: WorldBankMetricSnapshot[] = [
    {
      id: 'wb.gc_xpn_totl_gd_zs',
      label: 'General Government Expense (% GDP)',
      scope: 'international_comparable',
      source: 'World Bank WDI GC.XPN.TOTL.GD.ZS',
      definition: 'Consolidated general government expense as a share of GDP.',
      indicatorCode: 'GC.XPN.TOTL.GD.ZS',
      panelCoverage: summarizeCoverage(govExpensePanel),
      globalCoverage: summarizeCoverage(govExpenseGlobal),
      usLatest: latestUsValue(govExpensePanel, '% GDP'),
    },
    {
      id: 'wb.ne_con_govt_zs',
      label: 'General Government Final Consumption (% GDP)',
      scope: 'international_comparable',
      source: 'World Bank WDI NE.CON.GOVT.ZS',
      definition: 'Government final consumption only (narrower than total expense).',
      indicatorCode: 'NE.CON.GOVT.ZS',
      panelCoverage: summarizeCoverage(govConsumptionPanel),
      globalCoverage: summarizeCoverage(govConsumptionGlobal),
      usLatest: latestUsValue(govConsumptionPanel, '% GDP'),
    },
    {
      id: 'derived.gov_expenditure_per_capita_ppp',
      label: 'Government Expense Per Capita (PPP)',
      scope: 'international_comparable',
      source: 'Derived from GC.XPN.TOTL.GD.ZS and NY.GDP.PCAP.PP.CD',
      definition: 'Absolute spending scale per person at PPP prices.',
      indicatorCode: '(GC.XPN.TOTL.GD.ZS/100)*NY.GDP.PCAP.PP.CD',
      panelCoverage: summarizeCoverage(govExpensePerCapitaPanel),
      globalCoverage: summarizeCoverage(govExpensePerCapitaGlobal),
      usLatest: latestUsValue(govExpensePerCapitaPanel, 'international $/person'),
    },
  ];

  const [federalNetOutlays, federalCurrentExp, stateLocalCurrentExp, nominalGdp, govConsumptionInvestment] = await Promise.all([
    fetchFredGraphSeries('FYONGDA188S'),
    fetchFredGraphSeries('FGEXPND'),
    fetchFredGraphSeries('SLEXPND'),
    fetchFredGraphSeries('GDP'),
    fetchFredGraphSeries('GCE'),
  ]);

  const ratioSeries = federalCurrentExp
    .map(fed => {
      const stateLocal = stateLocalCurrentExp.find(row => row.date === fed.date);
      const gdp = nominalGdp.find(row => row.date === fed.date);
      if (!stateLocal || !gdp || gdp.value === 0) return null;
      return { date: fed.date, value: ((fed.value + stateLocal.value) / gdp.value) * 100 };
    })
    .filter((row): row is FredObservation => row !== null);

  const gceRatioSeries = govConsumptionInvestment
    .map(gce => {
      const gdp = nominalGdp.find(row => row.date === gce.date);
      if (!gdp || gdp.value === 0) return null;
      return { date: gce.date, value: (gce.value / gdp.value) * 100 };
    })
    .filter((row): row is FredObservation => row !== null);

  const usContextMetrics: UsContextMetricSnapshot[] = [
    {
      id: 'fred.fyongda188s',
      label: 'Federal Net Outlays (% GDP)',
      scope: 'us_context_only',
      source: 'FRED FYONGDA188S',
      definition: 'Federal-only net outlays share of GDP (excludes state and local).',
      latest: (() => {
        const latest = latestFredObservation(federalNetOutlays);
        return latest ? { ...latest, unit: '% GDP' } : null;
      })(),
      latestCalendarYearAverage: (() => {
        const latest = latestFredObservation(federalNetOutlays);
        if (!latest) return null;
        const year = Number(latest.date.slice(0, 4));
        const annual = averageValueForYear(federalNetOutlays, year);
        return annual == null ? null : { year, value: annual, unit: '% GDP' };
      })(),
      notes: ['US-only federal scope; not an international general-government metric.'],
    },
    {
      id: 'derived.fred.current_exp_fed_plus_state_local_pct_gdp',
      label: 'Federal + State/Local Current Expenditures (% GDP, derived)',
      scope: 'us_context_only',
      source: 'FRED FGEXPND + SLEXPND over GDP',
      definition: 'Non-consolidated current expenditure flow ratio for US fiscal context.',
      latest: (() => {
        const latest = latestFredObservation(ratioSeries);
        return latest ? { ...latest, unit: '% GDP' } : null;
      })(),
      latestCalendarYearAverage: (() => {
        const latest = latestFredObservation(ratioSeries);
        if (!latest) return null;
        const year = Number(latest.date.slice(0, 4));
        const annual = averageValueForYear(ratioSeries, year);
        return annual == null ? null : { year, value: annual, unit: '% GDP' };
      })(),
      notes: ['US-only and not cross-country harmonized; useful as domestic context only.'],
    },
    {
      id: 'derived.fred.gce_pct_gdp',
      label: 'Government Consumption + Investment (% GDP, derived)',
      scope: 'us_context_only',
      source: 'FRED GCE over GDP',
      definition: 'Government purchases/investment share (excludes transfers).',
      latest: (() => {
        const latest = latestFredObservation(gceRatioSeries);
        return latest ? { ...latest, unit: '% GDP' } : null;
      })(),
      latestCalendarYearAverage: (() => {
        const latest = latestFredObservation(gceRatioSeries);
        if (!latest) return null;
        const year = Number(latest.date.slice(0, 4));
        const annual = averageValueForYear(gceRatioSeries, year);
        return annual == null ? null : { year, value: annual, unit: '% GDP' };
      })(),
      notes: ['International analog exists, but it measures a narrower concept than total government expense.'],
    },
  ];

  const data: GovernmentSpendingMetricComparisonData = {
    generatedAt: new Date().toISOString(),
    window,
    analysisJurisdictions: jurisdictions.length,
    worldBankMetrics,
    usContextMetrics,
    recommendation: {
      primaryInternationalMetricId: 'wb.gc_xpn_totl_gd_zs',
      companionMetrics: ['derived.gov_expenditure_per_capita_ppp'],
      rationale: [
        'GC.XPN.TOTL.GD.ZS is the broadest internationally harmonized spending-size series in the current pipeline.',
        'It is already available for the full analysis panel and aligns with the current cross-country optimizer input.',
        'Per-capita PPP companion metrics help separate real spending scale from GDP-ratio denominator effects.',
      ],
      caveats: [
        'Different accounting frameworks can still reduce comparability across countries.',
        'Expense % GDP reflects both numerator policy changes and denominator (GDP) fluctuations.',
        'US-only flow measures (federal outlays, federal+state/local current expenditures) are useful context but not panel-compatible defaults.',
      ],
    },
  };

  const markdown = buildMarkdown(data);
  const outputPaths = {
    markdown: path.join(outputDir, 'government-spending-metric-comparison.md'),
    json: path.join(outputDir, 'government-spending-metric-comparison.json'),
  };

  if (writeFiles) {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPaths.markdown, markdown, 'utf-8');
    fs.writeFileSync(outputPaths.json, JSON.stringify(data, null, 2), 'utf-8');
  }

  if (logSummary) {
    const primary = data.worldBankMetrics.find(metric => metric.id === data.recommendation.primaryInternationalMetricId);
    if (primary?.usLatest) {
      console.log(
        `Primary international metric: ${primary.label} (${primary.source}), US latest ${primary.usLatest.year}=${formatValue(primary.usLatest.value, primary.usLatest.unit)}`,
      );
    } else {
      console.log(`Primary international metric: ${primary?.label ?? 'N/A'}`);
    }
    console.log(`Artifacts written to ${outputPaths.markdown} and ${outputPaths.json}`);
  }

  return {
    markdown,
    json: data,
    outputPaths,
  };
}

async function main(): Promise<void> {
  await generateGovernmentSpendingMetricComparisonArtifacts();
}

main().catch(error => {
  console.error('Failed to generate government spending metric comparison:', error);
  process.exitCode = 1;
});
