import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { z } from 'zod';
import { ManifestEntrySchema, type ManifestEntry } from './schema';

export const ROOT = process.cwd();
export const SOURCES_DIR = join(ROOT, 'sources');
export const MANIFEST_PATH = join(SOURCES_DIR, 'manifest.json');

export function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function readManifest(): ManifestEntry[] {
  return z.array(ManifestEntrySchema).parse(JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')));
}

/** Raw response bytes of a saved source. */
export function readSourceBytes(entry: ManifestEntry): Buffer {
  return gunzipSync(readFileSync(join(SOURCES_DIR, entry.file)));
}

export function readSourceRows(entry: ManifestEntry, rowsKey: string): Record<string, unknown>[] {
  const parsed: unknown = JSON.parse(readSourceBytes(entry).toString('utf8'));
  const rows = (parsed as Record<string, unknown>)[rowsKey];
  if (!Array.isArray(rows)) throw new Error(`Source ${entry.id} has no row array at "${rowsKey}"`);
  return rows as Record<string, unknown>[];
}
