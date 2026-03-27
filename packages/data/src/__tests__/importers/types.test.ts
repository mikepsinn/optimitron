import { describe, it, expect } from 'vitest';
import { buildImportSummary } from '../../importers/types';
import type { ParsedHealthRecord } from '../../importers/apple-health';

describe('buildImportSummary', () => {
  it('returns empty summary for empty records', () => {
    const summary = buildImportSummary([]);
    expect(summary.totalRecords).toBe(0);
    expect(summary.dateRange).toBeNull();
    expect(summary.variableCounts).toEqual({});
    expect(summary.sourceNames).toEqual([]);
    expect(summary.warnings).toEqual([]);
  });

  it('computes correct summary for records', () => {
    const records: ParsedHealthRecord[] = [
      {
        variableName: 'Steps',
        variableCategoryName: 'Physical Activity',
        value: 9500,
        unitName: 'Count',
        unitAbbreviation: 'count',
        startAt: '2024-01-15T00:00:00.000Z',
        endAt: '2024-01-15T23:59:59.000Z',
        sourceName: 'Fitbit',
      },
      {
        variableName: 'Steps',
        variableCategoryName: 'Physical Activity',
        value: 11000,
        unitName: 'Count',
        unitAbbreviation: 'count',
        startAt: '2024-01-16T00:00:00.000Z',
        endAt: '2024-01-16T23:59:59.000Z',
        sourceName: 'Fitbit',
      },
      {
        variableName: 'Heart Rate',
        variableCategoryName: 'Vital Signs',
        value: 72,
        unitName: 'Beats per Minute',
        unitAbbreviation: 'bpm',
        startAt: '2024-01-15T08:00:00.000Z',
        endAt: '2024-01-15T08:00:00.000Z',
        sourceName: 'Apple Watch',
      },
    ];

    const summary = buildImportSummary(records);
    expect(summary.totalRecords).toBe(3);
    expect(summary.dateRange).toEqual({
      earliest: '2024-01-15T00:00:00.000Z',
      latest: '2024-01-16T23:59:59.000Z',
    });
    expect(summary.variableCounts).toEqual({ Steps: 2, 'Heart Rate': 1 });
    expect(summary.sourceNames).toEqual(['Apple Watch', 'Fitbit']);
    expect(summary.warnings).toEqual([]);
  });

  it('includes warnings when provided', () => {
    const summary = buildImportSummary([], ['Missing field X', 'Bad date format']);
    expect(summary.warnings).toEqual(['Missing field X', 'Bad date format']);
  });
});
