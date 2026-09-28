/** Refresh the reproducible public-spending benchmark inputs. No fitted effects. */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractEurostatObservations } from '../src/fetchers/eurostat-income.js';
import { EUROSTAT_GEO_TO_ISO3 } from '../src/fetchers/eurostat-income-shared.js';
import type { EurostatJsonStatResponse } from '../src/fetchers/eurostat-income-shared.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cache = resolve(root, 'output/best-practice-budget/sources');
mkdirSync(cache, { recursive: true });
const sources: { url: string; sha256: string; retrievedAt: string }[] = [];
let lastRequestAt = 0;
async function get<T>(url: string): Promise<T> {
  const file = resolve(cache, `${createHash('sha256').update(url).digest('hex')}.json`);
  let entry: { retrievedAt: string; body: string };
  if (existsSync(file) && !process.argv.includes('--refresh')) {
    entry = JSON.parse(readFileSync(file, 'utf8'));
  } else {
    // Requests are sequential, with at least 300 ms between uncached calls.
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 300 - (Date.now() - lastRequestAt))));
    lastRequestAt = Date.now();
    const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error(`${response.status}: ${url}`);
    entry = { retrievedAt: new Date().toISOString(), body: await response.text() };
    writeFileSync(file, JSON.stringify(entry));
  }
  sources.push({ url, retrievedAt: entry.retrievedAt, sha256: createHash('sha256').update(entry.body).digest('hex') });
  return JSON.parse(entry.body) as T;
}
const eurostat = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/';
const period = 'sinceTimePeriod=2017&untilTimePeriod=2019';
const spending = await get<EurostatJsonStatResponse>(`${eurostat}gov_10a_exp?lang=en&unit=MIO_EUR&sector=S13&na_item=TE&${period}`);
const gdp = await get<EurostatJsonStatResponse>(`${eurostat}nama_10_gdp?lang=en&unit=CP_MEUR&na_item=B1GQ&${period}`);
// Eurostat renamed indic_il=MED_E to statinfo=MED_EI. Select the median explicitly.
const income = await get<EurostatJsonStatResponse>(`${eurostat}ilc_di03?lang=en&unit=PPS&age=TOTAL&sex=T&statinfo=MED_EI&time=2019`);
const education = await get<EurostatJsonStatResponse>(`${eurostat}educ_outc_pisa?lang=en&field=EF461&sex=T&time=2018`);
const healthUrl = new URL('https://ghoapi.azureedge.net/api/WHOSIS_000002');
healthUrl.searchParams.set('$filter', "TimeDim ge 2017 and TimeDim le 2019 and Dim1 eq 'SEX_BTSX'");
interface HealthRow { SpatialDim: string; TimeDim: number; Dim1: string; NumericValue: number; Low: number | null; High: number | null }
const health = await get<{ value: HealthRow[]; '@odata.nextLink'?: string }>(healthUrl.toString());
if (health['@odata.nextLink']) throw new Error('WHO response requires pagination.');
const years = [2017, 2018, 2019];
const validHale = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 120;
if (!Array.isArray(health.value)) throw new Error('Invalid WHO response.');
const haleMap = new Map(health.value.filter(r => r.Dim1 === 'SEX_BTSX' && /^[A-Z]{3}$/.test(r.SpatialDim) && years.includes(r.TimeDim) && validHale(r.NumericValue)).map(r => [`${r.SpatialDim}:${r.TimeDim}`, r]));
interface WbRow { countryiso3code: string; date: string; value: number | null; indicator: { value: string } }
type WbResponse = [{ pages: number }, WbRow[]];
async function wb(indicator: string, date = '2017:2019'): Promise<Map<string, number>> {
  const [meta, rows] = await get<WbResponse>(`https://api.worldbank.org/v2/country/all/indicator/${indicator}?date=${date}&format=json&per_page=20000`);
  if (meta.pages !== 1 || !Array.isArray(rows)) throw new Error(`Incomplete World Bank response: ${indicator}`);
  if (indicator === 'NY.GDP.PCAP.PP.KD' && !rows[0]?.indicator.value.includes('constant 2021')) throw new Error('PPP reference year changed; review conversion metadata.');
  return new Map(rows.filter(r => /^[A-Z0-9]{3}$/.test(r.countryiso3code) && /^\d{4}$/.test(r.date) && typeof r.value === 'number' && Number.isFinite(r.value) && r.value >= 0).map(r => [`${r.countryiso3code}:${r.date}`, r.value!]));
}
const realGdp = await wb('NY.GDP.PCAP.PP.KD');
const healthShare = await wb('SH.XPD.CHEX.GD.ZS');
const publicHealthShare = await wb('SH.XPD.GHED.CH.ZS');
const privateHealthShare = await wb('SH.XPD.PVTD.CH.ZS');
const externalHealthShare = await wb('SH.XPD.EHEX.CH.ZS');
const outOfPocketHealthShare = await wb('SH.XPD.OOPC.CH.ZS');
interface WbCountry { id: string; name: string; region: { id: string; value: string } }
const [countryMeta, countryRows] = await get<[{ pages: number }, WbCountry[]]>('https://api.worldbank.org/v2/country?format=json&per_page=400');
if (countryMeta.pages !== 1 || !Array.isArray(countryRows)) throw new Error('Incomplete World Bank country metadata.');
const countryMetadata = countryRows.filter(r => /^[A-Z]{3}$/.test(r.id) && typeof r.name === 'string' && r.region?.id && r.region.id !== 'NA' && r.region.value !== 'Aggregates');
const lastPopulationYear = new Date().getUTCFullYear() - 1;
const population = await wb('SP.POP.TOTL', `2000:${lastPopulationYear}`);
const populationCountries = countryMetadata.flatMap(({ id, name }) => {
  for (let year = lastPopulationYear; year >= 2000; year--) {
    const value = population.get(`${id}:${year}`);
    if (value !== undefined && value > 0 && Number.isSafeInteger(value)) return [{ id, name, population: value, year }];
  }
  return [];
}).sort((a, b) => a.name.localeCompare(b.name, 'en'));
const gdpMap = new Map(extractEurostatObservations(gdp).map(r => [`${r.dimensions.geo}:${r.dimensions.time}`, r.value]));
const spendingMap = new Map(extractEurostatObservations(spending).map(r => [`${r.dimensions.geo}:${r.dimensions.time}:${r.dimensions.cofog99}`, r.value]));
const incomeMap = new Map(extractEurostatObservations(income).filter(r => r.dimensions.statinfo === 'MED_EI').map(r => [r.dimensions.geo, r.value]));
const educationMap = new Map(extractEurostatObservations(education).map(r => [r.dimensions.geo, 100 - r.value]));
const categoryIds = Array.from({ length: 10 }, (_, i) => `GF${String(i + 1).padStart(2, '0')}`);
const categories = categoryIds.map(id => ({ id, name: spending.dimension?.cofog99?.category?.label?.[id] ?? id }));
const subcategories = Object.entries(spending.dimension?.cofog99?.category?.label ?? {})
  .filter(([id]) => /^GF\d{4}$/.test(id) && categoryIds.includes(id.slice(0, 4)))
  .map(([id, name]) => ({ id, name, parentId: id.slice(0, 4) }))
  .sort((a, b) => a.id.localeCompare(b.id));
if (subcategories.length !== 69) throw new Error(`COFOG group classification changed: ${subcategories.length} groups.`);
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
const completeMean = (values: (number | null)[]) => values.every((value): value is number => value !== null && Number.isFinite(value)) ? mean(values) : null;
const healthComponent = (share: number | undefined, total: number) => share !== undefined && share >= 0 && share <= 100 ? share / 100 * total : null;
const healthcareDataIssues: { countryId: string; year: number; issue: string }[] = [];
const healthcareCountries = countryMetadata.flatMap(({ id, name }) => {
  const observations = years.map(year => {
    const key = `${id}:${year}`;
    const real = realGdp.get(key);
    const share = healthShare.get(key);
    const outcome = haleMap.get(key);
    if (!real || !share || share > 100 || !outcome) return null;
    const totalPerCapita = share / 100 * real;
    let publicPerCapita = healthComponent(publicHealthShare.get(key), totalPerCapita);
    let privatePerCapita = healthComponent(privateHealthShare.get(key), totalPerCapita);
    let externalPerCapita = healthComponent(externalHealthShare.get(key), totalPerCapita);
    let outOfPocketPerCapita = healthComponent(outOfPocketHealthShare.get(key), totalPerCapita);
    // Financing-source shares partition current costs. OOP is already in private costs.
    if (publicPerCapita !== null && privatePerCapita !== null && externalPerCapita !== null && Math.abs(publicPerCapita + privatePerCapita + externalPerCapita - totalPerCapita) > Math.max(0.01, totalPerCapita * 0.00001)) {
      healthcareDataIssues.push({ countryId: id, year, issue: 'Published financing shares do not sum to total current health cost within 0.001%; financing split omitted.' });
      publicPerCapita = privatePerCapita = externalPerCapita = outOfPocketPerCapita = null;
    }
    if (outOfPocketPerCapita !== null && privatePerCapita !== null && outOfPocketPerCapita > privatePerCapita + 0.01) {
      healthcareDataIssues.push({ countryId: id, year, issue: 'Published out-of-pocket cost exceeds domestic private cost; out-of-pocket estimate omitted.' });
      outOfPocketPerCapita = null;
    }
    const haleLow = validHale(outcome.Low) && outcome.Low <= outcome.NumericValue ? outcome.Low : null;
    const haleHigh = validHale(outcome.High) && outcome.High >= outcome.NumericValue ? outcome.High : null;
    return { year, totalPerCapita, publicPerCapita, privatePerCapita, externalPerCapita, outOfPocketPerCapita, hale: outcome.NumericValue, haleLow, haleHigh };
  });
  if (!observations.every((row): row is NonNullable<typeof row> => row !== null)) return [];
  return [{
    id, name, observations,
    totalPerCapita: mean(observations.map(r => r.totalPerCapita)),
    publicPerCapita: completeMean(observations.map(r => r.publicPerCapita)),
    privatePerCapita: completeMean(observations.map(r => r.privatePerCapita)),
    externalPerCapita: completeMean(observations.map(r => r.externalPerCapita)),
    outOfPocketPerCapita: completeMean(observations.map(r => r.outOfPocketPerCapita)),
    hale: mean(observations.map(r => r.hale)),
    haleLow: completeMean(observations.map(r => r.haleLow)),
    haleHigh: completeMean(observations.map(r => r.haleHigh)),
  }];
}).sort((a, b) => a.name.localeCompare(b.name, 'en'));
if (healthcareCountries.length < 150) throw new Error(`Only ${healthcareCountries.length} healthcare countries; check sources.`);
if (populationCountries.length < 200) throw new Error(`Only ${populationCountries.length} population countries; check sources.`);
const excluded: { country: string; reason: string }[] = [];
const countries = Object.entries(spending.dimension?.geo?.category?.label ?? {}).flatMap(([geo, name]) => {
  const id = EUROSTAT_GEO_TO_ISO3[geo];
  if (!id) return [];
  const observations = years.map(year => {
    const denominator = gdpMap.get(`${geo}:${year}`);
    const real = realGdp.get(`${id}:${year}`);
    const healthOutcome = haleMap.get(`${id}:${year}`);
    const costs = Object.fromEntries(categoryIds.map(category => {
      const amount = spendingMap.get(`${geo}:${year}:${category}`);
      return [category, amount !== undefined && denominator && real ? amount / denominator * real : null];
    }));
    const subcategoryCosts = Object.fromEntries(subcategories.map(({ id: category }) => {
      const amount = spendingMap.get(`${geo}:${year}:${category}`);
      return [category, amount !== undefined && Number.isFinite(amount) && denominator && real ? amount / denominator * real : null];
    }));
    const total = spendingMap.get(`${geo}:${year}:TOTAL`);
    const totalPerCapita = total !== undefined && denominator && real ? total / denominator * real : null;
    const health = healthShare.get(`${id}:${year}`);
    return { year, costs, subcategoryCosts, totalPerCapita, hale: healthOutcome?.NumericValue ?? null, haleLow: healthOutcome?.Low ?? null, haleHigh: healthOutcome?.High ?? null, totalHealthPerCapita: health !== undefined && real ? health / 100 * real : null };
  });
  if (!incomeMap.has(geo) || observations.some(r => r.hale === null || r.totalPerCapita === null || Object.values(r.costs).some(c => c === null || c < 0))) {
    excluded.push({ country: name, reason: 'Missing 2019 median income or complete 2017–2019 spending/health observations.' });
    return [];
  }
  for (const r of observations) {
    const sum = Object.values(r.costs).reduce<number>((a, b) => a + (b ?? 0), 0);
    if (Math.abs(sum - r.totalPerCapita!) > Math.max(5, r.totalPerCapita! * 0.001)) throw new Error(`COFOG reconciliation failed: ${name} ${r.year}`);
    for (const category of categoryIds) {
      const childCosts = subcategories.filter(s => s.parentId === category).map(s => r.subcategoryCosts[s.id]);
      if (childCosts.every((cost): cost is number => cost !== null)) {
        const parent = r.costs[category]!;
        if (Math.abs(childCosts.reduce((a, b) => a + b, 0) - parent) > Math.max(5, parent * 0.001)) throw new Error(`COFOG subgroup reconciliation failed: ${name} ${r.year} ${category}`);
      }
    }
  }
  const mathProficiency = educationMap.get(geo);
  return [{
    id, name, observations,
    costs: Object.fromEntries(categoryIds.map(category => [category, mean(observations.map(r => r.costs[category]!))])),
    subcategoryCosts: Object.fromEntries(subcategories.map(({ id: category }) => [category, completeMean(observations.map(r => r.subcategoryCosts[category]!))])),
    totalPerCapita: mean(observations.map(r => r.totalPerCapita!)),
    totalHealthPerCapita: observations.every(r => r.totalHealthPerCapita !== null) ? mean(observations.map(r => r.totalHealthPerCapita!)) : null,
    outcomes: { hale: mean(observations.map(r => r.hale!)), income: incomeMap.get(geo)!, ...(mathProficiency !== undefined ? { mathProficiency } : {}) },
  }];
});
if (countries.length < 20) throw new Error(`Only ${countries.length} complete countries; check sources.`);
const snapshot = {
  generatedAt: sources.map(source => source.retrievedAt).sort().at(-1)!, period: years, priceYear: 2021,
  costUnit: '2021 international dollars (GDP purchasing power parity)',
  incomeUnit: '2019 PPS per equivalised person (Eurostat EU-SILC)',
  incomeYear: 2019, categories, subcategories, countries, healthcareCountries, healthcareDataIssues, populationCountries, excluded, sources,
  healthcareSource: {
    url: 'https://apps.who.int/nha/database/',
    note: 'WHO System of Health Accounts current health expenditure, republished by World Bank. Domestic government (including compulsory prepayments and social insurance), domestic private, and external funding partition total current cost. Out-of-pocket payments are included in private cost. Capital formation is excluded; these amounts are not interchangeable with COFOG total government health expenditure.',
    conversion: 'Each annual current-health share of GDP is multiplied by GDP per capita in constant 2021 international dollars; financing-source shares split that annual total before averaging 2017–2019. This uses economy-wide GDP PPP and inflation, not a health-specific price index.',
    uncertainty: 'HALE limits are arithmetic means of WHO annual lower and upper limits, not a new confidence interval for the three-year mean or for policy effects.',
    indicators: { totalShareOfGdp: 'SH.XPD.CHEX.GD.ZS', domesticPublicShareOfCurrent: 'SH.XPD.GHED.CH.ZS', domesticPrivateShareOfCurrent: 'SH.XPD.PVTD.CH.ZS', externalShareOfCurrent: 'SH.XPD.EHEX.CH.ZS', outOfPocketShareOfCurrent: 'SH.XPD.OOPC.CH.ZS' },
  },
  populationSource: { url: 'https://data.worldbank.org/indicator/SP.POP.TOTL', note: 'Latest available World Bank midyear population estimate through the last completed calendar year. Country/economy metadata excludes regional and income aggregates; population estimates may use demographic models.' },
  healthSource: { url: 'https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy', population: 'Both sexes (SEX_BTSX)', snapshotGeneratedAt: sources.find(s => s.url === healthUrl.toString())!.retrievedAt },
  educationSource: { url: 'https://ec.europa.eu/eurostat/databrowser/view/educ_outc_pisa/default/table?lang=en', note: '2018 share reaching at least PISA mathematics Level 2: 100 minus low-achiever percentage.' },
};
const output = resolve(root, 'src/generated/optimal-budget.json');
writeFileSync(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ countries: countries.length, excluded, output, outcomes: countries.map(c => ({ country: c.name, ...c.outcomes })) }, null, 2));
