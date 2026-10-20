/**
 * Longevitron evals. Run after `pnpm build` so out/ exists:
 *   pnpm build && pnpm eval
 * Agents must not edit this folder. The owner approves eval changes.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { z } from 'zod';
import { CountrySchema, DataRecordSchema } from '../src/lib/schema';
import { ROOT, readManifest, readSourceBytes } from '../src/lib/source-files';
import { getSource } from '../src/lib/sources';
import { checkPageHtml } from './page-check';
import { checkCitedRows, checkSourceHash } from './source-check';

const readJson = (name: string): unknown => JSON.parse(readFileSync(join(ROOT, 'records', name), 'utf8'));
const records = z.array(DataRecordSchema).parse(readJson('hale-at-birth.json'));
const countries = z.array(CountrySchema).parse(readJson('countries.json'));
const cited = [...records, ...countries];
const errors: string[] = [];

for (const entry of readManifest()) {
  const bytes = readSourceBytes(entry);
  errors.push(...checkSourceHash(entry, bytes));
  const { table } = getSource(entry.id);
  const parsed = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
  const rows = parsed[table.rows] as Record<string, unknown>[];
  errors.push(...checkCitedRows(entry.id, cited.filter(item => item.source === entry.id), rows, table));
}
const citedSources = new Set(readManifest().map(entry => entry.id));
for (const item of cited) {
  if (!citedSources.has(item.source)) errors.push(`${'id' in item ? item.id : item.code}: source ${item.source} is not saved`);
}

const OUT = join(ROOT, 'out');
if (!existsSync(OUT)) {
  errors.push('out/ does not exist. Run pnpm build first.');
} else {
  const byId = new Map(records.map(record => [record.id, record]));
  const pages = readdirSync(OUT, { recursive: true, encoding: 'utf8' }).filter(file => file.endsWith('.html'));
  for (const page of pages) {
    errors.push(...checkPageHtml(relative(ROOT, join(OUT, page)), readFileSync(join(OUT, page), 'utf8'), byId));
  }
  console.log(`page check: ${pages.length} pages`);
}

console.log(`source check: ${cited.length} cited items`);
if (errors.length) {
  console.error(errors.slice(0, 50).join('\n'));
  console.error(`${errors.length} eval errors`);
  process.exit(1);
}
console.log('all evals pass');
