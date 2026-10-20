import type { ManifestEntry } from '../src/lib/schema';
import { sha256 } from '../src/lib/source-files';

type Row = Record<string, unknown>;
type Table = { key: string; fields: Record<string, string> };
type Cited = { id?: string; code?: string; rowKey: string | number } & Record<string, unknown>;

/** The saved file must be the exact bytes that the manifest describes. */
export function checkSourceHash(entry: ManifestEntry, bytes: Uint8Array): string[] {
  const actual = sha256(bytes);
  return actual === entry.sha256 ? [] : [`${entry.id}: sha256 is ${actual}, manifest says ${entry.sha256}`];
}

/** Each cited row must exist, and each mapped field must equal the source column exactly. */
export function checkCitedRows(sourceId: string, items: Cited[], rows: Row[], table: Table): string[] {
  const byKey = new Map(rows.map(row => [row[table.key], row]));
  const errors: string[] = [];
  for (const item of items) {
    const label = item.id ?? item.code ?? String(item.rowKey);
    const row = byKey.get(item.rowKey);
    if (!row) {
      errors.push(`${label}: no row with ${table.key}=${item.rowKey} in ${sourceId}`);
      continue;
    }
    for (const [field, column] of Object.entries(table.fields)) {
      const expected = row[column] ?? null;
      const actual = item[field] ?? null;
      if (expected !== actual) {
        errors.push(`${label}: ${field} is ${JSON.stringify(actual)}, ${sourceId} ${column} is ${JSON.stringify(expected)}`);
      }
    }
  }
  return errors;
}
