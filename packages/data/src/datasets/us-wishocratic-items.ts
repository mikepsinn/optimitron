/**
 * Canonical US Wishocratic item catalog shared by dataset consumers and DB seeds.
 *
 * US Citizen Priority Items
 *
 * The 23 budget priority categories that citizens compare via RAPPA
 * (pairwise allocation). Each item includes:
 * - Structural data: spending, ROI, fiscal category mappings
 * - Voice: Wishonia's deadpan descriptions with source citations
 * - Mappings: which fiscal categories (from us-federal-budget.ts) this maps to
 *
 * These are more granular and opinionated than the 23 OMB fiscal categories.
 * A priority item may be a subset of a fiscal category (Nuclear Weapons ⊂ Military),
 * span multiple (Drug War → Justice + Homeland Security), or represent proposed
 * spending that doesn't exist yet (UBI).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FiscalCategoryShare {
  /** ID matching BudgetCategory.id from us-federal-budget.ts (e.g., 'military', 'education') */
  fiscalCategoryId: string;
  /** Fraction of this priority item's budget from this fiscal category (0-1) */
  share: number;
}

export interface WishocraticItemRoiData {
  /** Source of the ROI claim */
  source: string;
  /** ROI ratio string (e.g., '45:1', 'Negative ROI', 'Low ROI') */
  ratio: string;
  /** Explanation of the ROI */
  description: string;
  /** URL to the source */
  sourceUrl: string;
}

export interface WishocraticItemSource {
  /** Human-readable source description */
  name: string;
  /** URL */
  url: string;
}

export interface WishocraticItemDefinition {
  /** Unique slug ID (e.g., 'nuclear_weapons') */
  readonly slug: string;
  /** Human-readable name */
  readonly name: string;
  /** Wishonia's voice description — deadpan, data-first, with specific numbers */
  readonly description: string;
  /** Emoji icon */
  readonly icon: string;
  /** Annual federal spending in billions USD (0 for proposed items) */
  readonly annualBudgetBillions: number;
  /** Fiscal year and basis of annualBudgetBillions, e.g. 'FY2026 enacted' or 'FY2026 estimate' */
  readonly budgetFiscalYear: string | null;
  /** Title of the document behind annualBudgetBillions */
  readonly budgetSourceName: string | null;
  /** Deep link to the document behind annualBudgetBillions */
  readonly budgetSourceUrl: string | null;
  /**
   * What annualBudgetBillions counts. Starts with "Estimate:" or "Assumption:"
   * when the figure is modeled rather than read from a budget line.
   */
  readonly budgetDefinition: string;
  /**
   * Estimated average citizen allocation (percent). A modeled estimate from
   * public polling, not measured pairwise data: no poll asks people to split
   * money across these exact programs. Values sum to 100 and none is 0, since
   * an average reaches 0 only if every person gives nothing.
   */
  readonly estimatedCitizenAllocationPct: number;
  /** Plausible low and high values for the estimate, in percent */
  readonly estimatedCitizenAllocationRange: readonly [number, number];
  /** One-line reasoning for the estimate, naming the polls it rests on */
  readonly estimatedCitizenAllocationBasis: string;
  /** Polls behind the estimate */
  readonly estimatedCitizenAllocationSources: readonly WishocraticItemSource[];
  /** ROI data with source citation (null if no clear ROI framing) */
  readonly roiData: Readonly<WishocraticItemRoiData> | null;
  /** Evidence sources */
  readonly sources: readonly WishocraticItemSource[];
  /** Which fiscal categories this maps to (from us-federal-budget.ts) */
  readonly fiscalCategoryMappings: readonly FiscalCategoryShare[];
  /** Whether this is existing government spending or proposed */
  readonly type: 'existing' | 'proposed';
  /** Jurisdiction code */
  readonly jurisdictionCode: string;
}

export interface WishocraticCatalogRecord<TItemId extends string = string> {
  /** Stable item ID used in DB rows and UI state */
  readonly id: TItemId;
  /** Jurisdiction code matching the seeded Jurisdiction.code */
  readonly jurisdictionCode: string;
  /** Human-readable name */
  readonly name: string;
  /** Item description */
  readonly description: string;
  /** URL to supporting documentation or source data */
  readonly sourceUrl: string | null;
  /** Current actual budget allocation in USD */
  readonly currentAllocationUsd: number;
  /** Current actual budget allocation as a percentage of the total */
  readonly currentAllocationPct: number;
}

export const US_WISHOCRATIC_JURISDICTION = {
  code: 'US',
  name: 'United States',
  type: 'COUNTRY',
} as const;

// ─── Data ────────────────────────────────────────────────────────────────────

export const US_WISHOCRATIC_ITEMS = {
  // ─── CITIZEN-DIRECTED UBI ────────────────────────────────────────────
  UNIVERSAL_BASIC_INCOME: {
    slug: 'universal_basic_income',
    name: 'Universal Basic Income',
    description: 'Direct cash to every verified citizen. No conditions, no bureaucracy. Does not currently exist in the US. GiveDirectly RCTs measured outcomes: earnings up 38%, food insecurity down 42%, delivery cost 90 cents per dollar. The current US welfare system delivers $1.00 in benefits for $2.30 in spending.',
    icon: '💰',
    annualBudgetBillions: 0,
    budgetFiscalYear: null,
    budgetSourceName: null,
    budgetSourceUrl: null,
    budgetDefinition: 'Proposed: no federal program exists.',
    estimatedCitizenAllocationPct: 3.7,
    estimatedCitizenAllocationRange: [2.5, 5.5],
    estimatedCitizenAllocationBasis: 'Pew 2020: 45% favor and 54% oppose about $1,000 a month for every adult; strongly partisan.',
    estimatedCitizenAllocationSources: [
      { name: 'Pew Research Center, universal basic income (Aug 2020)', url: 'https://www.pewresearch.org/short-reads/2020/08/19/more-americans-oppose-than-favor-the-government-providing-a-universal-basic-income-for-all-adult-citizens/' },
    ],
    roiData: {
      source: 'GiveDirectly RCTs',
      ratio: '1:1',
      description: 'Unconditional cash transfers increase earnings 38%, reduce food insecurity 42%; 90¢ per $1 delivered vs $2.30 for traditional welfare',
      sourceUrl: 'https://www.givedirectly.org/research-on-cash-transfers/',
    },
    sources: [
      { name: 'GiveDirectly — Research on cash transfers', url: 'https://www.givedirectly.org/research-on-cash-transfers/' },
      { name: 'NBER — General equilibrium effects of cash transfers', url: 'https://www.nber.org/papers/w26600' },
    ],
    fiscalCategoryMappings: [],
    type: 'proposed' as const,
    jurisdictionCode: 'US',
  },

  // ─── HIGH-ROI INVESTMENTS ────────────────────────────────────────────
  PRAGMATIC_CLINICAL_TRIALS: {
    slug: 'pragmatic_clinical_trials',
    name: 'Pragmatic Clinical Trials',
    description: 'Testing drugs in real patients, in real hospitals, producing answers in months instead of decades. The current FDA approval process averages 12 years. Pragmatic trials run in existing clinical settings at a fraction of traditional trial costs. 1.08 billion people have expressed willingness to participate in trials. Current capacity uses less than 1% of them.',
    icon: '🔬',
    annualBudgetBillions: 2.1,
    budgetFiscalYear: 'FY2025 actual',
    budgetSourceName: 'NIH RCDC categorical spending (Comparative Effectiveness Research) and FY2027 Budget Appendix (PCORI obligations)',
    budgetSourceUrl: 'https://report.nih.gov/funding/categorical-spending',
    budgetDefinition: 'Federal comparative-effectiveness research, the category pragmatic trials belong to: NIH CER category $1.26B + PCORI obligations $0.85B. An upper bound: no budget line isolates pragmatic trials. All NIH clinical trial spending, all phases: $7.0B.',
    estimatedCitizenAllocationPct: 7.5,
    estimatedCitizenAllocationRange: [5, 9],
    estimatedCitizenAllocationBasis: 'Medical research funding is popular (71% want an increase, advocacy poll); YouGov 2025 scientific research: 54% increase, 11% decrease. The label is unfamiliar to most people.',
    estimatedCitizenAllocationSources: [
      { name: 'Morning Consult for the American Society of Hematology, medical research funding (Aug 2025; advocacy)', url: 'https://www.hematology.org/newsroom/press-releases/2025/voters-want-congress-to-increase-nih-budget-and-federal-medical-research-spending' },
      { name: 'YouGov, government spending on 40 areas (Feb 2025)', url: 'https://d3nkl3psvxxpe9.cloudfront.net/documents/Government_Spending_poll_results_aM0fEtB.pdf' },
    ],
    roiData: {
      source: 'Copenhagen Consensus',
      ratio: '45:1',
      description: 'Medical research returns $45 for every $1 invested in health interventions',
      sourceUrl: 'https://copenhagenconsensus.com/copenhagen-consensus-iii/outcome',
    },
    sources: [
      { name: 'Copenhagen Consensus III — ROI of health research', url: 'https://copenhagenconsensus.com/copenhagen-consensus-iii/outcome' },
      { name: 'CMS National Health Expenditure Data — $4.7T total', url: 'https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'health_discretionary', share: 1.0 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
  ADDICTION_TREATMENT: {
    slug: 'addiction_treatment',
    name: 'Addiction Treatment Programs',
    description: 'Harm reduction, medication-assisted treatment (MAT), and recovery support programmes. 46.3 million Americans meet criteria for substance use disorder. 94% receive no treatment. Of those in publicly funded programmes, 29% complete treatment. Relapse rate without MAT: 80%+ within one year. Only 22% of people with opioid use disorder receive any MAT despite it cutting overdose death risk in half.',
    icon: '🏥',
    annualBudgetBillions: 21.5,
    budgetFiscalYear: 'FY2024 (latest complete ONDCP table)',
    budgetSourceName: 'ONDCP, National Drug Control Budget FY2025 Funding Highlights, Table 3',
    budgetSourceUrl: 'https://bidenwhitehouse.archives.gov/wp-content/uploads/2024/03/FY-2025-Budget-Highlights.pdf',
    budgetDefinition: 'All federal drug-control treatment spending, including Medicare and Medicaid ($11.9B), SAMHSA ($3.75B) and VA ($1.4B). FY2026 SAMHSA treatment grants alone: about $4.2B.',
    estimatedCitizenAllocationPct: 6.3,
    estimatedCitizenAllocationRange: [4.5, 7.5],
    estimatedCitizenAllocationBasis: 'YouGov 2025: addiction treatment 53% increase, 11% decrease. Pew 2014: 67% prefer treatment over prosecuting drug users.',
    estimatedCitizenAllocationSources: [
      { name: 'YouGov, government spending on 40 areas (Feb 2025)', url: 'https://d3nkl3psvxxpe9.cloudfront.net/documents/Government_Spending_poll_results_aM0fEtB.pdf' },
      { name: 'Pew Research Center, drug policy (Apr 2014)', url: 'https://www.pewresearch.org/politics/2014/04/02/americas-new-drug-policy-landscape/' },
    ],
    roiData: {
      source: 'NIDA Research',
      ratio: '7:1',
      description: 'Every $1 spent on treatment saves $7 in healthcare and criminal justice costs',
      sourceUrl: 'https://nida.nih.gov/publications/principles-drug-addiction-treatment-research-based-guide-third-edition/frequently-asked-questions/drug-addiction-treatment-worth-its-cost',
    },
    sources: [
      { name: 'NIDA — Treatment is cost-effective (7:1 ROI)', url: 'https://nida.nih.gov/publications/principles-drug-addiction-treatment-research-based-guide-third-edition/frequently-asked-questions/drug-addiction-treatment-worth-its-cost' },
      { name: 'SAMHSA — 2023 National Survey on Drug Use and Health', url: 'https://www.samhsa.gov/data/data-we-collect/nsduh-national-survey-drug-use-and-health/national-releases/2023' },
      { name: 'SAMHSA TEDS — 29% treatment completion rate', url: 'https://www.samhsa.gov/data/data-we-collect/teds/datapage' },
      { name: 'NIDA — 40-60% relapse rates, 80%+ without MAT', url: 'https://nida.nih.gov/publications/drugs-brains-behavior-science-addiction/treatment-recovery' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'health_discretionary', share: 1.0 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
  EARLY_CHILDHOOD_EDUCATION: {
    slug: 'early_childhood_ed',
    name: 'Early Childhood Education',
    description: 'Pre-K, Head Start, and childcare subsidies. Head Start serves about 800,000 children per year. Long-term studies show measurable gains in earnings and reduced crime for participants. Test score gains fade by third grade. Long-term income gains persist into adulthood.',
    icon: '👶',
    annualBudgetBillions: 21.5,
    budgetFiscalYear: 'FY2026 enacted',
    budgetSourceName: 'Senate Appropriations Committee, FY2026 Labor-HHS conference bill summary',
    budgetSourceUrl: 'https://www.appropriations.senate.gov/imo/media/doc/fy26_lhhs_conference_bill_summary1.pdf',
    budgetDefinition: 'Head Start $12.36B + Child Care and Development Block Grant $8.83B + Preschool Development Grants $0.32B.',
    estimatedCitizenAllocationPct: 7.2,
    estimatedCitizenAllocationRange: [5.5, 9],
    estimatedCitizenAllocationBasis: 'YouGov 2025: early childhood education 60% increase, 9% decrease. Pew 2019: education 72% increase, 9% decrease. Head Start: 79% support (advocacy poll).',
    estimatedCitizenAllocationSources: [
      { name: 'YouGov, government spending on 40 areas (Feb 2025)', url: 'https://d3nkl3psvxxpe9.cloudfront.net/documents/Government_Spending_poll_results_aM0fEtB.pdf' },
      { name: 'Pew Research Center, federal spending priorities (Apr 2019)', url: 'https://www.pewresearch.org/politics/2019/04/11/little-public-support-for-reductions-in-federal-spending/' },
      { name: 'First Five Years Fund, Head Start poll (Apr 2025; advocacy)', url: 'https://www.ffyf.org/2025/04/29/new-poll-support-for-head-start' },
    ],
    roiData: {
      source: 'Heckman Equation',
      ratio: '13:1',
      description: 'High-quality early childhood programs return $13 per dollar through better outcomes',
      sourceUrl: 'https://heckmanequation.org/resource/13-roi-toolbox/',
    },
    sources: [
      { name: 'Heckman Equation — 13:1 ROI Toolbox', url: 'https://heckmanequation.org/resource/13-roi-toolbox/' },
      { name: 'HHS — Head Start Impact Study: gains fade by 3rd grade', url: 'https://www.acf.hhs.gov/opre/report/third-grade-follow-head-start-impact-study-final-report' },
      { name: 'NAEP — Reading scores flat since 1971 despite 3x spending', url: 'https://nces.ed.gov/nationsreportcard/ltt/' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'education', share: 1.0 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
  CYBERSECURITY: {
    slug: 'cybersecurity',
    name: 'Cybersecurity & Infrastructure Protection',
    description: 'CISA — the federal agency responsible for protecting critical infrastructure from cyberattack. US cybercrime losses: $12.5 billion in 2023 (up 22% from prior year). Fewer than 0.2% of reported cybercrimes result in prosecution. 2,825 ransomware attacks hit critical infrastructure sectors in 2023. The Colonial Pipeline hack alone cost the economy $3.4 billion.',
    icon: '🔐',
    annualBudgetBillions: 2.6,
    budgetFiscalYear: 'FY2026 enacted',
    budgetSourceName: 'CRS R48979, DHS Budget Request Analysis: FY2027, Table A-1',
    budgetSourceUrl: 'https://www.everycrsreport.com/files/2026-06-09_R48979_cd8f2e13a4dfa499b46be1fc7b90a28fcf466850.html',
    budgetDefinition: 'CISA annual discretionary appropriation.',
    estimatedCitizenAllocationPct: 8.3,
    estimatedCitizenAllocationRange: [5, 9.5],
    estimatedCitizenAllocationBasis: 'YouGov 2025: cybersecurity 73% increase, 3% decrease, tied for the most-supported of 40 areas. Gallup 2023: 85% call cyberterrorism a critical threat.',
    estimatedCitizenAllocationSources: [
      { name: 'YouGov, government spending on 40 areas (Feb 2025)', url: 'https://d3nkl3psvxxpe9.cloudfront.net/documents/Government_Spending_poll_results_aM0fEtB.pdf' },
      { name: 'Gallup on cyberterrorism as a critical threat, via UPI (Mar 2023)', url: 'https://www.upi.com/Top_News/US/2023/03/22/gallup-survey-world-affairs-cyberterrorism-nuclear-weapons/5791679520703/' },
    ],
    roiData: {
      source: 'CISA / GAO Reports',
      ratio: '20:1',
      description: 'Cybersecurity investment prevents cascading infrastructure failures costing orders of magnitude more',
      sourceUrl: 'https://www.cisa.gov/topics/cybersecurity-best-practices',
    },
    sources: [
      { name: 'CISA — Cybersecurity Best Practices', url: 'https://www.cisa.gov/topics/cybersecurity-best-practices' },
      { name: 'GAO — Critical Infrastructure Protection', url: 'https://www.gao.gov/products/gao-23-106441' },
      { name: 'FBI IC3 — $12.5B in cybercrime losses, 880K complaints (2023)', url: 'https://www.ic3.gov/AnnualReport/Reports/2023_IC3Report.pdf' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'homeland_security', share: 0.7 },
      { fiscalCategoryId: 'military', share: 0.3 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },

  // ─── WASTEFUL/LOW-ROI SPENDING ──────────────────────────────────────
  DRUG_WAR: {
    slug: 'drug_war',
    name: 'Drug War (Enforcement + Incarceration)',
    description: 'Enforcement, interdiction, and incarceration of non-violent drug offenders. Outcomes after 50+ years: overdose deaths went from 6,100/yr (1980) to 110,000/yr (2023) — an 18x increase. Drug use rates: essentially unchanged. 300,000 people imprisoned for drug offences at $39,158/yr each. 44% are rearrested for a new drug offence within 5 years. Portugal decriminalised all personal use in 2001: drug deaths fell to 3 per million (EU average: 23.7). HIV infections among drug users dropped 98%.',
    icon: '🚔',
    annualBudgetBillions: 19.3,
    budgetFiscalYear: 'FY2024 (latest complete ONDCP table)',
    budgetSourceName: 'ONDCP, National Drug Control Budget FY2025 Funding Highlights, Table 3',
    budgetSourceUrl: 'https://bidenwhitehouse.archives.gov/wp-content/uploads/2024/03/FY-2025-Budget-Highlights.pdf',
    budgetDefinition: 'Federal drug-control supply reduction: domestic law enforcement $11.4B (including federal prisons, DEA and Marshals) + interdiction $6.9B + international $0.9B. State and local enforcement is not included.',
    estimatedCitizenAllocationPct: 2.3,
    estimatedCitizenAllocationRange: [1.5, 3.5],
    estimatedCitizenAllocationBasis: '83% say the War on Drugs failed (advocacy poll). Pew 2014: only 26% prefer prosecuting drug users. YouGov 2024: DEA 39% increase, 16% decrease.',
    estimatedCitizenAllocationSources: [
      { name: 'Bully Pulpit Interactive for ACLU and Drug Policy Alliance, War on Drugs (Jun 2021; advocacy)', url: 'https://assets.aclu.org/live/uploads/document/BPI-ACLU_WoD_Public_Release_Memo_060221_Updated060821_FINAL.pdf' },
      { name: 'Pew Research Center, drug policy (Apr 2014)', url: 'https://www.pewresearch.org/politics/2014/04/02/americas-new-drug-policy-landscape/' },
      { name: 'YouGov, spending by federal agency (Sep 2024)', url: 'https://d3nkl3psvxxpe9.cloudfront.net/documents/Government_Spending_poll_results.pdf' },
    ],
    roiData: {
      source: 'Cato Institute',
      ratio: 'Negative ROI',
      description: 'Drug war spending increases addiction rates and incarceration without reducing drug use',
      sourceUrl: 'https://www.cato.org/policy-analysis/four-decades-counting-continued-failure-war-drugs',
    },
    sources: [
      { name: 'CDC Data Brief No. 491 — Overdose deaths 6,100 (1980) to 110,000 (2023)', url: 'https://www.cdc.gov/nchs/products/databriefs/db491.htm' },
      { name: 'NIDA — Overdose death rate trends', url: 'https://nida.nih.gov/research-topics/trends-statistics/overdose-death-rates' },
      { name: 'CNBC — Over $1 trillion spent on drug war', url: 'https://www.cnbc.com/2021/06/17/the-us-has-spent-over-a-trillion-dollars-fighting-war-on-drugs.html' },
      { name: 'Prison Policy Initiative — 300,000 imprisoned for drug offences', url: 'https://www.prisonpolicy.org/graphs/pie2025_drugs.html' },
      { name: 'Pew Research — More imprisonment does not reduce state drug problems', url: 'https://www.pewtrusts.org/en/research-and-analysis/issue-briefs/2018/03/more-imprisonment-does-not-reduce-state-drug-problems' },
      { name: 'Transform — Portugal drug decriminalisation results', url: 'https://transformdrugs.org/blog/drug-decriminalisation-in-portugal-setting-the-record-straight' },
      { name: 'Cato Institute — Four decades of failure', url: 'https://www.cato.org/policy-analysis/four-decades-counting-continued-failure-war-drugs' },
      { name: 'USSC — 44% of drug offenders rearrested for new drug offence', url: 'https://www.ussc.gov/research/research-reports/recidivism-federal-drug-trafficking-offenders' },
      { name: 'BOP — $39,158/yr average cost per federal inmate', url: 'https://www.federalregister.gov/documents/2023/11/01/2023-24174/annual-determination-of-average-cost-of-incarceration-fee-acif' },
      { name: 'EMCDDA — Portugal: drug deaths 3/million vs EU avg 23.7', url: 'https://www.emcdda.europa.eu/countries/drug-reports/2023/portugal_en' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'justice', share: 0.6 },
      { fiscalCategoryId: 'homeland_security', share: 0.2 },
      { fiscalCategoryId: 'other_mandatory', share: 0.2 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
  ICE_CRIMINAL_DEPORTATION: {
    slug: 'ice_criminal',
    name: 'Deporting Criminal Immigrants',
    description: 'ICE enforcement targeting immigrants with criminal convictions. Of ICE arrests in FY2023, 27% had criminal convictions. Cost per deportation: $10,900-$12,500. Detention: $142/day average, 55-day average stay. Immigration court backlog: 3.7 million pending cases, average case takes 4+ years.',
    icon: '🚔',
    annualBudgetBillions: 7,
    budgetFiscalYear: 'FY2026 estimate',
    budgetSourceName: 'CRS R48874, DHS Appropriations: FY2026 State of Play',
    budgetSourceUrl: 'https://www.everycrsreport.com/files/2026-06-24_R48874_110288560491cb6ccc12bffcf6463335c70a9043.html',
    budgetDefinition: 'Estimate: about $25B of FY2026 ICE enforcement and removal spending (annual appropriations plus 2025 and 2026 reconciliation funds) times the 29.4% of ICE detainees with a criminal conviction (TRAC, July 2026). Low confidence.',
    estimatedCitizenAllocationPct: 6.2,
    estimatedCitizenAllocationRange: [4, 7.5],
    estimatedCitizenAllocationBasis: 'AP-NORC 2025: 83% favor deporting immigrants convicted of violent crimes, including 79% of Democrats. UMass/YouGov 2025: 69% support deporting those with criminal records. Discounted for ICE\'s 2026 unpopularity (40% approve).',
    estimatedCitizenAllocationSources: [
      { name: 'AP-NORC, deporting immigrants convicted of violent crimes (Jan 2025)', url: 'https://apnorc.org/projects/widespread-support-for-deporting-immigrants-convicted-of-violent-crimes/' },
      { name: 'UMass Amherst/YouGov immigration poll, via Boston Globe (Aug 2025)', url: 'https://www.bostonglobe.com/2025/08/07/metro/umass-amherst-immigration-poll/' },
      { name: 'Marquette Law School national survey on ICE (Feb 2026)', url: 'https://law.marquette.edu/poll/2026/02/04/new-marquette-law-school-national-survey-finds-60-disapprove-of-the-work-of-ice-with-democrats-and-independents-opposed-to-ice-and-republicans-in-favor/' },
    ],
    roiData: null,
    sources: [
      { name: 'ICE ERO — FY2023 Annual Report (27% criminal, 73% non-criminal)', url: 'https://www.ice.gov/doclib/eoy/eroReportFY2023.pdf' },
      { name: 'American Immigration Council — Cost per deportation $10,900-$12,500', url: 'https://www.americanimmigrationcouncil.org/research/the-cost-of-immigration-enforcement' },
      { name: 'TRAC — 3.7M immigration court backlog', url: 'https://trac.syr.edu/phptools/immigration/court_backlog/' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'homeland_security', share: 0.8 },
      { fiscalCategoryId: 'justice', share: 0.2 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
  ICE_NONCRIMINAL_DEPORTATION: {
    slug: 'ice_noncriminal',
    name: 'Deporting Non-Criminal Immigrants',
    description: 'ICE enforcement targeting immigrants with no criminal record. 73% of ICE arrests in FY2023 had no criminal conviction. Undocumented immigrants pay $96.7 billion in taxes annually while being barred from most benefits. Alternatives to detention cost $4.50/day with 90%+ court appearance rates vs $142/day for detention. CBO projects immigration reduces federal deficits by $0.9 trillion over 2024-2034.',
    icon: '🚨',
    annualBudgetBillions: 18,
    budgetFiscalYear: 'FY2026 estimate',
    budgetSourceName: 'CRS R48874, DHS Appropriations: FY2026 State of Play',
    budgetSourceUrl: 'https://www.everycrsreport.com/files/2026-06-24_R48874_110288560491cb6ccc12bffcf6463335c70a9043.html',
    budgetDefinition: 'Estimate: the other 70.6% of about $25B of FY2026 ICE enforcement and removal spending, the share of ICE detainees with no criminal conviction (TRAC, July 2026). Low confidence.',
    estimatedCitizenAllocationPct: 2.5,
    estimatedCitizenAllocationRange: [1.5, 4],
    estimatedCitizenAllocationBasis: 'Marquette 2026: 44% favor and 56% oppose deporting longtime residents with jobs and no criminal record. UMass/YouGov 2025: about 37% support deporting people with no criminal record.',
    estimatedCitizenAllocationSources: [
      { name: 'Marquette Law School national survey on ICE (Feb 2026)', url: 'https://law.marquette.edu/poll/2026/02/04/new-marquette-law-school-national-survey-finds-60-disapprove-of-the-work-of-ice-with-democrats-and-independents-opposed-to-ice-and-republicans-in-favor/' },
      { name: 'UMass Amherst/YouGov immigration poll, via Boston Globe (Aug 2025)', url: 'https://www.bostonglobe.com/2025/08/07/metro/umass-amherst-immigration-poll/' },
    ],
    roiData: {
      source: 'Cato Institute / CBO',
      ratio: 'Negative ROI',
      description: 'Deporting net tax contributors; CBO projects immigration reduces deficits by $0.9T (2024-2034)',
      sourceUrl: 'https://www.cato.org/white-paper/immigrants-recent-effects-government-budgets-1994-2023',
    },
    sources: [
      { name: 'ICE ERO — FY2023 Annual Report (73% non-criminal)', url: 'https://www.ice.gov/doclib/eoy/eroReportFY2023.pdf' },
      { name: 'ITEP — Undocumented immigrants paid $96.7B in taxes (2022)', url: 'https://itep.org/undocumented-immigrants-taxes-2024/' },
      { name: 'CBO — Immigration reduces deficits by $0.9T (2024-2034)', url: 'https://www.cbo.gov/publication/60569' },
      { name: 'PNAS — Undocumented immigrants half as likely to be arrested for violent crime', url: 'https://www.pnas.org/doi/10.1073/pnas.2014704117' },
      { name: 'National Immigration Forum — Detention $142/day vs alternatives $4.50/day', url: 'https://forumtogether.org/article/immigration-detention-costs-in-a-time-of-mass-deportation/' },
      { name: 'Penn Wharton — Mass deportation GDP impact', url: 'https://budgetmodel.wharton.upenn.edu/issues/2025/7/28/mass-deportation-of-unauthorized-immigrants-fiscal-and-economic-effects' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'homeland_security', share: 0.8 },
      { fiscalCategoryId: 'justice', share: 0.2 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
  FARM_SUBSIDIES_AGRIBUSINESS: {
    slug: 'farm_subsidies',
    name: 'Agribusiness Subsidies',
    description: 'Commodity payments, crop insurance subsidies, and conservation programmes. The top 10% of agribusiness corporations receive 78% of all payments. The top 1% receive 27%. The bottom 80% of recipients share 9%. US farm count: 6.8 million (1935) → 2.04 million (2022) despite continuous subsidies since 1933. 40% of subsidized corn goes to ethanol, 36% to animal feed, ~10% to human food.',
    icon: '🌽',
    annualBudgetBillions: 20.8,
    budgetFiscalYear: 'FY2025 outlays',
    budgetSourceName: 'CBO, Baseline Projections: USDA Farm Programs (Feb 2026)',
    budgetSourceUrl: 'https://www.cbo.gov/system/files/2026-01/51317-2026-02-usda.pdf',
    budgetDefinition: 'Commodity programs $3.7B + crop insurance $11.9B + conservation $5.2B (outlays). Excludes about $30B of one-time 2025 disaster and economic aid.',
    estimatedCitizenAllocationPct: 2.3,
    estimatedCitizenAllocationRange: [1.5, 3.5],
    estimatedCitizenAllocationBasis: 'Every Program for Public Consultation budget exercise cut agribusiness subsidies: 70% cut them in 2010, an average 33% cut in 2017, and a bipartisan cut in 2025.',
    estimatedCitizenAllocationSources: [
      { name: 'Program for Public Consultation, How the American Public Would Deal with the Budget Deficit (2011)', url: 'https://www.kff.org/wp-content/uploads/sites/3/2011/04/budget_feb11_rpt.pdf' },
      { name: 'Program for Public Consultation, federal budget exercise (2017)', url: 'https://publicconsultation.org/wp-content/uploads/reports/Federal_Budget_Report_May2018.pdf' },
      { name: 'Program for Public Consultation, Americans on the FY2025 Federal Budget (2025)', url: 'https://publicconsultation.org/wp-content/uploads/2025/07/Federal-Budget-REPORT-2025.pdf' },
    ],
    roiData: {
      source: 'EWG Analysis',
      ratio: 'Low ROI',
      description: '75% of subsidies go to top 10% of farms; promotes monoculture and environmental damage',
      sourceUrl: 'https://www.ewg.org/research/farm-subsidies',
    },
    sources: [
      { name: 'EWG — Farm subsidy distribution (top 10% get 78%)', url: 'https://www.ewg.org/research/updated-ewg-farm-subsidy-database-shows-largest-producers-reap-billions-despite-climate' },
      { name: 'USDA Census of Agriculture 2022 — Farm count decline', url: 'https://www.nass.usda.gov/Publications/AgCensus/2022/' },
      { name: 'USDA ERS — 40% of corn to ethanol', url: 'https://www.ers.usda.gov/data-products/feed-grains-database/' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'agriculture', share: 1.0 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
  FOSSIL_FUEL_SUBSIDIES: {
    slug: 'fossil_fuel_subsidies',
    name: 'Fossil Fuel Subsidies',
    description: 'Tax breaks and direct subsidies to oil, gas, and coal companies. Recipients posted $150 billion in combined profits in 2022. Solar is now 41% cheaper than the cheapest fossil fuel. Wind is 53% cheaper. The subsidies were created when fossil fuels were expensive and renewables did not exist. Neither of those things is true anymore.',
    icon: '🛢️',
    annualBudgetBillions: 2,
    budgetFiscalYear: 'FY2025',
    budgetSourceName: 'OMB, FY2027 Analytical Perspectives, Chapter 10, Table 10-1',
    budgetSourceUrl: 'https://www.whitehouse.gov/wp-content/uploads/2026/04/spec_fy2027.pdf',
    budgetDefinition: 'Fossil-fuel-specific federal tax expenditures: oil and gas percentage depletion $1.21B, marginal wells credit $0.32B, geological amortization $0.16B, enhanced oil recovery $0.14B, and smaller items. Excludes the $0.59B carbon capture credit and DOE fossil energy research.',
    estimatedCitizenAllocationPct: 1.9,
    estimatedCitizenAllocationRange: [1, 3],
    estimatedCitizenAllocationBasis: 'Navigator 2025: 48% favor and 29% oppose ending oil and gas subsidies. Yale/George Mason 2023: about two-thirds oppose financial support for fossil fuel companies.',
    estimatedCitizenAllocationSources: [
      { name: 'Climate Advocacy Lab environmental polling roundup (Jan 2025)', url: 'https://www.climateadvocacylab.org/resource/environmental-polling-roundup-january-24th-2025/' },
    ],
    roiData: {
      source: 'IMF Analysis',
      ratio: 'Negative ROI',
      description: 'Subsidizes climate change while renewable energy has become cheaper',
      sourceUrl: 'https://www.imf.org/en/Topics/climate-change/energy-subsidies',
    },
    sources: [
      { name: 'Oil Change International — $34.8B/yr in direct US subsidies', url: 'https://oilchange.org/news/us-fossil-fuel-subsidies/' },
      { name: 'IMF — $7.4 trillion in global fossil fuel subsidies (2024)', url: 'https://www.imf.org/en/Topics/climate-change/energy-subsidies' },
      { name: 'IRENA — 91% of new renewables cheaper than fossil fuels', url: 'https://www.irena.org/News/pressreleases/2025/Jul/91-Percent-of-New-Renewable-Projects-Now-Cheaper-Than-Fossil-Fuels-Alternatives' },
      { name: 'CBS News — Oil companies $150B+ in record 2022 profits', url: 'https://www.cbsnews.com/news/oil-companies-record-profits-2022-exxon-chevron/' },
      { name: 'National Geographic — $240B/yr in climate damages to US economy', url: 'https://www.nationalgeographic.com/science/article/climate-change-costs-us-economy-billions-report' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'energy', share: 0.6 },
      { fiscalCategoryId: 'treasury', share: 0.4 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
  NUCLEAR_WEAPONS_MODERNIZATION: {
    slug: 'nuclear_weapons',
    name: 'Nuclear Weapons Development',
    description: 'You have 3,700 stockpiled warheads. Defence analysts agree 200-311 provide full deterrence. The UK deters with 200. The 30-year modernisation plan costs $1.7 trillion. The Sentinel ICBM programme is 81% over budget. Research shows just 100 detonations would trigger nuclear winter and kill 5 billion people from famine. You are going from "can end civilisation 10 times" to "can end it 11 times."',
    icon: '☢️',
    annualBudgetBillions: 66,
    budgetFiscalYear: 'FY2025',
    budgetSourceName: 'CBO, Projected Costs of U.S. Nuclear Forces, 2025 to 2034 (Apr 2025), supplemental data Table 3',
    budgetSourceUrl: 'https://www.cbo.gov/publication/61224',
    budgetDefinition: 'CBO\'s budgeted amounts for all US nuclear forces: DoD $44.8B + DOE $21.0B. CBO projects $95B a year on average over 2025-2034.',
    estimatedCitizenAllocationPct: 2.3,
    estimatedCitizenAllocationRange: [1.5, 3.5],
    estimatedCitizenAllocationBasis: 'In a 2012 Program for Public Consultation defense exercise, people cut nuclear weapons by at least 27%, the largest proportional cut. In 2025, Democrats and independents cut it $4-6B.',
    estimatedCitizenAllocationSources: [
      { name: 'Program for Public Consultation defense budget exercise, via NBC News (2012)', url: 'https://www.nbcnews.com/news/world/us-public-supports-cuts-defense-spending-going-beyond-obama-gop-flna764422' },
      { name: 'Program for Public Consultation, Americans on the FY2025 Federal Budget (2025)', url: 'https://publicconsultation.org/wp-content/uploads/2025/07/Federal-Budget-REPORT-2025.pdf' },
    ],
    roiData: {
      source: 'Arms Control Association',
      ratio: 'Low ROI',
      description: 'Modernizing 4,000+ warheads when 200 provide deterrence; risks new arms race',
      sourceUrl: 'https://www.armscontrol.org/factsheets/USNuclearModernization',
    },
    sources: [
      { name: 'FAS — US nuclear weapons stockpile 2025 (3,700 warheads)', url: 'https://fas.org/wp-content/uploads/2025/01/United-States-nuclear-weapons-2025.pdf' },
      { name: 'Arms Control Association — Sentinel ICBM 81% over budget at $141B', url: 'https://www.armscontrol.org/act/2024-03/news/sentinel-icbm-exceeds-projected-cost-37-percent' },
      { name: 'Arms Control Association — $1.7T 30-year modernisation plan', url: 'https://www.armscontrol.org/factsheets/us-modernization-2024-update' },
      { name: 'Nature Food — 100 detonations trigger nuclear winter, 5B deaths from famine', url: 'https://www.livescience.com/nuclear-war-could-kill-5-billion-from-famine' },
      { name: 'SIPRI — Minimum deterrence at 200-311 warheads', url: 'https://www.sipri.org/sites/default/files/2022-06/sipriinsight2206_minimal_nuclear_deterrence_1.pdf' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'military', share: 0.7 },
      { fiscalCategoryId: 'energy', share: 0.3 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
  VIOLENT_CRIME_INCARCERATION: {
    slug: 'violent_crime_incarceration',
    name: 'Violent Crime Incarceration',
    description: 'Locking up people who hurt other people — murders, assaults, robberies. About 55% of state prisoners are violent offenders. Average cost per inmate: $47,162. Recidivism rate: 77% rearrested within 5 years. Norway invested in education and rehabilitation, cut recidivism from 60% to 20%, and closed prisons for lack of prisoners. Your system has a 77% failure rate. Norway\'s has a 20% failure rate. Theirs costs less.',
    icon: '🔒',
    annualBudgetBillions: 0.6,
    budgetFiscalYear: 'FY2026 estimate',
    budgetSourceName: 'CRS R48643, Commerce-Justice-Science Appropriations FY2026, Table 1',
    budgetSourceUrl: 'https://www.everycrsreport.com/files/2026-02-25_R48643_5ab63e26141d07cabb8c7a7008f1b1844906000c.html',
    budgetDefinition: 'Estimate: the 7.6% of the $8.38B federal Bureau of Prisons budget that holds people for violent offenses (BJS, 2023). Federal only: state prisons, which hold most violent offenders, spend about $35B on them.',
    estimatedCitizenAllocationPct: 4.3,
    estimatedCitizenAllocationRange: [3, 6],
    estimatedCitizenAllocationBasis: 'YouGov 2025: prisons 31% increase, 22% decrease. Gallup 2023: 58% say the justice system is not tough enough. Program for Public Consultation budgeters left federal prisons unchanged.',
    estimatedCitizenAllocationSources: [
      { name: 'YouGov, government spending on 40 areas (Feb 2025)', url: 'https://d3nkl3psvxxpe9.cloudfront.net/documents/Government_Spending_poll_results_aM0fEtB.pdf' },
      { name: 'Gallup, views of the criminal justice system (Oct 2023)', url: 'https://news.gallup.com/poll/544439/americans-critical-criminal-justice-system.aspx' },
      { name: 'Program for Public Consultation, federal budget exercise (2017)', url: 'https://publicconsultation.org/wp-content/uploads/reports/Federal_Budget_Report_May2018.pdf' },
    ],
    roiData: {
      source: 'Vera Institute / BJS',
      ratio: 'Low ROI',
      description: '77% recidivism despite $47K/yr per inmate; rehabilitation-focused systems achieve 80% success rates',
      sourceUrl: 'https://www.vera.org/publications/price-of-prisons-2023-update',
    },
    sources: [
      { name: 'BJS — 55% of state prisoners are violent offenders', url: 'https://bjs.ojp.gov/topics/corrections' },
      { name: 'BJS — 77% rearrested within 5 years', url: 'https://bjs.ojp.gov/topics/recidivism-and-reentry' },
      { name: 'Federal Register — $47,162/yr average federal incarceration cost', url: 'https://www.federalregister.gov/documents/2025/12/15/2025-22777/annual-determination-of-average-cost-of-incarceration-fee-coif' },
      { name: 'US News — Netherlands closed 27 prisons for lack of prisoners', url: 'https://www.usnews.com/news/best-countries/articles/2019-05-13/the-netherlands-is-closing-its-prisons' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'justice', share: 1.0 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },

  // ─── MILITARY ────────────────────────────────────────────────────────
  MILITARY_OPERATIONS: {
    slug: 'military',
    name: 'Base Military Budget',
    description: 'The full Pentagon budget — troop salaries, weapons procurement, R&D, base operations, training, and maintenance — excluding nuclear weapons and active conflicts broken out separately. The largest military budget on the planet by a factor of three. GAO found $756 billion in cumulative cost overruns across 84 major acquisition programmes. Only 4 of 28 met all cost, schedule, and performance goals. The F-35 is 78% over budget and 10+ years behind schedule.',
    icon: '🛡️',
    annualBudgetBillions: 811,
    budgetFiscalYear: 'FY2025',
    budgetSourceName: 'OMB Historical Table 5.6 (DoD-Military 051, FY2027 Budget)',
    budgetSourceUrl: 'https://www.whitehouse.gov/wp-content/uploads/2026/04/hist05z6_fy2027.xlsx',
    budgetDefinition: 'DoD discretionary budget authority $860.1B minus DoD nuclear forces $44.8B (counted under nuclear weapons) and about $3.9B of Houthi strikes (counted under Yemen). Multi-year 2025 reconciliation defense funds are not included.',
    estimatedCitizenAllocationPct: 5.2,
    estimatedCitizenAllocationRange: [4, 8],
    estimatedCitizenAllocationBasis: 'YouGov 2025: national defense 48% increase, 17% decrease. Chicago Council 2024: 28% expand, 26% cut. Economist/YouGov 2026: 30% favor and 55% oppose raising it to $1.14T. Program for Public Consultation 2025 budgeters cut core defense $60B, the largest dollar cut.',
    estimatedCitizenAllocationSources: [
      { name: 'YouGov, government spending on 40 areas (Feb 2025)', url: 'https://d3nkl3psvxxpe9.cloudfront.net/documents/Government_Spending_poll_results_aM0fEtB.pdf' },
      { name: 'Chicago Council on Global Affairs, domestic vs foreign spending (2024)', url: 'https://globalaffairs.org/research/public-opinion-survey/americans-prioritize-domestic-spending-over-foreign-aid' },
      { name: 'Economist/YouGov poll (Jul 25-27, 2026)', url: 'https://yougov.com/en-us/articles/55261-new-low-donald-trump-approval-close-2026-house-race-netanyahu-july-25-27-2026-economist-yougov-poll' },
      { name: 'Program for Public Consultation, Americans on the FY2025 Federal Budget (2025)', url: 'https://publicconsultation.org/wp-content/uploads/2025/07/Federal-Budget-REPORT-2025.pdf' },
    ],
    roiData: null,
    sources: [
      { name: 'DoD Comptroller — FY2025 Budget Materials', url: 'https://comptroller.defense.gov/Budget-Materials/' },
      { name: 'GAO — $756B cumulative cost overruns, 4/28 programs met goals', url: 'https://www.gao.gov/products/gao-24-106815' },
      { name: 'GAO — F-35 78% cost overrun, $1.7T lifecycle', url: 'https://www.gao.gov/products/gao-24-106473' },
      { name: 'Watson Institute — $8T total cost of post-9/11 wars', url: 'https://watson.brown.edu/costsofwar/figures/2023/BudgetaryCosts' },
      { name: 'Global Terrorism Database — Attacks 1,800/yr to 16,900/yr', url: 'https://www.start.umd.edu/gtd/' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'military', share: 1.0 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },

  // ─── ACTIVE WARS & CONFLICTS ─────────────────────────────────────────
  BOMBING_IRAN: {
    slug: 'bombing_iran',
    name: 'Bombing Iran',
    description: 'Operation Midnight Hammer hit three nuclear sites in June 2025. Then Operation Epic Fury launched a full-scale war on February 28, 2026. CBO estimates it cost the Pentagon about $38 billion by August 1. Your previous adventures in Iraq and Afghanistan killed 400,000-900,000 civilians, displaced 38 million people, and created ISIS — which did not exist before the 2003 invasion. The Taliban retook Afghanistan in 11 days after 20 years. But I am sure this time will be different.',
    icon: '💣',
    annualBudgetBillions: 38,
    budgetFiscalYear: 'FY2026 estimate',
    budgetSourceName: 'CBO, Estimating the Cost of Combat Operations Against Iran (Sep 2026)',
    budgetSourceUrl: 'https://www.cbo.gov/publication/62756',
    budgetDefinition: 'Estimate: CBO\'s added DoD cost of combat operations against Iran from February 28 to August 1, 2026. Not appropriated as a separate line.',
    estimatedCitizenAllocationPct: 1.5,
    estimatedCitizenAllocationRange: [1, 2.5],
    estimatedCitizenAllocationBasis: 'Gallup June 2026: 34% approve of military action against Iran. Economist/YouGov July 2026: 60% say spending on the war is too much. Chicago Council 2026: 68% say it is not worth fighting.',
    estimatedCitizenAllocationSources: [
      { name: 'Gallup, approval of the Iran war (Jun 2026)', url: 'https://news.gallup.com/poll/711839/approval-iran-war-historical-context.aspx' },
      { name: 'Economist/YouGov poll (Jul 25-27, 2026)', url: 'https://yougov.com/en-us/articles/55261-new-low-donald-trump-approval-close-2026-house-race-netanyahu-july-25-27-2026-economist-yougov-poll' },
      { name: 'Chicago Council on Global Affairs, foreign policy and the 2026 midterms (Jul 2026)', url: 'https://globalaffairs.org/research/public-opinion-survey/americans-foreign-policy-and-2026-midterms' },
    ],
    roiData: {
      source: 'CSIS / Pentagon briefing to Senate Appropriations',
      ratio: 'Negative ROI',
      description: '$11.3B in first 6 days, ~$1B/day ongoing; Iraq/Afghanistan cost $8T+ and destabilized the region',
      sourceUrl: 'https://www.csis.org/analysis/37-billion-estimated-cost-epic-furys-first-100-hours',
    },
    sources: [
      { name: 'CSIS — $3.7B estimated cost of Epic Fury first 100 hours', url: 'https://www.csis.org/analysis/37-billion-estimated-cost-epic-furys-first-100-hours' },
      { name: 'CSIS — $11.3B at day 6, $16.5B at day 12', url: 'https://www.csis.org/analysis/iran-war-cost-estimate-update-113-billion-day-6-165-billion-day-12' },
      { name: 'The Hill — Pentagon confirms $11.3B in first 6 days', url: 'https://thehill.com/homenews/5780153-operation-epic-fury-cost/' },
      { name: 'Fortune — Penn Wharton estimates total economic cost up to $210B', url: 'https://fortune.com/2026/03/02/how-much-trump-iran-war-operation-epic-fury-cost-taxpayers/' },
      { name: 'Watson Institute — $8T cost of post-9/11 wars', url: 'https://watson.brown.edu/costsofwar/figures/2023/BudgetaryCosts' },
      { name: 'Watson Institute — 38 million people displaced', url: 'https://watson.brown.edu/costsofwar/costs/human/refugees' },
      { name: 'Stanford CISAC — ISIS did not exist before 2003 invasion', url: 'https://cisac.fsi.stanford.edu/mappingmilitants' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'military', share: 1.0 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
  ISRAEL_GAZA_MILITARY_AID: {
    slug: 'israel_gaza_aid',
    name: "Military Aid for Israel's War in Gaza",
    description: 'Weapons and munitions since October 2023, funding operations that UN experts have characterised as genocide, with over 65,000 Palestinian civilians killed. Gallup (July 2025): 32% of Americans approve of Israel\'s military action in Gaza, down from 50% in 2023. Quinnipiac (August 2025): 60% oppose sending more military aid.',
    icon: '🇮🇱',
    annualBudgetBillions: 3.8,
    budgetFiscalYear: 'FY2025 enacted',
    budgetSourceName: 'CRS RL33222, U.S. Foreign Aid to Israel',
    budgetSourceUrl: 'https://crsreports.congress.gov/product/pdf/RL/RL33222',
    budgetDefinition: 'US military aid appropriated for Israel in FY2025: $3.3B Foreign Military Financing + $0.5B missile defense. FY2024, with the April 2024 supplemental, was $12.5B.',
    estimatedCitizenAllocationPct: 1.7,
    estimatedCitizenAllocationRange: [1, 3],
    estimatedCitizenAllocationBasis: 'Chicago Council 2026: 56% want to reduce or eliminate it. Economist/YouGov April 2026: 11% increase, 27% maintain, 40% decrease or stop. Quinnipiac 2025: 32% support and 60% oppose more aid.',
    estimatedCitizenAllocationSources: [
      { name: 'Chicago Council on Global Affairs, foreign policy and the 2026 midterms (Jul 2026)', url: 'https://globalaffairs.org/research/public-opinion-survey/americans-foreign-policy-and-2026-midterms' },
      { name: 'Economist/YouGov, military aid to Israel and Ukraine (Apr 2026)', url: 'https://yougov.com/en-us/articles/54596-support-military-aid-ukraine-higher-than-military-aid-israel-april-17-20-2026-economist-yougov-poll' },
      { name: 'Quinnipiac University poll (Aug 2025)', url: 'https://poll.qu.edu/poll-release?releaseid=3929' },
    ],
    roiData: {
      source: 'Quincy Institute / Congressional Research Service',
      ratio: 'Negative ROI',
      description: '65,000+ Palestinian civilians killed; characterized as genocide by UN experts; damages US standing globally',
      sourceUrl: 'https://quincyinst.org/research/u-s-military-aid-and-arms-transfers-to-israel-october-2023-september-2025/',
    },
    sources: [
      { name: 'Quincy Institute — $21.7B in US military aid to Israel since Oct 2023', url: 'https://quincyinst.org/research/u-s-military-aid-and-arms-transfers-to-israel-october-2023-september-2025/' },
      { name: 'CRS — U.S. Foreign Aid to Israel', url: 'https://crsreports.congress.gov/product/pdf/RL/RL33222' },
      { name: 'Gallup — 32% approve Israel military action in Gaza (July 2025)', url: 'https://news.gallup.com/poll/692948/u.s.-back-israel-military-action-gaza-new-low.aspx' },
      { name: 'Quinnipiac — 60% oppose more military aid to Israel (August 2025)', url: 'https://poll.qu.edu/poll-release?releaseid=3929' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'foreign_aid', share: 0.5 },
      { fiscalCategoryId: 'military', share: 0.5 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
  YEMEN_HOUTHI_STRIKES: {
    slug: 'yemen_houthi',
    name: 'Yemen & Houthi Military Strikes',
    description: 'Tomahawk missiles at $2 million each fired at groups using $2,000 drones. The Houthi attacks on shipping persist despite the strikes. This is the military equivalent of hiring a Michelin-star chef to burn toast.',
    icon: '🚢',
    annualBudgetBillions: 3.9,
    budgetFiscalYear: 'FY2025 estimate',
    budgetSourceName: 'Bilmes, Costs of US Military Activities in the Wider Middle East, Costs of War (Brown University), Oct 2025, Table 3',
    budgetSourceUrl: 'https://costsofwar.watson.brown.edu/sites/default/files/2025-10/Wider-Middle-East-Costs_Costs-of-War_Bilmes_10.7.25.pdf',
    budgetDefinition: 'Estimate: added US cost of operations against the Houthis, mostly Operation Rough Rider (March-May 2025). Range $2.8-4.9B; no official DoD total.',
    estimatedCitizenAllocationPct: 2.4,
    estimatedCitizenAllocationRange: [1.5, 3.5],
    estimatedCitizenAllocationBasis: 'Chicago Council-Ipsos 2025: 46% support and 44% oppose airstrikes on the Houthis. Discounted because the item\'s description mocks the strikes.',
    estimatedCitizenAllocationSources: [
      { name: 'Chicago Council-Ipsos, airstrikes against the Houthis (May 2025)', url: 'https://globalaffairs.org/research/public-opinion-survey/just-half-americans-support-airstrikes-against-houthis' },
    ],
    roiData: {
      source: 'Congressional Research Service',
      ratio: 'Low ROI',
      description: 'Houthi attacks on shipping persist despite strikes; each Tomahawk costs $2M+ vs $2K drones',
      sourceUrl: 'https://www.congress.gov/crs-product/RL33222',
    },
    sources: [
      { name: 'CRS — Yemen/Houthi military operations', url: 'https://www.congress.gov/crs-product/RL33222' },
      { name: 'UNDP — 377,000 deaths in Yemen war', url: 'https://www.undp.org/publications/assessing-impact-war-yemen' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'military', share: 1.0 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },

  // ─── CORPORATE & SURVEILLANCE ────────────────────────────────────────
  CORPORATE_WELFARE: {
    slug: 'corporate_welfare',
    name: 'Corporate Welfare',
    description: 'Federal corporate tax expenditures — excluding farm and fossil fuel subsidies counted separately. Boeing: $16 billion in subsidies. Foxconn promised Wisconsin 13,000 jobs for $4.5 billion in incentives and delivered 1,454. Studies show 75-98% of subsidised projects would have happened without the incentive. Michigan\'s job subsidy programmes delivered 9% of promised jobs. These are the richest entities in human history receiving public money because they have better lobbyists than you have representatives.',
    icon: '🏦',
    annualBudgetBillions: 262,
    budgetFiscalYear: 'FY2025',
    budgetSourceName: 'Joint Committee on Taxation, JCX-45-25, Estimates of Federal Tax Expenditures for Fiscal Years 2025-2029, Table 1',
    budgetSourceUrl: 'https://www.jct.gov/publications/2025/jcx-45-25/',
    budgetDefinition: 'Sum of corporate tax expenditures, net of negative entries, excluding fossil fuel ($1.4B) and farm ($0.3B) items. JCT warns that summing provisions is approximate. Without the negative entries: $293B.',
    estimatedCitizenAllocationPct: 1.4,
    estimatedCitizenAllocationRange: [1, 2.5],
    estimatedCitizenAllocationBasis: 'Ending "corporate welfare": 67% support, 17% oppose (advocacy poll). Gallup 2025: 70% say corporations pay too little in taxes.',
    estimatedCitizenAllocationSources: [
      { name: 'Rasmussen Reports for the Woodford Foundation, ending corporate welfare (Sep 2025; advocacy)', url: 'https://www.rasmussenreports.com/public_content/politics/partner_surveys/67_support_ending_corporate_welfare' },
      { name: 'Gallup, taxes (Apr 2025)', url: 'https://news.gallup.com/file/poll/659012/250408Taxes.pdf' },
    ],
    roiData: {
      source: 'Cato Institute',
      ratio: 'Low ROI',
      description: 'Subsidies flow to politically connected firms, not most productive uses; distorts markets',
      sourceUrl: 'https://www.cato.org/policy-analysis/corporate-welfare-federal-budget-0',
    },
    sources: [
      { name: 'PGPF — $188B/yr in federal corporate tax expenditures', url: 'https://www.pgpf.org/article/7-key-charts-on-tax-breaks/' },
      { name: 'Good Jobs First — Subsidy Tracker (Boeing $16B, GM $3.5B)', url: 'https://subsidytracker.goodjobsfirst.org/parent-totals' },
      { name: 'Bloomberg — Foxconn delivered 1,454 of 13,000 promised jobs', url: 'https://www.bloomberg.com/news/features/2019-02-06/inside-wisconsin-s-disastrous-4-5-billion-deal-with-foxconn' },
      { name: 'Springer — 75-98% of subsidised projects happen without the incentive', url: 'https://link.springer.com/article/10.1007/s11142-023-09804-6' },
      { name: 'Cato Institute — Corporate welfare in the federal budget', url: 'https://www.cato.org/policy-analysis/corporate-welfare-federal-budget-0' },
      { name: 'Good Jobs First — 38% job creation shortfall across subsidy deals', url: 'https://www.goodjobsfirst.org/subsidy-tracker' },
      { name: 'Good Jobs First — Amazon built NYC office without $3B subsidy', url: 'https://www.goodjobsfirst.org/amazon-tracker' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'commerce', share: 0.5 },
      { fiscalCategoryId: 'treasury', share: 0.5 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
  AI_MASS_SURVEILLANCE: {
    slug: 'mass_surveillance',
    name: 'Mass Surveillance Programs',
    description: 'The NSA\'s bulk collection programme was reviewed by the Privacy and Civil Liberties Oversight Board, which found "not a single instance" where it made a concrete difference in a counterterrorism investigation. Facial recognition misidentifies Black faces at 10-100x the rate of white faces. The marginal cost per real terrorist detected via bulk surveillance exceeds $14 billion. You are building a panopticon that does not work and disproportionately harms minorities.',
    icon: '👁️',
    annualBudgetBillions: 5,
    budgetFiscalYear: 'Assumption (not public)',
    budgetSourceName: 'ODNI News Release 39-25, FY2025 National Intelligence Program topline',
    budgetSourceUrl: 'https://www.odni.gov/4623/pr-39-25/',
    budgetDefinition: 'Assumption, not public data: NSA and bulk-collection budgets are classified. The only public figure is the $73.3B FY2025 National Intelligence Program total.',
    estimatedCitizenAllocationPct: 1.6,
    estimatedCitizenAllocationRange: [1, 3],
    estimatedCitizenAllocationBasis: 'Only 12% back renewing Section 702 surveillance without reforms (advocacy poll). AP-NORC 2023: 28% support and 44% oppose warrantless listening to calls.',
    estimatedCitizenAllocationSources: [
      { name: 'Data for Progress for Demand Progress, surveillance and AI (Mar 2026; advocacy)', url: 'https://demandprogress.org/poll-voters-strongly-oppose-trump-admins-plans-to-use-ai-for-spying-war/' },
      { name: 'AP-NORC on US espionage, via PBS (Mar 2023)', url: 'https://www.pbs.org/newshour/politics/democrats-and-republicans-are-skeptical-of-u-s-espionage-says-ap-norc-poll' },
    ],
    roiData: {
      source: 'Brennan Center for Justice',
      ratio: 'Negative ROI',
      description: 'Chills free speech; Pentagon labeled Anthropic a national security risk for refusing to allow mass surveillance',
      sourceUrl: 'https://www.brennancenter.org/',
    },
    sources: [
      { name: 'NBC News — White House panel: NSA programme stopped no terror attacks', url: 'https://www.nbcnews.com/news/world/nsa-program-stopped-no-terror-attacks-says-white-house-panel-flna2d11783588' },
      { name: 'NIST — Facial recognition 10-100x more false positives for Black faces', url: 'https://www.nist.gov/news-events/news/2019/12/nist-study-evaluates-effects-race-age-sex-face-recognition-software' },
      { name: 'IEEE — Marginal cost per terrorist detected exceeds $14 billion', url: 'https://ieeexplore.ieee.org/document/8443344/' },
      { name: 'New America — NSA bulk surveillance minimal contribution to investigations', url: 'https://www.newamerica.org/oti/policy-papers/surveillance-costs-the-nsas-impact-on-the-economy-internet-freedom-cybersecurity/' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'homeland_security', share: 0.5 },
      { fiscalCategoryId: 'military', share: 0.3 },
      { fiscalCategoryId: 'justice', share: 0.2 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
  POLICING_VIOLENT_CRIME: {
    slug: 'policing_violent_crime',
    name: 'Solving Actual Violent Crime',
    description: 'Your police solve roughly 50% of murders, 30% of arsons, and a staggering 14% of burglaries. Nearly half of all killers simply get away with it. Meanwhile your law enforcement budget is heavily allocated to drug offences and immigration enforcement rather than, you know, solving the crimes that already happened. The clearance rate for rape kits is somehow even more depressing. Perhaps try catching actual criminals before expanding into new hobbies.',
    icon: '🔍',
    annualBudgetBillions: 8,
    budgetFiscalYear: 'FY2025',
    budgetSourceName: 'DOJ, FY2027 Request Compared to FY2025 Actuals and FY2026 Enacted',
    budgetSourceUrl: 'https://www.justice.gov/jmd/media/1433756/dl',
    budgetDefinition: 'Federal crime-solving composite: FBI criminal enterprises unit $3.96B + ATF $1.63B + state and local law enforcement assistance $2.00B + COPS hiring grants $0.42B. The US Marshals are left out because ONDCP counts most of their budget under the drug war. Local police budgets are not included.',
    estimatedCitizenAllocationPct: 7.5,
    estimatedCitizenAllocationRange: [5.5, 9],
    estimatedCitizenAllocationBasis: 'YouGov 2025: law enforcement 56% increase, 13% decrease. Gallup 2023: 58% say the justice system is not tough enough. Few people oppose solving murders.',
    estimatedCitizenAllocationSources: [
      { name: 'YouGov, government spending on 40 areas (Feb 2025)', url: 'https://d3nkl3psvxxpe9.cloudfront.net/documents/Government_Spending_poll_results_aM0fEtB.pdf' },
      { name: 'Gallup, views of the criminal justice system (Oct 2023)', url: 'https://news.gallup.com/poll/544439/americans-critical-criminal-justice-system.aspx' },
    ],
    roiData: {
      source: 'FBI Uniform Crime Report / Bureau of Justice Statistics',
      ratio: 'Variable',
      description: 'Homicide clearance ~50%, arson ~30%, burglary ~14%; forensic backlogs reduce solve rates',
      sourceUrl: 'https://bjs.ojp.gov/topics/crime',
    },
    sources: [
      { name: 'BJS — Crime and justice data', url: 'https://bjs.ojp.gov/topics/crime' },
      { name: 'FBI Crime Data Explorer — Clearance rates (50% homicide, 12% property)', url: 'https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/explorer/crime/crime-trend' },
      { name: 'End the Backlog — 100K-200K untested rape kits', url: 'https://www.endthebacklog.org/' },
      { name: 'Detroit rape kit audit — 817 serial rapists identified from 11,341 kits', url: 'https://www.endthebacklog.org/detroit/' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'justice', share: 1.0 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },

  // ─── MISSING HIGH-PREFERENCE-DIVERGENCE ITEMS ───────────────────────
  HUMANITARIAN_FOREIGN_AID: {
    slug: 'humanitarian_aid',
    name: 'Humanitarian Foreign Aid',
    description: 'USAID, disaster relief, global health programmes, food security. Vaccination programmes have saved an estimated 154 million lives over 50 years. USAID has also been credibly accused of waste, corruption, and funding programmes that achieve nothing. Results depend entirely on execution.',
    icon: '🌍',
    annualBudgetBillions: 24.6,
    budgetFiscalYear: 'FY2026 enacted',
    budgetSourceName: 'CRS R48956, State-Foreign Operations FY2026, Tables A-1 and A-2',
    budgetSourceUrl: 'https://www.everycrsreport.com/files/2026-10-13_R48956_db007f73c9786dfdb3e81636314f2cd13497b333.html',
    budgetDefinition: 'Bilateral economic assistance $23.35B (global health, humanitarian aid, development) + Food for Peace Title II $1.2B.',
    estimatedCitizenAllocationPct: 2.9,
    estimatedCitizenAllocationRange: [2, 4.5],
    estimatedCitizenAllocationBasis: 'YouGov 2025: foreign aid 20% increase, 49% decrease, the most-cut of 40 areas. KFF 2025: "too much" falls from 58% to 34% once people learn aid is about 1% of the budget. Humanitarian aid polls better than aid in general.',
    estimatedCitizenAllocationSources: [
      { name: 'YouGov, government spending on 40 areas (Feb 2025)', url: 'https://d3nkl3psvxxpe9.cloudfront.net/documents/Government_Spending_poll_results_aM0fEtB.pdf' },
      { name: 'KFF Health Tracking Poll on global health and USAID (Feb 2025)', url: 'https://www.kff.org/global-health-policy/poll-finding/kff-health-tracking-poll-february-2025-the-publics-views-on-global-health-and-usaid/' },
      { name: 'Program for Public Consultation, How the American Public Would Deal with the Budget Deficit (2011)', url: 'https://www.kff.org/wp-content/uploads/sites/3/2011/04/budget_feb11_rpt.pdf' },
    ],
    roiData: {
      source: 'Copenhagen Consensus / FEMA',
      ratio: '20:1',
      description: 'Global health returns $20-60 per $1; disaster preparedness saves $7 per $1 in response costs',
      sourceUrl: 'https://copenhagenconsensus.com/copenhagen-consensus-iii/outcome',
    },
    sources: [
      { name: 'USAID — Congressional Budget Justification', url: 'https://www.usaid.gov/cj' },
      { name: 'Copenhagen Consensus — ROI of global health interventions', url: 'https://copenhagenconsensus.com/copenhagen-consensus-iii/outcome' },
      { name: 'FEMA — $1 in preparedness saves $7 in response', url: 'https://www.fema.gov/grants/mitigation' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'foreign_aid', share: 1.0 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
  VETERANS_HEALTHCARE: {
    slug: 'veterans_healthcare',
    name: 'Veterans Healthcare',
    description: 'Healthcare for 9 million veterans. Average wait for mental health appointment: 36 days (VA standard: 20 days). Disability claims backlog: 296,000 pending over 125 days. 17.5 veterans die by suicide per day — a number that has remained stable for over a decade despite increased spending. Cost per patient: $13,300.',
    icon: '🎖️',
    annualBudgetBillions: 164.8,
    budgetFiscalYear: 'FY2026 enacted',
    budgetSourceName: 'Senate Appropriations Committee, FY2026 MilCon-VA conference bill summary',
    budgetSourceUrl: 'https://www.appropriations.senate.gov/imo/media/doc/FY26%20MCVA%20Conference%20Bill%20Summary.pdf',
    budgetDefinition: 'VA discretionary medical care $115B + health care paid from the Toxic Exposures Fund $49.8B.',
    estimatedCitizenAllocationPct: 9.9,
    estimatedCitizenAllocationRange: [8, 12],
    estimatedCitizenAllocationBasis: 'YouGov 2025: veterans services 73% increase, 4% decrease. Pew 2019: 72% increase, 4% decrease. YouGov 2024: VA 62% increase, 5% decrease.',
    estimatedCitizenAllocationSources: [
      { name: 'YouGov, government spending on 40 areas (Feb 2025)', url: 'https://d3nkl3psvxxpe9.cloudfront.net/documents/Government_Spending_poll_results_aM0fEtB.pdf' },
      { name: 'Pew Research Center, federal spending priorities (Apr 2019)', url: 'https://www.pewresearch.org/politics/2019/04/11/little-public-support-for-reductions-in-federal-spending/' },
      { name: 'YouGov, spending by federal agency (Sep 2024)', url: 'https://d3nkl3psvxxpe9.cloudfront.net/documents/Government_Spending_poll_results.pdf' },
    ],
    roiData: {
      source: 'Congressional Budget Office',
      ratio: 'Moral Obligation',
      description: 'VA delivers care at lower per-patient cost than private sector; suicide prevention and mental health ROI is incalculable',
      sourceUrl: 'https://www.cbo.gov/topics/veterans',
    },
    sources: [
      { name: 'VA — Budget and financial reports', url: 'https://www.va.gov/budget/' },
      { name: 'VA — National Veteran Suicide Prevention Annual Report (17.5/day)', url: 'https://www.mentalhealth.va.gov/docs/data-sheets/2023/2023-National-Veteran-Suicide-Prevention-Annual-Report-FINAL-508.pdf' },
      { name: 'VA OIG — Mental health wait times avg 36 days', url: 'https://www.va.gov/oig/pubs/VAOIG-23-01676-52.pdf' },
      { name: 'VA — 296K disability claims pending over 125 days', url: 'https://www.benefits.va.gov/reports/mmwr.asp' },
      { name: 'CBO — Veterans healthcare analysis', url: 'https://www.cbo.gov/topics/veterans' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'veterans', share: 1.0 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
  NASA_SCIENCE_RESEARCH: {
    slug: 'nasa_science',
    name: 'NASA & Science Research',
    description: 'NASA and the National Science Foundation. Funds space exploration, telescopes, particle physics, climate science, and basic research grants to universities. Technology developed under NASA contracts includes GPS, water purification systems, CAT scanners, and solar panels. SpaceX now launches rockets at a fraction of NASA\'s historical cost.',
    icon: '🚀',
    annualBudgetBillions: 33.2,
    budgetFiscalYear: 'FY2026 enacted',
    budgetSourceName: 'CRS R48643, Commerce-Justice-Science Appropriations FY2026, Table 1',
    budgetSourceUrl: 'https://www.everycrsreport.com/files/2026-02-25_R48643_5ab63e26141d07cabb8c7a7008f1b1844906000c.html',
    budgetDefinition: 'NASA $24.44B + National Science Foundation $8.75B.',
    estimatedCitizenAllocationPct: 4.9,
    estimatedCitizenAllocationRange: [3.5, 6.5],
    estimatedCitizenAllocationBasis: 'YouGov 2025: scientific research 54% increase, 11% decrease, but space exploration 28% increase, 27% decrease. Every Program for Public Consultation budget exercise trimmed NASA.',
    estimatedCitizenAllocationSources: [
      { name: 'YouGov, government spending on 40 areas (Feb 2025)', url: 'https://d3nkl3psvxxpe9.cloudfront.net/documents/Government_Spending_poll_results_aM0fEtB.pdf' },
      { name: 'YouGov, spending by federal agency (Sep 2024)', url: 'https://d3nkl3psvxxpe9.cloudfront.net/documents/Government_Spending_poll_results.pdf' },
      { name: 'Program for Public Consultation, Americans on the FY2025 Federal Budget (2025)', url: 'https://publicconsultation.org/wp-content/uploads/2025/07/Federal-Budget-REPORT-2025.pdf' },
    ],
    roiData: {
      source: 'NASA Economic Impact Report',
      ratio: '14:1',
      description: 'NASA generates $7-14 return per dollar through technology spinoffs, patents, and economic activity',
      sourceUrl: 'https://www.nasa.gov/directorates/somd/space-communications-navigation-program/economic-impact-of-nasas-space-communication-network/',
    },
    sources: [
      { name: 'NASA — Budget and annual reports', url: 'https://www.nasa.gov/budgets-plans-and-reports/' },
      { name: 'NSF — Budget overview', url: 'https://www.nsf.gov/about/budget/' },
      { name: 'NASA Spinoff — Technology transfer programme', url: 'https://spinoff.nasa.gov/' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'science', share: 0.6 },
      { fiscalCategoryId: 'other_discretionary', share: 0.4 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
  CLEAN_ENERGY_RD: {
    slug: 'clean_energy',
    name: 'Clean Energy R&D',
    description: 'DOE clean energy research, solar/wind/battery deployment grants, and national lab programmes. Solar is now 41% cheaper than the cheapest fossil fuel. Wind is 53% cheaper. The DOE loan programme funded both Solyndra ($535 million loss) and Tesla. The private sector now invests $300 billion per year in clean energy globally without government help.',
    icon: '⚡',
    annualBudgetBillions: 4.3,
    budgetFiscalYear: 'FY2026 enacted',
    budgetSourceName: 'CRS R48599, Energy and Water Development Appropriations FY2026, Table 8',
    budgetSourceUrl: 'https://www.everycrsreport.com/files/2026-03-25_R48599_fda58c2112f7ba1b98a0636a382dfa8d1b6d6d43.html',
    budgetDefinition: 'DOE efficiency and renewables $1.95B + nuclear energy $1.69B + ARPA-E $0.35B + electricity $0.24B + grid deployment and Indian energy $0.10B. Excludes one-time infrastructure-law advances and the Office of Science.',
    estimatedCitizenAllocationPct: 6.2,
    estimatedCitizenAllocationRange: [4.5, 7.5],
    estimatedCitizenAllocationBasis: 'Yale/George Mason 2026: 78% support funding renewable energy research. YouGov 2025: renewable energy 53% increase, 17% decrease. The only line Program for Public Consultation 2017 budgeters increased.',
    estimatedCitizenAllocationSources: [
      { name: 'Yale/George Mason, Climate Change in the American Mind: Politics and Policy (Spring 2026)', url: 'https://climatecommunication.gmu.edu/all/climate-change-in-the-american-mind-politics-and-policy-spring-2026/' },
      { name: 'YouGov, government spending on 40 areas (Feb 2025)', url: 'https://d3nkl3psvxxpe9.cloudfront.net/documents/Government_Spending_poll_results_aM0fEtB.pdf' },
      { name: 'Program for Public Consultation, federal budget exercise (2017)', url: 'https://publicconsultation.org/wp-content/uploads/reports/Federal_Budget_Report_May2018.pdf' },
    ],
    roiData: {
      source: 'IEA / IRENA',
      ratio: '8:1',
      description: 'Clean energy investment returns $3-8 per $1 in avoided climate damages; renewables now cheaper than fossil fuels',
      sourceUrl: 'https://www.irena.org/News/pressreleases/2025/Jul/91-Percent-of-New-Renewable-Projects-Now-Cheaper-Than-Fossil-Fuels-Alternatives',
    },
    sources: [
      { name: 'DOE — Budget justification', url: 'https://www.energy.gov/cfo/articles/fy-2025-budget-justification' },
      { name: 'IRENA — 91% of new renewables cheaper than fossil fuels', url: 'https://www.irena.org/News/pressreleases/2025/Jul/91-Percent-of-New-Renewable-Projects-Now-Cheaper-Than-Fossil-Fuels-Alternatives' },
      { name: 'IEA — World Energy Investment 2025', url: 'https://www.iea.org/reports/world-energy-investment-2025' },
    ],
    fiscalCategoryMappings: [
      { fiscalCategoryId: 'energy', share: 1.0 },
    ],
    type: 'existing' as const,
    jurisdictionCode: 'US',
  },
} as const;

export type USWishocraticItemId = keyof typeof US_WISHOCRATIC_ITEMS;

/**
 * Get all priority items as an array (useful for iteration)
 */
export function getUSWishocraticItemsList(): WishocraticItemDefinition[] {
  return Object.values(US_WISHOCRATIC_ITEMS);
}

/**
 * Calculate actual government allocation percentages from annual budgets.
 * Returns percentages that sum to 100%.
 */
export function getUSWishocraticAllocations(): Record<USWishocraticItemId, number> {
  const total = Object.values(US_WISHOCRATIC_ITEMS).reduce(
    (sum, item) => sum + item.annualBudgetBillions,
    0,
  );

  const allocations: Record<string, number> = {};
  for (const [id, item] of Object.entries(US_WISHOCRATIC_ITEMS)) {
    allocations[id] = Number(((item.annualBudgetBillions / total) * 100).toFixed(1));
  }

  return allocations as Record<USWishocraticItemId, number>;
}

export function getUSWishocraticSourceUrl(item: WishocraticItemDefinition): string | null {
  return item.roiData?.sourceUrl ?? item.sources[0]?.url ?? null;
}

export function buildUSWishocraticCatalogRecord(
  itemId: USWishocraticItemId,
): WishocraticCatalogRecord<USWishocraticItemId> {
  const item = US_WISHOCRATIC_ITEMS[itemId];
  const allocations = getUSWishocraticAllocations();

  return {
    id: itemId,
    jurisdictionCode: US_WISHOCRATIC_JURISDICTION.code,
    name: item.name,
    description: item.description,
    sourceUrl: getUSWishocraticSourceUrl(item),
    currentAllocationUsd: item.annualBudgetBillions * 1_000_000_000,
    currentAllocationPct: allocations[itemId],
  };
}

export function getUSWishocraticCatalogRecords(): Record<
  USWishocraticItemId,
  WishocraticCatalogRecord<USWishocraticItemId>
> {
  const allocations = getUSWishocraticAllocations();
  const records: Partial<
    Record<USWishocraticItemId, WishocraticCatalogRecord<USWishocraticItemId>>
  > = {};

  for (const [itemId, item] of Object.entries(US_WISHOCRATIC_ITEMS)) {
    const typedItemId = itemId as USWishocraticItemId;
    records[typedItemId] = {
      id: typedItemId,
      jurisdictionCode: US_WISHOCRATIC_JURISDICTION.code,
      name: item.name,
      description: item.description,
      sourceUrl: getUSWishocraticSourceUrl(item),
      currentAllocationUsd: item.annualBudgetBillions * 1_000_000_000,
      currentAllocationPct: allocations[typedItemId],
    };
  }

  return records as Record<
    USWishocraticItemId,
    WishocraticCatalogRecord<USWishocraticItemId>
  >;
}

