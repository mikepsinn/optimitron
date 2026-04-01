// AUTO-GENERATED FILE - DO NOT EDIT
// Generated from dih_models/parameters.py
// Run: python scripts/generate-everything-parameters-variables-calculations-references.py

/**
 * Economic model parameters and calculations
 * for the 1% treaty analysis
 */

export type SourceType = 'external' | 'calculated' | 'definition';
export type Confidence = 'high' | 'medium' | 'low' | 'estimated';

/**
 * CSL JSON citation format
 * Standard format used by citation processors like citeproc-js
 * See: https://citeproc-js.readthedocs.io/en/latest/csl-json/markup.html
 */
export interface Citation {
  id: string;
  type: 'article-journal' | 'report' | 'book' | 'webpage' | 'legislation';
  title: string;
  author?: Array<{ family?: string; given?: string; literal?: string }>;
  issued?: { 'date-parts': [[number, number?, number?]] };
  publisher?: string;
  'container-title'?: string;  // Journal name
  URL?: string;
  note?: string;
}

export interface Parameter {
  /** Numeric value */
  value: number;
  /** Unit of measurement (USD, deaths, DALYs, percentage, etc.) */
  unit?: string;
  /** Human-readable description */
  description?: string;
  /** Display name for UI */
  displayName?: string;
  /** Source type: external data, calculated, or definition */
  sourceType?: SourceType;
  /** Reference ID - look up full citation in citations object */
  sourceRef?: string;
  /** Confidence level */
  confidence?: Confidence;
  /** Formula string (for calculated parameters) */
  formula?: string;
  /** LaTeX equation (for display) */
  latex?: string;
  /** 95% confidence interval [low, high] */
  confidenceInterval?: [number, number];
  /** Standard error */
  stdError?: number;
  /** Whether this is peer-reviewed data */
  peerReviewed?: boolean;
  /** Whether this is a conservative estimate */
  conservative?: boolean;
  /** Parameter key name (e.g., GLOBAL_DISEASE_DEATHS_ANNUAL) */
  parameterName?: string;
  /** URL to full calculation methodology on the calculations page */
  calculationsUrl?: string;
  /** Direct URL to external data source (flattened from citation) */
  sourceUrl?: string;
  /** URL to the primary manual page where this parameter is discussed */
  manualPageUrl?: string;
  /** Title of the primary manual page */
  manualPageTitle?: string;
}

// ============================================================================
// External Data Sources
// ============================================================================

export const ADAPTABLE_TRIAL_COST_PER_PATIENT: Parameter = {
  value: 929.0,
  parameterName: "ADAPTABLE_TRIAL_COST_PER_PATIENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-adaptable_trial_cost_per_patient",
  unit: "USD/patient",
  displayName: "ADAPTABLE Trial Cost per Patient",
  description: "Cost per patient in ADAPTABLE trial ($14M PCORI grant / 15,076 patients). Note: This is the direct grant cost; true cost including in-kind may be 10-40% higher.",
  sourceType: "external",
  sourceRef: "pragmatic-trials-cost-advantage",
  sourceUrl: "https://commonfund.nih.gov/hcscollaboratory",
  confidence: "medium",
  confidenceInterval: [929.0, 1400.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html",
  manualPageTitle: "Ubiquitous Pragmatic Trial Impact Analysis: How to Prevent a Year of Death and Suffering for 84 Cents",
};

export const ADAPTABLE_TRIAL_TOTAL_COST: Parameter = {
  value: 14000000.0,
  parameterName: "ADAPTABLE_TRIAL_TOTAL_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-adaptable_trial_total_cost",
  unit: "USD",
  displayName: "ADAPTABLE Trial Total Cost",
  description: "PCORI grant for ADAPTABLE trial (2016-2019). Note: Direct funding only; total costs including site overhead and in-kind contributions from health systems may be higher.",
  sourceType: "external",
  sourceRef: "pragmatic-trials-cost-advantage",
  sourceUrl: "https://commonfund.nih.gov/hcscollaboratory",
  confidence: "medium",
  confidenceInterval: [14000000.0, 20000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const ANTIDEPRESSANT_TRIAL_EXCLUSION_RATE: Parameter = {
  value: 0.861,
  parameterName: "ANTIDEPRESSANT_TRIAL_EXCLUSION_RATE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-antidepressant_trial_exclusion_rate",
  unit: "percentage",
  displayName: "Antidepressant Trial Exclusion Rate",
  description: "Mean exclusion rate in antidepressant trials (86.1% of real-world patients excluded)",
  sourceType: "external",
  sourceRef: "antidepressant-trial-exclusion-rates",
  sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/26276679/",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const AVERAGE_MARKET_RETURN_PCT: Parameter = {
  value: 0.1,
  parameterName: "AVERAGE_MARKET_RETURN_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-average_market_return_pct",
  unit: "rate",
  displayName: "Average Annual Stock Market Return",
  description: "Average annual stock market return (10%)",
  sourceType: "external",
  sourceRef: "warren-buffett-career-average-return-20-pct",
  sourceUrl: "https://www.cnbc.com/2025/05/05/warren-buffetts-return-tally-after-60-years-5502284percent.html",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/aligning-incentives.html",
  manualPageTitle: "Aligning Incentives",
};

export const BASELINE_LIVES_SAVED_ANNUAL: Parameter = {
  value: 12.0,
  parameterName: "BASELINE_LIVES_SAVED_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-baseline_lives_saved_annual",
  unit: "deaths/year",
  displayName: "Baseline Annual Lives Saved by Pharmaceuticals",
  description: "Baseline annual lives saved by pharmaceuticals (conservative aggregate)",
  sourceType: "external",
  sourceRef: "who-global-health-estimates-2024",
  sourceUrl: "https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates",
  confidence: "medium",
  peerReviewed: true,
  conservative: true,
};

export const BED_NETS_COST_PER_DALY: Parameter = {
  value: 89.0,
  parameterName: "BED_NETS_COST_PER_DALY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-bed_nets_cost_per_daly",
  unit: "USD/DALY",
  displayName: "Bed Nets Cost per DALY",
  description: "GiveWell cost per DALY for insecticide-treated bed nets (midpoint estimate, range $78-100). DALYs (Disability-Adjusted Life Years) measure disease burden by combining years of life lost and years lived with disability. Bed nets prevent malaria deaths and are considered a gold standard benchmark for cost-effective global health interventions - if an intervention costs less per DALY than bed nets, it's exceptionally cost-effective. GiveWell synthesizes peer-reviewed academic research with transparent, rigorous methodology and extensive external expert review.",
  sourceType: "external",
  sourceRef: "givewell-cost-per-life-saved",
  sourceUrl: "https://www.givewell.org/charities/top-charities",
  confidence: "high",
  confidenceInterval: [78.0, 100.0],
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const CAREGIVER_ANNUAL_VALUE_TOTAL: Parameter = {
  value: 600000000000.0,
  parameterName: "CAREGIVER_ANNUAL_VALUE_TOTAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-caregiver_annual_value_total",
  unit: "USD/year",
  displayName: "Total Annual Value of Unpaid Caregiving in US",
  description: "Total annual value of unpaid caregiving in US",
  sourceType: "external",
  sourceRef: "unpaid-caregiver-hours-economic-value",
  sourceUrl: "https://www.aarp.org/caregiving/financial-legal/info-2023/unpaid-caregivers-provide-billions-in-care.html",
  confidence: "high",
};

export const CAREGIVER_COUNT_US: Parameter = {
  value: 38000000.0,
  parameterName: "CAREGIVER_COUNT_US",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-caregiver_count_us",
  unit: "people",
  displayName: "Number of Unpaid Caregivers in US",
  description: "Number of unpaid caregivers in US",
  sourceType: "external",
  sourceRef: "unpaid-caregiver-hours-economic-value",
  sourceUrl: "https://www.aarp.org/caregiving/financial-legal/info-2023/unpaid-caregivers-provide-billions-in-care.html",
  confidence: "high",
};

export const CAREGIVER_HOURS_PER_MONTH: Parameter = {
  value: 20.0,
  parameterName: "CAREGIVER_HOURS_PER_MONTH",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-caregiver_hours_per_month",
  unit: "hours/month",
  displayName: "Average Monthly Hours of Unpaid Family Caregiving in US",
  description: "Average monthly hours of unpaid family caregiving in US",
  sourceType: "external",
  sourceRef: "unpaid-caregiver-hours-economic-value",
  sourceUrl: "https://www.aarp.org/caregiving/financial-legal/info-2023/unpaid-caregivers-provide-billions-in-care.html",
  confidence: "high",
};

export const CAREGIVER_VALUE_PER_HOUR_SIMPLE: Parameter = {
  value: 25.0,
  parameterName: "CAREGIVER_VALUE_PER_HOUR_SIMPLE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-caregiver_value_per_hour_simple",
  unit: "USD/hour",
  displayName: "Estimated Replacement Cost per Hour of Caregiving",
  description: "Estimated replacement cost per hour of caregiving",
  sourceType: "external",
  sourceRef: "unpaid-caregiver-hours-economic-value",
  sourceUrl: "https://www.aarp.org/caregiving/financial-legal/info-2023/unpaid-caregivers-provide-billions-in-care.html",
  confidence: "high",
};

export const CHAIN_GLOBAL_BILLIONAIRE_COUNT: Parameter = {
  value: 2781.0,
  parameterName: "CHAIN_GLOBAL_BILLIONAIRE_COUNT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-chain_global_billionaire_count",
  unit: "people",
  displayName: "Global Billionaire Count",
  description: "Number of billionaires globally (Forbes 2024 count)",
  sourceType: "external",
  sourceRef: "forbes-billionaires-2024",
  sourceUrl: "https://www.forbes.com/billionaires/",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/treaty-feasibility.html",
  manualPageTitle: "Treaty Feasibility & Cost Analysis",
};

export const CHILDHOOD_VACCINATION_ANNUAL_BENEFIT: Parameter = {
  value: 15000000000.0,
  parameterName: "CHILDHOOD_VACCINATION_ANNUAL_BENEFIT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-childhood_vaccination_annual_benefit",
  unit: "USD/year",
  displayName: "Estimated Annual Global Economic Benefit from Childhood Vaccination Programs",
  description: "Estimated annual global economic benefit from childhood vaccination programs (measles, polio, etc.)",
  sourceType: "external",
  sourceRef: "childhood-vaccination-economic-benefits",
  sourceUrl: "https://www.cdc.gov/mmwr/volumes/73/wr/mm7331a2.htm",
  confidence: "high",
  stdError: 4500000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const CHILDHOOD_VACCINATION_ROI: Parameter = {
  value: 13.0,
  parameterName: "CHILDHOOD_VACCINATION_ROI",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-childhood_vaccination_roi",
  unit: "ratio",
  displayName: "Return on Investment from Childhood Vaccination Programs",
  description: "Return on investment from childhood vaccination programs",
  sourceType: "external",
  sourceRef: "childhood-vaccination-roi",
  sourceUrl: "https://www.cdc.gov/mmwr/preview/mmwrhtml/mm6316a4.htm",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const CHRONIC_DISEASE_DISABILITY_WEIGHT: Parameter = {
  value: 0.35,
  parameterName: "CHRONIC_DISEASE_DISABILITY_WEIGHT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-chronic_disease_disability_weight",
  unit: "weight",
  displayName: "Disability Weight for Untreated Chronic Conditions",
  description: "Disability weight for untreated chronic conditions (WHO Global Burden of Disease)",
  sourceType: "external",
  sourceRef: "who-global-health-estimates-2024",
  sourceUrl: "https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates",
  confidence: "medium",
  stdError: 0.07,
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const CONVENTIONAL_RETIREMENT_RETURN: Parameter = {
  value: 0.065,
  parameterName: "CONVENTIONAL_RETIREMENT_RETURN",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-conventional_retirement_return",
  unit: "percent",
  displayName: "Conventional Retirement Return (After Fees)",
  description: "Average retail after-fee return on conventional retirement portfolios (60/40 stock/bond mix, ~1% advisory fees, ~0.4% fund fees). Used as the opportunity cost comparison: depositors are LOSING money by NOT participating in the Wishocratic fund.",
  sourceType: "external",
  confidence: "high",
  confidenceInterval: [0.05, 0.08],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/wishocratic-investment-fund.html",
  manualPageTitle: "The Wishocratic Investment Fund",
};

export const CPI_MULTIPLIER_1980_TO_2024: Parameter = {
  value: 3.8,
  parameterName: "CPI_MULTIPLIER_1980_TO_2024",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-cpi_multiplier_1980_to_2024",
  unit: "ratio",
  displayName: "CPI Multiplier: 1980 to 2024",
  description: "CPI inflation multiplier from 1980 to 2024 (280.48% cumulative inflation)",
  sourceType: "external",
  sourceRef: "bls-cpi-inflation-calculator",
  sourceUrl: "https://www.bls.gov/data/inflation_calculator.htm",
  confidence: "high",
  confidenceInterval: [3.75, 3.85],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/drug-development-cost-analysis.html",
  manualPageTitle: "Drug Development Cost Increase Analysis",
};

export const CROWD_DECISION_ACCURACY: Parameter = {
  value: 0.91,
  parameterName: "CROWD_DECISION_ACCURACY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-crowd_decision_accuracy",
  unit: "percent",
  displayName: "Crowd Decision Accuracy (Millionaire)",
  description: "Crowd accuracy on Who Wants to Be a Millionaire ask-the-audience lifeline. Studio audience picked the correct answer 91% of the time (Surowiecki 2004). Used as lower bound for Wishocratic allocation accuracy.",
  sourceType: "external",
  sourceRef: "surowiecki-2004",
  sourceUrl: "https://archive.org/details/wisdomofcrowds0000suro",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/wishocracy.html",
  manualPageTitle: "Wishocracy",
};

export const CURRENT_ACTIVE_TRIALS: Parameter = {
  value: 10000.0,
  parameterName: "CURRENT_ACTIVE_TRIALS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-current_active_trials",
  unit: "trials",
  displayName: "Current Active Trials at Any Given Time",
  description: "Current active trials at any given time (3-5 year duration)",
  sourceType: "external",
  sourceRef: "clinicaltrials-gov-enrollment-data-2025",
  sourceUrl: "https://clinicaltrials.gov/data-api/api",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const CURRENT_CLINICAL_TRIAL_PARTICIPATION_RATE: Parameter = {
  value: 0.0006,
  parameterName: "CURRENT_CLINICAL_TRIAL_PARTICIPATION_RATE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-current_clinical_trial_participation_rate",
  unit: "rate",
  displayName: "Current Clinical Trial Participation Rate",
  description: "Current clinical trial participation rate (0.06% of population)",
  sourceType: "external",
  sourceRef: "clinical-trial-patient-participation-rate",
  sourceUrl: "https://www.fightcancer.org/policy-resources/barriers-patient-enrollment-therapeutic-clinical-trials-cancer",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/dfda.html",
  manualPageTitle: "A Decentralized FDA",
};

export const CURRENT_DISEASE_PATIENTS_GLOBAL: Parameter = {
  value: 2400000000.0,
  parameterName: "CURRENT_DISEASE_PATIENTS_GLOBAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-current_disease_patients_global",
  unit: "people",
  displayName: "Global Population with Chronic Diseases",
  description: "Global population with chronic diseases",
  sourceType: "external",
  sourceRef: "disease-prevalence-2-billion",
  sourceUrl: "https://www.sciencedaily.com/releases/2015/06/150608081753.htm",
  confidence: "high",
  confidenceInterval: [2000000000.0, 2800000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem.html",
  manualPageTitle: "Diagnostic Summary",
};

export const CURRENT_DRUG_APPROVALS_PER_YEAR: Parameter = {
  value: 50.0,
  parameterName: "CURRENT_DRUG_APPROVALS_PER_YEAR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-current_drug_approvals_per_year",
  unit: "drugs/year",
  displayName: "Average Annual New Drug Approvals Globally",
  description: "Average annual new drug approvals globally",
  sourceType: "external",
  sourceRef: "global-new-drug-approvals-50-annually",
  sourceUrl: "https://cen.acs.org/pharmaceuticals/50-new-drugs-received-FDA/103/i2",
  confidence: "high",
  confidenceInterval: [45.0, 60.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/nih-fails-2-institute-health.html",
  manualPageTitle: "NIH Fails to Institute Health",
};

export const CURRENT_TRIALS_PER_YEAR: Parameter = {
  value: 3300.0,
  parameterName: "CURRENT_TRIALS_PER_YEAR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-current_trials_per_year",
  unit: "trials/year",
  displayName: "Current Global Clinical Trials per Year",
  description: "Current global clinical trials per year",
  sourceType: "external",
  sourceRef: "global-clinical-trials-market-2024",
  sourceUrl: "https://www.globenewswire.com/news-release/2024/04/19/2866012/0/en/Global-Clinical-Trials-Market-Research-Report-2024-An-83-16-Billion-Market-by-2030-AI-Machine-Learning-and-Blockchain-will-Transform-the-Clinical-Trials-Landscape.html",
  confidence: "high",
  confidenceInterval: [2640.0, 3960.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const CURRENT_TRIAL_ABANDONMENT_RATE: Parameter = {
  value: 0.4,
  parameterName: "CURRENT_TRIAL_ABANDONMENT_RATE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-current_trial_abandonment_rate",
  unit: "rate",
  displayName: "Current Trial Abandonment Rate",
  description: "Current trial abandonment rate (40% never complete)",
  sourceType: "external",
  sourceRef: "clinical-trial-abandonment-rate",
  sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4444136/",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const CURRENT_TRIAL_SLOTS_AVAILABLE: Parameter = {
  value: 1900000.0,
  parameterName: "CURRENT_TRIAL_SLOTS_AVAILABLE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-current_trial_slots_available",
  unit: "patients/year",
  displayName: "Annual Global Clinical Trial Participants",
  description: "Annual global clinical trial participants (IQVIA 2022: 1.9M post-COVID normalization)",
  sourceType: "external",
  sourceRef: "global-trial-participant-capacity",
  sourceUrl: "https://gmdpacademy.org/news/iqvia-report-clinical-trial-subjects-number-drops-due-to-decline-in-covid-19-enrollment/",
  confidence: "high",
  confidenceInterval: [1500000.0, 2300000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DEFENSE_LOBBYING_ANNUAL: Parameter = {
  value: 127000000.0,
  parameterName: "DEFENSE_LOBBYING_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-defense_lobbying_annual",
  unit: "USD/year",
  displayName: "Annual Defense Industry Lobbying Spending",
  description: "Annual defense industry lobbying spending",
  sourceType: "external",
  sourceRef: "lobbying-spend-defense",
  sourceUrl: "https://www.opensecrets.org/industries/lobbying?ind=D",
  confidence: "high",
  confidenceInterval: [100000000.0, 160000000.0],
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/faq.html",
  manualPageTitle: "Frequently Asked Objections",
};

export const DEMOCIDE_TOTAL_20TH_CENTURY: Parameter = {
  value: 262000000.0,
  parameterName: "DEMOCIDE_TOTAL_20TH_CENTURY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-democide_total_20th_century",
  unit: "deaths",
  displayName: "20th-Century Government Democide Total",
  description: "Total people murdered by governments worldwide, 1900-1999 (Rummel's democide estimate)",
  sourceType: "external",
  sourceRef: "rummel-death-by-government",
  sourceUrl: "https://www.hawaii.edu/powerkills/NOTE1.HTM",
  confidence: "high",
  confidenceInterval: [200000000.0, 272000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/cost-of-war.html",
  manualPageTitle: "The Cost of War",
};

export const DEWORMING_COST_PER_DALY: Parameter = {
  value: 55.0,
  parameterName: "DEWORMING_COST_PER_DALY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-deworming_cost_per_daly",
  unit: "USD/DALY",
  displayName: "Deworming Cost per DALY",
  description: "Cost per DALY for deworming programs (range $28-82, midpoint estimate). GiveWell notes this 2011 estimate is outdated and their current methodology focuses on long-term income effects rather than short-term health DALYs.",
  sourceType: "external",
  sourceRef: "deworming-cost-per-daly",
  sourceUrl: "https://www.givewell.org/international/technical/programs/deworming/cost-effectiveness",
  confidence: "low",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT: Parameter = {
  value: 929.0,
  parameterName: "DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_pragmatic_trial_cost_per_patient",
  unit: "USD/patient",
  displayName: "dFDA Pragmatic Trial Cost per Patient",
  description: "dFDA pragmatic trial cost per patient. Uses ADAPTABLE trial ($929) as DELIBERATELY CONSERVATIVE central estimate. Ramsberg & Platt (2018) reviewed 108 embedded pragmatic trials; 64 with cost data had median of only $97/patient - our estimate may overstate costs by 10x. Confidence interval spans meta-analysis median to complex chronic disease trials.",
  sourceType: "external",
  sourceRef: "pragmatic-trials-cost-advantage",
  sourceUrl: "https://commonfund.nih.gov/hcscollaboratory",
  confidence: "medium",
  confidenceInterval: [97.0, 3000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DISEASE_BURDEN_GDP_DRAG_PCT: Parameter = {
  value: 0.13,
  parameterName: "DISEASE_BURDEN_GDP_DRAG_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-disease_burden_gdp_drag_pct",
  unit: "percent",
  displayName: "Disease Burden as % of GDP",
  description: "Fraction of GDP currently lost to disease (productivity losses + medical costs diverted from productive use). $5T productivity loss + $9.9T direct medical costs = $14.9T on $115T GDP = ~13%. As diseases are progressively cured, this drag is recovered as GDP growth. This is the missing factor that makes the treaty trajectory look like a singularity rather than a modest improvement.",
  sourceType: "external",
  sourceRef: "disease-economic-burden-109t",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/gdp-trajectories.html",
  manualPageTitle: "Please Select an Earth: A) Everyone Gets Rich B) Somalia, but Everywhere",
};

export const DOT_VALUE_OF_STATISTICAL_LIFE: Parameter = {
  value: 13700000.0,
  parameterName: "DOT_VALUE_OF_STATISTICAL_LIFE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dot_value_of_statistical_life",
  unit: "USD",
  displayName: "DOT VSL",
  description: "DOT Value of Statistical Life (2024). Used by federal agencies to evaluate safety regulations and quantify the economic value of mortality risk reductions.",
  sourceType: "external",
  sourceRef: "dot-vsl-2024",
  sourceUrl: "https://www.transportation.gov/office-policy/transportation-policy/revised-departmental-guidance-on-valuation-of-a-statistical-life-in-economic-analysis",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const DRUG_DEVELOPMENT_COST_1980S: Parameter = {
  value: 194000000.0,
  parameterName: "DRUG_DEVELOPMENT_COST_1980S",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-drug_development_cost_1980s",
  unit: "USD",
  displayName: "Drug Development Cost (1980s)",
  description: "Drug development cost in 1980s (compounded to approval, 1990 dollars)",
  sourceType: "external",
  sourceRef: "pre-1962-drug-costs-timeline",
  sourceUrl: "https://thinkbynumbers.org/health/how-many-net-lives-does-the-fda-save/",
  confidence: "high",
  confidenceInterval: [145500000.0, 242500000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DRUG_DISCOVERY_TO_APPROVAL_YEARS: Parameter = {
  value: 14.0,
  parameterName: "DRUG_DISCOVERY_TO_APPROVAL_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-drug_discovery_to_approval_years",
  unit: "years",
  displayName: "Drug Discovery to Approval Timeline",
  description: "Full drug development timeline from discovery to FDA approval. Typical range is 12-15 years based on BIO 2021 and PMC meta-analyses. Breakdown: preclinical 4-6 years + clinical 10.5 years. Using 14 years as central estimate.",
  sourceType: "external",
  sourceRef: "bio-clinical-development-2021",
  sourceUrl: "https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf",
  confidence: "high",
  confidenceInterval: [12.0, 17.0],
  stdError: 1.5,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem.html",
  manualPageTitle: "Diagnostic Summary",
};

export const DRUG_REPURPOSING_SUCCESS_RATE: Parameter = {
  value: 0.3,
  parameterName: "DRUG_REPURPOSING_SUCCESS_RATE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-drug_repurposing_success_rate",
  unit: "percentage",
  displayName: "Drug Repurposing Success Rate",
  description: "Percentage of drugs that gain at least one new indication after initial approval",
  sourceType: "external",
  sourceRef: "drug-repurposing-rate",
  sourceUrl: "https://www.nature.com/articles/s41591-024-03233-x",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html",
  manualPageTitle: "Ubiquitous Pragmatic Trial Impact Analysis: How to Prevent a Year of Death and Suffering for 84 Cents",
};

export const ECONOMIC_MULTIPLIER_EDUCATION_INVESTMENT: Parameter = {
  value: 2.1,
  parameterName: "ECONOMIC_MULTIPLIER_EDUCATION_INVESTMENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-economic_multiplier_education_investment",
  unit: "x",
  displayName: "Economic Multiplier for Education Investment",
  description: "Economic multiplier for education investment (2.1x ROI)",
  sourceType: "external",
  sourceRef: "education-investment-economic-multiplier",
  sourceUrl: "https://www.epi.org/publication/bp348-public-investments-outside-core-infrastructure/",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/cost-of-war.html",
  manualPageTitle: "The Cost of War",
};

export const ECONOMIC_MULTIPLIER_HEALTHCARE_INVESTMENT: Parameter = {
  value: 4.3,
  parameterName: "ECONOMIC_MULTIPLIER_HEALTHCARE_INVESTMENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-economic_multiplier_healthcare_investment",
  unit: "x",
  displayName: "Economic Multiplier for Healthcare Investment",
  description: "Economic multiplier for healthcare investment (4.3x ROI). Literature range 3.0-6.0×.",
  sourceType: "external",
  sourceRef: "healthcare-investment-economic-multiplier",
  sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5954824/",
  confidence: "high",
  confidenceInterval: [3.0, 6.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const ECONOMIC_MULTIPLIER_INFRASTRUCTURE_INVESTMENT: Parameter = {
  value: 1.6,
  parameterName: "ECONOMIC_MULTIPLIER_INFRASTRUCTURE_INVESTMENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-economic_multiplier_infrastructure_investment",
  unit: "x",
  displayName: "Economic Multiplier for Infrastructure Investment",
  description: "Economic multiplier for infrastructure investment (1.6x ROI)",
  sourceType: "external",
  sourceRef: "infrastructure-investment-economic-multiplier",
  sourceUrl: "https://blogs.worldbank.org/en/ppps/effectiveness-infrastructure-investment-fiscal-stimulus-what-weve-learned",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/cost-of-war.html",
  manualPageTitle: "The Cost of War",
};

export const ECONOMIC_MULTIPLIER_MILITARY_SPENDING: Parameter = {
  value: 0.6,
  parameterName: "ECONOMIC_MULTIPLIER_MILITARY_SPENDING",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-economic_multiplier_military_spending",
  unit: "x",
  displayName: "Economic Multiplier for Military Spending",
  description: "Economic multiplier for military spending (0.6x ROI). Literature range 0.4-1.0×.",
  sourceType: "external",
  sourceRef: "military-spending-economic-multiplier",
  sourceUrl: "https://www.mercatus.org/research/research-papers/defense-spending-and-economy",
  confidence: "high",
  confidenceInterval: [0.4, 0.9],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const EFFICACY_LAG_YEARS: Parameter = {
  value: 8.2,
  parameterName: "EFFICACY_LAG_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-efficacy_lag_years",
  unit: "years",
  displayName: "Regulatory Delay for Efficacy Testing Post-Safety Verification",
  description: "Regulatory delay for efficacy testing (Phase II/III) post-safety verification. Based on BIO 2021 industry survey. Note: This is for drugs that COMPLETE the pipeline - survivor bias means actual delay for any given disease may be longer if candidates fail and must restart.",
  sourceType: "external",
  sourceRef: "bio-clinical-development-2021",
  sourceUrl: "https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf",
  confidence: "medium",
  formula: "TOTAL_TIME_TO_MARKET - PHASE_1_DURATION",
  stdError: 2.0,
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const EXPERT_DECISION_ACCURACY: Parameter = {
  value: 0.65,
  parameterName: "EXPERT_DECISION_ACCURACY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-expert_decision_accuracy",
  unit: "percent",
  displayName: "Expert Decision Accuracy (Millionaire)",
  description: "Expert accuracy on Who Wants to Be a Millionaire phone-a-friend lifeline. Credentialed expert picked the correct answer 65% of the time (Surowiecki 2004). Used as baseline for conventional fund manager / committee allocation.",
  sourceType: "external",
  sourceRef: "surowiecki-2004",
  sourceUrl: "https://archive.org/details/wisdomofcrowds0000suro",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/wishocracy.html",
  manualPageTitle: "Wishocracy",
};

export const FDA_APPROVED_PRODUCTS_COUNT: Parameter = {
  value: 20000.0,
  parameterName: "FDA_APPROVED_PRODUCTS_COUNT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-fda_approved_products_count",
  unit: "products",
  displayName: "FDA-Approved Drug Products",
  description: "Total FDA-approved drug products in the U.S.",
  sourceType: "external",
  sourceRef: "fda-approved-products-20k",
  sourceUrl: "https://www.fda.gov/media/143704/download",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/nih-fails-2-institute-health.html",
  manualPageTitle: "NIH Fails to Institute Health",
};

export const FDA_APPROVED_UNIQUE_ACTIVE_INGREDIENTS: Parameter = {
  value: 1650.0,
  parameterName: "FDA_APPROVED_UNIQUE_ACTIVE_INGREDIENTS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-fda_approved_unique_active_ingredients",
  unit: "compounds",
  displayName: "FDA-Approved Unique Active Ingredients",
  description: "Unique active pharmaceutical ingredients in FDA-approved products (midpoint of 1,300-2,000 range)",
  sourceType: "external",
  sourceRef: "fda-approved-products-20k",
  sourceUrl: "https://www.fda.gov/media/143704/download",
  confidence: "high",
  confidenceInterval: [1300.0, 2000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/untapped-therapeutic-frontier.html",
  manualPageTitle: "The Untapped Therapeutic Frontier",
};

export const FDA_GRAS_SUBSTANCES_COUNT: Parameter = {
  value: 635.0,
  parameterName: "FDA_GRAS_SUBSTANCES_COUNT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-fda_gras_substances_count",
  unit: "substances",
  displayName: "FDA GRAS Substances",
  description: "FDA Generally Recognized as Safe (GRAS) substances (midpoint of 570-700 range)",
  sourceType: "external",
  sourceRef: "fda-gras-list-count",
  sourceUrl: "https://www.fda.gov/food/generally-recognized-safe-gras/gras-notice-inventory",
  confidence: "high",
  confidenceInterval: [570.0, 700.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/untapped-therapeutic-frontier.html",
  manualPageTitle: "The Untapped Therapeutic Frontier",
};

export const FDA_PHASE_1_TO_APPROVAL_YEARS: Parameter = {
  value: 10.5,
  parameterName: "FDA_PHASE_1_TO_APPROVAL_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-fda_phase_1_to_approval_years",
  unit: "years",
  displayName: "FDA Phase 1 to Approval Timeline",
  description: "FDA timeline from Phase 1 start to approval. Derived from BIO 2021 industry survey: Phase 1 (2.3 years) + efficacy lag (8.2 years) = 10.5 years. Consistent with PMC meta-analysis finding 9.1 years median (95% CI: 8.2-10.0).",
  sourceType: "external",
  sourceRef: "bio-clinical-development-2021",
  sourceUrl: "https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf",
  confidence: "high",
  confidenceInterval: [6.0, 12.0],
  stdError: 2.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const GIVEWELL_COST_PER_LIFE_AVG: Parameter = {
  value: 4500.0,
  parameterName: "GIVEWELL_COST_PER_LIFE_AVG",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-givewell_cost_per_life_avg",
  unit: "USD/life",
  displayName: "Givewell Average Cost per Life Saved Across Top Charities",
  description: "GiveWell average cost per life saved across top charities",
  sourceType: "external",
  sourceRef: "givewell-cost-per-life-saved",
  sourceUrl: "https://www.givewell.org/charities/top-charities",
  confidence: "high",
};

export const GIVEWELL_COST_PER_LIFE_MAX: Parameter = {
  value: 5500.0,
  parameterName: "GIVEWELL_COST_PER_LIFE_MAX",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-givewell_cost_per_life_max",
  unit: "USD/life",
  displayName: "Givewell Cost per Life Saved (Maximum)",
  description: "GiveWell cost per life saved (Against Malaria Foundation)",
  sourceType: "external",
  sourceRef: "givewell-cost-per-life-saved",
  sourceUrl: "https://www.givewell.org/charities/top-charities",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const GIVEWELL_COST_PER_LIFE_MIN: Parameter = {
  value: 3500.0,
  parameterName: "GIVEWELL_COST_PER_LIFE_MIN",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-givewell_cost_per_life_min",
  unit: "USD/life",
  displayName: "Givewell Cost per Life Saved (Minimum)",
  description: "GiveWell cost per life saved (Helen Keller International)",
  sourceType: "external",
  sourceRef: "givewell-cost-per-life-saved",
  sourceUrl: "https://www.givewell.org/charities/top-charities",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const GLOBAL_ANNUAL_CONFLICT_DEATHS_ACTIVE_COMBAT: Parameter = {
  value: 233600.0,
  parameterName: "GLOBAL_ANNUAL_CONFLICT_DEATHS_ACTIVE_COMBAT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_conflict_deaths_active_combat",
  unit: "deaths/year",
  displayName: "Annual Deaths from Active Combat Worldwide",
  description: "Annual deaths from active combat worldwide",
  sourceType: "external",
  sourceRef: "acled-active-combat-deaths",
  sourceUrl: "https://acleddata.com/2024/12/12/data-shows-global-conflict-surged-in-2024-the-washington-post/",
  confidence: "high",
  confidenceInterval: [180000.0, 300000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/cost-of-war.html",
  manualPageTitle: "The Cost of War",
};

export const GLOBAL_ANNUAL_CONFLICT_DEATHS_STATE_VIOLENCE: Parameter = {
  value: 2700.0,
  parameterName: "GLOBAL_ANNUAL_CONFLICT_DEATHS_STATE_VIOLENCE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_conflict_deaths_state_violence",
  unit: "deaths/year",
  displayName: "Annual Deaths from State Violence",
  description: "Annual deaths from state violence",
  sourceType: "external",
  sourceRef: "ucdp-state-violence-deaths",
  sourceUrl: "https://ucdp.uu.se/",
  confidence: "high",
  confidenceInterval: [1500.0, 5000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/cost-of-war.html",
  manualPageTitle: "The Cost of War",
};

export const GLOBAL_ANNUAL_CONFLICT_DEATHS_TERROR_ATTACKS: Parameter = {
  value: 8300.0,
  parameterName: "GLOBAL_ANNUAL_CONFLICT_DEATHS_TERROR_ATTACKS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_conflict_deaths_terror_attacks",
  unit: "deaths/year",
  displayName: "Annual Deaths from Terror Attacks Globally",
  description: "Annual deaths from terror attacks globally",
  sourceType: "external",
  sourceRef: "gtd-terror-attack-deaths",
  sourceUrl: "https://ourworldindata.org/terrorism",
  confidence: "high",
  confidenceInterval: [6000.0, 12000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/cost-of-war.html",
  manualPageTitle: "The Cost of War",
};

export const GLOBAL_ANNUAL_DALY_BURDEN: Parameter = {
  value: 2880000000.0,
  parameterName: "GLOBAL_ANNUAL_DALY_BURDEN",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_daly_burden",
  unit: "DALYs/year",
  displayName: "Global Annual DALY Burden",
  description: "Global annual DALY burden from all diseases and injuries (WHO/IHME Global Burden of Disease 2021). Includes both YLL (years of life lost) and YLD (years lived with disability) from all causes.",
  sourceType: "external",
  sourceRef: "ihme-gbd-2021",
  sourceUrl: "https://vizhub.healthdata.org/gbd-results/",
  confidence: "high",
  stdError: 150000000.0,
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES: Parameter = {
  value: 55000000.0,
  parameterName: "GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_deaths_curable_diseases",
  unit: "deaths/year",
  displayName: "Annual Deaths from All Diseases and Aging Globally",
  description: "Annual deaths from all diseases and aging globally",
  sourceType: "external",
  sourceRef: "who-global-health-estimates-2024",
  sourceUrl: "https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates",
  confidence: "high",
  stdError: 5000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const GLOBAL_ANNUAL_ENVIRONMENTAL_DAMAGE_CONFLICT: Parameter = {
  value: 100000000000.0,
  parameterName: "GLOBAL_ANNUAL_ENVIRONMENTAL_DAMAGE_CONFLICT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_environmental_damage_conflict",
  unit: "USD",
  displayName: "Annual Environmental Damage and Restoration Costs from Conflict",
  description: "Annual environmental damage and restoration costs from conflict",
  sourceType: "external",
  sourceRef: "environmental-cost-of-war",
  sourceUrl: "https://watson.brown.edu/costsofwar/costs/social/environment",
  confidence: "high",
  confidenceInterval: [70000000000.0, 140000000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_COMMUNICATIONS_CONFLICT: Parameter = {
  value: 298100000000.0,
  parameterName: "GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_COMMUNICATIONS_CONFLICT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_infrastructure_damage_communications_conflict",
  unit: "USD",
  displayName: "Annual Infrastructure Damage to Communications from Conflict",
  description: "Annual infrastructure damage to communications from conflict",
  sourceType: "external",
  sourceRef: "environmental-cost-of-war",
  sourceUrl: "https://watson.brown.edu/costsofwar/costs/social/environment",
  confidence: "high",
  confidenceInterval: [209000000000.0, 418000000000.0],
};

export const GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_EDUCATION_CONFLICT: Parameter = {
  value: 234500000000.0,
  parameterName: "GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_EDUCATION_CONFLICT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_infrastructure_damage_education_conflict",
  unit: "USD",
  displayName: "Annual Infrastructure Damage to Education Facilities from Conflict",
  description: "Annual infrastructure damage to education facilities from conflict",
  sourceType: "external",
  sourceRef: "environmental-cost-of-war",
  sourceUrl: "https://watson.brown.edu/costsofwar/costs/social/environment",
  confidence: "high",
  confidenceInterval: [164000000000.0, 328000000000.0],
};

export const GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_ENERGY_CONFLICT: Parameter = {
  value: 421700000000.0,
  parameterName: "GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_ENERGY_CONFLICT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_infrastructure_damage_energy_conflict",
  unit: "USD",
  displayName: "Annual Infrastructure Damage to Energy Systems from Conflict",
  description: "Annual infrastructure damage to energy systems from conflict",
  sourceType: "external",
  sourceRef: "environmental-cost-of-war",
  sourceUrl: "https://watson.brown.edu/costsofwar/costs/social/environment",
  confidence: "high",
  confidenceInterval: [295000000000.0, 590000000000.0],
};

export const GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_HEALTHCARE_CONFLICT: Parameter = {
  value: 165600000000.0,
  parameterName: "GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_HEALTHCARE_CONFLICT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_infrastructure_damage_healthcare_conflict",
  unit: "USD",
  displayName: "Annual Infrastructure Damage to Healthcare Facilities from Conflict",
  description: "Annual infrastructure damage to healthcare facilities from conflict",
  sourceType: "external",
  sourceRef: "environmental-cost-of-war",
  sourceUrl: "https://watson.brown.edu/costsofwar/costs/social/environment",
  confidence: "high",
  confidenceInterval: [116000000000.0, 232000000000.0],
};

export const GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_TRANSPORTATION_CONFLICT: Parameter = {
  value: 487300000000.0,
  parameterName: "GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_TRANSPORTATION_CONFLICT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_infrastructure_damage_transportation_conflict",
  unit: "USD",
  displayName: "Annual Infrastructure Damage to Transportation from Conflict",
  description: "Annual infrastructure damage to transportation from conflict",
  sourceType: "external",
  sourceRef: "environmental-cost-of-war",
  sourceUrl: "https://watson.brown.edu/costsofwar/costs/social/environment",
  confidence: "high",
  confidenceInterval: [340000000000.0, 680000000000.0],
};

export const GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_WATER_CONFLICT: Parameter = {
  value: 267800000000.0,
  parameterName: "GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_WATER_CONFLICT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_infrastructure_damage_water_conflict",
  unit: "USD",
  displayName: "Annual Infrastructure Damage to Water Systems from Conflict",
  description: "Annual infrastructure damage to water systems from conflict",
  sourceType: "external",
  sourceRef: "environmental-cost-of-war",
  sourceUrl: "https://watson.brown.edu/costsofwar/costs/social/environment",
  confidence: "high",
  confidenceInterval: [187000000000.0, 375000000000.0],
};

export const GLOBAL_ANNUAL_LIVES_SAVED_BY_MED_RESEARCH: Parameter = {
  value: 4200000.0,
  parameterName: "GLOBAL_ANNUAL_LIVES_SAVED_BY_MED_RESEARCH",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_lives_saved_by_med_research",
  unit: "lives/year",
  displayName: "Annual Lives Saved by Medical Research Globally",
  description: "Annual lives saved by medical research globally",
  sourceType: "external",
  sourceRef: "medical-research-lives-saved-annually",
  sourceUrl: "https://www.sciencedaily.com/releases/2020/06/200617194510.htm",
  confidence: "high",
  confidenceInterval: [3000000.0, 6000000.0],
};

export const GLOBAL_ANNUAL_LOST_ECONOMIC_GROWTH_MILITARY_SPENDING: Parameter = {
  value: 2718000000000.0,
  parameterName: "GLOBAL_ANNUAL_LOST_ECONOMIC_GROWTH_MILITARY_SPENDING",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_lost_economic_growth_military_spending",
  unit: "USD",
  displayName: "Annual Lost Economic Growth from Military Spending Opportunity Cost",
  description: "Annual foregone economic output from military spending vs productive alternatives. This estimate implicitly captures fiscal multiplier differences (military ~0.6x vs healthcare ~4.3x GDP multiplier). Do not add separate GDP multiplier adjustment to avoid double-counting.",
  sourceType: "external",
  sourceRef: "disparity-ratio-weapons-vs-cures",
  sourceUrl: "https://www.sipri.org/commentary/blog/2016/opportunity-cost-world-military-spending",
  confidence: "high",
  confidenceInterval: [1900000000000.0, 3800000000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/peace-dividend.html",
  manualPageTitle: "Peace Dividend",
};

export const GLOBAL_ANNUAL_LOST_HUMAN_CAPITAL_CONFLICT: Parameter = {
  value: 300000000000.0,
  parameterName: "GLOBAL_ANNUAL_LOST_HUMAN_CAPITAL_CONFLICT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_lost_human_capital_conflict",
  unit: "USD",
  displayName: "Annual Lost Productivity from Conflict Casualties",
  description: "Annual lost productivity from conflict casualties",
  sourceType: "external",
  sourceRef: "lost-human-capital-war-cost",
  sourceUrl: "https://thinkbynumbers.org/military/war/the-economic-case-for-peace-a-comprehensive-financial-analysis/",
  confidence: "high",
  confidenceInterval: [210000000000.0, 420000000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const GLOBAL_ANNUAL_PSYCHOLOGICAL_IMPACT_COSTS_CONFLICT: Parameter = {
  value: 232000000000.0,
  parameterName: "GLOBAL_ANNUAL_PSYCHOLOGICAL_IMPACT_COSTS_CONFLICT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_psychological_impact_costs_conflict",
  unit: "USD",
  displayName: "Annual PTSD and Mental Health Costs from Conflict",
  description: "Annual PTSD and mental health costs from conflict",
  sourceType: "external",
  sourceRef: "psychological-impact-war-cost",
  sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/35485933/",
  confidence: "high",
  confidenceInterval: [162000000000.0, 325000000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const GLOBAL_ANNUAL_REFUGEE_SUPPORT_COSTS: Parameter = {
  value: 150000000000.0,
  parameterName: "GLOBAL_ANNUAL_REFUGEE_SUPPORT_COSTS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_refugee_support_costs",
  unit: "USD",
  displayName: "Annual Refugee Support Costs",
  description: "Annual refugee support costs (108.4M refugees × $1,384/year)",
  sourceType: "external",
  sourceRef: "unhcr-refugee-support-cost",
  sourceUrl: "https://www.cgdev.org/blog/costs-hosting-refugees-oecd-countries-and-why-uk-outlier",
  confidence: "high",
  confidenceInterval: [105000000000.0, 210000000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const GLOBAL_ANNUAL_TRADE_DISRUPTION_CURRENCY_CONFLICT: Parameter = {
  value: 57400000000.0,
  parameterName: "GLOBAL_ANNUAL_TRADE_DISRUPTION_CURRENCY_CONFLICT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_trade_disruption_currency_conflict",
  unit: "USD",
  displayName: "Annual Trade Disruption Costs from Currency Instability",
  description: "Annual trade disruption costs from currency instability",
  sourceType: "external",
  sourceRef: "world-bank-trade-disruption-conflict",
  sourceUrl: "https://www.worldbank.org/en/topic/trade/publication/trading-away-from-conflict",
  confidence: "high",
  confidenceInterval: [40000000000.0, 80000000000.0],
};

export const GLOBAL_ANNUAL_TRADE_DISRUPTION_ENERGY_PRICE_CONFLICT: Parameter = {
  value: 124700000000.0,
  parameterName: "GLOBAL_ANNUAL_TRADE_DISRUPTION_ENERGY_PRICE_CONFLICT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_trade_disruption_energy_price_conflict",
  unit: "USD",
  displayName: "Annual Trade Disruption Costs from Energy Price Volatility",
  description: "Annual trade disruption costs from energy price volatility",
  sourceType: "external",
  sourceRef: "world-bank-trade-disruption-conflict",
  sourceUrl: "https://www.worldbank.org/en/topic/trade/publication/trading-away-from-conflict",
  confidence: "high",
  confidenceInterval: [87000000000.0, 175000000000.0],
};

export const GLOBAL_ANNUAL_TRADE_DISRUPTION_SHIPPING_CONFLICT: Parameter = {
  value: 247100000000.0,
  parameterName: "GLOBAL_ANNUAL_TRADE_DISRUPTION_SHIPPING_CONFLICT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_trade_disruption_shipping_conflict",
  unit: "USD",
  displayName: "Annual Trade Disruption Costs from Shipping Disruptions",
  description: "Annual trade disruption costs from shipping disruptions",
  sourceType: "external",
  sourceRef: "world-bank-trade-disruption-conflict",
  sourceUrl: "https://www.worldbank.org/en/topic/trade/publication/trading-away-from-conflict",
  confidence: "high",
  confidenceInterval: [173000000000.0, 346000000000.0],
};

export const GLOBAL_ANNUAL_TRADE_DISRUPTION_SUPPLY_CHAIN_CONFLICT: Parameter = {
  value: 186800000000.0,
  parameterName: "GLOBAL_ANNUAL_TRADE_DISRUPTION_SUPPLY_CHAIN_CONFLICT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_trade_disruption_supply_chain_conflict",
  unit: "USD",
  displayName: "Annual Trade Disruption Costs from Supply Chain Disruptions",
  description: "Annual trade disruption costs from supply chain disruptions",
  sourceType: "external",
  sourceRef: "world-bank-trade-disruption-conflict",
  sourceUrl: "https://www.worldbank.org/en/topic/trade/publication/trading-away-from-conflict",
  confidence: "high",
  confidenceInterval: [131000000000.0, 262000000000.0],
};

export const GLOBAL_ANNUAL_VETERAN_HEALTHCARE_COSTS: Parameter = {
  value: 200100000000.0,
  parameterName: "GLOBAL_ANNUAL_VETERAN_HEALTHCARE_COSTS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_veteran_healthcare_costs",
  unit: "USD",
  displayName: "Annual Veteran Healthcare Costs",
  description: "Annual veteran healthcare costs (20-year projected)",
  sourceType: "external",
  sourceRef: "veteran-healthcare-cost-projections",
  sourceUrl: "https://department.va.gov/wp-content/uploads/2025/06/2026-Budget-in-Brief.pdf",
  confidence: "high",
  confidenceInterval: [140000000000.0, 280000000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const GLOBAL_CHRONIC_THERAPY_DAYS_ANNUAL: Parameter = {
  value: 1280000000000.0,
  parameterName: "GLOBAL_CHRONIC_THERAPY_DAYS_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_chronic_therapy_days_annual",
  unit: "days",
  displayName: "Annual Days of Chronic Disease Therapy",
  description: "Annual days of therapy for chronic conditions globally (diabetes, CVD, respiratory, cancer). IQVIA reports 1.8 trillion total days of therapy in 2019, with 71% for chronic conditions.",
  sourceType: "external",
  sourceRef: "iqvia-global-medicines-2024",
  sourceUrl: "https://www.iqvia.com/insights/the-iqvia-institute/reports-and-publications/reports/the-global-use-of-medicines-2024-outlook-to-2028",
  confidence: "medium",
  confidenceInterval: [1000000000000.0, 1500000000000.0],
};

export const GLOBAL_CLINICAL_TRIALS_SPENDING_ANNUAL: Parameter = {
  value: 60000000000.0,
  parameterName: "GLOBAL_CLINICAL_TRIALS_SPENDING_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_clinical_trials_spending_annual",
  unit: "USD",
  displayName: "Annual Global Spending on Clinical Trials",
  description: "Annual global spending on clinical trials (Industry: $45-60B + Government: $3-6B + Nonprofits: $2-5B). Conservative estimate using 15-20% of $300B total pharma R&D, not inflated market size projections.",
  sourceType: "external",
  sourceRef: "industry-clinical-trial-spending-estimate",
  sourceUrl: "https://cost-of-change.warondisease.org",
  confidence: "high",
  confidenceInterval: [50000000000.0, 75000000000.0],
  stdError: 10000000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const GLOBAL_CYBERCRIME_CAGR: Parameter = {
  value: 0.15,
  parameterName: "GLOBAL_CYBERCRIME_CAGR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_cybercrime_cagr",
  unit: "percent",
  displayName: "Cybercrime Cost CAGR",
  description: "Compound annual growth rate of global cybercrime costs. Cybersecurity Ventures: $3T (2015) -> $6T (2021) -> $10.5T (2025). AI-enhanced attacks are accelerating this trend.",
  sourceType: "external",
  sourceRef: "cybercrime-economy-10-5t",
  sourceUrl: "https://cybersecurityventures.com/hackerpocalypse-cybercrime-report-2016/",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/gdp-trajectories.html",
  manualPageTitle: "Please Select an Earth: A) Everyone Gets Rich B) Somalia, but Everywhere",
};

export const GLOBAL_CYBERCRIME_COST_ANNUAL_2025: Parameter = {
  value: 10500000000000.0,
  parameterName: "GLOBAL_CYBERCRIME_COST_ANNUAL_2025",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_cybercrime_cost_annual_2025",
  unit: "USD",
  displayName: "Global Cybercrime Costs (2025)",
  description: "Projected global cybercrime costs in 2025. Includes data theft, productivity loss, IP theft, fraud. More profitable than global trade of all major illegal drugs combined. If measured as a country, would be the 3rd largest economy after US and China.",
  sourceType: "external",
  sourceRef: "cybercrime-economy-10-5t",
  sourceUrl: "https://cybersecurityventures.com/hackerpocalypse-cybercrime-report-2016/",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/gdp-trajectories.html",
  manualPageTitle: "Please Select an Earth: A) Everyone Gets Rich B) Somalia, but Everywhere",
};

export const GLOBAL_DISEASE_DEATHS_DAILY: Parameter = {
  value: 150000.0,
  parameterName: "GLOBAL_DISEASE_DEATHS_DAILY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_disease_deaths_daily",
  unit: "deaths/day",
  displayName: "Global Daily Deaths from Disease and Aging",
  description: "Total global deaths per day from all disease and aging (WHO Global Burden of Disease 2024)",
  sourceType: "external",
  sourceRef: "who-global-health-estimates-2024",
  sourceUrl: "https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates",
  confidence: "high",
  stdError: 7500.0,
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const GLOBAL_DISEASE_DIRECT_MEDICAL_COST_ANNUAL: Parameter = {
  value: 9900000000000.0,
  parameterName: "GLOBAL_DISEASE_DIRECT_MEDICAL_COST_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_disease_direct_medical_cost_annual",
  unit: "USD/year",
  displayName: "Global Annual Direct Medical Costs of Disease",
  description: "Direct medical costs of disease globally (treatment, hospitalization, medication). Standalone market-cost metric; not included in DALY-based welfare burden to avoid double-counting.",
  sourceType: "external",
  sourceRef: "disease-economic-burden-109t",
  confidence: "high",
  confidenceInterval: [7000000000000.0, 14000000000000.0],
};

export const GLOBAL_DISEASE_PRODUCTIVITY_LOSS_ANNUAL: Parameter = {
  value: 5000000000000.0,
  parameterName: "GLOBAL_DISEASE_PRODUCTIVITY_LOSS_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_disease_productivity_loss_annual",
  unit: "USD/year",
  displayName: "Global Annual Productivity Loss from Disease",
  description: "Annual productivity loss from disease globally (absenteeism, reduced output). Standalone market-cost metric; not included in DALY-based welfare burden to avoid double-counting.",
  sourceType: "external",
  sourceRef: "disease-economic-burden-109t",
  confidence: "high",
  confidenceInterval: [3500000000000.0, 7000000000000.0],
};

export const GLOBAL_GDP_2025: Parameter = {
  value: 115000000000000.0,
  parameterName: "GLOBAL_GDP_2025",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_gdp_2025",
  unit: "USD",
  displayName: "Global GDP (2025)",
  description: "Global nominal GDP (2025 estimate). From Political Dysfunction Tax paper citing StatisticsTimes/IMF World Economic Outlook. Used for calculating global opportunity costs as percentage of world economic output. Note: Latest IMF data shows $117T.",
  sourceType: "external",
  sourceRef: "political-dysfunction-tax-paper-2025",
  sourceUrl: "https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/political-dysfunction-tax.html",
  manualPageTitle: "The Political Dysfunction Tax",
};

export const GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL: Parameter = {
  value: 4500000000.0,
  parameterName: "GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_government_clinical_trials_spending_annual",
  unit: "USD",
  displayName: "Annual Global Government Spending on Clinical Trials",
  description: "Annual global government spending on interventional clinical trials (~5-10% of total)",
  sourceType: "external",
  sourceRef: "global-government-clinical-trial-spending-estimate",
  sourceUrl: "https://www.appliedclinicaltrialsonline.com/view/sizing-clinical-research-market",
  confidence: "high",
  confidenceInterval: [3000000000.0, 6000000000.0],
  stdError: 1000000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const GLOBAL_HALE_CURRENT: Parameter = {
  value: 63.3,
  parameterName: "GLOBAL_HALE_CURRENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_hale_current",
  unit: "years",
  displayName: "Global Healthy Life Expectancy (HALE)",
  description: "Global healthy life expectancy at birth (HALE) from WHO Global Health Observatory, 2019 data (most recent available). HALE measures years lived in full health, adjusting for years lived with disability or disease.",
  sourceType: "external",
  sourceRef: "who-global-health-estimates-2024",
  sourceUrl: "https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates",
  confidence: "high",
  stdError: 1.5,
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const GLOBAL_HOUSEHOLD_WEALTH_USD: Parameter = {
  value: 454000000000000.0,
  parameterName: "GLOBAL_HOUSEHOLD_WEALTH_USD",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_household_wealth_usd",
  unit: "USD",
  displayName: "Global Household Wealth",
  description: "Total global household wealth (2022/2023 estimate)",
  sourceType: "external",
  sourceRef: "cs-global-wealth-report-2023",
  sourceUrl: "https://www.ubs.com/global/en/family-office-uhnw/reports/global-wealth-report-2023.html",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/incentive-alignment-bonds-paper.html",
  manualPageTitle: "Incentive Alignment Bonds: Making Public Goods Financially and Politically Profitable",
};

export const GLOBAL_INVESTABLE_ASSETS: Parameter = {
  value: 305000000000000.0,
  parameterName: "GLOBAL_INVESTABLE_ASSETS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_investable_assets",
  unit: "USD",
  displayName: "Global Investable Financial Assets",
  description: "Total global financial wealth (2024): equities, bonds, cash/deposits, and investment funds. Excludes real estate and physical assets. This is the addressable capital pool for PRIZE deposits.",
  sourceType: "external",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const GLOBAL_LIFE_EXPECTANCY_2024: Parameter = {
  value: 79.0,
  parameterName: "GLOBAL_LIFE_EXPECTANCY_2024",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_life_expectancy_2024",
  unit: "years",
  displayName: "Global Life Expectancy (2024)",
  description: "Global life expectancy (2024)",
  sourceType: "external",
  sourceRef: "who-global-health-estimates-2024",
  sourceUrl: "https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates",
  confidence: "high",
  stdError: 2.0,
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const GLOBAL_MEDIAN_AGE_2024: Parameter = {
  value: 30.5,
  parameterName: "GLOBAL_MEDIAN_AGE_2024",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_median_age_2024",
  unit: "years",
  displayName: "Global Median Age (2024)",
  description: "Global median age in 2024 from UN World Population Prospects 2024 revision.",
  sourceType: "external",
  sourceRef: "global-median-age-un-wpp-2024",
  sourceUrl: "https://population.un.org/wpp",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/call-to-action/your-personal-benefits.html",
  manualPageTitle: "Your Personal Benefits",
};

export const GLOBAL_MED_RESEARCH_SPENDING: Parameter = {
  value: 67500000000.0,
  parameterName: "GLOBAL_MED_RESEARCH_SPENDING",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_med_research_spending",
  unit: "USD",
  displayName: "Global Government Medical Research Spending",
  description: "Global government medical research spending",
  sourceType: "external",
  sourceRef: "global-gov-med-research-spending",
  sourceUrl: "https://www.nih.gov/about-nih/what-we-do/budget",
  confidence: "high",
  confidenceInterval: [54000000000.0, 81000000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const GLOBAL_MILITARY_SPENDING_ANNUAL_2024: Parameter = {
  value: 2720000000000.0,
  parameterName: "GLOBAL_MILITARY_SPENDING_ANNUAL_2024",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_military_spending_annual_2024",
  unit: "USD",
  displayName: "Global Military Spending in 2024",
  description: "Global military spending in 2024",
  sourceType: "external",
  sourceRef: "global-military-spending",
  sourceUrl: "https://www.sipri.org/publications/2025/sipri-fact-sheets/trends-world-military-expenditure-2024",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const GLOBAL_MILITARY_SPENDING_REAL_CAGR_10YR: Parameter = {
  value: 0.034,
  parameterName: "GLOBAL_MILITARY_SPENDING_REAL_CAGR_10YR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_military_spending_real_cagr_10yr",
  unit: "percent",
  displayName: "Military Spending Real CAGR (10-Year)",
  description: "Real compound annual growth rate of global military spending over the last decade (2014-2024). SIPRI reports 10 consecutive annual increases, with 2024 up 9.4% in real terms. The 10-year CAGR is approximately 3.4% real.",
  sourceType: "external",
  sourceRef: "sipri-milex-2024",
  sourceUrl: "https://www.sipri.org/publications/2025/sipri-fact-sheets/trends-world-military-expenditure-2024",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/gdp-trajectories.html",
  manualPageTitle: "Please Select an Earth: A) Everyone Gets Rich B) Somalia, but Everywhere",
};

export const GLOBAL_NONPROFIT_CLINICAL_TRIALS_SPENDING_ANNUAL: Parameter = {
  value: 3500000000.0,
  parameterName: "GLOBAL_NONPROFIT_CLINICAL_TRIALS_SPENDING_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_nonprofit_clinical_trials_spending_annual",
  unit: "USD",
  displayName: "Annual Global Nonprofit Spending on Clinical Trials",
  description: "Annual global nonprofit spending on clinical trials (foundations, disease advocacy groups)",
  sourceType: "external",
  sourceRef: "nonprofit-clinical-trial-spending-estimate",
  confidence: "high",
  confidenceInterval: [2000000000.0, 5000000000.0],
};

export const GLOBAL_PHARMA_RD_SPENDING_ANNUAL: Parameter = {
  value: 300000000000.0,
  parameterName: "GLOBAL_PHARMA_RD_SPENDING_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_pharma_rd_spending_annual",
  unit: "USD",
  displayName: "Annual Global Pharmaceutical R&D Spending",
  description: "Total global pharmaceutical R&D spending ($300B annually, clinical trials represent 15-20% of this total)",
  sourceType: "external",
  sourceRef: "global-pharma-rd-spending-300b",
  confidence: "high",
};

export const GLOBAL_POPULATION_2024: Parameter = {
  value: 8000000000.0,
  parameterName: "GLOBAL_POPULATION_2024",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_population_2024",
  unit: "of people",
  displayName: "Global Population in 2024",
  description: "Global population in 2024",
  sourceType: "external",
  sourceRef: "global-population-8-billion",
  sourceUrl: "https://www.un.org/en/desa/world-population-reach-8-billion-15-november-2022",
  confidence: "high",
  confidenceInterval: [7800000000.0, 8200000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/dih.html",
  manualPageTitle: "Decentralized Institutes of Health",
};

export const GLOBAL_POPULATION_2040_PROJECTED: Parameter = {
  value: 8900000000.0,
  parameterName: "GLOBAL_POPULATION_2040_PROJECTED",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_population_2040_projected",
  unit: "of people",
  displayName: "Global Population 2040 (Projected)",
  description: "UN World Population Prospects 2022 median projection for 2040. Interpolated midpoint between ~8.1B (2025) and 9.2B (2045).",
  sourceType: "external",
  sourceRef: "global-population-8-billion",
  sourceUrl: "https://www.un.org/en/desa/world-population-reach-8-billion-15-november-2022",
  confidence: "high",
};

export const GLOBAL_POPULATION_2045_PROJECTED: Parameter = {
  value: 9200000000.0,
  parameterName: "GLOBAL_POPULATION_2045_PROJECTED",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_population_2045_projected",
  unit: "of people",
  displayName: "Global Population 2045 (Projected)",
  description: "UN World Population Prospects 2022 median projection for 2045.",
  sourceType: "external",
  sourceRef: "global-population-8-billion",
  sourceUrl: "https://www.un.org/en/desa/world-population-reach-8-billion-15-november-2022",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/gdp-trajectories.html",
  manualPageTitle: "Please Select an Earth: A) Everyone Gets Rich B) Somalia, but Everywhere",
};

export const GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT: Parameter = {
  value: 0.035,
  parameterName: "GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_population_activism_threshold_pct",
  unit: "percent",
  displayName: "Critical Mass Threshold for Social Change",
  description: "Critical mass threshold for social change (3.5% rule). Chenoweth studied national regime changes; applying to a global treaty adds uncertainty. Lower bound: some movements succeeded at ~1%. Upper bound: entrenched defense-industry opposition and weaker signal from digital signatures vs sustained protest may require up to 10%.",
  sourceType: "external",
  sourceRef: "3-5-rule",
  sourceUrl: "https://www.hks.harvard.edu/centers/carr/publications/35-rule-how-small-minority-can-change-world",
  confidence: "high",
  confidenceInterval: [0.01, 0.1],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/proof.html",
  manualPageTitle: "The Proof: Overview",
};

export const GLOBAL_RETIREMENT_ASSETS: Parameter = {
  value: 70000000000000.0,
  parameterName: "GLOBAL_RETIREMENT_ASSETS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_retirement_assets",
  unit: "USD",
  displayName: "Global Retirement Assets",
  description: "Total global pension and retirement assets (OECD 2024). This is the capital pool that the Wishocratic fund competes with and could partially absorb.",
  sourceType: "external",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/wishocratic-investment-fund.html",
  manualPageTitle: "The Wishocratic Investment Fund",
};

export const GLOBAL_SAVINGS_RATE_PCT: Parameter = {
  value: 0.27,
  parameterName: "GLOBAL_SAVINGS_RATE_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_savings_rate_pct",
  unit: "percent",
  displayName: "Global Gross Savings Rate",
  description: "Global gross savings as share of GDP (World Bank, ~27% average 2023-2024)",
  sourceType: "external",
  sourceRef: "world-bank-gross-savings-2023",
  sourceUrl: "https://data.worldbank.org/indicator/NY.GNS.ICTR.ZS?locations=1W",
  confidence: "high",
  confidenceInterval: [0.24, 0.3],
};

export const GLOBAL_SYMPTOMATIC_DISEASE_TREATMENT_ANNUAL: Parameter = {
  value: 8200000000000.0,
  parameterName: "GLOBAL_SYMPTOMATIC_DISEASE_TREATMENT_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_symptomatic_disease_treatment_annual",
  unit: "USD/year",
  displayName: "Annual Global Spending on Symptomatic Disease Treatment",
  description: "Annual global spending on symptomatic disease treatment",
  sourceType: "external",
  sourceRef: "disease-economic-burden-109t",
  confidence: "high",
  confidenceInterval: [6500000000000.0, 10000000000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const GLOBAL_YLD_PROPORTION_OF_DALYS: Parameter = {
  value: 0.39,
  parameterName: "GLOBAL_YLD_PROPORTION_OF_DALYS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_yld_proportion_of_dalys",
  unit: "proportion",
  displayName: "YLD Proportion of Total DALYs",
  description: "Proportion of global DALYs that are YLD (years lived with disability) vs YLL (years of life lost). From GBD 2021: 1.13B YLD out of 2.88B total DALYs = 39%.",
  sourceType: "external",
  sourceRef: "ihme-gbd-2021",
  sourceUrl: "https://vizhub.healthdata.org/gbd-results/",
  confidence: "high",
  stdError: 0.03,
  peerReviewed: true,
};

export const HOME_BIAS_ALPHA: Parameter = {
  value: 0.008,
  parameterName: "HOME_BIAS_ALPHA",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-home_bias_alpha",
  unit: "percent",
  displayName: "Home Bias Return Drag",
  description: "Return drag from home bias in fragmented national pension systems. 70+ countries each overweight domestic assets, missing global diversification. IMF and Vanguard studies estimate 0.3-1.5% annual return cost. Wishocratic allocation is inherently global, eliminating this drag.",
  sourceType: "external",
  confidence: "high",
  confidenceInterval: [0.003, 0.015],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/wishocratic-investment-fund.html",
  manualPageTitle: "The Wishocratic Investment Fund",
};

export const HUMAN_GENOME_PROJECT_TOTAL_ECONOMIC_IMPACT: Parameter = {
  value: 1000000000000.0,
  parameterName: "HUMAN_GENOME_PROJECT_TOTAL_ECONOMIC_IMPACT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-human_genome_project_total_economic_impact",
  unit: "USD",
  displayName: "Estimated Total Economic Impact of Human Genome Project",
  description: "Estimated total economic impact of Human Genome Project",
  sourceType: "external",
  sourceRef: "human-genome-and-genetic-editing",
  sourceUrl: "https://www.genome.gov/11006929/2003-release-international-consortium-completes-hgp",
  confidence: "high",
};

export const HUMAN_INTERACTOME_TARGETED_PCT: Parameter = {
  value: 0.12,
  parameterName: "HUMAN_INTERACTOME_TARGETED_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-human_interactome_targeted_pct",
  unit: "percentage",
  displayName: "Human Interactome Targeted by Drugs",
  description: "Percentage of human interactome (protein-protein interactions) targeted by drugs",
  sourceType: "external",
  sourceRef: "clinical-trials-puzzle-interactome",
  sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10749231/",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const ICD_10_TOTAL_CODES: Parameter = {
  value: 14000.0,
  parameterName: "ICD_10_TOTAL_CODES",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-icd_10_total_codes",
  unit: "codes",
  displayName: "ICD-10 Total Codes",
  description: "Total ICD-10 diagnostic codes for human diseases and conditions",
  sourceType: "external",
  sourceRef: "icd-10-code-count",
  sourceUrl: "https://icd.who.int/browse10/2019/en",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/untapped-therapeutic-frontier.html",
  manualPageTitle: "The Untapped Therapeutic Frontier",
};

export const LIFE_EXTENSION_YEARS: Parameter = {
  value: 20.0,
  parameterName: "LIFE_EXTENSION_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-life_extension_years",
  unit: "years",
  displayName: "Life Extension from Treaty Research Acceleration",
  description: "Expected years of life extension from 1% treaty research acceleration (25x trial capacity). Bounds: 0 (complete failure) to ~150 (accident-limited lifespan minus current). Lognormal distribution allows for breakthrough scenarios.",
  sourceType: "external",
  sourceRef: "longevity-escape-velocity",
  sourceUrl: "https://en.wikipedia.org/wiki/Longevity_escape_velocity",
  confidence: "low",
  confidenceInterval: [5.0, 100.0],
};

export const LOBBYIST_SALARY_MAX: Parameter = {
  value: 2000000.0,
  parameterName: "LOBBYIST_SALARY_MAX",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-lobbyist_salary_max",
  unit: "USD",
  displayName: "Maximum Annual Lobbyist Salary Range",
  description: "Maximum annual lobbyist salary range",
  sourceType: "external",
  sourceRef: "lobbyist-statistics-dc",
  sourceUrl: "https://en.wikipedia.org/wiki/Lobbying_in_the_United_States",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/aligning-incentives.html",
  manualPageTitle: "Aligning Incentives",
};

export const LOBBYIST_SALARY_MIN_K: Parameter = {
  value: 500000.0,
  parameterName: "LOBBYIST_SALARY_MIN_K",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-lobbyist_salary_min_k",
  unit: "USD",
  displayName: "Minimum Annual Lobbyist Salary Range",
  description: "Minimum annual lobbyist salary range",
  sourceType: "external",
  sourceRef: "lobbyist-statistics-dc",
  sourceUrl: "https://en.wikipedia.org/wiki/Lobbying_in_the_United_States",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/aligning-incentives.html",
  manualPageTitle: "Aligning Incentives",
};

export const MEASLES_VACCINATION_ROI: Parameter = {
  value: 14.0,
  parameterName: "MEASLES_VACCINATION_ROI",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-measles_vaccination_roi",
  unit: "ratio",
  displayName: "Return on Investment from Measles Vaccination Programs",
  description: "Return on investment from measles (MMR) vaccination programs",
  sourceType: "external",
  sourceRef: "measles-vaccination-roi",
  sourceUrl: "https://www.mdpi.com/2076-393X/12/11/1210",
  confidence: "high",
};

export const MEDICAL_QALY_THRESHOLD: Parameter = {
  value: 100000.0,
  parameterName: "MEDICAL_QALY_THRESHOLD",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-medical_qaly_threshold",
  unit: "USD/QALY",
  displayName: "Medical QALY Threshold",
  description: "Medical cost-effectiveness QALY threshold. Standard threshold for evaluating whether health interventions are cost-effective. Interventions below $100K/QALY are generally considered cost-effective.",
  sourceType: "external",
  sourceRef: "qaly-threshold-history",
  sourceUrl: "https://ecocostsvalue.com/EVR/img/references%20others/Gosse%202008%20QALY%20threshold%20financial.pdf",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const MENTAL_HEALTH_PRODUCTIVITY_LOSS_PER_CAPITA: Parameter = {
  value: 2000.0,
  parameterName: "MENTAL_HEALTH_PRODUCTIVITY_LOSS_PER_CAPITA",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-mental_health_productivity_loss_per_capita",
  unit: "USD/year",
  displayName: "Annual Productivity Loss per Capita from Mental Health Issues",
  description: "Annual productivity loss per capita from mental health issues (beyond treatment costs)",
  sourceType: "external",
  sourceRef: "mental-health-burden",
  sourceUrl: "https://www.who.int/news/item/28-09-2001-the-world-health-report-2001-mental-disorders-affect-one-in-four-people",
  confidence: "high",
};

export const NATO_DEFENSE_SPENDING_ANNUAL: Parameter = {
  value: 1506000000000.0,
  parameterName: "NATO_DEFENSE_SPENDING_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-nato_defense_spending_annual",
  unit: "USD",
  displayName: "NATO Defense Spending (2024)",
  description: "Total NATO member defense spending in 2024. Source: SIPRI.",
  sourceType: "external",
  sourceRef: "sipri2024",
  sourceUrl: "https://www.sipri.org/publications/2024/sipri-fact-sheets/trends-world-military-expenditure-2023",
  confidence: "high",
};

export const NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR: Parameter = {
  value: 15.0,
  parameterName: "NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-new_disease_first_treatments_per_year",
  unit: "diseases/year",
  displayName: "Diseases Getting First Treatment Per Year",
  description: "Number of diseases that receive their FIRST effective treatment each year under current system. ~9 rare diseases/year (based on 40 years of ODA: 350 with treatment ÷ 40 years), plus ~5-10 common diseases. Note: FDA approves ~50 drugs/year, but most are for diseases that already have treatments.",
  sourceType: "external",
  sourceRef: "diseases-getting-first-treatment-annually",
  sourceUrl: "https://ojrd.biomedcentral.com/articles/10.1186/s13023-024-03398-1",
  confidence: "low",
  confidenceInterval: [8.0, 30.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const NIH_ANNUAL_BUDGET: Parameter = {
  value: 47000000000.0,
  parameterName: "NIH_ANNUAL_BUDGET",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-nih_annual_budget",
  unit: "USD",
  displayName: "NIH Annual Budget",
  description: "NIH annual budget (FY2024/2025)",
  sourceType: "external",
  sourceRef: "nih-budget-fy2025",
  sourceUrl: "https://www.nih.gov/about-nih/organization/budget",
  confidence: "high",
  confidenceInterval: [45000000000.0, 50000000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/nih-fails-2-institute-health.html",
  manualPageTitle: "NIH Fails to Institute Health",
};

export const NIH_CLINICAL_TRIALS_SPENDING_PCT: Parameter = {
  value: 0.033,
  parameterName: "NIH_CLINICAL_TRIALS_SPENDING_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-nih_clinical_trials_spending_pct",
  unit: "percentage",
  displayName: "NIH Clinical Trials Spending Percentage",
  description: "Percentage of NIH budget spent on clinical trials (3.3%)",
  sourceType: "external",
  sourceRef: "nih-clinical-trials-spending-pct-3-3",
  sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10349341/",
  confidence: "high",
  confidenceInterval: [0.02, 0.05],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/nih-fails-2-institute-health.html",
  manualPageTitle: "NIH Fails to Institute Health",
};

export const NIH_STANDARD_RESEARCH_COST_PER_QALY: Parameter = {
  value: 50000.0,
  parameterName: "NIH_STANDARD_RESEARCH_COST_PER_QALY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-nih_standard_research_cost_per_qaly",
  unit: "USD/QALY",
  displayName: "NIH Standard Research Cost per QALY",
  description: "Typical cost per QALY for standard NIH-funded medical research portfolio. Reflects the inefficiency of traditional RCTs and basic research-heavy allocation. See confidence_interval for range; ICER uses higher thresholds for value-based pricing.",
  sourceType: "external",
  sourceRef: "standard-medical-research-roi",
  sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10114019/",
  confidence: "medium",
  confidenceInterval: [20000.0, 100000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const OXFORD_RECOVERY_TRIAL_DURATION_MONTHS: Parameter = {
  value: 3.0,
  parameterName: "OXFORD_RECOVERY_TRIAL_DURATION_MONTHS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-oxford_recovery_trial_duration_months",
  unit: "months",
  displayName: "Oxford RECOVERY Trial Duration",
  description: "Oxford RECOVERY trial duration (found life-saving treatment in 3 months)",
  sourceType: "external",
  sourceRef: "recovery-trial-82x-cost-reduction",
  sourceUrl: "https://manhattan.institute/article/slow-costly-clinical-trials-drag-down-biomedical-breakthroughs",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/dfda.html",
  manualPageTitle: "A Decentralized FDA",
};

export const PATIENT_WILLINGNESS_TRIAL_PARTICIPATION_PCT: Parameter = {
  value: 0.448,
  parameterName: "PATIENT_WILLINGNESS_TRIAL_PARTICIPATION_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-patient_willingness_trial_participation_pct",
  unit: "percentage",
  displayName: "Patient Willingness to Participate in Clinical Trials",
  description: "Patient willingness to participate in drug trials (44.8% in surveys, 88% when actually approached)",
  sourceType: "external",
  sourceRef: "patient-willingness-clinical-trials",
  sourceUrl: "https://trialsjournal.biomedcentral.com/articles/10.1186/s13063-015-1105-3",
  confidence: "medium",
  confidenceInterval: [0.4, 0.5],
  stdError: 0.025,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/nih-fails-2-institute-health.html",
  manualPageTitle: "NIH Fails to Institute Health",
};

export const PHARMA_DRUG_DEVELOPMENT_COST_CURRENT: Parameter = {
  value: 2600000000.0,
  parameterName: "PHARMA_DRUG_DEVELOPMENT_COST_CURRENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-pharma_drug_development_cost_current",
  unit: "USD",
  displayName: "Pharma Drug Development Cost (Current System)",
  description: "Average cost to develop one drug in current system",
  sourceType: "external",
  sourceRef: "drug-development-cost",
  confidence: "high",
  confidenceInterval: [1500000000.0, 4000000000.0],
  stdError: 500000000.0,
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/fda-is-unsafe-and-ineffective.html",
  manualPageTitle: "Your FDA Is Unsafe and Ineffective",
};

export const PHARMA_DRUG_REVENUE_AVERAGE_CURRENT: Parameter = {
  value: 6700000000.0,
  parameterName: "PHARMA_DRUG_REVENUE_AVERAGE_CURRENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-pharma_drug_revenue_average_current",
  unit: "USD",
  displayName: "Pharma Average Drug Revenue (Current System)",
  description: "Median lifetime revenue per successful drug (study of 361 FDA-approved drugs 1995-2014, median follow-up 13.2 years)",
  sourceType: "external",
  sourceRef: "pharma-drug-revenue-average",
  sourceUrl: "https://www.sciencedirect.com/science/article/pii/S1098301524027542",
  confidence: "high",
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/aligning-incentives.html",
  manualPageTitle: "Aligning Incentives",
};

export const PHARMA_LIFE_YEARS_SAVED_ANNUAL: Parameter = {
  value: 148700000.0,
  parameterName: "PHARMA_LIFE_YEARS_SAVED_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-pharma_life_years_saved_annual",
  unit: "life-years",
  displayName: "Annual Life-Years Saved by Pharmaceuticals",
  description: "Annual life-years saved by pharmaceutical innovations globally. Lichtenberg (2019, NBER WP 25483) found that drugs launched after 1981 saved 148.7M life-years in 2013 across 22 countries using 3-way fixed-effects regression (disease-country-year). 95% CI [79.4M, 239.8M] propagated from Table 2 regression standard errors (β₀₋₁₁=-0.031±0.008, β₁₂₊=-0.057±0.013).",
  sourceType: "external",
  sourceRef: "lichtenberg-life-years-saved-2019",
  sourceUrl: "https://www.nber.org/papers/w25483",
  confidence: "medium",
  confidenceInterval: [79400000.0, 239800000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const PHARMA_ROI_CURRENT_SYSTEM_PCT: Parameter = {
  value: 0.012,
  parameterName: "PHARMA_ROI_CURRENT_SYSTEM_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-pharma_roi_current_system_pct",
  unit: "percentage",
  displayName: "Pharma ROI (Current System)",
  description: "ROI for pharma R&D (2022 historic low from Deloitte study of top 20 pharma companies, down from 6.8% in 2021, recovered to 5.9% in 2024)",
  sourceType: "external",
  sourceRef: "pharma-roi-current",
  sourceUrl: "https://www.deloitte.com/ch/en/Industries/life-sciences-health-care/research/measuring-return-from-pharmaceutical-innovation.html",
  confidence: "high",
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/aligning-incentives.html",
  manualPageTitle: "Aligning Incentives",
};

export const PHARMA_SUCCESS_RATE_CURRENT_PCT: Parameter = {
  value: 0.1,
  parameterName: "PHARMA_SUCCESS_RATE_CURRENT_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-pharma_success_rate_current_pct",
  unit: "percentage",
  displayName: "Pharma Drug Success Rate (Current System)",
  description: "Percentage of drugs that reach market in current system",
  sourceType: "external",
  sourceRef: "drug-trial-success-rate-12-pct",
  sourceUrl: "https://www.nature.com/articles/nrd.2016.136",
  confidence: "high",
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/fda-is-unsafe-and-ineffective.html",
  manualPageTitle: "Your FDA Is Unsafe and Ineffective",
};

export const PHASE_1_PASSED_COMPOUNDS_GLOBAL: Parameter = {
  value: 7500.0,
  parameterName: "PHASE_1_PASSED_COMPOUNDS_GLOBAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-phase_1_passed_compounds_global",
  unit: "compounds",
  displayName: "Phase I-Passed Compounds Globally",
  description: "Investigational compounds that have passed Phase I globally (midpoint of 5,000-10,000 range)",
  sourceType: "external",
  sourceRef: "bio-clinical-development-2021",
  sourceUrl: "https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf",
  confidence: "high",
  confidenceInterval: [5000.0, 10000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/untapped-therapeutic-frontier.html",
  manualPageTitle: "The Untapped Therapeutic Frontier",
};

export const PHASE_1_SAFETY_DURATION_YEARS: Parameter = {
  value: 2.3,
  parameterName: "PHASE_1_SAFETY_DURATION_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-phase_1_safety_duration_years",
  unit: "years",
  displayName: "Phase I Safety Trial Duration",
  description: "Phase I safety trial duration",
  sourceType: "external",
  sourceRef: "bio-clinical-development-2021",
  sourceUrl: "https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf",
  confidence: "high",
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html",
  manualPageTitle: "Ubiquitous Pragmatic Trial Impact Analysis: How to Prevent a Year of Death and Suffering for 84 Cents",
};

export const PHASE_2_3_CLINICAL_TRIAL_COST_PCT: Parameter = {
  value: 0.69,
  parameterName: "PHASE_2_3_CLINICAL_TRIAL_COST_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-phase_2_3_clinical_trial_cost_pct",
  unit: "percentage",
  displayName: "Phase 2/3 Share of Clinical Trial Costs",
  description: "Percentage of total clinical trial spending on Phase 2/3 efficacy testing (Phase 2: 24% + Phase 3: 45%)",
  sourceType: "external",
  sourceRef: "global-clinical-trials-market-2024",
  sourceUrl: "https://www.globenewswire.com/news-release/2024/04/19/2866012/0/en/Global-Clinical-Trials-Market-Research-Report-2024-An-83-16-Billion-Market-by-2030-AI-Machine-Learning-and-Blockchain-will-Transform-the-Clinical-Trials-Landscape.html",
  confidence: "high",
  stdError: 0.05,
};

export const PHASE_3_TRIAL_COST_MIN: Parameter = {
  value: 20000000.0,
  parameterName: "PHASE_3_TRIAL_COST_MIN",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-phase_3_trial_cost_min",
  unit: "USD/trial",
  displayName: "Phase 3 Trial Total Cost (Minimum)",
  description: "Phase 3 trial total cost (minimum)",
  sourceType: "external",
  sourceRef: "phase-3-cost-per-trial-range",
  sourceUrl: "https://www.sofpromed.com/how-much-does-a-clinical-trial-cost",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-spec-paper.html",
  manualPageTitle: "The Continuous Evidence Generation Protocol: Two-Stage Validation (RWE → Pragmatic Trials)",
};

export const PMC_PRAGMATIC_TRIAL_MEDIAN_COST_PER_PATIENT: Parameter = {
  value: 97.0,
  parameterName: "PMC_PRAGMATIC_TRIAL_MEDIAN_COST_PER_PATIENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-pmc_pragmatic_trial_median_cost_per_patient",
  unit: "USD/patient",
  displayName: "Pragmatic Trial Median Cost per Patient (PMC Review)",
  description: "Median cost per patient in embedded pragmatic clinical trials (Ramsberg & Platt 2018: 108 trials reviewed, 64 with cost data). IQR: $19-$478 (2015 USD).",
  sourceType: "external",
  sourceRef: "pmc-pragmatic-trial-cost",
  sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6508852/",
  confidence: "high",
  confidenceInterval: [19.0, 478.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html",
  manualPageTitle: "Ubiquitous Pragmatic Trial Impact Analysis: How to Prevent a Year of Death and Suffering for 84 Cents",
};

export const POLIO_VACCINATION_ROI: Parameter = {
  value: 39.0,
  parameterName: "POLIO_VACCINATION_ROI",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-polio_vaccination_roi",
  unit: "ratio",
  displayName: "Return on Investment from Sustaining Polio Vaccination Assets and Integrating into Expanded Immunization Programs",
  description: "Return on investment from sustaining polio vaccination assets and integrating into expanded immunization programs",
  sourceType: "external",
  sourceRef: "polio-vaccination-roi",
  sourceUrl: "https://www.who.int/news-room/feature-stories/detail/sustaining-polio-investments-offers-a-high-return",
  confidence: "high",
};

export const POLITICAL_DYSFUNCTION_GLOBAL_FOSSIL_FUEL_SUBSIDIES: Parameter = {
  value: 1300000000000.0,
  parameterName: "POLITICAL_DYSFUNCTION_GLOBAL_FOSSIL_FUEL_SUBSIDIES",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-political_dysfunction_global_fossil_fuel_subsidies",
  unit: "USD",
  displayName: "Global Fossil Fuel Subsidies",
  description: "Global explicit fossil fuel subsidies (governments undercharging for energy supply costs). IMF 2022 estimate. These subsidies actively encourage consumption of negative-externality goods, working against climate goals. Note: IMF implicit subsidies (externalities) are much larger (~$7T).",
  sourceType: "external",
  sourceRef: "political-dysfunction-tax-paper-2025",
  sourceUrl: "https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html",
  confidence: "high",
  confidenceInterval: [1100000000000.0, 1500000000000.0],
  stdError: 100000000000.0,
};

export const POLITICAL_DYSFUNCTION_GLOBAL_HEALTH_OPPORTUNITY_COST: Parameter = {
  value: 34000000000000.0,
  parameterName: "POLITICAL_DYSFUNCTION_GLOBAL_HEALTH_OPPORTUNITY_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-political_dysfunction_global_health_opportunity_cost",
  unit: "USD",
  displayName: "Global Health Opportunity Cost",
  description: "Annual opportunity cost of slow-motion regulatory environment for health innovation. Murphy-Topel (2006) valued cancer cure at $50T (inflation-adjusted ~$100T in 2025). Longevity dividend of 1 extra year = $38T globally. PCTs could accelerate cures by 10+ years; NPV of 10-year delay at 3% discount = ~$25T. Conservative estimate: $34T annually in lives lost and healthspan denied.",
  sourceType: "external",
  sourceRef: "political-dysfunction-tax-paper-2025",
  sourceUrl: "https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html",
  confidence: "low",
  confidenceInterval: [20000000000000.0, 80000000000000.0],
  stdError: 15000000000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/political-dysfunction-tax.html",
  manualPageTitle: "The Political Dysfunction Tax",
};

export const POLITICAL_DYSFUNCTION_GLOBAL_LEAD_OPPORTUNITY_COST: Parameter = {
  value: 6000000000000.0,
  parameterName: "POLITICAL_DYSFUNCTION_GLOBAL_LEAD_OPPORTUNITY_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-political_dysfunction_global_lead_opportunity_cost",
  unit: "USD",
  displayName: "Global Lead Poisoning Cost",
  description: "Global cost of lead exposure: World Bank/Lancet estimate. 765 million IQ points lost annually, 5.5 million premature CVD deaths. Cost to eliminate lead from paint, spices, batteries is trivial compared to damage. This is an arbitrage opportunity of immense scale that governance has failed to execute.",
  sourceType: "external",
  sourceRef: "political-dysfunction-tax-paper-2025",
  sourceUrl: "https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html",
  confidence: "high",
  confidenceInterval: [4000000000000.0, 8000000000000.0],
  stdError: 1000000000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/political-dysfunction-tax.html",
  manualPageTitle: "The Political Dysfunction Tax",
};

export const POLITICAL_DYSFUNCTION_GLOBAL_MIGRATION_OPPORTUNITY_COST: Parameter = {
  value: 57000000000000.0,
  parameterName: "POLITICAL_DYSFUNCTION_GLOBAL_MIGRATION_OPPORTUNITY_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-political_dysfunction_global_migration_opportunity_cost",
  unit: "USD",
  displayName: "Global Migration Opportunity Cost",
  description: "Unrealized output from migration restrictions. Clemens (2011) calculated eliminating labor mobility barriers could increase global GDP by 50-150%. At $115T global GDP, lower bound = $57T; upper bound = $170T. Even 5% workforce mobility would generate trillions, exceeding all foreign aid ever given. This is the largest single distortion in the global economy.",
  sourceType: "external",
  sourceRef: "political-dysfunction-tax-paper-2025",
  sourceUrl: "https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html",
  confidence: "low",
  confidenceInterval: [57000000000000.0, 170000000000000.0],
  stdError: 30000000000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/political-dysfunction-tax.html",
  manualPageTitle: "The Political Dysfunction Tax",
};

export const POLITICAL_DYSFUNCTION_GLOBAL_SCIENCE_OPPORTUNITY_COST: Parameter = {
  value: 4000000000000.0,
  parameterName: "POLITICAL_DYSFUNCTION_GLOBAL_SCIENCE_OPPORTUNITY_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-political_dysfunction_global_science_opportunity_cost",
  unit: "USD",
  displayName: "Global Science Opportunity Cost",
  description: "Annual opportunity cost from underfunding high-ROI science (fusion, AI safety). Human Genome Project: $3.8B cost, $796B-1T impact (141:1 ROI). Fusion DEMO plant: $5-10B could solve energy/climate permanently. AI safety: <5% of capabilities spending despite existential stakes. Reallocating $200B from military waste at 20x multiplier = $4T foregone growth.",
  sourceType: "external",
  sourceRef: "political-dysfunction-tax-paper-2025",
  sourceUrl: "https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html",
  confidence: "low",
  confidenceInterval: [2000000000000.0, 10000000000000.0],
  stdError: 2000000000000.0,
};

export const POLITICAL_SUCCESS_PROBABILITY: Parameter = {
  value: 0.01,
  parameterName: "POLITICAL_SUCCESS_PROBABILITY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-political_success_probability",
  unit: "rate",
  displayName: "Political Success Probability",
  description: "Estimated probability of treaty ratification and sustained implementation. Central estimate 1% is conservative. This assumes 99% chance of failure. ",
  sourceType: "external",
  sourceRef: "icbl-ottawa-treaty",
  sourceUrl: "https://www.icrc.org/en/doc/resources/documents/article/other/57jpjn.htm",
  confidence: "low",
  confidenceInterval: [0.001, 0.1],
  stdError: 0.02,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const POLITICIAN_POST_OFFICE_CAREER_VALUE: Parameter = {
  value: 10000000.0,
  parameterName: "POLITICIAN_POST_OFFICE_CAREER_VALUE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-politician_post_office_career_value",
  unit: "USD",
  displayName: "Post-Office Career Value (per politician)",
  description: "Net present value of post-office career premium for average congressperson (10 years x $1M/year premium). Based on documented cases: Gephardt $7M/year, Daschle $2M+/year.",
  sourceType: "external",
  sourceRef: "opensecrets-revolving-door",
  sourceUrl: "https://www.opensecrets.org/revolving-door",
  confidence: "medium",
  confidenceInterval: [5000000.0, 20000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/cost-of-change-analysis.html",
  manualPageTitle: "The Price of Political Change: A Cost-Benefit Framework for Policy Incentivization",
};

export const POST_1962_DRUG_APPROVAL_REDUCTION_PCT: Parameter = {
  value: 0.7,
  parameterName: "POST_1962_DRUG_APPROVAL_REDUCTION_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-post_1962_drug_approval_reduction_pct",
  unit: "percentage",
  displayName: "Post-1962 Drug Approval Reduction",
  description: "Reduction in new drug approvals after 1962 Kefauver-Harris Amendment (70% drop from 43→17 drugs/year)",
  sourceType: "external",
  sourceRef: "post-1962-drug-approval-drop",
  sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7245331/",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const PRE_1962_DRUG_DEVELOPMENT_COST_1980_USD: Parameter = {
  value: 6500000.0,
  parameterName: "PRE_1962_DRUG_DEVELOPMENT_COST_1980_USD",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-pre_1962_drug_development_cost_1980_usd",
  unit: "USD_1980",
  displayName: "Pre-1962 Drug Development Cost (1980 Dollars)",
  description: "Average drug development cost before 1962 FDA efficacy regulations, adjusted to 1980 dollars (Baily 1972)",
  sourceType: "external",
  sourceRef: "pre-1962-drug-costs-baily-1972",
  sourceUrl: "https://samizdathealth.org/wp-content/uploads/2020/12/hlthaff.1.2.6.pdf",
  confidence: "high",
  confidenceInterval: [5200000.0, 7800000.0],
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/drug-development-cost-analysis.html",
  manualPageTitle: "Drug Development Cost Increase Analysis",
};

export const PRE_1962_DRUG_DEVELOPMENT_COST_2024_USD: Parameter = {
  value: 24700000.0,
  parameterName: "PRE_1962_DRUG_DEVELOPMENT_COST_2024_USD",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-pre_1962_drug_development_cost_2024_usd",
  unit: "USD",
  displayName: "Pre-1962 Drug Development Cost (2024 Dollars)",
  description: "Pre-1962 drug development cost adjusted to 2024 dollars ($6.5M × 3.80 = $24.7M, CPI-adjusted from Baily 1972)",
  sourceType: "external",
  sourceRef: "pre-1962-drug-costs-baily-1972",
  sourceUrl: "https://samizdathealth.org/wp-content/uploads/2020/12/hlthaff.1.2.6.pdf",
  confidence: "high",
  confidenceInterval: [19500000.0, 30000000.0],
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/drug-development-cost-analysis.html",
  manualPageTitle: "Drug Development Cost Increase Analysis",
};

export const PRE_1962_PHYSICIAN_COUNT: Parameter = {
  value: 144000.0,
  parameterName: "PRE_1962_PHYSICIAN_COUNT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-pre_1962_physician_count",
  unit: "physicians",
  displayName: "Pre-1962 Physician Count (Unverified)",
  description: "Estimated physicians conducting real-world efficacy trials pre-1962 (unverified estimate)",
  sourceType: "external",
  sourceRef: "pre-1962-physician-trials",
  sourceUrl: "https://thinkbynumbers.org/health/how-many-net-lives-does-the-fda-save/",
  confidence: "low",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/real-world-evidence-historical-success.html",
  manualPageTitle: "Real-World Evidence Historical Success (Pre-1962)",
};

export const RARE_DISEASES_COUNT_GLOBAL: Parameter = {
  value: 7000.0,
  parameterName: "RARE_DISEASES_COUNT_GLOBAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-rare_diseases_count_global",
  unit: "diseases",
  displayName: "Total Number of Rare Diseases Globally",
  description: "Total number of rare diseases globally",
  sourceType: "external",
  sourceRef: "95-pct-diseases-no-treatment",
  sourceUrl: "https://www.gao.gov/products/gao-25-106774",
  confidence: "high",
  confidenceInterval: [6000.0, 10000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const RECOVERY_TRIAL_COST_PER_PATIENT: Parameter = {
  value: 500.0,
  parameterName: "RECOVERY_TRIAL_COST_PER_PATIENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-recovery_trial_cost_per_patient",
  unit: "USD/patient",
  displayName: "Recovery Trial Cost per Patient",
  description: "RECOVERY trial cost per patient. Note: RECOVERY was an outlier - hospital-based during COVID emergency, minimal extra procedures, existing NHS infrastructure, streamlined consent. Replicating this globally will be harder.",
  sourceType: "external",
  sourceRef: "recovery-cost-500",
  sourceUrl: "https://manhattan.institute/article/slow-costly-clinical-trials-drag-down-biomedical-breakthroughs",
  confidence: "high",
  confidenceInterval: [400.0, 2500.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const RECOVERY_TRIAL_GLOBAL_LIVES_SAVED: Parameter = {
  value: 1000000.0,
  parameterName: "RECOVERY_TRIAL_GLOBAL_LIVES_SAVED",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-recovery_trial_global_lives_saved",
  unit: "lives",
  displayName: "RECOVERY Trial Global Lives Saved",
  description: "Estimated lives saved globally by RECOVERY trial's dexamethasone discovery. NHS England estimate (March 2021). Based on Águas et al. Nature Communications 2021 methodology applying RECOVERY trial mortality reductions (36% ventilated, 18% oxygen) to global COVID hospitalizations. Wide uncertainty range reflects extrapolation assumptions.",
  sourceType: "external",
  sourceRef: "recovery-trial-1m-lives-saved",
  sourceUrl: "https://www.england.nhs.uk/2021/03/covid-treatment-developed-in-the-nhs-saves-a-million-lives/",
  confidence: "medium",
  confidenceInterval: [500000.0, 2000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/nih-fails-2-institute-health.html",
  manualPageTitle: "NIH Fails to Institute Health",
};

export const RECOVERY_TRIAL_TOTAL_COST: Parameter = {
  value: 20000000.0,
  parameterName: "RECOVERY_TRIAL_TOTAL_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-recovery_trial_total_cost",
  unit: "USD",
  displayName: "RECOVERY Trial Total Cost",
  description: "Total cost of UK RECOVERY trial. Enrolled tens of thousands of patients across multiple treatment arms. Discovered dexamethasone reduces COVID mortality by ~1/3 in severe cases.",
  sourceType: "external",
  sourceRef: "recovery-trial-82x-cost-reduction",
  sourceUrl: "https://manhattan.institute/article/slow-costly-clinical-trials-drag-down-biomedical-breakthroughs",
  confidence: "high",
  confidenceInterval: [15000000.0, 25000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/nih-fails-2-institute-health.html",
  manualPageTitle: "NIH Fails to Institute Health",
};

export const REGULATORY_DELAY_MEAN_AGE_OF_DEATH: Parameter = {
  value: 62.0,
  parameterName: "REGULATORY_DELAY_MEAN_AGE_OF_DEATH",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-regulatory_delay_mean_age_of_death",
  unit: "years",
  displayName: "Mean Age of Preventable Death from Post-Safety Efficacy Delay",
  description: "Mean age of preventable death from post-safety efficacy testing regulatory delay (Phase 2-4)",
  sourceType: "external",
  sourceRef: "who-global-health-estimates-2024",
  sourceUrl: "https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates",
  confidence: "medium",
  stdError: 3.0,
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const REGULATORY_DELAY_SUFFERING_PERIOD_YEARS: Parameter = {
  value: 6.0,
  parameterName: "REGULATORY_DELAY_SUFFERING_PERIOD_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-regulatory_delay_suffering_period_years",
  unit: "years",
  displayName: "Pre-Death Suffering Period During Post-Safety Efficacy Delay",
  description: "Pre-death suffering period during post-safety efficacy testing delay (average years lived with untreated condition while awaiting Phase 2-4 completion)",
  sourceType: "external",
  sourceRef: "who-global-health-estimates-2024",
  sourceUrl: "https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates",
  confidence: "medium",
  confidenceInterval: [4.0, 9.0],
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const SEPT_11_DEATHS: Parameter = {
  value: 2977.0,
  parameterName: "SEPT_11_DEATHS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-sept_11_deaths",
  unit: "people",
  displayName: "September 11 Deaths",
  description: "Total deaths in the September 11, 2001 attacks. 2,977 victims (excluding 19 hijackers). Used as a reference point for scale comparisons.",
  sourceType: "external",
  sourceRef: "september-11-memorial",
  sourceUrl: "https://www.911memorial.org/911-faqs",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const SINGAPORE_GDP_PER_CAPITA_PPP: Parameter = {
  value: 105000.0,
  parameterName: "SINGAPORE_GDP_PER_CAPITA_PPP",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-singapore_gdp_per_capita_ppp",
  unit: "USD",
  displayName: "Singapore GDP per Capita (PPP)",
  description: "Singapore GDP per capita (PPP-adjusted). Among highest in world, demonstrating that lean government can coexist with prosperity.",
  sourceType: "external",
  sourceRef: "worldbank-singapore-gdp",
  sourceUrl: "https://data.worldbank.org/country/singapore",
  confidence: "high",
};

export const SINGAPORE_GOVT_SPENDING_PCT_GDP: Parameter = {
  value: 15.0,
  parameterName: "SINGAPORE_GOVT_SPENDING_PCT_GDP",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-singapore_govt_spending_pct_gdp",
  unit: "percent",
  displayName: "Singapore Govt Spending (% GDP)",
  description: "Singapore government spending as percentage of GDP. Less than HALF the US rate (15% vs 38%) yet achieves excellent outcomes through efficiency.",
  sourceType: "external",
  sourceRef: "imf-singapore-spending",
  sourceUrl: "https://www.imf.org/en/Countries/SGP",
  confidence: "high",
};

export const SINGAPORE_LIFE_EXPECTANCY: Parameter = {
  value: 84.1,
  parameterName: "SINGAPORE_LIFE_EXPECTANCY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-singapore_life_expectancy",
  unit: "years",
  displayName: "Singapore Life Expectancy",
  description: "Singapore life expectancy at birth. 6.6 years LONGER than US (84.1 vs 77.5) despite government spending at less than half the rate.",
  sourceType: "external",
  sourceRef: "who-life-expectancy",
  sourceUrl: "https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates/ghe-life-expectancy-and-healthy-life-expectancy",
  confidence: "high",
};

export const SMALLPOX_ERADICATION_ROI: Parameter = {
  value: 280.0,
  parameterName: "SMALLPOX_ERADICATION_ROI",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-smallpox_eradication_roi",
  unit: "ratio",
  displayName: "Return on Investment from Smallpox Eradication Campaign",
  description: "Return on investment from smallpox eradication campaign",
  sourceType: "external",
  sourceRef: "smallpox-eradication-roi",
  sourceUrl: "https://www.csis.org/analysis/smallpox-eradication-model-global-cooperation",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const SMALLPOX_ERADICATION_TOTAL_BENEFIT: Parameter = {
  value: 1420000000.0,
  parameterName: "SMALLPOX_ERADICATION_TOTAL_BENEFIT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-smallpox_eradication_total_benefit",
  unit: "USD",
  displayName: "Total Economic Benefit from Smallpox Eradication Campaign",
  description: "Total economic benefit from smallpox eradication campaign",
  sourceType: "external",
  sourceRef: "smallpox-eradication-roi",
  sourceUrl: "https://www.csis.org/analysis/smallpox-eradication-model-global-cooperation",
  confidence: "high",
};

export const SMOKING_CESSATION_ANNUAL_BENEFIT: Parameter = {
  value: 12000000000.0,
  parameterName: "SMOKING_CESSATION_ANNUAL_BENEFIT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-smoking_cessation_annual_benefit",
  unit: "USD/year",
  displayName: "Estimated Annual Global Economic Benefit from Smoking Cessation Programs",
  description: "Estimated annual global economic benefit from smoking cessation programs",
  sourceType: "external",
  sourceRef: "life-expectancy-gains-smoking-reduction",
  sourceUrl: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1447499/",
  confidence: "high",
};

export const STANDARD_ECONOMIC_QALY_VALUE_USD: Parameter = {
  value: 150000.0,
  parameterName: "STANDARD_ECONOMIC_QALY_VALUE_USD",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-standard_economic_qaly_value_usd",
  unit: "USD/QALY",
  displayName: "Standard Economic Value per QALY",
  description: "Standard economic value per QALY",
  sourceType: "external",
  sourceRef: "qaly-value",
  sourceUrl: "https://icer.org/wp-content/uploads/2024/02/Reference-Case-4.3.25.pdf",
  confidence: "high",
  stdError: 30000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const STANDARD_QALYS_PER_LIFE_SAVED: Parameter = {
  value: 35.0,
  parameterName: "STANDARD_QALYS_PER_LIFE_SAVED",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-standard_qalys_per_life_saved",
  unit: "QALYs/life",
  displayName: "Standard QALYs per Life Saved",
  description: "Standard QALYs per life saved (WHO life tables)",
  sourceType: "external",
  sourceRef: "qaly-value",
  sourceUrl: "https://icer.org/wp-content/uploads/2024/02/Reference-Case-4.3.25.pdf",
  confidence: "high",
  stdError: 7.0,
};

export const SUGAR_SUBSIDY_COST_PER_PERSON_ANNUAL: Parameter = {
  value: 10.0,
  parameterName: "SUGAR_SUBSIDY_COST_PER_PERSON_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-sugar_subsidy_cost_per_person_annual",
  unit: "USD/person/year",
  displayName: "Annual Cost of Sugar Subsidies per Person",
  description: "Annual cost of sugar subsidies per person",
  sourceType: "external",
  sourceRef: "sugar-subsidies-cost",
  sourceUrl: "https://www.gao.gov/products/gao-24-106144",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/unrepresentative-democracy.html",
  manualPageTitle: "Unrepresentative Democracy",
};

export const SWITZERLAND_DEFENSE_SPENDING_PCT: Parameter = {
  value: 0.007,
  parameterName: "SWITZERLAND_DEFENSE_SPENDING_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-switzerland_defense_spending_pct",
  unit: "rate",
  displayName: "Switzerland's Defense Spending as Percentage of GDP",
  description: "Switzerland's defense spending as percentage of GDP (0.7%)",
  sourceType: "external",
  sourceRef: "swiss-military-budget-0-7-pct-gdp",
  sourceUrl: "https://data.worldbank.org/indicator/MS.MIL.XPND.GD.ZS?locations=CH",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem.html",
  manualPageTitle: "Diagnostic Summary",
};

export const SWITZERLAND_GDP_PER_CAPITA_K: Parameter = {
  value: 93000.0,
  parameterName: "SWITZERLAND_GDP_PER_CAPITA_K",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-switzerland_gdp_per_capita_k",
  unit: "USD",
  displayName: "Switzerland GDP per Capita",
  description: "Switzerland GDP per capita",
  sourceType: "external",
  sourceRef: "swiss-vs-us-gdp-per-capita",
  sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.PCAP.CD?locations=CH",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem.html",
  manualPageTitle: "Diagnostic Summary",
};

export const SWITZERLAND_GOVT_SPENDING_PCT_GDP: Parameter = {
  value: 35.0,
  parameterName: "SWITZERLAND_GOVT_SPENDING_PCT_GDP",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-switzerland_govt_spending_pct_gdp",
  unit: "percent",
  displayName: "Switzerland Govt Spending (% GDP)",
  description: "Switzerland government spending as percentage of GDP. 3 percentage points LOWER than US (35% vs 38%) yet achieves dramatically better outcomes.",
  sourceType: "external",
  sourceRef: "oecd-govt-spending",
  sourceUrl: "https://data.oecd.org/gga/general-government-spending.htm",
  confidence: "high",
};

export const SWITZERLAND_LIFE_EXPECTANCY: Parameter = {
  value: 84.0,
  parameterName: "SWITZERLAND_LIFE_EXPECTANCY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-switzerland_life_expectancy",
  unit: "years",
  displayName: "Switzerland Life Expectancy",
  description: "Switzerland life expectancy at birth. 6.5 years LONGER than US (84.0 vs 77.5) despite lower government spending as % of GDP.",
  sourceType: "external",
  sourceRef: "who-life-expectancy",
  sourceUrl: "https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates/ghe-life-expectancy-and-healthy-life-expectancy",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/faq.html",
  manualPageTitle: "Frequently Asked Objections",
};

export const SWITZERLAND_MEDIAN_INCOME_PPP: Parameter = {
  value: 65000.0,
  parameterName: "SWITZERLAND_MEDIAN_INCOME_PPP",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-switzerland_median_income_ppp",
  unit: "USD",
  displayName: "Switzerland Median Income (PPP)",
  description: "Switzerland median household income (PPP-adjusted). Higher than US when adjusted for cost of healthcare and other expenses.",
  sourceType: "external",
  sourceRef: "oecd-median-income",
  sourceUrl: "https://data.oecd.org/hha/household-disposable-income.htm",
  confidence: "medium",
};

export const TERRORISM_DEATHS_911: Parameter = {
  value: 2996.0,
  parameterName: "TERRORISM_DEATHS_911",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-terrorism_deaths_911",
  unit: "deaths",
  displayName: "Deaths from 9/11 Terrorist Attacks",
  description: "Deaths from 9/11 terrorist attacks",
  sourceType: "external",
  sourceRef: "chance-of-dying-from-terrorism-1-in-30m",
  sourceUrl: "https://www.cato.org/policy-analysis/terrorism-immigration-risk-analysis",
  confidence: "high",
};

export const THALIDOMIDE_CASES_WORLDWIDE: Parameter = {
  value: 15000.0,
  parameterName: "THALIDOMIDE_CASES_WORLDWIDE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-thalidomide_cases_worldwide",
  unit: "cases",
  displayName: "Thalidomide Cases Worldwide",
  description: "Total thalidomide birth defect cases worldwide (1957-1962)",
  sourceType: "external",
  sourceRef: "thalidomide-scandal",
  sourceUrl: "https://en.wikipedia.org/wiki/Thalidomide_scandal",
  confidence: "medium",
  confidenceInterval: [10000.0, 20000.0],
};

export const THALIDOMIDE_DISABILITY_WEIGHT: Parameter = {
  value: 0.4,
  parameterName: "THALIDOMIDE_DISABILITY_WEIGHT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-thalidomide_disability_weight",
  unit: "ratio",
  displayName: "Thalidomide Disability Weight",
  description: "Disability weight for thalidomide survivors (limb deformities, organ damage)",
  sourceType: "external",
  sourceRef: "thalidomide-survivors-health",
  sourceUrl: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0210222",
  confidence: "medium",
  confidenceInterval: [0.32, 0.48],
};

export const THALIDOMIDE_MORTALITY_RATE: Parameter = {
  value: 0.4,
  parameterName: "THALIDOMIDE_MORTALITY_RATE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-thalidomide_mortality_rate",
  unit: "percentage",
  displayName: "Thalidomide Mortality Rate",
  description: "Mortality rate for thalidomide-affected infants (died within first year)",
  sourceType: "external",
  sourceRef: "thalidomide-scandal",
  sourceUrl: "https://en.wikipedia.org/wiki/Thalidomide_scandal",
  confidence: "high",
  confidenceInterval: [0.35, 0.45],
};

export const THALIDOMIDE_SURVIVOR_LIFESPAN: Parameter = {
  value: 60.0,
  parameterName: "THALIDOMIDE_SURVIVOR_LIFESPAN",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-thalidomide_survivor_lifespan",
  unit: "years",
  displayName: "Thalidomide Survivor Lifespan",
  description: "Average lifespan for thalidomide survivors",
  sourceType: "external",
  sourceRef: "thalidomide-survivors-health",
  sourceUrl: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0210222",
  confidence: "medium",
  confidenceInterval: [50.0, 70.0],
};

export const THALIDOMIDE_US_POPULATION_SHARE_1960: Parameter = {
  value: 0.06,
  parameterName: "THALIDOMIDE_US_POPULATION_SHARE_1960",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-thalidomide_us_population_share_1960",
  unit: "percentage",
  displayName: "US Population Share 1960",
  description: "US share of world population in 1960",
  sourceType: "external",
  sourceRef: "us-census-world-population-1960",
  sourceUrl: "https://www.census.gov/data/tables/time-series/demo/international-programs/historical-est-worldpop.html",
  confidence: "high",
  confidenceInterval: [0.055, 0.065],
};

export const TRADITIONAL_PHASE3_COST_PER_PATIENT: Parameter = {
  value: 41000.0,
  parameterName: "TRADITIONAL_PHASE3_COST_PER_PATIENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-traditional_phase3_cost_per_patient",
  unit: "USD/patient",
  displayName: "Phase 3 Cost per Patient",
  description: "Phase 3 cost per patient (median from FDA study)",
  sourceType: "external",
  sourceRef: "trial-costs-fda-study",
  sourceUrl: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6248200/",
  confidence: "high",
  confidenceInterval: [20000.0, 120000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const TREATMENT_DISABILITY_REDUCTION: Parameter = {
  value: 0.25,
  parameterName: "TREATMENT_DISABILITY_REDUCTION",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treatment_disability_reduction",
  unit: "weight",
  displayName: "Treatment Disability Reduction",
  description: "Average disability weight reduction from pharmaceutical treatment. Untreated chronic disease averages 0.35 disability weight, treated disease averages 0.10, difference is 0.25.",
  sourceType: "external",
  sourceRef: "gbd-disability-weights",
  sourceUrl: "https://ghdx.healthdata.org/record/ihme-data/gbd-2019-disability-weights",
  confidence: "medium",
  confidenceInterval: [0.15, 0.35],
  peerReviewed: true,
};

export const US_ALZHEIMERS_ANNUAL_COST: Parameter = {
  value: 355000000000.0,
  parameterName: "US_ALZHEIMERS_ANNUAL_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_alzheimers_annual_cost",
  unit: "USD",
  displayName: "US Alzheimer's Annual Cost",
  description: "Annual US cost of Alzheimer's disease (direct and indirect)",
  sourceType: "external",
  sourceRef: "disease-cost-alzheimers-1300b",
  sourceUrl: "https://www.who.int/news-room/fact-sheets/detail/dementia",
  confidence: "high",
  confidenceInterval: [302000000000.0, 408000000000.0],
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/aligning-incentives.html",
  manualPageTitle: "Aligning Incentives",
};

export const US_CANCER_ANNUAL_COST: Parameter = {
  value: 208000000000.0,
  parameterName: "US_CANCER_ANNUAL_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_cancer_annual_cost",
  unit: "USD",
  displayName: "US Cancer Annual Cost",
  description: "Annual US cost of cancer (direct and indirect)",
  sourceType: "external",
  sourceRef: "disease-cost-cancer-1800b",
  sourceUrl: "https://jamanetwork.com/journals/jamaoncology/fullarticle/2801798",
  confidence: "high",
  confidenceInterval: [177000000000.0, 239000000000.0],
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/aligning-incentives.html",
  manualPageTitle: "Aligning Incentives",
};

export const US_CHRONIC_DISEASE_SPENDING_ANNUAL: Parameter = {
  value: 4100000000000.0,
  parameterName: "US_CHRONIC_DISEASE_SPENDING_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_chronic_disease_spending_annual",
  unit: "USD/year",
  displayName: "US Annual Chronic Disease Spending",
  description: "US annual chronic disease spending",
  sourceType: "external",
  sourceRef: "us-chronic-disease-spending",
  sourceUrl: "https://www.cdc.gov/chronic-disease/data-research/facts-stats/index.html",
  confidence: "high",
  confidenceInterval: [3300000000000.0, 5000000000000.0],
};

export const US_DIABETES_ANNUAL_COST: Parameter = {
  value: 327000000000.0,
  parameterName: "US_DIABETES_ANNUAL_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_diabetes_annual_cost",
  unit: "USD",
  displayName: "US Diabetes Annual Cost",
  description: "Annual US cost of diabetes (direct and indirect)",
  sourceType: "external",
  sourceRef: "disease-cost-diabetes-1500b",
  sourceUrl: "https://diabetesjournals.org/care/article/41/5/963/36522/Global-Economic-Burden-of-Diabetes-in-Adults",
  confidence: "high",
  confidenceInterval: [278000000000.0, 376000000000.0],
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/aligning-incentives.html",
  manualPageTitle: "Aligning Incentives",
};

export const US_FEDERAL_SPENDING_2024: Parameter = {
  value: 6800000000000.0,
  parameterName: "US_FEDERAL_SPENDING_2024",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_federal_spending_2024",
  unit: "USD",
  displayName: "US Federal Spending (FY2024)",
  description: "US federal government spending in FY2024. CBO reports outlays of $6.8T (23.9% of GDP). Includes mandatory spending, discretionary spending, and net interest ($888B).",
  sourceType: "external",
  sourceRef: "cbo-long-term-budget-2024",
  sourceUrl: "https://www.cbo.gov/publication/60039",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_FED_DISCRETIONARY_SPENDING_2024: Parameter = {
  value: 1700000000000.0,
  parameterName: "US_FED_DISCRETIONARY_SPENDING_2024",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_fed_discretionary_spending_2024",
  unit: "USD",
  displayName: "US Federal Discretionary Spending (FY2024)",
  description: "US federal discretionary spending in FY2024. Approximately $886B defense + ~$814B non-defense discretionary = ~$1.7T. Used as denominator for discretionary efficiency rating (Cat 1 waste items are discretionary/fungible).",
  sourceType: "external",
  sourceRef: "cbo-long-term-budget-2024",
  sourceUrl: "https://www.cbo.gov/publication/60039",
  confidence: "high",
};

export const US_GDP_2024: Parameter = {
  value: 28780000000000.0,
  parameterName: "US_GDP_2024",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gdp_2024",
  unit: "USD",
  displayName: "US GDP (2024)",
  description: "US GDP in 2024 dollars for calculating policy costs as percentage of GDP.",
  sourceType: "external",
  sourceRef: "worldbank-gdp",
  sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=US",
  confidence: "high",
};

export const US_GOVT_SPENDING_PCT_GDP: Parameter = {
  value: 38.0,
  parameterName: "US_GOVT_SPENDING_PCT_GDP",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_govt_spending_pct_gdp",
  unit: "percent",
  displayName: "US Govt Spending (% GDP)",
  description: "US total government spending as percentage of GDP (federal + state + local). OECD average is ~40%, but US gets worse outcomes for similar spending.",
  sourceType: "external",
  sourceRef: "oecd-govt-spending",
  sourceUrl: "https://data.oecd.org/gga/general-government-spending.htm",
  confidence: "high",
};

export const US_GOV_WASTE_AGRICULTURAL_SUBSIDIES: Parameter = {
  value: 75000000000.0,
  parameterName: "US_GOV_WASTE_AGRICULTURAL_SUBSIDIES",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_agricultural_subsidies",
  unit: "USD",
  displayName: "Agricultural Subsidies Deadweight Loss",
  description: "Deadweight loss from US agricultural subsidies. Direct subsidies ~$30B/yr but create larger distortions: overproduction, environmental damage, benefits concentrated in large farms (top 10% receive 78% of subsidies). Total welfare loss ~$75B. Textbook example of capture; very high economist consensus. [CATEGORY 1: Direct Spending]",
  sourceType: "external",
  sourceRef: "ewg-farm-subsidies",
  sourceUrl: "https://farm.ewg.org/",
  confidence: "high",
  confidenceInterval: [50000000000.0, 120000000000.0],
  stdError: 25000000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_CORPORATE_WELFARE: Parameter = {
  value: 181000000000.0,
  parameterName: "US_GOV_WASTE_CORPORATE_WELFARE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_corporate_welfare",
  unit: "USD",
  displayName: "Corporate Welfare Waste",
  description: "Direct US federal corporate welfare: subsidies to agriculture ($16.4B), green energy tax credits, semiconductor aid, aviation support. Agricultural subsidies are highly regressive (top 10% receive 63%). Cato Institute forensic tally. [CATEGORY 1: Direct Spending]",
  sourceType: "external",
  sourceRef: "political-dysfunction-tax-paper-2025",
  sourceUrl: "https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html",
  confidence: "high",
  confidenceInterval: [150000000000.0, 220000000000.0],
  stdError: 20000000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_DRUG_WAR: Parameter = {
  value: 90000000000.0,
  parameterName: "US_GOV_WASTE_DRUG_WAR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_drug_war",
  unit: "USD",
  displayName: "Drug War Cost",
  description: "Annual cost of drug war: ~$41B federal drug control budget, ~$10B state/local enforcement, ~$40B incarceration and lost productivity. After 50+ years and $1T+ spent, drug use is higher than ever. [CATEGORY 1: Direct Spending]",
  sourceType: "external",
  sourceRef: "drugpolicyalliance2021",
  sourceUrl: "https://drugpolicy.org/drug-war-stats/",
  confidence: "medium",
  confidenceInterval: [60000000000.0, 150000000000.0],
  stdError: 30000000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_FOSSIL_FUEL_SUBSIDIES: Parameter = {
  value: 50000000000.0,
  parameterName: "US_GOV_WASTE_FOSSIL_FUEL_SUBSIDIES",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_fossil_fuel_subsidies",
  unit: "USD",
  displayName: "Fossil Fuel Subsidies (Explicit)",
  description: "US explicit fossil fuel subsidies (direct payments, tax breaks). IMF estimates US total subsidies at $649B but ~92% is implicit (externalities). This figure includes only explicit subsidies (~$50B) for defensibility. [CATEGORY 1: Direct Spending]",
  sourceType: "external",
  sourceRef: "imf-fossilfuel2023",
  sourceUrl: "https://www.imf.org/en/Blogs/Articles/2023/08/24/fossil-fuel-subsidies-surged-to-record-7-trillion",
  confidence: "medium",
  confidenceInterval: [30000000000.0, 80000000000.0],
  stdError: 15000000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_HEALTHCARE_INEFFICIENCY: Parameter = {
  value: 1200000000000.0,
  parameterName: "US_GOV_WASTE_HEALTHCARE_INEFFICIENCY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_healthcare_inefficiency",
  unit: "USD",
  displayName: "Healthcare System Inefficiency",
  description: "US healthcare spending inefficiency. US spends ~$4.5T/yr (18% GDP) vs 9-11% in comparable OECD countries with similar/better outcomes. Papanicolas et al. (2018 JAMA) and multiple studies document $1-1.5T in excess spending from administrative complexity, high prices, and poor care coordination. Very high economist consensus. [CATEGORY 4: System Inefficiency]",
  sourceType: "external",
  sourceRef: "papanicolas2018",
  sourceUrl: "https://jamanetwork.com/journals/jama/article-abstract/2674671",
  confidence: "high",
  confidenceInterval: [1000000000000.0, 1500000000000.0],
  stdError: 150000000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_HOUSING_ZONING: Parameter = {
  value: 1400000000000.0,
  parameterName: "US_GOV_WASTE_HOUSING_ZONING",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_housing_zoning",
  unit: "USD",
  displayName: "Housing/Zoning Restrictions Cost",
  description: "GDP loss from housing/zoning restrictions. Original Hsieh-Moretti (2019 AEJ:Macro) estimate of 36% GDP growth reduction was substantially revised by Greaney (2023). Current $1.4T represents a moderate estimate; revised lower bound implies ~$500B. [CATEGORY 3: GDP Loss]",
  sourceType: "external",
  sourceRef: "hsieh-moretti2019",
  sourceUrl: "https://www.aeaweb.org/articles?id=10.1257/mac.20170388",
  confidence: "medium",
  confidenceInterval: [500000000000.0, 2000000000000.0],
  stdError: 300000000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_MILITARY_OVERSPEND: Parameter = {
  value: 615000000000.0,
  parameterName: "US_GOV_WASTE_MILITARY_OVERSPEND",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_military_overspend",
  unit: "USD",
  displayName: "Military Overspend",
  description: "US military spending above 'Strict Deterrence' baseline. Current budget ~$900B supports global power projection (750+ bases). Strict Deterrence (nuclear triad $95B, Coast Guard $14B, National Guard $33B, Missile Defense $28B, Cyber $15B, defensive Navy/Air Force $100B) = ~$285B. Delta: $900B - $285B = $615B 'Hegemony Tax'. [CATEGORY 1: Direct Spending]",
  sourceType: "external",
  sourceRef: "political-dysfunction-tax-paper-2025",
  sourceUrl: "https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html",
  confidence: "medium",
  confidenceInterval: [500000000000.0, 750000000000.0],
  stdError: 75000000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_REGULATORY_RED_TAPE: Parameter = {
  value: 580000000000.0,
  parameterName: "US_GOV_WASTE_REGULATORY_RED_TAPE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_regulatory_red_tape",
  unit: "USD",
  displayName: "Regulatory Red Tape Waste",
  description: "Deadweight loss from US regulatory red tape (procedural friction without safety benefits). Competitive Enterprise Institute estimates total regulatory burden at $2.15T; European studies find red tape costs 0.1-4% of GDP. Conservative estimate: ~2% of US GDP = $580B. [CATEGORY 2: Compliance Burden]",
  sourceType: "external",
  sourceRef: "political-dysfunction-tax-paper-2025",
  sourceUrl: "https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html",
  confidence: "medium",
  confidenceInterval: [290000000000.0, 1000000000000.0],
  stdError: 200000000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_TARIFFS: Parameter = {
  value: 160000000000.0,
  parameterName: "US_GOV_WASTE_TARIFFS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_tariffs",
  unit: "USD",
  displayName: "Tariff Cost (GDP Loss)",
  description: "Annual GDP reduction from US tariffs and retaliation. Yale Budget Lab estimates 0.6% smaller GDP in long run, equivalent to $160B annually. Trade barriers reduce efficiency and raise consumer prices. [CATEGORY 3: GDP Loss]",
  sourceType: "external",
  sourceRef: "yalebudgetlab2025",
  sourceUrl: "https://budgetlab.yale.edu/research/where-we-stand-fiscal-economic-and-distributional-effects-all-us-tariffs-enacted-2025-through-april",
  confidence: "medium",
  confidenceInterval: [90000000000.0, 250000000000.0],
  stdError: 50000000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_TAX_COMPLIANCE: Parameter = {
  value: 546000000000.0,
  parameterName: "US_GOV_WASTE_TAX_COMPLIANCE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_tax_compliance",
  unit: "USD",
  displayName: "Tax Compliance Waste",
  description: "Annual cost of US tax code compliance: 7.9 billion hours of lost productivity ($413B) plus $133B in out-of-pocket costs. Equals nearly 2% of GDP. Could be largely eliminated with simplified tax code or return-free filing. [CATEGORY 2: Compliance Burden]",
  sourceType: "external",
  sourceRef: "taxfoundation2024-compliance",
  sourceUrl: "https://taxfoundation.org/data/all/federal/irs-tax-compliance-costs/",
  confidence: "high",
  confidenceInterval: [450000000000.0, 650000000000.0],
  stdError: 50000000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_HEART_DISEASE_ANNUAL_COST: Parameter = {
  value: 363000000000.0,
  parameterName: "US_HEART_DISEASE_ANNUAL_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_heart_disease_annual_cost",
  unit: "USD",
  displayName: "US Heart Disease Annual Cost",
  description: "Annual US cost of heart disease and stroke (direct and indirect)",
  sourceType: "external",
  sourceRef: "disease-cost-heart-disease-2100b",
  sourceUrl: "https://www.internationaljournalofcardiology.com/article/S0167-5273(13)02238-9/abstract",
  confidence: "high",
  confidenceInterval: [309000000000.0, 417000000000.0],
  peerReviewed: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/aligning-incentives.html",
  manualPageTitle: "Aligning Incentives",
};

export const US_LIFE_EXPECTANCY_1880: Parameter = {
  value: 39.41,
  parameterName: "US_LIFE_EXPECTANCY_1880",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_life_expectancy_1880",
  unit: "years",
  displayName: "US Life Expectancy (1880)",
  description: "US life expectancy in 1880 (closest available data point to 1883).",
  sourceType: "external",
  sourceRef: "life-expectancy-increase-pre-1962",
  sourceUrl: "https://manual.warondisease.org/knowledge/data/us-life-expectancy-fda-budget-1543-2019.csv",
  confidence: "high",
  confidenceInterval: [38.9, 39.9],
  peerReviewed: true,
};

export const US_LIFE_EXPECTANCY_1962: Parameter = {
  value: 70.064,
  parameterName: "US_LIFE_EXPECTANCY_1962",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_life_expectancy_1962",
  unit: "years",
  displayName: "US Life Expectancy (1962)",
  description: "US life expectancy in 1962 (year of Kefauver-Harris Amendments).",
  sourceType: "external",
  sourceRef: "life-expectancy-increase-pre-1962",
  sourceUrl: "https://manual.warondisease.org/knowledge/data/us-life-expectancy-fda-budget-1543-2019.csv",
  confidence: "high",
  confidenceInterval: [69.8, 70.3],
  peerReviewed: true,
};

export const US_LIFE_EXPECTANCY_2019: Parameter = {
  value: 78.862,
  parameterName: "US_LIFE_EXPECTANCY_2019",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_life_expectancy_2019",
  unit: "years",
  displayName: "US Life Expectancy (2019)",
  description: "US life expectancy in 2019 (latest available data).",
  sourceType: "external",
  sourceRef: "post-1962-life-expectancy-slowdown",
  sourceUrl: "https://manual.warondisease.org/knowledge/data/us-life-expectancy-fda-budget-1543-2019.csv",
  confidence: "high",
  confidenceInterval: [78.6, 79.1],
  peerReviewed: true,
};

export const US_LIFE_EXPECTANCY_2023: Parameter = {
  value: 77.5,
  parameterName: "US_LIFE_EXPECTANCY_2023",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_life_expectancy_2023",
  unit: "years",
  displayName: "US Life Expectancy",
  description: "US life expectancy at birth (2023). Lowest among high-income OECD countries despite highest healthcare spending.",
  sourceType: "external",
  sourceRef: "cdc-life-expectancy",
  sourceUrl: "https://www.cdc.gov/nchs/fastats/life-expectancy.htm",
  confidence: "high",
};

export const US_MEDIAN_HOUSEHOLD_INCOME_2023: Parameter = {
  value: 80610.0,
  parameterName: "US_MEDIAN_HOUSEHOLD_INCOME_2023",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_median_household_income_2023",
  unit: "USD",
  displayName: "US Median Household Income",
  description: "US median household income (2023). High in absolute terms but adjusted for healthcare costs and inequality, purchasing power is lower than peers.",
  sourceType: "external",
  sourceRef: "census-income-2023",
  sourceUrl: "https://www.census.gov/library/publications/2024/demo/p60-282.html",
  confidence: "high",
};

export const US_MENTAL_HEALTH_COST_ANNUAL: Parameter = {
  value: 350000000000.0,
  parameterName: "US_MENTAL_HEALTH_COST_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_mental_health_cost_annual",
  unit: "USD/year",
  displayName: "US Mental Health Costs",
  description: "US mental health costs (treatment + productivity loss)",
  sourceType: "external",
  sourceRef: "mental-health-burden",
  sourceUrl: "https://www.who.int/news/item/28-09-2001-the-world-health-report-2001-mental-disorders-affect-one-in-four-people",
  confidence: "high",
  confidenceInterval: [260000000000.0, 450000000000.0],
};

export const US_MILITARY_SPENDING_1939_ANNUAL_2024USD: Parameter = {
  value: 29000000000.0,
  parameterName: "US_MILITARY_SPENDING_1939_ANNUAL_2024USD",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_military_spending_1939_annual_2024usd",
  unit: "USD",
  displayName: "US Military Spending in 1939 (Constant 2024 Dollars)",
  description: "US military spending in 1939 (pre-WW2 baseline) in constant 2024 dollars",
  sourceType: "external",
  sourceRef: "us-military-spending-historical-constant-dollars",
  sourceUrl: "https://www.davemanuel.com/us-defense-spending-history-military-budget-data.php",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/unrepresentative-democracy.html",
  manualPageTitle: "Unrepresentative Democracy",
};

export const US_MILITARY_SPENDING_1945_PEAK_ANNUAL_2024USD: Parameter = {
  value: 1420000000000.0,
  parameterName: "US_MILITARY_SPENDING_1945_PEAK_ANNUAL_2024USD",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_military_spending_1945_peak_annual_2024usd",
  unit: "USD",
  displayName: "US Military Spending at WW2 Peak (Constant 2024 Dollars)",
  description: "US military spending at WW2 peak (1945) in constant 2024 dollars",
  sourceType: "external",
  sourceRef: "us-military-spending-historical-constant-dollars",
  sourceUrl: "https://www.davemanuel.com/us-defense-spending-history-military-budget-data.php",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/1-percent-treaty.html",
  manualPageTitle: "A 1% Treaty",
};

export const US_MILITARY_SPENDING_1947_ANNUAL_2024USD: Parameter = {
  value: 176000000000.0,
  parameterName: "US_MILITARY_SPENDING_1947_ANNUAL_2024USD",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_military_spending_1947_annual_2024usd",
  unit: "USD",
  displayName: "US Military Spending in 1947 (Constant 2024 Dollars)",
  description: "US military spending in 1947 (post-WW2 trough, 2 years after peak) in constant 2024 dollars",
  sourceType: "external",
  sourceRef: "us-military-spending-historical-constant-dollars",
  sourceUrl: "https://www.davemanuel.com/us-defense-spending-history-military-budget-data.php",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/1-percent-treaty.html",
  manualPageTitle: "A 1% Treaty",
};

export const US_MILITARY_SPENDING_2024_ANNUAL: Parameter = {
  value: 886000000000.0,
  parameterName: "US_MILITARY_SPENDING_2024_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_military_spending_2024_annual",
  unit: "USD",
  displayName: "US Military Spending in 2024",
  description: "US military spending in 2024 in constant dollars",
  sourceType: "external",
  sourceRef: "us-military-spending-historical-constant-dollars",
  sourceUrl: "https://www.davemanuel.com/us-defense-spending-history-military-budget-data.php",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/unrepresentative-democracy.html",
  manualPageTitle: "Unrepresentative Democracy",
};

export const US_MILITARY_SPENDING_PCT_GDP: Parameter = {
  value: 0.035,
  parameterName: "US_MILITARY_SPENDING_PCT_GDP",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_military_spending_pct_gdp",
  unit: "rate",
  displayName: "US Military Spending as Percentage of GDP",
  description: "US military spending as percentage of GDP (2024)",
  sourceType: "external",
  sourceRef: "us-military-budget-3-5-pct-gdp",
  sourceUrl: "https://www.statista.com/statistics/262742/countries-with-the-highest-military-spending/",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem.html",
  manualPageTitle: "Diagnostic Summary",
};

export const US_POPULATION_2024: Parameter = {
  value: 335000000.0,
  parameterName: "US_POPULATION_2024",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_population_2024",
  unit: "people",
  displayName: "US Population in 2024",
  description: "US population in 2024",
  sourceType: "external",
  sourceRef: "us-voter-population",
  sourceUrl: "https://www.census.gov/newsroom/press-releases/2025/2024-presidential-election-voting-registration-tables.html",
  confidence: "high",
  confidenceInterval: [330000000.0, 340000000.0],
};

export const US_SENATORS_FOR_TREATY: Parameter = {
  value: 67.0,
  parameterName: "US_SENATORS_FOR_TREATY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_senators_for_treaty",
  unit: "senators",
  displayName: "Senators for Treaty Ratification",
  description: "Senators needed for treaty ratification (2/3 majority per Article II, Section 2)",
  sourceType: "external",
  sourceRef: "us-senate-treaties",
  sourceUrl: "https://www.senate.gov/about/powers-procedures/treaties.htm",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/cost-of-change-analysis.html",
  manualPageTitle: "The Price of Political Change: A Cost-Benefit Framework for Policy Incentivization",
};

export const US_TOTAL_FEDERAL_CAMPAIGN_SPENDING_2024: Parameter = {
  value: 20000000000.0,
  parameterName: "US_TOTAL_FEDERAL_CAMPAIGN_SPENDING_2024",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_total_federal_campaign_spending_2024",
  unit: "USD",
  displayName: "US Federal Campaign Spending (2024)",
  description: "Total US federal election spending in 2024 cycle including presidential, congressional, party committees, and PACs. Source: FEC Statistical Summary 2024.",
  sourceType: "external",
  sourceRef: "fec-2024-summary",
  sourceUrl: "https://www.fec.gov/updates/statistical-summary-of-24-month-campaign-activity-of-the-2023-2024-election-cycle/",
  confidence: "high",
  confidenceInterval: [18000000000.0, 22000000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/cost-of-change-analysis.html",
  manualPageTitle: "The Price of Political Change: A Cost-Benefit Framework for Policy Incentivization",
};

export const US_TOTAL_LOBBYING_ANNUAL: Parameter = {
  value: 4400000000.0,
  parameterName: "US_TOTAL_LOBBYING_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_total_lobbying_annual",
  unit: "USD",
  displayName: "US Total Lobbying (2024)",
  description: "Total US federal lobbying expenditure in 2024 (record year). Source: OpenSecrets.",
  sourceType: "external",
  sourceRef: "opensecrets-lobbying-2024",
  sourceUrl: "https://www.opensecrets.org/news/2025/02/federal-lobbying-set-new-record-in-2024/",
  confidence: "high",
  confidenceInterval: [3740000000.0, 5060000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/algorithmic-public-administration-paper.html",
  manualPageTitle: "Algorithmic Public Administration",
};

export const US_VOTE_DECISIVE_PROBABILITY: Parameter = {
  value: 1.6666666666666667e-08,
  parameterName: "US_VOTE_DECISIVE_PROBABILITY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_vote_decisive_probability",
  unit: "probability",
  displayName: "Probability of Decisive Vote (US)",
  description: "Probability of a single vote being decisive in a US presidential election. Gelman, Silver, and Edlin (2012) estimate roughly 1 in 60 million on average, varying by state from 1 in 10 million (swing states) to 1 in 1 billion (safe states).",
  sourceType: "external",
  sourceRef: "odds-of-decisive-vote",
  sourceUrl: "https://sites.stat.columbia.edu/gelman/research/published/probdecisive2.pdf",
  confidence: "high",
};

export const VALLEY_OF_DEATH_ATTRITION_PCT: Parameter = {
  value: 0.4,
  parameterName: "VALLEY_OF_DEATH_ATTRITION_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-valley_of_death_attrition_pct",
  unit: "percentage",
  displayName: "Valley of Death Attrition Rate",
  description: "Percentage of promising Phase 1-passed compounds abandoned primarily due to Phase 2/3 cost barriers (not scientific failure). Conservative estimate: many rare disease, natural compound, and low-margin drugs never tested.",
  sourceType: "external",
  sourceRef: "valley-of-death-attrition",
  sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3324971/",
  confidence: "medium",
  confidenceInterval: [0.25, 0.55],
};

export const VALUE_OF_STATISTICAL_LIFE: Parameter = {
  value: 10000000.0,
  parameterName: "VALUE_OF_STATISTICAL_LIFE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-value_of_statistical_life",
  unit: "USD",
  displayName: "Value of Statistical Life",
  description: "Value of Statistical Life (conservative estimate)",
  sourceType: "external",
  sourceRef: "dot-vsl-13-6m",
  sourceUrl: "https://www.transportation.gov/office-policy/transportation-policy/revised-departmental-guidance-on-valuation-of-a-statistical-life-in-economic-analysis",
  confidence: "high",
  confidenceInterval: [5000000.0, 15000000.0],
  stdError: 3000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const VENTURE_GROSS_RETURN: Parameter = {
  value: 0.17,
  parameterName: "VENTURE_GROSS_RETURN",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-venture_gross_return",
  unit: "percent",
  displayName: "Venture Capital Gross Return",
  description: "Venture capital / private equity gross return (before 2-and-20 fees). Cambridge Associates US VC index 25-year pooled gross IRR. The Wishocratic fund charges zero fees, so gross return is the correct baseline. Lockup premium is already embedded: VC/PE IS illiquid.",
  sourceType: "external",
  confidence: "high",
  confidenceInterval: [0.13, 0.22],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/wishocratic-investment-fund.html",
  manualPageTitle: "The Wishocratic Investment Fund",
};

export const VITAMIN_A_COST_PER_DALY: Parameter = {
  value: 37.0,
  parameterName: "VITAMIN_A_COST_PER_DALY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-vitamin_a_cost_per_daly",
  unit: "USD/DALY",
  displayName: "Vitamin A Supplementation Cost per DALY",
  description: "Cost per DALY for vitamin A supplementation programs (India: $23-50; Africa: $40-255; wide variation by region and baseline VAD prevalence). Using India midpoint as conservative estimate.",
  sourceType: "external",
  sourceRef: "vitamin-a-cost-per-daly",
  sourceUrl: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0012046",
  confidence: "medium",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const WATER_FLUORIDATION_ANNUAL_BENEFIT: Parameter = {
  value: 800000000.0,
  parameterName: "WATER_FLUORIDATION_ANNUAL_BENEFIT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-water_fluoridation_annual_benefit",
  unit: "USD/year",
  displayName: "Estimated Annual Global Economic Benefit from Water Fluoridation Programs",
  description: "Estimated annual global economic benefit from water fluoridation programs",
  sourceType: "external",
  sourceRef: "clean-water-sanitation-roi",
  sourceUrl: "https://news.un.org/en/story/2014/11/484032",
  confidence: "high",
};

export const WATER_FLUORIDATION_ROI: Parameter = {
  value: 23.0,
  parameterName: "WATER_FLUORIDATION_ROI",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-water_fluoridation_roi",
  unit: "ratio",
  displayName: "Return on Investment from Water Fluoridation Programs",
  description: "Return on investment from water fluoridation programs",
  sourceType: "external",
  sourceRef: "clean-water-sanitation-roi",
  sourceUrl: "https://news.un.org/en/story/2014/11/484032",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const WHO_QALY_THRESHOLD_COST_EFFECTIVE: Parameter = {
  value: 50000.0,
  parameterName: "WHO_QALY_THRESHOLD_COST_EFFECTIVE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-who_qaly_threshold_cost_effective",
  unit: "USD/QALY",
  displayName: "Cost-Effectiveness Threshold ($50,000/QALY)",
  description: "Cost-effectiveness threshold widely used in US health economics ($50,000/QALY, from 1980s dialysis costs)",
  sourceType: "external",
  sourceRef: "who-cost-effectiveness-threshold",
  sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5193154/",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const WORKFORCE_WITH_PRODUCTIVITY_LOSS: Parameter = {
  value: 0.28,
  parameterName: "WORKFORCE_WITH_PRODUCTIVITY_LOSS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-workforce_with_productivity_loss",
  unit: "rate",
  displayName: "Percentage of Workforce Experiencing Productivity Loss from Chronic Illness",
  description: "Percentage of workforce experiencing productivity loss from chronic illness (28%)",
  sourceType: "external",
  sourceRef: "chronic-illness-workforce-productivity-loss",
  sourceUrl: "https://www.ibiweb.org/resources/chronic-conditions-in-the-us-workforce-prevalence-trends-and-productivity-impacts",
  confidence: "high",
};

// ============================================================================
// Calculated Values
// ============================================================================

export const ADDITIONAL_DRUGS_FROM_COST_ELIMINATION: Parameter = {
  value: 20.0,
  parameterName: "ADDITIONAL_DRUGS_FROM_COST_ELIMINATION",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-additional_drugs_from_cost_elimination",
  unit: "drugs/year",
  displayName: "Additional Drug Approvals from Cost Elimination",
  description: "Additional drug approvals per year when Phase 2/3 cost barrier eliminated. Assumes valley-of-death compounds (abandoned due to cost) would have similar success rate to funded compounds.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "CURRENT_APPROVALS × VALLEY_OF_DEATH_PCT",
  latex: "\\begin{gathered}\nDrugs_{new} \\\\\n= Drugs_{ann,curr} \\times Attrition_{valley} \\\\\n= 50 \\times 40\\% \\\\\n= 20\n\\end{gathered}",
};

export const CELL_THERAPY_DISEASE_COMBINATIONS: Parameter = {
  value: 500000.0,
  parameterName: "CELL_THERAPY_DISEASE_COMBINATIONS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-cell_therapy_disease_combinations",
  unit: "combinations",
  displayName: "Cell Therapy Combinations",
  description: "Cell therapy approach-disease combinations",
  sourceType: "calculated",
  confidence: "high",
  formula: "CELL_APPROACHES × DISEASES",
  latex: "\\begin{gathered}\nCombos_{cell} \\\\\n= N_{cell} \\times N_{diseases,trial} \\\\\n= 500 \\times 1{,}000 \\\\\n= 500{,}000\n\\end{gathered}",
};

export const CHAIN_ENGAGE_PROBABILITY: Parameter = {
  value: 0.09999999999999998,
  parameterName: "CHAIN_ENGAGE_PROBABILITY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-chain_engage_probability",
  unit: "rate",
  displayName: "Engagement Rate",
  description: "Probability someone engages with the idea (1 - dismissal rate)",
  sourceType: "calculated",
  confidence: "high",
  formula: "1 - CHAIN_DISMISS_PROBABILITY",
  latex: "P_{engage} = 1 - P_{dismiss} = 1 - 90\\% = 10\\%",
};

export const CHAIN_EXPECTED_ENGAGED_IMPLEMENTERS: Parameter = {
  value: 3.478910443764937,
  parameterName: "CHAIN_EXPECTED_ENGAGED_IMPLEMENTERS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-chain_expected_engaged_implementers",
  unit: "people",
  displayName: "Expected Engaged Implementers",
  description: "Expected number of implementers who engage (orbit reached x engagement rate x implementer count)",
  sourceType: "calculated",
  confidence: "high",
  formula: "P_reach x CHAIN_ENGAGE_PROBABILITY x CHAIN_IMPLEMENTER_COUNT",
  latex: "E[N_{engaged}] = P_{reach} \\times P_{engage} \\times N_{impl}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/treaty-feasibility.html",
  manualPageTitle: "Treaty Feasibility & Cost Analysis",
};

export const CHAIN_IMPLEMENTER_COUNT: Parameter = {
  value: 2976.0,
  parameterName: "CHAIN_IMPLEMENTER_COUNT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-chain_implementer_count",
  unit: "people",
  displayName: "Potential Implementers",
  description: "Total potential implementers (billionaires + world leaders)",
  sourceType: "calculated",
  confidence: "high",
  formula: "CHAIN_GLOBAL_BILLIONAIRE_COUNT + CHAIN_WORLD_LEADER_COUNT",
  latex: "\\begin{gathered}\nN_{impl} \\\\\n= N_{billionaire} + N_{leader} \\\\\n= 2{,}780 + 195 \\\\\n= 2{,}980\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/treaty-feasibility.html",
  manualPageTitle: "Treaty Feasibility & Cost Analysis",
};

export const CHAIN_P_AT_LEAST_ONE_ENGAGES: Parameter = {
  value: 0.9692217015578317,
  parameterName: "CHAIN_P_AT_LEAST_ONE_ENGAGES",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-chain_p_at_least_one_engages",
  unit: "percent",
  displayName: "P(At Least One Engages)",
  description: "Probability at least one implementer engages (information diffusion only; dominant strategy proof handles action)",
  sourceType: "calculated",
  confidence: "high",
  formula: "1 - CHAIN_P_NO_IMPLEMENTER_ENGAGES",
  latex: "\\begin{gathered}\nP_{reach} = 1 - P_{none} = 1 - 3.08\\% = 96.9\\%\n\\\\[0.5em]\n\\text{where } P_{none} = \\left(1 - P_{reach} \\cdot P_{engage}\\right)^{N_{impl}}\n\\\\[0.5em]\n\\text{where } P_{engage} = 1 - P_{dismiss} = 1 - 90\\% = 10\\%\n\\\\[0.5em]\n\\text{where } N_{impl} = N_{billionaire} + N_{leader} = 2{,}780 + 195 = 2{,}980\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/treaty-feasibility.html",
  manualPageTitle: "Treaty Feasibility & Cost Analysis",
};

export const CHAIN_P_ENCOUNTER_DIRECT_10YR: Parameter = {
  value: 0.011689887243833796,
  parameterName: "CHAIN_P_ENCOUNTER_DIRECT_10YR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-chain_p_encounter_direct_10yr",
  unit: "rate",
  displayName: "Implementer Orbit Reach Probability",
  description: "Probability a given implementer's information orbit is reached by the content cascade",
  sourceType: "calculated",
  confidence: "high",
  formula: "1 - (1 - CHAIN_IMPLEMENTER_ORBIT_SIZE / 5B)^(CHAIN_INITIAL_AUDIENCE x cascade_multiplier)",
  latex: "\\begin{gathered}\nP_{reach} \\\\\n= 1 - \\left(1 - \\frac{O_{impl}}{N}\\right)^{N_0 \\cdot \\sum_{i=0}^{3} R_{eff}^i}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/treaty-feasibility.html",
  manualPageTitle: "Treaty Feasibility & Cost Analysis",
};

export const CHAIN_P_NO_IMPLEMENTER_ENGAGES: Parameter = {
  value: 0.030778298442168252,
  parameterName: "CHAIN_P_NO_IMPLEMENTER_ENGAGES",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-chain_p_no_implementer_engages",
  unit: "rate",
  displayName: "P(No Implementer Engages)",
  description: "Probability that NO implementer engages (all orbits missed or all dismiss)",
  sourceType: "calculated",
  confidence: "high",
  formula: "(1 - P_reach x CHAIN_ENGAGE_PROBABILITY)^CHAIN_IMPLEMENTER_COUNT",
  latex: "\\begin{gathered}\nP_{none} \\\\\n= \\left(1 - P_{reach} \\cdot P_{engage}\\right)^{N_{impl}}\n\\end{gathered}",
};

export const CHRONIC_DISEASE_TREATED_PATIENTS_ANNUAL: Parameter = {
  value: 981917808.2191781,
  parameterName: "CHRONIC_DISEASE_TREATED_PATIENTS_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-chronic_disease_treated_patients_annual",
  unit: "people",
  displayName: "Annual Chronic Disease Patients Treated",
  description: "Estimated unique patients receiving chronic disease treatment annually. Derived from IQVIA days of therapy (1.28T) divided by 365 days divided by 2.5 average medications per patient times 70% post-1962 drugs.",
  sourceType: "calculated",
  sourceRef: "iqvia-global-medicines-2024",
  sourceUrl: "https://www.iqvia.com/insights/the-iqvia-institute/reports-and-publications/reports/the-global-use-of-medicines-2024-outlook-to-2028",
  confidence: "low",
  formula: "GLOBAL_CHRONIC_THERAPY_DAYS ÷ 365 ÷ 2.5 × 0.70",
  latex: "\\begin{gathered}\nN_{treated} \\\\\n= DOT_{chronic} \\times 0.000767 \\\\\n= 1.28T \\times 0.000767 \\\\\n= 982M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const CLINICAL_TRIAL_COST_PER_APPROVED_DRUG: Parameter = {
  value: 1200000000.0,
  parameterName: "CLINICAL_TRIAL_COST_PER_APPROVED_DRUG",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-clinical_trial_cost_per_approved_drug",
  unit: "USD",
  displayName: "Clinical Trial Cost Per Approved Drug",
  description: "Annual clinical trial spending per approved drug (trials only, excluding other R&D costs like discovery, preclinical, manufacturing)",
  sourceType: "calculated",
  confidence: "high",
  formula: "TOTAL_TRIAL_SPENDING / NEW_DRUGS",
  latex: "\\begin{gathered}\nCost_{trial,drug} \\\\\n= \\frac{Spending_{trials}}{Drugs_{ann,curr}} \\\\\n= \\frac{\\$60B}{50} \\\\\n= \\$1.2B\n\\end{gathered}",
};

export const CLINICAL_TRIAL_COST_PER_PARTICIPANT_ANNUAL: Parameter = {
  value: 31578.947368421053,
  parameterName: "CLINICAL_TRIAL_COST_PER_PARTICIPANT_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-clinical_trial_cost_per_participant_annual",
  unit: "USD",
  displayName: "Annual Cost Per Clinical Trial Participant",
  description: "Average annual cost per clinical trial participant (total spending ÷ participants)",
  sourceType: "calculated",
  confidence: "high",
  formula: "TOTAL_SPENDING / PARTICIPANTS",
  latex: "\\begin{gathered}\nCost_{trial,pt,ann} \\\\\n= \\frac{Spending_{trials}}{Slots_{curr}} \\\\\n= \\frac{\\$60B}{1.9M} \\\\\n= \\$31.6K\n\\end{gathered}",
};

export const COMBINATION_THERAPY_DISEASE_SPACE: Parameter = {
  value: 45120250000.0,
  parameterName: "COMBINATION_THERAPY_DISEASE_SPACE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-combination_therapy_disease_space",
  unit: "combinations",
  displayName: "Combination Therapy Space",
  description: "Total combination therapy space (pairwise drug combinations × diseases). Standard in oncology, HIV, cardiology.",
  sourceType: "calculated",
  confidence: "high",
  formula: "DRUG_PAIRS × DISEASES",
  latex: "\\begin{gathered}\nSpace_{combo} \\\\\n= N_{combo} \\times N_{diseases,trial} \\\\\n= 45.1M \\times 1{,}000 \\\\\n= 45.1B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const COMBINATION_THERAPY_PAIRS: Parameter = {
  value: 45120250.0,
  parameterName: "COMBINATION_THERAPY_PAIRS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-combination_therapy_pairs",
  unit: "combinations",
  displayName: "Pairwise Drug Combinations",
  description: "Unique pairwise drug combinations from known safe compounds (n choose 2)",
  sourceType: "calculated",
  confidence: "high",
  formula: "SAFE_COMPOUNDS × (SAFE_COMPOUNDS - 1) ÷ 2",
};

export const CONTRIBUTION_DALYS_PER_PCT_POINT: Parameter = {
  value: 5652436733.509989,
  parameterName: "CONTRIBUTION_DALYS_PER_PCT_POINT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-contribution_dalys_per_pct_point",
  unit: "DALYs",
  displayName: "DALYs Averted per Percentage Point",
  description: "DALYs averted per percentage point of implementation probability shift. One percent of total DALYs from eliminating trial capacity bottleneck and efficacy lag.",
  sourceType: "calculated",
  confidence: "high",
  formula: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS × 0.01",
  latex: "DALYs_{pp} = DALYs_{max} \\times 0.01",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const CONTRIBUTION_EV_PER_PCT_POINT_TREATY: Parameter = {
  value: 147126.35771127904,
  parameterName: "CONTRIBUTION_EV_PER_PCT_POINT_TREATY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-contribution_ev_per_pct_point_treaty",
  unit: "USD",
  displayName: "Contribution EV per Percentage Point (Treaty)",
  description: "Personal expected value per percentage point of implementation probability shift under Treaty Trajectory. One percent of the per-capita lifetime income gain.",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA × 0.01",
  latex: "EV_{pp,treaty} = \\Delta Y_{lifetime,treaty} \\times 0.01",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const CONTRIBUTION_EV_PER_PCT_POINT_TREATY_BLEND: Parameter = {
  value: 156949.2947490749,
  parameterName: "CONTRIBUTION_EV_PER_PCT_POINT_TREATY_BLEND",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-contribution_ev_per_pct_point_treaty_blend",
  unit: "USD",
  displayName: "Contribution EV per Percentage Point (Treaty, Blended)",
  description: "Blended personal expected value per percentage point of implementation probability shift under Treaty Trajectory.",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_PERSONAL_UPSIDE_BLEND × 0.01",
  latex: "EV_{pp,treaty,blend} = Upside_{blend,treaty} \\times 0.01",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const CONTRIBUTION_EV_PER_PCT_POINT_WISHONIA: Parameter = {
  value: 519483.9283706183,
  parameterName: "CONTRIBUTION_EV_PER_PCT_POINT_WISHONIA",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-contribution_ev_per_pct_point_wishonia",
  unit: "USD",
  displayName: "Contribution EV per Percentage Point (Wishonia)",
  description: "Personal expected value per percentage point of implementation probability shift under Wishonia Trajectory. One percent of the per-capita lifetime income gain.",
  sourceType: "calculated",
  confidence: "high",
  formula: "WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA × 0.01",
  latex: "EV_{pp,wish} = \\Delta Y_{lifetime,wish} \\times 0.01",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const CONTRIBUTION_EV_PER_PCT_POINT_WISHONIA_BLEND: Parameter = {
  value: 543033.9283706183,
  parameterName: "CONTRIBUTION_EV_PER_PCT_POINT_WISHONIA_BLEND",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-contribution_ev_per_pct_point_wishonia_blend",
  unit: "USD",
  displayName: "Contribution EV per Percentage Point (Wishonia, Blended)",
  description: "Blended personal expected value per percentage point of implementation probability shift under Wishonia Trajectory.",
  sourceType: "calculated",
  confidence: "high",
  formula: "WISHONIA_PERSONAL_UPSIDE_BLEND × 0.01",
  latex: "EV_{pp,wish,blend} = Upside_{blend,wish} \\times 0.01",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const CONTRIBUTION_LIVES_SAVED_PER_PCT_POINT: Parameter = {
  value: 107455177.4859972,
  parameterName: "CONTRIBUTION_LIVES_SAVED_PER_PCT_POINT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-contribution_lives_saved_per_pct_point",
  unit: "lives",
  displayName: "Lives Saved per Percentage Point",
  description: "Lives saved per percentage point of implementation probability shift. One percent of total lives saved from eliminating trial capacity bottleneck and efficacy lag.",
  sourceType: "calculated",
  confidence: "high",
  formula: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED × 0.01",
  latex: "Lives_{pp} = Lives_{max} \\times 0.01",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const CONTRIBUTION_SUFFERING_HOURS_PER_PCT_POINT: Parameter = {
  value: 19310984856363.527,
  parameterName: "CONTRIBUTION_SUFFERING_HOURS_PER_PCT_POINT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-contribution_suffering_hours_per_pct_point",
  unit: "hours",
  displayName: "Suffering Hours Prevented per Percentage Point",
  description: "Suffering hours prevented per percentage point of implementation probability shift. One percent of total suffering hours from eliminating trial capacity bottleneck and efficacy lag.",
  sourceType: "calculated",
  confidence: "high",
  formula: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS × 0.01",
  latex: "Hours_{pp} = Hours_{suffer,max} \\times 0.01",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const CONVENTIONAL_RETIREMENT_HORIZON_MULTIPLE: Parameter = {
  value: 2.5718410065633592,
  parameterName: "CONVENTIONAL_RETIREMENT_HORIZON_MULTIPLE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-conventional_retirement_horizon_multiple",
  unit: "x",
  displayName: "Conventional Retirement Horizon Multiple",
  description: "Compound multiple for conventional retirement investing over the PRIZE pool resolution horizon (tied to the destructive economy 50% threshold year).",
  sourceType: "calculated",
  confidence: "high",
  formula: "(1 + CONVENTIONAL_RETIREMENT_RETURN) ^ (DESTRUCTIVE_ECONOMY_50PCT_YEAR - DESTRUCTIVE_ECONOMY_BASE_YEAR)",
  latex: "M_{retire} = (1 + r_{retire})^{Y_{50\\%} - Y_0}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const CURRENT_COMBINATION_EXPLORATION_YEARS: Parameter = {
  value: 13672803.030303031,
  parameterName: "CURRENT_COMBINATION_EXPLORATION_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-current_combination_exploration_years",
  unit: "years",
  displayName: "Combination Therapy Exploration Time (Current)",
  description: "Years to test all pairwise drug combinations at current trial capacity. Combination therapy is standard in oncology, HIV, cardiology.",
  sourceType: "calculated",
  confidence: "high",
  formula: "COMBINATION_SPACE ÷ CURRENT_TRIALS_PER_YEAR",
  latex: "\\begin{gathered}\nT_{explore,combo} = \\frac{Space_{combo}}{Trials_{ann,curr}} = \\frac{45.1B}{3{,}300} = 13.7M\n\\\\[0.5em]\n\\text{where } Space_{combo} = N_{combo} \\times N_{diseases,trial} = 45.1M \\times 1{,}000 = 45.1B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/untapped-therapeutic-frontier.html",
  manualPageTitle: "The Untapped Therapeutic Frontier",
};

export const CURRENT_KNOWN_SAFE_EXPLORATION_YEARS: Parameter = {
  value: 2878.787878787879,
  parameterName: "CURRENT_KNOWN_SAFE_EXPLORATION_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-current_known_safe_exploration_years",
  unit: "years",
  displayName: "Known Safe Exploration Time (Current)",
  description: "Years to test all known safe drug-disease combinations at current global trial capacity",
  sourceType: "calculated",
  confidence: "high",
  formula: "DRUG_DISEASE_COMBINATIONS ÷ CURRENT_TRIALS_PER_YEAR",
  latex: "\\begin{gathered}\nT_{explore,safe} = \\frac{N_{combos}}{Trials_{ann,curr}} = \\frac{9.5M}{3{,}300} = 2{,}880\n\\\\[0.5em]\n\\text{where } N_{combos} = N_{safe} \\times N_{diseases,trial} = 9{,}500 \\times 1{,}000 = 9.5M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/untapped-therapeutic-frontier.html",
  manualPageTitle: "The Untapped Therapeutic Frontier",
};

export const CURRENT_PATIENT_PARTICIPATION_RATE: Parameter = {
  value: 0.0007916666666666666,
  parameterName: "CURRENT_PATIENT_PARTICIPATION_RATE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-current_patient_participation_rate",
  unit: "rate",
  displayName: "Current Patient Participation Rate in Clinical Trials",
  description: "Current patient participation rate in clinical trials (0.08% = 1.9M participants / 2.4B disease patients)",
  sourceType: "calculated",
  sourceRef: "clinical-trial-patient-participation-rate",
  sourceUrl: "https://www.fightcancer.org/policy-resources/barriers-patient-enrollment-therapeutic-clinical-trials-cancer",
  confidence: "high",
  formula: "CURRENT_TRIAL_SLOTS / DISEASE_PATIENTS",
  latex: "\\begin{gathered}\nRate_{part} \\\\\n= \\frac{Slots_{curr}}{N_{patients}} \\\\\n= \\frac{1.9M}{2.4B} \\\\\n= 0.0792\\%\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem.html",
  manualPageTitle: "Diagnostic Summary",
};

export const CURRENT_TOTAL_EXPLORATION_YEARS: Parameter = {
  value: 15606.060606060606,
  parameterName: "CURRENT_TOTAL_EXPLORATION_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-current_total_exploration_years",
  unit: "years",
  displayName: "Total Exploration Time (Current)",
  description: "Years to test all therapeutic combinations (known safe + emerging modalities) at current capacity",
  sourceType: "calculated",
  confidence: "high",
  formula: "TOTAL_COMBINATIONS ÷ CURRENT_TRIALS_PER_YEAR",
  latex: "\\begin{gathered}\nT_{explore,total} = \\frac{N_{testable}}{Trials_{ann,curr}} = \\frac{51.5M}{3{,}300} = 15{,}600\n\\\\[0.5em]\n\\text{where } N_{testable} = N_{combos} + N_{emerging} = 9.5M + 42M = 51.5M\n\\\\[0.5em]\n\\text{where } N_{combos} = N_{safe} \\times N_{diseases,trial} = 9{,}500 \\times 1{,}000 = 9.5M\n\\\\[0.5em]\n\\text{where } N_{emerging} = Combos_{gene} + Combos_{mRNA} + Combos_{epi} + Combos_{cell} = 20M + 20M + 1.5M + 500{,}000 = 42M\n\\\\[0.5em]\n\\text{where } Combos_{gene} = N_{genes} \\times N_{diseases,trial} = 20{,}000 \\times 1{,}000 = 20M\n\\\\[0.5em]\n\\text{where } Combos_{mRNA} = N_{genes} \\times N_{diseases,trial} = 20{,}000 \\times 1{,}000 = 20M\n\\\\[0.5em]\n\\text{where } Combos_{epi} = N_{epi} \\times N_{diseases,trial} = 1{,}500 \\times 1{,}000 = 1.5M\n\\\\[0.5em]\n\\text{where } Combos_{cell} = N_{cell} \\times N_{diseases,trial} = 500 \\times 1{,}000 = 500{,}000\n\\end{gathered}",
};

export const CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15: Parameter = {
  value: 18713.96507272838,
  parameterName: "CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-current_trajectory_avg_income_year_15",
  unit: "USD",
  displayName: "Current Trajectory Average Income at Year 15",
  description: "Average income (GDP per capita) at year 15 under current trajectory.",
  sourceType: "calculated",
  confidence: "high",
  formula: "CURRENT_TRAJECTORY_GDP_YEAR_15 / GLOBAL_POPULATION_2040_PROJECTED",
  latex: "\\bar{y}_{base,15} = \\frac{GDP_{base,15}}{Pop_{2040}}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const CURRENT_TRAJECTORY_AVG_INCOME_YEAR_20: Parameter = {
  value: 20482.705503629928,
  parameterName: "CURRENT_TRAJECTORY_AVG_INCOME_YEAR_20",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-current_trajectory_avg_income_year_20",
  unit: "USD",
  displayName: "Current Trajectory Average Income at Year 20",
  description: "Average income (GDP per capita) at year 20 under current trajectory trajectory.",
  sourceType: "calculated",
  confidence: "high",
  formula: "CURRENT_TRAJECTORY_GDP_YEAR_20 ÷ GLOBAL_POPULATION_2045_PROJECTED",
  latex: "\\begin{gathered}\n\\bar{y}_{base,20} = \\frac{GDP_{base,20}}{Pop_{2045}} = \\frac{\\$188T}{9.2B} = \\$20.5K\n\\\\[0.5em]\n\\text{where } GDP_{base,20} = GDP_0(1+g_{base})^{20}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/political-dysfunction-tax.html",
  manualPageTitle: "The Political Dysfunction Tax",
};

export const CURRENT_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME: Parameter = {
  value: 1338759.1598336913,
  parameterName: "CURRENT_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-current_trajectory_cumulative_lifetime_income",
  unit: "USD",
  displayName: "Current Trajectory Cumulative Lifetime Income (Per Capita)",
  description: "Cumulative per-capita income over an average remaining lifespan under current trajectory baseline trajectory. Uses 2.5% baseline growth for all years.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_AVG_INCOME_2025 * (1+g) * ((1+g)^T - 1) / g, where g = per-capita baseline growth",
  latex: "\\begin{gathered}\nY_{cum,earth} \\\\\n= \\bar{y}_0 \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}}-1)}{g_{base}}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/call-to-action/your-personal-benefits.html",
  manualPageTitle: "Your Personal Benefits",
};

export const CURRENT_TRAJECTORY_GDP_YEAR_15: Parameter = {
  value: 166554289147282.6,
  parameterName: "CURRENT_TRAJECTORY_GDP_YEAR_15",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-current_trajectory_gdp_year_15",
  unit: "USD",
  displayName: "Current Trajectory GDP at Year 15",
  description: "Global GDP at year 15 under status-quo current trajectory growth.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_GDP_2025 * (1 + GDP_BASELINE_GROWTH_RATE)^15",
  latex: "GDP_{base,15} = GDP_0(1+g_{base})^{15}",
};

export const CURRENT_TRAJECTORY_GDP_YEAR_20: Parameter = {
  value: 188440890633395.34,
  parameterName: "CURRENT_TRAJECTORY_GDP_YEAR_20",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-current_trajectory_gdp_year_20",
  unit: "USD",
  displayName: "Current Trajectory GDP at Year 20",
  description: "Global GDP at year 20 under status-quo current trajectory growth.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_GDP_2025 × (1 + GDP_BASELINE_GROWTH_RATE)^20",
  latex: "GDP_{base,20} = GDP_0(1+g_{base})^{20}",
};

export const DESTRUCTIVE_ECONOMY_25PCT_YEAR: Parameter = {
  value: 2033.0,
  parameterName: "DESTRUCTIVE_ECONOMY_25PCT_YEAR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-destructive_economy_25pct_year",
  unit: "year",
  displayName: "Year Destructive Economy Reaches 25% of GDP",
  description: "Calendar year when the destructive economy (military + cybercrime) reaches 25% of GDP at current growth rates. Historical precedent suggests societies become unstable when extraction rates exceed 20-30% of economic output.",
  sourceType: "calculated",
  confidence: "high",
  formula: "DESTRUCTIVE_ECONOMY_BASE_YEAR + ln(0.25 / DESTRUCTIVE_PCT_GDP) / ln(1 + DESTRUCTIVE_GROWTH - GDP_GROWTH)",
  latex: "\\begin{gathered}\nY_{25\\%} \\\\\n= Y_0 \\\\\n+ \\frac{\\ln(0.25 / r_{destruct:GDP})}{\\ln(1 + g_{destruct} - g_{GDP})}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/gdp-trajectories.html",
  manualPageTitle: "Please Select an Earth: A) Everyone Gets Rich B) Somalia, but Everywhere",
};

export const DESTRUCTIVE_ECONOMY_35PCT_YEAR: Parameter = {
  value: 2037.0,
  parameterName: "DESTRUCTIVE_ECONOMY_35PCT_YEAR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-destructive_economy_35pct_year",
  unit: "year",
  displayName: "Year Destructive Economy Reaches 35% of GDP (Terminal Parasitic Load)",
  description: "Calendar year when the destructive economy (military + cybercrime) reaches 35% of GDP at current growth rates. Historical evidence from the Soviet Union, Yugoslavia, Argentina, and Zimbabwe shows that total extractive burdens of 35-45% consistently trigger self-reinforcing death spirals. This is the empirically-derived terminal parasitic load threshold.",
  sourceType: "calculated",
  confidence: "high",
  formula: "DESTRUCTIVE_ECONOMY_BASE_YEAR + ln(0.35 / DESTRUCTIVE_PCT_GDP) / ln(1 + DESTRUCTIVE_GROWTH - GDP_GROWTH)",
  latex: "\\begin{gathered}\nY_{35\\%} \\\\\n= Y_0 \\\\\n+ \\frac{\\ln(0.35 / r_{destruct:GDP})}{\\ln(1 + g_{destruct} - g_{GDP})}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/call-to-action/your-personal-benefits.html",
  manualPageTitle: "Your Personal Benefits",
};

export const DESTRUCTIVE_ECONOMY_50PCT_YEAR: Parameter = {
  value: 2040.0,
  parameterName: "DESTRUCTIVE_ECONOMY_50PCT_YEAR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-destructive_economy_50pct_year",
  unit: "year",
  displayName: "Year Destructive Economy Reaches 50% of GDP",
  description: "Calendar year when the destructive economy (military + cybercrime) reaches 50% of GDP at current growth rates. At that point, half of all economic activity is destructive, so stealing starts to beat creating for individuals, firms, and states because whatever gets created gets looted fast enough to kill productive investment.",
  sourceType: "calculated",
  confidence: "high",
  formula: "DESTRUCTIVE_ECONOMY_BASE_YEAR + ln(0.50 / DESTRUCTIVE_PCT_GDP) / ln(1 + DESTRUCTIVE_GROWTH - GDP_GROWTH)",
  latex: "\\begin{gathered}\nY_{50\\%} \\\\\n= Y_0 \\\\\n+ \\frac{\\ln(0.50 / r_{destruct:GDP})}{\\ln(1 + g_{destruct} - g_{GDP})}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const DFDA_ANNUAL_OPEX: Parameter = {
  value: 40000000.0,
  parameterName: "DFDA_ANNUAL_OPEX",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_annual_opex",
  unit: "USD/year",
  displayName: "Total Annual Decentralized Framework for Drug Assessment Operational Costs",
  description: "Total annual Decentralized Framework for Drug Assessment operational costs (sum of all components: platform + staff + infra + regulatory + community)",
  sourceType: "calculated",
  confidence: "high",
  formula: "PLATFORM_MAINTENANCE + STAFF + INFRASTRUCTURE + REGULATORY + COMMUNITY",
  latex: "\\begin{gathered}\nOPEX_{dFDA} \\\\\n= Cost_{platform} + Cost_{staff} + Cost_{infra} \\\\\n+ Cost_{regulatory} + Cost_{community} \\\\\n= \\$15M + \\$10M + \\$8M + \\$5M + \\$2M \\\\\n= \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_BENEFIT_RD_ONLY_ANNUAL: Parameter = {
  value: 58640487804.878044,
  parameterName: "DFDA_BENEFIT_RD_ONLY_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_benefit_rd_only_annual",
  unit: "USD/year",
  displayName: "Decentralized Framework for Drug Assessment Annual Benefit: R&D Savings",
  description: "Annual Decentralized Framework for Drug Assessment benefit from R&D savings (trial cost reduction, secondary component)",
  sourceType: "calculated",
  confidence: "high",
  formula: "TRIAL_SPENDING × COST_REDUCTION_PCT",
  latex: "\\begin{gathered}\nBenefit_{RD,ann} = Spending_{trials} \\times Reduce_{pct} = \\$60B \\times 97.7\\% = \\$58.6B\n\\\\[0.5em]\n\\text{where } Reduce_{pct} = 1 - \\frac{Cost_{pragmatic,pt}}{Cost_{P3,pt}} = 1 - \\frac{\\$929}{\\$41K} = 97.7\\%\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_COMBINED_TREATMENT_SPEEDUP_MULTIPLIER: Parameter = {
  value: 17.259078805733385,
  parameterName: "DFDA_COMBINED_TREATMENT_SPEEDUP_MULTIPLIER",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_combined_treatment_speedup_multiplier",
  unit: "multiplier",
  displayName: "dFDA Combined Treatment Discovery Speedup Multiplier",
  description: "Combined speedup factor for treatment discovery from dFDA. Trial capacity multiplier times valley of death rescue multiplier. Diseases that would take T years to get first treatment now take T/speedup years.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "DFDA_TRIAL_CAPACITY_MULTIPLIER × DFDA_VALLEY_OF_DEATH_RESCUE_MULTIPLIER",
  latex: "\\begin{gathered}\nk_{speedup} = k_{capacity} \\times k_{rescue} = 12.3 \\times 1.4 = 17.3\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } k_{rescue} = Attrition_{valley} + 1 = 40\\% + 1 = 1.4\n\\end{gathered}",
};

export const DFDA_DIRECT_FUNDING_COST_PER_DALY: Parameter = {
  value: 0.8415122325165139,
  parameterName: "DFDA_DIRECT_FUNDING_COST_PER_DALY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_direct_funding_cost_per_daly",
  unit: "USD/DALY",
  displayName: "dFDA Direct Funding Cost per DALY",
  description: "Cost per DALY at direct funding level for the therapeutic space exploration period. Still highly cost-effective vs bed nets.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "NPV_DIRECT_FUNDING ÷ DALYS_TIMELINE_SHIFT",
  latex: "\\begin{gathered}\nCost_{direct,DALY} = \\frac{NPV_{direct}}{DALYs_{max}} = \\frac{\\$476B}{565B} = \\$0.842\n\\\\[0.5em]\n\\text{where } NPV_{direct} = Funding_{ann} \\times \\frac{1 - (1+r)^{-T}}{r}\n\\\\[0.5em]\n\\text{where } T_{queue,dFDA} = \\frac{T_{queue,SQ}}{k_{capacity}} = \\frac{443}{12.3} = 36\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } DALYs_{max} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times T_{accel,max} = 2.88B \\times 92.6\\% \\times 212 = 565B\n\\\\[0.5em]\n\\text{where } T_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html",
  manualPageTitle: "Ubiquitous Pragmatic Trial Impact Analysis: How to Prevent a Year of Death and Suffering for 84 Cents",
};

export const DFDA_DIRECT_FUNDING_QUEUE_CLEARANCE_NPV: Parameter = {
  value: 475659465477.4342,
  parameterName: "DFDA_DIRECT_FUNDING_QUEUE_CLEARANCE_NPV",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_direct_funding_queue_clearance_npv",
  unit: "USD",
  displayName: "dFDA Direct Funding NPV (Exploration Period)",
  description: "NPV of annual direct funding for the therapeutic space exploration period. Funding period equals exploration time (queue clearance years at given capacity multiplier). After exploration completes, the full timeline shift benefit is realized.",
  sourceType: "calculated",
  confidence: "high",
  formula: "ANNUAL_FUNDING × [(1 - (1 + r)^-T) / r] where T = exploration time",
  latex: "NPV_{direct} = Funding_{ann} \\times \\frac{1 - (1+r)^{-T}}{r}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_DIRECT_FUNDING_ROI_TRIAL_CAPACITY_PLUS_EFFICACY_LAG: Parameter = {
  value: 178250.5282798208,
  parameterName: "DFDA_DIRECT_FUNDING_ROI_TRIAL_CAPACITY_PLUS_EFFICACY_LAG",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_direct_funding_roi_trial_capacity_plus_efficacy_lag",
  unit: "ratio",
  displayName: "Direct Funding ROI - Elimination of Efficacy Lag Plus Earlier Treatment Discovery from Increased Trial Throughput",
  description: "ROI from directly funding pragmatic clinical trials over the therapeutic space exploration period.",
  sourceType: "calculated",
  confidence: "high",
  formula: "ECONOMIC_VALUE ÷ DIRECT_FUNDING_NPV",
  latex: "\\begin{gathered}\nROI_{direct,max} = \\frac{Value_{max}}{NPV_{direct}} = \\frac{\\$84800T}{\\$476B} = 178{,}000\n\\\\[0.5em]\n\\text{where } Value_{max} = DALYs_{max} \\times Value_{QALY} = 565B \\times \\$150K = \\$84800T\n\\\\[0.5em]\n\\text{where } DALYs_{max} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times T_{accel,max} = 2.88B \\times 92.6\\% \\times 212 = 565B\n\\\\[0.5em]\n\\text{where } T_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } NPV_{direct} = Funding_{ann} \\times \\frac{1 - (1+r)^{-T}}{r}\n\\\\[0.5em]\n\\text{where } T_{queue,dFDA} = \\frac{T_{queue,SQ}}{k_{capacity}} = \\frac{443}{12.3} = 36\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html",
  manualPageTitle: "Ubiquitous Pragmatic Trial Impact Analysis: How to Prevent a Year of Death and Suffering for 84 Cents",
};

export const DFDA_DIRECT_FUNDING_VS_BED_NETS_MULTIPLIER: Parameter = {
  value: 105.76198011269368,
  parameterName: "DFDA_DIRECT_FUNDING_VS_BED_NETS_MULTIPLIER",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_direct_funding_vs_bed_nets_multiplier",
  unit: "x",
  displayName: "Direct Funding Cost-Effectiveness vs Bed Nets",
  description: "How many times more cost-effective direct funding of medical research is vs bed nets.",
  sourceType: "calculated",
  confidence: "high",
  formula: "BED_NETS_COST_PER_DALY ÷ DIRECT_FUNDING_COST_PER_DALY",
  latex: "\\begin{gathered}\nk_{direct,nets} = \\frac{Cost_{nets}}{Cost_{direct,DALY}} = \\frac{\\$89}{\\$0.842} = 106\n\\\\[0.5em]\n\\text{where } Cost_{direct,DALY} = \\frac{NPV_{direct}}{DALYs_{max}} = \\frac{\\$476B}{565B} = \\$0.842\n\\\\[0.5em]\n\\text{where } NPV_{direct} = Funding_{ann} \\times \\frac{1 - (1+r)^{-T}}{r}\n\\\\[0.5em]\n\\text{where } T_{queue,dFDA} = \\frac{T_{queue,SQ}}{k_{capacity}} = \\frac{443}{12.3} = 36\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } DALYs_{max} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times T_{accel,max} = 2.88B \\times 92.6\\% \\times 212 = 565B\n\\\\[0.5em]\n\\text{where } T_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\end{gathered}",
};

export const DFDA_EFFICACY_LAG_ELIMINATION_DALYS: Parameter = {
  value: 7942783571.3,
  parameterName: "DFDA_EFFICACY_LAG_ELIMINATION_DALYS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_efficacy_lag_elimination_dalys",
  unit: "DALYs",
  displayName: "Total DALYs Lost from Disease Eradication Delay",
  description: "Total Disability-Adjusted Life Years lost from disease eradication delay (PRIMARY estimate)",
  sourceType: "calculated",
  confidence: "medium",
  formula: "YLL + YLD",
  latex: "\\begin{gathered}\nDALYs_{lag} = YLL_{lag} + YLD_{lag} = 7.07B + 873M = 7.94B\n\\\\[0.5em]\n\\text{where } YLL_{lag} = Deaths_{lag} \\times (LE_{global} - Age_{death,delay}) = 416M \\times (79 - 62) = 7.07B\n\\\\[0.5em]\n\\text{where } Deaths_{lag} = T_{lag} \\times Deaths_{disease,daily} \\times 338 = 8.2 \\times 150{,}000 \\times 338 = 416M\n\\\\[0.5em]\n\\text{where } YLD_{lag} = Deaths_{lag} \\times T_{suffering} \\times DW_{chronic} = 416M \\times 6 \\times 0.35 = 873M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const DFDA_EFFICACY_LAG_ELIMINATION_DEATHS_AVERTED: Parameter = {
  value: 415852543.0,
  parameterName: "DFDA_EFFICACY_LAG_ELIMINATION_DEATHS_AVERTED",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_efficacy_lag_elimination_deaths_averted",
  unit: "deaths",
  displayName: "Total Deaths from Disease Eradication Delay",
  description: "Total eventually avoidable deaths from delaying disease eradication by 8.2 years (PRIMARY estimate, conservative). Excludes fundamentally unavoidable deaths (primarily accidents ~7.9%).",
  sourceType: "calculated",
  confidence: "medium",
  formula: "ANNUAL_DEATHS × EFFICACY_LAG_YEARS × EVENTUALLY_AVOIDABLE_DEATH_PCT",
  latex: "\\begin{gathered}\nDeaths_{lag} \\\\\n= T_{lag} \\times Deaths_{disease,daily} \\times 338 \\\\\n= 8.2 \\times 150{,}000 \\times 338 \\\\\n= 416M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const DFDA_EFFICACY_LAG_ELIMINATION_ECONOMIC_VALUE: Parameter = {
  value: 1191417535695000.0,
  parameterName: "DFDA_EFFICACY_LAG_ELIMINATION_ECONOMIC_VALUE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_efficacy_lag_elimination_economic_value",
  unit: "USD",
  displayName: "Total Economic Loss from Disease Eradication Delay",
  description: "Total economic loss from delaying disease eradication by 8.2 years (PRIMARY estimate, 2024 USD). Values global DALYs at standardized US/International normative rate ($150k) rather than local ability-to-pay, representing the full human capital loss.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "DALYS_TOTAL × VSLY",
  latex: "\\begin{gathered}\nValue_{lag} = DALYs_{lag} \\times Value_{QALY} = 7.94B \\times \\$150K = \\$1190T\n\\\\[0.5em]\n\\text{where } DALYs_{lag} = YLL_{lag} + YLD_{lag} = 7.07B + 873M = 7.94B\n\\\\[0.5em]\n\\text{where } YLL_{lag} = Deaths_{lag} \\times (LE_{global} - Age_{death,delay}) = 416M \\times (79 - 62) = 7.07B\n\\\\[0.5em]\n\\text{where } Deaths_{lag} = T_{lag} \\times Deaths_{disease,daily} \\times 338 = 8.2 \\times 150{,}000 \\times 338 = 416M\n\\\\[0.5em]\n\\text{where } YLD_{lag} = Deaths_{lag} \\times T_{suffering} \\times DW_{chronic} = 416M \\times 6 \\times 0.35 = 873M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_EFFICACY_LAG_ELIMINATION_YLD: Parameter = {
  value: 873290340.3,
  parameterName: "DFDA_EFFICACY_LAG_ELIMINATION_YLD",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_efficacy_lag_elimination_yld",
  unit: "years",
  displayName: "Years Lived with Disability During Disease Eradication Delay",
  description: "Years Lived with Disability during disease eradication delay (PRIMARY estimate)",
  sourceType: "calculated",
  confidence: "medium",
  formula: "DEATHS_TOTAL × SUFFERING_PERIOD × DISABILITY_WEIGHT",
  latex: "\\begin{gathered}\nYLD_{lag} = Deaths_{lag} \\times T_{suffering} \\times DW_{chronic} = 416M \\times 6 \\times 0.35 = 873M\n\\\\[0.5em]\n\\text{where } Deaths_{lag} = T_{lag} \\times Deaths_{disease,daily} \\times 338 = 8.2 \\times 150{,}000 \\times 338 = 416M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const DFDA_EFFICACY_LAG_ELIMINATION_YLL: Parameter = {
  value: 7069493231.0,
  parameterName: "DFDA_EFFICACY_LAG_ELIMINATION_YLL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_efficacy_lag_elimination_yll",
  unit: "years",
  displayName: "Years of Life Lost from Disease Eradication Delay",
  description: "Years of Life Lost from disease eradication delay deaths (PRIMARY estimate)",
  sourceType: "calculated",
  confidence: "medium",
  formula: "DEATHS_TOTAL × (LIFE_EXPECTANCY - MEAN_AGE_OF_DEATH)",
  latex: "\\begin{gathered}\nYLL_{lag} = Deaths_{lag} \\times (LE_{global} - Age_{death,delay}) = 416M \\times (79 - 62) = 7.07B\n\\\\[0.5em]\n\\text{where } Deaths_{lag} = T_{lag} \\times Deaths_{disease,daily} \\times 338 = 8.2 \\times 150{,}000 \\times 338 = 416M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const DFDA_FIRST_TREATMENTS_PER_YEAR: Parameter = {
  value: 184.91870149000056,
  parameterName: "DFDA_FIRST_TREATMENTS_PER_YEAR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_first_treatments_per_year",
  unit: "diseases/year",
  displayName: "dFDA New Treatments Per Year",
  description: "Diseases per year receiving their first effective treatment with dFDA. Scales proportionally with trial capacity multiplier.",
  sourceType: "calculated",
  confidence: "low",
  formula: "NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR × DFDA_TRIAL_CAPACITY_MULTIPLIER",
  latex: "\\begin{gathered}\nTreatments_{dFDA,ann} = Treatments_{new,ann} \\times k_{capacity} = 15 \\times 12.3 = 185\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_KNOWN_SAFE_EXPLORATION_YEARS: Parameter = {
  value: 233.51785316399287,
  parameterName: "DFDA_KNOWN_SAFE_EXPLORATION_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_known_safe_exploration_years",
  unit: "years",
  displayName: "Known Safe Exploration Time (dFDA)",
  description: "Years to test all known safe drug-disease combinations with dFDA trial capacity",
  sourceType: "calculated",
  confidence: "high",
  formula: "DRUG_DISEASE_COMBINATIONS ÷ DFDA_TRIALS_PER_YEAR",
  latex: "\\begin{gathered}\nT_{safe,dFDA} = \\frac{N_{combos}}{Capacity_{trials}} = \\frac{9.5M}{40{,}700} = 234\n\\\\[0.5em]\n\\text{where } N_{combos} = N_{safe} \\times N_{diseases,trial} = 9{,}500 \\times 1{,}000 = 9.5M\n\\\\[0.5em]\n\\text{where } Capacity_{trials} = Trials_{ann,curr} \\times k_{capacity} = 3{,}300 \\times 12.3 = 40{,}700\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/untapped-therapeutic-frontier.html",
  manualPageTitle: "The Untapped Therapeutic Frontier",
};

export const DFDA_MAX_TRIAL_CAPACITY_MULTIPLIER_PHYSICAL: Parameter = {
  value: 565.8947368421053,
  parameterName: "DFDA_MAX_TRIAL_CAPACITY_MULTIPLIER_PHYSICAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_max_trial_capacity_multiplier_physical",
  unit: "x",
  displayName: "Maximum Trial Capacity Multiplier (Physical Limit)",
  description: "Physical upper bound on trial-capacity multiplier from participant availability. Even with unlimited funding, annual trial enrollment cannot exceed willing participant pool.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "WILLING_TRIAL_PARTICIPANTS_GLOBAL ÷ CURRENT_TRIAL_SLOTS_AVAILABLE",
  latex: "\\begin{gathered}\nk_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/gdp-trajectories.html",
  manualPageTitle: "Please Select an Earth: A) Everyone Gets Rich B) Somalia, but Everywhere",
};

export const DFDA_NET_SAVINGS_RD_ONLY_ANNUAL: Parameter = {
  value: 58600487804.878044,
  parameterName: "DFDA_NET_SAVINGS_RD_ONLY_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_net_savings_rd_only_annual",
  unit: "USD/year",
  displayName: "Decentralized Framework for Drug Assessment Annual Net Savings (R&D Only)",
  description: "Annual net savings from R&D cost reduction only (gross savings minus operational costs, excludes regulatory delay value)",
  sourceType: "calculated",
  confidence: "high",
  formula: "GROSS_SAVINGS - ANNUAL_OPEX",
  latex: "\\begin{gathered}\nSavings_{RD,ann} = Benefit_{RD,ann} - OPEX_{dFDA} = \\$58.6B - \\$40M = \\$58.6B\n\\\\[0.5em]\n\\text{where } Benefit_{RD,ann} = Spending_{trials} \\times Reduce_{pct} = \\$60B \\times 97.7\\% = \\$58.6B\n\\\\[0.5em]\n\\text{where } Reduce_{pct} = 1 - \\frac{Cost_{pragmatic,pt}}{Cost_{P3,pt}} = 1 - \\frac{\\$929}{\\$41K} = 97.7\\%\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
};

export const DFDA_NPV_ANNUAL_OPEX_TOTAL: Parameter = {
  value: 40050000.0,
  parameterName: "DFDA_NPV_ANNUAL_OPEX_TOTAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_npv_annual_opex_total",
  unit: "USD/year",
  displayName: "Decentralized Framework for Drug Assessment Total NPV Annual OPEX",
  description: "Total NPV annual opex (Decentralized Framework for Drug Assessment core + DIH initiatives)",
  sourceType: "calculated",
  confidence: "high",
  formula: "DFDA_OPEX + DIH_OPEX",
  latex: "\\begin{gathered}\nOPEX_{total} \\\\\n= OPEX_{ann} + OPEX_{DIH,ann} \\\\\n= \\$18.9M + \\$21.1M \\\\\n= \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html",
  manualPageTitle: "Ubiquitous Pragmatic Trial Impact Analysis: How to Prevent a Year of Death and Suffering for 84 Cents",
};

export const DFDA_NPV_BENEFIT_RD_ONLY: Parameter = {
  value: 389352903335.6751,
  parameterName: "DFDA_NPV_BENEFIT_RD_ONLY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_npv_benefit_rd_only",
  unit: "USD",
  displayName: "NPV of Decentralized Framework for Drug Assessment Benefits (R&D Only, 10-Year Discounted)",
  description: "NPV of Decentralized Framework for Drug Assessment R&D savings only with 5-year adoption ramp (10-year horizon, most conservative financial estimate)",
  sourceType: "calculated",
  confidence: "high",
  formula: "SUM[Savings × adoption(t) / (1+r)^t] for t=1..10",
  latex: "\\begin{gathered}\nNPV_{RD} \\\\\n= \\sum_{t=1}^{10} \\frac{Savings_{RD,ann} \\times \\frac{\\min(t,5)}{5}}{(1+r)^t}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_NPV_NET_BENEFIT_RD_ONLY: Parameter = {
  value: 388741518712.06226,
  parameterName: "DFDA_NPV_NET_BENEFIT_RD_ONLY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_npv_net_benefit_rd_only",
  unit: "USD",
  displayName: "NPV Net Benefit (R&D Only)",
  description: "NPV net benefit using R&D savings only (benefits minus costs)",
  sourceType: "calculated",
  confidence: "high",
  formula: "NPV_BENEFIT - NPV_COST",
  latex: "\\begin{gathered}\nNPV_{net,RD} = NPV_{RD} - Cost_{dFDA,total} = \\$389B - \\$611M = \\$389B\n\\\\[0.5em]\n\\text{where } NPV_{RD} = \\sum_{t=1}^{10} \\frac{Savings_{RD,ann} \\times \\frac{\\min(t,5)}{5}}{(1+r)^t}\n\\\\[0.5em]\n\\text{where } Savings_{RD,ann} = Benefit_{RD,ann} - OPEX_{dFDA} = \\$58.6B - \\$40M = \\$58.6B\n\\\\[0.5em]\n\\text{where } Benefit_{RD,ann} = Spending_{trials} \\times Reduce_{pct} = \\$60B \\times 97.7\\% = \\$58.6B\n\\\\[0.5em]\n\\text{where } Reduce_{pct} = 1 - \\frac{Cost_{pragmatic,pt}}{Cost_{P3,pt}} = 1 - \\frac{\\$929}{\\$41K} = 97.7\\%\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } Cost_{dFDA,total} = PV_{OPEX} + Cost_{upfront,total} = \\$342M + \\$270M = \\$611M\n\\\\[0.5em]\n\\text{where } PV_{OPEX} = OPEX_{ann} \\times \\frac{1 - (1+r)^{-T}}{r}\n\\\\[0.5em]\n\\text{where } OPEX_{total} = OPEX_{ann} + OPEX_{DIH,ann} = \\$18.9M + \\$21.1M = \\$40M\n\\\\[0.5em]\n\\text{where } Cost_{upfront,total} = Cost_{upfront} + Cost_{DIH,init} = \\$40M + \\$230M = \\$270M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_NPV_PV_ANNUAL_OPEX: Parameter = {
  value: 341634623.61287224,
  parameterName: "DFDA_NPV_PV_ANNUAL_OPEX",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_npv_pv_annual_opex",
  unit: "USD",
  displayName: "Decentralized Framework for Drug Assessment Present Value of Annual OPEX Over 10 Years",
  description: "Present value of annual opex over 10 years (NPV formula)",
  sourceType: "calculated",
  confidence: "high",
  formula: "OPEX × [(1 - (1 + r)^-T) / r]",
  latex: "PV_{OPEX} = OPEX_{ann} \\times \\frac{1 - (1+r)^{-T}}{r}",
};

export const DFDA_NPV_TOTAL_COST: Parameter = {
  value: 611384623.6128722,
  parameterName: "DFDA_NPV_TOTAL_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_npv_total_cost",
  unit: "USD",
  displayName: "Decentralized Framework for Drug Assessment Total NPV Cost",
  description: "Total NPV cost (upfront + PV of annual opex)",
  sourceType: "calculated",
  confidence: "high",
  formula: "UPFRONT + PV_OPEX",
  latex: "\\begin{gathered}\nCost_{dFDA,total} = PV_{OPEX} + Cost_{upfront,total} = \\$342M + \\$270M = \\$611M\n\\\\[0.5em]\n\\text{where } PV_{OPEX} = OPEX_{ann} \\times \\frac{1 - (1+r)^{-T}}{r}\n\\\\[0.5em]\n\\text{where } OPEX_{total} = OPEX_{ann} + OPEX_{DIH,ann} = \\$18.9M + \\$21.1M = \\$40M\n\\\\[0.5em]\n\\text{where } Cost_{upfront,total} = Cost_{upfront} + Cost_{DIH,init} = \\$40M + \\$230M = \\$270M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html",
  manualPageTitle: "Ubiquitous Pragmatic Trial Impact Analysis: How to Prevent a Year of Death and Suffering for 84 Cents",
};

export const DFDA_NPV_UPFRONT_COST_TOTAL: Parameter = {
  value: 269750000.0,
  parameterName: "DFDA_NPV_UPFRONT_COST_TOTAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_npv_upfront_cost_total",
  unit: "USD",
  displayName: "Decentralized Framework for Drug Assessment Total NPV Upfront Costs",
  description: "Total NPV upfront costs (Decentralized Framework for Drug Assessment core + DIH initiatives)",
  sourceType: "calculated",
  confidence: "high",
  formula: "DFDA_BUILD + DIH_INITIATIVES",
  latex: "\\begin{gathered}\nCost_{upfront,total} \\\\\n= Cost_{upfront} + Cost_{DIH,init} \\\\\n= \\$40M + \\$230M \\\\\n= \\$270M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_OPEX_PCT_OF_TREATY_FUNDING: Parameter = {
  value: 0.0014705882352941176,
  parameterName: "DFDA_OPEX_PCT_OF_TREATY_FUNDING",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_opex_pct_of_treaty_funding",
  unit: "rate",
  displayName: "Decentralized Framework for Drug Assessment Overhead Percentage of Treaty Funding",
  description: "Percentage of treaty funding allocated to Decentralized Framework for Drug Assessment framework overhead",
  sourceType: "calculated",
  confidence: "high",
  formula: "DFDA_OPEX / TREATY_FUNDING",
  latex: "\\begin{gathered}\nOPEX_{pct} = \\frac{OPEX_{dFDA}}{Funding_{treaty}} = \\frac{\\$40M}{\\$27.2B} = 0.147\\%\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } Funding_{treaty} = Spending_{mil} \\times Reduce_{treaty} = \\$2.72T \\times 1\\% = \\$27.2B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_PATIENTS_FUNDABLE_ANNUALLY: Parameter = {
  value: 23423035.52206674,
  parameterName: "DFDA_PATIENTS_FUNDABLE_ANNUALLY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_patients_fundable_annually",
  unit: "patients/year",
  displayName: "dFDA Patients Fundable Annually",
  description: "Number of patients fundable annually from dFDA funding at pragmatic trial cost. Source-agnostic counterpart of DIH_PATIENTS_FUNDABLE_ANNUALLY.",
  sourceType: "calculated",
  confidence: "high",
  formula: "DFDA_TRIAL_SUBSIDIES_ANNUAL / DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT",
  latex: "\\begin{gathered}\nN_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html",
  manualPageTitle: "Ubiquitous Pragmatic Trial Impact Analysis: How to Prevent a Year of Death and Suffering for 84 Cents",
};

export const DFDA_QUEUE_CLEARANCE_YEARS: Parameter = {
  value: 35.9617493872549,
  parameterName: "DFDA_QUEUE_CLEARANCE_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_queue_clearance_years",
  unit: "years",
  displayName: "dFDA Therapeutic Space Exploration Time",
  description: "Years to explore the entire therapeutic search space with dFDA implementation. At increased discovery rate, finding first treatments for all currently untreatable diseases takes ~36 years instead of ~443.",
  sourceType: "calculated",
  confidence: "low",
  formula: "STATUS_QUO_QUEUE_CLEARANCE_YEARS ÷ DFDA_TRIAL_CAPACITY_MULTIPLIER",
  latex: "\\begin{gathered}\nT_{queue,dFDA} = \\frac{T_{queue,SQ}}{k_{capacity}} = \\frac{443}{12.3} = 36\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_RD_SAVINGS_DAILY: Parameter = {
  value: 160658870.698296,
  parameterName: "DFDA_RD_SAVINGS_DAILY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_rd_savings_daily",
  unit: "USD/day",
  displayName: "Daily R&D Savings from Trial Cost Reduction",
  description: "Daily R&D savings from trial cost reduction (opportunity cost of delay)",
  sourceType: "calculated",
  confidence: "high",
  formula: "ANNUAL_RD_SAVINGS ÷ DAYS_PER_YEAR",
  latex: "\\begin{gathered}\nSavings_{RD,daily} = Benefit_{RD,ann} \\times 0.00274 = \\$58.6B \\times 0.00274 = \\$161M\n\\\\[0.5em]\n\\text{where } Benefit_{RD,ann} = Spending_{trials} \\times Reduce_{pct} = \\$60B \\times 97.7\\% = \\$58.6B\n\\\\[0.5em]\n\\text{where } Reduce_{pct} = 1 - \\frac{Cost_{pragmatic,pt}}{Cost_{P3,pt}} = 1 - \\frac{\\$929}{\\$41K} = 97.7\\%\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/health-dividend.html",
  manualPageTitle: "Health Dividend",
};

export const DFDA_ROI_RD_ONLY: Parameter = {
  value: 636.8379057930197,
  parameterName: "DFDA_ROI_RD_ONLY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_roi_rd_only",
  unit: "ratio",
  displayName: "ROI from Decentralized Framework for Drug Assessment R&D Savings Only",
  description: "ROI from Decentralized Framework for Drug Assessment R&D savings only (10-year NPV, most conservative estimate)",
  sourceType: "calculated",
  confidence: "high",
  formula: "NPV_BENEFIT ÷ NPV_TOTAL_COST",
  latex: "\\begin{gathered}\nROI_{RD} = \\frac{NPV_{RD}}{Cost_{dFDA,total}} = \\frac{\\$389B}{\\$611M} = 637\n\\\\[0.5em]\n\\text{where } NPV_{RD} = \\sum_{t=1}^{10} \\frac{Savings_{RD,ann} \\times \\frac{\\min(t,5)}{5}}{(1+r)^t}\n\\\\[0.5em]\n\\text{where } Savings_{RD,ann} = Benefit_{RD,ann} - OPEX_{dFDA} = \\$58.6B - \\$40M = \\$58.6B\n\\\\[0.5em]\n\\text{where } Benefit_{RD,ann} = Spending_{trials} \\times Reduce_{pct} = \\$60B \\times 97.7\\% = \\$58.6B\n\\\\[0.5em]\n\\text{where } Reduce_{pct} = 1 - \\frac{Cost_{pragmatic,pt}}{Cost_{P3,pt}} = 1 - \\frac{\\$929}{\\$41K} = 97.7\\%\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } Cost_{dFDA,total} = PV_{OPEX} + Cost_{upfront,total} = \\$342M + \\$270M = \\$611M\n\\\\[0.5em]\n\\text{where } PV_{OPEX} = OPEX_{ann} \\times \\frac{1 - (1+r)^{-T}}{r}\n\\\\[0.5em]\n\\text{where } OPEX_{total} = OPEX_{ann} + OPEX_{DIH,ann} = \\$18.9M + \\$21.1M = \\$40M\n\\\\[0.5em]\n\\text{where } Cost_{upfront,total} = Cost_{upfront} + Cost_{DIH,init} = \\$40M + \\$230M = \\$270M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_STORAGE_COST_TOTAL_PER_PATIENT_ANNUAL: Parameter = {
  value: 8.64,
  parameterName: "DFDA_STORAGE_COST_TOTAL_PER_PATIENT_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_storage_cost_total_per_patient_annual",
  unit: "USD/patient/year",
  displayName: "Total Infrastructure Cost per Patient (Annual)",
  description: "Total infrastructure cost per patient per year. Monthly cost × 12.",
  sourceType: "calculated",
  confidence: "high",
  formula: "MONTHLY_COST × 12",
  latex: "\\begin{gathered}\nCost_{infra,annual} = Cost_{infra,monthly} \\times 12 = \\$0.72 \\times 12 = \\$8.64\n\\\\[0.5em]\n\\text{where } Cost_{infra,monthly} = Cost_{storage,raw} + Cost_{compute} + Cost_{database} + Cost_{backup} = \\$0.02 + \\$0.2 + \\$0.3 + \\$0.2 = \\$0.72\n\\end{gathered}",
};

export const DFDA_STORAGE_COST_TOTAL_PER_PATIENT_MONTHLY: Parameter = {
  value: 0.72,
  parameterName: "DFDA_STORAGE_COST_TOTAL_PER_PATIENT_MONTHLY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_storage_cost_total_per_patient_monthly",
  unit: "USD/patient/month",
  displayName: "Total Infrastructure Cost per Patient (Monthly)",
  description: "Total infrastructure cost per patient per month. Sum of storage, compute, database, and backup costs.",
  sourceType: "calculated",
  confidence: "high",
  formula: "RAW + COMPUTE + DATABASE + BACKUP",
  latex: "\\begin{gathered}\nCost_{infra,monthly} \\\\\n= Cost_{storage,raw} + Cost_{compute} + Cost_{database} \\\\\n+ Cost_{backup} \\\\\n= \\$0.02 + \\$0.2 + \\$0.3 + \\$0.2 \\\\\n= \\$0.72\n\\end{gathered}",
};

export const DFDA_TOTAL_EXPLORATION_YEARS: Parameter = {
  value: 1265.9125724153298,
  parameterName: "DFDA_TOTAL_EXPLORATION_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_total_exploration_years",
  unit: "years",
  displayName: "Total Exploration Time (dFDA)",
  description: "Years to test all therapeutic combinations (known safe + emerging modalities) with dFDA capacity",
  sourceType: "calculated",
  confidence: "high",
  formula: "TOTAL_COMBINATIONS ÷ DFDA_TRIALS_PER_YEAR",
  latex: "\\begin{gathered}\nT_{explore,dFDA} = \\frac{N_{testable}}{Capacity_{trials}} = \\frac{51.5M}{40{,}700} = 1{,}270\n\\\\[0.5em]\n\\text{where } N_{testable} = N_{combos} + N_{emerging} = 9.5M + 42M = 51.5M\n\\\\[0.5em]\n\\text{where } N_{combos} = N_{safe} \\times N_{diseases,trial} = 9{,}500 \\times 1{,}000 = 9.5M\n\\\\[0.5em]\n\\text{where } N_{emerging} = Combos_{gene} + Combos_{mRNA} + Combos_{epi} + Combos_{cell} = 20M + 20M + 1.5M + 500{,}000 = 42M\n\\\\[0.5em]\n\\text{where } Combos_{gene} = N_{genes} \\times N_{diseases,trial} = 20{,}000 \\times 1{,}000 = 20M\n\\\\[0.5em]\n\\text{where } Combos_{mRNA} = N_{genes} \\times N_{diseases,trial} = 20{,}000 \\times 1{,}000 = 20M\n\\\\[0.5em]\n\\text{where } Combos_{epi} = N_{epi} \\times N_{diseases,trial} = 1{,}500 \\times 1{,}000 = 1.5M\n\\\\[0.5em]\n\\text{where } Combos_{cell} = N_{cell} \\times N_{diseases,trial} = 500 \\times 1{,}000 = 500{,}000\n\\\\[0.5em]\n\\text{where } Capacity_{trials} = Trials_{ann,curr} \\times k_{capacity} = 3{,}300 \\times 12.3 = 40{,}700\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
};

export const DFDA_TRIALS_PER_YEAR_CAPACITY: Parameter = {
  value: 40682.114327800125,
  parameterName: "DFDA_TRIALS_PER_YEAR_CAPACITY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_trials_per_year_capacity",
  unit: "trials/year",
  displayName: "Decentralized Framework for Drug Assessment Maximum Trials per Year",
  description: "Maximum trials per year possible with trial capacity multiplier",
  sourceType: "calculated",
  confidence: "high",
  formula: "CURRENT_TRIALS × DFDA_TRIAL_CAPACITY_MULTIPLIER",
  latex: "\\begin{gathered}\nCapacity_{trials} = Trials_{ann,curr} \\times k_{capacity} = 3{,}300 \\times 12.3 = 40{,}700\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/untapped-therapeutic-frontier.html",
  manualPageTitle: "The Untapped Therapeutic Frontier",
};

export const DFDA_TRIAL_CAPACITY_DALYS_AVERTED: Parameter = {
  value: 543368690237.1337,
  parameterName: "DFDA_TRIAL_CAPACITY_DALYS_AVERTED",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_trial_capacity_dalys_averted",
  unit: "DALYs",
  displayName: "DALYs Averted from Trial Capacity Increase",
  description: "Total DALYs averted from trial capacity increase alone. Calculated as annual global DALY burden × eventually avoidable percentage × treatment acceleration years. Includes both fatal and non-fatal diseases.",
  sourceType: "calculated",
  confidence: "low",
  formula: "GLOBAL_ANNUAL_DALY_BURDEN × EVENTUALLY_AVOIDABLE_DALY_PCT × TREATMENT_ACCELERATION_YEARS",
  latex: "\\begin{gathered}\nDALYs_{capacity} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times T_{accel} = 2.88B \\times 92.6\\% \\times 204 = 543B\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
};

export const DFDA_TRIAL_CAPACITY_ECONOMIC_VALUE: Parameter = {
  value: 8.150530353557006e+16,
  parameterName: "DFDA_TRIAL_CAPACITY_ECONOMIC_VALUE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_trial_capacity_economic_value",
  unit: "USD",
  displayName: "Economic Value from Trial Capacity Increase",
  description: "Total economic value from trial capacity increase alone. DALYs valued at standard economic rate.",
  sourceType: "calculated",
  confidence: "low",
  formula: "DFDA_TRIAL_CAPACITY_DALYS_AVERTED × STANDARD_QALY_VALUE",
  latex: "\\begin{gathered}\nValue_{capacity} = DALYs_{capacity} \\times Value_{QALY} = 543B \\times \\$150K = \\$81500T\n\\\\[0.5em]\n\\text{where } DALYs_{capacity} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times T_{accel} = 2.88B \\times 92.6\\% \\times 204 = 543B\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
};

export const DFDA_TRIAL_CAPACITY_LIVES_SAVED: Parameter = {
  value: 10329665205.028845,
  parameterName: "DFDA_TRIAL_CAPACITY_LIVES_SAVED",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_trial_capacity_lives_saved",
  unit: "deaths",
  displayName: "Lives Saved from Trial Capacity Increase",
  description: "Total eventually avoidable deaths from trial capacity increase alone. Represents first treatments arriving earlier due to faster therapeutic space exploration from increased trial capacity.",
  sourceType: "calculated",
  confidence: "low",
  formula: "ANNUAL_DEATHS × DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS × AVOIDABLE_PCT",
  latex: "\\begin{gathered}\nLives_{capacity} = Deaths_{disease,daily} \\times T_{accel} \\times 338 = 150{,}000 \\times 204 \\times 338 = 10.3B\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
};

export const DFDA_TRIAL_CAPACITY_MULTIPLIER: Parameter = {
  value: 12.327913432666705,
  parameterName: "DFDA_TRIAL_CAPACITY_MULTIPLIER",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_trial_capacity_multiplier",
  unit: "x",
  displayName: "Trial Capacity Multiplier",
  description: "Trial capacity multiplier from dFDA funding capacity vs. current global trial participation",
  sourceType: "calculated",
  confidence: "high",
  formula: "DFDA_PATIENTS_FUNDABLE_ANNUALLY ÷ CURRENT_TRIAL_SLOTS",
  latex: "\\begin{gathered}\nk_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS: Parameter = {
  value: 565243673350.9989,
  parameterName: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_trial_capacity_plus_efficacy_lag_dalys",
  unit: "DALYs",
  displayName: "Total DALYs from Elimination of Efficacy Lag Plus Earlier Treatment Discovery from Higher Trial Throughput",
  description: "Total DALYs averted from the combined dFDA timeline shift. Calculated as annual global DALY burden × eventually avoidable percentage × timeline shift years. Includes both fatal and non-fatal diseases (WHO GBD methodology).",
  sourceType: "calculated",
  confidence: "low",
  formula: "GLOBAL_ANNUAL_DALY_BURDEN × EVENTUALLY_AVOIDABLE_DALY_PCT × TIMELINE_SHIFT",
  latex: "\\begin{gathered}\nDALYs_{max} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times T_{accel,max} = 2.88B \\times 92.6\\% \\times 212 = 565B\n\\\\[0.5em]\n\\text{where } T_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE: Parameter = {
  value: 8.478655100264984e+16,
  parameterName: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_trial_capacity_plus_efficacy_lag_economic_value",
  unit: "USD",
  displayName: "Total Economic Benefit from Elimination of Efficacy Lag Plus Earlier Treatment Discovery from Higher Trial Throughput",
  description: "Total economic value from the combined dFDA timeline shift. DALYs valued at standard economic rate.",
  sourceType: "calculated",
  confidence: "low",
  formula: "DALYS × STANDARD_QALY_VALUE",
  latex: "\\begin{gathered}\nValue_{max} = DALYs_{max} \\times Value_{QALY} = 565B \\times \\$150K = \\$84800T\n\\\\[0.5em]\n\\text{where } DALYs_{max} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times T_{accel,max} = 2.88B \\times 92.6\\% \\times 212 = 565B\n\\\\[0.5em]\n\\text{where } T_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED: Parameter = {
  value: 10745517748.59972,
  parameterName: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_trial_capacity_plus_efficacy_lag_lives_saved",
  unit: "deaths",
  displayName: "Total Lives Saved from Elimination of Efficacy Lag Plus Earlier Treatment Discovery from Higher Trial Throughput",
  description: "Total eventually avoidable deaths from the combined dFDA timeline shift. Represents deaths prevented when cures arrive earlier due to both increased trial capacity and eliminated efficacy lag.",
  sourceType: "calculated",
  confidence: "low",
  formula: "ANNUAL_DEATHS × DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS × AVOIDABLE_PCT",
  latex: "\\begin{gathered}\nLives_{max} = Deaths_{disease,daily} \\times T_{accel,max} \\times 338 = 150{,}000 \\times 212 \\times 338 = 10.7B\n\\\\[0.5em]\n\\text{where } T_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS: Parameter = {
  value: 1931098485636352.8,
  parameterName: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_trial_capacity_plus_efficacy_lag_suffering_hours",
  unit: "hours",
  displayName: "Suffering Hours Eliminated from Elimination of Efficacy Lag Plus Earlier Treatment Discovery from Higher Trial Throughput",
  description: "Hours of suffering eliminated from the combined dFDA timeline shift. Calculated from YLD component of DALYs (39% of total DALYs × hours per year). One-time benefit, not annual recurring.",
  sourceType: "calculated",
  confidence: "low",
  formula: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS × GLOBAL_YLD_PROPORTION × HOURS_PER_YEAR",
  latex: "\\begin{gathered}\nHours_{suffer,max} = DALYs_{max} \\times Pct_{YLD} \\times 8760 = 565B \\times 0.39 \\times 8760 = 1930T\n\\\\[0.5em]\n\\text{where } DALYs_{max} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times T_{accel,max} = 2.88B \\times 92.6\\% \\times 212 = 565B\n\\\\[0.5em]\n\\text{where } T_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html",
  manualPageTitle: "Ubiquitous Pragmatic Trial Impact Analysis: How to Prevent a Year of Death and Suffering for 84 Cents",
};

export const DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS: Parameter = {
  value: 211.8857919730392,
  parameterName: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_trial_capacity_plus_efficacy_lag_years",
  unit: "years",
  displayName: "dFDA Average Total Timeline Shift",
  description: "Average years earlier patients receive treatments due to dFDA. Combines treatment timeline acceleration from increased trial capacity with efficacy lag elimination for treatments already discovered.",
  sourceType: "calculated",
  confidence: "low",
  formula: "DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS + EFFICACY_LAG_YEARS",
  latex: "\\begin{gathered}\nT_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS: Parameter = {
  value: 203.68579197303922,
  parameterName: "DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_trial_capacity_treatment_acceleration_years",
  unit: "years",
  displayName: "dFDA Treatment Timeline Acceleration",
  description: "Years earlier the average first treatment arrives due to dFDA's trial capacity increase. Calculated as the status quo timeline reduced by the inverse of the capacity multiplier. Uses only trial capacity multiplier (not combined with valley of death rescue) because additional candidates don't directly speed therapeutic space exploration.",
  sourceType: "calculated",
  confidence: "low",
  formula: "STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT × (1 - 1/DFDA_TRIAL_CAPACITY_MULTIPLIER)",
  latex: "\\begin{gathered}\nT_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_TRIAL_COST_REDUCTION_FACTOR: Parameter = {
  value: 44.13347685683531,
  parameterName: "DFDA_TRIAL_COST_REDUCTION_FACTOR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_trial_cost_reduction_factor",
  unit: "multiplier",
  displayName: "dFDA Trial Cost Reduction Factor",
  description: "Cost reduction factor projected for dFDA pragmatic trials (traditional Phase 3 cost / dFDA pragmatic cost per patient)",
  sourceType: "calculated",
  confidence: "high",
  formula: "TRADITIONAL_PHASE3_COST / DFDA_PRAGMATIC_COST",
  latex: "\\begin{gathered}\nk_{reduce} \\\\\n= \\frac{Cost_{P3,pt}}{Cost_{pragmatic,pt}} \\\\\n= \\frac{\\$41K}{\\$929} \\\\\n= 44.1\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_TRIAL_COST_REDUCTION_PCT: Parameter = {
  value: 0.9773414634146341,
  parameterName: "DFDA_TRIAL_COST_REDUCTION_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_trial_cost_reduction_pct",
  unit: "percentage",
  displayName: "dFDA Trial Cost Reduction Percentage",
  description: "Trial cost reduction percentage: 1 - (dFDA pragmatic cost / traditional Phase 3 cost)",
  sourceType: "calculated",
  confidence: "high",
  formula: "1 - (DFDA_COST / TRADITIONAL_COST)",
  latex: "\\begin{gathered}\nReduce_{pct} \\\\\n= 1 - \\frac{Cost_{pragmatic,pt}}{Cost_{P3,pt}} \\\\\n= 1 - \\frac{\\$929}{\\$41K} \\\\\n= 97.7\\%\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html",
  manualPageTitle: "Ubiquitous Pragmatic Trial Impact Analysis: How to Prevent a Year of Death and Suffering for 84 Cents",
};

export const DFDA_TRIAL_SUBSIDIES_ANNUAL: Parameter = {
  value: 21760000000.0,
  parameterName: "DFDA_TRIAL_SUBSIDIES_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_trial_subsidies_annual",
  unit: "USD/year",
  displayName: "dFDA Annual Trial Subsidies",
  description: "Annual clinical trial patient subsidies from dFDA funding (total funding minus operational costs)",
  sourceType: "calculated",
  confidence: "high",
  formula: "DFDA_ANNUAL_TRIAL_FUNDING - DFDA_ANNUAL_OPEX",
  latex: "\\begin{gathered}\nSubsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
};

export const DFDA_VALLEY_OF_DEATH_RESCUE_MULTIPLIER: Parameter = {
  value: 1.4,
  parameterName: "DFDA_VALLEY_OF_DEATH_RESCUE_MULTIPLIER",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_valley_of_death_rescue_multiplier",
  unit: "multiplier",
  displayName: "dFDA Valley of Death Rescue Multiplier",
  description: "Factor increase in drugs entering development when dFDA eliminates Phase 2/3 cost barrier. Valley-of-death attrition (40%) becomes new drugs, so 1 + 0.40 = 1.4× more drugs.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "1 + VALLEY_OF_DEATH_ATTRITION_PCT",
  latex: "k_{rescue} = Attrition_{valley} + 1 = 40\\% + 1 = 1.4",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DIH_PATIENTS_FUNDABLE_ANNUALLY: Parameter = {
  value: 23379978.471474703,
  parameterName: "DIH_PATIENTS_FUNDABLE_ANNUALLY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dih_patients_fundable_annually",
  unit: "patients/year",
  displayName: "Patients Fundable Annually",
  description: "Number of patients fundable annually at dFDA pragmatic trial cost. Based on empirical pragmatic trial costs (RECOVERY to PCORnet range).",
  sourceType: "calculated",
  confidence: "high",
  formula: "TRIAL_SUBSIDIES ÷ DFDA_COST_PER_PATIENT",
  latex: "\\begin{gathered}\nN_{fundable,ann} = \\frac{Subsidies_{trial,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.7B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{trial,ann} = Treasury_{RD,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.7B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } Treasury_{RD,ann} = Funding_{treaty} - Payout_{bond,ann} - Funding_{political,ann} = \\$27.2B - \\$2.72B - \\$2.72B = \\$21.8B\n\\\\[0.5em]\n\\text{where } Funding_{treaty} = Spending_{mil} \\times Reduce_{treaty} = \\$2.72T \\times 1\\% = \\$27.2B\n\\\\[0.5em]\n\\text{where } Payout_{bond,ann} = Funding_{treaty} \\times Pct_{bond} = \\$27.2B \\times 10\\% = \\$2.72B\n\\\\[0.5em]\n\\text{where } Funding_{political,ann} = Funding_{treaty} \\times Pct_{political} = \\$27.2B \\times 10\\% = \\$2.72B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DIH_TREASURY_MEDICAL_RESEARCH_PCT: Parameter = {
  value: 0.8,
  parameterName: "DIH_TREASURY_MEDICAL_RESEARCH_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dih_treasury_medical_research_pct",
  unit: "rate",
  displayName: "Medical Research Percentage of Treaty Funding",
  description: "Percentage of treaty funding allocated to medical research (after bond payouts and IAB incentives)",
  sourceType: "calculated",
  confidence: "high",
  formula: "MEDICAL_RESEARCH_FUNDING / TREATY_FUNDING",
  latex: "\\begin{gathered}\nPct_{treasury,RD} = \\frac{Treasury_{RD,ann}}{Funding_{treaty}} = \\frac{\\$21.8B}{\\$27.2B} = 80\\%\n\\\\[0.5em]\n\\text{where } Treasury_{RD,ann} = Funding_{treaty} - Payout_{bond,ann} - Funding_{political,ann} = \\$27.2B - \\$2.72B - \\$2.72B = \\$21.8B\n\\\\[0.5em]\n\\text{where } Funding_{treaty} = Spending_{mil} \\times Reduce_{treaty} = \\$2.72T \\times 1\\% = \\$27.2B\n\\\\[0.5em]\n\\text{where } Payout_{bond,ann} = Funding_{treaty} \\times Pct_{bond} = \\$27.2B \\times 10\\% = \\$2.72B\n\\\\[0.5em]\n\\text{where } Funding_{political,ann} = Funding_{treaty} \\times Pct_{political} = \\$27.2B \\times 10\\% = \\$2.72B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-protocol-v1.html",
  manualPageTitle: "Earth Optimization Protocol v1",
};

export const DIH_TREASURY_TO_MEDICAL_RESEARCH_ANNUAL: Parameter = {
  value: 21760000000.0,
  parameterName: "DIH_TREASURY_TO_MEDICAL_RESEARCH_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dih_treasury_to_medical_research_annual",
  unit: "USD/year",
  displayName: "Annual Funding for Pragmatic Clinical Trials",
  description: "Annual funding for pragmatic clinical trials (treaty funding minus VICTORY Incentive Alignment Bond payouts and IAB political incentive mechanism)",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_FUNDING - BOND_PAYOUT - IAB_POLITICAL_INCENTIVE_FUNDING",
  latex: "\\begin{gathered}\nTreasury_{RD,ann} = Funding_{treaty} - Payout_{bond,ann} - Funding_{political,ann} = \\$27.2B - \\$2.72B - \\$2.72B = \\$21.8B\n\\\\[0.5em]\n\\text{where } Funding_{treaty} = Spending_{mil} \\times Reduce_{treaty} = \\$2.72T \\times 1\\% = \\$27.2B\n\\\\[0.5em]\n\\text{where } Payout_{bond,ann} = Funding_{treaty} \\times Pct_{bond} = \\$27.2B \\times 10\\% = \\$2.72B\n\\\\[0.5em]\n\\text{where } Funding_{political,ann} = Funding_{treaty} \\times Pct_{political} = \\$27.2B \\times 10\\% = \\$2.72B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DIH_TREASURY_TRIAL_SUBSIDIES_ANNUAL: Parameter = {
  value: 21720000000.0,
  parameterName: "DIH_TREASURY_TRIAL_SUBSIDIES_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dih_treasury_trial_subsidies_annual",
  unit: "USD/year",
  displayName: "Annual Clinical Trial Patient Subsidies",
  description: "Annual clinical trial patient subsidies (all medical research funds after Decentralized Framework for Drug Assessment operations)",
  sourceType: "calculated",
  confidence: "high",
  formula: "MEDICAL_RESEARCH_FUNDING - DFDA_OPEX",
  latex: "\\begin{gathered}\nSubsidies_{trial,ann} = Treasury_{RD,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.7B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } Treasury_{RD,ann} = Funding_{treaty} - Payout_{bond,ann} - Funding_{political,ann} = \\$27.2B - \\$2.72B - \\$2.72B = \\$21.8B\n\\\\[0.5em]\n\\text{where } Funding_{treaty} = Spending_{mil} \\times Reduce_{treaty} = \\$2.72T \\times 1\\% = \\$27.2B\n\\\\[0.5em]\n\\text{where } Payout_{bond,ann} = Funding_{treaty} \\times Pct_{bond} = \\$27.2B \\times 10\\% = \\$2.72B\n\\\\[0.5em]\n\\text{where } Funding_{political,ann} = Funding_{treaty} \\times Pct_{political} = \\$27.2B \\times 10\\% = \\$2.72B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DIH_TREASURY_TRIAL_SUBSIDIES_PCT: Parameter = {
  value: 0.7985294117647059,
  parameterName: "DIH_TREASURY_TRIAL_SUBSIDIES_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dih_treasury_trial_subsidies_pct",
  unit: "rate",
  displayName: "Patient Trial Subsidies Percentage of Treaty Funding",
  description: "Percentage of treaty funding going directly to patient trial subsidies",
  sourceType: "calculated",
  confidence: "high",
  formula: "TRIAL_SUBSIDIES / TREATY_FUNDING",
  latex: "\\begin{gathered}\nPct_{subsidies} = \\frac{Subsidies_{trial,ann}}{Funding_{treaty}} = \\frac{\\$21.7B}{\\$27.2B} = 79.9\\%\n\\\\[0.5em]\n\\text{where } Subsidies_{trial,ann} = Treasury_{RD,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.7B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } Treasury_{RD,ann} = Funding_{treaty} - Payout_{bond,ann} - Funding_{political,ann} = \\$27.2B - \\$2.72B - \\$2.72B = \\$21.8B\n\\\\[0.5em]\n\\text{where } Funding_{treaty} = Spending_{mil} \\times Reduce_{treaty} = \\$2.72T \\times 1\\% = \\$27.2B\n\\\\[0.5em]\n\\text{where } Payout_{bond,ann} = Funding_{treaty} \\times Pct_{bond} = \\$27.2B \\times 10\\% = \\$2.72B\n\\\\[0.5em]\n\\text{where } Funding_{political,ann} = Funding_{treaty} \\times Pct_{political} = \\$27.2B \\times 10\\% = \\$2.72B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DISEASES_WITHOUT_EFFECTIVE_TREATMENT: Parameter = {
  value: 6650.0,
  parameterName: "DISEASES_WITHOUT_EFFECTIVE_TREATMENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-diseases_without_effective_treatment",
  unit: "diseases",
  displayName: "Diseases Without Effective Treatment",
  description: "Number of diseases without effective treatment. 95% of 7,000 rare diseases lack FDA-approved treatment (per Orphanet 2024). This represents the therapeutic search space that remains unexplored.",
  sourceType: "calculated",
  sourceRef: "rare-disease-only-5pct-have-treatment",
  sourceUrl: "https://ojrd.biomedcentral.com/articles/10.1186/s13023-024-03398-1",
  confidence: "medium",
  formula: "RARE_DISEASES_COUNT_GLOBAL × 0.95",
  latex: "\\begin{gathered}\nN_{untreated} \\\\\n= N_{rare} \\times 0.95 \\\\\n= 7{,}000 \\times 0.95 \\\\\n= 6{,}650\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DISEASE_VS_TERRORISM_DEATHS_RATIO: Parameter = {
  value: 18357.81041388518,
  parameterName: "DISEASE_VS_TERRORISM_DEATHS_RATIO",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-disease_vs_terrorism_deaths_ratio",
  unit: "ratio",
  displayName: "Ratio of Annual Disease Deaths to 9/11 Terrorism Deaths",
  description: "Ratio of annual disease deaths to 9/11 terrorism deaths",
  sourceType: "calculated",
  confidence: "high",
  formula: "ANNUAL_DISEASE_DEATHS ÷ 911_DEATHS",
  latex: "\\begin{gathered}\nRatio_{dis:terror} \\\\\n= \\frac{Deaths_{curable,ann}}{Deaths_{9/11}} \\\\\n= \\frac{55M}{3{,}000} \\\\\n= 18{,}400\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DISEASE_VS_WAR_DEATHS_RATIO: Parameter = {
  value: 224.8569092395748,
  parameterName: "DISEASE_VS_WAR_DEATHS_RATIO",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-disease_vs_war_deaths_ratio",
  unit: "ratio",
  displayName: "Ratio of Annual Disease Deaths to War Deaths",
  description: "Ratio of annual disease deaths to war deaths",
  sourceType: "calculated",
  confidence: "high",
  formula: "ANNUAL_DISEASE_DEATHS ÷ WAR_DEATHS",
  latex: "\\begin{gathered}\nRatio_{dis:war} = \\frac{Deaths_{curable,ann}}{Deaths_{conflict}} = \\frac{55M}{245{,}000} = 225\n\\\\[0.5em]\n\\text{where } Deaths_{conflict} = Deaths_{combat} + Deaths_{state} + Deaths_{terror} = 234{,}000 + 2{,}700 + 8{,}300 = 245{,}000\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DIVIDEND_COVERAGE_FACTOR: Parameter = {
  value: 680.0,
  parameterName: "DIVIDEND_COVERAGE_FACTOR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dividend_coverage_factor",
  unit: "ratio",
  displayName: "Coverage Factor of Treaty Funding vs Decentralized Framework for Drug Assessment OPEX",
  description: "Coverage factor of treaty funding vs Decentralized Framework for Drug Assessment opex (sustainability margin)",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_FUNDING ÷ DFDA_OPEX",
  latex: "\\begin{gathered}\nk_{coverage} = \\frac{Funding_{treaty}}{OPEX_{dFDA}} = \\frac{\\$27.2B}{\\$40M} = 680\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } Funding_{treaty} = Spending_{mil} \\times Reduce_{treaty} = \\$2.72T \\times 1\\% = \\$27.2B\n\\end{gathered}",
};

export const DRUGS_APPROVED_SINCE_1962: Parameter = {
  value: 3100.0,
  parameterName: "DRUGS_APPROVED_SINCE_1962",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-drugs_approved_since_1962",
  unit: "drugs",
  displayName: "Total Drugs Approved Since 1962",
  description: "Estimated total drugs approved globally since 1962 (62 years × average approval rate). Conservative: uses current rate, actual historical rate was lower in 1960s-80s.",
  sourceType: "calculated",
  sourceRef: "global-new-drug-approvals-50-annually",
  sourceUrl: "https://cen.acs.org/pharmaceuticals/50-new-drugs-received-FDA/103/i2",
  confidence: "medium",
  formula: "APPROVALS_PER_YEAR × 62",
  latex: "\\begin{gathered}\nN_{drugs,62} \\\\\n= Drugs_{ann,curr} \\times 62 \\\\\n= 50 \\times 62 \\\\\n= 3{,}100\n\\end{gathered}",
};

export const DRUG_COST_INCREASE_1980S_TO_CURRENT_MULTIPLIER: Parameter = {
  value: 13.402061855670103,
  parameterName: "DRUG_COST_INCREASE_1980S_TO_CURRENT_MULTIPLIER",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-drug_cost_increase_1980s_to_current_multiplier",
  unit: "x",
  displayName: "Drug Cost Increase: 1980s to Current",
  description: "Drug development cost increase from 1980s to current",
  sourceType: "calculated",
  sourceRef: "pre-1962-drug-costs-timeline",
  sourceUrl: "https://thinkbynumbers.org/health/how-many-net-lives-does-the-fda-save/",
  confidence: "high",
  formula: "PHARMA_DRUG_DEVELOPMENT_COST_CURRENT ÷ DRUG_DEVELOPMENT_COST_1980S",
  latex: "\\begin{gathered}\nk_{cost,80s} \\\\\n= \\frac{Cost_{dev,curr}}{Cost_{dev,80s}} \\\\\n= \\frac{\\$2.6B}{\\$194M} \\\\\n= 13.4\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const DRUG_COST_INCREASE_PRE1962_TO_CURRENT_MULTIPLIER: Parameter = {
  value: 105.26315789473684,
  parameterName: "DRUG_COST_INCREASE_PRE1962_TO_CURRENT_MULTIPLIER",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-drug_cost_increase_pre1962_to_current_multiplier",
  unit: "x",
  displayName: "Drug Cost Increase: Pre-1962 to Current",
  description: "Drug development cost increase from pre-1962 to current",
  sourceType: "calculated",
  sourceRef: "pre-1962-drug-costs-baily-1972",
  sourceUrl: "https://samizdathealth.org/wp-content/uploads/2020/12/hlthaff.1.2.6.pdf",
  confidence: "high",
  formula: "PHARMA_DRUG_DEVELOPMENT_COST_CURRENT ÷ PRE_1962_DRUG_DEVELOPMENT_COST_2024_USD",
  latex: "\\begin{gathered}\nk_{cost,pre62} \\\\\n= \\frac{Cost_{dev,curr}}{Cost_{pre62,24}} \\\\\n= \\frac{\\$2.6B}{\\$24.7M} \\\\\n= 105\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/drug-development-cost-analysis.html",
  manualPageTitle: "Drug Development Cost Increase Analysis",
};

export const DRUG_DISEASE_COMBINATIONS_POSSIBLE: Parameter = {
  value: 9500000.0,
  parameterName: "DRUG_DISEASE_COMBINATIONS_POSSIBLE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-drug_disease_combinations_possible",
  unit: "combinations",
  displayName: "Possible Drug-Disease Combinations",
  description: "Total possible drug-disease combinations using existing safe compounds",
  sourceType: "calculated",
  confidence: "high",
  formula: "SAFE_COMPOUNDS × DISEASES",
  latex: "\\begin{gathered}\nN_{combos} \\\\\n= N_{safe} \\times N_{diseases,trial} \\\\\n= 9{,}500 \\times 1{,}000 \\\\\n= 9.5M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const EFFICACY_LAG_CUMULATIVE_EXCESS_COST: Parameter = {
  value: 4836000000000.0,
  parameterName: "EFFICACY_LAG_CUMULATIVE_EXCESS_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-efficacy_lag_cumulative_excess_cost",
  unit: "USD",
  displayName: "Cumulative Efficacy Testing Cost (1962-2024)",
  description: "Cumulative Phase 2/3 efficacy testing cost since 1962. Uses direct Phase 2/3 cost per drug - this is a LOWER BOUND because it excludes opportunity cost of delays, compounds abandoned due to cost barrier, and regulatory overhead.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "PHASE_2_3_COST × DRUGS_APPROVED",
  latex: "\\begin{gathered}\nCost_{eff,cumul} = Cost_{P2+P3} \\times N_{drugs,62} = \\$1.56B \\times 3{,}100 = \\$4.84T\n\\\\[0.5em]\n\\text{where } N_{drugs,62} = Drugs_{ann,curr} \\times 62 = 50 \\times 62 = 3{,}100\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const EFFICACY_LAG_DEATHS_911_EQUIVALENTS: Parameter = {
  value: 34132.236031799344,
  parameterName: "EFFICACY_LAG_DEATHS_911_EQUIVALENTS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-efficacy_lag_deaths_911_equivalents",
  unit: "9/11s",
  displayName: "Efficacy Lag Deaths (9/11 Equivalents)",
  description: "Total deaths from efficacy lag expressed in 9/11 equivalents. Makes the mortality cost viscerally understandable: how many September 11ths worth of deaths did the 1962 efficacy requirements cause?",
  sourceType: "calculated",
  confidence: "medium",
  formula: "EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL ÷ SEPT_11_DEATHS",
  latex: "\\begin{gathered}\nN_{9/11,equiv} = \\frac{Deaths_{lag,total}}{N_{9/11}} = \\frac{102M}{2{,}980} = 34{,}100\n\\\\[0.5em]\n\\text{where } Deaths_{lag,total} = Lives_{saved,annual} \\times T_{lag} = 12.4M \\times 8.2 = 102M\n\\\\[0.5em]\n\\text{where } Lives_{saved,annual} = \\frac{LY_{saved,annual}}{T_{ext}} = \\frac{149M}{12} = 12.4M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const EFFICACY_LAG_TREATMENT_DELAY_YLD_ANNUAL: Parameter = {
  value: 2012931506.849315,
  parameterName: "EFFICACY_LAG_TREATMENT_DELAY_YLD_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-efficacy_lag_treatment_delay_yld_annual",
  unit: "DALYs",
  displayName: "Treatment Delay YLD - Annual",
  description: "Annual YLD from treatment delay: patients receiving chronic disease treatment would have collectively avoided this disability if treatments were available 8.2 years earlier. Represents morbidity burden for treatment beneficiaries (distinct from mortality burden).",
  sourceType: "calculated",
  confidence: "low",
  formula: "PATIENTS × EFFICACY_LAG × DISABILITY_REDUCTION",
  latex: "\\begin{gathered}\nYLD_{treat\\_delay} = N_{treated} \\times T_{lag} \\times \\Delta DW_{treat} = 982M \\times 8.2 \\times 0.25 = 2.01B\n\\\\[0.5em]\n\\text{where } N_{treated} = DOT_{chronic} \\times 0.000767 = 1.28T \\times 0.000767 = 982M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const EMERGING_MODALITY_COMBINATIONS: Parameter = {
  value: 42000000.0,
  parameterName: "EMERGING_MODALITY_COMBINATIONS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-emerging_modality_combinations",
  unit: "combinations",
  displayName: "Emerging Modality Combinations",
  description: "Total emerging modality combinations (gene therapy + mRNA + epigenetics + cell therapy)",
  sourceType: "calculated",
  confidence: "high",
  formula: "GENE + MRNA + EPIGENETIC + CELL",
  latex: "\\begin{gathered}\nN_{emerging} = Combos_{gene} + Combos_{mRNA} + Combos_{epi} + Combos_{cell} = 20M + 20M + 1.5M + 500{,}000 = 42M\n\\\\[0.5em]\n\\text{where } Combos_{gene} = N_{genes} \\times N_{diseases,trial} = 20{,}000 \\times 1{,}000 = 20M\n\\\\[0.5em]\n\\text{where } Combos_{mRNA} = N_{genes} \\times N_{diseases,trial} = 20{,}000 \\times 1{,}000 = 20M\n\\\\[0.5em]\n\\text{where } Combos_{epi} = N_{epi} \\times N_{diseases,trial} = 1{,}500 \\times 1{,}000 = 1.5M\n\\\\[0.5em]\n\\text{where } Combos_{cell} = N_{cell} \\times N_{diseases,trial} = 500 \\times 1{,}000 = 500{,}000\n\\end{gathered}",
};

export const EPIGENETIC_DISEASE_COMBINATIONS: Parameter = {
  value: 1500000.0,
  parameterName: "EPIGENETIC_DISEASE_COMBINATIONS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-epigenetic_disease_combinations",
  unit: "combinations",
  displayName: "Epigenetic Therapy Combinations",
  description: "Epigenetic reprogramming target-disease combinations",
  sourceType: "calculated",
  confidence: "high",
  formula: "EPIGENETIC_TARGETS × DISEASES",
  latex: "\\begin{gathered}\nCombos_{epi} \\\\\n= N_{epi} \\times N_{diseases,trial} \\\\\n= 1{,}500 \\times 1{,}000 \\\\\n= 1.5M\n\\end{gathered}",
};

export const EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL: Parameter = {
  value: 101611666.66666666,
  parameterName: "EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-existing_drugs_efficacy_lag_deaths_total",
  unit: "deaths",
  displayName: "Total Deaths from Historical Progress Delays",
  description: "Total deaths from delaying existing drugs over 8.2-year efficacy lag. One-time impact of eliminating Phase 2-4 testing delay for drugs already approved 1962-2024. Based on Lichtenberg (2019) estimate of 12M lives saved annually × 8.2 years efficacy lag. Excludes innovation acceleration effects.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "PHARMA_LIVES_SAVED_ANNUAL × EFFICACY_LAG_YEARS",
  latex: "\\begin{gathered}\nDeaths_{lag,total} = Lives_{saved,annual} \\times T_{lag} = 12.4M \\times 8.2 = 102M\n\\\\[0.5em]\n\\text{where } Lives_{saved,annual} = \\frac{LY_{saved,annual}}{T_{ext}} = \\frac{149M}{12} = 12.4M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const EXISTING_DRUGS_EFFICACY_LAG_ECONOMIC_LOSS: Parameter = {
  value: 259109750000000.0,
  parameterName: "EXISTING_DRUGS_EFFICACY_LAG_ECONOMIC_LOSS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-existing_drugs_efficacy_lag_economic_loss",
  unit: "USD",
  displayName: "Total Economic Loss from Historical Progress Delays",
  description: "Total economic loss from delaying existing drugs over 8.2-year efficacy lag. One-time benefit of eliminating Phase 2-4 delay. Excludes innovation acceleration effects.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "DEATHS_TOTAL × YLL × VSLY",
  latex: "\\begin{gathered}\nLoss_{lag} = Deaths_{lag,total} \\times (LE_{global} - Age_{death,delay}) \\times Value_{QALY} = 102M \\times (79 - 62) \\times \\$150K = \\$259T\n\\\\[0.5em]\n\\text{where } Deaths_{lag,total} = Lives_{saved,annual} \\times T_{lag} = 12.4M \\times 8.2 = 102M\n\\\\[0.5em]\n\\text{where } Lives_{saved,annual} = \\frac{LY_{saved,annual}}{T_{ext}} = \\frac{149M}{12} = 12.4M\n\\end{gathered}",
};

export const EXPLORATION_RATIO: Parameter = {
  value: 0.0034210526315789475,
  parameterName: "EXPLORATION_RATIO",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-exploration_ratio",
  unit: "percentage",
  displayName: "Therapeutic Frontier Exploration Ratio",
  description: "Fraction of possible drug-disease space actually tested (<1%)",
  sourceType: "calculated",
  confidence: "high",
  formula: "TESTED / POSSIBLE",
  latex: "\\begin{gathered}\nRatio_{explore} = \\frac{N_{tested}}{N_{combos}} = \\frac{32{,}500}{9.5M} = 0.342\\%\n\\\\[0.5em]\n\\text{where } N_{combos} = N_{safe} \\times N_{diseases,trial} = 9{,}500 \\times 1{,}000 = 9.5M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/untapped-therapeutic-frontier.html",
  manualPageTitle: "The Untapped Therapeutic Frontier",
};

export const FDA_TO_OXFORD_RECOVERY_TRIAL_TIME_MULTIPLIER: Parameter = {
  value: 32.8,
  parameterName: "FDA_TO_OXFORD_RECOVERY_TRIAL_TIME_MULTIPLIER",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-fda_to_oxford_recovery_trial_time_multiplier",
  unit: "multiplier",
  displayName: "FDA Efficacy Testing to Oxford RECOVERY Trial Time Multiplier",
  description: "Efficacy testing time vs Oxford RECOVERY trial (8.2 years ÷ 3 months = 32.8x slower). Compares efficacy lag only (post-safety Phase II/III) since RECOVERY was an efficacy trial.",
  sourceType: "calculated",
  sourceRef: "recovery-trial-82x-cost-reduction",
  sourceUrl: "https://manhattan.institute/article/slow-costly-clinical-trials-drag-down-biomedical-breakthroughs",
  confidence: "high",
  formula: "EFFICACY_LAG_YEARS × MONTHS_PER_YEAR ÷ OXFORD_RECOVERY_TRIAL_DURATION_MONTHS",
  latex: "\\begin{gathered}\n\\text{Multiplier}_{RD} = \\frac{Y_{efficacy} \\times 12}{M_{RECOVERY}} \\\\[0.5em]\n= \\frac{8.2 \\times 12}{3} = 32.8\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/fda-is-unsafe-and-ineffective.html",
  manualPageTitle: "Your FDA Is Unsafe and Ineffective",
};

export const GENE_THERAPY_DISEASE_COMBINATIONS: Parameter = {
  value: 20000000.0,
  parameterName: "GENE_THERAPY_DISEASE_COMBINATIONS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-gene_therapy_disease_combinations",
  unit: "combinations",
  displayName: "Gene Therapy Combinations",
  description: "Gene therapy target-disease combinations (CRISPR, base editing, viral vectors)",
  sourceType: "calculated",
  confidence: "high",
  formula: "GENES × DISEASES",
  latex: "\\begin{gathered}\nCombos_{gene} \\\\\n= N_{genes} \\times N_{diseases,trial} \\\\\n= 20{,}000 \\times 1{,}000 \\\\\n= 20M\n\\end{gathered}",
};

export const GLOBAL_ANNUAL_CONFLICT_DEATHS_TOTAL: Parameter = {
  value: 244600.0,
  parameterName: "GLOBAL_ANNUAL_CONFLICT_DEATHS_TOTAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_conflict_deaths_total",
  unit: "deaths/year",
  displayName: "Total Annual Conflict Deaths Globally",
  description: "Total annual conflict deaths globally (sum of combat, terror, state violence)",
  sourceType: "calculated",
  confidence: "high",
  formula: "COMBAT + TERROR + STATE_VIOLENCE",
  latex: "\\begin{gathered}\nDeaths_{conflict} \\\\\n= Deaths_{combat} + Deaths_{state} + Deaths_{terror} \\\\\n= 234{,}000 + 2{,}700 + 8{,}300 \\\\\n= 245{,}000\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/cost-of-war.html",
  manualPageTitle: "The Cost of War",
};

export const GLOBAL_ANNUAL_DIRECT_INDIRECT_WAR_COST: Parameter = {
  value: 11357100000000.0,
  parameterName: "GLOBAL_ANNUAL_DIRECT_INDIRECT_WAR_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_direct_indirect_war_cost",
  unit: "USD/year",
  displayName: "Total Annual Cost of War Worldwide",
  description: "Total annual cost of war worldwide (direct + indirect costs)",
  sourceType: "calculated",
  confidence: "high",
  formula: "DIRECT_COSTS + INDIRECT_COSTS",
  latex: "\\begin{gathered}\nCost_{war,total} = Cost_{war,direct} + Cost_{war,indirect} = \\$7.66T + \\$3.7T = \\$11.4T\n\\\\[0.5em]\n\\text{where } Cost_{war,direct} = Loss_{life,conflict} + Damage_{infra,total} + Disruption_{trade} + Spending_{mil} = \\$2.45T + \\$1.88T + \\$616B + \\$2.72T = \\$7.66T\n\\\\[0.5em]\n\\text{where } Loss_{life,conflict} = Cost_{combat,human} + Cost_{state,human} + Cost_{terror,human} = \\$2.34T + \\$27B + \\$83B = \\$2.45T\n\\\\[0.5em]\n\\text{where } Cost_{combat,human} = Deaths_{combat} \\times VSL = 234{,}000 \\times \\$10M = \\$2.34T\n\\\\[0.5em]\n\\text{where } Cost_{state,human} = Deaths_{state} \\times VSL = 2{,}700 \\times \\$10M = \\$27B\n\\\\[0.5em]\n\\text{where } Cost_{terror,human} = Deaths_{terror} \\times VSL = 8{,}300 \\times \\$10M = \\$83B\n\\\\[0.5em]\n\\text{where } Damage_{infra,total} = Damage_{comms} + Damage_{edu} + Damage_{energy} + Damage_{health} + Damage_{transport} + Damage_{water} = \\$298B + \\$234B + \\$422B + \\$166B + \\$487B + \\$268B = \\$1.88T\n\\\\[0.5em]\n\\text{where } Disruption_{trade} = Disruption_{currency} + Disruption_{energy} + Disruption_{shipping} + Disruption_{supply} = \\$57.4B + \\$125B + \\$247B + \\$187B = \\$616B\n\\\\[0.5em]\n\\text{where } Cost_{war,indirect} = Damage_{env} + Loss_{growth,mil} + Loss_{capital,conflict} + Cost_{psych} + Cost_{refugee} + Cost_{vet} = \\$100B + \\$2.72T + \\$300B + \\$232B + \\$150B + \\$200B = \\$3.7T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/peace-dividend.html",
  manualPageTitle: "Peace Dividend",
};

export const GLOBAL_ANNUAL_HUMAN_COST_ACTIVE_COMBAT: Parameter = {
  value: 2336000000000.0,
  parameterName: "GLOBAL_ANNUAL_HUMAN_COST_ACTIVE_COMBAT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_human_cost_active_combat",
  unit: "USD/year",
  displayName: "Annual Cost of Combat Deaths",
  description: "Annual cost of combat deaths (deaths × VSL)",
  sourceType: "calculated",
  confidence: "high",
  formula: "COMBAT_DEATHS × VSL ",
  latex: "\\begin{gathered}\nCost_{combat,human} \\\\\n= Deaths_{combat} \\times VSL \\\\\n= 234{,}000 \\times \\$10M \\\\\n= \\$2.34T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/cost-of-war.html",
  manualPageTitle: "The Cost of War",
};

export const GLOBAL_ANNUAL_HUMAN_COST_STATE_VIOLENCE: Parameter = {
  value: 27000000000.0,
  parameterName: "GLOBAL_ANNUAL_HUMAN_COST_STATE_VIOLENCE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_human_cost_state_violence",
  unit: "USD/year",
  displayName: "Annual Cost of State Violence Deaths",
  description: "Annual cost of state violence deaths (deaths × VSL)",
  sourceType: "calculated",
  confidence: "high",
  formula: "STATE_DEATHS × VSL ",
  latex: "\\begin{gathered}\nCost_{state,human} \\\\\n= Deaths_{state} \\times VSL \\\\\n= 2{,}700 \\times \\$10M \\\\\n= \\$27B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/cost-of-war.html",
  manualPageTitle: "The Cost of War",
};

export const GLOBAL_ANNUAL_HUMAN_COST_TERROR_ATTACKS: Parameter = {
  value: 83000000000.0,
  parameterName: "GLOBAL_ANNUAL_HUMAN_COST_TERROR_ATTACKS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_human_cost_terror_attacks",
  unit: "USD/year",
  displayName: "Annual Cost of Terror Deaths",
  description: "Annual cost of terror deaths (deaths × VSL)",
  sourceType: "calculated",
  confidence: "high",
  formula: "TERROR_DEATHS × VSL ",
  latex: "\\begin{gathered}\nCost_{terror,human} \\\\\n= Deaths_{terror} \\times VSL \\\\\n= 8{,}300 \\times \\$10M \\\\\n= \\$83B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/cost-of-war.html",
  manualPageTitle: "The Cost of War",
};

export const GLOBAL_ANNUAL_HUMAN_LIFE_LOSSES_CONFLICT: Parameter = {
  value: 2446000000000.0,
  parameterName: "GLOBAL_ANNUAL_HUMAN_LIFE_LOSSES_CONFLICT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_human_life_losses_conflict",
  unit: "USD/year",
  displayName: "Total Annual Human Life Losses from Conflict",
  description: "Total annual human life losses from conflict (sum of combat, terror, state violence)",
  sourceType: "calculated",
  confidence: "high",
  formula: "COMBAT_COST + TERROR_COST + STATE_VIOLENCE_COST",
  latex: "\\begin{gathered}\nLoss_{life,conflict} = Cost_{combat,human} + Cost_{state,human} + Cost_{terror,human} = \\$2.34T + \\$27B + \\$83B = \\$2.45T\n\\\\[0.5em]\n\\text{where } Cost_{combat,human} = Deaths_{combat} \\times VSL = 234{,}000 \\times \\$10M = \\$2.34T\n\\\\[0.5em]\n\\text{where } Cost_{state,human} = Deaths_{state} \\times VSL = 2{,}700 \\times \\$10M = \\$27B\n\\\\[0.5em]\n\\text{where } Cost_{terror,human} = Deaths_{terror} \\times VSL = 8{,}300 \\times \\$10M = \\$83B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/cost-of-war.html",
  manualPageTitle: "The Cost of War",
};

export const GLOBAL_ANNUAL_INFRASTRUCTURE_DESTRUCTION_CONFLICT: Parameter = {
  value: 1875000000000.0,
  parameterName: "GLOBAL_ANNUAL_INFRASTRUCTURE_DESTRUCTION_CONFLICT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_infrastructure_destruction_conflict",
  unit: "USD/year",
  displayName: "Total Annual Infrastructure Destruction",
  description: "Total annual infrastructure destruction (sum of transportation, energy, communications, water, education, healthcare)",
  sourceType: "calculated",
  confidence: "high",
  formula: "TRANSPORT + ENERGY + COMMS + WATER + EDUCATION + HEALTHCARE",
  latex: "\\begin{gathered}\nDamage_{infra,total} \\\\\n= Damage_{comms} + Damage_{edu} + Damage_{energy} \\\\\n+ Damage_{health} + Damage_{transport} + Damage_{water} \\\\\n= \\$298B + \\$234B + \\$422B + \\$166B + \\$487B + \\$268B \\\\\n= \\$1.88T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/cost-of-war.html",
  manualPageTitle: "The Cost of War",
};

export const GLOBAL_ANNUAL_SAVINGS: Parameter = {
  value: 31050000000000.004,
  parameterName: "GLOBAL_ANNUAL_SAVINGS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_savings",
  unit: "USD",
  displayName: "Global Annual Savings",
  description: "Global annual savings in USD (savings rate × GDP)",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_SAVINGS_RATE_PCT × GLOBAL_GDP_2025",
  latex: "\\begin{gathered}\nS_{annual} \\\\\n= s_{global} \\times GDP_{global} \\\\\n= 27\\% \\times \\$115T \\\\\n= \\$31.1T\n\\end{gathered}",
};

export const GLOBAL_ANNUAL_SAVINGS_PER_CAPITA: Parameter = {
  value: 3881.2500000000005,
  parameterName: "GLOBAL_ANNUAL_SAVINGS_PER_CAPITA",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_savings_per_capita",
  unit: "USD/person/year",
  displayName: "Global Annual Savings Per Capita",
  description: "Global annual savings divided by global population. Useful as a rough average-person default for prize-contribution sizing.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_ANNUAL_SAVINGS / GLOBAL_POPULATION_2024",
  latex: "\\begin{gathered}\nS_{annual,pc} = \\frac{S_{annual}}{Pop_{global}} = \\frac{\\$31.1T}{8B} = \\$3.88K\n\\\\[0.5em]\n\\text{where } S_{annual} = s_{global} \\times GDP_{global} = 27\\% \\times \\$115T = \\$31.1T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/call-to-action/your-personal-benefits.html",
  manualPageTitle: "Your Personal Benefits",
};

export const GLOBAL_ANNUAL_TRADE_DISRUPTION_CONFLICT: Parameter = {
  value: 616000000000.0,
  parameterName: "GLOBAL_ANNUAL_TRADE_DISRUPTION_CONFLICT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_trade_disruption_conflict",
  unit: "USD/year",
  displayName: "Total Annual Trade Disruption",
  description: "Total annual trade disruption (sum of shipping, supply chain, energy prices, currency instability)",
  sourceType: "calculated",
  confidence: "high",
  formula: "SHIPPING + SUPPLY_CHAIN + ENERGY_PRICE + CURRENCY",
  latex: "\\begin{gathered}\nDisruption_{trade} \\\\\n= Disruption_{currency} + Disruption_{energy} \\\\\n+ Disruption_{shipping} + Disruption_{supply} \\\\\n= \\$57.4B + \\$125B + \\$247B + \\$187B \\\\\n= \\$616B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/cost-of-war.html",
  manualPageTitle: "The Cost of War",
};

export const GLOBAL_ANNUAL_WAR_DIRECT_COSTS_TOTAL: Parameter = {
  value: 7657000000000.0,
  parameterName: "GLOBAL_ANNUAL_WAR_DIRECT_COSTS_TOTAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_war_direct_costs_total",
  unit: "USD/year",
  displayName: "Total Annual Direct War Costs",
  description: "Total annual direct war costs (military spending + infrastructure + human life + trade disruption)",
  sourceType: "calculated",
  confidence: "high",
  formula: "MILITARY + INFRASTRUCTURE + HUMAN_LIFE + TRADE",
  latex: "\\begin{gathered}\nCost_{war,direct} = Loss_{life,conflict} + Damage_{infra,total} + Disruption_{trade} + Spending_{mil} = \\$2.45T + \\$1.88T + \\$616B + \\$2.72T = \\$7.66T\n\\\\[0.5em]\n\\text{where } Loss_{life,conflict} = Cost_{combat,human} + Cost_{state,human} + Cost_{terror,human} = \\$2.34T + \\$27B + \\$83B = \\$2.45T\n\\\\[0.5em]\n\\text{where } Cost_{combat,human} = Deaths_{combat} \\times VSL = 234{,}000 \\times \\$10M = \\$2.34T\n\\\\[0.5em]\n\\text{where } Cost_{state,human} = Deaths_{state} \\times VSL = 2{,}700 \\times \\$10M = \\$27B\n\\\\[0.5em]\n\\text{where } Cost_{terror,human} = Deaths_{terror} \\times VSL = 8{,}300 \\times \\$10M = \\$83B\n\\\\[0.5em]\n\\text{where } Damage_{infra,total} = Damage_{comms} + Damage_{edu} + Damage_{energy} + Damage_{health} + Damage_{transport} + Damage_{water} = \\$298B + \\$234B + \\$422B + \\$166B + \\$487B + \\$268B = \\$1.88T\n\\\\[0.5em]\n\\text{where } Disruption_{trade} = Disruption_{currency} + Disruption_{energy} + Disruption_{shipping} + Disruption_{supply} = \\$57.4B + \\$125B + \\$247B + \\$187B = \\$616B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/peace-dividend.html",
  manualPageTitle: "Peace Dividend",
};

export const GLOBAL_ANNUAL_WAR_INDIRECT_COSTS_TOTAL: Parameter = {
  value: 3700100000000.0,
  parameterName: "GLOBAL_ANNUAL_WAR_INDIRECT_COSTS_TOTAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_annual_war_indirect_costs_total",
  unit: "USD/year",
  displayName: "Total Annual Indirect War Costs",
  description: "Total annual indirect war costs (opportunity cost + veterans + refugees + environment + mental health + lost productivity)",
  sourceType: "calculated",
  confidence: "high",
  formula: "OPPORTUNITY + VETERANS + REFUGEES + ENVIRONMENT + MENTAL_HEALTH + LOST_CAPITAL",
  latex: "\\begin{gathered}\nCost_{war,indirect} \\\\\n= Damage_{env} + Loss_{growth,mil} + Loss_{capital,conflict} \\\\\n+ Cost_{psych} + Cost_{refugee} + Cost_{vet} \\\\\n= \\$100B + \\$2.72T + \\$300B + \\$232B + \\$150B + \\$200B \\\\\n= \\$3.7T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/peace-dividend.html",
  manualPageTitle: "Peace Dividend",
};

export const GLOBAL_AVG_HOURLY_INCOME: Parameter = {
  value: 7.1875,
  parameterName: "GLOBAL_AVG_HOURLY_INCOME",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_avg_hourly_income",
  unit: "USD/hour",
  displayName: "Global Average Hourly Income",
  description: "Global average hourly income derived from GDP per capita. Uses average (not median), which overestimates the cost of sharing, making the payoff ratio conservative.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_AVG_INCOME_2025 / ANNUAL_WORKING_HOURS",
  latex: "\\begin{gathered}\n\\bar{w}_{hour} = \\frac{\\bar{y}_{0}}{H_{work}} = \\frac{\\$14.4K}{2{,}000} = \\$7.19\n\\\\[0.5em]\n\\text{where } \\bar{y}_{0} = \\frac{GDP_{global}}{Pop_{global}} = \\frac{\\$115T}{8B} = \\$14.4K\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/recruitment-and-propaganda-plan.html",
  manualPageTitle: "Recruitment & Propaganda Plan",
};

export const GLOBAL_AVG_INCOME_2025: Parameter = {
  value: 14375.0,
  parameterName: "GLOBAL_AVG_INCOME_2025",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_avg_income_2025",
  unit: "USD",
  displayName: "Global Average Income (2025 Baseline)",
  description: "Global average income (GDP per capita) in 2025 baseline.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_GDP_2025 ÷ GLOBAL_POPULATION_2024",
  latex: "\\begin{gathered}\n\\bar{y}_{0} \\\\\n= \\frac{GDP_{global}}{Pop_{global}} \\\\\n= \\frac{\\$115T}{8B} \\\\\n= \\$14.4K\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/political-dysfunction-tax.html",
  manualPageTitle: "The Political Dysfunction Tax",
};

export const GLOBAL_AVG_REMAINING_YEARS: Parameter = {
  value: 48.5,
  parameterName: "GLOBAL_AVG_REMAINING_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_avg_remaining_years",
  unit: "years",
  displayName: "Average Remaining Years (Median Person)",
  description: "Average remaining lifespan for the median-age person. Conservative: uses life expectancy at birth minus median age, which underestimates remaining years because survivors to age 30 have higher conditional life expectancy.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_LIFE_EXPECTANCY_2024 - GLOBAL_MEDIAN_AGE_2024",
  latex: "\\begin{gathered}\nT_{remaining} \\\\\n= LE_{global} - Age_{median} \\\\\n= 79 - 30.5 \\\\\n= 48.5\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/call-to-action/your-personal-benefits.html",
  manualPageTitle: "Your Personal Benefits",
};

export const GLOBAL_COORDINATION_ACTIVATION_BUDGET: Parameter = {
  value: 30000000000.0,
  parameterName: "GLOBAL_COORDINATION_ACTIVATION_BUDGET",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_coordination_activation_budget",
  unit: "USD",
  displayName: "Global Coordination Activation Budget",
  description: "Canonical institutional activation threshold: capital required to make 50% participation credible through direct referral incentives, verification, payment rails, and global launch operations. This is the main institutional ask, not the PRIZE pool seed benchmark.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_COORDINATION_TARGET_SUPPORTERS × GLOBAL_COORDINATION_ACTIVATION_COST_PER_PARTICIPANT + GLOBAL_COORDINATION_PLATFORM_AND_OPERATIONS_COST",
  latex: "B_{activate} = N_{coord} \\times C_{activate,pp} + C_{ops}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-protocol-v1.html",
  manualPageTitle: "Earth Optimization Protocol v1",
};

export const GLOBAL_COORDINATION_ACTIVATION_COST_PER_PARTICIPANT: Parameter = {
  value: 6.5,
  parameterName: "GLOBAL_COORDINATION_ACTIVATION_COST_PER_PARTICIPANT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_coordination_activation_cost_per_participant",
  unit: "USD",
  displayName: "Activation Cost per Participant",
  description: "Blended variable activation cost per successful verified participant: direct incentive plus verification and payment operations.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_COORDINATION_ACTIVATION_REWARD_PER_VERIFIED_PARTICIPANT + GLOBAL_COORDINATION_VERIFICATION_AND_PAYMENT_COST_PER_PARTICIPANT",
  latex: "C_{activate,pp} = R_{activate} + C_{verify,pp}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/global-referendum.html",
  manualPageTitle: "Global Referendum Strategy",
};

export const GLOBAL_COORDINATION_TARGET_SUPPORTERS: Parameter = {
  value: 4000000000.0,
  parameterName: "GLOBAL_COORDINATION_TARGET_SUPPORTERS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_coordination_target_supporters",
  unit: "of people",
  displayName: "Global Coordination Target Supporters",
  description: "Number of people implied by the modeled end-state global coordination target (global population × 50%).",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_POPULATION_2024 × GLOBAL_COORDINATION_TARGET_PCT",
  latex: "N_{coord} = N_{global} \\times R_{coord}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/global-referendum.html",
  manualPageTitle: "Global Referendum Strategy",
};

export const GLOBAL_COST_PER_LIFE_SAVED_MED_RESEARCH_ANNUAL: Parameter = {
  value: 16071.42857142857,
  parameterName: "GLOBAL_COST_PER_LIFE_SAVED_MED_RESEARCH_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_cost_per_life_saved_med_research_annual",
  unit: "USD/life",
  displayName: "Cost per Life Saved by Medical Research",
  description: "Cost per life saved by medical research",
  sourceType: "calculated",
  confidence: "high",
  formula: "(RESEARCH_SPENDING × 1B) ÷ LIVES_SAVED",
  latex: "\\begin{gathered}\nCost_{life,RD} \\\\\n= \\frac{Spending_{RD}}{Lives_{RD,ann}} \\\\\n= \\frac{\\$67.5B}{4.2M} \\\\\n= \\$16.1K\n\\end{gathered}",
};

export const GLOBAL_DESTRUCTIVE_ECONOMY_ANNUAL_2025: Parameter = {
  value: 13220000000000.0,
  parameterName: "GLOBAL_DESTRUCTIVE_ECONOMY_ANNUAL_2025",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_destructive_economy_annual_2025",
  unit: "USD",
  displayName: "Global Destructive Economy (2025)",
  description: "Combined annual cost of military spending and cybercrime. The 'destructive economy' that competes with the productive economy.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_MILITARY_SPENDING_ANNUAL_2024 + GLOBAL_CYBERCRIME_COST_ANNUAL_2025",
  latex: "\\begin{gathered}\nCost_{destruct} \\\\\n= Spending_{mil} + Cost_{cyber} \\\\\n= \\$2.72T + \\$10.5T \\\\\n= \\$13.2T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/treaty-feasibility.html",
  manualPageTitle: "Treaty Feasibility & Cost Analysis",
};

export const GLOBAL_DESTRUCTIVE_ECONOMY_PCT_GDP: Parameter = {
  value: 0.11495652173913043,
  parameterName: "GLOBAL_DESTRUCTIVE_ECONOMY_PCT_GDP",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_destructive_economy_pct_gdp",
  unit: "percent",
  displayName: "Destructive Economy as % of GDP",
  description: "Destructive economy (military + cybercrime) as percentage of global GDP.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_DESTRUCTIVE_ECONOMY_ANNUAL_2025 / GLOBAL_GDP_2025",
  latex: "\\begin{gathered}\nr_{destruct:GDP} = \\frac{Cost_{destruct}}{GDP_{global}} = \\frac{\\$13.2T}{\\$115T} = 11.5\\%\n\\\\[0.5em]\n\\text{where } Cost_{destruct} = Spending_{mil} + Cost_{cyber} = \\$2.72T + \\$10.5T = \\$13.2T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/gdp-trajectories.html",
  manualPageTitle: "Please Select an Earth: A) Everyone Gets Rich B) Somalia, but Everywhere",
};

export const GLOBAL_DISEASE_DEATHS_PER_MINUTE: Parameter = {
  value: 104.16666666666667,
  parameterName: "GLOBAL_DISEASE_DEATHS_PER_MINUTE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_disease_deaths_per_minute",
  unit: "deaths/minute",
  displayName: "Global Deaths per Minute from Disease",
  description: "Global deaths per minute from all disease and aging",
  sourceType: "calculated",
  confidence: "high",
  latex: "\\frac{Deaths_{disease,daily}}{1440}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const GLOBAL_DISEASE_ECONOMIC_BURDEN_ANNUAL: Parameter = {
  value: 400152130131680.9,
  parameterName: "GLOBAL_DISEASE_ECONOMIC_BURDEN_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_disease_economic_burden_annual",
  unit: "USD/year",
  displayName: "Annual Welfare Cost of Avoidable Disease",
  description: "Annual welfare cost of avoidable disease globally. Calculated as global DALY burden × eventually avoidable percentage × standard QALY value ($150K). Uses consistent QALY valuation matching all other health impact calculations. Medical costs and productivity losses are NOT added separately to avoid double-counting (QALY valuation already captures these welfare components).",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_ANNUAL_DALY_BURDEN × EVENTUALLY_AVOIDABLE_DALY_PCT × STANDARD_ECONOMIC_QALY_VALUE_USD",
  latex: "\\begin{gathered}\nBurden_{disease} \\\\\n= DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times Value_{QALY} \\\\\n= 2.88B \\times 92.6\\% \\times \\$150K \\\\\n= \\$400T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const GLOBAL_HALE_GAP: Parameter = {
  value: 15.700000000000003,
  parameterName: "GLOBAL_HALE_GAP",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_hale_gap",
  unit: "years",
  displayName: "Life Expectancy to HALE Gap",
  description: "Gap between life expectancy and healthy life expectancy. Represents years lived with disability or disease that could be recovered by curing diseases.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_LIFE_EXPECTANCY_2024 - GLOBAL_HALE_CURRENT",
  latex: "\\Delta_{HALE} = LE_{global} - HALE_{0} = 79 - 63.3 = 15.7",
};

export const GLOBAL_INDUSTRY_CLINICAL_TRIALS_SPENDING_ANNUAL: Parameter = {
  value: 55500000000.0,
  parameterName: "GLOBAL_INDUSTRY_CLINICAL_TRIALS_SPENDING_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_industry_clinical_trials_spending_annual",
  unit: "USD",
  displayName: "Annual Global Industry Spending on Clinical Trials",
  description: "Annual global industry spending on clinical trials (Total - Government)",
  sourceType: "calculated",
  confidence: "high",
  formula: "TOTAL_CLINICAL_TRIALS - GOVT_CLINICAL_TRIALS",
  latex: "\\begin{gathered}\nSpending_{trials,industry} \\\\\n= Spending_{trials} - Spending_{trials,gov} \\\\\n= \\$60B - \\$4.5B \\\\\n= \\$55.5B\n\\end{gathered}",
};

export const GLOBAL_MILITARY_SPENDING_PER_CAPITA_ANNUAL: Parameter = {
  value: 340.0,
  parameterName: "GLOBAL_MILITARY_SPENDING_PER_CAPITA_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_military_spending_per_capita_annual",
  unit: "USD/person/year",
  displayName: "Per Capita Military Spending Globally",
  description: "Per capita military spending globally",
  sourceType: "calculated",
  confidence: "high",
  formula: "MILITARY_SPENDING ÷ POPULATION",
  latex: "\\begin{gathered}\nSpending_{mil,pc} \\\\\n= \\frac{Spending_{mil}}{Pop_{global}} \\\\\n= \\frac{\\$2.72T}{8B} \\\\\n= \\$340\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem.html",
  manualPageTitle: "Diagnostic Summary",
};

export const GLOBAL_MILITARY_SPENDING_POST_TREATY_ANNUAL_2024: Parameter = {
  value: 2692800000000.0,
  parameterName: "GLOBAL_MILITARY_SPENDING_POST_TREATY_ANNUAL_2024",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_military_spending_post_treaty_annual_2024",
  unit: "USD/year",
  displayName: "Global Military Spending After 1% Treaty Reduction",
  description: "Global military spending after 1% treaty reduction",
  sourceType: "calculated",
  confidence: "high",
  formula: "MILITARY_SPENDING × (1 - REDUCTION)",
  latex: "\\begin{gathered}\nSpending_{mil,post} \\\\\n= Spending_{mil} \\times (1 - Reduce_{treaty}) \\\\\n= \\$2.72T \\times (1 - 1\\%) \\\\\n= \\$2.69T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/aligning-incentives.html",
  manualPageTitle: "Aligning Incentives",
};

export const GLOBAL_POLITICAL_REFORM_INVESTMENT: Parameter = {
  value: 127550000000.0,
  parameterName: "GLOBAL_POLITICAL_REFORM_INVESTMENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_political_reform_investment",
  unit: "USD",
  displayName: "Global Political Reform Investment",
  description: "Estimated global advocacy investment for policy reform. Calculated as US costs × global ratio (based on discretionary spending). Upper bound representing full democratic engagement at scale.",
  sourceType: "calculated",
  confidence: "low",
  formula: "US_POLITICAL_REFORM × GLOBAL_RATIO",
  latex: "\\begin{gathered}\nCost_{global,reform} = Cost_{US,total} \\times \\rho_{global/US} = \\$25.5B \\times 5 = \\$128B\n\\\\[0.5em]\n\\text{where } Cost_{US,total} = (Cost_{campaign} + Cost_{lobby} \\times 2) \\times \\mu_{effort} + Cost_{career}\n\\\\[0.5em]\n\\text{where } Cost_{US,congress} = N_{congress} \\times V_{post-office} = 535 \\times \\$10M = \\$5.35B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/cost-of-change-analysis.html",
  manualPageTitle: "The Price of Political Change: A Cost-Benefit Framework for Policy Incentivization",
};

export const GLOBAL_TOTAL_HEALTH_AND_WAR_COST_ANNUAL: Parameter = {
  value: 411509230131680.9,
  parameterName: "GLOBAL_TOTAL_HEALTH_AND_WAR_COST_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_total_health_and_war_cost_annual",
  unit: "USD/year",
  displayName: "Total Annual Cost of War and Disease",
  description: "Total annual welfare cost of war and disease. Disease burden uses DALY-based welfare valuation; war costs use direct + indirect economic costs. Symptomatic treatment costs NOT added separately (already captured in QALY valuation).",
  sourceType: "calculated",
  confidence: "high",
  formula: "WAR_TOTAL_COSTS + DISEASE_WELFARE_BURDEN",
  latex: "\\begin{gathered}\nCost_{health+war} = Cost_{war,total} + Burden_{disease} = \\$11.4T + \\$400T = \\$412T\n\\\\[0.5em]\n\\text{where } Cost_{war,total} = Cost_{war,direct} + Cost_{war,indirect} = \\$7.66T + \\$3.7T = \\$11.4T\n\\\\[0.5em]\n\\text{where } Cost_{war,direct} = Loss_{life,conflict} + Damage_{infra,total} + Disruption_{trade} + Spending_{mil} = \\$2.45T + \\$1.88T + \\$616B + \\$2.72T = \\$7.66T\n\\\\[0.5em]\n\\text{where } Loss_{life,conflict} = Cost_{combat,human} + Cost_{state,human} + Cost_{terror,human} = \\$2.34T + \\$27B + \\$83B = \\$2.45T\n\\\\[0.5em]\n\\text{where } Cost_{combat,human} = Deaths_{combat} \\times VSL = 234{,}000 \\times \\$10M = \\$2.34T\n\\\\[0.5em]\n\\text{where } Cost_{state,human} = Deaths_{state} \\times VSL = 2{,}700 \\times \\$10M = \\$27B\n\\\\[0.5em]\n\\text{where } Cost_{terror,human} = Deaths_{terror} \\times VSL = 8{,}300 \\times \\$10M = \\$83B\n\\\\[0.5em]\n\\text{where } Damage_{infra,total} = Damage_{comms} + Damage_{edu} + Damage_{energy} + Damage_{health} + Damage_{transport} + Damage_{water} = \\$298B + \\$234B + \\$422B + \\$166B + \\$487B + \\$268B = \\$1.88T\n\\\\[0.5em]\n\\text{where } Disruption_{trade} = Disruption_{currency} + Disruption_{energy} + Disruption_{shipping} + Disruption_{supply} = \\$57.4B + \\$125B + \\$247B + \\$187B = \\$616B\n\\\\[0.5em]\n\\text{where } Cost_{war,indirect} = Damage_{env} + Loss_{growth,mil} + Loss_{capital,conflict} + Cost_{psych} + Cost_{refugee} + Cost_{vet} = \\$100B + \\$2.72T + \\$300B + \\$232B + \\$150B + \\$200B = \\$3.7T\n\\\\[0.5em]\n\\text{where } Burden_{disease} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times Value_{QALY} = 2.88B \\times 92.6\\% \\times \\$150K = \\$400T\n\\end{gathered}",
};

export const HEALTHCARE_VS_MILITARY_MULTIPLIER_RATIO: Parameter = {
  value: 7.166666666666667,
  parameterName: "HEALTHCARE_VS_MILITARY_MULTIPLIER_RATIO",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-healthcare_vs_military_multiplier_ratio",
  unit: "x",
  displayName: "Healthcare vs Military Multiplier Ratio",
  description: "Ratio of healthcare to military fiscal multipliers. Healthcare investment generates 7× more economic activity per dollar than military spending.",
  sourceType: "calculated",
  confidence: "high",
  formula: "ECONOMIC_MULTIPLIER_HEALTHCARE_INVESTMENT / ECONOMIC_MULTIPLIER_MILITARY_SPENDING",
  latex: "\\begin{gathered}\nr_{health/mil} \\\\\n= \\frac{k_{health}}{k_{mil}} \\\\\n= \\frac{4.3}{0.6} \\\\\n= 7.17\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const IAB_MECHANISM_BENEFIT_COST_RATIO: Parameter = {
  value: 229.61531707317073,
  parameterName: "IAB_MECHANISM_BENEFIT_COST_RATIO",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-iab_mechanism_benefit_cost_ratio",
  unit: "ratio",
  displayName: "IAB Mechanism Benefit-Cost Ratio",
  description: "Benefit-Cost Ratio of the IAB mechanism itself",
  sourceType: "calculated",
  sourceRef: "https://iab.warondisease.org##welfare-analysis",
  sourceUrl: "https://iab.warondisease.org##welfare-analysis",
  confidence: "high",
  formula: "TREATY_PEACE_PLUS_RD_BENEFITS ÷ IAB_MECHANISM_COST",
  latex: "\\begin{gathered}\nBCR_{IAB} = \\frac{Benefit_{peace+RD}}{Cost_{IAB,ann}} = \\frac{\\$172B}{\\$750M} = 230\n\\\\[0.5em]\n\\text{where } Benefit_{peace+RD} = Benefit_{peace,soc} + Benefit_{RD,ann} = \\$114B + \\$58.6B = \\$172B\n\\\\[0.5em]\n\\text{where } Benefit_{peace,soc} = Cost_{war,total} \\times Reduce_{treaty} = \\$11.4T \\times 1\\% = \\$114B\n\\\\[0.5em]\n\\text{where } Cost_{war,total} = Cost_{war,direct} + Cost_{war,indirect} = \\$7.66T + \\$3.7T = \\$11.4T\n\\\\[0.5em]\n\\text{where } Cost_{war,direct} = Loss_{life,conflict} + Damage_{infra,total} + Disruption_{trade} + Spending_{mil} = \\$2.45T + \\$1.88T + \\$616B + \\$2.72T = \\$7.66T\n\\\\[0.5em]\n\\text{where } Loss_{life,conflict} = Cost_{combat,human} + Cost_{state,human} + Cost_{terror,human} = \\$2.34T + \\$27B + \\$83B = \\$2.45T\n\\\\[0.5em]\n\\text{where } Cost_{combat,human} = Deaths_{combat} \\times VSL = 234{,}000 \\times \\$10M = \\$2.34T\n\\\\[0.5em]\n\\text{where } Cost_{state,human} = Deaths_{state} \\times VSL = 2{,}700 \\times \\$10M = \\$27B\n\\\\[0.5em]\n\\text{where } Cost_{terror,human} = Deaths_{terror} \\times VSL = 8{,}300 \\times \\$10M = \\$83B\n\\\\[0.5em]\n\\text{where } Damage_{infra,total} = Damage_{comms} + Damage_{edu} + Damage_{energy} + Damage_{health} + Damage_{transport} + Damage_{water} = \\$298B + \\$234B + \\$422B + \\$166B + \\$487B + \\$268B = \\$1.88T\n\\\\[0.5em]\n\\text{where } Disruption_{trade} = Disruption_{currency} + Disruption_{energy} + Disruption_{shipping} + Disruption_{supply} = \\$57.4B + \\$125B + \\$247B + \\$187B = \\$616B\n\\\\[0.5em]\n\\text{where } Cost_{war,indirect} = Damage_{env} + Loss_{growth,mil} + Loss_{capital,conflict} + Cost_{psych} + Cost_{refugee} + Cost_{vet} = \\$100B + \\$2.72T + \\$300B + \\$232B + \\$150B + \\$200B = \\$3.7T\n\\\\[0.5em]\n\\text{where } Benefit_{RD,ann} = Spending_{trials} \\times Reduce_{pct} = \\$60B \\times 97.7\\% = \\$58.6B\n\\\\[0.5em]\n\\text{where } Reduce_{pct} = 1 - \\frac{Cost_{pragmatic,pt}}{Cost_{P3,pt}} = 1 - \\frac{\\$929}{\\$41K} = 97.7\\%\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/incentive-alignment-bonds-paper.html",
  manualPageTitle: "Incentive Alignment Bonds: Making Public Goods Financially and Politically Profitable",
};

export const IAB_POLITICAL_INCENTIVE_FUNDING_ANNUAL: Parameter = {
  value: 2720000000.0,
  parameterName: "IAB_POLITICAL_INCENTIVE_FUNDING_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-iab_political_incentive_funding_annual",
  unit: "USD/year",
  displayName: "Annual IAB Political Incentive Funding",
  description: "Annual funding for IAB political incentive mechanism (independent expenditures supporting high-scoring politicians, post-office fellowship endowments, Public Good Score infrastructure)",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_FUNDING × IAB_POLITICAL_INCENTIVE_PCT",
  latex: "\\begin{gathered}\nFunding_{political,ann} = Funding_{treaty} \\times Pct_{political} = \\$27.2B \\times 10\\% = \\$2.72B\n\\\\[0.5em]\n\\text{where } Funding_{treaty} = Spending_{mil} \\times Reduce_{treaty} = \\$2.72T \\times 1\\% = \\$27.2B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/treaty-feasibility.html",
  manualPageTitle: "Treaty Feasibility & Cost Analysis",
};

export const IAB_VS_DEFENSE_LOBBY_RATIO_AT_1PCT: Parameter = {
  value: 21.41732283464567,
  parameterName: "IAB_VS_DEFENSE_LOBBY_RATIO_AT_1PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-iab_vs_defense_lobby_ratio_at_1pct",
  unit: "x",
  displayName: "IAB vs Defense Lobbying Ratio at 1% Treaty",
  description: "Ratio of IAB political incentive funding to defense industry lobbying at 1% treaty level. At just 1%, the health lobby already outguns the defense lobby by this factor.",
  sourceType: "calculated",
  confidence: "high",
  formula: "IAB_POLITICAL_INCENTIVE_FUNDING_ANNUAL / DEFENSE_LOBBYING_ANNUAL",
  latex: "\\begin{gathered}\nk_{IAB:defense} = \\frac{Funding_{political,ann}}{Lobby_{def,ann}} = \\frac{\\$2.72B}{\\$127M} = 21.4\n\\\\[0.5em]\n\\text{where } Funding_{political,ann} = Funding_{treaty} \\times Pct_{political} = \\$27.2B \\times 10\\% = \\$2.72B\n\\\\[0.5em]\n\\text{where } Funding_{treaty} = Spending_{mil} \\times Reduce_{treaty} = \\$2.72T \\times 1\\% = \\$27.2B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/peace-dividend.html",
  manualPageTitle: "Peace Dividend",
};

export const INDUSTRY_VS_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO: Parameter = {
  value: 12.333333333333334,
  parameterName: "INDUSTRY_VS_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-industry_vs_government_clinical_trials_spending_ratio",
  unit: "ratio",
  displayName: "Ratio of Industry to Government Clinical Trials Spending",
  description: "Ratio of Industry to Government spending on clinical trials (approx 90/10 split)",
  sourceType: "calculated",
  sourceRef: "industry-vs-government-trial-spending-split",
  sourceUrl: "https://www.appliedclinicaltrialsonline.com/view/sizing-clinical-research-market",
  confidence: "high",
  formula: "(TOTAL - GOVT) / GOVT",
  latex: "\\begin{gathered}\nRatio_{ind:gov} \\\\\n= \\frac{Spending_{trials}}{Spending_{trials,gov}} - 1 \\\\\n= \\frac{\\$60B}{\\$4.5B} - 1 \\\\\n= 12.3\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/global-government-medical-research-spending.html",
  manualPageTitle: "Medical Research Spending: The {{< var global_med_research_spending >}} Lie",
};

export const LIFE_EXPECTANCY_GAIN_1883_1962_YEARS_PER_DECADE: Parameter = {
  value: 0.0,
  parameterName: "LIFE_EXPECTANCY_GAIN_1883_1962_YEARS_PER_DECADE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-life_expectancy_gain_1883_1962_years_per_decade",
  unit: "years/decade",
  displayName: "Life Expectancy Gain Rate (1883-1962)",
  description: "US life expectancy linear gain rate 1883-1962 (pre-Kefauver-Harris).",
  sourceType: "calculated",
  sourceRef: "life-expectancy-increase-pre-1962",
  sourceUrl: "https://manual.warondisease.org/knowledge/data/us-life-expectancy-fda-budget-1543-2019.csv",
  confidence: "high",
  formula: "(life_exp_1962 - life_exp_1880) / 7.9 decades",
  latex: "\\begin{gathered}\n\\Delta LE_{pre62} \\\\\n= \\frac{LE_{US,1962} - LE_{US,1880}}{7.69} \\\\\n= \\frac{70.1 - 39.4}{7.69} \\\\\n= 0\n\\end{gathered}",
  peerReviewed: true,
};

export const LIFE_EXPECTANCY_GAIN_1962_2019_YEARS_PER_DECADE: Parameter = {
  value: 0.0,
  parameterName: "LIFE_EXPECTANCY_GAIN_1962_2019_YEARS_PER_DECADE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-life_expectancy_gain_1962_2019_years_per_decade",
  unit: "years/decade",
  displayName: "Life Expectancy Gain Rate (1962-2019)",
  description: "US life expectancy linear gain rate 1962-2019 (post-Kefauver-Harris).",
  sourceType: "calculated",
  sourceRef: "post-1962-life-expectancy-slowdown",
  sourceUrl: "https://manual.warondisease.org/knowledge/data/us-life-expectancy-fda-budget-1543-2019.csv",
  confidence: "high",
  formula: "(life_exp_2019 - life_exp_1962) / 5.7 decades",
  latex: "\\begin{gathered}\n\\Delta LE_{post62} \\\\\n= \\frac{LE_{US,2019} - LE_{US,1962}}{5.56} \\\\\n= \\frac{78.9 - 70.1}{5.56} \\\\\n= 0\n\\end{gathered}",
  peerReviewed: true,
};

export const MEDICAL_RESEARCH_PCT_OF_DISEASE_BURDEN: Parameter = {
  value: 0.00016403034259620457,
  parameterName: "MEDICAL_RESEARCH_PCT_OF_DISEASE_BURDEN",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-medical_research_pct_of_disease_burden",
  unit: "rate",
  displayName: "Medical Research Spending as Percentage of Total Disease Burden",
  description: "Medical research spending as percentage of total disease burden",
  sourceType: "calculated",
  confidence: "high",
  formula: "MED_RESEARCH ÷ TOTAL_BURDEN",
  latex: "\\begin{gathered}\nPct_{RD:burden} = \\frac{Spending_{RD}}{Cost_{health+war}} = \\frac{\\$67.5B}{\\$412T} = 0.0164\\%\n\\\\[0.5em]\n\\text{where } Cost_{health+war} = Cost_{war,total} + Burden_{disease} = \\$11.4T + \\$400T = \\$412T\n\\\\[0.5em]\n\\text{where } Cost_{war,total} = Cost_{war,direct} + Cost_{war,indirect} = \\$7.66T + \\$3.7T = \\$11.4T\n\\\\[0.5em]\n\\text{where } Cost_{war,direct} = Loss_{life,conflict} + Damage_{infra,total} + Disruption_{trade} + Spending_{mil} = \\$2.45T + \\$1.88T + \\$616B + \\$2.72T = \\$7.66T\n\\\\[0.5em]\n\\text{where } Loss_{life,conflict} = Cost_{combat,human} + Cost_{state,human} + Cost_{terror,human} = \\$2.34T + \\$27B + \\$83B = \\$2.45T\n\\\\[0.5em]\n\\text{where } Cost_{combat,human} = Deaths_{combat} \\times VSL = 234{,}000 \\times \\$10M = \\$2.34T\n\\\\[0.5em]\n\\text{where } Cost_{state,human} = Deaths_{state} \\times VSL = 2{,}700 \\times \\$10M = \\$27B\n\\\\[0.5em]\n\\text{where } Cost_{terror,human} = Deaths_{terror} \\times VSL = 8{,}300 \\times \\$10M = \\$83B\n\\\\[0.5em]\n\\text{where } Damage_{infra,total} = Damage_{comms} + Damage_{edu} + Damage_{energy} + Damage_{health} + Damage_{transport} + Damage_{water} = \\$298B + \\$234B + \\$422B + \\$166B + \\$487B + \\$268B = \\$1.88T\n\\\\[0.5em]\n\\text{where } Disruption_{trade} = Disruption_{currency} + Disruption_{energy} + Disruption_{shipping} + Disruption_{supply} = \\$57.4B + \\$125B + \\$247B + \\$187B = \\$616B\n\\\\[0.5em]\n\\text{where } Cost_{war,indirect} = Damage_{env} + Loss_{growth,mil} + Loss_{capital,conflict} + Cost_{psych} + Cost_{refugee} + Cost_{vet} = \\$100B + \\$2.72T + \\$300B + \\$232B + \\$150B + \\$200B = \\$3.7T\n\\\\[0.5em]\n\\text{where } Burden_{disease} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times Value_{QALY} = 2.88B \\times 92.6\\% \\times \\$150K = \\$400T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const MILITARY_TO_CLINICAL_TRIALS_SPENDING_RATIO: Parameter = {
  value: 45.333333333333336,
  parameterName: "MILITARY_TO_CLINICAL_TRIALS_SPENDING_RATIO",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-military_to_clinical_trials_spending_ratio",
  unit: "ratio",
  displayName: "Ratio of Military to Clinical Trials Spending",
  description: "Ratio of global military spending to all clinical trials spending (government + industry + nonprofit)",
  sourceType: "calculated",
  confidence: "high",
  formula: "MILITARY_SPENDING / TOTAL_CLINICAL_TRIALS",
  latex: "\\begin{gathered}\nRatio_{mil:trials} \\\\\n= \\frac{Spending_{mil}}{Spending_{trials}} \\\\\n= \\frac{\\$2.72T}{\\$60B} \\\\\n= 45.3\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO: Parameter = {
  value: 604.4444444444445,
  parameterName: "MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-military_to_government_clinical_trials_spending_ratio",
  unit: "ratio",
  displayName: "Ratio of Military to Government Clinical Trials Spending",
  description: "Ratio of global military spending to government clinical trials spending",
  sourceType: "calculated",
  confidence: "high",
  formula: "MILITARY_SPENDING / GOVT_CLINICAL_TRIALS_SPENDING",
  latex: "\\begin{gathered}\nRatio_{mil:gov} \\\\\n= \\frac{Spending_{mil}}{Spending_{trials,gov}} \\\\\n= \\frac{\\$2.72T}{\\$4.5B} \\\\\n= 604\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const MILITARY_VS_MEDICAL_RESEARCH_RATIO: Parameter = {
  value: 40.2962962962963,
  parameterName: "MILITARY_VS_MEDICAL_RESEARCH_RATIO",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-military_vs_medical_research_ratio",
  unit: "ratio",
  displayName: "Ratio of Military Spending to Medical Research Spending",
  description: "Ratio of military spending to medical research spending",
  sourceType: "calculated",
  confidence: "high",
  formula: "MILITARY_SPENDING ÷ MEDICAL_RESEARCH",
  latex: "\\begin{gathered}\nRatio_{mil:RD} \\\\\n= \\frac{Spending_{mil}}{Spending_{RD}} \\\\\n= \\frac{\\$2.72T}{\\$67.5B} \\\\\n= 40.3\n\\end{gathered}",
};

export const MISALLOCATION_FACTOR_DEATH_VS_SAVING: Parameter = {
  value: 2889.0596892886347,
  parameterName: "MISALLOCATION_FACTOR_DEATH_VS_SAVING",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-misallocation_factor_death_vs_saving",
  unit: "x",
  displayName: "Misallocation Factor: Cost to Kill vs Cost to Save",
  description: "Misallocation factor: cost to kill vs cost to save",
  sourceType: "calculated",
  confidence: "high",
  formula: "COST_PER_DEATH ÷ COST_PER_LIFE_SAVED",
  latex: "\\begin{gathered}\nk_{misalloc} = \\frac{Cost_{war,total}}{Deaths_{conflict} \\times Cost_{life,RD}} = \\frac{\\$11.4T}{245{,}000 \\times \\$16.1K} = 2{,}890\n\\\\[0.5em]\n\\text{where } Deaths_{conflict} = Deaths_{combat} + Deaths_{state} + Deaths_{terror} = 234{,}000 + 2{,}700 + 8{,}300 = 245{,}000\n\\\\[0.5em]\n\\text{where } Cost_{war,total} = Cost_{war,direct} + Cost_{war,indirect} = \\$7.66T + \\$3.7T = \\$11.4T\n\\\\[0.5em]\n\\text{where } Cost_{war,direct} = Loss_{life,conflict} + Damage_{infra,total} + Disruption_{trade} + Spending_{mil} = \\$2.45T + \\$1.88T + \\$616B + \\$2.72T = \\$7.66T\n\\\\[0.5em]\n\\text{where } Loss_{life,conflict} = Cost_{combat,human} + Cost_{state,human} + Cost_{terror,human} = \\$2.34T + \\$27B + \\$83B = \\$2.45T\n\\\\[0.5em]\n\\text{where } Cost_{combat,human} = Deaths_{combat} \\times VSL = 234{,}000 \\times \\$10M = \\$2.34T\n\\\\[0.5em]\n\\text{where } Cost_{state,human} = Deaths_{state} \\times VSL = 2{,}700 \\times \\$10M = \\$27B\n\\\\[0.5em]\n\\text{where } Cost_{terror,human} = Deaths_{terror} \\times VSL = 8{,}300 \\times \\$10M = \\$83B\n\\\\[0.5em]\n\\text{where } Damage_{infra,total} = Damage_{comms} + Damage_{edu} + Damage_{energy} + Damage_{health} + Damage_{transport} + Damage_{water} = \\$298B + \\$234B + \\$422B + \\$166B + \\$487B + \\$268B = \\$1.88T\n\\\\[0.5em]\n\\text{where } Disruption_{trade} = Disruption_{currency} + Disruption_{energy} + Disruption_{shipping} + Disruption_{supply} = \\$57.4B + \\$125B + \\$247B + \\$187B = \\$616B\n\\\\[0.5em]\n\\text{where } Cost_{war,indirect} = Damage_{env} + Loss_{growth,mil} + Loss_{capital,conflict} + Cost_{psych} + Cost_{refugee} + Cost_{vet} = \\$100B + \\$2.72T + \\$300B + \\$232B + \\$150B + \\$200B = \\$3.7T\n\\\\[0.5em]\n\\text{where } Cost_{life,RD} = \\frac{Spending_{RD}}{Lives_{RD,ann}} = \\frac{\\$67.5B}{4.2M} = \\$16.1K\n\\end{gathered}",
};

export const MRNA_THERAPEUTIC_COMBINATIONS: Parameter = {
  value: 20000000.0,
  parameterName: "MRNA_THERAPEUTIC_COMBINATIONS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-mrna_therapeutic_combinations",
  unit: "combinations",
  displayName: "mRNA Therapeutic Combinations",
  description: "mRNA therapeutic combinations (protein replacement, vaccines, enzyme delivery)",
  sourceType: "calculated",
  confidence: "high",
  formula: "PROTEINS × DISEASES",
  latex: "\\begin{gathered}\nCombos_{mRNA} \\\\\n= N_{genes} \\times N_{diseases,trial} \\\\\n= 20{,}000 \\times 1{,}000 \\\\\n= 20M\n\\end{gathered}",
};

export const NIH_TRADITIONAL_TRIAL_MAX_EFFICIENCY_PCT: Parameter = {
  value: 0.022658536585365853,
  parameterName: "NIH_TRADITIONAL_TRIAL_MAX_EFFICIENCY_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-nih_traditional_trial_max_efficiency_pct",
  unit: "percent",
  displayName: "NIH Traditional Trial Maximum Efficiency vs Pragmatic (%)",
  description: "Maximum efficiency of NIH traditional Phase 3 trials relative to pragmatic trials, expressed as a percentage. Calculated as pragmatic cost / traditional cost. This is a CEILING on NIH trial efficiency because: (1) only 3.3% of NIH budget goes to clinical trials at all, and (2) the other 96.7% funds basic research with far lower marginal value when thousands of safe compounds already await testing.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "DFDA_PRAGMATIC_COST ÷ TRADITIONAL_PHASE3_COST",
  latex: "\\begin{gathered}\n\\eta_{NIH,max} \\\\\n= \\frac{Cost_{pragmatic,pt}}{Cost_{P3,pt}} \\\\\n= \\frac{\\$929}{\\$41K} \\\\\n= 2.27\\%\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/nih-fails-2-institute-health.html",
  manualPageTitle: "NIH Fails to Institute Health",
};

export const PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT: Parameter = {
  value: 113571000000.0,
  parameterName: "PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-peace_dividend_annual_societal_benefit",
  unit: "USD/year",
  displayName: "Annual Peace Dividend from 1% Reduction in Total War Costs",
  description: "Annual peace dividend from 1% reduction in total war costs (theoretical maximum at ε=1.0)",
  sourceType: "calculated",
  confidence: "high",
  formula: "TOTAL_WAR_COST × 1% × ε (baseline ε=1.0)",
  latex: "\\begin{gathered}\nBenefit_{peace,soc} = Cost_{war,total} \\times Reduce_{treaty} = \\$11.4T \\times 1\\% = \\$114B\n\\\\[0.5em]\n\\text{where } Cost_{war,total} = Cost_{war,direct} + Cost_{war,indirect} = \\$7.66T + \\$3.7T = \\$11.4T\n\\\\[0.5em]\n\\text{where } Cost_{war,direct} = Loss_{life,conflict} + Damage_{infra,total} + Disruption_{trade} + Spending_{mil} = \\$2.45T + \\$1.88T + \\$616B + \\$2.72T = \\$7.66T\n\\\\[0.5em]\n\\text{where } Loss_{life,conflict} = Cost_{combat,human} + Cost_{state,human} + Cost_{terror,human} = \\$2.34T + \\$27B + \\$83B = \\$2.45T\n\\\\[0.5em]\n\\text{where } Cost_{combat,human} = Deaths_{combat} \\times VSL = 234{,}000 \\times \\$10M = \\$2.34T\n\\\\[0.5em]\n\\text{where } Cost_{state,human} = Deaths_{state} \\times VSL = 2{,}700 \\times \\$10M = \\$27B\n\\\\[0.5em]\n\\text{where } Cost_{terror,human} = Deaths_{terror} \\times VSL = 8{,}300 \\times \\$10M = \\$83B\n\\\\[0.5em]\n\\text{where } Damage_{infra,total} = Damage_{comms} + Damage_{edu} + Damage_{energy} + Damage_{health} + Damage_{transport} + Damage_{water} = \\$298B + \\$234B + \\$422B + \\$166B + \\$487B + \\$268B = \\$1.88T\n\\\\[0.5em]\n\\text{where } Disruption_{trade} = Disruption_{currency} + Disruption_{energy} + Disruption_{shipping} + Disruption_{supply} = \\$57.4B + \\$125B + \\$247B + \\$187B = \\$616B\n\\\\[0.5em]\n\\text{where } Cost_{war,indirect} = Damage_{env} + Loss_{growth,mil} + Loss_{capital,conflict} + Cost_{psych} + Cost_{refugee} + Cost_{vet} = \\$100B + \\$2.72T + \\$300B + \\$232B + \\$150B + \\$200B = \\$3.7T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const PEACE_DIVIDEND_CONFLICT_REDUCTION: Parameter = {
  value: 86371000000.0,
  parameterName: "PEACE_DIVIDEND_CONFLICT_REDUCTION",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-peace_dividend_conflict_reduction",
  unit: "USD/year",
  displayName: "Conflict Reduction Benefits from 1% Less Military Spending",
  description: "Conflict reduction benefits from 1% less military spending (lower confidence - assumes proportional relationship)",
  sourceType: "calculated",
  sourceRef: "calculated",
  confidence: "low",
  formula: "PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT - TREATY_ANNUAL_FUNDING",
  latex: "\\begin{gathered}\nSavings_{conflict} = Benefit_{peace,soc} - Funding_{treaty} = \\$114B - \\$27.2B = \\$86.4B\n\\\\[0.5em]\n\\text{where } Benefit_{peace,soc} = Cost_{war,total} \\times Reduce_{treaty} = \\$11.4T \\times 1\\% = \\$114B\n\\\\[0.5em]\n\\text{where } Cost_{war,total} = Cost_{war,direct} + Cost_{war,indirect} = \\$7.66T + \\$3.7T = \\$11.4T\n\\\\[0.5em]\n\\text{where } Cost_{war,direct} = Loss_{life,conflict} + Damage_{infra,total} + Disruption_{trade} + Spending_{mil} = \\$2.45T + \\$1.88T + \\$616B + \\$2.72T = \\$7.66T\n\\\\[0.5em]\n\\text{where } Loss_{life,conflict} = Cost_{combat,human} + Cost_{state,human} + Cost_{terror,human} = \\$2.34T + \\$27B + \\$83B = \\$2.45T\n\\\\[0.5em]\n\\text{where } Cost_{combat,human} = Deaths_{combat} \\times VSL = 234{,}000 \\times \\$10M = \\$2.34T\n\\\\[0.5em]\n\\text{where } Cost_{state,human} = Deaths_{state} \\times VSL = 2{,}700 \\times \\$10M = \\$27B\n\\\\[0.5em]\n\\text{where } Cost_{terror,human} = Deaths_{terror} \\times VSL = 8{,}300 \\times \\$10M = \\$83B\n\\\\[0.5em]\n\\text{where } Damage_{infra,total} = Damage_{comms} + Damage_{edu} + Damage_{energy} + Damage_{health} + Damage_{transport} + Damage_{water} = \\$298B + \\$234B + \\$422B + \\$166B + \\$487B + \\$268B = \\$1.88T\n\\\\[0.5em]\n\\text{where } Disruption_{trade} = Disruption_{currency} + Disruption_{energy} + Disruption_{shipping} + Disruption_{supply} = \\$57.4B + \\$125B + \\$247B + \\$187B = \\$616B\n\\\\[0.5em]\n\\text{where } Cost_{war,indirect} = Damage_{env} + Loss_{growth,mil} + Loss_{capital,conflict} + Cost_{psych} + Cost_{refugee} + Cost_{vet} = \\$100B + \\$2.72T + \\$300B + \\$232B + \\$150B + \\$200B = \\$3.7T\n\\\\[0.5em]\n\\text{where } Funding_{treaty} = Spending_{mil} \\times Reduce_{treaty} = \\$2.72T \\times 1\\% = \\$27.2B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const PEACE_DIVIDEND_DIRECT_COSTS: Parameter = {
  value: 76570000000.0,
  parameterName: "PEACE_DIVIDEND_DIRECT_COSTS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-peace_dividend_direct_costs",
  unit: "USD/year",
  displayName: "Annual Savings from 1% Reduction in Direct War Costs",
  description: "Annual savings from 1% reduction in direct war costs",
  sourceType: "calculated",
  confidence: "high",
  formula: "DIRECT_COSTS × 1%",
  latex: "\\begin{gathered}\nSavings_{direct} = Cost_{war,direct} \\times Reduce_{treaty} = \\$7.66T \\times 1\\% = \\$76.6B\n\\\\[0.5em]\n\\text{where } Cost_{war,direct} = Loss_{life,conflict} + Damage_{infra,total} + Disruption_{trade} + Spending_{mil} = \\$2.45T + \\$1.88T + \\$616B + \\$2.72T = \\$7.66T\n\\\\[0.5em]\n\\text{where } Loss_{life,conflict} = Cost_{combat,human} + Cost_{state,human} + Cost_{terror,human} = \\$2.34T + \\$27B + \\$83B = \\$2.45T\n\\\\[0.5em]\n\\text{where } Cost_{combat,human} = Deaths_{combat} \\times VSL = 234{,}000 \\times \\$10M = \\$2.34T\n\\\\[0.5em]\n\\text{where } Cost_{state,human} = Deaths_{state} \\times VSL = 2{,}700 \\times \\$10M = \\$27B\n\\\\[0.5em]\n\\text{where } Cost_{terror,human} = Deaths_{terror} \\times VSL = 8{,}300 \\times \\$10M = \\$83B\n\\\\[0.5em]\n\\text{where } Damage_{infra,total} = Damage_{comms} + Damage_{edu} + Damage_{energy} + Damage_{health} + Damage_{transport} + Damage_{water} = \\$298B + \\$234B + \\$422B + \\$166B + \\$487B + \\$268B = \\$1.88T\n\\\\[0.5em]\n\\text{where } Disruption_{trade} = Disruption_{currency} + Disruption_{energy} + Disruption_{shipping} + Disruption_{supply} = \\$57.4B + \\$125B + \\$247B + \\$187B = \\$616B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/peace-dividend.html",
  manualPageTitle: "Peace Dividend",
};

export const PEACE_DIVIDEND_ENVIRONMENTAL: Parameter = {
  value: 1000000000.0,
  parameterName: "PEACE_DIVIDEND_ENVIRONMENTAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-peace_dividend_environmental",
  unit: "USD/year",
  displayName: "Annual Savings from 1% Reduction in Environmental Damage",
  description: "Annual savings from 1% reduction in environmental damage",
  sourceType: "calculated",
  confidence: "high",
  formula: "ENVIRONMENTAL_DAMAGE × 1%",
  latex: "\\begin{gathered}\nSavings_{env} \\\\\n= Damage_{env} \\times Reduce_{treaty} \\\\\n= \\$100B \\times 1\\% \\\\\n= \\$1B\n\\end{gathered}",
};

export const PEACE_DIVIDEND_HUMAN_CASUALTIES: Parameter = {
  value: 24460000000.0,
  parameterName: "PEACE_DIVIDEND_HUMAN_CASUALTIES",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-peace_dividend_human_casualties",
  unit: "USD/year",
  displayName: "Annual Savings from 1% Reduction in Human Casualties",
  description: "Annual savings from 1% reduction in human casualties",
  sourceType: "calculated",
  confidence: "high",
  formula: "HUMAN_LIFE_LOSSES × 1%",
  latex: "\\begin{gathered}\nSavings_{casualties} = Loss_{life,conflict} \\times Reduce_{treaty} = \\$2.45T \\times 1\\% = \\$24.5B\n\\\\[0.5em]\n\\text{where } Loss_{life,conflict} = Cost_{combat,human} + Cost_{state,human} + Cost_{terror,human} = \\$2.34T + \\$27B + \\$83B = \\$2.45T\n\\\\[0.5em]\n\\text{where } Cost_{combat,human} = Deaths_{combat} \\times VSL = 234{,}000 \\times \\$10M = \\$2.34T\n\\\\[0.5em]\n\\text{where } Cost_{state,human} = Deaths_{state} \\times VSL = 2{,}700 \\times \\$10M = \\$27B\n\\\\[0.5em]\n\\text{where } Cost_{terror,human} = Deaths_{terror} \\times VSL = 8{,}300 \\times \\$10M = \\$83B\n\\end{gathered}",
};

export const PEACE_DIVIDEND_INDIRECT_COSTS: Parameter = {
  value: 37001000000.0,
  parameterName: "PEACE_DIVIDEND_INDIRECT_COSTS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-peace_dividend_indirect_costs",
  unit: "USD/year",
  displayName: "Annual Savings from 1% Reduction in Indirect War Costs",
  description: "Annual savings from 1% reduction in indirect war costs",
  sourceType: "calculated",
  confidence: "high",
  formula: "INDIRECT_COSTS × 1%",
  latex: "\\begin{gathered}\nSavings_{indirect} = Cost_{war,indirect} \\times Reduce_{treaty} = \\$3.7T \\times 1\\% = \\$37B\n\\\\[0.5em]\n\\text{where } Cost_{war,indirect} = Damage_{env} + Loss_{growth,mil} + Loss_{capital,conflict} + Cost_{psych} + Cost_{refugee} + Cost_{vet} = \\$100B + \\$2.72T + \\$300B + \\$232B + \\$150B + \\$200B = \\$3.7T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/peace-dividend.html",
  manualPageTitle: "Peace Dividend",
};

export const PEACE_DIVIDEND_INFRASTRUCTURE: Parameter = {
  value: 18750000000.0,
  parameterName: "PEACE_DIVIDEND_INFRASTRUCTURE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-peace_dividend_infrastructure",
  unit: "USD/year",
  displayName: "Annual Savings from 1% Reduction in Infrastructure Destruction",
  description: "Annual savings from 1% reduction in infrastructure destruction",
  sourceType: "calculated",
  confidence: "high",
  formula: "INFRASTRUCTURE_DESTRUCTION × 1%",
  latex: "\\begin{gathered}\nSavings_{infra} = Damage_{infra,total} \\times Reduce_{treaty} = \\$1.88T \\times 1\\% = \\$18.8B\n\\\\[0.5em]\n\\text{where } Damage_{infra,total} = Damage_{comms} + Damage_{edu} + Damage_{energy} + Damage_{health} + Damage_{transport} + Damage_{water} = \\$298B + \\$234B + \\$422B + \\$166B + \\$487B + \\$268B = \\$1.88T\n\\end{gathered}",
};

export const PEACE_DIVIDEND_LOST_ECONOMIC_GROWTH: Parameter = {
  value: 27180000000.0,
  parameterName: "PEACE_DIVIDEND_LOST_ECONOMIC_GROWTH",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-peace_dividend_lost_economic_growth",
  unit: "USD/year",
  displayName: "Annual Savings from 1% Reduction in Lost Economic Growth",
  description: "Annual savings from 1% reduction in lost economic growth",
  sourceType: "calculated",
  confidence: "high",
  formula: "LOST_ECONOMIC_GROWTH × 1%",
  latex: "\\begin{gathered}\nSavings_{growth} \\\\\n= Loss_{growth,mil} \\times Reduce_{treaty} \\\\\n= \\$2.72T \\times 1\\% \\\\\n= \\$27.2B\n\\end{gathered}",
};

export const PEACE_DIVIDEND_LOST_HUMAN_CAPITAL: Parameter = {
  value: 3000000000.0,
  parameterName: "PEACE_DIVIDEND_LOST_HUMAN_CAPITAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-peace_dividend_lost_human_capital",
  unit: "USD/year",
  displayName: "Annual Savings from 1% Reduction in Lost Human Capital",
  description: "Annual savings from 1% reduction in lost human capital",
  sourceType: "calculated",
  confidence: "high",
  formula: "LOST_HUMAN_CAPITAL × 1%",
  latex: "\\begin{gathered}\nSavings_{capital} \\\\\n= Loss_{capital,conflict} \\times Reduce_{treaty} \\\\\n= \\$300B \\times 1\\% \\\\\n= \\$3B\n\\end{gathered}",
};

export const PEACE_DIVIDEND_PTSD: Parameter = {
  value: 2320000000.0,
  parameterName: "PEACE_DIVIDEND_PTSD",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-peace_dividend_ptsd",
  unit: "USD/year",
  displayName: "Annual Savings from 1% Reduction in PTSD and Mental Health Costs",
  description: "Annual savings from 1% reduction in PTSD and mental health costs",
  sourceType: "calculated",
  confidence: "high",
  formula: "PTSD_COSTS × 1%",
  latex: "\\begin{gathered}\nSavings_{PTSD} \\\\\n= Cost_{psych} \\times Reduce_{treaty} \\\\\n= \\$232B \\times 1\\% \\\\\n= \\$2.32B\n\\end{gathered}",
};

export const PEACE_DIVIDEND_REFUGEE_SUPPORT: Parameter = {
  value: 1500000000.0,
  parameterName: "PEACE_DIVIDEND_REFUGEE_SUPPORT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-peace_dividend_refugee_support",
  unit: "USD/year",
  displayName: "Annual Savings from 1% Reduction in Refugee Support Costs",
  description: "Annual savings from 1% reduction in refugee support costs",
  sourceType: "calculated",
  confidence: "high",
  formula: "REFUGEE_SUPPORT × 1%",
  latex: "\\begin{gathered}\nSavings_{refugee} \\\\\n= Cost_{refugee} \\times Reduce_{treaty} \\\\\n= \\$150B \\times 1\\% \\\\\n= \\$1.5B\n\\end{gathered}",
};

export const PEACE_DIVIDEND_TRADE_DISRUPTION: Parameter = {
  value: 6160000000.0,
  parameterName: "PEACE_DIVIDEND_TRADE_DISRUPTION",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-peace_dividend_trade_disruption",
  unit: "USD/year",
  displayName: "Annual Savings from 1% Reduction in Trade Disruption",
  description: "Annual savings from 1% reduction in trade disruption",
  sourceType: "calculated",
  confidence: "high",
  formula: "TRADE_DISRUPTION × 1%",
  latex: "\\begin{gathered}\nSavings_{trade} = Disruption_{trade} \\times Reduce_{treaty} = \\$616B \\times 1\\% = \\$6.16B\n\\\\[0.5em]\n\\text{where } Disruption_{trade} = Disruption_{currency} + Disruption_{energy} + Disruption_{shipping} + Disruption_{supply} = \\$57.4B + \\$125B + \\$247B + \\$187B = \\$616B\n\\end{gathered}",
};

export const PEACE_DIVIDEND_VETERAN_HEALTHCARE: Parameter = {
  value: 2001000000.0,
  parameterName: "PEACE_DIVIDEND_VETERAN_HEALTHCARE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-peace_dividend_veteran_healthcare",
  unit: "USD/year",
  displayName: "Annual Savings from 1% Reduction in Veteran Healthcare Costs",
  description: "Annual savings from 1% reduction in veteran healthcare costs",
  sourceType: "calculated",
  confidence: "high",
  formula: "VETERAN_HEALTHCARE × 1%",
  latex: "\\begin{gathered}\nSavings_{vet} \\\\\n= Cost_{vet} \\times Reduce_{treaty} \\\\\n= \\$200B \\times 1\\% \\\\\n= \\$2B\n\\end{gathered}",
};

export const PEACE_TRAJECTORY_TOTAL_DIFFERENTIAL_20YR: Parameter = {
  value: 16329436000000.002,
  parameterName: "PEACE_TRAJECTORY_TOTAL_DIFFERENTIAL_20YR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-peace_trajectory_total_differential_20yr",
  unit: "USD",
  displayName: "Peace Trajectory Total Differential (20yr)",
  description: "Total 20-year value of the peace trajectory: research funding redirected to medicine plus war externality costs avoided. The full differential between the IAB trajectory and the current trajectory. Does not include existential risk reduction.",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_CUMULATIVE_20YR_WITH_RATCHET + WAR_COSTS_SAVED_PEACE_TRAJECTORY_20YR",
  latex: "\\begin{gathered}\nV_{peace,20yr} = Fund_{20yr,ratchet} + Savings_{war,20yr} = \\$3.16T + \\$13.2T = \\$16.3T\n\\\\[0.5em]\n\\text{where } Fund_{20yr,ratchet} = Spending_{mil} \\times 1.16 = \\$2.72T \\times 1.16 = \\$3.16T\n\\\\[0.5em]\n\\text{where } Savings_{war,20yr} = Cost_{war,total} \\times 1.16 = \\$11.4T \\times 1.16 = \\$13.2T\n\\\\[0.5em]\n\\text{where } Cost_{war,total} = Cost_{war,direct} + Cost_{war,indirect} = \\$7.66T + \\$3.7T = \\$11.4T\n\\\\[0.5em]\n\\text{where } Cost_{war,direct} = Loss_{life,conflict} + Damage_{infra,total} + Disruption_{trade} + Spending_{mil} = \\$2.45T + \\$1.88T + \\$616B + \\$2.72T = \\$7.66T\n\\\\[0.5em]\n\\text{where } Loss_{life,conflict} = Cost_{combat,human} + Cost_{state,human} + Cost_{terror,human} = \\$2.34T + \\$27B + \\$83B = \\$2.45T\n\\\\[0.5em]\n\\text{where } Cost_{combat,human} = Deaths_{combat} \\times VSL = 234{,}000 \\times \\$10M = \\$2.34T\n\\\\[0.5em]\n\\text{where } Cost_{state,human} = Deaths_{state} \\times VSL = 2{,}700 \\times \\$10M = \\$27B\n\\\\[0.5em]\n\\text{where } Cost_{terror,human} = Deaths_{terror} \\times VSL = 8{,}300 \\times \\$10M = \\$83B\n\\\\[0.5em]\n\\text{where } Damage_{infra,total} = Damage_{comms} + Damage_{edu} + Damage_{energy} + Damage_{health} + Damage_{transport} + Damage_{water} = \\$298B + \\$234B + \\$422B + \\$166B + \\$487B + \\$268B = \\$1.88T\n\\\\[0.5em]\n\\text{where } Disruption_{trade} = Disruption_{currency} + Disruption_{energy} + Disruption_{shipping} + Disruption_{supply} = \\$57.4B + \\$125B + \\$247B + \\$187B = \\$616B\n\\\\[0.5em]\n\\text{where } Cost_{war,indirect} = Damage_{env} + Loss_{growth,mil} + Loss_{capital,conflict} + Cost_{psych} + Cost_{refugee} + Cost_{vet} = \\$100B + \\$2.72T + \\$300B + \\$232B + \\$150B + \\$200B = \\$3.7T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/peace-dividend.html",
  manualPageTitle: "Peace Dividend",
};

export const PERSONAL_LIFETIME_WEALTH: Parameter = {
  value: 3000000.0,
  parameterName: "PERSONAL_LIFETIME_WEALTH",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-personal_lifetime_wealth",
  unit: "USD",
  displayName: "Personal Lifetime Wealth (QALY-Based)",
  description: "Personal lifetime wealth from life extension valued at standard QALY rate. Simple formula: years of life gained × economic value per healthy year. Uncertainty in LIFE_EXTENSION_YEARS (5-100 year range, median 20) propagates through Monte Carlo.",
  sourceType: "calculated",
  confidence: "low",
  formula: "LIFE_EXTENSION_YEARS × STANDARD_ECONOMIC_QALY_VALUE_USD",
  latex: "Wealth_{lifetime} = T_{extend} \\times Value_{QALY}",
};

export const PER_CAPITA_CHRONIC_DISEASE_COST: Parameter = {
  value: 12238.805970149253,
  parameterName: "PER_CAPITA_CHRONIC_DISEASE_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-per_capita_chronic_disease_cost",
  unit: "USD/person/year",
  displayName: "US Per Capita Chronic Disease Cost",
  description: "US per capita chronic disease cost",
  sourceType: "calculated",
  confidence: "high",
  formula: "US_CHRONIC_DISEASE_SPENDING ÷ US_POPULATION",
  latex: "\\begin{gathered}\nCost_{chronic,pc} \\\\\n= \\frac{Spending_{chronic,US}}{Pop_{US}} \\\\\n= \\frac{\\$4.1T}{335M} \\\\\n= \\$12.2K\n\\end{gathered}",
};

export const PER_CAPITA_MENTAL_HEALTH_COST: Parameter = {
  value: 1044.7761194029852,
  parameterName: "PER_CAPITA_MENTAL_HEALTH_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-per_capita_mental_health_cost",
  unit: "USD/person/year",
  displayName: "US Per Capita Mental Health Cost",
  description: "US per capita mental health cost",
  sourceType: "calculated",
  confidence: "high",
  formula: "US_MENTAL_HEALTH_COST ÷ US_POPULATION",
  latex: "\\begin{gathered}\nCost_{mental,pc} \\\\\n= \\frac{Cost_{mental,US}}{Pop_{US}} \\\\\n= \\frac{\\$350B}{335M} \\\\\n= \\$1.04K\n\\end{gathered}",
};

export const PHARMA_LIVES_SAVED_ANNUAL: Parameter = {
  value: 12391666.666666666,
  parameterName: "PHARMA_LIVES_SAVED_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-pharma_lives_saved_annual",
  unit: "deaths",
  displayName: "Annual Lives Saved by Pharmaceuticals",
  description: "Annual lives saved by pharmaceutical interventions globally. Derived from Lichtenberg (2019) finding of 148.7M life-years saved, divided by assumed 12-year average life extension per beneficiary. Note: Life-years is the primary metric; lives is an approximation for intuitive communication.",
  sourceType: "calculated",
  sourceRef: "lichtenberg-life-years-saved-2019",
  sourceUrl: "https://www.nber.org/papers/w25483",
  confidence: "low",
  formula: "PHARMA_LIFE_YEARS_SAVED_ANNUAL ÷ AVG_LIFE_EXTENSION_PER_BENEFICIARY",
  latex: "\\begin{gathered}\nLives_{saved,annual} \\\\\n= \\frac{LY_{saved,annual}}{T_{ext}} \\\\\n= \\frac{149M}{12} \\\\\n= 12.4M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const POLITICAL_DYSFUNCTION_GLOBAL_EFFICIENCY_SCORE: Parameter = {
  value: 0.5185960162628752,
  parameterName: "POLITICAL_DYSFUNCTION_GLOBAL_EFFICIENCY_SCORE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-political_dysfunction_global_efficiency_score",
  unit: "percent",
  displayName: "Global Governance Efficiency Score",
  description: "Global Governance Efficiency Score from Political Dysfunction Tax paper. E = Adjusted W_real / W_max, where W_real = GDP - waste, W_max = W_real + opportunity cost. Paper calculates 30-52% efficiency (using $110.9T adjusted / $211.9T maximum). This means civilization operates at roughly half its technological potential.",
  sourceType: "calculated",
  sourceRef: "political-dysfunction-tax-paper-2025",
  sourceUrl: "https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html",
  confidence: "low",
  formula: "POLITICAL_DYSFUNCTION_GLOBAL_REALIZED_WELFARE_ADJUSTED / POLITICAL_DYSFUNCTION_GLOBAL_THEORETICAL_MAX_WELFARE",
  latex: "\\begin{gathered}\nE \\\\\n= \\frac{W_{real}}{W_{max}} \\\\\n= \\frac{GDP - W_{waste}}{GDP - W_{waste} + O_{total}}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/political-dysfunction-tax.html",
  manualPageTitle: "The Political Dysfunction Tax",
};

export const POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_PCT_GDP: Parameter = {
  value: 0.8782608695652174,
  parameterName: "POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_PCT_GDP",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-political_dysfunction_global_opportunity_cost_pct_gdp",
  unit: "percent",
  displayName: "Global Opportunity Cost as % of GDP",
  description: "Global opportunity cost as percentage of global GDP. $101T / $115T = ~88% of current GDP in unrealized potential. This represents the 'buried multipliers' of the global economy.",
  sourceType: "calculated",
  sourceRef: "political-dysfunction-tax-paper-2025",
  sourceUrl: "https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html",
  confidence: "low",
  formula: "POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL / GLOBAL_GDP_2025",
  latex: "\\begin{gathered}\nO_{\\%GDP} = \\frac{O_{total}}{GDP_{global}} = \\frac{\\$101T}{\\$115T} = 87.8\\%\n\\\\[0.5em]\n\\text{where } O_{total} = O_{health} + O_{science} + O_{lead} + O_{migration} = \\$34T + \\$4T + \\$6T + \\$57T = \\$101T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/optimocracy.html",
  manualPageTitle: "Optimocracy: The Evidence Machine",
};

export const POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL: Parameter = {
  value: 101000000000000.0,
  parameterName: "POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-political_dysfunction_global_opportunity_cost_total",
  unit: "USD",
  displayName: "Global Opportunity Cost Total",
  description: "Total global opportunity cost from governance failures: health innovation delays ($34T), underfunded science ($4T), lead poisoning ($6T), migration restrictions ($57T). Sum: $101T annually in unrealized potential.",
  sourceType: "calculated",
  sourceRef: "political-dysfunction-tax-paper-2025",
  sourceUrl: "https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html",
  confidence: "low",
  formula: "HEALTH + SCIENCE + LEAD + MIGRATION",
  latex: "\\begin{gathered}\nO_{total} \\\\\n= O_{health} + O_{science} + O_{lead} + O_{migration} \\\\\n= \\$34T + \\$4T + \\$6T + \\$57T \\\\\n= \\$101T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/optimocracy-paper.html",
  manualPageTitle: "Optimocracy: Causal Inference on Cross-Jurisdictional Policy Data to Maximize Median Health and Wealth",
};

export const POLITICAL_DYSFUNCTION_GLOBAL_REALIZED_WELFARE_ADJUSTED: Parameter = {
  value: 108803000000000.0,
  parameterName: "POLITICAL_DYSFUNCTION_GLOBAL_REALIZED_WELFARE_ADJUSTED",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-political_dysfunction_global_realized_welfare_adjusted",
  unit: "USD",
  displayName: "Adjusted Realized Welfare",
  description: "Adjusted realized welfare after subtracting measured governance waste from global GDP.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "GLOBAL_GDP_2025 - POLITICAL_DYSFUNCTION_GLOBAL_WASTE_TOTAL",
  latex: "\\begin{gathered}\nW_{real} = GDP_{global} - W_{waste} = \\$115T - \\$6.2T = \\$109T\n\\\\[0.5em]\n\\text{where } W_{waste} = W_{total,US} + W_{ff,global} = \\$4.9T + \\$1.3T = \\$6.2T\n\\\\[0.5em]\n\\text{where } W_{total,US} = W_{raw,US} \\times US = \\$4.9T \\times 1 = \\$4.9T\n\\\\[0.5em]\n\\text{where } W_{raw,US} = W_{health} + W_{housing} + W_{military} + W_{regulatory} + W_{tax} + W_{corporate} + W_{tariffs} + W_{drugs} + W_{fossil} + W_{agriculture} = \\$1.2T + \\$1.4T + \\$615B + \\$580B + \\$546B + \\$181B + \\$160B + \\$90B + \\$50B + \\$75B = \\$4.9T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/political-dysfunction-tax.html",
  manualPageTitle: "The Political Dysfunction Tax",
};

export const POLITICAL_DYSFUNCTION_GLOBAL_THEORETICAL_MAX_WELFARE: Parameter = {
  value: 209803000000000.0,
  parameterName: "POLITICAL_DYSFUNCTION_GLOBAL_THEORETICAL_MAX_WELFARE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-political_dysfunction_global_theoretical_max_welfare",
  unit: "USD",
  displayName: "Theoretical Maximum Welfare (Conservative)",
  description: "Conservative theoretical maximum welfare under opportunity-cost recapture assumptions.",
  sourceType: "calculated",
  confidence: "low",
  formula: "POLITICAL_DYSFUNCTION_GLOBAL_REALIZED_WELFARE_ADJUSTED + POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL",
  latex: "\\begin{gathered}\nW_{max} = W_{real} + O_{total} = \\$109T + \\$101T = \\$210T\n\\\\[0.5em]\n\\text{where } W_{real} = GDP_{global} - W_{waste} = \\$115T - \\$6.2T = \\$109T\n\\\\[0.5em]\n\\text{where } W_{waste} = W_{total,US} + W_{ff,global} = \\$4.9T + \\$1.3T = \\$6.2T\n\\\\[0.5em]\n\\text{where } W_{total,US} = W_{raw,US} \\times US = \\$4.9T \\times 1 = \\$4.9T\n\\\\[0.5em]\n\\text{where } W_{raw,US} = W_{health} + W_{housing} + W_{military} + W_{regulatory} + W_{tax} + W_{corporate} + W_{tariffs} + W_{drugs} + W_{fossil} + W_{agriculture} = \\$1.2T + \\$1.4T + \\$615B + \\$580B + \\$546B + \\$181B + \\$160B + \\$90B + \\$50B + \\$75B = \\$4.9T\n\\\\[0.5em]\n\\text{where } O_{total} = O_{health} + O_{science} + O_{lead} + O_{migration} = \\$34T + \\$4T + \\$6T + \\$57T = \\$101T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/political-dysfunction-tax.html",
  manualPageTitle: "The Political Dysfunction Tax",
};

export const POLITICAL_DYSFUNCTION_GLOBAL_WASTE_TOTAL: Parameter = {
  value: 6197000000000.0,
  parameterName: "POLITICAL_DYSFUNCTION_GLOBAL_WASTE_TOTAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-political_dysfunction_global_waste_total",
  unit: "USD",
  displayName: "Global Waste Total (Efficiency Accounting)",
  description: "Global waste deduction used in Political Dysfunction Tax efficiency accounting. Combines US governance waste estimate with global explicit fossil-fuel subsidies.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "US_GOV_WASTE_TOTAL + POLITICAL_DYSFUNCTION_GLOBAL_FOSSIL_FUEL_SUBSIDIES",
  latex: "\\begin{gathered}\nW_{waste} = W_{total,US} + W_{ff,global} = \\$4.9T + \\$1.3T = \\$6.2T\n\\\\[0.5em]\n\\text{where } W_{total,US} = W_{raw,US} \\times US = \\$4.9T \\times 1 = \\$4.9T\n\\\\[0.5em]\n\\text{where } W_{raw,US} = W_{health} + W_{housing} + W_{military} + W_{regulatory} + W_{tax} + W_{corporate} + W_{tariffs} + W_{drugs} + W_{fossil} + W_{agriculture} = \\$1.2T + \\$1.4T + \\$615B + \\$580B + \\$546B + \\$181B + \\$160B + \\$90B + \\$50B + \\$75B = \\$4.9T\n\\end{gathered}",
};

export const POLITICAL_DYSFUNCTION_TAX_PER_HOUSEHOLD_OF_FOUR_ANNUAL: Parameter = {
  value: 50500.0,
  parameterName: "POLITICAL_DYSFUNCTION_TAX_PER_HOUSEHOLD_OF_FOUR_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-political_dysfunction_tax_per_household_of_four_annual",
  unit: "USD/year",
  displayName: "Political Dysfunction Tax per Household of Four (Annual)",
  description: "Annual household burden for a 4-person household implied by global Political Dysfunction Tax.",
  sourceType: "calculated",
  confidence: "low",
  formula: "POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL × 4",
  latex: "\\begin{gathered}\nT_{pd,hh4} = T_{pd,pc} \\times 4 = \\$12.6K \\times 4 = \\$50.5K\n\\\\[0.5em]\n\\text{where } T_{pd,pc} = \\frac{O_{total}}{Pop_{global}} = \\frac{\\$101T}{8B} = \\$12.6K\n\\\\[0.5em]\n\\text{where } O_{total} = O_{health} + O_{science} + O_{lead} + O_{migration} = \\$34T + \\$4T + \\$6T + \\$57T = \\$101T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/political-dysfunction-tax.html",
  manualPageTitle: "The Political Dysfunction Tax",
};

export const POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL: Parameter = {
  value: 12625.0,
  parameterName: "POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-political_dysfunction_tax_per_person_annual",
  unit: "USD/year",
  displayName: "Political Dysfunction Tax per Person (Annual)",
  description: "Annual per-person burden implied by global Political Dysfunction Tax opportunity costs.",
  sourceType: "calculated",
  confidence: "low",
  formula: "POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL ÷ GLOBAL_POPULATION_2024",
  latex: "\\begin{gathered}\nT_{pd,pc} = \\frac{O_{total}}{Pop_{global}} = \\frac{\\$101T}{8B} = \\$12.6K\n\\\\[0.5em]\n\\text{where } O_{total} = O_{health} + O_{science} + O_{lead} + O_{migration} = \\$34T + \\$4T + \\$6T + \\$57T = \\$101T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const POST_WW2_MILITARY_CUT_PCT: Parameter = {
  value: 0.876056338028169,
  parameterName: "POST_WW2_MILITARY_CUT_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-post_ww2_military_cut_pct",
  unit: "percent",
  displayName: "Percentage Military Spending Cut After WW2",
  description: "Percentage US military spending cut after WW2 (1945-1947, inflation-adjusted: $1,420B to $176B in constant 2024 dollars)",
  sourceType: "calculated",
  confidence: "high",
  formula: "1 - (US_MILITARY_SPENDING_1947 / US_MILITARY_SPENDING_1945_PEAK)",
  latex: "\\begin{gathered}\nCut_{WW2} \\\\\n= 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} \\\\\n= 1 - \\frac{\\$176B}{\\$1.42T} \\\\\n= 87.6\\%\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/peace-dividend.html",
  manualPageTitle: "Peace Dividend",
};

export const PRAGMATIC_TRIAL_COST_PER_QALY: Parameter = {
  value: 4.0,
  parameterName: "PRAGMATIC_TRIAL_COST_PER_QALY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-pragmatic_trial_cost_per_qaly",
  unit: "USD/QALY",
  displayName: "Pragmatic Trial Cost per QALY (RECOVERY)",
  description: "Cost per QALY for pragmatic platform trials, calculated from RECOVERY trial data. Uses global impact methodology: trial cost divided by total QALYs from downstream adoption. This measures research efficiency (discovery value), not clinical intervention ICER.",
  sourceType: "calculated",
  sourceRef: "recovery-trial-82x-cost-reduction",
  sourceUrl: "https://manhattan.institute/article/slow-costly-clinical-trials-drag-down-biomedical-breakthroughs",
  confidence: "medium",
  formula: "TRIAL_COST ÷ TOTAL_QALYS_GENERATED",
  latex: "\\begin{gathered}\nCost_{pragmatic,QALY} = \\frac{Cost_{RECOVERY}}{QALY_{RECOVERY}} = \\frac{\\$20M}{5M} = \\$4\n\\\\[0.5em]\n\\text{where } QALY_{RECOVERY} = Lives_{RECOVERY} \\times QALY_{COVID} = 1M \\times 5 = 5M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const PRIZE_POOL_ANNUAL_RETURN: Parameter = {
  value: 0.17380000000000004,
  parameterName: "PRIZE_POOL_ANNUAL_RETURN",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-prize_pool_annual_return",
  unit: "percent",
  displayName: "PRIZE Pool Annual Return",
  description: "Canonical annual return used for PRIZE pool growth. Venture gross return + scale compression + crowd allocation alpha + home bias elimination. This is the structural pool return before contingent macro feedback loops.",
  sourceType: "calculated",
  confidence: "high",
  formula: "VENTURE_GROSS_RETURN + SCALE_COMPRESSION_FACTOR + WISHOCRATIC_CROWD_ALPHA + HOME_BIAS_ALPHA",
  latex: "\\begin{gathered}\nr_{pool} \\\\\n= r_{VC,gross} + \\Delta r_{scale} + \\alpha_{crowd} \\\\\n+ \\alpha_{home}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/wishocratic-investment-fund.html",
  manualPageTitle: "The Wishocratic Investment Fund",
};

export const PRIZE_POOL_HORIZON_MULTIPLE: Parameter = {
  value: 11.063984983606389,
  parameterName: "PRIZE_POOL_HORIZON_MULTIPLE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-prize_pool_horizon_multiple",
  unit: "x",
  displayName: "PRIZE Pool Horizon Multiple",
  description: "Compound multiple for PRIZE pool growth over the resolution horizon (tied to the destructive economy 50% threshold year).",
  sourceType: "calculated",
  confidence: "high",
  formula: "(1 + PRIZE_POOL_ANNUAL_RETURN) ^ (DESTRUCTIVE_ECONOMY_50PCT_YEAR - DESTRUCTIVE_ECONOMY_BASE_YEAR)",
  latex: "M_{pool} = (1 + r_{pool})^{Y_{50\\%} - Y_0}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const PRIZE_POOL_RETIREMENT_EQUIVALENT_PRINCIPAL: Parameter = {
  value: 1804405541315.2495,
  parameterName: "PRIZE_POOL_RETIREMENT_EQUIVALENT_PRINCIPAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-prize_pool_retirement_equivalent_principal",
  unit: "USD",
  displayName: "PRIZE Pool Retirement-Equivalent Principal",
  description: "Secondary PRIZE seed benchmark: initial principal required so that the pool can make two referred votes retirement-equivalent on success at the modeled global coordination target. This is a stronger-incentive visible-pool benchmark, not the minimum capital required to make 50% participation credible.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_COORDINATION_TARGET_SUPPORTERS × RETIREMENT_EQUIVALENT_CLAIM_VALUE_TARGET / PRIZE_POOL_HORIZON_MULTIPLE",
  latex: "\\begin{gathered}\nP_{retire-eq} \\\\\n= \\frac{N_{coord} \\times V_{claim,target}}{M_{pool}}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const PRIZE_POOL_SIZE: Parameter = {
  value: 33745154199999.484,
  parameterName: "PRIZE_POOL_SIZE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-prize_pool_size",
  unit: "USD",
  displayName: "PRIZE Pool Size",
  description: "Terminal PRIZE pool size: global investable assets × participation rate × compound multiple over the resolution horizon.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_INVESTABLE_ASSETS × PRIZE_POOL_PARTICIPATION_RATE × PRIZE_POOL_HORIZON_MULTIPLE",
  latex: "Pool = Assets_{invest} \\times R_{pool} \\times M_{pool}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-protocol-v1.html",
  manualPageTitle: "Earth Optimization Protocol v1",
};

export const RECOVERY_TRIAL_COST_REDUCTION_FACTOR: Parameter = {
  value: 82.0,
  parameterName: "RECOVERY_TRIAL_COST_REDUCTION_FACTOR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-recovery_trial_cost_reduction_factor",
  unit: "multiplier",
  displayName: "RECOVERY Trial Cost Reduction Factor",
  description: "Cost reduction factor demonstrated by RECOVERY trial (traditional Phase 3 cost / RECOVERY cost per patient)",
  sourceType: "calculated",
  sourceRef: "recovery-trial-82x-cost-reduction",
  sourceUrl: "https://manhattan.institute/article/slow-costly-clinical-trials-drag-down-biomedical-breakthroughs",
  confidence: "high",
  formula: "TRADITIONAL_PHASE3_COST / RECOVERY_COST",
  latex: "\\begin{gathered}\nk_{RECOVERY} \\\\\n= \\frac{Cost_{P3,pt}}{Cost_{RECOVERY,pt}} \\\\\n= \\frac{\\$41K}{\\$500} \\\\\n= 82\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const RECOVERY_TRIAL_TOTAL_QALYS_GENERATED: Parameter = {
  value: 5000000.0,
  parameterName: "RECOVERY_TRIAL_TOTAL_QALYS_GENERATED",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-recovery_trial_total_qalys_generated",
  unit: "QALYs",
  displayName: "RECOVERY Trial Total QALYs Generated",
  description: "Total QALYs generated by RECOVERY trial's discoveries (lives saved × QALYs per life). Uses global impact methodology: counts all downstream health gains from the discovery.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "LIVES_SAVED × QALYS_PER_DEATH_AVERTED",
  latex: "\\begin{gathered}\nQALY_{RECOVERY} \\\\\n= Lives_{RECOVERY} \\times QALY_{COVID} \\\\\n= 1M \\times 5 \\\\\n= 5M\n\\end{gathered}",
};

export const RETIREMENT_EQUIVALENT_2_CLAIMS_TARGET_PAYOUT: Parameter = {
  value: 9981.95790672404,
  parameterName: "RETIREMENT_EQUIVALENT_2_CLAIMS_TARGET_PAYOUT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-retirement_equivalent_2_claims_target_payout",
  unit: "USD",
  displayName: "Retirement-Equivalent 2-Claims Target Payout",
  description: "Target success-side payout for two referred votes: what one representative annual savings contribution would become in a conventional retirement account by PRIZE resolution.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_ANNUAL_SAVINGS_PER_CAPITA × CONVENTIONAL_RETIREMENT_HORIZON_MULTIPLE",
  latex: "V_{2claims,target} = S_{annual,pc} \\times M_{retire}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/wishocratic-investment-fund.html",
  manualPageTitle: "The Wishocratic Investment Fund",
};

export const RETIREMENT_EQUIVALENT_CLAIM_VALUE_TARGET: Parameter = {
  value: 4990.97895336202,
  parameterName: "RETIREMENT_EQUIVALENT_CLAIM_VALUE_TARGET",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-retirement_equivalent_claim_value_target",
  unit: "USD",
  displayName: "Retirement-Equivalent Claim Value Target",
  description: "Target value of one referred-voter claim when two claims are meant to match the conventional-retirement future value of one representative annual savings contribution.",
  sourceType: "calculated",
  confidence: "high",
  formula: "RETIREMENT_EQUIVALENT_2_CLAIMS_TARGET_PAYOUT / 2",
  latex: "V_{claim,target} = \\frac{V_{2claims,target}}{2}",
};

export const SHARING_BREAKEVEN_ONE_IN_TREATY: Parameter = {
  value: 245637049.39622235,
  parameterName: "SHARING_BREAKEVEN_ONE_IN_TREATY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-sharing_breakeven_one_in_treaty",
  unit: "ratio",
  displayName: "Sharing Breakeven (1 in N)",
  description: "Breakeven probability expressed as '1 in N'. Forwarding has positive expected value if you believe there is at least a 1-in-N chance the plan works. For context, lightning strike odds are ~1 in 1.2 million.",
  sourceType: "calculated",
  confidence: "high",
  formula: "1 / SHARING_BREAKEVEN_PROBABILITY_TREATY",
  latex: "\\begin{gathered}\nN_{breakeven} = P_{breakeven} = 0 = 246M\n\\\\[0.5em]\n\\text{where } P_{breakeven} = \\frac{C_{share}}{\\Delta Y_{lifetime,treaty}} = \\frac{\\$0.0599}{\\$14.7M} = 0\n\\\\[0.5em]\n\\text{where } C_{share} = t_{share} \\times \\bar{w}_{hour} \\times 0.0167 = 0.5 \\times \\$7.19 \\times 0.0167 = \\$0.0599\n\\\\[0.5em]\n\\text{where } \\bar{w}_{hour} = \\frac{\\bar{y}_{0}}{H_{work}} = \\frac{\\$14.4K}{2{,}000} = \\$7.19\n\\\\[0.5em]\n\\text{where } \\bar{y}_{0} = \\frac{GDP_{global}}{Pop_{global}} = \\frac{\\$115T}{8B} = \\$14.4K\n\\\\[0.5em]\n\\text{where } \\Delta Y_{lifetime,treaty} = Y_{cum,treaty} - Y_{cum,earth} = \\$16.1M - \\$1.34M = \\$14.7M\n\\\\[0.5em]\n\\text{where } Y_{cum,treaty} = \\bar{y}_0 \\cdot \\frac{(1+g_{pc})((1+g_{pc})^{20}-1)}{g_{pc}} + \\bar{y}_{treaty,20} \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}-20}-1)}{g_{base}}\n\\\\[0.5em]\n\\text{where } \\bar{y}_{treaty,20} = \\frac{GDP_{treaty,20}}{Pop_{2045}}\n\\\\[0.5em]\n\\text{where } GDP_{treaty,20}=GDP_0(1+g_{treaty,ramp})^3(1+g_{treaty,full})^{17}\n\\\\[0.5em]\n\\text{where } s_{mil,max} = Cut_{WW2} = 87.6\\% = 87.6\\%\n\\\\[0.5em]\n\\text{where } Cut_{WW2} = 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} = 1 - \\frac{\\$176B}{\\$1.42T} = 87.6\\%\n\\\\[0.5em]\n\\text{where } f_{cure,20,wish}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 20}{D_{untreated}}\\right)\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } k_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } T_{remaining} = LE_{global} - Age_{median} = 79 - 30.5 = 48.5\n\\\\[0.5em]\n\\text{where } Y_{cum,earth} = \\bar{y}_0 \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}}-1)}{g_{base}}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/recruitment-and-propaganda-plan.html",
  manualPageTitle: "Recruitment & Propaganda Plan",
};

export const SHARING_BREAKEVEN_PROBABILITY_TREATY: Parameter = {
  value: 4.071047109782531e-09,
  parameterName: "SHARING_BREAKEVEN_PROBABILITY_TREATY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-sharing_breakeven_probability_treaty",
  unit: "probability",
  displayName: "Sharing Breakeven Probability",
  description: "Minimum probability that the plan works for forwarding to have positive expected value. EV > 0 when P(works) > cost_of_sharing / gain_if_works. Below this probability, not forwarding is rational. Above it, forwarding dominates. For context, the odds of being struck by lightning are ~1 in 1.2 million.",
  sourceType: "calculated",
  confidence: "high",
  formula: "SHARING_OPPORTUNITY_COST / TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA",
  latex: "\\begin{gathered}\nP_{breakeven} = \\frac{C_{share}}{\\Delta Y_{lifetime,treaty}} = \\frac{\\$0.0599}{\\$14.7M} = 0\n\\\\[0.5em]\n\\text{where } C_{share} = t_{share} \\times \\bar{w}_{hour} \\times 0.0167 = 0.5 \\times \\$7.19 \\times 0.0167 = \\$0.0599\n\\\\[0.5em]\n\\text{where } \\bar{w}_{hour} = \\frac{\\bar{y}_{0}}{H_{work}} = \\frac{\\$14.4K}{2{,}000} = \\$7.19\n\\\\[0.5em]\n\\text{where } \\bar{y}_{0} = \\frac{GDP_{global}}{Pop_{global}} = \\frac{\\$115T}{8B} = \\$14.4K\n\\\\[0.5em]\n\\text{where } \\Delta Y_{lifetime,treaty} = Y_{cum,treaty} - Y_{cum,earth} = \\$16.1M - \\$1.34M = \\$14.7M\n\\\\[0.5em]\n\\text{where } Y_{cum,treaty} = \\bar{y}_0 \\cdot \\frac{(1+g_{pc})((1+g_{pc})^{20}-1)}{g_{pc}} + \\bar{y}_{treaty,20} \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}-20}-1)}{g_{base}}\n\\\\[0.5em]\n\\text{where } \\bar{y}_{treaty,20} = \\frac{GDP_{treaty,20}}{Pop_{2045}}\n\\\\[0.5em]\n\\text{where } GDP_{treaty,20}=GDP_0(1+g_{treaty,ramp})^3(1+g_{treaty,full})^{17}\n\\\\[0.5em]\n\\text{where } s_{mil,max} = Cut_{WW2} = 87.6\\% = 87.6\\%\n\\\\[0.5em]\n\\text{where } Cut_{WW2} = 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} = 1 - \\frac{\\$176B}{\\$1.42T} = 87.6\\%\n\\\\[0.5em]\n\\text{where } f_{cure,20,wish}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 20}{D_{untreated}}\\right)\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } k_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } T_{remaining} = LE_{global} - Age_{median} = 79 - 30.5 = 48.5\n\\\\[0.5em]\n\\text{where } Y_{cum,earth} = \\bar{y}_0 \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}}-1)}{g_{base}}\n\\end{gathered}",
};

export const SHARING_OPPORTUNITY_COST: Parameter = {
  value: 0.059895833333333336,
  parameterName: "SHARING_OPPORTUNITY_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-sharing_opportunity_cost",
  unit: "USD",
  displayName: "Sharing Opportunity Cost",
  description: "Dollar cost of 30 seconds at global average hourly income. The maximum downside of forwarding the message if the plan is impossible.",
  sourceType: "calculated",
  confidence: "high",
  formula: "(SHARING_TIME_MINUTES / 60) * GLOBAL_AVG_HOURLY_INCOME",
  latex: "\\begin{gathered}\nC_{share} = t_{share} \\times \\bar{w}_{hour} \\times 0.0167 = 0.5 \\times \\$7.19 \\times 0.0167 = \\$0.0599\n\\\\[0.5em]\n\\text{where } \\bar{w}_{hour} = \\frac{\\bar{y}_{0}}{H_{work}} = \\frac{\\$14.4K}{2{,}000} = \\$7.19\n\\\\[0.5em]\n\\text{where } \\bar{y}_{0} = \\frac{GDP_{global}}{Pop_{global}} = \\frac{\\$115T}{8B} = \\$14.4K\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/recruitment-and-propaganda-plan.html",
  manualPageTitle: "Recruitment & Propaganda Plan",
};

export const SHARING_UPSIDE_DOWNSIDE_RATIO_TREATY: Parameter = {
  value: 245637049.39622235,
  parameterName: "SHARING_UPSIDE_DOWNSIDE_RATIO_TREATY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-sharing_upside_downside_ratio_treaty",
  unit: "x",
  displayName: "Sharing Upside/Downside Ratio",
  description: "Raw ratio of upside (lifetime income gain if plan works) to downside (cost of sharing if plan is impossible). Not expected value; see SHARING_BREAKEVEN_PROBABILITY_TREATY for the probability threshold that makes forwarding rational.",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA / SHARING_OPPORTUNITY_COST",
  latex: "\\begin{gathered}\nk_{upside:downside} = \\frac{\\Delta Y_{lifetime,treaty}}{C_{share}} = \\frac{\\$14.7M}{\\$0.0599} = 246M\n\\\\[0.5em]\n\\text{where } \\Delta Y_{lifetime,treaty} = Y_{cum,treaty} - Y_{cum,earth} = \\$16.1M - \\$1.34M = \\$14.7M\n\\\\[0.5em]\n\\text{where } Y_{cum,treaty} = \\bar{y}_0 \\cdot \\frac{(1+g_{pc})((1+g_{pc})^{20}-1)}{g_{pc}} + \\bar{y}_{treaty,20} \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}-20}-1)}{g_{base}}\n\\\\[0.5em]\n\\text{where } \\bar{y}_{0} = \\frac{GDP_{global}}{Pop_{global}} = \\frac{\\$115T}{8B} = \\$14.4K\n\\\\[0.5em]\n\\text{where } \\bar{y}_{treaty,20} = \\frac{GDP_{treaty,20}}{Pop_{2045}}\n\\\\[0.5em]\n\\text{where } GDP_{treaty,20}=GDP_0(1+g_{treaty,ramp})^3(1+g_{treaty,full})^{17}\n\\\\[0.5em]\n\\text{where } s_{mil,max} = Cut_{WW2} = 87.6\\% = 87.6\\%\n\\\\[0.5em]\n\\text{where } Cut_{WW2} = 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} = 1 - \\frac{\\$176B}{\\$1.42T} = 87.6\\%\n\\\\[0.5em]\n\\text{where } f_{cure,20,wish}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 20}{D_{untreated}}\\right)\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } k_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } T_{remaining} = LE_{global} - Age_{median} = 79 - 30.5 = 48.5\n\\\\[0.5em]\n\\text{where } Y_{cum,earth} = \\bar{y}_0 \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}}-1)}{g_{base}}\n\\\\[0.5em]\n\\text{where } C_{share} = t_{share} \\times \\bar{w}_{hour} \\times 0.0167 = 0.5 \\times \\$7.19 \\times 0.0167 = \\$0.0599\n\\\\[0.5em]\n\\text{where } \\bar{w}_{hour} = \\frac{\\bar{y}_{0}}{H_{work}} = \\frac{\\$14.4K}{2{,}000} = \\$7.19\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/recruitment-and-propaganda-plan.html",
  manualPageTitle: "Recruitment & Propaganda Plan",
};

export const STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT: Parameter = {
  value: 221.66666666666666,
  parameterName: "STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-status_quo_avg_years_to_first_treatment",
  unit: "years",
  displayName: "Status Quo Average Years to First Treatment",
  description: "Average years until first treatment discovered for a typical disease under current system. At current discovery rates, the average disease waits half the total exploration time (~443/2 = ~222 years).",
  sourceType: "calculated",
  sourceRef: "status-quo-cure-timeline-estimate",
  confidence: "low",
  formula: "STATUS_QUO_QUEUE_CLEARANCE_YEARS ÷ 2",
  latex: "\\begin{gathered}\nT_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const STATUS_QUO_QUEUE_CLEARANCE_YEARS: Parameter = {
  value: 443.3333333333333,
  parameterName: "STATUS_QUO_QUEUE_CLEARANCE_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-status_quo_queue_clearance_years",
  unit: "years",
  displayName: "Status Quo Therapeutic Space Exploration Time",
  description: "Years to explore the entire therapeutic search space under current system. At current discovery rate of ~15 diseases/year getting first treatments, finding treatments for all ~6,650 untreated diseases would take ~443 years.",
  sourceType: "calculated",
  sourceRef: "status-quo-cure-timeline-estimate",
  confidence: "low",
  formula: "DISEASES_WITHOUT_EFFECTIVE_TREATMENT ÷ NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR",
  latex: "\\begin{gathered}\nT_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const THALIDOMIDE_DALYS_PER_EVENT: Parameter = {
  value: 41760.0,
  parameterName: "THALIDOMIDE_DALYS_PER_EVENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-thalidomide_dalys_per_event",
  unit: "DALYs",
  displayName: "Thalidomide DALYs Per Event",
  description: "Total DALYs per US-scale thalidomide event (YLL + YLD)",
  sourceType: "calculated",
  confidence: "medium",
  formula: "YLL + YLD",
  latex: "\\begin{gathered}\nDALY_{thal} = YLD_{thal} + YLL_{thal} = 13{,}000 + 28{,}800 = 41{,}800\n\\\\[0.5em]\n\\text{where } YLD_{thal} = DW_{thal} \\times N_{thal,survive} \\times LE_{thal} = 0.4 \\times 540 \\times 60 = 13{,}000\n\\\\[0.5em]\n\\text{where } N_{thal,survive} = N_{thal,US,prevent} \\times (1 - Rate_{thal,mort}) = 900 \\times (1 - 40\\%) = 540\n\\\\[0.5em]\n\\text{where } N_{thal,US,prevent} = N_{thal,global} \\times Pct_{US,1960} = 15{,}000 \\times 6\\% = 900\n\\\\[0.5em]\n\\text{where } YLL_{thal} = Deaths_{thal} \\times 80 = 360 \\times 80 = 28{,}800\n\\\\[0.5em]\n\\text{where } Deaths_{thal} = Rate_{thal,mort} \\times N_{thal,US,prevent} = 40\\% \\times 900 = 360\n\\end{gathered}",
};

export const THALIDOMIDE_DEATHS_PER_EVENT: Parameter = {
  value: 360.0,
  parameterName: "THALIDOMIDE_DEATHS_PER_EVENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-thalidomide_deaths_per_event",
  unit: "deaths",
  displayName: "Thalidomide Deaths Per Event",
  description: "Deaths per US-scale thalidomide event",
  sourceType: "calculated",
  confidence: "medium",
  formula: "US_CASES × MORTALITY_RATE",
  latex: "\\begin{gathered}\nDeaths_{thal} = Rate_{thal,mort} \\times N_{thal,US,prevent} = 40\\% \\times 900 = 360\n\\\\[0.5em]\n\\text{where } N_{thal,US,prevent} = N_{thal,global} \\times Pct_{US,1960} = 15{,}000 \\times 6\\% = 900\n\\end{gathered}",
};

export const THALIDOMIDE_SURVIVORS_PER_EVENT: Parameter = {
  value: 540.0,
  parameterName: "THALIDOMIDE_SURVIVORS_PER_EVENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-thalidomide_survivors_per_event",
  unit: "cases",
  displayName: "Thalidomide Survivors Per Event",
  description: "Survivors per US-scale thalidomide event",
  sourceType: "calculated",
  confidence: "medium",
  formula: "US_CASES × (1 - MORTALITY_RATE)",
  latex: "\\begin{gathered}\nN_{thal,survive} = N_{thal,US,prevent} \\times (1 - Rate_{thal,mort}) = 900 \\times (1 - 40\\%) = 540\n\\\\[0.5em]\n\\text{where } N_{thal,US,prevent} = N_{thal,global} \\times Pct_{US,1960} = 15{,}000 \\times 6\\% = 900\n\\end{gathered}",
};

export const THALIDOMIDE_US_CASES_PREVENTED: Parameter = {
  value: 900.0,
  parameterName: "THALIDOMIDE_US_CASES_PREVENTED",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-thalidomide_us_cases_prevented",
  unit: "cases",
  displayName: "Thalidomide US Cases Prevented",
  description: "Estimated US thalidomide cases prevented by FDA rejection",
  sourceType: "calculated",
  confidence: "medium",
  formula: "WORLDWIDE_CASES × US_POPULATION_SHARE",
  latex: "\\begin{gathered}\nN_{thal,US,prevent} \\\\\n= N_{thal,global} \\times Pct_{US,1960} \\\\\n= 15{,}000 \\times 6\\% \\\\\n= 900\n\\end{gathered}",
};

export const THALIDOMIDE_YLD_PER_EVENT: Parameter = {
  value: 12960.0,
  parameterName: "THALIDOMIDE_YLD_PER_EVENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-thalidomide_yld_per_event",
  unit: "years",
  displayName: "Thalidomide YLD Per Event",
  description: "Years Lived with Disability per thalidomide event",
  sourceType: "calculated",
  confidence: "medium",
  formula: "SURVIVORS × LIFESPAN × DISABILITY_WEIGHT",
  latex: "\\begin{gathered}\nYLD_{thal} = DW_{thal} \\times N_{thal,survive} \\times LE_{thal} = 0.4 \\times 540 \\times 60 = 13{,}000\n\\\\[0.5em]\n\\text{where } N_{thal,survive} = N_{thal,US,prevent} \\times (1 - Rate_{thal,mort}) = 900 \\times (1 - 40\\%) = 540\n\\\\[0.5em]\n\\text{where } N_{thal,US,prevent} = N_{thal,global} \\times Pct_{US,1960} = 15{,}000 \\times 6\\% = 900\n\\end{gathered}",
};

export const THALIDOMIDE_YLL_PER_EVENT: Parameter = {
  value: 28800.0,
  parameterName: "THALIDOMIDE_YLL_PER_EVENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-thalidomide_yll_per_event",
  unit: "years",
  displayName: "Thalidomide YLL Per Event",
  description: "Years of Life Lost per thalidomide event (infant deaths)",
  sourceType: "calculated",
  confidence: "medium",
  formula: "DEATHS × 80 years",
  latex: "\\begin{gathered}\nYLL_{thal} = Deaths_{thal} \\times 80 = 360 \\times 80 = 28{,}800\n\\\\[0.5em]\n\\text{where } Deaths_{thal} = Rate_{thal,mort} \\times N_{thal,US,prevent} = 40\\% \\times 900 = 360\n\\\\[0.5em]\n\\text{where } N_{thal,US,prevent} = N_{thal,global} \\times Pct_{US,1960} = 15{,}000 \\times 6\\% = 900\n\\end{gathered}",
};

export const TOTAL_RESEARCH_FUNDING_WITH_TREATY: Parameter = {
  value: 94700000000.0,
  parameterName: "TOTAL_RESEARCH_FUNDING_WITH_TREATY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-total_research_funding_with_treaty",
  unit: "USD",
  displayName: "Total Global Research Funding (Baseline + 1% treaty Funding)",
  description: "Total global research funding (baseline + 1% treaty funding)",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_MED_RESEARCH_SPENDING + TREATY_ANNUAL_FUNDING",
  latex: "\\begin{gathered}\nFunding_{RD,total} = Spending_{RD} + Funding_{treaty} = \\$67.5B + \\$27.2B = \\$94.7B\n\\\\[0.5em]\n\\text{where } Funding_{treaty} = Spending_{mil} \\times Reduce_{treaty} = \\$2.72T \\times 1\\% = \\$27.2B\n\\end{gathered}",
};

export const TOTAL_TESTABLE_THERAPEUTIC_COMBINATIONS: Parameter = {
  value: 51500000.0,
  parameterName: "TOTAL_TESTABLE_THERAPEUTIC_COMBINATIONS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-total_testable_therapeutic_combinations",
  unit: "combinations",
  displayName: "Total Testable Therapeutic Space",
  description: "Total testable therapeutic combinations (known safe compounds + emerging modalities)",
  sourceType: "calculated",
  confidence: "high",
  formula: "KNOWN_SAFE + EMERGING_MODALITIES",
  latex: "\\begin{gathered}\nN_{testable} = N_{combos} + N_{emerging} = 9.5M + 42M = 51.5M\n\\\\[0.5em]\n\\text{where } N_{combos} = N_{safe} \\times N_{diseases,trial} = 9{,}500 \\times 1{,}000 = 9.5M\n\\\\[0.5em]\n\\text{where } N_{emerging} = Combos_{gene} + Combos_{mRNA} + Combos_{epi} + Combos_{cell} = 20M + 20M + 1.5M + 500{,}000 = 42M\n\\\\[0.5em]\n\\text{where } Combos_{gene} = N_{genes} \\times N_{diseases,trial} = 20{,}000 \\times 1{,}000 = 20M\n\\\\[0.5em]\n\\text{where } Combos_{mRNA} = N_{genes} \\times N_{diseases,trial} = 20{,}000 \\times 1{,}000 = 20M\n\\\\[0.5em]\n\\text{where } Combos_{epi} = N_{epi} \\times N_{diseases,trial} = 1{,}500 \\times 1{,}000 = 1.5M\n\\\\[0.5em]\n\\text{where } Combos_{cell} = N_{cell} \\times N_{diseases,trial} = 500 \\times 1{,}000 = 500{,}000\n\\end{gathered}",
};

export const TREATY_ANNUAL_FUNDING: Parameter = {
  value: 27200000000.0,
  parameterName: "TREATY_ANNUAL_FUNDING",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_annual_funding",
  unit: "USD/year",
  displayName: "Annual Funding from 1% of Global Military Spending Redirected to DIH",
  description: "Annual funding from 1% of global military spending redirected to DIH",
  sourceType: "calculated",
  confidence: "high",
  formula: "MILITARY_SPENDING × 1%",
  latex: "\\begin{gathered}\nFunding_{treaty} \\\\\n= Spending_{mil} \\times Reduce_{treaty} \\\\\n= \\$2.72T \\times 1\\% \\\\\n= \\$27.2B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const TREATY_BENEFIT_MULTIPLIER_VS_VACCINES: Parameter = {
  value: 11.480765853658538,
  parameterName: "TREATY_BENEFIT_MULTIPLIER_VS_VACCINES",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_benefit_multiplier_vs_vaccines",
  unit: "x",
  displayName: "Treaty System Benefit Multiplier vs Childhood Vaccination Programs",
  description: "Treaty system benefit multiplier vs childhood vaccination programs",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_CONSERVATIVE_BENEFIT ÷ CHILDHOOD_VACCINATION_BENEFIT",
  latex: "\\begin{gathered}\nk_{treaty:vax} = \\frac{Benefit_{peace+RD}}{Benefit_{vax,ann}} = \\frac{\\$172B}{\\$15B} = 11.5\n\\\\[0.5em]\n\\text{where } Benefit_{peace+RD} = Benefit_{peace,soc} + Benefit_{RD,ann} = \\$114B + \\$58.6B = \\$172B\n\\\\[0.5em]\n\\text{where } Benefit_{peace,soc} = Cost_{war,total} \\times Reduce_{treaty} = \\$11.4T \\times 1\\% = \\$114B\n\\\\[0.5em]\n\\text{where } Cost_{war,total} = Cost_{war,direct} + Cost_{war,indirect} = \\$7.66T + \\$3.7T = \\$11.4T\n\\\\[0.5em]\n\\text{where } Cost_{war,direct} = Loss_{life,conflict} + Damage_{infra,total} + Disruption_{trade} + Spending_{mil} = \\$2.45T + \\$1.88T + \\$616B + \\$2.72T = \\$7.66T\n\\\\[0.5em]\n\\text{where } Loss_{life,conflict} = Cost_{combat,human} + Cost_{state,human} + Cost_{terror,human} = \\$2.34T + \\$27B + \\$83B = \\$2.45T\n\\\\[0.5em]\n\\text{where } Cost_{combat,human} = Deaths_{combat} \\times VSL = 234{,}000 \\times \\$10M = \\$2.34T\n\\\\[0.5em]\n\\text{where } Cost_{state,human} = Deaths_{state} \\times VSL = 2{,}700 \\times \\$10M = \\$27B\n\\\\[0.5em]\n\\text{where } Cost_{terror,human} = Deaths_{terror} \\times VSL = 8{,}300 \\times \\$10M = \\$83B\n\\\\[0.5em]\n\\text{where } Damage_{infra,total} = Damage_{comms} + Damage_{edu} + Damage_{energy} + Damage_{health} + Damage_{transport} + Damage_{water} = \\$298B + \\$234B + \\$422B + \\$166B + \\$487B + \\$268B = \\$1.88T\n\\\\[0.5em]\n\\text{where } Disruption_{trade} = Disruption_{currency} + Disruption_{energy} + Disruption_{shipping} + Disruption_{supply} = \\$57.4B + \\$125B + \\$247B + \\$187B = \\$616B\n\\\\[0.5em]\n\\text{where } Cost_{war,indirect} = Damage_{env} + Loss_{growth,mil} + Loss_{capital,conflict} + Cost_{psych} + Cost_{refugee} + Cost_{vet} = \\$100B + \\$2.72T + \\$300B + \\$232B + \\$150B + \\$200B = \\$3.7T\n\\\\[0.5em]\n\\text{where } Benefit_{RD,ann} = Spending_{trials} \\times Reduce_{pct} = \\$60B \\times 97.7\\% = \\$58.6B\n\\\\[0.5em]\n\\text{where } Reduce_{pct} = 1 - \\frac{Cost_{pragmatic,pt}}{Cost_{P3,pt}} = 1 - \\frac{\\$929}{\\$41K} = 97.7\\%\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const TREATY_CAMPAIGN_ANNUAL_COST_AMORTIZED: Parameter = {
  value: 250000000.0,
  parameterName: "TREATY_CAMPAIGN_ANNUAL_COST_AMORTIZED",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_campaign_annual_cost_amortized",
  unit: "USD/year",
  displayName: "Amortized Annual Treaty Campaign Cost",
  description: "Amortized annual campaign cost (total cost ÷ campaign duration)",
  sourceType: "calculated",
  confidence: "high",
  formula: "TOTAL_COST ÷ DURATION",
  latex: "\\begin{gathered}\nCost_{camp,amort} = \\frac{Cost_{campaign}}{T_{campaign}} = \\frac{\\$1B}{4} = \\$250M\n\\\\[0.5em]\n\\text{where } Cost_{campaign} = Budget_{viral,base} + Budget_{lobby,treaty} + Budget_{reserve} = \\$250M + \\$650M + \\$100M = \\$1B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/treaty-feasibility.html",
  manualPageTitle: "Treaty Feasibility & Cost Analysis",
};

export const TREATY_CAMPAIGN_TOTAL_COST: Parameter = {
  value: 1000000000.0,
  parameterName: "TREATY_CAMPAIGN_TOTAL_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_campaign_total_cost",
  unit: "USD",
  displayName: "Total 1% Treaty Campaign Cost",
  description: "Total treaty campaign cost (100% VICTORY Incentive Alignment Bonds)",
  sourceType: "calculated",
  confidence: "high",
  formula: "REFERENDUM + LOBBYING + RESERVE",
  latex: "\\begin{gathered}\nCost_{campaign} \\\\\n= Budget_{viral,base} + Budget_{lobby,treaty} \\\\\n+ Budget_{reserve} \\\\\n= \\$250M + \\$650M + \\$100M \\\\\n= \\$1B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const TREATY_CAMPAIGN_VOTING_BLOC_TARGET: Parameter = {
  value: 280000000.0,
  parameterName: "TREATY_CAMPAIGN_VOTING_BLOC_TARGET",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_campaign_voting_bloc_target",
  unit: "of people",
  displayName: "Target Voting Bloc Size for Campaign",
  description: "Target voting bloc size for campaign (3.5% of global population - critical mass for social change). Wide CI reflects uncertainty in applying Chenoweth's national threshold to global treaty adoption.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_POPULATION × 3.5%",
  latex: "\\begin{gathered}\nN_{voters,target} \\\\\n= Pop_{global} \\times Threshold_{activism} \\\\\n= 8B \\times 3.5\\% \\\\\n= 280M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG: Parameter = {
  value: 0.001769148505584477,
  parameterName: "TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_cost_per_daly_trial_capacity_plus_efficacy_lag",
  unit: "USD/DALY",
  displayName: "Cost per DALY Averted (Elimination of Efficacy Lag Plus Earlier Treatment Discovery from Increased Trial Throughput)",
  description: "Cost per DALY averted from elimination of efficacy lag plus earlier treatment discovery from increased trial throughput. Only counts campaign cost; ignores economic benefits from funding and R&D savings.",
  sourceType: "calculated",
  confidence: "high",
  formula: "CAMPAIGN_COST ÷ DALYS_TIMELINE_SHIFT",
  latex: "\\begin{gathered}\nCost_{treaty,DALY} = \\frac{Cost_{campaign}}{DALYs_{max}} = \\frac{\\$1B}{565B} = \\$0.00177\n\\\\[0.5em]\n\\text{where } Cost_{campaign} = Budget_{viral,base} + Budget_{lobby,treaty} + Budget_{reserve} = \\$250M + \\$650M + \\$100M = \\$1B\n\\\\[0.5em]\n\\text{where } DALYs_{max} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times T_{accel,max} = 2.88B \\times 92.6\\% \\times 212 = 565B\n\\\\[0.5em]\n\\text{where } T_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const TREATY_CUMULATIVE_20YR_WITH_RATCHET: Parameter = {
  value: 3155200000000.0005,
  parameterName: "TREATY_CUMULATIVE_20YR_WITH_RATCHET",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_cumulative_20yr_with_ratchet",
  unit: "USD",
  displayName: "Cumulative Treaty Funding over 20 Years with IAB Ratchet Expansion",
  description: "Cumulative treaty funding over 20 years with IAB ratchet expansion following roadmap timeline. Expansion driven by bondholder lobbying incentives (10% of treaty inflows).",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_MILITARY × (0.01×3 + 0.02×4 + 0.05×5 + 0.10×8)",
  latex: "\\begin{gathered}\nFund_{20yr,ratchet} \\\\\n= Spending_{mil} \\times 1.16 \\\\\n= \\$2.72T \\times 1.16 \\\\\n= \\$3.16T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/peace-dividend.html",
  manualPageTitle: "Peace Dividend",
};

export const TREATY_DISEASE_CURE_FRACTION_15YR: Parameter = {
  value: 0.4171098529849636,
  parameterName: "TREATY_DISEASE_CURE_FRACTION_15YR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_disease_cure_fraction_15yr",
  unit: "rate",
  displayName: "Treaty Disease Cure Fraction (15yr, 1% Reallocation)",
  description: "Treaty disease-cure fraction over 15 years under 1% military reallocation only. Uses base trial-capacity multiplier (no scaling beyond 1% reallocation) and applies an upper bound of 100% of untreated disease classes.",
  sourceType: "calculated",
  confidence: "high",
  formula: "min(1.0, NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR * min(DFDA_TRIAL_CAPACITY_MULTIPLIER, DFDA_MAX_TRIAL_CAPACITY_MULTIPLIER_PHYSICAL) * 15 / DISEASES_WITHOUT_EFFECTIVE_TREATMENT)",
  latex: "\\begin{gathered}\nf_{cure,15,treaty} \\\\\n= \\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity}\\cdot 15}{D_{untreated}}\\right)\n\\end{gathered}",
};

export const TREATY_EXPECTED_COST_PER_DALY: Parameter = {
  value: 0.1769148505584477,
  parameterName: "TREATY_EXPECTED_COST_PER_DALY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_expected_cost_per_daly",
  unit: "USD/DALY",
  displayName: "Expected Cost per DALY (Risk-Adjusted)",
  description: "Expected cost per DALY accounting for political success probability uncertainty. Monte Carlo samples from beta(0.1%, 10%) distribution. At the conservative 1% estimate, this is still more cost-effective than bed nets ($89.0/DALY).",
  sourceType: "calculated",
  confidence: "low",
  formula: "CONDITIONAL_COST_PER_DALY ÷ POLITICAL_SUCCESS_PROBABILITY",
  latex: "\\begin{gathered}\nE[Cost_{DALY}] = \\frac{Cost_{treaty,DALY}}{P_{success}} = \\frac{\\$0.00177}{1\\%} = \\$0.177\n\\\\[0.5em]\n\\text{where } Cost_{treaty,DALY} = \\frac{Cost_{campaign}}{DALYs_{max}} = \\frac{\\$1B}{565B} = \\$0.00177\n\\\\[0.5em]\n\\text{where } Cost_{campaign} = Budget_{viral,base} + Budget_{lobby,treaty} + Budget_{reserve} = \\$250M + \\$650M + \\$100M = \\$1B\n\\\\[0.5em]\n\\text{where } DALYs_{max} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times T_{accel,max} = 2.88B \\times 92.6\\% \\times 212 = 565B\n\\\\[0.5em]\n\\text{where } T_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const TREATY_EXPECTED_ROI_TRIAL_CAPACITY_PLUS_EFFICACY_LAG: Parameter = {
  value: 847865.5100264985,
  parameterName: "TREATY_EXPECTED_ROI_TRIAL_CAPACITY_PLUS_EFFICACY_LAG",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_expected_roi_trial_capacity_plus_efficacy_lag",
  unit: "ratio",
  displayName: "Expected Treaty ROI (Risk-Adjusted)",
  description: "Expected ROI for 1% treaty accounting for political success probability uncertainty. Monte Carlo samples POLITICAL_SUCCESS_PROBABILITY from beta(0.1%, 10%) distribution to generate full expected value distribution. Central value uses 1% probability.",
  sourceType: "calculated",
  sourceRef: "calculated",
  confidence: "low",
  formula: "TREATY_ROI_TRIAL_CAPACITY_PLUS_EFFICACY_LAG × POLITICAL_SUCCESS_PROBABILITY",
  latex: "\\begin{gathered}\nE[ROI_{max}] = ROI_{max} \\times P_{success} = 84.8M \\times 1\\% = 848{,}000\n\\\\[0.5em]\n\\text{where } ROI_{max} = \\frac{Value_{max}}{Cost_{campaign}} = \\frac{\\$84800T}{\\$1B} = 84.8M\n\\\\[0.5em]\n\\text{where } Value_{max} = DALYs_{max} \\times Value_{QALY} = 565B \\times \\$150K = \\$84800T\n\\\\[0.5em]\n\\text{where } DALYs_{max} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times T_{accel,max} = 2.88B \\times 92.6\\% \\times 212 = 565B\n\\\\[0.5em]\n\\text{where } T_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } Cost_{campaign} = Budget_{viral,base} + Budget_{lobby,treaty} + Budget_{reserve} = \\$250M + \\$650M + \\$100M = \\$1B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER: Parameter = {
  value: 503.06686928238906,
  parameterName: "TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_expected_vs_bed_nets_multiplier",
  unit: "x",
  displayName: "Expected Cost-Effectiveness vs Bed Nets Multiplier",
  description: "Expected value multiplier vs bed nets (accounts for political uncertainty at 1% success rate)",
  sourceType: "calculated",
  confidence: "low",
  formula: "BED_NETS_COST_PER_DALY ÷ TREATY_EXPECTED_COST_PER_DALY",
  latex: "\\begin{gathered}\nE[k_{nets}] = \\frac{Cost_{nets}}{E[Cost_{DALY}]} = \\frac{\\$89}{\\$0.177} = 503\n\\\\[0.5em]\n\\text{where } E[Cost_{DALY}] = \\frac{Cost_{treaty,DALY}}{P_{success}} = \\frac{\\$0.00177}{1\\%} = \\$0.177\n\\\\[0.5em]\n\\text{where } Cost_{treaty,DALY} = \\frac{Cost_{campaign}}{DALYs_{max}} = \\frac{\\$1B}{565B} = \\$0.00177\n\\\\[0.5em]\n\\text{where } Cost_{campaign} = Budget_{viral,base} + Budget_{lobby,treaty} + Budget_{reserve} = \\$250M + \\$650M + \\$100M = \\$1B\n\\\\[0.5em]\n\\text{where } DALYs_{max} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times T_{accel,max} = 2.88B \\times 92.6\\% \\times 212 = 565B\n\\\\[0.5em]\n\\text{where } T_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/treaty-feasibility.html",
  manualPageTitle: "Treaty Feasibility & Cost Analysis",
};

export const TREATY_HALE_GAIN_YEAR_15: Parameter = {
  value: 6.54862469186393,
  parameterName: "TREATY_HALE_GAIN_YEAR_15",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_hale_gain_year_15",
  unit: "years",
  displayName: "Treaty HALE Gain at Year 15",
  description: "HALE improvement at year 15 under Treaty Trajectory. As diseases are progressively cured, the gap between life expectancy and healthy life expectancy closes proportionally to the disease cure fraction.",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_DISEASE_CURE_FRACTION_15YR * GLOBAL_HALE_GAP",
  latex: "\\begin{gathered}\n\\Delta HALE_{treaty,15} \\\\\n= f_{cure,15,treaty} \\cdot \\Delta_{HALE}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const TREATY_HALE_VALUE_PER_CAPITA: Parameter = {
  value: 982293.7037795895,
  parameterName: "TREATY_HALE_VALUE_PER_CAPITA",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_hale_value_per_capita",
  unit: "USD/person",
  displayName: "Treaty HALE Value Per Capita",
  description: "Economic value of Treaty Trajectory HALE gains at year 15 using the standard QALY value.",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_HALE_GAIN_YEAR_15 × STANDARD_ECONOMIC_QALY_VALUE_USD",
  latex: "\\begin{gathered}\nValue_{HALE,treaty} = \\Delta HALE_{treaty,15} \\times Value_{QALY} = 6.55 \\times \\$150K = \\$982K\n\\\\[0.5em]\n\\text{where } \\Delta HALE_{treaty,15} = f_{cure,15,treaty} \\cdot \\Delta_{HALE}\n\\\\[0.5em]\n\\text{where } f_{cure,15,treaty}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity}\\cdot 15}{D_{untreated}}\\right)\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } k_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/call-to-action/your-personal-benefits.html",
  manualPageTitle: "Your Personal Benefits",
};

export const TREATY_LIVES_SAVED_ANNUAL_GLOBAL: Parameter = {
  value: 2446.0,
  parameterName: "TREATY_LIVES_SAVED_ANNUAL_GLOBAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_lives_saved_annual_global",
  unit: "lives/year",
  displayName: "Annual Lives Saved from 1% Reduction in Conflict Deaths",
  description: "Annual lives saved from 1% reduction in conflict deaths",
  sourceType: "calculated",
  confidence: "high",
  formula: "TOTAL_DEATHS × REDUCTION_PCT",
  latex: "\\begin{gathered}\nLives_{treaty,ann} = Deaths_{conflict} \\times Reduce_{treaty} = 245{,}000 \\times 1\\% = 2{,}450\n\\\\[0.5em]\n\\text{where } Deaths_{conflict} = Deaths_{combat} + Deaths_{state} + Deaths_{terror} = 234{,}000 + 2{,}700 + 8{,}300 = 245{,}000\n\\end{gathered}",
};

export const TREATY_PEACE_PLUS_RD_ANNUAL_BENEFITS: Parameter = {
  value: 172211487804.87805,
  parameterName: "TREATY_PEACE_PLUS_RD_ANNUAL_BENEFITS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_peace_plus_rd_annual_benefits",
  unit: "USD/year",
  displayName: "1% treaty Basic Annual Benefits (Peace + R&D Savings)",
  description: "Basic annual benefits: peace dividend + Decentralized Framework for Drug Assessment R&D savings only (2 of 8 benefit categories, excludes regulatory delay value)",
  sourceType: "calculated",
  confidence: "high",
  formula: "PEACE_DIVIDEND + DFDA_RD_SAVINGS",
  latex: "\\begin{gathered}\nBenefit_{peace+RD} = Benefit_{peace,soc} + Benefit_{RD,ann} = \\$114B + \\$58.6B = \\$172B\n\\\\[0.5em]\n\\text{where } Benefit_{peace,soc} = Cost_{war,total} \\times Reduce_{treaty} = \\$11.4T \\times 1\\% = \\$114B\n\\\\[0.5em]\n\\text{where } Cost_{war,total} = Cost_{war,direct} + Cost_{war,indirect} = \\$7.66T + \\$3.7T = \\$11.4T\n\\\\[0.5em]\n\\text{where } Cost_{war,direct} = Loss_{life,conflict} + Damage_{infra,total} + Disruption_{trade} + Spending_{mil} = \\$2.45T + \\$1.88T + \\$616B + \\$2.72T = \\$7.66T\n\\\\[0.5em]\n\\text{where } Loss_{life,conflict} = Cost_{combat,human} + Cost_{state,human} + Cost_{terror,human} = \\$2.34T + \\$27B + \\$83B = \\$2.45T\n\\\\[0.5em]\n\\text{where } Cost_{combat,human} = Deaths_{combat} \\times VSL = 234{,}000 \\times \\$10M = \\$2.34T\n\\\\[0.5em]\n\\text{where } Cost_{state,human} = Deaths_{state} \\times VSL = 2{,}700 \\times \\$10M = \\$27B\n\\\\[0.5em]\n\\text{where } Cost_{terror,human} = Deaths_{terror} \\times VSL = 8{,}300 \\times \\$10M = \\$83B\n\\\\[0.5em]\n\\text{where } Damage_{infra,total} = Damage_{comms} + Damage_{edu} + Damage_{energy} + Damage_{health} + Damage_{transport} + Damage_{water} = \\$298B + \\$234B + \\$422B + \\$166B + \\$487B + \\$268B = \\$1.88T\n\\\\[0.5em]\n\\text{where } Disruption_{trade} = Disruption_{currency} + Disruption_{energy} + Disruption_{shipping} + Disruption_{supply} = \\$57.4B + \\$125B + \\$247B + \\$187B = \\$616B\n\\\\[0.5em]\n\\text{where } Cost_{war,indirect} = Damage_{env} + Loss_{growth,mil} + Loss_{capital,conflict} + Cost_{psych} + Cost_{refugee} + Cost_{vet} = \\$100B + \\$2.72T + \\$300B + \\$232B + \\$150B + \\$200B = \\$3.7T\n\\\\[0.5em]\n\\text{where } Benefit_{RD,ann} = Spending_{trials} \\times Reduce_{pct} = \\$60B \\times 97.7\\% = \\$58.6B\n\\\\[0.5em]\n\\text{where } Reduce_{pct} = 1 - \\frac{Cost_{pragmatic,pt}}{Cost_{P3,pt}} = 1 - \\frac{\\$929}{\\$41K} = 97.7\\%\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const TREATY_PERSONAL_UPSIDE_BLEND: Parameter = {
  value: 15694929.474907491,
  parameterName: "TREATY_PERSONAL_UPSIDE_BLEND",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_personal_upside_blend",
  unit: "USD/person",
  displayName: "Treaty Personal Upside (Blended)",
  description: "Blended personal upside under Treaty Trajectory: lifetime income gain plus valued healthy-life gains.",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA + TREATY_HALE_VALUE_PER_CAPITA",
  latex: "\\begin{gathered}\nUpside_{blend,treaty} = \\Delta Y_{lifetime,treaty} + Value_{HALE,treaty} = \\$14.7M + \\$982K = \\$15.7M\n\\\\[0.5em]\n\\text{where } \\Delta Y_{lifetime,treaty} = Y_{cum,treaty} - Y_{cum,earth} = \\$16.1M - \\$1.34M = \\$14.7M\n\\\\[0.5em]\n\\text{where } Y_{cum,treaty} = \\bar{y}_0 \\cdot \\frac{(1+g_{pc})((1+g_{pc})^{20}-1)}{g_{pc}} + \\bar{y}_{treaty,20} \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}-20}-1)}{g_{base}}\n\\\\[0.5em]\n\\text{where } \\bar{y}_{0} = \\frac{GDP_{global}}{Pop_{global}} = \\frac{\\$115T}{8B} = \\$14.4K\n\\\\[0.5em]\n\\text{where } \\bar{y}_{treaty,20} = \\frac{GDP_{treaty,20}}{Pop_{2045}}\n\\\\[0.5em]\n\\text{where } GDP_{treaty,20}=GDP_0(1+g_{treaty,ramp})^3(1+g_{treaty,full})^{17}\n\\\\[0.5em]\n\\text{where } s_{mil,max} = Cut_{WW2} = 87.6\\% = 87.6\\%\n\\\\[0.5em]\n\\text{where } Cut_{WW2} = 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} = 1 - \\frac{\\$176B}{\\$1.42T} = 87.6\\%\n\\\\[0.5em]\n\\text{where } f_{cure,20,wish}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 20}{D_{untreated}}\\right)\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } k_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } T_{remaining} = LE_{global} - Age_{median} = 79 - 30.5 = 48.5\n\\\\[0.5em]\n\\text{where } Y_{cum,earth} = \\bar{y}_0 \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}}-1)}{g_{base}}\n\\\\[0.5em]\n\\text{where } Value_{HALE,treaty} = \\Delta HALE_{treaty,15} \\times Value_{QALY} = 6.55 \\times \\$150K = \\$982K\n\\\\[0.5em]\n\\text{where } \\Delta HALE_{treaty,15} = f_{cure,15,treaty} \\cdot \\Delta_{HALE}\n\\\\[0.5em]\n\\text{where } f_{cure,15,treaty}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity}\\cdot 15}{D_{untreated}}\\right)\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const TREATY_PROJECTED_HALE_YEAR_15: Parameter = {
  value: 69.84862469186393,
  parameterName: "TREATY_PROJECTED_HALE_YEAR_15",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_projected_hale_year_15",
  unit: "years",
  displayName: "Treaty Projected HALE at Year 15",
  description: "Projected global HALE at year 15 under Treaty Trajectory. Current HALE plus the treaty-driven improvement from closing the disease gap.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_HALE_CURRENT + TREATY_HALE_GAIN_YEAR_15",
  latex: "HALE_{treaty,15} = HALE_0 + \\Delta HALE_{treaty,15}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const TREATY_QALYS_GAINED_ANNUAL_GLOBAL: Parameter = {
  value: 85610.0,
  parameterName: "TREATY_QALYS_GAINED_ANNUAL_GLOBAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_qalys_gained_annual_global",
  unit: "QALYs/year",
  displayName: "Annual QALYs Gained from Peace Dividend",
  description: "Annual QALYs gained from peace dividend (lives saved × QALYs/life)",
  sourceType: "calculated",
  confidence: "high",
  formula: "LIVES_SAVED × QALYS_PER_LIFE",
  latex: "\\begin{gathered}\nQALY_{treaty,ann} = QALY_{life} \\times Lives_{treaty,ann} = 35 \\times 2{,}450 = 85{,}600\n\\\\[0.5em]\n\\text{where } Lives_{treaty,ann} = Deaths_{conflict} \\times Reduce_{treaty} = 245{,}000 \\times 1\\% = 2{,}450\n\\\\[0.5em]\n\\text{where } Deaths_{conflict} = Deaths_{combat} + Deaths_{state} + Deaths_{terror} = 234{,}000 + 2{,}700 + 8{,}300 = 245{,}000\n\\end{gathered}",
};

export const TREATY_RATCHET_MULTIPLIER_20YR: Parameter = {
  value: 5.800000000000001,
  parameterName: "TREATY_RATCHET_MULTIPLIER_20YR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_ratchet_multiplier_20yr",
  unit: "x",
  displayName: "Treaty Ratchet Funding Multiplier (20yr)",
  description: "How many times more cumulative funding flows with IAB ratchet vs stagnation over 20 years.",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_CUMULATIVE_20YR_WITH_RATCHET / (TREATY_ANNUAL_FUNDING × 20)",
  latex: "\\begin{gathered}\nk_{ratchet,20} \\\\\n= \\frac{Fund_{20yr,ratchet}}{20\\cdot Funding_{treaty,ann}}\n\\end{gathered}",
};

export const TREATY_RATCHET_PREMIUM_20YR: Parameter = {
  value: 2611200000000.0005,
  parameterName: "TREATY_RATCHET_PREMIUM_20YR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_ratchet_premium_20yr",
  unit: "USD",
  displayName: "Treaty Ratchet Premium over 20 Years",
  description: "Additional cumulative funding from IAB ratchet expansion vs stagnation over 20 years. The value of the IAB mechanism: this much more funding flows to medical research because bondholder incentives drive treaty expansion.",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_CUMULATIVE_20YR_WITH_RATCHET - (TREATY_ANNUAL_FUNDING × 20)",
  latex: "\\begin{gathered}\n\\Delta Fund_{ratchet,20} \\\\\n= Fund_{20yr,ratchet}-20\\cdot Funding_{treaty,ann}\n\\end{gathered}",
};

export const TREATY_ROI_EXISTING_DRUGS_ONLY: Parameter = {
  value: 259109.75,
  parameterName: "TREATY_ROI_EXISTING_DRUGS_ONLY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_roi_existing_drugs_only",
  unit: "ratio",
  displayName: "Treaty ROI - Historical Rate (Existing Drugs)",
  description: "Treaty ROI based on historical rate of drug development (existing drugs only). Total one-time benefit from avoiding regulatory delay for drugs already in development divided by campaign cost. Excludes future innovation effects.",
  sourceType: "calculated",
  confidence: "high",
  formula: "HISTORICAL_PROGRESS_TOTAL ÷ CAMPAIGN_COST",
  latex: "\\begin{gathered}\nROI_{drugs} = \\frac{Loss_{lag}}{Cost_{campaign}} = \\frac{\\$259T}{\\$1B} = 259{,}000\n\\\\[0.5em]\n\\text{where } Loss_{lag} = Deaths_{lag,total} \\times (LE_{global} - Age_{death,delay}) \\times Value_{QALY} = 102M \\times (79 - 62) \\times \\$150K = \\$259T\n\\\\[0.5em]\n\\text{where } Deaths_{lag,total} = Lives_{saved,annual} \\times T_{lag} = 12.4M \\times 8.2 = 102M\n\\\\[0.5em]\n\\text{where } Lives_{saved,annual} = \\frac{LY_{saved,annual}}{T_{ext}} = \\frac{149M}{12} = 12.4M\n\\\\[0.5em]\n\\text{where } Cost_{campaign} = Budget_{viral,base} + Budget_{lobby,treaty} + Budget_{reserve} = \\$250M + \\$650M + \\$100M = \\$1B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const TREATY_ROI_TRIAL_CAPACITY_PLUS_EFFICACY_LAG: Parameter = {
  value: 84786551.00264984,
  parameterName: "TREATY_ROI_TRIAL_CAPACITY_PLUS_EFFICACY_LAG",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_roi_trial_capacity_plus_efficacy_lag",
  unit: "ratio",
  displayName: "Treaty ROI - Elimination of Efficacy Lag Plus Earlier Treatment Discovery from Increased Trial Throughput",
  description: "Treaty ROI from elimination of efficacy lag plus earlier treatment discovery from increased trial throughput. Total one-time benefit divided by campaign cost. This is the primary ROI estimate for total health benefits.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE ÷ CAMPAIGN_COST",
  latex: "\\begin{gathered}\nROI_{max} = \\frac{Value_{max}}{Cost_{campaign}} = \\frac{\\$84800T}{\\$1B} = 84.8M\n\\\\[0.5em]\n\\text{where } Value_{max} = DALYs_{max} \\times Value_{QALY} = 565B \\times \\$150K = \\$84800T\n\\\\[0.5em]\n\\text{where } DALYs_{max} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times T_{accel,max} = 2.88B \\times 92.6\\% \\times 212 = 565B\n\\\\[0.5em]\n\\text{where } T_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } Cost_{campaign} = Budget_{viral,base} + Budget_{lobby,treaty} + Budget_{reserve} = \\$250M + \\$650M + \\$100M = \\$1B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const TREATY_TOTAL_ANNUAL_COSTS: Parameter = {
  value: 290000000.0,
  parameterName: "TREATY_TOTAL_ANNUAL_COSTS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_total_annual_costs",
  unit: "USD/year",
  displayName: "Total Annual Treaty System Costs",
  description: "Total annual system costs (campaign + Decentralized Framework for Drug Assessment operations)",
  sourceType: "calculated",
  confidence: "high",
  formula: "CAMPAIGN_ANNUAL + DFDA_OPEX",
  latex: "\\begin{gathered}\nCost_{treaty,ann} = OPEX_{dFDA} + Cost_{camp,amort} = \\$40M + \\$250M = \\$290M\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } Cost_{camp,amort} = \\frac{Cost_{campaign}}{T_{campaign}} = \\frac{\\$1B}{4} = \\$250M\n\\\\[0.5em]\n\\text{where } Cost_{campaign} = Budget_{viral,base} + Budget_{lobby,treaty} + Budget_{reserve} = \\$250M + \\$650M + \\$100M = \\$1B\n\\end{gathered}",
};

export const TREATY_TRAJECTORY_AVG_INCOME_YEAR_15: Parameter = {
  value: 149452.79694361,
  parameterName: "TREATY_TRAJECTORY_AVG_INCOME_YEAR_15",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_trajectory_avg_income_year_15",
  unit: "USD",
  displayName: "Treaty Trajectory Average Income at Year 15",
  description: "Average income (GDP per capita) at year 15 under the Treaty Trajectory.",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_TRAJECTORY_GDP_YEAR_15 / GLOBAL_POPULATION_2040_PROJECTED",
  latex: "\\bar{y}_{treaty,15} = \\frac{GDP_{treaty,15}}{Pop_{2040}}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const TREATY_TRAJECTORY_AVG_INCOME_YEAR_20: Parameter = {
  value: 338569.0191556,
  parameterName: "TREATY_TRAJECTORY_AVG_INCOME_YEAR_20",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_trajectory_avg_income_year_20",
  unit: "USD",
  displayName: "Treaty Trajectory Average Income at Year 20",
  description: "Average income (GDP per capita) at year 20 under the Treaty Trajectory.",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_TRAJECTORY_GDP_YEAR_20 / GLOBAL_POPULATION_2045_PROJECTED",
  latex: "\\bar{y}_{treaty,20} = \\frac{GDP_{treaty,20}}{Pop_{2045}}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/gdp-trajectories.html",
  manualPageTitle: "Please Select an Earth: A) Everyone Gets Rich B) Somalia, but Everywhere",
};

export const TREATY_TRAJECTORY_CAGR_YEAR_20: Parameter = {
  value: 0.17933411068717886,
  parameterName: "TREATY_TRAJECTORY_CAGR_YEAR_20",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_trajectory_cagr_year_20",
  unit: "rate",
  displayName: "Treaty Trajectory CAGR (20 Years)",
  description: "Compound annual growth rate implied by Treaty Trajectory GDP trajectory over 20 years.",
  sourceType: "calculated",
  confidence: "high",
  formula: "(TREATY_TRAJECTORY_GDP_YEAR_20 ÷ GLOBAL_GDP_2025)^(1/20) - 1",
  latex: "\\begin{gathered}\ng_{treaty,CAGR} \\\\\n= \\left(\\frac{GDP_{treaty,20}}{GDP_0}\\right)^{1/20} - 1\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/political-dysfunction-tax.html",
  manualPageTitle: "The Political Dysfunction Tax",
};

export const TREATY_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME: Parameter = {
  value: 16051394.930961594,
  parameterName: "TREATY_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_trajectory_cumulative_lifetime_income",
  unit: "USD",
  displayName: "Treaty Trajectory Cumulative Lifetime Income (Per Capita)",
  description: "Cumulative per-capita income over an average remaining lifespan under Treaty Trajectory. Uses implied per-capita CAGR for years 1-20 (derived from known year-0 and year-20 per-capita incomes), then baseline growth from the year-20 level. Conservative: assumes no further treaty acceleration beyond year 20.",
  sourceType: "calculated",
  confidence: "high",
  formula: "Phase 1: y0*(1+g_pc)*((1+g_pc)^20-1)/g_pc + Phase 2: y20*(1+g_base)*((1+g_base)^(T-20)-1)/g_base",
  latex: "\\begin{gathered}\nY_{cum,treaty} \\\\\n= \\bar{y}_0 \\cdot \\frac{(1+g_{pc})((1+g_{pc})^{20}-1)}{g_{pc}} \\\\\n+ \\bar{y}_{treaty,20} \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}-20}-1)}{g_{base}}\n\\end{gathered}",
};

export const TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15: Parameter = {
  value: 7.986164148687315,
  parameterName: "TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_trajectory_gdp_vs_current_trajectory_multiplier_year_15",
  unit: "x",
  displayName: "Treaty Trajectory vs Current Trajectory GDP Multiplier (Year 15)",
  description: "Treaty Trajectory GDP at year 15 as a multiple of current trajectory GDP at year 15.",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_TRAJECTORY_GDP_YEAR_15 / CURRENT_TRAJECTORY_GDP_YEAR_15",
  latex: "\\begin{gathered}\nk_{treaty:base,15} = \\frac{GDP_{treaty,15}}{GDP_{base,15}} = \\frac{\\$1330T}{\\$167T} = 7.99\n\\\\[0.5em]\n\\text{where } GDP_{treaty,15}=GDP_0(1+g_{treaty,ramp})^3(1+g_{treaty,full})^{12}\n\\\\[0.5em]\n\\text{where } s_{mil,max} = Cut_{WW2} = 87.6\\% = 87.6\\%\n\\\\[0.5em]\n\\text{where } Cut_{WW2} = 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} = 1 - \\frac{\\$176B}{\\$1.42T} = 87.6\\%\n\\\\[0.5em]\n\\text{where } f_{cure,15,wish}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 15}{D_{untreated}}\\right)\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } k_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } GDP_{base,15} = GDP_0(1+g_{base})^{15}\n\\end{gathered}",
};

export const TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20: Parameter = {
  value: 16.529506763430206,
  parameterName: "TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_trajectory_gdp_vs_current_trajectory_multiplier_year_20",
  unit: "x",
  displayName: "Treaty Trajectory vs Current Trajectory GDP Multiplier (Year 20)",
  description: "Treaty Trajectory GDP at year 20 as a multiple of current trajectory GDP at year 20.",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_TRAJECTORY_GDP_YEAR_20 ÷ CURRENT_TRAJECTORY_GDP_YEAR_20",
  latex: "\\begin{gathered}\nk_{treaty:base,20} = \\frac{GDP_{treaty,20}}{GDP_{base,20}} = \\frac{\\$3110T}{\\$188T} = 16.5\n\\\\[0.5em]\n\\text{where } GDP_{treaty,20}=GDP_0(1+g_{treaty,ramp})^3(1+g_{treaty,full})^{17}\n\\\\[0.5em]\n\\text{where } s_{mil,max} = Cut_{WW2} = 87.6\\% = 87.6\\%\n\\\\[0.5em]\n\\text{where } Cut_{WW2} = 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} = 1 - \\frac{\\$176B}{\\$1.42T} = 87.6\\%\n\\\\[0.5em]\n\\text{where } f_{cure,20,wish}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 20}{D_{untreated}}\\right)\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } k_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } GDP_{base,20} = GDP_0(1+g_{base})^{20}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/recruitment-and-propaganda-plan.html",
  manualPageTitle: "Recruitment & Propaganda Plan",
};

export const TREATY_TRAJECTORY_GDP_YEAR_15: Parameter = {
  value: 1330129892798129.0,
  parameterName: "TREATY_TRAJECTORY_GDP_YEAR_15",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_trajectory_gdp_year_15",
  unit: "USD",
  displayName: "Treaty Trajectory GDP at Year 15",
  description: "Projected global GDP at year 15 under the Treaty Trajectory: military-to-science reallocation plus disease-burden recovery only. 3-year ramp at 50% intensity + 12 years full implementation. Excludes non-health dysfunction-capital reallocation.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_GDP_2025 * (1 + g_treaty_ramp)^3 * (1 + g_treaty_full)^12, where g_treaty includes baseline growth + military reallocation + disease-burden recovery only",
  latex: "\\begin{gathered}\nGDP_{treaty,15} \\\\\n= GDP_0(1+g_{treaty,ramp})^3(1+g_{treaty,full})^{12}\n\\end{gathered}",
};

export const TREATY_TRAJECTORY_GDP_YEAR_20: Parameter = {
  value: 3114834976231520.0,
  parameterName: "TREATY_TRAJECTORY_GDP_YEAR_20",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_trajectory_gdp_year_20",
  unit: "USD",
  displayName: "Treaty Trajectory GDP at Year 20",
  description: "Projected global GDP at year 20 under the Treaty Trajectory: military-to-science reallocation plus disease-burden recovery only. Excludes non-health dysfunction-capital reallocation to isolate the lower-political-baggage channel.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_GDP_2025 × (1 + g_treaty_ramp)^3 × (1 + g_treaty_full)^17, where g_treaty includes baseline growth + military reallocation + disease-burden recovery only",
  latex: "\\begin{gathered}\nGDP_{treaty,20} \\\\\n= GDP_0(1+g_{treaty,ramp})^3(1+g_{treaty,full})^{17}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/political-dysfunction-tax.html",
  manualPageTitle: "The Political Dysfunction Tax",
};

export const TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA: Parameter = {
  value: 14712635.771127902,
  parameterName: "TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_trajectory_lifetime_income_gain_per_capita",
  unit: "USD",
  displayName: "Treaty Trajectory Lifetime Income Gain (Per Capita)",
  description: "Lifetime per-capita income gain from Treaty Trajectory vs current trajectory. Cumulative treaty income minus cumulative earth income over average remaining lifespan. Uses global averages; individual gain scales with starting income.",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME - CURRENT_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME",
  latex: "\\begin{gathered}\n\\Delta Y_{lifetime,treaty} = Y_{cum,treaty} - Y_{cum,earth} = \\$16.1M - \\$1.34M = \\$14.7M\n\\\\[0.5em]\n\\text{where } Y_{cum,treaty} = \\bar{y}_0 \\cdot \\frac{(1+g_{pc})((1+g_{pc})^{20}-1)}{g_{pc}} + \\bar{y}_{treaty,20} \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}-20}-1)}{g_{base}}\n\\\\[0.5em]\n\\text{where } \\bar{y}_{0} = \\frac{GDP_{global}}{Pop_{global}} = \\frac{\\$115T}{8B} = \\$14.4K\n\\\\[0.5em]\n\\text{where } \\bar{y}_{treaty,20} = \\frac{GDP_{treaty,20}}{Pop_{2045}}\n\\\\[0.5em]\n\\text{where } GDP_{treaty,20}=GDP_0(1+g_{treaty,ramp})^3(1+g_{treaty,full})^{17}\n\\\\[0.5em]\n\\text{where } s_{mil,max} = Cut_{WW2} = 87.6\\% = 87.6\\%\n\\\\[0.5em]\n\\text{where } Cut_{WW2} = 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} = 1 - \\frac{\\$176B}{\\$1.42T} = 87.6\\%\n\\\\[0.5em]\n\\text{where } f_{cure,20,wish}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 20}{D_{untreated}}\\right)\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } k_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } T_{remaining} = LE_{global} - Age_{median} = 79 - 30.5 = 48.5\n\\\\[0.5em]\n\\text{where } Y_{cum,earth} = \\bar{y}_0 \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}}-1)}{g_{base}}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/recruitment-and-propaganda-plan.html",
  manualPageTitle: "Recruitment & Propaganda Plan",
};

export const TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER: Parameter = {
  value: 11.98975544858688,
  parameterName: "TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_trajectory_lifetime_income_multiplier",
  unit: "x",
  displayName: "Treaty Trajectory Lifetime Income Multiplier",
  description: "Ratio of cumulative lifetime income under Treaty Trajectory vs current trajectory. Income-agnostic: applies as a multiplier to any individual's lifetime earnings.",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME / CURRENT_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME",
  latex: "\\begin{gathered}\nk_{lifetime,treaty:earth} = \\frac{Y_{cum,treaty}}{Y_{cum,earth}} = \\frac{\\$16.1M}{\\$1.34M} = 12\n\\\\[0.5em]\n\\text{where } Y_{cum,treaty} = \\bar{y}_0 \\cdot \\frac{(1+g_{pc})((1+g_{pc})^{20}-1)}{g_{pc}} + \\bar{y}_{treaty,20} \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}-20}-1)}{g_{base}}\n\\\\[0.5em]\n\\text{where } \\bar{y}_{0} = \\frac{GDP_{global}}{Pop_{global}} = \\frac{\\$115T}{8B} = \\$14.4K\n\\\\[0.5em]\n\\text{where } \\bar{y}_{treaty,20} = \\frac{GDP_{treaty,20}}{Pop_{2045}}\n\\\\[0.5em]\n\\text{where } GDP_{treaty,20}=GDP_0(1+g_{treaty,ramp})^3(1+g_{treaty,full})^{17}\n\\\\[0.5em]\n\\text{where } s_{mil,max} = Cut_{WW2} = 87.6\\% = 87.6\\%\n\\\\[0.5em]\n\\text{where } Cut_{WW2} = 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} = 1 - \\frac{\\$176B}{\\$1.42T} = 87.6\\%\n\\\\[0.5em]\n\\text{where } f_{cure,20,wish}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 20}{D_{untreated}}\\right)\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } k_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } T_{remaining} = LE_{global} - Age_{median} = 79 - 30.5 = 48.5\n\\\\[0.5em]\n\\text{where } Y_{cum,earth} = \\bar{y}_0 \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}}-1)}{g_{base}}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/recruitment-and-propaganda-plan.html",
  manualPageTitle: "Recruitment & Propaganda Plan",
};

export const TREATY_VS_BED_NETS_MULTIPLIER: Parameter = {
  value: 50306.6869282389,
  parameterName: "TREATY_VS_BED_NETS_MULTIPLIER",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_vs_bed_nets_multiplier",
  unit: "x",
  displayName: "Cost-Effectiveness vs Bed Nets Multiplier",
  description: "How many times more cost-effective than bed nets (using bed net cost per DALY midpoint estimate)",
  sourceType: "calculated",
  confidence: "high",
  formula: "BED_NETS_COST_PER_DALY ÷ TREATY_COST_PER_DALY",
  latex: "\\begin{gathered}\nk_{treaty:nets} = \\frac{Cost_{nets}}{Cost_{treaty,DALY}} = \\frac{\\$89}{\\$0.00177} = 50{,}300\n\\\\[0.5em]\n\\text{where } Cost_{treaty,DALY} = \\frac{Cost_{campaign}}{DALYs_{max}} = \\frac{\\$1B}{565B} = \\$0.00177\n\\\\[0.5em]\n\\text{where } Cost_{campaign} = Budget_{viral,base} + Budget_{lobby,treaty} + Budget_{reserve} = \\$250M + \\$650M + \\$100M = \\$1B\n\\\\[0.5em]\n\\text{where } DALYs_{max} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times T_{accel,max} = 2.88B \\times 92.6\\% \\times 212 = 565B\n\\\\[0.5em]\n\\text{where } T_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const TREATY_VS_DIRECT_FUNDING_LEVERAGE: Parameter = {
  value: 475.6594654774342,
  parameterName: "TREATY_VS_DIRECT_FUNDING_LEVERAGE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_vs_direct_funding_leverage",
  unit: "x",
  displayName: "Treaty Campaign Leverage vs Direct Funding",
  description: "How many times more cost-effective the treaty campaign is vs direct funding. Treaty campaign unlocks government funding at scale, avoiding need for philanthropists/NIH to directly commit equivalent amounts. Both approaches achieve same DALY timeline shift benefit. Treaty spreads cost across governments while building sustainable public funding infrastructure.",
  sourceType: "calculated",
  confidence: "high",
  formula: "DFDA_DIRECT_FUNDING_COST_PER_DALY ÷ TREATY_COST_PER_DALY",
  latex: "\\begin{gathered}\nLeverage_{treaty} = \\frac{Cost_{direct,DALY}}{Cost_{treaty,DALY}} = \\frac{\\$0.842}{\\$0.00177} = 476\n\\\\[0.5em]\n\\text{where } Cost_{direct,DALY} = \\frac{NPV_{direct}}{DALYs_{max}} = \\frac{\\$476B}{565B} = \\$0.842\n\\\\[0.5em]\n\\text{where } NPV_{direct} = Funding_{ann} \\times \\frac{1 - (1+r)^{-T}}{r}\n\\\\[0.5em]\n\\text{where } T_{queue,dFDA} = \\frac{T_{queue,SQ}}{k_{capacity}} = \\frac{443}{12.3} = 36\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } DALYs_{max} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times T_{accel,max} = 2.88B \\times 92.6\\% \\times 212 = 565B\n\\\\[0.5em]\n\\text{where } T_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } Cost_{treaty,DALY} = \\frac{Cost_{campaign}}{DALYs_{max}} = \\frac{\\$1B}{565B} = \\$0.00177\n\\\\[0.5em]\n\\text{where } Cost_{campaign} = Budget_{viral,base} + Budget_{lobby,treaty} + Budget_{reserve} = \\$250M + \\$650M + \\$100M = \\$1B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const TRIAL_CAPACITY_CUMULATIVE_YEARS_20YR: Parameter = {
  value: 246.5582686533341,
  parameterName: "TRIAL_CAPACITY_CUMULATIVE_YEARS_20YR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-trial_capacity_cumulative_years_20yr",
  unit: "years",
  displayName: "Cumulative Trial Capacity Years Over 20 Years",
  description: "Cumulative trial-capacity-equivalent years over 20-year period",
  sourceType: "calculated",
  confidence: "high",
  formula: "DFDA_TRIAL_CAPACITY_MULTIPLIER × 20 YEARS",
  latex: "\\begin{gathered}\nCapacity_{20yr} = k_{capacity} \\times 20 = 12.3 \\times 20 = 247\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const TYPE_II_ERROR_COST_RATIO: Parameter = {
  value: 3067.7541293180693,
  parameterName: "TYPE_II_ERROR_COST_RATIO",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-type_ii_error_cost_ratio",
  unit: "ratio",
  displayName: "Ratio of Type II Error Cost to Type I Error Benefit",
  description: "Ratio of Type II error cost to Type I error benefit (harm from delay vs. harm prevented)",
  sourceType: "calculated",
  confidence: "medium",
  formula: "TYPE_II_COST ÷ TYPE_I_BENEFIT",
  latex: "\\begin{gathered}\nRatio_{TypeII} = \\frac{DALYs_{lag}}{DALY_{TypeI}} = \\frac{7.94B}{2.59M} = 3{,}070\n\\\\[0.5em]\n\\text{where } DALYs_{lag} = YLL_{lag} + YLD_{lag} = 7.07B + 873M = 7.94B\n\\\\[0.5em]\n\\text{where } YLL_{lag} = Deaths_{lag} \\times (LE_{global} - Age_{death,delay}) = 416M \\times (79 - 62) = 7.07B\n\\\\[0.5em]\n\\text{where } Deaths_{lag} = T_{lag} \\times Deaths_{disease,daily} \\times 338 = 8.2 \\times 150{,}000 \\times 338 = 416M\n\\\\[0.5em]\n\\text{where } YLD_{lag} = Deaths_{lag} \\times T_{suffering} \\times DW_{chronic} = 416M \\times 6 \\times 0.35 = 873M\n\\\\[0.5em]\n\\text{where } DALY_{TypeI} = DALY_{thal} \\times 62 = 41{,}800 \\times 62 = 2.59M\n\\\\[0.5em]\n\\text{where } DALY_{thal} = YLD_{thal} + YLL_{thal} = 13{,}000 + 28{,}800 = 41{,}800\n\\\\[0.5em]\n\\text{where } YLD_{thal} = DW_{thal} \\times N_{thal,survive} \\times LE_{thal} = 0.4 \\times 540 \\times 60 = 13{,}000\n\\\\[0.5em]\n\\text{where } N_{thal,survive} = N_{thal,US,prevent} \\times (1 - Rate_{thal,mort}) = 900 \\times (1 - 40\\%) = 540\n\\\\[0.5em]\n\\text{where } N_{thal,US,prevent} = N_{thal,global} \\times Pct_{US,1960} = 15{,}000 \\times 6\\% = 900\n\\\\[0.5em]\n\\text{where } YLL_{thal} = Deaths_{thal} \\times 80 = 360 \\times 80 = 28{,}800\n\\\\[0.5em]\n\\text{where } Deaths_{thal} = Rate_{thal,mort} \\times N_{thal,US,prevent} = 40\\% \\times 900 = 360\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const TYPE_I_ERROR_BENEFIT_DALYS: Parameter = {
  value: 2589120.0,
  parameterName: "TYPE_I_ERROR_BENEFIT_DALYS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-type_i_error_benefit_dalys",
  unit: "DALYs",
  displayName: "Maximum DALYs Saved by FDA Preventing Unsafe Drugs (1962-2024)",
  description: "Maximum DALYs saved by FDA preventing unsafe drugs over 62-year period 1962-2024 (extreme overestimate: one Thalidomide-scale event per year)",
  sourceType: "calculated",
  confidence: "low",
  formula: "THALIDOMIDE_DALYS_PER_EVENT × 62 years",
  latex: "\\begin{gathered}\nDALY_{TypeI} = DALY_{thal} \\times 62 = 41{,}800 \\times 62 = 2.59M\n\\\\[0.5em]\n\\text{where } DALY_{thal} = YLD_{thal} + YLL_{thal} = 13{,}000 + 28{,}800 = 41{,}800\n\\\\[0.5em]\n\\text{where } YLD_{thal} = DW_{thal} \\times N_{thal,survive} \\times LE_{thal} = 0.4 \\times 540 \\times 60 = 13{,}000\n\\\\[0.5em]\n\\text{where } N_{thal,survive} = N_{thal,US,prevent} \\times (1 - Rate_{thal,mort}) = 900 \\times (1 - 40\\%) = 540\n\\\\[0.5em]\n\\text{where } N_{thal,US,prevent} = N_{thal,global} \\times Pct_{US,1960} = 15{,}000 \\times 6\\% = 900\n\\\\[0.5em]\n\\text{where } YLL_{thal} = Deaths_{thal} \\times 80 = 360 \\times 80 = 28{,}800\n\\\\[0.5em]\n\\text{where } Deaths_{thal} = Rate_{thal,mort} \\times N_{thal,US,prevent} = 40\\% \\times 900 = 360\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const UNEXPLORED_RATIO: Parameter = {
  value: 0.996578947368421,
  parameterName: "UNEXPLORED_RATIO",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-unexplored_ratio",
  unit: "percentage",
  displayName: "Unexplored Therapeutic Frontier",
  description: "Fraction of possible drug-disease space that remains unexplored (>99%)",
  sourceType: "calculated",
  confidence: "high",
  formula: "1 - EXPLORATION_RATIO",
  latex: "\\begin{gathered}\nRatio_{unexplored} = 1 - \\frac{N_{tested}}{N_{combos}} = 1 - \\frac{32{,}500}{9.5M} = 99.7\\%\n\\\\[0.5em]\n\\text{where } N_{combos} = N_{safe} \\times N_{diseases,trial} = 9{,}500 \\times 1{,}000 = 9.5M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/nih-fails-2-institute-health.html",
  manualPageTitle: "NIH Fails to Institute Health",
};

export const US_CONGRESS_FULL_ADVOCACY_COST: Parameter = {
  value: 5350000000.0,
  parameterName: "US_CONGRESS_FULL_ADVOCACY_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_congress_full_advocacy_cost",
  unit: "USD",
  displayName: "US Congress Full Advocacy Cost",
  description: "Upper-bound advocacy cost to match career incentives for all 535 members of Congress",
  sourceType: "calculated",
  confidence: "medium",
  formula: "CONGRESS_MEMBERS x POST_OFFICE_VALUE",
  latex: "\\begin{gathered}\nCost_{US,congress} \\\\\n= N_{congress} \\times V_{post-office} \\\\\n= 535 \\times \\$10M \\\\\n= \\$5.35B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/cost-of-change-analysis.html",
  manualPageTitle: "The Price of Political Change: A Cost-Benefit Framework for Policy Incentivization",
};

export const US_FEDERAL_SPENDING_PER_CAPITA: Parameter = {
  value: 20298.507462686568,
  parameterName: "US_FEDERAL_SPENDING_PER_CAPITA",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_federal_spending_per_capita",
  unit: "USD/person",
  displayName: "US Federal Spending per Capita",
  description: "US federal spending per capita. $6.8T total federal spending divided by 335M population.",
  sourceType: "calculated",
  confidence: "high",
  formula: "US_FEDERAL_SPENDING_2024 / US_POPULATION_2024",
  latex: "\\begin{gathered}\nSpend_{fed,pc} \\\\\n= \\frac{Spending_{federal}}{Pop_{US}} \\\\\n= \\frac{\\$6.8T}{335M} \\\\\n= \\$20.3K\n\\end{gathered}",
};

export const US_FED_DISCRETIONARY_EFFICIENCY: Parameter = {
  value: 0.4052941176470588,
  parameterName: "US_FED_DISCRETIONARY_EFFICIENCY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_fed_discretionary_efficiency",
  unit: "percent",
  displayName: "US Discretionary Efficiency",
  description: "US federal discretionary spending efficiency. What fraction of discretionary spending avoids direct waste (Cat 1 only: military overspend, corporate welfare, drug war, fossil/ag subsidies). ~41%. Some Cat 1 items (farm subsidies, tax expenditures) are technically mandatory/off-budget but are fungible policy choices.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "1 - (CAT1 / DISCRETIONARY)",
  latex: "\\begin{gathered}\nE_{US,disc} = 1 - \\frac{W_{cat1}}{Spending_{fed}} = 1 - \\frac{\\$1.01T}{\\$1.7T} = 40.5\\%\n\\\\[0.5em]\n\\text{where } W_{cat1} = W_{military} + W_{corporate} + W_{drugs} + W_{fossil} + W_{agriculture} = \\$615B + \\$181B + \\$90B + \\$50B + \\$75B = \\$1.01T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_FED_DISCRETIONARY_WASTE_PCT: Parameter = {
  value: 0.5947058823529412,
  parameterName: "US_FED_DISCRETIONARY_WASTE_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_fed_discretionary_waste_pct",
  unit: "percent",
  displayName: "Discretionary Waste (%)",
  description: "Category 1 direct spending waste as percentage of federal discretionary spending. ~$1.01T Cat 1 waste / $1.7T discretionary = ~59%. Uses discretionary spending as denominator because Cat 1 items (military overspend, corporate welfare, drug war, fossil/ag subsidies) are fungible policy choices within discretionary budget.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "US_GOV_WASTE_CATEGORY_1_DIRECT_SPENDING / US_FED_DISCRETIONARY_SPENDING_2024",
  latex: "\\begin{gathered}\nW_{US,\\%disc} = \\frac{W_{cat1}}{Spending_{fed}} = \\frac{\\$1.01T}{\\$1.7T} = 59.5\\%\n\\\\[0.5em]\n\\text{where } W_{cat1} = W_{military} + W_{corporate} + W_{drugs} + W_{fossil} + W_{agriculture} = \\$615B + \\$181B + \\$90B + \\$50B + \\$75B = \\$1.01T\n\\end{gathered}",
};

export const US_GOVERNANCE_EFFICIENCY_GDP: Parameter = {
  value: 0.8298471160528145,
  parameterName: "US_GOVERNANCE_EFFICIENCY_GDP",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_governance_efficiency_gdp",
  unit: "percent",
  displayName: "US Governance Efficiency (GDP)",
  description: "Total US governance efficiency: all 4 waste categories as share of GDP. 1 - ($4.9T / $28.78T) = ~83%. This broader metric captures direct spending waste, compliance burden, policy-induced GDP loss, and system inefficiency relative to total economic output.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "1 - (US_GOV_WASTE_TOTAL / US_GDP)",
  latex: "\\begin{gathered}\nE_{US,GDP} = 1 - \\frac{W_{total,US}}{USGDP} = 1 - \\frac{\\$4.9T}{\\$28.8T} = 83\\%\n\\\\[0.5em]\n\\text{where } W_{total,US} = W_{raw,US} \\times US = \\$4.9T \\times 1 = \\$4.9T\n\\\\[0.5em]\n\\text{where } W_{raw,US} = W_{health} + W_{housing} + W_{military} + W_{regulatory} + W_{tax} + W_{corporate} + W_{tariffs} + W_{drugs} + W_{fossil} + W_{agriculture} = \\$1.2T + \\$1.4T + \\$615B + \\$580B + \\$546B + \\$181B + \\$160B + \\$90B + \\$50B + \\$75B = \\$4.9T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_CATEGORY_1_DIRECT_SPENDING: Parameter = {
  value: 1011000000000.0,
  parameterName: "US_GOV_WASTE_CATEGORY_1_DIRECT_SPENDING",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_category_1_direct_spending",
  unit: "USD",
  displayName: "Category 1: Direct Spending Waste",
  description: "Category 1: Direct Federal Spending Waste. Actual federal budget allocations that could be redirected. Includes military overspend ($615B), corporate welfare ($181B), drug war ($90B), fossil fuel subsidies ($50B), and agricultural subsidies ($75B). Total: ~$1.01T annually. Solution: Budget reallocation.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "Military + Corporate + Drug War + Fossil + Agriculture",
  latex: "\\begin{gathered}\nW_{cat1} \\\\\n= W_{military} + W_{corporate} + W_{drugs} + W_{fossil} \\\\\n+ W_{agriculture} \\\\\n= \\$615B + \\$181B + \\$90B + \\$50B + \\$75B \\\\\n= \\$1.01T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_CATEGORY_2_COMPLIANCE: Parameter = {
  value: 1126000000000.0,
  parameterName: "US_GOV_WASTE_CATEGORY_2_COMPLIANCE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_category_2_compliance",
  unit: "USD",
  displayName: "Category 2: Compliance Burden",
  description: "Category 2: Compliance Burden on Private Sector. Private sector resources consumed by government-imposed compliance requirements. Includes tax compliance ($546B) and regulatory red tape ($580B). Total: ~$1.13T annually. Solution: Simplification (tax code reform, regulatory streamlining).",
  sourceType: "calculated",
  confidence: "medium",
  formula: "Tax Compliance + Regulatory Red Tape",
  latex: "\\begin{gathered}\nW_{cat2} \\\\\n= W_{tax} + W_{regulatory} \\\\\n= \\$546B + \\$580B \\\\\n= \\$1.13T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_CATEGORY_3_GDP_LOSS: Parameter = {
  value: 1560000000000.0,
  parameterName: "US_GOV_WASTE_CATEGORY_3_GDP_LOSS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_category_3_gdp_loss",
  unit: "USD",
  displayName: "Category 3: GDP Loss",
  description: "Category 3: Policy-Induced GDP Loss. Economic output foregone due to policy constraints on markets. Includes housing/zoning restrictions ($1.4T) and tariffs ($160B). Total: ~$1.56T annually. Solution: Policy reform (zoning liberalization, trade policy).",
  sourceType: "calculated",
  confidence: "medium",
  formula: "Housing/Zoning + Tariffs",
  latex: "\\begin{gathered}\nW_{cat3} \\\\\n= W_{housing} + W_{tariffs} \\\\\n= \\$1.4T + \\$160B \\\\\n= \\$1.56T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_CATEGORY_4_SYSTEM: Parameter = {
  value: 1200000000000.0,
  parameterName: "US_GOV_WASTE_CATEGORY_4_SYSTEM",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_category_4_system",
  unit: "USD",
  displayName: "Category 4: System Inefficiency",
  description: "Category 4: Total System Inefficiency. Fundamental system design failures requiring structural redesign. Currently only healthcare system inefficiency ($1.2T). Solution: System redesign using competitive market models (Singapore's catastrophic coverage + HSAs, Switzerland's regulated competition).",
  sourceType: "calculated",
  confidence: "high",
  formula: "Healthcare Inefficiency",
  latex: "W_{cat4} = W_{health} = \\$1.2T = \\$1.2T",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_PCT_GDP: Parameter = {
  value: 0.17015288394718556,
  parameterName: "US_GOV_WASTE_PCT_GDP",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_pct_gdp",
  unit: "percent",
  displayName: "US Waste (% GDP)",
  description: "US government waste as percentage of GDP. ~$4.90T waste / $28.78T GDP = ~17%. This represents the 'dysfunction tax' that American citizens effectively pay through inefficient governance.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "US_GOV_WASTE_TOTAL / US_GDP",
  latex: "\\begin{gathered}\nW_{US,\\%GDP} = \\frac{W_{total,US}}{USGDP} = \\frac{\\$4.9T}{\\$28.8T} = 17\\%\n\\\\[0.5em]\n\\text{where } W_{total,US} = W_{raw,US} \\times US = \\$4.9T \\times 1 = \\$4.9T\n\\\\[0.5em]\n\\text{where } W_{raw,US} = W_{health} + W_{housing} + W_{military} + W_{regulatory} + W_{tax} + W_{corporate} + W_{tariffs} + W_{drugs} + W_{fossil} + W_{agriculture} = \\$1.2T + \\$1.4T + \\$615B + \\$580B + \\$546B + \\$181B + \\$160B + \\$90B + \\$50B + \\$75B = \\$4.9T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/optimocracy-paper.html",
  manualPageTitle: "Optimocracy: Causal Inference on Cross-Jurisdictional Policy Data to Maximize Median Health and Wealth",
};

export const US_GOV_WASTE_QALY_EQUIVALENTS: Parameter = {
  value: 48970000.0,
  parameterName: "US_GOV_WASTE_QALY_EQUIVALENTS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_qaly_equivalents",
  unit: "QALYs",
  displayName: "US Waste (QALY Equivalents)",
  description: "US government waste expressed as QALY equivalents. This is an economic equivalent, NOT epidemiological health outcomes. Dividing by QALY threshold yields a measure of foregone welfare.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "US_GOV_WASTE_TOTAL / QALY_THRESHOLD",
  latex: "\\begin{gathered}\nW_{US,QALY} = \\frac{W_{total,US}}{QALY_{threshold}} = \\frac{\\$4.9T}{\\$100K} = 49M\n\\\\[0.5em]\n\\text{where } W_{total,US} = W_{raw,US} \\times US = \\$4.9T \\times 1 = \\$4.9T\n\\\\[0.5em]\n\\text{where } W_{raw,US} = W_{health} + W_{housing} + W_{military} + W_{regulatory} + W_{tax} + W_{corporate} + W_{tariffs} + W_{drugs} + W_{fossil} + W_{agriculture} = \\$1.2T + \\$1.4T + \\$615B + \\$580B + \\$546B + \\$181B + \\$160B + \\$90B + \\$50B + \\$75B = \\$4.9T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_RAW_TOTAL: Parameter = {
  value: 4897000000000.0,
  parameterName: "US_GOV_WASTE_RAW_TOTAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_raw_total",
  unit: "USD",
  displayName: "US Gov Waste (Raw Total)",
  description: "Raw sum of US government waste components before overlap discount: healthcare ($1.2T) + housing ($1.4T) + military ($615B) + regulatory ($580B) + tax ($546B) + corporate ($181B) + tariffs ($160B) + drug war ($90B) + fossil fuel ($50B) + agriculture ($75B) = ~$4.9T raw.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "SUM(all 10 components)",
  latex: "\\begin{gathered}\nW_{raw,US} \\\\\n= W_{health} + W_{housing} + W_{military} + W_{regulatory} \\\\\n+ W_{tax} + W_{corporate} + W_{tariffs} + W_{drugs} \\\\\n+ W_{fossil} + W_{agriculture} \\\\\n= \\$1.2T + \\$1.4T + \\$615B + \\$580B + \\$546B + \\$181B + \\$160B \\\\\n+ \\$90B + \\$50B + \\$75B \\\\\n= \\$4.9T\n\\end{gathered}",
};

export const US_GOV_WASTE_RECOVERABLE: Parameter = {
  value: 2448500000000.0,
  parameterName: "US_GOV_WASTE_RECOVERABLE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_recoverable",
  unit: "USD",
  displayName: "Recoverable Capital",
  description: "Recoverable capital if US improved to OECD median efficiency. Current US efficiency ~38-48%; OECD median ~75-85%. Closing to ~80% would recover approximately half the gap.",
  sourceType: "calculated",
  confidence: "low",
  formula: "US_GOV_WASTE_TOTAL x 0.50",
  latex: "\\begin{gathered}\nW_{US,recoverable} = W_{total,US} \\times 0.5 = \\$4.9T \\times 0.5 = \\$2.45T\n\\\\[0.5em]\n\\text{where } W_{total,US} = W_{raw,US} \\times US = \\$4.9T \\times 1 = \\$4.9T\n\\\\[0.5em]\n\\text{where } W_{raw,US} = W_{health} + W_{housing} + W_{military} + W_{regulatory} + W_{tax} + W_{corporate} + W_{tariffs} + W_{drugs} + W_{fossil} + W_{agriculture} = \\$1.2T + \\$1.4T + \\$615B + \\$580B + \\$546B + \\$181B + \\$160B + \\$90B + \\$50B + \\$75B = \\$4.9T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_TOTAL: Parameter = {
  value: 4897000000000.0,
  parameterName: "US_GOV_WASTE_TOTAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_total",
  unit: "USD",
  displayName: "US Government Waste (Total)",
  description: "Total annual US government waste (additive sum of components). Consolidates healthcare ($1.2T), housing ($1.4T), military ($615B), regulatory ($580B), tax ($546B), corporate ($181B), tariffs ($160B), drug war ($90B), fossil fuel ($50B), agriculture ($75B). Categories treated as additive; any overlap offset by excluded categories (state/local inefficiency, implicit subsidies, behavioral effects). ~$4.9T annually.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "SUM(all components)",
  latex: "\\begin{gathered}\nW_{total,US} = W_{raw,US} \\times US = \\$4.9T \\times 1 = \\$4.9T\n\\\\[0.5em]\n\\text{where } W_{raw,US} = W_{health} + W_{housing} + W_{military} + W_{regulatory} + W_{tax} + W_{corporate} + W_{tariffs} + W_{drugs} + W_{fossil} + W_{agriculture} = \\$1.2T + \\$1.4T + \\$615B + \\$580B + \\$546B + \\$181B + \\$160B + \\$90B + \\$50B + \\$75B = \\$4.9T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_VSL_EQUIVALENTS: Parameter = {
  value: 357445.25547445257,
  parameterName: "US_GOV_WASTE_VSL_EQUIVALENTS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_vsl_equivalents",
  unit: "people",
  displayName: "US Waste (VSL Equivalents)",
  description: "US government waste expressed as VSL equivalents. This is an economic equivalent, NOT literal deaths. Dividing the efficiency gap by VSL yields a measure of foregone welfare.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "US_GOV_WASTE_TOTAL / DOT_VSL",
  latex: "\\begin{gathered}\nW_{US,VSL} = \\frac{W_{total,US}}{VSL_{DOT}} = \\frac{\\$4.9T}{\\$13.7M} = 357{,}000\n\\\\[0.5em]\n\\text{where } W_{total,US} = W_{raw,US} \\times US = \\$4.9T \\times 1 = \\$4.9T\n\\\\[0.5em]\n\\text{where } W_{raw,US} = W_{health} + W_{housing} + W_{military} + W_{regulatory} + W_{tax} + W_{corporate} + W_{tariffs} + W_{drugs} + W_{fossil} + W_{agriculture} = \\$1.2T + \\$1.4T + \\$615B + \\$580B + \\$546B + \\$181B + \\$160B + \\$90B + \\$50B + \\$75B = \\$4.9T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_GOV_WASTE_VS_TREATY_MULTIPLIER: Parameter = {
  value: 180.03676470588235,
  parameterName: "US_GOV_WASTE_VS_TREATY_MULTIPLIER",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_vs_treaty_multiplier",
  unit: "ratio",
  displayName: "Efficiency Gap / Treaty Funding",
  description: "How many times the US government efficiency gap could fund the 1% Treaty. The efficiency gap represents capital that could fund transformative health research many times over.",
  sourceType: "calculated",
  confidence: "medium",
  formula: "US_GOV_WASTE_TOTAL / TREATY_ANNUAL_FUNDING",
  latex: "\\begin{gathered}\nk_{waste:treaty} = \\frac{W_{total,US}}{Funding_{treaty}} = \\frac{\\$4.9T}{\\$27.2B} = 180\n\\\\[0.5em]\n\\text{where } W_{total,US} = W_{raw,US} \\times US = \\$4.9T \\times 1 = \\$4.9T\n\\\\[0.5em]\n\\text{where } W_{raw,US} = W_{health} + W_{housing} + W_{military} + W_{regulatory} + W_{tax} + W_{corporate} + W_{tariffs} + W_{drugs} + W_{fossil} + W_{agriculture} = \\$1.2T + \\$1.4T + \\$615B + \\$580B + \\$546B + \\$181B + \\$160B + \\$90B + \\$50B + \\$75B = \\$4.9T\n\\\\[0.5em]\n\\text{where } Funding_{treaty} = Spending_{mil} \\times Reduce_{treaty} = \\$2.72T \\times 1\\% = \\$27.2B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/us-efficiency-audit.html",
  manualPageTitle: "United States Efficiency Audit",
};

export const US_MAJOR_DISEASES_TOTAL_ANNUAL_COST: Parameter = {
  value: 1253000000000.0,
  parameterName: "US_MAJOR_DISEASES_TOTAL_ANNUAL_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_major_diseases_total_annual_cost",
  unit: "USD",
  displayName: "US Major Diseases Total Annual Cost",
  description: "Total annual US cost of major diseases (diabetes, Alzheimer's, heart disease, cancer)",
  sourceType: "calculated",
  confidence: "high",
  formula: "DIABETES + ALZHEIMERS + HEART + CANCER",
  latex: "\\begin{gathered}\nCost_{disease,US} \\\\\n= Cost_{ALZ,US} + Cost_{cancer,US} + Cost_{diabetes,US} \\\\\n+ Cost_{heart,US} \\\\\n= \\$355B + \\$208B + \\$327B + \\$363B \\\\\n= \\$1.25T\n\\end{gathered}",
};

export const US_MILITARY_SPENDING_CURRENT_VS_PREWAR_MULTIPLIER: Parameter = {
  value: 30.551724137931036,
  parameterName: "US_MILITARY_SPENDING_CURRENT_VS_PREWAR_MULTIPLIER",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_military_spending_current_vs_prewar_multiplier",
  unit: "x",
  displayName: "Current US Military Spending vs Pre-WW2 Baseline (Multiplier)",
  description: "Ratio of current US military spending to pre-WW2 baseline in constant dollars ($886B / $29B)",
  sourceType: "calculated",
  confidence: "high",
  formula: "US_MILITARY_SPENDING_2024 / US_MILITARY_SPENDING_1939",
  latex: "\\begin{gathered}\nRatio_{US,2024:1939} \\\\\n= \\frac{Spending_{US,2024}}{Spending_{US,1939}} \\\\\n= \\frac{\\$886B}{\\$29B} \\\\\n= 30.6\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/proof.html",
  manualPageTitle: "The Proof: Overview",
};

export const US_POLITICAL_REFORM_INVESTMENT_TOTAL: Parameter = {
  value: 25510000000.0,
  parameterName: "US_POLITICAL_REFORM_INVESTMENT_TOTAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_political_reform_investment_total",
  unit: "USD",
  displayName: "US Political Reform Investment (Total)",
  description: "Total upper-bound investment for US political reform: (campaign spending + 2 years lobbying) × effort multiplier + Congress career advocacy. Represents cost to achieve democratic parity with incumbent interests.",
  sourceType: "calculated",
  confidence: "low",
  formula: "(CAMPAIGN + LOBBYING×2) × EFFORT_MULTIPLIER + CONGRESS_CAREER",
  latex: "\\begin{gathered}\nCost_{US,total} \\\\\n= (Cost_{campaign} \\\\\n+ Cost_{lobby} \\times 2) \\times \\mu_{effort} + Cost_{career}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/cost-of-change-analysis.html",
  manualPageTitle: "The Price of Political Change: A Cost-Benefit Framework for Policy Incentivization",
};

export const US_SENATE_TREATY_ADVOCACY_COST: Parameter = {
  value: 670000000.0,
  parameterName: "US_SENATE_TREATY_ADVOCACY_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_senate_treaty_advocacy_cost",
  unit: "USD",
  displayName: "US Senate Treaty Advocacy Cost",
  description: "Upper-bound advocacy cost to match career incentives for 67 senators (treaty ratification threshold)",
  sourceType: "calculated",
  confidence: "medium",
  formula: "SENATORS_FOR_TREATY x POST_OFFICE_VALUE",
  latex: "\\begin{gathered}\nCost_{US,senate} \\\\\n= N_{senators,treaty} \\times V_{post-office} \\\\\n= 67 \\times \\$10M \\\\\n= \\$670M\n\\end{gathered}",
};

export const US_VOTE_EXPECTED_VALUE: Parameter = {
  value: 0.0003383084577114428,
  parameterName: "US_VOTE_EXPECTED_VALUE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_vote_expected_value",
  unit: "USD",
  displayName: "Expected Value of a Vote (US)",
  description: "Expected monetary value of a single vote in a US presidential election. Calculated as the probability of being decisive (1 in 60M) times federal spending per capita (~$20,300). Represents the expected influence over government resource allocation from casting one vote.",
  sourceType: "calculated",
  confidence: "high",
  formula: "US_VOTE_DECISIVE_PROBABILITY x US_FEDERAL_SPENDING_PER_CAPITA",
  latex: "\\begin{gathered}\nEV_{vote} = P_{decisive} \\times Spend_{fed,pc} = 0 \\times \\$20.3K = \\$0.000338\n\\\\[0.5em]\n\\text{where } Spend_{fed,pc} = \\frac{Spending_{federal}}{Pop_{US}} = \\frac{\\$6.8T}{335M} = \\$20.3K\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/unrepresentative-democracy.html",
  manualPageTitle: "Unrepresentative Democracy",
};

export const VICTORY_BOND_ANNUAL_PAYOUT: Parameter = {
  value: 2720000000.0,
  parameterName: "VICTORY_BOND_ANNUAL_PAYOUT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-victory_bond_annual_payout",
  unit: "USD/year",
  displayName: "Annual VICTORY Incentive Alignment Bond Payout",
  description: "Annual VICTORY Incentive Alignment Bond payout (treaty funding × bond percentage)",
  sourceType: "calculated",
  confidence: "high",
  formula: "TREATY_FUNDING × BOND_PCT",
  latex: "\\begin{gathered}\nPayout_{bond,ann} = Funding_{treaty} \\times Pct_{bond} = \\$27.2B \\times 10\\% = \\$2.72B\n\\\\[0.5em]\n\\text{where } Funding_{treaty} = Spending_{mil} \\times Reduce_{treaty} = \\$2.72T \\times 1\\% = \\$27.2B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/financial-plan.html",
  manualPageTitle: "Financial Plan",
};

export const VICTORY_BOND_ANNUAL_RETURN_PCT: Parameter = {
  value: 2.72,
  parameterName: "VICTORY_BOND_ANNUAL_RETURN_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-victory_bond_annual_return_pct",
  unit: "rate",
  displayName: "Annual Return Percentage for VICTORY Incentive Alignment Bondholders",
  description: "Annual return percentage for VICTORY Incentive Alignment Bondholders",
  sourceType: "calculated",
  confidence: "high",
  formula: "PAYOUT ÷ CAMPAIGN_COST",
  latex: "\\begin{gathered}\nr_{bond} = \\frac{Payout_{bond,ann}}{Cost_{campaign}} = \\frac{\\$2.72B}{\\$1B} = 272\\%\n\\\\[0.5em]\n\\text{where } Payout_{bond,ann} = Funding_{treaty} \\times Pct_{bond} = \\$27.2B \\times 10\\% = \\$2.72B\n\\\\[0.5em]\n\\text{where } Funding_{treaty} = Spending_{mil} \\times Reduce_{treaty} = \\$2.72T \\times 1\\% = \\$27.2B\n\\\\[0.5em]\n\\text{where } Cost_{campaign} = Budget_{viral,base} + Budget_{lobby,treaty} + Budget_{reserve} = \\$250M + \\$650M + \\$100M = \\$1B\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-protocol-v1.html",
  manualPageTitle: "Earth Optimization Protocol v1",
};

export const VOTER_LIVES_SAVED: Parameter = {
  value: 38.376849102141854,
  parameterName: "VOTER_LIVES_SAVED",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-voter_lives_saved",
  unit: "lives",
  displayName: "Lives Saved per Voter",
  description: "Lives saved attributable to each voter if the treaty passes (total lives saved ÷ 3.5% voting bloc target)",
  sourceType: "calculated",
  confidence: "high",
  formula: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED ÷ TREATY_CAMPAIGN_VOTING_BLOC_TARGET",
  latex: "\\begin{gathered}\nLives_{voter} = \\frac{Lives_{max}}{N_{voters,target}} = \\frac{10.7B}{280M} = 38.4\n\\\\[0.5em]\n\\text{where } Lives_{max} = Deaths_{disease,daily} \\times T_{accel,max} \\times 338 = 150{,}000 \\times 212 \\times 338 = 10.7B\n\\\\[0.5em]\n\\text{where } T_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } N_{voters,target} = Pop_{global} \\times Threshold_{activism} = 8B \\times 3.5\\% = 280M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/conclusion.html",
  manualPageTitle: "Conclusion",
};

export const VOTER_SUFFERING_HOURS_PREVENTED: Parameter = {
  value: 6896780.305844117,
  parameterName: "VOTER_SUFFERING_HOURS_PREVENTED",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-voter_suffering_hours_prevented",
  unit: "hours",
  displayName: "Suffering Hours Prevented per Voter",
  description: "Hours of suffering prevented attributable to each voter if the treaty passes (total suffering hours ÷ 3.5% voting bloc target)",
  sourceType: "calculated",
  confidence: "high",
  formula: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS ÷ TREATY_CAMPAIGN_VOTING_BLOC_TARGET",
  latex: "\\begin{gathered}\nHours_{suffer,voter} = \\frac{Hours_{suffer,max}}{N_{voters,target}} = \\frac{1930T}{280M} = 6.9M\n\\\\[0.5em]\n\\text{where } Hours_{suffer,max} = DALYs_{max} \\times Pct_{YLD} \\times 8760 = 565B \\times 0.39 \\times 8760 = 1930T\n\\\\[0.5em]\n\\text{where } DALYs_{max} = DALYs_{global,ann} \\times Pct_{avoid,DALY} \\times T_{accel,max} = 2.88B \\times 92.6\\% \\times 212 = 565B\n\\\\[0.5em]\n\\text{where } T_{accel,max} = T_{accel} + T_{lag} = 204 + 8.2 = 212\n\\\\[0.5em]\n\\text{where } T_{accel} = T_{first,SQ} \\times \\left(1 - \\frac{1}{k_{capacity}}\\right) = 222 \\times \\left(1 - \\frac{1}{12.3}\\right) = 204\n\\\\[0.5em]\n\\text{where } T_{first,SQ} = T_{queue,SQ} \\times 0.5 = 443 \\times 0.5 = 222\n\\\\[0.5em]\n\\text{where } T_{queue,SQ} = \\frac{N_{untreated}}{Treatments_{new,ann}} = \\frac{6{,}650}{15} = 443\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } N_{voters,target} = Pop_{global} \\times Threshold_{activism} = 8B \\times 3.5\\% = 280M\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/conclusion.html",
  manualPageTitle: "Conclusion",
};

export const VOTE_2_CLAIMS_PAYOUT: Parameter = {
  value: 16872.577099999744,
  parameterName: "VOTE_2_CLAIMS_PAYOUT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-vote_2_claims_payout",
  unit: "USD",
  displayName: "VOTE Payout for 2 Claims",
  description: "Payout for a depositor who recruits 2 verified participants (earning 2 VOTE claims). CI range reflects participation uncertainty.",
  sourceType: "calculated",
  confidence: "high",
  formula: "2 × VOTE_TOKEN_VALUE",
  latex: "\\begin{gathered}\nV_{2claims} = V_{vote} \\times 2 = \\$8.44K \\times 2 = \\$16.9K\n\\\\[0.5em]\n\\text{where } V_{vote} = \\frac{Pool}{N_{coord}}\n\\\\[0.5em]\n\\text{where } Pool = Assets_{invest} \\times R_{pool} \\times M_{pool}\n\\\\[0.5em]\n\\text{where } M_{pool} = (1 + r_{pool})^{Y_{50\\%} - Y_0}\n\\\\[0.5em]\n\\text{where } r_{pool} = r_{VC,gross} + \\Delta r_{scale} + \\alpha_{crowd} + \\alpha_{home}\n\\\\[0.5em]\n\\text{where } \\alpha_{crowd} = S_{alloc} \\times (Acc_{crowd} - Acc_{expert}) = 8\\% \\times (91\\% - 65\\%) = 2.08\\%\n\\\\[0.5em]\n\\text{where } Y_{50\\%} = Y_0 + \\frac{\\ln(0.50 / r_{destruct:GDP})}{\\ln(1 + g_{destruct} - g_{GDP})}\n\\\\[0.5em]\n\\text{where } r_{destruct:GDP} = \\frac{Cost_{destruct}}{GDP_{global}} = \\frac{\\$13.2T}{\\$115T} = 11.5\\%\n\\\\[0.5em]\n\\text{where } Cost_{destruct} = Spending_{mil} + Cost_{cyber} = \\$2.72T + \\$10.5T = \\$13.2T\n\\\\[0.5em]\n\\text{where } N_{coord} = N_{global} \\times R_{coord}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const VOTE_TOKEN_VALUE: Parameter = {
  value: 8436.288549999872,
  parameterName: "VOTE_TOKEN_VALUE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-vote_token_value",
  unit: "USD",
  displayName: "VOTE Point Value",
  description: "Value of a single VOTE claim based on the modeled PRIZE pool size (investable assets × participation rate × horizon multiple). CI range reflects participation uncertainty (0.1%-10%).",
  sourceType: "calculated",
  confidence: "high",
  formula: "PRIZE_POOL_SIZE / GLOBAL_COORDINATION_TARGET_SUPPORTERS",
  latex: "V_{vote} = \\frac{Pool}{N_{coord}}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const WAR_COSTS_CUMULATIVE_20YR_CURRENT_TRAJECTORY: Parameter = {
  value: 227142000000000.0,
  parameterName: "WAR_COSTS_CUMULATIVE_20YR_CURRENT_TRAJECTORY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-war_costs_cumulative_20yr_current_trajectory",
  unit: "USD",
  displayName: "Cumulative War Costs over 20 Years (Current Trajectory)",
  description: "Cumulative global war costs over 20 years if current spending levels continue. The price tag of the status quo trajectory.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_ANNUAL_DIRECT_INDIRECT_WAR_COST × 20",
  latex: "\\begin{gathered}\nCost_{war,20yr} = Cost_{war,total} \\times 20 = \\$11.4T \\times 20 = \\$227T\n\\\\[0.5em]\n\\text{where } Cost_{war,total} = Cost_{war,direct} + Cost_{war,indirect} = \\$7.66T + \\$3.7T = \\$11.4T\n\\\\[0.5em]\n\\text{where } Cost_{war,direct} = Loss_{life,conflict} + Damage_{infra,total} + Disruption_{trade} + Spending_{mil} = \\$2.45T + \\$1.88T + \\$616B + \\$2.72T = \\$7.66T\n\\\\[0.5em]\n\\text{where } Loss_{life,conflict} = Cost_{combat,human} + Cost_{state,human} + Cost_{terror,human} = \\$2.34T + \\$27B + \\$83B = \\$2.45T\n\\\\[0.5em]\n\\text{where } Cost_{combat,human} = Deaths_{combat} \\times VSL = 234{,}000 \\times \\$10M = \\$2.34T\n\\\\[0.5em]\n\\text{where } Cost_{state,human} = Deaths_{state} \\times VSL = 2{,}700 \\times \\$10M = \\$27B\n\\\\[0.5em]\n\\text{where } Cost_{terror,human} = Deaths_{terror} \\times VSL = 8{,}300 \\times \\$10M = \\$83B\n\\\\[0.5em]\n\\text{where } Damage_{infra,total} = Damage_{comms} + Damage_{edu} + Damage_{energy} + Damage_{health} + Damage_{transport} + Damage_{water} = \\$298B + \\$234B + \\$422B + \\$166B + \\$487B + \\$268B = \\$1.88T\n\\\\[0.5em]\n\\text{where } Disruption_{trade} = Disruption_{currency} + Disruption_{energy} + Disruption_{shipping} + Disruption_{supply} = \\$57.4B + \\$125B + \\$247B + \\$187B = \\$616B\n\\\\[0.5em]\n\\text{where } Cost_{war,indirect} = Damage_{env} + Loss_{growth,mil} + Loss_{capital,conflict} + Cost_{psych} + Cost_{refugee} + Cost_{vet} = \\$100B + \\$2.72T + \\$300B + \\$232B + \\$150B + \\$200B = \\$3.7T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/peace-dividend.html",
  manualPageTitle: "Peace Dividend",
};

export const WAR_COSTS_SAVED_PEACE_TRAJECTORY_20YR: Parameter = {
  value: 13174236000000.002,
  parameterName: "WAR_COSTS_SAVED_PEACE_TRAJECTORY_20YR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-war_costs_saved_peace_trajectory_20yr",
  unit: "USD",
  displayName: "War Costs Saved via Peace Trajectory (20yr)",
  description: "Cumulative war costs saved over 20 years as treaty expands via IAB ratchet. Assumes war costs decline proportionally to spending cuts (e=1.0). Conservative: Pape research suggests e>1.0 due to terrorism feedback loops.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_ANNUAL_DIRECT_INDIRECT_WAR_COST × (0.01×3 + 0.02×4 + 0.05×5 + 0.10×8)",
  latex: "\\begin{gathered}\nSavings_{war,20yr} = Cost_{war,total} \\times 1.16 = \\$11.4T \\times 1.16 = \\$13.2T\n\\\\[0.5em]\n\\text{where } Cost_{war,total} = Cost_{war,direct} + Cost_{war,indirect} = \\$7.66T + \\$3.7T = \\$11.4T\n\\\\[0.5em]\n\\text{where } Cost_{war,direct} = Loss_{life,conflict} + Damage_{infra,total} + Disruption_{trade} + Spending_{mil} = \\$2.45T + \\$1.88T + \\$616B + \\$2.72T = \\$7.66T\n\\\\[0.5em]\n\\text{where } Loss_{life,conflict} = Cost_{combat,human} + Cost_{state,human} + Cost_{terror,human} = \\$2.34T + \\$27B + \\$83B = \\$2.45T\n\\\\[0.5em]\n\\text{where } Cost_{combat,human} = Deaths_{combat} \\times VSL = 234{,}000 \\times \\$10M = \\$2.34T\n\\\\[0.5em]\n\\text{where } Cost_{state,human} = Deaths_{state} \\times VSL = 2{,}700 \\times \\$10M = \\$27B\n\\\\[0.5em]\n\\text{where } Cost_{terror,human} = Deaths_{terror} \\times VSL = 8{,}300 \\times \\$10M = \\$83B\n\\\\[0.5em]\n\\text{where } Damage_{infra,total} = Damage_{comms} + Damage_{edu} + Damage_{energy} + Damage_{health} + Damage_{transport} + Damage_{water} = \\$298B + \\$234B + \\$422B + \\$166B + \\$487B + \\$268B = \\$1.88T\n\\\\[0.5em]\n\\text{where } Disruption_{trade} = Disruption_{currency} + Disruption_{energy} + Disruption_{shipping} + Disruption_{supply} = \\$57.4B + \\$125B + \\$247B + \\$187B = \\$616B\n\\\\[0.5em]\n\\text{where } Cost_{war,indirect} = Damage_{env} + Loss_{growth,mil} + Loss_{capital,conflict} + Cost_{psych} + Cost_{refugee} + Cost_{vet} = \\$100B + \\$2.72T + \\$300B + \\$232B + \\$150B + \\$200B = \\$3.7T\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/peace-dividend.html",
  manualPageTitle: "Peace Dividend",
};

export const WILLING_TRIAL_PARTICIPANTS_GLOBAL: Parameter = {
  value: 1075200000.0,
  parameterName: "WILLING_TRIAL_PARTICIPANTS_GLOBAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-willing_trial_participants_global",
  unit: "people",
  displayName: "Global Patients Willing to Participate in Clinical Trials",
  description: "Global chronic disease patients willing to participate in trials (2.4B × 44.8%)",
  sourceType: "calculated",
  confidence: "medium",
  formula: "CURRENT_DISEASE_PATIENTS_GLOBAL × PATIENT_WILLINGNESS_TRIAL_PARTICIPATION_PCT",
  latex: "\\begin{gathered}\nN_{willing} \\\\\n= N_{patients} \\times Pct_{willing} \\\\\n= 2.4B \\times 44.8\\% \\\\\n= 1.08B\n\\end{gathered}",
};

export const WISHOCRATIC_CROWD_ALPHA: Parameter = {
  value: 0.020800000000000003,
  parameterName: "WISHOCRATIC_CROWD_ALPHA",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishocratic_crowd_alpha",
  unit: "percent",
  displayName: "Wishocratic Crowd Allocation Alpha",
  description: "Allocation alpha from Wishocratic crowd decision-making. Crowds pick correctly 91% vs experts at 65% (Surowiecki). Applied to the return spread between best/worst sectors. This is the floor: politicians (the real 'experts') are worse than 65% because they are being paid by one of the answer choices.",
  sourceType: "calculated",
  confidence: "high",
  formula: "(CROWD_DECISION_ACCURACY - EXPERT_DECISION_ACCURACY) × ALLOCATION_DECISION_SPREAD",
  latex: "\\begin{gathered}\n\\alpha_{crowd} \\\\\n= S_{alloc} \\times (Acc_{crowd} - Acc_{expert}) \\\\\n= 8\\% \\times (91\\% - 65\\%) \\\\\n= 2.08\\%\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/wishocratic-investment-fund.html",
  manualPageTitle: "The Wishocratic Investment Fund",
};

export const WISHONIA_DISEASE_CURE_FRACTION_15YR: Parameter = {
  value: 1.0,
  parameterName: "WISHONIA_DISEASE_CURE_FRACTION_15YR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_disease_cure_fraction_15yr",
  unit: "rate",
  displayName: "Wishonia Disease Cure Fraction (15yr, Full Implementation)",
  description: "Wishonia disease-cure fraction over 15 years under full implementation. Uses full trial-capacity scaling and applies an upper bound of 100% of untreated disease classes.",
  sourceType: "calculated",
  confidence: "high",
  formula: "min(1.0, NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR * min(DFDA_TRIAL_CAPACITY_MULTIPLIER * (WISHONIA_MILITARY_REALLOCATION_PHYSICAL_MAX_SHARE / 0.01), DFDA_MAX_TRIAL_CAPACITY_MULTIPLIER_PHYSICAL) * 15 / DISEASES_WITHOUT_EFFECTIVE_TREATMENT)",
  latex: "\\begin{gathered}\nf_{cure,15,wish} \\\\\n= \\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 15}{D_{untreated}}\\right)\n\\end{gathered}",
};

export const WISHONIA_DISEASE_CURE_FRACTION_20YR_FULL: Parameter = {
  value: 1.0,
  parameterName: "WISHONIA_DISEASE_CURE_FRACTION_20YR_FULL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_disease_cure_fraction_20yr_full",
  unit: "rate",
  displayName: "Wishonia Disease Cure Fraction (20yr, Full Implementation)",
  description: "Wishonia disease-cure fraction over 20 years under full implementation. Uses full trial-capacity scaling and applies an upper bound of 100% of untreated disease classes.",
  sourceType: "calculated",
  confidence: "high",
  formula: "min(1.0, NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR × min(DFDA_TRIAL_CAPACITY_MULTIPLIER × (WISHONIA_MILITARY_REALLOCATION_PHYSICAL_MAX_SHARE ÷ 0.01), DFDA_MAX_TRIAL_CAPACITY_MULTIPLIER_PHYSICAL) × 20 ÷ DISEASES_WITHOUT_EFFECTIVE_TREATMENT)",
  latex: "\\begin{gathered}\nf_{cure,20,wish} \\\\\n= \\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 20}{D_{untreated}}\\right)\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/gdp-trajectories.html",
  manualPageTitle: "Please Select an Earth: A) Everyone Gets Rich B) Somalia, but Everywhere",
};

export const WISHONIA_HALE_GAIN_YEAR_15: Parameter = {
  value: 15.700000000000003,
  parameterName: "WISHONIA_HALE_GAIN_YEAR_15",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_hale_gain_year_15",
  unit: "years",
  displayName: "Wishonia HALE Gain at Year 15",
  description: "HALE improvement at year 15 under Wishonia Trajectory. Full implementation cures a larger fraction of diseases, closing more of the HALE gap.",
  sourceType: "calculated",
  confidence: "high",
  formula: "WISHONIA_DISEASE_CURE_FRACTION_15YR * GLOBAL_HALE_GAP",
  latex: "\\Delta HALE_{wish,15} = f_{cure,15,wish} \\cdot \\Delta_{HALE}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/call-to-action/your-personal-benefits.html",
  manualPageTitle: "Your Personal Benefits",
};

export const WISHONIA_HALE_VALUE_PER_CAPITA: Parameter = {
  value: 2355000.0000000005,
  parameterName: "WISHONIA_HALE_VALUE_PER_CAPITA",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_hale_value_per_capita",
  unit: "USD/person",
  displayName: "Wishonia HALE Value Per Capita",
  description: "Economic value of Wishonia Trajectory HALE gains at year 15 using the standard QALY value.",
  sourceType: "calculated",
  confidence: "high",
  formula: "WISHONIA_HALE_GAIN_YEAR_15 × STANDARD_ECONOMIC_QALY_VALUE_USD",
  latex: "\\begin{gathered}\nValue_{HALE,wish} = \\Delta HALE_{wish,15} \\times Value_{QALY} = 15.7 \\times \\$150K = \\$2.36M\n\\\\[0.5em]\n\\text{where } \\Delta HALE_{wish,15} = f_{cure,15,wish} \\cdot \\Delta_{HALE}\n\\\\[0.5em]\n\\text{where } f_{cure,15,wish}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 15}{D_{untreated}}\\right)\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } s_{mil,max} = Cut_{WW2} = 87.6\\% = 87.6\\%\n\\\\[0.5em]\n\\text{where } Cut_{WW2} = 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} = 1 - \\frac{\\$176B}{\\$1.42T} = 87.6\\%\n\\\\[0.5em]\n\\text{where } k_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/call-to-action/your-personal-benefits.html",
  manualPageTitle: "Your Personal Benefits",
};

export const WISHONIA_MILITARY_REALLOCATION_PHYSICAL_MAX_SHARE: Parameter = {
  value: 0.876056338028169,
  parameterName: "WISHONIA_MILITARY_REALLOCATION_PHYSICAL_MAX_SHARE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_military_reallocation_physical_max_share",
  unit: "rate",
  displayName: "Wishonia Military Reallocation Physical Max Share",
  description: "Maximum physically demonstrated military reallocation share, anchored to post-WW2 US demobilization.",
  sourceType: "calculated",
  confidence: "high",
  formula: "POST_WW2_MILITARY_CUT_PCT",
  latex: "\\begin{gathered}\ns_{mil,max} = Cut_{WW2} = 87.6\\% = 87.6\\%\n\\\\[0.5em]\n\\text{where } Cut_{WW2} = 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} = 1 - \\frac{\\$176B}{\\$1.42T} = 87.6\\%\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/gdp-trajectories.html",
  manualPageTitle: "Please Select an Earth: A) Everyone Gets Rich B) Somalia, but Everywhere",
};

export const WISHONIA_PERSONAL_UPSIDE_BLEND: Parameter = {
  value: 54303392.83706183,
  parameterName: "WISHONIA_PERSONAL_UPSIDE_BLEND",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_personal_upside_blend",
  unit: "USD/person",
  displayName: "Wishonia Personal Upside (Blended)",
  description: "Blended personal upside under Wishonia Trajectory: lifetime income gain plus valued healthy-life gains.",
  sourceType: "calculated",
  confidence: "high",
  formula: "WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA + WISHONIA_HALE_VALUE_PER_CAPITA",
  latex: "\\begin{gathered}\nUpside_{blend,wish} = \\Delta Y_{lifetime,wish} + Value_{HALE,wish} = \\$51.9M + \\$2.36M = \\$54.3M\n\\\\[0.5em]\n\\text{where } \\Delta Y_{lifetime,wish} = Y_{cum,wish} - Y_{cum,earth} = \\$53.3M - \\$1.34M = \\$51.9M\n\\\\[0.5em]\n\\text{where } Y_{cum,wish} = \\bar{y}_0 \\cdot \\frac{(1+g_{pc,wish})((1+g_{pc,wish})^{20}-1)}{g_{pc,wish}} + \\bar{y}_{wish,20} \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}-20}-1)}{g_{base}}\n\\\\[0.5em]\n\\text{where } \\bar{y}_{0} = \\frac{GDP_{global}}{Pop_{global}} = \\frac{\\$115T}{8B} = \\$14.4K\n\\\\[0.5em]\n\\text{where } \\bar{y}_{wish,20} = \\frac{GDP_{wish,20}}{Pop_{2045}}\n\\\\[0.5em]\n\\text{where } GDP_{wish,20}=GDP_0(1+g_{ramp})^3(1+g_{full})^{17}\n\\\\[0.5em]\n\\text{where } s_{mil,max} = Cut_{WW2} = 87.6\\% = 87.6\\%\n\\\\[0.5em]\n\\text{where } Cut_{WW2} = 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} = 1 - \\frac{\\$176B}{\\$1.42T} = 87.6\\%\n\\\\[0.5em]\n\\text{where } f_{cure,20,wish}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 20}{D_{untreated}}\\right)\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } k_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } T_{remaining} = LE_{global} - Age_{median} = 79 - 30.5 = 48.5\n\\\\[0.5em]\n\\text{where } Y_{cum,earth} = \\bar{y}_0 \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}}-1)}{g_{base}}\n\\\\[0.5em]\n\\text{where } Value_{HALE,wish} = \\Delta HALE_{wish,15} \\times Value_{QALY} = 15.7 \\times \\$150K = \\$2.36M\n\\\\[0.5em]\n\\text{where } \\Delta HALE_{wish,15} = f_{cure,15,wish} \\cdot \\Delta_{HALE}\n\\\\[0.5em]\n\\text{where } f_{cure,15,wish}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 15}{D_{untreated}}\\right)\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/call-to-action/your-personal-benefits.html",
  manualPageTitle: "Your Personal Benefits",
};

export const WISHONIA_PROJECTED_HALE_YEAR_15: Parameter = {
  value: 79.0,
  parameterName: "WISHONIA_PROJECTED_HALE_YEAR_15",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_projected_hale_year_15",
  unit: "years",
  displayName: "Wishonia Projected HALE at Year 15",
  description: "Projected global HALE at year 15 under Wishonia Trajectory. Full implementation closes the entire disease gap, pushing HALE toward life expectancy.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_HALE_CURRENT + WISHONIA_HALE_GAIN_YEAR_15",
  latex: "HALE_{wish,15} = HALE_0 + \\Delta HALE_{wish,15}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-protocol-v1.html",
  manualPageTitle: "Earth Optimization Protocol v1",
};

export const WISHONIA_TRAJECTORY_AVG_INCOME_YEAR_15: Parameter = {
  value: 503789.8257135314,
  parameterName: "WISHONIA_TRAJECTORY_AVG_INCOME_YEAR_15",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_trajectory_avg_income_year_15",
  unit: "USD",
  displayName: "Wishonia Trajectory Average Income at Year 15",
  description: "Average income (GDP per capita) at year 15 under the Wishonia Trajectory.",
  sourceType: "calculated",
  confidence: "high",
  formula: "WISHONIA_TRAJECTORY_GDP_YEAR_15 / GLOBAL_POPULATION_2040_PROJECTED",
  latex: "\\bar{y}_{wish,15} = \\frac{GDP_{wish,15}}{Pop_{2040}}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-protocol-v1.html",
  manualPageTitle: "Earth Optimization Protocol v1",
};

export const WISHONIA_TRAJECTORY_AVG_INCOME_YEAR_20: Parameter = {
  value: 1161818.358400575,
  parameterName: "WISHONIA_TRAJECTORY_AVG_INCOME_YEAR_20",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_trajectory_avg_income_year_20",
  unit: "USD",
  displayName: "Wishonia Trajectory Average Income at Year 20",
  description: "Average income (GDP per capita) at year 20 under the Wishonia Trajectory.",
  sourceType: "calculated",
  confidence: "high",
  formula: "WISHONIA_TRAJECTORY_GDP_YEAR_20 / GLOBAL_POPULATION_2045_PROJECTED",
  latex: "\\bar{y}_{wish,20} = \\frac{GDP_{wish,20}}{Pop_{2045}}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/political-dysfunction-tax.html",
  manualPageTitle: "The Political Dysfunction Tax",
};

export const WISHONIA_TRAJECTORY_CAGR_YEAR_20: Parameter = {
  value: 0.2543288493473528,
  parameterName: "WISHONIA_TRAJECTORY_CAGR_YEAR_20",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_trajectory_cagr_year_20",
  unit: "rate",
  displayName: "Wishonia Trajectory CAGR (20 Years)",
  description: "Compound annual growth rate implied by Wishonia Trajectory GDP trajectory over 20 years.",
  sourceType: "calculated",
  confidence: "high",
  formula: "(WISHONIA_TRAJECTORY_GDP_YEAR_20 ÷ GLOBAL_GDP_2025)^(1/20) - 1",
  latex: "\\begin{gathered}\ng_{wish,CAGR} \\\\\n= \\left(\\frac{GDP_{wish,20}}{GDP_0}\\right)^{1/20} - 1\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/political-dysfunction-tax.html",
  manualPageTitle: "The Political Dysfunction Tax",
};

export const WISHONIA_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME: Parameter = {
  value: 53287151.99689552,
  parameterName: "WISHONIA_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_trajectory_cumulative_lifetime_income",
  unit: "USD",
  displayName: "Wishonia Trajectory Cumulative Lifetime Income (Per Capita)",
  description: "Cumulative per-capita income over an average remaining lifespan under Wishonia Trajectory. Uses implied per-capita CAGR for years 1-20, then baseline growth from the year-20 level. Conservative: assumes no further acceleration beyond year 20.",
  sourceType: "calculated",
  confidence: "high",
  formula: "Phase 1: y0*(1+g_pc)*((1+g_pc)^20-1)/g_pc + Phase 2: y20*(1+g_base)*((1+g_base)^(T-20)-1)/g_base",
  latex: "\\begin{gathered}\nY_{cum,wish} \\\\\n= \\bar{y}_0 \\cdot \\frac{(1+g_{pc,wish})((1+g_{pc,wish})^{20}-1)}{g_{pc,wish}} \\\\\n+ \\bar{y}_{wish,20} \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}-20}-1)}{g_{base}}\n\\end{gathered}",
};

export const WISHONIA_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15: Parameter = {
  value: 26.92052826622498,
  parameterName: "WISHONIA_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_trajectory_gdp_vs_current_trajectory_multiplier_year_15",
  unit: "x",
  displayName: "Wishonia Trajectory vs Current Trajectory GDP Multiplier (Year 15)",
  description: "Wishonia Trajectory GDP at year 15 as a multiple of current trajectory GDP at year 15.",
  sourceType: "calculated",
  confidence: "high",
  formula: "WISHONIA_TRAJECTORY_GDP_YEAR_15 / CURRENT_TRAJECTORY_GDP_YEAR_15",
  latex: "\\begin{gathered}\nk_{wish:base,15} = \\frac{GDP_{wish,15}}{GDP_{base,15}} = \\frac{\\$4480T}{\\$167T} = 26.9\n\\\\[0.5em]\n\\text{where } GDP_{wish,15}=GDP_0(1+g_{ramp})^3(1+g_{full})^{12}\n\\\\[0.5em]\n\\text{where } s_{mil,max} = Cut_{WW2} = 87.6\\% = 87.6\\%\n\\\\[0.5em]\n\\text{where } Cut_{WW2} = 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} = 1 - \\frac{\\$176B}{\\$1.42T} = 87.6\\%\n\\\\[0.5em]\n\\text{where } f_{cure,15,wish}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 15}{D_{untreated}}\\right)\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } k_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } GDP_{base,15} = GDP_0(1+g_{base})^{15}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const WISHONIA_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20: Parameter = {
  value: 56.721918800945424,
  parameterName: "WISHONIA_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_trajectory_gdp_vs_current_trajectory_multiplier_year_20",
  unit: "x",
  displayName: "Wishonia Trajectory vs Current Trajectory GDP Multiplier (Year 20)",
  description: "Wishonia Trajectory GDP at year 20 as a multiple of current trajectory GDP at year 20.",
  sourceType: "calculated",
  confidence: "high",
  formula: "WISHONIA_TRAJECTORY_GDP_YEAR_20 ÷ CURRENT_TRAJECTORY_GDP_YEAR_20",
  latex: "\\begin{gathered}\nk_{wish:base,20} = \\frac{GDP_{wish,20}}{GDP_{base,20}} = \\frac{\\$10700T}{\\$188T} = 56.7\n\\\\[0.5em]\n\\text{where } GDP_{wish,20}=GDP_0(1+g_{ramp})^3(1+g_{full})^{17}\n\\\\[0.5em]\n\\text{where } s_{mil,max} = Cut_{WW2} = 87.6\\% = 87.6\\%\n\\\\[0.5em]\n\\text{where } Cut_{WW2} = 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} = 1 - \\frac{\\$176B}{\\$1.42T} = 87.6\\%\n\\\\[0.5em]\n\\text{where } f_{cure,20,wish}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 20}{D_{untreated}}\\right)\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } k_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } GDP_{base,20} = GDP_0(1+g_{base})^{20}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/treaty-feasibility.html",
  manualPageTitle: "Treaty Feasibility & Cost Analysis",
};

export const WISHONIA_TRAJECTORY_GDP_YEAR_15: Parameter = {
  value: 4483729448850429.5,
  parameterName: "WISHONIA_TRAJECTORY_GDP_YEAR_15",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_trajectory_gdp_year_15",
  unit: "USD",
  displayName: "Wishonia Trajectory GDP at Year 15",
  description: "Projected global GDP at year 15 under the Wishonia Trajectory. Applies all Wishonia policy channels including military reallocation, disease-burden recovery, and Political Dysfunction Tax elimination. 3-year ramp at 50% intensity + 12 years full.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_GDP_2025 * (1 + g_ramp)^3 * (1 + g_full)^12, where years 1-3 use 50% of military and non-health reallocation intensity, and years 4-15 use 100%; both include disease-burden recovery",
  latex: "GDP_{wish,15}=GDP_0(1+g_{ramp})^3(1+g_{full})^{12}",
};

export const WISHONIA_TRAJECTORY_GDP_YEAR_20: Parameter = {
  value: 1.0688728897285288e+16,
  parameterName: "WISHONIA_TRAJECTORY_GDP_YEAR_20",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_trajectory_gdp_year_20",
  unit: "USD",
  displayName: "Wishonia Trajectory GDP at Year 20",
  description: "Projected global GDP at year 20 under the Wishonia Trajectory. Model applies all Wishonia policy channels and redirects the full Political Dysfunction Tax non-health opportunity pool to highest-marginal-value uses. Health recovery is modeled separately through disease burden removal to avoid overlap. Military and non-health reallocation effects are ramped at 50% intensity for the first 3 years, then 100% for years 4-20, reflecting implementation lag. Military reallocation uses a physically demonstrated upper bound (post-WW2 demobilization) rather than an arbitrary policy cap.",
  sourceType: "calculated",
  confidence: "high",
  formula: "GLOBAL_GDP_2025 × (1 + g_ramp)^3 × (1 + g_full)^17, where years 1-3 use 50% of military and non-health reallocation intensity, and years 4-20 use 100%; both include disease-burden recovery",
  latex: "GDP_{wish,20}=GDP_0(1+g_{ramp})^3(1+g_{full})^{17}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/political-dysfunction-tax.html",
  manualPageTitle: "The Political Dysfunction Tax",
};

export const WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA: Parameter = {
  value: 51948392.83706183,
  parameterName: "WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_trajectory_lifetime_income_gain_per_capita",
  unit: "USD",
  displayName: "Wishonia Trajectory Lifetime Income Gain (Per Capita)",
  description: "Lifetime per-capita income gain from Wishonia Trajectory vs current trajectory. Cumulative Wishonia income minus cumulative current trajectory income over average remaining lifespan.",
  sourceType: "calculated",
  confidence: "high",
  formula: "WISHONIA_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME - CURRENT_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME",
  latex: "\\begin{gathered}\n\\Delta Y_{lifetime,wish} = Y_{cum,wish} - Y_{cum,earth} = \\$53.3M - \\$1.34M = \\$51.9M\n\\\\[0.5em]\n\\text{where } Y_{cum,wish} = \\bar{y}_0 \\cdot \\frac{(1+g_{pc,wish})((1+g_{pc,wish})^{20}-1)}{g_{pc,wish}} + \\bar{y}_{wish,20} \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}-20}-1)}{g_{base}}\n\\\\[0.5em]\n\\text{where } \\bar{y}_{0} = \\frac{GDP_{global}}{Pop_{global}} = \\frac{\\$115T}{8B} = \\$14.4K\n\\\\[0.5em]\n\\text{where } \\bar{y}_{wish,20} = \\frac{GDP_{wish,20}}{Pop_{2045}}\n\\\\[0.5em]\n\\text{where } GDP_{wish,20}=GDP_0(1+g_{ramp})^3(1+g_{full})^{17}\n\\\\[0.5em]\n\\text{where } s_{mil,max} = Cut_{WW2} = 87.6\\% = 87.6\\%\n\\\\[0.5em]\n\\text{where } Cut_{WW2} = 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} = 1 - \\frac{\\$176B}{\\$1.42T} = 87.6\\%\n\\\\[0.5em]\n\\text{where } f_{cure,20,wish}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 20}{D_{untreated}}\\right)\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } k_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } T_{remaining} = LE_{global} - Age_{median} = 79 - 30.5 = 48.5\n\\\\[0.5em]\n\\text{where } Y_{cum,earth} = \\bar{y}_0 \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}}-1)}{g_{base}}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const WISHONIA_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER: Parameter = {
  value: 39.80338928438418,
  parameterName: "WISHONIA_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_trajectory_lifetime_income_multiplier",
  unit: "x",
  displayName: "Wishonia Trajectory Lifetime Income Multiplier",
  description: "Ratio of cumulative lifetime income under Wishonia Trajectory vs current trajectory. Income-agnostic: applies as a multiplier to any individual's lifetime earnings.",
  sourceType: "calculated",
  confidence: "high",
  formula: "WISHONIA_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME / CURRENT_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME",
  latex: "\\begin{gathered}\nk_{lifetime,wish:earth} = \\frac{Y_{cum,wish}}{Y_{cum,earth}} = \\frac{\\$53.3M}{\\$1.34M} = 39.8\n\\\\[0.5em]\n\\text{where } Y_{cum,wish} = \\bar{y}_0 \\cdot \\frac{(1+g_{pc,wish})((1+g_{pc,wish})^{20}-1)}{g_{pc,wish}} + \\bar{y}_{wish,20} \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}-20}-1)}{g_{base}}\n\\\\[0.5em]\n\\text{where } \\bar{y}_{0} = \\frac{GDP_{global}}{Pop_{global}} = \\frac{\\$115T}{8B} = \\$14.4K\n\\\\[0.5em]\n\\text{where } \\bar{y}_{wish,20} = \\frac{GDP_{wish,20}}{Pop_{2045}}\n\\\\[0.5em]\n\\text{where } GDP_{wish,20}=GDP_0(1+g_{ramp})^3(1+g_{full})^{17}\n\\\\[0.5em]\n\\text{where } s_{mil,max} = Cut_{WW2} = 87.6\\% = 87.6\\%\n\\\\[0.5em]\n\\text{where } Cut_{WW2} = 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} = 1 - \\frac{\\$176B}{\\$1.42T} = 87.6\\%\n\\\\[0.5em]\n\\text{where } f_{cure,20,wish}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 20}{D_{untreated}}\\right)\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } k_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } T_{remaining} = LE_{global} - Age_{median} = 79 - 30.5 = 48.5\n\\\\[0.5em]\n\\text{where } Y_{cum,earth} = \\bar{y}_0 \\cdot \\frac{(1+g_{base})((1+g_{base})^{T_{remaining}}-1)}{g_{base}}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const WISHONIA_TRAJECTORY_VS_TREATY_TRAJECTORY_GDP_MULTIPLIER_YEAR_20: Parameter = {
  value: 3.4315554367560863,
  parameterName: "WISHONIA_TRAJECTORY_VS_TREATY_TRAJECTORY_GDP_MULTIPLIER_YEAR_20",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-wishonia_trajectory_vs_treaty_trajectory_gdp_multiplier_year_20",
  unit: "x",
  displayName: "Wishonia Trajectory vs Treaty Trajectory GDP Multiplier (Year 20)",
  description: "Year-20 GDP multiplier from adding non-health dysfunction-capital reallocation on top of the Treaty Trajectory channels.",
  sourceType: "calculated",
  confidence: "high",
  formula: "WISHONIA_TRAJECTORY_GDP_YEAR_20 ÷ TREATY_TRAJECTORY_GDP_YEAR_20",
  latex: "\\begin{gathered}\nk_{wish,full:core,20} = \\frac{GDP_{wish,20}}{GDP_{treaty,20}} = \\frac{\\$10700T}{\\$3110T} = 3.43\n\\\\[0.5em]\n\\text{where } GDP_{wish,20}=GDP_0(1+g_{ramp})^3(1+g_{full})^{17}\n\\\\[0.5em]\n\\text{where } s_{mil,max} = Cut_{WW2} = 87.6\\% = 87.6\\%\n\\\\[0.5em]\n\\text{where } Cut_{WW2} = 1 - \\frac{Spending_{US,1947}}{Spending_{US,1945}} = 1 - \\frac{\\$176B}{\\$1.42T} = 87.6\\%\n\\\\[0.5em]\n\\text{where } f_{cure,20,wish}=\\min\\left(1,\\frac{Treatments_{new,ann}\\cdot k_{capacity,wish}\\cdot 20}{D_{untreated}}\\right)\n\\\\[0.5em]\n\\text{where } k_{capacity} = \\frac{N_{fundable,dFDA}}{Slots_{curr}} = \\frac{23.4M}{1.9M} = 12.3\n\\\\[0.5em]\n\\text{where } N_{fundable,dFDA} = \\frac{Subsidies_{dFDA,ann}}{Cost_{pragmatic,pt}} = \\frac{\\$21.8B}{\\$929} = 23.4M\n\\\\[0.5em]\n\\text{where } Subsidies_{dFDA,ann} = Funding_{dFDA,ann} - OPEX_{dFDA} = \\$21.8B - \\$40M = \\$21.8B\n\\\\[0.5em]\n\\text{where } OPEX_{dFDA} = Cost_{platform} + Cost_{staff} + Cost_{infra} + Cost_{regulatory} + Cost_{community} = \\$15M + \\$10M + \\$8M + \\$5M + \\$2M = \\$40M\n\\\\[0.5em]\n\\text{where } k_{capacity,max} = \\frac{N_{willing}}{Slots_{curr}} = \\frac{1.08B}{1.9M} = 566\n\\\\[0.5em]\n\\text{where } N_{willing} = N_{patients} \\times Pct_{willing} = 2.4B \\times 44.8\\% = 1.08B\n\\\\[0.5em]\n\\text{where } N_{untreated} = N_{rare} \\times 0.95 = 7{,}000 \\times 0.95 = 6{,}650\n\\\\[0.5em]\n\\text{where } GDP_{treaty,20}=GDP_0(1+g_{treaty,ramp})^3(1+g_{treaty,full})^{17}\n\\end{gathered}",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/gdp-trajectories.html",
  manualPageTitle: "Please Select an Earth: A) Everyone Gets Rich B) Somalia, but Everywhere",
};

// ============================================================================
// Core Definitions
// ============================================================================

export const ADAPTABLE_TRIAL_PATIENTS: Parameter = {
  value: 15076.0,
  parameterName: "ADAPTABLE_TRIAL_PATIENTS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-adaptable_trial_patients",
  unit: "patients",
  displayName: "ADAPTABLE Trial Patients Enrolled",
  description: "Patients enrolled in ADAPTABLE trial (PCORnet 2016-2019). Enrolled across 40 clinical sites. Precise count from trial completion records.",
  sourceType: "definition",
  sourceRef: "pragmatic-trials-cost-advantage",
  sourceUrl: "https://commonfund.nih.gov/hcscollaboratory",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const ALLOCATION_DECISION_SPREAD: Parameter = {
  value: 0.08,
  parameterName: "ALLOCATION_DECISION_SPREAD",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-allocation_decision_spread",
  unit: "percent",
  displayName: "Allocation Decision Return Spread",
  description: "Return spread between the best and worst major asset-class sectors (biotech vs. coal, growth vs. value, emerging vs. declining). The accuracy advantage of crowds over experts is multiplied by this spread to estimate the allocation alpha from Wishocratic decision-making.",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [0.05, 0.12],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/wishocratic-investment-fund.html",
  manualPageTitle: "The Wishocratic Investment Fund",
};

export const ANNUAL_WORKING_HOURS: Parameter = {
  value: 2000.0,
  parameterName: "ANNUAL_WORKING_HOURS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-annual_working_hours",
  unit: "hours/year",
  displayName: "Annual Working Hours",
  description: "Standard annual working hours globally. Approximately 40 hours/week x 50 weeks. ILO estimates range from 1,800-2,200 across countries; 2,000 is conventional.",
  sourceType: "definition",
  confidence: "high",
};

export const APPROVED_DRUG_DISEASE_PAIRINGS: Parameter = {
  value: 1750.0,
  parameterName: "APPROVED_DRUG_DISEASE_PAIRINGS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-approved_drug_disease_pairings",
  unit: "pairings",
  displayName: "Approved Drug-Disease Pairings",
  description: "Unique approved drug-disease pairings (FDA-approved uses, midpoint of 1,500-2,000 range)",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [1500.0, 2000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/untapped-therapeutic-frontier.html",
  manualPageTitle: "The Untapped Therapeutic Frontier",
};

export const AVG_LIFE_EXTENSION_PER_BENEFICIARY: Parameter = {
  value: 12.0,
  parameterName: "AVG_LIFE_EXTENSION_PER_BENEFICIARY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-avg_life_extension_per_beneficiary",
  unit: "years",
  displayName: "Average Life Extension per Beneficiary",
  description: "Average years of life extension per person saved by pharmaceutical interventions. Assumption used to convert life-years saved to approximate lives saved. Based on Lichtenberg's methodology where life-years are calculated from Years of Life Lost (YLL) reductions.",
  sourceType: "definition",
  sourceRef: "lichtenberg-life-years-saved-2019",
  sourceUrl: "https://www.nber.org/papers/w25483",
  confidence: "low",
  confidenceInterval: [8.0, 18.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const CAMPAIGN_CELEBRITY_ENDORSEMENT: Parameter = {
  value: 15000000.0,
  parameterName: "CAMPAIGN_CELEBRITY_ENDORSEMENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_celebrity_endorsement",
  unit: "USD",
  displayName: "Celebrity and Influencer Endorsements",
  description: "Celebrity and influencer endorsements",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [10500000.0, 19500000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_COMMUNITY_ORGANIZING: Parameter = {
  value: 30000000.0,
  parameterName: "CAMPAIGN_COMMUNITY_ORGANIZING",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_community_organizing",
  unit: "USD",
  displayName: "Community Organizing and Ambassador Program Budget",
  description: "Community organizing and ambassador program budget",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [21000000.0, 39000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_CONTINGENCY: Parameter = {
  value: 50000000.0,
  parameterName: "CAMPAIGN_CONTINGENCY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_contingency",
  unit: "USD",
  displayName: "Contingency Fund for Unexpected Costs",
  description: "Contingency fund for unexpected costs",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [30000000.0, 80000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_DEFENSE_CONVERSION: Parameter = {
  value: 50000000.0,
  parameterName: "CAMPAIGN_DEFENSE_CONVERSION",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_defense_conversion",
  unit: "USD",
  displayName: "Defense Industry Conversion Program",
  description: "Defense industry conversion program",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [40000000.0, 70000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_DEFENSE_LOBBYIST_BUDGET: Parameter = {
  value: 50000000.0,
  parameterName: "CAMPAIGN_DEFENSE_LOBBYIST_BUDGET",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_defense_lobbyist_budget",
  unit: "USD",
  displayName: "Budget for Co-Opting Defense Industry Lobbyists",
  description: "Budget for co-opting defense industry lobbyists",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [35000000.0, 65000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_HEALTHCARE_ALIGNMENT: Parameter = {
  value: 35000000.0,
  parameterName: "CAMPAIGN_HEALTHCARE_ALIGNMENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_healthcare_alignment",
  unit: "USD",
  displayName: "Healthcare Industry Alignment and Partnerships",
  description: "Healthcare industry alignment and partnerships",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [24500000.0, 45500000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_INFRASTRUCTURE: Parameter = {
  value: 20000000.0,
  parameterName: "CAMPAIGN_INFRASTRUCTURE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_infrastructure",
  unit: "USD",
  displayName: "Campaign Operational Infrastructure",
  description: "Campaign operational infrastructure",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [14000000.0, 26000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_LEGAL_AI_BUDGET: Parameter = {
  value: 50000000.0,
  parameterName: "CAMPAIGN_LEGAL_AI_BUDGET",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_legal_ai_budget",
  unit: "USD",
  displayName: "AI-Assisted Legal Work Budget",
  description: "AI-assisted legal work budget",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [35000000.0, 65000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_LEGAL_DEFENSE: Parameter = {
  value: 20000000.0,
  parameterName: "CAMPAIGN_LEGAL_DEFENSE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_legal_defense",
  unit: "USD",
  displayName: "Legal Defense Fund",
  description: "Legal defense fund",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [14000000.0, 26000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_LEGAL_WORK: Parameter = {
  value: 60000000.0,
  parameterName: "CAMPAIGN_LEGAL_WORK",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_legal_work",
  unit: "USD",
  displayName: "Legal Drafting and Compliance Work",
  description: "Legal drafting and compliance work",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [50000000.0, 80000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_LOBBYING_EU: Parameter = {
  value: 40000000.0,
  parameterName: "CAMPAIGN_LOBBYING_EU",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_lobbying_eu",
  unit: "USD",
  displayName: "EU Lobbying Campaign Budget",
  description: "EU lobbying campaign budget",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [28000000.0, 52000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_LOBBYING_G20_MILLIONS: Parameter = {
  value: 35000000.0,
  parameterName: "CAMPAIGN_LOBBYING_G20_MILLIONS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_lobbying_g20_millions",
  unit: "USD",
  displayName: "G20 Countries Lobbying Budget",
  description: "G20 countries lobbying budget",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_LOBBYING_US: Parameter = {
  value: 50000000.0,
  parameterName: "CAMPAIGN_LOBBYING_US",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_lobbying_us",
  unit: "USD",
  displayName: "US Lobbying Campaign Budget",
  description: "US lobbying campaign budget",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [35000000.0, 65000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_MEDIA_BUDGET_MAX: Parameter = {
  value: 1000000000.0,
  parameterName: "CAMPAIGN_MEDIA_BUDGET_MAX",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_media_budget_max",
  unit: "USD",
  displayName: "Maximum Mass Media Campaign Budget",
  description: "Maximum mass media campaign budget",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [700000000.0, 1300000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_MEDIA_BUDGET_MIN: Parameter = {
  value: 500000000.0,
  parameterName: "CAMPAIGN_MEDIA_BUDGET_MIN",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_media_budget_min",
  unit: "USD",
  displayName: "Minimum Mass Media Campaign Budget",
  description: "Minimum mass media campaign budget",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [350000000.0, 650000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_OPPOSITION_RESEARCH: Parameter = {
  value: 25000000.0,
  parameterName: "CAMPAIGN_OPPOSITION_RESEARCH",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_opposition_research",
  unit: "USD",
  displayName: "Opposition Research and Rapid Response",
  description: "Opposition research and rapid response",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [17500000.0, 32500000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_PHASE1_BUDGET: Parameter = {
  value: 200000000.0,
  parameterName: "CAMPAIGN_PHASE1_BUDGET",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_phase1_budget",
  unit: "USD",
  displayName: "Phase 1 Campaign Budget",
  description: "Phase 1 campaign budget (Foundation, Year 1)",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [140000000.0, 260000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/ai-coordination-army.html",
  manualPageTitle: "Building Your AI Coordination Army",
};

export const CAMPAIGN_PHASE2_BUDGET: Parameter = {
  value: 500000000.0,
  parameterName: "CAMPAIGN_PHASE2_BUDGET",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_phase2_budget",
  unit: "USD",
  displayName: "Phase 2 Campaign Budget",
  description: "Phase 2 campaign budget (Scale & Momentum, Years 2-3)",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [350000000.0, 650000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_PILOT_PROGRAMS: Parameter = {
  value: 30000000.0,
  parameterName: "CAMPAIGN_PILOT_PROGRAMS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_pilot_programs",
  unit: "USD",
  displayName: "Pilot Program Testing in Small Countries",
  description: "Pilot program testing in small countries",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [21000000.0, 39000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_PLATFORM_DEVELOPMENT: Parameter = {
  value: 35000000.0,
  parameterName: "CAMPAIGN_PLATFORM_DEVELOPMENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_platform_development",
  unit: "USD",
  displayName: "Voting Platform and Technology Development",
  description: "Voting platform and technology development",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [25000000.0, 50000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_REGULATORY_NAVIGATION: Parameter = {
  value: 20000000.0,
  parameterName: "CAMPAIGN_REGULATORY_NAVIGATION",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_regulatory_navigation",
  unit: "USD",
  displayName: "Regulatory Compliance and Navigation",
  description: "Regulatory compliance and navigation",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [14000000.0, 26000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_SCALING_PREP: Parameter = {
  value: 30000000.0,
  parameterName: "CAMPAIGN_SCALING_PREP",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_scaling_prep",
  unit: "USD",
  displayName: "Scaling Preparation and Blueprints",
  description: "Scaling preparation and blueprints",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [21000000.0, 39000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_STAFF_BUDGET: Parameter = {
  value: 40000000.0,
  parameterName: "CAMPAIGN_STAFF_BUDGET",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_staff_budget",
  unit: "USD",
  displayName: "Campaign Core Team Staff Budget",
  description: "Campaign core team staff budget",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [28000000.0, 52000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_SUPER_PAC_BUDGET: Parameter = {
  value: 30000000.0,
  parameterName: "CAMPAIGN_SUPER_PAC_BUDGET",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_super_pac_budget",
  unit: "USD",
  displayName: "Super PAC Campaign Expenditures",
  description: "Super PAC campaign expenditures",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [21000000.0, 39000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/legal/election-law.html",
  manualPageTitle: "Election Law",
};

export const CAMPAIGN_TECH_PARTNERSHIPS: Parameter = {
  value: 25000000.0,
  parameterName: "CAMPAIGN_TECH_PARTNERSHIPS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_tech_partnerships",
  unit: "USD",
  displayName: "Tech Industry Partnerships and Infrastructure",
  description: "Tech industry partnerships and infrastructure",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [17500000.0, 32500000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_TREATY_IMPLEMENTATION: Parameter = {
  value: 40000000.0,
  parameterName: "CAMPAIGN_TREATY_IMPLEMENTATION",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_treaty_implementation",
  unit: "USD",
  displayName: "Post-Victory Treaty Implementation Support",
  description: "Post-victory treaty implementation support",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [30000000.0, 55000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAMPAIGN_VIRAL_CONTENT_BUDGET: Parameter = {
  value: 40000000.0,
  parameterName: "CAMPAIGN_VIRAL_CONTENT_BUDGET",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-campaign_viral_content_budget",
  unit: "USD",
  displayName: "Viral Marketing Content Creation Budget",
  description: "Viral marketing content creation budget",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [28000000.0, 52000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/campaign-budget.html",
  manualPageTitle: "Campaign Budget: The {{< var campaign_media_budget_max >}} Legal Bribery Machine",
};

export const CAREGIVER_COST_ANNUAL: Parameter = {
  value: 6000.0,
  parameterName: "CAREGIVER_COST_ANNUAL",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-caregiver_cost_annual",
  unit: "USD/year",
  displayName: "Annual Cost of Unpaid Caregiving",
  description: "Annual cost of unpaid caregiving (replacement cost method)",
  sourceType: "definition",
  sourceRef: "unpaid-caregiver-hours-economic-value",
  sourceUrl: "https://www.aarp.org/caregiving/financial-legal/info-2023/unpaid-caregivers-provide-billions-in-care.html",
  confidence: "high",
  formula: "HOURS_PER_MONTH × MONTHS_PER_YEAR × VALUE_PER_HOUR",
};

export const CELL_THERAPY_APPROACHES: Parameter = {
  value: 500.0,
  parameterName: "CELL_THERAPY_APPROACHES",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-cell_therapy_approaches",
  unit: "approaches",
  displayName: "Cell Therapy Approaches",
  description: "Distinct cell therapy approaches (CAR-T variants, iPSCs, MSCs, organoids)",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [300.0, 800.0],
};

export const CHAIN_DISMISS_PROBABILITY: Parameter = {
  value: 0.9,
  parameterName: "CHAIN_DISMISS_PROBABILITY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-chain_dismiss_probability",
  unit: "rate",
  displayName: "Dismissal Rate",
  description: "Probability someone dismisses the idea without engaging (the 'institutionalization rate')",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [0.8, 0.97],
  conservative: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/treaty-feasibility.html",
  manualPageTitle: "Treaty Feasibility & Cost Analysis",
};

export const CHAIN_EFFECTIVE_R: Parameter = {
  value: 0.15,
  parameterName: "CHAIN_EFFECTIVE_R",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-chain_effective_r",
  unit: "ratio",
  displayName: "Effective R",
  description: "Effective reproduction number per cascade generation: fraction of viewers who share (5%) x average forwards per sharer (3). CI spans pessimistic (2% x 2 = 0.04) to optimistic (10% x 8 = 0.80).",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [0.04, 0.8],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/treaty-feasibility.html",
  manualPageTitle: "Treaty Feasibility & Cost Analysis",
};

export const CHAIN_HORIZON_YEARS: Parameter = {
  value: 3.0,
  parameterName: "CHAIN_HORIZON_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-chain_horizon_years",
  unit: "years",
  displayName: "Model Horizon",
  description: "Conservative upper bound for cascade propagation (social media cascades propagate in weeks; 3 years allows for slower channels and multiple cascade waves)",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-protocol-v1.html",
  manualPageTitle: "Earth Optimization Protocol v1",
};

export const CHAIN_IMPLEMENTER_ORBIT_SIZE: Parameter = {
  value: 1000.0,
  parameterName: "CHAIN_IMPLEMENTER_ORBIT_SIZE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-chain_implementer_orbit_size",
  unit: "people",
  displayName: "Implementer Orbit Size",
  description: "Information-orbit size per implementer: people whose recommendation would reach them (staff, advisors, active social media feeds, professional contacts). Lower bound: Dunbar's 150; upper: corporate C-suite intake funnel.",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [150.0, 5000.0],
  conservative: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/treaty-feasibility.html",
  manualPageTitle: "Treaty Feasibility & Cost Analysis",
};

export const CHAIN_INITIAL_AUDIENCE: Parameter = {
  value: 50000.0,
  parameterName: "CHAIN_INITIAL_AUDIENCE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-chain_initial_audience",
  unit: "people",
  displayName: "Initial Audience",
  description: "Conservative initial audience size (readers, website visitors, conference attendees)",
  sourceType: "definition",
  confidence: "low",
  confidenceInterval: [10000.0, 500000.0],
  conservative: true,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/treaty-feasibility.html",
  manualPageTitle: "Treaty Feasibility & Cost Analysis",
};

export const CHAIN_WORLD_LEADER_COUNT: Parameter = {
  value: 195.0,
  parameterName: "CHAIN_WORLD_LEADER_COUNT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-chain_world_leader_count",
  unit: "countries",
  displayName: "World Leader Count",
  description: "Number of sovereign heads of state/government",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/treaty-feasibility.html",
  manualPageTitle: "Treaty Feasibility & Cost Analysis",
};

export const CHILDHOOD_VACCINATION_COST_PER_DALY: Parameter = {
  value: 30.0,
  parameterName: "CHILDHOOD_VACCINATION_COST_PER_DALY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-childhood_vaccination_cost_per_daly",
  unit: "USD/DALY",
  displayName: "Childhood Vaccination Cost per DALY (Estimated)",
  description: "Estimated cost per DALY for US childhood vaccination programs. Note: US cost-effectiveness studies primarily use cost per QALY (Quality-Adjusted Life Year) rather than cost per DALY. This estimate is derived from program costs and benefits for comparison purposes only.",
  sourceType: "definition",
  sourceRef: "childhood-vaccination-roi",
  sourceUrl: "https://www.cdc.gov/mmwr/preview/mmwrhtml/mm6316a4.htm",
  confidence: "low",
};

export const CONCENTRATED_INTEREST_SECTOR_MARKET_CAP_USD: Parameter = {
  value: 5000000000000.0,
  parameterName: "CONCENTRATED_INTEREST_SECTOR_MARKET_CAP_USD",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-concentrated_interest_sector_market_cap_usd",
  unit: "USD",
  displayName: "Concentrated Interest Sector Market Cap",
  description: "Estimated combined market capitalization of concentrated interest opposition (defense, fossil fuel, etc.)",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/incentive-alignment-bonds-paper.html",
  manualPageTitle: "Incentive Alignment Bonds: Making Public Goods Financially and Politically Profitable",
};

export const CUMULATIVE_MILITARY_SPENDING_ALL_HISTORY: Parameter = {
  value: 180000000000000.0,
  parameterName: "CUMULATIVE_MILITARY_SPENDING_ALL_HISTORY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-cumulative_military_spending_all_history",
  unit: "USD",
  displayName: "Cumulative Military Spending (All History)",
  description: "Cumulative global military spending across all recorded history in constant 2024 dollars. Fed era ($170T) + 19th century ($3T) + pre-1800 GDP-share estimate ($4-20T). Range: $150-225T. 75% was spent after 1945.",
  sourceType: "definition",
  sourceRef: "sipri-milex-2024",
  sourceUrl: "https://www.sipri.org/publications/2025/sipri-fact-sheets/trends-world-military-expenditure-2024",
  confidence: "low",
};

export const CUMULATIVE_MILITARY_SPENDING_FED_ERA: Parameter = {
  value: 170000000000000.0,
  parameterName: "CUMULATIVE_MILITARY_SPENDING_FED_ERA",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-cumulative_military_spending_fed_era",
  unit: "USD",
  displayName: "Cumulative Military Spending (Fed Era)",
  description: "Cumulative global military spending since 1913 (Fed era) in constant 2024 dollars. Built from: SIPRI 1988-2024 ($65-72T), Cold War 1946-1987 ($50-70T reconstructed), WWI+WWII+interwar ($33T from Harrison). Range: $150-190T.",
  sourceType: "definition",
  sourceRef: "sipri-milex-2024",
  sourceUrl: "https://www.sipri.org/publications/2025/sipri-fact-sheets/trends-world-military-expenditure-2024",
  confidence: "low",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/central-banks.html",
  manualPageTitle: "Money Comes From a Building and They Use It to Kill People",
};

export const DAYS_PER_YEAR: Parameter = {
  value: 365.0,
  parameterName: "DAYS_PER_YEAR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-days_per_year",
};

export const DCT_PLATFORM_FUNDING_MEDIUM: Parameter = {
  value: 500000000.0,
  parameterName: "DCT_PLATFORM_FUNDING_MEDIUM",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dct_platform_funding_medium",
  unit: "USD",
  displayName: "Mid-Range Funding for Commercial Dct Platform",
  description: "Mid-range funding for commercial DCT platform",
  sourceType: "definition",
  confidence: "high",
};

export const DEFENSE_SECTOR_RETENTION_PCT: Parameter = {
  value: 0.99,
  parameterName: "DEFENSE_SECTOR_RETENTION_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-defense_sector_retention_pct",
  unit: "rate",
  displayName: "Percentage of Budget Defense Sector Keeps Under 1% treaty",
  description: "Percentage of budget defense sector keeps under 1% treaty",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution.html",
  manualPageTitle: "Optimization Summary",
};

export const DESTRUCTIVE_ECONOMY_BASE_YEAR: Parameter = {
  value: 2025.0,
  parameterName: "DESTRUCTIVE_ECONOMY_BASE_YEAR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-destructive_economy_base_year",
  unit: "year",
  displayName: "Destructive Economy Base Year",
  description: "Base year for destructive economy projections. All threshold timelines are measured from this year.",
  sourceType: "definition",
  confidence: "high",
};

export const DFDA_ANNUAL_TRIAL_FUNDING: Parameter = {
  value: 21800000000.0,
  parameterName: "DFDA_ANNUAL_TRIAL_FUNDING",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_annual_trial_funding",
  unit: "USD/year",
  displayName: "dFDA Annual Trial Funding",
  description: "Assumed annual funding for dFDA pragmatic clinical trials (~$21.8B/year). Source-agnostic: could come from military reallocation, philanthropy, or government appropriation.",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html",
  manualPageTitle: "Ubiquitous Pragmatic Trial Impact Analysis: How to Prevent a Year of Death and Suffering for 84 Cents",
};

export const DFDA_NPV_ADOPTION_RAMP_YEARS: Parameter = {
  value: 5.0,
  parameterName: "DFDA_NPV_ADOPTION_RAMP_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_npv_adoption_ramp_years",
  unit: "years",
  displayName: "Years to Reach Full Decentralized Framework for Drug Assessment Adoption",
  description: "Years to reach full Decentralized Framework for Drug Assessment adoption",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const DFDA_NPV_ANNUAL_OPEX: Parameter = {
  value: 18950000.0,
  parameterName: "DFDA_NPV_ANNUAL_OPEX",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_npv_annual_opex",
  unit: "USD/year",
  displayName: "Decentralized Framework for Drug Assessment Core framework Annual OPEX",
  description: "Decentralized Framework for Drug Assessment Core framework annual opex (midpoint of $11-26.5M)",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [11000000.0, 26500000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html",
  manualPageTitle: "Ubiquitous Pragmatic Trial Impact Analysis: How to Prevent a Year of Death and Suffering for 84 Cents",
};

export const DFDA_NPV_UPFRONT_COST: Parameter = {
  value: 40000000.0,
  parameterName: "DFDA_NPV_UPFRONT_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_npv_upfront_cost",
  unit: "USD",
  displayName: "Decentralized Framework for Drug Assessment Core framework Build Cost",
  description: "Decentralized Framework for Drug Assessment Core framework build cost",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [25000000.0, 65000000.0],
};

export const DFDA_OBSERVATIONAL_COST_PER_PATIENT: Parameter = {
  value: 0.1,
  parameterName: "DFDA_OBSERVATIONAL_COST_PER_PATIENT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_observational_cost_per_patient",
  unit: "USD/patient",
  displayName: "Stage 1 Observational Analysis Cost per Patient",
  description: "Order-of-magnitude estimate for Stage 1 observational signal detection (PIS calculation). Validated by FDA Sentinel benchmark (~$1/patient/year for similar drug safety analysis at 100M+ scale). True cost varies with scale and complexity; exact value less important than order-of-magnitude difference vs pragmatic trials (~$500-929/patient) and traditional Phase 3 (~$41,000/patient).",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [0.03, 1.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-spec-paper.html",
  manualPageTitle: "The Continuous Evidence Generation Protocol: Two-Stage Validation (RWE → Pragmatic Trials)",
};

export const DFDA_OPEX_COMMUNITY: Parameter = {
  value: 2000000.0,
  parameterName: "DFDA_OPEX_COMMUNITY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_opex_community",
  unit: "USD/year",
  displayName: "Decentralized Framework for Drug Assessment Community Support Costs",
  description: "Decentralized Framework for Drug Assessment community support costs",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [1000000.0, 3000000.0],
};

export const DFDA_OPEX_INFRASTRUCTURE: Parameter = {
  value: 8000000.0,
  parameterName: "DFDA_OPEX_INFRASTRUCTURE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_opex_infrastructure",
  unit: "USD/year",
  displayName: "Decentralized Framework for Drug Assessment Infrastructure Costs",
  description: "Decentralized Framework for Drug Assessment infrastructure costs (cloud, security)",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [5000000.0, 12000000.0],
};

export const DFDA_OPEX_PLATFORM_MAINTENANCE: Parameter = {
  value: 15000000.0,
  parameterName: "DFDA_OPEX_PLATFORM_MAINTENANCE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_opex_platform_maintenance",
  unit: "USD/year",
  displayName: "Decentralized Framework for Drug Assessment Maintenance Costs",
  description: "Decentralized Framework for Drug Assessment maintenance costs",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [10000000.0, 22000000.0],
};

export const DFDA_OPEX_REGULATORY: Parameter = {
  value: 5000000.0,
  parameterName: "DFDA_OPEX_REGULATORY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_opex_regulatory",
  unit: "USD/year",
  displayName: "Decentralized Framework for Drug Assessment Regulatory Coordination Costs",
  description: "Decentralized Framework for Drug Assessment regulatory coordination costs",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [3000000.0, 8000000.0],
};

export const DFDA_OPEX_STAFF: Parameter = {
  value: 10000000.0,
  parameterName: "DFDA_OPEX_STAFF",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_opex_staff",
  unit: "USD/year",
  displayName: "Decentralized Framework for Drug Assessment Staff Costs",
  description: "Decentralized Framework for Drug Assessment staff costs (minimal, AI-assisted)",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [7000000.0, 15000000.0],
};

export const DFDA_STORAGE_COST_BACKUP_PER_PATIENT_MONTHLY: Parameter = {
  value: 0.2,
  parameterName: "DFDA_STORAGE_COST_BACKUP_PER_PATIENT_MONTHLY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_storage_cost_backup_per_patient_monthly",
  unit: "USD/patient/month",
  displayName: "Backup/Redundancy Cost per Patient (Monthly)",
  description: "Backup and redundancy cost per patient per month. For data safety and compliance.",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [0.1, 0.4],
};

export const DFDA_STORAGE_COST_COMPUTE_PER_PATIENT_MONTHLY: Parameter = {
  value: 0.2,
  parameterName: "DFDA_STORAGE_COST_COMPUTE_PER_PATIENT_MONTHLY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_storage_cost_compute_per_patient_monthly",
  unit: "USD/patient/month",
  displayName: "Compute/API Cost per Patient (Monthly)",
  description: "Compute and API cost per patient per month. For data processing, correlation analysis, and PIS calculation.",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [0.1, 0.5],
};

export const DFDA_STORAGE_COST_DATABASE_PER_PATIENT_MONTHLY: Parameter = {
  value: 0.3,
  parameterName: "DFDA_STORAGE_COST_DATABASE_PER_PATIENT_MONTHLY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_storage_cost_database_per_patient_monthly",
  unit: "USD/patient/month",
  displayName: "Database Cost per Patient (Monthly)",
  description: "Database cost per patient per month. For structured data storage and querying.",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [0.15, 0.6],
};

export const DFDA_STORAGE_COST_RAW_PER_PATIENT_MONTHLY: Parameter = {
  value: 0.02,
  parameterName: "DFDA_STORAGE_COST_RAW_PER_PATIENT_MONTHLY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_storage_cost_raw_per_patient_monthly",
  unit: "USD/patient/month",
  displayName: "Raw Storage Cost per Patient (Monthly)",
  description: "Raw cloud storage cost per patient per month. Based on standard cloud storage rates for ~1GB patient data.",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [0.01, 0.05],
};

export const DFDA_TARGET_COST_PER_PATIENT_USD: Parameter = {
  value: 1000.0,
  parameterName: "DFDA_TARGET_COST_PER_PATIENT_USD",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_target_cost_per_patient_usd",
  unit: "USD/patient",
  displayName: "Decentralized Framework for Drug Assessment Target Cost per Patient in USD",
  description: "Target cost per patient in USD (same as DFDA_TARGET_COST_PER_PATIENT but in dollars)",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution.html",
  manualPageTitle: "Optimization Summary",
};

export const DFDA_UPFRONT_BUILD: Parameter = {
  value: 40000000.0,
  parameterName: "DFDA_UPFRONT_BUILD",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_upfront_build",
  unit: "USD",
  displayName: "Decentralized Framework for Drug Assessment One-Time Build Cost",
  description: "Decentralized Framework for Drug Assessment one-time build cost (central estimate)",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html",
  manualPageTitle: "Ubiquitous Pragmatic Trial Impact Analysis: How to Prevent a Year of Death and Suffering for 84 Cents",
};

export const DFDA_UPFRONT_BUILD_MAX: Parameter = {
  value: 46000000.0,
  parameterName: "DFDA_UPFRONT_BUILD_MAX",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dfda_upfront_build_max",
  unit: "USD",
  displayName: "Decentralized Framework for Drug Assessment One-Time Build Cost (Maximum)",
  description: "Decentralized Framework for Drug Assessment one-time build cost (high estimate)",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html",
  manualPageTitle: "Ubiquitous Pragmatic Trial Impact Analysis: How to Prevent a Year of Death and Suffering for 84 Cents",
};

export const DIH_NPV_ANNUAL_OPEX_INITIATIVES: Parameter = {
  value: 21100000.0,
  parameterName: "DIH_NPV_ANNUAL_OPEX_INITIATIVES",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dih_npv_annual_opex_initiatives",
  unit: "USD/year",
  displayName: "DIH Broader Initiatives Annual OPEX",
  description: "DIH broader initiatives annual opex (medium case)",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [14000000.0, 32000000.0],
};

export const DIH_NPV_UPFRONT_COST_INITIATIVES: Parameter = {
  value: 229750000.0,
  parameterName: "DIH_NPV_UPFRONT_COST_INITIATIVES",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-dih_npv_upfront_cost_initiatives",
  unit: "USD",
  displayName: "DIH Broader Initiatives Upfront Cost",
  description: "DIH broader initiatives upfront cost (medium case)",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [150000000.0, 350000000.0],
};

export const DISEASE_RELATED_CAREGIVER_PCT: Parameter = {
  value: 0.4,
  parameterName: "DISEASE_RELATED_CAREGIVER_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-disease_related_caregiver_pct",
  unit: "rate",
  displayName: "Percentage of Caregiving for Treatable Disease Conditions",
  description: "Percentage of caregiving for treatable disease conditions (vs aging, disability, children)",
  sourceType: "definition",
  sourceRef: "disease-related-caregiving-estimate",
  confidence: "high",
};

export const EPIGENETIC_TARGETS_COUNT: Parameter = {
  value: 1500.0,
  parameterName: "EPIGENETIC_TARGETS_COUNT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-epigenetic_targets_count",
  unit: "targets",
  displayName: "Epigenetic Drug Targets",
  description: "Druggable epigenetic targets (HDACs, DNMTs, histone modifiers, bromodomains)",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [1000.0, 2000.0],
};

export const EVENTUALLY_AVOIDABLE_DALY_PCT: Parameter = {
  value: 0.9262780790085205,
  parameterName: "EVENTUALLY_AVOIDABLE_DALY_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-eventually_avoidable_daly_pct",
  unit: "percentage",
  displayName: "Eventually Avoidable DALY Percentage",
  description: "Percentage of DALYs that are eventually avoidable with sufficient biomedical research. Uses same methodology as EVENTUALLY_AVOIDABLE_DEATH_PCT. Most non-fatal chronic conditions (arthritis, depression, chronic pain) are also addressable through research, so the percentage is similar to deaths.",
  sourceType: "definition",
  confidence: "low",
  formula: "1 - FUNDAMENTALLY_UNAVOIDABLE_DEATH_PCT",
  confidenceInterval: [0.5, 0.98],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const EVENTUALLY_AVOIDABLE_DEATH_PCT: Parameter = {
  value: 0.9262780790085205,
  parameterName: "EVENTUALLY_AVOIDABLE_DEATH_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-eventually_avoidable_death_pct",
  unit: "percentage",
  displayName: "Eventually Avoidable Death Percentage",
  description: "Percentage of deaths that are eventually avoidable with sufficient biomedical research and technological advancement. Central estimate ~92% based on ~7.9% fundamentally unavoidable (primarily accidents). Wide uncertainty reflects debate over: (1) aging as addressable vs. fundamental, (2) asymptotic difficulty of last diseases, (3) multifactorial disease complexity.",
  sourceType: "definition",
  confidence: "low",
  formula: "1 - FUNDAMENTALLY_UNAVOIDABLE_DEATH_PCT",
  confidenceInterval: [0.5, 0.98],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const FAMILY_OFFICE_INVESTMENT_MIN: Parameter = {
  value: 5000000.0,
  parameterName: "FAMILY_OFFICE_INVESTMENT_MIN",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-family_office_investment_min",
  unit: "USD",
  displayName: "Minimum Investment for Family Offices",
  description: "Minimum investment for family offices",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/aligning-incentives.html",
  manualPageTitle: "Aligning Incentives",
};

export const FUNDAMENTALLY_UNAVOIDABLE_DEATH_PCT: Parameter = {
  value: 0.07372192099147949,
  parameterName: "FUNDAMENTALLY_UNAVOIDABLE_DEATH_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-fundamentally_unavoidable_death_pct",
  unit: "percentage",
  displayName: "Fundamentally Unavoidable Death Percentage",
  description: "Percentage of deaths that are fundamentally unavoidable even with perfect biotechnology (primarily accidents). Calculated as Σ(disease_burden × (1 - max_cure_potential)) across all disease categories.",
  sourceType: "definition",
  confidence: "medium",
  formula: "Σ(DISEASE_BURDEN[cat] × (1 - RESEARCH_ACCELERATION_POTENTIAL[cat]))",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const GDP_BASELINE_GROWTH_RATE: Parameter = {
  value: 0.025,
  parameterName: "GDP_BASELINE_GROWTH_RATE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-gdp_baseline_growth_rate",
  unit: "rate",
  displayName: "Baseline Global GDP Growth Rate",
  description: "Status-quo baseline annual global GDP growth rate.",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/political-dysfunction-tax.html",
  manualPageTitle: "The Political Dysfunction Tax",
};

export const GLOBAL_COORDINATION_ACTIVATION_REWARD_PER_VERIFIED_PARTICIPANT: Parameter = {
  value: 5.0,
  parameterName: "GLOBAL_COORDINATION_ACTIVATION_REWARD_PER_VERIFIED_PARTICIPANT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_coordination_activation_reward_per_verified_participant",
  unit: "USD",
  displayName: "Activation Reward per Verified Participant",
  description: "Planning midpoint for the direct cash incentive required to make a successful verified recruit materially worth sharing at global scale. Intended as a research-backed blended reward across referrer and recruit, not as the long-dated PRIZE claim value.",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [2.0, 10.0],
  stdError: 1.5,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const GLOBAL_COORDINATION_PLATFORM_AND_OPERATIONS_COST: Parameter = {
  value: 4000000000.0,
  parameterName: "GLOBAL_COORDINATION_PLATFORM_AND_OPERATIONS_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_coordination_platform_and_operations_cost",
  unit: "USD",
  displayName: "Global Coordination Platform and Operations Cost",
  description: "Fixed cost to run a global activation campaign toward 50% participation: platform buildout, localization, customer support, compliance, payout operations, fraud response, and regional launch infrastructure.",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [2000000000.0, 8000000000.0],
  stdError: 1500000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const GLOBAL_COORDINATION_TARGET_PCT: Parameter = {
  value: 0.5,
  parameterName: "GLOBAL_COORDINATION_TARGET_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_coordination_target_pct",
  unit: "percent",
  displayName: "Global Coordination Target",
  description: "Modeled end-state global coordination target: half of humanity visibly supports the prize network, used in prose as roughly 90% of likely voters globally.",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/global-referendum.html",
  manualPageTitle: "Global Referendum Strategy",
};

export const GLOBAL_COORDINATION_VERIFICATION_AND_PAYMENT_COST_PER_PARTICIPANT: Parameter = {
  value: 1.5,
  parameterName: "GLOBAL_COORDINATION_VERIFICATION_AND_PAYMENT_COST_PER_PARTICIPANT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_coordination_verification_and_payment_cost_per_participant",
  unit: "USD",
  displayName: "Verification and Payment Cost per Participant",
  description: "Planning midpoint for non-reward variable cost per successful verified participant: identity verification, payment rails, fraud checks, support, and completion friction.",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [1.0, 3.0],
  stdError: 0.5,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const GLOBAL_TO_US_POLITICAL_COST_RATIO: Parameter = {
  value: 5.0,
  parameterName: "GLOBAL_TO_US_POLITICAL_COST_RATIO",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-global_to_us_political_cost_ratio",
  unit: "ratio",
  displayName: "Global-to-US Political Cost Ratio",
  description: "Ratio of global to US political reform costs. Based on discretionary spending ratio (~9x) discounted by ~50% for less transparent/expensive non-US political systems. Range 3-8 reflects uncertainty about non-US political dynamics and hidden influence channels.",
  sourceType: "definition",
  confidence: "low",
  confidenceInterval: [3.0, 8.0],
};

export const HOURS_PER_DAY: Parameter = {
  value: 24.0,
  parameterName: "HOURS_PER_DAY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-hours_per_day",
};

export const HOURS_PER_YEAR: Parameter = {
  value: 8760.0,
  parameterName: "HOURS_PER_YEAR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-hours_per_year",
};

export const HUMAN_PROTEIN_CODING_GENES: Parameter = {
  value: 20000.0,
  parameterName: "HUMAN_PROTEIN_CODING_GENES",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-human_protein_coding_genes",
  unit: "genes",
  displayName: "Human Protein-Coding Genes",
  description: "Human protein-coding genes targetable by gene therapy, mRNA, or biologics (Human Genome Project consensus)",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [19000.0, 21000.0],
};

export const IAB_MECHANISM_ANNUAL_COST: Parameter = {
  value: 750000000.0,
  parameterName: "IAB_MECHANISM_ANNUAL_COST",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-iab_mechanism_annual_cost",
  unit: "USD/year",
  displayName: "IAB Mechanism Annual Cost (High Estimate)",
  description: "Estimated annual cost of the IAB mechanism (high-end estimate including regulatory defense)",
  sourceType: "definition",
  sourceRef: "https://iab.warondisease.org#welfare-analysis",
  sourceUrl: "https://iab.warondisease.org#welfare-analysis",
  confidence: "high",
  confidenceInterval: [160000000.0, 750000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/incentive-alignment-bonds-paper.html",
  manualPageTitle: "Incentive Alignment Bonds: Making Public Goods Financially and Politically Profitable",
};

export const IAB_POLITICAL_INCENTIVE_FUNDING_PCT: Parameter = {
  value: 0.1,
  parameterName: "IAB_POLITICAL_INCENTIVE_FUNDING_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-iab_political_incentive_funding_pct",
  unit: "rate",
  displayName: "IAB Political Incentive Funding Percentage",
  description: "Percentage of treaty funding allocated to Incentive Alignment Bond mechanism for political incentives (independent expenditures/PACs, post-office fellowships, Public Good Score infrastructure)",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-protocol-v1.html",
  manualPageTitle: "Earth Optimization Protocol v1",
};

export const INSTITUTIONAL_INVESTOR_MIN: Parameter = {
  value: 10000000.0,
  parameterName: "INSTITUTIONAL_INVESTOR_MIN",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-institutional_investor_min",
  unit: "USD",
  displayName: "Minimum Investment for Institutional Investors",
  description: "Minimum investment for institutional investors",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/incentive-alignment-bonds.html",
  manualPageTitle: "Incentive Alignment Bonds",
};

export const LOBBYIST_BOND_INVESTMENT_MAX: Parameter = {
  value: 20000000.0,
  parameterName: "LOBBYIST_BOND_INVESTMENT_MAX",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-lobbyist_bond_investment_max",
  unit: "USD",
  displayName: "Maximum Bond Investment for Lobbyist Incentives",
  description: "Maximum bond investment for lobbyist incentives",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/aligning-incentives.html",
  manualPageTitle: "Aligning Incentives",
};

export const MILITARY_REDIRECT_GDP_BOOST_AT_30PCT: Parameter = {
  value: 0.055,
  parameterName: "MILITARY_REDIRECT_GDP_BOOST_AT_30PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-military_redirect_gdp_boost_at_30pct",
  unit: "rate",
  displayName: "GDP Growth Boost at 30% Military Reallocation",
  description: "Historical calibration target: 30% military reallocation maps to ~5.5 percentage points annual GDP growth boost.",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [0.035, 0.075],
  stdError: 0.01,
};

export const MINUTES_PER_HOUR: Parameter = {
  value: 60.0,
  parameterName: "MINUTES_PER_HOUR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-minutes_per_hour",
};

export const MONEY_PRINTER_WAR_DEATHS: Parameter = {
  value: 97000000.0,
  parameterName: "MONEY_PRINTER_WAR_DEATHS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-money_printer_war_deaths",
  unit: "deaths",
  displayName: "Money-Printer War Deaths",
  description: "Cumulative deaths from 6 wars funded by money printing: Napoleonic (5M), Civil War (750K), WWI (20M), WWII (60M), Korea (3M), Vietnam (3M), post-9/11 (4.5M). Mid-range estimates; conservative total exceeds 110M.",
  sourceType: "definition",
  sourceRef: "crs-war-costs-2010",
  sourceUrl: "https://sgp.fas.org/crs/natsec/RS22926.pdf",
  confidence: "medium",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/central-banks.html",
  manualPageTitle: "Money Comes From a Building and They Use It to Kill People",
};

export const MONTHS_PER_YEAR: Parameter = {
  value: 12.0,
  parameterName: "MONTHS_PER_YEAR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-months_per_year",
};

export const NPV_DISCOUNT_RATE_STANDARD: Parameter = {
  value: 0.03,
  parameterName: "NPV_DISCOUNT_RATE_STANDARD",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-npv_discount_rate_standard",
  unit: "rate",
  displayName: "Standard Discount Rate for NPV Analysis",
  description: "Standard discount rate for NPV analysis (3% annual, social discount rate)",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const NPV_TIME_HORIZON_YEARS: Parameter = {
  value: 10.0,
  parameterName: "NPV_TIME_HORIZON_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-npv_time_horizon_years",
  unit: "years",
  displayName: "Standard Time Horizon for NPV Analysis",
  description: "Standard time horizon for NPV analysis",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const PEACE_DIVIDEND_CONFLICT_ELASTICITY: Parameter = {
  value: 1.0,
  parameterName: "PEACE_DIVIDEND_CONFLICT_ELASTICITY",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-peace_dividend_conflict_elasticity",
  unit: "ratio",
  displayName: "Peace Dividend Conflict Elasticity",
  description: "Conflict reduction elasticity: how much conflict costs decrease per 1% military spending cut. ε=0: no effect (spending cuts don't reduce conflict). ε=0.5: moderate linkage (conservative). ε=1.0: proportional (baseline assumption). ε>1.0: shared enemy amplification (redirecting to disease creates unity).",
  sourceType: "definition",
  confidence: "high",
  formula: "1% spending cut → ε% conflict cost reduction",
  confidenceInterval: [0.25, 1.5],
};

export const PEACE_DIVIDEND_DIRECT_FISCAL_SAVINGS: Parameter = {
  value: 27200000000.0,
  parameterName: "PEACE_DIVIDEND_DIRECT_FISCAL_SAVINGS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-peace_dividend_direct_fiscal_savings",
  unit: "USD/year",
  displayName: "Direct Fiscal Savings from 1% Military Spending Reduction",
  description: "Direct fiscal savings from 1% military spending reduction (high confidence)",
  sourceType: "definition",
  sourceRef: "sipri2024",
  sourceUrl: "https://www.sipri.org/publications/2024/sipri-fact-sheets/trends-world-military-expenditure-2023",
  confidence: "high",
  formula: "TREATY_ANNUAL_FUNDING",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const PHARMA_PHASE_2_3_COST_BARRIER: Parameter = {
  value: 1560000000.0,
  parameterName: "PHARMA_PHASE_2_3_COST_BARRIER",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-pharma_phase_2_3_cost_barrier",
  unit: "USD",
  displayName: "Pharma Phase 2/3 Cost Barrier Per Drug",
  description: "Average Phase 2/3 efficacy testing cost per drug that pharma must fund (~60% of total drug development cost)",
  sourceType: "definition",
  sourceRef: "drug-development-cost",
  confidence: "high",
  stdError: 200000000.0,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/appendix/invisible-graveyard.html",
  manualPageTitle: "The Invisible Graveyard: Quantifying the Mortality Cost of FDA Efficacy Lag",
};

export const PRE_1962_VALIDATION_YEARS: Parameter = {
  value: 77.0,
  parameterName: "PRE_1962_VALIDATION_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-pre_1962_validation_years",
  unit: "years",
  displayName: "Pre-1962 Validation Years",
  description: "Years of empirical validation for physician-led pragmatic trials (1883-1960)",
  sourceType: "definition",
  sourceRef: "life-expectancy-increase-pre-1962",
  sourceUrl: "https://manual.warondisease.org/knowledge/data/us-life-expectancy-fda-budget-1543-2019.csv",
  confidence: "high",
  formula: "1960 - 1883",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const PRIZE_POOL_PARTICIPATION_RATE: Parameter = {
  value: 0.01,
  parameterName: "PRIZE_POOL_PARTICIPATION_RATE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-prize_pool_participation_rate",
  unit: "percent",
  displayName: "PRIZE Pool Participation Rate",
  description: "Fraction of global investable financial assets that flow into the PRIZE pool. 1% central estimate parallels the 1% Treaty ask: 1% of your weapons money, 1% of your savings.",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [0.001, 0.1],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html",
  manualPageTitle: "The Earth Optimization Prize",
};

export const QALYS_PER_COVID_DEATH_AVERTED: Parameter = {
  value: 5.0,
  parameterName: "QALYS_PER_COVID_DEATH_AVERTED",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-qalys_per_covid_death_averted",
  unit: "QALYs/death",
  displayName: "QALYs per COVID Death Averted",
  description: "Average QALYs gained per COVID death averted. Conservative estimate reflecting older age distribution of COVID mortality. See confidence_interval for range.",
  sourceType: "definition",
  confidence: "low",
  confidenceInterval: [3.0, 10.0],
};

export const RD_SPILLOVER_MULTIPLIER: Parameter = {
  value: 2.0,
  parameterName: "RD_SPILLOVER_MULTIPLIER",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-rd_spillover_multiplier",
  unit: "x",
  displayName: "R&D Spillover Multiplier",
  description: "R&D spillover multiplier: each $1 in directed medical research produces $2 in adjacent sector GDP growth (biotech, AI, computing, materials science, manufacturing). Conservative estimate; military R&D spillover produced the internet, GPS, jet engines. Medical R&D spillover already produced CRISPR, mRNA platforms, AI protein folding.",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [1.5, 2.5],
  stdError: 0.25,
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/gdp-trajectories.html",
  manualPageTitle: "Please Select an Earth: A) Everyone Gets Rich B) Somalia, but Everywhere",
};

export const SAFE_COMPOUNDS_COUNT: Parameter = {
  value: 9500.0,
  parameterName: "SAFE_COMPOUNDS_COUNT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-safe_compounds_count",
  unit: "compounds",
  displayName: "Safe Compounds Available for Testing",
  description: "Total safe compounds available for repurposing (FDA-approved + GRAS substances, midpoint of 7,000-12,000 range)",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [7000.0, 12000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/untapped-therapeutic-frontier.html",
  manualPageTitle: "The Untapped Therapeutic Frontier",
};

export const SCALE_COMPRESSION_FACTOR: Parameter = {
  value: -0.025,
  parameterName: "SCALE_COMPRESSION_FACTOR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-scale_compression_factor",
  unit: "percent",
  displayName: "Scale Compression Factor",
  description: "Diminishing-returns drag as the venture market expands ~15x (current global VC ~$300B/yr; Wishocratic fund deploys ~$4.7T/yr). More capital chasing deals compresses returns. Partially offset by market expansion (every viable idea gets funded, oligopolies face real competition). Point estimate is moderate; CI spans optimistic to pessimistic.",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [-0.05, -0.01],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/wishocratic-investment-fund.html",
  manualPageTitle: "The Wishocratic Investment Fund",
};

export const SECONDS_PER_MINUTE: Parameter = {
  value: 60.0,
  parameterName: "SECONDS_PER_MINUTE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-seconds_per_minute",
};

export const SECONDS_PER_YEAR: Parameter = {
  value: 31536000.0,
  parameterName: "SECONDS_PER_YEAR",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-seconds_per_year",
};

export const SHARING_TIME_MINUTES: Parameter = {
  value: 0.5,
  parameterName: "SHARING_TIME_MINUTES",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-sharing_time_minutes",
  unit: "minutes",
  displayName: "Sharing Time",
  description: "Time to copy, paste, and send the recruitment message. 30 seconds.",
  sourceType: "definition",
  confidence: "high",
};

export const TESTED_RELATIONSHIPS_ESTIMATE: Parameter = {
  value: 32500.0,
  parameterName: "TESTED_RELATIONSHIPS_ESTIMATE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-tested_relationships_estimate",
  unit: "relationships",
  displayName: "Tested Drug-Disease Relationships",
  description: "Estimated drug-disease relationships actually tested (approved uses + repurposed + failed trials, midpoint of 15,000-50,000 range)",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [15000.0, 50000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/untapped-therapeutic-frontier.html",
  manualPageTitle: "The Untapped Therapeutic Frontier",
};

export const TREATY_CAMPAIGN_BUDGET_LOBBYING: Parameter = {
  value: 650000000.0,
  parameterName: "TREATY_CAMPAIGN_BUDGET_LOBBYING",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_campaign_budget_lobbying",
  unit: "USD",
  displayName: "Political Lobbying Campaign: Direct Lobbying, Super Pacs, Opposition Research, Staff, Legal/Compliance",
  description: "Political lobbying campaign: direct lobbying (US/EU/G20), Super PACs, opposition research, staff, legal/compliance. Budget exceeds combined pharma ($300M/year) and military-industrial complex ($150M/year) lobbying to ensure competitive positioning. Referendum relies on grassroots mobilization and earned media, while lobbying requires matching or exceeding opposition spending for political viability.",
  sourceType: "definition",
  confidence: "low",
  confidenceInterval: [325000000.0, 1300000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const TREATY_CAMPAIGN_BUDGET_RESERVE: Parameter = {
  value: 100000000.0,
  parameterName: "TREATY_CAMPAIGN_BUDGET_RESERVE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_campaign_budget_reserve",
  unit: "USD",
  displayName: "Reserve Fund / Contingency Buffer",
  description: "Reserve fund / contingency buffer (10% of total campaign cost). Using industry standard 10% for complex campaigns with potential for unforeseen legal challenges, opposition response, or regulatory delays. Conservative lower bound of $20M (2%) reflects transparent budget allocation and predictable referendum/lobbying costs.",
  sourceType: "definition",
  confidence: "medium",
  confidenceInterval: [20000000.0, 150000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const TREATY_CAMPAIGN_DURATION_YEARS: Parameter = {
  value: 4.0,
  parameterName: "TREATY_CAMPAIGN_DURATION_YEARS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_campaign_duration_years",
  unit: "years",
  displayName: "Treaty Campaign Duration",
  description: "Treaty campaign duration (3-5 year range, using midpoint)",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [3.0, 5.0],
};

export const TREATY_CAMPAIGN_VIRAL_REFERENDUM_BASE_CASE: Parameter = {
  value: 250000000.0,
  parameterName: "TREATY_CAMPAIGN_VIRAL_REFERENDUM_BASE_CASE",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_campaign_viral_referendum_base_case",
  unit: "USD",
  displayName: "Viral Referendum Budget",
  description: "Viral referendum budget for 280M verified votes (base: $250M realistic with $0.50/vote avg, range: $150M optimistic $0.20/vote to $410M worst-case $1.05/vote). Components: platform ($35M), verification infrastructure (280M × friction × $0.18-0.20), tiered referral payments (varies by virality and marginal cost curve per diffusion theory), marketing seed ($5-15M). Based on PayPal referral economics ($18-36 inflation-adjusted) and biometric verification pricing ($0.15-0.25 at 300M+ scale).",
  sourceType: "definition",
  confidence: "medium",
  formula: "PLATFORM + VERIFICATION + PAYMENTS (tiered by adopter segment) + MARKETING",
  confidenceInterval: [150000000.0, 410000000.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const TREATY_REDIRECTED_SPENDING_INFINITE_ROI: Parameter = {
  value: 0.0,
  parameterName: "TREATY_REDIRECTED_SPENDING_INFINITE_ROI",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_redirected_spending_infinite_roi",
  unit: "ratio",
  displayName: "Infinite ROI from Redirected Spending",
  description: "ROI when redirecting existing spending (no new costs = infinite return)",
  sourceType: "definition",
  confidence: "high",
  formula: "COMBINED_DIVIDENDS ÷ 0 = ∞",
  latex: "\\begin{gathered}\n\\text{ROI} \\\\\n= \\frac{\\text{Annual Benefits}}{\\text{New Spending}} \\\\\n= \\frac{\\$172B}{0} \\\\\n= \\infty\n\\end{gathered}",
};

export const TREATY_REDUCTION_PCT: Parameter = {
  value: 0.01,
  parameterName: "TREATY_REDUCTION_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-treaty_reduction_pct",
  unit: "rate",
  displayName: "1% Reduction in Military Spending/War Costs from Treaty",
  description: "1% reduction in military spending/war costs from treaty",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html",
  manualPageTitle: "The 1% Treaty: Harnessing Greed to Eradicate Disease",
};

export const TRIAL_RELEVANT_DISEASES_COUNT: Parameter = {
  value: 1000.0,
  parameterName: "TRIAL_RELEVANT_DISEASES_COUNT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-trial_relevant_diseases_count",
  unit: "diseases",
  displayName: "Trial-Relevant Diseases",
  description: "Consolidated count of trial-relevant diseases worth targeting (after grouping ICD-10 codes)",
  sourceType: "definition",
  confidence: "high",
  confidenceInterval: [800.0, 1200.0],
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/untapped-therapeutic-frontier.html",
  manualPageTitle: "The Untapped Therapeutic Frontier",
};

export const US_CONGRESS_MEMBER_COUNT: Parameter = {
  value: 535.0,
  parameterName: "US_CONGRESS_MEMBER_COUNT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_congress_member_count",
  unit: "members",
  displayName: "US Congress Members",
  description: "Total members of US Congress (100 senators + 435 representatives)",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/problem/unrepresentative-democracy.html",
  manualPageTitle: "Unrepresentative Democracy",
};

export const US_DYSFUNCTION_PREMIUM_VS_SWITZERLAND: Parameter = {
  value: 3.0,
  parameterName: "US_DYSFUNCTION_PREMIUM_VS_SWITZERLAND",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_dysfunction_premium_vs_switzerland",
  unit: "percent",
  displayName: "US Dysfunction Premium vs Switzerland",
  description: "US 'dysfunction premium' vs Switzerland: US spends 3% more of GDP yet achieves 6.5 fewer years of life expectancy. This premium represents pure waste from governance inefficiency. Calculated as: 38% (US) - 35% (CH).",
  sourceType: "definition",
  sourceRef: "oecd-govt-spending",
  sourceUrl: "https://data.oecd.org/gga/general-government-spending.htm",
  confidence: "high",
  formula: "US_GOVT_SPENDING_PCT_GDP - SWITZERLAND_GOVT_SPENDING_PCT_GDP",
};

export const US_GOV_WASTE_OVERLAP_DISCOUNT: Parameter = {
  value: 1.0,
  parameterName: "US_GOV_WASTE_OVERLAP_DISCOUNT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_gov_waste_overlap_discount",
  unit: "ratio",
  displayName: "Overlap Discount Factor",
  description: "Overlap discount factor between US government waste categories. Set to 1.0 (no discount). Categories are treated as additive, recognizing that any overlap is offset by excluded categories (state/local inefficiency, implicit subsidies, behavioral effects).",
  sourceType: "definition",
  confidence: "high",
};

export const US_POLITICAL_EFFORT_MULTIPLIER: Parameter = {
  value: 0.7,
  parameterName: "US_POLITICAL_EFFORT_MULTIPLIER",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_political_effort_multiplier",
  unit: "multiplier",
  displayName: "Political Effort Multiplier (US)",
  description: "Fraction of campaign + lobbying spending needed to achieve policy reform. Accounts for efficiency gains from coordination, message clarity, and public interest alignment. Range 0.4-1.2 reflects uncertainty about political dynamics.",
  sourceType: "definition",
  confidence: "low",
  confidenceInterval: [0.4, 1.2],
};

export const US_VS_SINGAPORE_SPENDING_GAP: Parameter = {
  value: 23.0,
  parameterName: "US_VS_SINGAPORE_SPENDING_GAP",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_vs_singapore_spending_gap",
  unit: "percent",
  displayName: "US-Singapore Spending Gap",
  description: "Government spending gap: US spends 23 percentage points MORE of GDP than Singapore yet achieves 6.6 fewer years of life expectancy.",
  sourceType: "definition",
  sourceRef: "oecd-govt-spending",
  sourceUrl: "https://data.oecd.org/gga/general-government-spending.htm",
  confidence: "high",
  formula: "US_SPENDING - SINGAPORE_SPENDING = 38% - 15%",
};

export const US_VS_SWITZERLAND_LIFE_EXPECTANCY_GAP: Parameter = {
  value: 6.5,
  parameterName: "US_VS_SWITZERLAND_LIFE_EXPECTANCY_GAP",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_vs_switzerland_life_expectancy_gap",
  unit: "years",
  displayName: "Switzerland-US Life Expectancy Gap",
  description: "Life expectancy gap: Switzerland vs US. Switzerland achieves 6.5 extra years of life while spending 3% LESS of GDP on government.",
  sourceType: "definition",
  sourceRef: "who-life-expectancy",
  sourceUrl: "https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates/ghe-life-expectancy-and-healthy-life-expectancy",
  confidence: "high",
  formula: "SWITZERLAND_LE - US_LE = 84.0 - 77.5",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/optimocracy.html",
  manualPageTitle: "Optimocracy: The Evidence Machine",
};

export const US_VS_SWITZERLAND_SPENDING_GAP: Parameter = {
  value: 3.0,
  parameterName: "US_VS_SWITZERLAND_SPENDING_GAP",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-us_vs_switzerland_spending_gap",
  unit: "percent",
  displayName: "US-Switzerland Spending Gap",
  description: "Government spending gap: US spends 3 percentage points MORE of GDP than Switzerland yet achieves worse outcomes.",
  sourceType: "definition",
  sourceRef: "oecd-govt-spending",
  sourceUrl: "https://data.oecd.org/gga/general-government-spending.htm",
  confidence: "high",
  formula: "US_SPENDING - SWITZERLAND_SPENDING = 38% - 35%",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/solution/optimocracy.html",
  manualPageTitle: "Optimocracy: The Evidence Machine",
};

export const VICTORY_BOND_FUNDING_PCT: Parameter = {
  value: 0.1,
  parameterName: "VICTORY_BOND_FUNDING_PCT",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-victory_bond_funding_pct",
  unit: "rate",
  displayName: "Percentage of Captured Dividend Funding VICTORY Incentive Alignment Bonds",
  description: "Percentage of captured dividend funding VICTORY Incentive Alignment Bonds (10%)",
  sourceType: "definition",
  confidence: "high",
  manualPageUrl: "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-protocol-v1.html",
  manualPageTitle: "Earth Optimization Protocol v1",
};

export const _CASCADE_GENERATIONS: Parameter = {
  value: 3.0,
  parameterName: "_CASCADE_GENERATIONS",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-_cascade_generations",
};

export const _R0: Parameter = {
  value: 0.15,
  parameterName: "_R0",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-_r0",
};

export const _SOCIAL_NETWORK_POP: Parameter = {
  value: 5000000000.0,
  parameterName: "_SOCIAL_NETWORK_POP",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-_social_network_pop",
};

export const _US_BASE_POLITICAL_SPENDING: Parameter = {
  value: 28800000000.0,
  parameterName: "_US_BASE_POLITICAL_SPENDING",
  calculationsUrl: "https://manual.WarOnDisease.org/calculations.html#sec-_us_base_political_spending",
};

// ============================================================================
// All Parameters (for iteration)
// ============================================================================

export const parameters = {
  ADAPTABLE_TRIAL_COST_PER_PATIENT,
  ADAPTABLE_TRIAL_TOTAL_COST,
  ANTIDEPRESSANT_TRIAL_EXCLUSION_RATE,
  AVERAGE_MARKET_RETURN_PCT,
  BASELINE_LIVES_SAVED_ANNUAL,
  BED_NETS_COST_PER_DALY,
  CAREGIVER_ANNUAL_VALUE_TOTAL,
  CAREGIVER_COUNT_US,
  CAREGIVER_HOURS_PER_MONTH,
  CAREGIVER_VALUE_PER_HOUR_SIMPLE,
  CHAIN_GLOBAL_BILLIONAIRE_COUNT,
  CHILDHOOD_VACCINATION_ANNUAL_BENEFIT,
  CHILDHOOD_VACCINATION_ROI,
  CHRONIC_DISEASE_DISABILITY_WEIGHT,
  CONVENTIONAL_RETIREMENT_RETURN,
  CPI_MULTIPLIER_1980_TO_2024,
  CROWD_DECISION_ACCURACY,
  CURRENT_ACTIVE_TRIALS,
  CURRENT_CLINICAL_TRIAL_PARTICIPATION_RATE,
  CURRENT_DISEASE_PATIENTS_GLOBAL,
  CURRENT_DRUG_APPROVALS_PER_YEAR,
  CURRENT_TRIALS_PER_YEAR,
  CURRENT_TRIAL_ABANDONMENT_RATE,
  CURRENT_TRIAL_SLOTS_AVAILABLE,
  DEFENSE_LOBBYING_ANNUAL,
  DEMOCIDE_TOTAL_20TH_CENTURY,
  DEWORMING_COST_PER_DALY,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  DISEASE_BURDEN_GDP_DRAG_PCT,
  DOT_VALUE_OF_STATISTICAL_LIFE,
  DRUG_DEVELOPMENT_COST_1980S,
  DRUG_DISCOVERY_TO_APPROVAL_YEARS,
  DRUG_REPURPOSING_SUCCESS_RATE,
  ECONOMIC_MULTIPLIER_EDUCATION_INVESTMENT,
  ECONOMIC_MULTIPLIER_HEALTHCARE_INVESTMENT,
  ECONOMIC_MULTIPLIER_INFRASTRUCTURE_INVESTMENT,
  ECONOMIC_MULTIPLIER_MILITARY_SPENDING,
  EFFICACY_LAG_YEARS,
  EXPERT_DECISION_ACCURACY,
  FDA_APPROVED_PRODUCTS_COUNT,
  FDA_APPROVED_UNIQUE_ACTIVE_INGREDIENTS,
  FDA_GRAS_SUBSTANCES_COUNT,
  FDA_PHASE_1_TO_APPROVAL_YEARS,
  GIVEWELL_COST_PER_LIFE_AVG,
  GIVEWELL_COST_PER_LIFE_MAX,
  GIVEWELL_COST_PER_LIFE_MIN,
  GLOBAL_ANNUAL_CONFLICT_DEATHS_ACTIVE_COMBAT,
  GLOBAL_ANNUAL_CONFLICT_DEATHS_STATE_VIOLENCE,
  GLOBAL_ANNUAL_CONFLICT_DEATHS_TERROR_ATTACKS,
  GLOBAL_ANNUAL_DALY_BURDEN,
  GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES,
  GLOBAL_ANNUAL_ENVIRONMENTAL_DAMAGE_CONFLICT,
  GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_COMMUNICATIONS_CONFLICT,
  GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_EDUCATION_CONFLICT,
  GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_ENERGY_CONFLICT,
  GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_HEALTHCARE_CONFLICT,
  GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_TRANSPORTATION_CONFLICT,
  GLOBAL_ANNUAL_INFRASTRUCTURE_DAMAGE_WATER_CONFLICT,
  GLOBAL_ANNUAL_LIVES_SAVED_BY_MED_RESEARCH,
  GLOBAL_ANNUAL_LOST_ECONOMIC_GROWTH_MILITARY_SPENDING,
  GLOBAL_ANNUAL_LOST_HUMAN_CAPITAL_CONFLICT,
  GLOBAL_ANNUAL_PSYCHOLOGICAL_IMPACT_COSTS_CONFLICT,
  GLOBAL_ANNUAL_REFUGEE_SUPPORT_COSTS,
  GLOBAL_ANNUAL_TRADE_DISRUPTION_CURRENCY_CONFLICT,
  GLOBAL_ANNUAL_TRADE_DISRUPTION_ENERGY_PRICE_CONFLICT,
  GLOBAL_ANNUAL_TRADE_DISRUPTION_SHIPPING_CONFLICT,
  GLOBAL_ANNUAL_TRADE_DISRUPTION_SUPPLY_CHAIN_CONFLICT,
  GLOBAL_ANNUAL_VETERAN_HEALTHCARE_COSTS,
  GLOBAL_CHRONIC_THERAPY_DAYS_ANNUAL,
  GLOBAL_CLINICAL_TRIALS_SPENDING_ANNUAL,
  GLOBAL_CYBERCRIME_CAGR,
  GLOBAL_CYBERCRIME_COST_ANNUAL_2025,
  GLOBAL_DISEASE_DEATHS_DAILY,
  GLOBAL_DISEASE_DIRECT_MEDICAL_COST_ANNUAL,
  GLOBAL_DISEASE_PRODUCTIVITY_LOSS_ANNUAL,
  GLOBAL_GDP_2025,
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
  GLOBAL_HALE_CURRENT,
  GLOBAL_HOUSEHOLD_WEALTH_USD,
  GLOBAL_INVESTABLE_ASSETS,
  GLOBAL_LIFE_EXPECTANCY_2024,
  GLOBAL_MEDIAN_AGE_2024,
  GLOBAL_MED_RESEARCH_SPENDING,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  GLOBAL_MILITARY_SPENDING_REAL_CAGR_10YR,
  GLOBAL_NONPROFIT_CLINICAL_TRIALS_SPENDING_ANNUAL,
  GLOBAL_PHARMA_RD_SPENDING_ANNUAL,
  GLOBAL_POPULATION_2024,
  GLOBAL_POPULATION_2040_PROJECTED,
  GLOBAL_POPULATION_2045_PROJECTED,
  GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT,
  GLOBAL_RETIREMENT_ASSETS,
  GLOBAL_SAVINGS_RATE_PCT,
  GLOBAL_SYMPTOMATIC_DISEASE_TREATMENT_ANNUAL,
  GLOBAL_YLD_PROPORTION_OF_DALYS,
  HOME_BIAS_ALPHA,
  HUMAN_GENOME_PROJECT_TOTAL_ECONOMIC_IMPACT,
  HUMAN_INTERACTOME_TARGETED_PCT,
  ICD_10_TOTAL_CODES,
  LIFE_EXTENSION_YEARS,
  LOBBYIST_SALARY_MAX,
  LOBBYIST_SALARY_MIN_K,
  MEASLES_VACCINATION_ROI,
  MEDICAL_QALY_THRESHOLD,
  MENTAL_HEALTH_PRODUCTIVITY_LOSS_PER_CAPITA,
  NATO_DEFENSE_SPENDING_ANNUAL,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  NIH_ANNUAL_BUDGET,
  NIH_CLINICAL_TRIALS_SPENDING_PCT,
  NIH_STANDARD_RESEARCH_COST_PER_QALY,
  OXFORD_RECOVERY_TRIAL_DURATION_MONTHS,
  PATIENT_WILLINGNESS_TRIAL_PARTICIPATION_PCT,
  PHARMA_DRUG_DEVELOPMENT_COST_CURRENT,
  PHARMA_DRUG_REVENUE_AVERAGE_CURRENT,
  PHARMA_LIFE_YEARS_SAVED_ANNUAL,
  PHARMA_ROI_CURRENT_SYSTEM_PCT,
  PHARMA_SUCCESS_RATE_CURRENT_PCT,
  PHASE_1_PASSED_COMPOUNDS_GLOBAL,
  PHASE_1_SAFETY_DURATION_YEARS,
  PHASE_2_3_CLINICAL_TRIAL_COST_PCT,
  PHASE_3_TRIAL_COST_MIN,
  PMC_PRAGMATIC_TRIAL_MEDIAN_COST_PER_PATIENT,
  POLIO_VACCINATION_ROI,
  POLITICAL_DYSFUNCTION_GLOBAL_FOSSIL_FUEL_SUBSIDIES,
  POLITICAL_DYSFUNCTION_GLOBAL_HEALTH_OPPORTUNITY_COST,
  POLITICAL_DYSFUNCTION_GLOBAL_LEAD_OPPORTUNITY_COST,
  POLITICAL_DYSFUNCTION_GLOBAL_MIGRATION_OPPORTUNITY_COST,
  POLITICAL_DYSFUNCTION_GLOBAL_SCIENCE_OPPORTUNITY_COST,
  POLITICAL_SUCCESS_PROBABILITY,
  POLITICIAN_POST_OFFICE_CAREER_VALUE,
  POST_1962_DRUG_APPROVAL_REDUCTION_PCT,
  PRE_1962_DRUG_DEVELOPMENT_COST_1980_USD,
  PRE_1962_DRUG_DEVELOPMENT_COST_2024_USD,
  PRE_1962_PHYSICIAN_COUNT,
  RARE_DISEASES_COUNT_GLOBAL,
  RECOVERY_TRIAL_COST_PER_PATIENT,
  RECOVERY_TRIAL_GLOBAL_LIVES_SAVED,
  RECOVERY_TRIAL_TOTAL_COST,
  REGULATORY_DELAY_MEAN_AGE_OF_DEATH,
  REGULATORY_DELAY_SUFFERING_PERIOD_YEARS,
  SEPT_11_DEATHS,
  SINGAPORE_GDP_PER_CAPITA_PPP,
  SINGAPORE_GOVT_SPENDING_PCT_GDP,
  SINGAPORE_LIFE_EXPECTANCY,
  SMALLPOX_ERADICATION_ROI,
  SMALLPOX_ERADICATION_TOTAL_BENEFIT,
  SMOKING_CESSATION_ANNUAL_BENEFIT,
  STANDARD_ECONOMIC_QALY_VALUE_USD,
  STANDARD_QALYS_PER_LIFE_SAVED,
  SUGAR_SUBSIDY_COST_PER_PERSON_ANNUAL,
  SWITZERLAND_DEFENSE_SPENDING_PCT,
  SWITZERLAND_GDP_PER_CAPITA_K,
  SWITZERLAND_GOVT_SPENDING_PCT_GDP,
  SWITZERLAND_LIFE_EXPECTANCY,
  SWITZERLAND_MEDIAN_INCOME_PPP,
  TERRORISM_DEATHS_911,
  THALIDOMIDE_CASES_WORLDWIDE,
  THALIDOMIDE_DISABILITY_WEIGHT,
  THALIDOMIDE_MORTALITY_RATE,
  THALIDOMIDE_SURVIVOR_LIFESPAN,
  THALIDOMIDE_US_POPULATION_SHARE_1960,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  TREATMENT_DISABILITY_REDUCTION,
  US_ALZHEIMERS_ANNUAL_COST,
  US_CANCER_ANNUAL_COST,
  US_CHRONIC_DISEASE_SPENDING_ANNUAL,
  US_DIABETES_ANNUAL_COST,
  US_FEDERAL_SPENDING_2024,
  US_FED_DISCRETIONARY_SPENDING_2024,
  US_GDP_2024,
  US_GOVT_SPENDING_PCT_GDP,
  US_GOV_WASTE_AGRICULTURAL_SUBSIDIES,
  US_GOV_WASTE_CORPORATE_WELFARE,
  US_GOV_WASTE_DRUG_WAR,
  US_GOV_WASTE_FOSSIL_FUEL_SUBSIDIES,
  US_GOV_WASTE_HEALTHCARE_INEFFICIENCY,
  US_GOV_WASTE_HOUSING_ZONING,
  US_GOV_WASTE_MILITARY_OVERSPEND,
  US_GOV_WASTE_REGULATORY_RED_TAPE,
  US_GOV_WASTE_TARIFFS,
  US_GOV_WASTE_TAX_COMPLIANCE,
  US_HEART_DISEASE_ANNUAL_COST,
  US_LIFE_EXPECTANCY_1880,
  US_LIFE_EXPECTANCY_1962,
  US_LIFE_EXPECTANCY_2019,
  US_LIFE_EXPECTANCY_2023,
  US_MEDIAN_HOUSEHOLD_INCOME_2023,
  US_MENTAL_HEALTH_COST_ANNUAL,
  US_MILITARY_SPENDING_1939_ANNUAL_2024USD,
  US_MILITARY_SPENDING_1945_PEAK_ANNUAL_2024USD,
  US_MILITARY_SPENDING_1947_ANNUAL_2024USD,
  US_MILITARY_SPENDING_2024_ANNUAL,
  US_MILITARY_SPENDING_PCT_GDP,
  US_POPULATION_2024,
  US_SENATORS_FOR_TREATY,
  US_TOTAL_FEDERAL_CAMPAIGN_SPENDING_2024,
  US_TOTAL_LOBBYING_ANNUAL,
  US_VOTE_DECISIVE_PROBABILITY,
  VALLEY_OF_DEATH_ATTRITION_PCT,
  VALUE_OF_STATISTICAL_LIFE,
  VENTURE_GROSS_RETURN,
  VITAMIN_A_COST_PER_DALY,
  WATER_FLUORIDATION_ANNUAL_BENEFIT,
  WATER_FLUORIDATION_ROI,
  WHO_QALY_THRESHOLD_COST_EFFECTIVE,
  WORKFORCE_WITH_PRODUCTIVITY_LOSS,
  ADDITIONAL_DRUGS_FROM_COST_ELIMINATION,
  CELL_THERAPY_DISEASE_COMBINATIONS,
  CHAIN_ENGAGE_PROBABILITY,
  CHAIN_EXPECTED_ENGAGED_IMPLEMENTERS,
  CHAIN_IMPLEMENTER_COUNT,
  CHAIN_P_AT_LEAST_ONE_ENGAGES,
  CHAIN_P_ENCOUNTER_DIRECT_10YR,
  CHAIN_P_NO_IMPLEMENTER_ENGAGES,
  CHRONIC_DISEASE_TREATED_PATIENTS_ANNUAL,
  CLINICAL_TRIAL_COST_PER_APPROVED_DRUG,
  CLINICAL_TRIAL_COST_PER_PARTICIPANT_ANNUAL,
  COMBINATION_THERAPY_DISEASE_SPACE,
  COMBINATION_THERAPY_PAIRS,
  CONTRIBUTION_DALYS_PER_PCT_POINT,
  CONTRIBUTION_EV_PER_PCT_POINT_TREATY,
  CONTRIBUTION_EV_PER_PCT_POINT_TREATY_BLEND,
  CONTRIBUTION_EV_PER_PCT_POINT_WISHONIA,
  CONTRIBUTION_EV_PER_PCT_POINT_WISHONIA_BLEND,
  CONTRIBUTION_LIVES_SAVED_PER_PCT_POINT,
  CONTRIBUTION_SUFFERING_HOURS_PER_PCT_POINT,
  CONVENTIONAL_RETIREMENT_HORIZON_MULTIPLE,
  CURRENT_COMBINATION_EXPLORATION_YEARS,
  CURRENT_KNOWN_SAFE_EXPLORATION_YEARS,
  CURRENT_PATIENT_PARTICIPATION_RATE,
  CURRENT_TOTAL_EXPLORATION_YEARS,
  CURRENT_TRAJECTORY_AVG_INCOME_YEAR_15,
  CURRENT_TRAJECTORY_AVG_INCOME_YEAR_20,
  CURRENT_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME,
  CURRENT_TRAJECTORY_GDP_YEAR_15,
  CURRENT_TRAJECTORY_GDP_YEAR_20,
  DESTRUCTIVE_ECONOMY_25PCT_YEAR,
  DESTRUCTIVE_ECONOMY_35PCT_YEAR,
  DESTRUCTIVE_ECONOMY_50PCT_YEAR,
  DFDA_ANNUAL_OPEX,
  DFDA_BENEFIT_RD_ONLY_ANNUAL,
  DFDA_COMBINED_TREATMENT_SPEEDUP_MULTIPLIER,
  DFDA_DIRECT_FUNDING_COST_PER_DALY,
  DFDA_DIRECT_FUNDING_QUEUE_CLEARANCE_NPV,
  DFDA_DIRECT_FUNDING_ROI_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
  DFDA_DIRECT_FUNDING_VS_BED_NETS_MULTIPLIER,
  DFDA_EFFICACY_LAG_ELIMINATION_DALYS,
  DFDA_EFFICACY_LAG_ELIMINATION_DEATHS_AVERTED,
  DFDA_EFFICACY_LAG_ELIMINATION_ECONOMIC_VALUE,
  DFDA_EFFICACY_LAG_ELIMINATION_YLD,
  DFDA_EFFICACY_LAG_ELIMINATION_YLL,
  DFDA_FIRST_TREATMENTS_PER_YEAR,
  DFDA_KNOWN_SAFE_EXPLORATION_YEARS,
  DFDA_MAX_TRIAL_CAPACITY_MULTIPLIER_PHYSICAL,
  DFDA_NET_SAVINGS_RD_ONLY_ANNUAL,
  DFDA_NPV_ANNUAL_OPEX_TOTAL,
  DFDA_NPV_BENEFIT_RD_ONLY,
  DFDA_NPV_NET_BENEFIT_RD_ONLY,
  DFDA_NPV_PV_ANNUAL_OPEX,
  DFDA_NPV_TOTAL_COST,
  DFDA_NPV_UPFRONT_COST_TOTAL,
  DFDA_OPEX_PCT_OF_TREATY_FUNDING,
  DFDA_PATIENTS_FUNDABLE_ANNUALLY,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_RD_SAVINGS_DAILY,
  DFDA_ROI_RD_ONLY,
  DFDA_STORAGE_COST_TOTAL_PER_PATIENT_ANNUAL,
  DFDA_STORAGE_COST_TOTAL_PER_PATIENT_MONTHLY,
  DFDA_TOTAL_EXPLORATION_YEARS,
  DFDA_TRIALS_PER_YEAR_CAPACITY,
  DFDA_TRIAL_CAPACITY_DALYS_AVERTED,
  DFDA_TRIAL_CAPACITY_ECONOMIC_VALUE,
  DFDA_TRIAL_CAPACITY_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS,
  DFDA_TRIAL_COST_REDUCTION_FACTOR,
  DFDA_TRIAL_COST_REDUCTION_PCT,
  DFDA_TRIAL_SUBSIDIES_ANNUAL,
  DFDA_VALLEY_OF_DEATH_RESCUE_MULTIPLIER,
  DIH_PATIENTS_FUNDABLE_ANNUALLY,
  DIH_TREASURY_MEDICAL_RESEARCH_PCT,
  DIH_TREASURY_TO_MEDICAL_RESEARCH_ANNUAL,
  DIH_TREASURY_TRIAL_SUBSIDIES_ANNUAL,
  DIH_TREASURY_TRIAL_SUBSIDIES_PCT,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  DISEASE_VS_TERRORISM_DEATHS_RATIO,
  DISEASE_VS_WAR_DEATHS_RATIO,
  DIVIDEND_COVERAGE_FACTOR,
  DRUGS_APPROVED_SINCE_1962,
  DRUG_COST_INCREASE_1980S_TO_CURRENT_MULTIPLIER,
  DRUG_COST_INCREASE_PRE1962_TO_CURRENT_MULTIPLIER,
  DRUG_DISEASE_COMBINATIONS_POSSIBLE,
  EFFICACY_LAG_CUMULATIVE_EXCESS_COST,
  EFFICACY_LAG_DEATHS_911_EQUIVALENTS,
  EFFICACY_LAG_TREATMENT_DELAY_YLD_ANNUAL,
  EMERGING_MODALITY_COMBINATIONS,
  EPIGENETIC_DISEASE_COMBINATIONS,
  EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL,
  EXISTING_DRUGS_EFFICACY_LAG_ECONOMIC_LOSS,
  EXPLORATION_RATIO,
  FDA_TO_OXFORD_RECOVERY_TRIAL_TIME_MULTIPLIER,
  GENE_THERAPY_DISEASE_COMBINATIONS,
  GLOBAL_ANNUAL_CONFLICT_DEATHS_TOTAL,
  GLOBAL_ANNUAL_DIRECT_INDIRECT_WAR_COST,
  GLOBAL_ANNUAL_HUMAN_COST_ACTIVE_COMBAT,
  GLOBAL_ANNUAL_HUMAN_COST_STATE_VIOLENCE,
  GLOBAL_ANNUAL_HUMAN_COST_TERROR_ATTACKS,
  GLOBAL_ANNUAL_HUMAN_LIFE_LOSSES_CONFLICT,
  GLOBAL_ANNUAL_INFRASTRUCTURE_DESTRUCTION_CONFLICT,
  GLOBAL_ANNUAL_SAVINGS,
  GLOBAL_ANNUAL_SAVINGS_PER_CAPITA,
  GLOBAL_ANNUAL_TRADE_DISRUPTION_CONFLICT,
  GLOBAL_ANNUAL_WAR_DIRECT_COSTS_TOTAL,
  GLOBAL_ANNUAL_WAR_INDIRECT_COSTS_TOTAL,
  GLOBAL_AVG_HOURLY_INCOME,
  GLOBAL_AVG_INCOME_2025,
  GLOBAL_AVG_REMAINING_YEARS,
  GLOBAL_COORDINATION_ACTIVATION_BUDGET,
  GLOBAL_COORDINATION_ACTIVATION_COST_PER_PARTICIPANT,
  GLOBAL_COORDINATION_TARGET_SUPPORTERS,
  GLOBAL_COST_PER_LIFE_SAVED_MED_RESEARCH_ANNUAL,
  GLOBAL_DESTRUCTIVE_ECONOMY_ANNUAL_2025,
  GLOBAL_DESTRUCTIVE_ECONOMY_PCT_GDP,
  GLOBAL_DISEASE_DEATHS_PER_MINUTE,
  GLOBAL_DISEASE_ECONOMIC_BURDEN_ANNUAL,
  GLOBAL_HALE_GAP,
  GLOBAL_INDUSTRY_CLINICAL_TRIALS_SPENDING_ANNUAL,
  GLOBAL_MILITARY_SPENDING_PER_CAPITA_ANNUAL,
  GLOBAL_MILITARY_SPENDING_POST_TREATY_ANNUAL_2024,
  GLOBAL_POLITICAL_REFORM_INVESTMENT,
  GLOBAL_TOTAL_HEALTH_AND_WAR_COST_ANNUAL,
  HEALTHCARE_VS_MILITARY_MULTIPLIER_RATIO,
  IAB_MECHANISM_BENEFIT_COST_RATIO,
  IAB_POLITICAL_INCENTIVE_FUNDING_ANNUAL,
  IAB_VS_DEFENSE_LOBBY_RATIO_AT_1PCT,
  INDUSTRY_VS_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  LIFE_EXPECTANCY_GAIN_1883_1962_YEARS_PER_DECADE,
  LIFE_EXPECTANCY_GAIN_1962_2019_YEARS_PER_DECADE,
  MEDICAL_RESEARCH_PCT_OF_DISEASE_BURDEN,
  MILITARY_TO_CLINICAL_TRIALS_SPENDING_RATIO,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  MILITARY_VS_MEDICAL_RESEARCH_RATIO,
  MISALLOCATION_FACTOR_DEATH_VS_SAVING,
  MRNA_THERAPEUTIC_COMBINATIONS,
  NIH_TRADITIONAL_TRIAL_MAX_EFFICIENCY_PCT,
  PEACE_DIVIDEND_ANNUAL_SOCIETAL_BENEFIT,
  PEACE_DIVIDEND_CONFLICT_REDUCTION,
  PEACE_DIVIDEND_DIRECT_COSTS,
  PEACE_DIVIDEND_ENVIRONMENTAL,
  PEACE_DIVIDEND_HUMAN_CASUALTIES,
  PEACE_DIVIDEND_INDIRECT_COSTS,
  PEACE_DIVIDEND_INFRASTRUCTURE,
  PEACE_DIVIDEND_LOST_ECONOMIC_GROWTH,
  PEACE_DIVIDEND_LOST_HUMAN_CAPITAL,
  PEACE_DIVIDEND_PTSD,
  PEACE_DIVIDEND_REFUGEE_SUPPORT,
  PEACE_DIVIDEND_TRADE_DISRUPTION,
  PEACE_DIVIDEND_VETERAN_HEALTHCARE,
  PEACE_TRAJECTORY_TOTAL_DIFFERENTIAL_20YR,
  PERSONAL_LIFETIME_WEALTH,
  PER_CAPITA_CHRONIC_DISEASE_COST,
  PER_CAPITA_MENTAL_HEALTH_COST,
  PHARMA_LIVES_SAVED_ANNUAL,
  POLITICAL_DYSFUNCTION_GLOBAL_EFFICIENCY_SCORE,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_PCT_GDP,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  POLITICAL_DYSFUNCTION_GLOBAL_REALIZED_WELFARE_ADJUSTED,
  POLITICAL_DYSFUNCTION_GLOBAL_THEORETICAL_MAX_WELFARE,
  POLITICAL_DYSFUNCTION_GLOBAL_WASTE_TOTAL,
  POLITICAL_DYSFUNCTION_TAX_PER_HOUSEHOLD_OF_FOUR_ANNUAL,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  POST_WW2_MILITARY_CUT_PCT,
  PRAGMATIC_TRIAL_COST_PER_QALY,
  PRIZE_POOL_ANNUAL_RETURN,
  PRIZE_POOL_HORIZON_MULTIPLE,
  PRIZE_POOL_RETIREMENT_EQUIVALENT_PRINCIPAL,
  PRIZE_POOL_SIZE,
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  RECOVERY_TRIAL_TOTAL_QALYS_GENERATED,
  RETIREMENT_EQUIVALENT_2_CLAIMS_TARGET_PAYOUT,
  RETIREMENT_EQUIVALENT_CLAIM_VALUE_TARGET,
  SHARING_BREAKEVEN_ONE_IN_TREATY,
  SHARING_BREAKEVEN_PROBABILITY_TREATY,
  SHARING_OPPORTUNITY_COST,
  SHARING_UPSIDE_DOWNSIDE_RATIO_TREATY,
  STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  THALIDOMIDE_DALYS_PER_EVENT,
  THALIDOMIDE_DEATHS_PER_EVENT,
  THALIDOMIDE_SURVIVORS_PER_EVENT,
  THALIDOMIDE_US_CASES_PREVENTED,
  THALIDOMIDE_YLD_PER_EVENT,
  THALIDOMIDE_YLL_PER_EVENT,
  TOTAL_RESEARCH_FUNDING_WITH_TREATY,
  TOTAL_TESTABLE_THERAPEUTIC_COMBINATIONS,
  TREATY_ANNUAL_FUNDING,
  TREATY_BENEFIT_MULTIPLIER_VS_VACCINES,
  TREATY_CAMPAIGN_ANNUAL_COST_AMORTIZED,
  TREATY_CAMPAIGN_TOTAL_COST,
  TREATY_CAMPAIGN_VOTING_BLOC_TARGET,
  TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
  TREATY_CUMULATIVE_20YR_WITH_RATCHET,
  TREATY_DISEASE_CURE_FRACTION_15YR,
  TREATY_EXPECTED_COST_PER_DALY,
  TREATY_EXPECTED_ROI_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
  TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER,
  TREATY_HALE_GAIN_YEAR_15,
  TREATY_HALE_VALUE_PER_CAPITA,
  TREATY_LIVES_SAVED_ANNUAL_GLOBAL,
  TREATY_PEACE_PLUS_RD_ANNUAL_BENEFITS,
  TREATY_PERSONAL_UPSIDE_BLEND,
  TREATY_PROJECTED_HALE_YEAR_15,
  TREATY_QALYS_GAINED_ANNUAL_GLOBAL,
  TREATY_RATCHET_MULTIPLIER_20YR,
  TREATY_RATCHET_PREMIUM_20YR,
  TREATY_ROI_EXISTING_DRUGS_ONLY,
  TREATY_ROI_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
  TREATY_TOTAL_ANNUAL_COSTS,
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_15,
  TREATY_TRAJECTORY_AVG_INCOME_YEAR_20,
  TREATY_TRAJECTORY_CAGR_YEAR_20,
  TREATY_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME,
  TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15,
  TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20,
  TREATY_TRAJECTORY_GDP_YEAR_15,
  TREATY_TRAJECTORY_GDP_YEAR_20,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  TREATY_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER,
  TREATY_VS_BED_NETS_MULTIPLIER,
  TREATY_VS_DIRECT_FUNDING_LEVERAGE,
  TRIAL_CAPACITY_CUMULATIVE_YEARS_20YR,
  TYPE_II_ERROR_COST_RATIO,
  TYPE_I_ERROR_BENEFIT_DALYS,
  UNEXPLORED_RATIO,
  US_CONGRESS_FULL_ADVOCACY_COST,
  US_FEDERAL_SPENDING_PER_CAPITA,
  US_FED_DISCRETIONARY_EFFICIENCY,
  US_FED_DISCRETIONARY_WASTE_PCT,
  US_GOVERNANCE_EFFICIENCY_GDP,
  US_GOV_WASTE_CATEGORY_1_DIRECT_SPENDING,
  US_GOV_WASTE_CATEGORY_2_COMPLIANCE,
  US_GOV_WASTE_CATEGORY_3_GDP_LOSS,
  US_GOV_WASTE_CATEGORY_4_SYSTEM,
  US_GOV_WASTE_PCT_GDP,
  US_GOV_WASTE_QALY_EQUIVALENTS,
  US_GOV_WASTE_RAW_TOTAL,
  US_GOV_WASTE_RECOVERABLE,
  US_GOV_WASTE_TOTAL,
  US_GOV_WASTE_VSL_EQUIVALENTS,
  US_GOV_WASTE_VS_TREATY_MULTIPLIER,
  US_MAJOR_DISEASES_TOTAL_ANNUAL_COST,
  US_MILITARY_SPENDING_CURRENT_VS_PREWAR_MULTIPLIER,
  US_POLITICAL_REFORM_INVESTMENT_TOTAL,
  US_SENATE_TREATY_ADVOCACY_COST,
  US_VOTE_EXPECTED_VALUE,
  VICTORY_BOND_ANNUAL_PAYOUT,
  VICTORY_BOND_ANNUAL_RETURN_PCT,
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
  VOTE_2_CLAIMS_PAYOUT,
  VOTE_TOKEN_VALUE,
  WAR_COSTS_CUMULATIVE_20YR_CURRENT_TRAJECTORY,
  WAR_COSTS_SAVED_PEACE_TRAJECTORY_20YR,
  WILLING_TRIAL_PARTICIPANTS_GLOBAL,
  WISHOCRATIC_CROWD_ALPHA,
  WISHONIA_DISEASE_CURE_FRACTION_15YR,
  WISHONIA_DISEASE_CURE_FRACTION_20YR_FULL,
  WISHONIA_HALE_GAIN_YEAR_15,
  WISHONIA_HALE_VALUE_PER_CAPITA,
  WISHONIA_MILITARY_REALLOCATION_PHYSICAL_MAX_SHARE,
  WISHONIA_PERSONAL_UPSIDE_BLEND,
  WISHONIA_PROJECTED_HALE_YEAR_15,
  WISHONIA_TRAJECTORY_AVG_INCOME_YEAR_15,
  WISHONIA_TRAJECTORY_AVG_INCOME_YEAR_20,
  WISHONIA_TRAJECTORY_CAGR_YEAR_20,
  WISHONIA_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME,
  WISHONIA_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15,
  WISHONIA_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_20,
  WISHONIA_TRAJECTORY_GDP_YEAR_15,
  WISHONIA_TRAJECTORY_GDP_YEAR_20,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_MULTIPLIER,
  WISHONIA_TRAJECTORY_VS_TREATY_TRAJECTORY_GDP_MULTIPLIER_YEAR_20,
  ADAPTABLE_TRIAL_PATIENTS,
  ALLOCATION_DECISION_SPREAD,
  ANNUAL_WORKING_HOURS,
  APPROVED_DRUG_DISEASE_PAIRINGS,
  AVG_LIFE_EXTENSION_PER_BENEFICIARY,
  CAMPAIGN_CELEBRITY_ENDORSEMENT,
  CAMPAIGN_COMMUNITY_ORGANIZING,
  CAMPAIGN_CONTINGENCY,
  CAMPAIGN_DEFENSE_CONVERSION,
  CAMPAIGN_DEFENSE_LOBBYIST_BUDGET,
  CAMPAIGN_HEALTHCARE_ALIGNMENT,
  CAMPAIGN_INFRASTRUCTURE,
  CAMPAIGN_LEGAL_AI_BUDGET,
  CAMPAIGN_LEGAL_DEFENSE,
  CAMPAIGN_LEGAL_WORK,
  CAMPAIGN_LOBBYING_EU,
  CAMPAIGN_LOBBYING_G20_MILLIONS,
  CAMPAIGN_LOBBYING_US,
  CAMPAIGN_MEDIA_BUDGET_MAX,
  CAMPAIGN_MEDIA_BUDGET_MIN,
  CAMPAIGN_OPPOSITION_RESEARCH,
  CAMPAIGN_PHASE1_BUDGET,
  CAMPAIGN_PHASE2_BUDGET,
  CAMPAIGN_PILOT_PROGRAMS,
  CAMPAIGN_PLATFORM_DEVELOPMENT,
  CAMPAIGN_REGULATORY_NAVIGATION,
  CAMPAIGN_SCALING_PREP,
  CAMPAIGN_STAFF_BUDGET,
  CAMPAIGN_SUPER_PAC_BUDGET,
  CAMPAIGN_TECH_PARTNERSHIPS,
  CAMPAIGN_TREATY_IMPLEMENTATION,
  CAMPAIGN_VIRAL_CONTENT_BUDGET,
  CAREGIVER_COST_ANNUAL,
  CELL_THERAPY_APPROACHES,
  CHAIN_DISMISS_PROBABILITY,
  CHAIN_EFFECTIVE_R,
  CHAIN_HORIZON_YEARS,
  CHAIN_IMPLEMENTER_ORBIT_SIZE,
  CHAIN_INITIAL_AUDIENCE,
  CHAIN_WORLD_LEADER_COUNT,
  CHILDHOOD_VACCINATION_COST_PER_DALY,
  CONCENTRATED_INTEREST_SECTOR_MARKET_CAP_USD,
  CUMULATIVE_MILITARY_SPENDING_ALL_HISTORY,
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  DAYS_PER_YEAR,
  DCT_PLATFORM_FUNDING_MEDIUM,
  DEFENSE_SECTOR_RETENTION_PCT,
  DESTRUCTIVE_ECONOMY_BASE_YEAR,
  DFDA_ANNUAL_TRIAL_FUNDING,
  DFDA_NPV_ADOPTION_RAMP_YEARS,
  DFDA_NPV_ANNUAL_OPEX,
  DFDA_NPV_UPFRONT_COST,
  DFDA_OBSERVATIONAL_COST_PER_PATIENT,
  DFDA_OPEX_COMMUNITY,
  DFDA_OPEX_INFRASTRUCTURE,
  DFDA_OPEX_PLATFORM_MAINTENANCE,
  DFDA_OPEX_REGULATORY,
  DFDA_OPEX_STAFF,
  DFDA_STORAGE_COST_BACKUP_PER_PATIENT_MONTHLY,
  DFDA_STORAGE_COST_COMPUTE_PER_PATIENT_MONTHLY,
  DFDA_STORAGE_COST_DATABASE_PER_PATIENT_MONTHLY,
  DFDA_STORAGE_COST_RAW_PER_PATIENT_MONTHLY,
  DFDA_TARGET_COST_PER_PATIENT_USD,
  DFDA_UPFRONT_BUILD,
  DFDA_UPFRONT_BUILD_MAX,
  DIH_NPV_ANNUAL_OPEX_INITIATIVES,
  DIH_NPV_UPFRONT_COST_INITIATIVES,
  DISEASE_RELATED_CAREGIVER_PCT,
  EPIGENETIC_TARGETS_COUNT,
  EVENTUALLY_AVOIDABLE_DALY_PCT,
  EVENTUALLY_AVOIDABLE_DEATH_PCT,
  FAMILY_OFFICE_INVESTMENT_MIN,
  FUNDAMENTALLY_UNAVOIDABLE_DEATH_PCT,
  GDP_BASELINE_GROWTH_RATE,
  GLOBAL_COORDINATION_ACTIVATION_REWARD_PER_VERIFIED_PARTICIPANT,
  GLOBAL_COORDINATION_PLATFORM_AND_OPERATIONS_COST,
  GLOBAL_COORDINATION_TARGET_PCT,
  GLOBAL_COORDINATION_VERIFICATION_AND_PAYMENT_COST_PER_PARTICIPANT,
  GLOBAL_TO_US_POLITICAL_COST_RATIO,
  HOURS_PER_DAY,
  HOURS_PER_YEAR,
  HUMAN_PROTEIN_CODING_GENES,
  IAB_MECHANISM_ANNUAL_COST,
  IAB_POLITICAL_INCENTIVE_FUNDING_PCT,
  INSTITUTIONAL_INVESTOR_MIN,
  LOBBYIST_BOND_INVESTMENT_MAX,
  MILITARY_REDIRECT_GDP_BOOST_AT_30PCT,
  MINUTES_PER_HOUR,
  MONEY_PRINTER_WAR_DEATHS,
  MONTHS_PER_YEAR,
  NPV_DISCOUNT_RATE_STANDARD,
  NPV_TIME_HORIZON_YEARS,
  PEACE_DIVIDEND_CONFLICT_ELASTICITY,
  PEACE_DIVIDEND_DIRECT_FISCAL_SAVINGS,
  PHARMA_PHASE_2_3_COST_BARRIER,
  PRE_1962_VALIDATION_YEARS,
  PRIZE_POOL_PARTICIPATION_RATE,
  QALYS_PER_COVID_DEATH_AVERTED,
  RD_SPILLOVER_MULTIPLIER,
  SAFE_COMPOUNDS_COUNT,
  SCALE_COMPRESSION_FACTOR,
  SECONDS_PER_MINUTE,
  SECONDS_PER_YEAR,
  SHARING_TIME_MINUTES,
  TESTED_RELATIONSHIPS_ESTIMATE,
  TREATY_CAMPAIGN_BUDGET_LOBBYING,
  TREATY_CAMPAIGN_BUDGET_RESERVE,
  TREATY_CAMPAIGN_DURATION_YEARS,
  TREATY_CAMPAIGN_VIRAL_REFERENDUM_BASE_CASE,
  TREATY_REDIRECTED_SPENDING_INFINITE_ROI,
  TREATY_REDUCTION_PCT,
  TRIAL_RELEVANT_DISEASES_COUNT,
  US_CONGRESS_MEMBER_COUNT,
  US_DYSFUNCTION_PREMIUM_VS_SWITZERLAND,
  US_GOV_WASTE_OVERLAP_DISCOUNT,
  US_POLITICAL_EFFORT_MULTIPLIER,
  US_VS_SINGAPORE_SPENDING_GAP,
  US_VS_SWITZERLAND_LIFE_EXPECTANCY_GAP,
  US_VS_SWITZERLAND_SPENDING_GAP,
  VICTORY_BOND_FUNDING_PCT,
  _CASCADE_GENERATIONS,
  _R0,
  _SOCIAL_NETWORK_POP,
  _US_BASE_POLITICAL_SPENDING
} as const;

/** Union type of all parameter names */
export type ParameterName = keyof typeof parameters;

// ============================================================================
// Citations Lookup (CSL JSON)
// ============================================================================

/**
 * All citations in CSL JSON format
 * Use with citation processors like citeproc-js or citation-js
 * to format in any style (APA, MLA, Chicago, etc.)
 */
export const citations: Record<string, Citation> = {
  "3-5-rule": {
        id: "3-5-rule",
        type: "article-journal",
        title: "3.5% participation tipping point",
        author: [
          {
            literal: "Harvard Kennedy School"
          },
        ],
        issued: { 'date-parts': [[2020]] },
        'container-title': "Harvard Kennedy School",
        URL: "https://www.hks.harvard.edu/centers/carr/publications/35-rule-how-small-minority-can-change-world",
        note: "Harvard Kennedy School, The '3.5% rule': How a small minority can change the world | Chenoweth Research Paper (2020) | BBC Future, 2019, 'The 3.5% rule' | Wikipedia, 3.5% rule",
  },
  "95-pct-diseases-no-treatment": {
        id: "95-pct-diseases-no-treatment",
        type: "article-journal",
        title: "95% of diseases have 0 FDA-approved treatments",
        author: [
          {
            literal: "GAO"
          },
        ],
        issued: { 'date-parts': [[2025]] },
        'container-title': "GAO",
        URL: "https://www.gao.gov/products/gao-25-106774",
        note: "GAO, 2025, Rare Disease Drugs: FDA Has Steps Underway to Strengthen Coordination | Global Genes, RARE Disease Facts | Note: Only 5% of 7,000+ rare diseases have FDA-approved treatments",
  },
  "acled-active-combat-deaths": {
        id: "acled-active-combat-deaths",
        type: "article-journal",
        title: "Active combat deaths annually",
        author: [
          {
            literal: "ACLED"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "ACLED: Global Conflict Surged 2024",
        URL: "https://acleddata.com/2024/12/12/data-shows-global-conflict-surged-in-2024-the-washington-post/",
        note: "ACLED: Global Conflict Surged 2024 | Washington Post via ACLED | ACLED Conflict Index",
  },
  "antidepressant-trial-exclusion-rates": {
        id: "antidepressant-trial-exclusion-rates",
        type: "article-journal",
        title: "Antidepressant clinical trial exclusion rates",
        author: [
          {
            literal: "NIH"
          },
        ],
        issued: { 'date-parts': [[2015]] },
        'container-title': "Zimmerman et al.",
        URL: "https://pubmed.ncbi.nlm.nih.gov/26276679/",
        note: "Zimmerman et al., Mayo Clinic Proceedings, 2015 | Preskorn et al., Journal of Psychiatric Practice, 2015 | Wolters Kluwer: Antidepressant Trials Exclude Most Real World Patients",
  },
  "bio-clinical-development-2021": {
        id: "bio-clinical-development-2021",
        type: "article-journal",
        title: "BIO Clinical Development Success Rates 2011-2020",
        author: [
          {
            literal: "Biotechnology Innovation Organization (BIO)"
          },
        ],
        issued: { 'date-parts': [[2021]] },
        'container-title': "Biotechnology Innovation Organization (BIO)",
        URL: "https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf",
        note: "Biotechnology Innovation Organization (BIO), 2021, Clinical Development Success Rates and Contributing Factors 2011-2020",
  },
  "bls-cpi-inflation-calculator": {
        id: "bls-cpi-inflation-calculator",
        type: "webpage",
        title: "CPI Inflation Calculator",
        author: [
          {
            literal: "U.S. Bureau of Labor Statistics"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        URL: "https://www.bls.gov/data/inflation_calculator.htm",
        note: "U.S. Bureau of Labor Statistics, 2024, CPI Inflation Calculator",
  },
  "cbo-long-term-budget-2024": {
        id: "cbo-long-term-budget-2024",
        type: "report",
        title: "The 2024 Long-Term Budget Outlook",
        author: [
          {
            literal: "CBO"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        publisher: "Congressional Budget Office",
        URL: "https://www.cbo.gov/publication/60039",
        note: "Net interest: \\$888 billion in 2024",
  },
  "cdc-life-expectancy": {
        id: "cdc-life-expectancy",
        type: "webpage",
        title: "US Life Expectancy 2023",
        author: [
          {
            literal: "Centers for Disease Control and Prevention"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        URL: "https://www.cdc.gov/nchs/fastats/life-expectancy.htm",
        note: "CDC, 2024, Life Expectancy",
  },
  "census-income-2023": {
        id: "census-income-2023",
        type: "webpage",
        title: "US Median Household Income 2023",
        author: [
          {
            literal: "US Census Bureau"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        URL: "https://www.census.gov/library/publications/2024/demo/p60-282.html",
        note: "US Census Bureau, 2024, Income in the United States: 2023",
  },
  "chance-of-dying-from-terrorism-1-in-30m": {
        id: "chance-of-dying-from-terrorism-1-in-30m",
        type: "article-journal",
        title: "Chance of dying from terrorism statistic",
        author: [
          {
            literal: "Cato Institute"
          },
        ],
        'container-title': "Cato Institute: Terrorism and Immigration Risk Analysis",
        URL: "https://www.cato.org/policy-analysis/terrorism-immigration-risk-analysis",
        note: "Cato Institute: Terrorism and Immigration Risk Analysis | NBC News: Lightning vs Terrorism",
  },
  "childhood-vaccination-economic-benefits": {
        id: "childhood-vaccination-economic-benefits",
        type: "article-journal",
        title: "Childhood vaccination economic benefits",
        author: [
          {
            literal: "CDC MMWR"
          },
        ],
        issued: { 'date-parts': [[1994]] },
        'container-title': "CDC MMWR",
        URL: "https://www.cdc.gov/mmwr/volumes/73/wr/mm7331a2.htm",
        note: "CDC MMWR, Childhood Immunizations 1994-2023 | The Lancet, 50 Years of Expanded Programme on Immunization | https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(24)00850-X/fulltext",
  },
  "childhood-vaccination-roi": {
        id: "childhood-vaccination-roi",
        type: "article-journal",
        title: "Childhood Vaccination (US) ROI",
        author: [
          {
            literal: "CDC"
          },
        ],
        issued: { 'date-parts': [[2017]] },
        'container-title': "CDC",
        URL: "https://www.cdc.gov/mmwr/preview/mmwrhtml/mm6316a4.htm",
        note: "CDC, Link | Vaxopedia, Link",
  },
  "chronic-illness-workforce-productivity-loss": {
        id: "chronic-illness-workforce-productivity-loss",
        type: "article-journal",
        title: "Chronic illness workforce productivity loss",
        author: [
          {
            literal: "Integrated Benefits Institute"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "Integrated Benefits Institute 2024",
        URL: "https://www.ibiweb.org/resources/chronic-conditions-in-the-us-workforce-prevalence-trends-and-productivity-impacts",
        note: "Integrated Benefits Institute 2024, Chronic Conditions in US Workforce | One Medical 2024, Study on Chronic Conditions | de Beaumont Foundation 2025, Poll on Chronic Health Conditions",
  },
  "clean-water-sanitation-roi": {
        id: "clean-water-sanitation-roi",
        type: "article-journal",
        title: "Clean Water & Sanitation (LMICs) ROI",
        author: [
          {
            literal: "UN News"
          },
        ],
        issued: { 'date-parts': [[2014]] },
        'container-title': "UN News",
        URL: "https://news.un.org/en/story/2014/11/484032",
        note: "UN News, Link | WaterAid, Link",
  },
  "clinical-trial-abandonment-rate": {
        id: "clinical-trial-abandonment-rate",
        type: "article-journal",
        title: "Terminated Trials in the ClinicalTrials.gov Results Database: Evaluation of Availability of Primary Outcome Data and Reasons for Termination",
        author: [
          {
            family: "Williams",
            given: "Rebecca J and Tse, Tony and DiPiazza, Katelyn and Zarin, Deborah A"
          },
        ],
        issued: { 'date-parts': [[2015]] },
        'container-title': "PLOS One",
        URL: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4444136/",
        note: "Analysis of 7,646 trials in ClinicalTrials.gov results database as of February 2013",
  },
  "clinical-trial-patient-participation-rate": {
        id: "clinical-trial-patient-participation-rate",
        type: "article-journal",
        title: "Clinical trial patient participation rate",
        author: [
          {
            literal: "ACS CAN"
          },
        ],
        'container-title': "ACS CAN: Barriers to Clinical Trial Enrollment",
        URL: "https://www.fightcancer.org/policy-resources/barriers-patient-enrollment-therapeutic-clinical-trials-cancer",
        note: "ACS CAN: Barriers to Clinical Trial Enrollment | HINTS: Clinical Trial Participation",
  },
  "clinical-trials-puzzle-interactome": {
        id: "clinical-trials-puzzle-interactome",
        type: "article-journal",
        title: "Only ~12% of human interactome targeted",
        author: [
          {
            literal: "PMC"
          },
        ],
        issued: { 'date-parts': [[2023]] },
        'container-title': "PMC",
        URL: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10749231/",
        note: "PMC, 2023, The Clinical Trials Puzzle",
  },
  "clinicaltrials-gov-enrollment-data-2025": {
        id: "clinicaltrials-gov-enrollment-data-2025",
        type: "article-journal",
        title: "ClinicalTrials.gov cumulative enrollment data (2025)",
        author: [
          {
            literal: "ClinicalTrials.gov API v2 direct analysis"
          },
        ],
        'container-title': "Direct analysis via ClinicalTrials.gov API v2",
        URL: "https://clinicaltrials.gov/data-api/api",
        note: "Direct analysis via ClinicalTrials.gov API v2",
  },
  "crs-war-costs-2010": {
        id: "crs-war-costs-2010",
        type: "webpage",
        title: "Costs of Major U.S. Wars",
        author: [
          {
            family: "Daggett",
            given: "Stephen"
          },
        ],
        issued: { 'date-parts': [[2010]] },
        publisher: "Congressional Research Service",
        URL: "https://sgp.fas.org/crs/natsec/RS22926.pdf",
        note: "CRS Report RS22926. Costs in FY2011 constant dollars: Civil War (both sides) \\$80B, WWI \\$334B, WWII \\$4,104B, Korea \\$341B, Vietnam \\$738B. Military operations only; excludes veterans benefits, interest, and allied assistance.",
  },
  "cs-global-wealth-report-2023": {
        id: "cs-global-wealth-report-2023",
        type: "article-journal",
        title: "Credit Suisse Global Wealth Report 2023",
        author: [
          {
            literal: "UBS"
          },
        ],
        issued: { 'date-parts': [[2023]] },
        'container-title': "Credit Suisse/UBS",
        URL: "https://www.ubs.com/global/en/family-office-uhnw/reports/global-wealth-report-2023.html",
        note: "Credit Suisse/UBS, 2023, Global Wealth Report 2023",
  },
  "cybercrime-economy-10-5t": {
        id: "cybercrime-economy-10-5t",
        type: "article-journal",
        title: "Cybercrime economy projected to reach \\$10.5 trillion",
        author: [
          {
            literal: "Cybersecurity Ventures"
          },
        ],
        issued: { 'date-parts': [[2016]] },
        'container-title': "Cybersecurity Ventures: \\$10.5T Cybercrime",
        URL: "https://cybersecurityventures.com/hackerpocalypse-cybercrime-report-2016/",
        note: "Cybersecurity Ventures: \\$10.5T Cybercrime | Boise State: Cybercrime Costs",
  },
  "deworming-cost-per-daly": {
        id: "deworming-cost-per-daly",
        type: "article-journal",
        title: "Cost per DALY for Deworming Programs",
        author: [
          {
            literal: "GiveWell"
          },
        ],
        'container-title': "GiveWell: Cost-Effectiveness in $/DALY for Deworming",
        URL: "https://www.givewell.org/international/technical/programs/deworming/cost-effectiveness",
        note: "GiveWell: Cost-Effectiveness in $/DALY for Deworming",
  },
  "disease-cost-alzheimers-1300b": {
        id: "disease-cost-alzheimers-1300b",
        type: "article-journal",
        title: "Annual global economic burden of Alzheimer's and other dementias",
        author: [
          {
            literal: "WHO"
          },
        ],
        issued: { 'date-parts': [[2019]] },
        'container-title': "WHO: Dementia Fact Sheet",
        URL: "https://www.who.int/news-room/fact-sheets/detail/dementia",
        note: "WHO: Dementia Fact Sheet | Alzheimer's & Dementia: Worldwide Costs 2019",
  },
  "disease-cost-cancer-1800b": {
        id: "disease-cost-cancer-1800b",
        type: "article-journal",
        title: "Annual global economic burden of cancer",
        author: [
          {
            literal: "JAMA Oncology"
          },
        ],
        issued: { 'date-parts': [[2020]] },
        'container-title': "JAMA Oncology: Global Cost 2020-2050",
        URL: "https://jamanetwork.com/journals/jamaoncology/fullarticle/2801798",
        note: "JAMA Oncology: Global Cost 2020-2050 | Nature: \\$25T Over 30 Years",
  },
  "disease-cost-diabetes-1500b": {
        id: "disease-cost-diabetes-1500b",
        type: "article-journal",
        title: "Annual global economic burden of diabetes",
        author: [
          {
            literal: "Diabetes Care"
          },
        ],
        'container-title': "Diabetes Care: Global Economic Burden",
        URL: "https://diabetesjournals.org/care/article/41/5/963/36522/Global-Economic-Burden-of-Diabetes-in-Adults",
        note: "Diabetes Care: Global Economic Burden | Lancet Diabetes Endocrinol: Global economic burden of diabetes in adults aged 20-79 years",
  },
  "disease-cost-heart-disease-2100b": {
        id: "disease-cost-heart-disease-2100b",
        type: "article-journal",
        title: "Annual global economic burden of heart disease",
        author: [
          {
            family: "Cook",
            given: "Christopher and Cole, Graham and Asaria, Perviz and Jabbour, Richard and Francis, Darrel P."
          },
        ],
        issued: { 'date-parts': [[2014]] },
        'container-title': "International Journal of Cardiology",
        URL: "https://www.internationaljournalofcardiology.com/article/S0167-5273(13)02238-9/abstract",
        note: "International Journal of Cardiology: The annual global economic burden of heart failure | AHA: US CVD Costs to 2050",
  },
  "disease-economic-burden-109t": {
        id: "disease-economic-burden-109t",
        type: "webpage",
        title: "\\$109 trillion annual global disease burden",
        author: [
          {
            literal: "Calculated from IHME Global Burden of Disease (2.55B DALYs) and global GDP per capita valuation"
          },
        ],
        note: "Calculated from IHME Global Burden of Disease (2.55B DALYs) and global GDP per capita valuation",
  },
  "disease-prevalence-2-billion": {
        id: "disease-prevalence-2-billion",
        type: "article-journal",
        title: "Global prevalence of chronic disease",
        author: [
          {
            literal: "ScienceDaily"
          },
        ],
        issued: { 'date-parts': [[2015]] },
        'container-title': "ScienceDaily: GBD 2015 Study",
        URL: "https://www.sciencedaily.com/releases/2015/06/150608081753.htm",
        note: "ScienceDaily: GBD 2015 Study | PMC: Burden of Chronic Disease | PMC: Multiple Chronic Conditions",
  },
  "diseases-getting-first-treatment-annually": {
        id: "diseases-getting-first-treatment-annually",
        type: "article-journal",
        title: "Diseases Getting First Effective Treatment Each Year",
        author: [
          {
            literal: "Calculated from Orphanet Journal of Rare Diseases (2024)"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "Calculated from Orphanet Journal of Rare Diseases (2024)",
        URL: "https://ojrd.biomedcentral.com/articles/10.1186/s13023-024-03398-1",
        note: "Calculated from Orphanet Journal of Rare Diseases (2024), FDA Novel Drug Approvals data",
  },
  "disparity-ratio-weapons-vs-cures": {
        id: "disparity-ratio-weapons-vs-cures",
        type: "article-journal",
        title: "36:1 disparity ratio of spending on weapons over cures",
        author: [
          {
            literal: "SIPRI"
          },
        ],
        issued: { 'date-parts': [[2016]] },
        'container-title': "SIPRI: Military Spending",
        URL: "https://www.sipri.org/commentary/blog/2016/opportunity-cost-world-military-spending",
        note: "SIPRI: Military Spending | PMC: Military vs Healthcare Crowding Out | Congress.gov: Global R&D Landscape",
  },
  "dot-vsl-13-6m": {
        id: "dot-vsl-13-6m",
        type: "article-journal",
        title: "DOT Value of Statistical Life (\\$13.6M)",
        author: [
          {
            literal: "DOT"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "DOT: VSL Guidance 2024",
        URL: "https://www.transportation.gov/office-policy/transportation-policy/revised-departmental-guidance-on-valuation-of-a-statistical-life-in-economic-analysis",
        note: "DOT: VSL Guidance 2024 | DOT: Economic Values Used in Analysis",
  },
  "dot-vsl-2024": {
        id: "dot-vsl-2024",
        type: "webpage",
        title: "Departmental Guidance on Valuation of a Statistical Life in Economic Analysis",
        author: [
          {
            literal: "U.S. Department of Transportation"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        URL: "https://www.transportation.gov/office-policy/transportation-policy/revised-departmental-guidance-on-valuation-of-a-statistical-life-in-economic-analysis",
        note: "Current VSL: \\$13.7 million",
  },
  "drug-development-cost": {
        id: "drug-development-cost",
        type: "webpage",
        title: "Cost of drug development",
        author: [
          {
            literal: "Tufts CSDD"
          },
        ],
        note: "Tufts CSDD | IQVIA | Deloitte",
  },
  "drug-repurposing-rate": {
        id: "drug-repurposing-rate",
        type: "article-journal",
        title: "Drug Repurposing Rate (~30%)",
        author: [
          {
            literal: "Nature Medicine"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "Nature Medicine",
        URL: "https://www.nature.com/articles/s41591-024-03233-x",
        note: "Nature Medicine, 2024, Drug Repurposing Trends",
  },
  "drug-trial-success-rate-12-pct": {
        id: "drug-trial-success-rate-12-pct",
        type: "article-journal",
        title: "Drug trial success rate from Phase I to approval",
        author: [
          {
            literal: "Nature Reviews Drug Discovery"
          },
        ],
        issued: { 'date-parts': [[2016]] },
        'container-title': "Nature Reviews Drug Discovery: Clinical Success Rates",
        URL: "https://www.nature.com/articles/nrd.2016.136",
        note: "Nature Reviews Drug Discovery: Clinical Success Rates | PMC: Estimating Success Rates | Oxford Academic: Clinical Trial Success",
  },
  "drugpolicyalliance2021": {
        id: "drugpolicyalliance2021",
        type: "webpage",
        title: "The Drug War by the Numbers",
        author: [
          {
            literal: "Drug Policy Alliance"
          },
        ],
        issued: { 'date-parts': [[2021]] },
        URL: "https://drugpolicy.org/drug-war-stats/",
  },
  "education-investment-economic-multiplier": {
        id: "education-investment-economic-multiplier",
        type: "article-journal",
        title: "Education investment economic multiplier (2.1)",
        author: [
          {
            literal: "EPI"
          },
        ],
        'container-title': "EPI: Public Investments Outside Core Infrastructure",
        URL: "https://www.epi.org/publication/bp348-public-investments-outside-core-infrastructure/",
        note: "EPI: Public Investments Outside Core Infrastructure | World Bank: Returns to Investment in Education | Freopp: Education ROI Framework",
  },
  "environmental-cost-of-war": {
        id: "environmental-cost-of-war",
        type: "article-journal",
        title: "Environmental cost of war (\\$100B annually)",
        author: [
          {
            family: "Costs of War Project",
            given: "Brown University Watson Institute"
          },
        ],
        'container-title': "Brown Watson Costs of War: Environmental Cost",
        URL: "https://watson.brown.edu/costsofwar/costs/social/environment",
        note: "Brown Watson Costs of War: Environmental Cost | Earth.Org: Environmental Impact of Wars | Transform Defence: Military Spending & Climate",
  },
  "ewg-farm-subsidies": {
        id: "ewg-farm-subsidies",
        type: "article-journal",
        title: "US Farm Subsidy Database and Analysis",
        author: [
          {
            literal: "Environmental Working Group"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "Environmental Working Group",
        URL: "https://farm.ewg.org/",
        note: "Environmental Working Group, Farm Subsidy Database | USDA Economic Research Service, Agricultural Subsidies",
  },
  "fda-approved-products-20k": {
        id: "fda-approved-products-20k",
        type: "article-journal",
        title: "FDA-approved prescription drug products (20,000+)",
        author: [
          {
            literal: "FDA"
          },
        ],
        'container-title': "FDA",
        URL: "https://www.fda.gov/media/143704/download",
        note: "FDA, Facts About Generic Drugs",
  },
  "fda-gras-list-count": {
        id: "fda-gras-list-count",
        type: "article-journal",
        title: "FDA GRAS List Count (~570-700)",
        author: [
          {
            literal: "FDA"
          },
        ],
        'container-title': "FDA",
        URL: "https://www.fda.gov/food/generally-recognized-safe-gras/gras-notice-inventory",
        note: "FDA, GRAS Notice Inventory",
  },
  "fec-2024-summary": {
        id: "fec-2024-summary",
        type: "webpage",
        title: "Statistical Summary of 24-Month Campaign Activity of the 2023-2024 Election Cycle",
        author: [
          {
            literal: "Federal Election Commission"
          },
        ],
        issued: { 'date-parts': [[2023]] },
        URL: "https://www.fec.gov/updates/statistical-summary-of-24-month-campaign-activity-of-the-2023-2024-election-cycle/",
        note: "Federal Election Commission, Statistical Summary of 24-Month Campaign Activity",
  },
  "forbes-billionaires-2024": {
        id: "forbes-billionaires-2024",
        type: "webpage",
        title: "Forbes World's Billionaires List 2024",
        author: [
          {
            literal: "Forbes"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        URL: "https://www.forbes.com/billionaires/",
        note: "38th annual Forbes billionaires list, published April 2, 2024",
  },
  "gbd-disability-weights": {
        id: "gbd-disability-weights",
        type: "article-journal",
        title: "Global Burden of Disease Study 2019: Disability Weights",
        author: [
          {
            literal: "GBD 2019 Diseases and Injuries Collaborators"
          },
        ],
        issued: { 'date-parts': [[2020]] },
        'container-title': "The Lancet",
        URL: "https://ghdx.healthdata.org/record/ihme-data/gbd-2019-disability-weights",
  },
  "givewell-cost-per-life-saved": {
        id: "givewell-cost-per-life-saved",
        type: "article-journal",
        title: "GiveWell Cost per Life Saved for Top Charities (2024)",
        author: [
          {
            literal: "GiveWell"
          },
        ],
        'container-title': "GiveWell: Top Charities",
        URL: "https://www.givewell.org/charities/top-charities",
        note: "GiveWell: Top Charities | GiveWell: Helen Keller Vitamin A | Our World in Data: Cost-Effectiveness",
  },
  "global-clinical-trials-market-2024": {
        id: "global-clinical-trials-market-2024",
        type: "article-journal",
        title: "Global clinical trials market 2024",
        author: [
          {
            literal: "Research and Markets"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "Research and Markets",
        URL: "https://www.globenewswire.com/news-release/2024/04/19/2866012/0/en/Global-Clinical-Trials-Market-Research-Report-2024-An-83-16-Billion-Market-by-2030-AI-Machine-Learning-and-Blockchain-will-Transform-the-Clinical-Trials-Landscape.html",
        note: "Research and Markets, Global Clinical Trials Market Report 2024 | Precedence Research, Clinical Trials Market Size",
  },
  "global-gov-med-research-spending": {
        id: "global-gov-med-research-spending",
        type: "article-journal",
        title: "Global government medical research spending (\\$67.5B, 2023–2024)",
        author: [
          {
            literal: "Component country budgets"
          },
        ],
        'container-title': "See component country budgets: NIH Budget",
        URL: "https://www.nih.gov/about-nih/what-we-do/budget",
        note: "See component country budgets: NIH Budget, China R&D, EU Horizon Health",
  },
  "global-government-clinical-trial-spending-estimate": {
        id: "global-government-clinical-trial-spending-estimate",
        type: "article-journal",
        title: "Global government spending on interventional clinical trials: ~\\$3-6 billion/year",
        author: [
          {
            literal: "Applied Clinical Trials"
          },
        ],
        'container-title': "Applied Clinical Trials",
        URL: "https://www.appliedclinicaltrialsonline.com/view/sizing-clinical-research-market",
        note: "Applied Clinical Trials | Lancet Global Health | https://www.thelancet.com/journals/langlo/article/PIIS2214-109X(20)30357-0/fulltext",
  },
  "global-median-age-un-wpp-2024": {
        id: "global-median-age-un-wpp-2024",
        type: "webpage",
        title: "World Population Prospects 2024: Summary of Results",
        author: [
          {
            family: "United Nations Department of Economic and Social Affairs",
            given: "Population Division"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        URL: "https://population.un.org/wpp",
        note: "UN WPP 2024. Global median age 30.5 years (2024 estimate). Worldometers reports 31.1 for 2026 based on same data.",
  },
  "global-military-spending": {
        id: "global-military-spending",
        type: "article-journal",
        title: "Global military spending (\\$2.72T, 2024)",
        author: [
          {
            literal: "SIPRI"
          },
        ],
        issued: { 'date-parts': [[2025]] },
        'container-title': "SIPRI",
        URL: "https://www.sipri.org/publications/2025/sipri-fact-sheets/trends-world-military-expenditure-2024",
        note: "SIPRI, 2025, Trends in World Military Expenditure 2024",
  },
  "global-new-drug-approvals-50-annually": {
        id: "global-new-drug-approvals-50-annually",
        type: "article-journal",
        title: "Annual number of new drugs approved globally: ~50",
        author: [
          {
            literal: "C&EN"
          },
        ],
        issued: { 'date-parts': [[2025]] },
        'container-title': "C&EN",
        URL: "https://cen.acs.org/pharmaceuticals/50-new-drugs-received-FDA/103/i2",
        note: "C&EN, 2025, 50 new drugs received FDA approval in 2024 | FDA, Novel Drug Approvals | Note: Average ~50 per year 2018-2024; 32 small molecules + 18 biologics in 2024",
  },
  "global-pharma-rd-spending-300b": {
        id: "global-pharma-rd-spending-300b",
        type: "webpage",
        title: "Global pharmaceutical R&D spending",
        author: [
          {
            literal: "Industry reports: IQVIA"
          },
        ],
        note: "Industry reports: IQVIA, EvaluatePharma, PhRMA",
  },
  "global-population-8-billion": {
        id: "global-population-8-billion",
        type: "article-journal",
        title: "Global population reaches 8 billion",
        author: [
          {
            literal: "UN"
          },
        ],
        issued: { 'date-parts': [[2022]] },
        'container-title': "UN: World Population 8 Billion Nov 15 2022",
        URL: "https://www.un.org/en/desa/world-population-reach-8-billion-15-november-2022",
        note: "UN: World Population 8 Billion Nov 15 2022 | UN: Day of 8 Billion | Wikipedia: Day of Eight Billion",
  },
  "global-trial-participant-capacity": {
        id: "global-trial-participant-capacity",
        type: "article-journal",
        title: "Global trial capacity",
        author: [
          {
            literal: "IQVIA Report"
          },
        ],
        'container-title': "IQVIA Report: Clinical Trial Subjects Number Drops Due to Decline in COVID-19 Enrollment",
        URL: "https://gmdpacademy.org/news/iqvia-report-clinical-trial-subjects-number-drops-due-to-decline-in-covid-19-enrollment/",
        note: "IQVIA Report: Clinical Trial Subjects Number Drops Due to Decline in COVID-19 Enrollment",
  },
  "gtd-terror-attack-deaths": {
        id: "gtd-terror-attack-deaths",
        type: "article-journal",
        title: "Terror attack deaths (8,300 annually)",
        author: [
          {
            literal: "Our World in Data"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "Our World in Data: Terrorism",
        URL: "https://ourworldindata.org/terrorism",
        note: "Our World in Data: Terrorism | Global Terrorism Index 2024 | START Global Terrorism Database | Our World in Data: Terrorism Deaths",
  },
  "healthcare-investment-economic-multiplier": {
        id: "healthcare-investment-economic-multiplier",
        type: "article-journal",
        title: "Healthcare investment economic multiplier (1.8)",
        author: [
          {
            literal: "PMC"
          },
        ],
        issued: { 'date-parts': [[2022]] },
        'container-title': "PMC: California Universal Health Care",
        URL: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5954824/",
        note: "PMC: California Universal Health Care | CEPR: Government Investment | PMC: Health Sector Investment & Growth | ODI: Fiscal Multipliers Review",
  },
  "hsieh-moretti2019": {
        id: "hsieh-moretti2019",
        type: "article-journal",
        title: "Housing Constraints and Spatial Misallocation",
        author: [
          {
            family: "Hsieh",
            given: "Chang-Tai and Moretti, Enrico"
          },
        ],
        issued: { 'date-parts': [[2019]] },
        'container-title': "American Economic Journal: Macroeconomics",
        URL: "https://www.aeaweb.org/articles?id=10.1257/mac.20170388",
        note: "Hsieh & Moretti, 2019, AEJ:Macro | Highly cited - one of most influential papers in urban economics",
  },
  "human-genome-and-genetic-editing": {
        id: "human-genome-and-genetic-editing",
        type: "article-journal",
        title: "Human Genome Project and CRISPR Discovery",
        author: [
          {
            literal: "NHGRI"
          },
        ],
        issued: { 'date-parts': [[2003]] },
        'container-title': "NHGRI",
        URL: "https://www.genome.gov/11006929/2003-release-international-consortium-completes-hgp",
        note: "NHGRI, International Consortium Completes Human Genome Project | Nobel Prize, The Nobel Prize in Chemistry 2020 | Note: HGP cost ~\\$2.7B; CRISPR discovered by Doudna & Charpentier in 2012",
  },
  "icbl-ottawa-treaty": {
        id: "icbl-ottawa-treaty",
        type: "article-journal",
        title: "International Campaign to Ban Landmines (ICBL) - Ottawa Treaty (1997)",
        author: [
          {
            literal: "ICRC"
          },
        ],
        issued: { 'date-parts': [[1997]] },
        'container-title': "ICRC",
        URL: "https://www.icrc.org/en/doc/resources/documents/article/other/57jpjn.htm",
        note: "ICRC, Ottawa Treaty History | Wikipedia, International Campaign to Ban Landmines | Nobel Prize, 1997 Peace Prize | UN Press, ICBL Press Conference 1999 | Landmine Monitor, Mine Action Funding",
  },
  "icd-10-code-count": {
        id: "icd-10-code-count",
        type: "article-journal",
        title: "ICD-10 Code Count (~14,000)",
        author: [
          {
            literal: "WHO"
          },
        ],
        issued: { 'date-parts': [[2019]] },
        'container-title': "WHO",
        URL: "https://icd.who.int/browse10/2019/en",
        note: "WHO, ICD-10 Browser",
  },
  "ihme-gbd-2021": {
        id: "ihme-gbd-2021",
        type: "article-journal",
        title: "IHME Global Burden of Disease 2021 (2.88B DALYs, 1.13B YLD)",
        author: [
          {
            literal: "Institute for Health Metrics and Evaluation (IHME)"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "Institute for Health Metrics and Evaluation (IHME)",
        URL: "https://vizhub.healthdata.org/gbd-results/",
        note: "Institute for Health Metrics and Evaluation (IHME), GBD Results Tool | The Lancet, 2024, Global burden of 371 diseases and injuries, and 87 risk factors, in 204 countries, 2000-2021 | https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(24)00757-8/fulltext | IHME, Global Burden of Disease Study 2021",
  },
  "imf-fossilfuel2023": {
        id: "imf-fossilfuel2023",
        type: "webpage",
        title: "IMF Fossil Fuel Subsidies Data: 2023 Update",
        author: [
          {
            literal: "International Monetary Fund"
          },
        ],
        issued: { 'date-parts': [[2023]] },
        URL: "https://www.imf.org/en/Blogs/Articles/2023/08/24/fossil-fuel-subsidies-surged-to-record-7-trillion",
  },
  "imf-singapore-spending": {
        id: "imf-singapore-spending",
        type: "webpage",
        title: "IMF Singapore Government Spending Data",
        author: [
          {
            literal: "International Monetary Fund"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        URL: "https://www.imf.org/en/Countries/SGP",
        note: "IMF, 2024, Singapore Country Data",
  },
  "industry-clinical-trial-spending-estimate": {
        id: "industry-clinical-trial-spending-estimate",
        type: "webpage",
        title: "Private Industry Clinical Trial Spending Estimate",
        author: [
          {
            family: "Sinn",
            given: "Mike P."
          },
        ],
        issued: { 'date-parts': [[2025]] },
        URL: "https://cost-of-change.warondisease.org",
        note: "Derived estimate using published market-sizing and funding-distribution sources. Supporting sources: https://www.appliedclinicaltrialsonline.com/view/sizing-clinical-research-market | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10349341/ | https://www.cbo.gov/publication/57126",
  },
  "industry-vs-government-trial-spending-split": {
        id: "industry-vs-government-trial-spending-split",
        type: "article-journal",
        title: "Industry vs. Government Clinical Trial Spending Split (90/10)",
        author: [
          {
            literal: "Applied Clinical Trials"
          },
        ],
        'container-title': "Applied Clinical Trials",
        URL: "https://www.appliedclinicaltrialsonline.com/view/sizing-clinical-research-market",
        note: "Applied Clinical Trials | TCTMD",
  },
  "infrastructure-investment-economic-multiplier": {
        id: "infrastructure-investment-economic-multiplier",
        type: "article-journal",
        title: "Infrastructure investment economic multiplier (1.6)",
        author: [
          {
            literal: "World Bank"
          },
        ],
        issued: { 'date-parts': [[2022]] },
        'container-title': "World Bank: Infrastructure Investment as Stimulus",
        URL: "https://blogs.worldbank.org/en/ppps/effectiveness-infrastructure-investment-fiscal-stimulus-what-weve-learned",
        note: "World Bank: Infrastructure Investment as Stimulus | Global Infrastructure Hub: Fiscal Multiplier | CEPR: Government Investment | Richmond Fed: Infrastructure Spending",
  },
  "iqvia-global-medicines-2024": {
        id: "iqvia-global-medicines-2024",
        type: "article-journal",
        title: "The Global Use of Medicines 2024: Outlook to 2028",
        author: [
          {
            literal: "IQVIA Institute for Human Data Science"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "IQVIA Institute Report",
        URL: "https://www.iqvia.com/insights/the-iqvia-institute/reports-and-publications/reports/the-global-use-of-medicines-2024-outlook-to-2028",
  },
  "lichtenberg-life-years-saved-2019": {
        id: "lichtenberg-life-years-saved-2019",
        type: "article-journal",
        title: "How Many Life-Years Have New Drugs Saved? A Three-Way Fixed-Effects Analysis of 66 Diseases in 27 Countries, 2000-2013",
        author: [
          {
            family: "Lichtenberg",
            given: "Frank R."
          },
        ],
        issued: { 'date-parts': [[2019]] },
        'container-title': "International Health",
        URL: "https://www.nber.org/papers/w25483",
  },
  "life-expectancy-gains-smoking-reduction": {
        id: "life-expectancy-gains-smoking-reduction",
        type: "article-journal",
        title: "Contribution of smoking reduction to life expectancy gains",
        author: [
          {
            literal: "PMC"
          },
        ],
        issued: { 'date-parts': [[2012]] },
        'container-title': "PMC: Benefits Smoking Cessation Longevity",
        URL: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1447499/",
        note: "PMC: Benefits Smoking Cessation Longevity | CDC: Estimating Benefits Smoking Reductions | AJPM: Benefits Quitting Different Ages | https://www.ajpmonline.org/article/S0749-3797(24)00217-4/fulltext | NEJM: 21st-Century Hazards & Benefits",
  },
  "life-expectancy-increase-pre-1962": {
        id: "life-expectancy-increase-pre-1962",
        type: "webpage",
        title: "US life expectancy growth 1880-1960: 3.82 years per decade",
        author: [
          {
            literal: "Source: US Life Expectancy FDA Budget 1543-2019 CSV"
          },
        ],
        issued: { 'date-parts': [[2019]] },
        URL: "https://manual.warondisease.org/knowledge/data/us-life-expectancy-fda-budget-1543-2019.csv",
        note: "Source: US Life Expectancy FDA Budget 1543-2019 CSV | Our World in Data: Life Expectancy | Primary sources: Human Mortality Database (historical), CDC NCHS National Vital Statistics (modern)",
  },
  "lobbying-spend-defense": {
        id: "lobbying-spend-defense",
        type: "article-journal",
        title: "Lobbying Spend (Defense)",
        author: [
          {
            literal: "OpenSecrets"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "OpenSecrets",
        URL: "https://www.opensecrets.org/industries/lobbying?ind=D",
        note: "OpenSecrets, 2024, Defense Lobbying",
  },
  "lobbyist-statistics-dc": {
        id: "lobbyist-statistics-dc",
        type: "article-journal",
        title: "Lobbyist statistics for Washington D.C.",
        author: [
          {
            literal: "OpenSecrets"
          },
        ],
        'container-title': "OpenSecrets: Lobbying in US",
        URL: "https://en.wikipedia.org/wiki/Lobbying_in_the_United_States",
        note: "OpenSecrets: Lobbying in US | OpenSecrets: Revolving Door | Citizen.org: Revolving Congress | ProPublica: 281 Lobbyists Trump Admin",
  },
  "longevity-escape-velocity": {
        id: "longevity-escape-velocity",
        type: "article-journal",
        title: "Longevity Escape Velocity (LEV) - Maximum Human Life Extension Potential",
        author: [
          {
            literal: "Wikipedia"
          },
        ],
        'container-title': "Wikipedia: Longevity Escape Velocity",
        URL: "https://en.wikipedia.org/wiki/Longevity_escape_velocity",
        note: "Wikipedia: Longevity Escape Velocity | PMC: Escape Velocity - Why Life Extension Matters Now | Popular Mechanics: Can Science Cure Death? | Diamandis: Longevity Escape Velocity",
  },
  "lost-human-capital-war-cost": {
        id: "lost-human-capital-war-cost",
        type: "article-journal",
        title: "Lost human capital due to war (\\$270B annually)",
        author: [
          {
            literal: "Think by Numbers"
          },
        ],
        issued: { 'date-parts': [[2021]] },
        'container-title': "Think by Numbers",
        URL: "https://thinkbynumbers.org/military/war/the-economic-case-for-peace-a-comprehensive-financial-analysis/",
        note: "Think by Numbers: War Costs \\$74,259/Lifetime | WEF: War Violence Costs \\$5/Day | PubMed: Economic Value DALYs Violence",
  },
  "measles-vaccination-roi": {
        id: "measles-vaccination-roi",
        type: "article-journal",
        title: "Measles Vaccination ROI",
        author: [
          {
            literal: "MDPI Vaccines"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "MDPI Vaccines",
        URL: "https://www.mdpi.com/2076-393X/12/11/1210",
        note: "MDPI Vaccines, 2024, Health and Economic Benefits of US Measles and Rubella Control | Taylor & Francis, 2024, Economic Evaluation of Second MCV Dose",
  },
  "medical-research-lives-saved-annually": {
        id: "medical-research-lives-saved-annually",
        type: "article-journal",
        title: "Medical research lives saved annually (4.2 million)",
        author: [
          {
            literal: "ScienceDaily"
          },
        ],
        issued: { 'date-parts': [[2020]] },
        'container-title': "ScienceDaily: Physical Activity Prevents 4M Deaths",
        URL: "https://www.sciencedaily.com/releases/2020/06/200617194510.htm",
        note: "ScienceDaily: Physical Activity Prevents 4M Deaths | PMC: Lives Saved by COVID Vaccines | Circulation: Three Interventions Save 94M Lives | PMC: Saving Millions Pandemic Research",
  },
  "mental-health-burden": {
        id: "mental-health-burden",
        type: "article-journal",
        title: "Mental health global burden",
        author: [
          {
            literal: "World Health Organization"
          },
        ],
        issued: { 'date-parts': [[2022]] },
        'container-title': "World Health Organization",
        URL: "https://www.who.int/news/item/28-09-2001-the-world-health-report-2001-mental-disorders-affect-one-in-four-people",
        note: "World Health Organization, 2022, Mental Health Fact Sheet",
  },
  "military-spending-economic-multiplier": {
        id: "military-spending-economic-multiplier",
        type: "article-journal",
        title: "Military spending economic multiplier (0.6)",
        author: [
          {
            literal: "Mercatus"
          },
        ],
        'container-title': "Mercatus: Defense Spending and Economy",
        URL: "https://www.mercatus.org/research/research-papers/defense-spending-and-economy",
        note: "Mercatus: Defense Spending and Economy | CEPR: WWII Spending Multipliers | RAND: Defense Spending Economic Growth",
  },
  "nih-budget-fy2025": {
        id: "nih-budget-fy2025",
        type: "article-journal",
        title: "NIH Budget (FY 2025)",
        author: [
          {
            literal: "NIH"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "NIH",
        URL: "https://www.nih.gov/about-nih/organization/budget",
        note: "NIH, 2024, Budget Overview | NIH, Office of Budget | Note: FY2024 budget was \\$47.1B",
  },
  "nih-clinical-trials-spending-pct-3-3": {
        id: "nih-clinical-trials-spending-pct-3-3",
        type: "article-journal",
        title: "NIH spending on clinical trials: ~3.3%",
        author: [
          {
            literal: "Bentley et al."
          },
        ],
        issued: { 'date-parts': [[2023]] },
        'container-title': "Bentley et al.",
        URL: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10349341/",
        note: "Bentley et al., 2023 | Fierce Biotech: NIH Spending",
  },
  "nonprofit-clinical-trial-spending-estimate": {
        id: "nonprofit-clinical-trial-spending-estimate",
        type: "webpage",
        title: "Nonprofit clinical trial funding estimate",
        author: [
          {
            literal: "Estimated from major foundation budgets and activities"
          },
        ],
        note: "Estimated from major foundation budgets and activities",
  },
  "odds-of-decisive-vote": {
        id: "odds-of-decisive-vote",
        type: "article-journal",
        title: "Odds of a single vote being decisive in a U.S. presidential election",
        author: [
          {
            literal: "Columbia/NBER"
          },
        ],
        issued: { 'date-parts': [[2012]] },
        'container-title': "Columbia/NBER: What Is the Probability Your Vote Will Make a Difference?",
        URL: "https://sites.stat.columbia.edu/gelman/research/published/probdecisive2.pdf",
        note: "Columbia/NBER: What Is the Probability Your Vote Will Make a Difference? | Economic Inquiry 2012",
  },
  "oecd-govt-spending": {
        id: "oecd-govt-spending",
        type: "webpage",
        title: "OECD Government Spending as Percentage of GDP",
        author: [
          {
            literal: "OECD"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        URL: "https://data.oecd.org/gga/general-government-spending.htm",
        note: "OECD, 2024, General Government Spending",
  },
  "oecd-median-income": {
        id: "oecd-median-income",
        type: "webpage",
        title: "OECD Median Household Income Comparison",
        author: [
          {
            literal: "OECD"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        URL: "https://data.oecd.org/hha/household-disposable-income.htm",
        note: "OECD, 2024, Household Disposable Income",
  },
  "opensecrets-lobbying-2024": {
        id: "opensecrets-lobbying-2024",
        type: "webpage",
        title: "Federal Lobbying Hit Record \\$4.4 Billion in 2024",
        author: [
          {
            literal: "OpenSecrets"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        URL: "https://www.opensecrets.org/news/2025/02/federal-lobbying-set-new-record-in-2024/",
        note: "OpenSecrets, Federal Lobbying Set New Record in 2024",
  },
  "opensecrets-revolving-door": {
        id: "opensecrets-revolving-door",
        type: "webpage",
        title: "Revolving Door: Former Members of Congress",
        author: [
          {
            literal: "OpenSecrets"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        URL: "https://www.opensecrets.org/revolving-door",
        note: "OpenSecrets, Revolving Door",
  },
  "papanicolas2018": {
        id: "papanicolas2018",
        type: "article-journal",
        title: "Health Care Spending in the United States and Other High-Income Countries",
        author: [
          {
            family: "Papanicolas",
            given: "Irene et al."
          },
        ],
        issued: { 'date-parts': [[2018]] },
        'container-title': "Papanicolas et al.",
        URL: "https://jamanetwork.com/journals/jama/article-abstract/2674671",
        note: "Papanicolas et al., 2018, JAMA | Highly cited comparison of healthcare spending across OECD countries",
  },
  "patient-willingness-clinical-trials": {
        id: "patient-willingness-clinical-trials",
        type: "article-journal",
        title: "Patient willingness to participate in clinical trials",
        author: [
          {
            literal: "Trials"
          },
        ],
        'container-title': "Trials: Patients' Willingness Survey",
        URL: "https://trialsjournal.biomedcentral.com/articles/10.1186/s13063-015-1105-3",
        note: "Trials: Patients' Willingness Survey | Applied Clinical Trials: Patient Participation | PMC: Study Design Factors",
  },
  "pharma-drug-revenue-average": {
        id: "pharma-drug-revenue-average",
        type: "article-journal",
        title: "Average lifetime revenue per successful drug",
        author: [
          {
            literal: "Value in Health"
          },
        ],
        'container-title': "Value in Health: Sales Revenues for New Therapeutic Agents",
        URL: "https://www.sciencedirect.com/science/article/pii/S1098301524027542",
        note: "Value in Health: Sales Revenues for New Therapeutic Agents | ScienceDirect: Sales Revenues FDA Drugs",
  },
  "pharma-roi-current": {
        id: "pharma-roi-current",
        type: "article-journal",
        title: "Pharmaceutical R&D return on investment (ROI)",
        author: [
          {
            literal: "Deloitte"
          },
        ],
        issued: { 'date-parts': [[2025]] },
        'container-title': "Deloitte: Measuring Pharmaceutical Innovation 2025",
        URL: "https://www.deloitte.com/ch/en/Industries/life-sciences-health-care/research/measuring-return-from-pharmaceutical-innovation.html",
        note: "Deloitte: Measuring Pharmaceutical Innovation 2025 | Deloitte 2023: Pharma R&D ROI Falls | HIT Consultant: 13-Year Low",
  },
  "phase-3-cost-per-trial-range": {
        id: "phase-3-cost-per-trial-range",
        type: "article-journal",
        title: "Phase 3 cost per trial range",
        author: [
          {
            literal: "SofproMed"
          },
        ],
        'container-title': "SofproMed",
        URL: "https://www.sofpromed.com/how-much-does-a-clinical-trial-cost",
        note: "SofproMed, How Much Does a Clinical Trial Cost | CBO, Research and Development in the Pharmaceutical Industry",
  },
  "pmc-pragmatic-trial-cost": {
        id: "pmc-pragmatic-trial-cost",
        type: "article-journal",
        title: "Pragmatic Trial Cost per Patient (Median \\$97)",
        author: [
          {
            family: "Ramsberg",
            given: "J. and Platt, R."
          },
        ],
        issued: { 'date-parts': [[2018]] },
        'container-title': "Learning Health Systems",
        URL: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6508852/",
        note: "Harvard Medical School/Harvard Pilgrim Health Care Institute, Learning Health Systems 2018",
  },
  "polio-vaccination-roi": {
        id: "polio-vaccination-roi",
        type: "article-journal",
        title: "Polio Vaccination ROI",
        author: [
          {
            literal: "WHO"
          },
        ],
        issued: { 'date-parts': [[2019]] },
        'container-title': "WHO",
        URL: "https://www.who.int/news-room/feature-stories/detail/sustaining-polio-investments-offers-a-high-return",
        note: "WHO, 2019, Sustaining Polio Investments Offers a High Return",
  },
  "political-dysfunction-tax-paper-2025": {
        id: "political-dysfunction-tax-paper-2025",
        type: "report",
        title: "The Political Dysfunction Tax",
        author: [
          {
            family: "Sinn",
            given: "Mike P."
          },
        ],
        issued: { 'date-parts': [[2025]] },
        publisher: "Institute for Accelerated Medicine",
        URL: "https://manual.warondisease.org/knowledge/appendix/political-dysfunction-tax.html",
        note: "Working Draft",
  },
  "post-1962-drug-approval-drop": {
        id: "post-1962-drug-approval-drop",
        type: "article-journal",
        title: "Lost medicines: a longer view of the pharmaceutical industry with the potential to reinvigorate discovery",
        author: [
          {
            family: "Kinch",
            given: "Michael S. and Griesenauer, Robert H."
          },
        ],
        issued: { 'date-parts': [[2019]] },
        'container-title': "Drug Discovery Today",
        URL: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7245331/",
        note: "Peer-reviewed analysis of drug availability 1962-present. Finds: 1,600+ medicines available in 1962; >50% lost post-Kefauver-Harris Amendment; 1950s peak of >30 new products/year not replicated until late 1990s.",
  },
  "post-1962-life-expectancy-slowdown": {
        id: "post-1962-life-expectancy-slowdown",
        type: "webpage",
        title: "Post-1962 slowdown in life expectancy gains",
        author: [
          {
            literal: "Source: US Life Expectancy FDA Budget 1543-2019 CSV"
          },
        ],
        issued: { 'date-parts': [[2019]] },
        URL: "https://manual.warondisease.org/knowledge/data/us-life-expectancy-fda-budget-1543-2019.csv",
        note: "Source: US Life Expectancy FDA Budget 1543-2019 CSV | Our World in Data: Life Expectancy | Primary sources: Human Mortality Database (historical), CDC NCHS National Vital Statistics (modern)",
  },
  "pragmatic-trials-cost-advantage": {
        id: "pragmatic-trials-cost-advantage",
        type: "article-journal",
        title: "NIH Pragmatic Trials: Minimal Funding Despite 30x Cost Advantage",
        author: [
          {
            literal: "NIH Common Fund"
          },
        ],
        issued: { 'date-parts': [[2025]] },
        'container-title': "NIH Common Fund: HCS Research Collaboratory",
        URL: "https://commonfund.nih.gov/hcscollaboratory",
        note: "NIH Common Fund: HCS Research Collaboratory | PCORnet ADAPTABLE Summary | PMC: Pragmatic Clinical Trials in Healthcare Systems",
  },
  "pre-1962-drug-costs-baily-1972": {
        id: "pre-1962-drug-costs-baily-1972",
        type: "article-journal",
        title: "Pre-1962 drug development costs (Baily 1972)",
        author: [
          {
            family: "Baily",
            given: "Martin Neil"
          },
        ],
        issued: { 'date-parts': [[1972]] },
        'container-title': "Baily (1972)",
        URL: "https://samizdathealth.org/wp-content/uploads/2020/12/hlthaff.1.2.6.pdf",
        note: "Baily (1972), \"Research and Development Costs and Returns: The U.S. Pharmaceutical Industry,\" cited in Health Affairs 1982, The Importance of Patent Term Restoration",
  },
  "pre-1962-drug-costs-timeline": {
        id: "pre-1962-drug-costs-timeline",
        type: "article-journal",
        title: "Pre-1962 drug development costs and timeline (Think by Numbers)",
        author: [
          {
            literal: "Think by Numbers"
          },
        ],
        issued: { 'date-parts': [[1962]] },
        'container-title': "Think by Numbers: How Many Lives Does FDA Save?",
        URL: "https://thinkbynumbers.org/health/how-many-net-lives-does-the-fda-save/",
        note: "Think by Numbers: How Many Lives Does FDA Save? | Wikipedia: Cost of Drug Development | STAT: 1962 Law Slowed Development",
  },
  "pre-1962-physician-trials": {
        id: "pre-1962-physician-trials",
        type: "article-journal",
        title: "Pre-1962 physician-led clinical trials",
        author: [
          {
            literal: "Think by Numbers"
          },
        ],
        issued: { 'date-parts': [[1966]] },
        'container-title': "Think by Numbers: How Many Lives Does FDA Save?",
        URL: "https://thinkbynumbers.org/health/how-many-net-lives-does-the-fda-save/",
        note: "Think by Numbers: How Many Lives Does FDA Save? | FDA: Drug Efficacy Study Implementation | NAS: Drug Efficacy Study 1966-1969",
  },
  "psychological-impact-war-cost": {
        id: "psychological-impact-war-cost",
        type: "article-journal",
        title: "Psychological impact of war cost (\\$100B annually)",
        author: [
          {
            literal: "PubMed"
          },
        ],
        'container-title': "PubMed: Economic Burden of PTSD",
        URL: "https://pubmed.ncbi.nlm.nih.gov/35485933/",
        note: "PubMed: Economic Burden of PTSD | VA News: Study Economic Burden | PMC: Mental Health Costs Armed Conflicts",
  },
  "qaly-threshold-history": {
        id: "qaly-threshold-history",
        type: "article-journal",
        title: "Assessing cost-effectiveness in healthcare: history of the \\$50,000 per QALY threshold",
        author: [
          {
            family: "Gosse",
            given: "M.E."
          },
        ],
        issued: { 'date-parts': [[2008]] },
        'container-title': "Sustainability Impact Metrics",
        URL: "https://ecocostsvalue.com/EVR/img/references%20others/Gosse%202008%20QALY%20threshold%20financial.pdf",
  },
  "qaly-value": {
        id: "qaly-value",
        type: "article-journal",
        title: "Value per QALY (standard economic value)",
        author: [
          {
            literal: "ICER"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "ICER",
        URL: "https://icer.org/wp-content/uploads/2024/02/Reference-Case-4.3.25.pdf",
        note: "ICER, Reference Case",
  },
  "rare-disease-only-5pct-have-treatment": {
        id: "rare-disease-only-5pct-have-treatment",
        type: "article-journal",
        title: "Rare Disease Treatment Gap",
        author: [
          {
            literal: "Orphanet Journal of Rare Diseases (2024)"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "Orphanet Journal of Rare Diseases (2024)",
        URL: "https://ojrd.biomedcentral.com/articles/10.1186/s13023-024-03398-1",
        note: "Orphanet Journal of Rare Diseases (2024)",
  },
  "recovery-cost-500": {
        id: "recovery-cost-500",
        type: "article-journal",
        title: "RECOVERY Trial Cost per Patient",
        author: [
          {
            family: "Oren Cass",
            given: "Manhattan Institute"
          },
        ],
        issued: { 'date-parts': [[2023]] },
        'container-title': "Oren Cass",
        URL: "https://manhattan.institute/article/slow-costly-clinical-trials-drag-down-biomedical-breakthroughs",
        note: "Oren Cass, Manhattan Institute, 2023, Slow, Costly Clinical Trials Drag Down Biomedical Breakthroughs",
  },
  "recovery-trial-1m-lives-saved": {
        id: "recovery-trial-1m-lives-saved",
        type: "article-journal",
        title: "RECOVERY trial global lives saved (~1 million)",
        author: [
          {
            literal: "NHS England; Águas et al."
          },
        ],
        issued: { 'date-parts': [[2021]] },
        'container-title': "NHS England: 1 Million Lives Saved",
        URL: "https://www.england.nhs.uk/2021/03/covid-treatment-developed-in-the-nhs-saves-a-million-lives/",
        note: "NHS England: 1 Million Lives Saved | Águas et al. Nature Communications 2021 | Pharmaceutical Journal | RECOVERY Trial",
  },
  "recovery-trial-82x-cost-reduction": {
        id: "recovery-trial-82x-cost-reduction",
        type: "article-journal",
        title: "RECOVERY trial 82× cost reduction",
        author: [
          {
            literal: "Manhattan Institute"
          },
        ],
        'container-title': "Manhattan Institute: Slow Costly Trials",
        URL: "https://manhattan.institute/article/slow-costly-clinical-trials-drag-down-biomedical-breakthroughs",
        note: "Manhattan Institute: Slow Costly Trials | PMC: Establishing RECOVERY at Scale",
  },
  "rummel-death-by-government": {
        id: "rummel-death-by-government",
        type: "book",
        title: "Death by Government: Genocide and Mass Murder Since 1900",
        author: [
          {
            family: "Rummel",
            given: "R. J."
          },
        ],
        issued: { 'date-parts': [[1994]] },
        publisher: "Transaction Publishers",
        URL: "https://www.hawaii.edu/powerkills/NOTE1.HTM",
  },
  "september-11-memorial": {
        id: "september-11-memorial",
        type: "webpage",
        title: "September 11 Attack Facts",
        author: [
          {
            literal: "National September 11 Memorial & Museum"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        URL: "https://www.911memorial.org/911-faqs",
  },
  "sipri-milex-2024": {
        id: "sipri-milex-2024",
        type: "webpage",
        title: "Trends in World Military Expenditure, 2024",
        author: [
          {
            literal: "Stockholm International Peace Research Institute"
          },
        ],
        issued: { 'date-parts': [[2025]] },
        URL: "https://www.sipri.org/publications/2025/sipri-fact-sheets/trends-world-military-expenditure-2024",
        note: "World military expenditure reached \\$2,718 billion in 2024, an increase of 9.4% in real terms from 2023, the steepest year-on-year rise since at least the end of the cold war. The 10th consecutive annual increase. Global military burden rose to 2.5% of GDP. NATO members spent \\$1.506 trillion (55% of world total). US spent \\$968 billion.",
  },
  "sipri2024": {
        id: "sipri2024",
        type: "webpage",
        title: "Trends in World Military Expenditure, 2023",
        author: [
          {
            literal: "Stockholm International Peace Research Institute"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        URL: "https://www.sipri.org/publications/2024/sipri-fact-sheets/trends-world-military-expenditure-2023",
  },
  "smallpox-eradication-roi": {
        id: "smallpox-eradication-roi",
        type: "article-journal",
        title: "Smallpox Eradication ROI",
        author: [
          {
            literal: "CSIS"
          },
        ],
        'container-title': "CSIS",
        URL: "https://www.csis.org/analysis/smallpox-eradication-model-global-cooperation",
        note: "CSIS, Smallpox Eradication Model: Global Cooperation | PMC3720047, Link",
  },
  "standard-medical-research-roi": {
        id: "standard-medical-research-roi",
        type: "article-journal",
        title: "Standard Medical Research ROI (\\$20k-\\$100k/QALY)",
        author: [
          {
            literal: "PMC"
          },
        ],
        issued: { 'date-parts': [[1990]] },
        'container-title': "PMC: Cost-effectiveness Thresholds Used by Study Authors",
        URL: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10114019/",
        note: "PMC: Cost-effectiveness Thresholds Used by Study Authors, 1990-2021 | ICER Cost-Effectiveness Methods",
  },
  "status-quo-cure-timeline-estimate": {
        id: "status-quo-cure-timeline-estimate",
        type: "webpage",
        title: "Average Time to Cure Under Current System",
        author: [
          {
            literal: "Composite estimate based on Orphanet"
          },
        ],
        note: "Composite estimate based on Orphanet, FDA approval data, and queue theory",
  },
  "sugar-subsidies-cost": {
        id: "sugar-subsidies-cost",
        type: "article-journal",
        title: "Annual cost of U.S. sugar subsidies",
        author: [
          {
            literal: "GAO"
          },
        ],
        'container-title': "GAO: Sugar Program",
        URL: "https://www.gao.gov/products/gao-24-106144",
        note: "GAO: Sugar Program | Heritage: US Sugar Program | AEI: \\$4B Sugar Subsidies",
  },
  "surowiecki-2004": {
        id: "surowiecki-2004",
        type: "book",
        title: "The Wisdom of Crowds",
        author: [
          {
            literal: "James Surowiecki"
          },
        ],
        issued: { 'date-parts': [[2004]] },
        publisher: "Surowiecki",
        URL: "https://archive.org/details/wisdomofcrowds0000suro",
        note: "Surowiecki, J. (2004). The Wisdom of Crowds: Why the Many Are Smarter Than the Few. Doubleday. | Wikipedia | Amazon",
  },
  "swiss-military-budget-0-7-pct-gdp": {
        id: "swiss-military-budget-0-7-pct-gdp",
        type: "article-journal",
        title: "Swiss military budget as percentage of GDP",
        author: [
          {
            literal: "World Bank"
          },
        ],
        'container-title': "World Bank: Military Expenditure % GDP Switzerland",
        URL: "https://data.worldbank.org/indicator/MS.MIL.XPND.GD.ZS?locations=CH",
        note: "World Bank: Military Expenditure % GDP Switzerland | Avenir Suisse: Defense Spending | Trading Economics: Switzerland Military Expenditure",
  },
  "swiss-vs-us-gdp-per-capita": {
        id: "swiss-vs-us-gdp-per-capita",
        type: "article-journal",
        title: "Switzerland vs. US GDP per capita comparison",
        author: [
          {
            literal: "World Bank"
          },
        ],
        'container-title': "World Bank: Switzerland GDP Per Capita",
        URL: "https://data.worldbank.org/indicator/NY.GDP.PCAP.CD?locations=CH",
        note: "World Bank: Switzerland GDP Per Capita | Trading Economics: Switzerland GDP Per Capita PPP | TheGlobalEconomy: USA GDP Per Capita PPP",
  },
  "taxfoundation2024-compliance": {
        id: "taxfoundation2024-compliance",
        type: "article-journal",
        title: "Tax Compliance Costs the US Economy \\$546 Billion Annually",
        author: [
          {
            literal: "Tax Foundation"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        URL: "https://taxfoundation.org/data/all/federal/irs-tax-compliance-costs/",
  },
  "thalidomide-scandal": {
        id: "thalidomide-scandal",
        type: "article-journal",
        title: "Thalidomide scandal: worldwide cases and mortality",
        author: [
          {
            literal: "Wikipedia"
          },
        ],
        'container-title': "Wikipedia",
        URL: "https://en.wikipedia.org/wiki/Thalidomide_scandal",
        note: "Wikipedia, Thalidomide scandal",
  },
  "thalidomide-survivors-health": {
        id: "thalidomide-survivors-health",
        type: "article-journal",
        title: "Health and quality of life of Thalidomide survivors as they age",
        author: [
          {
            literal: "PLOS One"
          },
        ],
        issued: { 'date-parts': [[2019]] },
        'container-title': "PLOS One",
        URL: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0210222",
        note: "PLOS One, 2019, The health and quality of life of Thalidomide survivors as they age",
  },
  "trial-costs-fda-study": {
        id: "trial-costs-fda-study",
        type: "article-journal",
        title: "Trial Costs, FDA Study",
        author: [
          {
            literal: "FDA Study via NCBI"
          },
        ],
        'container-title': "FDA Study via NCBI",
        URL: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6248200/",
        note: "FDA Study via NCBI, Link",
  },
  "ucdp-state-violence-deaths": {
        id: "ucdp-state-violence-deaths",
        type: "article-journal",
        title: "State violence deaths annually",
        author: [
          {
            literal: "UCDP"
          },
        ],
        'container-title': "UCDP: Uppsala Conflict Data Program",
        URL: "https://ucdp.uu.se/",
        note: "UCDP: Uppsala Conflict Data Program | Wikipedia: UCDP | Our World in Data: Armed Conflict Deaths",
  },
  "unhcr-refugee-support-cost": {
        id: "unhcr-refugee-support-cost",
        type: "article-journal",
        title: "UNHCR average refugee support cost",
        author: [
          {
            literal: "CGDev"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "CGDev",
        URL: "https://www.cgdev.org/blog/costs-hosting-refugees-oecd-countries-and-why-uk-outlier",
        note: "CGDev, Costs of Hosting Refugees in OECD Countries | UNHCR/World Bank, Global Cost of Refugee Inclusion",
  },
  "unpaid-caregiver-hours-economic-value": {
        id: "unpaid-caregiver-hours-economic-value",
        type: "article-journal",
        title: "Unpaid caregiver hours and economic value",
        author: [
          {
            literal: "AARP"
          },
        ],
        issued: { 'date-parts': [[2023]] },
        'container-title': "AARP 2023",
        URL: "https://www.aarp.org/caregiving/financial-legal/info-2023/unpaid-caregivers-provide-billions-in-care.html",
        note: "AARP 2023, Unpaid Care Report | Bureau of Labor Statistics 2023-2024, Unpaid Eldercare | National Alliance for Caregiving, Caregiver Statistics",
  },
  "us-census-world-population-1960": {
        id: "us-census-world-population-1960",
        type: "article-journal",
        title: "Historical world population estimates",
        author: [
          {
            literal: "US Census Bureau"
          },
        ],
        'container-title': "US Census Bureau",
        URL: "https://www.census.gov/data/tables/time-series/demo/international-programs/historical-est-worldpop.html",
        note: "US Census Bureau, Historical Estimates of World Population",
  },
  "us-chronic-disease-spending": {
        id: "us-chronic-disease-spending",
        type: "article-journal",
        title: "U.S. chronic disease healthcare spending",
        author: [
          {
            literal: "CDC"
          },
        ],
        'container-title': "CDC",
        URL: "https://www.cdc.gov/chronic-disease/data-research/facts-stats/index.html",
        note: "CDC, Chronic Disease Data",
  },
  "us-military-budget-3-5-pct-gdp": {
        id: "us-military-budget-3-5-pct-gdp",
        type: "article-journal",
        title: "US military budget as percentage of GDP",
        author: [
          {
            literal: "Statista"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "Statista",
        URL: "https://www.statista.com/statistics/262742/countries-with-the-highest-military-spending/",
        note: "Statista, Military spending as percent of GDP | SIPRI, Trends in World Military Expenditure 2024",
  },
  "us-military-spending-historical-constant-dollars": {
        id: "us-military-spending-historical-constant-dollars",
        type: "article-journal",
        title: "U.S. Defense Spending History: 100 Years of Military Budgets",
        author: [
          {
            literal: "Dave Manuel"
          },
        ],
        issued: { 'date-parts': [[2025]] },
        'container-title': "DaveManuel.com",
        URL: "https://www.davemanuel.com/us-defense-spending-history-military-budget-data.php",
        note: "DaveManuel.com, US Defense Spending History in Constant 2024 Dollars. Compiled from OMB historical tables and BLS inflation data.",
  },
  "us-senate-treaties": {
        id: "us-senate-treaties",
        type: "article-journal",
        title: "Treaties",
        author: [
          {
            literal: "U.S. Senate"
          },
        ],
        'container-title': "U.S. Senate",
        URL: "https://www.senate.gov/about/powers-procedures/treaties.htm",
        note: "U.S. Senate, Treaties",
  },
  "us-voter-population": {
        id: "us-voter-population",
        type: "article-journal",
        title: "Number of registered or eligible voters in the U.S.",
        author: [
          {
            literal: "US Census Bureau"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "US Census Bureau",
        URL: "https://www.census.gov/newsroom/press-releases/2025/2024-presidential-election-voting-registration-tables.html",
        note: "US Census Bureau, 2024 Voting and Registration | US EAC, 2024 Election Survey Report",
  },
  "valley-of-death-attrition": {
        id: "valley-of-death-attrition",
        type: "webpage",
        title: "Valley of Death in Drug Development",
        author: [
          {
            literal: "Hutchinson and Kirk"
          },
        ],
        issued: { 'date-parts': [[2011]] },
        URL: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3324971/",
        note: "Hutchinson & Kirk (2011), Drug Discov Today; conservative estimate 40% abandoned due to cost",
  },
  "veteran-healthcare-cost-projections": {
        id: "veteran-healthcare-cost-projections",
        type: "article-journal",
        title: "Veteran healthcare cost projections",
        author: [
          {
            literal: "VA"
          },
        ],
        issued: { 'date-parts': [[2026]] },
        'container-title': "VA",
        URL: "https://department.va.gov/wp-content/uploads/2025/06/2026-Budget-in-Brief.pdf",
        note: "VA, FY 2026 Budget Submission | CBO, Veterans' Disability Compensation | American Legion, VA budget tops \\$400B for 2025",
  },
  "vitamin-a-cost-per-daly": {
        id: "vitamin-a-cost-per-daly",
        type: "article-journal",
        title: "Cost per DALY for Vitamin A Supplementation",
        author: [
          {
            literal: "PLOS ONE"
          },
        ],
        issued: { 'date-parts': [[2010]] },
        'container-title': "PLOS ONE: Cost-effectiveness of \"Golden Mustard\" for Treating Vitamin A Deficiency in India (2010)",
        URL: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0012046",
        note: "PLOS ONE: Cost-effectiveness of \"Golden Mustard\" for Treating Vitamin A Deficiency in India (2010) | PLOS ONE: Cost-effectiveness of Vitamin A supplementation in Sub-Saharan Africa (2022)",
  },
  "warren-buffett-career-average-return-20-pct": {
        id: "warren-buffett-career-average-return-20-pct",
        type: "article-journal",
        title: "Warren Buffett's career average investment return",
        author: [
          {
            literal: "CNBC"
          },
        ],
        issued: { 'date-parts': [[2025]] },
        'container-title': "CNBC",
        URL: "https://www.cnbc.com/2025/05/05/warren-buffetts-return-tally-after-60-years-5502284percent.html",
        note: "CNBC, Warren Buffett's return tally after 60 years: 5,502,284% | SlickCharts, Berkshire Hathaway Returns by Year",
  },
  "who-cost-effectiveness-threshold": {
        id: "who-cost-effectiveness-threshold",
        type: "article-journal",
        title: "Cost-effectiveness threshold (\\$50,000/QALY)",
        author: [
          {
            literal: "PMC"
          },
        ],
        'container-title': "PMC",
        URL: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5193154/",
        note: "PMC, Country-Level Cost-Effectiveness Thresholds | WHO, WHO-CHOICE Methods Update",
  },
  "who-global-health-estimates-2024": {
        id: "who-global-health-estimates-2024",
        type: "article-journal",
        title: "WHO Global Health Estimates 2024",
        author: [
          {
            literal: "World Health Organization"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "World Health Organization",
        URL: "https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates",
        note: "World Health Organization, 2024, Global Health Estimates: Life expectancy and leading causes of death and disability",
  },
  "who-life-expectancy": {
        id: "who-life-expectancy",
        type: "webpage",
        title: "WHO Life Expectancy Data by Country",
        author: [
          {
            literal: "World Health Organization"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        URL: "https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates/ghe-life-expectancy-and-healthy-life-expectancy",
        note: "WHO, 2024, Life Expectancy",
  },
  "world-bank-gross-savings-2023": {
        id: "world-bank-gross-savings-2023",
        type: "webpage",
        title: "Gross Savings (% of GDP)",
        author: [
          {
            literal: "World Bank"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        URL: "https://data.worldbank.org/indicator/NY.GNS.ICTR.ZS?locations=1W",
        note: "World Development Indicators, indicator NY.GNS.ICTR.ZS. Global average ~27% of GDP (2023-2024).",
  },
  "world-bank-trade-disruption-conflict": {
        id: "world-bank-trade-disruption-conflict",
        type: "article-journal",
        title: "World Bank trade disruption cost from conflict",
        author: [
          {
            literal: "World Bank"
          },
        ],
        'container-title': "World Bank",
        URL: "https://www.worldbank.org/en/topic/trade/publication/trading-away-from-conflict",
        note: "World Bank, Trading Away from Conflict | NBER/World Bank, Collateral Damage: Trade Disruption | World Bank, Impacts on Global Trade of Current Trade Disputes",
  },
  "worldbank-gdp": {
        id: "worldbank-gdp",
        type: "article-journal",
        title: "US GDP 2024 (\\$28.78 trillion)",
        author: [
          {
            family: "World Bank",
            given: "Bureau of Economic Analysis"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "World Bank",
        URL: "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=US",
        note: "World Bank, GDP (current US$) - United States | Bureau of Economic Analysis, GDP and the Economy",
  },
  "worldbank-singapore-gdp": {
        id: "worldbank-singapore-gdp",
        type: "article-journal",
        title: "World Bank Singapore Economic Data",
        author: [
          {
            literal: "World Bank"
          },
        ],
        issued: { 'date-parts': [[2024]] },
        'container-title': "World Bank",
        URL: "https://data.worldbank.org/country/singapore",
        note: "World Bank, Singapore Data",
  },
  "yalebudgetlab2025": {
        id: "yalebudgetlab2025",
        type: "webpage",
        title: "The Fiscal, Economic, and Distributional Effects of All U.S. Tariffs",
        author: [
          {
            literal: "Yale Budget Lab"
          },
        ],
        issued: { 'date-parts': [[2025]] },
        URL: "https://budgetlab.yale.edu/research/where-we-stand-fiscal-economic-and-distributional-effects-all-us-tariffs-enacted-2025-through-april",
  }
};

/** Summary statistics */
export const PARAMETER_STATS = {
  total: 612,
  external: 206,
  calculated: 282,
  definitions: 124,
  citations: 143,
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get citation for a parameter by its sourceRef
 * 
 * Example:
 *   const citation = getCitation(ANTIDEPRESSANT_TRIAL_EXCLUSION_RATE);
 *   console.log(formatCitation(citation, 'apa'));
 */
export function getCitation(param: Parameter): Citation | undefined {
  if (!param.sourceRef) return undefined;
  return citations[param.sourceRef];
}

/**
 * Format parameter value with appropriate unit formatting
 */
export function formatValue(param: Parameter): string {
  const { value, unit } = param;

  // Currency formatting
  if (unit === 'USD') {
    if (Math.abs(value) >= 1_000_000_000_000) {
      return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
    } else if (Math.abs(value) >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (Math.abs(value) >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    } else if (Math.abs(value) >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  }

  // Percentage formatting
  if (unit === 'percentage') {
    return `${(value * 100).toFixed(1)}%`;
  }

  if (unit === 'rate') {
    return `${(value * 100).toFixed(1)}%`;
  }

  // Large numbers (deaths, DALYs, etc.)
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B${unit ? ' ' + unit : ''}`;
  } else if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M${unit ? ' ' + unit : ''}`;
  } else if (Math.abs(value) >= 1_000) {
    return `${value.toLocaleString()}${unit ? ' ' + unit : ''}`;
  }

  return `${value}${unit ? ' ' + unit : ''}`;
}

/**
 * Format citation in APA or MLA style
 */
export function formatCitation(
  citation: Citation | undefined,
  style: 'apa' | 'mla' = 'apa'
): string {
  if (!citation) return '';

  const author = citation.author?.[0]?.literal ||
                 (citation.author?.[0]?.family
                   ? `${citation.author[0].family}, ${citation.author[0].given || ''}`
                   : 'Unknown Author');
  const year = citation.issued?.['date-parts']?.[0]?.[0] || 'n.d.';
  const title = citation.title;

  if (style === 'apa') {
    // APA: Author (Year). Title. URL
    let result = `${author} (${year}). ${title}.`;
    if (citation.URL) result += ` ${citation.URL}`;
    return result;
  } else {
    // MLA: Author. "Title." Year. URL
    let result = `${author}. "${title}." ${year}.`;
    if (citation.URL) result += ` ${citation.URL}`;
    return result;
  }
}
