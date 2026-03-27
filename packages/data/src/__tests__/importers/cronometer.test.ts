import { describe, it, expect } from 'vitest';
import {
  parseCronometerExport,
  parseCronometerFoodDiary,
  summarizeCronometerExport,
} from '../../importers/cronometer';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const DAILY_NUTRITION_CSV = `Date,Energy (kcal),Protein (g),Fat (g),Carbs (g),Fiber (g),Sugar (g),Sodium (mg),Calcium (mg),Iron (mg),Vitamin C (mg),Vitamin D (µg),Zinc (mg),Magnesium (mg),Potassium (mg),Cholesterol (mg),Vitamin A (µg),Vitamin E (mg),Vitamin K (µg),Vitamin B12 (µg)
2024-01-15,2100,120,65,230,28,45,1800,950,15,85,12,11,380,3200,250,900,14,120,4.5
2024-01-16,1950,105,58,215,25,38,1650,880,13,72,10,9.5,350,2900,200,800,12,100,3.8`;

const FOOD_DIARY_CSV = `Date,Group,Food Name,Energy (kcal),Protein (g),Fat (g),Carbs (g)
2024-01-15,Breakfast,Oatmeal,300,10,5,50
2024-01-15,Breakfast,Blueberries,85,1,0,21
2024-01-15,Lunch,Chicken Breast,230,43,5,0
2024-01-15,Dinner,Salmon Fillet,350,35,22,0`;

// Simple header variations
const ALT_HEADERS_CSV = `Date,Calories,Protein,Fat,Carbs,Fiber,Sugar,Sodium,Calcium,Iron
2024-01-15,2100,120,65,230,28,45,1800,950,15`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Cronometer importer', () => {
  describe('parseCronometerExport (daily nutrition)', () => {
    it('parses macronutrients', () => {
      const records = parseCronometerExport(DAILY_NUTRITION_CSV);
      expect(records.length).toBeGreaterThan(0);

      const calories = records.filter((r) => r.variableName === 'Calories');
      expect(calories.length).toBe(2);
      expect(calories[0]!.value).toBe(2100);
      expect(calories[0]!.sourceName).toBe('Cronometer');

      const protein = records.filter((r) => r.variableName === 'Protein');
      expect(protein.length).toBe(2);
      expect(protein[0]!.value).toBe(120);

      const fat = records.filter((r) => r.variableName === 'Total Fat');
      expect(fat.length).toBe(2);
      expect(fat[0]!.value).toBe(65);

      const carbs = records.filter((r) => r.variableName === 'Carbohydrates');
      expect(carbs.length).toBe(2);
    });

    it('parses micronutrients', () => {
      const records = parseCronometerExport(DAILY_NUTRITION_CSV);

      const vitC = records.filter((r) => r.variableName === 'Vitamin C');
      expect(vitC.length).toBe(2);
      expect(vitC[0]!.value).toBe(85);
      expect(vitC[0]!.unitName).toBe('Milligrams');

      const vitD = records.filter((r) => r.variableName === 'Vitamin D');
      expect(vitD.length).toBe(2);
      expect(vitD[0]!.unitName).toBe('Micrograms');

      const iron = records.filter((r) => r.variableName === 'Iron');
      expect(iron.length).toBe(2);

      const zinc = records.filter((r) => r.variableName === 'Zinc');
      expect(zinc.length).toBe(2);

      const b12 = records.filter((r) => r.variableName === 'Vitamin B12');
      expect(b12.length).toBe(2);
      expect(b12[0]!.value).toBe(4.5);

      const vitK = records.filter((r) => r.variableName === 'Vitamin K');
      expect(vitK.length).toBe(2);

      const vitA = records.filter((r) => r.variableName === 'Vitamin A');
      expect(vitA.length).toBe(2);

      const magnesium = records.filter((r) => r.variableName === 'Magnesium');
      expect(magnesium.length).toBe(2);

      const potassium = records.filter((r) => r.variableName === 'Potassium');
      expect(potassium.length).toBe(2);

      const cholesterol = records.filter((r) => r.variableName === 'Cholesterol');
      expect(cholesterol.length).toBe(2);
    });

    it('handles alternative header format', () => {
      const records = parseCronometerExport(ALT_HEADERS_CSV);
      const calories = records.filter((r) => r.variableName === 'Calories');
      expect(calories.length).toBe(1);
      expect(calories[0]!.value).toBe(2100);
    });
  });

  describe('parseCronometerFoodDiary', () => {
    it('parses individual food entries with notes', () => {
      const records = parseCronometerFoodDiary(FOOD_DIARY_CSV);
      expect(records.length).toBeGreaterThan(0);

      // Each food entry should have nutrient columns
      const oatmealCals = records.find(
        (r) => r.variableName === 'Calories' && r.note?.includes('Oatmeal'),
      );
      expect(oatmealCals).toBeDefined();
      expect(oatmealCals!.value).toBe(300);

      // Meal context in notes
      const breakfastItems = records.filter((r) => r.note?.includes('Breakfast'));
      expect(breakfastItems.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('returns empty for empty input', () => {
      expect(parseCronometerExport('')).toEqual([]);
    });

    it('returns empty for headers only', () => {
      expect(parseCronometerExport('Date,Calories')).toEqual([]);
    });

    it('returns empty for CSV without date column', () => {
      expect(parseCronometerExport('Food,Calories\nApple,95')).toEqual([]);
    });

    it('skips zero values', () => {
      const csv = `Date,Calories\n2024-01-15,0`;
      expect(parseCronometerExport(csv).length).toBe(0);
    });
  });

  describe('summarizeCronometerExport', () => {
    it('produces correct summary with many variable types', () => {
      const records = parseCronometerExport(DAILY_NUTRITION_CSV);
      const summary = summarizeCronometerExport(records);

      expect(summary.totalRecords).toBe(records.length);
      expect(summary.sourceNames).toEqual(['Cronometer']);
      // Should have many different nutrient types
      expect(Object.keys(summary.variableCounts).length).toBeGreaterThan(10);
    });
  });
});
