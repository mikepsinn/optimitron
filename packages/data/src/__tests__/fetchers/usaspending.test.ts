import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchBudgetFunctions,
  fetchBudgetSubfunctions,
  fetchSpendingByBudgetFunction,
  fetchSpendingBySubfunction,
  parseSpendingResults,
  parseSpendingAsDataPoints,
  fetchFederalBudgetByFunction,
  fetchBudgetFunctionTimeSeries,
  fetchLatestBudgetBreakdown,
  BUDGET_FUNCTIONS,
} from '../../fetchers/usaspending.js';
import type {
  SpendingExplorerResult,
  SpendingExplorerResponse,
  BudgetFunctionListResponse,
  BudgetSubfunctionListResponse,
} from '../../fetchers/usaspending.js';

// ─── Mock data ──────────────────────────────────────────────────────

const mockBudgetFunctions: BudgetFunctionListResponse = {
  results: [
    { budget_function_code: '050', budget_function_title: 'National Defense' },
    { budget_function_code: '550', budget_function_title: 'Health' },
    { budget_function_code: '500', budget_function_title: 'Education, Training, Employment, and Social Services' },
  ],
};

const mockSubfunctions: BudgetSubfunctionListResponse = {
  results: [
    { budget_subfunction_code: '051', budget_subfunction_title: 'Department of Defense-Military' },
    { budget_subfunction_code: '053', budget_subfunction_title: 'Atomic energy defense activities' },
  ],
};

const mockSpendingResults: SpendingExplorerResult[] = [
  { amount: 1358253371219.34, id: '050', type: 'budget_function', name: 'National Defense', code: '050' },
  { amount: 1098419579300.53, id: '550', type: 'budget_function', name: 'Health', code: '550' },
  { amount: 268000000000, id: '500', type: 'budget_function', name: 'Education, Training, Employment, and Social Services', code: '500' },
  { amount: 50000000, id: null, type: 'budget_function', name: 'Unreported Data', code: null },
];

const mockSpendingResponse: SpendingExplorerResponse = {
  total: 9682897699572.27,
  end_date: '2024-09-30T00:00:00Z',
  results: mockSpendingResults,
};

// ─── Tests ──────────────────────────────────────────────────────────

describe('USAspending Fetcher', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('BUDGET_FUNCTIONS', () => {
    it('contains 20 budget function codes', () => {
      expect(Object.keys(BUDGET_FUNCTIONS)).toHaveLength(20);
    });

    it('includes key functions', () => {
      expect(BUDGET_FUNCTIONS['050']).toBe('National Defense');
      expect(BUDGET_FUNCTIONS['550']).toBe('Health');
      expect(BUDGET_FUNCTIONS['500']).toBe('Education, Training, Employment, and Social Services');
      expect(BUDGET_FUNCTIONS['900']).toBe('Net Interest');
    });
  });

  describe('fetchBudgetFunctions', () => {
    it('returns budget function list on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBudgetFunctions),
      });

      const result = await fetchBudgetFunctions();
      expect(result).toHaveLength(3);
      expect(result[0]?.budget_function_code).toBe('050');
    });

    it('returns empty array on HTTP error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await fetchBudgetFunctions();
      expect(result).toEqual([]);
    });

    it('returns empty array on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await fetchBudgetFunctions();
      expect(result).toEqual([]);
    });
  });

  describe('fetchBudgetSubfunctions', () => {
    it('posts correct budget function code', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSubfunctions),
      });

      const result = await fetchBudgetSubfunctions('050');
      expect(result).toHaveLength(2);
      expect(result[0]?.budget_subfunction_code).toBe('051');

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(fetchCall?.[1]?.body as string) as Record<string, unknown>;
      expect(body['budget_function']).toBe('050');
    });

    it('returns empty array on error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('timeout'));

      const result = await fetchBudgetSubfunctions('050');
      expect(result).toEqual([]);
    });
  });

  describe('fetchSpendingByBudgetFunction', () => {
    it('returns spending data for a fiscal year', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSpendingResponse),
      });

      const result = await fetchSpendingByBudgetFunction(2024);
      expect(result.total).toBe(9682897699572.27);
      expect(result.results).toHaveLength(4);
    });

    it('sends correct request body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSpendingResponse),
      });

      await fetchSpendingByBudgetFunction(2024, 3);

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(fetchCall?.[1]?.body as string) as Record<string, unknown>;
      expect(body['type']).toBe('budget_function');
      expect(body['filters']).toEqual({ fy: '2024', quarter: '3' });
    });

    it('defaults to quarter 4', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSpendingResponse),
      });

      await fetchSpendingByBudgetFunction(2024);

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(fetchCall?.[1]?.body as string) as Record<string, unknown>;
      expect((body['filters'] as Record<string, string>)['quarter']).toBe('4');
    });

    it('returns empty response on HTTP error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
      });

      const result = await fetchSpendingByBudgetFunction(2015);
      expect(result.total).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('returns empty response on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await fetchSpendingByBudgetFunction(2024);
      expect(result.total).toBe(0);
      expect(result.results).toEqual([]);
    });
  });

  describe('fetchSpendingBySubfunction', () => {
    it('sends budget_function filter in request', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSpendingResponse),
      });

      await fetchSpendingBySubfunction(2024, '050');

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(fetchCall?.[1]?.body as string) as Record<string, unknown>;
      expect(body['type']).toBe('budget_subfunction');
      expect((body['filters'] as Record<string, string>)['budget_function']).toBe('050');
    });

    it('returns empty response on error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('timeout'));

      const result = await fetchSpendingBySubfunction(2024, '050');
      expect(result.total).toBe(0);
      expect(result.results).toEqual([]);
    });
  });

  describe('parseSpendingResults', () => {
    it('converts results to SpendingData', () => {
      const data = parseSpendingResults(mockSpendingResults, 2024);
      expect(data).toHaveLength(3); // excludes unreported
      expect(data[0]).toEqual(
        expect.objectContaining({
          jurisdictionIso3: 'USA',
          year: 2024,
          category: 'National Defense',
          amountUsd: 1358253371219.34,
          source: 'USAspending.gov',
        }),
      );
    });

    it('filters out unreported data', () => {
      const data = parseSpendingResults(mockSpendingResults, 2024);
      const names = data.map((d) => d.category);
      expect(names).not.toContain('Unreported Data');
    });

    it('filters out null code entries', () => {
      const data = parseSpendingResults(mockSpendingResults, 2024);
      expect(data).toHaveLength(3);
    });

    it('returns empty array for empty input', () => {
      expect(parseSpendingResults([], 2024)).toEqual([]);
    });
  });

  describe('parseSpendingAsDataPoints', () => {
    it('converts results to DataPoint array', () => {
      const points = parseSpendingAsDataPoints(mockSpendingResults, 2024);
      expect(points).toHaveLength(3);
      expect(points[0]).toEqual(
        expect.objectContaining({
          jurisdictionIso3: 'USA',
          year: 2024,
          value: 1358253371219.34,
          unit: 'USD',
          source: 'USAspending.gov (National Defense)',
        }),
      );
    });

    it('includes sourceUrl', () => {
      const points = parseSpendingAsDataPoints(mockSpendingResults, 2024);
      expect(points[0]?.sourceUrl).toBe('https://www.usaspending.gov/explorer/budget_function');
    });

    it('filters out unreported data', () => {
      const points = parseSpendingAsDataPoints(mockSpendingResults, 2024);
      expect(points).toHaveLength(3);
    });
  });

  describe('fetchFederalBudgetByFunction', () => {
    it('fetches multiple years and combines results', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSpendingResponse),
      });

      const data = await fetchFederalBudgetByFunction({
        period: { startYear: 2022, endYear: 2023 },
      });

      // 3 valid results per year × 2 years = 6
      expect(data).toHaveLength(6);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it('clamps start year to 2017', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSpendingResponse),
      });

      await fetchFederalBudgetByFunction({
        period: { startYear: 2010, endYear: 2018 },
      });

      // 2017, 2018 = 2 calls (clamped from 2010)
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchBudgetFunctionTimeSeries', () => {
    it('extracts a single function across years', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSpendingResponse),
      });

      const points = await fetchBudgetFunctionTimeSeries('050', {
        period: { startYear: 2022, endYear: 2023 },
      });

      expect(points).toHaveLength(2);
      expect(points[0]).toEqual(
        expect.objectContaining({
          jurisdictionIso3: 'USA',
          year: 2022,
          value: 1358253371219.34,
          source: 'USAspending.gov (National Defense)',
        }),
      );
    });

    it('returns empty when function code not in results', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            total: 0,
            end_date: '',
            results: [],
          }),
      });

      const points = await fetchBudgetFunctionTimeSeries('050', {
        period: { startYear: 2022, endYear: 2022 },
      });

      expect(points).toEqual([]);
    });
  });

  describe('fetchLatestBudgetBreakdown', () => {
    it('returns a map of function name to amount', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSpendingResponse),
      });

      const breakdown = await fetchLatestBudgetBreakdown(2024);
      expect(breakdown.get('National Defense')).toBe(1358253371219.34);
      expect(breakdown.get('Health')).toBe(1098419579300.53);
      expect(breakdown.has('Unreported Data')).toBe(false);
      expect(breakdown.size).toBe(3);
    });
  });
});
