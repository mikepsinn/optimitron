/**
 * Evidence-Based US Policy Dataset
 *
 * Real policy proposals with cost estimates, evidence grades,
 * and estimated outcome effects based on published research.
 *
 * Evidence Grade Scale:
 * - A: Multiple high-quality RCTs or quasi-experiments with consistent results
 * - B: At least one RCT or strong quasi-experimental evidence
 * - C: Observational studies, regression discontinuity, or difference-in-differences
 * - D: Expert consensus, modeling/simulation, or limited empirical evidence
 *
 * Sources are cited per-policy. Cost estimates primarily from CBO,
 * agency estimates, or peer-reviewed economic analyses.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PolicyEffect {
  /** Outcome metric affected */
  metric: string;
  /** Direction of effect */
  direction: 'positive' | 'negative';
  /** Estimated magnitude (effect size, % change, or absolute change) */
  magnitude: number;
  /** Confidence in the estimate */
  confidence: 'high' | 'medium' | 'low';
}

export interface USPolicyData {
  /** Policy name */
  name: string;
  /** Budget category this primarily affects */
  category: string;
  /** Brief description */
  description: string;
  /** Estimated annual cost in billions USD (negative = saves money) */
  estimatedCost: number;
  /** Evidence grade (A-D) */
  evidenceGrade: string;
  /** Estimated effects on outcome metrics */
  outcomeEffects: PolicyEffect[];
  /** Published sources supporting the estimates */
  sources: string[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

export const US_POLICIES: USPolicyData[] = [
  // ─── Education ─────────────────────────────────────────────────────
  {
    name: 'Universal Pre-K (ages 3-4)',
    category: 'Education',
    description:
      'Provide publicly funded pre-kindergarten education for all 3- and 4-year-olds. ' +
      'The Perry Preschool Project and Abecedarian Project demonstrated long-term gains ' +
      'in educational attainment, earnings, and reduced crime.',
    estimatedCost: 26,
    evidenceGrade: 'A',
    outcomeEffects: [
      {
        metric: 'High school graduation rate',
        direction: 'positive',
        magnitude: 11,
        confidence: 'high',
      },
      {
        metric: 'Lifetime earnings',
        direction: 'positive',
        magnitude: 25,
        confidence: 'high',
      },
      {
        metric: 'Crime rate (violent)',
        direction: 'positive',
        magnitude: 20,
        confidence: 'medium',
      },
      {
        metric: 'Special education placement',
        direction: 'positive',
        magnitude: 47,
        confidence: 'high',
      },
    ],
    sources: [
      'Heckman, J.J. et al. (2010). The Rate of Return to the HighScope Perry Preschool Program. Journal of Public Economics.',
      'Campbell, F.A. et al. (2012). Adult outcomes as a function of an early childhood educational program: An Abecedarian Project follow-up. Developmental Psychology.',
      'CBO (2023). Estimate for Universal Pre-K Proposal.',
    ],
  },
  {
    name: 'Increase Pell Grant Maximum by 50%',
    category: 'Education',
    description:
      'Raise the maximum Pell Grant from ~$7,395 to ~$11,000 to cover a greater share ' +
      'of tuition at public colleges, increasing college access for low-income students.',
    estimatedCost: 19,
    evidenceGrade: 'B',
    outcomeEffects: [
      {
        metric: 'College enrollment rate (low-income)',
        direction: 'positive',
        magnitude: 8,
        confidence: 'medium',
      },
      {
        metric: 'College completion rate',
        direction: 'positive',
        magnitude: 5,
        confidence: 'medium',
      },
      {
        metric: 'Student loan debt (average)',
        direction: 'positive',
        magnitude: 12,
        confidence: 'high',
      },
    ],
    sources: [
      'Denning, J.T. et al. (2019). ProPelled: The Effects of Grants on Graduation, Earnings, and Welfare. AEJ: Applied Economics.',
      'CBO (2024). Options for Reducing the Deficit: Discretionary Spending.',
    ],
  },
  {
    name: 'Evidence-Based Tutoring Programs (K-12)',
    category: 'Education',
    description:
      'Fund high-dosage tutoring programs nationally, modeled on successful programs like ' +
      'Saga Education. Students receive 3+ hours/week of small-group or individual tutoring.',
    estimatedCost: 12,
    evidenceGrade: 'A',
    outcomeEffects: [
      {
        metric: 'Math proficiency (standardized test scores)',
        direction: 'positive',
        magnitude: 0.37,
        confidence: 'high',
      },
      {
        metric: 'Reading proficiency',
        direction: 'positive',
        magnitude: 0.25,
        confidence: 'high',
      },
      {
        metric: 'High school graduation rate',
        direction: 'positive',
        magnitude: 4,
        confidence: 'medium',
      },
    ],
    sources: [
      'Nickow, A. et al. (2020). The Impressive Effects of Tutoring on PreK-12 Learning: A Systematic Review and Meta-Analysis. NBER Working Paper.',
      'Cook, P.J. et al. (2014). The (Surprising) Efficacy of Academic and Behavioral Intervention with Disadvantaged Youth. NBER Working Paper.',
    ],
  },

  // ─── Healthcare ────────────────────────────────────────────────────
  {
    name: 'Medicare Drug Price Negotiation (Expanded)',
    category: 'Medicare',
    description:
      'Expand the Inflation Reduction Act drug negotiation provisions to cover ' +
      'more drugs sooner. CBO estimates savings from the current program; expansion ' +
      'would increase savings substantially.',
    estimatedCost: -35,
    evidenceGrade: 'B',
    outcomeEffects: [
      {
        metric: 'Medicare Part D spending per capita',
        direction: 'positive',
        magnitude: 15,
        confidence: 'high',
      },
      {
        metric: 'Out-of-pocket drug costs (seniors)',
        direction: 'positive',
        magnitude: 20,
        confidence: 'medium',
      },
    ],
    sources: [
      'CBO (2022). Estimated Budgetary Effects of H.R. 5376, the Inflation Reduction Act of 2022.',
      'RAND Corporation (2021). International Prescription Drug Price Comparisons.',
    ],
  },
  {
    name: 'Community Health Worker Expansion',
    category: 'Health (non-Medicare/Medicaid)',
    description:
      'Fund 50,000 community health workers in underserved areas to provide ' +
      'chronic disease management, preventive care coordination, and health education.',
    estimatedCost: 3.5,
    evidenceGrade: 'B',
    outcomeEffects: [
      {
        metric: 'Emergency department visits (preventable)',
        direction: 'positive',
        magnitude: 25,
        confidence: 'medium',
      },
      {
        metric: 'Chronic disease management (diabetes A1c)',
        direction: 'positive',
        magnitude: 0.5,
        confidence: 'high',
      },
      {
        metric: 'Healthcare costs (Medicaid per-member)',
        direction: 'positive',
        magnitude: 10,
        confidence: 'medium',
      },
    ],
    sources: [
      'Kangovi, S. et al. (2020). Effect of Community Health Worker Support on Clinical Outcomes. JAMA Internal Medicine.',
      'Brownstein, J.N. et al. (2007). Effectiveness of Community Health Workers. Am J Prev Med.',
    ],
  },
  {
    name: 'Substance Abuse Treatment Expansion (MAT)',
    category: 'Health (non-Medicare/Medicaid)',
    description:
      'Expand medication-assisted treatment (buprenorphine, methadone, naltrexone) ' +
      'access for opioid use disorder, eliminating treatment deserts.',
    estimatedCost: 6,
    evidenceGrade: 'A',
    outcomeEffects: [
      {
        metric: 'Opioid overdose deaths',
        direction: 'positive',
        magnitude: 30,
        confidence: 'high',
      },
      {
        metric: 'Emergency department visits (opioid-related)',
        direction: 'positive',
        magnitude: 25,
        confidence: 'high',
      },
      {
        metric: 'Criminal recidivism (substance-related)',
        direction: 'positive',
        magnitude: 20,
        confidence: 'medium',
      },
    ],
    sources: [
      'Wakeman, S.E. et al. (2020). Comparative Effectiveness of Different Treatment Pathways for Opioid Use Disorder. JAMA Network Open.',
      'National Academies of Sciences (2019). Medications for Opioid Use Disorder Save Lives.',
    ],
  },

  // ─── Infrastructure / Transportation ───────────────────────────────
  {
    name: 'Infrastructure Investment (Beyond IIJA)',
    category: 'Transportation',
    description:
      'Additional $50B/year in surface transportation infrastructure investment ' +
      'beyond the Infrastructure Investment and Jobs Act. ASCE estimates a $2.6T ' +
      'infrastructure gap over the next decade.',
    estimatedCost: 50,
    evidenceGrade: 'B',
    outcomeEffects: [
      {
        metric: 'Infrastructure grade (ASCE)',
        direction: 'positive',
        magnitude: 10,
        confidence: 'medium',
      },
      {
        metric: 'Traffic fatalities',
        direction: 'positive',
        magnitude: 8,
        confidence: 'medium',
      },
      {
        metric: 'GDP growth (from multiplier effects)',
        direction: 'positive',
        magnitude: 0.3,
        confidence: 'medium',
      },
      {
        metric: 'Jobs created/year',
        direction: 'positive',
        magnitude: 400000,
        confidence: 'medium',
      },
    ],
    sources: [
      'American Society of Civil Engineers (2021). A Comprehensive Assessment of America\'s Infrastructure.',
      'CBO (2016). The Macroeconomic and Budgetary Effects of Federal Investment.',
      'Bivens, J. (2017). The Potential Macroeconomic Benefits from Increasing Infrastructure Investment. EPI.',
    ],
  },
  {
    name: 'Lead Pipe Replacement Program',
    category: 'EPA / Environment',
    description:
      'Accelerate replacement of all remaining lead service lines (~9.2 million) ' +
      'in US drinking water systems. Lead exposure causes irreversible cognitive damage in children.',
    estimatedCost: 5,
    evidenceGrade: 'A',
    outcomeEffects: [
      {
        metric: 'Childhood blood lead levels',
        direction: 'positive',
        magnitude: 75,
        confidence: 'high',
      },
      {
        metric: 'IQ points preserved (children)',
        direction: 'positive',
        magnitude: 3,
        confidence: 'high',
      },
      {
        metric: 'Crime rate (violent, long-term)',
        direction: 'positive',
        magnitude: 10,
        confidence: 'medium',
      },
    ],
    sources: [
      'Rau, T. et al. (2020). The Long-term Effects of Early Lead Exposure: Evidence from a Case of Environmental Negligence. NBER Working Paper.',
      'Gazze, L. et al. (2021). The Economic Benefits of Reducing Lead Exposures. EPA Science Advisory Board.',
      'EPA (2024). Lead and Copper Rule Improvements.',
    ],
  },

  // ─── Energy / Environment ──────────────────────────────────────────
  {
    name: 'Renewable Energy Tax Credit Extension',
    category: 'Energy',
    description:
      'Extend production and investment tax credits (PTC/ITC) for renewable energy ' +
      'beyond current IRA provisions. DOE estimates this accelerates the clean energy transition.',
    estimatedCost: 15,
    evidenceGrade: 'B',
    outcomeEffects: [
      {
        metric: 'Renewable energy share of electricity',
        direction: 'positive',
        magnitude: 8,
        confidence: 'high',
      },
      {
        metric: 'CO₂ emissions (energy-related)',
        direction: 'positive',
        magnitude: 5,
        confidence: 'medium',
      },
      {
        metric: 'Clean energy jobs',
        direction: 'positive',
        magnitude: 200000,
        confidence: 'medium',
      },
    ],
    sources: [
      'DOE (2023). Investing in American Energy: Significant Impacts of the IRA and BIL.',
      'Metcalf, G.E. (2019). On the Economics of a Carbon Tax for the United States. Brookings Papers on Economic Activity.',
    ],
  },
  {
    name: 'Carbon Fee and Dividend',
    category: 'EPA / Environment',
    description:
      'Implement a carbon fee starting at $25/ton CO₂, rising $10/year, with revenue ' +
      'returned as equal dividends to all US households. Revenue-neutral by design.',
    estimatedCost: 0,
    evidenceGrade: 'C',
    outcomeEffects: [
      {
        metric: 'CO₂ emissions',
        direction: 'positive',
        magnitude: 30,
        confidence: 'medium',
      },
      {
        metric: 'Revenue generated (year 1)',
        direction: 'positive',
        magnitude: 125,
        confidence: 'medium',
      },
      {
        metric: 'Household income (bottom quintile)',
        direction: 'positive',
        magnitude: 1.3,
        confidence: 'medium',
      },
    ],
    sources: [
      'Resources for the Future (2020). Carbon Pricing Calculator.',
      'Citizens\' Climate Lobby (2019). Household Impact Study (Columbia SIPA).',
      'CBO (2022). Effects of a Carbon Tax on the Economy and the Environment.',
    ],
  },

  // ─── Tax & Income Security ─────────────────────────────────────────
  {
    name: 'Expand Earned Income Tax Credit (EITC)',
    category: 'Other Mandatory Programs',
    description:
      'Expand EITC for childless workers (raise max from ~$600 to ~$1,500) and ' +
      'extend age range. The EITC is one of the most effective anti-poverty programs.',
    estimatedCost: 15,
    evidenceGrade: 'A',
    outcomeEffects: [
      {
        metric: 'Poverty rate (working-age)',
        direction: 'positive',
        magnitude: 8,
        confidence: 'high',
      },
      {
        metric: 'Labor force participation (low-income)',
        direction: 'positive',
        magnitude: 5,
        confidence: 'high',
      },
      {
        metric: 'Child poverty rate',
        direction: 'positive',
        magnitude: 3,
        confidence: 'medium',
      },
    ],
    sources: [
      'Hoynes, H.W. & Patel, A.J. (2018). Effective Policy for Reducing Poverty and Inequality? The EITC and the Distribution of Income. Journal of Human Resources.',
      'IRS (2024). EITC Statistics.',
      'Marr, C. et al. (2023). Robust EITC Expansion Would Help Working People. CBPP.',
    ],
  },
  {
    name: 'Permanent Child Tax Credit Expansion',
    category: 'Other Mandatory Programs',
    description:
      'Make the 2021 expanded CTC ($3,600/$3,000 per child, fully refundable, monthly payments) ' +
      'permanent. During 2021, child poverty fell to a historic low of 5.2%.',
    estimatedCost: 105,
    evidenceGrade: 'A',
    outcomeEffects: [
      {
        metric: 'Child poverty rate',
        direction: 'positive',
        magnitude: 40,
        confidence: 'high',
      },
      {
        metric: 'Food insecurity (children)',
        direction: 'positive',
        magnitude: 26,
        confidence: 'high',
      },
      {
        metric: 'Material hardship (inability to pay bills)',
        direction: 'positive',
        magnitude: 15,
        confidence: 'high',
      },
    ],
    sources: [
      'Parolin, Z. et al. (2022). The Effects of the Monthly Advance CTC Payments on Food Hardship. NBER Working Paper.',
      'Census Bureau (2022). Income and Poverty in the United States: 2021.',
      'CBO (2022). Options for Reducing the Deficit: Spending and Revenue Options.',
    ],
  },

  // ─── Housing ───────────────────────────────────────────────────────
  {
    name: 'Housing First Expansion',
    category: 'HUD / Housing',
    description:
      'Scale up Housing First programs nationally, providing permanent housing to ' +
      'chronically homeless individuals with wraparound services. Multiple RCTs show ' +
      'cost savings through reduced ER visits, hospitalizations, and incarceration.',
    estimatedCost: 8,
    evidenceGrade: 'A',
    outcomeEffects: [
      {
        metric: 'Chronic homelessness',
        direction: 'positive',
        magnitude: 40,
        confidence: 'high',
      },
      {
        metric: 'Emergency department visits (homeless)',
        direction: 'positive',
        magnitude: 58,
        confidence: 'high',
      },
      {
        metric: 'Hospitalizations (homeless)',
        direction: 'positive',
        magnitude: 32,
        confidence: 'high',
      },
      {
        metric: 'Net cost per person (vs. status quo)',
        direction: 'positive',
        magnitude: 23000,
        confidence: 'medium',
      },
    ],
    sources: [
      'Tsemberis, S. et al. (2004). Housing First, Consumer Choice, and Harm Reduction for Homeless Individuals. American Journal of Public Health.',
      'Stergiopoulos, V. et al. (2015). Effect of Scattered-Site Housing Using Rent Supplements and Intensive Case Management on Housing Stability. JAMA.',
      'Culhane, D.P. (2008). The Cost of Homelessness: A Perspective from the United States. European Journal of Homelessness.',
    ],
  },
  {
    name: 'Low-Income Housing Tax Credit Expansion',
    category: 'HUD / Housing',
    description:
      'Increase LIHTC allocation by 50%, generating an estimated 300,000+ additional ' +
      'affordable housing units over 10 years.',
    estimatedCost: 8,
    evidenceGrade: 'C',
    outcomeEffects: [
      {
        metric: 'Affordable housing units built/year',
        direction: 'positive',
        magnitude: 30000,
        confidence: 'medium',
      },
      {
        metric: 'Housing cost burden',
        direction: 'positive',
        magnitude: 3,
        confidence: 'low',
      },
      {
        metric: 'Homelessness (total)',
        direction: 'positive',
        magnitude: 5,
        confidence: 'low',
      },
    ],
    sources: [
      'National Council of State Housing Agencies (2023). LIHTC Impact Report.',
      'CBO (2023). The Federal Role in the Housing Market.',
    ],
  },

  // ─── Justice / Public Safety ───────────────────────────────────────
  {
    name: 'Body Camera Mandate (Federal Law Enforcement)',
    category: 'Justice / Law Enforcement',
    description:
      'Mandate body-worn cameras for all federal law enforcement officers. ' +
      'The NYPD randomized trial found significant reductions in complaints and use-of-force.',
    estimatedCost: 1.5,
    evidenceGrade: 'B',
    outcomeEffects: [
      {
        metric: 'Civilian complaints against officers',
        direction: 'positive',
        magnitude: 25,
        confidence: 'high',
      },
      {
        metric: 'Use-of-force incidents',
        direction: 'positive',
        magnitude: 12,
        confidence: 'medium',
      },
      {
        metric: 'Prosecution/conviction rates',
        direction: 'positive',
        magnitude: 5,
        confidence: 'low',
      },
    ],
    sources: [
      'Yokum, D. et al. (2019). Evaluating the Effects of Police Body-Worn Cameras: A Randomized Controlled Trial. Journal of Experimental Criminology.',
      'Ariel, B. et al. (2015). The Effect of Police Body-Worn Cameras on Use of Force. Journal of Criminal Law & Criminology.',
    ],
  },
  {
    name: 'Evidence-Based Reentry Programs',
    category: 'Justice / Law Enforcement',
    description:
      'Fund cognitive behavioral therapy, job training, and transitional support ' +
      'for federal inmates prior to and after release. Evidence shows strong ROI ' +
      'through reduced recidivism.',
    estimatedCost: 3,
    evidenceGrade: 'A',
    outcomeEffects: [
      {
        metric: 'Recidivism rate (3-year)',
        direction: 'positive',
        magnitude: 15,
        confidence: 'high',
      },
      {
        metric: 'Employment (post-release)',
        direction: 'positive',
        magnitude: 20,
        confidence: 'medium',
      },
      {
        metric: 'Incarceration costs saved',
        direction: 'positive',
        magnitude: 2.5,
        confidence: 'medium',
      },
    ],
    sources: [
      'RAND Corporation (2013). Evaluating the Effectiveness of Correctional Education. A Meta-Analysis.',
      'Council of Economic Advisers (2016). Economic Perspectives on Incarceration and the Criminal Justice System.',
      'Durose, M.R. et al. (2014). Recidivism of Prisoners Released in 30 States. Bureau of Justice Statistics.',
    ],
  },

  // ─── Science & Technology ──────────────────────────────────────────
  {
    name: 'Double NIH Funding',
    category: 'Health (non-Medicare/Medicaid)',
    description:
      'Increase NIH budget from ~$48B to ~$96B over 5 years. Historical analysis ' +
      'shows NIH-funded research has massive social returns, estimated at 43% per year.',
    estimatedCost: 48,
    evidenceGrade: 'B',
    outcomeEffects: [
      {
        metric: 'Biomedical publications',
        direction: 'positive',
        magnitude: 40,
        confidence: 'high',
      },
      {
        metric: 'Drug approvals (FDA)',
        direction: 'positive',
        magnitude: 15,
        confidence: 'medium',
      },
      {
        metric: 'Life expectancy (long-term)',
        direction: 'positive',
        magnitude: 0.5,
        confidence: 'low',
      },
      {
        metric: 'Social rate of return',
        direction: 'positive',
        magnitude: 43,
        confidence: 'medium',
      },
    ],
    sources: [
      'Azoulay, P. et al. (2019). Public R&D Investments and Private-Sector Patenting. NBER Working Paper.',
      'Toole, A.A. (2012). The Impact of Public Basic Research on Industrial Innovation. Research Policy.',
      'Jones, B.F. & Summers, L.H. (2020). A Calculation of the Social Returns to Innovation. NBER Working Paper.',
    ],
  },
  {
    name: 'ARPA-H Full Funding (Health Innovation)',
    category: 'Science / NASA',
    description:
      'Fully fund the Advanced Research Projects Agency for Health at $6.5B/year ' +
      'to pursue breakthrough health technologies, modeled on DARPA\'s success.',
    estimatedCost: 6.5,
    evidenceGrade: 'C',
    outcomeEffects: [
      {
        metric: 'Breakthrough medical technologies',
        direction: 'positive',
        magnitude: 10,
        confidence: 'low',
      },
      {
        metric: 'Cancer detection rate (early-stage)',
        direction: 'positive',
        magnitude: 5,
        confidence: 'low',
      },
    ],
    sources: [
      'Azoulay, P. et al. (2019). Funding Breakthrough Research: Promises and Challenges of the ARPA Model. NBER Innovation Policy.',
      'ARPA-H (2024). Strategic Plan and Investment Framework.',
    ],
  },

  // ─── Military ───────────────────────────────────────────────────────
  {
    name: 'Military Housing Quality Standards',
    category: 'Military',
    description:
      'Enforce mandatory quality standards for privatized military family housing ' +
      'and fund $3B in remediation. GAO investigations found widespread health hazards.',
    estimatedCost: 3,
    evidenceGrade: 'C',
    outcomeEffects: [
      {
        metric: 'Military family housing satisfaction',
        direction: 'positive',
        magnitude: 30,
        confidence: 'medium',
      },
      {
        metric: 'Military retention rate',
        direction: 'positive',
        magnitude: 3,
        confidence: 'low',
      },
    ],
    sources: [
      'GAO (2020). Military Housing: DOD Needs to Strengthen Oversight and Accountability. GAO-20-281.',
      'Military Family Advisory Network (2023). Annual Survey of Military Families.',
    ],
  },

  // ─── Veterans Affairs ──────────────────────────────────────────────
  {
    name: 'Veteran Suicide Prevention Expansion',
    category: 'Veterans Affairs',
    description:
      'Expand VA suicide prevention outreach to all veterans (not just VA-enrolled), ' +
      'fund crisis intervention teams and lethal means safety programs.',
    estimatedCost: 2.5,
    evidenceGrade: 'B',
    outcomeEffects: [
      {
        metric: 'Veteran suicide rate',
        direction: 'positive',
        magnitude: 15,
        confidence: 'medium',
      },
      {
        metric: 'Veterans receiving mental health care',
        direction: 'positive',
        magnitude: 25,
        confidence: 'medium',
      },
    ],
    sources: [
      'VA Office of Mental Health and Suicide Prevention (2023). National Veteran Suicide Prevention Annual Report.',
      'Preventing Veteran Suicide: A Consensus Statement. American Journal of Preventive Medicine (2022).',
    ],
  },

  // ─── Agriculture / Food ────────────────────────────────────────────
  {
    name: 'SNAP Benefit Increase (15%)',
    category: 'Agriculture',
    description:
      'Permanently increase SNAP benefits by 15% above the Thrifty Food Plan. ' +
      'The temporary 15% increase during COVID reduced food insecurity significantly ' +
      'and generated $1.50+ in economic activity per $1 spent.',
    estimatedCost: 14,
    evidenceGrade: 'A',
    outcomeEffects: [
      {
        metric: 'Food insecurity rate',
        direction: 'positive',
        magnitude: 20,
        confidence: 'high',
      },
      {
        metric: 'GDP multiplier',
        direction: 'positive',
        magnitude: 1.54,
        confidence: 'high',
      },
      {
        metric: 'Healthcare costs (diet-related)',
        direction: 'positive',
        magnitude: 5,
        confidence: 'medium',
      },
    ],
    sources: [
      'USDA (2019). The Supplemental Nutrition Assistance Program (SNAP) Fiscal Multiplier.',
      'Schanzenbach, D.W. et al. (2016). Food Stamps and Adult Health Outcomes. NBER Working Paper.',
      'Bitler, M.P. (2015). The Health and Nutrition Effects of SNAP. Brookings Papers on Economic Activity.',
    ],
  },

  // ─── Social Security ──────────────────────────────────────────────
  {
    name: 'Social Security Solvency: Raise Payroll Tax Cap',
    category: 'Social Security',
    description:
      'Apply Social Security payroll tax to earnings above $250,000 (currently capped at $168,600). ' +
      'This would close approximately 73% of the long-term financing shortfall.',
    estimatedCost: -95,
    evidenceGrade: 'C',
    outcomeEffects: [
      {
        metric: 'Trust fund depletion year',
        direction: 'positive',
        magnitude: 15,
        confidence: 'medium',
      },
      {
        metric: 'Long-term actuarial deficit closed',
        direction: 'positive',
        magnitude: 73,
        confidence: 'high',
      },
    ],
    sources: [
      'SSA Office of the Chief Actuary (2024). Provisions Affecting Trust Fund Solvency.',
      'CBO (2023). Options for Reducing the Deficit: 2023-2032.',
    ],
  },

  // ─── IRS / Revenue ────────────────────────────────────────────────
  {
    name: 'IRS Enforcement Funding (Sustained)',
    category: 'Treasury / General Government',
    description:
      'Sustain increased IRS funding ($80B over 10 years) for enforcement, ' +
      'focusing on high-income/corporate audits. CBO estimates $4+ return per $1 spent.',
    estimatedCost: -200,
    evidenceGrade: 'B',
    outcomeEffects: [
      {
        metric: 'Tax gap reduction',
        direction: 'positive',
        magnitude: 30,
        confidence: 'medium',
      },
      {
        metric: 'Revenue generated per $1 invested',
        direction: 'positive',
        magnitude: 4,
        confidence: 'high',
      },
      {
        metric: 'Audit rate (high-income)',
        direction: 'positive',
        magnitude: 50,
        confidence: 'medium',
      },
    ],
    sources: [
      'CBO (2023). The Effects of Increased Funding for the IRS.',
      'Sarin, N. & Summers, L. (2020). Understanding the Revenue Potential of Tax Compliance Investment. NBER Tax Policy & the Economy.',
    ],
  },

  // ─── Foreign Aid / Global Health ──────────────────────────────────
  {
    name: 'Global Malaria Eradication Push',
    category: 'Foreign Aid / International Affairs',
    description:
      'Double US contribution to the Global Fund and bilateral malaria programs. ' +
      'Malaria kills ~600K/year globally; bed nets cost ~$2-3 per net and prevent ~50% of cases.',
    estimatedCost: 3,
    evidenceGrade: 'A',
    outcomeEffects: [
      {
        metric: 'Malaria deaths globally',
        direction: 'positive',
        magnitude: 30,
        confidence: 'high',
      },
      {
        metric: 'DALYs averted per $1000 spent',
        direction: 'positive',
        magnitude: 50,
        confidence: 'high',
      },
      {
        metric: 'Economic output (endemic countries)',
        direction: 'positive',
        magnitude: 1.3,
        confidence: 'medium',
      },
    ],
    sources: [
      'Lancet Commission on Malaria Eradication (2019). Malaria eradication within a generation.',
      'GiveWell (2024). Against Malaria Foundation Cost-Effectiveness Analysis.',
      'Global Fund (2023). Results Report.',
    ],
  },
  {
    name: 'PEPFAR Reauthorization and Expansion',
    category: 'Foreign Aid / International Affairs',
    description:
      'Reauthorize and expand PEPFAR by 20%. PEPFAR is among the most successful ' +
      'foreign aid programs ever, having saved an estimated 25 million lives since 2003.',
    estimatedCost: 1.4,
    evidenceGrade: 'A',
    outcomeEffects: [
      {
        metric: 'HIV/AIDS-related deaths (supported countries)',
        direction: 'positive',
        magnitude: 10,
        confidence: 'high',
      },
      {
        metric: 'New HIV infections',
        direction: 'positive',
        magnitude: 8,
        confidence: 'high',
      },
      {
        metric: 'People on antiretroviral therapy',
        direction: 'positive',
        magnitude: 15,
        confidence: 'high',
      },
    ],
    sources: [
      'PEPFAR (2024). PEPFAR Strategy: Fulfilling America\'s Promise to End the HIV/AIDS Pandemic by 2030.',
      'Bendavid, E. et al. (2012). HIV Development Assistance and Adult Mortality in Africa. JAMA.',
    ],
  },

  // ─── Labor / Workforce ────────────────────────────────────────────
  {
    name: 'Apprenticeship Expansion Program',
    category: 'Labor',
    description:
      'Fund expansion of registered apprenticeship programs to 1 million new apprentices/year. ' +
      'Apprenticeships yield average returns of $1.47 per $1 invested to employers.',
    estimatedCost: 5,
    evidenceGrade: 'B',
    outcomeEffects: [
      {
        metric: 'Average lifetime earnings (participants)',
        direction: 'positive',
        magnitude: 240000,
        confidence: 'medium',
      },
      {
        metric: 'Completion rate',
        direction: 'positive',
        magnitude: 90,
        confidence: 'medium',
      },
      {
        metric: 'Youth unemployment rate',
        direction: 'positive',
        magnitude: 5,
        confidence: 'medium',
      },
    ],
    sources: [
      'Reed, D. et al. (2012). An Effectiveness Assessment and Cost-Benefit Analysis of Registered Apprenticeship. Mathematica Policy Research.',
      'DOL (2023). Apprenticeship Evidence-Building Portfolio.',
    ],
  },

  // ─── Homeland Security ────────────────────────────────────────────
  {
    name: 'FEMA Pre-Disaster Mitigation Grants (Triple)',
    category: 'Homeland Security',
    description:
      'Triple FEMA pre-disaster mitigation grants to $2B/year. NIBS studies show ' +
      'mitigation saves $6 per $1 invested through avoided disaster losses.',
    estimatedCost: 1.3,
    evidenceGrade: 'B',
    outcomeEffects: [
      {
        metric: 'Disaster relief costs',
        direction: 'positive',
        magnitude: 20,
        confidence: 'medium',
      },
      {
        metric: 'Lives saved per year (disasters)',
        direction: 'positive',
        magnitude: 100,
        confidence: 'low',
      },
      {
        metric: 'Return on investment (benefit-cost ratio)',
        direction: 'positive',
        magnitude: 6,
        confidence: 'high',
      },
    ],
    sources: [
      'National Institute of Building Sciences (2019). Natural Hazard Mitigation Saves: 2019 Report.',
      'FEMA (2023). Building Resilient Infrastructure and Communities (BRIC) Annual Report.',
    ],
  },

  // ─── Medicare / Medicaid ──────────────────────────────────────────
  {
    name: 'Medicaid Expansion in Remaining States',
    category: 'Medicaid',
    description:
      'Incentivize the 10 remaining non-expansion states to adopt Medicaid expansion ' +
      'through enhanced federal matching. Would cover ~4 million uninsured adults.',
    estimatedCost: 18,
    evidenceGrade: 'A',
    outcomeEffects: [
      {
        metric: 'Uninsured rate',
        direction: 'positive',
        magnitude: 10,
        confidence: 'high',
      },
      {
        metric: 'Mortality rate (low-income adults)',
        direction: 'positive',
        magnitude: 6,
        confidence: 'high',
      },
      {
        metric: 'Hospital uncompensated care',
        direction: 'positive',
        magnitude: 30,
        confidence: 'high',
      },
      {
        metric: 'Rural hospital closures',
        direction: 'positive',
        magnitude: 62,
        confidence: 'medium',
      },
    ],
    sources: [
      'Miller, S. & Wherry, L.R. (2019). Four Years Later: Insurance Coverage and Access to Care After the ACA\'s Medicaid Expansions. AEJ: Applied Economics.',
      'Borgschulte, M. & Vogler, J. (2020). Did the ACA Medicaid Expansion Save Lives? Journal of Health Economics.',
      'KFF (2024). Status of State Medicaid Expansion Decisions.',
    ],
  },
];

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Get all policies for a given category (case-insensitive partial match).
 */
export function getPoliciesByCategory(category: string): USPolicyData[] {
  const lower = category.toLowerCase();
  return US_POLICIES.filter((p) => p.category.toLowerCase().includes(lower));
}

/**
 * Get policies by evidence grade (e.g. "A" returns only A-grade policies).
 */
export function getPoliciesByGrade(grade: string): USPolicyData[] {
  return US_POLICIES.filter(
    (p) => p.evidenceGrade.toUpperCase() === grade.toUpperCase(),
  );
}

/**
 * Get policies that save money (negative cost).
 */
export function getRevenuePolicies(): USPolicyData[] {
  return US_POLICIES.filter((p) => p.estimatedCost < 0);
}

/**
 * Calculate total annual cost of all policies.
 */
export function getTotalPolicyCost(): number {
  return US_POLICIES.reduce((sum, p) => sum + p.estimatedCost, 0);
}

/**
 * Get the total number of unique source citations across all policies.
 */
export function getTotalSourceCount(): number {
  const allSources = US_POLICIES.flatMap((p) => p.sources);
  return new Set(allSources).size;
}
