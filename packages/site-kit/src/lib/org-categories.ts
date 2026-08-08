import { OrgType } from "@optimitron/db"

/**
 * Map campaign-app "category" labels onto optimitron OrgType.
 * OrgCategory enum no longer exists — Organization.type is OrgType.
 */
export const ORG_CATEGORY_LABELS: Partial<Record<OrgType, string>> = {
  [OrgType.UNIVERSITY]: "UNIVERSITY / MEDICAL SCHOOL",
  [OrgType.RESEARCH_CENTER]: "RESEARCH CENTER / INSTITUTE",
  [OrgType.HOSPITAL]: "HOSPITAL / HEALTH SYSTEM",
  [OrgType.NONPROFIT]: "NONPROFIT / FOUNDATION",
  [OrgType.DAO]: "DAO",
  [OrgType.ADVOCACY]: "PATIENT ADVOCACY GROUP",
  [OrgType.GOVERNMENT]: "GOVERNMENT RESEARCH AGENCY",
  [OrgType.GOVERNMENT_AGENCY]: "GOVERNMENT RESEARCH AGENCY",
  [OrgType.BIOTECH]: "BIOTECH / PHARMA COMPANY",
  [OrgType.FOUNDATION]: "NONPROFIT / FOUNDATION",
  [OrgType.COMPANY]: "BIOTECH / PHARMA COMPANY",
  [OrgType.OTHER]: "OTHER",
  [OrgType.DIVISION]: "DIH DIVISION",
  [OrgType.INSTITUTE]: "INSTITUTE",
}

export type OrgCategory = OrgType

export function getOrgCategoryOptions() {
  return Object.entries(ORG_CATEGORY_LABELS).map(([value, label]) => ({
    value: value as OrgType,
    label: label as string,
  }))
}

export function getOrgCategoryLabel(category: OrgType | string | null | undefined): string {
  if (!category) return "OTHER"
  return ORG_CATEGORY_LABELS[category as OrgType] || String(category)
}
