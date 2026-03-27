import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseFREDObservations,
  fetchFREDSeries,
  fetchUnemployment,
  fetchInflation,
  fetchGDPGrowth,
  getFREDApiKey,
  FRED_SERIES,
} from '../../fetchers/fred';
import type { FREDObservation, FREDObservationsResponse } from '../../fetchers/fred';

// ─── Mock data ──────────────────────────────────────────────────────

const mockObservations: FREDObservation[] = [
  { realtime_start: '2024-01-01', realtime_end: '2024-01-01', date: '2020-01-01', value: '3.5' },
  { realtime_start: '2024-01-01', realtime_end: '2024-01-01', date: '2020-02-01', value: '3.6' },
  { realtime_start: '2024-01-01', realtime_end: '2024-01-01', date: '2020-03-01', value: '.' }, // missing
  { realtime_start: '2024-01-01', realtime_end: '2024-01-01', date: '2021-01-01', value: '6.7' },
];

const mockFREDResponse: FREDObservationsResponse = {
  realtime_start: '2020-01-01',
  realtime_end: '2021-12-31',
  observation_start: '2020-01-01',
  observation_end: '2021-12-31',
  units: 'lin',
  output_type: 1,
  file_type: 'json',
  order_by: 'observation_date',
  sort_order: 'asc',
  count: 4,
  offset: 0,
  limit: 100000,
  observations: mockObservations,
};

// ─── Tests ──────────────────────────────────────────────────────────

describe('FRED Fetcher', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env['FRED_API_KEY'];

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env['FRED_API_KEY'] = 'test-key-123';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalEnv !== undefined) {
      process.env['FRED_API_KEY'] = originalEnv;
    } else {
      delete process.env['FRED_API_KEY'];
    }
  });

  describe('getFREDApiKey', () => {
    it('returns the API key from env', () => {
      process.env['FRED_API_KEY'] = 'my-key';
      expect(getFREDApiKey()).toBe('my-key');
    });

    it('returns null when not set', () => {
      delete process.env['FRED_API_KEY'];
      expect(getFREDApiKey()).toBeNull();
    });
  });

  describe('parseFREDObservations', () => {
    it('converts valid observations to DataPoint array', () => {
      const points = parseFREDObservations(mockObservations, 'UNRATE');
      expect(points).toHaveLength(3);
      expect(points[0]).toEqual(
        expect.objectContaining({
          jurisdictionIso3: 'USA',
          year: 2020,
          value: 3.5,
          source: 'FRED (UNRATE)',
        }),
      );
    });

    it('filters out missing values (represented as ".")', () => {
      const points = parseFREDObservations(mockObservations, 'UNRATE');
      const allValues = points.map((p) => p.value);
      expect(allValues).not.toContain(NaN);
      expect(points).toHaveLength(3);
    });

    it('all results are attributed to USA', () => {
      const points = parseFREDObservations(mockObservations, 'TEST');
      for (const p of points) {
        expect(p.jurisdictionIso3).toBe('USA');
      }
    });

    it('includes sourceUrl', () => {
      const points = parseFREDObservations(mockObservations, 'UNRATE');
      expect(points[0]?.sourceUrl).toBe('https://fred.stlouisfed.org/series/UNRATE');
    });

    it('returns empty array for empty input', () => {
      expect(parseFREDObservations([], 'test')).toEqual([]);
    });

    it('extracts year from date string', () => {
      const points = parseFREDObservations(mockObservations, 'UNRATE');
      const years = points.map((p) => p.year);
      expect(years).toContain(2020);
      expect(years).toContain(2021);
    });
  });

  describe('fetchFREDSeries', () => {
    it('returns parsed data on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFREDResponse),
      });

      const result = await fetchFREDSeries('UNRATE', {
        period: { startYear: 2020, endYear: 2021 },
      });
      expect(result).toHaveLength(3);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain('series_id=UNRATE');
      expect(callUrl).toContain('api_key=test-key-123');
      expect(callUrl).toContain('observation_start=2020-01-01');
      expect(callUrl).toContain('observation_end=2021-12-31');
    });

    it('returns empty array when API key is missing', async () => {
      delete process.env['FRED_API_KEY'];

      globalThis.fetch = vi.fn();
      const result = await fetchFREDSeries('UNRATE');
      expect(result).toEqual([]);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('returns empty array on HTTP error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      const result = await fetchFREDSeries('UNRATE');
      expect(result).toEqual([]);
    });

    it('returns empty array on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await fetchFREDSeries('UNRATE');
      expect(result).toEqual([]);
    });
  });

  describe('convenience helpers', () => {
    beforeEach(() => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFREDResponse),
      });
    });

    it('fetchUnemployment uses correct series', async () => {
      await fetchUnemployment();
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain(`series_id=${FRED_SERIES.UNEMPLOYMENT}`);
    });

    it('fetchInflation uses correct series', async () => {
      await fetchInflation();
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain(`series_id=${FRED_SERIES.CPI}`);
    });

    it('fetchGDPGrowth uses correct series', async () => {
      await fetchGDPGrowth();
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain(`series_id=${FRED_SERIES.GDP_GROWTH}`);
    });

    it('gracefully degrades when API key missing', async () => {
      delete process.env['FRED_API_KEY'];
      const result = await fetchUnemployment();
      expect(result).toEqual([]);
    });
  });
});
