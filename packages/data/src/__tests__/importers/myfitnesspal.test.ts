import { describe, it, expect } from 'vitest';
import {
  parseMyFitnessPalExport,
  parseMyFitnessPalExercise,
  summarizeMyFitnessPalExport,
} from '../../importers/myfitnesspal.js';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const FOOD_DIARY_CSV = `Date,Meal,Food Name,Calories,Fat (g),Protein (g),Carbohydrates (g),Sugar (g),Sodium (mg),Fiber (g)
2024-01-15,Breakfast,Oatmeal with Berries,350,8,12,55,15,10,6
2024-01-15,Breakfast,Greek Yogurt,120,0,20,8,6,65,0
2024-01-15,Lunch,Chicken Salad,450,18,35,22,4,680,5
2024-01-15,Dinner,Salmon with Rice,650,22,42,48,2,420,3
2024-01-15,Snacks,Apple,95,0,0,25,19,2,4`;

const DAILY_TOTALS_CSV = `Date,Calories,Fat (g),Protein (g),Carbs (g)
2024-01-15,2100,48,109,158
2024-01-16,1850,42,95,140`;

const EXERCISE_CSV = `Date,Exercise Name,Calories Burned,Minutes
2024-01-15,Running,350,30
2024-01-15,Cycling,250,45`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MyFitnessPal importer', () => {
  describe('parseMyFitnessPalExport (food diary)', () => {
    it('parses nutrient columns', () => {
      const records = parseMyFitnessPalExport(FOOD_DIARY_CSV);
      expect(records.length).toBeGreaterThan(0);

      // Should have calories for each row
      const calories = records.filter((r) => r.variableName === 'Calories');
      expect(calories.length).toBe(5);
      expect(calories[0]!.value).toBe(350);
      expect(calories[0]!.sourceName).toBe('MyFitnessPal');

      // Check protein (Apple has 0 protein, so it's skipped → 4 not 5)
      const protein = records.filter((r) => r.variableName === 'Protein');
      expect(protein.length).toBe(4);
      expect(protein[0]!.value).toBe(12);

      // Check sodium
      const sodium = records.filter((r) => r.variableName === 'Sodium');
      expect(sodium.length).toBeGreaterThan(0);
    });

    it('creates individual food item records', () => {
      const records = parseMyFitnessPalExport(FOOD_DIARY_CSV);
      const oatmeal = records.find((r) => r.variableName === 'Oatmeal with Berries');
      expect(oatmeal).toBeDefined();
      expect(oatmeal!.value).toBe(350);
      expect(oatmeal!.variableCategoryName).toBe('Foods');
      expect(oatmeal!.note).toBe('Breakfast');
    });

    it('includes meal context in notes', () => {
      const records = parseMyFitnessPalExport(FOOD_DIARY_CSV);
      const notesWithMeal = records.filter((r) => r.note?.includes('Breakfast'));
      expect(notesWithMeal.length).toBeGreaterThan(0);
    });
  });

  describe('parseMyFitnessPalExport (daily totals)', () => {
    it('parses daily totals format', () => {
      const records = parseMyFitnessPalExport(DAILY_TOTALS_CSV);
      expect(records.length).toBeGreaterThan(0);

      const calories = records.filter((r) => r.variableName === 'Calories');
      expect(calories.length).toBe(2);
      expect(calories[0]!.value).toBe(2100);
    });
  });

  describe('parseMyFitnessPalExercise', () => {
    it('parses exercise entries', () => {
      const records = parseMyFitnessPalExercise(EXERCISE_CSV);
      expect(records.length).toBe(4); // calories + duration for each exercise

      const calBurned = records.filter((r) => r.variableName === 'Calories Burned');
      expect(calBurned.length).toBe(2);
      expect(calBurned[0]!.value).toBe(350);
    });
  });

  describe('edge cases', () => {
    it('returns empty for empty input', () => {
      expect(parseMyFitnessPalExport('')).toEqual([]);
    });

    it('returns empty for headers only', () => {
      expect(parseMyFitnessPalExport('Date,Calories')).toEqual([]);
    });

    it('returns empty for CSV without date column', () => {
      expect(parseMyFitnessPalExport('Food,Calories\nApple,95')).toEqual([]);
    });

    it('skips rows with zero values', () => {
      const csv = `Date,Calories\n2024-01-15,0`;
      const records = parseMyFitnessPalExport(csv);
      expect(records.length).toBe(0);
    });

    it('handles commas in numbers', () => {
      const csv = `Date,Calories\n2024-01-15,"1,234"`;
      const records = parseMyFitnessPalExport(csv);
      expect(records[0]!.value).toBe(1234);
    });
  });

  describe('summarizeMyFitnessPalExport', () => {
    it('produces correct summary', () => {
      const records = parseMyFitnessPalExport(FOOD_DIARY_CSV);
      const summary = summarizeMyFitnessPalExport(records);

      expect(summary.totalRecords).toBe(records.length);
      expect(summary.sourceNames).toEqual(['MyFitnessPal']);
      expect(summary.warnings).toEqual([]);
    });
  });
});
