/**
 * Treatment Type System
 *
 * This file defines all treatment-related types for the application.
 *
 * Key concepts:
 * - TreatmentForCondition: Treatment data specific to ONE condition (e.g., "Sertraline for Depression")
 * - TreatmentWithConditions: Aggregated lightweight data across ALL conditions a treatment is used for
 * - TreatmentIntrinsic: Condition-independent properties (FDA approval, drug class, etc.)
 * - TreatmentProfile: Complete detailed profile combining intrinsic + all condition outcomes
 */

// ============================================================================
// SHARED TYPES
// ============================================================================

/**
 * Side effect information with percentage occurrence
 */
export interface SideEffect {
  name: string;
  percentage: number;
  severity?: 'mild' | 'moderate' | 'severe';
  nnh?: number; // Number Needed to Harm for this specific side effect
}

/**
 * Outcome measure with baseline and change data
 * Used for richer outcome displays with actual trial results
 */
export interface OutcomeMeasure {
  name: string;
  baseline?: string; // e.g., "160 mg/dL"
  percentageChange?: number; // e.g., -43
  absoluteChange?: string; // e.g., "-69 mg/dL"
  isPositive?: boolean; // Whether this change is beneficial
  dataSource?: 'trial' | 'ai-estimated'; // Track provenance of the data
}

/**
 * Citation/reference for treatment data
 */
export interface TreatmentCitation {
  title?: string;
  url: string;
  type?: 'study' | 'literature' | 'meta-analysis' | 'guideline';
  pubmedId?: string;
  year?: number;
}

// ============================================================================
// HEALTH ECONOMICS
// ============================================================================

/**
 * Health economics and cost-effectiveness analysis data
 * Used for evaluating treatment value and cost-benefit ratios
 */
export interface HealthEconomics {
  // Quality of Life
  qalysGained?: number; // Quality-adjusted life years vs no treatment
  qalysVsComparator?: number; // vs standard treatment

  // Cost Effectiveness
  icer?: number; // Incremental cost-effectiveness ratio ($/QALY)
  icerVsComparator?: string; // Comparator name
  costEffectivenessRating?: 'excellent' | 'good' | 'moderate' | 'poor' | 'dominated';

  // Costs
  annualCostOfCare?: {
    drugCost: number;
    monitoringCost: number; // Lab work, imaging, visits
    sideEffectManagement: number; // Expected management costs
    totalAnnual: number;
  };

  // Outcomes-based costs
  costPerResponder?: number; // Cost to achieve response
  costPerRemission?: number; // Cost to achieve remission
  costPerQALY?: number; // Cost per quality-adjusted life year

  // Comparative
  vsComparator?: {
    comparatorName: string;
    costDifference: number; // + means more expensive, - means cheaper
    qalysGainedDifference: number; // + means better outcomes
    dominates: boolean; // True if both cheaper AND more effective
  };

  // Prescription Access Economics
  prescriptionAccess?: {
    prescriptionRequired: boolean; // Current Rx-only status
    otcAvailable: boolean; // Is OTC version available?
    
    // Cost analysis (if prescription-only)
    annualPhysicianVisitCost?: number; // Annual cost of doctor visits for prescriptions
    annualPrescriptionCost?: number; // Rx price (annual)
    annualOtcCost?: number; // OTC price if available (annual)
    annualTimeCost?: number; // Travel/wait time value (annual)
    annualInsuranceAdminCost?: number; // Prior auth, claims processing (annual)
    
    // Societal impact
    netSocietalLossFromRxOnly?: number; // Annual loss per patient from Rx-only status
    earlyTreatmentBenefit?: number; // QALYs gained from earlier OTC access
    preventedComplicationCost?: number; // Cost savings from early treatment
    
    // Risk factors
    misuseRisk?: 'low' | 'moderate' | 'high'; // Safety concern for OTC availability
    missedDiagnosisRisk?: 'low' | 'moderate' | 'high'; // Risk of masking symptoms
    requiresMonitoring?: boolean; // Whether condition requires medical monitoring
  };
}

// ============================================================================
// TREATMENT FOR ONE SPECIFIC CONDITION
// ============================================================================

/**
 * Treatment data for ONE specific condition
 *
 * This represents how a treatment performs for a single condition.
 * Example: "Sertraline for Major Depressive Disorder" or "Aspirin for Heart Disease"
 *
 * Used in:
 * - data/treatments/{condition-slug}.json (array of these)
 * - /conditions/{slug}/treatments/{treatment-slug} pages
 * - InterventionCard components
 */
export interface TreatmentForCondition {
  name: string;
  effectiveness: number; // 0-100 percentage
  confidenceScore: number; // 0-100, based on quality and quantity of evidence
  safetyScore: number; // 0-100 comparative safety
  trials: number;
  participants: number;
  sideEffects: SideEffect[];
  nnt?: number; // Number Needed to Treat (lower is better)
  nnh?: number; // Number Needed to Harm (higher is better)
  timeToEffect?: string; // How long until effect (e.g., "1-2 weeks", "immediate")
  responseRate?: number; // 0-100 percentage who respond
  remissionRate?: number; // 0-100 percentage achieving remission
  treatmentDuration?: string; // Typical length (e.g., "7 days", "12 weeks", "lifetime")
  phase?: string[];
  recentTrials?: {
    title: string;
    nctId: string;
    status: string;
  }[];
  citations?: TreatmentCitation[];
  healthEconomics?: HealthEconomics;
  dosageRange?: string; // Typical dosage for this condition (e.g., "50-200mg daily")
  evidenceQuality?: 'high' | 'moderate' | 'low' | 'very-low'; // GRADE quality rating

  // Richer outcome data from actual trial results (when available)
  primaryOutcomes?: OutcomeMeasure[]; // Primary efficacy outcomes with baselines
  secondaryOutcomes?: OutcomeMeasure[]; // Secondary benefits
}


// ============================================================================
// TREATMENT AGGREGATED ACROSS ALL CONDITIONS
// ============================================================================

/**
 * Lightweight treatment summary aggregated across ALL conditions
 *
 * This represents a treatment's aggregate data across all conditions it treats.
 * Example: "Sertraline" aggregated across Depression, Anxiety, OCD, etc.
 *
 * Used in:
 * - data/treatments.json (array of these)
 * - /treatments page (listing all treatments)
 * - lib/treatments.ts (getAllTreatments)
 */
export interface TreatmentWithConditions {
  name: string;
  slug: string;
  conditions: Array<{
    conditionName: string;
    conditionSlug: string;
    effectiveness: number;
    safetyScore: number;
    trials: number;
    participants: number;
  }>;
  totalTrials: number;
  totalParticipants: number;
  avgEffectiveness: number;
  avgSafetyScore: number;
}

// ============================================================================
// TREATMENT-INTRINSIC PROPERTIES (FUTURE)
// ============================================================================

/**
 * Treatment properties that don't change based on condition
 *
 * This represents intrinsic properties: FDA approval, drug class, pharmacology, etc.
 * These are the same regardless of which condition the treatment is used for.
 *
 * Future use for:
 * - /treatments/{slug} detailed pages
 * - Drug database integration
 */
export interface TreatmentIntrinsic {
  // Core Identity
  name: string;
  slug: string;
  emoji: string; // 💊 for pills, 💉 for injections, 🏃 for lifestyle, etc.

  // Classification
  drugClass: string; // "SSRI", "Beta-blocker", "Lifestyle intervention", etc.
  category: 'medication' | 'therapy' | 'lifestyle' | 'procedure' | 'device' | 'supplement';
  synonyms: string[]; // Brand names, alternate names

  // Pharmacology (if applicable)
  mechanismOfAction?: string;
  administrationRoute?: 'oral' | 'IV' | 'topical' | 'injection' | 'inhaled' | 'other';
  halfLife?: string; // "24 hours", "5-7 days"
  metabolism?: string; // "Hepatic (CYP2D6)", "Renal"

  // Safety (intrinsic)
  baseSafetyScore: number; // 0-100, intrinsic toxicity profile
  commonSideEffects: SideEffect[]; // Side effects common across all uses
  contraindications?: string[]; // Absolute contraindications
  drugInteractions?: string[]; // Major interactions to watch
  pregnancyCategory?: 'A' | 'B' | 'C' | 'D' | 'X';
  blackBoxWarnings?: string[];

  // Regulatory
  fdaApproved: boolean;
  fdaApprovalYear?: number;
  fdaIndications?: string[]; // Official approved uses
  availableMarkets?: string[]; // ["US", "EU", "UK", etc.]

  // Economic (intrinsic)
  pricing?: {
    brandPrice?: number; // Monthly cost USD
    genericPrice?: number; // Monthly cost USD if available
    genericAvailable: boolean;
    patentExpiry?: string; // ISO date
    manufacturingCost?: number; // Estimated
  };

  insurance?: {
    medicareCovers: boolean;
    medicaidCovers: boolean;
    privateInsurancePct?: number; // % of plans covering
    typicalCopayRange?: string; // "$10-50"
    priorAuthRequired: boolean;
    stepTherapyRequired?: boolean;
  };

  // Metadata
  description?: string; // AI-generated general description
  relatedTreatments?: string[]; // Similar/alternative treatments
}

/**
 * Condition-specific outcome data (FUTURE)
 *
 * More detailed version of TreatmentForCondition with additional fields
 * for future enhanced treatment pages
 */
export interface ConditionSpecificOutcome {
  // Link to condition
  conditionName: string;
  conditionSlug: string;

  // Efficacy Metrics
  effectiveness: number; // 0-100 percentage for this condition
  confidenceScore: number; // 0-100, quality of evidence
  responseRate?: number; // % who respond
  remissionRate?: number; // % who achieve remission

  // Clinical Metrics
  nnt?: number; // Number Needed to Treat for this condition
  nnh?: number; // Number Needed to Harm for this condition/dosage
  timeToEffect?: string; // "2-4 weeks" for this condition
  treatmentDuration?: string; // "6-12 months" typical for this condition

  // Dosing
  dosageRange?: string; // "50-200mg daily" for this condition
  dosageNotes?: string;

  // Safety (condition-specific adjustments)
  conditionSpecificSafetyScore?: number; // Adjusted for dosage/population
  conditionSpecificSideEffects?: SideEffect[]; // Side effects more common in this use

  // Evidence Base
  trials: number; // Number of trials for this condition
  participants: number; // Total participants in trials
  evidenceQuality?: 'high' | 'moderate' | 'low' | 'very-low';
  lastReviewed?: string; // ISO date

  // Trial Data
  recentTrials?: {
    title: string;
    nctId: string;
    status: string;
    phase?: string;
  }[];

  // Citations
  citations?: TreatmentCitation[];

  // Health Economics (condition-specific)
  healthEconomics?: HealthEconomics;
}

// ============================================================================
// AGGREGATED VIEWS (FUTURE)
// ============================================================================

/**
 * Complete treatment profile with intrinsic + all condition outcomes
 *
 * Future use for: /treatments/{slug} detailed pages
 * Combines intrinsic properties with all condition-specific outcomes
 */
export interface TreatmentProfile {
  // Intrinsic properties
  treatment: TreatmentIntrinsic;

  // All conditions this treatment is used for
  conditionOutcomes: ConditionSpecificOutcome[];

  // Aggregated statistics
  stats: {
    totalConditions: number;
    totalTrials: number;
    totalParticipants: number;
    avgEffectiveness: number;
    avgSafetyScore: number;
    bestConditions: string[]; // Top 3 by effectiveness
  };

  // Metadata
  lastUpdated: string;
  dataVersion: string;
}

/**
 * Lightweight treatment summary for listing pages (FUTURE)
 * Used for: /treatments index page
 */
export interface TreatmentSummary {
  name: string;
  slug: string;
  emoji: string;
  drugClass: string;
  category: TreatmentIntrinsic['category'];
  conditionsCount: number;
  topConditions: string[]; // Top 3 condition names
  avgEffectiveness: number;
  avgSafetyScore: number;
  genericAvailable: boolean;
  estimatedMonthlyCost?: number;
}

// ============================================================================
// DATA FILE STRUCTURES
// ============================================================================

/**
 * Structure of data/treatments/{condition-slug}.json
 *
 * Each condition file contains an array of TreatmentForCondition
 */
export interface ConditionTreatmentsFile {
  conditionName: string;
  treatments: TreatmentForCondition[];
  lastUpdated: string;
  dataSource: 'google-ai' | 'clinical-trials-gov' | 'hybrid';
}

/**
 * Result from treatment comparison API/action
 */
export interface TreatmentComparisonResult {
  conditionName: string;
  treatments: TreatmentForCondition[];
  lastUpdated: string;
  dataSource: 'google-ai' | 'clinical-trials-gov' | 'mixed' | 'hybrid';
}

/**
 * Structure of data/treatments-index.json (FUTURE)
 */
export interface TreatmentsIndex {
  treatments: TreatmentSummary[];
  lastUpdated: string;
  totalCount: number;
}

/**
 * Structure of data/treatments-detail/{slug}.json (FUTURE)
 */
export interface TreatmentDetailFile {
  treatment: TreatmentIntrinsic;
  conditionOutcomes: ConditionSpecificOutcome[];
  stats: TreatmentProfile['stats'];
  lastUpdated: string;
}
