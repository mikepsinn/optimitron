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
async function get<T>(url: string): Promise<T> {
  const file = resolve(cache, `${createHash('sha256').update(url).digest('hex')}.json`);
  let entry: { retrievedAt: string; body: string };
  if (existsSync(file) && !process.argv.includes('--refresh')) {
    entry = JSON.parse(readFileSync(file, 'utf8'));
  } else {
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
const haleMap = new Map(health.value.filter(r => r.Dim1 === 'SEX_BTSX').map(r => [`${r.SpatialDim}:${r.TimeDim}`, r]));
interface WbRow { countryiso3code: string; date: string; value: number | null; indicator: { value: string } }
type WbResponse = [{ pages: number }, WbRow[]];
async function wb(indicator: string): Promise<Map<string, number>> {
  const [meta, rows] = await get<WbResponse>(`https://api.worldbank.org/v2/country/all/indicator/${indicator}?date=2017:2019&format=json&per_page=20000`);
  if (meta.pages !== 1 || !Array.isArray(rows)) throw new Error(`Incomplete World Bank response: ${indicator}`);
  if (indicator === 'NY.GDP.PCAP.PP.KD' && !rows[0]?.indicator.value.includes('constant 2021')) throw new Error('PPP reference year changed; review conversion metadata.');
  return new Map(rows.filter(r => r.value !== null && Number.isFinite(r.value)).map(r => [`${r.countryiso3code}:${r.date}`, r.value!]));
}
const realGdp = await wb('NY.GDP.PCAP.PP.KD');
const healthShare = await wb('SH.XPD.CHEX.GD.ZS');
const gdpMap = new Map(extractEurostatObservations(gdp).map(r => [`${r.dimensions.geo}:${r.dimensions.time}`, r.value]));
const spendingMap = new Map(extractEurostatObservations(spending).map(r => [`${r.dimensions.geo}:${r.dimensions.time}:${r.dimensions.cofog99}`, r.value]));
const incomeMap = new Map(extractEurostatObservations(income).filter(r => r.dimensions.statinfo === 'MED_EI').map(r => [r.dimensions.geo, r.value]));
const educationMap = new Map(extractEurostatObservations(education).map(r => [r.dimensions.geo, 100 - r.value]));
const categoryIds = Array.from({ length: 10 }, (_, i) => `GF${String(i + 1).padStart(2, '0')}`);
const categories = categoryIds.map(id => ({ id, name: spending.dimension?.cofog99?.category?.label?.[id] ?? id }));
const years = [2017, 2018, 2019];
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
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
    const total = spendingMap.get(`${geo}:${year}:TOTAL`);
    const totalPerCapita = total !== undefined && denominator && real ? total / denominator * real : null;
    const health = healthShare.get(`${id}:${year}`);
    return { year, costs, totalPerCapita, hale: healthOutcome?.NumericValue ?? null, haleLow: healthOutcome?.Low ?? null, haleHigh: healthOutcome?.High ?? null, totalHealthPerCapita: health !== undefined && real ? health / 100 * real : null };
  });
  if (!incomeMap.has(geo) || observations.some(r => r.hale === null || r.totalPerCapita === null || Object.values(r.costs).some(c => c === null || c < 0))) {
    excluded.push({ country: name, reason: 'Missing 2019 median income or complete 2017–2019 spending/health observations.' });
    return [];
  }
  for (const r of observations) {
    const sum = Object.values(r.costs).reduce<number>((a, b) => a + (b ?? 0), 0);
    if (Math.abs(sum - r.totalPerCapita!) > Math.max(5, r.totalPerCapita! * 0.001)) throw new Error(`COFOG reconciliation failed: ${name} ${r.year}`);
  }
  const mathProficiency = educationMap.get(geo);
  return [{
    id, name, observations,
    costs: Object.fromEntries(categoryIds.map(category => [category, mean(observations.map(r => r.costs[category]!))])),
    totalPerCapita: mean(observations.map(r => r.totalPerCapita!)),
    totalHealthPerCapita: observations.every(r => r.totalHealthPerCapita !== null) ? mean(observations.map(r => r.totalHealthPerCapita!)) : null,
    outcomes: { hale: mean(observations.map(r => r.hale!)), income: incomeMap.get(geo)!, ...(mathProficiency !== undefined ? { mathProficiency } : {}) },
  }];
});
if (countries.length < 20) throw new Error(`Only ${countries.length} complete countries; check sources.`);
const snapshot = {
  generatedAt: new Date().toISOString(), period: years, priceYear: 2021,
  costUnit: '2021 international dollars (GDP purchasing power parity)',
  incomeUnit: '2019 PPS per equivalised person (Eurostat EU-SILC)',
  incomeYear: 2019, categories, countries, excluded, sources,
  healthSource: { url: 'https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy', population: 'Both sexes (SEX_BTSX)', snapshotGeneratedAt: sources.find(s => s.url === healthUrl.toString())!.retrievedAt },
  educationSource: { url: 'https://ec.europa.eu/eurostat/databrowser/view/educ_outc_pisa/default/table?lang=en', note: '2018 share reaching at least PISA mathematics Level 2: 100 minus low-achiever percentage.' },
};
const output = resolve(root, 'src/generated/best-practice-budget.json');
writeFileSync(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ countries: countries.length, excluded, output, outcomes: countries.map(c => ({ country: c.name, ...c.outcomes })) }, null, 2));
