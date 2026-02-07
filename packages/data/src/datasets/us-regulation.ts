/**
 * US Regulation Data: Regulation Growth vs Economic Dynamism
 *
 * Sources:
 * - Federal Register Pages: Federal Register (1990-2023)
 *   https://www.federalregister.gov/uploads/2024/02/stats-2023.pdf
 * - CFR Word Count: GW Regulatory Studies Center / QuantGov
 *   https://regulatorystudies.columbian.gwu.edu/reg-stats
 * - Real GDP Growth: Bureau of Economic Analysis (BEA)
 *   https://www.bea.gov/data/gdp/gross-domestic-product
 * - Business Applications: Census Bureau Business Formation Statistics (BFS)
 *   https://www.census.gov/econ/bfs/index.html
 * - Small Business Share: SBA Office of Advocacy (Share of net new jobs / employment)
 *   https://advocacy.sba.gov/data-on-small-business/
 *
 * Key context:
 * Federal Register pages are a proxy for "flow" of new regulation.
 * CFR word count is a proxy for "stock" of accumulated regulation.
 */

export interface USRegulationDataPoint {
  year: number;
  /** Total pages published in the Federal Register */
  federalRegisterPages: number;
  /** Code of Federal Regulations word count (millions) */
  cfrWordCountMillions: number | null;
  /** Real GDP growth rate (percent change from preceding period) */
  realGdpGrowthRate: number;
  /** Total Business Applications (Census BFS, starting 2004) */
  businessApplications: number | null;
  /** Small business share of private sector employment (percent) */
  smallBusinessSharePercent: number | null;
}

export const US_REGULATION_DATA: USRegulationDataPoint[] = [
  { year: 1990, federalRegisterPages: 53618, cfrWordCountMillions: 62.1, realGdpGrowthRate: 1.9, businessApplications: null, smallBusinessSharePercent: 54.8 },
  { year: 1991, federalRegisterPages: 67715, cfrWordCountMillions: 64.3, realGdpGrowthRate: -0.1, businessApplications: null, smallBusinessSharePercent: 54.5 },
  { year: 1992, federalRegisterPages: 62919, cfrWordCountMillions: 66.8, realGdpGrowthRate: 3.5, businessApplications: null, smallBusinessSharePercent: 54.3 },
  { year: 1993, federalRegisterPages: 61166, cfrWordCountMillions: 68.2, realGdpGrowthRate: 2.8, businessApplications: null, smallBusinessSharePercent: 54.0 },
  { year: 1994, federalRegisterPages: 64914, cfrWordCountMillions: 69.5, realGdpGrowthRate: 4.0, businessApplications: null, smallBusinessSharePercent: 53.8 },
  { year: 1995, federalRegisterPages: 62645, cfrWordCountMillions: 71.1, realGdpGrowthRate: 2.7, businessApplications: null, smallBusinessSharePercent: 53.5 },
  { year: 1996, federalRegisterPages: 69368, cfrWordCountMillions: 72.8, realGdpGrowthRate: 3.8, businessApplications: null, smallBusinessSharePercent: 53.1 },
  { year: 1997, federalRegisterPages: 68530, cfrWordCountMillions: 74.3, realGdpGrowthRate: 4.4, businessApplications: null, smallBusinessSharePercent: 52.9 },
  { year: 1998, federalRegisterPages: 68571, cfrWordCountMillions: 75.9, realGdpGrowthRate: 4.5, businessApplications: null, smallBusinessSharePercent: 52.5 },
  { year: 1999, federalRegisterPages: 71161, cfrWordCountMillions: 77.4, realGdpGrowthRate: 4.8, businessApplications: null, smallBusinessSharePercent: 52.1 },
  { year: 2000, federalRegisterPages: 74258, cfrWordCountMillions: 79.2, realGdpGrowthRate: 4.1, businessApplications: null, smallBusinessSharePercent: 51.8 },
  { year: 2001, federalRegisterPages: 64438, cfrWordCountMillions: 81.3, realGdpGrowthRate: 1.0, businessApplications: null, smallBusinessSharePercent: 51.4 },
  { year: 2002, federalRegisterPages: 75606, cfrWordCountMillions: 83.5, realGdpGrowthRate: 1.7, businessApplications: null, smallBusinessSharePercent: 51.0 },
  { year: 2003, federalRegisterPages: 71262, cfrWordCountMillions: 85.8, realGdpGrowthRate: 2.8, businessApplications: null, smallBusinessSharePercent: 50.8 },
  { year: 2004, federalRegisterPages: 75675, cfrWordCountMillions: 87.9, realGdpGrowthRate: 3.8, businessApplications: 2470000, smallBusinessSharePercent: 50.4 },
  { year: 2005, federalRegisterPages: 73870, cfrWordCountMillions: 89.9, realGdpGrowthRate: 3.5, businessApplications: 2600000, smallBusinessSharePercent: 50.2 },
  { year: 2006, federalRegisterPages: 74937, cfrWordCountMillions: 91.5, realGdpGrowthRate: 2.9, businessApplications: 2700000, smallBusinessSharePercent: 49.9 },
  { year: 2007, federalRegisterPages: 72090, cfrWordCountMillions: 93.2, realGdpGrowthRate: 1.9, businessApplications: 2700000, smallBusinessSharePercent: 49.7 },
  { year: 2008, federalRegisterPages: 79435, cfrWordCountMillions: 95.1, realGdpGrowthRate: -0.1, businessApplications: 2600000, smallBusinessSharePercent: 49.5 },
  { year: 2009, federalRegisterPages: 68598, cfrWordCountMillions: 96.8, realGdpGrowthRate: -2.5, businessApplications: 2400000, smallBusinessSharePercent: 49.3 },
  { year: 2010, federalRegisterPages: 81405, cfrWordCountMillions: 98.6, realGdpGrowthRate: 2.6, businessApplications: 2500000, smallBusinessSharePercent: 49.1 },
  { year: 2011, federalRegisterPages: 81247, cfrWordCountMillions: 100.2, realGdpGrowthRate: 1.6, businessApplications: 2600000, smallBusinessSharePercent: 48.9 },
  { year: 2012, federalRegisterPages: 78961, cfrWordCountMillions: 102.1, realGdpGrowthRate: 2.2, businessApplications: 2600000, smallBusinessSharePercent: 48.6 },
  { year: 2013, federalRegisterPages: 79311, cfrWordCountMillions: 103.9, realGdpGrowthRate: 1.8, businessApplications: 2600000, smallBusinessSharePercent: 48.4 },
  { year: 2014, federalRegisterPages: 77687, cfrWordCountMillions: 105.4, realGdpGrowthRate: 2.5, businessApplications: 2700000, smallBusinessSharePercent: 48.1 },
  { year: 2015, federalRegisterPages: 80260, cfrWordCountMillions: 106.8, realGdpGrowthRate: 2.9, businessApplications: 2800000, smallBusinessSharePercent: 47.9 },
  { year: 2016, federalRegisterPages: 95894, cfrWordCountMillions: 108.4, realGdpGrowthRate: 1.6, businessApplications: 2900000, smallBusinessSharePercent: 47.7 },
  { year: 2017, federalRegisterPages: 61308, cfrWordCountMillions: 108.8, realGdpGrowthRate: 2.3, businessApplications: 3200000, smallBusinessSharePercent: 47.4 },
  { year: 2018, federalRegisterPages: 68082, cfrWordCountMillions: 109.1, realGdpGrowthRate: 2.9, businessApplications: 3500000, smallBusinessSharePercent: 47.1 },
  { year: 2019, federalRegisterPages: 72564, cfrWordCountMillions: 109.9, realGdpGrowthRate: 2.3, businessApplications: 3500000, smallBusinessSharePercent: 46.8 },
  { year: 2020, federalRegisterPages: 86356, cfrWordCountMillions: 110.8, realGdpGrowthRate: -2.8, businessApplications: 4300000, smallBusinessSharePercent: 46.4 },
  { year: 2021, federalRegisterPages: 73321, cfrWordCountMillions: 112.5, realGdpGrowthRate: 5.9, businessApplications: 5400000, smallBusinessSharePercent: 46.0 },
  { year: 2022, federalRegisterPages: 80756, cfrWordCountMillions: 114.2, realGdpGrowthRate: 2.1, businessApplications: 5100000, smallBusinessSharePercent: 45.9 },
  { year: 2023, federalRegisterPages: 89842, cfrWordCountMillions: 116.3, realGdpGrowthRate: 2.9, businessApplications: 5500000, smallBusinessSharePercent: 45.7 },
];
