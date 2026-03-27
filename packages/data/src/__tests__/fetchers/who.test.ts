import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseGHORecords,
  fetchGHOIndicator,
  fetchWHOLifeExpectancy,
  fetchWHOHealthyLifeExpectancy,
  fetchWHOUHCIndex,
  GHO_INDICATOR_CODES,
} from '../../fetchers/who';
import type { GHORecord, GHOResponse } from '../../fetchers/who';

// ─── Mock data ──────────────────────────────────────────────────────

const mockRecords: GHORecord[] = [
  {
    Id: 1,
    IndicatorCode: 'WHOSIS_000001',
    SpatialDim: 'USA',
    TimeDim: '2019',
    Value: '78.5',
    NumericValue: 78.5,
  },
  {
    Id: 2,
    IndicatorCode: 'WHOSIS_000001',
    SpatialDim: 'GBR',
    TimeDim: '2019',
    Value: '81.3',
    NumericValue: 81.3,
  },
  {
    Id: 3,
    IndicatorCode: 'WHOSIS_000001',
    SpatialDim: 'JPN',
    TimeDim: '2019',
    Value: '',
    NumericValue: null, // missing value
  },
];

const mockPage1Response: GHOResponse = {
  '@odata.context': 'https://ghoapi.azureedge.net/api/$metadata#DefaultContainer.WHOSIS_000001',
  value: [mockRecords[0]!, mockRecords[1]!],
  '@odata.nextLink': 'https://ghoapi.azureedge.net/api/WHOSIS_000001?$skip=2',
};

const mockPage2Response: GHOResponse = {
  value: [
    {
      Id: 4,
      IndicatorCode: 'WHOSIS_000001',
      SpatialDim: 'DEU',
      TimeDim: '2019',
      Value: '80.9',
      NumericValue: 80.9,
    },
  ],
};

// ─── Tests ──────────────────────────────────────────────────────────

describe('WHO GHO Fetcher', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('parseGHORecords', () => {
    it('converts valid records to DataPoint array', () => {
      const points = parseGHORecords(mockRecords, 'WHOSIS_000001');
      // Third record has null NumericValue, should be filtered
      expect(points).toHaveLength(2);
      expect(points[0]).toEqual(
        expect.objectContaining({
          jurisdictionIso3: 'USA',
          year: 2019,
          value: 78.5,
          source: 'WHO GHO (WHOSIS_000001)',
        }),
      );
    });

    it('filters out records with null NumericValue', () => {
      const points = parseGHORecords(mockRecords, 'WHOSIS_000001');
      const jpnPoints = points.filter((p) => p.jurisdictionIso3 === 'JPN');
      expect(jpnPoints).toHaveLength(0);
    });

    it('returns empty array for empty input', () => {
      expect(parseGHORecords([], 'test')).toEqual([]);
    });

    it('includes sourceUrl', () => {
      const points = parseGHORecords(mockRecords, 'WHOSIS_000001');
      expect(points[0]?.sourceUrl).toContain('WHOSIS_000001');
    });
  });

  describe('fetchGHOIndicator', () => {
    it('returns parsed data on success (single page)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPage2Response), // no nextLink
      });

      const result = await fetchGHOIndicator('WHOSIS_000001');
      expect(result).toHaveLength(1);
      expect(result[0]?.jurisdictionIso3).toBe('DEU');
    });

    it('follows pagination via @odata.nextLink', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPage1Response),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPage2Response),
        });

      globalThis.fetch = fetchMock;

      const result = await fetchGHOIndicator('WHOSIS_000001');
      expect(result).toHaveLength(3); // 2 from page 1 + 1 from page 2
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('returns empty array on HTTP error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await fetchGHOIndicator('WHOSIS_000001');
      expect(result).toEqual([]);
    });

    it('returns empty array on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

      const result = await fetchGHOIndicator('WHOSIS_000001');
      expect(result).toEqual([]);
    });

    it('retries transient network failures before succeeding', async () => {
      const fetchMock = vi.fn()
        .mockRejectedValueOnce(new Error('Transient network failure'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPage2Response),
        });

      globalThis.fetch = fetchMock;

      const result = await fetchGHOIndicator('WHOSIS_000001');
      expect(result).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('builds filter with jurisdictions', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPage2Response),
      });

      await fetchGHOIndicator('WHOSIS_000001', { jurisdictions: ['USA', 'GBR'] });
      const callUrl1 = decodeURIComponent((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string);
      expect(callUrl1).toContain("SpatialDim eq 'USA'");
      expect(callUrl1).toContain("SpatialDim eq 'GBR'");
    });

    it('builds filter with period', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPage2Response),
      });

      await fetchGHOIndicator('WHOSIS_000001', {
        period: { startYear: 2015, endYear: 2020 },
      });
      const callUrl2 = decodeURIComponent((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string);
      expect(callUrl2).toContain('TimeDim ge 2015');
      expect(callUrl2).toContain('TimeDim le 2020');
    });

    it('includes sex filter (BTSX)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPage2Response),
      });

      await fetchGHOIndicator('WHOSIS_000001');
      const callUrl3 = decodeURIComponent((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string);
      expect(callUrl3).toContain("Dim1 eq 'BTSX'");
    });

    it('falls back without sex filter when Dim1 query returns empty rows', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ value: [] } as GHOResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPage2Response),
        });

      globalThis.fetch = fetchMock;

      const result = await fetchGHOIndicator('WHOSIS_000001');
      expect(result).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      const firstUrl = decodeURIComponent(fetchMock.mock.calls[0]?.[0] as string);
      const secondUrl = decodeURIComponent(fetchMock.mock.calls[1]?.[0] as string);
      expect(firstUrl).toContain("Dim1 eq 'BTSX'");
      expect(secondUrl).not.toContain("Dim1 eq 'BTSX'");
    });

    it('falls back without sex filter when Dim1 query fails', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPage2Response),
        });

      globalThis.fetch = fetchMock;

      const result = await fetchGHOIndicator('WHOSIS_000001');
      expect(result).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      const secondUrl = decodeURIComponent(fetchMock.mock.calls[1]?.[0] as string);
      expect(secondUrl).not.toContain("Dim1 eq 'BTSX'");
    });
  });

  describe('convenience helpers', () => {
    beforeEach(() => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPage2Response),
      });
    });

    it('fetchWHOLifeExpectancy uses correct indicator', async () => {
      await fetchWHOLifeExpectancy();
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain(GHO_INDICATOR_CODES.LIFE_EXPECTANCY);
    });

    it('fetchWHOHealthyLifeExpectancy uses correct indicator', async () => {
      await fetchWHOHealthyLifeExpectancy();
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain(GHO_INDICATOR_CODES.HEALTHY_LIFE_EXPECTANCY);
    });

    it('fetchWHOUHCIndex uses correct indicator', async () => {
      await fetchWHOUHCIndex();
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain(GHO_INDICATOR_CODES.UHC_INDEX);
    });
  });
});
