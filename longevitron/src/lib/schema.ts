import { z } from 'zod';

/** How a record field maps to a column in one row of a saved JSON source. */
export const SourceTableSchema = z.object({
  /** Top-level key of the row array in the source JSON. */
  rows: z.string(),
  /** Column that identifies one row. Records store its value as `rowKey`. */
  key: z.string(),
  /** Record field → source column. Each mapped field must match exactly. */
  fields: z.record(z.string(), z.string()),
});

export const SourceDefinitionSchema = z.object({
  id: z.string(),
  publisher: z.string(),
  title: z.string(),
  url: z.string().url(),
  table: SourceTableSchema,
});

export const ManifestEntrySchema = z.object({
  id: z.string(),
  url: z.string().url(),
  file: z.string(),
  retrievedAt: z.string().datetime(),
  /** SHA-256 of the raw response bytes, before gzip. */
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  bytes: z.number().int().positive(),
});

export const DataRecordSchema = z.object({
  id: z.string(),
  variable: z.string(),
  unit: z.string(),
  geo: z.string(),
  year: z.number().int(),
  value: z.number(),
  low: z.number().optional(),
  high: z.number().optional(),
  source: z.string(),
  rowKey: z.union([z.number(), z.string()]),
});

export const CountrySchema = z.object({
  code: z.string(),
  name: z.string(),
  region: z.string(),
  source: z.string(),
  rowKey: z.string(),
});

export type SourceDefinition = z.infer<typeof SourceDefinitionSchema>;
export type ManifestEntry = z.infer<typeof ManifestEntrySchema>;
export type DataRecord = z.infer<typeof DataRecordSchema>;
export type Country = z.infer<typeof CountrySchema>;

/** Record fields that hold numbers a page can display. */
export const NUMERIC_FIELDS = ['value', 'low', 'high'] as const;
export type NumericField = (typeof NUMERIC_FIELDS)[number];
