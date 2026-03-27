import { describe, it, expect } from 'vitest';
import {
  parseGapminderCsv,
  CsvTimeSeriesSchema,
  type CsvTimeSeries,
} from '../csv-loader';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const SIMPLE_CSV = [
  'country,2000,2001,2002',
  'Alpha,10,20,30',
  'Beta,40,,60',
].join('\n');

const LIFE_EXPECTANCY_SNIPPET = [
  'country,1800,1900,2000,2020',
  'Afghanistan,28.2,29.4,54.6,64.4',
  'Albania,35.4,35.4,74.9,78.6',
  'Andorra,,,,82.3',
].join('\n');

const EMPTY_CSV = '';
const HEADER_ONLY = 'country,2000,2001\n';

const QUOTED_FIELDS_CSV = [
  'country,2000,2001',
  '"Korea, Rep.",50.5,51.2',
  '"Congo, Dem. Rep.",45.1,45.3',
].join('\n');

const NON_NUMERIC_VALUES = [
  'country,2000,2001,2002',
  'TestLand,10,N/A,30',
  'Foobar,abc,,20',
].join('\n');

const CRLF_CSV = 'country,2000,2001\r\nAlpha,1,2\r\nBeta,3,4\r\n';

// ── Tests ────────────────────────────────────────────────────────────────────

describe('parseGapminderCsv', () => {
  it('parses a simple CSV correctly', () => {
    const result = parseGapminderCsv(SIMPLE_CSV, { datasetId: 'test' });

    expect(result).toHaveLength(2);

    const alpha = result[0]!;
    expect(alpha.variableId).toBe('test:Alpha');
    expect(alpha.name).toBe('Alpha');
    expect(alpha.measurements).toEqual([
      { timestamp: 2000, value: 10 },
      { timestamp: 2001, value: 20 },
      { timestamp: 2002, value: 30 },
    ]);

    const beta = result[1]!;
    expect(beta.variableId).toBe('test:Beta');
    expect(beta.measurements).toHaveLength(2); // skips empty cell
    expect(beta.measurements).toEqual([
      { timestamp: 2000, value: 40 },
      { timestamp: 2002, value: 60 },
    ]);
  });

  it('handles missing values (empty cells)', () => {
    const result = parseGapminderCsv(LIFE_EXPECTANCY_SNIPPET, {
      datasetId: 'life_exp',
    });

    expect(result).toHaveLength(3);

    // Andorra has data only for 2020
    const andorra = result.find(ts => ts.name === 'Andorra');
    expect(andorra).toBeDefined();
    expect(andorra!.measurements).toHaveLength(1);
    expect(andorra!.measurements[0]).toEqual({ timestamp: 2020, value: 82.3 });
  });

  it('returns empty array for empty input', () => {
    expect(parseGapminderCsv(EMPTY_CSV)).toEqual([]);
  });

  it('returns empty array for header-only input', () => {
    expect(parseGapminderCsv(HEADER_ONLY)).toEqual([]);
  });

  it('handles quoted fields with commas', () => {
    const result = parseGapminderCsv(QUOTED_FIELDS_CSV, { datasetId: 'q' });

    expect(result).toHaveLength(2);

    const korea = result[0]!;
    expect(korea.name).toBe('Korea, Rep.');
    expect(korea.variableId).toBe('q:Korea, Rep.');
    expect(korea.measurements).toEqual([
      { timestamp: 2000, value: 50.5 },
      { timestamp: 2001, value: 51.2 },
    ]);
  });

  it('skips non-numeric values gracefully', () => {
    const result = parseGapminderCsv(NON_NUMERIC_VALUES, {
      datasetId: 'nan',
    });

    expect(result).toHaveLength(2);

    const testLand = result[0]!;
    // "N/A" is skipped
    expect(testLand.measurements).toEqual([
      { timestamp: 2000, value: 10 },
      { timestamp: 2002, value: 30 },
    ]);

    const foobar = result[1]!;
    // "abc" is skipped, empty is skipped
    expect(foobar.measurements).toEqual([{ timestamp: 2002, value: 20 }]);
  });

  it('handles CRLF line endings', () => {
    const result = parseGapminderCsv(CRLF_CSV, { datasetId: 'crlf' });
    expect(result).toHaveLength(2);
    expect(result[0]!.measurements).toHaveLength(2);
  });

  it('passes optional metadata through', () => {
    const result = parseGapminderCsv(SIMPLE_CSV, {
      datasetId: 'ds',
      category: 'health',
      unit: 'years',
      source: 'test-source',
    });

    const ts = result[0]!;
    expect(ts.category).toBe('health');
    expect(ts.unit).toBe('years');
    expect(ts.source).toBe('test-source');
  });

  it('uses "unknown" as default datasetId', () => {
    const result = parseGapminderCsv(SIMPLE_CSV);
    expect(result[0]!.variableId).toBe('unknown:Alpha');
  });

  it('produces output conforming to CsvTimeSeriesSchema', () => {
    const result = parseGapminderCsv(SIMPLE_CSV, {
      datasetId: 'schema-test',
      category: 'health',
    });

    for (const ts of result) {
      const parsed = CsvTimeSeriesSchema.safeParse(ts);
      expect(parsed.success).toBe(true);
    }
  });

  it('handles large year ranges (1800-2100)', () => {
    // Build a header with years 1800-1805 and one data row
    const header = 'country,1800,1801,1802,1803,1804,1805';
    const row = 'TestCountry,1.1,2.2,3.3,,5.5,6.6';
    const csv = `${header}\n${row}`;

    const result = parseGapminderCsv(csv, { datasetId: 'wide' });
    expect(result).toHaveLength(1);
    expect(result[0]!.measurements).toHaveLength(5); // one missing
    expect(result[0]!.measurements[0]).toEqual({
      timestamp: 1800,
      value: 1.1,
    });
  });

  it('skips rows with empty country name', () => {
    const csv = 'country,2000\n,10\nReal,20\n';
    const result = parseGapminderCsv(csv);
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('Real');
  });
});

describe('CsvTimeSeriesSchema validation', () => {
  it('accepts a valid CsvTimeSeries object', () => {
    const ts: CsvTimeSeries = {
      variableId: 'test:USA',
      name: 'USA',
      measurements: [
        { timestamp: 2000, value: 75.5 },
        { timestamp: 2001, value: 76.0 },
      ],
      category: 'health',
      unit: 'years',
      source: 'test',
    };
    expect(CsvTimeSeriesSchema.safeParse(ts).success).toBe(true);
  });

  it('rejects non-integer timestamp', () => {
    const ts = {
      variableId: 'test:USA',
      name: 'USA',
      measurements: [{ timestamp: 2000.5, value: 75.5 }],
    };
    expect(CsvTimeSeriesSchema.safeParse(ts).success).toBe(false);
  });
});
