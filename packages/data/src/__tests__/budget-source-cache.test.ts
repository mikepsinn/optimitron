import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createBudgetSourceCache, readWhoRows, readWorldBankRows, readWorldBankSeries } from '../../scripts/lib/budget-source-cache.js';

const temporaryDirectories: string[] = [];
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'budget-source-'));
  temporaryDirectories.push(directory);
  const cache = createBudgetSourceCache(directory);
  const store = (url: string, body: string, retrievedAt = '2026-09-01T00:00:00.000Z') => {
    const file = resolve(directory, `${createHash('sha256').update(url).digest('hex')}.json`);
    writeFileSync(file, JSON.stringify({ retrievedAt, body }));
    return file;
  };
  return { ...cache, store };
}

const wbUrl = 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.PP.KD?date=2017:2019&format=json&per_page=20000';
const pageTwo = new URL(wbUrl);
pageTwo.searchParams.set('page', '2');
const row = (countryiso3code: string, value: number | null, name = 'GDP per capita (constant 2021 international $)') => ({
  countryiso3code, date: '2019', value, indicator: { value: name },
});

describe('budget source cache', () => {
  it('retains raw hashes, retrieval times and valid zero observations across World Bank pages', async () => {
    const cache = fixture();
    const firstBody = ` [${JSON.stringify({ page: 1, pages: 2 })}, ${JSON.stringify([row('JPN', 0), row('KOR', null)])}]\n`;
    const secondBody = JSON.stringify([{ page: 2, pages: 2 }, [row('SGP', 100), row('BAD', -1), { ...row('USA', 200), date: 'invalid' }]]);
    const firstFile = cache.store(wbUrl, firstBody);
    cache.store(pageTwo.toString(), secondBody, '2026-09-02T00:00:00.000Z');
    expect(await readWorldBankSeries(cache.json, 'NY.GDP.PCAP.PP.KD')).toEqual(new Map([['JPN:2019', 0], ['SGP:2019', 100]]));
    expect(cache.sources).toEqual([
      { url: wbUrl, retrievedAt: '2026-09-01T00:00:00.000Z', sha256: createHash('sha256').update(firstBody).digest('hex') },
      { url: pageTwo.toString(), retrievedAt: '2026-09-02T00:00:00.000Z', sha256: createHash('sha256').update(secondBody).digest('hex') },
    ]);
    expect(JSON.parse(readFileSync(firstFile, 'utf8')).body).toBe(firstBody);
  });

  it('rejects a changed PPP price basis on a later page', async () => {
    const cache = fixture();
    cache.store(wbUrl, JSON.stringify([{ page: 1, pages: 2 }, [row('JPN', 100)]]));
    cache.store(pageTwo.toString(), JSON.stringify([{ page: 2, pages: 2 }, [row('SGP', 200, 'constant 2017 international $')]]));
    await expect(readWorldBankSeries(cache.json, 'NY.GDP.PCAP.PP.KD')).rejects.toThrow('PPP reference year changed');
  });

  it('rejects World Bank responses that repeat page one instead of supplying page two', async () => {
    const cache = fixture();
    const body = JSON.stringify([{ page: 1, pages: 2 }, [row('JPN', 100)]]);
    cache.store(wbUrl, body);
    cache.store(pageTwo.toString(), body);
    await expect(readWorldBankRows(cache.json, wbUrl)).rejects.toThrow('Incomplete World Bank response');
  });

  it('reads WHO pagination without losing uncertainty fields or page provenance', async () => {
    const cache = fixture();
    const first = 'https://ghoapi.azureedge.net/api/WHOSIS_000002';
    const second = `${first}?page=2`;
    const observation = { NumericValue: 73, Low: 72, High: 74 };
    cache.store(first, JSON.stringify({ value: [observation], '@odata.nextLink': '?page=2' }));
    cache.store(second, JSON.stringify({ value: [{ ...observation, NumericValue: 72 }] }));
    expect(await readWhoRows(cache.json, first)).toEqual([observation, { ...observation, NumericValue: 72 }]);
    expect(cache.sources.map(source => source.url)).toEqual([first, second]);
    cache.store(second, JSON.stringify({ value: [], '@odata.nextLink': first }));
    await expect(readWhoRows(cache.json, first)).rejects.toThrow('WHO pagination repeated a page');
  });
});
