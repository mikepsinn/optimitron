import { OrgType } from "@optimitron/db";
import type { GovernmentLeaderRecord } from "@optimitron/data/datasets/government-leaders";

export interface GovernmentPersonDraftInput {
  countryCode: string | null;
  currentAffiliation: string | null;
  displayName: string;
  image?: string | null;
  isPublicFigure: boolean;
  roleTitle: string | null;
  sourceRef: string | null;
  sourceUrl: string | null;
}

export function getGovernmentTaskActorLabel(slot: GovernmentLeaderRecord) {
  return slot.leaderName ?? slot.decisionMakerLabel;
}

export function buildGovernmentOrganizationDraft(slot: GovernmentLeaderRecord) {
  return {
    name: slot.governmentName,
    sourceRef: `organization:government:${slot.countryCode.toLowerCase()}`,
    sourceUrl: slot.officialSourceUrl ?? slot.contactUrl ?? slot.governmentWebsite,
    type: OrgType.GOVERNMENT,
    website: slot.governmentWebsite,
  };
}

export function buildGovernmentLeaderPersonDraft(
  slot: GovernmentLeaderRecord,
): GovernmentPersonDraftInput | null {
  if (!slot.leaderName || !slot.leaderSourceRef) {
    return null;
  }

  return {
    countryCode: slot.countryCode,
    currentAffiliation: slot.governmentName,
    displayName: slot.leaderName,
    image: slot.leaderImageUrl ?? null,
    isPublicFigure: true,
    roleTitle: slot.roleTitle,
    sourceRef: slot.leaderSourceRef,
    sourceUrl: slot.officialSourceUrl ?? slot.contactUrl ?? null,
  };
}
