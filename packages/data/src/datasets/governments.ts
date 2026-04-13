import type { GovernmentMetrics } from "./government-report-cards";
import { GOVERNMENTS } from "./government-report-cards";
import {
  GOVERNMENT_ISO2_TO_ISO3,
  getGovernmentCodeForIso3,
  getGovernmentDisplayName,
  getGovernmentIso3,
} from "./government-code-map";
import type { WorldLeaderRow } from "./world-leaders";
import { getLeader } from "./world-leaders";

export interface GovernmentOfficeRecord {
  contactEmail: string | null;
  contactLabel: string | null;
  contactUrl: string | null;
  headOfGovernmentLabel: string | null;
  headOfGovernmentTitle: string | null;
  officialSourceUrl: string | null;
}

export interface GovernmentRecord {
  code: string;
  countryName: string;
  governmentName: string;
  governmentWebsite: string | null;
  iso3: string | null;
  office: GovernmentOfficeRecord;
}

export interface GovernmentWithLeader extends GovernmentRecord {
  leader: WorldLeaderRow | null;
}

export interface GovernmentProfile extends GovernmentWithLeader {
  flag: string | null;
  metrics: GovernmentMetrics | null;
}

export interface GovernmentIdentityInput {
  code?: string | null;
  countryName?: string | null;
  iso3?: string | null;
}

const GOVERNMENT_REGISTRY_ROWS: GovernmentRecord[] = [
  {
    code: "US",
    countryName: "United States",
    governmentName: "United States Government",
    governmentWebsite: "https://www.whitehouse.gov/",
    iso3: "USA",
    office: {
      contactEmail: null,
      contactLabel: "White House contact form",
      contactUrl: "https://www.whitehouse.gov/contact/",
      headOfGovernmentLabel: "President of the United States",
      headOfGovernmentTitle: "President",
      officialSourceUrl: "https://www.whitehouse.gov/administration/",
    },
  },
  {
    code: "CN",
    countryName: "China",
    governmentName: "Government of the People's Republic of China",
    governmentWebsite: "https://english.www.gov.cn/",
    iso3: "CHN",
    office: {
      contactEmail: null,
      contactLabel: "State Council contact page",
      contactUrl: "https://english.www.gov.cn/contactus/",
      headOfGovernmentLabel: "President of the People's Republic of China",
      headOfGovernmentTitle: "President",
      officialSourceUrl: "https://english.www.gov.cn/",
    },
  },
  {
    code: "RU",
    countryName: "Russia",
    governmentName: "Government of the Russian Federation",
    governmentWebsite: "http://government.ru/en/",
    iso3: "RUS",
    office: {
      contactEmail: null,
      contactLabel: "Kremlin contacts",
      contactUrl: "http://en.kremlin.ru/contacts",
      headOfGovernmentLabel: "President of Russia",
      headOfGovernmentTitle: "President",
      officialSourceUrl: "http://en.kremlin.ru/",
    },
  },
  {
    code: "DE",
    countryName: "Germany",
    governmentName: "Federal Government of Germany",
    governmentWebsite: "https://www.bundesregierung.de/breg-en",
    iso3: "DEU",
    office: {
      contactEmail: "internetpost@bundeskanzler.de",
      contactLabel: "Federal Government contact page",
      contactUrl:
        "https://www.bundesregierung.de/breg-en/service/contact/contact-the-federal-government-1957540",
      headOfGovernmentLabel: "Chancellor of Germany",
      headOfGovernmentTitle: "Chancellor",
      officialSourceUrl: "https://www.bundesregierung.de/breg-en/federal-government",
    },
  },
  {
    code: "IN",
    countryName: "India",
    governmentName: "Government of India",
    governmentWebsite: "https://www.pmindia.gov.in/en/",
    iso3: "IND",
    office: {
      contactEmail: null,
      contactLabel: "Write to the Prime Minister",
      contactUrl: "https://www.pmindia.gov.in/en/interact-with-honble-pm/",
      headOfGovernmentLabel: "Prime Minister of India",
      headOfGovernmentTitle: "Prime Minister",
      officialSourceUrl: "https://www.pmindia.gov.in/en/",
    },
  },
  {
    code: "GB",
    countryName: "United Kingdom",
    governmentName: "Government of the United Kingdom",
    governmentWebsite:
      "https://www.gov.uk/government/organisations/prime-ministers-office-10-downing-street",
    iso3: "GBR",
    office: {
      contactEmail: null,
      contactLabel: "Email Number 10",
      contactUrl: "https://email.number10.gov.uk/",
      headOfGovernmentLabel: "Prime Minister of the United Kingdom",
      headOfGovernmentTitle: "Prime Minister",
      officialSourceUrl: "https://www.gov.uk/government/people/the-prime-minister",
    },
  },
  {
    code: "SA",
    countryName: "Saudi Arabia",
    governmentName: "Government of Saudi Arabia",
    governmentWebsite: "https://www.my.gov.sa/wps/portal/snp/main",
    iso3: "SAU",
    office: {
      contactEmail: null,
      contactLabel: "Saudi government portal",
      contactUrl: "https://www.my.gov.sa/wps/portal/snp/main",
      headOfGovernmentLabel: "Prime Minister of Saudi Arabia",
      headOfGovernmentTitle: "Prime Minister",
      officialSourceUrl: "https://www.my.gov.sa/wps/portal/snp/aboutksa/government",
    },
  },
  {
    code: "UA",
    countryName: "Ukraine",
    governmentName: "Government of Ukraine",
    governmentWebsite: "https://www.president.gov.ua/en",
    iso3: "UKR",
    office: {
      contactEmail: null,
      contactLabel: "Contact the President of Ukraine",
      contactUrl: "https://www.president.gov.ua/en/office/contacts",
      headOfGovernmentLabel: "President of Ukraine",
      headOfGovernmentTitle: "President",
      officialSourceUrl: "https://www.president.gov.ua/en",
    },
  },
  {
    code: "FR",
    countryName: "France",
    governmentName: "Government of France",
    governmentWebsite: "https://www.elysee.fr/en/",
    iso3: "FRA",
    office: {
      contactEmail: null,
      contactLabel: "Write to the President",
      contactUrl: "https://www.elysee.fr/ecrire-au-president-de-la-republique/",
      headOfGovernmentLabel: "President of France",
      headOfGovernmentTitle: "President",
      officialSourceUrl: "https://www.elysee.fr/en/",
    },
  },
  {
    code: "JP",
    countryName: "Japan",
    governmentName: "Government of Japan",
    governmentWebsite: "https://www.kantei.go.jp/foreign/",
    iso3: "JPN",
    office: {
      contactEmail: null,
      contactLabel: "Prime Minister's Office contact page",
      contactUrl: "https://www.kantei.go.jp/foreign/forms/comment_ssl.html",
      headOfGovernmentLabel: "Prime Minister of Japan",
      headOfGovernmentTitle: "Prime Minister",
      officialSourceUrl: "https://www.kantei.go.jp/foreign/",
    },
  },
  {
    code: "KR",
    countryName: "South Korea",
    governmentName: "Government of the Republic of Korea",
    governmentWebsite: "https://www.korea.net/",
    iso3: "KOR",
    office: {
      contactEmail: null,
      contactLabel: "Office of the President of Korea",
      contactUrl: "https://www.president.go.kr/",
      headOfGovernmentLabel: "President of South Korea",
      headOfGovernmentTitle: "President",
      officialSourceUrl: "https://www.president.go.kr/",
    },
  },
  {
    code: "IL",
    countryName: "Israel",
    governmentName: "Government of Israel",
    governmentWebsite:
      "https://www.gov.il/en/departments/prime_ministers_office/govil-landing-page",
    iso3: "ISR",
    office: {
      contactEmail: "pm_eng@pmo.gov.il",
      contactLabel: "Contact the Prime Minister",
      contactUrl: "https://www.gov.il/en/pages/contact_the_prime_minister",
      headOfGovernmentLabel: "Prime Minister of Israel",
      headOfGovernmentTitle: "Prime Minister",
      officialSourceUrl:
        "https://www.gov.il/en/departments/prime_ministers_office/govil-landing-page",
    },
  },
  {
    code: "PL",
    countryName: "Poland",
    governmentName: "Government of Poland",
    governmentWebsite: "https://www.gov.pl/web/primeminister",
    iso3: "POL",
    office: {
      contactEmail: "kontakt@kprm.gov.pl",
      contactLabel: "Contact the Prime Minister",
      contactUrl: "https://www.gov.pl/web/primeminister/contact",
      headOfGovernmentLabel: "Prime Minister of Poland",
      headOfGovernmentTitle: "Prime Minister",
      officialSourceUrl: "https://www.gov.pl/web/primeminister",
    },
  },
  {
    code: "IT",
    countryName: "Italy",
    governmentName: "Government of Italy",
    governmentWebsite: "https://www.governo.it/en",
    iso3: "ITA",
    office: {
      contactEmail: "presidente@governo.it",
      contactLabel: "Contact the Government",
      contactUrl: "https://www.governo.it/en/contact-us",
      headOfGovernmentLabel: "Prime Minister of Italy",
      headOfGovernmentTitle: "Prime Minister",
      officialSourceUrl: "https://www.governo.it/en/il-governo",
    },
  },
  {
    code: "AU",
    countryName: "Australia",
    governmentName: "Government of Australia",
    governmentWebsite: "https://www.pm.gov.au/",
    iso3: "AUS",
    office: {
      contactEmail: null,
      contactLabel: "Contact the Prime Minister",
      contactUrl: "https://www.pm.gov.au/contact-your-pm",
      headOfGovernmentLabel: "Prime Minister of Australia",
      headOfGovernmentTitle: "Prime Minister",
      officialSourceUrl: "https://www.pm.gov.au/your-pm",
    },
  },
  {
    code: "CA",
    countryName: "Canada",
    governmentName: "Government of Canada",
    governmentWebsite: "https://pm.gc.ca/en",
    iso3: "CAN",
    office: {
      contactEmail: "pm@pm.gc.ca",
      contactLabel: "Contact the Prime Minister",
      contactUrl: "https://pm.gc.ca/en/connect/contact",
      headOfGovernmentLabel: "Prime Minister of Canada",
      headOfGovernmentTitle: "Prime Minister",
      officialSourceUrl: "https://pm.gc.ca/en",
    },
  },
  {
    code: "TR",
    countryName: "Türkiye",
    governmentName: "Government of Türkiye",
    governmentWebsite: "https://www.tccb.gov.tr/en/",
    iso3: "TUR",
    office: {
      contactEmail: null,
      contactLabel: "Contact the Presidency",
      contactUrl: "https://www.tccb.gov.tr/en/contact/",
      headOfGovernmentLabel: "President of Türkiye",
      headOfGovernmentTitle: "President",
      officialSourceUrl: "https://www.tccb.gov.tr/en/president/",
    },
  },
  {
    code: "ES",
    countryName: "Spain",
    governmentName: "Government of Spain",
    governmentWebsite: "https://www.lamoncloa.gob.es/lang/en/Paginas/index.aspx",
    iso3: "ESP",
    office: {
      contactEmail: "presidente.gobierno@la-moncloa.es",
      contactLabel: "Contact Moncloa",
      contactUrl: "https://www.lamoncloa.gob.es/contacto/Paginas/index.aspx",
      headOfGovernmentLabel: "Prime Minister of Spain",
      headOfGovernmentTitle: "Prime Minister",
      officialSourceUrl: "https://www.lamoncloa.gob.es/lang/en/presidente/Paginas/index.aspx",
    },
  },
  {
    code: "NL",
    countryName: "Netherlands",
    governmentName: "Government of the Netherlands",
    governmentWebsite: "https://www.government.nl/",
    iso3: "NLD",
    office: {
      contactEmail: "ministerpresident@minaz.nl",
      contactLabel: "Contact the Dutch Government",
      contactUrl: "https://www.government.nl/contact",
      headOfGovernmentLabel: "Prime Minister of the Netherlands",
      headOfGovernmentTitle: "Prime Minister",
      officialSourceUrl: "https://www.government.nl/government/members-of-cabinet",
    },
  },
  {
    code: "DZ",
    countryName: "Algeria",
    governmentName: "Government of Algeria",
    governmentWebsite: "https://www.el-mouradia.dz/en/",
    iso3: "DZA",
    office: {
      contactEmail: null,
      contactLabel: "Presidency of Algeria",
      contactUrl: "https://www.el-mouradia.dz/en/",
      headOfGovernmentLabel: "President of Algeria",
      headOfGovernmentTitle: "President",
      officialSourceUrl: "https://www.el-mouradia.dz/en/",
    },
  },
];

const AGGREGATE_GOVERNMENT_ISO3 = new Set([
  "AFE",
  "AFW",
  "ARB",
  "CEB",
  "CSS",
  "EAP",
  "EAR",
  "EAS",
  "ECA",
  "ECS",
  "EMU",
  "EUU",
  "FCS",
  "HPC",
  "IBD",
  "IBT",
  "IDA",
  "IDB",
  "IDX",
  "LAC",
  "LCN",
  "LDC",
  "LMY",
  "LTE",
  "MAE",
  "MEA",
  "MIC",
  "MNA",
  "NAC",
  "OED",
  "OSS",
  "PRE",
  "PSS",
  "PST",
  "SAS",
  "SSA",
  "SSF",
  "SST",
  "TEA",
  "TEC",
  "TLA",
  "TMN",
  "TSA",
  "TSS",
  "WLD",
]);

const NON_SOVEREIGN_GOVERNMENT_ISO3 = new Set([
  "ABW",
  "AIA",
  "BMU",
  "CUW",
  "CYM",
  "FRO",
  "GRL",
  "HKG",
  "MAC",
  "MSR",
  "PRI",
  "SXM",
  "TCA",
  "UVK",
  "VIR",
]);

const metricsByCode = new Map(GOVERNMENTS.map((government) => [government.code, government] as const));
const registryRowsByCode = new Map(GOVERNMENT_REGISTRY_ROWS.map((government) => [government.code, government] as const));

function normalizeCountryName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildDefaultGovernmentName(countryName: string) {
  return `Government of ${countryName}`;
}

function buildDefaultOfficeLabel(headOfGovernmentTitle: string | null, countryName: string) {
  if (headOfGovernmentTitle?.trim()) {
    return `${headOfGovernmentTitle} of ${countryName}`;
  }

  return `Head of government of ${countryName}`;
}

function buildGovernmentRecord(code: string): GovernmentRecord {
  const registryRow = registryRowsByCode.get(code) ?? null;
  const metrics = metricsByCode.get(code) ?? null;
  const leader = getLeader(code) ?? null;
  const iso3 = registryRow?.iso3 ?? getGovernmentIso3(code);
  const countryName =
    registryRow?.countryName ??
    metrics?.name ??
    getGovernmentDisplayName(code) ??
    leader?.countryName ??
    code;
  const headOfGovernmentTitle =
    registryRow?.office.headOfGovernmentTitle ??
    leader?.roleTitle ??
    "Head of Government";

  return {
    code,
    countryName,
    governmentName:
      registryRow?.governmentName ??
      (metrics ? buildDefaultGovernmentName(metrics.name) : buildDefaultGovernmentName(countryName)),
    governmentWebsite: registryRow?.governmentWebsite ?? null,
    iso3,
    office: {
      contactEmail: registryRow?.office.contactEmail ?? null,
      contactLabel: registryRow?.office.contactLabel ?? null,
      contactUrl: registryRow?.office.contactUrl ?? null,
      headOfGovernmentLabel:
        registryRow?.office.headOfGovernmentLabel ??
        buildDefaultOfficeLabel(headOfGovernmentTitle, countryName),
      headOfGovernmentTitle,
      officialSourceUrl: registryRow?.office.officialSourceUrl ?? null,
    },
  };
}

const governmentRegistry = new Map<string, GovernmentRecord>();

for (const code of new Set([
  ...GOVERNMENT_REGISTRY_ROWS.map((government) => government.code),
  ...GOVERNMENTS.map((government) => government.code),
  ...Object.keys(GOVERNMENT_ISO2_TO_ISO3),
])) {
  governmentRegistry.set(code, buildGovernmentRecord(code));
}

const governmentRegistryByIso3 = new Map(
  [...governmentRegistry.values()]
    .filter((government): government is GovernmentRecord & { iso3: string } => government.iso3 !== null)
    .map((government) => [government.iso3, government] as const),
);

const governmentRegistryList = [...governmentRegistry.values()].sort((left, right) =>
  left.countryName.localeCompare(right.countryName),
);

export function listGovernments() {
  return governmentRegistryList;
}

function resolveGovernmentIdentity(input: GovernmentIdentityInput | string) {
  if (typeof input === "string") {
    const normalized = input.trim().toUpperCase();
    if (!normalized) {
      return {
        code: null,
        countryName: null,
        iso3: null,
      };
    }

    if (normalized.length === 2) {
      return {
        code: normalized,
        countryName: null,
        iso3: getGovernmentIso3(normalized),
      };
    }

    return {
      code: getGovernmentCodeForIso3(normalized),
      countryName: null,
      iso3: normalized,
    };
  }

  const code = input.code?.trim().toUpperCase() ?? null;
  const iso3 = input.iso3?.trim().toUpperCase() ?? (code ? getGovernmentIso3(code) : null);
  return {
    code,
    countryName: input.countryName?.trim() ?? null,
    iso3,
  };
}

export function getGovernment(codeOrIso3: string) {
  const normalized = codeOrIso3.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  if (normalized.length === 2) {
    return governmentRegistry.get(normalized) ?? null;
  }

  return governmentRegistryByIso3.get(normalized) ?? null;
}

export function getGovernmentByIso3(iso3: string) {
  const normalized = iso3.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  return governmentRegistryByIso3.get(normalized) ?? null;
}

export function isSovereignGovernment(input: GovernmentIdentityInput | string) {
  const identity = resolveGovernmentIdentity(input);

  if (identity.iso3 && AGGREGATE_GOVERNMENT_ISO3.has(identity.iso3)) {
    return false;
  }

  if (identity.iso3 && NON_SOVEREIGN_GOVERNMENT_ISO3.has(identity.iso3)) {
    return false;
  }

  if (identity.countryName && identity.iso3 && identity.countryName.toUpperCase() === identity.iso3) {
    return false;
  }

  return true;
}

export function getCanonicalGovernmentDisplayName(input: GovernmentIdentityInput | string) {
  const identity = resolveGovernmentIdentity(input);
  const government =
    (identity.code ? getGovernment(identity.code) : null) ??
    (identity.iso3 ? getGovernmentByIso3(identity.iso3) : null);

  if (government?.countryName.trim()) {
    return government.countryName;
  }

  if (identity.code) {
    const displayName = getGovernmentDisplayName(identity.code);
    if (displayName) {
      return displayName;
    }
  }

  if (identity.countryName?.trim()) {
    return identity.countryName.trim();
  }

  return null;
}

export function getGovernmentWithLeader(codeOrIso3: string): GovernmentWithLeader | null {
  const government = getGovernment(codeOrIso3);
  if (!government) {
    return null;
  }

  return {
    ...government,
    leader: getLeader(government.code) ?? null,
  };
}

export function getGovernmentProfile(codeOrIso3: string): GovernmentProfile | null {
  const government = getGovernment(codeOrIso3);
  if (!government) {
    return null;
  }

  const metrics = metricsByCode.get(government.code) ?? null;

  return {
    ...government,
    flag: metrics?.flag ?? null,
    leader: getLeader(government.code) ?? null,
    metrics,
  };
}

export function listGovernmentProfiles() {
  return governmentRegistryList
    .map((government) => getGovernmentProfile(government.code))
    .filter((government): government is GovernmentProfile => government !== null);
}

export function listSovereignGovernments() {
  return governmentRegistryList.filter((government) => isSovereignGovernment(government));
}

export function getGovernmentOfficeMetadata(codeOrIso3: string) {
  return getGovernment(codeOrIso3)?.office ?? null;
}

export function getGovernmentOfficeMetadataByIso3(iso3: string) {
  return getGovernmentByIso3(iso3)?.office ?? null;
}

export function findGovernmentByCountryName(countryName: string) {
  const normalizedCountryName = normalizeCountryName(countryName);

  return (
    governmentRegistryList.find(
      (government) => normalizeCountryName(government.countryName) === normalizedCountryName,
    ) ?? null
  );
}

export function getGovernmentCodeForCountryIso3(iso3: string) {
  const normalizedIso3 = iso3.trim().toUpperCase();
  if (!normalizedIso3) {
    return null;
  }

  return getGovernmentCodeForIso3(normalizedIso3);
}

export const GOVERNMENT_RECORDS = governmentRegistryList;
