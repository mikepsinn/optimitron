/** COFOG public budgets for the global healthcare reference systems. */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBudgetSourceCache, readWorldBankSeries } from './lib/budget-source-cache.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cache = resolve(root, 'output/best-practice-budget/sources');
const { sources, text: get, json } = createBudgetSourceCache(cache, process.argv.includes('--refresh'));

/** SDMX CSV includes quoted commas in source descriptions. */
function csv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let fields: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (character === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && character === ',') {
      fields.push(field); field = '';
    } else if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && text[i + 1] === '\n') i++;
      fields.push(field);
      if (fields.some(value => value.length)) rows.push(fields);
      fields = []; field = '';
    } else field += character;
  }
  if (quoted) throw new Error('Unterminated CSV quote.');
  if (field || fields.length) rows.push([...fields, field]);
  const headers = rows.shift();
  if (!headers?.includes('OBS_VALUE')) throw new Error('Expected SDMX CSV data.');
  return rows.map(row => {
    if (row.length !== headers.length) throw new Error('CSV column count mismatch.');
    return Object.fromEntries(headers.map((header, index) => [header, row[index]!]));
  });
}

const period = [2017, 2018, 2019];
const subcategoryIds = ['GF0701', 'GF0702', 'GF0703', 'GF0704', 'GF0705', 'GF0706'];
const oecdUrl = 'https://sdmx.oecd.org/public/rest/v1/data/OECD.SDD.NAD,DSD_NASEC10@DF_TABLE11,1.1/A.JPN+KOR.S13...OTE..GF07+GF0701+GF0702+GF0703+GF0704+GF0705+GF0706...V..?startPeriod=2017&endPeriod=2019';
const oecd = csv(await get(oecdUrl, 'text/csv'));
const imfUrl = 'https://api.imf.org/external/sdmx/2.1/data/IMF.STA,GFS_COFOG,11.0.0/SGP.S13.G2MF.GF07_T.POGDP_PT+XDC.A?startPeriod=2017&endPeriod=2019';
const imf = csv(await get(imfUrl, 'application/vnd.sdmx.data+csv;version=2.0.0'));

const nominalGdp = await readWorldBankSeries(json, 'NY.GDP.MKTP.CN');
const realGdpPerCapita = await readWorldBankSeries(json, 'NY.GDP.PCAP.PP.KD');
const nominalCosts = new Map<string, number>();
for (const row of oecd) {
  if (row['FREQ'] !== 'A' || row['SECTOR'] !== 'S13' || row['TRANSACTION'] !== 'OTE'
    || row['UNIT_MEASURE'] !== 'XDC' || row['PRICE_BASE'] !== 'V' || row['ACCOUNTING_ENTRY'] !== 'D'
    || row['COUNTERPART_SECTOR'] !== '_Z' || row['TRANSFORMATION'] !== 'N') {
    throw new Error('Unexpected OECD COFOG accounting scope.');
  }
  const expectedCurrency = row['REF_AREA'] === 'JPN' ? 'JPY' : row['REF_AREA'] === 'KOR' ? 'KRW' : null;
  if (!expectedCurrency || row['CURRENCY'] !== expectedCurrency || !row['UNIT_MULT']) throw new Error('Unexpected OECD currency units.');
  const key = `${row['REF_AREA']}:${row['TIME_PERIOD']}:${row['EXPENDITURE']}`;
  if (nominalCosts.has(key)) throw new Error(`Duplicate COFOG observation: ${key}.`);
  const value = Number(row['OBS_VALUE']) * 10 ** Number(row['UNIT_MULT']);
  if (!row['OBS_VALUE'] || !Number.isFinite(value) || value < 0) throw new Error(`Invalid OECD cost: ${key}.`);
  nominalCosts.set(key, value);
}
for (const row of imf.filter(row => row['TYPE_OF_TRANSFORMATION'] === 'XDC')) {
  if (row['COUNTRY'] !== 'SGP' || row['SECTOR'] !== 'S13' || row['INDICATOR'] !== 'GF07_T'
    || row['GFS_GRP'] !== 'G2MF' || row['FREQUENCY'] !== 'A' || row['UNIT'] !== 'XDC') {
    throw new Error('Unexpected IMF COFOG accounting scope.');
  }
  const key = `SGP:${row['TIME_PERIOD']}:GF07`;
  // IMF CSV already publishes actual currency units; SCALE is a display annotation.
  const value = Number(row['OBS_VALUE']);
  if (!row['OBS_VALUE'] || !Number.isFinite(value) || value <= 0 || nominalCosts.has(key)) throw new Error(`Invalid IMF cost: ${key}.`);
  nominalCosts.set(key, value);
}
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const countries = [
  { countryId: 'JPN', name: 'Japan', currency: 'JPY', sourceUrl: oecdUrl, accountingBasis: 'OECD national accounts; general government total expenditure, including capital and health R&D.' },
  { countryId: 'KOR', name: 'South Korea', currency: 'KRW', sourceUrl: oecdUrl, accountingBasis: 'OECD national accounts; general government total expenditure, including capital and health R&D.' },
  { countryId: 'SGP', name: 'Singapore', currency: 'SGD', sourceUrl: imfUrl, accountingBasis: 'IMF Government Finance Statistics; general government expenditure, cash basis (CA), including capital.' },
].map(country => {
  const observations = period.map(year => {
    const key = `${country.countryId}:${year}`;
    const gdpNationalCurrency = nominalGdp.get(key);
    const gdpPerCapitaPpp = realGdpPerCapita.get(key);
    const expenditureNationalCurrency = nominalCosts.get(`${key}:GF07`);
    if (!gdpNationalCurrency || !gdpPerCapitaPpp || !expenditureNationalCurrency) throw new Error(`Incomplete healthcare COFOG data: ${key}.`);
    const convert = (value: number) => value / gdpNationalCurrency * gdpPerCapitaPpp;
    const subcategoryCosts = Object.fromEntries(subcategoryIds.map(id => {
      const value = nominalCosts.get(`${key}:${id}`);
      return [id, value === undefined ? null : convert(value)];
    }));
    const publicPerCapita = convert(expenditureNationalCurrency);
    const subcosts = Object.values(subcategoryCosts);
    if (subcosts.every((value): value is number => value !== null)
      && Math.abs(subcosts.reduce((sum, value) => sum + value, 0) - publicPerCapita) > Math.max(0.01, publicPerCapita * 0.00001)) {
      throw new Error(`Healthcare COFOG subgroups do not reconcile: ${key}.`);
    }
    if (country.countryId === 'SGP') {
      const publishedShare = Number(imf.find(row => row['TYPE_OF_TRANSFORMATION'] === 'POGDP_PT' && row['TIME_PERIOD'] === String(year))?.['OBS_VALUE']);
      const calculatedShare = expenditureNationalCurrency / gdpNationalCurrency * 100;
      // Cross-check the IMF CSV scaling against its separately reported percentage.
      if (!Number.isFinite(publishedShare) || Math.abs(calculatedShare / publishedShare - 1) > 0.05) {
        throw new Error(`IMF units or GDP vintages differ by over 5%: ${key}.`);
      }
    }
    return { year, publicPerCapita, subcategoryCosts, expenditureNationalCurrency, gdpNationalCurrency, gdpPerCapitaPpp };
  });
  return { ...country, observations, publicPerCapita: mean(observations.map(row => row.publicPerCapita)),
    subcategoryCosts: Object.fromEntries(subcategoryIds.map(id => {
      const values = observations.map(row => row.subcategoryCosts[id]);
      return [id, values.every((value): value is number => value !== null && value !== undefined) ? mean(values) : null];
    })) };
});
const snapshot = {
  generatedAt: sources.map(source => source.retrievedAt).sort().at(-1)!,
  period, costUnit: '2021 international dollars (GDP purchasing power parity)',
  method: 'For each year, general-government COFOG GF07 total expenditure in national currency / World Bank GDP in current national currency × World Bank GDP per capita in constant 2021 international dollars. Average annual amounts across 2017–2019. OECD currency observations use their UNIT_MULT; IMF CSV observations are already in actual units.',
  scope: 'Functional public healthcare budgets include capital and medical R&D. They are distinct from the SHA current healthcare total used to rank systems and its financing-source split. Cash/accrual and source revision differences remain visible in source metadata. Missing subgroups are null, not zero.',
  countries, sources,
};
writeFileSync(resolve(root, 'src/generated/healthcare-cofog.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify(countries.map(country => ({ countryId: country.countryId, publicPerCapita: country.publicPerCapita, subcategoryCosts: country.subcategoryCosts })), null, 2));
