import { describe, it, expect } from 'vitest';
import {
  VERSION,
  mean,
  std,
  pearsonCorrelation,
  MeasurementSchema,
  TimeSeriesSchema,
} from '../index.js';

describe('@optomitron/optimizer smoke tests', () => {
  it('exports a version string', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('mean() computes correctly', () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
    expect(mean([])).toBeNaN();
  });

  it('std() computes population standard deviation', () => {
    const result = std([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(result).toBeCloseTo(2.0, 1);
  });

  it('pearsonCorrelation() returns 1 for perfectly correlated data', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    expect(pearsonCorrelation(x, y)).toBeCloseTo(1.0, 5);
  });

  it('pearsonCorrelation() returns -1 for inversely correlated data', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 8, 6, 4, 2];
    expect(pearsonCorrelation(x, y)).toBeCloseTo(-1.0, 5);
  });

  it('MeasurementSchema validates correct input', () => {
    const result = MeasurementSchema.safeParse({
      timestamp: Date.now(),
      value: 42.5,
    });
    expect(result.success).toBe(true);
  });

  it('MeasurementSchema rejects missing value', () => {
    const result = MeasurementSchema.safeParse({
      timestamp: Date.now(),
    });
    expect(result.success).toBe(false);
  });

  it('TimeSeriesSchema validates a complete time series', () => {
    const result = TimeSeriesSchema.safeParse({
      variableId: 'test-var',
      name: 'Test Variable',
      measurements: [
        { timestamp: 1000, value: 1.0 },
        { timestamp: 2000, value: 2.0 },
      ],
    });
    expect(result.success).toBe(true);
  });
});
