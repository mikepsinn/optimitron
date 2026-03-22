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

export const VariableTemporalFillingTypeSchema = z.enum([
  'zero',
  'value',
  'none',
  'interpolation',
]);
export type VariableTemporalFillingType = z.infer<typeof VariableTemporalFillingTypeSchema>;

export const VariableTemporalProfileSchema = z
  .object({
    onsetDelayYears: z.array(z.number().int().min(0).max(50)).nonempty(),
    durationYears: z.array(z.number().int().min(1).max(50)).nonempty(),
    preferredFillingType: VariableTemporalFillingTypeSchema,
    preferredFillingValue: z.number().optional(),
  })
  .superRefine((profile, ctx) => {
    const uniqueOnsets = [...new Set(profile.onsetDelayYears)];
    if (uniqueOnsets.length !== profile.onsetDelayYears.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'temporalProfile.onsetDelayYears must be unique.',
        path: ['onsetDelayYears'],
      });
    }

    const uniqueDurations = [...new Set(profile.durationYears)];
    if (uniqueDurations.length !== profile.durationYears.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'temporalProfile.durationYears must be unique.',
        path: ['durationYears'],
      });
    }

    if (profile.preferredFillingType === 'value' && !Number.isFinite(profile.preferredFillingValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'temporalProfile.preferredFillingValue is required when preferredFillingType is "value".',
        path: ['preferredFillingValue'],
      });
    }
  });
export type VariableTemporalProfile = z.infer<typeof VariableTemporalProfileSchema>;

export const SparseOutcomeProfileSchema = z.object({
  isRareEvent: z.boolean(),
  minimumEventCountPerBin: z.number().int().min(1).default(5),
  preferredAggregationWindowYears: z.number().min(1),
  preferNormalizedRate: z.boolean(),
  normalizationDenominator: z.string().optional(),
});
export type SparseOutcomeProfile = z.infer<typeof SparseOutcomeProfileSchema>;

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
    temporalProfile: VariableTemporalProfileSchema.optional(),
    source: VariableSourceSchema,
    coverage: VariableCoverageSchema,
    sparseOutcomeProfile: SparseOutcomeProfileSchema.optional(),
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
    isDiscretionary: false,
    temporalProfile: {
      onsetDelayYears: [0, 1, 2, 3],
      durationYears: [1, 2, 3],
      preferredFillingType: 'interpolation',
    },
    tags: ['government-size', 'fiscal-policy'],
    caveats: ['Can move due to GDP denominator changes, not only spending changes.'],
  },
  {
    id: 'predictor.derived.gov_expenditure_per_capita_ppp',
    label: 'Government Expenditure Per Capita (PPP)',
    description: 'Derived from government expenditure % GDP multiplied by GDP per-capita PPP.',
    kind: 'predictor',
    category: 'fiscal',
    unit: 'international $/person',
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
    isDiscretionary: true,
    temporalProfile: {
      onsetDelayYears: [0, 1, 2, 3],
      durationYears: [1, 2, 3],
      preferredFillingType: 'interpolation',
    },
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
    temporalProfile: {
      onsetDelayYears: [0, 1, 2, 5],
      durationYears: [2, 3, 5],
      preferredFillingType: 'interpolation',
    },
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
    isDiscretionary: false,
    temporalProfile: {
      onsetDelayYears: [0, 1, 2, 3],
      durationYears: [1, 2, 3],
      preferredFillingType: 'interpolation',
    },
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
    isDiscretionary: false,
    temporalProfile: {
      onsetDelayYears: [0, 1, 2, 3, 5],
      durationYears: [2, 3, 5],
      preferredFillingType: 'interpolation',
    },
    tags: ['health-system', 'public-health'],
    caveats: ['Composition of health spending is not represented.'],
  },
  {
    id: 'predictor.derived.gov_health_expenditure_per_capita_ppp',
    label: 'Government Health Expenditure Per Capita (PPP)',
    description:
      'Derived from government health expenditure % GDP multiplied by GDP per-capita PPP.',
    kind: 'predictor',
    category: 'health',
    unit: 'international $/person',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_percent'],
    suggestedLagYears: [0, 1, 2, 3, 5],
    source: {
      provider: 'derived',
      code: '(SH.XPD.GHED.GD.ZS/100)*NY.GDP.PCAP.PP.CD',
    },
    coverage: {
      profileStatus: 'unprofiled',
      notes: 'Coverage is the intersection of health expenditure and GDP per-capita PPP series.',
    },
    isDerived: true,
    isDiscretionary: true,
    temporalProfile: {
      onsetDelayYears: [0, 1, 2, 3, 5],
      durationYears: [2, 3, 5],
      preferredFillingType: 'interpolation',
    },
    tags: ['health-system', 'ppp', 'derived'],
    caveats: ['Derived metric can inherit missingness and denominator noise from source series.'],
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
    isDiscretionary: false,
    temporalProfile: {
      onsetDelayYears: [0, 1, 2, 3, 5],
      durationYears: [2, 3, 5],
      preferredFillingType: 'interpolation',
    },
    tags: ['education-policy', 'human-capital'],
    caveats: ['Education quality and institutional effectiveness are not directly captured.'],
  },
  {
    id: 'predictor.derived.education_expenditure_per_capita_ppp',
    label: 'Education Expenditure Per Capita (PPP)',
    description:
      'Derived from education expenditure % GDP multiplied by GDP per-capita PPP.',
    kind: 'predictor',
    category: 'education',
    unit: 'international $/person',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_percent'],
    suggestedLagYears: [0, 1, 2, 3, 5],
    source: {
      provider: 'derived',
      code: '(SE.XPD.TOTL.GD.ZS/100)*NY.GDP.PCAP.PP.CD',
    },
    coverage: {
      profileStatus: 'unprofiled',
      notes: 'Coverage is the intersection of education expenditure and GDP per-capita PPP series.',
    },
    isDerived: true,
    isDiscretionary: true,
    temporalProfile: {
      onsetDelayYears: [0, 1, 2, 3, 5],
      durationYears: [2, 3, 5],
      preferredFillingType: 'interpolation',
    },
    tags: ['education-policy', 'ppp', 'derived'],
    caveats: ['Derived metric can inherit missingness and denominator noise from source series.'],
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
    isDiscretionary: false,
    temporalProfile: {
      onsetDelayYears: [1, 2, 3, 5],
      durationYears: [2, 3, 5, 8],
      preferredFillingType: 'interpolation',
    },
    tags: ['innovation-policy'],
    caveats: ['Effects are often lagged and non-linear.'],
  },
  {
    id: 'predictor.derived.rd_expenditure_per_capita_ppp',
    label: 'R&D Expenditure Per Capita (PPP)',
    description:
      'Derived from R&D expenditure % GDP multiplied by GDP per-capita PPP.',
    kind: 'predictor',
    category: 'economic',
    unit: 'international $/person',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_percent'],
    suggestedLagYears: [1, 2, 3, 5],
    source: {
      provider: 'derived',
      code: '(GB.XPD.RSDV.GD.ZS/100)*NY.GDP.PCAP.PP.CD',
    },
    coverage: {
      profileStatus: 'unprofiled',
      notes: 'Coverage is the intersection of R&D expenditure and GDP per-capita PPP series.',
    },
    isDerived: true,
    isDiscretionary: true,
    temporalProfile: {
      onsetDelayYears: [1, 2, 3, 5],
      durationYears: [2, 3, 5, 8],
      preferredFillingType: 'interpolation',
    },
    tags: ['innovation-policy', 'ppp', 'derived'],
    caveats: ['Derived metric can inherit missingness and denominator noise from source series.'],
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
    isDiscretionary: false,
    temporalProfile: {
      onsetDelayYears: [0, 1, 2, 3],
      durationYears: [1, 2, 3],
      preferredFillingType: 'interpolation',
    },
    tags: ['defense-policy'],
    caveats: ['May co-move with conflict risk and geopolitical shocks.'],
  },
  {
    id: 'predictor.derived.military_expenditure_per_capita_ppp',
    label: 'Military Expenditure Per Capita (PPP)',
    description:
      'Derived from military expenditure % GDP multiplied by GDP per-capita PPP.',
    kind: 'predictor',
    category: 'safety',
    unit: 'international $/person',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_percent'],
    suggestedLagYears: [0, 1, 2, 3],
    source: {
      provider: 'derived',
      code: '(MS.MIL.XPND.GD.ZS/100)*NY.GDP.PCAP.PP.CD',
    },
    coverage: {
      profileStatus: 'unprofiled',
      notes: 'Coverage is the intersection of military expenditure and GDP per-capita PPP series.',
    },
    isDerived: true,
    isDiscretionary: true,
    temporalProfile: {
      onsetDelayYears: [0, 1, 2, 3],
      durationYears: [1, 2, 3],
      preferredFillingType: 'interpolation',
    },
    tags: ['defense-policy', 'ppp', 'derived'],
    caveats: ['Derived metric can inherit missingness and denominator noise from source series.'],
  },
  {
    id: 'predictor.derived.gov_non_military_expenditure_per_capita_ppp',
    label: 'Civilian Government Expenditure Per Capita (PPP)',
    description:
      'Derived from total government expenditure per capita PPP minus military expenditure per capita PPP.',
    kind: 'predictor',
    category: 'fiscal',
    unit: 'international $/person',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_percent'],
    suggestedLagYears: [0, 1, 2, 3],
    source: {
      provider: 'derived',
      code: 'predictor.derived.gov_expenditure_per_capita_ppp - predictor.derived.military_expenditure_per_capita_ppp',
    },
    coverage: {
      profileStatus: 'unprofiled',
      notes: 'Coverage is the intersection of derived total and military spending per-capita PPP series.',
    },
    isDerived: true,
    isDiscretionary: true,
    temporalProfile: {
      onsetDelayYears: [0, 1, 2, 3],
      durationYears: [1, 2, 3],
      preferredFillingType: 'interpolation',
    },
    tags: ['government-size', 'civilian-spending', 'ppp', 'derived', 'budget-allocation'],
    caveats: ['Difference metric can amplify source-series revision noise.'],
  },
  {
    id: 'predictor.derived.gov_health_share_of_gov_expenditure_pct',
    label: 'Government Health Share of Government Spending',
    description:
      'Derived as government health expenditure (% GDP) divided by total government expenditure (% GDP), expressed as a percent share.',
    kind: 'predictor',
    category: 'health',
    unit: '% of government expenditure',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [0, 1, 2, 3, 5],
    source: {
      provider: 'derived',
      code: '(SH.XPD.GHED.GD.ZS / GC.XPN.TOTL.GD.ZS) * 100',
    },
    coverage: {
      profileStatus: 'unprofiled',
      notes: 'Coverage is the intersection of health and total government expenditure % GDP series.',
    },
    isDerived: true,
    isDiscretionary: true,
    temporalProfile: {
      onsetDelayYears: [0, 1, 2, 3, 5],
      durationYears: [2, 3, 5],
      preferredFillingType: 'interpolation',
    },
    tags: ['health-system', 'budget-allocation', 'derived'],
    caveats: ['Share can move due to numerator, denominator, or both.'],
  },
  {
    id: 'predictor.derived.education_share_of_gov_expenditure_pct',
    label: 'Education Share of Government Spending',
    description:
      'Derived as education expenditure (% GDP) divided by total government expenditure (% GDP), expressed as a percent share.',
    kind: 'predictor',
    category: 'education',
    unit: '% of government expenditure',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [0, 1, 2, 3, 5],
    source: {
      provider: 'derived',
      code: '(SE.XPD.TOTL.GD.ZS / GC.XPN.TOTL.GD.ZS) * 100',
    },
    coverage: {
      profileStatus: 'unprofiled',
      notes: 'Coverage is the intersection of education and total government expenditure % GDP series.',
    },
    isDerived: true,
    isDiscretionary: true,
    temporalProfile: {
      onsetDelayYears: [0, 1, 2, 3, 5],
      durationYears: [2, 3, 5],
      preferredFillingType: 'interpolation',
    },
    tags: ['education-policy', 'budget-allocation', 'derived'],
    caveats: ['Share can move due to numerator, denominator, or both.'],
  },
  {
    id: 'predictor.derived.rd_share_of_gov_expenditure_pct',
    label: 'R&D Share of Government Spending',
    description:
      'Derived as R&D expenditure (% GDP) divided by total government expenditure (% GDP), expressed as a percent share.',
    kind: 'predictor',
    category: 'economic',
    unit: '% of government expenditure',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [1, 2, 3, 5],
    source: {
      provider: 'derived',
      code: '(GB.XPD.RSDV.GD.ZS / GC.XPN.TOTL.GD.ZS) * 100',
    },
    coverage: {
      profileStatus: 'unprofiled',
      notes: 'Coverage is the intersection of R&D and total government expenditure % GDP series.',
    },
    isDerived: true,
    isDiscretionary: true,
    temporalProfile: {
      onsetDelayYears: [1, 2, 3, 5],
      durationYears: [2, 3, 5, 8],
      preferredFillingType: 'interpolation',
    },
    tags: ['innovation-policy', 'budget-allocation', 'derived'],
    caveats: ['Share can move due to numerator, denominator, or both.'],
  },
  {
    id: 'predictor.derived.military_share_of_gov_expenditure_pct',
    label: 'Military Share of Government Spending',
    description:
      'Derived as military expenditure (% GDP) divided by total government expenditure (% GDP), expressed as a percent share.',
    kind: 'predictor',
    category: 'safety',
    unit: '% of government expenditure',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [0, 1, 2, 3],
    source: {
      provider: 'derived',
      code: '(MS.MIL.XPND.GD.ZS / GC.XPN.TOTL.GD.ZS) * 100',
    },
    coverage: {
      profileStatus: 'unprofiled',
      notes: 'Coverage is the intersection of military and total government expenditure % GDP series.',
    },
    isDerived: true,
    isDiscretionary: true,
    temporalProfile: {
      onsetDelayYears: [0, 1, 2, 3],
      durationYears: [1, 2, 3],
      preferredFillingType: 'interpolation',
    },
    tags: ['defense-policy', 'budget-allocation', 'derived'],
    caveats: ['Share can move due to numerator, denominator, or both.'],
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
    id: 'outcome.wb.gni_per_capita_ppp',
    label: 'GNI Per Capita (PPP)',
    description: 'Gross national income per capita at purchasing power parity (current international dollars).',
    kind: 'outcome',
    category: 'economic',
    unit: 'international $',
    welfareDirection: 'higher_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_percent', 'log'],
    suggestedLagYears: [0, 1, 2, 3],
    source: {
      provider: 'world_bank',
      code: 'NY.GNP.PCAP.PP.CD',
      fetcher: 'fetchGniPerCapitaPpp',
      url: 'https://data.worldbank.org/indicator/NY.GNP.PCAP.PP.CD',
    },
    coverage: {
      profileStatus: 'estimated',
      yearMin: 1990,
      yearMax: 2023,
    },
    isDerived: false,
    tags: ['income-proxy'],
    caveats: ['Per-capita mean income is still not a direct after-tax median household income measure.'],
  },
  {
    id: 'outcome.derived.after_tax_median_income_ppp',
    label: 'After-Tax Median Income (PPP)',
    description:
      'Best-available real PPP median-income series, using OECD direct after-tax disposable income where available and World Bank PIP real median-income fallback elsewhere.',
    kind: 'outcome',
    category: 'economic',
    unit: 'international $',
    welfareDirection: 'higher_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_percent', 'log'],
    suggestedLagYears: [0, 1, 2, 3],
    source: {
      provider: 'curated_dataset',
      code: 'best_available_real_ppp_after_tax_median_income',
      fetcher: 'fetchAfterTaxMedianIncomePpp',
      datasetId: 'median-income-series',
    },
    coverage: {
      profileStatus: 'estimated',
      yearMin: 1981,
      yearMax: 2025,
      notes:
        'Best-available coverage currently combines OECD IDD direct after-tax disposable-income observations with generated World Bank PIP real median-income fallback data.',
    },
    isDerived: true,
    tags: ['welfare-core', 'income', 'best-available'],
    caveats: [
      'This is not a perfectly homogeneous source: OECD points are direct after-tax disposable-income observations, while non-OECD fallback points use World Bank PIP real median income and are not guaranteed to be after-tax.',
      'Coverage and concept comparability vary by jurisdiction; inspect source metadata when strict after-tax comparability matters.',
    ],
  },
  {
    id: 'outcome.derived.after_tax_median_income_ppp_growth_yoy_pct',
    label: 'After-Tax Median Income Growth (YoY %)',
    description:
      'Year-over-year percent growth in the best-available after-tax median-income PPP series.',
    kind: 'outcome',
    category: 'economic',
    unit: '% YoY',
    welfareDirection: 'higher_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'rolling_mean'],
    suggestedLagYears: [0, 1, 2, 3],
    source: {
      provider: 'derived',
      code: 'yoy_percent(outcome.derived.after_tax_median_income_ppp)',
    },
    coverage: {
      profileStatus: 'unprofiled',
      notes:
        'Coverage is one year shorter than the underlying best-available level series due to YoY derivation.',
    },
    isDerived: true,
    tags: ['welfare-core', 'income', 'growth', 'best-available'],
    caveats: [
      'Growth is derived from a mixed-source level series and may reflect changes in source composition as well as underlying income.',
      'Interpret cross-jurisdiction comparisons carefully where coverage switches between OECD direct after-tax data and PIP fallback data.',
    ],
  },
  {
    id: 'outcome.derived.healthy_life_expectancy_growth_yoy_pct',
    label: 'Healthy Life Expectancy Growth (YoY %)',
    description: 'Year-over-year percent growth in healthy life expectancy (HALE).',
    kind: 'outcome',
    category: 'health',
    unit: '% YoY',
    welfareDirection: 'higher_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'rolling_mean'],
    suggestedLagYears: [0, 1, 2, 3, 5],
    source: {
      provider: 'derived',
      code: 'yoy_percent(outcome.who.healthy_life_expectancy_years)',
    },
    coverage: {
      profileStatus: 'unprofiled',
      notes: 'Coverage is one year shorter than HALE due to YoY derivation.',
    },
    isDerived: true,
    tags: ['welfare-core', 'healthspan', 'growth'],
    caveats: ['YoY HALE growth can be noisy in sparse annual panels.'],
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
    id: 'outcome.wb.primary_completion_rate_pct',
    label: 'Primary School Completion Rate',
    description: 'Primary school completion rate as a percent of the relevant age group.',
    kind: 'outcome',
    category: 'education',
    unit: '% of relevant age group',
    welfareDirection: 'higher_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [0, 1, 2, 3, 5],
    source: {
      provider: 'world_bank',
      code: 'SE.PRM.CMPT.ZS',
      fetcher: 'fetchPrimaryCompletionRate',
      url: 'https://data.worldbank.org/indicator/SE.PRM.CMPT.ZS',
    },
    coverage: {
      profileStatus: 'estimated',
    },
    isDerived: false,
    tags: ['education-quality', 'human-capital', 'direct-kpi-candidate'],
    caveats: ['Completion is not the same as learning quality; pair with direct learning-score series when available.'],
  },
  {
    id: 'outcome.wb.battle_related_deaths',
    label: 'Battle-Related Deaths',
    description: 'Battle-related deaths (count).',
    kind: 'outcome',
    category: 'safety',
    unit: 'deaths (count)',
    welfareDirection: 'lower_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta', 'log'],
    suggestedLagYears: [0, 1, 2, 3, 5],
    source: {
      provider: 'world_bank',
      code: 'VC.BTL.DETH',
      fetcher: 'fetchBattleRelatedDeaths',
      url: 'https://data.worldbank.org/indicator/VC.BTL.DETH',
    },
    coverage: {
      profileStatus: 'estimated',
      notes: 'Sparse and conflict-clustered in many jurisdictions/years.',
    },
    sparseOutcomeProfile: {
      isRareEvent: true,
      minimumEventCountPerBin: 5,
      preferredAggregationWindowYears: 5,
      preferNormalizedRate: true,
      normalizationDenominator: 'per_100k_population',
    },
    isDerived: false,
    tags: ['security', 'conflict', 'direct-kpi-candidate'],
    caveats: ['Raw counts are population-sensitive; interpret with caution across very different population sizes.'],
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
  {
    id: 'outcome.who.ncd_mortality_rate',
    label: 'NCD Mortality Rate (30-70)',
    description: 'Probability of dying between ages 30 and 70 from cardiovascular disease, cancer, diabetes, or chronic respiratory disease.',
    kind: 'outcome',
    category: 'health',
    unit: '%',
    welfareDirection: 'lower_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta'],
    suggestedLagYears: [0, 1, 2, 3, 5],
    source: {
      provider: 'who',
      code: 'NCDMORT3070',
      fetcher: 'fetchWHONcdMortalityRate',
      url: 'https://ghoapi.azureedge.net/api/NCDMORT3070',
    },
    coverage: {
      profileStatus: 'estimated',
      notes: 'WHO Global Health Observatory; coverage varies by country.',
    },
    isDerived: false,
    tags: ['health-system', 'ncd', 'direct-kpi-candidate'],
    caveats: ['Probability metric rather than direct count; aggregation period may differ between WHO reporting cycles.'],
  },
  {
    id: 'outcome.wb.maternal_mortality_per_100k',
    label: 'Maternal Mortality Ratio',
    description: 'Maternal deaths per 100,000 live births.',
    kind: 'outcome',
    category: 'health',
    unit: 'deaths per 100,000 live births',
    welfareDirection: 'lower_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta', 'log'],
    suggestedLagYears: [0, 1, 2, 3, 5],
    source: {
      provider: 'world_bank',
      code: 'SH.STA.MMRT',
      fetcher: 'fetchMaternalMortality',
      url: 'https://data.worldbank.org/indicator/SH.STA.MMRT',
    },
    coverage: {
      profileStatus: 'estimated',
      notes: 'Modeled estimate; may lag real-world changes.',
    },
    sparseOutcomeProfile: {
      isRareEvent: true,
      minimumEventCountPerBin: 5,
      preferredAggregationWindowYears: 3,
      preferNormalizedRate: true,
      normalizationDenominator: 'per_100k_live_births',
    },
    isDerived: false,
    tags: ['health-system', 'maternal-health', 'direct-kpi-candidate'],
    caveats: ['Modeled estimate with confidence intervals that vary widely by country.'],
  },
  {
    id: 'outcome.derived.battle_related_deaths_per_100k',
    label: 'Battle-Related Deaths Per 100K',
    description: 'Battle-related deaths normalized by population (per 100,000).',
    kind: 'outcome',
    category: 'safety',
    unit: 'deaths per 100,000 people',
    welfareDirection: 'lower_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta', 'log'],
    suggestedLagYears: [0, 1, 2, 3, 5],
    source: {
      provider: 'derived',
      code: '(VC.BTL.DETH / SP.POP.TOTL) * 100000',
    },
    coverage: {
      profileStatus: 'unprofiled',
      notes: 'Coverage is the intersection of battle-related deaths and population series.',
    },
    sparseOutcomeProfile: {
      isRareEvent: true,
      minimumEventCountPerBin: 5,
      preferredAggregationWindowYears: 5,
      preferNormalizedRate: true,
      normalizationDenominator: 'per_100k_population',
    },
    isDerived: true,
    tags: ['security', 'conflict', 'direct-kpi-candidate', 'rate-normalized'],
    caveats: ['Inherits sparsity of battle-death counts; most country-years are zero.'],
  },
  {
    id: 'outcome.wb.under_five_mortality_per_1000',
    label: 'Under-Five Mortality Rate',
    description: 'Under-five mortality rate per 1,000 live births.',
    kind: 'outcome',
    category: 'health',
    unit: 'deaths per 1,000 live births',
    welfareDirection: 'lower_better',
    analysisScopes: ['global_panel', 'jurisdiction_n_of_1'],
    defaultTransforms: ['level', 'yoy_delta', 'log'],
    suggestedLagYears: [0, 1, 2, 3, 5],
    source: {
      provider: 'who',
      code: 'MDG_0000000007',
      fetcher: 'fetchWHOUnderFiveMortality',
      url: 'https://ghoapi.azureedge.net/api/MDG_0000000007',
    },
    coverage: {
      profileStatus: 'estimated',
      yearMin: 2000,
      yearMax: 2022,
      notes: 'WHO MDG indicator; broad global coverage.',
    },
    isDerived: false,
    tags: ['health-system', 'child-health', 'direct-kpi-candidate'],
    caveats: ['Overlaps conceptually with infant mortality but covers 0-5 age range.'],
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
