/**
 * International Country Comparison Datasets
 *
 * Comparative policy-outcome data across 20+ countries spanning:
 * - Health systems
 * - Drug policy
 * - Education
 * - Criminal justice
 *
 * All figures use the most recent available data (generally 2020-2023).
 *
 * Sources:
 * - World Health Organization (WHO) Global Health Observatory
 * - World Bank World Development Indicators
 * - OECD Health Statistics / Education at a Glance / Social Expenditure
 * - UNODC World Drug Report
 * - EMCDDA European Drug Report
 * - UNESCO Institute for Statistics
 * - Institute for Criminal Policy Research (World Prison Brief)
 * - PISA 2022 Results (OECD)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type HealthSystemType =
  | 'single-payer'
  | 'multi-payer'
  | 'beveridge'
  | 'bismarck'
  | 'private'
  | 'mixed';

export interface CountryHealthData {
  /** Country common name */
  country: string;
  /** ISO 3166-1 alpha-3 */
  iso3: string;
  /** Current health expenditure per capita, USD PPP */
  healthSpendingPerCapita: number;
  /** Current health expenditure as % of GDP */
  healthSpendingPctGDP: number;
  /** Life expectancy at birth, both sexes (years) */
  lifeExpectancy: number;
  /** Infant mortality rate per 1,000 live births */
  infantMortality: number;
  /** Maternal mortality ratio per 100,000 live births */
  maternalMortality: number;
  /** Estimated % of population without health coverage */
  uninsuredRate: number;
  /** Out-of-pocket expenditure as % of current health expenditure */
  outOfPocketPctTotal: number;
  /** Physicians per 1,000 population */
  physiciansPerThousand: number;
  /** Health system classification */
  systemType: HealthSystemType;
  /** Whether the country has achieved universal (or near-universal) coverage */
  universalCoverage: boolean;
  /** Primary data source */
  source: string;
}

export type DrugPolicyApproach =
  | 'decriminalization'
  | 'legalization'
  | 'harm-reduction'
  | 'prohibitionist'
  | 'mixed';

export interface CountryDrugPolicy {
  country: string;
  iso3: string;
  /** Broad policy approach */
  approach: DrugPolicyApproach;
  /** Brief description of the national drug policy */
  policyDescription: string;
  /** Drug-induced deaths per 100,000 population */
  drugDeathsPer100K: number;
  /** Total incarceration rate per 100,000 population (all offences) */
  incarcerationRatePer100K: number;
  /** HIV prevalence among people who inject drugs (%) */
  hivRateAmongPWID: number;
  /** % of people with drug use disorders who can access treatment */
  treatmentAccessRate: number;
  /** Year the landmark policy was adopted (null if no single landmark) */
  yearImplemented: number | null;
  /** Notable policy outcomes */
  outcomes: string[];
  source: string;
}

export interface CountryEducationData {
  country: string;
  iso3: string;
  /** Public expenditure on education as % of GDP */
  educationSpendingPctGDP: number;
  /** PISA 2022 mathematics mean score */
  pisaScoreMath: number;
  /** PISA 2022 reading mean score */
  pisaScoreReading: number;
  /** PISA 2022 science mean score */
  pisaScoreScience: number;
  /** Gross tertiary enrollment rate (%) */
  tertiaryEnrollmentRate: number;
  /** Teacher salary as ratio of GDP per capita */
  teacherSalaryRelativeToGDP: number;
  /** Pupil-teacher ratio, primary education */
  studentTeacherRatio: number;
  /** Whether the country provides publicly funded pre-K for most children */
  universalPreK: boolean;
  source: string;
}

export interface CountryCriminalJustice {
  country: string;
  iso3: string;
  /** Prison population rate per 100,000 national population */
  incarcerationRatePer100K: number;
  /** Intentional homicides per 100,000 population */
  homicideRatePer100K: number;
  /** Recidivism rate — % re-convicted / re-imprisoned within ~3 years */
  recidivismRate: number;
  /** Police officers per 100,000 population */
  policePerCapita: number;
  /** Public order & safety spending as % of GDP */
  justiceSpendingPctGDP: number;
  /** Brief characterization of the justice approach */
  approach: string;
  source: string;
}

// ─── Utility result types ────────────────────────────────────────────────────

export interface RankedCountry {
  rank: number;
  country: string;
  iso3: string;
  value: number;
}

export interface ComparisonResult {
  dataset: string;
  country1: Record<string, any>;
  country2: Record<string, any>;
  /** For every numeric field, country1 value − country2 value */
  differences: Record<string, number>;
}

// ─── Health System Comparison Data ───────────────────────────────────────────

export const HEALTH_SYSTEM_COMPARISON: CountryHealthData[] = [
  {
    country: 'Singapore',
    iso3: 'SGP',
    healthSpendingPerCapita: 3013,
    healthSpendingPctGDP: 4.1,
    lifeExpectancy: 84.1,
    infantMortality: 1.7,
    maternalMortality: 7,
    uninsuredRate: 0,
    outOfPocketPctTotal: 31.4,
    physiciansPerThousand: 2.5,
    systemType: 'mixed',
    universalCoverage: true,
    source: 'WHO Global Health Expenditure Database 2022; World Bank WDI 2022',
  },
  {
    country: 'Japan',
    iso3: 'JPN',
    healthSpendingPerCapita: 4691,
    healthSpendingPctGDP: 10.9,
    lifeExpectancy: 84.8,
    infantMortality: 1.8,
    maternalMortality: 4,
    uninsuredRate: 0,
    outOfPocketPctTotal: 12.7,
    physiciansPerThousand: 2.6,
    systemType: 'bismarck',
    universalCoverage: true,
    source: 'WHO GHE 2022; OECD Health Statistics 2023',
  },
  {
    country: 'South Korea',
    iso3: 'KOR',
    healthSpendingPerCapita: 3914,
    healthSpendingPctGDP: 8.4,
    lifeExpectancy: 83.7,
    infantMortality: 2.7,
    maternalMortality: 8,
    uninsuredRate: 0,
    outOfPocketPctTotal: 30.2,
    physiciansPerThousand: 2.6,
    systemType: 'bismarck',
    universalCoverage: true,
    source: 'WHO GHE 2022; OECD Health Statistics 2023',
  },
  {
    country: 'Switzerland',
    iso3: 'CHE',
    healthSpendingPerCapita: 9044,
    healthSpendingPctGDP: 11.3,
    lifeExpectancy: 83.4,
    infantMortality: 3.3,
    maternalMortality: 7,
    uninsuredRate: 0,
    outOfPocketPctTotal: 27.5,
    physiciansPerThousand: 4.4,
    systemType: 'bismarck',
    universalCoverage: true,
    source: 'WHO GHE 2022; OECD Health Statistics 2023',
  },
  {
    country: 'Norway',
    iso3: 'NOR',
    healthSpendingPerCapita: 8093,
    healthSpendingPctGDP: 11.4,
    lifeExpectancy: 83.3,
    infantMortality: 1.8,
    maternalMortality: 2,
    uninsuredRate: 0,
    outOfPocketPctTotal: 14.3,
    physiciansPerThousand: 5.2,
    systemType: 'beveridge',
    universalCoverage: true,
    source: 'WHO GHE 2022; OECD Health Statistics 2023',
  },
  {
    country: 'Sweden',
    iso3: 'SWE',
    healthSpendingPerCapita: 6262,
    healthSpendingPctGDP: 11.4,
    lifeExpectancy: 83.2,
    infantMortality: 2.1,
    maternalMortality: 5,
    uninsuredRate: 0,
    outOfPocketPctTotal: 13.8,
    physiciansPerThousand: 7.1,
    systemType: 'beveridge',
    universalCoverage: true,
    source: 'WHO GHE 2022; OECD Health Statistics 2023',
  },
  {
    country: 'United Kingdom',
    iso3: 'GBR',
    healthSpendingPerCapita: 5138,
    healthSpendingPctGDP: 11.3,
    lifeExpectancy: 80.7,
    infantMortality: 3.4,
    maternalMortality: 10,
    uninsuredRate: 0,
    outOfPocketPctTotal: 16.7,
    physiciansPerThousand: 3.2,
    systemType: 'beveridge',
    universalCoverage: true,
    source: 'WHO GHE 2022; OECD Health Statistics 2023',
  },
  {
    country: 'France',
    iso3: 'FRA',
    healthSpendingPerCapita: 5564,
    healthSpendingPctGDP: 12.1,
    lifeExpectancy: 82.5,
    infantMortality: 3.2,
    maternalMortality: 8,
    uninsuredRate: 0.1,
    outOfPocketPctTotal: 8.9,
    physiciansPerThousand: 3.2,
    systemType: 'bismarck',
    universalCoverage: true,
    source: 'WHO GHE 2022; OECD Health Statistics 2023',
  },
  {
    country: 'Germany',
    iso3: 'DEU',
    healthSpendingPerCapita: 7383,
    healthSpendingPctGDP: 12.7,
    lifeExpectancy: 80.6,
    infantMortality: 3.1,
    maternalMortality: 4,
    uninsuredRate: 0.1,
    outOfPocketPctTotal: 12.7,
    physiciansPerThousand: 4.5,
    systemType: 'bismarck',
    universalCoverage: true,
    source: 'WHO GHE 2022; OECD Health Statistics 2023',
  },
  {
    country: 'Canada',
    iso3: 'CAN',
    healthSpendingPerCapita: 5905,
    healthSpendingPctGDP: 10.8,
    lifeExpectancy: 81.7,
    infantMortality: 4.3,
    maternalMortality: 11,
    uninsuredRate: 0,
    outOfPocketPctTotal: 14.2,
    physiciansPerThousand: 2.8,
    systemType: 'single-payer',
    universalCoverage: true,
    source: 'WHO GHE 2022; OECD Health Statistics 2023',
  },
  {
    country: 'Australia',
    iso3: 'AUS',
    healthSpendingPerCapita: 5627,
    healthSpendingPctGDP: 9.6,
    lifeExpectancy: 83.0,
    infantMortality: 3.1,
    maternalMortality: 3,
    uninsuredRate: 0,
    outOfPocketPctTotal: 16.1,
    physiciansPerThousand: 4.0,
    systemType: 'mixed',
    universalCoverage: true,
    source: 'WHO GHE 2022; OECD Health Statistics 2023',
  },
  {
    country: 'Netherlands',
    iso3: 'NLD',
    healthSpendingPerCapita: 6190,
    healthSpendingPctGDP: 10.2,
    lifeExpectancy: 81.5,
    infantMortality: 3.1,
    maternalMortality: 4,
    uninsuredRate: 0.2,
    outOfPocketPctTotal: 10.4,
    physiciansPerThousand: 4.1,
    systemType: 'bismarck',
    universalCoverage: true,
    source: 'WHO GHE 2022; OECD Health Statistics 2023',
  },
  {
    country: 'Israel',
    iso3: 'ISR',
    healthSpendingPerCapita: 3266,
    healthSpendingPctGDP: 7.5,
    lifeExpectancy: 82.6,
    infantMortality: 2.8,
    maternalMortality: 3,
    uninsuredRate: 0,
    outOfPocketPctTotal: 20.5,
    physiciansPerThousand: 3.3,
    systemType: 'mixed',
    universalCoverage: true,
    source: 'WHO GHE 2022; OECD Health Statistics 2023',
  },
  {
    country: 'Taiwan',
    iso3: 'TWN',
    healthSpendingPerCapita: 3295,
    healthSpendingPctGDP: 6.6,
    lifeExpectancy: 80.9,
    infantMortality: 4.0,
    maternalMortality: 14,
    uninsuredRate: 0.3,
    outOfPocketPctTotal: 33.0,
    physiciansPerThousand: 2.3,
    systemType: 'single-payer',
    universalCoverage: true,
    source: 'Taiwan NHI Annual Report 2022; WHO GHO estimates',
  },
  {
    country: 'Cuba',
    iso3: 'CUB',
    healthSpendingPerCapita: 966,
    healthSpendingPctGDP: 12.2,
    lifeExpectancy: 78.0,
    infantMortality: 4.0,
    maternalMortality: 39,
    uninsuredRate: 0,
    outOfPocketPctTotal: 10.1,
    physiciansPerThousand: 8.4,
    systemType: 'beveridge',
    universalCoverage: true,
    source: 'WHO GHE 2022; World Bank WDI 2022',
  },
  {
    country: 'Costa Rica',
    iso3: 'CRI',
    healthSpendingPerCapita: 1285,
    healthSpendingPctGDP: 7.3,
    lifeExpectancy: 80.3,
    infantMortality: 7.0,
    maternalMortality: 22,
    uninsuredRate: 5,
    outOfPocketPctTotal: 22.8,
    physiciansPerThousand: 3.1,
    systemType: 'mixed',
    universalCoverage: true,
    source: 'WHO GHE 2022; World Bank WDI 2022',
  },
  {
    country: 'Thailand',
    iso3: 'THA',
    healthSpendingPerCapita: 812,
    healthSpendingPctGDP: 4.4,
    lifeExpectancy: 78.7,
    infantMortality: 7.1,
    maternalMortality: 29,
    uninsuredRate: 1,
    outOfPocketPctTotal: 11.0,
    physiciansPerThousand: 0.9,
    systemType: 'mixed',
    universalCoverage: true,
    source: 'WHO GHE 2022; World Bank WDI 2022',
  },
  {
    country: 'United States',
    iso3: 'USA',
    healthSpendingPerCapita: 12555,
    healthSpendingPctGDP: 17.3,
    lifeExpectancy: 77.5,
    infantMortality: 5.4,
    maternalMortality: 21,
    uninsuredRate: 8.0,
    outOfPocketPctTotal: 10.8,
    physiciansPerThousand: 2.6,
    systemType: 'private',
    universalCoverage: false,
    source: 'CMS National Health Expenditure Accounts 2022; CDC NCHS; WHO GHE 2022',
  },
  {
    country: 'Brazil',
    iso3: 'BRA',
    healthSpendingPerCapita: 1321,
    healthSpendingPctGDP: 9.9,
    lifeExpectancy: 75.3,
    infantMortality: 12.4,
    maternalMortality: 72,
    uninsuredRate: 25,
    outOfPocketPctTotal: 25.3,
    physiciansPerThousand: 2.4,
    systemType: 'mixed',
    universalCoverage: false,
    source: 'WHO GHE 2022; World Bank WDI 2022',
  },
  {
    country: 'India',
    iso3: 'IND',
    healthSpendingPerCapita: 231,
    healthSpendingPctGDP: 3.3,
    lifeExpectancy: 70.8,
    infantMortality: 25.5,
    maternalMortality: 103,
    uninsuredRate: 45,
    outOfPocketPctTotal: 48.2,
    physiciansPerThousand: 0.7,
    systemType: 'mixed',
    universalCoverage: false,
    source: 'WHO GHE 2022; World Bank WDI 2022; NFHS-5',
  },
];

// ─── Drug Policy Comparison Data ─────────────────────────────────────────────

export const DRUG_POLICY_COMPARISON: CountryDrugPolicy[] = [
  {
    country: 'Portugal',
    iso3: 'PRT',
    approach: 'decriminalization',
    policyDescription:
      'Decriminalized personal possession of all drugs in 2001 (Law 30/2000). ' +
      'Users caught with ≤10-day supply are referred to Dissuasion Commissions, ' +
      'not criminal courts. Emphasis on treatment and harm reduction.',
    drugDeathsPer100K: 0.3,
    incarcerationRatePer100K: 111,
    hivRateAmongPWID: 1.0,
    treatmentAccessRate: 75,
    yearImplemented: 2001,
    outcomes: [
      'Drug-induced deaths fell ~80% from 2001 to 2017',
      'HIV infections among people who inject drugs dropped ~95%',
      'Drug use rates remained below EU average',
      'Drug-related incarceration costs reduced significantly',
      'Number of people in treatment increased 60%',
    ],
    source: 'EMCDDA Country Drug Report: Portugal 2023; SICAD Annual Report',
  },
  {
    country: 'Netherlands',
    iso3: 'NLD',
    approach: 'harm-reduction',
    policyDescription:
      'Formal tolerance policy (gedoogbeleid) for cannabis via licensed coffee shops since 1976. ' +
      'Hard drugs criminalized but harm-reduction services widely available. ' +
      'Needle exchange, supervised consumption, opioid substitution therapy.',
    drugDeathsPer100K: 1.8,
    incarcerationRatePer100K: 59,
    hivRateAmongPWID: 3.5,
    treatmentAccessRate: 68,
    yearImplemented: 1976,
    outcomes: [
      'Cannabis use rates comparable to strict-prohibition EU peers',
      'Very low drug-related mortality by EU standards',
      'Low incarceration rate overall',
      'HIV transmission among PWID well controlled',
    ],
    source: 'EMCDDA Country Drug Report: Netherlands 2023; Trimbos Institute',
  },
  {
    country: 'Switzerland',
    iso3: 'CHE',
    approach: 'harm-reduction',
    policyDescription:
      'Pioneered supervised injection sites (1986) and heroin-assisted treatment (HAT). ' +
      'Four-pillar model: prevention, therapy, harm reduction, enforcement. ' +
      'HAT available since 1994 for treatment-resistant opioid users.',
    drugDeathsPer100K: 1.5,
    incarcerationRatePer100K: 75,
    hivRateAmongPWID: 2.8,
    treatmentAccessRate: 72,
    yearImplemented: 1994,
    outcomes: [
      'Heroin-assisted treatment reduced illicit heroin use by 82%',
      'Criminal offenses among HAT patients dropped 60%',
      'Drug-related deaths halved since the 1990s peak',
      'Open drug scenes eliminated',
      'Broad public support: 68% backed HAT in 2008 referendum',
    ],
    source: 'FOPH Swiss Federal Office of Public Health; EMCDDA HAT overview',
  },
  {
    country: 'Czech Republic',
    iso3: 'CZE',
    approach: 'decriminalization',
    policyDescription:
      'Decriminalized possession of small amounts of all drugs in 2010 (amended 2020). ' +
      'Thresholds set for each substance. Comprehensive harm-reduction services.',
    drugDeathsPer100K: 0.5,
    incarcerationRatePer100K: 181,
    hivRateAmongPWID: 0.4,
    treatmentAccessRate: 58,
    yearImplemented: 2010,
    outcomes: [
      'Among the lowest drug-induced death rates in the EU',
      'Near-zero HIV among PWID — one of the best in Europe',
      'Cannabis use rose modestly but stabilized',
      'Treatment enrollment steady',
    ],
    source: 'EMCDDA Country Drug Report: Czechia 2023; National Drug Monitor',
  },
  {
    country: 'Uruguay',
    iso3: 'URY',
    approach: 'legalization',
    policyDescription:
      'First country to fully legalize cannabis production, sale, and consumption (2013). ' +
      'State-regulated market with pharmacy sales, home grow, and cannabis clubs. ' +
      'Other drugs remain prohibited but treatment-oriented.',
    drugDeathsPer100K: 1.2,
    incarcerationRatePer100K: 322,
    hivRateAmongPWID: 5.0,
    treatmentAccessRate: 40,
    yearImplemented: 2013,
    outcomes: [
      'Black market share of cannabis reduced significantly',
      'No increase in youth cannabis use after legalization',
      'Tax revenue generated for prevention programs',
      'Drug trafficking violence modestly reduced',
    ],
    source: 'IRCCA Uruguay Cannabis Regulation Reports; UNODC World Drug Report 2023',
  },
  {
    country: 'Canada',
    iso3: 'CAN',
    approach: 'mixed',
    policyDescription:
      'Legalized recreational cannabis nationally in 2018 (Cannabis Act). ' +
      'Supervised consumption sites authorized. Opioid crisis addressed with naloxone distribution, ' +
      'safe supply programs in some provinces.',
    drugDeathsPer100K: 5.2,
    incarcerationRatePer100K: 104,
    hivRateAmongPWID: 8.5,
    treatmentAccessRate: 55,
    yearImplemented: 2018,
    outcomes: [
      'Cannabis arrests dropped ~80% post-legalization',
      'Opioid crisis persists despite harm-reduction efforts',
      'Legal cannabis market captured ~70% of consumer spending by 2023',
      'Supervised consumption sites prevented thousands of overdose deaths',
    ],
    source: 'Health Canada; Statistics Canada; PHAC; CCSA',
  },
  {
    country: 'United States',
    iso3: 'USA',
    approach: 'prohibitionist',
    policyDescription:
      'Federal prohibition of most drugs under the Controlled Substances Act (1970). ' +
      'Mandatory minimums, three-strikes laws. State-level cannabis legalization spreading ' +
      '(24 states + DC as of 2024) but federal law unchanged.',
    drugDeathsPer100K: 32.4,
    incarcerationRatePer100K: 531,
    hivRateAmongPWID: 7.2,
    treatmentAccessRate: 28,
    yearImplemented: null,
    outcomes: [
      'Highest incarceration rate in the developed world',
      'Opioid epidemic — 107,000+ overdose deaths in 2023',
      'Racial disparities in drug enforcement well documented',
      '$50+ billion annual cost of War on Drugs',
      'State-level cannabis legalization showing revenue benefits',
    ],
    source: 'CDC WONDER; BJS; Sentencing Project; NSDUH 2023',
  },
  {
    country: 'United Kingdom',
    iso3: 'GBR',
    approach: 'prohibitionist',
    policyDescription:
      'Misuse of Drugs Act 1971. Drugs classified A-B-C with escalating penalties. ' +
      'Limited harm-reduction: needle exchanges, opioid substitution widely available. ' +
      'Cannabis temporarily reclassified to Class C (2004-2009) then back to B.',
    drugDeathsPer100K: 7.6,
    incarcerationRatePer100K: 129,
    hivRateAmongPWID: 1.2,
    treatmentAccessRate: 52,
    yearImplemented: null,
    outcomes: [
      'Drug deaths at record highs — particularly in Scotland',
      'Good opioid substitution coverage mitigates some harms',
      'Needle exchange program reduced HIV transmission among PWID',
      'Cannabis classification changes showed no clear impact on use',
    ],
    source: 'ONS Deaths Related to Drug Poisoning 2023; PHE; EMCDDA',
  },
  {
    country: 'Sweden',
    iso3: 'SWE',
    approach: 'prohibitionist',
    policyDescription:
      'Zero-tolerance, abstinence-oriented policy. Drug use itself is a criminal offense. ' +
      'Heavy investment in prevention but limited harm-reduction services. ' +
      'No supervised injection sites or heroin-assisted treatment.',
    drugDeathsPer100K: 9.3,
    incarcerationRatePer100K: 57,
    hivRateAmongPWID: 1.5,
    treatmentAccessRate: 45,
    yearImplemented: null,
    outcomes: [
      'Among the highest drug death rates in Europe despite strict laws',
      'Low general incarceration rate reflects overall criminal justice approach',
      'Drug use rates moderate but rising among youth',
      'Growing domestic debate about harm-reduction reforms',
    ],
    source: 'EMCDDA Country Drug Report: Sweden 2023; CAN Annual Report',
  },
  {
    country: 'Norway',
    iso3: 'NOR',
    approach: 'harm-reduction',
    policyDescription:
      'Shifted from punitive to health-oriented approach. Government proposed full ' +
      'decriminalization in 2021 (defeated in parliament but policy shifted in practice). ' +
      'Supervised injection sites in Oslo since 2005. Opioid substitution widely available.',
    drugDeathsPer100K: 5.8,
    incarcerationRatePer100K: 56,
    hivRateAmongPWID: 2.0,
    treatmentAccessRate: 65,
    yearImplemented: null,
    outcomes: [
      'Supervised injection sites prevented documented overdose deaths',
      'Drug death rate high historically but declining with harm-reduction expansion',
      'Low incarceration relative to drug use prevalence',
      'Strong public health infrastructure for treatment',
    ],
    source: 'EMCDDA Country Drug Report: Norway 2023; FHI',
  },
  {
    country: 'Japan',
    iso3: 'JPN',
    approach: 'prohibitionist',
    policyDescription:
      'Extremely strict drug laws. Cannabis Control Act, Stimulants Control Act. ' +
      'Even personal use carries significant prison time. Very low tolerance culturally. ' +
      'Methamphetamine historically the primary concern.',
    drugDeathsPer100K: 0.2,
    incarcerationRatePer100K: 38,
    hivRateAmongPWID: 0.8,
    treatmentAccessRate: 35,
    yearImplemented: null,
    outcomes: [
      'Very low drug use rates compared to Western nations',
      'Cultural stigma is primary deterrent more than legal penalties',
      'Low drug-related mortality',
      'Limited harm-reduction services due to low demand',
    ],
    source: 'UNODC World Drug Report 2023; Japan Ministry of Health; WHO',
  },
  {
    country: 'Singapore',
    iso3: 'SGP',
    approach: 'prohibitionist',
    policyDescription:
      'Misuse of Drugs Act — among the strictest globally. Mandatory death penalty for ' +
      'trafficking above threshold amounts. Mandatory drug testing. ' +
      'Rehabilitation via Drug Rehabilitation Centres.',
    drugDeathsPer100K: 0.1,
    incarcerationRatePer100K: 181,
    hivRateAmongPWID: 2.5,
    treatmentAccessRate: 30,
    yearImplemented: null,
    outcomes: [
      'Extremely low drug use prevalence and drug-related deaths',
      'Death penalty for trafficking is internationally controversial',
      'High cost of enforcement per capita',
      'Rehabilitation centers have mixed evidence on long-term outcomes',
    ],
    source: 'CNB Singapore Annual Report; UNODC; WHO',
  },
  {
    country: 'Australia',
    iso3: 'AUS',
    approach: 'mixed',
    policyDescription:
      'Federal prohibition with state-level variations. ACT legalized cannabis possession (2020). ' +
      'Medically supervised injecting room in Sydney (2001). ' +
      'National needle and syringe program. Opioid substitution therapy widely available.',
    drugDeathsPer100K: 6.8,
    incarcerationRatePer100K: 160,
    hivRateAmongPWID: 1.5,
    treatmentAccessRate: 50,
    yearImplemented: null,
    outcomes: [
      'Sydney supervised injecting facility: 10,000+ overdose interventions, zero deaths on-site',
      'Needle exchange program sharply reduced HIV among PWID',
      'Drug-related deaths rising due to pharmaceutical opioids',
      'Cannabis diversion programs reduce criminal justice burden',
    ],
    source: 'AIHW; MSIC evaluation reports; NDSHS 2022',
  },
  {
    country: 'Germany',
    iso3: 'DEU',
    approach: 'harm-reduction',
    policyDescription:
      'Cannabis legalized for personal use in 2024. Drug consumption rooms operational since 2000. ' +
      'Strong harm-reduction infrastructure: needle exchange, opioid substitution, naloxone. ' +
      'Possession of small amounts of other drugs generally not prosecuted.',
    drugDeathsPer100K: 2.2,
    incarcerationRatePer100K: 67,
    hivRateAmongPWID: 3.0,
    treatmentAccessRate: 62,
    yearImplemented: 2024,
    outcomes: [
      'Cannabis legalization expected to reduce black market and criminal justice costs',
      'Drug consumption rooms prevented overdose deaths',
      'Opioid substitution therapy coverage among highest in Europe',
      'Drug-related deaths stable despite fentanyl emergence in other countries',
    ],
    source: 'EMCDDA Country Drug Report: Germany 2023; DBDD; BfArM',
  },
  {
    country: 'New Zealand',
    iso3: 'NZL',
    approach: 'mixed',
    policyDescription:
      'Drug policy reform with health focus. Drug checking services legalized (2020). ' +
      'Cannabis referendum narrowly failed (2020, 48.4% yes). ' +
      'Needle exchange, opioid substitution treatment available.',
    drugDeathsPer100K: 1.9,
    incarcerationRatePer100K: 165,
    hivRateAmongPWID: 0.5,
    treatmentAccessRate: 55,
    yearImplemented: null,
    outcomes: [
      'Drug checking at festivals prevented documented overdoses',
      'Methamphetamine remains primary drug concern',
      'Cannabis referendum catalyzed ongoing policy debate',
      'Needle exchange successful in reducing blood-borne infections',
    ],
    source: 'NZ Drug Foundation; Ministry of Health; UNODC',
  },
];

// ─── Education Comparison Data ───────────────────────────────────────────────

export const EDUCATION_COMPARISON: CountryEducationData[] = [
  {
    country: 'Finland',
    iso3: 'FIN',
    educationSpendingPctGDP: 5.9,
    pisaScoreMath: 484,
    pisaScoreReading: 490,
    pisaScoreScience: 511,
    tertiaryEnrollmentRate: 94,
    teacherSalaryRelativeToGDP: 1.09,
    studentTeacherRatio: 13,
    universalPreK: true,
    source: 'OECD Education at a Glance 2023; PISA 2022; UNESCO UIS',
  },
  {
    country: 'Singapore',
    iso3: 'SGP',
    educationSpendingPctGDP: 2.9,
    pisaScoreMath: 575,
    pisaScoreReading: 543,
    pisaScoreScience: 561,
    tertiaryEnrollmentRate: 91,
    teacherSalaryRelativeToGDP: 1.22,
    studentTeacherRatio: 15,
    universalPreK: true,
    source: 'OECD PISA 2022; Singapore MOE; UNESCO UIS',
  },
  {
    country: 'Japan',
    iso3: 'JPN',
    educationSpendingPctGDP: 3.4,
    pisaScoreMath: 536,
    pisaScoreReading: 516,
    pisaScoreScience: 547,
    tertiaryEnrollmentRate: 65,
    teacherSalaryRelativeToGDP: 1.05,
    studentTeacherRatio: 15,
    universalPreK: true,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
  {
    country: 'South Korea',
    iso3: 'KOR',
    educationSpendingPctGDP: 4.7,
    pisaScoreMath: 527,
    pisaScoreReading: 515,
    pisaScoreScience: 528,
    tertiaryEnrollmentRate: 98,
    teacherSalaryRelativeToGDP: 1.34,
    studentTeacherRatio: 16,
    universalPreK: true,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
  {
    country: 'Estonia',
    iso3: 'EST',
    educationSpendingPctGDP: 5.2,
    pisaScoreMath: 510,
    pisaScoreReading: 511,
    pisaScoreScience: 526,
    tertiaryEnrollmentRate: 72,
    teacherSalaryRelativeToGDP: 0.96,
    studentTeacherRatio: 13,
    universalPreK: true,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
  {
    country: 'Canada',
    iso3: 'CAN',
    educationSpendingPctGDP: 5.2,
    pisaScoreMath: 497,
    pisaScoreReading: 507,
    pisaScoreScience: 515,
    tertiaryEnrollmentRate: 75,
    teacherSalaryRelativeToGDP: 1.08,
    studentTeacherRatio: 15,
    universalPreK: false,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
  {
    country: 'Netherlands',
    iso3: 'NLD',
    educationSpendingPctGDP: 5.1,
    pisaScoreMath: 493,
    pisaScoreReading: 459,
    pisaScoreScience: 488,
    tertiaryEnrollmentRate: 87,
    teacherSalaryRelativeToGDP: 0.98,
    studentTeacherRatio: 15,
    universalPreK: true,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
  {
    country: 'Switzerland',
    iso3: 'CHE',
    educationSpendingPctGDP: 5.0,
    pisaScoreMath: 508,
    pisaScoreReading: 483,
    pisaScoreScience: 503,
    tertiaryEnrollmentRate: 63,
    teacherSalaryRelativeToGDP: 1.15,
    studentTeacherRatio: 14,
    universalPreK: false,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
  {
    country: 'Germany',
    iso3: 'DEU',
    educationSpendingPctGDP: 4.6,
    pisaScoreMath: 475,
    pisaScoreReading: 480,
    pisaScoreScience: 492,
    tertiaryEnrollmentRate: 74,
    teacherSalaryRelativeToGDP: 1.12,
    studentTeacherRatio: 15,
    universalPreK: true,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
  {
    country: 'United Kingdom',
    iso3: 'GBR',
    educationSpendingPctGDP: 4.4,
    pisaScoreMath: 489,
    pisaScoreReading: 494,
    pisaScoreScience: 500,
    tertiaryEnrollmentRate: 62,
    teacherSalaryRelativeToGDP: 0.92,
    studentTeacherRatio: 17,
    universalPreK: true,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
  {
    country: 'United States',
    iso3: 'USA',
    educationSpendingPctGDP: 4.9,
    pisaScoreMath: 465,
    pisaScoreReading: 504,
    pisaScoreScience: 499,
    tertiaryEnrollmentRate: 88,
    teacherSalaryRelativeToGDP: 0.69,
    studentTeacherRatio: 15,
    universalPreK: false,
    source: 'OECD Education at a Glance 2023; PISA 2022; NCES',
  },
  {
    country: 'Australia',
    iso3: 'AUS',
    educationSpendingPctGDP: 5.1,
    pisaScoreMath: 487,
    pisaScoreReading: 498,
    pisaScoreScience: 507,
    tertiaryEnrollmentRate: 110,
    teacherSalaryRelativeToGDP: 0.95,
    studentTeacherRatio: 14,
    universalPreK: true,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
  {
    country: 'France',
    iso3: 'FRA',
    educationSpendingPctGDP: 5.2,
    pisaScoreMath: 474,
    pisaScoreReading: 474,
    pisaScoreScience: 487,
    tertiaryEnrollmentRate: 69,
    teacherSalaryRelativeToGDP: 0.88,
    studentTeacherRatio: 19,
    universalPreK: true,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
  {
    country: 'Poland',
    iso3: 'POL',
    educationSpendingPctGDP: 4.6,
    pisaScoreMath: 489,
    pisaScoreReading: 489,
    pisaScoreScience: 499,
    tertiaryEnrollmentRate: 70,
    teacherSalaryRelativeToGDP: 0.82,
    studentTeacherRatio: 10,
    universalPreK: true,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
  {
    country: 'Ireland',
    iso3: 'IRL',
    educationSpendingPctGDP: 3.1,
    pisaScoreMath: 492,
    pisaScoreReading: 516,
    pisaScoreScience: 504,
    tertiaryEnrollmentRate: 79,
    teacherSalaryRelativeToGDP: 1.05,
    studentTeacherRatio: 15,
    universalPreK: true,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
  {
    country: 'Norway',
    iso3: 'NOR',
    educationSpendingPctGDP: 5.7,
    pisaScoreMath: 468,
    pisaScoreReading: 477,
    pisaScoreScience: 478,
    tertiaryEnrollmentRate: 82,
    teacherSalaryRelativeToGDP: 0.81,
    studentTeacherRatio: 14,
    universalPreK: true,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
  {
    country: 'Denmark',
    iso3: 'DNK',
    educationSpendingPctGDP: 5.9,
    pisaScoreMath: 489,
    pisaScoreReading: 489,
    pisaScoreScience: 494,
    tertiaryEnrollmentRate: 84,
    teacherSalaryRelativeToGDP: 1.02,
    studentTeacherRatio: 11,
    universalPreK: true,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
  {
    country: 'New Zealand',
    iso3: 'NZL',
    educationSpendingPctGDP: 4.7,
    pisaScoreMath: 479,
    pisaScoreReading: 501,
    pisaScoreScience: 504,
    tertiaryEnrollmentRate: 82,
    teacherSalaryRelativeToGDP: 0.90,
    studentTeacherRatio: 14,
    universalPreK: true,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
  {
    country: 'Israel',
    iso3: 'ISR',
    educationSpendingPctGDP: 6.2,
    pisaScoreMath: 458,
    pisaScoreReading: 474,
    pisaScoreScience: 465,
    tertiaryEnrollmentRate: 68,
    teacherSalaryRelativeToGDP: 0.92,
    studentTeacherRatio: 14,
    universalPreK: true,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
  {
    country: 'Chile',
    iso3: 'CHL',
    educationSpendingPctGDP: 5.4,
    pisaScoreMath: 412,
    pisaScoreReading: 448,
    pisaScoreScience: 444,
    tertiaryEnrollmentRate: 90,
    teacherSalaryRelativeToGDP: 0.80,
    studentTeacherRatio: 20,
    universalPreK: false,
    source: 'OECD Education at a Glance 2023; PISA 2022',
  },
];

// ─── Criminal Justice Comparison Data ────────────────────────────────────────

export const CRIMINAL_JUSTICE_COMPARISON: CountryCriminalJustice[] = [
  {
    country: 'Norway',
    iso3: 'NOR',
    incarcerationRatePer100K: 56,
    homicideRatePer100K: 0.5,
    recidivismRate: 20,
    policePerCapita: 189,
    justiceSpendingPctGDP: 1.0,
    approach:
      'Rehabilitative / restorative: focus on reintegration, humane conditions (Halden model), ' +
      'maximum 21-year sentences (preventive detention possible). Education and job training in prison.',
    source: 'World Prison Brief; UNODC; Kriminalomsorgen (Norwegian Correctional Service)',
  },
  {
    country: 'Finland',
    iso3: 'FIN',
    incarcerationRatePer100K: 51,
    homicideRatePer100K: 1.6,
    recidivismRate: 31,
    policePerCapita: 137,
    justiceSpendingPctGDP: 0.9,
    approach:
      'Rehabilitative with open prisons. ~30% of prisoners in open institutions. ' +
      'Focus on normality principle — life in prison should resemble life outside as much as possible.',
    source: 'World Prison Brief; UNODC; Rise — Finnish Criminal Sanctions Agency',
  },
  {
    country: 'Netherlands',
    iso3: 'NLD',
    incarcerationRatePer100K: 59,
    homicideRatePer100K: 0.6,
    recidivismRate: 47,
    policePerCapita: 292,
    justiceSpendingPctGDP: 1.7,
    approach:
      'Pragmatic / rehabilitative. Closed several prisons due to declining crime and incarceration. ' +
      'Emphasis on electronic monitoring, community service, and post-release support.',
    source: 'World Prison Brief; UNODC; CBS Netherlands',
  },
  {
    country: 'Japan',
    iso3: 'JPN',
    incarcerationRatePer100K: 38,
    homicideRatePer100K: 0.2,
    recidivismRate: 49,
    policePerCapita: 197,
    justiceSpendingPctGDP: 0.9,
    approach:
      'Strict discipline, regimented rehabilitation in prisons. Very high conviction rate (99%+). ' +
      'Strong community-based crime prevention (koban system). Social shame as deterrent.',
    source: 'World Prison Brief; UNODC; Japan MOJ White Paper on Crime',
  },
  {
    country: 'Germany',
    iso3: 'DEU',
    incarcerationRatePer100K: 67,
    homicideRatePer100K: 0.8,
    recidivismRate: 46,
    policePerCapita: 304,
    justiceSpendingPctGDP: 1.5,
    approach:
      'Rehabilitative, dignity-centered. Constitutional principle: resocialization is the goal. ' +
      'Prison conditions modeled on life outside. Day-release and open prison common.',
    source: 'World Prison Brief; UNODC; Destatis; Vera Institute comparisons',
  },
  {
    country: 'United Kingdom',
    iso3: 'GBR',
    incarcerationRatePer100K: 129,
    homicideRatePer100K: 1.0,
    recidivismRate: 45,
    policePerCapita: 221,
    justiceSpendingPctGDP: 1.8,
    approach:
      'Mixed punitive/rehabilitative. Overcrowded prisons. ' +
      'Recent emphasis on reducing short sentences and expanding community sentences. ' +
      'Probation service re-nationalized after private-sector failures.',
    source: 'World Prison Brief; UNODC; MOJ Proven Reoffending Statistics',
  },
  {
    country: 'Canada',
    iso3: 'CAN',
    incarcerationRatePer100K: 104,
    homicideRatePer100K: 2.0,
    recidivismRate: 40,
    policePerCapita: 183,
    justiceSpendingPctGDP: 1.3,
    approach:
      'Mixed approach. Federal system emphasizes rehabilitation and safe reintegration. ' +
      'Restorative justice programs for Indigenous communities. Drug treatment courts available.',
    source: 'World Prison Brief; UNODC; Statistics Canada; CSC',
  },
  {
    country: 'United States',
    iso3: 'USA',
    incarcerationRatePer100K: 531,
    homicideRatePer100K: 6.3,
    recidivismRate: 76,
    policePerCapita: 238,
    justiceSpendingPctGDP: 2.0,
    approach:
      'Predominantly punitive. Mass incarceration, mandatory minimums, three-strikes laws, ' +
      'private prisons (8% of federal inmates). Cash bail system. ' +
      'Growing reform movement: some states reducing sentences, diversion programs expanding.',
    source: 'BJS; Sentencing Project; FBI UCR; World Prison Brief; UNODC',
  },
  {
    country: 'Singapore',
    iso3: 'SGP',
    incarcerationRatePer100K: 181,
    homicideRatePer100K: 0.2,
    recidivismRate: 24,
    policePerCapita: 278,
    justiceSpendingPctGDP: 1.4,
    approach:
      'Strict deterrence with rehabilitation. Caning and mandatory death penalty for drug trafficking. ' +
      'Community-based programs (Yellow Ribbon Project). Strong social safety net reduces recidivism drivers.',
    source: 'World Prison Brief; UNODC; Singapore Prison Service',
  },
  {
    country: 'Brazil',
    iso3: 'BRA',
    incarcerationRatePer100K: 381,
    homicideRatePer100K: 22.4,
    recidivismRate: 70,
    policePerCapita: 365,
    justiceSpendingPctGDP: 1.5,
    approach:
      'Punitive in practice, with severe overcrowding (often 2x capacity). ' +
      'Militarized policing. High rates of pretrial detention. ' +
      'Gang control of prisons is a systemic challenge.',
    source: 'World Prison Brief; UNODC; INFOPEN (DEPEN); IBGE',
  },
  {
    country: 'Mexico',
    iso3: 'MEX',
    incarcerationRatePer100K: 168,
    homicideRatePer100K: 25.2,
    recidivismRate: 50,
    policePerCapita: 342,
    justiceSpendingPctGDP: 1.0,
    approach:
      'Mixed punitive. Transition from inquisitorial to adversarial justice system (2016). ' +
      'High impunity rate (~95% of crimes unreported or unsolved). ' +
      'Military involvement in drug enforcement.',
    source: 'World Prison Brief; UNODC; INEGI; ENVIPE',
  },
  {
    country: 'Australia',
    iso3: 'AUS',
    incarcerationRatePer100K: 160,
    homicideRatePer100K: 0.9,
    recidivismRate: 45,
    policePerCapita: 217,
    justiceSpendingPctGDP: 1.2,
    approach:
      'Mixed rehabilitative/punitive. High Indigenous incarceration (disproportionate). ' +
      'Drug courts, diversionary programs. Victoria introduced a supervised injecting room.',
    source: 'World Prison Brief; UNODC; ABS; AIHW',
  },
  {
    country: 'France',
    iso3: 'FRA',
    incarcerationRatePer100K: 105,
    homicideRatePer100K: 1.2,
    recidivismRate: 59,
    policePerCapita: 340,
    justiceSpendingPctGDP: 1.4,
    approach:
      'Mixed. High incarceration relative to Nordic peers, chronic overcrowding. ' +
      'Alternatives to incarceration expanding. Specialized courts for minors.',
    source: 'World Prison Brief; UNODC; Ministère de la Justice',
  },
  {
    country: 'South Korea',
    iso3: 'KOR',
    incarcerationRatePer100K: 93,
    homicideRatePer100K: 0.5,
    recidivismRate: 23,
    policePerCapita: 248,
    justiceSpendingPctGDP: 1.0,
    approach:
      'Deterrence-based with rehabilitation focus. Electronic monitoring widely used. ' +
      'Restorative justice pilot programs. Low crime rate reflects cultural factors.',
    source: 'World Prison Brief; UNODC; Korea Institute of Criminology',
  },
  {
    country: 'New Zealand',
    iso3: 'NZL',
    incarcerationRatePer100K: 165,
    homicideRatePer100K: 1.1,
    recidivismRate: 52,
    policePerCapita: 222,
    justiceSpendingPctGDP: 1.2,
    approach:
      'Increasingly rehabilitative. Halo/Kowhiritanga programs for Māori. ' +
      'Arms Amendment Act 2019 (post-Christchurch). High Māori over-representation in prisons.',
    source: 'World Prison Brief; UNODC; NZ Dept of Corrections',
  },
];

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Rank countries in a dataset by a numeric metric.
 *
 * @param dataset - Array of country objects (any of the comparison datasets)
 * @param metric - Key name of the numeric field to rank by
 * @param ascending - If true, lowest value ranks first (default: true)
 * @returns Sorted array of RankedCountry objects
 */
export function rankCountries<T extends Record<string, any>>(
  dataset: T[],
  metric: string,
  ascending = true,
): RankedCountry[] {
  const entries = dataset
    .filter((d) => typeof d[metric] === 'number' && Number.isFinite(d[metric] as number))
    .map((d) => ({
      country: d['country'] as string,
      iso3: d['iso3'] as string,
      value: d[metric] as number,
    }));

  entries.sort((a, b) => (ascending ? a.value - b.value : b.value - a.value));

  return entries.map((e, i) => ({ rank: i + 1, ...e }));
}

/**
 * Get top N performers for a given metric.
 *
 * @param dataset - The dataset to search
 * @param metric - The numeric metric key
 * @param n - Number of top performers to return
 * @param ascending - If true, lowest values are "best" (default: true — lower mortality = better)
 */
export function getTopPerformers<T extends Record<string, any>>(
  dataset: T[],
  metric: string,
  n: number,
  ascending = true,
): RankedCountry[] {
  return rankCountries(dataset, metric, ascending).slice(0, n);
}

/**
 * Compare two countries across all numeric fields in a dataset.
 *
 * @param country1 - Country name (case-insensitive)
 * @param country2 - Country name (case-insensitive)
 * @param dataset - The dataset array
 * @param datasetName - Label for the dataset (used in the result)
 * @returns ComparisonResult or null if either country is not found
 */
export function getCountryComparison<T extends Record<string, any>>(
  country1: string,
  country2: string,
  dataset: T[],
  datasetName: string,
): ComparisonResult | null {
  const find = (name: string) =>
    dataset.find(
      (d) =>
        (d['country'] as string).toLowerCase() === name.toLowerCase() ||
        (d['iso3'] as string).toLowerCase() === name.toLowerCase(),
    );

  const c1 = find(country1);
  const c2 = find(country2);
  if (!c1 || !c2) return null;

  const differences: Record<string, number> = {};
  for (const key of Object.keys(c1)) {
    if (typeof c1[key] === 'number' && typeof c2[key] === 'number') {
      differences[key] = (c1[key] as number) - (c2[key] as number);
    }
  }

  return {
    dataset: datasetName,
    country1: { ...(c1 as Record<string, any>) },
    country2: { ...(c2 as Record<string, any>) },
    differences,
  };
}

/**
 * Convenience: compare two countries across all four datasets.
 */
export function getFullCountryComparison(
  country1: string,
  country2: string,
): Record<string, ComparisonResult | null> {
  return {
    health: getCountryComparison(country1, country2, HEALTH_SYSTEM_COMPARISON, 'health'),
    drugPolicy: getCountryComparison(country1, country2, DRUG_POLICY_COMPARISON, 'drugPolicy'),
    education: getCountryComparison(country1, country2, EDUCATION_COMPARISON, 'education'),
    criminalJustice: getCountryComparison(
      country1,
      country2,
      CRIMINAL_JUSTICE_COMPARISON,
      'criminalJustice',
    ),
  };
}
