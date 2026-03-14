/**
 * Shared database-adjacent types.
 *
 * These are intentionally sourced from Prisma-generated types so schema
 * changes surface immediately in TypeScript.
 */

import type {
  CombinationOperation,
  FillingType,
  Jurisdiction,
  JurisdictionType,
  Item,
  PairwiseComparison,
  PreferenceWeight,
} from './generated/prisma/client.js';

export type DbCombinationOperation = CombinationOperation;
export type DbFillingType = FillingType;
export type DbJurisdictionType = JurisdictionType;

export type DbJurisdiction = Jurisdiction;
export type DbItem = Item;
export type DbPairwiseComparison = PairwiseComparison;
export type DbPreferenceWeight = PreferenceWeight;

/**
 * Canonical parsed health record shape emitted by data importers.
 * This remains transport-level (not a Prisma row).
 */
export interface ParsedHealthRecord {
  variableName: string;
  variableCategoryName: string;
  value: number;
  unitName: string;
  unitAbbreviation: string;
  startAt: string;
  endAt: string;
  sourceName: string;
  note?: string;
}

/**
 * Canonical parsed measurement shape emitted by NLP.
 * Uses Prisma-generated `CombinationOperation`.
 */
export interface ParsedMeasurement {
  variableName: string;
  value: number;
  unitAbbreviation: string;
  categoryName: string;
  combinationOperation: CombinationOperation;
  startAt: string;
  endAt?: string | null;
  note: string;
}
