import { describe, it, expect } from 'vitest'
import { formatParameter, getParameterValue, formatConfidenceInterval } from './compact-format'
import type { Parameter } from './parameters-calculations-citations'

// Test helper to create a minimal Parameter object
function createParam(value: number, unit?: string, overrides?: Partial<Parameter>): Parameter {
  return {
    value,
    unit,
    ...overrides,
  } as Parameter
}

describe('formatParameter', () => {
  describe('currency formatting (USD)', () => {
    it('formats trillions correctly', () => {
      const param = createParam(2700000000000, 'USD')
      expect(formatParameter(param)).toBe('$2.7T')
    })

    it('formats billions correctly', () => {
      const param = createParam(50000000000, 'USD')
      expect(formatParameter(param)).toBe('$50B')
    })

    it('formats millions correctly', () => {
      const param = createParam(270000000, 'USD')
      expect(formatParameter(param)).toBe('$270M')
    })

    it('formats thousands correctly', () => {
      const param = createParam(41000, 'USD')
      expect(formatParameter(param)).toBe('$41K')
    })

    it('respects precision option', () => {
      const param = createParam(2720000000000, 'USD')
      expect(formatParameter(param, { precision: 2 })).toBe('$2.72T')
    })

    it('applies significant figures after compact currency scaling', () => {
      const param = createParam(2720000000000, 'USD')
      expect(formatParameter(param, { figures: 3 })).toBe('$2.72T')
    })

    it('handles USD/year unit with includeUnit', () => {
      const param = createParam(27200000000, 'USD/year')
      expect(formatParameter(param, { includeUnit: true })).toBe('$27.2B/year')
    })

    it('handles compact=false for full number display', () => {
      const param = createParam(50000, 'USD')
      expect(formatParameter(param, { compact: false })).toBe('$50,000')
    })
  })

  describe('percentage formatting', () => {
    it('converts decimal rates to percentages', () => {
      const param = createParam(0.86, 'percentage')
      expect(formatParameter(param)).toBe('86%')
    })

    it('formats percent unit the same as percentage', () => {
      const param = createParam(0.035, 'percent')
      expect(formatParameter(param)).toBe('3.5%')
    })

    it('handles percentages that are already in percent form', () => {
      const param = createParam(86, 'percentage')
      expect(formatParameter(param)).toBe('86%')
    })

    it('formats rate unit same as percentage', () => {
      const param = createParam(0.861, 'rate')
      expect(formatParameter(param)).toBe('86.1%')
    })

    it('respects precision for percentages', () => {
      const param = createParam(0.8612, 'percentage')
      expect(formatParameter(param, { precision: 2 })).toBe('86.12%')
    })

    it('does not add trailing zeros to whole percentages', () => {
      const param = createParam(0.01, 'rate')
      expect(formatParameter(param, { figures: 3 })).toBe('1%')
    })

    it('preserves significant figures below one percent', () => {
      const param = createParam(0.000123, 'percentage')
      expect(formatParameter(param, { figures: 3 })).toBe('0.0123%')
    })
  })

  describe('ratio formatting', () => {
    it('formats ratio with :1 suffix', () => {
      const param = createParam(604, 'ratio')
      expect(formatParameter(param)).toBe('604:1')
    })

    it('formats large ratios with thousand separators', () => {
      const param = createParam(1250, 'ratio')
      expect(formatParameter(param)).toBe('1,250:1')
    })

    it('formats very large ratios with M suffix', () => {
      const param = createParam(84000000, 'ratio')
      expect(formatParameter(param)).toBe('84M:1')
    })
  })

  describe('multiplier formatting', () => {
    it('formats multiplier with x suffix', () => {
      const param = createParam(82, 'multiplier')
      expect(formatParameter(param)).toBe('82x')
    })

    it('formats large multipliers correctly', () => {
      const param = createParam(1000, 'multiplier')
      expect(formatParameter(param)).toBe('1,000x')
    })

    it('formats x unit with x suffix', () => {
      const param = createParam(12.3, 'x')
      expect(formatParameter(param, { precision: 1 })).toBe('12.3x')
    })
  })

  describe('years formatting', () => {
    it('formats years without unit by default', () => {
      const param = createParam(8.2, 'years')
      expect(formatParameter(param)).toBe('8.2')
    })

    it('includes "years" suffix when includeUnit is true', () => {
      const param = createParam(17, 'years')
      expect(formatParameter(param, { includeUnit: true })).toBe('17 years')
    })

    it('formats decimal years with one decimal place', () => {
      const param = createParam(8.25, 'years')
      expect(formatParameter(param)).toBe('8.3')
    })

    it('does not add trailing zeros to whole-year values', () => {
      expect(formatParameter(createParam(15, 'years'), { figures: 3 })).toBe('15')
      expect(formatParameter(createParam(35.96, 'years'), { figures: 3 })).toBe('36')
    })
  })

  describe('count formatting (lives, deaths, patients)', () => {
    it('formats billions with B suffix', () => {
      const param = createParam(2000000000, 'patients')
      expect(formatParameter(param)).toBe('2B')
    })

    it('formats thousands with K suffix', () => {
      const param = createParam(840000, 'lives/year')
      expect(formatParameter(param)).toBe('840K')
    })

    it('includes unit when includeUnit is true', () => {
      const param = createParam(2000, 'deaths')
      expect(formatParameter(param, { includeUnit: true })).toBe('2K deaths')
    })
  })

  describe('DALY/QALY formatting', () => {
    it('formats DALYs in billions', () => {
      const param = createParam(2880000000, 'DALYs')
      expect(formatParameter(param)).toBe('2.88B')
    })

    it('formats QALYs in millions', () => {
      const param = createParam(5000000, 'QALYs')
      expect(formatParameter(param)).toBe('5M')
    })
  })

  describe('generic number formatting', () => {
    it('formats large numbers with appropriate suffix', () => {
      const param = createParam(1000000000000, undefined)
      expect(formatParameter(param)).toBe('1T')
    })

    it('formats small numbers without suffix', () => {
      const param = createParam(42, undefined)
      expect(formatParameter(param)).toBe('42')
    })

    it('formats decimals with 2 decimal places', () => {
      const param = createParam(3.14159, undefined)
      expect(formatParameter(param)).toBe('3.14')
    })
  })
})

describe('getParameterValue', () => {
  it('returns raw value by default', () => {
    const param = createParam(636.8, 'ratio')
    expect(getParameterValue(param)).toBe(636.8)
  })

  it('rounds value when transform is "round"', () => {
    const param = createParam(636.8, 'ratio')
    expect(getParameterValue(param, 'round')).toBe(637)
  })

  it('floors value when transform is "floor"', () => {
    const param = createParam(636.8, 'ratio')
    expect(getParameterValue(param, 'floor')).toBe(636)
  })

  it('ceils value when transform is "ceil"', () => {
    const param = createParam(636.1, 'ratio')
    expect(getParameterValue(param, 'ceil')).toBe(637)
  })

  it('converts rate to percentage when transform is "percentage"', () => {
    const param = createParam(0.86, 'rate')
    expect(getParameterValue(param, 'percentage')).toBe(86)
  })

  it('does not convert percentage if value > 1', () => {
    const param = createParam(86, 'percentage')
    expect(getParameterValue(param, 'percentage')).toBe(86)
  })
})

describe('formatConfidenceInterval', () => {
  it('returns null when no confidence interval', () => {
    const param = createParam(100, 'USD')
    expect(formatConfidenceInterval(param)).toBeNull()
  })

  it('formats confidence interval with same unit as value', () => {
    const param = createParam(2700000000000, 'USD', {
      confidenceInterval: [2500000000000, 2900000000000],
    })
    const result = formatConfidenceInterval(param)
    expect(result).toBe('$2.5T – $2.9T')
  })

  it('formats percentage confidence intervals', () => {
    const param = createParam(0.86, 'percentage', {
      confidenceInterval: [0.80, 0.92],
    })
    const result = formatConfidenceInterval(param)
    expect(result).toBe('80% – 92%')
  })

  it('formats ratio confidence intervals', () => {
    const param = createParam(604, 'ratio', {
      confidenceInterval: [550, 660],
    })
    const result = formatConfidenceInterval(param)
    expect(result).toBe('550:1 – 660:1')
  })
})
