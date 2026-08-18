import {
  EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME,
  EARTH_OPTIMIZATION_SERVICES_PUBLIC_CONTACT_EMAIL,
} from "@optimitron/db/system-identities";

export const EARTH_OPTIMIZATION_SERVICES = {
  displayName: "Earth Optimization Services",
  legalName: EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME,
  legalForm: "Delaware public benefit corporation taxed as a C corporation",
  publicContactEmail: EARTH_OPTIMIZATION_SERVICES_PUBLIC_CONTACT_EMAIL,
  businessDescription:
    "Develops and operates Optimitron, publishes public-interest research, and conducts public-advocacy and shareholder-engagement campaigns.",
  mailingAddress: {
    line1: "150 E B St Lbby #1810",
    line2: "SMB #99818",
    city: "Casper",
    state: "WY",
    postalCode: "82601",
    country: "USA",
    countryCode: "US",
  },
} as const;
