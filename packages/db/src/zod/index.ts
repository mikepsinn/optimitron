/**
 * Zod validators for all Prisma models and enums.
 *
 * These schemas match the Prisma schema exactly (field names, types, optionality).
 * Generated manually from packages/db/prisma/schema.prisma.
 *
 * Usage:
 *   import { MeasurementSchema, CombinationOperationSchema } from '@optimitron/db';
 *   const result = MeasurementSchema.safeParse(data);
 */

import { z } from 'zod';

// ============================================================================
// ENUMS (16)
// ============================================================================

export const CombinationOperationSchema = z.enum(['SUM', 'MEAN']);
export type CombinationOperation = z.infer<typeof CombinationOperationSchema>;

export const FillingTypeSchema = z.enum(['ZERO', 'NONE', 'INTERPOLATION', 'VALUE']);
export type FillingType = z.infer<typeof FillingTypeSchema>;

export const ValenceSchema = z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL']);
export type Valence = z.infer<typeof ValenceSchema>;

export const MeasurementScaleSchema = z.enum(['NOMINAL', 'ORDINAL', 'INTERVAL', 'RATIO']);
export type MeasurementScale = z.infer<typeof MeasurementScaleSchema>;

export const UnitCodeSystemSchema = z.enum(['UCUM']);
export type UnitCodeSystem = z.infer<typeof UnitCodeSystemSchema>;

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

export const SubjectTypeSchema = z.enum(['USER', 'JURISDICTION', 'COHORT', 'ORGANIZATION']);
export type SubjectType = z.infer<typeof SubjectTypeSchema>;

export const ReferralAnswerSchema = z.enum(['YES', 'NO']);
export type ReferralAnswer = z.infer<typeof ReferralAnswerSchema>;

export const PersonhoodProviderSchema = z.enum(['WORLD_ID', 'HUMAN_PASSPORT']);
export type PersonhoodProvider = z.infer<typeof PersonhoodProviderSchema>;

export const PersonhoodVerificationStatusSchema = z.enum(['VERIFIED', 'REVOKED']);
export type PersonhoodVerificationStatus = z.infer<typeof PersonhoodVerificationStatusSchema>;

export const VotePositionSchema = z.enum(['YES', 'NO', 'ABSTAIN']);
export type VotePosition = z.infer<typeof VotePositionSchema>;

export const ReferendumStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'CLOSED']);
export type ReferendumStatus = z.infer<typeof ReferendumStatusSchema>;

export const VoteTokenMintStatusSchema = z.enum(['PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED']);
export type VoteTokenMintStatus = z.infer<typeof VoteTokenMintStatusSchema>;

export const ActivityTypeSchema = z.enum([
  'VOTED_REFERENDUM',
  'SUBMITTED_COMPARISON',
  'DEPOSITED_PRIZE',
  'RECRUITED_VOTER',
  'VERIFIED_PERSONHOOD',
  'TRACKED_MEASUREMENT',
  'UPDATED_PROFILE',
  'EARNED_BADGE',
  'CREATED_SURVEY',
  'COMPLETED_SURVEY',
  'JOINED_ORGANIZATION',
]);
export type ActivityType = z.infer<typeof ActivityTypeSchema>;

export const NotificationTypeSchema = z.enum([
  'REFERRAL_SIGNUP',
  'REFERENDUM_MILESTONE',
  'ALIGNMENT_SCORE_PUBLISHED',
  'DEPOSIT_CONFIRMED',
  'BADGE_EARNED',
  'SURVEY_INVITE',
  'DAILY_CHECKIN_REMINDER',
  'ORGANIZATION_INVITE',
  'SYSTEM_ANNOUNCEMENT',
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationChannelSchema = z.enum(['EMAIL', 'IN_APP', 'SMS', 'PUSH']);
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

export const OrgTypeSchema = z.enum([
  'UNIVERSITY',
  'RESEARCH_CENTER',
  'NONPROFIT',
  'DAO',
  'GOVERNMENT_AGENCY',
  'HOSPITAL',
  'BIOTECH',
  'ADVOCACY',
]);
export type OrgType = z.infer<typeof OrgTypeSchema>;

export const OrgStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type OrgStatus = z.infer<typeof OrgStatusSchema>;

export const SocialPlatformSchema = z.enum([
  'TWITTER',
  'GITHUB',
  'ETHEREUM',
  'BASE',
  'DISCORD',
  'TELEGRAM',
]);
export type SocialPlatform = z.infer<typeof SocialPlatformSchema>;

export const BadgeTypeSchema = z.enum([
  'FIRST_COMPARISON',
  'HUNDRED_COMPARISONS',
  'FIRST_RECRUIT',
  'TEN_RECRUITS',
  'VERIFIED_HUMAN',
  'EARLY_ADOPTER',
  'DEPOSITOR',
]);
export type BadgeType = z.infer<typeof BadgeTypeSchema>;

export const QuestionTypeSchema = z.enum([
  'MULTIPLE_CHOICE',
  'FREE_TEXT',
  'RATING',
  'BOOLEAN',
  'NUMERIC',
]);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const EmailLogStatusSchema = z.enum(['SENT', 'DELIVERED', 'OPENED', 'BOUNCED', 'FAILED']);
export type EmailLogStatus = z.infer<typeof EmailLogStatusSchema>;

// ============================================================================
// HELPER: coerce string dates to Date objects
// ============================================================================
const dateSchema = z.coerce.date();
const nullableDateSchema = z.coerce.date().nullable().optional();

// ============================================================================
// AUTH / ACCOUNT MODELS
// ============================================================================

/** Zod schema for the User model */
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
  referralCode: z.string(),
  emailVerified: nullableDateSchema,
  newsletterSubscribed: z.boolean().default(true),
  timeZone: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  regionCode: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  annualHouseholdIncomeUsd: z.number().nullable().optional(),
  householdSize: z.number().int().nullable().optional(),
  birthYear: z.number().int().nullable().optional(),
  educationLevel: z.string().nullable().optional(),
  employmentStatus: z.string().nullable().optional(),
  genderIdentity: z.string().nullable().optional(),
  censusNotes: z.string().nullable().optional(),
  censusUpdatedAt: nullableDateSchema,
  bio: z.string().nullable().optional(),
  headline: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  isPublic: z.boolean().default(false),
  isAdmin: z.boolean().default(false),
  phoneNumber: z.string().nullable().optional(),
  referralEmailSequenceStep: z.number().int().default(0),
  referralEmailSequenceLastSentAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type UserType = z.infer<typeof UserSchema>;

/** Zod schema for the Account model */
export const AccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  provider: z.string(),
  providerAccountId: z.string(),
  refresh_token: z.string().nullable().optional(),
  access_token: z.string().nullable().optional(),
  expires_at: z.number().int().nullable().optional(),
  token_type: z.string().nullable().optional(),
  scope: z.string().nullable().optional(),
  id_token: z.string().nullable().optional(),
  session_state: z.string().nullable().optional(),
  oauth_token_secret: z.string().nullable().optional(),
  oauth_token: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type AccountType = z.infer<typeof AccountSchema>;

/** Zod schema for the Session model */
export const SessionSchema = z.object({
  id: z.string(),
  sessionToken: z.string(),
  userId: z.string(),
  expires: dateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type SessionType = z.infer<typeof SessionSchema>;

/** Zod schema for the VerificationToken model */
export const VerificationTokenSchema = z.object({
  identifier: z.string(),
  token: z.string(),
  expires: dateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type VerificationTokenType = z.infer<typeof VerificationTokenSchema>;

/** Zod schema for the PersonhoodVerification model */
export const PersonhoodVerificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  provider: PersonhoodProviderSchema,
  status: PersonhoodVerificationStatusSchema.default('VERIFIED'),
  externalId: z.string(),
  action: z.string().nullable().optional(),
  verificationLevel: z.string().nullable().optional(),
  signalHash: z.string().nullable().optional(),
  verifiedAt: dateSchema,
  lastVerifiedAt: dateSchema,
  expiresAt: nullableDateSchema,
  providerMetadata: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PersonhoodVerificationType = z.infer<typeof PersonhoodVerificationSchema>;

// ============================================================================
// LAYER 1 — Universal Measurement System Models
// ============================================================================

/** Zod schema for the Unit model */
export const UnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  abbreviatedName: z.string(),
  codeSystem: UnitCodeSystemSchema.default('UCUM'),
  ucumCode: z.string(),
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
  numberOfNOf1Variables: z.number().int().default(0),
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

/** Zod schema for the Subject model */
export const SubjectSchema = z.object({
  id: z.string(),
  subjectType: SubjectTypeSchema.default('USER'),
  externalId: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type SubjectType_ = z.infer<typeof SubjectSchema>;

/** Zod schema for the NOf1Variable model */
export const NOf1VariableSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subjectId: z.string().nullable().optional(),
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
export type NOf1VariableType = z.infer<typeof NOf1VariableSchema>;

/** Zod schema for the Measurement model */
export const MeasurementSchema = z.object({
  id: z.string(),
  userId: z.string(),
  nOf1VariableId: z.string(),
  globalVariableId: z.string(),
  startTime: dateSchema,
  value: z.number(),
  unitId: z.string(),
  originalValue: z.number(),
  originalUnitId: z.string(),
  duration: z.number().int().nullable().optional(),
  note: z.string().nullable().optional(),
  sourceName: z.string().nullable().optional(),
  integrationConnectionId: z.string().nullable().optional(),
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
  nOf1VariableId: z.string(),
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

/** Zod schema for the NOf1VariableRelationship model */
export const NOf1VariableRelationshipSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
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
export type NOf1VariableRelationshipType = z.infer<
  typeof NOf1VariableRelationshipSchema
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
  numberOfSubjects: z.number().int(),
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
  integrationProviderId: z.string(),
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
  integrationConnectionId: z.string(),
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
  parentJurisdictionId: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  currency: z.string().default('USD'),
  population: z.number().int().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type JurisdictionType_ = z.infer<typeof JurisdictionSchema>;

/** Zod schema for the WishocraticItem model */
export const WishocraticItemSchema = z.object({
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
export type WishocraticItemType = z.infer<typeof WishocraticItemSchema>;

/** @deprecated Use WishocraticItemSchema instead */
export const ItemSchema = WishocraticItemSchema;
/** @deprecated Use WishocraticItemType instead */
export type ItemType = WishocraticItemType;


/** Zod schema for the Referral model */
export const ReferralSchema = z.object({
  id: z.string(),
  answer: ReferralAnswerSchema,
  userId: z.string().nullable().optional(),
  referredByUserId: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type ReferralType = z.infer<typeof ReferralSchema>;

/** Zod schema for the WishocraticAllocation model */
export const WishocraticAllocationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  itemAId: z.string(),
  itemBId: z.string(),
  allocationA: z.number().int(),
  allocationB: z.number().int(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type WishocraticAllocationType = z.infer<typeof WishocraticAllocationSchema>;

/** Zod schema for the WishocraticCategorySelection model */
export const WishocraticCategorySelectionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  itemId: z.string(),
  selected: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type WishocraticCategorySelectionType = z.infer<
  typeof WishocraticCategorySelectionSchema
>;


/** Zod schema for the PreferenceWeight model */
export const PreferenceWeightSchema = z.object({
  id: z.string(),
  aggregationRunId: z.string(),
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
  itemId: z.string(),
  allocationPct: z.number(),
  billId: z.string().nullable().optional(),
  votedAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PoliticianVoteType = z.infer<typeof PoliticianVoteSchema>;

/** Zod schema for the AlignmentScore model */
export const AlignmentScoreSchema = z.object({
  id: z.string(),
  politicianId: z.string(),
  aggregationRunId: z.string(),
  score: z.number(),
  votesCompared: z.number().int(),
  publishedAt: nullableDateSchema,
  onChainRef: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type AlignmentScoreType = z.infer<typeof AlignmentScoreSchema>;

/** Zod schema for the CategoryAlignmentScore model */
export const CategoryAlignmentScoreSchema = z.object({
  id: z.string(),
  alignmentScoreId: z.string(),
  itemId: z.string(),
  score: z.number(),
});
export type CategoryAlignmentScoreType = z.infer<typeof CategoryAlignmentScoreSchema>;

/** Zod schema for the CitizenBillVote model */
export const CitizenBillVoteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  billId: z.string(),
  billTitle: z.string(),
  position: VotePositionSchema,
  reasoning: z.string().nullable().optional(),
  jurisdictionId: z.string().nullable().optional(),
  shareIdentifier: z.string(),
  cbaSnapshot: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export type CitizenBillVoteType = z.infer<typeof CitizenBillVoteSchema>;

/** Zod schema for the WebPushSubscription model */
export const WebPushSubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  endpoint: z.string(),
  p256dh: z.string(),
  auth: z.string(),
  userAgent: z.string().nullable().optional(),
  createdAt: dateSchema,
  lastSentAt: nullableDateSchema,
  expired: z.boolean().default(false),
});
export type WebPushSubscriptionType = z.infer<typeof WebPushSubscriptionSchema>;

/** Zod schema for the UserPreference model (renamed from NotificationPreference) */
export const UserPreferenceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  pushEnabled: z.boolean().default(true),
  reminderFrequencyMinutes: z.number().int().default(1440),
  reminderStartTime: z.string().default('09:00'),
  quietHoursStart: z.string().default('21:00'),
  lastPushSentAt: nullableDateSchema,
  lastCheckInAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type UserPreferenceType = z.infer<typeof UserPreferenceSchema>;

/** @deprecated Use UserPreferenceSchema instead */
export const NotificationPreferenceSchema = UserPreferenceSchema;
/** @deprecated Use UserPreferenceType instead */
export type NotificationPreferenceType = UserPreferenceType;

/** Zod schema for the WishocraticEncryptedAllocation model */
export const WishocraticEncryptedAllocationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  ciphertext: z.string(),
  iv: z.string(),
  algorithm: z.string().default('AES-GCM-256'),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type WishocraticEncryptedAllocationType = z.infer<
  typeof WishocraticEncryptedAllocationSchema
>;

/** Zod schema for the Referendum model */
export const ReferendumSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  createdByUserId: z.string().nullable().optional(),
  jurisdictionId: z.string().nullable().optional(),
  status: ReferendumStatusSchema.default('ACTIVE'),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type ReferendumType = z.infer<typeof ReferendumSchema>;

/** Zod schema for the ReferendumVote model */
export const ReferendumVoteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  referendumId: z.string(),
  answer: VotePositionSchema,
  referredByUserId: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type ReferendumVoteType = z.infer<typeof ReferendumVoteSchema>;

/** Zod schema for the PublicGoodsRecipient model */
export const PublicGoodsRecipientSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  name: z.string(),
  walletAddress: z.string(),
  active: z.boolean().default(true),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PublicGoodsRecipientType = z.infer<typeof PublicGoodsRecipientSchema>;

/** Zod schema for the WishocraticDistribution model */
export const WishocraticDistributionSchema = z.object({
  id: z.string(),
  totalAmount: z.string(),
  recipientCount: z.number().int(),
  weightsHash: z.string(),
  txHash: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type WishocraticDistributionType = z.infer<typeof WishocraticDistributionSchema>;

// ============================================================================
// VOTE TOKEN & VOTER PRIZE TREASURY
// ============================================================================

/** Zod schema for the VoteTokenMint model */
export const VoteTokenMintSchema = z.object({
  id: z.string(),
  userId: z.string(),
  referendumId: z.string(),
  nullifierHash: z.string(),
  walletAddress: z.string(),
  amount: z.string(),
  txHash: z.string().nullable().optional(),
  chainId: z.number().int(),
  status: VoteTokenMintStatusSchema.default('PENDING'),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type VoteTokenMintType = z.infer<typeof VoteTokenMintSchema>;

/** Zod schema for the PrizeTreasuryDeposit model */
export const PrizeTreasuryDepositSchema = z.object({
  id: z.string(),
  depositorAddress: z.string(),
  amount: z.string(),
  sharesReceived: z.string(),
  txHash: z.string(),
  chainId: z.number().int(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PrizeTreasuryDepositType = z.infer<typeof PrizeTreasuryDepositSchema>;

// ============================================================================
// ACTIVITY LOG & NOTIFICATIONS
// ============================================================================

/** Zod schema for the Activity model */
export const ActivitySchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: ActivityTypeSchema,
  description: z.string().nullable().optional(),
  metadata: z.string().nullable().optional(),
  entityType: z.string().nullable().optional(),
  entityId: z.string().nullable().optional(),
  createdAt: dateSchema,
});
export type ActivitySchemaType = z.infer<typeof ActivitySchema>;

/** Zod schema for the Notification model */
export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  link: z.string().nullable().optional(),
  isRead: z.boolean().default(false),
  readAt: nullableDateSchema,
  createdAt: dateSchema,
});
export type NotificationSchemaType = z.infer<typeof NotificationSchema>;

/** Zod schema for the per-type/channel NotificationPreference model */
export const NotificationPreferencePerTypeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  channel: NotificationChannelSchema,
  enabled: z.boolean().default(true),
});
export type NotificationPreferencePerTypeType = z.infer<typeof NotificationPreferencePerTypeSchema>;

// ============================================================================
// ORGANIZATIONS
// ============================================================================

/** Zod schema for the Organization model */
export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  type: OrgTypeSchema,
  status: OrgStatusSchema.default('PENDING'),
  jurisdictionId: z.string().nullable().optional(),
  creatorId: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type OrganizationType = z.infer<typeof OrganizationSchema>;

/** Zod schema for the OrganizationMember model */
export const OrganizationMemberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: z.string().default('member'),
  joinedAt: dateSchema,
});
export type OrganizationMemberType = z.infer<typeof OrganizationMemberSchema>;

// ============================================================================
// SURVEY SYSTEM
// ============================================================================

/** Zod schema for the Survey model */
export const SurveySchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  jurisdictionId: z.string().nullable().optional(),
  referendumId: z.string().nullable().optional(),
  active: z.boolean().default(true),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type SurveyType = z.infer<typeof SurveySchema>;

/** Zod schema for the SurveySection model */
export const SurveySectionSchema = z.object({
  id: z.string(),
  surveyId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  conditionalLogic: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export type SurveySectionType = z.infer<typeof SurveySectionSchema>;

/** Zod schema for the SurveyQuestion model */
export const SurveyQuestionSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  text: z.string(),
  type: QuestionTypeSchema,
  required: z.boolean().default(false),
  options: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  score: z.number().nullable().optional(),
  conditionalLogic: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export type SurveyQuestionType = z.infer<typeof SurveyQuestionSchema>;

/** Zod schema for the SurveyResponse model */
export const SurveyResponseSchema = z.object({
  id: z.string(),
  surveyId: z.string(),
  userId: z.string(),
  totalScore: z.number().nullable().optional(),
  completedAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export type SurveyResponseType = z.infer<typeof SurveyResponseSchema>;

/** Zod schema for the QuestionResponse model */
export const QuestionResponseSchema = z.object({
  id: z.string(),
  surveyResponseId: z.string(),
  questionId: z.string(),
  answer: z.string(),
  score: z.number().nullable().optional(),
  createdAt: dateSchema,
});
export type QuestionResponseType = z.infer<typeof QuestionResponseSchema>;

// ============================================================================
// GAMIFICATION & SOCIAL
// ============================================================================

/** Zod schema for the Badge model */
export const BadgeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: BadgeTypeSchema,
  earnedAt: dateSchema,
  metadata: z.string().nullable().optional(),
});
export type BadgeSchemaType = z.infer<typeof BadgeSchema>;

/** Zod schema for the SocialAccount model */
export const SocialAccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  platform: SocialPlatformSchema,
  accountId: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  walletAddress: z.string().nullable().optional(),
  isPrimary: z.boolean().default(false),
  verifiedAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export type SocialAccountType = z.infer<typeof SocialAccountSchema>;

/** Zod schema for the EmailLog model */
export const EmailLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  toAddress: z.string(),
  subject: z.string(),
  templateId: z.string().nullable().optional(),
  status: EmailLogStatusSchema.default('SENT'),
  sentAt: dateSchema,
  deliveredAt: nullableDateSchema,
  openedAt: nullableDateSchema,
  bouncedAt: nullableDateSchema,
  errorMessage: z.string().nullable().optional(),
  createdAt: dateSchema,
});
export type EmailLogType = z.infer<typeof EmailLogSchema>;
