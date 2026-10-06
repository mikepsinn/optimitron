/**
 * Ways to work with the Institute, in the order the sign-up form shows them.
 * The home page's partner cards link to /contact?type=<value>.
 */
export const PARTNER_TYPES = [
  "clinic",
  "builder",
  "data-partner",
  "funder",
  "advisory-board",
  "other",
] as const;

export type PartnerType = (typeof PARTNER_TYPES)[number];

export const PARTNER_TYPE_OPTIONS: Record<
  PartnerType,
  { label: string; description: string; messagePlaceholder: string }
> = {
  clinic: {
    label: "Clinic or doctor",
    description: "Run a pilot site, serve on a review board, or advise on the protocol.",
    messagePlaceholder: "Where you practice and how you would like to take part.",
  },
  builder: {
    label: "Organization building its own version",
    description: "Build on the open protocol and code, and publish results in the same format.",
    messagePlaceholder: "What you are building and who it serves.",
  },
  "data-partner": {
    label: "Data partner",
    description: "Share outcome data from an app, record system, registry or wearable.",
    messagePlaceholder: "What outcome data you hold and how patients use your product.",
  },
  funder: {
    label: "Donor or funder",
    description: "Fund public education, pragmatic-trial research and the open software.",
    messagePlaceholder: "What you would like to fund.",
  },
  "advisory-board": {
    label: "Advisory board",
    description: "For clinicians, researchers, ethicists, lawyers and patient advocates.",
    messagePlaceholder: "Your field, your experience and what you would like to review.",
  },
  other: {
    label: "Something else",
    description: "Tell us what you have in mind.",
    messagePlaceholder: "What you have in mind.",
  },
};

export function isPartnerType(value: unknown): value is PartnerType {
  return PARTNER_TYPES.includes(value as PartnerType);
}
