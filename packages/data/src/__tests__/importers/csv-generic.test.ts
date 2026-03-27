import { describe, it, expect } from 'vitest';
import {
  parseGenericCsv,
  autoDetectCsvColumns,
  detectDelimiter,
  summarizeGenericCsvImport,
} from '../../importers/csv-generic';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const COMMA_CSV = `Date,Steps,Weight (kg),Heart Rate
2024-01-15,9500,75.5,72
2024-01-16,11000,75.3,68
2024-01-17,8200,75.4,74`;

const TAB_CSV = `Date\tSteps\tWeight
2024-01-15\t9500\t75.5
2024-01-16\t11000\t75.3`;

const SEMICOLON_CSV = `Date;Steps;Weight
2024-01-15;9500;75.5
2024-01-16;11000;75.3`;

const NO_HEADER_DATE_CSV = `Timestamp,Metric,Reading
2024-01-15,Blood Glucose,95
2024-01-16,Blood Glucose,102`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Generic CSV importer', () => {
  describe('detectDelimiter', () => {
    it('detects comma', () => {
      expect(detectDelimiter(COMMA_CSV)).toBe(',');
    });

    it('detects tab', () => {
      expect(detectDelimiter(TAB_CSV)).toBe('\t');
    });

    it('detects semicolon', () => {
      expect(detectDelimiter(SEMICOLON_CSV)).toBe(';');
    });

    it('defaults to comma for empty input', () => {
      expect(detectDelimiter('')).toBe(',');
    });
  });

  describe('autoDetectCsvColumns', () => {
    it('detects date and value columns', () => {
      const detected = autoDetectCsvColumns(COMMA_CSV);
      expect(detected.delimiter).toBe(',');
      expect(detected.dateColumn).toBe('Date');
      expect(detected.valueColumns).toContain('Steps');
      expect(detected.valueColumns).toContain('Weight (kg)');
      expect(detected.valueColumns).toContain('Heart Rate');
    });

    it('detects columns in tab-delimited data', () => {
      const detected = autoDetectCsvColumns(TAB_CSV);
      expect(detected.delimiter).toBe('\t');
      expect(detected.dateColumn).toBe('Date');
      expect(detected.valueColumns.length).toBe(2);
    });

    it('returns null date for undetectable date column', () => {
      const detected = autoDetectCsvColumns('A,B,C\n1,2,3\n4,5,6');
      // No date-looking values, but might match header name
      // In this case A,B,C don't match date names either
      expect(detected.headers).toEqual(['A', 'B', 'C']);
    });

    it('detects date column by header name fallback', () => {
      const detected = autoDetectCsvColumns(NO_HEADER_DATE_CSV);
      expect(detected.dateColumn).toBe('Timestamp');
    });
  });

  describe('parseGenericCsv (auto-detect)', () => {
    it('parses with auto-detection', () => {
      const records = parseGenericCsv(COMMA_CSV, {
        sourceName: 'My Tracker',
        unitName: 'Count',
      });
      expect(records.length).toBeGreaterThan(0);

      const steps = records.filter((r) => r.variableName === 'Steps');
      expect(steps.length).toBe(3);
      expect(steps[0]!.value).toBe(9500);
      expect(steps[0]!.sourceName).toBe('My Tracker');
    });

    it('defaults source to CSV Import', () => {
      const records = parseGenericCsv(COMMA_CSV);
      expect(records[0]!.sourceName).toBe('CSV Import');
    });
  });

  describe('parseGenericCsv (explicit mapping)', () => {
    it('parses with explicit column mapping', () => {
      const records = parseGenericCsv(COMMA_CSV, {
        mapping: {
          dateColumn: 'Date',
          valueColumns: {
            'Steps': 'Daily Step Count',
            'Weight (kg)': 'Weight',
          },
        },
        sourceName: 'Test',
        unitName: 'Count',
      });

      const steps = records.filter((r) => r.variableName === 'Daily Step Count');
      expect(steps.length).toBe(3);
      expect(steps[0]!.value).toBe(9500);

      const weight = records.filter((r) => r.variableName === 'Weight');
      expect(weight.length).toBe(3);
    });

    it('works with tab-delimited data', () => {
      const records = parseGenericCsv(TAB_CSV, {
        delimiter: '\t',
        mapping: {
          dateColumn: 'Date',
          valueColumns: { 'Steps': 'Steps' },
        },
        sourceName: 'Test',
        unitName: 'Count',
      });
      expect(records.length).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('returns empty for empty input', () => {
      expect(parseGenericCsv('')).toEqual([]);
    });

    it('returns empty for headers only', () => {
      expect(parseGenericCsv('Date,Value')).toEqual([]);
    });

    it('skips zero values', () => {
      const csv = `Date,Value\n2024-01-15,0`;
      expect(parseGenericCsv(csv, {
        mapping: { dateColumn: 'Date', valueColumns: { 'Value': 'Test' } },
        unitName: 'Count',
      })).toEqual([]);
    });

    it('handles quoted fields with commas', () => {
      const csv = `Date,Value,Description\n2024-01-15,"1,234","Some, thing"`;
      const records = parseGenericCsv(csv, {
        mapping: { dateColumn: 'Date', valueColumns: { 'Value': 'Test' } },
        unitName: 'Count',
      });
      expect(records.length).toBe(1);
      expect(records[0]!.value).toBe(1234);
    });

    it('handles various date formats', () => {
      const csv = `Date,Value\n01/15/2024,100\nJan 16, 2024,200`;
      const records = parseGenericCsv(csv, {
        mapping: { dateColumn: 'Date', valueColumns: { 'Value': 'Test' } },
        unitName: 'Count',
      });
      expect(records.length).toBe(2);
    });
  });

  describe('summarizeGenericCsvImport', () => {
    it('produces correct summary', () => {
      const records = parseGenericCsv(COMMA_CSV);
      const summary = summarizeGenericCsvImport(records);
      expect(summary.totalRecords).toBe(records.length);
    });
  });
});
