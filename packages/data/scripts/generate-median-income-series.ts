import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildDerivedAfterGovMedianIncomeSeries,
  buildEurostatMedianIncomeSeries,
  buildOecdMedianIncomeSeries,
  buildPipMedianIncomeSeries,
  renderGeneratedMedianIncomeModule,
} from '../src/datasets/median-income-series-build.ts';
import type { MedianIncomeSource } from '../src/datasets/median-income-types.ts';
import { fetchEurostatMedianDisposableIncomeSeries } from '../src/fetchers/eurostat-income.ts';
import {
  fetchOECDIDDPoints,
  OECD_IDD_SELECTORS,
  deriveOecdRealMedianDisposableIncome,
} from '../src/fetchers/oecd-income-distribution.ts';
import { fetchIMFGovExpenditurePctGDP } from '../src/fetchers/imf.ts';
import { fetchPIPIncomeSeries } from '../src/fetchers/world-bank-pip.ts';
import { fetchPrivateConsumptionPpp } from '../src/fetchers/world-bank.ts';
import type { WBMeta, WBRecord } from '../src/fetchers/world-bank.ts';
import type { OecdIddResponse } from '../src/fetchers/oecd-income-distribution.ts';
import { extractOecdIddPoints } from '../src/fetchers/oecd-income-distribution.ts';
import {
  deriveEurostatRealMedianDisposableIncome,
  extractEurostatHicpPoints,
  extractEurostatMedianIncomeLocalCurrencyPoints,
} from '../src/fetchers/eurostat-income.ts';
import type { EurostatJsonStatResponse } from '../src/fetchers/eurostat-income.ts';
import { GENERATED_MEDIAN_INCOME_SERIES, MEDIAN_INCOME_SERIES_METADATA } from '../src/generated/median-income-series.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  { retries = 3, delayMs = 2000, label = '' } = {},
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;
      console.warn(
        `${label} attempt ${attempt} failed, retrying in ${delayMs * attempt}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw new Error('unreachable');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  if (process.argv.includes('--survey-snapshot')) {
    await regenerateSurveySnapshot();
    return;
  }
  const currentYear = new Date().getUTCFullYear();
  const pipPeriod = { startYear: 1981, endYear: currentYear };

  // 1. Fetch PIP income series
  console.log('Fetching PIP income series...');
  const pipIncomeRecords = await fetchPIPIncomeSeries({
    welfareType: 'income',
    period: pipPeriod,
    pppVersion: 2021,
  });
  console.log(`  PIP income: ${pipIncomeRecords.length} records`);

  // 2. Fetch PIP consumption series (India, Pakistan, Ethiopia, Iran, etc.)
  console.log('Fetching PIP consumption series...');
  const pipConsumptionRecords = await fetchPIPIncomeSeries({
    welfareType: 'consumption',
    period: pipPeriod,
    pppVersion: 2021,
  });
  console.log(`  PIP consumption: ${pipConsumptionRecords.length} records`);

  // 3. Fetch IMF total government expenditure (% of GDP, all levels incl. state/local)
  console.log('Fetching IMF total government expenditure % GDP...');
  const govExpPoints = await fetchIMFGovExpenditurePctGDP({
    period: { startYear: 2000, endYear: currentYear },
  });
  console.log(`  IMF gov expenditure: ${govExpPoints.length} points`);

  // 4. Fetch Eurostat series
  console.log('Fetching Eurostat EU-SILC series...');
  const eurostatRecords = await fetchEurostatMedianDisposableIncomeSeries({
    period: { startYear: 1995, endYear: currentYear },
  });
  console.log(`  Eurostat: ${eurostatRecords.length} records`);

  // 5. Fetch World Bank PPP conversion factors (fallback for OECD IDD derivation)
  console.log('Fetching World Bank PPP conversion factors...');
  const wbPppPoints = await fetchPrivateConsumptionPpp({
    period: { startYear: 1995, endYear: currentYear },
  });
  console.log(`  WB PPP factors: ${wbPppPoints.length} points`);

  // 6. Fetch OECD IDD (after-tax for OECD countries)
  console.log('Fetching OECD IDD median disposable income...');
  const oecdPeriod = { startYear: 1995, endYear: currentYear };

  const oecdMedianPoints = await fetchWithRetry(
    () =>
      fetchOECDIDDPoints(OECD_IDD_SELECTORS.MEDIAN_DISPOSABLE_INCOME_TOTAL, {
        period: oecdPeriod,
      }),
    { label: 'OECD IDD median' },
  );
  console.log(`  OECD IDD median: ${oecdMedianPoints.length} points`);

  await sleep(2000);

  const oecdCpiPoints = await fetchWithRetry(
    () =>
      fetchOECDIDDPoints(OECD_IDD_SELECTORS.CPI_TOTAL, {
        period: oecdPeriod,
      }),
    { label: 'OECD IDD CPI' },
  );
  console.log(`  OECD IDD CPI: ${oecdCpiPoints.length} points`);

  await sleep(2000);

  const oecdPppPoints = await fetchWithRetry(
    () =>
      fetchOECDIDDPoints(OECD_IDD_SELECTORS.PPP_PRIVATE_CONSUMPTION_TOTAL, {
        period: oecdPeriod,
      }),
    { label: 'OECD IDD PPP' },
  );
  console.log(`  OECD IDD PPP: ${oecdPppPoints.length} points`);

  // 6. Derive OECD real median disposable income
  const oecdDerived = deriveOecdRealMedianDisposableIncome(
    oecdMedianPoints,
    oecdCpiPoints,
    oecdPppPoints,
    wbPppPoints,
  );
  if (oecdDerived.filter(point => point.realMedianPppUsd !== null).length < 400) {
    throw new Error('Incomplete OECD income/price response; existing snapshot was not replaced.');
  }
  console.log(`  OECD IDD derived: ${oecdDerived.length} records`);

  // 7. Build all series and merge
  const allPipRecords = [...pipIncomeRecords, ...pipConsumptionRecords];
  const derivedAfterGov = buildDerivedAfterGovMedianIncomeSeries(allPipRecords, govExpPoints);
  console.log(`  Derived after-gov: ${derivedAfterGov.length} records`);

  const generatedRecords = [
    ...buildPipMedianIncomeSeries(pipIncomeRecords),
    ...buildPipMedianIncomeSeries(pipConsumptionRecords),
    ...derivedAfterGov,
    ...buildEurostatMedianIncomeSeries(eurostatRecords),
    ...buildOecdMedianIncomeSeries(oecdDerived),
  ];

  const metadata = {
    generatedAt: new Date().toISOString(),
    recordCount: generatedRecords.length,
    sources: [
      'OECD IDD',
      'Eurostat EU-SILC',
      'World Bank PIP',
      'World Bank PIP + IMF Gov Exp (derived)',
    ] as MedianIncomeSource[],
    caveats: [
      'OECD IDD records provide survey-based after-tax median disposable income and are the preferred source when available.',
      'Eurostat EU-SILC records provide strict after-tax median equivalised disposable income for EU countries.',
      'Derived after-gov records approximate after-tax income as: PIP median × (1 - gov spending % GDP). Uses IMF Fiscal Monitor total government expenditure (includes central + state + local + social security).',
      'PIP income/consumption records are raw fallback. PIP median income is not guaranteed to be after-tax.',
      'Real OECD and Eurostat income uses CPI(2021)/CPI(observation year), then 2021 private-consumption PPP. Exact-year conversion factors are required.',
      'OECD uses square-root household equivalence; Eurostat uses the modified OECD scale. The comparison panel uses OECD only.',
    ],
  };
  const moduleSource = renderGeneratedMedianIncomeModule(
    generatedRecords,
    metadata,
  );

  const outputDir = path.resolve(__dirname, '../src/generated');
  const outputPath = path.join(outputDir, 'median-income-series.ts');
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, moduleSource, 'utf8');

  const derivedCountries = new Set(derivedAfterGov.map((r) => r.jurisdictionIso3));
  console.log(
    `\nWrote ${generatedRecords.length} records to ${outputPath}`,
  );
  console.log(`  Derived after-gov covers ${derivedCountries.size} countries`);
}

/** Reproduce survey repairs without refreshing unrelated PIP/IMF observations. */
async function regenerateSurveySnapshot(): Promise<void> {
  const inputDir = path.resolve(__dirname, '../raw/median-income');
  const manifest = JSON.parse(await readFile(path.join(inputDir, 'manifest.json'), 'utf8')) as {
    retrievedAt: string; files: Record<string, { sha256: string }>;
  };
  async function load<T>(name: string): Promise<T> {
    const raw = await readFile(path.join(inputDir, name));
    if (createHash('sha256').update(raw).digest('hex') !== manifest.files[name]?.sha256) {
      throw new Error(`Source checksum mismatch: ${name}`);
    }
    return JSON.parse(raw.toString('utf8')) as T;
  }
  const median = extractOecdIddPoints(await load<OecdIddResponse>('oecd-raw-median-all-dimensions.json'), {
    ...OECD_IDD_SELECTORS.MEDIAN_DISPOSABLE_INCOME_TOTAL, refArea: undefined,
  });
  const cpi = extractOecdIddPoints(await load<OecdIddResponse>('oecd-raw-cpi-all-dimensions.json'), {
    ...OECD_IDD_SELECTORS.CPI_TOTAL, refArea: undefined,
  });
  const ppp = extractOecdIddPoints(await load<OecdIddResponse>('oecd-raw-ppp-all-dimensions.json'), {
    ...OECD_IDD_SELECTORS.PPP_PRIVATE_CONSUMPTION_TOTAL, refArea: undefined,
  });
  const oecd = deriveOecdRealMedianDisposableIncome(median, cpi, ppp);
  if (oecd.filter(row => row.realMedianPppUsd !== null).length < 400) {
    throw new Error('Incomplete OECD source snapshot; output unchanged.');
  }
  const [wbMeta, wbRows] = await load<[WBMeta, WBRecord[]]>('wb-eurostat-ppp.json');
  if (wbMeta.pages !== 1 || wbRows.length !== wbMeta.total) throw new Error('Incomplete World Bank PPP snapshot.');
  const eurostat = deriveEurostatRealMedianDisposableIncome(
    extractEurostatMedianIncomeLocalCurrencyPoints(await load<EurostatJsonStatResponse>('eurostat-median-nac.json')),
    extractEurostatHicpPoints(await load<EurostatJsonStatResponse>('eurostat-hicp.json')),
    wbRows.filter(row => row.value !== null).map(row => ({
      jurisdictionIso3: row.countryiso3code, year: Number(row.date), value: row.value!,
      source: 'World Bank WDI (PA.NUS.PRVT.PP)',
    })),
  );
  const records = [
    ...GENERATED_MEDIAN_INCOME_SERIES.filter(row => row.source !== 'OECD IDD' && row.source !== 'Eurostat EU-SILC'),
    ...buildEurostatMedianIncomeSeries(eurostat),
    ...buildOecdMedianIncomeSeries(oecd),
  ];
  const metadata = {
    ...MEDIAN_INCOME_SERIES_METADATA,
    generatedAt: `${manifest.retrievedAt}T00:00:00.000Z`,
    recordCount: records.length,
    caveats: [
      'OECD and Eurostat survey sources refreshed from raw/median-income/manifest.json; other source records retain their previous vintage.',
      'Real income = nominal local income times CPI(2021)/CPI(observation year), divided by 2021 private-consumption PPP. No nearest-year substitution.',
      'OECD IDD uses square-root household equivalence; Eurostat EU-SILC uses the modified OECD scale. Cross-country comparison panels use OECD only.',
      'PIP and inferred after-government records remain separate legacy series and are not eligible disposable-income outcomes for the comparison panels.',
    ],
  };
  await writeFile(path.resolve(__dirname, '../src/generated/median-income-series.ts'),
    renderGeneratedMedianIncomeModule(records, metadata), 'utf8');
  console.log(`Wrote ${records.length} records; OECD: ${median.length} observed medians, ${oecd.filter(row => row.realMedianPppUsd !== null).length} constant-2021 incomes.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
