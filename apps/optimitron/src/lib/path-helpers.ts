import { medicalNameToSlug } from "@optimitron/data/datasets/medical-slug";
import { ROUTES } from "@/lib/routes";

export function nameToSlug(name: string): string {
  return medicalNameToSlug(name);
}

export function generatePatientTrialSearchPath(
  interventionName: string,
  conditionName: string,
): string {
  if (!conditionName) {
    return "/find-trials";
  }

  const params = new URLSearchParams();
  params.append("condition", conditionName);
  if (interventionName) {
    params.append("intervention", interventionName);
  }

  return `/find-trials?${params.toString()}`;
}

export function generateConditionPagePath(conditionSlug: string): string {
  if (!conditionSlug) return "#";
  return `${ROUTES.conditions}/${conditionSlug}`;
}

export function generateOutcomeLabelPagePath(interventionName: string): string {
  if (!interventionName) return "#";
  return `/outcome-labels/${encodeURIComponent(interventionName)}`;
}

export function generateTreatmentPagePath(treatmentSlug: string): string {
  if (!treatmentSlug) return "#";
  return `${ROUTES.treatments}/${treatmentSlug}`;
}

export function generateConditionTreatmentPagePath(
  conditionSlug: string,
  treatmentSlug: string,
): string {
  if (!conditionSlug || !treatmentSlug) return "#";
  return `${ROUTES.conditions}/${conditionSlug}/treatments/${treatmentSlug}`;
}
