import { z } from 'zod';

/**
 * Jurisdiction types and schemas
 * 
 * Jurisdictions are hierarchical: Country > State > County > City
 * Each can have different policies and outcomes measured.
 */

export const JurisdictionTypeSchema = z.enum([
  'country',
  'state',
  'county',
  'city',
  'region', // EU regions, etc.
]);

export type JurisdictionType = z.infer<typeof JurisdictionTypeSchema>;

export const JurisdictionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: JurisdictionTypeSchema,
  parentId: z.string().optional(),
  isoCode: z.string().optional(),
  population: z.number().optional(),
  gdpPerCapita: z.number().optional(),
  dataQualityScore: z.number().min(0).max(1).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type Jurisdiction = z.infer<typeof JurisdictionSchema>;

// Common jurisdictions for quick reference
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const;

export type USState = typeof US_STATES[number];
