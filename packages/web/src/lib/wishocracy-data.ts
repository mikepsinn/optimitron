export const BUDGET_CATEGORIES = {
  // HIGH-ROI INVESTMENTS
  PRAGMATIC_CLINICAL_TRIALS: {
    id: 'pragmatic_clinical_trials',
    name: 'Pragmatic Clinical Trials',
    description: 'Real-world clinical trials comparing treatment effectiveness',
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
    description: 'Evidence-based drug treatment, harm reduction, recovery support',
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
    description: 'Pre-K, Head Start, childcare subsidies for low-income families',
    icon: '👶',
    annualBudget: 10, // $10B
    roiData: {
      source: 'Heckman Equation',
      ratio: '13:1',
      description: 'High-quality early childhood programs return $13 per dollar through better outcomes',
      sourceUrl: 'https://heckmanequation.org/resource/13-roi-toolbox/',
    },
  },
  // NUTRITION_PROGRAMS: {
  //   id: 'nutrition_programs',
  //   name: 'Nutrition Programs (SNAP/WIC)',
  //   description: 'Food assistance, school meals, WIC for mothers and children',
  //   icon: '🥗',
  //   annualBudget: 100, // $100B
  //   roiData: {
  //     source: 'Copenhagen Consensus',
  //     ratio: '18:1',
  //     description: 'Nutrition interventions, especially for children, show extremely high returns',
  //     sourceUrl: 'https://copenhagenconsensus.com/publication/global-problems-health-nutrition',
  //   },
  // },
  // PREVENTIVE_HEALTHCARE: {
  //   id: 'preventive_healthcare',
  //   name: 'Preventive Healthcare',
  //   description: 'Vaccines, screenings, wellness programs, disease prevention',
  //   icon: '💉',
  //   annualBudget: 20, // $20B
  //   roiData: {
  //     source: 'Trust for America\'s Health',
  //     ratio: '10:1',
  //     description: 'Preventive health programs save $10 in treatment costs for every $1 spent',
  //     sourceUrl: 'https://www.tfah.org/report-details/prevention-for-a-healthier-america/',
  //   },
  // },
  // CLEAN_ENERGY_RND: {
  //   id: 'clean_energy_rnd',
  //   name: 'Clean Energy R&D',
  //   description: 'Solar, wind, battery tech, grid modernization research',
  //   icon: '⚡',
  //   annualBudget: 5, // $5B
  //   roiData: {
  //     source: 'IEA Analysis',
  //     ratio: '10:1',
  //     description: 'Clean energy R&D accelerates decarbonization and creates high-wage jobs',
  //     sourceUrl: 'https://www.iea.org/reports/world-energy-investment-2023',
  //   },
  // },
  // MENTAL_HEALTH_SERVICES: {
  //   id: 'mental_health',
  //   name: 'Mental Health Services',
  //   description: 'Community mental health centers, crisis intervention, counseling',
  //   icon: '🧠',
  //   annualBudget: 15, // $15B
  //   roiData: {
  //     source: 'WHO Analysis',
  //     ratio: '4:1',
  //     description: 'Mental health treatment returns $4 in improved health and productivity per $1 spent',
  //     sourceUrl: 'https://www.who.int/news/item/13-04-2016-investing-in-treatment-for-depression-and-anxiety-leads-to-fourfold-return',
  //   },
  // },
  // INFRASTRUCTURE_REPAIR: {
  //   id: 'infrastructure_repair',
  //   name: 'Infrastructure Repair',
  //   description: 'Fix crumbling roads, bridges, water systems, public transit',
  //   icon: '🚧',
  //   annualBudget: 40, // $40B
  //   roiData: {
  //     source: 'CBO Economic Analysis',
  //     ratio: '3:1',
  //     description: 'Infrastructure investments generate economic activity and productivity gains',
  //     sourceUrl: 'https://www.cbo.gov/publication/57486',
  //   },
  // },

  // WASTEFUL/LOW-ROI SPENDING
  DRUG_WAR_ENFORCEMENT: {
    id: 'drug_war',
    name: 'Drug War Enforcement',
    description: 'Federal drug enforcement, DEA operations, prosecution and corrections',
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
    name: 'ICE Immigration Enforcement',
    description: 'Detention centers, deportation operations, border enforcement',
    icon: '🚨',
    annualBudget: 9, // $9B
    roiData: {
      source: 'Economic Analysis',
      ratio: 'Negative ROI',
      description: 'Mass deportation reduces GDP and tax revenue while separating families',
      sourceUrl: 'https://www.americanprogress.org/article/the-costs-of-mass-deportation/',
    },
  },
  FARM_SUBSIDIES_AGRIBUSINESS: {
    id: 'farm_subsidies',
    name: 'Agribusiness Subsidies',
    description: 'Commodity support payments, crop insurance programs, agricultural subsidies',
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
    description: 'Federal tax breaks, production credits, and subsidies for oil and gas industry',
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
    description: 'New warheads, ICBMs, submarines for nuclear arsenal',
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
    description: 'Corrections facilities construction and operational costs',
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
    name: 'Weapons and Military Systems',
    description: 'Military spending, weapons systems, armed forces, global operations',
    icon: '🛡️',
    annualBudget: 800, // $800B
    roiData: null,
  },
  // K12_EDUCATION: {
  //   id: 'k12_education',
  //   name: 'K-12 Education',
  //   description: 'Federal funding for schools, Title I, special education',
  //   icon: '📚',
  //   annualBudget: 80, // $80B federal (states pay most)
  //   roiData: {
  //     source: 'Copenhagen Consensus',
  //     ratio: '30:1',
  //     description: 'Education interventions boost school attendance and long-term earnings',
  //     sourceUrl: 'https://copenhagenconsensus.com/publication/education-second-opinion',
  //   },
  // },
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
