import { z } from 'zod';

// Assuming the API returns a simple array of strings for suggestions.
// Example: ["Depression", "Depressive Disorder", "Major Depressive Disorder"]
// If the structure is more complex (e.g., array of objects), this schema will need to be adjusted.
export const ConditionSuggestionSchema = z.array(z.string());

export type ConditionSuggestion = z.infer<typeof ConditionSuggestionSchema>;

export const InterventionSuggestionSchema = z.array(z.string());
export type InterventionSuggestion = z.infer<typeof InterventionSuggestionSchema>; 