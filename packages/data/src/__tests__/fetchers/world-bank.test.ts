import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchWorldBankPage,
  fetchWorldBankIndicator,
  parseWorldBankRecords,
  fetchLifeExpectancy,
  fetchGdpPerCapita,
  fetchHealthExpenditure,
  fetchCO2Emissions,
  WB_INDICATOR_CODES,
} from '../../fetchers/world-bank.js';
import type { WBRecord, WBMeta } from '../../fetchers/world-bank.js';

// ─── Mock data ──────────────────────────────────────────────────────

const mockMeta: WBMeta = {
  page: 1,
  pages: 1,
  per_page: 1000,
  total: 3,
};

const mockRecords: WBRecord[] = [
  {
    indicator: { id: 'SP.DYN.LE00.IN', value: 'Life expectancy at birth, total (years)' },
    country: { id: 'US', value: 'United States' },
    countryiso3code: 'USA',
    date: '2021',
    value: 77.0,
    unit: '',
    obs_status: '',
    decimal: 1,
  },
  {
    indicator: { id: 'SP.DYN.LE00.IN', value: 'Life expectancy at birth, total (years)' },
    country: { id: 'GB', value: 'United Kingdom' },
    countryiso3code: 'GBR',
    date: '2021',
    value: 80.7,
    unit: '',
    obs_status: '',
    decimal: 1,
  },
  {
    indicator: { id: 'SP.DYN.LE00.IN', value: 'Life expectancy at birth, total (years)' },
    country: { id: 'DE', value: 'Germany' },
    countryiso3code: 'DEU',
    date: '2021',
    value: null,
    unit: '',
    obs_status: '',
    decimal: 1,
  },
];

const multiPageMeta: WBMeta = {
  page: 1,
  pages: 2,
  per_page: 2,
  total: 4,
};

const page1Records: WBRecord[] = [
  {
    indicator: { id: 'SP.DYN.LE00.IN', value: 'Life expectancy' },
    country: { id: 'US', value: 'United States' },
    countryiso3code: 'USA',
    date: '2020',
    value: 77.0,
    unit: '',
    obs_status: '',
    decimal: 1,
  },
  {
    indicator: { id: 'SP.DYN.LE00.IN', value: 'Life expectancy' },
    country: { id: 'US', value: 'United States' },
    countryiso3code: 'USA',
    date: '2021',
    value: 77.3,
    unit: '',
    obs_status: '',
    decimal: 1,
  },
];

const page2Meta: WBMeta = {
  page: 2,
  pages: 2,
  per_page: 2,
  total: 4,
};

const page2Records: WBRecord[] = [
  {
    indicator: { id: 'SP.DYN.LE00.IN', value: 'Life expectancy' },
    country: { id: 'GB', value: 'United Kingdom' },
    countryiso3code: 'GBR',
    date: '2020',
    value: 80.4,
    unit: '',
    obs_status: '',
    decimal: 1,
  },
  {
    indicator: { id: 'SP.DYN.LE00.IN', value: 'Life expectancy' },
    country: { id: 'GB', value: 'United Kingdom' },
    countryiso3code: 'GBR',
    date: '2021',
    value: 80.7,
    unit: '',
    obs_status: '',
    decimal: 1,
  },
];

// ─── Tests ──────────────────────────────────────────────────────────

describe('World Bank Fetcher', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('parseWorldBankRecords', () => {
    it('converts valid records to DataPoint array', () => {
      const points = parseWorldBankRecords(mockRecords, 'SP.DYN.LE00.IN');
      // Third record has null value, should be filtered
      expect(points).toHaveLength(2);
      expect(points[0]).toEqual(
        expect.objectContaining({
          jurisdictionIso3: 'USA',
          year: 2021,
          value: 77.0,
          source: 'World Bank WDI (SP.DYN.LE00.IN)',
        }),
      );
    });

    it('skips records with null values', () => {
      const points = parseWorldBankRecords(mockRecords, 'SP.DYN.LE00.IN');
      const deuPoints = points.filter((p) => p.jurisdictionIso3 === 'DEU');
      expect(deuPoints).toHaveLength(0);
    });

    it('returns empty array for empty input', () => {
      expect(parseWorldBankRecords([], 'test')).toEqual([]);
    });

    it('includes sourceUrl', () => {
      const points = parseWorldBankRecords(mockRecords, 'SP.DYN.LE00.IN');
      expect(points[0]?.sourceUrl).toBe(
        'https://data.worldbank.org/indicator/SP.DYN.LE00.IN',
      );
    });
  });

  describe('fetchWorldBankPage', () => {
    it('returns [meta, records] on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([mockMeta, mockRecords]),
      });

      const result = await fetchWorldBankPage('SP.DYN.LE00.IN', 'all', 2020, 2021, 1, 1000);
      expect(result).not.toBeNull();
      expect(result?.[0]).toEqual(mockMeta);
      expect(result?.[1]).toHaveLength(3);
    });

    it('returns null on HTTP error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await fetchWorldBankPage('INVALID', 'all', 2020, 2021, 1, 1000);
      expect(result).toBeNull();
    });

    it('returns null on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await fetchWorldBankPage('SP.DYN.LE00.IN', 'all', 2020, 2021, 1, 1000);
      expect(result).toBeNull();
    });

    it('returns null when API returns error message format', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ message: [{ id: '120', key: 'Invalid value' }] }]),
      });

      const result = await fetchWorldBankPage('INVALID', 'all', 2020, 2021, 1, 1000);
      expect(result).toBeNull();
    });
  });

  describe('fetchWorldBankIndicator — pagination', () => {
    it('fetches single page when pages=1', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([mockMeta, mockRecords]),
      });

      const result = await fetchWorldBankIndicator('SP.DYN.LE00.IN', {
        period: { startYear: 2021, endYear: 2021 },
      });
      expect(result).toHaveLength(2); // one null filtered
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('fetches all pages when pages > 1', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([multiPageMeta, page1Records]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([page2Meta, page2Records]),
        });

      globalThis.fetch = fetchMock;

      const result = await fetchWorldBankIndicator('SP.DYN.LE00.IN', {
        period: { startYear: 2020, endYear: 2021 },
      });
      expect(result).toHaveLength(4);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('skips pagination when limit is set', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([multiPageMeta, page1Records]),
      });

      const result = await fetchWorldBankIndicator('SP.DYN.LE00.IN', {
        period: { startYear: 2020, endYear: 2021 },
        limit: 2,
      });
      expect(result).toHaveLength(2);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when first page fails', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await fetchWorldBankIndicator('SP.DYN.LE00.IN');
      expect(result).toEqual([]);
    });
  });

  describe('convenience helpers', () => {
    beforeEach(() => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([mockMeta, mockRecords]),
      });
    });

    it('fetchCO2Emissions returns data', async () => {
      const result = await fetchCO2Emissions();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.source).toBe('World Bank WDI (EN.ATM.CO2E.PC)');
    });

    it('fetchLifeExpectancy uses correct indicator', async () => {
      await fetchLifeExpectancy();
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain(WB_INDICATOR_CODES.LIFE_EXPECTANCY);
    });

    it('fetchGdpPerCapita uses correct indicator', async () => {
      await fetchGdpPerCapita();
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain(WB_INDICATOR_CODES.GDP_PER_CAPITA_PPP);
    });

    it('fetchHealthExpenditure uses correct indicator', async () => {
      await fetchHealthExpenditure();
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain(WB_INDICATOR_CODES.HEALTH_EXPENDITURE_PCT_GDP);
    });

    it('passes jurisdictions filter to URL', async () => {
      await fetchLifeExpectancy({ jurisdictions: ['USA', 'GBR'] });
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain('country/USA;GBR');
    });
  });
});
