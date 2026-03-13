export const BUDGET_CATEGORIES = {
  // HIGH-ROI INVESTMENTS
  PRAGMATIC_CLINICAL_TRIALS: {
    id: 'pragmatic_clinical_trials',
    name: 'Pragmatic Clinical Trials',
    description: 'Your species spends $4.7 trillion a year on healthcare but allocates roughly $1 billion to figuring out which treatments actually work. That is like buying 4.7 million cars and spending $1 on a mechanic. Pragmatic trials test drugs in real patients, in real hospitals, and produce answers in months instead of decades.',
    icon: '🔬',
    annualBudget: 1, // $1B (should be much higher)
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
  },
  ADDICTION_TREATMENT: {
    id: 'addiction_treatment',
    name: 'Addiction Treatment Programs',
    description: 'Every dollar spent on evidence-based treatment saves seven in healthcare and criminal justice costs. Instead, you spend most of the money arresting people for being ill and then acting surprised when they relapse in prison. Harm reduction, medication-assisted treatment, and recovery support actually work. Weird how that keeps not mattering.',
    icon: '🏥',
    annualBudget: 10, // $10B (needs $35B)
    roiData: {
      source: 'NIDA Research',
      ratio: '7:1',
      description: 'Every $1 spent on treatment saves $7 in healthcare and criminal justice costs',
      sourceUrl: 'https://nida.nih.gov/publications/principles-drug-addiction-treatment-research-based-guide-third-edition/frequently-asked-questions/drug-addiction-treatment-worth-its-cost',
    },
    sources: [
      { name: 'NIDA — Treatment is cost-effective (7:1 ROI)', url: 'https://nida.nih.gov/publications/principles-drug-addiction-treatment-research-based-guide-third-edition/frequently-asked-questions/drug-addiction-treatment-worth-its-cost' },
      { name: 'SAMHSA — 2023 National Survey on Drug Use and Health', url: 'https://www.samhsa.gov/data/data-we-collect/nsduh-national-survey-drug-use-and-health/national-releases/2023' },
    ],
  },
  EARLY_CHILDHOOD_EDUCATION: {
    id: 'early_childhood_ed',
    name: 'Early Childhood Education',
    description: 'The Heckman Equation shows $13 returned for every $1 invested in quality early childhood programs. Pre-K, Head Start, and childcare subsidies produce measurable gains in earnings, health, and reduced crime for decades. On my planet we consider failing to invest in children a form of economic self-harm. Here you call it "fiscal responsibility."',
    icon: '👶',
    annualBudget: 10, // $10B
    roiData: {
      source: 'Heckman Equation',
      ratio: '13:1',
      description: 'High-quality early childhood programs return $13 per dollar through better outcomes',
      sourceUrl: 'https://heckmanequation.org/resource/13-roi-toolbox/',
    },
    sources: [
      { name: 'Heckman Equation — 13:1 ROI Toolbox', url: 'https://heckmanequation.org/resource/13-roi-toolbox/' },
    ],
  },
  CYBERSECURITY: {
    id: 'cybersecurity',
    name: 'Cybersecurity & Infrastructure Protection',
    description: 'You spend $886 billion a year on defence but less than 0.4% of that protecting the power grids, water systems, and hospitals that your entire civilisation depends on. Ransomware gangs are shutting down hospitals and pipelines while the military buys another aircraft carrier. It is like fitting seventeen deadbolts on the front door and leaving every window wide open.',
    icon: '🔐',
    annualBudget: 3, // ~$3B/yr
    roiData: {
      source: 'CISA / GAO Reports',
      ratio: '20:1',
      description: 'Cybersecurity investment prevents cascading infrastructure failures costing orders of magnitude more',
      sourceUrl: 'https://www.cisa.gov/topics/cybersecurity-best-practices',
    },
    sources: [
      { name: 'CISA — Cybersecurity Best Practices', url: 'https://www.cisa.gov/topics/cybersecurity-best-practices' },
      { name: 'GAO — Critical Infrastructure Protection', url: 'https://www.gao.gov/products/gao-23-106441' },
    ],
  },

  // WASTEFUL/LOW-ROI SPENDING
  DRUG_WAR_ENFORCEMENT: {
    id: 'drug_war',
    name: 'Drug War Enforcement',
    description: 'Fifty-plus years. Over one trillion dollars. Overdose deaths went from 6,100 per year in 1980 to 110,000 in 2023 — an 18x increase. Drug use rates are essentially unchanged. The number of people imprisoned for drug offences rose from 24,000 to 300,000. Meanwhile Portugal decriminalised everything in 2001 and drug deaths dropped 80%, HIV among users fell 95%. Pew Research found zero statistical relationship between drug imprisonment rates and drug use. You are funding the longest-running policy failure in recorded history.',
    icon: '🚔',
    annualBudget: 50, // $50B+
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
    ],
  },
  ICE_IMMIGRATION_ENFORCEMENT: {
    id: 'ice',
    name: 'Mass Immigrant Detention Camps',
    description: 'It costs $150-$200 per day to detain one person — $55,000-$73,000 per year. Alternatives to detention cost $4.50/day with 90%+ court appearance rates. Immigrants are 60% less likely to be incarcerated than US-born citizens. Cato Institute found immigrants created a cumulative fiscal surplus of $14.5 trillion from 1994-2023 — every single year they paid more in taxes than they received. Undocumented immigrants alone pay $96.7 billion in taxes annually while being barred from collecting benefits. The CBO projects immigration reduces federal deficits by $0.9 trillion over 2024-2034. You are spending premium prices to remove people who subsidise your government.',
    icon: '🚨',
    annualBudget: 14, // $14B (up from $9B; $45B committed through 2029)
    roiData: {
      source: 'Cato Institute / CBO',
      ratio: 'Negative ROI',
      description: 'Immigrants created $14.5T fiscal surplus (1994-2023); deportation reduces GDP and tax revenue',
      sourceUrl: 'https://www.cato.org/white-paper/immigrants-recent-effects-government-budgets-1994-2023',
    },
    sources: [
      { name: 'Cato Institute — Immigrants reduced deficits by $14.5 trillion (1994-2023)', url: 'https://www.cato.org/white-paper/immigrants-recent-effects-government-budgets-1994-2023' },
      { name: 'CBO — Immigration surge reduces deficits by $0.9 trillion (2024-2034)', url: 'https://www.cbo.gov/publication/60569' },
      { name: 'ITEP — Undocumented immigrants paid $96.7B in taxes (2022)', url: 'https://itep.org/undocumented-immigrants-taxes-2024/' },
      { name: 'PNAS — Undocumented immigrants half as likely to be arrested for violent crime', url: 'https://www.pnas.org/doi/10.1073/pnas.2014704117' },
      { name: 'National Immigration Forum — Detention costs $152-$165/day vs $4.50/day alternatives', url: 'https://forumtogether.org/article/immigration-detention-costs-in-a-time-of-mass-deportation/' },
      { name: 'American Immigration Council — ICE/CBP budget tripled since 2003', url: 'https://www.americanimmigrationcouncil.org/fact-sheet/the-cost-of-immigration-enforcement-and-border-security/' },
      { name: 'Penn Wharton — Mass deportation GDP impact analysis', url: 'https://budgetmodel.wharton.upenn.edu/issues/2025/7/28/mass-deportation-of-unauthorized-immigrants-fiscal-and-economic-effects' },
    ],
  },
  FARM_SUBSIDIES_AGRIBUSINESS: {
    id: 'farm_subsidies',
    name: 'Agribusiness Subsidies',
    description: 'Seventy-five percent of farm subsidies go to the top 10% of farms, which are mostly enormous corporations that do not need the help. The programme promotes monoculture, damages the environment, and crowds out the small farms your politicians claim to be protecting. It is corporate welfare wearing a straw hat.',
    icon: '🌽',
    annualBudget: 20, // $20B
    roiData: {
      source: 'EWG Analysis',
      ratio: 'Low ROI',
      description: '75% of subsidies go to top 10% of farms; promotes monoculture and environmental damage',
      sourceUrl: 'https://www.ewg.org/research/farm-subsidies',
    },
    sources: [
      { name: 'EWG — Farm subsidy distribution analysis', url: 'https://www.ewg.org/research/farm-subsidies' },
    ],
  },
  FOSSIL_FUEL_SUBSIDIES: {
    id: 'fossil_fuel_subsidies',
    name: 'Fossil Fuel Subsidies',
    description: 'You are paying $34.8 billion a year in direct subsidies to companies that posted $150 billion in combined profits in 2022. Solar is now 41% cheaper than the cheapest fossil fuel. Wind is 53% cheaper. 91% of new renewable projects undercut fossil fuels on cost. Climate damages already cost the US $240 billion per year — $7 in damage for every $1 in subsidy. You are paying companies to make the planet uninhabitable when the cheaper alternative is already sitting right there.',
    icon: '🛢️',
    annualBudget: 20, // $20B
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
  },
  NUCLEAR_WEAPONS_MODERNIZATION: {
    id: 'nuclear_weapons',
    name: 'Nuclear Weapons Development',
    description: 'You have 3,700 stockpiled warheads. Defence analysts agree 200-311 provide full deterrence. The UK deters with 200. The 30-year modernisation plan costs $1.7 trillion. The Sentinel ICBM programme is 81% over budget at $141 billion. Research shows just 100 detonations would trigger nuclear winter and kill 5 billion people from famine. You are spending $60 billion a year to go from "can end civilisation 10 times" to "can end it 11 times."',
    icon: '☢️',
    annualBudget: 60, // $60B
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
  },
  PRISON_CONSTRUCTION: {
    id: 'prisons',
    name: 'Prison Construction & Operations',
    description: 'The US went from 360,000 inmates in the 1970s to 2.3 million at peak — a 540% increase. Total corrections spending: $115 billion per year. Average cost per federal inmate: $47,162. Recidivism rate: 77% rearrested within 5 years. Since 2000, increased incarceration accounts for nearly zero percent of the crime drop. Norway invested in education and rehab, cut recidivism from 60% to 20%. The Netherlands closed 27 prisons because they ran out of prisoners. You are running the world\'s most expensive failure factory.',
    icon: '🏢',
    annualBudget: 80, // $80B total corrections
    roiData: {
      source: 'Vera Institute',
      ratio: 'Negative ROI',
      description: 'Mass incarceration costs exceed education spending; recidivism remains 70%+',
      sourceUrl: 'https://www.vera.org/publications/price-of-prisons-2023-update',
    },
    sources: [
      { name: 'Sentencing Project — Mass incarceration trends (360K to 2.3M)', url: 'https://www.sentencingproject.org/reports/mass-incarceration-trends/' },
      { name: 'Prison Policy Initiative — $115B/yr total corrections spending', url: 'https://www.prisonpolicy.org/reports/money2026.html' },
      { name: 'Federal Register — $47,162/yr average federal incarceration cost', url: 'https://www.federalregister.gov/documents/2025/12/15/2025-22777/annual-determination-of-average-cost-of-incarceration-fee-coif' },
      { name: 'BJS — 77% rearrested within 5 years', url: 'https://bjs.ojp.gov/topics/recidivism-and-reentry' },
      { name: 'Brennan Center — Incarceration has near-zero effect on crime since 2000', url: 'https://www.brennancenter.org/our-work/analysis-opinion/between-2007-and-2017-34-states-reduced-crime-and-incarceration-tandem' },
      { name: 'Vera Institute — The Prison Paradox', url: 'https://www.vera.org/publications/for-the-record-prison-paradox-incarceration-not-safer' },
      { name: 'US News — Netherlands closed 27 prisons for lack of prisoners', url: 'https://www.usnews.com/news/best-countries/articles/2019-05-13/the-netherlands-is-closing-its-prisons' },
    ],
  },

  // TRADITIONAL/NECESSARY (for comparison)
  MILITARY_OPERATIONS: {
    id: 'military',
    name: 'Weapons Systems & Pentagon R&D',
    description: 'The largest military budget on the planet by a factor of three. Since 2001 alone, $8 trillion spent on the War on Terror. Result: global terrorist attacks went from 1,800 per year to 16,900 (a 9x increase). Countries with active jihadist groups tripled from 12 to 40+. After 20 years and $2.3 trillion in Afghanistan, the Taliban retook the country in 11 days. Whether this makes you safer or just makes defence contractors richer is a question your political system is structurally incapable of asking.',
    icon: '🛡️',
    annualBudget: 425, // $425B (active wars split into separate categories)
    roiData: null,
    sources: [
      { name: 'Watson Institute — $8 trillion total cost of post-9/11 wars', url: 'https://watson.brown.edu/costsofwar/figures/2023/BudgetaryCosts' },
      { name: 'Global Terrorism Database — Attacks rose from 1,800/yr to 16,900/yr', url: 'https://www.start.umd.edu/gtd/' },
      { name: 'CSIS — Jihadist groups tripled from ~12 to 40+ countries', url: 'https://www.csis.org/analysis/evolution-salafi-jihadist-threat' },
      { name: 'SIGAR — Taliban retook Afghanistan in 11 days after 20 years', url: 'https://www.sigar.mil/pdf/lessonslearned/SIGAR-21-46-LL.pdf' },
    ],
  },

  // ACTIVE WARS & CONFLICTS
  BOMBING_IRAN: {
    id: 'bombing_iran',
    name: 'Bombing Iran',
    description: 'Operation Epic Fury costs roughly $1 billion per day in airstrikes, cruise missiles, and naval operations. You burned $5.6 billion in munitions in the first two days. Your previous adventures in Iraq and Afghanistan cost $8 trillion, killed 400,000-900,000 civilians, displaced 38 million people, and created ISIS — which did not exist before the 2003 invasion. The Taliban retook Afghanistan in 11 days after 20 years and $2.3 trillion. But I am sure this time will be different.',
    icon: '💣',
    annualBudget: 365, // ~$1B/day
    roiData: {
      source: 'Watson Institute / Pentagon Estimates',
      ratio: 'Negative ROI',
      description: 'Iraq/Afghanistan cost $8T+ and destabilized the region; Iran war burned $5.6B in munitions in first 2 days',
      sourceUrl: 'https://watson.brown.edu/costsofwar/',
    },
    sources: [
      { name: 'Watson Institute — $8T cost and 400K-900K civilian deaths', url: 'https://watson.brown.edu/costsofwar/costs/human' },
      { name: 'Watson Institute — 38 million people displaced', url: 'https://watson.brown.edu/costsofwar/costs/human/refugees' },
      { name: 'Stanford CISAC — ISIS did not exist before 2003 invasion', url: 'https://cisac.fsi.stanford.edu/mappingmilitants' },
      { name: 'CRS — US military operations casualty statistics', url: 'https://sgp.fas.org/crs/natsec/RL32492.pdf' },
    ],
  },
  ISRAEL_GAZA_MILITARY_AID: {
    id: 'israel_gaza_aid',
    name: "Military Aid for Israel's War in Gaza",
    description: 'Twenty-one point seven billion dollars in weapons and munitions since October 2023, funding operations that UN experts have characterised as genocide, with over 65,000 Palestinian civilians killed. The diplomatic cost to the US is incalculable. On my planet, paying for someone else\'s war crimes is also considered a war crime. Here you call it "strategic alliance."',
    icon: '🇮🇱',
    annualBudget: 4, // $3.3B base + supplementals
    roiData: {
      source: 'Quincy Institute / Congressional Research Service',
      ratio: 'Negative ROI',
      description: '65,000+ Palestinian civilians killed; characterized as genocide by UN experts; damages US standing globally',
      sourceUrl: 'https://quincyinst.org/research/u-s-military-aid-and-arms-transfers-to-israel-october-2023-september-2025/',
    },
    sources: [
      { name: 'Quincy Institute — $21.7B in US military aid to Israel since Oct 2023', url: 'https://quincyinst.org/research/u-s-military-aid-and-arms-transfers-to-israel-october-2023-september-2025/' },
    ],
  },
  YEMEN_HOUTHI_STRIKES: {
    id: 'yemen_houthi',
    name: 'Yemen & Houthi Military Strikes',
    description: 'Operation Rough Rider fires $2 million Tomahawk missiles at groups using $2,000 drones. The Houthi attacks on shipping persist despite the strikes, which means you are spending $2 million to not solve a $2,000 problem. This is the military equivalent of hiring a Michelin-star chef to burn toast.',
    icon: '🚢',
    annualBudget: 5, // Estimated naval/air ops cost
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
  },

  // CORPORATE & SURVEILLANCE
  CORPORATE_WELFARE: {
    id: 'corporate_welfare',
    name: 'Corporate Welfare & Bailouts',
    description: '$188 billion a year in federal corporate tax expenditures alone. Boeing: $16 billion in subsidies. Foxconn promised Wisconsin 13,000 jobs for $4.5 billion in incentives and delivered 1,454. Studies show 75-98% of subsidised projects would have happened without the incentive. Michigan\'s job subsidy programmes delivered 9% of promised jobs. These are the richest entities in human history receiving public money because they have better lobbyists than you have representatives.',
    icon: '🏦',
    annualBudget: 100,
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
    ],
  },
  AI_MASS_SURVEILLANCE: {
    id: 'ai_surveillance',
    name: 'AI Mass Surveillance Programs',
    description: 'Your government is spending billions on AI to track its own citizens. The NSA\'s bulk collection programme was reviewed by the Privacy and Civil Liberties Oversight Board, which found "not a single instance" where it made a concrete difference in a counterterrorism investigation. Facial recognition misidentifies Black faces at 10-100x the rate of white faces. The marginal cost per real terrorist detected via bulk surveillance exceeds $14 billion. You are building a panopticon that does not work and disproportionately harms minorities.',
    icon: '👁️',
    annualBudget: 5,
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
  },
  POLICING_VIOLENT_CRIME: {
    id: 'policing_violent_crime',
    name: 'Solving Actual Violent Crime',
    description: 'Your police solve roughly 50% of murders, 30% of arsons, and a staggering 14% of burglaries. Nearly half of all killers simply get away with it. Meanwhile your law enforcement budget is heavily allocated to drug offences and immigration enforcement rather than, you know, solving the crimes that already happened. The clearance rate for rape kits is somehow even more depressing. Perhaps try catching actual criminals before expanding into new hobbies.',
    icon: '🔍',
    annualBudget: 15, // ~$15B federal
    roiData: {
      source: 'FBI Uniform Crime Report / Bureau of Justice Statistics',
      ratio: 'Variable',
      description: 'Homicide clearance ~50%, arson ~30%, burglary ~14%; forensic backlogs and underfunded crime labs reduce solve rates',
      sourceUrl: 'https://bjs.ojp.gov/topics/crime',
    },
    sources: [
      { name: 'BJS — Crime and justice data', url: 'https://bjs.ojp.gov/topics/crime' },
      { name: 'FBI — Uniform Crime Reporting clearance rates', url: 'https://ucr.fbi.gov/' },
    ],
  },
} as const

export type BudgetCategoryId = keyof typeof BUDGET_CATEGORIES

/**
 * Calculate actual government allocation percentages from annual budgets
 * Returns percentages that sum to 100%
 */
export function getActualGovernmentAllocations(): Record<BudgetCategoryId, number> {
  const total = Object.values(BUDGET_CATEGORIES).reduce((sum, cat) => sum + cat.annualBudget, 0)

  const allocations: Record<string, number> = {}
  Object.entries(BUDGET_CATEGORIES).forEach(([id, cat]) => {
    allocations[id] = Number(((cat.annualBudget / total) * 100).toFixed(1))
  })

  return allocations as Record<BudgetCategoryId, number>
}
