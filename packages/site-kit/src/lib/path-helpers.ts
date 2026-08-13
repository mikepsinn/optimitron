import slugify from 'slugify';

/**
 * Converts a name to a URL-safe slug.
 *
 * @param name - The name to convert to a slug
 * @returns A URL-safe slug
 */
export function nameToSlug(name: string): string {
  return slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });
}

/**
 * Generates a URL for the /find-trials page with condition and intervention as query parameters.
 *
 * @param interventionName - The name of the intervention (e.g., drug name, therapy type).
 * @param conditionName - The name of the medical condition.
 * @returns A string representing the path, e.g., "/find-trials?condition=EncodedCondition&intervention=EncodedIntervention".
 */
export function generatePatientTrialSearchPath(
  interventionName: string,
  conditionName: string,
): string {
  if (!conditionName) {
    console.warn(
      "generatePatientTrialSearchPath: conditionName is missing. Defaulting to /find-trials without specific condition.",
    );
    return "/find-trials";
  }

  const params = new URLSearchParams();
  params.append("condition", conditionName);
  if (interventionName) {
    params.append("intervention", interventionName);
  }

  return `/find-trials?${params.toString()}`;
}

/**
 * Generates a URL for the single condition page.
 *
 * @param conditionSlug - The slug of the medical condition (URL-safe identifier).
 * @returns A string representing the path, e.g., "/conditions/major-depressive-disorder".
 */
export function generateConditionPagePath(conditionSlug: string): string {
  if (!conditionSlug) {
    console.warn(
      "generateConditionPagePath: conditionSlug is missing. Cannot generate path.",
    );
    return "#"; // Or throw an error, or return a sensible default like "/conditions"
  }
  // conditionSlug is already URL-safe, no need to encode
  return `/conditions/${conditionSlug}`;
}

/**
 * Generates a URL for the outcome label page for a specific intervention.
 *
 * @param interventionName - The name of the intervention.
 * @returns A string representing the path, e.g., "/outcome-labels/EncodedInterventionName".
 */
export function generateOutcomeLabelPagePath(interventionName: string): string {
  if (!interventionName) {
    console.warn(
      "generateOutcomeLabelPagePath: interventionName is missing. Cannot generate path.",
    );
    return "#"; // Or a sensible default
  }
  return `/outcome-labels/${encodeURIComponent(interventionName)}`;
}

/**
 * Generates a URL for the single treatment page.
 *
 * @param treatmentSlug - The slug of the treatment (URL-safe identifier).
 * @returns A string representing the path, e.g., "/treatments/amphetamine".
 */
export function generateTreatmentPagePath(treatmentSlug: string): string {
  if (!treatmentSlug) {
    console.warn(
      "generateTreatmentPagePath: treatmentSlug is missing. Cannot generate path.",
    );
    return "#";
  }
  return `/treatments/${treatmentSlug}`;
}

/**
 * Generates a URL for the condition-specific treatment page.
 *
 * @param conditionSlug - The slug of the condition.
 * @param treatmentSlug - The slug of the treatment.
 * @returns A string representing the path, e.g., "/conditions/adhd/treatments/amphetamine".
 */
export function generateConditionTreatmentPagePath(
  conditionSlug: string,
  treatmentSlug: string
): string {
  if (!conditionSlug || !treatmentSlug) {
    console.warn(
      "generateConditionTreatmentPagePath: missing parameters.",
      { conditionSlug, treatmentSlug }
    );
    return "#";
  }
  return `/conditions/${conditionSlug}/treatments/${treatmentSlug}`;
} 