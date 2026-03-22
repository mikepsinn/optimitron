/**
 * Government Report Card data — nation-level performance metrics.
 *
 * Sources cited inline. All figures are most recent available.
 * This is the raw data that makes governments' body counts undeniable.
 */

export interface SourcedValue {
  value: number;
  source: string;
  url?: string;
}

export interface GovernmentMetrics {
  code: string;
  name: string;
  flag: string;

  // === THE BODY COUNT ===
  /** Estimated total deaths caused by government military actions (post-WWII or founding) */
  militaryDeathsCaused: { value: number; period: string; source: string; url?: string };
  /** Estimated civilian deaths caused */
  civilianDeathsCaused: SourcedValue | null;
  /** Number of countries bombed (post-WWII) */
  countriesBombed: { value: number; list: string; source: string; url?: string } | null;
  /** Nuclear warheads currently held */
  nuclearWarheads: SourcedValue;
  /** Active military spending per year (USD) */
  militarySpendingAnnual: SourcedValue;
  /** Military spending as % of GDP */
  militaryPctGDP: SourcedValue;
  /** Arms exports annual (USD) */
  armsExportsAnnual: SourcedValue;

  // === THE DRUG WAR ===
  drugPrisoners: SourcedValue | null;
  drugWarSpendingAnnual: SourcedValue | null;
  drugOverdoseDeaths: SourcedValue | null;
  incarcerationRate: SourcedValue;

  // === CRIME PERFORMANCE ===
  murderClearanceRate: SourcedValue | null;
  homicideRate: SourcedValue;

  // === HEALTH PERFORMANCE ===
  healthSpendingPerCapita: SourcedValue;
  lifeExpectancy: SourcedValue;
  clinicalTrialSpending: SourcedValue | null;

  // === CORPORATE WELFARE ===
  corporateWelfareAnnual: SourcedValue | null;
  fossilFuelSubsidies: SourcedValue | null;
  farmSubsidies: SourcedValue | null;

  // === ECONOMIC ===
  gdpPerCapita: SourcedValue;
  medianIncome: SourcedValue | null;
  debtPctGDP: SourcedValue;
}

/**
 * Major world governments ranked by body count.
 *
 * Data sources:
 * - SIPRI (military spending, arms exports)
 * - FAS/SIPRI (nuclear warheads)
 * - Watson Institute Costs of War (US war deaths)
 * - World Bank (GDP, life expectancy, health spending)
 * - UNODC (homicide rates, incarceration)
 * - CDC (overdose deaths)
 * - BJS/FAMM (drug prisoners)
 * - FBI UCR (clearance rates)
 */
export const GOVERNMENTS: GovernmentMetrics[] = [
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    militaryDeathsCaused: {
      value: 4_500_000,
      period: "1945–2025 (Korea, Vietnam, Iraq, Afghanistan, drone wars, proxy wars)",
      source: "Watson Institute Costs of War, Brown University",
      url: "https://watson.brown.edu/costsofwar/",
    },
    civilianDeathsCaused: { value: 1_000_000, source: "Watson Institute + Airwars", url: "https://airwars.org/" },
    countriesBombed: {
      value: 30,
      list: "Korea, Vietnam, Laos, Cambodia, Libya, Iraq, Afghanistan, Syria, Yemen, Somalia, Pakistan, Sudan, Serbia, Panama, Grenada, Lebanon, Iran, Guatemala, Dominican Republic, Cuba, Nicaragua, El Salvador, Honduras, Chad, Bosnia, Colombia, Philippines, Uganda, Niger, Burkina Faso",
      source: "Congressional Research Service",
      url: "https://sgp.fas.org/crs/natsec/R42738.pdf",
    },
    nuclearWarheads: { value: 5_044, source: "FAS Nuclear Notebook 2024", url: "https://fas.org/initiative/status-world-nuclear-forces/" },
    militarySpendingAnnual: { value: 886_000_000_000, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    militaryPctGDP: { value: 3.4, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    armsExportsAnnual: { value: 23_800_000_000, source: "SIPRI Arms Transfers 2023", url: "https://www.sipri.org/databases/armstransfers" },
    drugPrisoners: { value: 350_000, source: "BJS 2023", url: "https://bjs.ojp.gov/library/publications/prisoners-2022-statistical-tables" },
    drugWarSpendingAnnual: { value: 47_000_000_000, source: "ONDCP FY2024", url: "https://www.whitehouse.gov/wp-content/uploads/2024/03/National-Drug-Control-Budget-FY-2025-Funding-Highlights.pdf" },
    drugOverdoseDeaths: { value: 107_941, source: "CDC WONDER 2023", url: "https://wonder.cdc.gov/" },
    incarcerationRate: { value: 531, source: "World Prison Brief 2024", url: "https://www.prisonstudies.org/" },
    murderClearanceRate: { value: 52, source: "FBI UCR 2023", url: "https://cde.ucr.cjis.gov/" },
    homicideRate: { value: 6.4, source: "CDC WONDER 2023", url: "https://wonder.cdc.gov/" },
    healthSpendingPerCapita: { value: 12_555, source: "CMS 2023", url: "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data" },
    lifeExpectancy: { value: 77.5, source: "CDC NCHS 2023", url: "https://www.cdc.gov/nchs/fastats/life-expectancy.htm" },
    clinicalTrialSpending: { value: 4_500_000_000, source: "NIH", url: "https://reporter.nih.gov/" },
    corporateWelfareAnnual: { value: 92_000_000_000, source: "Cato Institute", url: "https://www.cato.org/corporate-welfare" },
    fossilFuelSubsidies: { value: 20_000_000_000, source: "IMF 2023 explicit subsidies", url: "https://www.imf.org/en/Topics/climate-change/energy-subsidies" },
    farmSubsidies: { value: 38_000_000_000, source: "USDA ERS 2023", url: "https://www.ers.usda.gov/topics/farm-economy/farm-commodity-policy/" },
    gdpPerCapita: { value: 80_035, source: "World Bank 2023" },
    medianIncome: { value: 74_580, source: "Census Bureau 2023" },
    debtPctGDP: { value: 123, source: "CBO 2024" },
  },
  {
    code: "RU",
    name: "Russia",
    flag: "🇷🇺",
    militaryDeathsCaused: {
      value: 1_500_000,
      period: "1945–2025 (Afghanistan, Chechnya, Syria, Ukraine, proxy wars)",
      source: "Various: IISS, UN, conflict databases",
    },
    civilianDeathsCaused: { value: 500_000, source: "Various: UN, Airwars, human rights organizations" },
    countriesBombed: {
      value: 12,
      list: "Afghanistan, Chechnya (internal), Georgia, Syria, Ukraine, Hungary (1956), Czechoslovakia (1968), Angola, Mozambique, Ethiopia, Libya, Central African Republic",
      source: "IISS, conflict databases",
    },
    nuclearWarheads: { value: 5_580, source: "FAS Nuclear Notebook 2024" },
    militarySpendingAnnual: { value: 109_000_000_000, source: "SIPRI 2024 (estimated)" },
    militaryPctGDP: { value: 5.9, source: "SIPRI 2024" },
    armsExportsAnnual: { value: 5_200_000_000, source: "SIPRI Arms Transfers 2023" },
    drugPrisoners: null,
    drugWarSpendingAnnual: null,
    drugOverdoseDeaths: null,
    incarcerationRate: { value: 300, source: "World Prison Brief 2024" },
    murderClearanceRate: null,
    homicideRate: { value: 7.3, source: "UNODC 2022" },
    healthSpendingPerCapita: { value: 1_775, source: "WHO Global Health Expenditure 2022" },
    lifeExpectancy: { value: 73.4, source: "World Bank 2023" },
    clinicalTrialSpending: null,
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: { value: 39_000_000_000, source: "IMF 2023 — explicit subsidies" },
    farmSubsidies: null,
    gdpPerCapita: { value: 36_485, source: "World Bank PPP 2023" },
    medianIncome: null,
    debtPctGDP: { value: 15, source: "IMF 2024" },
  },
  {
    code: "CN",
    name: "China",
    flag: "🇨🇳",
    militaryDeathsCaused: {
      value: 2_000_000,
      period: "1949–2025 (Korean War, Tibet, border wars, Tiananmen, Uyghur detentions)",
      source: "Various: academic estimates, human rights organizations",
    },
    civilianDeathsCaused: { value: 1_000_000, source: "Various academic estimates — Korean War + internal" },
    countriesBombed: { value: 3, list: "Korea, Vietnam (border war 1979), India (border skirmishes)", source: "Conflict databases" },
    nuclearWarheads: { value: 500, source: "FAS Nuclear Notebook 2024" },
    militarySpendingAnnual: { value: 296_000_000_000, source: "SIPRI 2024 (estimated)" },
    militaryPctGDP: { value: 1.7, source: "SIPRI 2024" },
    armsExportsAnnual: { value: 2_300_000_000, source: "SIPRI Arms Transfers 2023" },
    drugPrisoners: null,
    drugWarSpendingAnnual: null,
    drugOverdoseDeaths: null,
    incarcerationRate: { value: 119, source: "World Prison Brief 2024" },
    murderClearanceRate: null,
    homicideRate: { value: 0.5, source: "UNODC 2022" },
    healthSpendingPerCapita: { value: 937, source: "WHO Global Health Expenditure 2022" },
    lifeExpectancy: { value: 78.6, source: "World Bank 2023" },
    clinicalTrialSpending: null,
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: { value: 16_000_000_000, source: "IMF 2023 — explicit subsidies (much higher including externalities)" },
    farmSubsidies: null,
    gdpPerCapita: { value: 23_382, source: "World Bank PPP 2023" },
    medianIncome: null,
    debtPctGDP: { value: 83, source: "IMF 2024" },
  },
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    militaryDeathsCaused: {
      value: 500_000,
      period: "1945–2025 (Malaya, Kenya, Iraq, Afghanistan, Libya, colonial withdrawal conflicts)",
      source: "Various: academic estimates, colonial archives",
    },
    civilianDeathsCaused: { value: 100_000, source: "Various: colonial conflicts + Iraq/Afghanistan civilian estimates" },
    countriesBombed: { value: 8, list: "Malaya, Kenya, Suez/Egypt, Falklands, Iraq, Afghanistan, Libya, Syria", source: "UK MoD, conflict databases" },
    nuclearWarheads: { value: 225, source: "FAS Nuclear Notebook 2024" },
    militarySpendingAnnual: { value: 75_000_000_000, source: "SIPRI 2024" },
    militaryPctGDP: { value: 2.3, source: "SIPRI 2024" },
    armsExportsAnnual: { value: 4_500_000_000, source: "SIPRI Arms Transfers 2023" },
    drugPrisoners: { value: 13_000, source: "UK MoJ 2023 — drug offences in custody" },
    drugWarSpendingAnnual: { value: 3_000_000_000, source: "UK Home Office estimate" },
    drugOverdoseDeaths: { value: 4_907, source: "ONS 2023" },
    incarcerationRate: { value: 134, source: "World Prison Brief 2024" },
    murderClearanceRate: { value: 88, source: "Home Office 2023" },
    homicideRate: { value: 1.0, source: "ONS 2023" },
    healthSpendingPerCapita: { value: 5_138, source: "OECD Health Statistics 2023" },
    lifeExpectancy: { value: 81.8, source: "World Bank 2023" },
    clinicalTrialSpending: null,
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: { value: 12_000_000_000, source: "UK Treasury — £10B (~$12B)" },
    farmSubsidies: { value: 4_300_000_000, source: "DEFRA — £3.5B (~$4.3B)" },
    gdpPerCapita: { value: 55_800, source: "World Bank PPP 2023" },
    medianIncome: { value: 39_000, source: "ONS 2023" },
    debtPctGDP: { value: 101, source: "IMF 2024" },
  },
  {
    code: "IL",
    name: "Israel",
    flag: "🇮🇱",
    militaryDeathsCaused: {
      value: 200_000,
      period: "1948–2025 (wars, occupations, Gaza operations, Lebanon)",
      source: "Various: B'Tselem, UN OCHA, PCBS",
    },
    civilianDeathsCaused: { value: 50_000, source: "B'Tselem, UN OCHA — Gaza/West Bank/Lebanon" },
    countriesBombed: { value: 7, list: "Egypt, Syria, Lebanon, Iraq (Osirak), Sudan, Gaza, Iran (2024-25)", source: "IISS, conflict databases" },
    nuclearWarheads: { value: 90, source: "FAS Nuclear Notebook 2024 (estimated, undeclared)" },
    militarySpendingAnnual: { value: 27_500_000_000, source: "SIPRI 2024" },
    militaryPctGDP: { value: 5.3, source: "SIPRI 2024" },
    armsExportsAnnual: { value: 3_100_000_000, source: "SIPRI Arms Transfers 2023" },
    drugPrisoners: null,
    drugWarSpendingAnnual: null,
    drugOverdoseDeaths: null,
    incarcerationRate: { value: 159, source: "World Prison Brief 2024" },
    murderClearanceRate: null,
    homicideRate: { value: 1.5, source: "UNODC 2022" },
    healthSpendingPerCapita: { value: 3_266, source: "OECD 2023" },
    lifeExpectancy: { value: 83.5, source: "World Bank 2023" },
    clinicalTrialSpending: null,
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: null,
    farmSubsidies: null,
    gdpPerCapita: { value: 54_930, source: "World Bank PPP 2023" },
    medianIncome: null,
    debtPctGDP: { value: 62, source: "IMF 2024" },
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    flag: "🇸🇦",
    militaryDeathsCaused: {
      value: 377_000,
      period: "2015–2025 (Yemen war — 150K+ direct, 227K+ from famine/disease caused by blockade)",
      source: "UN OCHA, ACLED, Yemen Data Project",
    },
    civilianDeathsCaused: { value: 227_000, source: "UN — Yemen blockade famine/disease deaths" },
    countriesBombed: { value: 2, list: "Yemen, Bahrain (intervention)", source: "ACLED, conflict databases" },
    nuclearWarheads: { value: 0, source: "FAS" },
    militarySpendingAnnual: { value: 75_800_000_000, source: "SIPRI 2024" },
    militaryPctGDP: { value: 7.1, source: "SIPRI 2024" },
    armsExportsAnnual: { value: 100_000_000, source: "SIPRI Arms Transfers 2023" },
    drugPrisoners: null,
    drugWarSpendingAnnual: null,
    drugOverdoseDeaths: null,
    incarcerationRate: { value: 197, source: "World Prison Brief 2024" },
    murderClearanceRate: null,
    homicideRate: { value: 1.5, source: "UNODC 2022" },
    healthSpendingPerCapita: { value: 2_520, source: "WHO 2022" },
    lifeExpectancy: { value: 77.6, source: "World Bank 2023" },
    clinicalTrialSpending: null,
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: { value: 27_000_000_000, source: "IMF 2023 — explicit subsidies" },
    farmSubsidies: null,
    gdpPerCapita: { value: 56_875, source: "World Bank PPP 2023" },
    medianIncome: null,
    debtPctGDP: { value: 26, source: "IMF 2024" },
  },
  // Contrast: a government that doesn't kill people
  {
    code: "SG",
    name: "Singapore",
    flag: "🇸🇬",
    militaryDeathsCaused: {
      value: 0,
      period: "1965–2025",
      source: "No military conflicts post-independence",
    },
    civilianDeathsCaused: { value: 0, source: "No military conflicts post-independence" },
    countriesBombed: { value: 0, list: "None", source: "No military conflicts post-independence" },
    nuclearWarheads: { value: 0, source: "FAS" },
    militarySpendingAnnual: { value: 11_700_000_000, source: "SIPRI 2024" },
    militaryPctGDP: { value: 3.0, source: "SIPRI 2024" },
    armsExportsAnnual: { value: 200_000_000, source: "SIPRI Arms Transfers 2023" },
    drugPrisoners: null,
    drugWarSpendingAnnual: null,
    drugOverdoseDeaths: null,
    incarcerationRate: { value: 178, source: "World Prison Brief 2024" },
    murderClearanceRate: { value: 96, source: "Singapore Police Force 2023" },
    homicideRate: { value: 0.2, source: "UNODC 2022" },
    healthSpendingPerCapita: { value: 3_013, source: "WHO 2022" },
    lifeExpectancy: { value: 84.1, source: "World Bank 2023" },
    clinicalTrialSpending: null,
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: null,
    farmSubsidies: null,
    gdpPerCapita: { value: 133_737, source: "World Bank PPP 2023" },
    medianIncome: { value: 54_000, source: "MOM 2023" },
    debtPctGDP: { value: 168, source: "IMF 2024 (mostly internal/reserves)" },
  },
];

/** Get a government by ISO code */
export function getGovernment(code: string): GovernmentMetrics | undefined {
  return GOVERNMENTS.find((g) => g.code === code);
}

/** Get all governments sorted by body count (descending) */
export function getGovernmentsByBodyCount(): GovernmentMetrics[] {
  return [...GOVERNMENTS].sort(
    (a, b) => b.militaryDeathsCaused.value - a.militaryDeathsCaused.value,
  );
}
