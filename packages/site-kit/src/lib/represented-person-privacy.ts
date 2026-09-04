import {
  PersonLifeStatus,
  PersonMemorialEvidenceKind,
} from "@optimitron/db/enums"

export function shouldPublishRepresentedCondition(input: {
  healthDisclosureConfirmed: boolean
  isPublic: boolean
  lifeStatus: PersonLifeStatus
  publicDisplayAcknowledged: boolean
  showConditionPublicly: boolean
}): boolean {
  if (!input.isPublic) return false
  if (input.lifeStatus === PersonLifeStatus.DECEASED) {
    return input.publicDisplayAcknowledged
  }
  return input.showConditionPublicly && input.healthDisclosureConfirmed
}

export function isSelfServeMemorialEvidenceKindAllowed(
  evidenceKind: PersonMemorialEvidenceKind,
): boolean {
  return evidenceKind !== PersonMemorialEvidenceKind.HOSPITAL_RECORD
}
