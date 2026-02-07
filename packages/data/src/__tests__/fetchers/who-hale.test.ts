import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WHOHALEFetcher, parseWHOHALERecords } from '../../fetchers/who-hale.js';
import type { WHOHALERecord } from '../../fetchers/who-hale.js';

const mockRecords = [
  { SpatialDim: 'USA', TimeDim: '2019', NumericValue: 68.1 },
  { SpatialDim: 'GBR', TimeDim: '2019', NumericValue: 70.3 },
  { SpatialDim: 'JPN', TimeDim: '2019', NumericValue: null },
];

const mockResponse = {
  value: mockRecords,
};

const mockResponsePage2 = {
  value: [{ SpatialDim: 'DEU', TimeDim: '2018', NumericValue: 69.2 }],
};

describe('WHO HALE Fetcher', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('exposes WHOHALERecord interface shape', () => {
    const record: WHOHALERecord = {
      countryIso3: 'USA',
      year: 2019,
      haleYears: 68.1,
      source: 'WHO GHO (WHOSIS_000002)',
    };
    expect(record).toEqual(
      expect.objectContaining({
        countryIso3: 'USA',
        year: 2019,
        haleYears: 68.1,
        source: expect.stringContaining('WHOSIS_000002'),
      }),
    );
  });

  it('parses raw records into WHOHALERecord[]', () => {
    const parsed = parseWHOHALERecords(mockRecords);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual(
      expect.objectContaining({
        countryIso3: 'USA',
        year: 2019,
        haleYears: 68.1,
      }),
    );
  });

  it('fetches HALE data with pagination', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockResponse,
          '@odata.nextLink': 'https://ghoapi.azureedge.net/api/WHOSIS_000002?$skip=2',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponsePage2),
      });

    globalThis.fetch = fetchMock;

    const fetcher = new WHOHALEFetcher({ rateLimitMs: 0 });
    const result = await fetcher.fetch();

    expect(result).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns empty array on HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const fetcher = new WHOHALEFetcher({ rateLimitMs: 0 });
    const result = await fetcher.fetch();
    expect(result).toEqual([]);
  });

  it('retries on 429 then succeeds', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

    globalThis.fetch = fetchMock;

    const fetcher = new WHOHALEFetcher({ rateLimitMs: 0, maxRetries: 1 });
    const result = await fetcher.fetch();

    expect(result).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
