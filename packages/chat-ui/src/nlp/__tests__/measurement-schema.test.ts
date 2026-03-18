import { describe, it, expect } from 'vitest';
import {
  VariableCategoryNames,
  UnitAbbreviations,
  CATEGORY_DEFAULTS,
  DFDA_CATEGORY_MAP,
  DFDA_UNIT_MAP,
  type ParsedMeasurement,
  type VariableCategoryName,
  type UnitAbbreviation,
} from '../measurement-schema.js';

describe('measurement-schema', () => {
  // =========================================================================
  // VariableCategoryNames
  // =========================================================================

  describe('VariableCategoryNames', () => {
    it('has 15 categories', () => {
      expect(VariableCategoryNames).toHaveLength(15);
    });

    it('includes core health categories', () => {
      expect(VariableCategoryNames).toContain('Treatment');
      expect(VariableCategoryNames).toContain('Supplement');
      expect(VariableCategoryNames).toContain('Food');
      expect(VariableCategoryNames).toContain('Drink');
      expect(VariableCategoryNames).toContain('Symptom');
      expect(VariableCategoryNames).toContain('Emotion');
      expect(VariableCategoryNames).toContain('Sleep');
      expect(VariableCategoryNames).toContain('Exercise');
      expect(VariableCategoryNames).toContain('Vital Sign');
    });

    it('includes governance/economic categories', () => {
      expect(VariableCategoryNames).toContain('Economic');
      expect(VariableCategoryNames).toContain('Policy');
      expect(VariableCategoryNames).toContain('Goal');
    });

    it('has no duplicates', () => {
      const unique = new Set(VariableCategoryNames);
      expect(unique.size).toBe(VariableCategoryNames.length);
    });
  });

  // =========================================================================
  // UnitAbbreviations
  // =========================================================================

  describe('UnitAbbreviations', () => {
    it('has 31 units', () => {
      expect(UnitAbbreviations).toHaveLength(31);
    });

    it('includes common health units', () => {
      expect(UnitAbbreviations).toContain('mg');
      expect(UnitAbbreviations).toContain('g');
      expect(UnitAbbreviations).toContain('IU');
      expect(UnitAbbreviations).toContain('mcg');
      expect(UnitAbbreviations).toContain('tablets');
      expect(UnitAbbreviations).toContain('capsules');
      expect(UnitAbbreviations).toContain('servings');
    });

    it('includes rating scales', () => {
      expect(UnitAbbreviations).toContain('1-5');
      expect(UnitAbbreviations).toContain('1-10');
      expect(UnitAbbreviations).toContain('%');
      expect(UnitAbbreviations).toContain('yes/no');
    });

    it('includes vital sign units', () => {
      expect(UnitAbbreviations).toContain('bpm');
      expect(UnitAbbreviations).toContain('mmHg');
      expect(UnitAbbreviations).toContain('°F');
    });

    it('has no duplicates', () => {
      const unique = new Set(UnitAbbreviations);
      expect(unique.size).toBe(UnitAbbreviations.length);
    });
  });

  // =========================================================================
  // CATEGORY_DEFAULTS
  // =========================================================================

  describe('CATEGORY_DEFAULTS', () => {
    it('has an entry for every category', () => {
      for (const cat of VariableCategoryNames) {
        expect(CATEGORY_DEFAULTS[cat]).toBeDefined();
        expect(CATEGORY_DEFAULTS[cat].unit).toBeDefined();
        expect(CATEGORY_DEFAULTS[cat].combinationOperation).toBeDefined();
      }
    });

    it('uses SUM for additive categories', () => {
      expect(CATEGORY_DEFAULTS['Treatment'].combinationOperation).toBe('SUM');
      expect(CATEGORY_DEFAULTS['Supplement'].combinationOperation).toBe('SUM');
      expect(CATEGORY_DEFAULTS['Food'].combinationOperation).toBe('SUM');
      expect(CATEGORY_DEFAULTS['Drink'].combinationOperation).toBe('SUM');
      expect(CATEGORY_DEFAULTS['Exercise'].combinationOperation).toBe('SUM');
    });

    it('uses MEAN for rating/state categories', () => {
      expect(CATEGORY_DEFAULTS['Symptom'].combinationOperation).toBe('MEAN');
      expect(CATEGORY_DEFAULTS['Emotion'].combinationOperation).toBe('MEAN');
      expect(CATEGORY_DEFAULTS['Vital Sign'].combinationOperation).toBe('MEAN');
    });

    it('default units are valid UnitAbbreviations', () => {
      for (const cat of VariableCategoryNames) {
        const unit = CATEGORY_DEFAULTS[cat].unit;
        expect(UnitAbbreviations).toContain(unit);
      }
    });
  });

  // =========================================================================
  // DFDA_CATEGORY_MAP
  // =========================================================================

  describe('DFDA_CATEGORY_MAP', () => {
    it('maps all 27 DFDA categories', () => {
      expect(Object.keys(DFDA_CATEGORY_MAP)).toHaveLength(27);
    });

    it('maps to valid Optimitron categories', () => {
      for (const [, optimitronCat] of Object.entries(DFDA_CATEGORY_MAP)) {
        expect(VariableCategoryNames).toContain(optimitronCat);
      }
    });

    it('maps core DFDA categories correctly', () => {
      expect(DFDA_CATEGORY_MAP['Treatments']).toBe('Treatment');
      expect(DFDA_CATEGORY_MAP['Symptoms']).toBe('Symptom');
      expect(DFDA_CATEGORY_MAP['Foods']).toBe('Food');
      expect(DFDA_CATEGORY_MAP['Emotions']).toBe('Emotion');
      expect(DFDA_CATEGORY_MAP['Sleep']).toBe('Sleep');
    });
  });

  // =========================================================================
  // DFDA_UNIT_MAP
  // =========================================================================

  describe('DFDA_UNIT_MAP', () => {
    it('maps common DFDA units to valid abbreviations', () => {
      expect(DFDA_UNIT_MAP['Milligrams']).toBe('mg');
      expect(DFDA_UNIT_MAP['International Units']).toBe('IU');
      expect(DFDA_UNIT_MAP['Grams']).toBe('g');
      expect(DFDA_UNIT_MAP['1 to 5 Rating']).toBe('1-5');
      expect(DFDA_UNIT_MAP['Capsules']).toBe('capsules');
    });

    it('all mapped values are valid UnitAbbreviations', () => {
      for (const [, abbr] of Object.entries(DFDA_UNIT_MAP)) {
        expect(UnitAbbreviations).toContain(abbr);
      }
    });
  });

  // =========================================================================
  // ParsedMeasurement type check (compile-time, but we can verify shape)
  // =========================================================================

  describe('ParsedMeasurement shape', () => {
    it('creates valid measurement objects', () => {
      const m: ParsedMeasurement = {
        variableName: 'Vitamin D',
        value: 5000,
        unitAbbreviation: 'IU',
        categoryName: 'Supplement',
        combinationOperation: 'SUM',
        startAt: '2026-02-06T08:00:00',
        note: 'took 5000 IU vitamin D',
      };
      expect(m.variableName).toBe('Vitamin D');
      expect(m.value).toBe(5000);
      expect(m.unitAbbreviation).toBe('IU');
      expect(m.categoryName).toBe('Supplement');
    });

    it('allows optional endAt', () => {
      const m: ParsedMeasurement = {
        variableName: 'Sleep Duration',
        value: 8,
        unitAbbreviation: 'h',
        categoryName: 'Sleep',
        combinationOperation: 'SUM',
        startAt: '2026-02-06T23:00:00',
        endAt: '2026-02-07T07:00:00',
        note: 'slept 8 hours',
      };
      expect(m.endAt).toBe('2026-02-07T07:00:00');
    });
  });
});
