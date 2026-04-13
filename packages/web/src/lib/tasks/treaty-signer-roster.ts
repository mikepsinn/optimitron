import type { CountryPanelRow } from "@optimitron/data";
import { getGovernmentProfile } from "@optimitron/data";
import type { TreatySignerSlot } from "./treaty-signer-network";

type TreatySignerRosterRow = Pick<
  CountryPanelRow,
  | "gdpPerCapitaPpp"
  | "jurisdictionIso3"
  | "jurisdictionName"
  | "militarySpendingPctGdp"
  | "militarySpendingPerCapitaPpp"
  | "population"
>;

export const COUNTRY_PANEL_AGGREGATE_ISO3 = new Set([
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

export const NON_SOVEREIGN_TREATY_SIGNER_ISO3 = new Set([
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

const COUNTRY_DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  BHS: "Bahamas",
  CZE: "Czechia",
  EGY: "Egypt",
  FSM: "Micronesia",
  GMB: "Gambia",
  IRN: "Iran",
  KGZ: "Kyrgyzstan",
  KOR: "South Korea",
  LAO: "Laos",
  RUS: "Russia",
  SVK: "Slovakia",
  SYR: "Syria",
  TUR: "Türkiye",
  USA: "United States",
  VAT: "Holy See (Vatican City)",
  VEN: "Venezuela",
  YEM: "Yemen",
};

const EXTRA_SOVEREIGN_SIGNER_ROWS: TreatySignerRosterRow[] = [
  {
    gdpPerCapitaPpp: null,
    jurisdictionIso3: "VAT",
    jurisdictionName: "Holy See (Vatican City)",
    militarySpendingPctGdp: null,
    militarySpendingPerCapitaPpp: null,
    population: 882,
  },
];

function displayCountryName(row: TreatySignerRosterRow) {
  return COUNTRY_DISPLAY_NAME_OVERRIDES[row.jurisdictionIso3] ?? row.jurisdictionName.trim();
}

export function isSovereignTreatySignerRow(row: TreatySignerRosterRow) {
  if (
    COUNTRY_PANEL_AGGREGATE_ISO3.has(row.jurisdictionIso3) ||
    NON_SOVEREIGN_TREATY_SIGNER_ISO3.has(row.jurisdictionIso3)
  ) {
    return false;
  }

  if (row.jurisdictionName.trim() === row.jurisdictionIso3) {
    return false;
  }

  return true;
}

export function estimateTreatySignerMilitaryBudgetUsd(row: TreatySignerRosterRow) {
  const perCapita = row.militarySpendingPerCapitaPpp;
  const population = row.population;
  if (perCapita != null && population != null && perCapita > 0 && population > 0) {
    return Math.max(perCapita * population, 1);
  }

  const gdpPerCapita = row.gdpPerCapitaPpp;
  const militaryPct = row.militarySpendingPctGdp;
  if (
    gdpPerCapita != null &&
    population != null &&
    militaryPct != null &&
    gdpPerCapita > 0 &&
    population > 0 &&
    militaryPct > 0
  ) {
    return Math.max((militaryPct / 100) * gdpPerCapita * population, 1);
  }

  if (gdpPerCapita != null && population != null && gdpPerCapita > 0 && population > 0) {
    return Math.max(gdpPerCapita * population * 0.005, 1);
  }

  return 1;
}

function buildTreatySignerSlot(row: TreatySignerRosterRow): TreatySignerSlot {
  const countryName = displayCountryName(row);
  const countryIso3 = row.jurisdictionIso3.toUpperCase();
  const governmentProfile = getGovernmentProfile(countryIso3);
  const decisionMakerLabel =
    governmentProfile?.leader?.leaderName ??
    governmentProfile?.office.headOfGovernmentLabel ??
    `Head of government of ${countryName}`;
  const governmentName =
    governmentProfile?.governmentName ?? `Government of ${countryName}`;
  const roleTitle =
    governmentProfile?.office.headOfGovernmentTitle ??
    governmentProfile?.leader?.roleTitle ??
    "Head of Government";
  const militaryBudgetUsd =
    governmentProfile?.metrics?.militarySpendingAnnual.value ??
    estimateTreatySignerMilitaryBudgetUsd(row);

  return {
    contactEmail: governmentProfile?.office.contactEmail ?? null,
    contactLabel: governmentProfile?.office.contactLabel ?? null,
    contactUrl: governmentProfile?.office.contactUrl ?? null,
    countryCode: governmentProfile?.code ?? countryIso3,
    countryIso3,
    countryName,
    decisionMakerLabel,
    governmentName,
    governmentWebsite: governmentProfile?.governmentWebsite ?? null,
    leaderImageUrl: governmentProfile?.leader?.leaderImageUrl ?? null,
    leaderName: governmentProfile?.leader?.leaderName ?? null,
    leaderSourceRef: governmentProfile?.leader?.wikidataId
      ? `wikidata:${governmentProfile.leader.wikidataId}`
      : null,
    militaryBudgetUsd,
    officialSourceUrl: governmentProfile?.office.officialSourceUrl ?? null,
    roleTitle,
    sortOrder: 0,
  };
}

export function buildFullTreatySignerSlots(rows: TreatySignerRosterRow[]) {
  const dedupedRows = [...rows, ...EXTRA_SOVEREIGN_SIGNER_ROWS].filter(isSovereignTreatySignerRow);

  return dedupedRows
    .map(buildTreatySignerSlot)
    .sort((left, right) => right.militaryBudgetUsd - left.militaryBudgetUsd)
    .map((slot, index) => ({
      ...slot,
      sortOrder: index,
    }));
}
