import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { CountrySchema, DataRecordSchema, type Country, type DataRecord } from './schema';
import { ROOT, readManifest } from './source-files';

const read = (name: string): unknown => JSON.parse(readFileSync(join(ROOT, 'records', name), 'utf8'));

export const hale: DataRecord[] = z.array(DataRecordSchema).parse(read('hale-at-birth.json'));
export const countries: Country[] = z.array(CountrySchema).parse(read('countries.json'));
export const manifest = readManifest();

export function haleSeries(code: string): DataRecord[] {
  return hale.filter(record => record.geo === code);
}

export function latestHale(code: string): DataRecord | undefined {
  return haleSeries(code).at(-1);
}

export const slugOf = (country: Country) => country.code.toLowerCase();
