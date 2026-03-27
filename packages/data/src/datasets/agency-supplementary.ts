/**
 * Agency Supplementary Section Registry
 *
 * Maps each agencyId → supplementary sections with typed data.
 * The web app renders these with a single generic component,
 * keeping agency-specific content out of page files.
 */

import { FDA_APPROVED_DRUG_DISASTERS, FDA_DRUG_DISASTER_SUMMARY } from "./us-fda-approved-drug-deaths";
import { PHARMA_PATENT_STATS, DRUG_MANUFACTURING_VS_RETAIL } from "./us-pharma-patents";
import { IRONIC_LAWS, type IronicLaw } from "./us-ironic-laws";
import { GOVERNMENT_LIES, type GovernmentLie } from "./us-government-lies";
import { LOBBYING_BY_INDUSTRY, type LobbyingIndustry } from "./us-lobbying";
import { REVOLVING_DOOR_STATS, type RevolvingDoorStat } from "./us-revolving-door";
import { CIA_COUPS } from "./us-cia-coups";
import { HEALTHCARE_WASTE_CATEGORIES } from "./us-healthcare-waste";
import { INSURER_DENIAL_RATES, DENIAL_SYSTEM_STATS } from "./us-insurance-denials";
import { PREVENTABLE_DEATH_CATEGORIES } from "./us-preventable-deaths";
import { CORPORATE_TAX_RATE_EFFECTIVE, ZERO_TAX_COMPANIES_2020 } from "./us-corporate-tax";
import { IMMIGRATION_KEY_STATISTICS } from "./us-immigration-impact";
import { US_OVERDOSE_DEATHS_HISTORICAL } from "./us-drug-war";
import { US_HEALTHCARE_SPENDING_DATA } from "./us-healthcare-spending";
import { US_INCARCERATION_DATA } from "./us-incarceration";
import { US_POLICE_SPENDING_DATA } from "./us-police-spending";
import { TARIFF_COLLATERAL_DAMAGE } from "./us-tariff-history";
import { US_CLIMATE_SPENDING_DATA } from "./us-climate-spending";
import { US_FOREIGN_AID_DATA } from "./us-foreign-aid";
import { GOLD_WAGE_THEFT_SUMMARY } from "./us-gold-standard-wages";
import { PRE_FED_SUMMARY, BANKING_PANICS_US_VS_CANADA } from "./us-pre-fed-prosperity";
import { PRODUCTIVITY_VS_WAGES, WEALTH_DISTRIBUTION } from "./economic-theft-series";
import { CEO_TO_WORKER_RATIO, HOME_PRICE_TO_INCOME, STUDENT_LOAN_DEBT, MEDICAL_BANKRUPTCY_PCT, VACANT_VS_HOMELESS } from "./us-inequality-detail";
import { CONGRESSIONAL_TRADING_STATS } from "./us-congressional-trading";
import type { FDAApprovedDrugDisaster } from "./us-fda-approved-drug-deaths";
import type { CIACoup } from "./us-cia-coups";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StatCardItem {
  name: string;
  emoji: string;
  value: string;
  description: string;
  comparison?: string;
  source?: string;
  sourceUrl?: string;
}

export type SupplementarySectionType =
  | "stat-cards"
  | "drug-disasters"
  | "lie"
  | "ironic-law"
  | "coups"
  | "lobbying"
  | "revolving-door";

export interface SupplementarySection {
  id: string;
  type: SupplementarySectionType;
  title: string;
  subtitle?: string;
  data:
    | StatCardItem[]
    | FDAApprovedDrugDisaster[]
    | GovernmentLie
    | IronicLaw
    | CIACoup[]
    | LobbyingIndustry
    | RevolvingDoorStat;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findLie(id: string): GovernmentLie | undefined {
  return GOVERNMENT_LIES.find((l) => l.id === id);
}

function findLaw(id: string): IronicLaw | undefined {
  return IRONIC_LAWS.find((l) => l.id === id);
}

function findLobby(keyword: string): LobbyingIndustry | undefined {
  return LOBBYING_BY_INDUSTRY.find((l) =>
    l.industry.toLowerCase().includes(keyword.toLowerCase()),
  );
}

function findRevolvingDoor(keyword: string): RevolvingDoorStat | undefined {
  return REVOLVING_DOOR_STATS.find((s) =>
    s.metric.toLowerCase().includes(keyword.toLowerCase()),
  );
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

function buildSections(agencyId: string): SupplementarySection[] {
  const sections: SupplementarySection[] = [];

  switch (agencyId) {
    case "fda": {
      sections.push({
        id: "fda-drug-disasters",
        type: "drug-disasters",
        title: "FDA-Approved Drug Disasters",
        subtitle:
          "These drugs PASSED the 8.2-year efficacy review. The process kills more through delay than it saves through rejection.",
        data: FDA_APPROVED_DRUG_DISASTERS,
      });
      sections.push({
        id: "fda-patent-abuse",
        type: "stat-cards",
        title: "Patent Abuse",
        subtitle: "Why drugs stay expensive forever",
        data: PHARMA_PATENT_STATS.map((s) => ({
          name: s.metric,
          emoji: "💊",
          value: s.value,
          description: s.description,
          source: s.source,
          sourceUrl: s.sourceUrl,
        })),
      });
      const pdufa = findLaw("pdufa");
      if (pdufa) sections.push({ id: "fda-pdufa", type: "ironic-law", title: "The Law", data: pdufa });
      const pharma = findLobby("pharma");
      if (pharma) sections.push({ id: "fda-lobbying", type: "lobbying", title: "Who Buys the Dysfunction", data: pharma });
      const revDoor = findRevolvingDoor("FDA");
      if (revDoor) sections.push({ id: "fda-revolving-door", type: "revolving-door", title: "The Revolving Door", data: revDoor });
      sections.push({
        id: "fda-drug-pricing",
        type: "stat-cards",
        title: "Manufacturing Cost vs Retail Price",
        subtitle: "What drugs cost to make vs what Americans pay",
        data: DRUG_MANUFACTURING_VS_RETAIL.map((d) => ({
          name: d.drug,
          emoji: "💰",
          value: `$${d.usRetailPrice.toLocaleString()}`,
          description: `Manufacturing cost: $${d.manufacturingCost}. Markup: ${d.markup}x.`,
          comparison: `${d.condition}`,
          source: d.source,
        })),
      });
      break;
    }

    case "hhs": {
      sections.push({
        id: "hhs-waste",
        type: "stat-cards",
        title: "Healthcare Waste",
        subtitle: "Where your $4.5 trillion per year actually goes",
        data: HEALTHCARE_WASTE_CATEGORIES.map((c) => ({
          name: c.name,
          emoji: c.emoji,
          value: `$${(c.annualCost / 1e9).toFixed(0)}B/yr`,
          description: c.description,
          comparison: c.comparison,
          source: c.source,
          sourceUrl: c.sourceUrl,
        })),
      });
      sections.push({
        id: "hhs-preventable-deaths",
        type: "stat-cards",
        title: "Preventable Deaths",
        subtitle: "People who didn't have to die",
        data: PREVENTABLE_DEATH_CATEGORIES.map((c) => ({
          name: c.name,
          emoji: c.emoji,
          value: `${c.annualDeaths.toLocaleString()}/yr`,
          description: c.description,
          comparison: c.comparison,
          source: c.source,
          sourceUrl: c.sourceUrl,
        })),
      });
      sections.push({
        id: "hhs-insurance-denials",
        type: "stat-cards",
        title: "Insurance Claim Denials",
        subtitle: "The system is designed to deny care",
        data: INSURER_DENIAL_RATES.map((d) => ({
          name: d.insurer,
          emoji: "🚫",
          value: `${d.denialRate}% denied`,
          description: `${d.claimsDenied.toLocaleString()} claims denied out of ${d.claimsProcessed.toLocaleString()} processed.`,
          source: d.source,
          sourceUrl: d.sourceUrl,
        })),
      });
      if (US_HEALTHCARE_SPENDING_DATA.length > 0) {
        const latest = US_HEALTHCARE_SPENDING_DATA[US_HEALTHCARE_SPENDING_DATA.length - 1]!;
        sections.push({
          id: "hhs-us-vs-oecd",
          type: "stat-cards",
          title: "US vs OECD Healthcare",
          subtitle: "The US spends the most and gets the worst outcomes among wealthy nations",
          data: [
            { name: "US Health Spending/Capita", emoji: "🇺🇸", value: `$${latest.usHealthSpendingPerCapita.toLocaleString()}`, description: "Highest in the world", source: "CMS", sourceUrl: "https://www.cms.gov/" },
            { name: "OECD Average", emoji: "🌍", value: `$${latest.oecdAvgHealthSpendingPerCapita.toLocaleString()}`, description: "Other wealthy nations spend half and live longer", source: "OECD", sourceUrl: "https://www.oecd.org/health/" },
            { name: "US Life Expectancy", emoji: "❤️", value: `${latest.usLifeExpectancy} yrs`, description: "3-4 years below OECD average despite 2x spending", source: "CDC", sourceUrl: "https://www.cdc.gov/nchs/fastats/life-expectancy.htm" },
            { name: "US Infant Mortality", emoji: "👶", value: `${latest.usInfantMortalityRate}/1K`, description: "60% higher than OECD average", source: "OECD", sourceUrl: "https://data.oecd.org/healthstat/infant-mortality-rates.htm" },
          ] as StatCardItem[],
        });
      }
      const aca = findLaw("aca");
      if (aca) sections.push({ id: "hhs-aca", type: "ironic-law", title: "The Law", data: aca });
      break;
    }

    case "dea": {
      const drugFree = findLaw("drug-free-america");
      if (drugFree) sections.push({ id: "dea-ironic-law", type: "ironic-law", title: "The Law", data: drugFree });
      if (US_OVERDOSE_DEATHS_HISTORICAL.length > 0) {
        const earliest = US_OVERDOSE_DEATHS_HISTORICAL[0]!;
        const latest = US_OVERDOSE_DEATHS_HISTORICAL[US_OVERDOSE_DEATHS_HISTORICAL.length - 1]!;
        sections.push({
          id: "dea-historical-overdoses",
          type: "stat-cards",
          title: "The Drug War in Numbers",
          subtitle: `Overdose deaths since ${earliest.year}`,
          data: [
            { name: `Overdose Deaths (${earliest.year})`, emoji: "📊", value: earliest.deaths.toLocaleString(), description: "Before the DEA was created (1973)", source: "CDC WONDER", sourceUrl: "https://wonder.cdc.gov/" },
            { name: `Overdose Deaths (${latest.year})`, emoji: "☠️", value: latest.deaths.toLocaleString(), description: `${Math.round(latest.deaths / earliest.deaths)}x increase since the drug war began`, source: "CDC WONDER", sourceUrl: "https://wonder.cdc.gov/" },
            { name: "Total Drug War Spending", emoji: "💰", value: "$47B/yr", description: "ONDCP FY2024: DEA + enforcement + interdiction + incarceration", source: "ONDCP", sourceUrl: "https://www.whitehouse.gov/ondcp/" },
            { name: "Portugal Comparison", emoji: "🇵🇹", value: "-80% deaths", description: "Portugal decriminalized all drugs in 2001. Drug deaths dropped 80%. US overdose deaths went up 20x.", source: "EMCDDA", sourceUrl: "https://www.emcdda.europa.eu/" },
          ] as StatCardItem[],
        });
      }
      break;
    }

    case "dod": {
      const dodLaw = findLaw("dept-of-defense");
      if (dodLaw) sections.push({ id: "dod-ironic-law", type: "ironic-law", title: "The Rebrand", data: dodLaw });
      sections.push({
        id: "dod-coups",
        type: "coups",
        title: "CIA-Backed Regime Changes",
        subtitle: "Democracies overthrown for corporate interests. Every entry is declassified or publicly acknowledged.",
        data: CIA_COUPS,
      });
      const pentagonPapers = findLie("pentagon-papers");
      if (pentagonPapers) sections.push({ id: "dod-pentagon-papers", type: "lie", title: "Documented Lies", data: pentagonPapers });
      const torture = findLie("torture-program");
      if (torture) sections.push({ id: "dod-torture", type: "lie", title: "", data: torture });
      const defense = findLobby("defense");
      if (defense) sections.push({ id: "dod-lobbying", type: "lobbying", title: "Defense Lobbying", data: defense });
      const pentagon = findRevolvingDoor("Pentagon");
      if (pentagon) sections.push({ id: "dod-revolving-door", type: "revolving-door", title: "The Revolving Door", data: pentagon });
      break;
    }

    case "state": {
      sections.push({
        id: "state-coups",
        type: "coups",
        title: "CIA-Backed Regime Changes",
        subtitle: "Democracies overthrown for corporate interests.",
        data: CIA_COUPS,
      });
      const iranContra = findLie("iran-contra");
      if (iranContra) sections.push({ id: "state-iran-contra", type: "lie", title: "Iran-Contra", data: iranContra });
      if (US_FOREIGN_AID_DATA.length > 0) {
        const latest = US_FOREIGN_AID_DATA[US_FOREIGN_AID_DATA.length - 1]!;
        sections.push({
          id: "state-foreign-aid",
          type: "stat-cards",
          title: "Foreign Aid",
          data: [
            { name: "Total Foreign Aid", emoji: "🌐", value: `$${latest.totalOdaBillions.toFixed(0)}B/yr`, description: "Economic + military assistance", source: "USAID", sourceUrl: "https://www.usaid.gov/" },
          ] as StatCardItem[],
        });
      }
      break;
    }

    case "irs": {
      sections.push({
        id: "irs-zero-tax",
        type: "stat-cards",
        title: "Corporate Tax Avoidance",
        subtitle: "They extract from the system without paying into it",
        data: ZERO_TAX_COMPANIES_2020.map((c) => ({
          name: c.company,
          emoji: "🏢",
          value: `$${(c.profit2020 / 1e9).toFixed(1)}B profit`,
          description: `Federal tax paid: $${c.taxPaid2020}. Effective rate: ${c.effectiveRate}%.`,
          comparison: "Paid zero federal income tax on billions in profit",
        })),
      });
      const finance = findLobby("finance");
      if (finance) sections.push({ id: "irs-lobbying", type: "lobbying", title: "Finance Industry Lobbying", data: finance });
      break;
    }

    case "ice": {
      sections.push({
        id: "ice-immigration-impact",
        type: "stat-cards",
        title: "Immigration Economic Impact",
        subtitle: "The people you're spending $29B/yr to keep out",
        data: IMMIGRATION_KEY_STATISTICS.map((s) => ({
          name: s.headline,
          emoji: "🌍",
          value: s.value,
          description: s.headline,
          source: s.source,
          sourceUrl: s.sourceUrl,
        })),
      });
      if (TARIFF_COLLATERAL_DAMAGE.length > 0) {
        sections.push({
          id: "ice-tariff-damage",
          type: "stat-cards",
          title: "Tariff Collateral Damage",
          subtitle: "The hidden costs of trade wars",
          data: TARIFF_COLLATERAL_DAMAGE.map((d) => ({
            name: `${d.year}: ${d.tariffAction}`,
            emoji: "🌾",
            value: d.farmBankruptcyChange ?? "N/A",
            description: d.consumerPriceImpact,
            comparison: d.retaliationDamage,
            source: d.source,
            sourceUrl: d.sourceUrl,
          })) as StatCardItem[],
        });
      }
      break;
    }

    case "epa": {
      const lead = findLie("leaded-gasoline");
      if (lead) sections.push({ id: "epa-lead", type: "lie", title: "Environmental Cover-ups", data: lead });
      const flint = findLie("flint-water");
      if (flint) sections.push({ id: "epa-flint", type: "lie", title: "", data: flint });
      if (US_CLIMATE_SPENDING_DATA.length > 0) {
        const latest = US_CLIMATE_SPENDING_DATA[US_CLIMATE_SPENDING_DATA.length - 1]!;
        sections.push({
          id: "epa-climate",
          type: "stat-cards",
          title: "Climate Spending",
          data: [
            { name: "Federal Climate Spending", emoji: "🌍", value: `$${latest.renewableEnergyInvestmentBillions.toFixed(0)}B/yr`, description: "EPA + DOE + other federal climate programs", source: "OMB", sourceUrl: "https://www.whitehouse.gov/omb/" },
          ] as StatCardItem[],
        });
      }
      break;
    }

    case "fbi": {
      const cointelpro = findLie("cointelpro");
      if (cointelpro) sections.push({ id: "fbi-cointelpro", type: "lie", title: "Documented Abuses", data: cointelpro });
      const nsa = findLie("nsa-surveillance");
      if (nsa) sections.push({ id: "fbi-nsa", type: "lie", title: "", data: nsa });
      const patriot = findLaw("patriot-act");
      if (patriot) sections.push({ id: "fbi-patriot", type: "ironic-law", title: "The Law", data: patriot });
      if (US_POLICE_SPENDING_DATA.length > 0) {
        const latest = US_POLICE_SPENDING_DATA[US_POLICE_SPENDING_DATA.length - 1]!;
        sections.push({
          id: "fbi-police-spending",
          type: "stat-cards",
          title: "Law Enforcement Spending",
          data: [
            { name: "Total Police Spending", emoji: "🚔", value: `$${latest.totalPoliceSpendingBillions.toFixed(0)}B/yr`, description: "Local + state + federal law enforcement", source: "BJS", sourceUrl: "https://bjs.ojp.gov/" },
            { name: "Murder Clearance Rate", emoji: "🔍", value: "52%", description: "Nearly half of all murders go unsolved. Down from 91% in 1965.", source: "FBI UCR", sourceUrl: "https://cde.ucr.cjis.gov/" },
          ] as StatCardItem[],
        });
      }
      break;
    }

    case "bop": {
      const fair = findLaw("fair-sentencing");
      if (fair) sections.push({ id: "bop-fair-sentencing", type: "ironic-law", title: "The Law", data: fair });
      if (US_INCARCERATION_DATA.length > 0) {
        const latest = US_INCARCERATION_DATA[US_INCARCERATION_DATA.length - 1]!;
        const earliest = US_INCARCERATION_DATA[0]!;
        sections.push({
          id: "bop-mass-incarceration",
          type: "stat-cards",
          title: "Mass Incarceration by the Numbers",
          data: [
            { name: "Incarceration Rate", emoji: "⛓️", value: `${latest.incarcerationRate}/100K`, description: `Was ${earliest.incarcerationRate}/100K in ${earliest.year}. US has 5% of world population, 25% of world prisoners.`, source: "BJS", sourceUrl: "https://bjs.ojp.gov/" },
            { name: "Violent Crime Rate", emoji: "🔪", value: `${latest.violentCrimeRate}/100K`, description: "Crime peaked in 1991 and fell at the same rate in states that did NOT increase incarceration.", source: "FBI UCR", sourceUrl: "https://cde.ucr.cjis.gov/" },
            { name: "Corrections Spending", emoji: "💰", value: `$${latest.correctionsSpendingBillions.toFixed(0)}B/yr`, description: "$40,000/yr per prisoner. Recidivism: 67%.", source: "BJS", sourceUrl: "https://bjs.ojp.gov/" },
          ] as StatCardItem[],
        });
      }
      break;
    }

    case "doed": {
      const nclb = findLaw("nclb");
      if (nclb) sections.push({ id: "doed-nclb", type: "ironic-law", title: "The Law", data: nclb });
      break;
    }

    case "fed": {
      // Gold standard wages — what workers would earn
      sections.push({
        id: "fed-gold-wages",
        type: "stat-cards",
        title: "What You'd Earn If the Gold Standard Was Maintained",
        subtitle: "The theft that occurred when money was untethered from gold in 1971",
        data: [
          { name: "Income If Gold Standard", emoji: "🥇", value: `$${(GOLD_WAGE_THEFT_SUMMARY.incomeIfGoldStandard2024 / 1000).toFixed(0)}K/yr`, description: `220 oz of gold × $2,400/oz. A family earned 220 oz in 1971. Today that gold buys $${(GOLD_WAGE_THEFT_SUMMARY.incomeIfGoldStandard2024 / 1000).toFixed(0)}K.`, source: "Census Bureau + Macrotrends Gold Prices", sourceUrl: "https://www.macrotrends.net/1333/historical-gold-prices-100-year-chart" },
          { name: "Actual Median Income", emoji: "💰", value: `$${(GOLD_WAGE_THEFT_SUMMARY.actualIncome2024 / 1000).toFixed(1)}K`, description: "What a family actually earns in 2024", source: "Census Bureau", sourceUrl: "https://www.census.gov/library/publications/2024/demo/p60-282.html" },
          { name: "Stolen Per Family Per Year", emoji: "🔓", value: `$${(GOLD_WAGE_THEFT_SUMMARY.annualTheftPerFamily / 1000).toFixed(0)}K/yr`, description: "The difference between what you should earn and what you do earn", source: "Calculated", sourceUrl: "https://www.epi.org/productivity-pay-gap/" },
          { name: "Purchasing Power Lost", emoji: "📉", value: `${GOLD_WAGE_THEFT_SUMMARY.purchasingPowerLostPct}%`, description: `A family earned ${GOLD_WAGE_THEFT_SUMMARY.goldOzEarned1971} oz of gold in 1971. Today: ${GOLD_WAGE_THEFT_SUMMARY.goldOzEarned2024} oz.`, source: "Macrotrends", sourceUrl: "https://www.macrotrends.net/1333/historical-gold-prices-100-year-chart" },
        ] as StatCardItem[],
      });

      // Pre-Fed prosperity — economy grew faster without Fed
      sections.push({
        id: "fed-pre-fed",
        type: "stat-cards",
        title: "The Economy Grew Faster Without the Fed",
        data: [
          { name: "Growth Before Fed (1870-1913)", emoji: "📈", value: `${PRE_FED_SUMMARY.preFedGDPGrowth}%/yr`, description: "No central bank. Prices stable. US became world's largest economy.", source: "Measuring Worth", sourceUrl: "https://www.measuringworth.com/growth/" },
          { name: "Growth After Fed (1971-2024)", emoji: "📉", value: `${PRE_FED_SUMMARY.postFedGDPGrowth}%/yr`, description: `${PRE_FED_SUMMARY.growthDecline}`, source: "BEA / FRED", sourceUrl: "https://fred.stlouisfed.org/" },
          { name: "Dollar Purchasing Power Lost", emoji: "💵", value: `${PRE_FED_SUMMARY.dollarPurchasingPowerLost}%`, description: "Since the Fed was created in 1913", source: "Minneapolis Fed", sourceUrl: "https://www.minneapolisfed.org/about-us/monetary-policy/inflation-calculator/consumer-price-index-1800-" },
          { name: "Canada Bank Failures (Great Depression)", emoji: "🇨🇦", value: `${PRE_FED_SUMMARY.canadaBankFailuresDuringGreatDepression}`, description: `Canada had no central bank until 1935. Zero bank failures. US had ${PRE_FED_SUMMARY.usBankFailuresDuringGreatDepression.toLocaleString()} WITH the Fed.`, source: "Bordo et al. 2015 / FDIC", sourceUrl: "https://www.nber.org/papers/w20710" },
        ] as StatCardItem[],
      });

      // Productivity vs wages
      const prodLatest = PRODUCTIVITY_VS_WAGES.productivity[PRODUCTIVITY_VS_WAGES.productivity.length - 1];
      const compLatest = PRODUCTIVITY_VS_WAGES.compensation[PRODUCTIVITY_VS_WAGES.compensation.length - 1];
      if (prodLatest && compLatest) {
        const prodGain = Math.round(prodLatest.value - 100);
        const compGain = Math.round(compLatest.value - 100);
        sections.push({
          id: "fed-productivity-wages",
          type: "stat-cards",
          title: "Productivity vs Wages — The Theft",
          subtitle: "Workers produce more. They don't get paid more. The gap is the theft.",
          data: [
            { name: "Productivity Growth (since 1948)", emoji: "⚙️", value: `+${prodGain}%`, description: "Workers produce far more per hour than they did in 1948", source: "EPI", sourceUrl: "https://www.epi.org/productivity-pay-gap/" },
            { name: "Compensation Growth (since 1948)", emoji: "💵", value: `+${compGain}%`, description: "But their pay hasn't kept up", source: "EPI", sourceUrl: "https://www.epi.org/productivity-pay-gap/" },
            { name: "The Gap", emoji: "🔓", value: `${prodGain - compGain}%`, description: "This is the portion of productivity gains that went to shareholders, not workers", source: "EPI", sourceUrl: "https://www.epi.org/productivity-pay-gap/" },
          ] as StatCardItem[],
        });
      }

      // Inequality
      const ceoLatest = CEO_TO_WORKER_RATIO[CEO_TO_WORKER_RATIO.length - 1];
      const homeLatest = HOME_PRICE_TO_INCOME[HOME_PRICE_TO_INCOME.length - 1];
      const debtLatest = STUDENT_LOAN_DEBT[STUDENT_LOAN_DEBT.length - 1];
      const bankruptcyLatest = MEDICAL_BANKRUPTCY_PCT[MEDICAL_BANKRUPTCY_PCT.length - 1];
      const vacantLatest = VACANT_VS_HOMELESS[VACANT_VS_HOMELESS.length - 1];
      sections.push({
        id: "fed-inequality",
        type: "stat-cards",
        title: "What the Money Printer Built",
        subtitle: "The consequences of 111 years of currency debasement",
        data: [
          ...(ceoLatest ? [{ name: "CEO:Worker Pay Ratio", emoji: "👔", value: `${ceoLatest.value}:1`, description: "Was 20:1 in 1965", source: "EPI", sourceUrl: "https://www.epi.org/publication/ceo-pay-in-2022/" }] : []),
          ...(homeLatest ? [{ name: "Home Price:Income Ratio", emoji: "🏠", value: `${homeLatest.value}x`, description: "Was 2x in 1960. A home now costs 5.5 years of income.", source: "Census / FRED", sourceUrl: "https://fred.stlouisfed.org/series/MSPUS" }] : []),
          ...(debtLatest ? [{ name: "Student Loan Debt", emoji: "🎓", value: `$${debtLatest.value}T`, description: "Cannot be discharged in bankruptcy. Unlike every other debt.", source: "Federal Reserve", sourceUrl: "https://fred.stlouisfed.org/series/SLOAS" }] : []),
          ...(bankruptcyLatest ? [{ name: "Medical Bankruptcies", emoji: "🏥", value: `${bankruptcyLatest.value}%`, description: "Of all personal bankruptcies. Only happens in the US.", source: "AJPH 2019", sourceUrl: "https://ajph.aphapublications.org/doi/10.2105/AJPH.2018.304901" }] : []),
          ...(vacantLatest ? [{ name: "Vacant Homes per Homeless Person", emoji: "🏚️", value: `${vacantLatest.ratio}`, description: `${vacantLatest.vacantUnits.toLocaleString()} vacant units. ${vacantLatest.homelessPopulation.toLocaleString()} homeless.`, source: "Census / HUD", sourceUrl: "https://www.census.gov/housing/hvs/index.html" }] : []),
        ] as StatCardItem[],
      });

      // Congressional trading
      sections.push({
        id: "fed-congressional-trading",
        type: "stat-cards",
        title: "Congressional Insider Trading",
        subtitle: "The people who control monetary policy profit from it",
        data: CONGRESSIONAL_TRADING_STATS.map((s) => ({
          name: s.metric,
          emoji: "🏛️",
          value: s.value,
          description: s.description,
          source: s.source,
          sourceUrl: s.sourceUrl,
        })) as StatCardItem[],
      });

      break;
    }
  }

  return sections;
}

/** Get all supplementary sections for an agency */
export function getAgencySupplementarySections(
  agencyId: string,
): SupplementarySection[] {
  return buildSections(agencyId);
}
