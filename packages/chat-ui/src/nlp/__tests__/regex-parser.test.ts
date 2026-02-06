import { describe, it, expect } from 'vitest';
import { parseWithRegex } from '../regex-parser.js';

describe('parseWithRegex', () => {
  // =========================================================================
  // Empty / invalid input
  // =========================================================================

  describe('empty input', () => {
    it('returns empty array for empty string', () => {
      expect(parseWithRegex('')).toEqual([]);
    });

    it('returns empty array for whitespace-only string', () => {
      expect(parseWithRegex('   ')).toEqual([]);
    });

    it('returns empty array for unrecognized text', () => {
      expect(parseWithRegex('hello world')).toEqual([]);
    });
  });

  // =========================================================================
  // Pattern: "took X <unit> of Y"
  // =========================================================================

  describe('took X <unit> of Y', () => {
    it('parses "took 500 mg of magnesium"', () => {
      const results = parseWithRegex('took 500 mg of magnesium');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Magnesium',
        value: 500,
        unitAbbreviation: 'mg',
        categoryName: 'Supplement',
        combinationOperation: 'SUM',
      });
    });

    it('parses "took 5000 IU vitamin D"', () => {
      const results = parseWithRegex('took 5000 IU vitamin D');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Vitamin D',
        value: 5000,
        unitAbbreviation: 'IU',
        categoryName: 'Supplement',
      });
    });

    it('parses "took 2 tablets of ibuprofen"', () => {
      const results = parseWithRegex('took 2 tablets of ibuprofen');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Ibuprofen',
        value: 2,
        unitAbbreviation: 'tablets',
        categoryName: 'Treatment',
      });
    });

    it('parses "took 1 capsule of fish oil"', () => {
      const results = parseWithRegex('took 1 capsule of fish oil');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Fish Oil',
        value: 1,
        unitAbbreviation: 'capsules',
      });
    });

    it('parses "took 200 mcg of selenium"', () => {
      const results = parseWithRegex('took 200 mcg of selenium');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Selenium',
        value: 200,
        unitAbbreviation: 'mcg',
      });
    });

    it('parses decimal values "took 0.5 mg of melatonin"', () => {
      const results = parseWithRegex('took 0.5 mg of melatonin');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Melatonin',
        value: 0.5,
        unitAbbreviation: 'mg',
        categoryName: 'Supplement',
      });
    });

    it('parses without "of" — "took 400 mg magnesium"', () => {
      const results = parseWithRegex('took 400 mg magnesium');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Magnesium',
        value: 400,
        unitAbbreviation: 'mg',
      });
    });
  });

  // =========================================================================
  // Pattern: "X <unit> Y" or "Y X <unit>"
  // =========================================================================

  describe('dose patterns without "took"', () => {
    it('parses "500 mg magnesium"', () => {
      const results = parseWithRegex('500 mg magnesium');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Magnesium',
        value: 500,
        unitAbbreviation: 'mg',
      });
    });

    it('parses "vitamin D 5000 IU"', () => {
      const results = parseWithRegex('vitamin D 5000 IU');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Vitamin D',
        value: 5000,
        unitAbbreviation: 'IU',
      });
    });

    it('parses "aspirin 325 mg"', () => {
      const results = parseWithRegex('aspirin 325 mg');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Aspirin',
        value: 325,
        unitAbbreviation: 'mg',
        categoryName: 'Treatment',
      });
    });
  });

  // =========================================================================
  // Pattern: Rating "X/N" or "X out of N"
  // =========================================================================

  describe('ratings', () => {
    it('parses "mood 4/5"', () => {
      const results = parseWithRegex('mood 4/5');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Overall Mood',
        value: 4,
        unitAbbreviation: '1-5',
        categoryName: 'Emotion',
        combinationOperation: 'MEAN',
      });
    });

    it('parses "energy 3/5"', () => {
      const results = parseWithRegex('energy 3/5');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Energy Level',
        value: 3,
        unitAbbreviation: '1-5',
        categoryName: 'Emotion',
      });
    });

    it('parses "anxiety 7/10"', () => {
      const results = parseWithRegex('anxiety 7/10');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Anxiety',
        value: 7,
        unitAbbreviation: '1-10',
        categoryName: 'Symptom',
      });
    });

    it('parses "pain 3 out of 5"', () => {
      const results = parseWithRegex('pain 3 out of 5');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Pain',
        value: 3,
        unitAbbreviation: '1-5',
        categoryName: 'Symptom',
      });
    });

    it('parses "headache severity 3"', () => {
      const results = parseWithRegex('headache severity 3');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Headache Severity',
        value: 3,
        unitAbbreviation: '1-5',
        categoryName: 'Symptom',
      });
    });

    it('parses simple rating "mood 4"', () => {
      const results = parseWithRegex('mood 4');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Overall Mood',
        value: 4,
        categoryName: 'Emotion',
      });
    });

    it('parses "fatigue 5"', () => {
      const results = parseWithRegex('fatigue 5');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Fatigue',
        value: 5,
        categoryName: 'Symptom',
      });
    });

    it('parses "brain fog 2/5"', () => {
      const results = parseWithRegex('brain fog 2/5');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Brain Fog',
        value: 2,
        unitAbbreviation: '1-5',
        categoryName: 'Symptom',
      });
    });

    it('parses unknown rating variable "bloating severity 3"', () => {
      const results = parseWithRegex('bloating severity 3');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Bloating Severity',
        value: 3,
        categoryName: 'Symptom',
      });
    });

    it('parses unknown rating "dizziness 4/5"', () => {
      const results = parseWithRegex('dizziness 4/5');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Dizziness',
        value: 4,
        unitAbbreviation: '1-5',
        categoryName: 'Symptom',
      });
    });
  });

  // =========================================================================
  // Pattern: Food / meal logging
  // =========================================================================

  describe('food and meals', () => {
    it('parses "had coffee for breakfast"', () => {
      const results = parseWithRegex('had coffee for breakfast');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Coffee',
        value: 1,
        categoryName: 'Drink',
      });
      expect(results[0].startAt).toContain('T08:00:00');
    });

    it('parses "ate eggs for breakfast"', () => {
      const results = parseWithRegex('ate eggs for breakfast');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Eggs',
        value: 1,
        categoryName: 'Food',
      });
    });

    it('parses "had salad for lunch"', () => {
      const results = parseWithRegex('had salad for lunch');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Salad',
        value: 1,
        categoryName: 'Food',
      });
      expect(results[0].startAt).toContain('T12:00:00');
    });

    it('parses "had steak for dinner"', () => {
      const results = parseWithRegex('had steak for dinner');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Steak',
        value: 1,
        categoryName: 'Food',
      });
      expect(results[0].startAt).toContain('T18:00:00');
    });

    it('parses standalone food name "coffee"', () => {
      const results = parseWithRegex('coffee');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Coffee',
        categoryName: 'Drink',
      });
    });

    it('parses standalone food name "banana"', () => {
      const results = parseWithRegex('banana');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Banana',
        categoryName: 'Food',
      });
    });

    it('parses "ate oatmeal"', () => {
      const results = parseWithRegex('ate oatmeal');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Oatmeal',
        categoryName: 'Food',
      });
    });

    it('parses unknown food in meal context', () => {
      const results = parseWithRegex('had tacos for lunch');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Tacos',
        value: 1,
        unitAbbreviation: 'servings',
        categoryName: 'Food',
      });
    });

    it('parses "pizza for dinner"', () => {
      const results = parseWithRegex('pizza for dinner');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Pizza',
        categoryName: 'Food',
      });
      expect(results[0].startAt).toContain('T18:00:00');
    });
  });

  // =========================================================================
  // Pattern: Sleep
  // =========================================================================

  describe('sleep', () => {
    it('parses "slept 8 hours"', () => {
      const results = parseWithRegex('slept 8 hours');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Sleep Duration',
        value: 8,
        unitAbbreviation: 'h',
        categoryName: 'Sleep',
        combinationOperation: 'SUM',
      });
    });

    it('parses "slept 7.5 hrs"', () => {
      const results = parseWithRegex('slept 7.5 hrs');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Sleep Duration',
        value: 7.5,
        unitAbbreviation: 'h',
      });
    });
  });

  // =========================================================================
  // Pattern: Exercise
  // =========================================================================

  describe('exercise', () => {
    it('parses "walked 10000 steps"', () => {
      const results = parseWithRegex('walked 10000 steps');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Exercise Duration',
        value: 10000,
        unitAbbreviation: 'steps',
        categoryName: 'Exercise',
      });
    });

    it('parses "ran 30 minutes"', () => {
      const results = parseWithRegex('ran 30 minutes');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Exercise Duration',
        value: 30,
        unitAbbreviation: 'min',
      });
    });
  });

  // =========================================================================
  // Pattern: Body weight
  // =========================================================================

  describe('weight', () => {
    it('parses "weight 165 lbs"', () => {
      const results = parseWithRegex('weight 165 lbs');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Body Weight',
        value: 165,
        unitAbbreviation: 'lb',
        categoryName: 'Vital Sign',
        combinationOperation: 'MEAN',
      });
    });

    it('parses "weigh 75 kg"', () => {
      const results = parseWithRegex('weigh 75 kg');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        variableName: 'Body Weight',
        value: 75,
        unitAbbreviation: 'kg',
      });
    });
  });

  // =========================================================================
  // Multiple items (comma/and separated)
  // =========================================================================

  describe('multiple items', () => {
    it('parses comma-separated items', () => {
      const results = parseWithRegex('coffee, banana, eggs');
      expect(results).toHaveLength(3);
      expect(results[0].variableName).toBe('Coffee');
      expect(results[1].variableName).toBe('Banana');
      expect(results[2].variableName).toBe('Eggs');
    });

    it('parses "and"-separated items', () => {
      const results = parseWithRegex('coffee and eggs');
      expect(results).toHaveLength(2);
      expect(results[0].variableName).toBe('Coffee');
      expect(results[1].variableName).toBe('Eggs');
    });

    it('parses mixed treatments and ratings', () => {
      const results = parseWithRegex('took 500 mg magnesium, mood 4/5');
      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        variableName: 'Magnesium',
        value: 500,
        unitAbbreviation: 'mg',
      });
      expect(results[1]).toMatchObject({
        variableName: 'Overall Mood',
        value: 4,
        unitAbbreviation: '1-5',
      });
    });
  });

  // =========================================================================
  // Note field
  // =========================================================================

  describe('note field', () => {
    it('includes original text as note', () => {
      const results = parseWithRegex('took 500 mg magnesium');
      expect(results[0].note).toBe('took 500 mg magnesium');
    });

    it('includes segment text as note for multi-item input', () => {
      const results = parseWithRegex('coffee, banana');
      expect(results[0].note).toBe('coffee');
      expect(results[1].note).toBe('banana');
    });
  });

  // =========================================================================
  // startAt field
  // =========================================================================

  describe('startAt field', () => {
    it('generates valid ISO datetime string', () => {
      const results = parseWithRegex('coffee');
      expect(results[0].startAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });

    it('uses meal time for meal-context items', () => {
      const results = parseWithRegex('had eggs for breakfast');
      expect(results[0].startAt).toContain('T08:00:00');
    });
  });
});
