/**
 * Download every source in src/lib/sources.ts and save the raw response.
 * This is the only step that uses the network. Run `pnpm build:records` after it.
 *
 *   pnpm fetch:sources            # all sources
 *   pnpm fetch:sources who-gho-hale
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { ManifestEntry } from '../src/lib/schema';
import { MANIFEST_PATH, SOURCES_DIR, readManifest, sha256 } from '../src/lib/source-files';
import { SOURCES } from '../src/lib/sources';

const only = new Set(process.argv.slice(2));
const manifest = existsSync(MANIFEST_PATH) ? readManifest() : [];
mkdirSync(SOURCES_DIR, { recursive: true });
const FETCH_TIMEOUT_MS = 60_000;

for (const source of SOURCES) {
  if (only.size && !only.has(source.id)) continue;
  const response = await fetch(source.url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${source.id}: HTTP ${response.status} from ${source.url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const entry: ManifestEntry = {
    id: source.id,
    url: source.url,
    file: `${source.id}.json.gz`,
    retrievedAt: new Date().toISOString(),
    sha256: sha256(bytes),
    bytes: bytes.byteLength,
  };
  const previous = manifest.find(candidate => candidate.id === source.id);
  if (previous?.sha256 === entry.sha256) {
    console.log(`${source.id}: unchanged`);
    continue;
  }
  writeFileSync(join(SOURCES_DIR, entry.file), gzipSync(bytes, { level: 9 }));
  manifest.splice(previous ? manifest.indexOf(previous) : manifest.length, previous ? 1 : 0, entry);
  console.log(`${source.id}: saved ${entry.bytes} bytes, sha256 ${entry.sha256}`);
}

manifest.sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
