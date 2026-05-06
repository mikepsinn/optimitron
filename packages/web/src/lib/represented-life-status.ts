import { PersonLifeStatus } from "@optimitron/db/enums";

export function getRepresentedLifeStatusLabel(
  status: PersonLifeStatus,
): string {
  if (status === PersonLifeStatus.DECEASED) {
    return "Plaintiff who can no longer sign";
  }
  if (status === PersonLifeStatus.LIVING) {
    return "Plaintiff represented by another human";
  }
  return "Plaintiff in the case";
}
