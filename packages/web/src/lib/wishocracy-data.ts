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
  },

  // WASTEFUL/LOW-ROI SPENDING
  DRUG_WAR_ENFORCEMENT: {
    id: 'drug_war',
    name: 'Drug War Enforcement',
    description: 'Fifty-plus years. Over one trillion dollars spent. Zero reduction in drug use. The War on Drugs is the longest-running policy failure in your recorded history and you are still funding it like it might start working any day now. Meanwhile Portugal decriminalised everything in 2001 and drug deaths dropped 94%. But sure, keep arresting people. That will definitely work eventually.',
    icon: '🚔',
    annualBudget: 50, // $50B+
    roiData: {
      source: 'Cato Institute',
      ratio: 'Negative ROI',
      description: 'Drug war spending increases addiction rates and incarceration without reducing drug use',
      sourceUrl: 'https://www.cato.org/policy-analysis/four-decades-counting-continued-failure-war-drugs',
    },
  },
  ICE_IMMIGRATION_ENFORCEMENT: {
    id: 'ice',
    name: 'Mass Immigrant Detention Camps',
    description: 'It costs $150 to $200 per day to detain one person in these facilities. That is $55,000 to $73,000 per year per detainee, which is more than you spend educating a child. You have committed $45 billion through 2029 to build eight mega-centres holding 10,000 people each. The economic return is negative: you are removing workers, destroying tax revenue, and separating families, all at premium prices.',
    icon: '🚨',
    annualBudget: 14, // $14B (up from $9B; $45B committed through 2029)
    roiData: {
      source: 'Economic Analysis',
      ratio: 'Negative ROI',
      description: '$45B committed through 2029 for eight mega-centers holding 10K each; 75% increase in detainees; reduces GDP and tax revenue while separating families',
      sourceUrl: 'https://www.americanprogress.org/article/the-costs-of-mass-deportation/',
    },
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
  },
  FOSSIL_FUEL_SUBSIDIES: {
    id: 'fossil_fuel_subsidies',
    name: 'Fossil Fuel Subsidies',
    description: 'You are paying companies $20 billion a year to make the planet uninhabitable. Renewable energy is already cheaper than fossil fuels in most markets, yet you continue handing tax breaks and production credits to oil and gas companies posting record profits. It is like paying someone to set your house on fire after you have already bought a fire extinguisher.',
    icon: '🛢️',
    annualBudget: 20, // $20B
    roiData: {
      source: 'IMF Analysis',
      ratio: 'Negative ROI',
      description: 'Subsidizes climate change while renewable energy has become cheaper',
      sourceUrl: 'https://www.imf.org/en/Topics/climate-change/energy-subsidies',
    },
  },
  NUCLEAR_WEAPONS_MODERNIZATION: {
    id: 'nuclear_weapons',
    name: 'Nuclear Weapons Development',
    description: 'You already have enough nuclear weapons to end civilisation roughly ten times over, and you are spending $60 billion a year to make it eleven. Four thousand warheads when defence analysts agree 200 provide full deterrence. It is the most expensive way imaginable to accomplish nothing additional. On my planet this would be classified as a mental health crisis.',
    icon: '☢️',
    annualBudget: 60, // $60B
    roiData: {
      source: 'Arms Control Association',
      ratio: 'Low ROI',
      description: 'Modernizing 4,000+ warheads when 200 provide deterrence; risks new arms race',
      sourceUrl: 'https://www.armscontrol.org/factsheets/USNuclearModernization',
    },
  },
  PRISON_CONSTRUCTION: {
    id: 'prisons',
    name: 'Prison Construction & Operations',
    description: 'You spend $40,000 per year per inmate on a system with a 70% recidivism rate. That is roughly $15,000 more than you spend educating a child per year, and the prison version makes people worse. Norway spends comparable amounts but includes education and job training, and their reoffending rate is 20%. You are running the world\'s most expensive failure factory.',
    icon: '🏢',
    annualBudget: 80, // $80B total corrections
    roiData: {
      source: 'Vera Institute',
      ratio: 'Negative ROI',
      description: 'Mass incarceration costs exceed education spending; recidivism remains 70%+',
      sourceUrl: 'https://www.vera.org/publications/price-of-prisons-2023-update',
    },
  },

  // TRADITIONAL/NECESSARY (for comparison)
  MILITARY_OPERATIONS: {
    id: 'military',
    name: 'Weapons Systems & Pentagon R&D',
    description: 'The largest military budget on the planet by a factor of three. Weapons procurement, defence R&D, and base operations consume $425 billion before you even count the active wars, which have their own line items. Whether this makes you safer or just makes defence contractors richer is a question your political system is structurally incapable of asking.',
    icon: '🛡️',
    annualBudget: 425, // $425B (active wars split into separate categories)
    roiData: null,
  },

  // ACTIVE WARS & CONFLICTS
  BOMBING_IRAN: {
    id: 'bombing_iran',
    name: 'Bombing Iran',
    description: 'Operation Epic Fury costs roughly $1 billion per day in airstrikes, cruise missiles, and naval operations. You burned $5.6 billion in munitions in the first two days. Your previous adventures in Iraq and Afghanistan cost $8 trillion and destabilised the entire region. But I am sure this time will be different.',
    icon: '💣',
    annualBudget: 365, // ~$1B/day
    roiData: {
      source: 'Watson Institute / Pentagon Estimates',
      ratio: 'Negative ROI',
      description: 'Iraq/Afghanistan cost $8T+ and destabilized the region; Iran war burned $5.6B in munitions in first 2 days',
      sourceUrl: 'https://watson.brown.edu/costsofwar/',
    },
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
  },

  // CORPORATE & SURVEILLANCE
  CORPORATE_WELFARE: {
    id: 'corporate_welfare',
    name: 'Corporate Welfare & Bailouts',
    description: 'One hundred billion dollars a year in direct subsidies, tax breaks, and bailouts flowing to corporations posting record profits. Boeing got $15.6 billion. The auto industry got $39 billion. These are not struggling small businesses. They are the richest entities in human history receiving public money because they have better lobbyists than you have representatives.',
    icon: '🏦',
    annualBudget: 100,
    roiData: {
      source: 'Cato Institute',
      ratio: 'Low ROI',
      description: 'Subsidies flow to politically connected firms, not most productive uses; distorts markets',
      sourceUrl: 'https://www.cato.org/policy-analysis/corporate-welfare-federal-budget-0',
    },
  },
  AI_MASS_SURVEILLANCE: {
    id: 'ai_surveillance',
    name: 'AI Mass Surveillance Programs',
    description: 'Your government is spending billions on AI systems to track its own citizens instead of helping them. Facial recognition, social media monitoring, predictive policing, and tracking federal workers who dare to disagree. The Pentagon labelled an AI safety company a national security risk for refusing to help with mass surveillance. On my planet, a government that surveils its citizens this aggressively is called a police state. Here you call it "national security innovation."',
    icon: '👁️',
    annualBudget: 5,
    roiData: {
      source: 'Brennan Center for Justice',
      ratio: 'Negative ROI',
      description: 'Chills free speech; Pentagon labeled Anthropic a national security risk for refusing to allow mass surveillance',
      sourceUrl: 'https://www.brennancenter.org/',
    },
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
