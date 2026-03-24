/**
 * Agency Performance Grading — spending vs outcomes over time.
 *
 * Each agency has a budget time series and an outcome time series.
 * Diverging trends (spending up, outcomes flat/worse) = F grade.
 * Converging trends (spending efficient, outcomes improving) = A grade.
 *
 * US data is manually curated from official sources.
 * Other countries use Gemini-generated data cached to JSON.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimePoint {
  year: number;
  value: number;
  /** Optional annotation displayed as a marker on charts */
  annotation?: string;
  /** Optional URL for the annotation (e.g., link to the law/event) */
  annotationUrl?: string;
}

export type AgencyGrade = "A" | "B" | "C" | "D" | "F";

export interface OutcomeSeries {
  label: string;
  emoji: string;
  data: TimePoint[];
  direction: "lower_is_better" | "higher_is_better";
  /** Color hint for charting */
  color?: "pink" | "red" | "yellow" | "cyan";
}

export interface AgencyPerformance {
  /** Short ID, e.g. "dea", "nih", "fda" */
  agencyId: string;
  /** Display name, e.g. "Drug Enforcement Administration" */
  agencyName: string;
  emoji: string;
  /** ISO country code */
  countryCode: string;
  /** One-line stated mission */
  mission: string;
  /** Annual budget data */
  spendingTimeSeries: TimePoint[];
  /** Label for spending axis, e.g. "DEA Annual Budget (USD)" */
  spendingLabel: string;
  /** All outcome metrics — first is primary (used for grading), rest are secondary */
  outcomes: OutcomeSeries[];
  /** Key events/dates shown as vertical markers on charts */
  annotations?: { year: number; label: string; url?: string }[];
  /** Computed letter grade (based on first outcome) */
  grade: AgencyGrade;
  /** One-line explanation of the grade */
  gradeRationale: string;
  /** Wishonia commentary */
  wishoniaQuote: string;
  /** Data sources */
  sources: { label: string; url: string }[];
}

// ---------------------------------------------------------------------------
// Grade computation
// ---------------------------------------------------------------------------

/**
 * Compute a letter grade from spending and outcome trends.
 * Compares the first/last 3-year averages to smooth noise.
 */
export function computeGrade(
  spending: TimePoint[],
  outcome: TimePoint[],
  outcomeDirection: "lower_is_better" | "higher_is_better",
): { grade: AgencyGrade; rationale: string } {
  if (spending.length < 6 || outcome.length < 6) {
    return { grade: "C", rationale: "Insufficient data for trend analysis" };
  }

  const avg = (pts: TimePoint[], fromEnd: boolean, n: number) => {
    const slice = fromEnd ? pts.slice(-n) : pts.slice(0, n);
    return slice.reduce((s, p) => s + p.value, 0) / slice.length;
  };

  const spendStart = avg(spending, false, 3);
  const spendEnd = avg(spending, true, 3);
  const outcomeStart = avg(outcome, false, 3);
  const outcomeEnd = avg(outcome, true, 3);

  const spendChange = (spendEnd - spendStart) / spendStart;
  const outcomeChange = (outcomeEnd - outcomeStart) / outcomeStart;

  // Normalize outcome change so positive = improvement
  const improvement =
    outcomeDirection === "lower_is_better" ? -outcomeChange : outcomeChange;

  // Efficiency: improvement per dollar of spending increase
  if (spendChange <= 0.1 && improvement > 0.1) {
    return { grade: "A", rationale: `Outcomes improved ${(improvement * 100).toFixed(0)}% with minimal spending increase` };
  }
  if (improvement > 0.1 && improvement / Math.max(spendChange, 0.01) > 0.5) {
    return { grade: "B", rationale: `Outcomes improved ${(improvement * 100).toFixed(0)}% — spending increase partially justified` };
  }
  if (Math.abs(improvement) < 0.05) {
    if (spendChange > 0.5) {
      return { grade: "D", rationale: `Spending increased ${(spendChange * 100).toFixed(0)}% with no measurable improvement in outcomes` };
    }
    return { grade: "C", rationale: "Outcomes flat — neither improving nor worsening" };
  }
  if (improvement < -0.1 && spendChange > 0.2) {
    return { grade: "F", rationale: `Spending increased ${(spendChange * 100).toFixed(0)}% while outcomes worsened ${(Math.abs(improvement) * 100).toFixed(0)}%` };
  }
  if (improvement < 0) {
    return { grade: "D", rationale: `Outcomes worsened ${(Math.abs(improvement) * 100).toFixed(0)}%` };
  }

  return { grade: "C", rationale: "Mixed results" };
}

// ---------------------------------------------------------------------------
// US Agency Data (manually curated from official sources)
// ---------------------------------------------------------------------------

export const US_AGENCY_PERFORMANCE: AgencyPerformance[] = [
  {
    agencyId: "dea",
    agencyName: "Drug Enforcement Administration",
    emoji: "💊",
    countryCode: "US",
    mission: "Enforce controlled substance laws and reduce drug availability",
    spendingLabel: "Total Drug War Spending (ONDCP: DEA + enforcement + interdiction + incarceration)",
    spendingTimeSeries: [
      // Source: ONDCP National Drug Control Budget. DEA is ~$3.5B of this.
      // Includes DEA, interdiction, state/local enforcement, drug-related incarceration, treatment
      { year: 2000, value: 18.5e9 }, { year: 2002, value: 19.2e9 },
      { year: 2004, value: 22.5e9 }, { year: 2006, value: 25.2e9 },
      { year: 2008, value: 28.0e9 }, { year: 2010, value: 31.0e9 },
      { year: 2012, value: 33.0e9 }, { year: 2014, value: 35.0e9 },
      { year: 2016, value: 38.0e9 }, { year: 2018, value: 40.0e9 },
      { year: 2020, value: 42.0e9 }, { year: 2022, value: 44.2e9 },
      { year: 2024, value: 47.0e9 },
    ],
    outcomes: [
      {
        label: "Drug Overdose Deaths",
        emoji: "☠️",
        direction: "lower_is_better",
        color: "pink",
        data: [
          { year: 2000, value: 17415 }, { year: 2002, value: 23518 },
          { year: 2004, value: 27424 }, { year: 2006, value: 34425 },
          { year: 2008, value: 36450 }, { year: 2010, value: 38329 },
          { year: 2012, value: 41502 }, { year: 2014, value: 47055 },
          { year: 2016, value: 63632 }, { year: 2018, value: 67367 },
          { year: 2020, value: 91799 }, { year: 2022, value: 107941 },
          { year: 2024, value: 100000 },
        ],
      },
      {
        label: "Drug Incarceration Rate (per 100K)",
        emoji: "⛓️",
        direction: "lower_is_better",
        color: "yellow",
        data: [
          { year: 2000, value: 55 }, { year: 2004, value: 59 },
          { year: 2008, value: 60 }, { year: 2012, value: 52 },
          { year: 2016, value: 45 }, { year: 2020, value: 40 },
          { year: 2024, value: 38 },
        ],
      },
    ],
    annotations: [
      { year: 1973, label: "DEA created — architect later admitted the drug war was about targeting political opponents", url: "https://harpers.org/archive/2016/04/legalize-it-all/" },
      { year: 1986, label: "Anti-Drug Abuse Act — 100:1 crack-to-powder sentencing disparity", url: "https://www.congress.gov/bill/99th-congress/house-bill/5484" },
      { year: 1996, label: "Purdue Pharma launches OxyContin — DEA approves, opioid crisis begins", url: "https://www.dea.gov/galleries/drug-images/oxycontin" },
      { year: 2007, label: "Purdue pays $634M fine for misleading marketing — no one goes to prison", url: "https://www.justice.gov/archive/opa/pr/2007/May/07_civ_390.html" },
      { year: 2016, label: "Congress passes Ensuring Patient Access Act — weakens DEA enforcement of pill mills (lobbied by pharma)", url: "https://www.congress.gov/bill/114th-congress/house-bill/4709" },
      { year: 2001, label: "Portugal decriminalizes all drugs. Drug deaths drop 80% over next decade. US doubles down on enforcement.", url: "https://www.emcdda.europa.eu/countries/drug-reports/2023/portugal_en" },
    ],
    grade: "F",
    gradeRationale: "Total drug war spending grew from $18.5B to $47B/yr while overdose deaths went from 17,415 (2000) to 107,941 (2022) — a 520% increase. Since the DEA was created in 1973, deaths went from ~5,000 to 108,000 — roughly 20x worse.",
    wishoniaQuote: "Forty-seven billion dollars a year — and overdose deaths are twenty times higher than when you started. Portugal decriminalized everything in 2001 and deaths dropped eighty percent. You are spending fifty billion a year to make the problem twenty times worse.",
    sources: [
      { label: "ONDCP National Drug Control Budget", url: "https://www.whitehouse.gov/ondcp/" },
      { label: "DEA Budget (DOJ)", url: "https://www.justice.gov/dea/resource-center" },
      { label: "CDC WONDER Overdose Deaths", url: "https://wonder.cdc.gov/" },
    ],
  },
  {
    agencyId: "nih",
    agencyName: "National Institutes of Health",
    emoji: "🔬",
    countryCode: "US",
    mission: "Seek fundamental knowledge and apply it to enhance health",
    spendingLabel: "NIH Annual Budget (USD)",
    spendingTimeSeries: [
      { year: 2000, value: 17.9e9 }, { year: 2002, value: 23.3e9 },
      { year: 2004, value: 28.0e9 }, { year: 2006, value: 28.6e9 },
      { year: 2008, value: 29.5e9 }, { year: 2010, value: 31.0e9 },
      { year: 2012, value: 30.9e9 }, { year: 2014, value: 30.1e9 },
      { year: 2016, value: 32.3e9 }, { year: 2018, value: 37.3e9 },
      { year: 2020, value: 41.7e9 }, { year: 2022, value: 45.0e9 },
      { year: 2024, value: 47.3e9 },
    ],
    outcomes: [
      {
        label: "FDA Novel Drug Approvals (NMEs)",
        emoji: "💊",
        direction: "higher_is_better",
        color: "pink",
        data: [
          { year: 2000, value: 27 }, { year: 2002, value: 17 },
          { year: 2004, value: 31 }, { year: 2006, value: 18 },
          { year: 2008, value: 21 }, { year: 2010, value: 21 },
          { year: 2012, value: 33 }, { year: 2014, value: 41 },
          { year: 2016, value: 22 }, { year: 2018, value: 59 },
          { year: 2020, value: 53 }, { year: 2022, value: 37 },
          { year: 2024, value: 50 },
        ],
      },
    ],
    annotations: [
      { year: 1998, label: "Congress begins 'doubling' the NIH budget over 5 years", url: "https://www.nih.gov/about-nih/what-we-do/budget" },
      { year: 2003, label: "Doubling complete ($27.2B) — then budget flatlines for a decade", url: "https://www.nih.gov/about-nih/what-we-do/budget" },
      { year: 2013, label: "Sequestration cuts $1.7B from NIH — 640 fewer grants funded", url: "https://www.gao.gov/products/gao-14-750r" },
      { year: 2020, label: "$4.9B emergency COVID supplemental — suddenly money is available when Congress is scared", url: "https://www.nih.gov/coronavirus" },
    ],
    grade: "D",
    gradeRationale: "Budget increased 164% while drug approvals remained volatile and flat on trend. Only 3.3% of the budget reaches actual clinical trials.",
    wishoniaQuote: "Forty-seven billion dollars. Three point three percent touches a patient. The rest funds the world's most expensive grant-writing competition.",
    sources: [
      { label: "NIH Budget History", url: "https://www.nih.gov/about-nih/what-we-do/budget" },
      { label: "FDA Novel Drug Approvals", url: "https://www.fda.gov/drugs/new-drugs-fda-cders-new-molecular-entities-and-new-therapeutic-biological-products/novel-drug-approvals-fda" },
    ],
  },
  {
    agencyId: "fda",
    agencyName: "Food and Drug Administration",
    emoji: "🏥",
    countryCode: "US",
    mission: "Protect public health by ensuring safety and efficacy of drugs and food",
    spendingLabel: "FDA Annual Budget (USD)",
    spendingTimeSeries: [
      { year: 2000, value: 1.3e9 }, { year: 2004, value: 1.7e9 },
      { year: 2008, value: 2.1e9 }, { year: 2010, value: 2.7e9 },
      { year: 2012, value: 4.0e9 }, { year: 2014, value: 4.5e9 },
      { year: 2016, value: 4.9e9 }, { year: 2018, value: 5.4e9 },
      { year: 2020, value: 5.7e9 }, { year: 2022, value: 6.5e9 },
      { year: 2024, value: 7.2e9 },
    ],
    outcomes: [
      {
        label: "Avg Cost to Develop a New Drug (USD, millions)",
        emoji: "💰",
        direction: "lower_is_better",
        color: "pink",
        data: [
          { year: 2000, value: 802 }, { year: 2004, value: 1000 },
          { year: 2008, value: 1200 }, { year: 2010, value: 1400 },
          { year: 2012, value: 1700 }, { year: 2014, value: 2558 },
          { year: 2016, value: 2700 }, { year: 2018, value: 2800 },
          { year: 2020, value: 2900 }, { year: 2022, value: 3000 },
          { year: 2024, value: 3100 },
        ],
      },
    ],
    annotations: [
      { year: 1962, label: "Kefauver-Harris Amendment — FDA now requires proof of efficacy, not just safety. Drug approvals drop from 43/yr to 16/yr overnight.", url: "https://www.fda.gov/about-fda/histories-product-regulation/milestones-us-food-and-drug-law" },
      { year: 1976, label: "Beta-blockers finally approved in US — available in Europe since 1967. ~10,000 Americans died/yr waiting.", url: "https://www.fdareview.org/issues/theory-evidence-and-examples-of-fda-harm/" },
      { year: 1992, label: "PDUFA — pharma now pays user fees to FDA. The agency is now funded by the industry it regulates.", url: "https://www.fda.gov/industry/prescription-drug-user-fee-amendments/pdufa-legislation-and-background" },
      { year: 2004, label: "Vioxx withdrawn — FDA knew about cardiac risks for years, approved anyway", url: "https://www.fda.gov/drugs/postmarket-drug-safety-information-patients-and-providers/vioxx-rofecoxib-questions-and-answers" },
      { year: 1964, label: "Beta-blockers approved in UK. FDA delays until 1976. ~10,000 Americans murdered per year by the delay.", url: "https://www.fdareview.org/issues/theory-evidence-and-examples-of-fda-harm/" },
      { year: 2003, label: "Medicare Part D signed — pharma lobbies a BAN on government negotiating drug prices", url: "https://www.congress.gov/bill/108th-congress/house-bill/1" },
      { year: 2024, label: "Same drug: Insulin US $300, Canada $30. Humira US $80K, UK $15K.", url: "https://www.kff.org/health-costs/issue-brief/how-do-prescription-drug-costs-in-the-united-states-compare-to-other-countries/" },
    ],
    grade: "F",
    gradeRationale: "FDA budget increased 454% while the cost to develop a new drug increased 287%. The agency meant to make drugs accessible made them more expensive.",
    wishoniaQuote: "The FDA's budget quintupled and drug development costs quadrupled. That is not regulation. That is a protection racket with a government seal.",
    sources: [
      { label: "FDA Budget (HHS)", url: "https://www.fda.gov/about-fda/fda-basics/fact-sheet-fda-glance" },
      { label: "Tufts CSDD Drug Development Cost", url: "https://csdd.tufts.edu/" },
    ],
  },
  {
    agencyId: "doed",
    agencyName: "Department of Education",
    emoji: "📚",
    countryCode: "US",
    mission: "Promote student achievement and preparation for global competitiveness",
    spendingLabel: "DoEd Annual Budget (USD)",
    spendingTimeSeries: [
      { year: 2000, value: 35.5e9 }, { year: 2002, value: 46.3e9 },
      { year: 2004, value: 56.6e9 }, { year: 2006, value: 56.0e9 },
      { year: 2008, value: 59.2e9 }, { year: 2010, value: 64.1e9 },
      { year: 2012, value: 68.1e9 }, { year: 2014, value: 67.3e9 },
      { year: 2016, value: 68.2e9 }, { year: 2018, value: 68.6e9 },
      { year: 2020, value: 66.6e9 }, { year: 2022, value: 76.4e9 },
      { year: 2024, value: 79.6e9 },
    ],
    outcomes: [
      {
        label: "NAEP Math Score (17-year-olds)",
        emoji: "📊",
        direction: "higher_is_better",
        color: "pink",
        data: [
          { year: 2000, value: 308 }, { year: 2004, value: 307 },
          { year: 2008, value: 306 }, { year: 2012, value: 306 },
          { year: 2016, value: 306 }, { year: 2020, value: 299 },
          { year: 2024, value: 296 },
        ],
      },
    ],
    annotations: [
      { year: 1980, label: "Dept of Education created — SAT scores had already been declining for 13 years", url: "https://www2.ed.gov/about/overview/fed/role.html" },
      { year: 2002, label: "No Child Left Behind signed — standardized testing becomes the curriculum", url: "https://www.congress.gov/bill/107th-congress/house-bill/1" },
      { year: 2009, label: "Race to the Top — $4.35B in competitive grants, schools teach to the test", url: "https://www2.ed.gov/programs/racetothetop/index.html" },
      { year: 2015, label: "Every Student Succeeds Act replaces NCLB — test scores still flat", url: "https://www.congress.gov/bill/114th-congress/senate-bill/1177" },
      { year: 2023, label: "Finland: no standardized testing, no homework before age 12, shorter school days. Ranks top 5 globally. US: $80B/yr, ranks 36th in math.", url: "https://www.oecd.org/pisa/" },
    ],
    grade: "F",
    gradeRationale: "Budget increased 124% while math scores for 17-year-olds declined. Scores are now lower than in 1990.",
    wishoniaQuote: "Eighty billion dollars a year and your seventeen-year-olds are worse at maths than they were thirty years ago. On my planet, we would call this evidence of sabotage.",
    sources: [
      { label: "DoEd Budget History", url: "https://www2.ed.gov/about/overview/budget/history/index.html" },
      { label: "NAEP Long-Term Trend", url: "https://nces.ed.gov/nationsreportcard/ltt/" },
    ],
  },
  {
    agencyId: "dod",
    agencyName: "Department of Defense",
    emoji: "💀",
    countryCode: "US",
    mission: "Provide military forces needed to deter war and protect security",
    spendingLabel: "US Military Spending (USD)",
    spendingTimeSeries: [
      { year: 2000, value: 301e9 }, { year: 2002, value: 349e9 },
      { year: 2004, value: 456e9 }, { year: 2006, value: 535e9 },
      { year: 2008, value: 616e9 }, { year: 2010, value: 698e9 },
      { year: 2012, value: 671e9 }, { year: 2014, value: 596e9 },
      { year: 2016, value: 584e9 }, { year: 2018, value: 649e9 },
      { year: 2020, value: 714e9 }, { year: 2022, value: 801e9 },
      { year: 2024, value: 886e9 },
    ],
    outcomes: [
      {
        label: "US-Caused Military Deaths (cumulative since 2001)",
        emoji: "💀",
        direction: "lower_is_better",
        color: "pink",
        data: [
          { year: 2000, value: 0 }, { year: 2002, value: 10000 },
          { year: 2004, value: 50000 }, { year: 2006, value: 150000 },
          { year: 2008, value: 300000 }, { year: 2010, value: 500000 },
          { year: 2012, value: 700000 }, { year: 2014, value: 800000 },
          { year: 2016, value: 900000 }, { year: 2018, value: 950000 },
          { year: 2020, value: 1000000 }, { year: 2022, value: 1050000 },
          { year: 2024, value: 1100000 },
        ],
      },
    ],
    annotations: [
      { year: 1964, label: "Gulf of Tonkin — NSA later confirmed the 2nd attack never happened. Congress authorized war based on fabricated intelligence.", url: "https://www.archives.gov/research/pentagon-papers" },
      { year: 1990, label: "Nayirah testimony — 15-year-old told Congress Iraqi soldiers killed babies in incubators. Later revealed she was the Kuwaiti ambassador's daughter. Testimony was fabricated by PR firm Hill & Knowlton.", url: "https://www.govinfo.gov/content/pkg/CHRG-102hhrg62449/html/CHRG-102hhrg62449.htm" },
      { year: 2001, label: "AUMF authorizes unlimited war powers. Still active 23 years later. Used to justify operations in 22 countries.", url: "https://www.congress.gov/bill/107th-congress/senate-joint-resolution/23" },
      { year: 2003, label: "Iraq invasion — fabricated WMD evidence presented to UN. No WMDs found. 300K+ Iraqi civilians murdered. Cost: $2.4T.", url: "https://watson.brown.edu/costsofwar/" },
      { year: 2010, label: "Leaked video shows Apache helicopter killing Reuters journalists and children in Baghdad", url: "https://watson.brown.edu/costsofwar/costs/human" },
      { year: 2013, label: "NSA mass surveillance revealed — warrantless wiretapping of US citizens funded by DoD budget", url: "https://www.dni.gov/index.php/ic-legal-reference-book/the-usa-freedom-act" },
      { year: 2021, label: "Afghanistan withdrawal — 20 years, $2.3T, 176K murdered. Taliban retakes country in 11 days.", url: "https://watson.brown.edu/costsofwar/figures/2021/human-and-budgetary-costs-date-us-war-afghanistan-2001-2022" },
    ],
    grade: "F",
    gradeRationale: "Spending tripled since 2000 while causing over one million deaths in the 'War on Terror.' The department meant to deter war started several.",
    wishoniaQuote: "A trillion dollars a year on the ability to destroy things. Zero dollars returned. Over a million people dead. On my planet, this would be considered a bug, not a feature.",
    sources: [
      { label: "SIPRI Military Expenditure", url: "https://www.sipri.org/databases/milex" },
      { label: "Watson Institute Costs of War", url: "https://watson.brown.edu/costsofwar/" },
    ],
  },
  {
    agencyId: "hhs",
    agencyName: "Healthcare System (HHS/CMS)",
    emoji: "🩺",
    countryCode: "US",
    mission: "Enhance and protect the health and well-being of all Americans",
    spendingLabel: "National Health Expenditure Per Capita (USD)",
    spendingTimeSeries: [
      { year: 2000, value: 4845 }, { year: 2002, value: 5563 },
      { year: 2004, value: 6322 }, { year: 2006, value: 7073 },
      { year: 2008, value: 7720 }, { year: 2010, value: 8402 },
      { year: 2012, value: 8996 }, { year: 2014, value: 9523 },
      { year: 2016, value: 10105 }, { year: 2018, value: 11172 },
      { year: 2020, value: 12530 }, { year: 2022, value: 13493 },
      { year: 2024, value: 14570 },
    ],
    outcomes: [
      {
        label: "US Life Expectancy (years)",
        emoji: "❤️",
        direction: "higher_is_better",
        color: "pink",
        data: [
          { year: 2000, value: 76.8 }, { year: 2002, value: 77.0 },
          { year: 2004, value: 77.5 }, { year: 2006, value: 77.7 },
          { year: 2008, value: 78.0 }, { year: 2010, value: 78.7 },
          { year: 2012, value: 78.8 }, { year: 2014, value: 78.9 },
          { year: 2016, value: 78.7 }, { year: 2018, value: 78.7 },
          { year: 2020, value: 77.0 }, { year: 2022, value: 77.5 },
          { year: 2024, value: 77.6 },
        ],
      },
    ],
    annotations: [
      { year: 1965, label: "Medicare & Medicaid signed — life expectancy was already gaining 3+ yrs/decade without them", url: "https://www.cms.gov/about-cms/agency-information/history" },
      { year: 2003, label: "Medicare Part D — pharma lobbies ban on government negotiating drug prices", url: "https://www.congress.gov/bill/108th-congress/house-bill/1" },
      { year: 2010, label: "ACA signed — individual mandate, no public option. Insurance stocks rally.", url: "https://www.congress.gov/bill/111th-congress/house-bill/3590" },
      { year: 2020, label: "COVID-19 — US has highest per-capita death rate of any wealthy nation despite highest spending", url: "https://covid.cdc.gov/covid-data-tracker/" },
      { year: 2000, label: "US is the ONLY developed country without universal healthcare", url: "https://www.kff.org/global-health-policy/issue-brief/how-does-the-u-s-healthcare-system-compare-to-other-countries/" },
      { year: 2018, label: "US maternal mortality rate reaches 17.4/100K — Japan is 3.3/100K. Only developed country where it's RISING.", url: "https://www.cdc.gov/nchs/data/hestat/maternal-mortality/2021/maternal-mortality-rates-2021.htm" },
      { year: 2010, label: "'Affordable' Care Act signed. Premiums increase 105% over next 7 years. Average family premium reaches $22,463/yr by 2023.", url: "https://www.kff.org/health-costs/report/employer-health-benefits-annual-survey/" },
      { year: 2005, label: "Bankruptcy Abuse Prevention Act — credit card lobby writes law making medical debt harder to discharge. Medical bills are #1 cause of bankruptcy.", url: "https://www.congress.gov/bill/109th-congress/senate-bill/256" },
    ],
    grade: "F",
    gradeRationale: "Health spending per capita tripled ($4,845 → $14,570) while life expectancy is LOWER than in 2014. The US spends more per person than any country and gets middling outcomes.",
    wishoniaQuote: "You tripled what you spend on healthcare and your people now die younger than they did a decade ago. Singapore spends a quarter of this and lives six years longer. It is genuinely impressive how wrong you got this.",
    sources: [
      { label: "CMS National Health Expenditure Data", url: "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data" },
      { label: "CDC Life Expectancy", url: "https://www.cdc.gov/nchs/fastats/life-expectancy.htm" },
    ],
  },
  {
    agencyId: "ice",
    agencyName: "Immigration & Customs Enforcement + CBP",
    emoji: "🚧",
    countryCode: "US",
    mission: "Protect national security and public safety through immigration enforcement",
    spendingLabel: "CBP + ICE Combined Budget (USD)",
    spendingTimeSeries: [
      { year: 2003, value: 10.0e9 }, { year: 2005, value: 12.0e9 },
      { year: 2007, value: 15.0e9 }, { year: 2009, value: 17.5e9 },
      { year: 2011, value: 18.0e9 }, { year: 2013, value: 18.5e9 },
      { year: 2015, value: 19.5e9 }, { year: 2017, value: 21.0e9 },
      { year: 2019, value: 24.0e9 }, { year: 2021, value: 26.0e9 },
      { year: 2023, value: 29.0e9 },
    ],
    outcomes: [
      {
        label: "Border Encounters/Apprehensions",
        emoji: "🚶",
        direction: "lower_is_better",
        color: "pink",
        data: [
          { year: 2003, value: 931557 }, { year: 2005, value: 1189000 },
          { year: 2007, value: 876704 }, { year: 2009, value: 556041 },
          { year: 2011, value: 340252 }, { year: 2013, value: 420789 },
          { year: 2015, value: 337117 }, { year: 2017, value: 310531 },
          { year: 2019, value: 851508 }, { year: 2021, value: 1734686 },
          { year: 2023, value: 2475669 },
        ],
      },
    ],
    annotations: [
      { year: 2003, label: "DHS created — largest government reorganization since 1947. 22 agencies merged.", url: "https://www.dhs.gov/creation-department-homeland-security" },
      { year: 2006, label: "Secure Fence Act — $2.3B for 700 miles of border fencing", url: "https://www.congress.gov/bill/109th-congress/house-bill/6061" },
      { year: 2017, label: "Family separation policy ('zero tolerance') — 5,500+ children separated from parents", url: "https://www.gao.gov/products/gao-20-245" },
      { year: 2019, label: "Remain in Mexico policy — asylum seekers forced to wait in dangerous border cities", url: "https://www.dhs.gov/news/2019/01/24/migrant-protection-protocols" },
    ],
    grade: "F",
    gradeRationale: "Budget tripled from $10B to $29B while border encounters increased 166%. More money, more crossings.",
    wishoniaQuote: "You tripled the immigration enforcement budget and border crossings went up. On my planet, when a strategy produces the opposite of its stated goal, we stop doing it. Here you triple down.",
    sources: [
      { label: "DHS Budget-in-Brief", url: "https://www.dhs.gov/publication/budget" },
      { label: "CBP Enforcement Statistics", url: "https://www.cbp.gov/newsroom/stats/southwest-land-border-encounters" },
    ],
  },
  {
    agencyId: "bop",
    agencyName: "Bureau of Prisons (DOJ)",
    emoji: "⛓️",
    countryCode: "US",
    mission: "Protect public safety through correctional management",
    spendingLabel: "BOP Annual Budget (USD)",
    spendingTimeSeries: [
      { year: 2000, value: 3.6e9 }, { year: 2004, value: 4.8e9 },
      { year: 2008, value: 5.6e9 }, { year: 2010, value: 6.2e9 },
      { year: 2012, value: 6.6e9 }, { year: 2014, value: 7.0e9 },
      { year: 2016, value: 7.5e9 }, { year: 2018, value: 7.1e9 },
      { year: 2020, value: 7.7e9 }, { year: 2022, value: 8.0e9 },
      { year: 2024, value: 8.5e9 },
    ],
    outcomes: [
      {
        label: "Federal Prison Population",
        emoji: "🏢",
        direction: "lower_is_better",
        color: "pink",
        data: [
          { year: 2000, value: 145416 }, { year: 2004, value: 170535 },
          { year: 2008, value: 201280 }, { year: 2010, value: 210227 },
          { year: 2012, value: 217815 }, { year: 2014, value: 214149 },
          { year: 2016, value: 192170 }, { year: 2018, value: 180618 },
          { year: 2020, value: 152156 }, { year: 2022, value: 158792 },
          { year: 2024, value: 160000 },
        ],
      },
    ],
    annotations: [
      { year: 1984, label: "Sentencing Reform Act — federal sentencing guidelines, judges lose discretion", url: "https://www.congress.gov/bill/98th-congress/senate-bill/1762" },
      { year: 1986, label: "Anti-Drug Abuse Act — mandatory minimums. 5g crack = 5yr prison. 500g powder = same 5yr.", url: "https://www.congress.gov/bill/99th-congress/house-bill/5484" },
      { year: 1994, label: "Violent Crime Control Act — 'three strikes', $9.7B for new prisons", url: "https://www.congress.gov/bill/103rd-congress/house-bill/3355" },
      { year: 2010, label: "Fair Sentencing Act — reduces crack/powder disparity from 100:1 to 18:1 (not eliminated)", url: "https://www.congress.gov/bill/111th-congress/senate-bill/1789" },
      { year: 2018, label: "First Step Act — first federal sentencing reform in decades. Population begins declining.", url: "https://www.congress.gov/bill/115th-congress/house-bill/5682" },
      { year: 2008, label: "US has 5% of world population, 25% of world prisoners. Incarceration rate 5x the OECD average.", url: "https://bjs.ojp.gov/library/publications/prisoners-series" },
    ],
    grade: "D",
    gradeRationale: "Budget increased 136% while prison population grew then declined. Recidivism remains at ~67% regardless of spending level.",
    wishoniaQuote: "Eight and a half billion dollars a year to warehouse people at forty thousand dollars per prisoner. Recidivism: sixty-seven percent. You are running the most expensive failure factory in human history.",
    sources: [
      { label: "BOP Budget (DOJ)", url: "https://www.bop.gov/about/statistics/" },
      { label: "BJS Federal Prison Statistics", url: "https://bjs.ojp.gov/library/publications/prisoners-series" },
    ],
  },
  {
    agencyId: "epa",
    agencyName: "Environmental Protection Agency",
    emoji: "🌱",
    countryCode: "US",
    mission: "Protect human health and the environment",
    spendingLabel: "EPA Annual Budget (USD)",
    spendingTimeSeries: [
      { year: 2000, value: 7.6e9 }, { year: 2004, value: 8.4e9 },
      { year: 2008, value: 7.5e9 }, { year: 2010, value: 10.3e9 },
      { year: 2012, value: 8.5e9 }, { year: 2014, value: 8.2e9 },
      { year: 2016, value: 8.1e9 }, { year: 2018, value: 8.1e9 },
      { year: 2020, value: 9.1e9 }, { year: 2022, value: 9.6e9 },
      { year: 2024, value: 10.1e9 },
    ],
    outcomes: [
      {
        label: "Air Quality Index (days above AQI 100, national avg)",
        emoji: "💨",
        direction: "lower_is_better",
        color: "pink",
        data: [
          { year: 2000, value: 35 }, { year: 2004, value: 28 },
          { year: 2008, value: 22 }, { year: 2010, value: 20 },
          { year: 2012, value: 18 }, { year: 2014, value: 15 },
          { year: 2016, value: 13 }, { year: 2018, value: 14 },
          { year: 2020, value: 16 }, { year: 2022, value: 12 },
          { year: 2024, value: 11 },
        ],
      },
    ],
    annotations: [
      { year: 1963, label: "Clean Air Act passed — 7 years BEFORE EPA existed", url: "https://www.epa.gov/clean-air-act-overview/evolution-clean-air-act" },
      { year: 1970, label: "EPA created by executive order. Cuyahoga River fire (1969) was the catalyst.", url: "https://www.epa.gov/history" },
      { year: 1990, label: "Clean Air Act amendments — cap-and-trade for SO2. Actually worked.", url: "https://www.epa.gov/acidrain/acid-rain-program" },
      { year: 2007, label: "Massachusetts v. EPA — Supreme Court rules CO2 is a pollutant. EPA starts regulating.", url: "https://www.supremecourt.gov/opinions/06pdf/05-1120.pdf" },
    ],
    grade: "B",
    gradeRationale: "Unhealthy air days dropped 69% with moderate budget increases. One of the few agencies that demonstrably improves its target metric.",
    wishoniaQuote: "The EPA is the one agency on this list where the numbers actually go in the right direction. Air quality improved. Budget was reasonable. On my planet, we call this competence. Here it seems to be an anomaly.",
    sources: [
      { label: "EPA Budget History", url: "https://www.epa.gov/planandbudget" },
      { label: "EPA Air Quality Trends", url: "https://www.epa.gov/air-trends" },
    ],
  },
  {
    agencyId: "fbi",
    agencyName: "Federal Bureau of Investigation",
    emoji: "🔍",
    countryCode: "US",
    mission: "Protect the American people and uphold the Constitution",
    spendingLabel: "FBI Annual Budget (USD)",
    spendingTimeSeries: [
      { year: 2000, value: 3.4e9 }, { year: 2002, value: 4.3e9 },
      { year: 2004, value: 5.1e9 }, { year: 2006, value: 5.9e9 },
      { year: 2008, value: 6.8e9 }, { year: 2010, value: 7.9e9 },
      { year: 2012, value: 8.1e9 }, { year: 2014, value: 8.3e9 },
      { year: 2016, value: 8.7e9 }, { year: 2018, value: 9.1e9 },
      { year: 2020, value: 9.7e9 }, { year: 2022, value: 10.8e9 },
      { year: 2024, value: 11.3e9 },
    ],
    outcomes: [
      {
        label: "Murder Clearance Rate (%)",
        emoji: "🔍",
        direction: "higher_is_better",
        color: "pink",
        data: [
          { year: 2000, value: 63 }, { year: 2002, value: 64 },
          { year: 2004, value: 63 }, { year: 2006, value: 61 },
          { year: 2008, value: 64 }, { year: 2010, value: 65 },
          { year: 2012, value: 62 }, { year: 2014, value: 64 },
          { year: 2016, value: 60 }, { year: 2018, value: 62 },
          { year: 2020, value: 54 }, { year: 2022, value: 52 },
          { year: 2024, value: 52 },
        ],
      },
      {
        label: "Violent Crime Rate (per 100K)",
        emoji: "🔪",
        direction: "lower_is_better",
        color: "yellow",
        data: [
          { year: 2000, value: 507 }, { year: 2004, value: 463 },
          { year: 2008, value: 458 }, { year: 2012, value: 387 },
          { year: 2016, value: 397 }, { year: 2020, value: 399 },
          { year: 2024, value: 364 },
        ],
      },
    ],
    annotations: [
      { year: 2001, label: "FBI pivots from crime-fighting to counterterrorism — 2,000+ agents reassigned from criminal to CT", url: "https://www.justice.gov/jmd/budget-factsheet" },
      { year: 2004, label: "9/11 Commission finds FBI missed 10+ pre-attack warnings due to bureaucratic failures", url: "https://www.9-11commission.gov/report/911Report.pdf" },
      { year: 2013, label: "Boston Marathon bombing — FBI had been warned about Tsarnaevs by Russia, didn't follow up", url: "https://oig.justice.gov/reports/2014/s1404.pdf" },
      { year: 2016, label: "FBI director reopens presidential candidate email probe 11 days before election", url: "https://oig.justice.gov/reports/review-various-actions-federal-bureau-investigation-and-department-justice-advance-2016" },
    ],
    grade: "D",
    gradeRationale: "Budget tripled ($3.4B → $11.3B) while murder clearance rate dropped from 63% to 52%. Nearly half of all murders go unsolved despite record funding.",
    wishoniaQuote: "Eleven billion dollars a year and you cannot solve half your murders. On my planet, the clearance rate is a hundred percent because we have cameras and maths. You have both. You just use them to surveil journalists instead.",
    sources: [
      { label: "FBI Budget (DOJ)", url: "https://www.justice.gov/jmd/budget-factsheet" },
      { label: "FBI UCR Crime Data", url: "https://cde.ucr.cjis.gov/" },
    ],
  },
  {
    agencyId: "cyber",
    agencyName: "Cybercrime Enforcement (FBI IC3 + CISA)",
    emoji: "🛡️",
    countryCode: "US",
    mission: "Protect the nation from cyber-based threats",
    spendingLabel: "CISA + FBI Cyber Division Budget (USD)",
    spendingTimeSeries: [
      { year: 2015, value: 1.5e9 }, { year: 2016, value: 1.8e9 },
      { year: 2017, value: 2.0e9 }, { year: 2018, value: 2.3e9 },
      { year: 2019, value: 2.5e9 }, { year: 2020, value: 2.9e9 },
      { year: 2021, value: 3.1e9 }, { year: 2022, value: 3.5e9 },
      { year: 2023, value: 3.8e9 }, { year: 2024, value: 4.1e9 },
    ],
    outcomes: [
      {
        label: "IC3 Reported Cybercrime Losses (USD)",
        emoji: "💸",
        direction: "lower_is_better",
        color: "pink",
        data: [
          { year: 2015, value: 1.1e9 }, { year: 2016, value: 1.5e9 },
          { year: 2017, value: 1.4e9 }, { year: 2018, value: 2.7e9 },
          { year: 2019, value: 3.5e9 }, { year: 2020, value: 4.2e9 },
          { year: 2021, value: 6.9e9 }, { year: 2022, value: 10.3e9 },
          { year: 2023, value: 12.5e9 }, { year: 2024, value: 16.6e9 },
        ],
      },
      {
        label: "IC3 Reported Cybercrime Complaints",
        emoji: "📝",
        direction: "lower_is_better",
        color: "yellow",
        data: [
          { year: 2015, value: 288012 }, { year: 2016, value: 298728 },
          { year: 2017, value: 301580 }, { year: 2018, value: 351937 },
          { year: 2019, value: 467361 }, { year: 2020, value: 791790 },
          { year: 2021, value: 847376 }, { year: 2022, value: 800944 },
          { year: 2023, value: 880418 }, { year: 2024, value: 859532 },
        ],
      },
    ],
    annotations: [
      { year: 2017, label: "Equifax breach — 147M Americans' data stolen. $700M settlement, no one jailed.", url: "https://www.ftc.gov/enforcement/refunds/equifax-data-breach-settlement" },
      { year: 2018, label: "CISA established within DHS", url: "https://www.cisa.gov/about" },
      { year: 2020, label: "SolarWinds hack — Russian intelligence inside US government networks for 9 months undetected", url: "https://www.cisa.gov/news-events/directives/emergency-directive-21-01" },
      { year: 2021, label: "Colonial Pipeline ransomware — gas shortages across East Coast. $4.4M ransom paid.", url: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-131a" },
    ],
    grade: "F",
    gradeRationale: "Cybercrime budget grew 173% while reported losses exploded 1,409% ($1.1B → $16.6B). Complaints tripled. The threat is growing 8x faster than the defense.",
    wishoniaQuote: "Four billion dollars a year on cybersecurity and cybercrime losses went from one billion to sixteen billion. That is a one thousand four hundred percent increase in the thing you are supposed to be preventing. On my planet, we would fire the firewall.",
    sources: [
      { label: "FBI IC3 Annual Reports", url: "https://www.ic3.gov/AnnualReport" },
      { label: "CISA Budget", url: "https://www.cisa.gov/about" },
    ],
  },
  {
    agencyId: "va",
    agencyName: "Department of Veterans Affairs",
    emoji: "🎖️",
    countryCode: "US",
    mission: "Fulfill Lincoln's promise — to care for those who have served",
    spendingLabel: "VA Annual Budget (USD)",
    spendingTimeSeries: [
      { year: 2000, value: 45e9 }, { year: 2002, value: 51e9 },
      { year: 2004, value: 60e9 }, { year: 2006, value: 73e9 },
      { year: 2008, value: 87e9 }, { year: 2010, value: 125e9 },
      { year: 2012, value: 127e9 }, { year: 2014, value: 154e9 },
      { year: 2016, value: 177e9 }, { year: 2018, value: 199e9 },
      { year: 2020, value: 243e9 }, { year: 2022, value: 270e9 },
      { year: 2024, value: 325e9 },
    ],
    outcomes: [
      {
        label: "Veteran Suicides Per Year",
        emoji: "💔",
        direction: "lower_is_better",
        color: "pink",
        data: [
          { year: 2005, value: 6256 }, { year: 2008, value: 6268 },
          { year: 2010, value: 6427 }, { year: 2012, value: 6371 },
          { year: 2014, value: 6281 }, { year: 2016, value: 6380 },
          { year: 2018, value: 6435 }, { year: 2020, value: 6146 },
          { year: 2022, value: 6392 }, { year: 2024, value: 6300 },
        ],
      },
    ],
    annotations: [
      { year: 2007, label: "Walter Reed neglect scandal — moldy walls, cockroaches in wounded warrior housing", url: "https://www.gao.gov/products/gao-07-587t" },
      { year: 2014, label: "VA wait-time scandal — 40+ veterans die waiting for appointments. Phoenix VA falsified records.", url: "https://www.va.gov/oig/pubs/VAOIG-14-02603-267.pdf" },
      { year: 2017, label: "VA still can't deploy a working electronic health records system after $16B spent", url: "https://www.gao.gov/products/gao-22-105065" },
      { year: 2022, label: "PACT Act signed — toxic exposure benefits for 3.5M veterans. Budget surges to $325B.", url: "https://www.congress.gov/bill/117th-congress/senate-bill/3373" },
    ],
    grade: "D",
    gradeRationale: "Budget increased 622% ($45B → $325B) while veteran suicides remained flat at ~6,200-6,400/year. The money grew but the deaths didn't shrink.",
    wishoniaQuote: "Three hundred and twenty-five billion dollars a year and you cannot stop six thousand veterans from killing themselves. On my planet, we would consider this a moral emergency. Here it appears to be a line item.",
    sources: [
      { label: "VA Budget History", url: "https://www.va.gov/budget/products.asp" },
      { label: "VA Suicide Prevention Report", url: "https://www.mentalhealth.va.gov/suicide_prevention/data.asp" },
    ],
  },
  {
    agencyId: "tsa",
    agencyName: "Transportation Security Administration",
    emoji: "✈️",
    countryCode: "US",
    mission: "Protect the nation's transportation systems",
    spendingLabel: "TSA Annual Budget (USD)",
    spendingTimeSeries: [
      { year: 2002, value: 1.3e9 }, { year: 2004, value: 5.3e9 },
      { year: 2006, value: 6.2e9 }, { year: 2008, value: 7.1e9 },
      { year: 2010, value: 7.7e9 }, { year: 2012, value: 7.6e9 },
      { year: 2014, value: 7.4e9 }, { year: 2016, value: 7.6e9 },
      { year: 2018, value: 7.8e9 }, { year: 2020, value: 8.3e9 },
      { year: 2022, value: 9.2e9 }, { year: 2024, value: 11.0e9 },
    ],
    outcomes: [
      {
        label: "Terrorist Attacks on US Transportation (incidents)",
        emoji: "💥",
        direction: "lower_is_better",
        color: "pink",
        data: [
          { year: 2002, value: 0 }, { year: 2004, value: 0 },
          { year: 2006, value: 0 }, { year: 2008, value: 0 },
          { year: 2010, value: 1, annotation: "Times Square car bomb attempt" },
          { year: 2012, value: 0 }, { year: 2014, value: 0 },
          { year: 2016, value: 1, annotation: "LAX shooting" },
          { year: 2018, value: 0 }, { year: 2020, value: 0 },
          { year: 2022, value: 0 }, { year: 2024, value: 0 },
        ],
      },
      {
        label: "Firearms Detected at Checkpoints",
        emoji: "🔫",
        direction: "lower_is_better",
        color: "yellow",
        data: [
          { year: 2010, value: 1123 }, { year: 2012, value: 1549 },
          { year: 2014, value: 2212 }, { year: 2016, value: 3391 },
          { year: 2018, value: 4239 }, { year: 2020, value: 3257 },
          { year: 2022, value: 6542 }, { year: 2024, value: 6678 },
        ],
      },
    ],
    annotations: [
      { year: 2001, label: "9/11 attacks — TSA created within 2 months. 65,000 employees hired in one year.", url: "https://www.congress.gov/bill/107th-congress/senate-bill/1447" },
      { year: 2006, label: "Liquid bomb plot (UK) — TSA bans liquids >3.4oz. Still banned 18 years later.", url: "https://www.tsa.gov/travel/security-screening/liquids-rule" },
      { year: 2010, label: "Underwear bomber — $1B spent on full-body scanners. GAO finds 'limited evidence of effectiveness.'", url: "https://www.gao.gov/products/gao-10-128" },
      { year: 2015, label: "DHS Red Team gets 67 of 70 weapons through TSA checkpoints undetected (95% failure rate)", url: "https://abcnews.go.com/US/exclusive-undercover-dhs-tests-find-widespread-security-failures/story?id=31434881" },
    ],
    grade: "C",
    gradeRationale: "Zero major aviation attacks since creation, but attacks on transportation were near-zero before TSA too. GAO tests show 70-95% failure rate detecting test weapons. $11B/yr for security theater.",
    wishoniaQuote: "Eleven billion dollars a year to take your shoes off. The GAO sent test weapons through checkpoints and seventy to ninety-five percent got through. On my planet, we would call this an extremely expensive placebo.",
    sources: [
      { label: "TSA Budget (DHS)", url: "https://www.dhs.gov/publication/budget" },
      { label: "TSA Firearm Discovery Statistics", url: "https://www.tsa.gov/news/press/releases" },
      { label: "GAO TSA Covert Testing", url: "https://www.gao.gov/products/gao-17-794t" },
    ],
  },
  {
    agencyId: "usda",
    agencyName: "USDA (Farm Subsidies)",
    emoji: "🌾",
    countryCode: "US",
    mission: "Provide leadership on food, agriculture, and natural resources",
    spendingLabel: "Farm Subsidy Spending (USD)",
    spendingTimeSeries: [
      { year: 2000, value: 32.3e9 }, { year: 2002, value: 22.0e9 },
      { year: 2004, value: 16.0e9 }, { year: 2006, value: 20.0e9 },
      { year: 2008, value: 18.0e9 }, { year: 2010, value: 15.5e9 },
      { year: 2012, value: 14.0e9 }, { year: 2014, value: 20.0e9 },
      { year: 2016, value: 13.0e9 }, { year: 2018, value: 17.0e9 },
      { year: 2020, value: 45.0e9, annotation: "COVID farm relief" },
      { year: 2022, value: 25.0e9 }, { year: 2024, value: 36.5e9 },
    ],
    outcomes: [
      {
        label: "Number of US Farms (thousands)",
        emoji: "🚜",
        direction: "higher_is_better",
        color: "pink",
        data: [
          { year: 2000, value: 2167 }, { year: 2004, value: 2113 },
          { year: 2008, value: 2204 }, { year: 2012, value: 2109 },
          { year: 2016, value: 2043 }, { year: 2020, value: 2042 },
          { year: 2024, value: 1900 },
        ],
      },
      {
        label: "Food CPI (2000=100)",
        emoji: "🛒",
        direction: "lower_is_better",
        color: "yellow",
        data: [
          { year: 2000, value: 100 }, { year: 2004, value: 110 },
          { year: 2008, value: 125 }, { year: 2012, value: 137 },
          { year: 2016, value: 143 }, { year: 2020, value: 152 },
          { year: 2024, value: 183 },
        ],
      },
    ],
    annotations: [
      { year: 1933, label: "AAA created — first federal farm subsidies. Government pays farmers to destroy crops during Great Depression.", url: "https://www.ers.usda.gov/topics/farm-economy/farm-commodity-policy/" },
      { year: 1996, label: "Freedom to Farm Act — supposed to phase out subsidies. Instead, emergency payments replace them.", url: "https://www.congress.gov/bill/104th-congress/house-bill/2854" },
      { year: 2014, label: "Farm Bill replaces direct payments with crop insurance subsidies — 78% goes to top 10% of farms", url: "https://www.congress.gov/bill/113th-congress/house-bill/2642" },
      { year: 2020, label: "$46B in COVID farm relief — more than double the normal subsidy budget in a single year", url: "https://www.ers.usda.gov/topics/farm-economy/farm-sector-income-finances/government-payments-the-safety-net/" },
    ],
    grade: "F",
    gradeRationale: "Hundreds of billions in subsidies over decades while number of farms declined 12% and food prices rose 83%. Subsidies flow to megafarms while small farms die.",
    wishoniaQuote: "You pay farmers to grow corn nobody needs, while small farmers go bankrupt and food prices rise. The top ten percent of farms receive seventy-eight percent of subsidy payments. On my planet, we call that a wealth transfer with extra steps.",
    sources: [
      { label: "USDA ERS Farm Income", url: "https://www.ers.usda.gov/topics/farm-economy/" },
      { label: "USDA Census of Agriculture", url: "https://www.nass.usda.gov/AgCensus/" },
      { label: "BLS CPI Food", url: "https://www.bls.gov/cpi/" },
    ],
  },
  {
    agencyId: "hud",
    agencyName: "Department of Housing and Urban Development",
    emoji: "🏠",
    countryCode: "US",
    mission: "Create strong, sustainable, inclusive communities",
    spendingLabel: "HUD Annual Budget (USD)",
    spendingTimeSeries: [
      { year: 2000, value: 30.8e9 }, { year: 2004, value: 37.6e9 },
      { year: 2008, value: 38.5e9 }, { year: 2010, value: 47.5e9 },
      { year: 2012, value: 41.0e9 }, { year: 2014, value: 46.7e9 },
      { year: 2016, value: 48.3e9 }, { year: 2018, value: 51.5e9 },
      { year: 2020, value: 56.5e9 }, { year: 2022, value: 66.0e9 },
      { year: 2024, value: 73.0e9 },
    ],
    outcomes: [
      {
        label: "Homeless Population (HUD PIT count)",
        emoji: "🏕️",
        direction: "lower_is_better",
        color: "pink",
        data: [
          { year: 2007, value: 647258 }, { year: 2009, value: 630227 },
          { year: 2011, value: 623788 }, { year: 2013, value: 590364 },
          { year: 2015, value: 564708 }, { year: 2017, value: 553742 },
          { year: 2019, value: 567715 }, { year: 2020, value: 580466 },
          { year: 2022, value: 582462 }, { year: 2023, value: 653104 },
        ],
      },
    ],
    annotations: [
      { year: 1965, label: "HUD created", url: "https://www.hud.gov/about/hud_history" },
      { year: 1974, label: "Section 8 housing vouchers created — waitlists eventually reach 2+ years in most cities", url: "https://www.hud.gov/topics/housing_choice_voucher_program_section_8" },
      { year: 2008, label: "Subprime collapse — 10M foreclosures. HUD had promoted the lending policies that caused it.", url: "https://www.gao.gov/products/gao-09-782t" },
      { year: 2017, label: "HUD Secretary appointed with zero housing policy experience", url: "https://www.hud.gov/about/leadership" },
    ],
    grade: "F",
    gradeRationale: "Budget increased 137% ($30.8B → $73B) while homelessness decreased only 10% then reversed. 2023 count (653K) is the highest ever recorded.",
    wishoniaQuote: "Seventy-three billion dollars and the homeless population just hit a record high. On my planet, we solved housing by making it a right and pricing it algorithmically. You lot made it a speculative asset and then act surprised when people sleep outside.",
    sources: [
      { label: "HUD Annual Budget", url: "https://www.hud.gov/budget" },
      { label: "HUD Annual Homeless Assessment (AHAR)", url: "https://www.hudexchange.info/homelessness-assistance/ahar/" },
    ],
  },
  {
    agencyId: "state",
    agencyName: "State Department (Sanctions Regime)",
    emoji: "🌐",
    countryCode: "US",
    mission: "Lead America's foreign policy through diplomacy and sanctions",
    spendingLabel: "State Dept + Sanctions Enforcement Budget (USD)",
    spendingTimeSeries: [
      { year: 2000, value: 22e9 }, { year: 2004, value: 29e9 },
      { year: 2008, value: 39e9 }, { year: 2010, value: 52e9 },
      { year: 2012, value: 48e9 }, { year: 2014, value: 42e9 },
      { year: 2016, value: 40e9 }, { year: 2018, value: 41e9 },
      { year: 2020, value: 44e9 }, { year: 2022, value: 59e9 },
      { year: 2024, value: 63e9 },
    ],
    outcomes: [
      {
        label: "Countries Under US Sanctions",
        emoji: "🚫",
        direction: "lower_is_better",
        color: "pink",
        data: [
          { year: 2000, value: 9 }, { year: 2004, value: 12 },
          { year: 2008, value: 15 }, { year: 2012, value: 20 },
          { year: 2016, value: 26 }, { year: 2020, value: 30 },
          { year: 2024, value: 36 },
        ],
      },
      {
        label: "Estimated Civilian Deaths from US Sanctions (cumulative, thousands)",
        emoji: "☠️",
        direction: "lower_is_better",
        color: "red",
        data: [
          { year: 2000, value: 500, annotation: "Iraq sanctions: 500K children (UNICEF/Lancet)" },
          { year: 2004, value: 510 }, { year: 2008, value: 530 },
          { year: 2012, value: 560 }, { year: 2016, value: 600 },
          { year: 2020, value: 650 }, { year: 2024, value: 700 },
        ],
      },
    ],
    annotations: [
      { year: 1990, label: "Iraq sanctions begin — Madeleine Albright later says 500K dead Iraqi children 'was worth it'", url: "https://ofac.treasury.gov/sanctions-programs-and-information" },
      { year: 2003, label: "Libya sanctions lifted after Gaddafi denuclearizes — NATO bombs him 8 years later anyway", url: "https://ofac.treasury.gov/sanctions-programs-and-information" },
      { year: 2012, label: "Iran nuclear sanctions — medicine shortages kill unknown thousands of Iranian civilians", url: "https://ofac.treasury.gov/sanctions-programs-and-information" },
      { year: 2022, label: "Russia sanctions (Ukraine) — most sanctioned country in history. Ruble recovers within months.", url: "https://ofac.treasury.gov/sanctions-programs-and-information" },
    ],
    grade: "F",
    gradeRationale: "Sanctioned countries quadrupled (9→36) with no evidence of regime change. Estimated 700K+ civilian deaths from sanctions, primarily children. Sanctions punish populations, not leaders.",
    wishoniaQuote: "Your sanctions programme has killed more children than the dictators you aimed them at. The Iraqi sanctions alone killed an estimated five hundred thousand children. When asked about this, your Secretary of State said 'the price is worth it.' On my planet, that statement would be evidence in a tribunal.",
    sources: [
      { label: "OFAC Sanctions Programs", url: "https://ofac.treasury.gov/sanctions-programs-and-information" },
      { label: "Lancet/UNICEF Iraq Sanctions Study", url: "https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(95)92185-X/fulltext" },
    ],
  },
  {
    agencyId: "osha",
    agencyName: "Occupational Safety and Health Administration",
    emoji: "🦺",
    countryCode: "US",
    mission: "Ensure safe and healthful working conditions",
    spendingLabel: "OSHA Annual Budget (USD)",
    spendingTimeSeries: [
      { year: 2000, value: 426e6 }, { year: 2004, value: 468e6 },
      { year: 2008, value: 490e6 }, { year: 2010, value: 559e6 },
      { year: 2012, value: 535e6 }, { year: 2014, value: 552e6 },
      { year: 2016, value: 553e6 }, { year: 2018, value: 553e6 },
      { year: 2020, value: 581e6 }, { year: 2022, value: 610e6 },
      { year: 2024, value: 632e6 },
    ],
    outcomes: [
      {
        label: "Workplace Fatality Rate (per 100K workers)",
        emoji: "⚠️",
        direction: "lower_is_better",
        color: "pink",
        data: [
          { year: 2000, value: 4.3 }, { year: 2004, value: 4.1 },
          { year: 2008, value: 3.7 }, { year: 2010, value: 3.6 },
          { year: 2012, value: 3.4 }, { year: 2014, value: 3.4 },
          { year: 2016, value: 3.6 }, { year: 2018, value: 3.5 },
          { year: 2020, value: 3.4 }, { year: 2022, value: 3.7 },
          { year: 2024, value: 3.5 },
        ],
      },
    ],
    annotations: [
      { year: 1911, label: "Triangle Shirtwaist fire — 146 workers die. Leads to state labor laws (no federal agency yet).", url: "https://www.osha.gov/aboutosha/40-years/trianglefactoryfire" },
      { year: 1970, label: "OSHA created — workplace fatality rate had already dropped 70% since 1900 without a federal agency", url: "https://www.osha.gov/aboutosha" },
      { year: 2010, label: "Deepwater Horizon — 11 workers killed. OSHA had no jurisdiction (offshore = different agency).", url: "https://www.bls.gov/iif/oshcfoi1.htm" },
    ],
    grade: "C",
    gradeRationale: "Workplace fatality rate declined from 4.3 to 3.5 per 100K (19% drop) with modest budget increases. However, the rate was already declining at the same pace before OSHA existed (from 61 per 100K in 1900 to 18 in 1970).",
    wishoniaQuote: "Workplace deaths were declining at the same rate before OSHA as after. The decline from sixty-one to eighteen deaths per hundred thousand happened without any federal safety agency. Technology, liability law, and worker self-interest did the work. OSHA just took credit.",
    sources: [
      { label: "BLS Census of Fatal Occupational Injuries", url: "https://www.bls.gov/iif/oshcfoi1.htm" },
      { label: "OSHA Budget (DOL)", url: "https://www.osha.gov/data" },
    ],
  },
  {
    agencyId: "irs",
    agencyName: "Internal Revenue Service",
    emoji: "💸",
    countryCode: "US",
    mission: "Provide America's taxpayers top quality service by helping them understand and meet their tax responsibilities",
    spendingLabel: "IRS Annual Budget (USD)",
    spendingTimeSeries: [
      { year: 2000, value: 8.3e9 }, { year: 2002, value: 9.5e9 },
      { year: 2004, value: 10.2e9 }, { year: 2006, value: 10.6e9 },
      { year: 2008, value: 11.4e9 }, { year: 2010, value: 12.1e9 },
      { year: 2012, value: 11.8e9 }, { year: 2014, value: 11.3e9 },
      { year: 2016, value: 11.2e9 }, { year: 2018, value: 11.4e9 },
      { year: 2020, value: 11.5e9 }, { year: 2022, value: 12.6e9 },
      { year: 2024, value: 14.1e9 },
    ],
    outcomes: [
      {
        label: "Tax Gap (USD, billions)",
        emoji: "🕳️",
        direction: "lower_is_better",
        color: "pink",
        data: [
          { year: 2001, value: 345 }, { year: 2006, value: 385 },
          { year: 2008, value: 450 }, { year: 2011, value: 406 },
          { year: 2014, value: 441 }, { year: 2016, value: 480 },
          { year: 2019, value: 600 }, { year: 2021, value: 688 },
          { year: 2024, value: 700 },
        ],
      },
      {
        label: "Individual Audit Rate (%)",
        emoji: "🔎",
        direction: "higher_is_better",
        color: "yellow",
        data: [
          { year: 2000, value: 0.49 }, { year: 2004, value: 0.77 },
          { year: 2008, value: 1.01 }, { year: 2010, value: 1.11 },
          { year: 2012, value: 1.02 }, { year: 2014, value: 0.86 },
          { year: 2016, value: 0.70 }, { year: 2018, value: 0.40 },
          { year: 2020, value: 0.25 }, { year: 2022, value: 0.38 },
          { year: 2024, value: 0.44 },
        ],
      },
    ],
    annotations: [
      { year: 2013, label: "IRS targeting scandal — Congress retaliates by cutting budget 20% over next 5 years", url: "https://www.tigta.gov/reports/audit/inappropriate-criteria-were-used-identify-tax-exempt-applications-review" },
      { year: 2017, label: "Audit rate for millionaires drops to 1.4% — lower than for EITC recipients making <$25K", url: "https://www.irs.gov/statistics/soi-tax-stats-irs-data-book" },
      { year: 2022, label: "Inflation Reduction Act — $80B IRS funding approved", url: "https://www.congress.gov/bill/117th-congress/house-bill/5376" },
      { year: 2023, label: "$20B of IRA funding rescinded in debt ceiling deal — before agents are even hired", url: "https://www.congress.gov/bill/118th-congress/house-bill/3746" },
    ],
    grade: "D",
    gradeRationale: "Budget was effectively flat/cut for a decade while the tax gap doubled to $700B. Audit rate collapsed from 1.1% to 0.25%. The IRA funding in 2022 is slowly reversing the damage.",
    wishoniaQuote: "You defunded the one agency that generates revenue. The IRS collects four dollars for every one dollar you spend on it. You cut its budget and the tax gap doubled to seven hundred billion. On my planet, we would call this self-sabotage. Here you call it fiscal conservatism.",
    sources: [
      { label: "IRS Data Book", url: "https://www.irs.gov/statistics/soi-tax-stats-irs-data-book" },
      { label: "IRS Tax Gap Estimates", url: "https://www.irs.gov/newsroom/the-tax-gap" },
      { label: "Treasury Inspector General", url: "https://www.tigta.gov/" },
    ],
  },
  {
    agencyId: "fed",
    agencyName: "Federal Reserve System",
    emoji: "🏦",
    countryCode: "US",
    mission: "Promote maximum employment, stable prices, and moderate long-term interest rates",
    spendingLabel: "Fed Operating Expenses + Interest on Reserves (USD)",
    spendingTimeSeries: [
      { year: 2000, value: 2.6e9 }, { year: 2002, value: 2.8e9 },
      { year: 2004, value: 3.0e9 }, { year: 2006, value: 3.3e9 },
      { year: 2008, value: 3.6e9 }, { year: 2010, value: 4.1e9 },
      { year: 2012, value: 4.5e9 }, { year: 2014, value: 4.8e9 },
      { year: 2016, value: 5.0e9 }, { year: 2018, value: 5.2e9 },
      { year: 2020, value: 5.3e9 }, { year: 2022, value: 5.4e9 },
      { year: 2024, value: 5.5e9 },
    ],
    outcomes: [
      {
        label: "Dollar Purchasing Power (1913 = $1.00)",
        emoji: "💵",
        direction: "higher_is_better",
        color: "pink",
        data: [
          { year: 2000, value: 0.058 }, { year: 2002, value: 0.056 },
          { year: 2004, value: 0.053 }, { year: 2006, value: 0.050 },
          { year: 2008, value: 0.047 }, { year: 2010, value: 0.045 },
          { year: 2012, value: 0.043 }, { year: 2014, value: 0.042 },
          { year: 2016, value: 0.041 }, { year: 2018, value: 0.039 },
          { year: 2020, value: 0.037 }, { year: 2022, value: 0.032 },
          { year: 2024, value: 0.030 },
        ],
      },
      {
        label: "Fed Balance Sheet (trillions USD)",
        emoji: "🖨️",
        direction: "lower_is_better",
        color: "yellow",
        data: [
          { year: 2000, value: 0.6 }, { year: 2002, value: 0.7 },
          { year: 2004, value: 0.7 }, { year: 2006, value: 0.8 },
          { year: 2008, value: 0.9 }, { year: 2010, value: 2.3 },
          { year: 2012, value: 2.9 }, { year: 2014, value: 4.5 },
          { year: 2016, value: 4.5 }, { year: 2018, value: 4.1 },
          { year: 2020, value: 7.4 }, { year: 2022, value: 8.9 },
          { year: 2024, value: 7.0 },
        ],
      },
    ],
    annotations: [
      { year: 1913, label: "Federal Reserve created. Dollar immediately used to finance WWI.", url: "https://fred.stlouisfed.org/series/CUUR0000SA0R" },
      { year: 1933, label: "Executive order confiscates private gold. Owning gold becomes a federal crime.", url: "https://www.presidency.ucsb.edu/documents/executive-order-6102-requiring-gold-coin-gold-bullion-and-gold-certificates-be-delivered" },
      { year: 1971, label: "Gold standard ended — 'temporary' measure. Still active 54 years later. Workers' purchasing power in gold falls 93%.", url: "https://fred.stlouisfed.org/series/CUUR0000SA0R" },
      { year: 2008, label: "$700B TARP + $16.1T in Fed emergency lending (GAO audit). Citigroup gets $45B, pays $5.33B in exec bonuses. 10M families lose homes. Zero bankers jailed.", url: "https://www.gao.gov/products/gao-11-696" },
      { year: 2020, label: "COVID: $4.6T created in 2 years. Top 1% gains $4T in net worth. Bottom 50% gets $1,200 stimulus checks.", url: "https://fred.stlouisfed.org/series/WALCL" },
      { year: 2022, label: "Inflation hits 9.1% — highest since 1981. Grocery prices up 25% in 3 years.", url: "https://www.bls.gov/cpi/" },
    ],
    grade: "F",
    gradeRationale: "The dollar has lost 97% of its purchasing power since the Fed was created. The economy grew faster without it (3.8% vs 2.7%). Canada had zero bank failures during the Great Depression without a central bank. The Fed's balance sheet went from $900B to $8.9T — printing money that went to the top 1%.",
    wishoniaQuote: "Your species created an institution to manage your money. In 111 years it has destroyed ninety-seven percent of your currency's value, bailed out the banks that crashed the economy, printed four point six trillion dollars during a pandemic that mostly went to the already wealthy, and presided over the largest wealth transfer in human history. On my planet, we would call that embezzlement. Here you call it monetary policy.",
    sources: [
      { label: "FRED — Consumer Price Index", url: "https://fred.stlouisfed.org/series/CUUR0000SA0R" },
      { label: "FRED — Fed Balance Sheet (WALCL)", url: "https://fred.stlouisfed.org/series/WALCL" },
      { label: "GAO — Federal Reserve Emergency Lending", url: "https://www.gao.gov/products/gao-11-696" },
      { label: "Minneapolis Fed — CPI 1800-present", url: "https://www.minneapolisfed.org/about-us/monetary-policy/inflation-calculator/consumer-price-index-1800-" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

export function getAgencyPerformanceByCountry(countryCode: string): AgencyPerformance[] {
  return US_AGENCY_PERFORMANCE.filter((a) => a.countryCode === countryCode);
}

export function getAgencyPerformance(agencyId: string, countryCode: string): AgencyPerformance | undefined {
  return US_AGENCY_PERFORMANCE.find(
    (a) => a.agencyId === agencyId && a.countryCode === countryCode,
  );
}
