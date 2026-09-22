import { medicalNameToSlug } from "@optimitron/data/datasets/medical-slug";

export function nameToSlug(name: string): string {
  return medicalNameToSlug(name);
}

export function generateOutcomeLabelPagePath(interventionName: string): string {
  if (!interventionName) return "#";
  return `/outcome-labels/${encodeURIComponent(interventionName)}`;
}
