import conditionsData from "./medical-data/conditions.json";
import treatmentsData from "./medical-data/treatments.json";
import referencesData from "./medical-data/references.json";
import treatmentsIndexData from "./medical-data/treatments/index.json";
import { medicalNameToSlug } from "./medical-slug";

export { medicalNameToSlug } from "./medical-slug";

export type ConditionCategory =
  | "DERMATOLOGICAL"
  | "RENAL"
  | "GASTROINTESTINAL"
  | "METABOLIC"
  | "CANCER"
  | "ENDOCRINE"
  | "NEUROLOGICAL"
  | "INFECTIOUS_DISEASE"
  | "MENTAL_HEALTH"
  | "CARDIOVASCULAR"
  | "IMMUNOLOGICAL"
  | "RESPIRATORY"
  | "MUSCULOSKELETAL"
  | "HEMATOLOGICAL"
  | "UROLOGICAL"
  | "OPHTHALMOLOGICAL"
  | "OTHER";

export interface Condition {
  name: string;
  slug: string;
  description: string;
  emoji: string;
  peopleAffected: number;
  newCasesPerYear: number;
  deathsPerYear: number;
  activeTrialCount: number;
  globalFundingUSD: number;
  category: ConditionCategory;
  icd10Codes: string | null;
  dataSourceYear: number;
  synonyms: string[];
  disabilityAdjustedLifeYears: number | null;
  yearsLivedWithDisability: number | null;
  yearsLostToPrematureDeath: number | null;
}

export interface TreatmentConditionSummary {
  conditionName: string;
  conditionSlug: string;
  effectiveness: number;
  safetyScore: number;
  trials: number;
  participants: number;
}

export interface SideEffect {
  name: string;
  nnh?: number;
  percentage: number;
  severity?: "mild" | "moderate" | "severe";
}

export interface OutcomeMeasure {
  absoluteChange?: string;
  baseline?: string;
  dataSource?: "trial" | "ai-estimated";
  isPositive?: boolean;
  name: string;
  percentageChange?: number;
}

export interface TreatmentCitation {
  pubmedId?: string;
  title?: string;
  type?: "study" | "literature" | "meta-analysis" | "guideline";
  url: string;
  year?: number;
}

export interface HealthEconomics {
  annualCostOfCare?: {
    drugCost: number;
    monitoringCost: number;
    sideEffectManagement: number;
    totalAnnual: number;
  };
  costEffectivenessRating?: "excellent" | "good" | "moderate" | "poor" | "dominated";
  costPerQALY?: number;
  costPerRemission?: number | null;
  costPerResponder?: number;
  icer?: number | null;
  icerVsComparator?: string;
  qalysGained?: number;
  qalysVsComparator?: number;
  prescriptionAccess?: {
    annualInsuranceAdminCost?: number;
    annualOtcCost?: number;
    annualPhysicianVisitCost?: number;
    annualPrescriptionCost?: number;
    annualTimeCost?: number;
    earlyTreatmentBenefit?: number;
    missedDiagnosisRisk?: "low" | "moderate" | "high";
    misuseRisk?: "low" | "moderate" | "high";
    netSocietalLossFromRxOnly?: number;
    otcAvailable: boolean;
    prescriptionRequired: boolean;
    preventedComplicationCost?: number;
    requiresMonitoring?: boolean;
  } | null;
  vsComparator?: {
    comparatorName: string;
    costDifference: number;
    dominates: boolean;
    qalysGainedDifference: number;
  } | null;
}

export interface TreatmentForCondition {
  citations?: TreatmentCitation[];
  confidenceScore: number;
  dosageRange?: string;
  effectiveness: number;
  evidenceQuality?: "high" | "moderate" | "low" | "very-low";
  healthEconomics?: HealthEconomics;
  name: string;
  nnh?: number;
  nnt?: number;
  participants: number;
  phase?: string[];
  primaryOutcomes?: OutcomeMeasure[];
  recentTrials?: Array<{
    nctId: string;
    status: string;
    title: string;
  }>;
  remissionRate?: number;
  responseRate?: number;
  safetyScore: number;
  secondaryOutcomes?: OutcomeMeasure[];
  sideEffects: SideEffect[];
  timeToEffect?: string;
  treatmentDuration?: string;
  trials: number;
}

export interface ConditionTreatmentsFile {
  conditionName: string;
  dataSource: "google-ai" | "clinical-trials-gov" | "mixed" | "hybrid";
  lastUpdated: string;
  treatments: TreatmentForCondition[];
}

export interface TreatmentWithConditions {
  name: string;
  slug: string;
  conditions: TreatmentConditionSummary[];
  totalTrials: number;
  totalParticipants: number;
  avgEffectiveness: number;
  avgSafetyScore: number;
}

export interface MedicalReferencesData {
  metadata: {
    title: string;
    description: string;
  };
  references: Array<{
    id: string;
    title: string;
    quotes: string[];
    sources: Array<{ text: string; url: string }>;
    notes?: string;
  }>;
}

export const MEDICAL_CONDITIONS = conditionsData as Condition[];
export const MEDICAL_TREATMENTS = treatmentsData as TreatmentWithConditions[];
export const MEDICAL_REFERENCES = referencesData as MedicalReferencesData;
export const MEDICAL_TREATMENT_CONDITION_SLUGS = (
  treatmentsIndexData as { conditions: string[] }
).conditions;

export function getAllConditions(): Condition[] {
  return MEDICAL_CONDITIONS;
}

export function getConditionBySlug(slug: string): Condition | undefined {
  return MEDICAL_CONDITIONS.find((condition) => condition.slug === slug);
}

export function getConditionByName(name: string): Condition | undefined {
  const normalized = name.trim().toLowerCase();
  return MEDICAL_CONDITIONS.find(
    (condition) => condition.name.toLowerCase() === normalized,
  );
}

export function searchConditions(query: string): Condition[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return MEDICAL_CONDITIONS;

  return MEDICAL_CONDITIONS.filter(
    (condition) =>
      condition.name.toLowerCase().includes(normalized) ||
      condition.description.toLowerCase().includes(normalized) ||
      condition.synonyms.some((synonym) =>
        synonym.toLowerCase().includes(normalized),
      ),
  );
}

export function getConditionsByCategory(category: ConditionCategory): Condition[] {
  return MEDICAL_CONDITIONS.filter(
    (condition) => condition.category === category,
  );
}

export function getAllTreatments(): TreatmentWithConditions[] {
  return MEDICAL_TREATMENTS;
}

export function getTreatmentBySlug(
  slug: string,
): TreatmentWithConditions | undefined {
  return MEDICAL_TREATMENTS.find((treatment) => treatment.slug === slug);
}

export function searchTreatments(query: string): TreatmentWithConditions[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return MEDICAL_TREATMENTS;

  return MEDICAL_TREATMENTS.filter((treatment) =>
    treatment.name.toLowerCase().includes(normalized),
  );
}

export function getTreatmentSummariesForCondition(
  conditionSlug: string,
): Array<TreatmentWithConditions & { condition: TreatmentConditionSummary }> {
  return MEDICAL_TREATMENTS.flatMap((treatment) => {
    const condition = treatment.conditions.find(
      (entry) => entry.conditionSlug === conditionSlug,
    );
    return condition ? [{ ...treatment, condition }] : [];
  }).sort((a, b) => b.condition.participants - a.condition.participants);
}

export async function getTreatmentsByConditionSlug(
  conditionSlug: string,
): Promise<ConditionTreatmentsFile | null> {
  const normalizedSlug = conditionSlug.trim().toLowerCase();
  if (!normalizedSlug) return null;

  try {
    const data = await import(
      `./medical-data/treatments/${normalizedSlug}.json`
    );
    return data.default as ConditionTreatmentsFile;
  } catch {
    return null;
  }
}

export async function getTreatmentForCondition(
  conditionSlug: string,
  treatmentSlug: string,
): Promise<TreatmentForCondition | null> {
  const conditionTreatments = await getTreatmentsByConditionSlug(conditionSlug);
  if (!conditionTreatments) return null;

  return (
    conditionTreatments.treatments.find(
      (treatment) => medicalNameToSlug(treatment.name) === treatmentSlug,
    ) ?? null
  );
}

/** Condition slugs that have a per-condition treatment evidence file. */
export function getConditionSlugsWithTreatments(): string[] {
  return MEDICAL_TREATMENT_CONDITION_SLUGS;
}

export function getMedicalReferences(): MedicalReferencesData {
  return MEDICAL_REFERENCES;
}
