import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { get as httpsGet } from 'node:https';
import { resolve } from 'node:path';
import { parseWorldBankRecords } from '../../src/fetchers/world-bank.js';
import type { WBMeta, WBRecord } from '../../src/fetchers/world-bank.js';

export interface BudgetSource { url: string; retrievedAt: string; sha256: string }
type JsonReader = <T>(url: string) => Promise<T>;

/** Keep raw response bytes and retrieval times so cached regeneration is reproducible. */
export function createBudgetSourceCache(directory: string, refresh = false) {
  mkdirSync(directory, { recursive: true });
  const sources: BudgetSource[] = [];
  let lastRequestAt = 0;
  async function text(url: string, accept = 'application/json'): Promise<string> {
    const file = resolve(directory, `${createHash('sha256').update(url).digest('hex')}.json`);
    let entry: { retrievedAt: string; body: string };
    if (existsSync(file) && !refresh) {
      entry = JSON.parse(readFileSync(file, 'utf8'));
    } else {
      // Generator requests are sequential; space uncached requests by at least 350 ms.
      await new Promise(resolveWait => setTimeout(resolveWait, Math.max(0, 350 - (Date.now() - lastRequestAt))));
      lastRequestAt = Date.now();
      const body = await new Promise<string>((resolveBody, reject) => {
        const request = httpsGet(url, { headers: { Accept: accept }, signal: AbortSignal.timeout(60_000) }, response => {
          if (response.statusCode !== 200) {
            response.resume();
            reject(new Error(`${response.statusCode}: ${url}`));
            return;
          }
          response.setEncoding('utf8');
          let body = '';
          response.on('data', chunk => { body += chunk; });
          response.on('end', () => resolveBody(body));
          response.on('error', reject);
        });
        request.on('error', reject);
      });
      entry = { retrievedAt: new Date().toISOString(), body };
      writeFileSync(file, JSON.stringify(entry));
    }
    sources.push({ url, retrievedAt: entry.retrievedAt, sha256: createHash('sha256').update(entry.body).digest('hex') });
    return entry.body;
  }
  const json: JsonReader = async <T>(url: string) => JSON.parse(await text(url)) as T;
  return { sources, text, json };
}

/** Read every page through the cache, retaining provenance for each raw response. */
export async function readWorldBankRows<T>(get: JsonReader, url: string): Promise<T[]> {
  const rows: T[] = [];
  let pageCount = 1;
  for (let page = 1; page <= pageCount; page++) {
    const pageUrl = new URL(url);
    if (page > 1) pageUrl.searchParams.set('page', String(page));
    // Preserve the original URL/cache key for page 1.
    const response = await get<[WBMeta, T[]]>(page === 1 ? url : pageUrl.toString());
    const [meta, records] = response;
    if (!meta || !Number.isSafeInteger(meta.pages) || meta.pages < 1 || meta.page !== page || !Array.isArray(records)
      || (page > 1 && meta.pages !== pageCount)) throw new Error(`Incomplete World Bank response: ${pageUrl}`);
    pageCount = meta.pages;
    rows.push(...records);
  }
  return rows;
}

export async function readWorldBankSeries(get: JsonReader, indicator: string, date = '2017:2019'): Promise<Map<string, number>> {
  const rows = await readWorldBankRows<WBRecord>(get, `https://api.worldbank.org/v2/country/all/indicator/${indicator}?date=${date}&format=json&per_page=20000`);
  if (indicator === 'NY.GDP.PCAP.PP.KD' && (!rows.length || rows.some(row => !row.indicator?.value.includes('constant 2021')))) {
    throw new Error('PPP reference year changed; review conversion metadata.');
  }
  const valid = rows.filter(row => /^[A-Z0-9]{3}$/.test(row.countryiso3code) && /^\d{4}$/.test(row.date)
    && typeof row.value === 'number' && Number.isFinite(row.value) && row.value >= 0);
  return new Map(parseWorldBankRecords(valid, indicator).map(row => [`${row.jurisdictionIso3}:${row.year}`, row.value]));
}

export async function readWhoRows<T>(get: JsonReader, url: string): Promise<T[]> {
  const rows: T[] = [];
  const visited = new Set<string>();
  let next = url;
  while (next) {
    if (visited.has(next)) throw new Error('WHO pagination repeated a page.');
    visited.add(next);
    const response = await get<{ value: T[]; '@odata.nextLink'?: string }>(next);
    if (!Array.isArray(response.value)) throw new Error('Invalid WHO response.');
    rows.push(...response.value);
    next = response['@odata.nextLink'] ? new URL(response['@odata.nextLink'], next).toString() : '';
  }
  return rows;
}
