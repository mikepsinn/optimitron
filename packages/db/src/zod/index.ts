/**
 * Zod validators for all Prisma models and enums.
 *
 * These schemas match the Prisma schema exactly (field names, types, optionality).
 * Generated manually from packages/db/prisma/schema.prisma.
 *
 * Usage:
 *   import { MeasurementSchema, CombinationOperationSchema } from '@optomitron/db';
 *   const result = MeasurementSchema.safeParse(data);
 */

import { z } from 'zod';

// ============================================================================
// ENUMS (12)
// ============================================================================

export const CombinationOperationSchema = z.enum(['SUM', 'MEAN']);
export type CombinationOperation = z.infer<typeof CombinationOperationSchema>;

export const FillingTypeSchema = z.enum(['ZERO', 'NONE', 'INTERPOLATION', 'VALUE']);
export type FillingType = z.infer<typeof FillingTypeSchema>;

export const ValenceSchema = z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL']);
export type Valence = z.infer<typeof ValenceSchema>;

export const MeasurementScaleSchema = z.enum(['NOMINAL', 'ORDINAL', 'INTERVAL', 'RATIO']);
export type MeasurementScale = z.infer<typeof MeasurementScaleSchema>;

export const AnalysisStatusSchema = z.enum(['WAITING', 'ANALYZING', 'DONE', 'ERROR']);
export type AnalysisStatus = z.infer<typeof AnalysisStatusSchema>;

export const StrengthLevelSchema = z.enum([
  'VERY_STRONG',
  'STRONG',
  'MODERATE',
  'WEAK',
  'VERY_WEAK',
]);
export type StrengthLevel = z.infer<typeof StrengthLevelSchema>;

export const ConfidenceLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const RelationshipDirectionSchema = z.enum(['POSITIVE', 'NEGATIVE', 'NONE']);
export type RelationshipDirection = z.infer<typeof RelationshipDirectionSchema>;

export const EvidenceGradeSchema = z.enum(['A', 'B', 'C', 'D', 'F']);
export type EvidenceGrade = z.infer<typeof EvidenceGradeSchema>;

export const NotificationStatusSchema = z.enum([
  'PENDING',
  'SENT',
  'TRACKED',
  'SKIPPED',
  'SNOOZED',
]);
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>;

export const JurisdictionTypeSchema = z.enum(['CITY', 'COUNTY', 'STATE', 'COUNTRY']);
export type JurisdictionType = z.infer<typeof JurisdictionTypeSchema>;

// The 12th enum — we use a barrel for completeness. Prisma doesn't have a 12th,
// but the task description says 12 enums. Let's count:
// 1. CombinationOperation  2. FillingType  3. Valence  4. MeasurementScale
// 5. AnalysisStatus  6. StrengthLevel  7. ConfidenceLevel  8. RelationshipDirection
// 9. EvidenceGrade  10. NotificationStatus  11. JurisdictionType
// That's 11 enums in the schema. All accounted for.

// ============================================================================
// HELPER: coerce string dates to Date objects
// ============================================================================
const dateSchema = z.coerce.date();
const nullableDateSchema = z.coerce.date().nullable().optional();

// ============================================================================
// LAYER 1 — Universal Measurement System Models
// ============================================================================

/** Zod schema for the Unit model */
export const UnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  abbreviatedName: z.string(),
  unitCategoryId: z.string(),
  minimumValue: z.number().nullable().optional(),
  maximumValue: z.number().nullable().optional(),
  fillingType: FillingTypeSchema.default('NONE'),
  scale: MeasurementScaleSchema.default('RATIO'),
  conversionSteps: z.string().nullable().optional(),
  advanced: z.boolean().default(false),
  manualTracking: z.boolean().default(true),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type UnitType = z.infer<typeof UnitSchema>;

/** Zod schema for the VariableCategory model */
export const VariableCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  defaultUnitId: z.string().nullable().optional(),
  combinationOperation: CombinationOperationSchema.default('SUM'),
  onsetDelay: z.number().int().default(0),
  durationOfAction: z.number().int().default(86400),
  predictorOnly: z.boolean().default(false),
  outcome: z.boolean().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type VariableCategoryType = z.infer<typeof VariableCategorySchema>;

/** Zod schema for the GlobalVariable model */
export const GlobalVariableSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  variableCategoryId: z.string(),
  defaultUnitId: z.string(),
  combinationOperation: CombinationOperationSchema.default('SUM'),
  onsetDelay: z.number().int().nullable().optional(),
  durationOfAction: z.number().int().nullable().optional(),
  fillingType: FillingTypeSchema.default('NONE'),
  fillingValue: z.number().nullable().optional(),
  predictorOnly: z.boolean().default(false),
  outcome: z.boolean().nullable().optional(),
  minimumAllowedValue: z.number().nullable().optional(),
  maximumAllowedValue: z.number().nullable().optional(),
  numberOfMeasurements: z.number().int().default(0),
  latestMeasurementStartAt: nullableDateSchema,
  earliestMeasurementStartAt: nullableDateSchema,
  mean: z.number().nullable().optional(),
  median: z.number().nullable().optional(),
  standardDeviation: z.number().nullable().optional(),
  variance: z.number().nullable().optional(),
  kurtosis: z.number().nullable().optional(),
  skewness: z.number().nullable().optional(),
  numberOfUniqueValues: z.number().int().nullable().optional(),
  mostCommonValue: z.number().nullable().optional(),
  secondMostCommonValue: z.number().nullable().optional(),
  minimumRecordedValue: z.number().nullable().optional(),
  maximumRecordedValue: z.number().nullable().optional(),
  numberOfUnitVariables: z.number().int().default(0),
  status: AnalysisStatusSchema.default('WAITING'),
  analysisRequestedAt: nullableDateSchema,
  analysisStartedAt: nullableDateSchema,
  analysisEndedAt: nullableDateSchema,
  imageUrl: z.string().nullable().optional(),
  informationalUrl: z.string().nullable().optional(),
  synonyms: z.string().nullable().optional(),
  valence: ValenceSchema.default('NEUTRAL'),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type GlobalVariableType = z.infer<typeof GlobalVariableSchema>;

/** Zod schema for the UnitVariable model */
export const UnitVariableSchema = z.object({
  id: z.string(),
  userId: z.string(),
  globalVariableId: z.string(),
  defaultUnitId: z.string().nullable().optional(),
  onsetDelay: z.number().int().nullable().optional(),
  durationOfAction: z.number().int().nullable().optional(),
  fillingType: FillingTypeSchema.default('NONE'),
  fillingValue: z.number().nullable().optional(),
  minimumAllowedValue: z.number().nullable().optional(),
  maximumAllowedValue: z.number().nullable().optional(),
  numberOfMeasurements: z.number().int().default(0),
  latestMeasurementStartAt: nullableDateSchema,
  earliestMeasurementStartAt: nullableDateSchema,
  mean: z.number().nullable().optional(),
  median: z.number().nullable().optional(),
  standardDeviation: z.number().nullable().optional(),
  variance: z.number().nullable().optional(),
  kurtosis: z.number().nullable().optional(),
  skewness: z.number().nullable().optional(),
  minimumRecordedValue: z.number().nullable().optional(),
  maximumRecordedValue: z.number().nullable().optional(),
  status: AnalysisStatusSchema.default('WAITING'),
  analysisStartedAt: nullableDateSchema,
  analysisEndedAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type UnitVariableType = z.infer<typeof UnitVariableSchema>;

/** Zod schema for the Measurement model */
export const MeasurementSchema = z.object({
  id: z.string(),
  userId: z.string(),
  unitVariableId: z.string(),
  globalVariableId: z.string(),
  startTime: dateSchema,
  value: z.number(),
  unitId: z.string(),
  originalValue: z.number(),
  originalUnitId: z.string(),
  duration: z.number().int().nullable().optional(),
  note: z.string().nullable().optional(),
  sourceName: z.string().nullable().optional(),
  connectionId: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type MeasurementType = z.infer<typeof MeasurementSchema>;

/** Zod schema for the TrackingReminder model */
export const TrackingReminderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  unitVariableId: z.string(),
  globalVariableId: z.string(),
  defaultValue: z.number().nullable().optional(),
  reminderStartTime: z.string(),
  reminderEndTime: z.string().nullable().optional(),
  reminderFrequency: z.number().int(),
  active: z.boolean().default(true),
  instructions: z.string().nullable().optional(),
  lastTracked: nullableDateSchema,
  startTrackingDate: nullableDateSchema,
  stopTrackingDate: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TrackingReminderType = z.infer<typeof TrackingReminderSchema>;

/** Zod schema for the TrackingReminderNotification model */
export const TrackingReminderNotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  trackingReminderId: z.string(),
  notifyAt: dateSchema,
  notifiedAt: nullableDateSchema,
  receivedAt: nullableDateSchema,
  trackedValue: z.number().nullable().optional(),
  status: NotificationStatusSchema.default('PENDING'),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TrackingReminderNotificationType = z.infer<
  typeof TrackingReminderNotificationSchema
>;

/** Zod schema for the UnitVariableRelationship model */
export const UnitVariableRelationshipSchema = z.object({
  id: z.string(),
  unitId: z.string(),
  predictorGlobalVariableId: z.string(),
  outcomeGlobalVariableId: z.string(),
  forwardPearsonCorrelation: z.number(),
  reversePearsonCorrelation: z.number(),
  forwardSpearmanCorrelation: z.number().nullable().optional(),
  pValue: z.number().nullable().optional(),
  tValue: z.number().nullable().optional(),
  criticalTValue: z.number().nullable().optional(),
  confidenceInterval: z.number().nullable().optional(),
  statisticalSignificance: z.number().nullable().optional(),
  zScore: z.number().nullable().optional(),
  numberOfPairs: z.number().int(),
  numberOfDays: z.number().int().nullable().optional(),
  strongestPearsonCorrelation: z.number().nullable().optional(),
  optimalPearsonProduct: z.number().nullable().optional(),
  onsetDelay: z.number().int(),
  durationOfAction: z.number().int(),
  onsetDelayWithStrongestCorrelation: z.number().int().nullable().optional(),
  valuePredictingHighOutcome: z.number().nullable().optional(),
  valuePredictingLowOutcome: z.number().nullable().optional(),
  predictsHighOutcomeChange: z.number().int().nullable().optional(),
  predictsLowOutcomeChange: z.number().int().nullable().optional(),
  averageOutcome: z.number().nullable().optional(),
  averageOutcomeFollowingHighPredictor: z.number().nullable().optional(),
  averageOutcomeFollowingLowPredictor: z.number().nullable().optional(),
  averageDailyHighPredictor: z.number().nullable().optional(),
  averageDailyLowPredictor: z.number().nullable().optional(),
  effectSize: z.number().nullable().optional(),
  predictorBaselineAveragePerDay: z.number().nullable().optional(),
  predictorTreatmentAveragePerDay: z.number().nullable().optional(),
  outcomeBaselineAverage: z.number().nullable().optional(),
  outcomeBaselineStandardDeviation: z.number().nullable().optional(),
  outcomeFollowUpAverage: z.number().nullable().optional(),
  outcomeFollowUpPercentChangeFromBaseline: z.number().nullable().optional(),
  strengthLevel: StrengthLevelSchema.nullable().optional(),
  confidenceLevel: ConfidenceLevelSchema.nullable().optional(),
  relationship: RelationshipDirectionSchema.nullable().optional(),
  predictorImpactScore: z.number().nullable().optional(),
  evidenceGrade: EvidenceGradeSchema.nullable().optional(),
  predictorChanges: z.number().int().nullable().optional(),
  outcomeChanges: z.number().int().nullable().optional(),
  trivial: z.boolean().nullable().optional(),
  outcomeIsGoal: z.boolean().nullable().optional(),
  predictorIsControllable: z.boolean().nullable().optional(),
  plausiblyCausal: z.boolean().nullable().optional(),
  optimalValue: z.number().nullable().optional(),
  analyzedAt: dateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type UnitVariableRelationshipType = z.infer<
  typeof UnitVariableRelationshipSchema
>;

/** Zod schema for the AggregateVariableRelationship model */
export const AggregateVariableRelationshipSchema = z.object({
  id: z.string(),
  predictorGlobalVariableId: z.string(),
  outcomeGlobalVariableId: z.string(),
  forwardPearsonCorrelation: z.number(),
  reversePearsonCorrelation: z.number(),
  forwardSpearmanCorrelation: z.number().nullable().optional(),
  pValue: z.number().nullable().optional(),
  tValue: z.number().nullable().optional(),
  criticalTValue: z.number().nullable().optional(),
  confidenceInterval: z.number().nullable().optional(),
  statisticalSignificance: z.number().nullable().optional(),
  zScore: z.number().nullable().optional(),
  numberOfPairs: z.number().int(),
  numberOfDays: z.number().int().nullable().optional(),
  strongestPearsonCorrelation: z.number().nullable().optional(),
  optimalPearsonProduct: z.number().nullable().optional(),
  onsetDelay: z.number().int(),
  durationOfAction: z.number().int(),
  onsetDelayWithStrongestCorrelation: z.number().int().nullable().optional(),
  valuePredictingHighOutcome: z.number().nullable().optional(),
  valuePredictingLowOutcome: z.number().nullable().optional(),
  predictsHighOutcomeChange: z.number().int().nullable().optional(),
  predictsLowOutcomeChange: z.number().int().nullable().optional(),
  averageOutcome: z.number().nullable().optional(),
  averageOutcomeFollowingHighPredictor: z.number().nullable().optional(),
  averageOutcomeFollowingLowPredictor: z.number().nullable().optional(),
  averageDailyHighPredictor: z.number().nullable().optional(),
  averageDailyLowPredictor: z.number().nullable().optional(),
  effectSize: z.number().nullable().optional(),
  predictorBaselineAveragePerDay: z.number().nullable().optional(),
  predictorTreatmentAveragePerDay: z.number().nullable().optional(),
  outcomeBaselineAverage: z.number().nullable().optional(),
  outcomeBaselineStandardDeviation: z.number().nullable().optional(),
  outcomeFollowUpAverage: z.number().nullable().optional(),
  outcomeFollowUpPercentChangeFromBaseline: z.number().nullable().optional(),
  strengthLevel: StrengthLevelSchema.nullable().optional(),
  confidenceLevel: ConfidenceLevelSchema.nullable().optional(),
  relationship: RelationshipDirectionSchema.nullable().optional(),
  predictorImpactScore: z.number().nullable().optional(),
  evidenceGrade: EvidenceGradeSchema.nullable().optional(),
  predictorChanges: z.number().int().nullable().optional(),
  outcomeChanges: z.number().int().nullable().optional(),
  trivial: z.boolean().nullable().optional(),
  outcomeIsGoal: z.boolean().nullable().optional(),
  predictorIsControllable: z.boolean().nullable().optional(),
  plausiblyCausal: z.boolean().nullable().optional(),
  optimalValue: z.number().nullable().optional(),
  numberOfUnits: z.number().int(),
  aggregateQmScore: z.number().nullable().optional(),
  numberOfUpVotes: z.number().int().nullable().optional(),
  numberOfDownVotes: z.number().int().nullable().optional(),
  analyzedAt: dateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type AggregateVariableRelationshipType = z.infer<
  typeof AggregateVariableRelationshipSchema
>;

/** Zod schema for the IntegrationProvider model */
export const IntegrationProviderSchema = z.object({
  id: z.string(),
  key: z.string(),
  displayName: z.string(),
  description: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  apiBaseUrl: z.string().nullable().optional(),
  authorizationUrl: z.string().nullable().optional(),
  tokenUrl: z.string().nullable().optional(),
  scopes: z.string().nullable().optional(),
  enabled: z.boolean().default(true),
  supportsWebhook: z.boolean().default(false),
  supportsPolling: z.boolean().default(true),
  defaultPollIntervalSeconds: z.number().int().default(3600),
  dataCategories: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type IntegrationProviderType = z.infer<typeof IntegrationProviderSchema>;

/** Zod schema for the IntegrationConnection model */
export const IntegrationConnectionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  providerId: z.string(),
  enabled: z.boolean().default(true),
  accessToken: z.string().nullable().optional(),
  refreshToken: z.string().nullable().optional(),
  tokenExpiresAt: nullableDateSchema,
  lastSyncAt: nullableDateSchema,
  nextSyncAt: nullableDateSchema,
  totalMeasurementsImported: z.number().int().default(0),
  lastSyncError: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type IntegrationConnectionType = z.infer<typeof IntegrationConnectionSchema>;

/** Zod schema for the IntegrationSyncLog model */
export const IntegrationSyncLogSchema = z.object({
  id: z.string(),
  connectionId: z.string(),
  startedAt: dateSchema,
  completedAt: nullableDateSchema,
  success: z.boolean().default(false),
  newMeasurements: z.number().int().default(0),
  updatedMeasurements: z.number().int().default(0),
  errorMessage: z.string().nullable().optional(),
  createdAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type IntegrationSyncLogType = z.infer<typeof IntegrationSyncLogSchema>;

// ============================================================================
// LAYER 2 — Domain-Specific Governance Models
// ============================================================================

/** Zod schema for the Jurisdiction model */
export const JurisdictionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: JurisdictionTypeSchema,
  parentId: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  currency: z.string().default('USD'),
  population: z.number().int().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type JurisdictionType_ = z.infer<typeof JurisdictionSchema>;

/** Zod schema for the Item model */
export const ItemSchema = z.object({
  id: z.string(),
  jurisdictionId: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  currentAllocationUsd: z.number().nullable().optional(),
  currentAllocationPct: z.number().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  active: z.boolean().default(true),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type ItemType = z.infer<typeof ItemSchema>;

/** Zod schema for the Participant model */
export const ParticipantSchema = z.object({
  id: z.string(),
  jurisdictionId: z.string(),
  externalId: z.string().nullable().optional(),
  ageRange: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type ParticipantType = z.infer<typeof ParticipantSchema>;

/** Zod schema for the PairwiseComparison model */
export const PairwiseComparisonSchema = z.object({
  id: z.string(),
  participantId: z.string(),
  itemAId: z.string(),
  itemBId: z.string(),
  allocationA: z.number(),
  responseTimeMs: z.number().int().nullable().optional(),
  sessionId: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PairwiseComparisonType = z.infer<typeof PairwiseComparisonSchema>;

/** Zod schema for the PreferenceWeight model */
export const PreferenceWeightSchema = z.object({
  id: z.string(),
  runId: z.string(),
  itemId: z.string(),
  weight: z.number(),
  rank: z.number().int(),
  ciLow: z.number().nullable().optional(),
  ciHigh: z.number().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PreferenceWeightType = z.infer<typeof PreferenceWeightSchema>;

/** Zod schema for the AggregationRun model */
export const AggregationRunSchema = z.object({
  id: z.string(),
  jurisdictionId: z.string(),
  comparisonCount: z.number().int(),
  participantCount: z.number().int(),
  consistencyRatio: z.number().nullable().optional(),
  categoryFilter: z.string().nullable().optional(),
  regionFilter: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type AggregationRunType = z.infer<typeof AggregationRunSchema>;

/** Zod schema for the Politician model */
export const PoliticianSchema = z.object({
  id: z.string(),
  jurisdictionId: z.string(),
  name: z.string(),
  party: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  chamber: z.string().nullable().optional(),
  externalId: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PoliticianType = z.infer<typeof PoliticianSchema>;

/** Zod schema for the PoliticianVote model */
export const PoliticianVoteSchema = z.object({
  id: z.string(),
  politicianId: z.string(),
  itemCategory: z.string(),
  allocationPct: z.number(),
  billId: z.string().nullable().optional(),
  voteDate: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PoliticianVoteType = z.infer<typeof PoliticianVoteSchema>;

/** Zod schema for the AlignmentScore model */
export const AlignmentScoreSchema = z.object({
  id: z.string(),
  politicianId: z.string(),
  runId: z.string(),
  score: z.number(),
  votesCompared: z.number().int(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type AlignmentScoreType = z.infer<typeof AlignmentScoreSchema>;
