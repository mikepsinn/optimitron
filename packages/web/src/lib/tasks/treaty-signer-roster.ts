import type { CountryPanelRow } from "@optimitron/data";
import {
  getCanonicalGovernmentDisplayName,
  getGovernmentCodeForCountryIso3,
  getGovernmentProfile,
  isSovereignGovernment,
} from "@optimitron/data";
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
  return (
    getCanonicalGovernmentDisplayName({
      countryName: row.jurisdictionName,
      iso3: row.jurisdictionIso3,
    }) ?? row.jurisdictionName.trim()
  );
}

export function isSovereignTreatySignerRow(row: TreatySignerRosterRow) {
  return isSovereignGovernment({
    countryName: row.jurisdictionName,
    iso3: row.jurisdictionIso3,
  });
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
    countryCode:
      governmentProfile?.code ?? getGovernmentCodeForCountryIso3(countryIso3) ?? countryIso3,
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
