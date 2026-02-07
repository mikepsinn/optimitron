/**
 * US Healthcare Spending vs OECD Averages: Spending, Life Expectancy & Infant Mortality
 *
 * Sources:
 * - US health spending per capita (USD PPP): CMS National Health Expenditure Data
 *   https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data
 * - OECD health spending per capita (USD PPP): OECD Health Statistics
 *   https://stats.oecd.org/Index.aspx?DataSetCode=SHA
 * - Life expectancy at birth: WHO Global Health Observatory / OECD Health at a Glance
 *   https://data.oecd.org/healthstat/life-expectancy-at-birth.htm
 * - Infant mortality rate (per 1,000 live births): WHO / OECD
 *   https://data.oecd.org/healthstat/infant-mortality-rates.htm
 *
 * Key findings:
 * - The US spends roughly 2x the OECD average per capita on healthcare
 * - Despite this, US life expectancy is 3-4 years LOWER than the OECD average
 * - US infant mortality is ~50-60% HIGHER than the OECD average
 * - The gap has been WIDENING over time, not narrowing
 * - COVID-19 hit the US harder than OECD peers, further widening the life expectancy gap
 *
 * This dataset demonstrates that higher spending does not automatically yield
 * better health outcomes — system design, equity, and access matter more.
 */

export interface HealthcareSpendingDataPoint {
  year: number;
  /** US health expenditure per capita (USD PPP, current prices) */
  usHealthSpendingPerCapita: number;
  /** US life expectancy at birth (years, both sexes) */
  usLifeExpectancy: number;
  /** US infant mortality rate (deaths per 1,000 live births) */
  usInfantMortalityRate: number;
  /** OECD average health expenditure per capita (USD PPP, current prices) */
  oecdAvgHealthSpendingPerCapita: number;
  /** OECD average life expectancy at birth (years, both sexes) */
  oecdAvgLifeExpectancy: number;
  /** OECD average infant mortality rate (deaths per 1,000 live births) */
  oecdAvgInfantMortality: number;
}

/**
 * US vs OECD healthcare spending and outcomes, 2000-2023.
 *
 * The US consistently spends far more than peer nations while achieving
 * worse population health outcomes. This represents one of the most
 * striking examples of diminishing (or negative) returns in public policy.
 */
export const US_HEALTHCARE_SPENDING_DATA: HealthcareSpendingDataPoint[] = [
  { year: 2000, usHealthSpendingPerCapita: 4790,  usLifeExpectancy: 76.8, usInfantMortalityRate: 6.9, oecdAvgHealthSpendingPerCapita: 2030, oecdAvgLifeExpectancy: 77.1, oecdAvgInfantMortality: 6.5 },
  { year: 2001, usHealthSpendingPerCapita: 5140,  usLifeExpectancy: 76.9, usInfantMortalityRate: 6.8, oecdAvgHealthSpendingPerCapita: 2140, oecdAvgLifeExpectancy: 77.4, oecdAvgInfantMortality: 6.1 },
  { year: 2002, usHealthSpendingPerCapita: 5560,  usLifeExpectancy: 76.9, usInfantMortalityRate: 7.0, oecdAvgHealthSpendingPerCapita: 2280, oecdAvgLifeExpectancy: 77.7, oecdAvgInfantMortality: 5.8 },
  { year: 2003, usHealthSpendingPerCapita: 5930,  usLifeExpectancy: 77.1, usInfantMortalityRate: 6.8, oecdAvgHealthSpendingPerCapita: 2420, oecdAvgLifeExpectancy: 77.8, oecdAvgInfantMortality: 5.5 },
  { year: 2004, usHealthSpendingPerCapita: 6310,  usLifeExpectancy: 77.5, usInfantMortalityRate: 6.8, oecdAvgHealthSpendingPerCapita: 2540, oecdAvgLifeExpectancy: 78.3, oecdAvgInfantMortality: 5.2 },
  { year: 2005, usHealthSpendingPerCapita: 6700,  usLifeExpectancy: 77.4, usInfantMortalityRate: 6.9, oecdAvgHealthSpendingPerCapita: 2660, oecdAvgLifeExpectancy: 78.4, oecdAvgInfantMortality: 5.0 },
  { year: 2006, usHealthSpendingPerCapita: 7100,  usLifeExpectancy: 77.7, usInfantMortalityRate: 6.7, oecdAvgHealthSpendingPerCapita: 2810, oecdAvgLifeExpectancy: 78.8, oecdAvgInfantMortality: 4.7 },
  { year: 2007, usHealthSpendingPerCapita: 7480,  usLifeExpectancy: 77.9, usInfantMortalityRate: 6.8, oecdAvgHealthSpendingPerCapita: 2960, oecdAvgLifeExpectancy: 79.0, oecdAvgInfantMortality: 4.5 },
  { year: 2008, usHealthSpendingPerCapita: 7780,  usLifeExpectancy: 78.0, usInfantMortalityRate: 6.6, oecdAvgHealthSpendingPerCapita: 3080, oecdAvgLifeExpectancy: 79.2, oecdAvgInfantMortality: 4.3 },
  { year: 2009, usHealthSpendingPerCapita: 7960,  usLifeExpectancy: 78.2, usInfantMortalityRate: 6.4, oecdAvgHealthSpendingPerCapita: 3130, oecdAvgLifeExpectancy: 79.4, oecdAvgInfantMortality: 4.2 },
  { year: 2010, usHealthSpendingPerCapita: 8220,  usLifeExpectancy: 78.5, usInfantMortalityRate: 6.1, oecdAvgHealthSpendingPerCapita: 3240, oecdAvgLifeExpectancy: 79.6, oecdAvgInfantMortality: 4.1 },
  { year: 2011, usHealthSpendingPerCapita: 8470,  usLifeExpectancy: 78.6, usInfantMortalityRate: 6.1, oecdAvgHealthSpendingPerCapita: 3340, oecdAvgLifeExpectancy: 79.9, oecdAvgInfantMortality: 3.9 },
  { year: 2012, usHealthSpendingPerCapita: 8680,  usLifeExpectancy: 78.7, usInfantMortalityRate: 6.0, oecdAvgHealthSpendingPerCapita: 3420, oecdAvgLifeExpectancy: 80.1, oecdAvgInfantMortality: 3.8 },
  { year: 2013, usHealthSpendingPerCapita: 8820,  usLifeExpectancy: 78.7, usInfantMortalityRate: 6.0, oecdAvgHealthSpendingPerCapita: 3510, oecdAvgLifeExpectancy: 80.3, oecdAvgInfantMortality: 3.7 },
  { year: 2014, usHealthSpendingPerCapita: 9240,  usLifeExpectancy: 78.8, usInfantMortalityRate: 5.8, oecdAvgHealthSpendingPerCapita: 3630, oecdAvgLifeExpectancy: 80.5, oecdAvgInfantMortality: 3.6 },
  { year: 2015, usHealthSpendingPerCapita: 9610,  usLifeExpectancy: 78.7, usInfantMortalityRate: 5.9, oecdAvgHealthSpendingPerCapita: 3770, oecdAvgLifeExpectancy: 80.4, oecdAvgInfantMortality: 3.6 },
  { year: 2016, usHealthSpendingPerCapita: 9930,  usLifeExpectancy: 78.5, usInfantMortalityRate: 5.9, oecdAvgHealthSpendingPerCapita: 3920, oecdAvgLifeExpectancy: 80.6, oecdAvgInfantMortality: 3.5 },
  { year: 2017, usHealthSpendingPerCapita: 10290, usLifeExpectancy: 78.5, usInfantMortalityRate: 5.8, oecdAvgHealthSpendingPerCapita: 4050, oecdAvgLifeExpectancy: 80.7, oecdAvgInfantMortality: 3.5 },
  { year: 2018, usHealthSpendingPerCapita: 10640, usLifeExpectancy: 78.7, usInfantMortalityRate: 5.7, oecdAvgHealthSpendingPerCapita: 4200, oecdAvgLifeExpectancy: 80.7, oecdAvgInfantMortality: 3.4 },
  { year: 2019, usHealthSpendingPerCapita: 11070, usLifeExpectancy: 78.8, usInfantMortalityRate: 5.6, oecdAvgHealthSpendingPerCapita: 4400, oecdAvgLifeExpectancy: 80.9, oecdAvgInfantMortality: 3.4 },
  { year: 2020, usHealthSpendingPerCapita: 11850, usLifeExpectancy: 77.0, usInfantMortalityRate: 5.4, oecdAvgHealthSpendingPerCapita: 4680, oecdAvgLifeExpectancy: 80.0, oecdAvgInfantMortality: 3.3 },
  { year: 2021, usHealthSpendingPerCapita: 12530, usLifeExpectancy: 76.1, usInfantMortalityRate: 5.4, oecdAvgHealthSpendingPerCapita: 5080, oecdAvgLifeExpectancy: 80.2, oecdAvgInfantMortality: 3.3 },
  { year: 2022, usHealthSpendingPerCapita: 12740, usLifeExpectancy: 77.5, usInfantMortalityRate: 5.6, oecdAvgHealthSpendingPerCapita: 5490, oecdAvgLifeExpectancy: 80.5, oecdAvgInfantMortality: 3.4 },
  { year: 2023, usHealthSpendingPerCapita: 13100, usLifeExpectancy: 78.4, usInfantMortalityRate: 5.4, oecdAvgHealthSpendingPerCapita: 5850, oecdAvgLifeExpectancy: 80.8, oecdAvgInfantMortality: 3.4 },
];
