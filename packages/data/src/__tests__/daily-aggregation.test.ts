import { describe, it, expect } from 'vitest';
import { aggregateToDaily, type DailyAggregationConfig, type DailyValue } from '../daily-aggregation.js';
import type { ParsedHealthRecord } from '../importers/apple-health.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeRecord(
  date: string,
  value: number,
  variableName = 'Test Variable',
  source = 'Test',
): ParsedHealthRecord {
  return {
    variableName,
    variableCategoryName: 'Test',
    value,
    unitName: 'Count',
    unitAbbreviation: 'count',
    startAt: `${date}T12:00:00Z`,
    endAt: `${date}T12:00:00Z`,
    sourceName: source,
  };
}

function makeRecordWithTime(
  datetime: string,
  value: number,
  source = 'Test',
): ParsedHealthRecord {
  return {
    variableName: 'Test Variable',
    variableCategoryName: 'Test',
    value,
    unitName: 'Count',
    unitAbbreviation: 'count',
    startAt: datetime,
    endAt: datetime,
    sourceName: source,
  };
}

// ---------------------------------------------------------------------------
// Empty input
// ---------------------------------------------------------------------------

describe('aggregateToDaily — empty input', () => {
  it('returns empty array for empty measurements', () => {
    const result = aggregateToDaily([], { combinationOperation: 'SUM', fillingType: 'NONE' });
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// SUM operation
// ---------------------------------------------------------------------------

describe('aggregateToDaily — SUM operation', () => {
  it('sums multiple measurements on the same day', () => {
    const measurements = [
      makeRecordWithTime('2024-01-15T08:00:00Z', 500),
      makeRecordWithTime('2024-01-15T20:00:00Z', 500),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'SUM',
      fillingType: 'NONE',
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.date).toBe('2024-01-15');
    expect(result[0]!.value).toBe(1000);
    expect(result[0]!.numberOfMeasurements).toBe(2);
  });

  it('keeps separate days separate', () => {
    const measurements = [
      makeRecord('2024-01-15', 100),
      makeRecord('2024-01-16', 200),
      makeRecord('2024-01-17', 300),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'SUM',
      fillingType: 'NONE',
    });
    expect(result).toHaveLength(3);
    expect(result[0]!.value).toBe(100);
    expect(result[1]!.value).toBe(200);
    expect(result[2]!.value).toBe(300);
  });

  it('sums three measurements in one day', () => {
    const measurements = [
      makeRecordWithTime('2024-01-15T06:00:00Z', 100),
      makeRecordWithTime('2024-01-15T12:00:00Z', 200),
      makeRecordWithTime('2024-01-15T18:00:00Z', 300),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'SUM',
      fillingType: 'NONE',
    });
    expect(result[0]!.value).toBe(600);
    expect(result[0]!.numberOfMeasurements).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// MEAN operation
// ---------------------------------------------------------------------------

describe('aggregateToDaily — MEAN operation', () => {
  it('averages multiple measurements on the same day', () => {
    const measurements = [
      makeRecordWithTime('2024-01-15T08:00:00Z', 120),
      makeRecordWithTime('2024-01-15T12:00:00Z', 130),
      makeRecordWithTime('2024-01-15T20:00:00Z', 125),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'MEAN',
      fillingType: 'NONE',
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.value).toBe(125);
    expect(result[0]!.numberOfMeasurements).toBe(3);
  });

  it('returns exact value for single measurement', () => {
    const measurements = [makeRecord('2024-01-15', 72)];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'MEAN',
      fillingType: 'NONE',
    });
    expect(result[0]!.value).toBe(72);
    expect(result[0]!.numberOfMeasurements).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// MAX operation
// ---------------------------------------------------------------------------

describe('aggregateToDaily — MAX operation', () => {
  it('returns maximum value for the day', () => {
    const measurements = [
      makeRecordWithTime('2024-01-15T08:00:00Z', 120),
      makeRecordWithTime('2024-01-15T12:00:00Z', 180),
      makeRecordWithTime('2024-01-15T20:00:00Z', 150),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'MAX',
      fillingType: 'NONE',
    });
    expect(result[0]!.value).toBe(180);
  });
});

// ---------------------------------------------------------------------------
// MIN operation
// ---------------------------------------------------------------------------

describe('aggregateToDaily — MIN operation', () => {
  it('returns minimum value for the day', () => {
    const measurements = [
      makeRecordWithTime('2024-01-15T08:00:00Z', 120),
      makeRecordWithTime('2024-01-15T12:00:00Z', 80),
      makeRecordWithTime('2024-01-15T20:00:00Z', 150),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'MIN',
      fillingType: 'NONE',
    });
    expect(result[0]!.value).toBe(80);
  });
});

// ---------------------------------------------------------------------------
// ZERO filling
// ---------------------------------------------------------------------------

describe('aggregateToDaily — ZERO filling', () => {
  it('fills missing days with zero', () => {
    const measurements = [
      makeRecord('2024-01-15', 500),
      makeRecord('2024-01-18', 750),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'SUM',
      fillingType: 'ZERO',
    });
    expect(result).toHaveLength(4); // 15, 16, 17, 18
    expect(result[0]!).toEqual(expect.objectContaining({ date: '2024-01-15', value: 500 }));
    expect(result[1]!).toEqual(expect.objectContaining({ date: '2024-01-16', value: 0, numberOfMeasurements: 0 }));
    expect(result[2]!).toEqual(expect.objectContaining({ date: '2024-01-17', value: 0, numberOfMeasurements: 0 }));
    expect(result[3]!).toEqual(expect.objectContaining({ date: '2024-01-18', value: 750 }));
  });

  it('fills no gaps when consecutive days have data', () => {
    const measurements = [
      makeRecord('2024-01-15', 100),
      makeRecord('2024-01-16', 200),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'SUM',
      fillingType: 'ZERO',
    });
    expect(result).toHaveLength(2);
    expect(result[0]!.numberOfMeasurements).toBe(1);
    expect(result[1]!.numberOfMeasurements).toBe(1);
  });

  it('fills with zero for single day (no gaps)', () => {
    const measurements = [makeRecord('2024-01-15', 500)];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'SUM',
      fillingType: 'ZERO',
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.value).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// VALUE filling
// ---------------------------------------------------------------------------

describe('aggregateToDaily — VALUE filling', () => {
  it('fills missing days with specified value', () => {
    const measurements = [
      makeRecord('2024-01-15', 500),
      makeRecord('2024-01-17', 750),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'SUM',
      fillingType: 'VALUE',
      fillingValue: 42,
    });
    expect(result).toHaveLength(3);
    expect(result[1]!.value).toBe(42);
    expect(result[1]!.numberOfMeasurements).toBe(0);
  });

  it('defaults to 0 if fillingValue not specified', () => {
    const measurements = [
      makeRecord('2024-01-15', 500),
      makeRecord('2024-01-17', 750),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'SUM',
      fillingType: 'VALUE',
    });
    expect(result[1]!.value).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// INTERPOLATION filling
// ---------------------------------------------------------------------------

describe('aggregateToDaily — INTERPOLATION filling', () => {
  it('linearly interpolates between two known values', () => {
    const measurements = [
      makeRecord('2024-01-15', 100),
      makeRecord('2024-01-19', 200),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'MEAN',
      fillingType: 'INTERPOLATION',
    });
    expect(result).toHaveLength(5); // 15, 16, 17, 18, 19
    expect(result[0]!.value).toBe(100);
    expect(result[1]!.value).toBeCloseTo(125, 0);
    expect(result[2]!.value).toBeCloseTo(150, 0);
    expect(result[3]!.value).toBeCloseTo(175, 0);
    expect(result[4]!.value).toBe(200);
  });

  it('interpolated values have 0 measurements', () => {
    const measurements = [
      makeRecord('2024-01-15', 100),
      makeRecord('2024-01-17', 200),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'MEAN',
      fillingType: 'INTERPOLATION',
    });
    expect(result[1]!.numberOfMeasurements).toBe(0);
    expect(result[1]!.source).toBe('interpolated');
  });

  it('does not extrapolate beyond known values with single point', () => {
    const measurements = [makeRecord('2024-01-15', 100)];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'MEAN',
      fillingType: 'INTERPOLATION',
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.value).toBe(100);
  });

  it('interpolates between three known values', () => {
    const measurements = [
      makeRecord('2024-01-15', 0),
      makeRecord('2024-01-17', 100),
      makeRecord('2024-01-19', 50),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'MEAN',
      fillingType: 'INTERPOLATION',
    });
    expect(result).toHaveLength(5); // 15, 16, 17, 18, 19
    expect(result[0]!.value).toBe(0);
    expect(result[1]!.value).toBeCloseTo(50, 0); // midpoint 0→100
    expect(result[2]!.value).toBe(100);
    expect(result[3]!.value).toBeCloseTo(75, 0); // midpoint 100→50
    expect(result[4]!.value).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// NONE filling
// ---------------------------------------------------------------------------

describe('aggregateToDaily — NONE filling', () => {
  it('skips missing days', () => {
    const measurements = [
      makeRecord('2024-01-15', 100),
      makeRecord('2024-01-18', 200),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'SUM',
      fillingType: 'NONE',
    });
    expect(result).toHaveLength(2);
    expect(result[0]!.date).toBe('2024-01-15');
    expect(result[1]!.date).toBe('2024-01-18');
  });
});

// ---------------------------------------------------------------------------
// Date range
// ---------------------------------------------------------------------------

describe('aggregateToDaily — date range', () => {
  it('respects startDate and endDate', () => {
    const measurements = [
      makeRecord('2024-01-16', 100),
      makeRecord('2024-01-17', 200),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'SUM',
      fillingType: 'ZERO',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-19T00:00:00Z'),
    });
    expect(result).toHaveLength(5); // 15, 16, 17, 18, 19
    expect(result[0]!.value).toBe(0); // Jan 15 filled
    expect(result[1]!.value).toBe(100);
    expect(result[2]!.value).toBe(200);
    expect(result[3]!.value).toBe(0); // Jan 18 filled
    expect(result[4]!.value).toBe(0); // Jan 19 filled
  });
});

// ---------------------------------------------------------------------------
// Source tracking
// ---------------------------------------------------------------------------

describe('aggregateToDaily — source tracking', () => {
  it('tracks single source', () => {
    const measurements = [
      makeRecord('2024-01-15', 100, 'Test Variable', 'Apple Health'),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'SUM',
      fillingType: 'NONE',
    });
    expect(result[0]!.source).toBe('Apple Health');
  });

  it('joins multiple sources', () => {
    const measurements = [
      makeRecord('2024-01-15', 100, 'Test Variable', 'Apple Health'),
      makeRecord('2024-01-15', 200, 'Test Variable', 'Fitbit'),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'SUM',
      fillingType: 'NONE',
    });
    expect(result[0]!.source).toBe('Apple Health, Fitbit');
  });

  it('deduplicates sources', () => {
    const measurements = [
      makeRecord('2024-01-15', 100, 'Test Variable', 'Apple Health'),
      makeRecord('2024-01-15', 200, 'Test Variable', 'Apple Health'),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'SUM',
      fillingType: 'NONE',
    });
    expect(result[0]!.source).toBe('Apple Health');
  });

  it('filled days have "filled" source', () => {
    const measurements = [
      makeRecord('2024-01-15', 100),
      makeRecord('2024-01-17', 200),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'SUM',
      fillingType: 'ZERO',
    });
    expect(result[1]!.source).toBe('filled');
  });
});

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

describe('aggregateToDaily — sorting', () => {
  it('returns results sorted by date', () => {
    const measurements = [
      makeRecord('2024-01-18', 300),
      makeRecord('2024-01-15', 100),
      makeRecord('2024-01-16', 200),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'SUM',
      fillingType: 'NONE',
    });
    expect(result.map((d) => d.date)).toEqual([
      '2024-01-15',
      '2024-01-16',
      '2024-01-18',
    ]);
  });
});

// ---------------------------------------------------------------------------
// Rounding
// ---------------------------------------------------------------------------

describe('aggregateToDaily — rounding', () => {
  it('rounds values to 3 decimal places', () => {
    const measurements = [
      makeRecordWithTime('2024-01-15T08:00:00Z', 1.0),
      makeRecordWithTime('2024-01-15T12:00:00Z', 2.0),
      makeRecordWithTime('2024-01-15T20:00:00Z', 3.0),
    ];
    const result = aggregateToDaily(measurements, {
      combinationOperation: 'MEAN',
      fillingType: 'NONE',
    });
    expect(result[0]!.value).toBe(2);
  });

  it('rounds MEAN with repeating decimal', () => {
    const measurements = [
      makeRecordWithTime('2024-01-15T08:00:00Z', 1),
      makeRecordWithTime('2024-01-15T12:00:00Z', 2),
      makeRecordWithTime('2024-01-15T20:00:00Z', 3),
    ];
    // Mean = 2.0, but let's force a repeating decimal
    const measurements2 = [
      makeRecordWithTime('2024-01-15T08:00:00Z', 10),
      makeRecordWithTime('2024-01-15T12:00:00Z', 20),
      makeRecordWithTime('2024-01-15T20:00:00Z', 30),
    ];
    // Mean = 20 — clean. Let's try 1/3
    const measurements3 = [
      makeRecordWithTime('2024-01-15T08:00:00Z', 0),
      makeRecordWithTime('2024-01-15T12:00:00Z', 0),
      makeRecordWithTime('2024-01-15T20:00:00Z', 1),
    ];
    const result3 = aggregateToDaily(measurements3, {
      combinationOperation: 'MEAN',
      fillingType: 'NONE',
    });
    // 1/3 = 0.333... → rounded to 0.333
    expect(result3[0]!.value).toBe(0.333);
  });
});
