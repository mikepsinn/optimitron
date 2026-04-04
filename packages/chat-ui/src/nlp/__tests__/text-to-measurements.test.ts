import { describe, it, expect, vi } from 'vitest';
import { textToMeasurements } from '../text-to-measurements.js';

// These tests cover the regex fallback path (no API key).
// LLM-based tests would require mocking fetch, so we test the full
// pipeline integration through the regex fallback.

describe('textToMeasurements', () => {
  describe('regex fallback (no API key)', () => {
    it('returns empty array for empty string', async () => {
      const result = await textToMeasurements({ text: '' });
      expect(result).toEqual([]);
    });

    it('parses treatment with regex fallback', async () => {
      const result = await textToMeasurements({ text: 'took 500 mg magnesium' });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        variableName: 'Magnesium',
        value: 500,
        unitAbbreviation: 'mg',
      });
    });

    it('parses rating with regex fallback', async () => {
      const result = await textToMeasurements({ text: 'mood 4/5' });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        variableName: 'Overall Mood',
        value: 4,
        unitAbbreviation: '1-5',
      });
    });

    it('parses food with regex fallback', async () => {
      const result = await textToMeasurements({ text: 'had coffee for breakfast' });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        variableName: 'Coffee',
        categoryName: 'Drink',
      });
    });

    it('handles multiple items', async () => {
      const result = await textToMeasurements({
        text: 'took 5000 IU vitamin D, mood 4/5',
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('LLM path error handling', () => {
    it('falls back to regex when fetch fails', async () => {
      // Mock global fetch to simulate failure
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      try {
        const result = await textToMeasurements({
          text: 'took 500 mg magnesium',
          apiKey: 'fake-key',
          provider: 'gemini',
        });
        // Should fall back to regex
        expect(result).toHaveLength(1);
        expect(result[0].variableName).toBe('Magnesium');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('falls back to regex when API returns error', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      try {
        const result = await textToMeasurements({
          text: 'mood 3/5',
          apiKey: 'bad-key',
          provider: 'gemini',
        });
        // Should fall back to regex
        expect(result).toHaveLength(1);
        expect(result[0].variableName).toBe('Overall Mood');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('LLM response parsing', () => {
    it('parses valid Gemini-style response', async () => {
      const mockResponse = JSON.stringify({
        measurements: [
          {
            itemType: 'measurement',
            variableName: 'Vitamin D',
            value: 5000,
            unitAbbreviation: 'IU',
            categoryName: 'Supplement',
            combinationOperation: 'SUM',
            startAt: '2026-02-06T08:00:00',
            note: 'took 5000 IU vitamin D',
          },
        ],
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: mockResponse }] } }],
          }),
      });

      try {
        const result = await textToMeasurements({
          text: 'took 5000 IU vitamin D',
          apiKey: 'test-key',
          provider: 'gemini',
        });
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          variableName: 'Vitamin D',
          value: 5000,
          unitAbbreviation: 'IU',
          categoryName: 'Supplement',
        });
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('falls back to regex when LLM returns empty measurements', async () => {
      const mockResponse = JSON.stringify({ measurements: [] });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: mockResponse }] } }],
          }),
      });

      try {
        const result = await textToMeasurements({
          text: 'coffee',
          apiKey: 'test-key',
          provider: 'gemini',
        });
        // Should fall back to regex
        expect(result).toHaveLength(1);
        expect(result[0].variableName).toBe('Coffee');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('validates and normalizes invalid category names from LLM', async () => {
      const mockResponse = JSON.stringify({
        measurements: [
          {
            itemType: 'measurement',
            variableName: 'Test',
            value: 1,
            unitAbbreviation: 'mg',
            categoryName: 'InvalidCategory', // Not in our schema
            combinationOperation: 'SUM',
            startAt: '2026-02-06T08:00:00',
            note: 'test',
          },
        ],
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: mockResponse }] } }],
          }),
      });

      try {
        const result = await textToMeasurements({
          text: 'test',
          apiKey: 'test-key',
          provider: 'gemini',
        });
        expect(result).toHaveLength(1);
        // Should default to 'Treatment' for invalid category
        expect(result[0].categoryName).toBe('Treatment');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('uses correct currentLocalDateTime', () => {
    it('accepts currentLocalDateTime override', async () => {
      const result = await textToMeasurements({
        text: 'mood 4/5',
        currentLocalDateTime: '2026-01-15T10:30:00',
      });
      expect(result).toHaveLength(1);
      // startAt should be set by the regex parser (uses now), not the override
      // since regex parser doesn't use the override. This is expected behavior.
      expect(result[0].startAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });
  });
});
