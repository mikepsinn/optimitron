import { describe, it, expect } from 'vitest';
import {
  convertUnit,
  normalizeUnit,
  isCompatibleUnit,
  getUnitCategory,
  getUnitDefinition,
  UNIT_DEFINITIONS,
} from '../unit-conversion.js';

// ---------------------------------------------------------------------------
// normalizeUnit
// ---------------------------------------------------------------------------

describe('normalizeUnit', () => {
  it('returns canonical abbreviation for known abbreviations', () => {
    expect(normalizeUnit('mg')).toBe('mg');
    expect(normalizeUnit('kg')).toBe('kg');
    expect(normalizeUnit('%')).toBe('%');
  });

  it('handles case-insensitive abbreviation matching', () => {
    expect(normalizeUnit('MG')).toBe('mg');
    expect(normalizeUnit('Mg')).toBe('mg');
    expect(normalizeUnit('KG')).toBe('kg');
    expect(normalizeUnit('ML')).toBe('mL');
  });

  it('maps full names to abbreviations', () => {
    expect(normalizeUnit('milligrams')).toBe('mg');
    expect(normalizeUnit('Milligrams')).toBe('mg');
    expect(normalizeUnit('MILLIGRAMS')).toBe('mg');
    expect(normalizeUnit('kilograms')).toBe('kg');
    expect(normalizeUnit('pounds')).toBe('lbs');
    expect(normalizeUnit('ounces')).toBe('oz');
  });

  it('maps common aliases', () => {
    expect(normalizeUnit('lb')).toBe('lbs');
    expect(normalizeUnit('ml')).toBe('mL');
    expect(normalizeUnit('hrs')).toBe('h');
    expect(normalizeUnit('minutes')).toBe('min');
    expect(normalizeUnit('seconds')).toBe('s');
    expect(normalizeUnit('celsius')).toBe('°C');
    expect(normalizeUnit('fahrenheit')).toBe('°F');
  });

  it('maps microgram variants', () => {
    expect(normalizeUnit('µg')).toBe('mcg');
    expect(normalizeUnit('ug')).toBe('mcg');
    expect(normalizeUnit('micrograms')).toBe('mcg');
  });

  it('trims whitespace', () => {
    expect(normalizeUnit('  mg  ')).toBe('mg');
    expect(normalizeUnit(' kg ')).toBe('kg');
  });

  it('returns original for unknown units', () => {
    expect(normalizeUnit('parsecs')).toBe('parsecs');
    expect(normalizeUnit('banana')).toBe('banana');
  });

  it('handles empty string', () => {
    expect(normalizeUnit('')).toBe('');
  });

  it('maps volume aliases', () => {
    expect(normalizeUnit('fl_oz')).toBe('fl oz');
    expect(normalizeUnit('floz')).toBe('fl oz');
    expect(normalizeUnit('cups')).toBe('cup');
    expect(normalizeUnit('tablespoons')).toBe('tbsp');
    expect(normalizeUnit('teaspoons')).toBe('tsp');
  });

  it('maps distance aliases', () => {
    expect(normalizeUnit('miles')).toBe('mi');
    expect(normalizeUnit('feet')).toBe('ft');
    expect(normalizeUnit('metres')).toBe('m');
    expect(normalizeUnit('meters')).toBe('m');
    expect(normalizeUnit('centimeters')).toBe('cm');
  });

  it('maps rating aliases', () => {
    expect(normalizeUnit('1 to 5')).toBe('1-5');
    expect(normalizeUnit('1 to 10')).toBe('1-10');
    expect(normalizeUnit('0 to 100')).toBe('0-100');
  });
});

// ---------------------------------------------------------------------------
// getUnitCategory
// ---------------------------------------------------------------------------

describe('getUnitCategory', () => {
  it('returns correct category for weight units', () => {
    expect(getUnitCategory('mg')).toBe('Weight');
    expect(getUnitCategory('g')).toBe('Weight');
    expect(getUnitCategory('kg')).toBe('Weight');
    expect(getUnitCategory('lbs')).toBe('Weight');
    expect(getUnitCategory('oz')).toBe('Weight');
  });

  it('returns correct category for volume units', () => {
    expect(getUnitCategory('mL')).toBe('Volume');
    expect(getUnitCategory('L')).toBe('Volume');
    expect(getUnitCategory('fl oz')).toBe('Volume');
  });

  it('returns correct category for time units', () => {
    expect(getUnitCategory('s')).toBe('Time');
    expect(getUnitCategory('min')).toBe('Time');
    expect(getUnitCategory('h')).toBe('Time');
    expect(getUnitCategory('d')).toBe('Time');
  });

  it('works with full names via normalization', () => {
    expect(getUnitCategory('milligrams')).toBe('Weight');
    expect(getUnitCategory('hours')).toBe('Time');
    expect(getUnitCategory('celsius')).toBe('Temperature');
  });

  it('returns Unknown for unrecognized units', () => {
    expect(getUnitCategory('parsecs')).toBe('Unknown');
    expect(getUnitCategory('')).toBe('Unknown');
  });
});

// ---------------------------------------------------------------------------
// isCompatibleUnit
// ---------------------------------------------------------------------------

describe('isCompatibleUnit', () => {
  it('returns true for same-category units', () => {
    expect(isCompatibleUnit('mg', 'g')).toBe(true);
    expect(isCompatibleUnit('mg', 'kg')).toBe(true);
    expect(isCompatibleUnit('mL', 'L')).toBe(true);
    expect(isCompatibleUnit('s', 'h')).toBe(true);
    expect(isCompatibleUnit('°C', '°F')).toBe(true);
    expect(isCompatibleUnit('%', 'ratio')).toBe(true);
  });

  it('returns false for different-category units', () => {
    expect(isCompatibleUnit('mg', 'mL')).toBe(false);
    expect(isCompatibleUnit('kg', '°C')).toBe(false);
    expect(isCompatibleUnit('s', 'km')).toBe(false);
  });

  it('returns false for unknown units', () => {
    expect(isCompatibleUnit('parsecs', 'mg')).toBe(false);
    expect(isCompatibleUnit('mg', 'parsecs')).toBe(false);
    expect(isCompatibleUnit('parsecs', 'banana')).toBe(false);
  });

  it('works with aliases', () => {
    expect(isCompatibleUnit('milligrams', 'grams')).toBe(true);
    expect(isCompatibleUnit('pounds', 'kilograms')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// convertUnit — Weight
// ---------------------------------------------------------------------------

describe('convertUnit — Weight', () => {
  it('converts mg → g', () => {
    expect(convertUnit(1000, 'mg', 'g')).toBeCloseTo(1, 6);
  });

  it('converts g → mg', () => {
    expect(convertUnit(1, 'g', 'mg')).toBeCloseTo(1000, 6);
  });

  it('converts g → kg', () => {
    expect(convertUnit(1000, 'g', 'kg')).toBeCloseTo(1, 6);
  });

  it('converts kg → g', () => {
    expect(convertUnit(1, 'kg', 'g')).toBeCloseTo(1000, 6);
  });

  it('converts lbs → kg', () => {
    expect(convertUnit(1, 'lbs', 'kg')).toBeCloseTo(0.453592, 4);
  });

  it('converts kg → lbs', () => {
    expect(convertUnit(1, 'kg', 'lbs')).toBeCloseTo(2.20462, 3);
  });

  it('converts oz → g', () => {
    expect(convertUnit(1, 'oz', 'g')).toBeCloseTo(28.3495, 3);
  });

  it('converts mg → kg', () => {
    expect(convertUnit(1000000, 'mg', 'kg')).toBeCloseTo(1, 6);
  });

  it('handles zero value', () => {
    expect(convertUnit(0, 'mg', 'g')).toBe(0);
  });

  it('handles large values', () => {
    expect(convertUnit(500000, 'mg', 'kg')).toBeCloseTo(0.5, 6);
  });
});

// ---------------------------------------------------------------------------
// convertUnit — Volume
// ---------------------------------------------------------------------------

describe('convertUnit — Volume', () => {
  it('converts mL → L', () => {
    expect(convertUnit(1000, 'mL', 'L')).toBeCloseTo(1, 6);
  });

  it('converts L → mL', () => {
    expect(convertUnit(1, 'L', 'mL')).toBeCloseTo(1000, 6);
  });

  it('converts fl oz → mL', () => {
    expect(convertUnit(1, 'fl oz', 'mL')).toBeCloseTo(29.5735, 3);
  });

  it('converts cups → mL', () => {
    expect(convertUnit(1, 'cup', 'mL')).toBeCloseTo(236.588, 2);
  });

  it('converts tbsp → tsp', () => {
    // 1 tbsp ≈ 3 tsp
    expect(convertUnit(1, 'tbsp', 'tsp')).toBeCloseTo(3, 0);
  });
});

// ---------------------------------------------------------------------------
// convertUnit — Time
// ---------------------------------------------------------------------------

describe('convertUnit — Time', () => {
  it('converts minutes → seconds', () => {
    expect(convertUnit(1, 'min', 's')).toBeCloseTo(60, 6);
  });

  it('converts hours → minutes', () => {
    expect(convertUnit(1, 'h', 'min')).toBeCloseTo(60, 6);
  });

  it('converts days → hours', () => {
    expect(convertUnit(1, 'd', 'h')).toBeCloseTo(24, 6);
  });

  it('converts hours → seconds', () => {
    expect(convertUnit(1, 'h', 's')).toBeCloseTo(3600, 6);
  });

  it('converts days → seconds', () => {
    expect(convertUnit(1, 'd', 's')).toBeCloseTo(86400, 6);
  });
});

// ---------------------------------------------------------------------------
// convertUnit — Distance
// ---------------------------------------------------------------------------

describe('convertUnit — Distance', () => {
  it('converts km → m', () => {
    expect(convertUnit(1, 'km', 'm')).toBeCloseTo(1000, 6);
  });

  it('converts miles → km', () => {
    expect(convertUnit(1, 'mi', 'km')).toBeCloseTo(1.609344, 4);
  });

  it('converts feet → m', () => {
    expect(convertUnit(1, 'ft', 'm')).toBeCloseTo(0.3048, 4);
  });

  it('converts cm → m', () => {
    expect(convertUnit(100, 'cm', 'm')).toBeCloseTo(1, 6);
  });
});

// ---------------------------------------------------------------------------
// convertUnit — Temperature
// ---------------------------------------------------------------------------

describe('convertUnit — Temperature', () => {
  it('converts celsius → fahrenheit', () => {
    expect(convertUnit(0, '°C', '°F')).toBeCloseTo(32, 2);
    expect(convertUnit(100, '°C', '°F')).toBeCloseTo(212, 2);
    expect(convertUnit(37, '°C', '°F')).toBeCloseTo(98.6, 1);
  });

  it('converts fahrenheit → celsius', () => {
    expect(convertUnit(32, '°F', '°C')).toBeCloseTo(0, 2);
    expect(convertUnit(212, '°F', '°C')).toBeCloseTo(100, 2);
    expect(convertUnit(98.6, '°F', '°C')).toBeCloseTo(37, 1);
  });

  it('handles negative temperatures', () => {
    expect(convertUnit(-40, '°C', '°F')).toBeCloseTo(-40, 2);
    expect(convertUnit(-40, '°F', '°C')).toBeCloseTo(-40, 2);
  });
});

// ---------------------------------------------------------------------------
// convertUnit — Energy
// ---------------------------------------------------------------------------

describe('convertUnit — Energy', () => {
  it('converts calories → kcal', () => {
    expect(convertUnit(1000, 'cal', 'kcal')).toBeCloseTo(1, 6);
  });

  it('converts kcal → kJ', () => {
    expect(convertUnit(1, 'kcal', 'kJ')).toBeCloseTo(4.184, 2);
  });

  it('converts kJ → kcal', () => {
    expect(convertUnit(4.184, 'kJ', 'kcal')).toBeCloseTo(1, 2);
  });
});

// ---------------------------------------------------------------------------
// convertUnit — Percentage
// ---------------------------------------------------------------------------

describe('convertUnit — Percentage', () => {
  it('converts ratio → percent', () => {
    expect(convertUnit(0.5, 'ratio', '%')).toBeCloseTo(50, 6);
    expect(convertUnit(1, 'ratio', '%')).toBeCloseTo(100, 6);
    expect(convertUnit(0, 'ratio', '%')).toBeCloseTo(0, 6);
  });

  it('converts percent → ratio', () => {
    expect(convertUnit(50, '%', 'ratio')).toBeCloseTo(0.5, 6);
    expect(convertUnit(100, '%', 'ratio')).toBeCloseTo(1, 6);
  });
});

// ---------------------------------------------------------------------------
// convertUnit — Ratings
// ---------------------------------------------------------------------------

describe('convertUnit — Ratings', () => {
  it('converts 1-10 → 1-5', () => {
    expect(convertUnit(1, '1-10', '1-5')).toBeCloseTo(1, 2);
    expect(convertUnit(10, '1-10', '1-5')).toBeCloseTo(5, 2);
    expect(convertUnit(5.5, '1-10', '1-5')).toBeCloseTo(3, 2);
  });

  it('converts 1-5 → 1-10', () => {
    expect(convertUnit(1, '1-5', '1-10')).toBeCloseTo(1, 2);
    expect(convertUnit(5, '1-5', '1-10')).toBeCloseTo(10, 2);
    expect(convertUnit(3, '1-5', '1-10')).toBeCloseTo(5.5, 2);
  });

  it('converts 0-100 → 1-5', () => {
    expect(convertUnit(0, '0-100', '1-5')).toBeCloseTo(1, 2);
    expect(convertUnit(100, '0-100', '1-5')).toBeCloseTo(5, 2);
    expect(convertUnit(50, '0-100', '1-5')).toBeCloseTo(3, 2);
  });

  it('converts 1-5 → 0-100', () => {
    expect(convertUnit(1, '1-5', '0-100')).toBeCloseTo(0, 2);
    expect(convertUnit(5, '1-5', '0-100')).toBeCloseTo(100, 2);
    expect(convertUnit(3, '1-5', '0-100')).toBeCloseTo(50, 2);
  });
});

// ---------------------------------------------------------------------------
// convertUnit — Same unit
// ---------------------------------------------------------------------------

describe('convertUnit — Same unit', () => {
  it('returns value unchanged for same unit', () => {
    expect(convertUnit(42, 'mg', 'mg')).toBe(42);
    expect(convertUnit(0, 'kg', 'kg')).toBe(0);
    expect(convertUnit(98.6, '°F', '°F')).toBe(98.6);
  });
});

// ---------------------------------------------------------------------------
// convertUnit — Errors
// ---------------------------------------------------------------------------

describe('convertUnit — Errors', () => {
  it('throws for incompatible units', () => {
    expect(() => convertUnit(1, 'mg', 'mL')).toThrow(/incompatible/i);
    expect(() => convertUnit(1, 'kg', '°C')).toThrow(/incompatible/i);
  });

  it('throws for unrecognized fromUnit', () => {
    expect(() => convertUnit(1, 'parsecs', 'kg')).toThrow(/unrecognized/i);
  });

  it('throws for unrecognized toUnit', () => {
    expect(() => convertUnit(1, 'kg', 'parsecs')).toThrow(/unrecognized/i);
  });
});

// ---------------------------------------------------------------------------
// convertUnit — Aliases in conversion
// ---------------------------------------------------------------------------

describe('convertUnit — with aliases', () => {
  it('converts using full names', () => {
    expect(convertUnit(1000, 'milligrams', 'grams')).toBeCloseTo(1, 6);
  });

  it('converts using mixed formats', () => {
    expect(convertUnit(1, 'pounds', 'kg')).toBeCloseTo(0.453592, 4);
  });

  it('converts celsius alias', () => {
    expect(convertUnit(100, 'celsius', 'fahrenheit')).toBeCloseTo(212, 2);
  });
});

// ---------------------------------------------------------------------------
// getUnitDefinition
// ---------------------------------------------------------------------------

describe('getUnitDefinition', () => {
  it('returns definition for known units', () => {
    const def = getUnitDefinition('mg');
    expect(def).toBeDefined();
    expect(def!.name).toBe('Milligrams');
    expect(def!.category).toBe('Weight');
  });

  it('returns definition via normalization', () => {
    const def = getUnitDefinition('milligrams');
    expect(def).toBeDefined();
    expect(def!.abbreviation).toBe('mg');
  });

  it('returns undefined for unknown units', () => {
    expect(getUnitDefinition('parsecs')).toBeUndefined();
  });
});
