/**
 * Tests that the legacy sources/oecd.ts fetchOECDHealthExpenditure properly throws
 * instead of silently returning empty results.
 *
 * The actual OECD data fetching is handled by fetchers/oecd.ts (tested separately).
 * This test just ensures the legacy stub is explicit about being unimplemented.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchOECDHealthExpenditure } from '../../sources/oecd.js';

describe('sources/oecd — fetchOECDHealthExpenditure stub', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws an error when the response is successfully fetched (not silently empty)', async () => {
    // Mock fetch to return valid response so we reach the parse step
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ dataSets: [{ observations: {} }], structure: { dimensions: { observation: [] } } }),
    }) as unknown as typeof fetch;

    await expect(
      fetchOECDHealthExpenditure({ jurisdictions: ['USA'] }),
    ).rejects.toThrow('OECD health expenditure parsing not yet implemented');
  });

  it('returns empty array when no OECD jurisdictions match', async () => {
    // No OECD member in list → short-circuits before fetch
    const result = await fetchOECDHealthExpenditure({ jurisdictions: ['ZZZ'] });
    expect(result).toEqual([]);
  });
});
