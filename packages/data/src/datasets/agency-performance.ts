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
  /** Primary source for this value */
  sourceUrl?: string;
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
  /**
   * Letter grade computed from spending and the first outcome series. Null when
   * no outcome series has enough sourced points to grade.
   */
  grade: AgencyGrade | null;
  /** One-line explanation of the grade */
  gradeRationale: string;
  /** Wishonia commentary */
  wishoniaQuote: string;
  /** Data sources */
  sources: { label: string; url: string }[];
}

/** Curated agency data before the grade is computed from it. */
export type AgencyPerformanceInput = Omit<AgencyPerformance, "grade">;

// ---------------------------------------------------------------------------
// Grade computation
// ---------------------------------------------------------------------------

/** Each series needs this many points for its first and last 3-point averages to differ. */
export const MIN_POINTS_TO_GRADE = 6;

/**
 * Compute a letter grade from spending and outcome trends.
 * Compares the first/last 3-year averages to smooth noise.
 */
export function computeGrade(
  spending: TimePoint[],
  outcome: TimePoint[],
  outcomeDirection: "lower_is_better" | "higher_is_better",
): { grade: AgencyGrade; rationale: string } {
  if (spending.length < MIN_POINTS_TO_GRADE || outcome.length < MIN_POINTS_TO_GRADE) {
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

/**
 * Grade an agency on its spending and first outcome series over the years
 * both cover, or return null when either is too short there to grade.
 * computeGrade compares first- and last-3-point averages, so both series
 * must start and end in the same window or the two changes cover different
 * periods.
 */
export function gradeAgency(agency: AgencyPerformanceInput): AgencyGrade | null {
  const primary = agency.outcomes[0];
  if (!primary) return null;

  const spendingYears = agency.spendingTimeSeries.map((point) => point.year);
  const outcomeYears = primary.data.map((point) => point.year);
  const from = Math.max(Math.min(...spendingYears), Math.min(...outcomeYears));
  const to = Math.min(Math.max(...spendingYears), Math.max(...outcomeYears));
  const inWindow = (point: TimePoint) => point.year >= from && point.year <= to;
  const spending = agency.spendingTimeSeries.filter(inWindow);
  const outcome = primary.data.filter(inWindow);

  if (spending.length < MIN_POINTS_TO_GRADE || outcome.length < MIN_POINTS_TO_GRADE) {
    return null;
  }
  return computeGrade(spending, outcome, primary.direction).grade;
}

// ---------------------------------------------------------------------------
// US Agency Data (curated from official sources; every point cites its source)
// ---------------------------------------------------------------------------

type YearValue = readonly [year: number, value: number];

/** Points that share one source document. */
function sourced(sourceUrl: string, points: readonly YearValue[]): TimePoint[] {
  return points.map(([year, value]) => ({ year, value, sourceUrl }));
}

const OMB_TABLE_5_2 = "https://www.whitehouse.gov/wp-content/uploads/2026/04/hist05z2_fy2027.xlsx";
const OMB_TABLE_5_4 = "https://www.whitehouse.gov/wp-content/uploads/2026/04/hist05z4_fy2027.xlsx";

const US_AGENCY_DATA: AgencyPerformanceInput[] = [
  {
    agencyId: "dea",
    agencyName: "Drug Enforcement Administration",
    emoji: "💊",
    countryCode: "US",
    mission: "Enforce controlled substance laws and reduce drug availability",
    spendingLabel:
      "Federal drug control budget (ONDCP; budget authority, nominal USD, fiscal year; includes treatment and prevention)",
    spendingTimeSeries: [
      // ONDCP's current (FY2012) method, restated back to FY2006. Earlier years
      // used methods that are not comparable. DEA itself is ~$3.3B of this.
      ...sourced(
        "https://obamawhitehouse.archives.gov/sites/default/files/ondcp/Fact_Sheets/fy2014_budget_and_performance-summary.pdf",
        [[2006, 20.6e9], [2008, 21.8e9], [2010, 24.6e9], [2012, 24.5e9]],
      ),
      ...sourced(
        "https://obamawhitehouse.archives.gov/sites/default/files/ondcp/policy-and-research/fy_2016_budget_summary.pdf",
        [[2014, 25.7e9]],
      ),
      ...sourced(
        "https://www.govinfo.gov/content/pkg/CMR-PREX26-00185058/pdf/CMR-PREX26-00185058.pdf",
        [[2016, 26.9e9], [2018, 33.3e9], [2020, 39.7e9], [2022, 40.9e9]],
      ),
      // FY2024 continuing-resolution level; no final FY2024 total is published yet.
      ...sourced(
        "https://bidenwhitehouse.archives.gov/wp-content/uploads/2024/03/FY-2025-Budget-Highlights.pdf",
        [[2024, 43.6e9]],
      ),
    ],
    outcomes: [
      {
        label: "Drug overdose deaths (NCHS final, US residents)",
        emoji: "☠️",
        direction: "lower_is_better",
        color: "pink",
        data: [
          ...sourced(
            "https://data.cdc.gov/resource/xbxb-epbu.json?state=United%20States&sex=Both%20Sexes&age_group=All%20Ages&race_and_hispanic_origin=All%20Races-All%20Origins",
            [[2000, 17415], [2002, 23518], [2004, 27424], [2006, 34425], [2008, 36450], [2010, 38329], [2012, 41502]],
          ),
          ...sourced("https://www.cdc.gov/nchs/products/databriefs/db549.htm", [
            [2014, 47055], [2016, 63632], [2018, 67367], [2020, 91799], [2022, 107941], [2024, 79384],
          ]),
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
    gradeRationale:
      "Federal drug control spending grew from $20.6B (FY2006) to $43.6B (FY2024) while overdose deaths went from 17,415 (2000) to 107,941 (2022) — a 520% increase — before falling to 79,384 in 2024. Since the DEA was created in 1973, yearly deaths peaked at roughly 20 times their starting level.",
    wishoniaQuote:
      "Forty-four billion dollars a year — and overdose deaths peaked at twenty times the level you started with. Portugal decriminalized everything in 2001 and deaths dropped eighty percent. You are spending forty-four billion a year on a problem that got twenty times worse.",
    sources: [
      { label: "ONDCP National Drug Control Budget (FY2024 Funding Highlights)", url: "https://www.govinfo.gov/content/pkg/CMR-PREX26-00185058/pdf/CMR-PREX26-00185058.pdf" },
      { label: "NCHS Data Brief 549: Drug overdose deaths, 2014–2024", url: "https://www.cdc.gov/nchs/products/databriefs/db549.htm" },
      { label: "CDC WONDER Overdose Deaths", url: "https://wonder.cdc.gov/" },
    ],
  },
  {
    agencyId: "nih",
    agencyName: "National Institutes of Health",
    emoji: "🔬",
    countryCode: "US",
    mission: "Seek fundamental knowledge and apply it to enhance health",
    spendingLabel: "NIH program level (nominal USD, fiscal year; excludes ARPA-H and emergency supplementals)",
    spendingTimeSeries: sourced(
      // CRS R43341 Table 3 reproduces the NIH Budget Office history, which blocks automated access.
      "https://www.congress.gov/crs_external_products/R/PDF/R43341/R43341.58.pdf",
      [
        [2000, 17.8e9], [2002, 23.3e9], [2004, 28.0e9], [2006, 28.6e9], [2008, 29.6e9], [2010, 31.2e9],
        [2012, 30.9e9], [2014, 30.1e9], [2016, 32.3e9], [2018, 37.3e9], [2020, 41.7e9], [2022, 45.2e9],
        [2024, 47.3e9],
      ],
    ),
    outcomes: [
      {
        label: "CDER novel drug approvals (new molecular entities; plus new therapeutic BLAs from 2004), calendar year",
        emoji: "💊",
        direction: "higher_is_better",
        color: "pink",
        data: [
          ...sourced(
            "https://www.fda.gov/about-fda/histories-fda-regulated-products/summary-nda-approvals-receipts-1938-present",
            [[2000, 27], [2002, 17], [2004, 36], [2006, 22], [2008, 24], [2010, 21], [2012, 39], [2014, 41]],
          ),
          ...sourced("https://www.fda.gov/media/184967/download", [[2016, 22], [2018, 59], [2020, 53]]),
          ...sourced("https://www.fda.gov/drugs/novel-drug-approvals-fda/novel-drug-approvals-2022", [[2022, 37]]),
          ...sourced("https://www.fda.gov/drugs/novel-drug-approvals-fda/novel-drug-approvals-2024", [[2024, 50]]),
        ],
      },
    ],
    annotations: [
      { year: 1998, label: "Congress begins 'doubling' the NIH budget over 5 years", url: "https://www.nih.gov/about-nih/what-we-do/budget" },
      { year: 2003, label: "Doubling complete ($27.2B) — then budget flatlines for a decade", url: "https://www.nih.gov/about-nih/what-we-do/budget" },
      { year: 2013, label: "Sequestration cuts $1.7B from NIH — 640 fewer grants funded", url: "https://www.gao.gov/products/gao-14-750r" },
      { year: 2020, label: "$4.9B emergency COVID supplemental — suddenly money is available when Congress is scared", url: "https://www.nih.gov/coronavirus" },
    ],
    gradeRationale:
      "Budget increased 165% (FY2000 $17.8B → FY2024 $47.3B) while novel drug approvals rose from 27 (2000) to 50 (2024) — volatile, but about 75% higher comparing 2000–04 with 2020–24. Only 3.3% of the budget reaches actual clinical trials.",
    wishoniaQuote:
      "Forty-seven billion dollars. Three point three percent touches a patient. The rest funds the world's most expensive grant-writing competition.",
    sources: [
      { label: "NIH appropriations history (NIH Budget Office)", url: "https://officeofbudget.od.nih.gov/approp_hist.html" },
      { label: "CRS R43341: NIH funding (Table 3)", url: "https://www.congress.gov/crs_external_products/R/PDF/R43341/R43341.58.pdf" },
      { label: "FDA Novel Drug Approvals", url: "https://www.fda.gov/drugs/development-approval-process-drugs/novel-drug-approvals-fda" },
    ],
  },
  {
    agencyId: "fda",
    agencyName: "Food and Drug Administration",
    emoji: "🏥",
    countryCode: "US",
    mission: "Protect public health by ensuring safety and efficacy of drugs and food",
    spendingLabel: "FDA total program level: budget authority + user fees (nominal USD, fiscal year; excludes COVID supplementals)",
    spendingTimeSeries: [
      // CRS reports reproduce FDA's Congressional Justification tables.
      ...sourced(
        "https://www.everycrsreport.com/files/20080129_RL34334_bf2f8e5ead18d398baecfab7aeca87f38b31d43d.pdf",
        [[2000, 1.21e9], [2004, 1.68e9]],
      ),
      ...sourced("https://www.everycrsreport.com/reports/R40792.html", [[2008, 2.42e9], [2010, 3.28e9]]),
      ...sourced(
        "https://www.everycrsreport.com/files/20160728_R44576_dd73fb99110251572238cf5441277d18d742acf1.html",
        [[2012, 3.83e9], [2014, 4.39e9]],
      ),
      ...sourced(
        "https://www.everycrsreport.com/files/20180912_R44576_d59baa892d887c07fe83dc714bbd32664adf5a2c.html",
        [[2016, 4.75e9], [2018, 5.27e9]],
      ),
      ...sourced(
        "https://www.everycrsreport.com/files/2021-06-16_R44576_15ed8f55b557ad1b3712026a877228cbe999973c.html",
        [[2020, 5.92e9]],
      ),
      ...sourced("https://www.congress.gov/crs_external_products/R/PDF/R44576/R44576.16.pdf", [
        [2022, 6.25e9], [2024, 6.88e9],
      ]),
    ],
    outcomes: [
      {
        label: "Tufts CSDD estimated R&D cost per approved new drug (USD millions, 2013 dollars; plotted at study publication year)",
        emoji: "💰",
        direction: "lower_is_better",
        color: "pink",
        // Two study-cohort estimates, not annual data: drugs first tested in
        // humans 1983–94 (published 2003) and 1995–2007 (published 2014).
        data: sourced(
          "https://www.globenewswire.com/news-release/2014/11/18/1187467/0/en/Cost-to-Develop-and-Win-Marketing-Approval-for-a-New-Drug-Is-2-6-Billion-According-to-the-Tufts-Center-for-the-Study-of-Drug-Development.html",
          [[2003, 1044], [2014, 2558]],
        ),
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
    gradeRationale:
      "Not graded: only two sourced estimates of drug development cost exist. FDA's total program level rose 466% (FY2000 $1.21B → FY2024 $6.88B, nominal). Tufts CSDD's estimated cost per approved drug rose 145% after inflation — $1.04B to $2.56B in 2013 dollars — between drugs first tested in 1983–94 and 1995–2007.",
    wishoniaQuote:
      "The FDA's budget grew more than fivefold and the cost of developing a drug more than doubled after inflation. That is not regulation. That is a protection racket with a government seal.",
    sources: [
      { label: "FDA budgets and Congressional Justifications", url: "https://www.fda.gov/about-fda/reports/budgets" },
      { label: "Tufts CSDD Drug Development Cost", url: "https://csdd.tufts.edu/" },
    ],
  },
  {
    agencyId: "doed",
    agencyName: "Department of Education",
    emoji: "📚",
    countryCode: "US",
    mission: "Promote student achievement and preparation for global competitiveness",
    spendingLabel:
      "Department of Education discretionary budget authority (OMB Historical Table 5.4; nominal USD, fiscal year; includes emergency funds)",
    spendingTimeSeries: sourced(OMB_TABLE_5_4, [
      [2000, 29.4e9], [2002, 49.5e9], [2004, 55.7e9], [2006, 58.4e9], [2008, 57.2e9], [2010, 64.1e9],
      [2012, 67.4e9], [2014, 67.3e9], [2016, 68.3e9], [2018, 73.3e9], [2020, 103.0e9], [2022, 76.3e9],
      [2024, 79.2e9],
    ]),
    outcomes: [
      {
        label: "NAEP long-term-trend mathematics, age 17 (0–500 scale; last given 2012)",
        emoji: "📊",
        direction: "higher_is_better",
        color: "pink",
        data: sourced(
          "https://nces.ed.gov/nationsreportcard/subject/publications/main2012/pdf/2013456.pdf",
          [[1999, 308], [2004, 307], [2008, 306], [2012, 306]],
        ),
      },
    ],
    annotations: [
      { year: 1980, label: "Dept of Education created — SAT scores had already been declining for 13 years", url: "https://www2.ed.gov/about/overview/fed/role.html" },
      { year: 2002, label: "No Child Left Behind signed — standardized testing becomes the curriculum", url: "https://www.congress.gov/bill/107th-congress/house-bill/1" },
      { year: 2009, label: "Race to the Top — $4.35B in competitive grants, schools teach to the test", url: "https://www2.ed.gov/programs/racetothetop/index.html" },
      { year: 2015, label: "Every Student Succeeds Act replaces NCLB — test scores still flat", url: "https://www.congress.gov/bill/114th-congress/senate-bill/1177" },
      { year: 2023, label: "Finland: no standardized testing, no homework before age 12, shorter school days. Ranks top 5 globally. US: $80B/yr, ranks 36th in math.", url: "https://www.oecd.org/pisa/" },
    ],
    gradeRationale:
      "Not graded: the age-17 math test was given only four times in this period. Discretionary budget authority rose 170% (FY2000 $29.4B → FY2024 $79.2B) while the long-term-trend math score for 17-year-olds stayed flat — 308 in 1999, 306 in 2012 (305 in 1990) — and the test has not been given to 17-year-olds since 2012.",
    wishoniaQuote:
      "Eighty billion dollars a year, and you stopped testing your seventeen-year-olds in maths in 2012 — when they scored the same as in 1990. On my planet, we would call this evidence of sabotage.",
    sources: [
      { label: "OMB Historical Table 5.4 (discretionary budget authority by agency)", url: OMB_TABLE_5_4 },
      { label: "NAEP Long-Term Trend", url: "https://nces.ed.gov/nationsreportcard/ltt/" },
    ],
  },
  {
    agencyId: "dod",
    agencyName: "Department of Defense",
    emoji: "💀",
    countryCode: "US",
    mission: "Provide military forces needed to deter war and protect security",
    spendingLabel: "US military expenditure (SIPRI; current USD, calendar year)",
    spendingTimeSeries: sourced("https://www.sipri.org/sites/default/files/SIPRI-Milex-data-1949-2025_v1.2.xlsx", [
      [2000, 320.1e9], [2002, 378.5e9], [2004, 493.0e9], [2006, 558.3e9], [2008, 656.8e9], [2010, 738.0e9],
      [2012, 725.2e9], [2014, 647.8e9], [2016, 639.9e9], [2018, 682.5e9], [2020, 778.4e9], [2022, 860.7e9],
      [2024, 1004.9e9],
    ]),
    // No official source publishes a yearly count of deaths caused by US
    // military action. Brown University's Costs of War project gives only
    // occasional cumulative totals, so DoD has no graded outcome.
    outcomes: [],
    annotations: [
      { year: 1964, label: "Gulf of Tonkin — NSA later confirmed the 2nd attack never happened. Congress authorized war based on fabricated intelligence.", url: "https://www.archives.gov/research/pentagon-papers" },
      { year: 1990, label: "Nayirah testimony — 15-year-old told Congress Iraqi soldiers killed babies in incubators. Later revealed she was the Kuwaiti ambassador's daughter. Testimony was fabricated by PR firm Hill & Knowlton.", url: "https://www.govinfo.gov/content/pkg/CHRG-102hhrg62449/html/CHRG-102hhrg62449.htm" },
      { year: 2001, label: "AUMF authorizes unlimited war powers. Still active 23 years later. Used to justify operations in 22 countries.", url: "https://www.congress.gov/bill/107th-congress/senate-joint-resolution/23" },
      { year: 2003, label: "Iraq invasion — fabricated WMD evidence presented to UN. No WMDs found. 300K+ Iraqi civilians murdered. Cost: $2.4T.", url: "https://watson.brown.edu/costsofwar/" },
      { year: 2010, label: "Leaked video shows Apache helicopter killing Reuters journalists and children in Baghdad", url: "https://watson.brown.edu/costsofwar/costs/human" },
      { year: 2013, label: "NSA mass surveillance revealed — warrantless wiretapping of US citizens funded by DoD budget", url: "https://www.dni.gov/index.php/ic-legal-reference-book/the-usa-freedom-act" },
      { year: 2021, label: "Afghanistan withdrawal — 20 years, $2.3T, 176K murdered. Taliban retakes country in 11 days.", url: "https://watson.brown.edu/costsofwar/figures/2021/human-and-budgetary-costs-date-us-war-afghanistan-2001-2022" },
    ],
    gradeRationale:
      "Not graded: no official source publishes yearly deaths caused by US military action. Military spending tripled, from $320B (2000) to $1,005B (2024), while the post-9/11 wars killed more than 940,000 people directly — all sides, 2001–2023 (Brown University Costs of War). The department meant to deter war started several.",
    wishoniaQuote:
      "A trillion dollars a year on the ability to destroy things. Zero dollars returned. More than nine hundred thousand people killed outright. On my planet, this would be considered a bug, not a feature.",
    sources: [
      { label: "SIPRI Military Expenditure Database", url: "https://www.sipri.org/databases/milex" },
      { label: "Watson Institute Costs of War: human costs", url: "https://costsofwar.watson.brown.edu/costs/human" },
    ],
  },
  {
    agencyId: "hhs",
    agencyName: "Healthcare System (HHS/CMS)",
    emoji: "🩺",
    countryCode: "US",
    mission: "Enhance and protect the health and well-being of all Americans",
    spendingLabel: "National health expenditure per capita, all payers (CMS NHEA; nominal USD, calendar year)",
    spendingTimeSeries: sourced("https://www.cms.gov/files/zip/nhe-summary-including-share-gdp-cy-1960-2024.zip", [
      [2000, 4842], [2002, 5678], [2004, 6481], [2006, 7266], [2008, 7907], [2010, 8377], [2012, 8860],
      [2014, 9421], [2016, 10229], [2018, 11042], [2020, 12637], [2022, 13689], [2024, 15474],
    ]),
    outcomes: [
      {
        label: "US life expectancy at birth (NCHS, years)",
        emoji: "❤️",
        direction: "higher_is_better",
        color: "pink",
        data: [
          ...sourced("https://data.cdc.gov/resource/w9j2-ggv5.json?race=All%20Races&sex=Both%20Sexes", [
            [2000, 76.8], [2002, 77.0], [2004, 77.5], [2006, 77.8], [2008, 78.2], [2010, 78.7], [2012, 78.8],
            [2014, 78.9], [2016, 78.7], [2018, 78.7],
          ]),
          ...sourced("https://www.cdc.gov/nchs/products/databriefs/db427.htm", [[2020, 77.0]]),
          ...sourced("https://www.cdc.gov/nchs/products/databriefs/db492.htm", [[2022, 77.5]]),
          ...sourced("https://www.cdc.gov/nchs/products/databriefs/db548.htm", [[2024, 79.0]]),
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
    gradeRationale:
      "Health spending per capita more than tripled ($4,842 in 2000 → $15,474 in 2024) while life expectancy rose only from 76.8 to 79.0 years — barely above its 2014 level of 78.9. The US spends more per person than any country and gets middling outcomes.",
    wishoniaQuote:
      "You tripled what you spend on healthcare and your people live about as long as they did a decade ago. Singapore spends a quarter of this and lives six years longer. It is genuinely impressive how wrong you got this.",
    sources: [
      { label: "CMS National Health Expenditure Data", url: "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data" },
      { label: "NCHS Data Brief 548: Mortality in the United States, 2024", url: "https://www.cdc.gov/nchs/products/databriefs/db548.htm" },
    ],
  },
  {
    agencyId: "ice",
    agencyName: "Immigration & Customs Enforcement + CBP",
    emoji: "🚧",
    countryCode: "US",
    mission: "Protect national security and public safety through immigration enforcement",
    spendingLabel: "CBP + ICE total budget authority, enacted (nominal USD, fiscal year)",
    spendingTimeSeries: [
      // DHS Budget-in-Brief "Total Budget Authority", from the edition two years later.
      // ICE totals for 2003–2009 include the Federal Protective Service.
      ...sourced("https://www.dhs.gov/sites/default/files/publications/FY_2005_BIB_4.pdf", [[2003, 9.15e9]]),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/Budget_BIB-FY2007.pdf", [[2005, 10.04e9]]),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/budget_bib-fy2009.pdf", [[2007, 14.23e9]]),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/budget_bib_fy2011.pdf", [[2009, 18.04e9]]),
      ...sourced(
        "https://appropriations.house.gov/sites/evo-subsites/republicans-appropriations.house.gov/files/migrated/UploadedFiles/FY2012HomelandSecurityProgramTable51311MarkUp.pdf",
        [[2011, 17.13e9]],
      ),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/FY15BIB_0.pdf", [[2013, 17.37e9]]),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/FY2017_BIB-MASTER.pdf", [[2015, 19.00e9]]),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/DHS%20BIB%202019.pdf", [[2017, 21.21e9]]),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/fy_2021_dhs_bib_0.pdf", [[2019, 25.16e9]]),
      ...sourced(
        "https://www.dhs.gov/sites/default/files/2026-09/26_0901_ocfo_fy23-budget-dhs-budget-in-brief.pdf",
        [[2021, 24.70e9]],
      ),
      ...sourced(
        "https://www.dhs.gov/sites/default/files/2026-09/26_0901_ocfo_fy25-budget-dhs-budget-in-brief.pdf",
        [[2023, 30.11e9]],
      ),
    ],
    outcomes: [
      {
        label: "U.S. Border Patrol nationwide encounters, fiscal year (Title 8 apprehensions; from March 2020 also Title 42 expulsions)",
        emoji: "🚶",
        direction: "lower_is_better",
        color: "pink",
        data: [
          ...sourced(
            "https://www.cbp.gov/sites/default/files/assets/documents/2021-Aug/U.S.%20Border%20Patrol%20Total%20Apprehensions%20(FY%201925%20-%20FY%202020)%20(508).pdf",
            [
              [2003, 931557], [2005, 1189075], [2007, 876704], [2009, 556041], [2011, 340252], [2013, 420789],
              [2015, 337117], [2017, 310531], [2019, 859501],
            ],
          ),
          ...sourced("https://www.cbp.gov/newsroom/stats/cbp-enforcement-statistics", [
            [2021, 1662167], [2023, 2063692],
          ]),
        ],
      },
    ],
    annotations: [
      { year: 2003, label: "DHS created — largest government reorganization since 1947. 22 agencies merged.", url: "https://www.dhs.gov/creation-department-homeland-security" },
      { year: 2006, label: "Secure Fence Act — $2.3B for 700 miles of border fencing", url: "https://www.congress.gov/bill/109th-congress/house-bill/6061" },
      { year: 2017, label: "Family separation policy ('zero tolerance') — 5,500+ children separated from parents", url: "https://www.gao.gov/products/gao-20-245" },
      { year: 2019, label: "Remain in Mexico policy — asylum seekers forced to wait in dangerous border cities", url: "https://www.dhs.gov/news/2019/01/24/migrant-protection-protocols" },
    ],
    gradeRationale:
      "Budget more than tripled, from $9.1B (FY2003) to $30.1B (FY2023), while Border Patrol encounters rose 122%. More money, more encounters.",
    wishoniaQuote:
      "You tripled the immigration enforcement budget and Border Patrol encounters more than doubled. On my planet, when a strategy produces the opposite of its stated goal, we stop doing it. Here you triple down.",
    sources: [
      { label: "DHS Budget-in-Brief (all years)", url: "https://www.dhs.gov/dhs-budget" },
      { label: "CBP Enforcement Statistics", url: "https://www.cbp.gov/newsroom/stats/cbp-enforcement-statistics" },
    ],
  },
  {
    agencyId: "bop",
    agencyName: "Bureau of Prisons (DOJ)",
    emoji: "⛓️",
    countryCode: "US",
    mission: "Protect public safety through correctional management",
    spendingLabel:
      "BOP enacted appropriations, Salaries & Expenses + Buildings & Facilities (nominal USD, fiscal year; includes supplementals)",
    spendingTimeSeries: [
      ...sourced("https://www.justice.gov/archive/jmd/1975_2002/2002/html/page109-112.htm", [[2000, 3.67e9]]),
      ...sourced("https://www.justice.gov/archive/jmd/2005summary/html/p134-140.htm", [[2004, 4.81e9]]),
      ...sourced("https://www.justice.gov/jmd/2010summary/pdf/bop-bud-summary.pdf", [[2008, 5.72e9]]),
      ...sourced(
        "https://www.justice.gov/sites/default/files/jmd/legacy/2013/09/25/fy12-bop-bud-summary.pdf",
        [[2010, 6.21e9]],
      ),
      ...sourced(
        "https://www.justice.gov/sites/default/files/jmd/legacy/2014/02/02/fy13-bop-bud-summary.pdf",
        [[2012, 6.64e9]],
      ),
      ...sourced("https://justice.gov/jmd/file/822106/dl?inline=", [[2014, 6.86e9], [2016, 7.48e9]]),
      ...sourced(
        "https://www.justice.gov/d9/pages/attachments/2019/03/11/29_bs_section_ii_chapter_-_bop.pdf",
        [[2018, 7.28e9]],
      ),
      ...sourced(
        "https://www.justice.gov/d9/pages/attachments/2020/02/09/bs_section_ii_chapter_-_bop_-_final_02.07.20.pdf",
        [[2020, 7.78e9]],
      ),
      ...sourced("https://www.govinfo.gov/content/pkg/BUDGET-2024-APP/pdf/BUDGET-2024-APP-1-14.pdf", [[2022, 8.10e9]]),
      ...sourced("https://www.justice.gov/media/1403736/dl", [[2024, 8.57e9]]),
    ],
    outcomes: [
      {
        label: "Federal prison population under BOP jurisdiction, end of fiscal year",
        emoji: "🏢",
        direction: "lower_is_better",
        color: "pink",
        data: sourced("https://www.bop.gov/about/statistics/raw_stats/BOP_pastPopulationTotals.csv", [
          [2000, 145125], [2004, 179895], [2008, 201668], [2010, 210227], [2012, 218687], [2014, 214149],
          [2016, 192170], [2018, 181698], [2020, 155562], [2022, 159090], [2024, 158864],
        ]),
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
    gradeRationale:
      "Budget rose 134% (FY2000 $3.67B → FY2024 $8.57B, nominal) while the federal prison population rose 51% to a FY2013 peak of 219,298, then fell 28% to 158,864 by FY2024. Nearly half (49.3%) of federal offenders released in 2010 were rearrested within eight years.",
    wishoniaQuote:
      "Eight point six billion dollars a year to warehouse people at forty-seven thousand dollars per prisoner. Rearrested within eight years: forty-nine percent. You are running the most expensive failure factory in human history.",
    sources: [
      { label: "BOP population totals", url: "https://www.bop.gov/about/statistics/raw_stats/BOP_pastPopulationTotals.csv" },
      { label: "US Sentencing Commission: recidivism of federal offenders released in 2010", url: "https://www.ussc.gov/research/research-reports/recidivism-federal-offenders-released-2010" },
      { label: "Federal Register: BOP cost of incarceration fee, FY2024", url: "https://public-inspection.federalregister.gov/2025-22777.pdf" },
    ],
  },
  {
    agencyId: "epa",
    agencyName: "Environmental Protection Agency",
    emoji: "🌱",
    countryCode: "US",
    mission: "Protect human health and the environment",
    spendingLabel:
      "EPA enacted budget authority (nominal USD, fiscal year; excludes Recovery Act, Infrastructure Act, and Inflation Reduction Act funds)",
    spendingTimeSeries: sourced("https://www.epa.gov/planandbudget/budget", [
      [2000, 7.56e9], [2004, 8.37e9], [2008, 7.47e9], [2010, 10.30e9], [2012, 8.45e9], [2014, 8.20e9],
      [2016, 8.14e9], [2018, 8.82e9], [2020, 9.06e9], [2022, 9.56e9], [2024, 9.16e9],
    ]),
    outcomes: [
      {
        label:
          "Unhealthy air days: total days at 'Unhealthy for Sensitive Groups' or worse (ozone and PM2.5), summed across 35 major U.S. cities",
        emoji: "💨",
        direction: "lower_is_better",
        color: "pink",
        data: [
          ...sourced("https://gispub.epa.gov/air/trendsreport/2025/", [[2000, 2080]]),
          // Middle years are the bar labels on the same report's chart image.
          ...sourced(
            "https://raw.githubusercontent.com/USEPA/Air-Trends-Report/master/etrends_2025/img/NowCastQlikTool.png",
            [[2004, 1400], [2008, 1196], [2010, 1116], [2012, 1297], [2014, 598], [2016, 700], [2018, 790], [2020, 772], [2022, 629]],
          ),
          ...sourced("https://gispub.epa.gov/air/trendsreport/2025/", [[2024, 757]]),
        ],
      },
    ],
    annotations: [
      { year: 1963, label: "Clean Air Act passed — 7 years BEFORE EPA existed", url: "https://www.epa.gov/clean-air-act-overview/evolution-clean-air-act" },
      { year: 1970, label: "EPA created by executive order. Cuyahoga River fire (1969) was the catalyst.", url: "https://www.epa.gov/history" },
      { year: 1990, label: "Clean Air Act amendments — cap-and-trade for SO2. Actually worked.", url: "https://www.epa.gov/acidrain/acid-rain-program" },
      { year: 2007, label: "Massachusetts v. EPA — Supreme Court rules CO2 is a pollutant. EPA starts regulating.", url: "https://www.supremecourt.gov/opinions/06pdf/05-1120.pdf" },
    ],
    gradeRationale:
      "Unhealthy air days in 35 major U.S. cities fell 64% from 2000 to 2024 (2,080 to 757), while EPA's enacted budget rose 21% in nominal dollars ($7.56B to $9.16B). One of the few agencies whose target metric has clearly improved.",
    wishoniaQuote:
      "The EPA is the one agency on this list where the numbers actually go in the right direction. Air quality improved. Budget was reasonable. On my planet, we call this competence. Here it seems to be an anomaly.",
    sources: [
      { label: "EPA Budget and Workforce History", url: "https://www.epa.gov/planandbudget/budget" },
      { label: "EPA Our Nation's Air: Trends Through 2024", url: "https://gispub.epa.gov/air/trendsreport/2025/" },
    ],
  },
  {
    agencyId: "fbi",
    agencyName: "Federal Bureau of Investigation",
    emoji: "🔍",
    countryCode: "US",
    mission: "Protect the American people and uphold the Constitution",
    spendingLabel: "FBI enacted discretionary budget authority, Salaries & Expenses + Construction (nominal USD, fiscal year)",
    spendingTimeSeries: [
      ...sourced("https://www.justice.gov/archive/jmd/2002summary/pdf/sum_of_budget_authority.pdf", [[2000, 3.05e9]]),
      ...sourced(
        "https://www.justice.gov/archive/jmd/2003summary/pdf/2003%20SUMMARY%20BY%20%20APPROP%20%2001-31-02%20FINAL.pdf",
        [[2002, 3.52e9]],
      ),
      ...sourced("https://www.justice.gov/archive/jmd/2005summary/html/p112-120.htm", [[2004, 4.53e9]]),
      ...sourced("https://www.justice.gov/archive/jmd/2007summary/html/35_108-113fbi.htm", [[2006, 5.71e9]]),
      ...sourced("https://www.justice.gov/jmd/2010summary/pdf/summary-bud-authority.pdf", [[2008, 6.66e9]]),
      ...sourced(
        "https://www.justice.gov/sites/default/files/jmd/legacy/2014/04/21/budget-authority-appropriation.pdf",
        [[2010, 7.85e9]],
      ),
      ...sourced(
        "https://www.justice.gov/sites/default/files/jmd/legacy/2014/05/31/budget-authority-appropriation.pdf",
        [[2012, 8.12e9]],
      ),
      ...sourced(
        "https://www.justice.gov/sites/default/files/jmd/pages/attachments/2015/01/30/1_summary_of_budget_authority_by_appr.pdf",
        [[2014, 8.34e9]],
      ),
      ...sourced("https://justice.gov/jmd/file/821931/dl?inline=", [[2016, 8.72e9]]),
      ...sourced("https://justice.gov/jmd/page/file/1142461/dl?inline=", [[2018, 9.27e9]]),
      ...sourced("https://www.justice.gov/doj/page/file/1246636/download", [[2020, 9.88e9]]),
      ...sourced("https://www.everycrsreport.com/reports/R47157.html", [[2022, 10.77e9]]),
      ...sourced("https://www.justice.gov/media/1403736/dl", [[2024, 10.31e9]]),
    ],
    outcomes: [
      {
        label: "Murder clearance rate (% cleared by arrest or exceptional means)",
        emoji: "🔍",
        direction: "higher_is_better",
        color: "pink",
        data: [
          ...sourced("https://ucr.fbi.gov/crime-in-the-u.s/2000/00sec3.pdf", [[2000, 63.1]]),
          ...sourced("https://ucr.fbi.gov/crime-in-the-u.s/2002/02sec3.pdf", [[2002, 64.0]]),
          ...sourced("https://www2.fbi.gov/ucr/cius_04/documents/CIUS2004.pdf", [[2004, 62.6]]),
          ...sourced("https://www2.fbi.gov/ucr/cius2006/data/documents/06tbl25.xls", [[2006, 60.7]]),
          ...sourced("https://www2.fbi.gov/ucr/cius2008/data/documents/08tbl25.xls", [[2008, 63.6]]),
          ...sourced(
            "https://ucr.fbi.gov/crime-in-the-u.s/2010/crime-in-the-u.s.-2010/tables/10tbl25.xls",
            [[2010, 64.8]],
          ),
          ...sourced(
            "https://ucr.fbi.gov/crime-in-the-u.s/2012/crime-in-the-u.s.-2012/tables/25tabledatadecoverviewpdfs/table_25_percent_of_offenses_cleared_by_arrest_or_exceptional_means_by_population_group_2012.xls",
            [[2012, 62.5]],
          ),
          ...sourced(
            "https://ucr.fbi.gov/crime-in-the-u.s/2014/crime-in-the-u.s.-2014/tables/table-25/table-25.xls",
            [[2014, 64.5]],
          ),
          ...sourced(
            "https://ucr.fbi.gov/crime-in-the-u.s/2016/crime-in-the-u.s.-2016/topic-pages/clearances.pdf",
            [[2016, 59.4]],
          ),
          ...sourced(
            "https://ucr.fbi.gov/crime-in-the-u.s/2018/crime-in-the-u.s.-2018/tables/table-25/table-25.xls",
            [[2018, 62.3]],
          ),
          // No FBI Table 25 for 2020 was reachable; Pew reports the FBI figure.
          ...sourced(
            "https://www.pewresearch.org/short-reads/2021/10/27/what-we-know-about-the-increase-in-u-s-murders-in-2020/",
            [[2020, 54]],
          ),
          ...sourced("https://www.justfacts.com/document/crime_united_states_2022_fbi.pdf", [[2022, 52.3]]),
          ...sourced(
            "https://cde.ucr.cjis.gov/LATEST/resources/reports/Reported%20Crimes%20in%20the%20Nation%20Quick%20Stats.pdf",
            [[2024, 61.4]],
          ),
        ],
      },
      {
        label: "Violent crime rate per 100K (FBI CIUS 2024 estimates)",
        emoji: "🔪",
        direction: "lower_is_better",
        color: "yellow",
        data: [
          ...sourced("https://www.justfacts.com/document/crime_united_states_2024_fbi_full.pdf", [
            [2005, 487.6], [2008, 456.2], [2012, 387.3], [2016, 397.8], [2020, 392.3],
          ]),
          ...sourced(
            "https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf",
            [[2024, 359.1]],
          ),
        ],
      },
    ],
    annotations: [
      { year: 2001, label: "FBI pivots from crime-fighting to counterterrorism — 2,000+ agents reassigned from criminal to CT", url: "https://www.justice.gov/jmd/budget-factsheet" },
      { year: 2004, label: "9/11 Commission finds FBI missed 10+ pre-attack warnings due to bureaucratic failures", url: "https://www.9-11commission.gov/report/911Report.pdf" },
      { year: 2013, label: "Boston Marathon bombing — FBI had been warned about Tsarnaevs by Russia, didn't follow up", url: "https://oig.justice.gov/reports/2014/s1404.pdf" },
      { year: 2016, label: "FBI director reopens presidential candidate email probe 11 days before election", url: "https://oig.justice.gov/reports/review-various-actions-federal-bureau-investigation-and-department-justice-advance-2016" },
    ],
    gradeRationale:
      "Budget more than tripled ($3.0B → $10.3B, FY2000–FY2024) while the murder clearance rate averaged 56% in 2020–2024, down from 63% in 2000–2004. It fell to 52% in 2022 and recovered to 61% in 2024; about four in ten murders still go unsolved.",
    wishoniaQuote:
      "Ten billion dollars a year and four in ten of your murders still go unsolved. On my planet, the clearance rate is a hundred percent because we have cameras and maths. You have both. You just use them to surveil journalists instead.",
    sources: [
      { label: "DOJ Budget and Performance Summaries", url: "https://www.justice.gov/jmd/budget-summaries-by-year" },
      { label: "FBI Crime Data Explorer", url: "https://cde.ucr.cjis.gov/" },
    ],
  },
  {
    agencyId: "cyber",
    agencyName: "Cybersecurity and Infrastructure Security Agency",
    emoji: "🛡️",
    countryCode: "US",
    mission: "Protect the nation from cyber-based threats",
    spendingLabel: "CISA enacted net discretionary budget authority (FY2015–FY2018: predecessor NPPD; nominal USD)",
    spendingTimeSeries: [
      // No official source gives the FBI's cyber budget by year, so this series is CISA alone.
      ...sourced("https://www.dhs.gov/sites/default/files/publications/FY2017_BIB-MASTER.pdf", [
        [2015, 1.53e9], [2016, 1.64e9],
      ]),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/DHS%20BIB%202019.pdf", [[2017, 1.82e9]]),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/fy_2020_dhs_bib.pdf", [[2018, 1.91e9]]),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/fy_2021_dhs_bib_0.pdf", [[2019, 1.68e9]]),
      ...sourced(
        "https://www.dhs.gov/sites/default/files/2026-09/26_0901_ocfo_fy22-budget-dhs-budget-in-brief.pdf",
        [[2020, 2.02e9], [2021, 2.02e9]],
      ),
      ...sourced(
        "https://www.dhs.gov/sites/default/files/2026-09/26_0901_ocfo_fy24-budget-dhs-budget-in-brief.pdf",
        [[2022, 2.59e9], [2023, 2.91e9]],
      ),
      ...sourced(
        "https://www.dhs.gov/sites/default/files/2025-07/2025_07_03_ocfo_fy-2026-budget-in-brief.pdf",
        [[2024, 2.87e9]],
      ),
    ],
    outcomes: [
      {
        label: "IC3 reported cybercrime losses (USD, calendar year, self-reported)",
        emoji: "💸",
        direction: "lower_is_better",
        color: "pink",
        data: [
          ...sourced("https://www.ic3.gov/AnnualReport/Reports/2018_IC3Report.pdf", [
            [2015, 1.1e9], [2016, 1.5e9], [2017, 1.4e9], [2018, 2.7e9],
          ]),
          ...sourced("https://www.ic3.gov/AnnualReport/Reports/2019_IC3Report.pdf", [[2019, 3.5e9]]),
          ...sourced("https://www.ic3.gov/AnnualReport/Reports/2023_IC3Report.pdf", [[2020, 4.2e9]]),
          ...sourced("https://www.ic3.gov/AnnualReport/Reports/2021_IC3Report.pdf", [[2021, 6.9e9]]),
          ...sourced("https://www.ic3.gov/AnnualReport/Reports/2023_IC3Report.pdf", [[2022, 10.3e9], [2023, 12.5e9]]),
          ...sourced("https://www.ic3.gov/AnnualReport/Reports/2024_IC3Report.pdf", [[2024, 16.6e9]]),
        ],
      },
      {
        label: "IC3 reported cybercrime complaints",
        emoji: "📝",
        direction: "lower_is_better",
        color: "yellow",
        data: [
          ...sourced("https://www.ic3.gov/AnnualReport/Reports/2019_IC3Report.pdf", [
            [2015, 288012], [2016, 298728], [2017, 301580], [2018, 351937], [2019, 467361],
          ]),
          ...sourced("https://www.ic3.gov/AnnualReport/Reports/2023_IC3Report.pdf", [[2020, 791790]]),
          ...sourced("https://www.ic3.gov/AnnualReport/Reports/2021_IC3Report.pdf", [[2021, 847376]]),
          ...sourced("https://www.ic3.gov/AnnualReport/Reports/2023_IC3Report.pdf", [[2022, 800944], [2023, 880418]]),
          ...sourced("https://www.ic3.gov/AnnualReport/Reports/2024_IC3Report.pdf", [[2024, 859532]]),
        ],
      },
    ],
    annotations: [
      { year: 2017, label: "Equifax breach — 147M Americans' data stolen. $700M settlement, no one jailed.", url: "https://www.ftc.gov/enforcement/refunds/equifax-data-breach-settlement" },
      { year: 2018, label: "CISA established within DHS", url: "https://www.cisa.gov/about" },
      { year: 2020, label: "SolarWinds hack — Russian intelligence inside US government networks for 9 months undetected", url: "https://www.cisa.gov/news-events/directives/emergency-directive-21-01" },
      { year: 2021, label: "Colonial Pipeline ransomware — gas shortages across East Coast. $4.4M ransom paid.", url: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-131a" },
    ],
    gradeRationale:
      "CISA's budget (NPPD before FY2019) grew 87% ($1.53B → $2.87B) while reported cybercrime losses exploded 1,409% ($1.1B → $16.6B). Complaints nearly tripled. Reported losses grew about 16x faster than the cyber-defense budget.",
    wishoniaQuote:
      "Nearly three billion dollars a year for CISA and cybercrime losses went from one billion to sixteen and a half billion. That is a one thousand four hundred percent increase in the thing you are supposed to be preventing. On my planet, we would fire the firewall.",
    sources: [
      { label: "FBI IC3 Annual Reports", url: "https://www.ic3.gov/annualreport/reports" },
      { label: "DHS Budget-in-Brief (all years)", url: "https://www.dhs.gov/dhs-budget" },
    ],
  },
  {
    agencyId: "va",
    agencyName: "Department of Veterans Affairs",
    emoji: "🎖️",
    countryCode: "US",
    mission: "Fulfill Lincoln's promise — to care for those who have served",
    spendingLabel: "VA budget authority (OMB Historical Table 5.2; nominal USD, fiscal year)",
    spendingTimeSeries: sourced(OMB_TABLE_5_2, [
      [2000, 45.5e9], [2002, 51.9e9], [2004, 60.3e9], [2006, 70.9e9], [2008, 88.4e9], [2010, 124.3e9],
      [2012, 124.0e9], [2014, 165.7e9], [2016, 163.3e9], [2018, 191.8e9], [2020, 233.3e9], [2022, 269.5e9],
      [2024, 325.3e9],
    ]),
    outcomes: [
      {
        label: "Veteran suicides per year (VA 2025 National Veteran Suicide Prevention Annual Report, calendar year)",
        emoji: "💔",
        direction: "lower_is_better",
        color: "pink",
        data: sourced(
          "https://www.mentalhealth.va.gov/MENTALHEALTH/docs/data-sheets/2025/National_Suicide_Data_Appendix_2021-2023_508.xlsx",
          [
            [2005, 6149], [2008, 6579], [2010, 6561], [2012, 6453], [2014, 6667], [2016, 6491], [2018, 6738],
            [2020, 6347], [2022, 6442], [2023, 6398],
          ],
        ),
      },
    ],
    annotations: [
      { year: 2007, label: "Walter Reed neglect scandal — moldy walls, cockroaches in wounded warrior housing", url: "https://www.gao.gov/products/gao-07-587t" },
      { year: 2014, label: "VA wait-time scandal — 40+ veterans die waiting for appointments. Phoenix VA falsified records.", url: "https://www.va.gov/oig/pubs/VAOIG-14-02603-267.pdf" },
      { year: 2017, label: "VA still can't deploy a working electronic health records system after $16B spent", url: "https://www.gao.gov/products/gao-22-105065" },
      { year: 2022, label: "PACT Act signed — toxic exposure benefits for ~3.5M veterans. Budget: $270B in FY2022, $325B by FY2024.", url: "https://www.congress.gov/bill/117th-congress/senate-bill/3373" },
    ],
    gradeRationale:
      "Budget authority rose 616% ($45B in FY2000 → $325B in FY2024) while veteran suicides stayed roughly flat at ~6,100–6,700/year (6,149 in 2005; 6,398 in 2023). The money grew but the deaths didn't shrink.",
    wishoniaQuote:
      "Three hundred and twenty-five billion dollars a year and you cannot stop more than six thousand veterans a year from killing themselves. On my planet, we would consider this a moral emergency. Here it appears to be a line item.",
    sources: [
      { label: "OMB Historical Table 5.2 (budget authority by agency)", url: OMB_TABLE_5_2 },
      { label: "VA National Veteran Suicide Prevention Annual Report", url: "https://www.mentalhealth.va.gov/suicide_prevention/data.asp" },
    ],
  },
  {
    agencyId: "tsa",
    agencyName: "Transportation Security Administration",
    emoji: "✈️",
    countryCode: "US",
    mission: "Protect the nation's transportation systems",
    spendingLabel: "TSA total budget authority, enacted (nominal USD, fiscal year; excludes supplementals)",
    spendingTimeSeries: [
      ...sourced("https://www.dhs.gov/sites/default/files/publications/FY_2004_BUDGET_IN_BRIEF.pdf", [[2002, 1.24e9]]),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/Budget_BIB-FY2006.pdf", [[2004, 4.58e9]]),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/budget_bib-fy2008.pdf", [[2006, 6.17e9]]),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/budget_bib_fy2010.pdf", [[2008, 6.81e9]]),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/budget-bib-fy2012.pdf", [[2010, 7.66e9]]),
      ...sourced(
        "https://www.dhs.gov/sites/default/files/publications/FY%202014%20BIB%20-%20FINAL%20-508%20Formatted%20%284%29.pdf",
        [[2012, 7.86e9]],
      ),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/FY_2016_DHS_Budget_in_Brief.pdf", [[2014, 7.42e9]]),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/DHS%20FY18%20BIB%20Final.pdf", [[2016, 7.54e9]]),
      ...sourced("https://www.dhs.gov/sites/default/files/publications/fy_2020_dhs_bib.pdf", [[2018, 7.89e9]]),
      ...sourced(
        "https://www.dhs.gov/sites/default/files/2026-09/26_0901_ocfo_fy22-budget-dhs-budget-in-brief.pdf",
        [[2020, 8.30e9]],
      ),
      ...sourced(
        "https://www.dhs.gov/sites/default/files/2026-09/26_0901_ocfo_fy24-budget-dhs-budget-in-brief.pdf",
        [[2022, 9.00e9]],
      ),
      ...sourced(
        "https://www.dhs.gov/sites/default/files/2025-07/2025_07_03_ocfo_fy-2026-budget-in-brief.pdf",
        [[2024, 10.93e9]],
      ),
    ],
    outcomes: [
      {
        // No official source counts terrorist attacks on US transportation by
        // year, so the checkpoint firearm count is the graded outcome.
        label: "Firearms discovered in carry-on bags at TSA checkpoints (calendar year)",
        emoji: "🔫",
        direction: "lower_is_better",
        color: "pink",
        data: [
          ...sourced("https://tsa.gov/sites/default/files/tsa-firearms_discovered_cy2022.pdf", [
            [2010, 1123], [2012, 1556], [2014, 2212], [2016, 3391], [2018, 4244], [2020, 3257], [2022, 6542],
          ]),
          ...sourced(
            "https://www.tsa.gov/news/press/releases/2025/01/15/tsa-intercepts-6678-firearms-airport-security-checkpoints-2024",
            [[2024, 6678]],
          ),
        ],
      },
    ],
    annotations: [
      { year: 2001, label: "9/11 attacks — TSA created within 2 months. 65,000 employees hired in one year.", url: "https://www.congress.gov/bill/107th-congress/senate-bill/1447" },
      { year: 2006, label: "Liquid bomb plot (UK) — TSA bans liquids >3.4oz. Still banned 18 years later.", url: "https://www.tsa.gov/travel/security-screening/liquids-rule" },
      { year: 2010, label: "Underwear bomber — $1B spent on full-body scanners. GAO finds 'limited evidence of effectiveness.'", url: "https://www.gao.gov/products/gao-10-128" },
      { year: 2015, label: "DHS Red Team gets 67 of 70 weapons through TSA checkpoints undetected (95% failure rate)", url: "https://abcnews.go.com/US/exclusive-undercover-dhs-tests-find-widespread-security-failures/story?id=31434881" },
    ],
    gradeRationale:
      "Graded on checkpoint firearm discoveries, which rose sixfold (1,123 in 2010 → 6,678 in 2024) while the budget went from $1.2B (FY2002) to $10.9B (FY2024). The count tracks how many passengers carry guns as much as how well TSA screens. DHS Inspector General covert tests in 2015 got simulated weapons and explosives past checkpoints in 67 of 70 attempts (95%).",
    wishoniaQuote:
      "Eleven billion dollars a year to take your shoes off. The Homeland Security Inspector General sent undercover testers through checkpoints, and 67 of 70 got fake weapons and explosives past screeners. On my planet, we would call this an extremely expensive placebo.",
    sources: [
      { label: "DHS Budget-in-Brief (all years)", url: "https://www.dhs.gov/dhs-budget" },
      { label: "TSA firearm discoveries, 2010–2022", url: "https://tsa.gov/sites/default/files/tsa-firearms_discovered_cy2022.pdf" },
      { label: "DHS OIG covert testing of passenger screening (OIG-15-150)", url: "https://www.oig.dhs.gov/reports/2015-09/covert-testing-tsas-passenger-screening-technologies-and-processes-airport-security" },
    ],
  },
  {
    agencyId: "usda",
    agencyName: "USDA (Farm Subsidies)",
    emoji: "🌾",
    countryCode: "US",
    mission: "Provide leadership on food, agriculture, and natural resources",
    spendingLabel:
      "Direct government farm program payments (USDA ERS, calendar year, nominal USD; excludes crop insurance premium subsidies)",
    spendingTimeSeries: [
      ...sourced("https://www.ers.usda.gov/media/29517/september-3-2026-release.zip", [
        [2000, 23.2e9], [2002, 12.4e9], [2004, 13.0e9], [2006, 15.8e9], [2008, 12.2e9], [2010, 12.4e9],
        [2012, 10.6e9], [2014, 9.8e9], [2016, 13.0e9], [2018, 13.7e9],
      ]),
      { year: 2020, value: 45.6e9, annotation: "COVID farm relief", sourceUrl: "https://www.ers.usda.gov/media/29517/september-3-2026-release.zip" },
      ...sourced("https://www.ers.usda.gov/media/29517/september-3-2026-release.zip", [[2022, 15.6e9], [2024, 10.1e9]]),
    ],
    outcomes: [
      {
        label: "Number of US farms (thousands; NASS, 2007+ reflects improved Census coverage)",
        emoji: "🚜",
        direction: "higher_is_better",
        color: "pink",
        data: [
          ...sourced(
            "https://esmis.nal.usda.gov/sites/default/release-files/5712m6524/tb09j8447/j098zd55g/FarmLandIn-02-11-2011_revision.txt",
            [[2000, 2167]],
          ),
          ...sourced(
            "https://esmis.nal.usda.gov/sites/default/release-files/5712m6524/fq977x84m/vh53wz30t/FarmLandIn-05-28-2014.txt",
            [[2004, 2113], [2008, 2184.5]],
          ),
          ...sourced(
            "https://esmis.nal.usda.gov/sites/default/release-files/5712m6524/j098zk725/3t945z95f/fnlo0419.txt",
            [[2012, 2110], [2016, 2055]],
          ),
          ...sourced("https://esmis.nal.usda.gov/sites/default/release-files/795776/fnlo0226.txt", [
            [2020, 1992], [2024, 1880],
          ]),
        ],
      },
      {
        label: "CPI-U Food, U.S. city average, annual average (2000=100)",
        emoji: "🛒",
        direction: "lower_is_better",
        color: "yellow",
        data: sourced("https://data.bls.gov/timeseries/CUUR0000SAF1", [
          [2000, 100], [2004, 111.0], [2008, 127.6], [2012, 139.3], [2016, 147.8], [2020, 159.2], [2024, 196.8],
        ]),
      },
    ],
    annotations: [
      { year: 1933, label: "AAA created — first federal farm subsidies. Government pays farmers to destroy crops during Great Depression.", url: "https://www.ers.usda.gov/topics/farm-economy/farm-commodity-policy/" },
      { year: 1996, label: "Freedom to Farm Act — supposed to phase out subsidies. Instead, emergency payments replace them.", url: "https://www.congress.gov/bill/104th-congress/house-bill/2854" },
      { year: 2014, label: "Farm Bill replaces direct payments with crop insurance subsidies — 78% goes to top 10% of farms", url: "https://www.congress.gov/bill/113th-congress/house-bill/2642" },
      { year: 2020, label: "$46B in COVID farm relief — more than double the normal subsidy budget in a single year", url: "https://www.ers.usda.gov/topics/farm-economy/farm-sector-income-finances/government-payments-the-safety-net/" },
    ],
    gradeRationale:
      "About $400 billion in direct farm payments from 2000 to 2024 (USDA ERS) while the number of farms fell 13% and food prices rose 97%. Subsidies flow to megafarms while small farms die.",
    wishoniaQuote:
      "You pay farmers to grow corn nobody needs, while small farmers go bankrupt and food prices rise. The top ten percent of farms receive seventy-eight percent of subsidy payments. On my planet, we call that a wealth transfer with extra steps.",
    sources: [
      { label: "USDA ERS government payments by program", url: "https://www.ers.usda.gov/data-products/farm-income-and-wealth-statistics/government-payments-by-program" },
      { label: "NASS Farms and Land in Farms", url: "https://esmis.nal.usda.gov/publication/farms-and-land-farms" },
      { label: "BLS CPI-U Food", url: "https://data.bls.gov/timeseries/CUUR0000SAF1" },
    ],
  },
  {
    agencyId: "hud",
    agencyName: "Department of Housing and Urban Development",
    emoji: "🏠",
    countryCode: "US",
    mission: "Create strong, sustainable, inclusive communities",
    spendingLabel: "HUD discretionary budget authority (OMB Historical Table 5.4, fiscal year, nominal USD)",
    spendingTimeSeries: sourced(OMB_TABLE_5_4, [
      [2000, 21.1e9], [2004, 32.0e9], [2008, 47.1e9], [2010, 42.9e9], [2012, 36.4e9], [2014, 34.2e9],
      [2016, 36.5e9], [2018, 71.4e9], [2020, 58.8e9], [2022, 59.7e9], [2024, 70.4e9],
    ]),
    outcomes: [
      {
        label: "People experiencing homelessness on one January night (HUD PIT count)",
        emoji: "🏕️",
        direction: "lower_is_better",
        color: "pink",
        data: [
          ...sourced("https://www.huduser.gov/portal/sites/default/files/pdf/2024-AHAR-Part-1.pdf", [
            [2007, 647258], [2009, 630227], [2011, 623788], [2013, 590364], [2015, 564708], [2017, 550996],
            [2019, 567715], [2020, 580466], [2022, 582462], [2023, 653104], [2024, 771480],
          ]),
          ...sourced("https://www.huduser.gov/portal/sites/default/files/pdf/2025-AHAR-Part-1.pdf", [[2025, 745652]]),
        ],
      },
    ],
    annotations: [
      { year: 1965, label: "HUD created", url: "https://www.hud.gov/about/hud_history" },
      { year: 1974, label: "Section 8 housing vouchers created — waitlists eventually reach 2+ years in most cities", url: "https://www.hud.gov/topics/housing_choice_voucher_program_section_8" },
      { year: 2008, label: "Subprime collapse — 10M foreclosures. HUD had promoted the lending policies that caused it.", url: "https://www.gao.gov/products/gao-09-782t" },
      { year: 2017, label: "HUD Secretary appointed with zero housing policy experience", url: "https://www.hud.gov/about/leadership" },
    ],
    gradeRationale:
      "HUD's discretionary budget authority rose from $21.1B (FY2000) to $70.4B (FY2024), up 234%. Homelessness fell about 15% from 2007 to its 2016 low, then reversed. The 2024 count (771,480) is the highest ever recorded; 2025 was 745,652.",
    wishoniaQuote:
      "Seventy billion dollars a year, and the homeless count hit a record 771,480 in 2024. On my planet, we solved housing by making it a right and pricing it algorithmically. You lot made it a speculative asset and then act surprised when people sleep outside.",
    sources: [
      { label: "OMB Historical Table 5.4 (discretionary budget authority by agency)", url: OMB_TABLE_5_4 },
      { label: "HUD Annual Homeless Assessment Report (AHAR)", url: "https://www.huduser.gov/portal/sites/default/files/pdf/2025-AHAR-Part-1.pdf" },
    ],
  },
  {
    agencyId: "state",
    agencyName: "State Department (Sanctions Regime)",
    emoji: "🌐",
    countryCode: "US",
    mission: "Lead America's foreign policy through diplomacy and sanctions",
    spendingLabel:
      "State Department + International Assistance Programs discretionary budget authority (OMB Historical Table 5.4, FY, nominal USD)",
    spendingTimeSeries: sourced(OMB_TABLE_5_4, [
      [2000, 21.4e9], [2004, 28.2e9], [2008, 40.5e9], [2010, 54.2e9], [2012, 53.1e9], [2014, 49.2e9],
      [2016, 52.6e9], [2018, 53.3e9], [2020, 56.5e9], [2022, 84.1e9], [2024, 84.8e9],
    ]),
    outcomes: [
      {
        // Treasury labels only these two endpoints; no official yearly count
        // of sanctioned countries or sanctions deaths exists.
        label: "OFAC sanctions designations (net, cumulative; Treasury 2021 Sanctions Review)",
        emoji: "🚫",
        direction: "lower_is_better",
        color: "pink",
        data: sourced("https://home.treasury.gov/system/files/136/Treasury-2021-sanctions-review.pdf", [
          [2000, 912], [2021, 9421],
        ]),
      },
    ],
    annotations: [
      { year: 1990, label: "Iraq sanctions begin — asked in 1996 about a reported 500K child deaths, Madeleine Albright says 'the price is worth it'", url: "https://ofac.treasury.gov/sanctions-programs-and-information" },
      { year: 2003, label: "Libya sanctions lifted after Gaddafi denuclearizes — NATO bombs him 8 years later anyway", url: "https://ofac.treasury.gov/sanctions-programs-and-information" },
      { year: 2012, label: "Iran nuclear sanctions — medicine shortages kill unknown thousands of Iranian civilians", url: "https://ofac.treasury.gov/sanctions-programs-and-information" },
      { year: 2022, label: "Russia sanctions (Ukraine) — most sanctioned country in history. Ruble recovers within months.", url: "https://ofac.treasury.gov/sanctions-programs-and-information" },
    ],
    gradeRationale:
      "Not graded: Treasury publishes only two points for the sanctions list. OFAC's list grew from 912 designations in 2000 to 9,421 in 2021 (+933%) with no evidence of regime change. Sanctions punish populations, not leaders.",
    wishoniaQuote:
      "Your sanctions list grew tenfold in twenty years, and the regimes it targets are still there. When asked about the children who died under the Iraq sanctions, your Secretary of State said 'the price is worth it.' On my planet, that statement would be evidence in a tribunal.",
    sources: [
      { label: "OMB Historical Table 5.4 (discretionary budget authority by agency)", url: OMB_TABLE_5_4 },
      { label: "Treasury 2021 Sanctions Review", url: "https://home.treasury.gov/system/files/136/Treasury-2021-sanctions-review.pdf" },
      { label: "OFAC Sanctions Programs", url: "https://ofac.treasury.gov/sanctions-programs-and-information" },
    ],
  },
  {
    agencyId: "osha",
    agencyName: "Occupational Safety and Health Administration",
    emoji: "🦺",
    countryCode: "US",
    mission: "Ensure safe and healthful working conditions",
    spendingLabel: "OSHA enacted appropriation (DOL appropriation history, fiscal year, nominal USD)",
    spendingTimeSeries: [
      ...sourced("https://www.dol.gov/sites/dolgov/files/general/budget/2009/CBJ-2009-V2-08.pdf", [
        [2000, 381.6e6], [2004, 457.5e6],
      ]),
      ...sourced("https://www.dol.gov/sites/dolgov/files/general/budget/2018/CBJ-2018-V2-12.pdf", [
        [2008, 486.0e6], [2010, 558.6e6], [2012, 564.8e6], [2014, 552.2e6], [2016, 552.8e6],
      ]),
      ...sourced("https://www.dol.gov/sites/dolgov/files/general/budget/2026/CBJ-2026-V2-12.pdf", [
        [2018, 552.8e6], [2020, 581.8e6], [2022, 612.0e6], [2024, 632.3e6],
      ]),
    ],
    outcomes: [
      {
        label: "Fatal work injury rate (BLS CFOI; per 100,000 workers through 2007, per 100,000 full-time-equivalent workers from 2008)",
        emoji: "⚠️",
        direction: "lower_is_better",
        color: "pink",
        data: [
          ...sourced("https://www.bls.gov/news.release/History/cfoi_08172001.txt", [[2000, 4.3]]),
          ...sourced("https://www.bls.gov/news.release/History/cfoi_08252005.txt", [[2004, 4.1]]),
          ...[2008, 2010, 2012, 2014, 2016, 2018, 2020, 2022].map((year, index) => ({
            year,
            value: [3.7, 3.6, 3.4, 3.4, 3.6, 3.5, 3.4, 3.7][index]!,
            sourceUrl: `https://www.bls.gov/iif/fatal-injuries-tables/archive/fatal-occupational-injuries-hours-based-rates-${year}.xlsx`,
          })),
          ...sourced("https://www.bls.gov/news.release/cfoi.nr0.htm", [[2024, 3.3]]),
        ],
      },
    ],
    annotations: [
      { year: 1911, label: "Triangle Shirtwaist fire — 146 workers die. Leads to state labor laws (no federal agency yet).", url: "https://www.osha.gov/aboutosha/40-years/trianglefactoryfire" },
      { year: 1970, label: "OSHA created — workplace fatality rate had already dropped 70% since 1900 without a federal agency", url: "https://www.osha.gov/aboutosha" },
      { year: 2010, label: "Deepwater Horizon — 11 workers killed. OSHA had no jurisdiction (offshore = different agency).", url: "https://www.bls.gov/iif/oshcfoi1.htm" },
    ],
    gradeRationale:
      "Workplace fatality rate declined from 4.3 (2000) to 3.3 (2024) per 100,000 workers (a 23% drop; BLS changed its rate method in 2008) while OSHA's budget rose from $382M to $632M. However, the rate was already declining at the same pace before OSHA existed (from 61 per 100K in 1900 to 18 in 1970).",
    wishoniaQuote:
      "Workplace deaths were declining at the same rate before OSHA as after. The decline from sixty-one to eighteen deaths per hundred thousand happened without any federal safety agency. Technology, liability law, and worker self-interest did the work. OSHA just took credit.",
    sources: [
      { label: "BLS Census of Fatal Occupational Injuries", url: "https://www.bls.gov/iif/fatal-injuries-tables/archive.htm" },
      { label: "DOL Congressional Budget Justification (OSHA, FY2026)", url: "https://www.dol.gov/sites/dolgov/files/general/budget/2026/CBJ-2026-V2-12.pdf" },
    ],
  },
  {
    agencyId: "irs",
    agencyName: "Internal Revenue Service",
    emoji: "💸",
    countryCode: "US",
    mission: "Provide America's taxpayers top quality service by helping them understand and meet their tax responsibilities",
    spendingLabel:
      "IRS operating costs (IRS Data Book Table 6-2, fiscal year, nominal USD; includes Inflation Reduction Act costs from FY2023)",
    spendingTimeSeries: sourced("https://www.irs.gov/pub/irs-soi/25db-6-02-cs.xlsx", [
      [2000, 8.26e9], [2002, 9.06e9], [2004, 9.76e9], [2006, 10.61e9], [2008, 11.31e9], [2010, 12.35e9],
      [2012, 12.06e9], [2014, 11.59e9], [2016, 11.71e9], [2018, 11.75e9], [2020, 12.32e9], [2022, 14.27e9],
      [2024, 18.20e9],
    ]),
    outcomes: [
      {
        label:
          "Gross tax gap by tax year (USD billions; IRS latest estimate; multi-year periods plotted at the middle year as annual averages; TY2017+ are projections)",
        emoji: "🕳️",
        direction: "lower_is_better",
        color: "pink",
        data: [
          ...sourced("https://www.irs.gov/pub/irs-pdf/p1415.pdf", [[2001, 345]]),
          ...sourced("https://www.irs.gov/pub/irs-pdf/p5869.pdf", [
            [2006, 472], [2009, 394], [2012, 438], [2015, 496], [2018, 549], [2021, 708], [2022, 696],
          ]),
        ],
      },
      {
        label: "Individual returns examined in fiscal year ÷ returns filed the prior calendar year (%), IRS Data Book, FY2000–FY2018",
        emoji: "🔎",
        direction: "higher_is_better",
        color: "yellow",
        data: [
          ...sourced("https://www.irs.gov/pub/irs-soi/00databk.pdf", [[2000, 0.49]]),
          ...sourced("https://www.irs.gov/pub/irs-soi/04databk.pdf", [[2004, 0.77]]),
          ...sourced("https://www.irs.gov/pub/irs-soi/08databkrevised.pdf", [[2008, 1.01]]),
          ...sourced("https://www.irs.gov/pub/irs-soi/10databk.pdf", [[2010, 1.11]]),
          ...sourced("https://www.irs.gov/pub/irs-soi/12databk.pdf", [[2012, 1.03]]),
          ...sourced("https://www.irs.gov/pub/irs-soi/14databk.pdf", [[2014, 0.86]]),
          ...sourced("https://www.irs.gov/pub/irs-soi/16databk.pdf", [[2016, 0.70]]),
          ...sourced("https://www.irs.gov/pub/irs-prior/p55b--2019.pdf", [[2018, 0.59]]),
        ],
      },
    ],
    annotations: [
      { year: 2013, label: "IRS targeting scandal — Congress retaliates by cutting budget 20% over next 5 years", url: "https://www.tigta.gov/reports/audit/inappropriate-criteria-were-used-identify-tax-exempt-applications-review" },
      { year: 2017, label: "Audit rate for millionaires drops to 1.4% — lower than for EITC recipients making <$25K", url: "https://www.irs.gov/statistics/soi-tax-stats-irs-data-book" },
      { year: 2022, label: "Inflation Reduction Act — $80B IRS funding approved", url: "https://www.congress.gov/bill/117th-congress/house-bill/5376" },
      { year: 2023, label: "$20B of IRA funding rescinded in debt ceiling deal — before agents are even hired", url: "https://www.congress.gov/bill/118th-congress/house-bill/3746" },
    ],
    gradeRationale:
      "IRS operating costs were flat in nominal terms from FY2010 ($12.4B) to FY2018 ($11.7B) while the gross tax gap doubled from $345B (TY2001) to $696B (TY2022 projection). The individual audit rate fell from 1.11% (FY2010) to 0.59% (FY2018); the IRS has examined about 0.3% of individual returns for tax years 2019–2021. IRA funding raised operating costs to $18.2B in FY2024.",
    wishoniaQuote:
      "You defunded the one agency that generates revenue. The IRS collects four dollars for every one dollar you spend on it. You cut its budget and the tax gap doubled to nearly seven hundred billion. On my planet, we would call this self-sabotage. Here you call it fiscal conservatism.",
    sources: [
      { label: "IRS Data Book", url: "https://www.irs.gov/statistics/soi-tax-stats-irs-data-book" },
      { label: "IRS Tax Gap Projections (Pub. 5869)", url: "https://www.irs.gov/pub/irs-pdf/p5869.pdf" },
      { label: "Treasury Inspector General", url: "https://www.tigta.gov/" },
    ],
  },
  {
    agencyId: "fed",
    agencyName: "Federal Reserve System",
    emoji: "🏦",
    countryCode: "US",
    mission: "Promote maximum employment, stable prices, and moderate long-term interest rates",
    spendingLabel:
      "Federal Reserve Banks operating expenses, net of Treasury reimbursements (calendar year, nominal USD; excludes interest on reserves)",
    spendingTimeSeries: [
      ...sourced("https://www.federalreserve.gov/boarddocs/press/general/2001/20010118/default.htm", [[2000, 1.6e9]]),
      ...sourced("https://www.federalreserve.gov/boarddocs/press/other/2003/20030108/default.htm", [[2002, 2.1e9]]),
      ...sourced("https://www.federalreserve.gov/boarddocs/press/other/2005/200501072/default.htm", [[2004, 2.1e9]]),
      ...sourced("https://www.federalreserve.gov/newsevents/pressreleases/other20070109b.htm", [[2006, 2.4e9]]),
      ...sourced("https://www.federalreserve.gov/newsevents/pressreleases/other20090109a.htm", [[2008, 2.6e9]]),
      ...sourced("https://www.federalreserve.gov/newsevents/pressreleases/other20110110a.htm", [[2010, 3.3e9]]),
      ...sourced("https://www.federalreserve.gov/newsevents/pressreleases/other20130110a.htm", [[2012, 3.7e9]]),
      ...sourced("https://www.federalreserve.gov/newsevents/pressreleases/other20150109a.htm", [[2014, 3.6e9]]),
      ...sourced("https://www.federalreserve.gov/newsevents/pressreleases/other20170110a.htm", [[2016, 4.0e9]]),
      ...sourced("https://www.federalreserve.gov/newsevents/pressreleases/other20190110a.htm", [[2018, 4.3e9]]),
      ...sourced("https://www.federalreserve.gov/newsevents/pressreleases/other20210111a.htm", [[2020, 4.5e9]]),
      ...sourced("https://www.federalreserve.gov/newsevents/pressreleases/other20230113a.htm", [[2022, 5.6e9]]),
      ...sourced("https://www.federalreserve.gov/publications/2024-ar-payment-system-and-reserve-bank-oversight.htm", [
        [2024, 5.6e9],
      ]),
    ],
    outcomes: [
      {
        label: "Dollar purchasing power (1913 = $1.00; CPI-U annual average)",
        emoji: "💵",
        direction: "higher_is_better",
        color: "pink",
        data: sourced("https://data.bls.gov/timeseries/CUUR0000SA0", [
          [2000, 0.057], [2002, 0.055], [2004, 0.052], [2006, 0.049], [2008, 0.046], [2010, 0.045],
          [2012, 0.043], [2014, 0.042], [2016, 0.041], [2018, 0.039], [2020, 0.038], [2022, 0.034],
          [2024, 0.032],
        ]),
      },
      {
        label: "Fed total assets at year-end (USD trillions, H.4.1)",
        emoji: "🖨️",
        direction: "lower_is_better",
        color: "yellow",
        data: [
          ...sourced("https://www.federalreserve.gov/releases/h41/20001228/", [[2000, 0.6]]),
          ...sourced("https://fred.stlouisfed.org/series/WALCL", [
            [2002, 0.7], [2004, 0.8], [2006, 0.9], [2008, 2.2], [2010, 2.4], [2012, 2.9], [2014, 4.5],
            [2016, 4.5], [2018, 4.1], [2020, 7.4], [2022, 8.6], [2024, 6.9],
          ]),
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
    gradeRationale:
      "The dollar has lost 97% of its purchasing power since the Fed was created. The economy grew faster without it (3.8% vs 2.7%). Canada had zero bank failures during the Great Depression without a central bank. The Fed's balance sheet went from $0.9T (end of 2007) to a peak of $9.0T (April 2022) — printing money that went to the top 1%.",
    wishoniaQuote:
      "Your species created an institution to manage your money. In 111 years it has destroyed ninety-seven percent of your currency's value, bailed out the banks that crashed the economy, printed four point six trillion dollars during a pandemic that mostly went to the already wealthy, and presided over the largest wealth transfer in human history. On my planet, we would call that embezzlement. Here you call it monetary policy.",
    sources: [
      { label: "BLS CPI-U", url: "https://data.bls.gov/timeseries/CUUR0000SA0" },
      { label: "FRED — Fed Balance Sheet (WALCL)", url: "https://fred.stlouisfed.org/series/WALCL" },
      { label: "Federal Reserve income and expense press releases", url: "https://www.federalreserve.gov/newsevents/pressreleases.htm" },
      { label: "GAO — Federal Reserve Emergency Lending", url: "https://www.gao.gov/products/gao-11-696" },
    ],
  },
];

export const US_AGENCY_PERFORMANCE: AgencyPerformance[] = US_AGENCY_DATA.map((agency) => ({
  ...agency,
  grade: gradeAgency(agency),
}));

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
