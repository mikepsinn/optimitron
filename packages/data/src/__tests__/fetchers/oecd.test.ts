import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseSDMXResponse, fetchOECDData, fetchOECDHealthExpenditure, fetchOECDEducationSpending, fetchOECDGdpPerCapita, OECD_DATASETS } from '../../fetchers/oecd.js';
import type { SDMXJsonResponse } from '../../fetchers/oecd.js';

// ─── Mock data ──────────────────────────────────────────────────────

/** Flat observation layout (dimensionAtObservation=AllDimensions) */
const flatObsResponse: SDMXJsonResponse = {
  data: {
    dataSets: [
      {
        observations: {
          '0:0:0': [9.8],
          '0:0:1': [10.1],
          '1:0:0': [11.2],
          '1:0:1': [11.5],
        },
      },
    ],
  },
  structure: {
    dimensions: {
      observation: [
        {
          id: 'REF_AREA',
          values: [
            { id: 'USA', name: 'United States' },
            { id: 'GBR', name: 'United Kingdom' },
          ],
        },
        {
          id: 'MEASURE',
          values: [{ id: 'HCTOT', name: 'Health Total' }],
        },
        {
          id: 'TIME_PERIOD',
          values: [
            { id: '2020', name: '2020' },
            { id: '2021', name: '2021' },
          ],
        },
      ],
    },
  },
};

/** Series observation layout */
const seriesObsResponse: SDMXJsonResponse = {
  data: {
    dataSets: [
      {
        series: {
          '0': {
            observations: {
              '0': [16.7],
              '1': [17.0],
            },
          },
          '1': {
            observations: {
              '0': [10.2],
              '1': [10.5],
            },
          },
        },
      },
    ],
  },
  structure: {
    dimensions: {
      series: [
        {
          id: 'REF_AREA',
          values: [
            { id: 'USA', name: 'United States' },
            { id: 'DEU', name: 'Germany' },
          ],
        },
      ],
      observation: [
        {
          id: 'TIME_PERIOD',
          values: [
            { id: '2019', name: '2019' },
            { id: '2020', name: '2020' },
          ],
        },
      ],
    },
  },
};

// ─── Tests ──────────────────────────────────────────────────────────

describe('OECD Fetcher', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('parseSDMXResponse — flat observations', () => {
    it('parses flat observation layout into DataPoint array', () => {
      const points = parseSDMXResponse(flatObsResponse, 'OECD Test');
      expect(points).toHaveLength(4);
      expect(points).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ jurisdictionIso3: 'USA', year: 2020, value: 9.8 }),
          expect.objectContaining({ jurisdictionIso3: 'USA', year: 2021, value: 10.1 }),
          expect.objectContaining({ jurisdictionIso3: 'GBR', year: 2020, value: 11.2 }),
          expect.objectContaining({ jurisdictionIso3: 'GBR', year: 2021, value: 11.5 }),
        ]),
      );
      // Check source attribution
      for (const p of points) {
        expect(p.source).toBe('OECD Test');
      }
    });

    it('returns empty array for missing data', () => {
      expect(parseSDMXResponse({}, 'test')).toEqual([]);
      expect(parseSDMXResponse({ data: {} }, 'test')).toEqual([]);
      expect(parseSDMXResponse({ data: { dataSets: [] } }, 'test')).toEqual([]);
    });

    it('skips NaN values', () => {
      const response: SDMXJsonResponse = {
        data: {
          dataSets: [{ observations: { '0:0': [NaN] } }],
        },
        structure: {
          dimensions: {
            observation: [
              { id: 'REF_AREA', values: [{ id: 'USA', name: 'US' }] },
              { id: 'TIME_PERIOD', values: [{ id: '2020', name: '2020' }] },
            ],
          },
        },
      };
      expect(parseSDMXResponse(response, 'test')).toEqual([]);
    });
  });

  describe('parseSDMXResponse — series observations', () => {
    it('parses series observation layout into DataPoint array', () => {
      const points = parseSDMXResponse(seriesObsResponse, 'OECD Series');
      expect(points).toHaveLength(4);
      expect(points).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ jurisdictionIso3: 'USA', year: 2019, value: 16.7 }),
          expect.objectContaining({ jurisdictionIso3: 'USA', year: 2020, value: 17.0 }),
          expect.objectContaining({ jurisdictionIso3: 'DEU', year: 2019, value: 10.2 }),
          expect.objectContaining({ jurisdictionIso3: 'DEU', year: 2020, value: 10.5 }),
        ]),
      );
    });
  });

  describe('fetchOECDData', () => {
    it('returns parsed data on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(flatObsResponse),
      });

      const result = await fetchOECDData('test/flow', 'USA.HCTOT.PT_B1GQ', {
        period: { startYear: 2020, endYear: 2021 },
      });

      expect(result).toHaveLength(4);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain('test/flow');
      expect(callUrl).toContain('startPeriod=2020');
      expect(callUrl).toContain('endPeriod=2021');
    });

    it('returns empty array on HTTP error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await fetchOECDData('test/flow', 'USA.HCTOT.PT_B1GQ');
      expect(result).toEqual([]);
    });

    it('returns empty array on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

      const result = await fetchOECDData('test/flow', 'USA.HCTOT.PT_B1GQ');
      expect(result).toEqual([]);
    });
  });

  describe('convenience helpers', () => {
    beforeEach(() => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(flatObsResponse),
      });
    });

    it('fetchOECDHealthExpenditure calls with correct dataflow', async () => {
      await fetchOECDHealthExpenditure({ jurisdictions: ['USA'] });
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain(OECD_DATASETS.HEALTH_EXPENDITURE.dataflow);
    });

    it('fetchOECDEducationSpending calls with correct dataflow', async () => {
      await fetchOECDEducationSpending({ jurisdictions: ['GBR'] });
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain(OECD_DATASETS.EDUCATION_SPENDING.dataflow);
    });

    it('fetchOECDGdpPerCapita calls with correct dataflow', async () => {
      await fetchOECDGdpPerCapita({ jurisdictions: ['DEU'] });
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain(OECD_DATASETS.GDP_PER_CAPITA.dataflow);
    });
  });
});
