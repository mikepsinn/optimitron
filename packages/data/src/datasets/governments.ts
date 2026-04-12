import type { WorldLeaderRow } from "./world-leaders";
import { getLeader } from "./world-leaders";

export interface GovernmentOfficeMetadata {
  sourceIso3: string;
  countryCode?: string;
  countryName?: string;
  contactEmail?: string | null;
  contactLabel?: string | null;
  contactUrl?: string | null;
  governmentName?: string | null;
  governmentWebsite?: string | null;
  headOfGovernmentLabel?: string | null;
  headOfGovernmentTitle?: string | null;
  militaryBudgetUsd?: number | null;
  officialSourceUrl?: string | null;
}

export const GOVERNMENT_OFFICE_METADATA: GovernmentOfficeMetadata[] = [
  {
    sourceIso3: "USA",
    countryCode: "US",
    countryName: "United States",
    contactEmail: null,
    contactLabel: "White House contact form",
    contactUrl: "https://www.whitehouse.gov/contact/",
    governmentName: "United States Government",
    governmentWebsite: "https://www.whitehouse.gov/",
    headOfGovernmentLabel: "President of the United States",
    headOfGovernmentTitle: "President",
    militaryBudgetUsd: 997_000_000_000,
    officialSourceUrl: "https://www.whitehouse.gov/administration/",
  },
  {
    sourceIso3: "CHN",
    countryCode: "CN",
    countryName: "China",
    contactEmail: null,
    contactLabel: "State Council contact page",
    contactUrl: "https://english.www.gov.cn/contactus/",
    governmentName: "Government of the People's Republic of China",
    governmentWebsite: "https://english.www.gov.cn/",
    headOfGovernmentLabel: "President of the People's Republic of China",
    headOfGovernmentTitle: "President",
    militaryBudgetUsd: 314_000_000_000,
    officialSourceUrl: "https://english.www.gov.cn/",
  },
  {
    sourceIso3: "RUS",
    countryCode: "RU",
    countryName: "Russia",
    contactEmail: null,
    contactLabel: "Kremlin contacts",
    contactUrl: "http://en.kremlin.ru/contacts",
    governmentName: "Government of the Russian Federation",
    governmentWebsite: "http://government.ru/en/",
    headOfGovernmentLabel: "President of Russia",
    headOfGovernmentTitle: "President",
    militaryBudgetUsd: 149_000_000_000,
    officialSourceUrl: "http://en.kremlin.ru/",
  },
  {
    sourceIso3: "DEU",
    countryCode: "DE",
    countryName: "Germany",
    contactEmail: "internetpost@bundeskanzler.de",
    contactLabel: "Federal Government contact page",
    contactUrl: "https://www.bundesregierung.de/breg-en/service/contact/contact-the-federal-government-1957540",
    governmentName: "Federal Government of Germany",
    governmentWebsite: "https://www.bundesregierung.de/breg-en",
    headOfGovernmentLabel: "Chancellor of Germany",
    headOfGovernmentTitle: "Chancellor",
    militaryBudgetUsd: 88_500_000_000,
    officialSourceUrl: "https://www.bundesregierung.de/breg-en/federal-government",
  },
  {
    sourceIso3: "IND",
    countryCode: "IN",
    countryName: "India",
    contactEmail: null,
    contactLabel: "Write to the Prime Minister",
    contactUrl: "https://www.pmindia.gov.in/en/interact-with-honble-pm/",
    governmentName: "Government of India",
    governmentWebsite: "https://www.pmindia.gov.in/en/",
    headOfGovernmentLabel: "Prime Minister of India",
    headOfGovernmentTitle: "Prime Minister",
    militaryBudgetUsd: 86_100_000_000,
    officialSourceUrl: "https://www.pmindia.gov.in/en/",
  },
  {
    sourceIso3: "GBR",
    countryCode: "GB",
    countryName: "United Kingdom",
    contactEmail: null,
    contactLabel: "Email Number 10",
    contactUrl: "https://email.number10.gov.uk/",
    governmentName: "Government of the United Kingdom",
    governmentWebsite: "https://www.gov.uk/government/organisations/prime-ministers-office-10-downing-street",
    headOfGovernmentLabel: "Prime Minister of the United Kingdom",
    headOfGovernmentTitle: "Prime Minister",
    militaryBudgetUsd: 81_800_000_000,
    officialSourceUrl: "https://www.gov.uk/government/people/the-prime-minister",
  },
  {
    sourceIso3: "SAU",
    countryCode: "SA",
    countryName: "Saudi Arabia",
    contactEmail: null,
    contactLabel: "Saudi government portal",
    contactUrl: "https://www.my.gov.sa/wps/portal/snp/main",
    governmentName: "Government of Saudi Arabia",
    governmentWebsite: "https://www.my.gov.sa/wps/portal/snp/main",
    headOfGovernmentLabel: "Prime Minister of Saudi Arabia",
    headOfGovernmentTitle: "Prime Minister",
    militaryBudgetUsd: 80_300_000_000,
    officialSourceUrl: "https://www.my.gov.sa/wps/portal/snp/aboutksa/government",
  },
  {
    sourceIso3: "UKR",
    countryCode: "UA",
    countryName: "Ukraine",
    contactEmail: null,
    contactLabel: "Contact the President of Ukraine",
    contactUrl: "https://www.president.gov.ua/en/office/contacts",
    governmentName: "Government of Ukraine",
    governmentWebsite: "https://www.president.gov.ua/en",
    headOfGovernmentLabel: "President of Ukraine",
    headOfGovernmentTitle: "President",
    militaryBudgetUsd: 64_700_000_000,
    officialSourceUrl: "https://www.president.gov.ua/en",
  },
  {
    sourceIso3: "FRA",
    countryCode: "FR",
    countryName: "France",
    contactEmail: null,
    contactLabel: "Write to the President",
    contactUrl: "https://www.elysee.fr/ecrire-au-president-de-la-republique/",
    governmentName: "Government of France",
    governmentWebsite: "https://www.elysee.fr/en/",
    headOfGovernmentLabel: "President of France",
    headOfGovernmentTitle: "President",
    militaryBudgetUsd: 64_700_000_000,
    officialSourceUrl: "https://www.elysee.fr/en/",
  },
  {
    sourceIso3: "JPN",
    countryCode: "JP",
    countryName: "Japan",
    contactEmail: null,
    contactLabel: "Prime Minister's Office contact page",
    contactUrl: "https://www.kantei.go.jp/foreign/forms/comment_ssl.html",
    governmentName: "Government of Japan",
    governmentWebsite: "https://www.kantei.go.jp/foreign/",
    headOfGovernmentLabel: "Prime Minister of Japan",
    headOfGovernmentTitle: "Prime Minister",
    militaryBudgetUsd: 55_300_000_000,
    officialSourceUrl: "https://www.kantei.go.jp/foreign/",
  },
  {
    sourceIso3: "KOR",
    countryCode: "KR",
    countryName: "South Korea",
    contactEmail: null,
    contactLabel: "Office of the President of Korea",
    contactUrl: "https://www.president.go.kr/",
    governmentName: "Government of the Republic of Korea",
    governmentWebsite: "https://www.korea.net/",
    headOfGovernmentLabel: "President of South Korea",
    headOfGovernmentTitle: "President",
    militaryBudgetUsd: 47_600_000_000,
    officialSourceUrl: "https://www.president.go.kr/",
  },
  {
    sourceIso3: "ISR",
    countryCode: "IL",
    countryName: "Israel",
    contactEmail: "pm_eng@pmo.gov.il",
    contactLabel: "Contact the Prime Minister",
    contactUrl: "https://www.gov.il/en/pages/contact_the_prime_minister",
    governmentName: "Government of Israel",
    governmentWebsite: "https://www.gov.il/en/departments/prime_ministers_office/govil-landing-page",
    headOfGovernmentLabel: "Prime Minister of Israel",
    headOfGovernmentTitle: "Prime Minister",
    militaryBudgetUsd: 46_500_000_000,
    officialSourceUrl: "https://www.gov.il/en/departments/prime_ministers_office/govil-landing-page",
  },
  {
    sourceIso3: "POL",
    countryCode: "PL",
    countryName: "Poland",
    contactEmail: "kontakt@kprm.gov.pl",
    contactLabel: "Contact the Prime Minister",
    contactUrl: "https://www.gov.pl/web/primeminister/contact",
    governmentName: "Government of Poland",
    governmentWebsite: "https://www.gov.pl/web/primeminister",
    headOfGovernmentLabel: "Prime Minister of Poland",
    headOfGovernmentTitle: "Prime Minister",
    militaryBudgetUsd: 38_000_000_000,
    officialSourceUrl: "https://www.gov.pl/web/primeminister",
  },
  {
    sourceIso3: "ITA",
    countryCode: "IT",
    countryName: "Italy",
    contactEmail: "presidente@governo.it",
    contactLabel: "Contact the Government",
    contactUrl: "https://www.governo.it/en/contact-us",
    governmentName: "Government of Italy",
    governmentWebsite: "https://www.governo.it/en",
    headOfGovernmentLabel: "Prime Minister of Italy",
    headOfGovernmentTitle: "Prime Minister",
    militaryBudgetUsd: 38_000_000_000,
    officialSourceUrl: "https://www.governo.it/en/il-governo",
  },
  {
    sourceIso3: "AUS",
    countryCode: "AU",
    countryName: "Australia",
    contactEmail: null,
    contactLabel: "Contact the Prime Minister",
    contactUrl: "https://www.pm.gov.au/contact-your-pm",
    governmentName: "Government of Australia",
    governmentWebsite: "https://www.pm.gov.au/",
    headOfGovernmentLabel: "Prime Minister of Australia",
    headOfGovernmentTitle: "Prime Minister",
    militaryBudgetUsd: 33_800_000_000,
    officialSourceUrl: "https://www.pm.gov.au/your-pm",
  },
  {
    sourceIso3: "CAN",
    countryCode: "CA",
    countryName: "Canada",
    contactEmail: "pm@pm.gc.ca",
    contactLabel: "Contact the Prime Minister",
    contactUrl: "https://pm.gc.ca/en/connect/contact",
    governmentName: "Government of Canada",
    governmentWebsite: "https://pm.gc.ca/en",
    headOfGovernmentLabel: "Prime Minister of Canada",
    headOfGovernmentTitle: "Prime Minister",
    militaryBudgetUsd: 29_300_000_000,
    officialSourceUrl: "https://pm.gc.ca/en",
  },
  {
    sourceIso3: "TUR",
    countryCode: "TR",
    countryName: "Türkiye",
    contactEmail: null,
    contactLabel: "Contact the Presidency",
    contactUrl: "https://www.tccb.gov.tr/en/contact/",
    governmentName: "Government of Türkiye",
    governmentWebsite: "https://www.tccb.gov.tr/en/",
    headOfGovernmentLabel: "President of Türkiye",
    headOfGovernmentTitle: "President",
    militaryBudgetUsd: 25_000_000_000,
    officialSourceUrl: "https://www.tccb.gov.tr/en/president/",
  },
  {
    sourceIso3: "ESP",
    countryCode: "ES",
    countryName: "Spain",
    contactEmail: "presidente.gobierno@la-moncloa.es",
    contactLabel: "Contact Moncloa",
    contactUrl: "https://www.lamoncloa.gob.es/contacto/Paginas/index.aspx",
    governmentName: "Government of Spain",
    governmentWebsite: "https://www.lamoncloa.gob.es/lang/en/Paginas/index.aspx",
    headOfGovernmentLabel: "Prime Minister of Spain",
    headOfGovernmentTitle: "Prime Minister",
    militaryBudgetUsd: 24_600_000_000,
    officialSourceUrl: "https://www.lamoncloa.gob.es/lang/en/presidente/Paginas/index.aspx",
  },
  {
    sourceIso3: "NLD",
    countryCode: "NL",
    countryName: "Netherlands",
    contactEmail: "ministerpresident@minaz.nl",
    contactLabel: "Contact the Dutch Government",
    contactUrl: "https://www.government.nl/contact",
    governmentName: "Government of the Netherlands",
    governmentWebsite: "https://www.government.nl/",
    headOfGovernmentLabel: "Prime Minister of the Netherlands",
    headOfGovernmentTitle: "Prime Minister",
    militaryBudgetUsd: 23_200_000_000,
    officialSourceUrl: "https://www.government.nl/government/members-of-cabinet",
  },
  {
    sourceIso3: "DZA",
    countryCode: "DZ",
    countryName: "Algeria",
    contactEmail: null,
    contactLabel: "Presidency of Algeria",
    contactUrl: "https://www.el-mouradia.dz/en/",
    governmentName: "Government of Algeria",
    governmentWebsite: "https://www.el-mouradia.dz/en/",
    headOfGovernmentLabel: "President of Algeria",
    headOfGovernmentTitle: "President",
    militaryBudgetUsd: 21_800_000_000,
    officialSourceUrl: "https://www.el-mouradia.dz/en/",
  },
];

const officeMetadataByIso3 = new Map(
  GOVERNMENT_OFFICE_METADATA.map((entry) => [entry.sourceIso3.toUpperCase(), entry] as const),
);

const officeMetadataByCountryCode = new Map(
  GOVERNMENT_OFFICE_METADATA
    .filter((entry): entry is GovernmentOfficeMetadata & { countryCode: string } => typeof entry.countryCode === "string")
    .map((entry) => [entry.countryCode.toUpperCase(), entry] as const),
);

export function getGovernmentOfficeMetadataByIso3(sourceIso3: string) {
  return officeMetadataByIso3.get(sourceIso3.toUpperCase());
}

export function getGovernmentOfficeMetadata(countryCode: string) {
  return officeMetadataByCountryCode.get(countryCode.toUpperCase());
}

export interface GovernmentWithLeader {
  countryCode: string;
  countryName: string | null;
  leader: WorldLeaderRow | null;
  office: GovernmentOfficeMetadata | null;
}

export function getGovernmentWithLeader(countryCode: string): GovernmentWithLeader | null {
  const normalizedCountryCode = countryCode.trim().toUpperCase();
  if (!normalizedCountryCode) {
    return null;
  }

  const office = getGovernmentOfficeMetadata(normalizedCountryCode) ?? null;
  const leader = getLeader(normalizedCountryCode) ?? null;

  return {
    countryCode: normalizedCountryCode,
    countryName: office?.countryName ?? leader?.countryName ?? null,
    leader,
    office,
  };
}
