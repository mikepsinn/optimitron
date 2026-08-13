// AUTO-GENERATED FILE - DO NOT EDIT
// Generated from _analysis/economist-survey.json
// Run: python scripts/generate-economist-survey.py --top-n 30

/**
 * Economist validation survey data
 * Programmatically generated questions for parameter validation
 */

export type QuestionType =
  | 'rating'
  | 'boolean'
  | 'text'
  | 'range'
  | 'choice'
  | 'checklist';

export type SourceType = 'external' | 'calculated' | 'definition';

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  allowMultiple?: boolean;
  allowOther?: boolean;
}

export interface Citation {
  id: string;
  title: string;
  author?: string;
  year?: string;
  source?: string;
  url?: string;
}

export interface SurveyParameter {
  rank: number;
  name: string;
  displayName: string;
  value: number;
  unit?: string;
  formattedValue: string;
  sourceType: SourceType;
  description?: string;
  formula?: string;
  latex?: string;
  sourceRef?: string;
  citation?: Citation;
  questions: SurveyQuestion[];
}

export interface SurveyMetadata {
  title: string;
  version: string;
  versionDate: string;
  parameterCount: number;
  estimatedTimeMinutes: number;
  conductedBy: string;
  contact: string;
  dataUsage: string;
}

export interface EconomistSurvey {
  metadata: SurveyMetadata;
  parameters: SurveyParameter[];
}

// ============================================================================
// Survey Data
// ============================================================================

export const economistSurvey: EconomistSurvey = {
  metadata: {
    title: "Economic Model Validation Survey for Economists",
    version: "1.0",
    versionDate: "2025-12-12",
    parameterCount: 30,
    estimatedTimeMinutes: 90,
    conductedBy: "Decentralized Institutes of Health Initiative",
    contact: "feedback@warondisease.org", // TODO: auto-generated, update generator to use getEmail('feedback')
    dataUsage: "Responses will be used to refine economic model parameters. Individual responses are confidential.",
  },
  parameters: [
    {
      rank: 1,
      name: "RARE_DISEASES_COUNT_GLOBAL",
      displayName: "Total Number of Rare Diseases Globally",
      value: 7000.0,
      unit: "diseases",
      formattedValue: "7.00k diseases",
      sourceType: "external",
      description: "Total number of rare diseases globally",
      sourceRef: "ReferenceID.N95_PCT_DISEASES_NO_TREATMENT",
      citation: {
        id: "95-pct-diseases-no-treatment",
        title: "95% of diseases have 0 FDA-approved treatments",
        author: "GAO",
        year: "2025",
        source: "GAO",
        url: "https://www.gao.gov/products/gao-25-106774",
      },
      questions: [
        {
          id: "RARE_DISEASES_COUNT_GLOBAL_source_credibility",
          type: "rating",
          question: "Rate the credibility of this source for estimating: Total Number of Rare Diseases Globally",
          options: [
            "1 (Not credible)",
            "2",
            "3 (Somewhat credible)",
            "4",
            "5 (Highly credible)",
            "Not qualified to assess"
          ],
        },
        {
          id: "RARE_DISEASES_COUNT_GLOBAL_value_reasonable",
          type: "boolean",
          question: "Is the central estimate of 7.00k diseases reasonable?",
          options: [
            "Yes",
            "No"
          ],
        },
        {
          id: "RARE_DISEASES_COUNT_GLOBAL_better_source",
          type: "text",
          question: "Do you know of a better or more recent source?",
        },
        {
          id: "RARE_DISEASES_COUNT_GLOBAL_confidence_interval",
          type: "range",
          question: "The model uses a 90% confidence interval of [6.00k diseases, 10.0k diseases]. What is your 90% CI?",
          options: [
            "Lower bound",
            "Upper bound"
          ],
        }
      ],
    },
    {
      rank: 2,
      name: "DISEASES_WITHOUT_EFFECTIVE_TREATMENT",
      displayName: "Diseases Without Effective Treatment",
      value: 6650.0,
      unit: "diseases",
      formattedValue: "6.65k diseases",
      sourceType: "calculated",
      description: "Number of diseases without effective treatment. 95% of 7,000 rare diseases lack FDA-approved treatment (per Orphanet 2024). This is the 'queue' of diseases waiting for cures.",
      formula: "RARE_DISEASES_COUNT_GLOBAL × 0.95",
      sourceRef: "ReferenceID.RARE_DISEASE_ONLY_5PCT_HAVE_TREATMENT",
      citation: {
        id: "rare-disease-only-5pct-have-treatment",
        title: "Rare Disease Treatment Gap",
        author: "Orphanet Journal of Rare Diseases (2024)",
        year: "2024",
        source: "Orphanet Journal of Rare Diseases (2024)",
        url: "https://ojrd.biomedcentral.com/articles/10.1186/s13023-024-03398-1",
      },
      questions: [
        {
          id: "DISEASES_WITHOUT_EFFECTIVE_TREATMENT_formula_sound",
          type: "choice",
          question: "Is the calculation methodology sound for: **Diseases Without Effective Treatment**?\n\n**Current result:** 6.65k diseases\n**Calculation:** 7.00k diseases × 0.95 = 6.65k diseases",
          options: [
            "Yes - formula is appropriate",
            "No - wrong functional form",
            "No - missing key factors",
            "No - includes inappropriate factors",
            "Unsure - need more detail"
          ],
        },
        {
          id: "DISEASES_WITHOUT_EFFECTIVE_TREATMENT_inputs_appropriate",
          type: "checklist",
          question: "Are these input factors appropriate?\n\n**Inputs:**\n• Total Number of Rare Diseases Globally: 7.00k diseases",
          options: [
            "All inputs are appropriate",
            "Missing critical factors",
            "Includes inappropriate factors",
            "Potential overlap between factors",
            "Other issue (specify in comments)"
          ],
        },
        {
          id: "DISEASES_WITHOUT_EFFECTIVE_TREATMENT_missing_factors",
          type: "text",
          question: "What important factors are missing from this calculation?",
        }
      ],
    },
    {
      rank: 3,
      name: "NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR",
      displayName: "Diseases Getting First Treatment Per Year",
      value: 15.0,
      unit: "diseases/year",
      formattedValue: "15 diseases/year",
      sourceType: "external",
      description: "Number of diseases that receive their FIRST effective treatment each year under current system. ~9 rare diseases/year (based on 40 years of ODA: 350 with treatment ÷ 40 years), plus ~5-10 common diseases. Note: FDA approves ~50 drugs/year, but most are for diseases that already have treatments.",
      sourceRef: "ReferenceID.DISEASES_GETTING_FIRST_TREATMENT_ANNUALLY",
      citation: {
        id: "diseases-getting-first-treatment-annually",
        title: "Diseases Getting First Effective Treatment Each Year",
        author: "Calculated from Orphanet Journal of Rare Diseases (2024)",
        year: "2024",
        source: "Calculated from Orphanet Journal of Rare Diseases (2024)",
        url: "https://ojrd.biomedcentral.com/articles/10.1186/s13023-024-03398-1",
      },
      questions: [
        {
          id: "NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR_source_credibility",
          type: "rating",
          question: "Rate the credibility of this source for estimating: Diseases Getting First Treatment Per Year",
          options: [
            "1 (Not credible)",
            "2",
            "3 (Somewhat credible)",
            "4",
            "5 (Highly credible)",
            "Not qualified to assess"
          ],
        },
        {
          id: "NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR_value_reasonable",
          type: "boolean",
          question: "Is the central estimate of 15 diseases/year reasonable?",
          options: [
            "Yes",
            "No"
          ],
        },
        {
          id: "NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR_better_source",
          type: "text",
          question: "Do you know of a better or more recent source?",
        },
        {
          id: "NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR_confidence_interval",
          type: "range",
          question: "The model uses a 90% confidence interval of [8 diseases/year, 30 diseases/year]. What is your 90% CI?",
          options: [
            "Lower bound",
            "Upper bound"
          ],
        }
      ],
    },
    {
      rank: 4,
      name: "STATUS_QUO_QUEUE_CLEARANCE_YEARS",
      displayName: "Status Quo Queue Clearance Time",
      value: 443.3333333333333,
      unit: "years",
      formattedValue: "443 years",
      sourceType: "calculated",
      description: "Years to clear entire queue of diseases without treatment. At current rate of ~15 diseases/year getting first treatments, the queue of ~6,650 would take ~443 years to completely clear.",
      formula: "DISEASES_WITHOUT_EFFECTIVE_TREATMENT ÷ NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR",
      sourceRef: "ReferenceID.STATUS_QUO_CURE_TIMELINE_ESTIMATE",
      citation: {
        id: "status-quo-cure-timeline-estimate",
        title: "Average Time to Cure Under Current System",
        author: "Composite estimate based on Orphanet",
      },
      questions: [
        {
          id: "STATUS_QUO_QUEUE_CLEARANCE_YEARS_formula_sound",
          type: "choice",
          question: "Is the calculation methodology sound for: **Status Quo Queue Clearance Time**?\n\n**Current result:** 443 years years\n**Calculation:** 6.65k diseases ÷ 15 diseases/year = 443 years",
          options: [
            "Yes - formula is appropriate",
            "No - wrong functional form",
            "No - missing key factors",
            "No - includes inappropriate factors",
            "Unsure - need more detail"
          ],
        },
        {
          id: "STATUS_QUO_QUEUE_CLEARANCE_YEARS_inputs_appropriate",
          type: "checklist",
          question: "Are these input factors appropriate?\n\n**Inputs:**\n• Diseases Without Effective Treatment: 6.65k diseases\n• Diseases Getting First Treatment Per Year: 15 diseases/year",
          options: [
            "All inputs are appropriate",
            "Missing critical factors",
            "Includes inappropriate factors",
            "Potential overlap between factors",
            "Other issue (specify in comments)"
          ],
        },
        {
          id: "STATUS_QUO_QUEUE_CLEARANCE_YEARS_missing_factors",
          type: "text",
          question: "What important factors are missing from this calculation?",
        }
      ],
    },
    {
      rank: 5,
      name: "STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT",
      displayName: "Status Quo Average Years to First Treatment",
      value: 221.66666666666666,
      unit: "years",
      formattedValue: "222 years",
      sourceType: "calculated",
      description: "Average years until first treatment discovered for a typical disease under current system. The average disease is in the middle of the queue, so it waits half the total queue clearance time (~443/2 = ~222 years).",
      formula: "STATUS_QUO_QUEUE_CLEARANCE_YEARS ÷ 2",
      sourceRef: "ReferenceID.STATUS_QUO_CURE_TIMELINE_ESTIMATE",
      citation: {
        id: "status-quo-cure-timeline-estimate",
        title: "Average Time to Cure Under Current System",
        author: "Composite estimate based on Orphanet",
      },
      questions: [
        {
          id: "STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT_formula_sound",
          type: "choice",
          question: "Is the calculation methodology sound for: **Status Quo Average Years to First Treatment**?\n\n**Current result:** 222 years years\n**Calculation:** 443 years ÷ 2 = 222 years",
          options: [
            "Yes - formula is appropriate",
            "No - wrong functional form",
            "No - missing key factors",
            "No - includes inappropriate factors",
            "Unsure - need more detail"
          ],
        },
        {
          id: "STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT_inputs_appropriate",
          type: "checklist",
          question: "Are these input factors appropriate?\n\n**Inputs:**\n• Status Quo Queue Clearance Time: 443 years",
          options: [
            "All inputs are appropriate",
            "Missing critical factors",
            "Includes inappropriate factors",
            "Potential overlap between factors",
            "Other issue (specify in comments)"
          ],
        },
        {
          id: "STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT_missing_factors",
          type: "text",
          question: "What important factors are missing from this calculation?",
        }
      ],
    },
    {
      rank: 6,
      name: "CURRENT_TRIAL_SLOTS_AVAILABLE",
      displayName: "Annual Global Clinical Trial Participants",
      value: 1900000.0,
      unit: "patients/year",
      formattedValue: "1.90M patients/year",
      sourceType: "external",
      description: "Annual global clinical trial participants (IQVIA 2022: 1.9M post-COVID normalization)",
      sourceRef: "global-trial-participant-capacity",
      citation: {
        id: "global-trial-participant-capacity",
        title: "Global trial capacity",
        author: "IQVIA Report",
        source: "IQVIA Report: Clinical Trial Subjects Number Drops Due to Decline in COVID-19 Enrollment",
        url: "https://gmdpacademy.org/news/iqvia-report-clinical-trial-subjects-number-drops-due-to-decline-in-covid-19-enrollment/",
      },
      questions: [
        {
          id: "CURRENT_TRIAL_SLOTS_AVAILABLE_source_credibility",
          type: "rating",
          question: "Rate the credibility of this source for estimating: Annual Global Clinical Trial Participants",
          options: [
            "1 (Not credible)",
            "2",
            "3 (Somewhat credible)",
            "4",
            "5 (Highly credible)",
            "Not qualified to assess"
          ],
        },
        {
          id: "CURRENT_TRIAL_SLOTS_AVAILABLE_value_reasonable",
          type: "boolean",
          question: "Is the central estimate of 1.90M patients/year reasonable?",
          options: [
            "Yes",
            "No"
          ],
        },
        {
          id: "CURRENT_TRIAL_SLOTS_AVAILABLE_better_source",
          type: "text",
          question: "Do you know of a better or more recent source?",
        },
        {
          id: "CURRENT_TRIAL_SLOTS_AVAILABLE_confidence_interval",
          type: "range",
          question: "The model uses a 90% confidence interval of [1.50M patients/year, 2.30M patients/year]. What is your 90% CI?",
          options: [
            "Lower bound",
            "Upper bound"
          ],
        }
      ],
    },
    {
      rank: 7,
      name: "DFDA_OPEX_PLATFORM_MAINTENANCE",
      displayName: "Decentralized Framework for Drug Assessment Maintenance Costs",
      value: 15000000.0,
      unit: "USD/year",
      formattedValue: "$15M",
      sourceType: "definition",
      description: "Decentralized Framework for Drug Assessment maintenance costs",
      sourceRef: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html#opex-breakdown",
      questions: [
        {
          id: "DFDA_OPEX_PLATFORM_MAINTENANCE_assumption_reasonable",
          type: "rating",
          question: "Is this assumption reasonable: Decentralized Framework for Drug Assessment Maintenance Costs = $15M",
          options: [
            "1 (Unreasonable)",
            "2 (Questionable)",
            "3 (Acceptable)",
            "4 (Reasonable)",
            "5 (Very reasonable)",
            "Not qualified to assess"
          ],
        },
        {
          id: "DFDA_OPEX_PLATFORM_MAINTENANCE_alternative_value",
          type: "text",
          question: "What value would you use instead? (Current: $15M)",
        },
        {
          id: "DFDA_OPEX_PLATFORM_MAINTENANCE_confidence_interval",
          type: "range",
          question: "The model uses a 90% confidence interval of [$10M, $22M]. What is your 90% CI?",
          options: [
            "Lower bound",
            "Upper bound"
          ],
        }
      ],
    },
    {
      rank: 8,
      name: "DFDA_OPEX_STAFF",
      displayName: "Decentralized Framework for Drug Assessment Staff Costs",
      value: 10000000.0,
      unit: "USD/year",
      formattedValue: "$10M",
      sourceType: "definition",
      description: "Decentralized Framework for Drug Assessment staff costs (minimal, AI-assisted)",
      sourceRef: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html#opex-breakdown",
      questions: [
        {
          id: "DFDA_OPEX_STAFF_assumption_reasonable",
          type: "rating",
          question: "Is this assumption reasonable: Decentralized Framework for Drug Assessment Staff Costs = $10M",
          options: [
            "1 (Unreasonable)",
            "2 (Questionable)",
            "3 (Acceptable)",
            "4 (Reasonable)",
            "5 (Very reasonable)",
            "Not qualified to assess"
          ],
        },
        {
          id: "DFDA_OPEX_STAFF_alternative_value",
          type: "text",
          question: "What value would you use instead? (Current: $10M)",
        },
        {
          id: "DFDA_OPEX_STAFF_confidence_interval",
          type: "range",
          question: "The model uses a 90% confidence interval of [$7M, $15M]. What is your 90% CI?",
          options: [
            "Lower bound",
            "Upper bound"
          ],
        }
      ],
    },
    {
      rank: 9,
      name: "DFDA_OPEX_INFRASTRUCTURE",
      displayName: "Decentralized Framework for Drug Assessment Infrastructure Costs",
      value: 8000000.0,
      unit: "USD/year",
      formattedValue: "$8M",
      sourceType: "definition",
      description: "Decentralized Framework for Drug Assessment infrastructure costs (cloud, security)",
      sourceRef: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html#opex-breakdown",
      questions: [
        {
          id: "DFDA_OPEX_INFRASTRUCTURE_assumption_reasonable",
          type: "rating",
          question: "Is this assumption reasonable: Decentralized Framework for Drug Assessment Infrastructure Costs = $8M",
          options: [
            "1 (Unreasonable)",
            "2 (Questionable)",
            "3 (Acceptable)",
            "4 (Reasonable)",
            "5 (Very reasonable)",
            "Not qualified to assess"
          ],
        },
        {
          id: "DFDA_OPEX_INFRASTRUCTURE_alternative_value",
          type: "text",
          question: "What value would you use instead? (Current: $8M)",
        },
        {
          id: "DFDA_OPEX_INFRASTRUCTURE_confidence_interval",
          type: "range",
          question: "The model uses a 90% confidence interval of [$5M, $12M]. What is your 90% CI?",
          options: [
            "Lower bound",
            "Upper bound"
          ],
        }
      ],
    },
    {
      rank: 10,
      name: "DFDA_OPEX_REGULATORY",
      displayName: "Decentralized Framework for Drug Assessment Regulatory Coordination Costs",
      value: 5000000.0,
      unit: "USD/year",
      formattedValue: "$5M",
      sourceType: "definition",
      description: "Decentralized Framework for Drug Assessment regulatory coordination costs",
      sourceRef: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html#opex-breakdown",
      questions: [
        {
          id: "DFDA_OPEX_REGULATORY_assumption_reasonable",
          type: "rating",
          question: "Is this assumption reasonable: Decentralized Framework for Drug Assessment Regulatory Coordination Costs = $5M",
          options: [
            "1 (Unreasonable)",
            "2 (Questionable)",
            "3 (Acceptable)",
            "4 (Reasonable)",
            "5 (Very reasonable)",
            "Not qualified to assess"
          ],
        },
        {
          id: "DFDA_OPEX_REGULATORY_alternative_value",
          type: "text",
          question: "What value would you use instead? (Current: $5M)",
        },
        {
          id: "DFDA_OPEX_REGULATORY_confidence_interval",
          type: "range",
          question: "The model uses a 90% confidence interval of [$3M, $8M]. What is your 90% CI?",
          options: [
            "Lower bound",
            "Upper bound"
          ],
        }
      ],
    },
    {
      rank: 11,
      name: "DFDA_OPEX_COMMUNITY",
      displayName: "Decentralized Framework for Drug Assessment Community Support Costs",
      value: 2000000.0,
      unit: "USD/year",
      formattedValue: "$2M",
      sourceType: "definition",
      description: "Decentralized Framework for Drug Assessment community support costs",
      sourceRef: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html#opex-breakdown",
      questions: [
        {
          id: "DFDA_OPEX_COMMUNITY_assumption_reasonable",
          type: "rating",
          question: "Is this assumption reasonable: Decentralized Framework for Drug Assessment Community Support Costs = $2M",
          options: [
            "1 (Unreasonable)",
            "2 (Questionable)",
            "3 (Acceptable)",
            "4 (Reasonable)",
            "5 (Very reasonable)",
            "Not qualified to assess"
          ],
        },
        {
          id: "DFDA_OPEX_COMMUNITY_alternative_value",
          type: "text",
          question: "What value would you use instead? (Current: $2M)",
        },
        {
          id: "DFDA_OPEX_COMMUNITY_confidence_interval",
          type: "range",
          question: "The model uses a 90% confidence interval of [$1M, $3M]. What is your 90% CI?",
          options: [
            "Lower bound",
            "Upper bound"
          ],
        }
      ],
    },
    {
      rank: 12,
      name: "DFDA_ANNUAL_OPEX",
      displayName: "Total Annual Decentralized Framework for Drug Assessment Operational Costs",
      value: 40000000.0,
      unit: "USD/year",
      formattedValue: "$40M",
      sourceType: "calculated",
      description: "Total annual Decentralized Framework for Drug Assessment operational costs (sum of all components: $15M + $10M + $8M + $5M + $2M)",
      formula: "PLATFORM_MAINTENANCE + STAFF + INFRASTRUCTURE + REGULATORY + COMMUNITY",
      sourceRef: "https://manual.WarOnDisease.org/knowledge/appendix/dfda-impact-paper.html#opex-breakdown",
      questions: [
        {
          id: "DFDA_ANNUAL_OPEX_formula_sound",
          type: "choice",
          question: "Is the calculation methodology sound for: **Total Annual Decentralized Framework for Drug Assessment Operational Costs**?\n\n**Current result:** $40M\n**Calculation:** $15M + $10M + $8M + $5M + $2M = $40M",
          options: [
            "Yes - formula is appropriate",
            "No - wrong functional form",
            "No - missing key factors",
            "No - includes inappropriate factors",
            "Unsure - need more detail"
          ],
        },
        {
          id: "DFDA_ANNUAL_OPEX_inputs_appropriate",
          type: "checklist",
          question: "Are these input factors appropriate?\n\n**Inputs:**\n• Decentralized Framework for Drug Assessment Maintenance Costs: $15M\n• Decentralized Framework for Drug Assessment Staff Costs: $10M\n• Decentralized Framework for Drug Assessment Infrastructure Costs: $8M\n• Decentralized Framework for Drug Assessment Regulatory Coordination Costs: $5M\n• Decentralized Framework for Drug Assessment Community Support Costs: $2M",
          options: [
            "All inputs are appropriate",
            "Missing critical factors",
            "Includes inappropriate factors",
            "Potential overlap between factors",
            "Other issue (specify in comments)"
          ],
        },
        {
          id: "DFDA_ANNUAL_OPEX_missing_factors",
          type: "text",
          question: "What important factors are missing from this calculation?",
        }
      ],
    },
    {
      rank: 13,
      name: "GLOBAL_MILITARY_SPENDING_ANNUAL_2024",
      displayName: "Global Military Spending in 2024",
      value: 2720000000000.0,
      unit: "USD",
      formattedValue: "$2.72T",
      sourceType: "external",
      description: "Global military spending in 2024",
      sourceRef: "ReferenceID.GLOBAL_MILITARY_SPENDING",
      citation: {
        id: "global-military-spending",
        title: "Global military spending (\\$2.72T, 2024)",
        author: "SIPRI",
        year: "2025",
        source: "SIPRI",
        url: "https://www.sipri.org/publications/2025/sipri-fact-sheets/trends-world-military-expenditure-2024",
      },
      questions: [
        {
          id: "GLOBAL_MILITARY_SPENDING_ANNUAL_2024_source_credibility",
          type: "rating",
          question: "Rate the credibility of this source for estimating: Global Military Spending in 2024",
          options: [
            "1 (Not credible)",
            "2",
            "3 (Somewhat credible)",
            "4",
            "5 (Highly credible)",
            "Not qualified to assess"
          ],
        },
        {
          id: "GLOBAL_MILITARY_SPENDING_ANNUAL_2024_value_reasonable",
          type: "boolean",
          question: "Is the central estimate of $2.72T reasonable?",
          options: [
            "Yes",
            "No"
          ],
        },
        {
          id: "GLOBAL_MILITARY_SPENDING_ANNUAL_2024_better_source",
          type: "text",
          question: "Do you know of a better or more recent source?",
        }
      ],
    },
    {
      rank: 14,
      name: "TREATY_REDUCTION_PCT",
      displayName: "1% Reduction in Military Spending/War Costs from Treaty",
      value: 0.01,
      unit: "rate",
      formattedValue: "1%",
      sourceType: "definition",
      description: "1% reduction in military spending/war costs from treaty",
      questions: [
        {
          id: "TREATY_REDUCTION_PCT_assumption_reasonable",
          type: "rating",
          question: "Is this assumption reasonable: 1% Reduction in Military Spending/War Costs from Treaty = 1%",
          options: [
            "1 (Unreasonable)",
            "2 (Questionable)",
            "3 (Acceptable)",
            "4 (Reasonable)",
            "5 (Very reasonable)",
            "Not qualified to assess"
          ],
        },
        {
          id: "TREATY_REDUCTION_PCT_alternative_value",
          type: "text",
          question: "What value would you use instead? (Current: 1%)",
        }
      ],
    },
    {
      rank: 15,
      name: "TREATY_ANNUAL_FUNDING",
      displayName: "Annual Funding from 1% of Global Military Spending Redirected to DIH",
      value: 27200000000.0,
      unit: "USD/year",
      formattedValue: "$27.2B",
      sourceType: "calculated",
      description: "Annual funding from 1% of global military spending redirected to DIH",
      formula: "MILITARY_SPENDING × 1%",
      questions: [
        {
          id: "TREATY_ANNUAL_FUNDING_formula_sound",
          type: "choice",
          question: "Is the calculation methodology sound for: **Annual Funding from 1% of Global Military Spending Redirected to DIH**?\n\n**Current result:** $27.2B\n**Calculation:** MILITARY_SPENDING × 1% = $27.2B",
          options: [
            "Yes - formula is appropriate",
            "No - wrong functional form",
            "No - missing key factors",
            "No - includes inappropriate factors",
            "Unsure - need more detail"
          ],
        },
        {
          id: "TREATY_ANNUAL_FUNDING_inputs_appropriate",
          type: "checklist",
          question: "Are these input factors appropriate?\n\n**Inputs:**\n• Global Military Spending in 2024: $2.72T\n• 1% Reduction in Military Spending/War Costs from Treaty: 1%",
          options: [
            "All inputs are appropriate",
            "Missing critical factors",
            "Includes inappropriate factors",
            "Potential overlap between factors",
            "Other issue (specify in comments)"
          ],
        },
        {
          id: "TREATY_ANNUAL_FUNDING_missing_factors",
          type: "text",
          question: "What important factors are missing from this calculation?",
        }
      ],
    },
    {
      rank: 16,
      name: "VICTORY_BOND_FUNDING_PCT",
      displayName: "Percentage of Captured Dividend Funding VICTORY Incentive Alignment Bonds",
      value: 0.1,
      unit: "rate",
      formattedValue: "10%",
      sourceType: "definition",
      description: "Percentage of captured dividend funding VICTORY Incentive Alignment Bonds (10%)",
      questions: [
        {
          id: "VICTORY_BOND_FUNDING_PCT_assumption_reasonable",
          type: "rating",
          question: "Is this assumption reasonable: Percentage of Captured Dividend Funding VICTORY Incentive Alignment Bonds = 10%",
          options: [
            "1 (Unreasonable)",
            "2 (Questionable)",
            "3 (Acceptable)",
            "4 (Reasonable)",
            "5 (Very reasonable)",
            "Not qualified to assess"
          ],
        },
        {
          id: "VICTORY_BOND_FUNDING_PCT_alternative_value",
          type: "text",
          question: "What value would you use instead? (Current: 10%)",
        }
      ],
    },
    {
      rank: 17,
      name: "VICTORY_BOND_ANNUAL_PAYOUT",
      displayName: "Annual VICTORY Incentive Alignment Bond Payout",
      value: 2720000000.0,
      unit: "USD/year",
      formattedValue: "$2.72B",
      sourceType: "calculated",
      description: "Annual VICTORY Incentive Alignment Bond payout (treaty funding × bond percentage)",
      formula: "TREATY_FUNDING × BOND_PCT",
      questions: [
        {
          id: "VICTORY_BOND_ANNUAL_PAYOUT_formula_sound",
          type: "choice",
          question: "Is the calculation methodology sound for: **Annual VICTORY Incentive Alignment Bond Payout**?\n\n**Current result:** $2.72B\n**Calculation:** TREATY_FUNDING × BOND_PCT = $2.72B",
          options: [
            "Yes - formula is appropriate",
            "No - wrong functional form",
            "No - missing key factors",
            "No - includes inappropriate factors",
            "Unsure - need more detail"
          ],
        },
        {
          id: "VICTORY_BOND_ANNUAL_PAYOUT_inputs_appropriate",
          type: "checklist",
          question: "Are these input factors appropriate?\n\n**Inputs:**\n• Annual Funding from 1% of Global Military Spending Redirected to DIH: $27.2B\n• Percentage of Captured Dividend Funding VICTORY Incentive Alignment Bonds: 10%",
          options: [
            "All inputs are appropriate",
            "Missing critical factors",
            "Includes inappropriate factors",
            "Potential overlap between factors",
            "Other issue (specify in comments)"
          ],
        },
        {
          id: "VICTORY_BOND_ANNUAL_PAYOUT_missing_factors",
          type: "text",
          question: "What important factors are missing from this calculation?",
        }
      ],
    },
    {
      rank: 18,
      name: "IAB_POLITICAL_INCENTIVE_FUNDING_PCT",
      displayName: "IAB Political Incentive Funding Percentage",
      value: 0.1,
      unit: "rate",
      formattedValue: "10%",
      sourceType: "definition",
      description: "Percentage of treaty funding allocated to Incentive Alignment Bond mechanism for political incentives (independent expenditures/PACs, post-office fellowships, Public Good Score infrastructure)",
      questions: [
        {
          id: "IAB_POLITICAL_INCENTIVE_FUNDING_PCT_assumption_reasonable",
          type: "rating",
          question: "Is this assumption reasonable: IAB Political Incentive Funding Percentage = 10%",
          options: [
            "1 (Unreasonable)",
            "2 (Questionable)",
            "3 (Acceptable)",
            "4 (Reasonable)",
            "5 (Very reasonable)",
            "Not qualified to assess"
          ],
        },
        {
          id: "IAB_POLITICAL_INCENTIVE_FUNDING_PCT_alternative_value",
          type: "text",
          question: "What value would you use instead? (Current: 10%)",
        }
      ],
    },
    {
      rank: 19,
      name: "IAB_POLITICAL_INCENTIVE_FUNDING_ANNUAL",
      displayName: "Annual IAB Political Incentive Funding",
      value: 2720000000.0,
      unit: "USD/year",
      formattedValue: "$2.72B",
      sourceType: "calculated",
      description: "Annual funding for IAB political incentive mechanism (independent expenditures supporting high-scoring politicians, post-office fellowship endowments, Public Good Score infrastructure)",
      formula: "TREATY_FUNDING × IAB_POLITICAL_INCENTIVE_PCT",
      questions: [
        {
          id: "IAB_POLITICAL_INCENTIVE_FUNDING_ANNUAL_formula_sound",
          type: "choice",
          question: "Is the calculation methodology sound for: **Annual IAB Political Incentive Funding**?\n\n**Current result:** $2.72B\n**Calculation:** TREATY_FUNDING × IAB_POLITICAL_INCENTIVE_PCT = $2.72B",
          options: [
            "Yes - formula is appropriate",
            "No - wrong functional form",
            "No - missing key factors",
            "No - includes inappropriate factors",
            "Unsure - need more detail"
          ],
        },
        {
          id: "IAB_POLITICAL_INCENTIVE_FUNDING_ANNUAL_inputs_appropriate",
          type: "checklist",
          question: "Are these input factors appropriate?\n\n**Inputs:**\n• Annual Funding from 1% of Global Military Spending Redirected to DIH: $27.2B\n• IAB Political Incentive Funding Percentage: 10%",
          options: [
            "All inputs are appropriate",
            "Missing critical factors",
            "Includes inappropriate factors",
            "Potential overlap between factors",
            "Other issue (specify in comments)"
          ],
        },
        {
          id: "IAB_POLITICAL_INCENTIVE_FUNDING_ANNUAL_missing_factors",
          type: "text",
          question: "What important factors are missing from this calculation?",
        }
      ],
    },
    {
      rank: 20,
      name: "DIH_TREASURY_TO_MEDICAL_RESEARCH_ANNUAL",
      displayName: "Annual Funding for Pragmatic Clinical Trials",
      value: 21760000000.0,
      unit: "USD/year",
      formattedValue: "$21.8B",
      sourceType: "calculated",
      description: "Annual funding for pragmatic clinical trials (treaty funding minus VICTORY Incentive Alignment Bond payouts and IAB political incentive mechanism)",
      formula: "TREATY_FUNDING - BOND_PAYOUT - IAB_POLITICAL_INCENTIVE_FUNDING",
      questions: [
        {
          id: "DIH_TREASURY_TO_MEDICAL_RESEARCH_ANNUAL_formula_sound",
          type: "choice",
          question: "Is the calculation methodology sound for: **Annual Funding for Pragmatic Clinical Trials**?\n\n**Current result:** $21.8B\n**Calculation:** TREATY_FUNDING - BOND_PAYOUT - IAB_POLITICAL_INCENTIVE_FUNDING = $21.8B",
          options: [
            "Yes - formula is appropriate",
            "No - wrong functional form",
            "No - missing key factors",
            "No - includes inappropriate factors",
            "Unsure - need more detail"
          ],
        },
        {
          id: "DIH_TREASURY_TO_MEDICAL_RESEARCH_ANNUAL_inputs_appropriate",
          type: "checklist",
          question: "Are these input factors appropriate?\n\n**Inputs:**\n• Annual Funding from 1% of Global Military Spending Redirected to DIH: $27.2B\n• Annual VICTORY Incentive Alignment Bond Payout: $2.72B\n• Annual IAB Political Incentive Funding: $2.72B",
          options: [
            "All inputs are appropriate",
            "Missing critical factors",
            "Includes inappropriate factors",
            "Potential overlap between factors",
            "Other issue (specify in comments)"
          ],
        },
        {
          id: "DIH_TREASURY_TO_MEDICAL_RESEARCH_ANNUAL_missing_factors",
          type: "text",
          question: "What important factors are missing from this calculation?",
        }
      ],
    },
    {
      rank: 21,
      name: "DIH_TREASURY_TRIAL_SUBSIDIES_ANNUAL",
      displayName: "Annual Clinical Trial Patient Subsidies",
      value: 21720000000.0,
      unit: "USD/year",
      formattedValue: "$21.7B",
      sourceType: "calculated",
      description: "Annual clinical trial patient subsidies (all medical research funds after Decentralized Framework for Drug Assessment operations)",
      formula: "MEDICAL_RESEARCH_FUNDING - DFDA_OPEX",
      sourceRef: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html#funding-allocation",
      questions: [
        {
          id: "DIH_TREASURY_TRIAL_SUBSIDIES_ANNUAL_formula_sound",
          type: "choice",
          question: "Is the calculation methodology sound for: **Annual Clinical Trial Patient Subsidies**?\n\n**Current result:** $21.7B\n**Calculation:** MEDICAL_RESEARCH_FUNDING - DFDA_OPEX = $21.7B",
          options: [
            "Yes - formula is appropriate",
            "No - wrong functional form",
            "No - missing key factors",
            "No - includes inappropriate factors",
            "Unsure - need more detail"
          ],
        },
        {
          id: "DIH_TREASURY_TRIAL_SUBSIDIES_ANNUAL_inputs_appropriate",
          type: "checklist",
          question: "Are these input factors appropriate?\n\n**Inputs:**\n• Total Annual Decentralized Framework for Drug Assessment Operational Costs: $40M\n• Annual Funding for Pragmatic Clinical Trials: $21.8B",
          options: [
            "All inputs are appropriate",
            "Missing critical factors",
            "Includes inappropriate factors",
            "Potential overlap between factors",
            "Other issue (specify in comments)"
          ],
        },
        {
          id: "DIH_TREASURY_TRIAL_SUBSIDIES_ANNUAL_missing_factors",
          type: "text",
          question: "What important factors are missing from this calculation?",
        }
      ],
    },
    {
      rank: 22,
      name: "DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT",
      displayName: "dFDA Pragmatic Trial Cost per Patient",
      value: 929.0,
      unit: "USD/patient",
      formattedValue: "$929",
      sourceType: "external",
      description: "dFDA pragmatic trial cost per patient. Uses ADAPTABLE trial ($929) as DELIBERATELY CONSERVATIVE central estimate. Harvard meta-analysis of 108 trials found median of only $97/patient - our estimate may overstate costs by 10x. Confidence interval spans meta-analysis median to complex chronic disease trials.",
      sourceRef: "ReferenceID.PRAGMATIC_TRIALS_COST_ADVANTAGE",
      citation: {
        id: "pragmatic-trials-cost-advantage",
        title: "NIH Pragmatic Trials: Minimal Funding Despite 30x Cost Advantage",
        author: "NIH Common Fund",
        year: "2025",
        source: "NIH Common Fund: HCS Research Collaboratory",
        url: "https://commonfund.nih.gov/hcscollaboratory",
      },
      questions: [
        {
          id: "DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT_source_credibility",
          type: "rating",
          question: "Rate the credibility of this source for estimating: dFDA Pragmatic Trial Cost per Patient",
          options: [
            "1 (Not credible)",
            "2",
            "3 (Somewhat credible)",
            "4",
            "5 (Highly credible)",
            "Not qualified to assess"
          ],
        },
        {
          id: "DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT_value_reasonable",
          type: "boolean",
          question: "Is the central estimate of $929 reasonable?",
          options: [
            "Yes",
            "No"
          ],
        },
        {
          id: "DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT_better_source",
          type: "text",
          question: "Do you know of a better or more recent source?",
        },
        {
          id: "DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT_confidence_interval",
          type: "range",
          question: "The model uses a 90% confidence interval of [$97, $3K]. What is your 90% CI?",
          options: [
            "Lower bound",
            "Upper bound"
          ],
        }
      ],
    },
    {
      rank: 23,
      name: "DIH_PATIENTS_FUNDABLE_ANNUALLY",
      displayName: "Patients Fundable Annually",
      value: 23379978.471474703,
      unit: "patients/year",
      formattedValue: "23.4M patients/year",
      sourceType: "calculated",
      description: "Number of patients fundable annually at dFDA pragmatic trial cost ($1,200/patient). Based on empirical pragmatic trial costs (RECOVERY to PCORnet range).",
      formula: "TRIAL_SUBSIDIES ÷ DFDA_COST_PER_PATIENT",
      sourceRef: "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html#funding-allocation",
      questions: [
        {
          id: "DIH_PATIENTS_FUNDABLE_ANNUALLY_formula_sound",
          type: "choice",
          question: "Is the calculation methodology sound for: **Patients Fundable Annually**?\n\n**Current result:** 23.4M patients/year\n**Calculation:** TRIAL_SUBSIDIES ÷ DFDA_COST_PER_PATIENT = 23.4M patients/year",
          options: [
            "Yes - formula is appropriate",
            "No - wrong functional form",
            "No - missing key factors",
            "No - includes inappropriate factors",
            "Unsure - need more detail"
          ],
        },
        {
          id: "DIH_PATIENTS_FUNDABLE_ANNUALLY_inputs_appropriate",
          type: "checklist",
          question: "Are these input factors appropriate?\n\n**Inputs:**\n• Annual Clinical Trial Patient Subsidies: $21.7B\n• dFDA Pragmatic Trial Cost per Patient: $929",
          options: [
            "All inputs are appropriate",
            "Missing critical factors",
            "Includes inappropriate factors",
            "Potential overlap between factors",
            "Other issue (specify in comments)"
          ],
        },
        {
          id: "DIH_PATIENTS_FUNDABLE_ANNUALLY_missing_factors",
          type: "text",
          question: "What important factors are missing from this calculation?",
        }
      ],
    },
    {
      rank: 24,
      name: "DFDA_TRIAL_CAPACITY_MULTIPLIER",
      displayName: "Trial Capacity Multiplier",
      value: 12.305251827091949,
      unit: "ratio",
      formattedValue: "12.3:1",
      sourceType: "calculated",
      description: "Trial capacity multiplier from DIH funding capacity vs. current global trial participation",
      formula: "DIH_PATIENTS_FUNDABLE ÷ CURRENT_TRIAL_SLOTS",
      questions: [
        {
          id: "DFDA_TRIAL_CAPACITY_MULTIPLIER_formula_sound",
          type: "choice",
          question: "Is the calculation methodology sound for: **Trial Capacity Multiplier**?\n\n**Current result:** 12.3:1x\n**Calculation:** DIH_PATIENTS_FUNDABLE ÷ CURRENT_TRIAL_SLOTS = 12.3:1",
          options: [
            "Yes - formula is appropriate",
            "No - wrong functional form",
            "No - missing key factors",
            "No - includes inappropriate factors",
            "Unsure - need more detail"
          ],
        },
        {
          id: "DFDA_TRIAL_CAPACITY_MULTIPLIER_inputs_appropriate",
          type: "checklist",
          question: "Are these input factors appropriate?\n\n**Inputs:**\n• Annual Global Clinical Trial Participants: 1.90M patients/year\n• Patients Fundable Annually: 23.4M patients/year",
          options: [
            "All inputs are appropriate",
            "Missing critical factors",
            "Includes inappropriate factors",
            "Potential overlap between factors",
            "Other issue (specify in comments)"
          ],
        },
        {
          id: "DFDA_TRIAL_CAPACITY_MULTIPLIER_missing_factors",
          type: "text",
          question: "What important factors are missing from this calculation?",
        }
      ],
    },
    {
      rank: 25,
      name: "DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS",
      displayName: "dFDA Treatment Timeline Acceleration",
      value: 203.65267802332718,
      unit: "years",
      formattedValue: "204 years",
      sourceType: "calculated",
      description: "Years earlier the average first treatment arrives due to dFDA's trial capacity increase. Calculated as the status quo timeline reduced by the inverse of the capacity multiplier. Uses only trial capacity multiplier (not combined with valley of death rescue) because additional candidates don't directly speed queue processing.",
      formula: "STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT × (1 - 1/DFDA_TRIAL_CAPACITY_MULTIPLIER)",
      questions: [
        {
          id: "DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS_formula_sound",
          type: "choice",
          question: "Is the calculation methodology sound for: **dFDA Treatment Timeline Acceleration**?\n\n**Current result:** 204 yearsx\n**Calculation:** 222 years × (1 - 1/12.3:1) = 204 years",
          options: [
            "Yes - formula is appropriate",
            "No - wrong functional form",
            "No - missing key factors",
            "No - includes inappropriate factors",
            "Unsure - need more detail"
          ],
        },
        {
          id: "DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS_inputs_appropriate",
          type: "checklist",
          question: "Are these input factors appropriate?\n\n**Inputs:**\n• Status Quo Average Years to First Treatment: 222 years\n• Trial Capacity Multiplier: 12.3:1",
          options: [
            "All inputs are appropriate",
            "Missing critical factors",
            "Includes inappropriate factors",
            "Potential overlap between factors",
            "Other issue (specify in comments)"
          ],
        },
        {
          id: "DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS_missing_factors",
          type: "text",
          question: "What important factors are missing from this calculation?",
        }
      ],
    },
    {
      rank: 26,
      name: "EFFICACY_LAG_YEARS",
      displayName: "Regulatory Delay for Efficacy Testing Post-Safety Verification",
      value: 8.2,
      unit: "years",
      formattedValue: "8.2 years",
      sourceType: "external",
      description: "Regulatory delay for efficacy testing (Phase II/III) post-safety verification. Based on BIO 2021 industry survey. Note: This is for drugs that COMPLETE the pipeline - survivor bias means actual delay for any given disease may be longer if candidates fail and must restart.",
      formula: "TOTAL_TIME_TO_MARKET - PHASE_1_DURATION",
      sourceRef: "ReferenceID.BIO_CLINICAL_DEVELOPMENT_2021",
      citation: {
        id: "bio-clinical-development-2021",
        title: "BIO Clinical Development Success Rates 2011-2020",
        author: "Biotechnology Innovation Organization (BIO)",
        year: "2021",
        source: "Biotechnology Innovation Organization (BIO)",
        url: "https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf",
      },
      questions: [
        {
          id: "EFFICACY_LAG_YEARS_source_credibility",
          type: "rating",
          question: "Rate the credibility of this source for estimating: Regulatory Delay for Efficacy Testing Post-Safety Verification",
          options: [
            "1 (Not credible)",
            "2",
            "3 (Somewhat credible)",
            "4",
            "5 (Highly credible)",
            "Not qualified to assess"
          ],
        },
        {
          id: "EFFICACY_LAG_YEARS_value_reasonable",
          type: "boolean",
          question: "Is the central estimate of 8.2 years years reasonable?",
          options: [
            "Yes",
            "No"
          ],
        },
        {
          id: "EFFICACY_LAG_YEARS_better_source",
          type: "text",
          question: "Do you know of a better or more recent source?",
        }
      ],
    },
    {
      rank: 27,
      name: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS",
      displayName: "dFDA Average Total Timeline Shift",
      value: 211.85267802332717,
      unit: "years",
      formattedValue: "212 years",
      sourceType: "calculated",
      description: "Average years earlier patients receive treatments due to dFDA. Combines treatment timeline acceleration from increased trial capacity with efficacy lag elimination for treatments already discovered.",
      formula: "DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS + EFFICACY_LAG_YEARS",
      questions: [
        {
          id: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS_formula_sound",
          type: "choice",
          question: "Is the calculation methodology sound for: **dFDA Average Total Timeline Shift**?\n\n**Current result:** 212 years years\n**Calculation:** 204 years + 8.2 years = 212 years",
          options: [
            "Yes - formula is appropriate",
            "No - wrong functional form",
            "No - missing key factors",
            "No - includes inappropriate factors",
            "Unsure - need more detail"
          ],
        },
        {
          id: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS_inputs_appropriate",
          type: "checklist",
          question: "Are these input factors appropriate?\n\n**Inputs:**\n• dFDA Treatment Timeline Acceleration: 204 years\n• Regulatory Delay for Efficacy Testing Post-Safety Verification: 8.2 years",
          options: [
            "All inputs are appropriate",
            "Missing critical factors",
            "Includes inappropriate factors",
            "Potential overlap between factors",
            "Other issue (specify in comments)"
          ],
        },
        {
          id: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS_missing_factors",
          type: "text",
          question: "What important factors are missing from this calculation?",
        }
      ],
    },
    {
      rank: 28,
      name: "GLOBAL_ANNUAL_DALY_BURDEN",
      displayName: "Global Annual DALY Burden",
      value: 2880000000.0,
      unit: "DALYs/year",
      formattedValue: "2.88B DALYs/year",
      sourceType: "external",
      description: "Global annual DALY burden from all diseases and injuries (WHO/IHME Global Burden of Disease 2021). Includes both YLL (years of life lost) and YLD (years lived with disability) from all causes.",
      sourceRef: "ReferenceID.IHME_GBD_2021",
      citation: {
        id: "ihme-gbd-2021",
        title: "IHME Global Burden of Disease 2021 (2.88B DALYs, 1.13B YLD)",
        author: "Institute for Health Metrics and Evaluation (IHME)",
        year: "2024",
        source: "Institute for Health Metrics and Evaluation (IHME)",
        url: "https://vizhub.healthdata.org/gbd-results/",
      },
      questions: [
        {
          id: "GLOBAL_ANNUAL_DALY_BURDEN_source_credibility",
          type: "rating",
          question: "Rate the credibility of this source for estimating: Global Annual DALY Burden",
          options: [
            "1 (Not credible)",
            "2",
            "3 (Somewhat credible)",
            "4",
            "5 (Highly credible)",
            "Not qualified to assess"
          ],
        },
        {
          id: "GLOBAL_ANNUAL_DALY_BURDEN_value_reasonable",
          type: "boolean",
          question: "Is the central estimate of 2.88B DALYs/year reasonable?",
          options: [
            "Yes",
            "No"
          ],
        },
        {
          id: "GLOBAL_ANNUAL_DALY_BURDEN_better_source",
          type: "text",
          question: "Do you know of a better or more recent source?",
        }
      ],
    },
    {
      rank: 29,
      name: "EVENTUALLY_AVOIDABLE_DALY_PCT",
      displayName: "Eventually Avoidable DALY Percentage",
      value: 0.9262780790085205,
      unit: "percentage",
      formattedValue: "92.6%",
      sourceType: "definition",
      description: "Percentage of DALYs that are eventually avoidable with sufficient biomedical research. Uses same methodology as EVENTUALLY_AVOIDABLE_DEATH_PCT. Most non-fatal chronic conditions (arthritis, depression, chronic pain) are also addressable through research, so the percentage is similar to deaths.",
      formula: "1 - FUNDAMENTALLY_UNAVOIDABLE_DEATH_PCT",
      questions: [
        {
          id: "EVENTUALLY_AVOIDABLE_DALY_PCT_assumption_reasonable",
          type: "rating",
          question: "Is this assumption reasonable: Eventually Avoidable DALY Percentage = 92.6%",
          options: [
            "1 (Unreasonable)",
            "2 (Questionable)",
            "3 (Acceptable)",
            "4 (Reasonable)",
            "5 (Very reasonable)",
            "Not qualified to assess"
          ],
        },
        {
          id: "EVENTUALLY_AVOIDABLE_DALY_PCT_alternative_value",
          type: "text",
          question: "What value would you use instead? (Current: 92.6%)",
        },
        {
          id: "EVENTUALLY_AVOIDABLE_DALY_PCT_confidence_interval",
          type: "range",
          question: "The model uses a 90% confidence interval of [50%, 98%]. What is your 90% CI?",
          options: [
            "Lower bound",
            "Upper bound"
          ],
        }
      ],
    },
    {
      rank: 30,
      name: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS",
      displayName: "Total DALYs from Elimination of Efficacy Lag Plus Earlier Treatment Discovery from Higher Trial Throughput",
      value: 565155335900.9033,
      unit: "DALYs",
      formattedValue: "565B DALYs",
      sourceType: "calculated",
      description: "Total DALYs averted from the combined dFDA timeline shift. Calculated as annual global DALY burden × eventually avoidable percentage × timeline shift years. Includes both fatal and non-fatal diseases (WHO GBD methodology).",
      formula: "GLOBAL_ANNUAL_DALY_BURDEN × EVENTUALLY_AVOIDABLE_DALY_PCT × TIMELINE_SHIFT",
      questions: [
        {
          id: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS_formula_sound",
          type: "choice",
          question: "Is the calculation methodology sound for: **Total DALYs from Elimination of Efficacy Lag Plus Earlier Treatment Discovery from Higher Trial Throughput**?\n\n**Current result:** 565B DALYs DALYs\n**Calculation:** 2.88B DALYs/year × 92.6% × TIMELINE_SHIFT = 565B DALYs",
          options: [
            "Yes - formula is appropriate",
            "No - wrong functional form",
            "No - missing key factors",
            "No - includes inappropriate factors",
            "Unsure - need more detail"
          ],
        },
        {
          id: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS_inputs_appropriate",
          type: "checklist",
          question: "Are these input factors appropriate?\n\n**Inputs:**\n• Global Annual DALY Burden: 2.88B DALYs/year\n• Eventually Avoidable DALY Percentage: 92.6%\n• dFDA Average Total Timeline Shift: 212 years",
          options: [
            "All inputs are appropriate",
            "Missing critical factors",
            "Includes inappropriate factors",
            "Potential overlap between factors",
            "Other issue (specify in comments)"
          ],
        },
        {
          id: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS_missing_factors",
          type: "text",
          question: "What important factors are missing from this calculation?",
        }
      ],
    }
  ],
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get parameter by rank
 */
export function getParameterByRank(rank: number): SurveyParameter | undefined {
  return economistSurvey.parameters.find(p => p.rank === rank);
}

/**
 * Get parameter by name
 */
export function getParameterByName(name: string): SurveyParameter | undefined {
  return economistSurvey.parameters.find(p => p.name === name);
}

/**
 * Get all parameters of a specific source type
 */
export function getParametersByType(sourceType: SourceType): SurveyParameter[] {
  return economistSurvey.parameters.filter(p => p.sourceType === sourceType);
}

/**
 * Get total number of questions
 */
export function getTotalQuestions(): number {
  return economistSurvey.parameters.reduce((sum, p) => sum + p.questions.length, 0);
}

/**
 * Calculate completion percentage
 */
export function getCompletionPercentage(currentRank: number): number {
  const total = economistSurvey.metadata.parameterCount;
  return Math.round((currentRank / total) * 100);
}

/**
 * Get questions for a specific parameter
 */
export function getQuestionsForParameter(paramName: string): SurveyQuestion[] {
  const param = getParameterByName(paramName);
  return param?.questions || [];
}

/**
 * Check if parameter has citation
 */
export function hasCitation(param: SurveyParameter): boolean {
  return !!param.citation;
}
