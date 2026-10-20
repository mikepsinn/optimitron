/**
 * Build records/ from the saved sources. No network. Same input gives the same output.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Country, DataRecord } from '../src/lib/schema';
import { ROOT, readManifest, readSourceRows } from '../src/lib/source-files';
import { getSource } from '../src/lib/sources';

const RECORDS_DIR = join(ROOT, 'records');
const manifest = readManifest();

function rowsOf(sourceId: string) {
  const entry = manifest.find(candidate => candidate.id === sourceId);
  if (!entry) throw new Error(`Source ${sourceId} is not in sources/manifest.json. Run pnpm fetch:sources.`);
  return readSourceRows(entry, getSource(sourceId).table.rows);
}

const optionalNumber = (input: unknown) => (typeof input === 'number' ? input : undefined);

const hale: DataRecord[] = rowsOf('who-gho-hale')
  .filter(row => typeof row.NumericValue === 'number')
  .map(row => ({
    id: `hale-at-birth:${row.SpatialDim}:${row.TimeDim}`,
    variable: 'hale-at-birth',
    unit: 'years',
    geo: String(row.SpatialDim),
    year: Number(row.TimeDim),
    value: row.NumericValue as number,
    low: optionalNumber(row.Low),
    high: optionalNumber(row.High),
    source: 'who-gho-hale',
    rowKey: row.Id as number,
  }))
  .sort((a, b) => a.geo.localeCompare(b.geo) || a.year - b.year);

const geos = new Set(hale.map(record => record.geo));
const countries: Country[] = rowsOf('who-gho-countries')
  .filter(row => geos.has(String(row.Code)))
  .map(row => ({
    code: String(row.Code),
    name: String(row.Title),
    region: String(row.ParentTitle),
    source: 'who-gho-countries',
    rowKey: String(row.Code),
  }))
  .sort((a, b) => a.code.localeCompare(b.code));

const missingNames = [...geos].filter(geo => !countries.some(country => country.code === geo));
if (missingNames.length) throw new Error(`No WHO country name for: ${missingNames.join(', ')}`);

mkdirSync(RECORDS_DIR, { recursive: true });
writeFileSync(join(RECORDS_DIR, 'hale-at-birth.json'), `${JSON.stringify(hale)}\n`);
writeFileSync(join(RECORDS_DIR, 'countries.json'), `${JSON.stringify(countries, null, 2)}\n`);
console.log(`hale-at-birth: ${hale.length} records for ${geos.size} countries`);
