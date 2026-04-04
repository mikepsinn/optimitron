/**
 * Generate unified cross-country panel dataset.
 *
 * Fetches from World Bank, IMF, WHO, and the median income generated series,
 * merges into a single country-year panel, and writes to src/generated/country-panel.ts.
 *
 * Usage: pnpm --filter @optimitron/data run generate:country-panel
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { DataPoint } from '../src/types.ts';
import type { CountryPanelRow, CountryPanelMetadata } from '../src/datasets/country-panel.ts';
import { fetchIMFGovExpenditurePctGDP } from '../src/fetchers/imf.ts';
import {
  fetchGdpPerCapita,
  fetchHealthExpenditure,
  fetchGovHealthExpenditure,
  fetchEducationExpenditure,
  fetchMilitaryExpenditure,
  fetchRDExpenditure,
  fetchLifeExpectancy,
  fetchInfantMortality,
  fetchGiniIndex,
  fetchPovertyRate,
  fetchPopulation,
} from '../src/fetchers/world-bank.ts';
import { fetchWHOHealthyLifeExpectancy } from '../src/fetchers/who.ts';
import { fetchPIPIncomeSeries } from '../src/fetchers/world-bank-pip.ts';
import {
  GENERATED_MEDIAN_INCOME_SERIES,
} from '../src/generated/median-income-series.ts';
import { rankMedianIncomeRecord } from '../src/datasets/median-income-series.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const START_YEAR = 2000;
const END_YEAR = new Date().getUTCFullYear();
const PERIOD = { startYear: START_YEAR, endYear: END_YEAR };

/** Build a lookup key */
function key(iso3: string, year: number): string {
  return `${iso3}:${year}`;
}

/** Build a Map from DataPoint[] keyed by iso3:year */
function buildLookup(points: DataPoint[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of points) {
    if (p.value != null && Number.isFinite(p.value)) {
      map.set(key(p.jurisdictionIso3, p.year), p.value);
    }
  }
  return map;
}

/** Build a Map from PIP records keyed by iso3:year (latest per key wins) */
function buildPipLookup(
  records: { countryCode: string; year: number; medianAnnual: number; countryName: string }[],
): Map<string, { value: number; name: string }> {
  const map = new Map<string, { value: number; name: string }>();
  for (const r of records) {
    if (r.medianAnnual > 0) {
      map.set(key(r.countryCode, r.year), { value: r.medianAnnual, name: r.countryName });
    }
  }
  return map;
}

/** Equivalised → per capita ratio (same table as government-report-cards.ts) */
const EQUIV_RATIO: Record<string, number> = {
  USA: 0.68, GBR: 0.70, DEU: 0.73, FRA: 0.71, JPN: 0.70, AUS: 0.68,
  CAN: 0.69, KOR: 0.70, ISR: 0.65, TUR: 0.64, RUS: 0.68, CHN: 0.67,
  IND: 0.64, ITA: 0.70, ESP: 0.69, NLD: 0.71, SWE: 0.73, NOR: 0.71,
  CHE: 0.71, POL: 0.68, BEL: 0.70, AUT: 0.71, CZE: 0.70,
};
const DEFAULT_RATIO = 0.69;

/** Get best after-tax median income for a country-year from generated series */
function getBestAfterTaxIncome(
  iso3: string,
  year: number,
): { value: number; source: string; isAfterTax: boolean } | null {
  const candidates = GENERATED_MEDIAN_INCOME_SERIES.filter(
    (r) =>
      r.jurisdictionIso3 === iso3 &&
      r.year === year &&
      r.purchasingPower === 'ppp',
  );
  if (candidates.length === 0) return null;

  const best = candidates.sort(
    (a, b) => rankMedianIncomeRecord(b) - rankMedianIncomeRecord(a),
  )[0]!;

  const isEquivalised = best.unit?.includes('equivalised') ?? false;
  const ratio = isEquivalised ? (EQUIV_RATIO[iso3] ?? DEFAULT_RATIO) : 1;

  return {
    value: best.value * ratio,
    source: best.source,
    isAfterTax: best.isAfterTax,
  };
}

function derivePerCapita(
  pctGdp: number | undefined,
  gdpPerCap: number | undefined,
): number | null {
  if (pctGdp == null || gdpPerCap == null) return null;
  return Math.round((pctGdp / 100) * gdpPerCap);
}

async function main(): Promise<void> {
  console.log('Fetching World Bank indicators in parallel...');
  const [
    gdpPoints,
    healthPctPoints,
    eduPctPoints,
    milPctPoints,
    rdPctPoints,
    lifeExpPoints,
    infantMortPoints,
    giniPoints,
    povertyPoints,
    popPoints,
  ] = await Promise.all([
    fetchGdpPerCapita({ period: PERIOD }),
    fetchHealthExpenditure({ period: PERIOD }),
    fetchEducationExpenditure({ period: PERIOD }),
    fetchMilitaryExpenditure({ period: PERIOD }),
    fetchRDExpenditure({ period: PERIOD }),
    fetchLifeExpectancy({ period: PERIOD }),
    fetchInfantMortality({ period: PERIOD }),
    fetchGiniIndex({ period: PERIOD }),
    fetchPovertyRate({ period: PERIOD }),
    fetchPopulation({ period: PERIOD }),
  ]);
  console.log(`  WB GDP: ${gdpPoints.length}, Health: ${healthPctPoints.length}, Edu: ${eduPctPoints.length}`);
  console.log(`  WB Military: ${milPctPoints.length}, R&D: ${rdPctPoints.length}, LifeExp: ${lifeExpPoints.length}`);
  console.log(`  WB InfMort: ${infantMortPoints.length}, Gini: ${giniPoints.length}, Poverty: ${povertyPoints.length}, Pop: ${popPoints.length}`);

  console.log('Fetching IMF total government expenditure...');
  const imfGovExpPoints = await fetchIMFGovExpenditurePctGDP({ period: PERIOD });
  console.log(`  IMF gov exp: ${imfGovExpPoints.length} points`);

  console.log('Fetching WHO HALE...');
  const halePoints = await fetchWHOHealthyLifeExpectancy({ period: PERIOD });
  console.log(`  WHO HALE: ${halePoints.length} points`);

  console.log('Fetching PIP median income...');
  const pipIncome = await fetchPIPIncomeSeries({
    welfareType: 'income',
    period: PERIOD,
    pppVersion: 2021,
  });
  const pipConsumption = await fetchPIPIncomeSeries({
    welfareType: 'consumption',
    period: PERIOD,
    pppVersion: 2021,
  });
  const allPip = [...pipIncome, ...pipConsumption];
  console.log(`  PIP: ${allPip.length} records`);

  // Build lookups
  const gdpMap = buildLookup(gdpPoints);
  const healthMap = buildLookup(healthPctPoints);
  const eduMap = buildLookup(eduPctPoints);
  const milMap = buildLookup(milPctPoints);
  const rdMap = buildLookup(rdPctPoints);
  const lifeExpMap = buildLookup(lifeExpPoints);
  const infantMortMap = buildLookup(infantMortPoints);
  const giniMap = buildLookup(giniPoints);
  const povertyMap = buildLookup(povertyPoints);
  const popMap = buildLookup(popPoints);
  const imfGovExpMap = buildLookup(imfGovExpPoints);
  const haleMap = buildLookup(halePoints);
  const pipMap = buildPipLookup(allPip);

  // Collect all country-year keys that have at least GDP data
  const allKeys = new Set<string>();
  for (const p of gdpPoints) {
    if (p.year >= START_YEAR && p.year <= END_YEAR) {
      allKeys.add(key(p.jurisdictionIso3, p.year));
    }
  }

  // Also add keys from IMF (covers countries WB might miss)
  for (const p of imfGovExpPoints) {
    if (p.year >= START_YEAR && p.year <= END_YEAR) {
      allKeys.add(key(p.jurisdictionIso3, p.year));
    }
  }

  console.log(`Building panel from ${allKeys.size} country-year observations...`);

  // Country name lookup from PIP (most comprehensive)
  const nameMap = new Map<string, string>();
  for (const r of allPip) {
    if (!nameMap.has(r.countryCode)) {
      nameMap.set(r.countryCode, r.countryName);
    }
  }
  // Supplement from WB
  for (const p of gdpPoints) {
    if (!nameMap.has(p.jurisdictionIso3) && p.unit) {
      // WB doesn't put name in DataPoint, but ISO3 is enough
    }
  }

  const rows: CountryPanelRow[] = [];

  for (const k of allKeys) {
    const [iso3, yearStr] = k.split(':') as [string, string];
    const year = Number(yearStr);

    const gdp = gdpMap.get(k) ?? null;
    const totalGovPct = imfGovExpMap.get(k) ?? null;
    const healthPct = healthMap.get(k) ?? null;
    const eduPct = eduMap.get(k) ?? null;
    const milPct = milMap.get(k) ?? null;
    const rdPct = rdMap.get(k) ?? null;

    const pip = pipMap.get(k);
    const afterTax = getBestAfterTaxIncome(iso3, year);

    rows.push({
      jurisdictionIso3: iso3,
      jurisdictionName: nameMap.get(iso3) ?? iso3,
      year,

      afterTaxMedianIncomePerCapitaPpp: afterTax ? Math.round(afterTax.value) : null,
      afterTaxMedianIncomeSource: afterTax?.source ?? null,
      afterTaxMedianIncomeIsAfterTax: afterTax?.isAfterTax ?? false,
      medianIncomePerCapitaPpp: pip ? Math.round(pip.value) : null,
      gdpPerCapitaPpp: gdp != null ? Math.round(gdp) : null,

      haleYears: haleMap.get(k) ?? null,
      lifeExpectancyYears: lifeExpMap.get(k) != null ? Math.round(lifeExpMap.get(k)! * 10) / 10 : null,
      infantMortalityPer1000: infantMortMap.get(k) != null ? Math.round(infantMortMap.get(k)! * 10) / 10 : null,

      totalGovSpendingPctGdp: totalGovPct != null ? Math.round(totalGovPct * 10) / 10 : null,
      healthSpendingPctGdp: healthPct != null ? Math.round(healthPct * 10) / 10 : null,
      educationSpendingPctGdp: eduPct != null ? Math.round(eduPct * 10) / 10 : null,
      militarySpendingPctGdp: milPct != null ? Math.round(milPct * 100) / 100 : null,
      rdSpendingPctGdp: rdPct != null ? Math.round(rdPct * 100) / 100 : null,

      totalGovSpendingPerCapitaPpp: derivePerCapita(totalGovPct ?? undefined, gdp ?? undefined),
      healthSpendingPerCapitaPpp: derivePerCapita(healthPct ?? undefined, gdp ?? undefined),
      educationSpendingPerCapitaPpp: derivePerCapita(eduPct ?? undefined, gdp ?? undefined),
      militarySpendingPerCapitaPpp: derivePerCapita(milPct ?? undefined, gdp ?? undefined),
      rdSpendingPerCapitaPpp: derivePerCapita(rdPct ?? undefined, gdp ?? undefined),

      giniIndex: giniMap.get(k) != null ? Math.round(giniMap.get(k)! * 10) / 10 : null,
      povertyRate: povertyMap.get(k) != null ? Math.round(povertyMap.get(k)! * 100) / 100 : null,

      population: popMap.get(k) != null ? Math.round(popMap.get(k)!) : null,
    });
  }

  // Sort by country then year
  rows.sort((a, b) => {
    if (a.jurisdictionIso3 !== b.jurisdictionIso3) {
      return a.jurisdictionIso3.localeCompare(b.jurisdictionIso3);
    }
    return a.year - b.year;
  });

  const countries = new Set(rows.map((r) => r.jurisdictionIso3));
  const years = rows.map((r) => r.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const metadata: CountryPanelMetadata = {
    generatedAt: new Date().toISOString(),
    rowCount: rows.length,
    countryCount: countries.size,
    yearRange: [minYear, maxYear],
    sources: [
      'World Bank WDI',
      'IMF Fiscal Monitor',
      'WHO Global Health Observatory',
      'World Bank PIP',
      'OECD IDD',
      'Eurostat EU-SILC',
    ],
  };

  // Write as TypeScript module using String.raw + JSON.parse to avoid tsc TS2590
  const rowsJson = JSON.stringify(rows)
    .replaceAll('`', '\\`')
    .replaceAll('${', '\\${');
  const metadataJson = JSON.stringify(metadata, null, 2);

  const moduleSource = `/**
 * Generated by scripts/generate-country-panel.ts — DO NOT EDIT
 * Generated: ${metadata.generatedAt}
 * ${metadata.rowCount} rows, ${metadata.countryCount} countries, ${minYear}–${maxYear}
 */

import type { CountryPanelRow, CountryPanelMetadata } from '../datasets/country-panel';
import { setCountryPanel } from '../datasets/country-panel';

export const COUNTRY_PANEL_METADATA: CountryPanelMetadata = ${metadataJson};

const COUNTRY_PANEL_JSON = String.raw\`${rowsJson}\`;

export const COUNTRY_PANEL_DATA = JSON.parse(
  COUNTRY_PANEL_JSON,
) as CountryPanelRow[];

// Auto-initialize the panel
setCountryPanel(COUNTRY_PANEL_DATA, COUNTRY_PANEL_METADATA);
`;

  const outputDir = path.resolve(__dirname, '../src/generated');
  const outputPath = path.join(outputDir, 'country-panel.ts');
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, moduleSource, 'utf8');

  console.log(`\nWrote ${rows.length} rows (${countries.size} countries, ${minYear}–${maxYear}) to ${outputPath}`);

  // Summary stats
  const withIncome = rows.filter((r) => r.afterTaxMedianIncomePerCapitaPpp != null);
  const withHale = rows.filter((r) => r.haleYears != null);
  const withGovExp = rows.filter((r) => r.totalGovSpendingPctGdp != null);
  console.log(`  After-tax income: ${new Set(withIncome.map(r => r.jurisdictionIso3)).size} countries`);
  console.log(`  HALE: ${new Set(withHale.map(r => r.jurisdictionIso3)).size} countries`);
  console.log(`  Gov spending: ${new Set(withGovExp.map(r => r.jurisdictionIso3)).size} countries`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
