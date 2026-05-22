export const DATING_SAFETY_ACK_VERSION = "2026-05-21";

export const DATING_SAFETY_COPY = {
  title: "Mission Safety",
  body:
    "Earth Optimization Missions are one-hour sessions for ending war and disease. You may fall madly in love if you insist. But keep in mind, 150 thousand people die of disease every day, so please spend the hour eradicating disease instead of hugging and/or kissing.",
  acknowledgement:
    "I am 18 or older. I understand Earth Optimization Missions are campaign sessions, not a promise that another human is safe, honest, available, or good at posters.",
  rules: [
    "Meet in public. Tell someone where you are going. Leave whenever you want.",
    "Do not send money, bank details, passwords, identity documents, or emergency favors to a match.",
    "Report weird behavior. Block anyone who makes ending war and disease worse.",
    "If you are in immediate danger, call local emergency services.",
  ],
} as const;

export function hasDatingSafetyAcknowledgement(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }

  const record = metadata as Record<string, unknown>;

  return (
    typeof record.datingAdultAcknowledgedAt === "string" &&
    typeof record.datingSafetyAcknowledgedAt === "string" &&
    record.datingSafetyAcknowledgedVersion === DATING_SAFETY_ACK_VERSION
  );
}

export function withDatingSafetyAcknowledgement(
  metadata: unknown,
  acknowledgedAt: string,
) {
  const base =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};

  return {
    ...base,
    datingAdultAcknowledgedAt: acknowledgedAt,
    datingPlatonicAcknowledgedAt: acknowledgedAt,
    datingSafetyAcknowledgedAt: acknowledgedAt,
    datingSafetyAcknowledgedVersion: DATING_SAFETY_ACK_VERSION,
  };
}
