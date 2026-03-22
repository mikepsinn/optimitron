/**
 * US Federal Budget Dataset
 *
 * Comprehensive federal budget data with real spending figures,
 * historical trends (FY2015-FY2025), and outcome metrics per category.
 *
 * Sources:
 * - White House Office of Management and Budget (OMB) Historical Tables
 * - Congressional Budget Office (CBO) Budget and Economic Outlook
 * - Bureau of Economic Analysis (BEA)
 * - Various agency-specific sources cited in outcome metrics
 *
 * Notes:
 * - FY2025 figures are estimates from the President's Budget / CBO baseline
 * - Historical figures are actual outlays from OMB Historical Table 3.2 / 5.2
 * - All spending in billions of current-year USD
 * - "percentOfTotal" is of total federal outlays (~$6.9T FY2025 estimate)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OutcomeMetric {
  /** Human-readable metric name */
  name: string;
  /** Numeric value */
  value: number;
  /** Unit of measurement (e.g. "per 100K", "%", "rank") */
  unit: string;
  /** Year the metric was measured */
  year: number;
  /** Authoritative data source */
  source: string;
  /** Direction of recent trend */
  trend: 'improving' | 'declining' | 'stable';
}

export interface HistoricalSpending {
  year: number;
  /** Outlays in billions of current-year USD */
  amount: number;
}

export interface BudgetCategory {
  /** Category name */
  name: string;
  /** FY2025 outlays in billions of nominal USD */
  spendingBillions: number;
  /** Percent of total federal outlays */
  percentOfTotal: number;
  /** Whether this is mandatory or discretionary spending */
  type: 'mandatory' | 'discretionary' | 'net_interest';
  /** Historical outlays FY2015-FY2025 */
  historicalSpending: HistoricalSpending[];
  /** Real-world outcome metrics tied to this spending area */
  outcomeMetrics: OutcomeMetric[];
}

export interface FederalBudgetDataset {
  /** Fiscal year of the primary snapshot */
  fiscalYear: number;
  /** Total federal outlays in billions USD */
  totalOutlays: number;
  /** Total federal revenues in billions USD */
  totalRevenues: number;
  /** Deficit (negative) or surplus in billions USD */
  deficit: number;
  /** Gross federal debt in billions USD */
  grossDebt: number;
  /** GDP in billions USD for context */
  gdp: number;
  /** Budget categories with spending and outcomes */
  categories: BudgetCategory[];
  /** Data sources and methodology notes */
  metadata: {
    sources: string[];
    methodology: string;
    lastUpdated: string;
  };
}

// ─── Data ────────────────────────────────────────────────────────────────────

export const US_FEDERAL_BUDGET: FederalBudgetDataset = {
  fiscalYear: 2025,
  totalOutlays: 6872,
  totalRevenues: 4959,
  deficit: -1913,
  grossDebt: 36200,
  gdp: 29940,
  categories: [
    // ─── Social Security ───────────────────────────────────────────────
    {
      name: 'Social Security',
      spendingBillions: 1461,
      percentOfTotal: 21.3,
      type: 'mandatory',
      historicalSpending: [
        { year: 2015, amount: 882 },
        { year: 2016, amount: 910 },
        { year: 2017, amount: 939 },
        { year: 2018, amount: 982 },
        { year: 2019, amount: 1039 },
        { year: 2020, amount: 1090 },
        { year: 2021, amount: 1133 },
        { year: 2022, amount: 1219 },
        { year: 2023, amount: 1354 },
        { year: 2024, amount: 1417 },
        { year: 2025, amount: 1461 },
      ],
      outcomeMetrics: [
        {
          name: 'Elderly poverty rate',
          value: 10.2,
          unit: '%',
          year: 2023,
          source: 'Census Bureau Current Population Survey',
          trend: 'stable',
        },
        {
          name: 'Beneficiaries',
          value: 67.9,
          unit: 'million',
          year: 2024,
          source: 'Social Security Administration',
          trend: 'improving',
        },
        {
          name: 'Average monthly retirement benefit',
          value: 1907,
          unit: 'USD/month',
          year: 2024,
          source: 'Social Security Administration',
          trend: 'improving',
        },
        {
          name: 'Trust fund depletion year (projected)',
          value: 2033,
          unit: 'year',
          year: 2024,
          source: 'SSA Board of Trustees Annual Report 2024',
          trend: 'declining',
        },
      ],
    },

    // ─── Interest on Debt ──────────────────────────────────────────────
    {
      name: 'Interest on Debt',
      spendingBillions: 892,
      percentOfTotal: 13.0,
      type: 'net_interest',
      historicalSpending: [
        { year: 2015, amount: 223 },
        { year: 2016, amount: 240 },
        { year: 2017, amount: 263 },
        { year: 2018, amount: 325 },
        { year: 2019, amount: 375 },
        { year: 2020, amount: 345 },
        { year: 2021, amount: 352 },
        { year: 2022, amount: 475 },
        { year: 2023, amount: 659 },
        { year: 2024, amount: 882 },
        { year: 2025, amount: 892 },
      ],
      outcomeMetrics: [
        {
          name: 'Debt-to-GDP ratio',
          value: 121,
          unit: '%',
          year: 2025,
          source: 'CBO Budget and Economic Outlook, Jan 2025',
          trend: 'declining',
        },
        {
          name: 'Net interest as % of revenue',
          value: 18.0,
          unit: '%',
          year: 2025,
          source: 'CBO Budget and Economic Outlook, Jan 2025',
          trend: 'declining',
        },
        {
          name: 'Average interest rate on debt',
          value: 3.3,
          unit: '%',
          year: 2024,
          source: 'Treasury Department, Monthly Statement of Public Debt',
          trend: 'declining',
        },
      ],
    },

    // ─── Military ────────────────────────────────────────────────────────
    {
      name: 'Military',
      spendingBillions: 886,
      percentOfTotal: 12.9,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 596 },
        { year: 2016, amount: 604 },
        { year: 2017, amount: 610 },
        { year: 2018, amount: 654 },
        { year: 2019, amount: 686 },
        { year: 2020, amount: 714 },
        { year: 2021, amount: 742 },
        { year: 2022, amount: 766 },
        { year: 2023, amount: 806 },
        { year: 2024, amount: 849 },
        { year: 2025, amount: 886 },
      ],
      outcomeMetrics: [
        {
          name: 'Global Peace Index ranking (US)',
          value: 131,
          unit: 'rank out of 163',
          year: 2024,
          source: 'Institute for Economics and Peace, Global Peace Index 2024',
          trend: 'declining',
        },
        {
          name: 'Military strength index (Global Firepower)',
          value: 1,
          unit: 'rank',
          year: 2024,
          source: 'Global Firepower Index 2024',
          trend: 'stable',
        },
        {
          name: 'Active duty personnel',
          value: 1.33,
          unit: 'million',
          year: 2024,
          source: 'DoD Defense Manpower Data Center',
          trend: 'declining',
        },
        {
          name: 'Military spending as % GDP',
          value: 3.0,
          unit: '%',
          year: 2025,
          source: 'OMB Historical Tables',
          trend: 'stable',
        },
      ],
    },

    // ─── Medicare ──────────────────────────────────────────────────────
    {
      name: 'Medicare',
      spendingBillions: 874,
      percentOfTotal: 12.7,
      type: 'mandatory',
      historicalSpending: [
        { year: 2015, amount: 546 },
        { year: 2016, amount: 588 },
        { year: 2017, amount: 595 },
        { year: 2018, amount: 605 },
        { year: 2019, amount: 651 },
        { year: 2020, amount: 776 },
        { year: 2021, amount: 755 },
        { year: 2022, amount: 747 },
        { year: 2023, amount: 839 },
        { year: 2024, amount: 869 },
        { year: 2025, amount: 874 },
      ],
      outcomeMetrics: [
        {
          name: 'Life expectancy at 65',
          value: 18.9,
          unit: 'years',
          year: 2022,
          source: 'CDC National Vital Statistics Reports',
          trend: 'declining',
        },
        {
          name: 'Medicare beneficiaries',
          value: 67.4,
          unit: 'million',
          year: 2024,
          source: 'CMS Medicare Enrollment Dashboard',
          trend: 'improving',
        },
        {
          name: 'Hospital readmission rate (30-day)',
          value: 15.3,
          unit: '%',
          year: 2023,
          source: 'CMS Hospital Readmissions Reduction Program',
          trend: 'improving',
        },
        {
          name: 'Per-capita Medicare spending',
          value: 13050,
          unit: 'USD',
          year: 2023,
          source: 'CMS National Health Expenditure Accounts',
          trend: 'declining',
        },
      ],
    },

    // ─── Medicaid ──────────────────────────────────────────────────────
    {
      name: 'Medicaid',
      spendingBillions: 616,
      percentOfTotal: 9.0,
      type: 'mandatory',
      historicalSpending: [
        { year: 2015, amount: 350 },
        { year: 2016, amount: 368 },
        { year: 2017, amount: 375 },
        { year: 2018, amount: 389 },
        { year: 2019, amount: 409 },
        { year: 2020, amount: 458 },
        { year: 2021, amount: 521 },
        { year: 2022, amount: 592 },
        { year: 2023, amount: 616 },
        { year: 2024, amount: 618 },
        { year: 2025, amount: 616 },
      ],
      outcomeMetrics: [
        {
          name: 'Uninsured rate (overall)',
          value: 7.9,
          unit: '%',
          year: 2023,
          source: 'Census Bureau American Community Survey',
          trend: 'improving',
        },
        {
          name: 'Medicaid enrollment',
          value: 72.0,
          unit: 'million',
          year: 2024,
          source: 'CMS Medicaid Enrollment Reports',
          trend: 'declining',
        },
        {
          name: 'Infant mortality rate',
          value: 5.6,
          unit: 'per 1,000 live births',
          year: 2022,
          source: 'CDC WONDER',
          trend: 'declining',
        },
        {
          name: 'Children covered by Medicaid/CHIP',
          value: 39.7,
          unit: 'million',
          year: 2023,
          source: 'CMS Medicaid & CHIP Enrollment Data',
          trend: 'stable',
        },
      ],
    },

    // ─── Veterans Affairs ──────────────────────────────────────────────
    {
      name: 'Veterans Affairs',
      spendingBillions: 325,
      percentOfTotal: 4.7,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 161 },
        { year: 2016, amount: 167 },
        { year: 2017, amount: 176 },
        { year: 2018, amount: 189 },
        { year: 2019, amount: 200 },
        { year: 2020, amount: 218 },
        { year: 2021, amount: 234 },
        { year: 2022, amount: 267 },
        { year: 2023, amount: 302 },
        { year: 2024, amount: 314 },
        { year: 2025, amount: 325 },
      ],
      outcomeMetrics: [
        {
          name: 'Veteran suicide rate',
          value: 33.9,
          unit: 'per 100,000 veterans',
          year: 2021,
          source: 'VA National Veteran Suicide Prevention Annual Report 2023',
          trend: 'stable',
        },
        {
          name: 'VA patient satisfaction (inpatient)',
          value: 71,
          unit: '% satisfied',
          year: 2023,
          source: 'VA Survey of Healthcare Experiences of Patients (SHEP)',
          trend: 'improving',
        },
        {
          name: 'Veteran homelessness',
          value: 35286,
          unit: 'individuals',
          year: 2024,
          source: 'HUD Annual Homeless Assessment Report',
          trend: 'improving',
        },
        {
          name: 'Average wait time for primary care',
          value: 20.3,
          unit: 'days',
          year: 2024,
          source: 'VA Access and Quality Reports',
          trend: 'improving',
        },
      ],
    },

    // ─── Other Mandatory Programs ──────────────────────────────────────
    {
      name: 'Other Mandatory Programs',
      spendingBillions: 842,
      percentOfTotal: 12.3,
      type: 'mandatory',
      historicalSpending: [
        { year: 2015, amount: 550 },
        { year: 2016, amount: 572 },
        { year: 2017, amount: 581 },
        { year: 2018, amount: 611 },
        { year: 2019, amount: 624 },
        { year: 2020, amount: 1631 },
        { year: 2021, amount: 1765 },
        { year: 2022, amount: 984 },
        { year: 2023, amount: 853 },
        { year: 2024, amount: 836 },
        { year: 2025, amount: 842 },
      ],
      outcomeMetrics: [
        {
          name: 'SNAP participation',
          value: 41.2,
          unit: 'million',
          year: 2024,
          source: 'USDA Food and Nutrition Service',
          trend: 'declining',
        },
        {
          name: 'Unemployment rate',
          value: 4.2,
          unit: '%',
          year: 2024,
          source: 'BLS Current Population Survey',
          trend: 'stable',
        },
        {
          name: 'Poverty rate (overall)',
          value: 11.1,
          unit: '%',
          year: 2023,
          source: 'Census Bureau Current Population Survey',
          trend: 'stable',
        },
      ],
    },

    // ─── Transportation ────────────────────────────────────────────────
    {
      name: 'Transportation',
      spendingBillions: 105,
      percentOfTotal: 1.5,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 86 },
        { year: 2016, amount: 89 },
        { year: 2017, amount: 87 },
        { year: 2018, amount: 88 },
        { year: 2019, amount: 92 },
        { year: 2020, amount: 100 },
        { year: 2021, amount: 95 },
        { year: 2022, amount: 97 },
        { year: 2023, amount: 101 },
        { year: 2024, amount: 103 },
        { year: 2025, amount: 105 },
      ],
      outcomeMetrics: [
        {
          name: 'Infrastructure grade (ASCE)',
          value: 67,
          unit: 'C- (on 100-point scale)',
          year: 2021,
          source: 'American Society of Civil Engineers Report Card',
          trend: 'improving',
        },
        {
          name: 'Traffic fatalities',
          value: 40990,
          unit: 'deaths',
          year: 2023,
          source: 'NHTSA Fatality Analysis Reporting System (FARS)',
          trend: 'declining',
        },
        {
          name: 'Traffic fatality rate',
          value: 12.1,
          unit: 'per 100,000 population',
          year: 2023,
          source: 'NHTSA FARS',
          trend: 'declining',
        },
        {
          name: 'Structurally deficient bridges',
          value: 42966,
          unit: 'bridges',
          year: 2023,
          source: 'FHWA National Bridge Inventory',
          trend: 'improving',
        },
      ],
    },

    // ─── Education ─────────────────────────────────────────────────────
    {
      name: 'Education',
      spendingBillions: 102,
      percentOfTotal: 1.5,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 70 },
        { year: 2016, amount: 73 },
        { year: 2017, amount: 68 },
        { year: 2018, amount: 71 },
        { year: 2019, amount: 72 },
        { year: 2020, amount: 76 },
        { year: 2021, amount: 102 },
        { year: 2022, amount: 131 },
        { year: 2023, amount: 119 },
        { year: 2024, amount: 108 },
        { year: 2025, amount: 102 },
      ],
      outcomeMetrics: [
        {
          name: 'High school graduation rate',
          value: 87.0,
          unit: '%',
          year: 2022,
          source: 'NCES Digest of Education Statistics',
          trend: 'stable',
        },
        {
          name: 'College enrollment rate (18-24)',
          value: 38.0,
          unit: '%',
          year: 2023,
          source: 'NCES Condition of Education',
          trend: 'declining',
        },
        {
          name: 'PISA math score (US)',
          value: 465,
          unit: 'score',
          year: 2022,
          source: 'OECD PISA 2022',
          trend: 'declining',
        },
        {
          name: 'PISA reading score (US)',
          value: 504,
          unit: 'score',
          year: 2022,
          source: 'OECD PISA 2022',
          trend: 'declining',
        },
        {
          name: 'Student loan debt (total)',
          value: 1740,
          unit: 'billion USD',
          year: 2024,
          source: 'Federal Reserve Bank of New York',
          trend: 'declining',
        },
      ],
    },

    // ─── HUD / Housing ─────────────────────────────────────────────────
    {
      name: 'HUD / Housing',
      spendingBillions: 73,
      percentOfTotal: 1.1,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 37 },
        { year: 2016, amount: 39 },
        { year: 2017, amount: 39 },
        { year: 2018, amount: 41 },
        { year: 2019, amount: 44 },
        { year: 2020, amount: 56 },
        { year: 2021, amount: 63 },
        { year: 2022, amount: 60 },
        { year: 2023, amount: 68 },
        { year: 2024, amount: 71 },
        { year: 2025, amount: 73 },
      ],
      outcomeMetrics: [
        {
          name: 'Total homeless population',
          value: 653104,
          unit: 'individuals',
          year: 2023,
          source: 'HUD Annual Homeless Assessment Report',
          trend: 'declining',
        },
        {
          name: 'Housing cost burden (>30% income)',
          value: 30.0,
          unit: '% of households',
          year: 2023,
          source: 'Census Bureau American Community Survey',
          trend: 'declining',
        },
        {
          name: 'Homeownership rate',
          value: 65.6,
          unit: '%',
          year: 2024,
          source: 'Census Bureau Housing Vacancies and Homeownership',
          trend: 'stable',
        },
      ],
    },

    // ─── Foreign Aid (International Affairs) ───────────────────────────
    {
      name: 'Foreign Aid / International Affairs',
      spendingBillions: 63,
      percentOfTotal: 0.9,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 46 },
        { year: 2016, amount: 46 },
        { year: 2017, amount: 47 },
        { year: 2018, amount: 49 },
        { year: 2019, amount: 52 },
        { year: 2020, amount: 51 },
        { year: 2021, amount: 55 },
        { year: 2022, amount: 66 },
        { year: 2023, amount: 73 },
        { year: 2024, amount: 67 },
        { year: 2025, amount: 63 },
      ],
      outcomeMetrics: [
        {
          name: 'Foreign aid as % GNI',
          value: 0.22,
          unit: '%',
          year: 2023,
          source: 'OECD DAC Statistics',
          trend: 'stable',
        },
        {
          name: 'PEPFAR lives saved (cumulative)',
          value: 25,
          unit: 'million',
          year: 2024,
          source: 'PEPFAR Results & Impact',
          trend: 'improving',
        },
        {
          name: 'Countries receiving US bilateral aid',
          value: 140,
          unit: 'countries',
          year: 2023,
          source: 'USAID Foreign Aid Explorer',
          trend: 'stable',
        },
      ],
    },

    // ─── Energy ────────────────────────────────────────────────────────
    {
      name: 'Energy',
      spendingBillions: 52,
      percentOfTotal: 0.8,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 29 },
        { year: 2016, amount: 32 },
        { year: 2017, amount: 30 },
        { year: 2018, amount: 31 },
        { year: 2019, amount: 35 },
        { year: 2020, amount: 38 },
        { year: 2021, amount: 42 },
        { year: 2022, amount: 44 },
        { year: 2023, amount: 47 },
        { year: 2024, amount: 50 },
        { year: 2025, amount: 52 },
      ],
      outcomeMetrics: [
        {
          name: 'Renewable energy share of electricity',
          value: 22.7,
          unit: '%',
          year: 2023,
          source: 'EIA Electric Power Monthly',
          trend: 'improving',
        },
        {
          name: 'Energy-related CO₂ emissions',
          value: 4790,
          unit: 'million metric tons',
          year: 2023,
          source: 'EIA Monthly Energy Review',
          trend: 'improving',
        },
        {
          name: 'Average retail electricity price',
          value: 12.7,
          unit: 'cents/kWh',
          year: 2024,
          source: 'EIA Electric Power Monthly',
          trend: 'declining',
        },
      ],
    },

    // ─── Science / NASA ────────────────────────────────────────────────
    {
      name: 'Science / NASA',
      spendingBillions: 44,
      percentOfTotal: 0.6,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 30 },
        { year: 2016, amount: 31 },
        { year: 2017, amount: 31 },
        { year: 2018, amount: 32 },
        { year: 2019, amount: 33 },
        { year: 2020, amount: 35 },
        { year: 2021, amount: 37 },
        { year: 2022, amount: 40 },
        { year: 2023, amount: 42 },
        { year: 2024, amount: 43 },
        { year: 2025, amount: 44 },
      ],
      outcomeMetrics: [
        {
          name: 'R&D as % of GDP (federal)',
          value: 0.67,
          unit: '%',
          year: 2023,
          source: 'AAAS R&D Budget and Policy Program',
          trend: 'stable',
        },
        {
          name: 'US patents granted',
          value: 352013,
          unit: 'patents',
          year: 2023,
          source: 'USPTO Patent Statistics',
          trend: 'stable',
        },
        {
          name: 'Nobel Prizes in science (cumulative, US-affiliated)',
          value: 285,
          unit: 'prizes',
          year: 2024,
          source: 'Nobel Foundation',
          trend: 'improving',
        },
        {
          name: 'NASA commercial crew missions',
          value: 12,
          unit: 'missions',
          year: 2024,
          source: 'NASA Commercial Crew Program',
          trend: 'improving',
        },
      ],
    },

    // ─── Justice / Law Enforcement ─────────────────────────────────────
    {
      name: 'Justice / Law Enforcement',
      spendingBillions: 40,
      percentOfTotal: 0.6,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 33 },
        { year: 2016, amount: 33 },
        { year: 2017, amount: 35 },
        { year: 2018, amount: 34 },
        { year: 2019, amount: 34 },
        { year: 2020, amount: 37 },
        { year: 2021, amount: 39 },
        { year: 2022, amount: 38 },
        { year: 2023, amount: 39 },
        { year: 2024, amount: 40 },
        { year: 2025, amount: 40 },
      ],
      outcomeMetrics: [
        {
          name: 'Violent crime rate',
          value: 363.8,
          unit: 'per 100,000 population',
          year: 2023,
          source: 'FBI Uniform Crime Reporting (UCR)',
          trend: 'improving',
        },
        {
          name: 'Incarceration rate',
          value: 531,
          unit: 'per 100,000 population',
          year: 2022,
          source: 'Bureau of Justice Statistics',
          trend: 'improving',
        },
        {
          name: 'Federal prison population',
          value: 158169,
          unit: 'inmates',
          year: 2024,
          source: 'Federal Bureau of Prisons',
          trend: 'stable',
        },
      ],
    },

    // ─── Agriculture ───────────────────────────────────────────────────
    {
      name: 'Agriculture',
      spendingBillions: 38,
      percentOfTotal: 0.6,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 25 },
        { year: 2016, amount: 24 },
        { year: 2017, amount: 24 },
        { year: 2018, amount: 25 },
        { year: 2019, amount: 39 },
        { year: 2020, amount: 46 },
        { year: 2021, amount: 28 },
        { year: 2022, amount: 29 },
        { year: 2023, amount: 33 },
        { year: 2024, amount: 36 },
        { year: 2025, amount: 38 },
      ],
      outcomeMetrics: [
        {
          name: 'Food insecurity rate',
          value: 12.8,
          unit: '% of households',
          year: 2023,
          source: 'USDA Economic Research Service',
          trend: 'declining',
        },
        {
          name: 'Farm income (net)',
          value: 116.1,
          unit: 'billion USD',
          year: 2024,
          source: 'USDA Economic Research Service',
          trend: 'declining',
        },
        {
          name: 'Crop export value',
          value: 171,
          unit: 'billion USD',
          year: 2023,
          source: 'USDA Foreign Agricultural Service',
          trend: 'declining',
        },
      ],
    },

    // ─── EPA / Environment ─────────────────────────────────────────────
    {
      name: 'EPA / Environment',
      spendingBillions: 12,
      percentOfTotal: 0.2,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 8.1 },
        { year: 2016, amount: 8.6 },
        { year: 2017, amount: 8.1 },
        { year: 2018, amount: 8.8 },
        { year: 2019, amount: 9.0 },
        { year: 2020, amount: 9.4 },
        { year: 2021, amount: 9.2 },
        { year: 2022, amount: 10.5 },
        { year: 2023, amount: 11.0 },
        { year: 2024, amount: 11.5 },
        { year: 2025, amount: 12.0 },
      ],
      outcomeMetrics: [
        {
          name: 'Days exceeding Air Quality Index standards',
          value: 117,
          unit: 'days (across all US counties)',
          year: 2023,
          source: 'EPA Air Quality Statistics Report',
          trend: 'declining',
        },
        {
          name: 'Greenhouse gas emissions',
          value: 5060,
          unit: 'million metric tons CO₂e',
          year: 2022,
          source: 'EPA Inventory of U.S. GHG Emissions & Sinks',
          trend: 'improving',
        },
        {
          name: 'Superfund sites cleaned up (cumulative)',
          value: 459,
          unit: 'sites',
          year: 2024,
          source: 'EPA Superfund National Priorities List',
          trend: 'improving',
        },
        {
          name: 'Clean Water Act compliance rate',
          value: 86,
          unit: '%',
          year: 2023,
          source: 'EPA Enforcement & Compliance History Online',
          trend: 'stable',
        },
      ],
    },

    // ─── Health (non-Medicare/Medicaid) ─────────────────────────────────
    {
      name: 'Health (non-Medicare/Medicaid)',
      spendingBillions: 94,
      percentOfTotal: 1.4,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 66 },
        { year: 2016, amount: 67 },
        { year: 2017, amount: 65 },
        { year: 2018, amount: 71 },
        { year: 2019, amount: 75 },
        { year: 2020, amount: 122 },
        { year: 2021, amount: 190 },
        { year: 2022, amount: 127 },
        { year: 2023, amount: 102 },
        { year: 2024, amount: 97 },
        { year: 2025, amount: 94 },
      ],
      outcomeMetrics: [
        {
          name: 'Life expectancy at birth',
          value: 77.5,
          unit: 'years',
          year: 2022,
          source: 'CDC National Vital Statistics Reports',
          trend: 'improving',
        },
        {
          name: 'Opioid overdose deaths',
          value: 81083,
          unit: 'deaths',
          year: 2023,
          source: 'CDC WONDER Multiple Cause of Death',
          trend: 'improving',
        },
        {
          name: 'NIH-funded clinical trials',
          value: 13500,
          unit: 'trials',
          year: 2024,
          source: 'NIH Reporter',
          trend: 'improving',
        },
      ],
    },

    // ─── Homeland Security ─────────────────────────────────────────────
    {
      name: 'Homeland Security',
      spendingBillions: 62,
      percentOfTotal: 0.9,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 39 },
        { year: 2016, amount: 41 },
        { year: 2017, amount: 42 },
        { year: 2018, amount: 46 },
        { year: 2019, amount: 51 },
        { year: 2020, amount: 52 },
        { year: 2021, amount: 55 },
        { year: 2022, amount: 54 },
        { year: 2023, amount: 57 },
        { year: 2024, amount: 60 },
        { year: 2025, amount: 62 },
      ],
      outcomeMetrics: [
        {
          name: 'Southwest border encounters',
          value: 2048000,
          unit: 'encounters',
          year: 2023,
          source: 'CBP Nationwide Encounters',
          trend: 'declining',
        },
        {
          name: 'Domestic terrorism incidents',
          value: 38,
          unit: 'incidents',
          year: 2023,
          source: 'FBI Terrorism Review',
          trend: 'improving',
        },
        {
          name: 'Disaster relief obligated (FEMA)',
          value: 34.2,
          unit: 'billion USD',
          year: 2023,
          source: 'FEMA Disaster Relief Fund Monthly Reports',
          trend: 'declining',
        },
      ],
    },

    // ─── Labor ─────────────────────────────────────────────────────────
    {
      name: 'Labor',
      spendingBillions: 42,
      percentOfTotal: 0.6,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 43 },
        { year: 2016, amount: 40 },
        { year: 2017, amount: 38 },
        { year: 2018, amount: 37 },
        { year: 2019, amount: 38 },
        { year: 2020, amount: 64 },
        { year: 2021, amount: 47 },
        { year: 2022, amount: 46 },
        { year: 2023, amount: 44 },
        { year: 2024, amount: 43 },
        { year: 2025, amount: 42 },
      ],
      outcomeMetrics: [
        {
          name: 'Labor force participation rate',
          value: 62.5,
          unit: '%',
          year: 2024,
          source: 'BLS Current Population Survey',
          trend: 'stable',
        },
        {
          name: 'Median weekly earnings',
          value: 1145,
          unit: 'USD',
          year: 2024,
          source: 'BLS Usual Weekly Earnings Report',
          trend: 'improving',
        },
        {
          name: 'Workplace fatalities',
          value: 5283,
          unit: 'deaths',
          year: 2023,
          source: 'BLS Census of Fatal Occupational Injuries',
          trend: 'stable',
        },
      ],
    },

    // ─── Commerce / Economic Development ───────────────────────────────
    {
      name: 'Commerce / Economic Development',
      spendingBillions: 18,
      percentOfTotal: 0.3,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 9 },
        { year: 2016, amount: 9.5 },
        { year: 2017, amount: 9.2 },
        { year: 2018, amount: 11.5 },
        { year: 2019, amount: 12 },
        { year: 2020, amount: 34 },
        { year: 2021, amount: 30 },
        { year: 2022, amount: 22 },
        { year: 2023, amount: 20 },
        { year: 2024, amount: 19 },
        { year: 2025, amount: 18 },
      ],
      outcomeMetrics: [
        {
          name: 'GDP growth rate (real)',
          value: 2.5,
          unit: '%',
          year: 2024,
          source: 'BEA National Income and Product Accounts',
          trend: 'stable',
        },
        {
          name: 'New business applications',
          value: 5500000,
          unit: 'applications',
          year: 2024,
          source: 'Census Bureau Business Formation Statistics',
          trend: 'improving',
        },
      ],
    },

    // ─── Interior / Natural Resources ──────────────────────────────────
    {
      name: 'Interior / Natural Resources',
      spendingBillions: 17,
      percentOfTotal: 0.2,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 12.4 },
        { year: 2016, amount: 13.1 },
        { year: 2017, amount: 12.6 },
        { year: 2018, amount: 12.9 },
        { year: 2019, amount: 13.5 },
        { year: 2020, amount: 14.1 },
        { year: 2021, amount: 14.8 },
        { year: 2022, amount: 15.4 },
        { year: 2023, amount: 16.0 },
        { year: 2024, amount: 16.5 },
        { year: 2025, amount: 17.0 },
      ],
      outcomeMetrics: [
        {
          name: 'National park visits',
          value: 325.5,
          unit: 'million visits',
          year: 2023,
          source: 'NPS Visitor Use Statistics',
          trend: 'improving',
        },
        {
          name: 'Wildfire acres burned',
          value: 2693910,
          unit: 'acres',
          year: 2023,
          source: 'National Interagency Fire Center',
          trend: 'declining',
        },
        {
          name: 'Endangered species recovered',
          value: 54,
          unit: 'species (cumulative)',
          year: 2024,
          source: 'USFWS Endangered Species Program',
          trend: 'improving',
        },
      ],
    },

    // ─── Treasury / General Government ─────────────────────────────────
    {
      name: 'Treasury / General Government',
      spendingBillions: 30,
      percentOfTotal: 0.4,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 23 },
        { year: 2016, amount: 23 },
        { year: 2017, amount: 22 },
        { year: 2018, amount: 24 },
        { year: 2019, amount: 25 },
        { year: 2020, amount: 25 },
        { year: 2021, amount: 27 },
        { year: 2022, amount: 28 },
        { year: 2023, amount: 29 },
        { year: 2024, amount: 29 },
        { year: 2025, amount: 30 },
      ],
      outcomeMetrics: [
        {
          name: 'Tax gap (estimated)',
          value: 688,
          unit: 'billion USD',
          year: 2021,
          source: 'IRS Tax Gap Estimates, Publication 1415',
          trend: 'declining',
        },
        {
          name: 'IRS voluntary compliance rate',
          value: 83.6,
          unit: '%',
          year: 2021,
          source: 'IRS Data Book',
          trend: 'stable',
        },
      ],
    },

    // ─── State Department / Diplomacy ──────────────────────────────────
    {
      name: 'State Department / Diplomacy',
      spendingBillions: 19,
      percentOfTotal: 0.3,
      type: 'discretionary',
      historicalSpending: [
        { year: 2015, amount: 15 },
        { year: 2016, amount: 15.5 },
        { year: 2017, amount: 15.2 },
        { year: 2018, amount: 15.0 },
        { year: 2019, amount: 15.7 },
        { year: 2020, amount: 16 },
        { year: 2021, amount: 16.5 },
        { year: 2022, amount: 17.2 },
        { year: 2023, amount: 18.0 },
        { year: 2024, amount: 18.5 },
        { year: 2025, amount: 19.0 },
      ],
      outcomeMetrics: [
        {
          name: 'US passport holders',
          value: 160,
          unit: 'million',
          year: 2024,
          source: 'State Department Bureau of Consular Affairs',
          trend: 'improving',
        },
        {
          name: 'Bilateral trade agreements active',
          value: 14,
          unit: 'agreements',
          year: 2024,
          source: 'USTR Trade Agreements',
          trend: 'stable',
        },
      ],
    },
  ],

  metadata: {
    sources: [
      'OMB Historical Tables (whitehouse.gov/omb/budget/historical-tables)',
      'CBO Budget and Economic Outlook, January 2025',
      'CBO Monthly Budget Review',
      'Treasury Monthly Treasury Statement',
      'BEA National Income and Product Accounts',
    ],
    methodology:
      'FY2025 figures are estimates based on the CBO January 2025 baseline. ' +
      'Historical figures (FY2015-FY2024) are actual outlays from OMB Historical Table 3.2, ' +
      'supplemented by agency-specific budget documents. ' +
      'Some categories are composites (e.g., "Other Mandatory Programs" includes SNAP, ' +
      'unemployment insurance, EITC, and other income security programs). ' +
      'The large spikes in FY2020-2021 in some categories reflect COVID-19 emergency spending. ' +
      'Percentages are of total federal outlays ($6,872B estimated FY2025).',
    lastUpdated: '2025-02-01',
  },
};

/**
 * Get total spending across all categories.
 * Note: should approximate totalOutlays but may differ slightly due to rounding
 * and categories not listed separately.
 */
export function getTotalCategorySpending(): number {
  return US_FEDERAL_BUDGET.categories.reduce((sum, cat) => sum + cat.spendingBillions, 0);
}

/**
 * Get a category by name (case-insensitive partial match).
 */
export function getCategoryByName(name: string): BudgetCategory | undefined {
  const lower = name.toLowerCase();
  return US_FEDERAL_BUDGET.categories.find(
    (cat) => cat.name.toLowerCase().includes(lower),
  );
}

/**
 * Get all outcome metrics across all categories, flattened.
 */
export function getAllOutcomeMetrics(): (OutcomeMetric & { category: string })[] {
  return US_FEDERAL_BUDGET.categories.flatMap((cat) =>
    cat.outcomeMetrics.map((m) => ({ ...m, category: cat.name })),
  );
}

/**
 * Get historical spending for a specific category as a time series.
 */
export function getHistoricalSeries(
  categoryName: string,
): HistoricalSpending[] | undefined {
  const cat = getCategoryByName(categoryName);
  return cat?.historicalSpending;
}

/**
 * Calculate compound annual growth rate for a category's spending.
 */
export function getSpendingCAGR(categoryName: string): number | undefined {
  const series = getHistoricalSeries(categoryName);
  if (!series || series.length < 2) return undefined;
  const first = series[0]!;
  const last = series[series.length - 1]!;
  const years = last.year - first.year;
  if (years === 0 || first.amount === 0) return undefined;
  return Math.pow(last.amount / first.amount, 1 / years) - 1;
}
