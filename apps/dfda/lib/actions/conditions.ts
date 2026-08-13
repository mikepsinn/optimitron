'use server';

import type { Condition } from '@/types/condition';
import { getAllConditions } from '@/lib/conditions';

export async function getConditionsAction(): Promise<Condition[]> {
  try {
    return getAllConditions();
  } catch (error) {
    console.error('Error fetching conditions:', error);
    throw new Error('Failed to fetch conditions');
  }
}
