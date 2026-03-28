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
  /** WHO Healthy Life Expectancy at birth (HALE) — years lived in full health */
  hale: SourcedValue | null;
  /** Total government medical research budget (includes basic science, overhead, admin — NOT just trials) */
  govMedicalResearchSpending: SourcedValue | null;
  /** Estimated government spending on actual interventional clinical trials (~6.7% of medical research globally) */
  clinicalTrialSpending: SourcedValue | null;

  // === CORPORATE WELFARE ===
  corporateWelfareAnnual: SourcedValue | null;
  fossilFuelSubsidies: SourcedValue | null;
  farmSubsidies: SourcedValue | null;

  // === ADDITIONAL MILITARY ===
  armsImportsAnnual: SourcedValue | null;
  militaryAidReceived: SourcedValue | null;
  droneStrikes: SourcedValue | null;
  refugeesCreated: SourcedValue | null;
  sanctionsDeathsAttributed: SourcedValue | null;

  // === DOMESTIC VIOLENCE ===
  policeKillingsAnnual: SourcedValue | null;
  privatePrisonPopulation: SourcedValue | null;
  defenseLobbyingAnnual: SourcedValue | null;

  // === EDUCATION VS MILITARY ===
  educationSpendingPctGDP: SourcedValue | null;
  militaryToEducationRatio: SourcedValue | null;

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
      url: "https://fas.org/sgp/crs/natsec/",
    },
    nuclearWarheads: { value: 5_044, source: "FAS Nuclear Notebook 2024", url: "https://fas.org/initiative/status-world-nuclear-forces/" },
    militarySpendingAnnual: { value: 886_000_000_000, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    militaryPctGDP: { value: 3.4, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    armsExportsAnnual: { value: 23_800_000_000, source: "SIPRI Arms Transfers 2023", url: "https://www.sipri.org/databases/armstransfers" },
    drugPrisoners: { value: 350_000, source: "BJS 2023", url: "https://bjs.ojp.gov/library/publications/prisoners-2022-statistical-tables" },
    drugWarSpendingAnnual: { value: 47_000_000_000, source: "ONDCP FY2024", url: "https://www.whitehouse.gov/ondcp/" },
    drugOverdoseDeaths: { value: 107_941, source: "CDC WONDER 2023", url: "https://wonder.cdc.gov/" },
    incarcerationRate: { value: 531, source: "World Prison Brief 2024", url: "https://www.prisonstudies.org/" },
    murderClearanceRate: { value: 52, source: "FBI UCR 2023", url: "https://cde.ucr.cjis.gov/" },
    homicideRate: { value: 6.4, source: "CDC WONDER 2023", url: "https://wonder.cdc.gov/" },
    healthSpendingPerCapita: { value: 12_555, source: "CMS 2023", url: "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data" },
    lifeExpectancy: { value: 77.5, source: "CDC NCHS 2023", url: "https://www.cdc.gov/nchs/fastats/life-expectancy.htm" },
    hale: { value: 66.1, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 47_100_000_000, source: "NIH total budget FY2024; 31% admin costs, 40-60% indirect overhead", url: "https://www.nih.gov/about-nih/organization/budget" },
    clinicalTrialSpending: { value: 810_000_000, source: "JAMA Health Forum: NIH funded $8.1B in phased clinical trials for 387 approved drugs 2010-2019 (~$810M/yr). The $5.6B GAO figure includes related activities, not just trials.", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10349341/" },
    corporateWelfareAnnual: { value: 92_000_000_000, source: "Cato Institute", url: "https://www.cato.org/corporate-welfare" },
    fossilFuelSubsidies: { value: 20_000_000_000, source: "IMF 2023 explicit subsidies", url: "https://www.imf.org/en/Topics/climate-change/energy-subsidies" },
    farmSubsidies: { value: 38_000_000_000, source: "USDA ERS 2023", url: "https://www.ers.usda.gov/topics/farm-economy/farm-commodity-policy/" },
    armsImportsAnnual: null,
    militaryAidReceived: null,
    droneStrikes: { value: 14_000, source: "Airwars + Bureau of Investigative Journalism", url: "https://airwars.org/" },
    refugeesCreated: { value: 38_000_000, source: "Watson Institute — displaced persons from post-9/11 wars", url: "https://watson.brown.edu/costsofwar/costs/human/refugees" },
    sanctionsDeathsAttributed: { value: 500_000, source: "UN estimate — Iraq sanctions child deaths 1990-2003" },
    policeKillingsAnnual: { value: 1_096, source: "Mapping Police Violence 2023", url: "https://mappingpoliceviolence.us/" },
    privatePrisonPopulation: { value: 115_000, source: "The Sentencing Project 2023", url: "https://www.sentencingproject.org/reports/private-prisons-in-the-united-states/" },
    defenseLobbyingAnnual: { value: 150_000_000, source: "OpenSecrets 2023" },
    educationSpendingPctGDP: { value: 4.9, source: "World Bank 2022", url: "https://data.worldbank.org/indicator/SE.XPD.TOTL.GD.ZS" },
    militaryToEducationRatio: { value: 0.69, source: "Calculated: 3.4% military / 4.9% education" },
    gdpPerCapita: { value: 80_035, source: "World Bank 2023" },
    medianIncome: null, // hydrated from canonical median-income-series
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
    hale: { value: 64.2, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 800_000_000, source: "Estimated from civil science budget; medical research portion", url: "https://www.science.org/content/article/russia-set-cut-research-spending-25" },
    clinicalTrialSpending: { value: 54_000_000, source: "Estimated: ~6.7% of $800M medical research (global avg); 2.9B RUB ($32M) for trial infrastructure", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: { value: 39_000_000_000, source: "IMF 2023 — explicit subsidies" },
    farmSubsidies: null,
    armsImportsAnnual: null,
    militaryAidReceived: null,
    droneStrikes: null,
    refugeesCreated: null,
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: null,
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: null,
    militaryToEducationRatio: null,
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
    hale: { value: 68.5, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 15_000_000_000, source: "~$15B medical research; spends 97x more on domestic security than clinical research", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    clinicalTrialSpending: { value: 1_000_000_000, source: "Estimated: ~6.7% of $15B medical research budget (global avg for clinical trials portion)", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: { value: 16_000_000_000, source: "IMF 2023 — explicit subsidies (much higher including externalities)" },
    farmSubsidies: null,
    armsImportsAnnual: null,
    militaryAidReceived: null,
    droneStrikes: null,
    refugeesCreated: null,
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: null,
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: null,
    militaryToEducationRatio: null,
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
    hale: { value: 70.1, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 2_700_000_000, source: "NIHR GBP 1.3B (2022-23) + MRC ~GBP 0.8B health research", url: "https://www.nihr.ac.uk/news/nihr-spends-ps13bn-delivering-world-leading-research-shows-2022-23-annual-report" },
    clinicalTrialSpending: { value: 181_000_000, source: "Estimated: ~6.7% of $2.7B total NIHR+MRC medical research budget", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: { value: 12_000_000_000, source: "UK Treasury — £10B (~$12B)" },
    farmSubsidies: { value: 4_300_000_000, source: "DEFRA — £3.5B (~$4.3B)" },
    armsImportsAnnual: null,
    militaryAidReceived: null,
    droneStrikes: null,
    refugeesCreated: null,
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: null,
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: null,
    militaryToEducationRatio: null,
    gdpPerCapita: { value: 55_800, source: "World Bank PPP 2023" },
    medianIncome: null, // hydrated from canonical median-income-series
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
    hale: { value: 73.0, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 300_000_000, source: "Estimated: IIA ~500M NIS ($135M) life sciences grants + CSO-MOH + university health R&D", url: "https://innovationisrael.org.il/en/press_release/israel-life-sciences-and-health-tech-industry-report-for-2024-25/" },
    clinicalTrialSpending: { value: 20_000_000, source: "Estimated: ~6.7% of $300M gov medical research; most R&D is private sector", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: null,
    farmSubsidies: null,
    armsImportsAnnual: null,
    militaryAidReceived: { value: 3_800_000_000, source: "US State Dept MOU 2016", url: "https://www.state.gov/u-s-security-cooperation-with-israel/" },
    droneStrikes: null,
    refugeesCreated: { value: 2_000_000, source: "UNRWA + UNHCR — Palestinian refugees from all conflicts" },
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: null,
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: null,
    militaryToEducationRatio: null,
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
    hale: { value: 66.3, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 200_000_000, source: "Estimated: SNIH established 2023 under Vision 2030; nascent program", url: "https://snih.gov.sa/en/fundings/funding-details/clinical-trials/" },
    clinicalTrialSpending: { value: 13_000_000, source: "Estimated: ~6.7% of $200M; SNIH per-project grants up to 4M SAR ($1.07M)", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: { value: 27_000_000_000, source: "IMF 2023 — explicit subsidies" },
    farmSubsidies: null,
    armsImportsAnnual: { value: 8_500_000_000, source: "SIPRI Arms Transfers 2023 — largest arms importer globally", url: "https://www.sipri.org/databases/armstransfers" },
    militaryAidReceived: null,
    droneStrikes: null,
    refugeesCreated: { value: 4_500_000, source: "UNHCR — Yemen displaced persons", url: "https://data.unhcr.org/en/country/yem" },
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: null,
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: null,
    militaryToEducationRatio: null,
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
    hale: { value: 73.9, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 850_000_000, source: "Estimated: ~20-25% of S$3.7B/yr public R&D (RIE2025: S$25B over 5 years)", url: "https://www.asianscientist.com/2020/12/topnews/rie2025-singapore-research-budget/" },
    clinicalTrialSpending: { value: 57_000_000, source: "Estimated: ~6.7% of $850M gov medical research; NMRC clinical investigation centers", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: null,
    farmSubsidies: null,
    armsImportsAnnual: null,
    militaryAidReceived: null,
    droneStrikes: null,
    refugeesCreated: null,
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: null,
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: null,
    militaryToEducationRatio: null,
    gdpPerCapita: { value: 133_737, source: "World Bank PPP 2023" },
    medianIncome: null, // hydrated from canonical median-income-series
    debtPctGDP: { value: 168, source: "IMF 2024 (mostly internal/reserves)" },
  },
  {
    code: "FR",
    name: "France",
    flag: "\u{1F1EB}\u{1F1F7}",
    militaryDeathsCaused: {
      value: 1_500_000,
      period: "1945–2025 (Algeria 1M+, Indochina, Rwanda complicity, Mali, CAR, Libya)",
      source: "Various academic estimates",
      url: "https://www.monde-diplomatique.fr/",
    },
    civilianDeathsCaused: { value: 800_000, source: "Algeria war civilian estimates" },
    countriesBombed: {
      value: 12,
      list: "Indochina/Vietnam, Algeria, Suez/Egypt, Cameroon, Mali, Libya, Syria, Central African Republic, Ivory Coast, Chad, Comoros, Rwanda",
      source: "French MoD, conflict databases",
    },
    nuclearWarheads: { value: 290, source: "FAS Nuclear Notebook 2024", url: "https://fas.org/initiative/status-world-nuclear-forces/" },
    militarySpendingAnnual: { value: 56_000_000_000, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    militaryPctGDP: { value: 2.1, source: "SIPRI 2024" },
    armsExportsAnnual: { value: 4_700_000_000, source: "SIPRI Arms Transfers 2023", url: "https://www.sipri.org/databases/armstransfers" },
    drugPrisoners: null,
    drugWarSpendingAnnual: null,
    drugOverdoseDeaths: null,
    incarcerationRate: { value: 93, source: "World Prison Brief 2024", url: "https://www.prisonstudies.org/" },
    murderClearanceRate: null,
    homicideRate: { value: 1.3, source: "UNODC 2022" },
    healthSpendingPerCapita: { value: 5_468, source: "OECD 2023" },
    lifeExpectancy: { value: 82.3, source: "World Bank 2023" },
    hale: { value: 72.1, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 1_400_000_000, source: "INSERM budget EUR 1.225B (2025) + ANR health portion", url: "https://www.inserm.fr/en/about-us/inserm-at-a-glance/" },
    clinicalTrialSpending: { value: 94_000_000, source: "Estimated: ~6.7% of $1.4B INSERM+ANR total medical research", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: null,
    farmSubsidies: null,
    armsImportsAnnual: null,
    militaryAidReceived: null,
    droneStrikes: null,
    refugeesCreated: null,
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: null,
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: { value: 5.2, source: "World Bank 2022" },
    militaryToEducationRatio: null,
    gdpPerCapita: { value: 55_493, source: "World Bank PPP 2023" },
    medianIncome: null,
    debtPctGDP: { value: 112, source: "IMF 2024" },
  },
  {
    code: "TR",
    name: "Turkey",
    flag: "\u{1F1F9}\u{1F1F7}",
    militaryDeathsCaused: {
      value: 100_000,
      period: "1974–2025 (Cyprus invasion, Kurdish conflict, Syria incursion)",
      source: "IISS, conflict databases",
    },
    civilianDeathsCaused: { value: 40_000, source: "Various — Kurdish conflict civilian estimates" },
    countriesBombed: {
      value: 4,
      list: "Cyprus, Iraq (Kurdish regions), Syria, Libya",
      source: "Conflict databases",
    },
    nuclearWarheads: { value: 0, source: "FAS" },
    militarySpendingAnnual: { value: 16_400_000_000, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    militaryPctGDP: { value: 1.6, source: "SIPRI 2024" },
    armsExportsAnnual: { value: 4_400_000_000, source: "SIPRI 2023", url: "https://www.sipri.org/databases/armstransfers" },
    drugPrisoners: null,
    drugWarSpendingAnnual: null,
    drugOverdoseDeaths: null,
    incarcerationRate: { value: 380, source: "World Prison Brief 2024", url: "https://www.prisonstudies.org/" },
    murderClearanceRate: null,
    homicideRate: { value: 2.6, source: "UNODC 2022" },
    healthSpendingPerCapita: { value: 1_339, source: "WHO 2022" },
    lifeExpectancy: { value: 76.0, source: "World Bank 2023" },
    hale: { value: 66.5, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 750_000_000, source: "Estimated: WHO health GERD 0.17% of GDP ($1T); gov portion ~50%", url: "https://www.who.int/observatories/global-observatory-on-health-research-and-development/benchmarking/benchmarking-gross-domestic-r-d-expenditure-on-health-and-medical-sciences-across-countries-against-global-targets" },
    clinicalTrialSpending: { value: 50_000_000, source: "Estimated: ~6.7% of $750M medical research; $139M in sponsored trials includes industry", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: null,
    farmSubsidies: null,
    armsImportsAnnual: null,
    militaryAidReceived: null,
    droneStrikes: null,
    refugeesCreated: { value: 500_000, source: "UNHCR — Afrin/Northeast Syria displacement" },
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: null,
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: null,
    militaryToEducationRatio: null,
    gdpPerCapita: { value: 41_887, source: "World Bank PPP 2023" },
    medianIncome: null,
    debtPctGDP: { value: 30, source: "IMF 2024" },
  },
  {
    code: "IN",
    name: "India",
    flag: "\u{1F1EE}\u{1F1F3}",
    militaryDeathsCaused: {
      value: 100_000,
      period: "1947–2025 (Kashmir, Hyderabad, Goa, border wars, Naxalite conflict)",
      source: "Various academic estimates",
    },
    civilianDeathsCaused: { value: 70_000, source: "Various — Kashmir + internal conflict civilian estimates" },
    countriesBombed: {
      value: 2,
      list: "Pakistan, China (border clashes)",
      source: "Conflict databases",
    },
    nuclearWarheads: { value: 172, source: "FAS Nuclear Notebook 2024", url: "https://fas.org/initiative/status-world-nuclear-forces/" },
    militarySpendingAnnual: { value: 83_600_000_000, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    militaryPctGDP: { value: 2.4, source: "SIPRI 2024" },
    armsExportsAnnual: { value: 300_000_000, source: "SIPRI 2023" },
    drugPrisoners: null,
    drugWarSpendingAnnual: null,
    drugOverdoseDeaths: null,
    incarcerationRate: { value: 51, source: "World Prison Brief 2024", url: "https://www.prisonstudies.org/" },
    murderClearanceRate: null,
    homicideRate: { value: 2.9, source: "UNODC 2022" },
    healthSpendingPerCapita: { value: 345, source: "WHO 2022" },
    lifeExpectancy: { value: 72.0, source: "World Bank 2023" },
    hale: { value: 60.3, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 3_000_000_000, source: "$3B medical research; DHR budget Rs 3,900.69 crore ($460M) is subset; $2.14/capita", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    clinicalTrialSpending: { value: 200_000_000, source: "Estimated: ~6.7% of $3B medical research; 1,000 clinical trial sites planned", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: null,
    farmSubsidies: null,
    armsImportsAnnual: { value: 5_500_000_000, source: "SIPRI 2023 — 2nd largest arms importer", url: "https://www.sipri.org/databases/armstransfers" },
    militaryAidReceived: null,
    droneStrikes: null,
    refugeesCreated: null,
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: null,
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: { value: 4.6, source: "World Bank 2022" },
    militaryToEducationRatio: null,
    gdpPerCapita: { value: 9_183, source: "World Bank PPP 2023" },
    medianIncome: null,
    debtPctGDP: { value: 83, source: "IMF 2024" },
  },
  {
    code: "PK",
    name: "Pakistan",
    flag: "\u{1F1F5}\u{1F1F0}",
    militaryDeathsCaused: {
      value: 3_500_000,
      period: "1947–2025 (East Pakistan/Bangladesh genocide 1971: 300K-3M, wars with India, tribal conflicts, proxy support)",
      source: "Various — Bangladesh genocide estimates vary widely",
    },
    civilianDeathsCaused: { value: 3_000_000, source: "Bangladesh genocide civilian estimates (high end)" },
    countriesBombed: {
      value: 2,
      list: "India (wars), Afghanistan (cross-border operations)",
      source: "Conflict databases",
    },
    nuclearWarheads: { value: 170, source: "FAS Nuclear Notebook 2024", url: "https://fas.org/initiative/status-world-nuclear-forces/" },
    militarySpendingAnnual: { value: 10_300_000_000, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    militaryPctGDP: { value: 3.7, source: "SIPRI 2024" },
    armsExportsAnnual: { value: 100_000_000, source: "SIPRI 2023" },
    drugPrisoners: null,
    drugWarSpendingAnnual: null,
    drugOverdoseDeaths: null,
    incarcerationRate: { value: 36, source: "World Prison Brief 2024", url: "https://www.prisonstudies.org/" },
    murderClearanceRate: null,
    homicideRate: { value: 3.9, source: "UNODC 2022" },
    healthSpendingPerCapita: { value: 161, source: "WHO 2022" },
    lifeExpectancy: { value: 66.5, source: "World Bank 2023" },
    hale: { value: 57.4, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 3_000_000, source: "Mean annual health research spend Rs 252M ($1.68M) FY2013-18; WHO EMRO", url: "https://www.emro.who.int/emhj-volume-27-2021/volume-27-issue-9/health-research-funding-and-its-output-in-pakistan.html" },
    clinicalTrialSpending: { value: 200_000, source: "Estimated: ~6.7% of $3M medical research; 0.000003% of GDP", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: null,
    farmSubsidies: null,
    armsImportsAnnual: { value: 1_300_000_000, source: "SIPRI 2023", url: "https://www.sipri.org/databases/armstransfers" },
    militaryAidReceived: null,
    droneStrikes: null,
    refugeesCreated: null,
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: null,
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: null,
    militaryToEducationRatio: null,
    gdpPerCapita: { value: 6_470, source: "World Bank PPP 2023" },
    medianIncome: null,
    debtPctGDP: { value: 75, source: "IMF 2024" },
  },
  {
    code: "ET",
    name: "Ethiopia",
    flag: "\u{1F1EA}\u{1F1F9}",
    militaryDeathsCaused: {
      value: 600_000,
      period: "1974–2025 (Red Terror, Eritrea war, Tigray war 2020-2022)",
      source: "Various: ACLED, UN, academic estimates",
    },
    civilianDeathsCaused: { value: 500_000, source: "Tigray war civilian estimates: 300K-600K per Ghent University study" },
    countriesBombed: {
      value: 2,
      list: "Eritrea, Somalia (intervention)",
      source: "Conflict databases",
    },
    nuclearWarheads: { value: 0, source: "FAS" },
    militarySpendingAnnual: { value: 1_000_000_000, source: "SIPRI 2024 (estimated)", url: "https://www.sipri.org/databases/milex" },
    militaryPctGDP: { value: 0.8, source: "SIPRI 2024" },
    armsExportsAnnual: { value: 0, source: "SIPRI 2023 — no significant arms exports" },
    drugPrisoners: null,
    drugWarSpendingAnnual: null,
    drugOverdoseDeaths: null,
    incarcerationRate: { value: 108, source: "World Prison Brief 2024", url: "https://www.prisonstudies.org/" },
    murderClearanceRate: null,
    homicideRate: { value: 7.6, source: "UNODC 2022" },
    healthSpendingPerCapita: { value: 37, source: "WHO 2022" },
    lifeExpectancy: { value: 66.6, source: "World Bank 2023" },
    hale: { value: 56.0, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 47_000_000, source: "WHO: US$46.61M health R&D (0.06% of GDP); one of three low-income countries meeting target", url: "https://www.who.int/observatories/global-observatory-on-health-research-and-development/benchmarking/benchmarking-gross-domestic-r-d-expenditure-on-health-and-medical-sciences-across-countries-against-global-targets" },
    clinicalTrialSpending: { value: 3_000_000, source: "Estimated: ~6.7% of $47M medical research budget", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: null,
    farmSubsidies: null,
    armsImportsAnnual: null,
    militaryAidReceived: null,
    droneStrikes: null,
    refugeesCreated: { value: 4_200_000, source: "UNHCR — Tigray + Amhara displaced", url: "https://data.unhcr.org/en/country/eth" },
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: null,
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: null,
    militaryToEducationRatio: null,
    gdpPerCapita: { value: 3_076, source: "World Bank PPP 2023" },
    medianIncome: null,
    debtPctGDP: { value: 40, source: "IMF 2024" },
  },
  {
    code: "IR",
    name: "Iran",
    flag: "\u{1F1EE}\u{1F1F7}",
    militaryDeathsCaused: {
      value: 500_000,
      period: "1979–2025 (Iran-Iraq war defense + proxy wars via Hezbollah, Houthis, Iraqi militias)",
      source: "Various — IISS, conflict databases",
    },
    civilianDeathsCaused: { value: 100_000, source: "Proxy war civilian estimates" },
    countriesBombed: {
      value: 3,
      list: "Iraq (Iran-Iraq war), Israel (2024 missile strikes), Kurdish regions",
      source: "IISS",
    },
    nuclearWarheads: { value: 0, source: "FAS (enrichment program but no confirmed weapons)" },
    militarySpendingAnnual: { value: 10_300_000_000, source: "SIPRI 2024 (estimated)", url: "https://www.sipri.org/databases/milex" },
    militaryPctGDP: { value: 2.5, source: "SIPRI 2024" },
    armsExportsAnnual: { value: 100_000_000, source: "SIPRI 2023 — mostly small arms and drones" },
    drugPrisoners: null,
    drugWarSpendingAnnual: null,
    drugOverdoseDeaths: null,
    incarcerationRate: { value: 221, source: "World Prison Brief 2024", url: "https://www.prisonstudies.org/" },
    murderClearanceRate: null,
    homicideRate: { value: 2.5, source: "UNODC 2022" },
    healthSpendingPerCapita: { value: 1_563, source: "WHO 2022" },
    lifeExpectancy: { value: 74.5, source: "World Bank 2023" },
    hale: { value: 65.4, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 150_000_000, source: "Estimated: 5-8% of ~$3.5B total GERD (0.79% of GDP); health research not a priority", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6204006/" },
    clinicalTrialSpending: { value: 10_000_000, source: "Estimated: ~6.7% of $150M medical research; investing in health research has not been a priority", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: null,
    farmSubsidies: null,
    armsImportsAnnual: null,
    militaryAidReceived: null,
    droneStrikes: null,
    refugeesCreated: null,
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: null,
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: null,
    militaryToEducationRatio: null,
    gdpPerCapita: { value: 16_893, source: "World Bank PPP 2023" },
    medianIncome: null,
    debtPctGDP: { value: 32, source: "IMF 2024" },
  },
  {
    code: "JP",
    name: "Japan",
    flag: "🇯🇵",
    militaryDeathsCaused: {
      value: 0,
      period: "1945–2025 (Article 9 pacifist constitution)",
      source: "No military conflicts post-WWII under pacifist constitution",
    },
    civilianDeathsCaused: null,
    countriesBombed: null,
    nuclearWarheads: { value: 0, source: "FAS" },
    militarySpendingAnnual: { value: 55_000_000_000, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    militaryPctGDP: { value: 1.2, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    armsExportsAnnual: { value: 3_300_000_000, source: "SIPRI Arms Transfers 2023", url: "https://www.sipri.org/databases/armstransfers" },
    drugPrisoners: null,
    drugWarSpendingAnnual: null,
    drugOverdoseDeaths: null,
    incarcerationRate: { value: 38, source: "World Prison Brief 2024", url: "https://www.prisonstudies.org/" },
    murderClearanceRate: { value: 98, source: "NPA Japan 2023" },
    homicideRate: { value: 0.2, source: "UNODC 2023" },
    healthSpendingPerCapita: { value: 4_691, source: "OECD 2023" },
    lifeExpectancy: { value: 84.5, source: "WHO 2023" },
    hale: { value: 74.1, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 5_000_000_000, source: "~$5B medical research; AMED + MHLW + university grants", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    clinicalTrialSpending: { value: 335_000_000, source: "Estimated: ~6.7% of $5B medical research budget", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: { value: 21_000_000_000, source: "IMF 2023", url: "https://www.imf.org/en/Topics/climate-change/energy-subsidies" },
    farmSubsidies: null,
    armsImportsAnnual: null,
    militaryAidReceived: null,
    droneStrikes: null,
    refugeesCreated: null,
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: { value: 2, source: "NPA Japan 2023" },
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: { value: 3.4, source: "OECD 2022" },
    militaryToEducationRatio: { value: 0.35, source: "Calculated: 1.2% military / 3.4% education" },
    gdpPerCapita: { value: 33_950, source: "World Bank 2023" },
    medianIncome: null, // hydrated from canonical median-income-series
    debtPctGDP: { value: 264, source: "IMF 2024" },
  },
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    militaryDeathsCaused: {
      value: 0,
      period: "1945–2025 (post-war reconstruction, NATO peacekeeping)",
      source: "No significant military deaths caused post-WWII",
    },
    civilianDeathsCaused: null,
    countriesBombed: null,
    nuclearWarheads: { value: 0, source: "FAS" },
    militarySpendingAnnual: { value: 66_800_000_000, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    militaryPctGDP: { value: 1.5, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    armsExportsAnnual: { value: 8_100_000_000, source: "SIPRI Arms Transfers 2023", url: "https://www.sipri.org/databases/armstransfers" },
    drugPrisoners: null,
    drugWarSpendingAnnual: null,
    drugOverdoseDeaths: { value: 2_227, source: "DBDD 2023" },
    incarcerationRate: { value: 69, source: "World Prison Brief 2024", url: "https://www.prisonstudies.org/" },
    murderClearanceRate: { value: 95, source: "BKA 2023" },
    homicideRate: { value: 0.8, source: "UNODC 2023" },
    healthSpendingPerCapita: { value: 7_383, source: "OECD 2023" },
    lifeExpectancy: { value: 81.2, source: "WHO 2023" },
    hale: { value: 70.9, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 4_500_000_000, source: "DFG + BMBF health research programs", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    clinicalTrialSpending: { value: 300_000_000, source: "Estimated: ~6.7% of $4.5B medical research budget", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: null,
    farmSubsidies: null,
    armsImportsAnnual: null,
    militaryAidReceived: null,
    droneStrikes: null,
    refugeesCreated: null,
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: null,
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: null,
    militaryToEducationRatio: null,
    gdpPerCapita: { value: 52_824, source: "World Bank 2023" },
    medianIncome: null, // hydrated from canonical median-income-series
    debtPctGDP: { value: 64, source: "IMF 2024" },
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    militaryDeathsCaused: {
      value: 3_000,
      period: "1945–2025 (Korea, Vietnam, Iraq, Afghanistan)",
      source: "Australian War Memorial, conflict databases",
    },
    civilianDeathsCaused: null,
    countriesBombed: null,
    nuclearWarheads: { value: 0, source: "FAS" },
    militarySpendingAnnual: { value: 32_300_000_000, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    militaryPctGDP: { value: 1.9, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    armsExportsAnnual: { value: 2_100_000_000, source: "SIPRI Arms Transfers 2023", url: "https://www.sipri.org/databases/armstransfers" },
    drugPrisoners: null,
    drugWarSpendingAnnual: null,
    drugOverdoseDeaths: { value: 2_231, source: "AIHW 2023" },
    incarcerationRate: { value: 160, source: "World Prison Brief 2024", url: "https://www.prisonstudies.org/" },
    murderClearanceRate: null,
    homicideRate: { value: 0.9, source: "UNODC 2023" },
    healthSpendingPerCapita: { value: 5_627, source: "OECD 2023" },
    lifeExpectancy: { value: 83.3, source: "WHO 2023" },
    hale: { value: 73.0, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 3_200_000_000, source: "NHMRC + MRFF ~A$4.5B/yr", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    clinicalTrialSpending: { value: 214_000_000, source: "Estimated: ~6.7% of $3.2B medical research budget", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: null,
    farmSubsidies: null,
    armsImportsAnnual: null,
    militaryAidReceived: null,
    droneStrikes: null,
    refugeesCreated: null,
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: null,
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: null,
    militaryToEducationRatio: null,
    gdpPerCapita: { value: 65_099, source: "World Bank 2023" },
    medianIncome: null, // hydrated from canonical median-income-series
    debtPctGDP: { value: 51, source: "IMF 2024" },
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    militaryDeathsCaused: {
      value: 500,
      period: "1945–2025 (Korea, Afghanistan, peacekeeping)",
      source: "Veterans Affairs Canada, conflict databases",
    },
    civilianDeathsCaused: null,
    countriesBombed: null,
    nuclearWarheads: { value: 0, source: "FAS" },
    militarySpendingAnnual: { value: 26_900_000_000, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    militaryPctGDP: { value: 1.3, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    armsExportsAnnual: { value: 2_800_000_000, source: "SIPRI Arms Transfers 2023", url: "https://www.sipri.org/databases/armstransfers" },
    drugPrisoners: null,
    drugWarSpendingAnnual: null,
    drugOverdoseDeaths: { value: 8_049, source: "PHAC 2023" },
    incarcerationRate: { value: 104, source: "World Prison Brief 2024", url: "https://www.prisonstudies.org/" },
    murderClearanceRate: null,
    homicideRate: { value: 2.3, source: "UNODC 2023" },
    healthSpendingPerCapita: { value: 5_905, source: "OECD 2023" },
    lifeExpectancy: { value: 82.0, source: "WHO 2023" },
    hale: { value: 71.3, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 2_500_000_000, source: "CIHR C$1.7B + provincial health research", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    clinicalTrialSpending: { value: 168_000_000, source: "Estimated: ~6.7% of $2.5B medical research budget", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: null,
    farmSubsidies: null,
    armsImportsAnnual: null,
    militaryAidReceived: null,
    droneStrikes: null,
    refugeesCreated: null,
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: null,
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: null,
    militaryToEducationRatio: null,
    gdpPerCapita: { value: 53_247, source: "World Bank 2023" },
    medianIncome: null, // hydrated from canonical median-income-series
    debtPctGDP: { value: 107, source: "IMF 2024" },
  },
  {
    code: "KR",
    name: "South Korea",
    flag: "🇰🇷",
    militaryDeathsCaused: {
      value: 0,
      period: "1953–2025 (minor Vietnam participation ~5,000 KIA counted as Vietnam War)",
      source: "Post-Korean War; no independent military conflicts causing deaths",
    },
    civilianDeathsCaused: null,
    countriesBombed: null,
    nuclearWarheads: { value: 0, source: "FAS" },
    militarySpendingAnnual: { value: 47_400_000_000, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    militaryPctGDP: { value: 2.8, source: "SIPRI 2024", url: "https://www.sipri.org/databases/milex" },
    armsExportsAnnual: { value: 5_500_000_000, source: "SIPRI Arms Transfers 2023", url: "https://www.sipri.org/databases/armstransfers" },
    drugPrisoners: null,
    drugWarSpendingAnnual: null,
    drugOverdoseDeaths: null,
    incarcerationRate: { value: 92, source: "World Prison Brief 2024", url: "https://www.prisonstudies.org/" },
    murderClearanceRate: { value: 97, source: "KNPA 2023" },
    homicideRate: { value: 0.6, source: "UNODC 2023" },
    healthSpendingPerCapita: { value: 3_914, source: "OECD 2023" },
    lifeExpectancy: { value: 83.7, source: "WHO 2023" },
    hale: { value: 73.1, source: "WHO GHO 2019", url: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy-at-birth" },
    govMedicalResearchSpending: { value: 3_000_000_000, source: "KHIDI + NRF health research ~KRW 4T", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    clinicalTrialSpending: { value: 201_000_000, source: "Estimated: ~6.7% of $3B medical research budget", url: "https://manual.warondisease.org/knowledge/appendix/global-government-medical-research-spending.html" },
    corporateWelfareAnnual: null,
    fossilFuelSubsidies: null,
    farmSubsidies: null,
    armsImportsAnnual: null,
    militaryAidReceived: null,
    droneStrikes: null,
    refugeesCreated: null,
    sanctionsDeathsAttributed: null,
    policeKillingsAnnual: null,
    privatePrisonPopulation: null,
    defenseLobbyingAnnual: null,
    educationSpendingPctGDP: { value: 4.7, source: "OECD 2022" },
    militaryToEducationRatio: { value: 0.60, source: "Calculated: 2.8% military / 4.7% education" },
    gdpPerCapita: { value: 32_423, source: "World Bank 2023" },
    medianIncome: null, // hydrated from canonical median-income-series
    debtPctGDP: { value: 54, source: "IMF 2024" },
  },
];

// ---------------------------------------------------------------------------
// Hydrate medianIncome from the canonical generated median income series,
// replacing spotty manual entries with the best available after-tax PPP data.
// ---------------------------------------------------------------------------
import { getBestAvailableMedianIncomeSeries } from './median-income-series';

const ISO2_TO_ISO3: Record<string, string> = {
  US: "USA", RU: "RUS", CN: "CHN", GB: "GBR", IL: "ISR", SA: "SAU",
  SG: "SGP", FR: "FRA", TR: "TUR", IN: "IND", PK: "PAK", ET: "ETH",
  IR: "IRN", JP: "JPN", DE: "DEU", AU: "AUS", CA: "CAN", KR: "KOR",
};

for (const gov of GOVERNMENTS) {
  const iso3 = ISO2_TO_ISO3[gov.code];
  if (!iso3) continue;

  // Try strict after-tax PPP first
  let records = getBestAvailableMedianIncomeSeries({
    jurisdictions: [iso3],
    isAfterTax: true,
    purchasingPower: "ppp",
  });

  // Fallback to any PPP record
  if (records.length === 0) {
    records = getBestAvailableMedianIncomeSeries({
      jurisdictions: [iso3],
      purchasingPower: "ppp",
    });
  }

  if (records.length > 0) {
    const best = records[0];
    gov.medianIncome = {
      value: Math.round(best.value),
      source: `${best.source} ${best.year}${best.isAfterTax ? " (after-tax)" : ""} PPP`,
      url: best.sourceUrl,
    };
  }
}

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

/** Get all governments sorted by HALE (descending — highest healthy life expectancy first) */
export function getGovernmentsByHALE(): GovernmentMetrics[] {
  return [...GOVERNMENTS].sort(
    (a, b) => (b.hale?.value ?? 0) - (a.hale?.value ?? 0),
  );
}

/** Get all governments sorted by GDP per capita (descending — highest income first) */
export function getGovernmentsByIncome(): GovernmentMetrics[] {
  return [...GOVERNMENTS].sort(
    (a, b) => b.gdpPerCapita.value - a.gdpPerCapita.value,
  );
}

/** Compute military-to-health-spending ratio for a government */
export function getMilitaryToHealthRatio(gov: GovernmentMetrics): number | null {
  if (!gov.healthSpendingPerCapita.value || !gov.gdpPerCapita.value) return null;
  const gdpTotal = gov.militarySpendingAnnual.value / (gov.militaryPctGDP.value / 100);
  const population = gdpTotal / gov.gdpPerCapita.value;
  const healthTotal = gov.healthSpendingPerCapita.value * population;
  if (healthTotal <= 0) return null;
  return gov.militarySpendingAnnual.value / healthTotal;
}
