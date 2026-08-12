// Normalization function for deduplication and robust filtering of intervention names
export function normalizeInterventionName(name: string): string {
  // First, convert to lower case for case-insensitive matching
  let normalized = name.toLowerCase();

  // Remove content in parentheses and brackets
  normalized = normalized.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '');

  // Remove specific dosage patterns (e.g., 10mg, 2.5 mg, 5 mg/day)
  // This looks for numbers, optional decimals, optional space, and common units
  normalized = normalized.replace(/\b\d+(\.\d+)?\s*(mg|g|mcg|µg|ml|iu|u)\b/gi, '');
  
  // Remove common administration routes and formulations
  normalized = normalized.replace(/\b(oral|iv|intravenous|transdermal|subcutaneous|intranasal|inhalation|topical|tablet|capsule|injection|patch|cream|ointment|pill|dose|hydrochloride|fumarate|tartrate)\b/gi, '');
  
  // Remove common joining words and qualifiers that often precede or follow the core name
  normalized = normalized.replace(/\b(therapy|single|medium|low|high|combination|drug|treatment|plus|with|and|or|for|of|administered)\b/gi, '');
  
  // Attempt to remove versioning or trial arm identifiers like 'arm 1', 'dose 2'
  normalized = normalized.replace(/\b(arm|phase|dose)\s+\d+\b/gi, '');

  // Remove any remaining numbers that are likely dosage related, but be careful not to remove numbers that are part of a drug name (e.g., 'DrugX-500').
  // This is a bit risky. Let's stick to removing numbers followed by units. A more aggressive version could be added if needed.
  // normalized = normalized.replace(/\b\d+\b/g, '');

  // Remove punctuation, but keep hyphens as they can be part of names
  normalized = normalized.replace(/[^\w\s-]/g, '');

  // Collapse whitespace and trim
  return normalized.replace(/\s+/g, ' ').trim();
} 