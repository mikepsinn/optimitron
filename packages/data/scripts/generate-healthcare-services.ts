/** Refresh SHA healthcare functions without inventing a public/private allocation. */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cache = resolve(root, 'output/healthcare-services/sources');
const years = [2017, 2018, 2019];
const api = 'https://sdmx.oecd.org/public/rest/v1';
const functionNames: Record<string, string> = {
  HC1: 'Treatment',
  HC2: 'Rehabilitation',
  HC3: 'Long-term care (health)',
  HC4: 'Laboratory tests, imaging and other ancillary services',
  HC5: 'Medicines and medical goods outside care packages',
  HC6: 'Prevention',
  HC7: 'Health system administration',
  HC0: 'Other healthcare services (unspecified)',
};

interface Source { url: string; retrievedAt: string; sha256: string }
interface ShaRow { dimensions: Record<string, string>; year: number; value: number | null }

/** The fixed SDMX GenericData shape is checked before its numeric rows are used. */
export function parseShaXml(xml: string): ShaRow[] {
  if (!xml.includes('<message:GenericData') || !xml.includes('</message:GenericData>')) {
    throw new Error('Expected a complete OECD SDMX GenericData response.');
  }
  const rows: ShaRow[] = [];
  for (const [, series] of xml.matchAll(/<generic:Series>([\s\S]*?)<\/generic:Series>/g)) {
    const key = series.match(/<generic:SeriesKey>([\s\S]*?)<\/generic:SeriesKey>/)?.[1];
    if (!key) throw new Error('SDMX series has no dimension key.');
    const dimensions = Object.fromEntries(Array.from(key.matchAll(/<generic:Value\s+id="([^"]+)"\s+value="([^"]*)"\s*\/>/g), m => [m[1]!, m[2]!]));
    if (Object.keys(dimensions).length !== 12) throw new Error('SHA dimensions changed; review the query.');
    for (const [, observation] of series.matchAll(/<generic:Obs>([\s\S]*?)<\/generic:Obs>/g)) {
      const year = Number(observation.match(/<generic:ObsDimension\s+id="TIME_PERIOD"\s+value="(\d{4})"\s*\/>/)?.[1]);
      const raw = observation.match(/<generic:ObsValue\s+value="([^"]*)"\s*\/>/)?.[1];
      const value = raw === undefined || raw === '' ? null : Number(raw);
      if (!Number.isInteger(year) || (value !== null && (!Number.isFinite(value) || value < 0))) {
        throw new Error('Invalid SHA observation.');
      }
      rows.push({ dimensions, year, value });
    }
  }
  if (!rows.length) throw new Error('SHA response contains no observations.');
  return rows;
}

const completeMean = (values: (number | null)[]) => values.every(v => v !== null)
  ? values.reduce<number>((sum, v) => sum + v!, 0) / values.length
  : null;

export function buildServiceCountry(countryId: string, countryName: string, rows: ShaRow[]) {
  const selected = rows.filter(r => r.dimensions.REF_AREA === countryId);
  const values = new Map<string, number | null>();
  for (const row of selected) {
    const d = row.dimensions;
    const expected = {
      FREQ: 'A', MEASURE: 'EXP_HEALTH', UNIT_MEASURE: 'PT_EXP_HLTH',
      FINANCING_SCHEME_REV: '_Z', MODE_PROVISION: '_T', PROVIDER: '_T',
      FACTOR_PROVISION: '_Z', ASSET_TYPE: '_Z', PRICE_BASE: '_Z',
    };
    if (Object.entries(expected).some(([key, value]) => d[key] !== value)
      || !['_T', 'HF1'].includes(d.FINANCING_SCHEME!)
      || !['_T', ...Object.keys(functionNames)].includes(d.FUNCTION!)
      || !years.includes(row.year)) throw new Error(`Unexpected SHA dimension for ${countryId}.`);
    const key = `${d.FINANCING_SCHEME}:${d.FUNCTION}:${row.year}`;
    if (values.has(key)) throw new Error(`Duplicate SHA observation: ${countryId}:${key}`);
    if (row.value !== null && row.value > 100.05) throw new Error(`Invalid SHA share: ${countryId}:${key}`);
    values.set(key, row.value);
  }
  const value = (fund: string, func: string, year: number) => values.get(`${fund}:${func}:${year}`) ?? null;
  const hasTotal = years.every(year => value('_T', '_T', year) === 100);
  const hasPublicTotal = years.every(year => (value('HF1', '_T', year) ?? 0) > 0);
  const services = Object.entries(functionNames).map(([id, name]) => {
    const observations = years.map(year => {
      const publicAmount = value('HF1', id, year);
      const publicTotal = value('HF1', '_T', year);
      return {
        year,
        sharePercent: value('_T', id, year),
        governmentCompulsorySharePercent: publicAmount !== null && publicTotal !== null && publicTotal > 0
          ? publicAmount / publicTotal * 100 : null,
      };
    });
    return {
      id, name,
      sharePercent: completeMean(observations.map(o => o.sharePercent)),
      governmentCompulsorySharePercent: completeMean(observations.map(o => o.governmentCompulsorySharePercent)),
      observations,
    };
  });
  const residual = (field: 'sharePercent' | 'governmentCompulsorySharePercent', hasDenominator: boolean) => {
    if (!hasDenominator) return { unallocated: null, roundingAdjustment: null };
    for (const year of years) {
      const annualSum = services.reduce((sum, s) => sum + (s.observations.find(o => o.year === year)![field] ?? 0), 0);
      if (annualSum > 100.05) throw new Error(`SHA functions overlap: ${countryId} ${year} ${field} ${annualSum}`);
    }
    const remainder = 100 - services.reduce((sum, s) => sum + (s[field] ?? 0), 0);
    if (remainder < -0.05) throw new Error(`SHA functions overlap: ${countryId} ${field}`);
    return { unallocated: Math.max(0, remainder), roundingAdjustment: Math.min(0, remainder) };
  };
  const totalResidual = residual('sharePercent', hasTotal);
  const publicResidual = residual('governmentCompulsorySharePercent', hasPublicTotal);
  return {
    countryId, countryName, services,
    governmentCompulsoryPercentOfTotal: completeMean(years.map(year => value('HF1', '_T', year))),
    unallocatedSharePercent: totalResidual.unallocated,
    roundingAdjustmentPercent: totalResidual.roundingAdjustment,
    governmentCompulsoryUnallocatedSharePercent: publicResidual.unallocated,
    governmentCompulsoryRoundingAdjustmentPercent: publicResidual.roundingAdjustment,
    missingFunctionIds: services.filter(s => s.sharePercent === null).map(s => s.id),
    coverageNote: selected.length
      ? 'Three-year mean of annual shares. Missing functions remain unreported; residual and rounding rows reconcile the reported total.'
      : 'No 2017–2019 function-level observations in this OECD query. No service allocation has been imputed.',
  };
}

async function main() {
  mkdirSync(cache, { recursive: true });
  const sources: Source[] = [];
  let lastRequestAt = 0;
  async function get(url: string) {
    const file = resolve(cache, `${createHash('sha256').update(url).digest('hex')}.json`);
    let entry: { body: string; retrievedAt: string };
    if (existsSync(file) && !process.argv.includes('--refresh')) {
      entry = JSON.parse(readFileSync(file, 'utf8'));
    } else {
      const delay = Math.max(0, 1500 - (Date.now() - lastRequestAt));
      if (delay) await new Promise(resolveDelay => setTimeout(resolveDelay, delay));
      lastRequestAt = Date.now();
      const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (!response.ok) throw new Error(`OECD ${response.status}: ${url}`);
      entry = { body: await response.text(), retrievedAt: new Date().toISOString() };
      writeFileSync(file, JSON.stringify(entry));
    }
    sources.push({ url, retrievedAt: entry.retrievedAt, sha256: createHash('sha256').update(entry.body).digest('hex') });
    return entry.body;
  }
  const structure = await get(`${api}/dataflow/OECD.ELS.HD/DSD_SHA@DF_SHA/1.1?references=all`);
  const expectedOrder = ['REF_AREA', 'FREQ', 'MEASURE', 'UNIT_MEASURE', 'FINANCING_SCHEME', 'FINANCING_SCHEME_REV', 'FUNCTION', 'MODE_PROVISION', 'PROVIDER', 'FACTOR_PROVISION', 'ASSET_TYPE', 'PRICE_BASE'];
  const dimensionList = structure.match(/<structure:DimensionList[^>]*>([\s\S]*?)<\/structure:DimensionList>/)?.[1] ?? '';
  const actualOrder = Array.from(dimensionList.matchAll(/<structure:Dimension\s+id="([^"]+)"/g), m => m[1]);
  if (actualOrder.join() !== expectedOrder.join()) throw new Error('SHA structure changed; review dimensions before refresh.');
  const areaList = structure.match(/<structure:Codelist\s+id="CL_AREA"[^>]*>([\s\S]*?)<\/structure:Codelist>/)?.[1] ?? '';
  const names = new Map(Array.from(areaList.matchAll(/<structure:Code\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/structure:Code>/g), m => {
    const name = m[2]!.match(/<common:Name\s+xml:lang="en">([^<]+)<\/common:Name>/)?.[1] ?? m[1]!;
    return [m[1]!, name.replaceAll('&amp;', '&').replaceAll('&apos;', "'").replaceAll('&quot;', '"')];
  }));
  if (!names.has('JPN')) throw new Error('SHA country labels could not be read.');
  const key = ['', 'A', 'EXP_HEALTH', 'PT_EXP_HLTH', '_T+HF1', '_Z', 'HC0+HC1+HC2+HC3+HC4+HC5+HC6+HC7+_T', '_T', '_T', '_Z', '_Z', '_Z'].join('.');
  const rows = parseShaXml(await get(`${api}/data/OECD.ELS.HD,DSD_SHA@DF_SHA,1.1/${key}?startPeriod=2017&endPeriod=2019`));
  const capitalKey = ['', 'A', 'CAPITAL_FORM', 'PT_B1GQ', '_Z', '_Z', '_Z', '_Z', '_T', '_Z', '_T', '_Z'].join('.');
  const capitalRows = parseShaXml(await get(`${api}/data/OECD.ELS.HD,DSD_SHA@DF_SHA_HK,1.1/${capitalKey}?startPeriod=2017&endPeriod=2019`));
  const ids = [...new Set([...rows.map(r => r.dimensions.REF_AREA!), 'SGP'])].sort();
  const countries = ids.map(id => {
    const capital = capitalRows.filter(r => r.dimensions.REF_AREA === id);
    if (capital.some(r => r.dimensions.FINANCING_SCHEME !== '_Z' || r.dimensions.PROVIDER !== '_T' || r.dimensions.ASSET_TYPE !== '_T')) {
      throw new Error(`Capital scope changed for ${id}.`);
    }
    const observations = years.map(year => {
      const matches = capital.filter(r => r.year === year);
      if (matches.length > 1) throw new Error(`Duplicate capital observation: ${id} ${year}`);
      return { year, percentGdp: matches[0]?.value ?? null };
    });
    return {
      ...buildServiceCountry(id, names.get(id) ?? id, rows),
      capital: {
        allFinancingPercentGdp: completeMean(observations.map(o => o.percentGdp)),
        governmentCompulsoryPercentGdp: null,
        observations,
        note: 'Gross fixed capital formation, all financing. The source does not identify a public share; it is not added to public healthcare spending.',
      },
    };
  });
  if (!countries.find(c => c.countryId === 'JPN')?.services.some(s => s.sharePercent !== null)
    || !countries.find(c => c.countryId === 'KOR')?.services.some(s => s.sharePercent !== null)) throw new Error('Reference-country service data missing.');
  const snapshot = {
    generatedAt: new Date().toISOString(), period: years,
    unit: 'Percent of current healthcare spending',
    sourceName: 'OECD System of Health Accounts',
    methodology: 'Arithmetic mean of 2017–2019 annual function shares. All-financing shares partition total current expenditure; HF1 shares are normalized within government/compulsory schemes. Neither includes capital. Multiplying these mean shares by a separately sourced mean cost is a composition estimate, not a separately measured programme cost.',
    governmentCompulsoryScope: 'HF1 includes government and compulsory schemes, potentially including compulsory private insurance. It is not interchangeable with World Bank domestic government health expenditure.',
    functionScope: 'HC4 covers ancillary services not allocated to another function; HC5 covers medical goods not already allocated within care. Research and health-related social long-term care are outside current health expenditure.',
    countries, sources,
  };
  const output = resolve(root, 'src/generated/healthcare-services.json');
  writeFileSync(output, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(JSON.stringify({ output, countries: countries.length, references: countries.filter(c => ['JPN', 'KOR', 'SGP'].includes(c.countryId)).map(c => ({
    countryId: c.countryId,
    reportedFunctions: c.services.filter(s => s.sharePercent !== null).length,
    publicCapitalPercentGdp: c.capital.governmentCompulsoryPercentGdp,
  })) }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
