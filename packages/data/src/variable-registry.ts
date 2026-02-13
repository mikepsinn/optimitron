import { z } from 'zod';

/**
 * Canonical predictor/outcome registry for generic pair-analysis workflows.
 *
 * This powers:
 * - predictor/outcome dropdowns
 * - outcome-hub ranking pages
 * - pair-study routing contracts
 */

export const VariableKindSchema = z.enum(['predictor', 'outcome']);
export type VariableKind = z.infer<typeof VariableKindSchema>;

export const VariableCategorySchema = z.enum([
  'fiscal',
  'health',
  'economic',
  'inequality',
  'education',
  'safety',
  'environment',
  'labor',
  'demographic',
  'other',
]);
export type VariableCategory = z.infer<typeof VariableCategorySchema>;

export const VariableAnalysisScopeSchema = z.enum([
  'global_panel',
  'jurisdiction_n_of_1',
]);
export type VariableAnalysisScope = z.infer<typeof VariableAnalysisScopeSchema>;

export const VariableTransformSchema = z.enum([
  'level',
  'yoy_delta',
  'yoy_percent',
  'rolling_mean',
  'z_score',
  'log',
]);
export type VariableTransform = z.infer<typeof VariableTransformSchema>;

export const WelfareDirectionSchema = z.enum([
  'higher_better',
  'lower_better',
  'neutral',
  'unknown',
]);
export type WelfareDirection = z.infer<typeof WelfareDirectionSchema>;

export const VariableSourceProviderSchema = z.enum([
  'world_bank',
  'oecd',
  'who',
  'fred',
  'derived',
  'curated_dataset',
  'manual',
]);
export type VariableSourceProvider = z.infer<typeof VariableSourceProviderSchema>;

export const VariableCoverageStatusSchema = z.enum([
  'unprofiled',
  'estimated',
  'measured',
]);
export type VariableCoverageStatus = z.infer<typeof VariableCoverageStatusSchema>;

export const VariableSourceSchema = z.object({
  provider: VariableSourceProviderSchema,
  code: z.string().min(1),
  fetcher: z.string().optional(),
  datasetId: z.string().optional(),
  url: z.string().url().optional(),
});
export type VariableSource = z.infer<typeof VariableSourceSchema>;

export const VariableCoverageSchema = z.object({
  profileStatus: VariableCoverageStatusSchema,
  yearMin: z.number().int().optional(),
  yearMax: z.number().int().optional(),
  jurisdictions: z.number().int().min(0).optional(),
  observations: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});
export type VariableCoverage = z.infer<typeof VariableCoverageSchema>;

export const VariableRegistryEntrySchema = z
  .object({
    id: z.string().regex(/^[a-z0-9_.-]+$/),
    label: z.string().min(1),
    description: z.string().min(1),
    kind: VariableKindSchema,
    category: VariableCategorySchema,
    unit: z.string().min(1),
    welfareDirection: WelfareDirectionSchema.optional(),
    analysisScopes: z.array(VariableAnalysisScopeSchema).nonempty(),
    defaultTransforms: z.array(VariableTransformSchema).nonempty(),
    suggestedLagYears: z.array(z.number().int().min(0).max(50)),
    source: VariableSourceSchema,
    coverage: VariableCoverageSchema,
    isDerived: z.boolean(),
    isDiscretionary: z.boolean().optional(),
    tags: z.array(z.string()),
    caveats: z.array(z.string()),
  })
  .superRefine((entry, ctx) => {
    if (entry.kind === 'outcome' && !entry.welfareDirection) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Outcome variables must include welfareDirection.',
        path: ['welfareDirection'],
      });
    }

    const sortedUnique = [...new Set(entry.suggestedLagYears)].sort((a, b) => a - b);
    if (sortedUnique.length !== entry.suggestedLagYears.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'suggestedLagYears must be unique.',
        path: ['suggestedLagYears'],
      });
    }

    if (entry.kind === 'predictor' && typeof entry.isDiscretionary !== 'boolean') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Predictor variables must declare isDiscretionary.',
        path: ['isDiscretionary'],
      });
    }
  });
export type VariableRegistryEntry = z.infer<typeof VariableRegistryEntrySchema>;

export const VariableRegistrySchema = z.array(VariableRegistryEntrySchema).superRefine((entries, ctx) => {
  const seen = new Map<string, number>();
  entries.forEach((entry, idx) => {
    const firstSeen = seen.get(entry.id);
    if (firstSeen !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate variable id '${entry.id}' (first at index ${firstSeen}).`,
        path: [idx, 'id'],
      });
      return;
    }
    seen.set(entry.id, idx);
  });
});
export type VariableRegistry = z.infer<typeof VariableRegistrySchema>;

export const VARIABLE_REGISTRY_VERSION = '2026-02-13';

const REGISTRY_SEED: VariableRegistry = [
  {
    id: 'predictor.wb.gov_expenditure_pct_gdp',
    label: 'Government Expenditure (% GDP)',
    description: 'General government final expenditure as share of GDP.',
    kind: 'predictor',
    category: 'fiscal',
    unit: '% GDP',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [0, 1, 2, 3],
    source: {
      provider: 'world_bank',
      code: 'GC.XPN.TOTL.GD.ZS',
      fetcher: 'fetchGovExpenditure',
      url: 'https://data.worldbank.org/indicator/GC.XPN.TOTL.GD.ZS',
    },
    coverage: {
      profileStatus: 'estimated',
      yearMin: 1960,
      yearMax: 2023,
      notes: 'Broad global coverage. Exact counts depend on selected year window.',
    },
    isDerived: false,
    isDiscretionary: true,
    tags: ['government-size', 'fiscal-policy'],
    caveats: ['Can move due to GDP denominator changes, not only spending changes.'],
  },
  {
    id: 'predictor.derived.gov_expenditure_per_capita_ppp',
    label: 'Government Expenditure Per Capita (PPP)',
    description: 'Derived from government expenditure % GDP multiplied by GDP per-capita PPP.',
    kind: 'predictor',
    category: 'fiscal',
    unit: 'PPP-adjusted currency/person',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_percent'],
    suggestedLagYears: [0, 1, 2, 3],
    source: {
      provider: 'derived',
      code: '(GC.XPN.TOTL.GD.ZS/100)*NY.GDP.PCAP.PP.CD',
    },
    coverage: {
      profileStatus: 'unprofiled',
      notes: 'Coverage is the intersection of expenditure and GDP per-capita series.',
    },
    isDerived: true,
    isDiscretionary: false,
    tags: ['government-size', 'ppp', 'derived'],
    caveats: ['Combines two indicators with different missingness patterns by country-year.'],
  },
  {
    id: 'predictor.wb.gov_debt_pct_gdp',
    label: 'Government Debt (% GDP)',
    description: 'Central government debt as share of GDP.',
    kind: 'predictor',
    category: 'fiscal',
    unit: '% GDP',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [0, 1, 2, 5],
    source: {
      provider: 'world_bank',
      code: 'GC.DOD.TOTL.GD.ZS',
      fetcher: 'fetchGovDebt',
      url: 'https://data.worldbank.org/indicator/GC.DOD.TOTL.GD.ZS',
    },
    coverage: {
      profileStatus: 'estimated',
      yearMin: 1960,
      yearMax: 2023,
    },
    isDerived: false,
    isDiscretionary: false,
    tags: ['fiscal-policy', 'public-finance'],
    caveats: ['Debt is stock-like and responds more slowly than annual flow variables.'],
  },
  {
    id: 'predictor.wb.tax_revenue_pct_gdp',
    label: 'Tax Revenue (% GDP)',
    description: 'Tax revenue as a share of GDP.',
    kind: 'predictor',
    category: 'fiscal',
    unit: '% GDP',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [0, 1, 2, 3],
    source: {
      provider: 'world_bank',
      code: 'GC.TAX.TOTL.GD.ZS',
      fetcher: 'fetchTaxRevenue',
      url: 'https://data.worldbank.org/indicator/GC.TAX.TOTL.GD.ZS',
    },
    coverage: {
      profileStatus: 'estimated',
      yearMin: 1972,
      yearMax: 2023,
    },
    isDerived: false,
    isDiscretionary: true,
    tags: ['tax-policy'],
    caveats: ['Does not include all non-tax government revenues.'],
  },
  {
    id: 'predictor.wb.gov_health_expenditure_pct_gdp',
    label: 'Government Health Expenditure (% GDP)',
    description: 'Government domestic health expenditure as share of GDP.',
    kind: 'predictor',
    category: 'health',
    unit: '% GDP',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [0, 1, 2, 3, 5],
    source: {
      provider: 'world_bank',
      code: 'SH.XPD.GHED.GD.ZS',
      fetcher: 'fetchGovHealthExpenditure',
      url: 'https://data.worldbank.org/indicator/SH.XPD.GHED.GD.ZS',
    },
    coverage: {
      profileStatus: 'estimated',
      yearMin: 2000,
      yearMax: 2023,
    },
    isDerived: false,
    isDiscretionary: true,
    tags: ['health-system', 'public-health'],
    caveats: ['Composition of health spending is not represented.'],
  },
  {
    id: 'predictor.wb.education_expenditure_pct_gdp',
    label: 'Education Expenditure (% GDP)',
    description: 'General government expenditure on education as share of GDP.',
    kind: 'predictor',
    category: 'education',
    unit: '% GDP',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [0, 1, 2, 3, 5],
    source: {
      provider: 'world_bank',
      code: 'SE.XPD.TOTL.GD.ZS',
      fetcher: 'fetchEducationExpenditure',
      url: 'https://data.worldbank.org/indicator/SE.XPD.TOTL.GD.ZS',
    },
    coverage: {
      profileStatus: 'estimated',
      yearMin: 1970,
      yearMax: 2023,
    },
    isDerived: false,
    isDiscretionary: true,
    tags: ['education-policy', 'human-capital'],
    caveats: ['Education quality and institutional effectiveness are not directly captured.'],
  },
  {
    id: 'predictor.wb.rd_expenditure_pct_gdp',
    label: 'R&D Expenditure (% GDP)',
    description: 'Research and development expenditure as share of GDP.',
    kind: 'predictor',
    category: 'economic',
    unit: '% GDP',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [1, 2, 3, 5],
    source: {
      provider: 'world_bank',
      code: 'GB.XPD.RSDV.GD.ZS',
      fetcher: 'fetchRDExpenditure',
      url: 'https://data.worldbank.org/indicator/GB.XPD.RSDV.GD.ZS',
    },
    coverage: {
      profileStatus: 'estimated',
      yearMin: 1996,
      yearMax: 2023,
    },
    isDerived: false,
    isDiscretionary: true,
    tags: ['innovation-policy'],
    caveats: ['Effects are often lagged and non-linear.'],
  },
  {
    id: 'predictor.wb.military_expenditure_pct_gdp',
    label: 'Military Expenditure (% GDP)',
    description: 'Military expenditure as share of GDP.',
    kind: 'predictor',
    category: 'safety',
    unit: '% GDP',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [0, 1, 2, 3],
    source: {
      provider: 'world_bank',
      code: 'MS.MIL.XPND.GD.ZS',
      fetcher: 'fetchMilitaryExpenditure',
      url: 'https://data.worldbank.org/indicator/MS.MIL.XPND.GD.ZS',
    },
    coverage: {
      profileStatus: 'estimated',
      yearMin: 1960,
      yearMax: 2023,
    },
    isDerived: false,
    isDiscretionary: true,
    tags: ['defense-policy'],
    caveats: ['May co-move with conflict risk and geopolitical shocks.'],
  },
  {
    id: 'outcome.wb.life_expectancy_years',
    label: 'Life Expectancy at Birth',
    description: 'Average number of years a newborn is expected to live.',
    kind: 'outcome',
    category: 'health',
    unit: 'years',
    welfareDirection: 'higher_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [0, 1, 2, 3, 5],
    source: {
      provider: 'world_bank',
      code: 'SP.DYN.LE00.IN',
      fetcher: 'fetchLifeExpectancy',
      url: 'https://data.worldbank.org/indicator/SP.DYN.LE00.IN',
    },
    coverage: {
      profileStatus: 'estimated',
      yearMin: 1960,
      yearMax: 2023,
    },
    isDerived: false,
    tags: ['welfare-core', 'health'],
    caveats: ['Does not directly capture morbidity or healthspan quality.'],
  },
  {
    id: 'outcome.who.healthy_life_expectancy_years',
    label: 'Healthy Life Expectancy (HALE)',
    description: 'Expected years lived in full health at birth.',
    kind: 'outcome',
    category: 'health',
    unit: 'years',
    welfareDirection: 'higher_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [0, 1, 2, 3, 5],
    source: {
      provider: 'who',
      code: 'WHOSIS_000002',
      fetcher: 'fetchWHOHealthyLifeExpectancy',
      url: 'https://ghoapi.azureedge.net/api/WHOSIS_000002',
    },
    coverage: {
      profileStatus: 'estimated',
      notes: 'Coverage can be sparse in annual time series for some jurisdictions.',
    },
    isDerived: false,
    tags: ['welfare-core', 'healthspan'],
    caveats: ['Series periodicity can differ from other annual panel indicators.'],
  },
  {
    id: 'outcome.wb.gdp_per_capita_ppp',
    label: 'GDP Per Capita (PPP)',
    description: 'GDP per capita at purchasing power parity (current international dollars).',
    kind: 'outcome',
    category: 'economic',
    unit: 'international $',
    welfareDirection: 'higher_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_percent', 'log'],
    suggestedLagYears: [0, 1, 2, 3],
    source: {
      provider: 'world_bank',
      code: 'NY.GDP.PCAP.PP.CD',
      fetcher: 'fetchGdpPerCapita',
      url: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.PP.CD',
    },
    coverage: {
      profileStatus: 'estimated',
      yearMin: 1990,
      yearMax: 2023,
    },
    isDerived: false,
    tags: ['welfare-core', 'income-proxy'],
    caveats: ['Not a direct measure of after-tax median household income.'],
  },
  {
    id: 'outcome.wb.gini_index',
    label: 'Income Inequality (Gini Index)',
    description: 'Income inequality index where higher values indicate greater inequality.',
    kind: 'outcome',
    category: 'inequality',
    unit: 'index',
    welfareDirection: 'lower_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [0, 1, 2, 3],
    source: {
      provider: 'world_bank',
      code: 'SI.POV.GINI',
      fetcher: 'fetchGiniIndex',
      url: 'https://data.worldbank.org/indicator/SI.POV.GINI',
    },
    coverage: {
      profileStatus: 'estimated',
      notes: 'Uneven reporting by country and year.',
    },
    isDerived: false,
    tags: ['distribution', 'equity'],
    caveats: ['Survey-method differences can affect comparability across jurisdictions.'],
  },
  {
    id: 'outcome.wb.infant_mortality_per_1000',
    label: 'Infant Mortality Rate',
    description: 'Infant deaths per 1,000 live births.',
    kind: 'outcome',
    category: 'health',
    unit: 'deaths per 1,000 live births',
    welfareDirection: 'lower_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta', 'log'],
    suggestedLagYears: [0, 1, 2, 3, 5],
    source: {
      provider: 'world_bank',
      code: 'SP.DYN.IMRT.IN',
      fetcher: 'fetchInfantMortality',
      url: 'https://data.worldbank.org/indicator/SP.DYN.IMRT.IN',
    },
    coverage: {
      profileStatus: 'estimated',
      yearMin: 1960,
      yearMax: 2023,
    },
    isDerived: false,
    tags: ['health-system', 'child-health'],
    caveats: ['May shift with registration quality, especially in lower-capacity systems.'],
  },
  {
    id: 'outcome.wb.homicide_rate_per_100k',
    label: 'Homicide Rate',
    description: 'Intentional homicides per 100,000 people.',
    kind: 'outcome',
    category: 'safety',
    unit: 'deaths per 100,000 people',
    welfareDirection: 'lower_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta', 'log'],
    suggestedLagYears: [0, 1, 2, 3],
    source: {
      provider: 'world_bank',
      code: 'VC.IHR.PSRC.P5',
      fetcher: 'fetchHomicideRate',
      url: 'https://data.worldbank.org/indicator/VC.IHR.PSRC.P5',
    },
    coverage: {
      profileStatus: 'estimated',
    },
    isDerived: false,
    tags: ['public-safety', 'violence'],
    caveats: ['Comparable coverage differs materially by region and period.'],
  },
  {
    id: 'outcome.wb.poverty_rate_2_15',
    label: 'Poverty Rate ($2.15/day)',
    description: 'Population share living below the international poverty line.',
    kind: 'outcome',
    category: 'economic',
    unit: '% of population',
    welfareDirection: 'lower_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [0, 1, 2, 3],
    source: {
      provider: 'world_bank',
      code: 'SI.POV.DDAY',
      fetcher: 'fetchPovertyRate',
      url: 'https://data.worldbank.org/indicator/SI.POV.DDAY',
    },
    coverage: {
      profileStatus: 'estimated',
    },
    isDerived: false,
    tags: ['poverty', 'welfare'],
    caveats: ['Binary poverty thresholds miss near-poverty dynamics and cost-of-living differences.'],
  },
  {
    id: 'outcome.wb.labor_force_participation_pct',
    label: 'Labor Force Participation Rate',
    description: 'Labor force participation rate as a percentage of population aged 15+.',
    kind: 'outcome',
    category: 'labor',
    unit: '% of population (15+)',
    welfareDirection: 'higher_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [0, 1, 2, 3],
    source: {
      provider: 'world_bank',
      code: 'SL.TLF.CACT.ZS',
      fetcher: 'fetchLaborForceParticipation',
      url: 'https://data.worldbank.org/indicator/SL.TLF.CACT.ZS',
    },
    coverage: {
      profileStatus: 'estimated',
      yearMin: 1990,
      yearMax: 2023,
    },
    isDerived: false,
    tags: ['labor-market', 'inclusion'],
    caveats: ['Higher participation is not always welfare-improving without context on job quality.'],
  },
];

export const VARIABLE_REGISTRY: readonly VariableRegistryEntry[] =
  VariableRegistrySchema.parse(REGISTRY_SEED);

export function getVariableRegistry(): VariableRegistryEntry[] {
  return [...VARIABLE_REGISTRY];
}

export function getVariableById(id: string): VariableRegistryEntry | undefined {
  return VARIABLE_REGISTRY.find((entry) => entry.id === id);
}

export function listVariablesByKind(kind: VariableKind): VariableRegistryEntry[] {
  return VARIABLE_REGISTRY.filter((entry) => entry.kind === kind);
}

export function listVariablesByScope(scope: VariableAnalysisScope): VariableRegistryEntry[] {
  return VARIABLE_REGISTRY.filter((entry) => entry.analysisScopes.includes(scope));
}

export function listPredictorsByDiscretionary(isDiscretionary: boolean): VariableRegistryEntry[] {
  return VARIABLE_REGISTRY.filter(
    (entry) => entry.kind === 'predictor' && entry.isDiscretionary === isDiscretionary,
  );
}
