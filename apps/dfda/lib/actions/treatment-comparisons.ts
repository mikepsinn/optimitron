'use server';

import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { logger } from '@/lib/logger';
import { GOOGLE_AI_MODEL } from '../ai/google';
import type { TreatmentForCondition, TreatmentComparisonResult } from '@/types/treatment';
import { env } from '@/lib/env';

const LOG_PREFIX = '[treatment-comparisons]';

// Use the GOOGLE_GENERATIVE_AI_API_KEY from environment
const API_KEY = env.GOOGLE_GENERATIVE_AI_API_KEY;
const MODEL_ID = GOOGLE_AI_MODEL;

if (!API_KEY) {
  const errorMsg = `${LOG_PREFIX} GOOGLE_GENERATIVE_AI_API_KEY is not configured. Please set it in your .env file.`;
  logger.error(errorMsg);
  throw new Error(errorMsg);
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

// Safety settings
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * Get evidence-based treatment comparisons using Google Gen AI with structured output
 * @param conditionName The medical condition to get treatment comparisons for
 * @returns Promise with structured treatment comparison data
 */
export async function getTreatmentComparisonsAction(
  conditionName: string
): Promise<TreatmentComparisonResult | null> {
  logger.info(`${LOG_PREFIX} Getting treatment comparisons for condition:`, { conditionName });

  if (!API_KEY) {
    logger.error(`${LOG_PREFIX} GOOGLE_GENERATIVE_AI_API_KEY is not configured.`);
    return null;
  }

  if (!conditionName) {
    logger.warn(`${LOG_PREFIX} Condition name is empty.`);
    return null;
  }

  try {
    const prompt = `List the top 5-7 most effective evidence-based treatments for ${conditionName}.
    For each treatment, provide:
    - The treatment name (generic drug name or therapy type)
    - Effectiveness rating (0-100, based on clinical evidence and meta-analyses)
    - Confidence score (0-100) based on: quality of evidence (RCTs > observational), number of trials, consistency of results, sample sizes
    - Evidence quality (high/moderate/low/very-low) based on GRADE criteria
    - Safety score (0-100) using this comparative scale with specific reference substances:
      * 100: Air, Water
      * 95: Exercise, Walking
      * 90: Vitamin C, Vitamin D
      * 85: Probiotics, Fish oil supplements
      * 80: Low-dose Aspirin (81mg), Acetaminophen/Tylenol (normal dose)
      * 75: Ibuprofen (normal dose), Naproxen
      * 70: Antibiotics (Amoxicillin, Penicillin), Antihypertensives (Lisinopril)
      * 65: Statins (Atorvastatin), Metformin, Levothyroxine
      * 60: SSRIs (Sertraline, Fluoxetine), Birth control pills
      * 55: Insulin, Warfarin (with monitoring)
      * 50: Prednisone (low-medium dose), Albuterol
      * 45: Opioids (Morphine, Oxycodone), Benzodiazepines (Diazepam)
      * 40: Fentanyl, Antipsychotics (Haloperidol)
      * 35: High-dose corticosteroids, Tacrolimus (immunosuppressant)
      * 30: Methotrexate, Lithium, Beer/Alcohol (chronic use)
      * 25: Chemotherapy (Cisplatin, Doxorubicin), Radiation therapy
      * 20: Cigarettes (long-term), Interferon
      * 15: Cocaine, Methamphetamine, Heroin
      * 10: Heavy metals (Lead, Mercury), Arsenic
      * 5: Cyanide (sub-lethal), Ricin, Botulinum toxin
      * 0: Lethal poisons, Cyanide (lethal dose)
    - Approximate number of clinical trials
    - Approximate total number of trial participants
    - Common side effects with their occurrence percentages
    - NNT (Number Needed to Treat) if available from meta-analyses
    - NNH (Number Needed to Harm) if available from meta-analyses
    - Time to effect: How long until treatment shows effect (e.g., "immediate", "1-2 weeks", "3-6 months", "6-12 months")
    - Response rate: Percentage of patients who respond to treatment (0-100)
    - Remission rate: Percentage achieving complete symptom resolution (0-100)
    - Treatment duration: Typical length of treatment (e.g., "7 days", "12 weeks", "6 months", "1-2 years", "lifetime")
    - Dosage range: Typical dosage for this condition (e.g., "50-200mg daily", "30 minutes daily")
    - Clinical trial phases (e.g., Phase 1, Phase 2, Phase 3, Phase 4)

    - Health Economics Data (CRITICAL - extract from published studies when available):
      * QALYs gained: Quality-adjusted life years gained vs no treatment (e.g., 0.5, 1.2, 2.5)
        - PRIORITIZE: Extract from published health economics studies, systematic reviews, or meta-analyses
        - If not available, estimate from clinical outcomes (response rate, remission rate, survival data)
      * ICER: Incremental cost-effectiveness ratio in $/QALY (CRITICAL - actively search for this data)
        - SEARCH SPECIFICALLY IN: NICE Technology Appraisals, ICER (Institute for Clinical and Economic Review) reports, 
          CADTH (Canadian Agency for Drugs and Technologies in Health) reports, health economics journals
        - Look for: Cost-effectiveness analyses, budget impact analyses, value assessments
        - Format: Numeric value in USD per QALY (e.g., 45000, 125000)
        - If ICER not found but cost-effectiveness rating available, use that instead
      * Cost-effectiveness rating: "excellent" (< $50k/QALY or dominates), "good" ($50-100k/QALY), 
        "moderate" ($100-150k/QALY), or "poor" (> $150k/QALY) - calculate from ICER if rating not explicitly stated
      * Annual cost of care breakdown (in USD - be comprehensive):
        - Drug cost: Annual cost of medication/treatment (generic if available, brand if not)
        - Monitoring cost: Annual cost of lab work, imaging, follow-up visits (typical for this condition category)
        - Side effect management: Expected annual cost of managing common side effects
        - Total annual cost: Sum of all above components
      * Cost per responder: Total cost to achieve one treatment response (calculate: annual cost / response rate * 100)
      * Cost per remission: Total cost to achieve one complete remission (calculate: annual cost / remission rate * 100)
      * vsComparator: If available, compare to standard first-line treatment:
        - comparatorName: Name of standard treatment
        - costDifference: Cost difference (positive = more expensive, negative = cheaper)
        - qalysGainedDifference: QALY difference (positive = better outcomes)
        - dominates: True if both cheaper AND more effective
      * Prescription Access Economics (if treatment is prescription-only):
        - prescriptionRequired: True if currently Rx-only, false if OTC available
        - otcAvailable: True if OTC version exists
        - If prescriptionRequired is true, estimate annual societal costs:
          * annualPhysicianVisitCost: Annual cost of doctor visits for prescriptions (typically $100-150 per visit × visit frequency)
          * annualPrescriptionCost: Annual Rx price (brand or generic)
          * annualOtcCost: What OTC price would be if available (typically 2-5x lower)
          * annualTimeCost: Travel + wait + visit time value (typically $20-50 per visit × visit frequency)
          * annualInsuranceAdminCost: Prior authorization and claims processing ($10-30 per prescription × frequency)
          * netSocietalLossFromRxOnly: Total annual loss per patient = (physician visits + time costs + admin costs + price premium) - (early treatment benefits)
          * earlyTreatmentBenefit: QALYs gained from faster OTC access (0.1-0.5 typical for preventable complications)
          * preventedComplicationCost: Cost savings from early treatment (varies by condition)
        - Risk assessment:
          * misuseRisk: 'low' if very safe, 'moderate' if some risk, 'high' if significant safety concerns
          * missedDiagnosisRisk: 'low' if symptoms don't mask serious conditions, 'high' if could delay diagnosis
          * requiresMonitoring: True if condition needs lab work/checkups (e.g., diabetes, hypertension)

    Rank treatments by effectiveness. Use evidence from systematic reviews, meta-analyses,
    and large-scale clinical trials. Focus on FDA-approved or widely-accepted treatments.
    
    FOR PRESCRIPTION ACCESS ECONOMICS:
    - Only calculate for treatments with safety score > 70 (relatively safe)
    - Consider: Does this treatment require monitoring? (skip if yes)
    - Research: Is there an OTC version? Has FDA considered switching?
    - Estimate visit frequency: Chronic conditions (4-12 visits/year), acute (1-2 visits/year)
    
    FOR HEALTH ECONOMICS DATA - USE THESE SPECIFIC SOURCES:
    1. NICE Technology Appraisals (UK) - https://www.nice.org.uk/guidance/published
    2. ICER Reports (US) - https://icer.org/our-work/
    3. CADTH Reports (Canada) - https://www.cadth.ca/
    4. Health economics journals: Value in Health, PharmacoEconomics, Journal of Medical Economics
    5. PubMed searches for "cost-effectiveness" + treatment name + condition name
    6. Cochrane reviews with economic evaluations
    
    PRIORITIZE extracting ICER values and QALY data from these authoritative sources. If ICER is not available,
    provide cost-effectiveness rating based on available evidence.`;

    const response = await genAI.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        safetySettings,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            treatments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: 'Generic name of the treatment or therapy',
                  },
                  effectiveness: {
                    type: Type.NUMBER,
                    description: 'Effectiveness rating from 0-100 based on clinical evidence',
                  },
                  confidenceScore: {
                    type: Type.NUMBER,
                    description: 'Confidence score 0-100 based on quality and quantity of evidence',
                  },
                  safetyScore: {
                    type: Type.NUMBER,
                    description: 'Comparative safety score 0-100 (higher is safer)',
                  },
                  trials: {
                    type: Type.NUMBER,
                    description: 'Approximate number of clinical trials',
                  },
                  participants: {
                    type: Type.NUMBER,
                    description: 'Approximate total number of trial participants',
                  },
                  sideEffects: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: {
                          type: Type.STRING,
                          description: 'Name of the side effect',
                        },
                        percentage: {
                          type: Type.NUMBER,
                          description: 'Occurrence percentage',
                        },
                      },
                      required: ['name', 'percentage'],
                    },
                  },
                  nnt: {
                    type: Type.NUMBER,
                    description: 'Number Needed to Treat (from meta-analyses, optional)',
                    nullable: true,
                  },
                  nnh: {
                    type: Type.NUMBER,
                    description: 'Number Needed to Harm (from meta-analyses, optional)',
                    nullable: true,
                  },
                  timeToEffect: {
                    type: Type.STRING,
                    description: 'How long until treatment shows effect (optional)',
                    nullable: true,
                  },
                  responseRate: {
                    type: Type.NUMBER,
                    description: 'Percentage of patients who respond to treatment 0-100 (optional)',
                    nullable: true,
                  },
                  remissionRate: {
                    type: Type.NUMBER,
                    description: 'Percentage achieving complete symptom resolution 0-100 (optional)',
                    nullable: true,
                  },
                  treatmentDuration: {
                    type: Type.STRING,
                    description: 'Typical length of treatment (optional)',
                    nullable: true,
                  },
                  phase: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.STRING,
                    },
                    description: 'Clinical trial phases (e.g., Phase 3, Phase 4)',
                  },
                  dosageRange: {
                    type: Type.STRING,
                    description: 'Typical dosage for this condition',
                    nullable: true,
                  },
                  evidenceQuality: {
                    type: Type.STRING,
                    description: 'GRADE quality rating (high, moderate, low, very-low)',
                    nullable: true,
                  },
                  healthEconomics: {
                    type: Type.OBJECT,
                    description: 'Health economics and cost-effectiveness data',
                    nullable: true,
                    properties: {
                      qalysGained: {
                        type: Type.NUMBER,
                        description: 'Quality-adjusted life years gained vs no treatment',
                        nullable: true,
                      },
                      icer: {
                        type: Type.NUMBER,
                        description: 'Incremental cost-effectiveness ratio ($/QALY)',
                        nullable: true,
                      },
                      costEffectivenessRating: {
                        type: Type.STRING,
                        description: 'excellent, good, moderate, or poor',
                        nullable: true,
                      },
                      annualCostOfCare: {
                        type: Type.OBJECT,
                        nullable: true,
                        properties: {
                          drugCost: {
                            type: Type.NUMBER,
                            description: 'Annual drug cost in USD',
                          },
                          monitoringCost: {
                            type: Type.NUMBER,
                            description: 'Annual monitoring cost (labs, visits) in USD',
                          },
                          sideEffectManagement: {
                            type: Type.NUMBER,
                            description: 'Annual side effect management cost in USD',
                          },
                          totalAnnual: {
                            type: Type.NUMBER,
                            description: 'Total annual cost in USD',
                          },
                        },
                        required: ['drugCost', 'monitoringCost', 'sideEffectManagement', 'totalAnnual'],
                      },
                      costPerResponder: {
                        type: Type.NUMBER,
                        description: 'Cost to achieve one treatment response',
                        nullable: true,
                      },
                      costPerRemission: {
                        type: Type.NUMBER,
                        description: 'Cost to achieve one complete remission',
                        nullable: true,
                      },
                      vsComparator: {
                        type: Type.OBJECT,
                        description: 'Comparison to standard first-line treatment',
                        nullable: true,
                        properties: {
                          comparatorName: {
                            type: Type.STRING,
                            description: 'Name of standard treatment',
                          },
                          costDifference: {
                            type: Type.NUMBER,
                            description: 'Cost difference (positive = more expensive, negative = cheaper)',
                          },
                          qalysGainedDifference: {
                            type: Type.NUMBER,
                            description: 'QALY difference (positive = better outcomes)',
                          },
                          dominates: {
                            type: Type.BOOLEAN,
                            description: 'True if both cheaper AND more effective',
                          },
                        },
                      },
                      prescriptionAccess: {
                        type: Type.OBJECT,
                        description: 'Prescription access economics (only for Rx-only treatments with safety score > 70)',
                        nullable: true,
                        properties: {
                          prescriptionRequired: {
                            type: Type.BOOLEAN,
                            description: 'True if currently prescription-only',
                          },
                          otcAvailable: {
                            type: Type.BOOLEAN,
                            description: 'True if OTC version exists',
                          },
                          annualPhysicianVisitCost: {
                            type: Type.NUMBER,
                            description: 'Annual cost of doctor visits for prescriptions',
                            nullable: true,
                          },
                          annualPrescriptionCost: {
                            type: Type.NUMBER,
                            description: 'Annual Rx price',
                            nullable: true,
                          },
                          annualOtcCost: {
                            type: Type.NUMBER,
                            description: 'Annual OTC price if available',
                            nullable: true,
                          },
                          annualTimeCost: {
                            type: Type.NUMBER,
                            description: 'Annual time cost (travel + wait + visit)',
                            nullable: true,
                          },
                          annualInsuranceAdminCost: {
                            type: Type.NUMBER,
                            description: 'Annual insurance administrative costs',
                            nullable: true,
                          },
                          netSocietalLossFromRxOnly: {
                            type: Type.NUMBER,
                            description: 'Annual net societal loss per patient from Rx-only status',
                            nullable: true,
                          },
                          earlyTreatmentBenefit: {
                            type: Type.NUMBER,
                            description: 'QALYs gained from earlier OTC access',
                            nullable: true,
                          },
                          preventedComplicationCost: {
                            type: Type.NUMBER,
                            description: 'Cost savings from early treatment',
                            nullable: true,
                          },
                          misuseRisk: {
                            type: Type.STRING,
                            description: 'Safety concern level: low, moderate, or high',
                            nullable: true,
                          },
                          missedDiagnosisRisk: {
                            type: Type.STRING,
                            description: 'Risk of masking symptoms: low, moderate, or high',
                            nullable: true,
                          },
                          requiresMonitoring: {
                            type: Type.BOOLEAN,
                            description: 'Whether condition requires medical monitoring',
                            nullable: true,
                          },
                        },
                      },
                    },
                  },
                },
                required: ['name', 'effectiveness', 'confidenceScore', 'safetyScore', 'trials', 'participants', 'sideEffects'],
                propertyOrdering: ['name', 'effectiveness', 'confidenceScore', 'safetyScore', 'trials', 'participants', 'sideEffects', 'nnt', 'nnh', 'timeToEffect', 'responseRate', 'remissionRate', 'treatmentDuration', 'dosageRange', 'evidenceQuality', 'phase', 'healthEconomics'],
              },
            },
          },
          required: ['treatments'],
        },
      },
    });

    logger.info(`${LOG_PREFIX} Received response from Google Gen AI`);

    const responseText = response.text;
    if (!responseText) {
      logger.warn(`${LOG_PREFIX} No response text from API`);
      return null;
    }

    // Parse the JSON response
    const parsedData = JSON.parse(responseText);
    const treatments = parsedData.treatments as TreatmentForCondition[];

    if (!treatments || treatments.length === 0) {
      logger.warn(`${LOG_PREFIX} No treatments found in response`);
      return null;
    }

    logger.info(`${LOG_PREFIX} Successfully processed ${treatments.length} treatments`);

    return {
      conditionName,
      treatments,
      lastUpdated: new Date().toISOString(),
      dataSource: 'google-ai',
    };
  } catch (err: any) {
    logger.error(`${LOG_PREFIX} Error calling Google Gen AI API:`, {
      message: err.message,
      stack: err.stack?.split('\n').map((line: string) => line.trim()),
    });
    return null;
  }
}
