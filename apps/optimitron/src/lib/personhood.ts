export const PERSONHOOD_PROVIDER_VALUES = ["WORLD_ID", "HUMAN_PASSPORT"] as const;

export type PersonhoodProviderValue = (typeof PERSONHOOD_PROVIDER_VALUES)[number];

const PERSONHOOD_PROVIDER_LABELS: Record<PersonhoodProviderValue, string> = {
  WORLD_ID: "World ID",
  HUMAN_PASSPORT: "Human Passport",
};

export function getPersonhoodProviderLabel(provider: PersonhoodProviderValue | null | undefined) {
  return provider ? PERSONHOOD_PROVIDER_LABELS[provider] : "Unverified";
}
