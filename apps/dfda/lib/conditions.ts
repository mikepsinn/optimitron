import type { Condition } from '@/types/condition';
import conditionsData from '@/data/conditions.json';

export const conditions = conditionsData as Condition[];

// Helper functions for server components (can be used directly)
export function getAllConditions(): Condition[] {
  return conditions;
}

export function getConditionBySlug(slug: string): Condition | undefined {
  return conditions.find((c) => c.slug === slug);
}

export function getConditionByName(name: string): Condition | undefined {
  return conditions.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

export function searchConditions(query: string): Condition[] {
  const lowerQuery = query.toLowerCase();
  return conditions.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.synonyms.some((s) => s.toLowerCase().includes(lowerQuery))
  );
}

export function getConditionsByCategory(category: string): Condition[] {
  return conditions.filter((c) => c.category === category);
}
