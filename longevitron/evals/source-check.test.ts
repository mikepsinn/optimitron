import { describe, expect, it } from 'vitest';
import type { ManifestEntry } from '../src/lib/schema';
import { sha256 } from '../src/lib/source-files';
import { checkCitedRows, checkSourceHash } from './source-check';

const table = { key: 'Id', fields: { geo: 'SpatialDim', value: 'NumericValue', low: 'Low' } };
const rows = [{ Id: 7, SpatialDim: 'USA', NumericValue: 64.6, Low: null }];
const item = { id: 'r1', rowKey: 7, geo: 'USA', value: 64.6 };

describe('checkCitedRows', () => {
  it('accepts a record whose mapped fields equal the cited row, with absent and null treated alike', () => {
    expect(checkCitedRows('src', [item], rows, table)).toEqual([]);
  });

  it('rejects a changed value and a missing row', () => {
    expect(checkCitedRows('src', [{ ...item, value: 64.7 }], rows, table)).toEqual(['r1: value is 64.7, src NumericValue is 64.6']);
    expect(checkCitedRows('src', [{ ...item, rowKey: 8 }], rows, table)).toEqual(['r1: no row with Id=8 in src']);
  });
});

describe('checkSourceHash', () => {
  const bytes = new TextEncoder().encode('{"value":[]}');
  const entry: ManifestEntry = {
    id: 'src', url: 'https://example.org/data', file: 'src.json.gz', retrievedAt: '2026-10-17T00:00:00.000Z',
    sha256: sha256(bytes), bytes: bytes.byteLength,
  };

  it('rejects a saved file that differs from the manifest hash', () => {
    expect(checkSourceHash(entry, bytes)).toEqual([]);
    expect(checkSourceHash(entry, new TextEncoder().encode('{"value":[1]}'))).toHaveLength(1);
  });
});
