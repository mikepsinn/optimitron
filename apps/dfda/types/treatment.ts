/**
 * Treatment types for DFDA — encyclopedia shapes live in @optimitron/data.
 * Future/profile types that are not shipped yet stay local.
 */

export type {
  SideEffect,
  OutcomeMeasure,
  TreatmentCitation,
  HealthEconomics,
  TreatmentForCondition,
  TreatmentWithConditions,
  ConditionTreatmentsFile,
  TreatmentConditionSummary,
} from "@optimitron/data/datasets/medical"

import type {
  ConditionTreatmentsFile,
  HealthEconomics,
  SideEffect,
  TreatmentCitation,
} from "@optimitron/data/datasets/medical"

/** Result from treatment comparison API/action (same shape as per-condition file). */
export type TreatmentComparisonResult = ConditionTreatmentsFile

// ============================================================================
// TREATMENT-INTRINSIC PROPERTIES (FUTURE)
// ============================================================================

export interface TreatmentIntrinsic {
  name: string
  slug: string
  emoji: string
  drugClass: string
  category: "medication" | "therapy" | "lifestyle" | "procedure" | "device" | "supplement"
  synonyms: string[]
  mechanismOfAction?: string
  administrationRoute?: "oral" | "IV" | "topical" | "injection" | "inhaled" | "other"
  halfLife?: string
  metabolism?: string
  baseSafetyScore: number
  commonSideEffects: SideEffect[]
  contraindications?: string[]
  drugInteractions?: string[]
  pregnancyCategory?: "A" | "B" | "C" | "D" | "X"
  blackBoxWarnings?: string[]
  fdaApproved: boolean
  fdaApprovalYear?: number
  fdaIndications?: string[]
  availableMarkets?: string[]
  pricing?: {
    brandPrice?: number
    genericPrice?: number
    genericAvailable: boolean
    patentExpiry?: string
    manufacturingCost?: number
  }
  insurance?: {
    medicareCovers: boolean
    medicaidCovers: boolean
    privateInsurancePct?: number
    typicalCopayRange?: string
    priorAuthRequired: boolean
    stepTherapyRequired?: boolean
  }
  description?: string
  relatedTreatments?: string[]
}

export interface ConditionSpecificOutcome {
  conditionName: string
  conditionSlug: string
  effectiveness: number
  confidenceScore: number
  responseRate?: number
  remissionRate?: number
  nnt?: number
  nnh?: number
  timeToEffect?: string
  treatmentDuration?: string
  dosageRange?: string
  dosageNotes?: string
  conditionSpecificSafetyScore?: number
  conditionSpecificSideEffects?: SideEffect[]
  trials: number
  participants: number
  evidenceQuality?: "high" | "moderate" | "low" | "very-low"
  lastReviewed?: string
  recentTrials?: {
    title: string
    nctId: string
    status: string
    phase?: string
  }[]
  citations?: TreatmentCitation[]
  healthEconomics?: HealthEconomics
}

export interface TreatmentProfile {
  treatment: TreatmentIntrinsic
  conditionOutcomes: ConditionSpecificOutcome[]
  stats: {
    totalConditions: number
    totalTrials: number
    totalParticipants: number
    avgEffectiveness: number
    avgSafetyScore: number
    bestConditions: string[]
  }
  lastUpdated: string
  dataVersion: string
}

export interface TreatmentSummary {
  name: string
  slug: string
  emoji: string
  drugClass: string
  category: TreatmentIntrinsic["category"]
  conditionsCount: number
  topConditions: string[]
  avgEffectiveness: number
  avgSafetyScore: number
  genericAvailable: boolean
  estimatedMonthlyCost?: number
}

export interface TreatmentsIndex {
  treatments: TreatmentSummary[]
  lastUpdated: string
  totalCount: number
}

export interface TreatmentDetailFile {
  treatment: TreatmentIntrinsic
  conditionOutcomes: ConditionSpecificOutcome[]
  stats: TreatmentProfile["stats"]
  lastUpdated: string
}
