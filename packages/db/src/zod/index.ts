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

import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const CombinationOperationSchema = z.enum(["SUM", "MEAN"]);
export type CombinationOperation = z.infer<typeof CombinationOperationSchema>;

export const FillingTypeSchema = z.enum([
  "ZERO",
  "NONE",
  "INTERPOLATION",
  "VALUE",
]);
export type FillingType = z.infer<typeof FillingTypeSchema>;

export const ValenceSchema = z.enum(["POSITIVE", "NEGATIVE", "NEUTRAL"]);
export type Valence = z.infer<typeof ValenceSchema>;

export const MeasurementScaleSchema = z.enum([
  "NOMINAL",
  "ORDINAL",
  "INTERVAL",
  "RATIO",
]);
export type MeasurementScale = z.infer<typeof MeasurementScaleSchema>;

export const UnitCodeSystemSchema = z.enum(["UCUM"]);
export type UnitCodeSystem = z.infer<typeof UnitCodeSystemSchema>;

export const AnalysisStatusSchema = z.enum([
  "WAITING",
  "ANALYZING",
  "DONE",
  "ERROR",
]);
export type AnalysisStatus = z.infer<typeof AnalysisStatusSchema>;

export const StrengthLevelSchema = z.enum([
  "VERY_STRONG",
  "STRONG",
  "MODERATE",
  "WEAK",
  "VERY_WEAK",
]);
export type StrengthLevel = z.infer<typeof StrengthLevelSchema>;

export const ConfidenceLevelSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const RelationshipDirectionSchema = z.enum([
  "POSITIVE",
  "NEGATIVE",
  "NONE",
]);
export type RelationshipDirection = z.infer<typeof RelationshipDirectionSchema>;

export const EvidenceGradeSchema = z.enum(["A", "B", "C", "D", "F"]);
export type EvidenceGrade = z.infer<typeof EvidenceGradeSchema>;

export const NotificationStatusSchema = z.enum([
  "PENDING",
  "SENT",
  "TRACKED",
  "SKIPPED",
  "SNOOZED",
]);
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>;

export const JurisdictionTypeSchema = z.enum([
  "CITY",
  "COUNTY",
  "STATE",
  "COUNTRY",
]);
export type JurisdictionType = z.infer<typeof JurisdictionTypeSchema>;

export const SubjectTypeSchema = z.enum([
  "USER",
  "PERSON",
  "JURISDICTION",
  "COHORT",
  "ORGANIZATION",
]);
export type SubjectType = z.infer<typeof SubjectTypeSchema>;

export const ReferralAnswerSchema = z.enum(["YES", "NO"]);
export type ReferralAnswer = z.infer<typeof ReferralAnswerSchema>;

export const PersonhoodProviderSchema = z.enum(["WORLD_ID", "HUMAN_PASSPORT"]);
export type PersonhoodProvider = z.infer<typeof PersonhoodProviderSchema>;

export const PersonhoodVerificationStatusSchema = z.enum([
  "VERIFIED",
  "REVOKED",
]);
export type PersonhoodVerificationStatus = z.infer<
  typeof PersonhoodVerificationStatusSchema
>;

export const PersonLifeStatusSchema = z.enum(["UNKNOWN", "LIVING", "DECEASED"]);
export type PersonLifeStatus = z.infer<typeof PersonLifeStatusSchema>;

export const PersonConditionStatusSchema = z.enum([
  "UNKNOWN",
  "ACTIVE",
  "PAST",
  "CAUSE_OF_DEATH",
]);
export type PersonConditionStatus = z.infer<typeof PersonConditionStatusSchema>;

export const PersonDeathCauseCategorySchema = z.enum([
  "UNKNOWN",
  "DISEASE",
  "ARMED_CONFLICT",
  "STATE_VIOLENCE",
  "TERRORISM",
  "OTHER_PREVENTABLE",
  "OTHER",
]);
export type PersonDeathCauseCategory = z.infer<
  typeof PersonDeathCauseCategorySchema
>;

export const PersonCivilianStatusSchema = z.enum([
  "UNKNOWN",
  "CIVILIAN",
  "COMBATANT",
]);
export type PersonCivilianStatus = z.infer<typeof PersonCivilianStatusSchema>;

export const PersonMemorialEvidenceKindSchema = z.enum([
  "PHOTO",
  "DOCUMENT",
  "NEWS_ARTICLE",
  "HOSPITAL_RECORD",
  "DEATH_RECORD",
  "WITNESS_STATEMENT",
  "OTHER",
]);
export type PersonMemorialEvidenceKind = z.infer<
  typeof PersonMemorialEvidenceKindSchema
>;

export const EfficacyLagEvidenceStatusSchema = z.enum([
  "CANDIDATE",
  "CONFIRMED",
  "REJECTED",
]);
export type EfficacyLagEvidenceStatus = z.infer<
  typeof EfficacyLagEvidenceStatusSchema
>;

export const InterventionExperienceStatusSchema = z.enum([
  "UNKNOWN",
  "CURRENT",
  "PAST",
  "PLANNED",
  "NEVER_TRIED",
]);
export type InterventionExperienceStatus = z.infer<
  typeof InterventionExperienceStatusSchema
>;

export const InterventionOutcomeRatingSchema = z.enum([
  "UNKNOWN",
  "MUCH_WORSE",
  "WORSE",
  "NO_EFFECT",
  "MODERATE_IMPROVEMENT",
  "MAJOR_IMPROVEMENT",
]);
export type InterventionOutcomeRating = z.infer<
  typeof InterventionOutcomeRatingSchema
>;

export const InterventionSideEffectSeveritySchema = z.enum([
  "UNKNOWN",
  "NONE",
  "MINIMAL",
  "MILD",
  "MODERATE",
  "SEVERE",
  "EXTREME",
]);
export type InterventionSideEffectSeverity = z.infer<
  typeof InterventionSideEffectSeveritySchema
>;

export const VariableEvidenceMetricKindSchema = z.enum([
  "EFFECT_SIZE",
  "EFFECTIVENESS",
  "SAFETY",
  "NNT",
  "NNH",
  "COST",
  "COST_PER_QALY",
  "QALYS_GAINED",
  "REMISSION_RATE",
  "RESPONSE_RATE",
  "ACCESS",
  "CONFIDENCE",
  "OTHER",
]);
export type VariableEvidenceMetricKind = z.infer<
  typeof VariableEvidenceMetricKindSchema
>;

export const VariableRelationshipEvidenceSourceTypeSchema = z.enum([
  "IMPORTED_STUDY",
  "USER_REPORT",
  "OPTIMIZER_N_OF_1",
  "OPTIMIZER_AGGREGATE",
  "CURATED_DATASET",
  "MANUAL",
  "OTHER",
]);
export type VariableRelationshipEvidenceSourceType = z.infer<
  typeof VariableRelationshipEvidenceSourceTypeSchema
>;

export const InterventionRankingRunStatusSchema = z.enum(["DRAFT", "ACTIVE"]);
export type InterventionRankingRunStatus = z.infer<
  typeof InterventionRankingRunStatusSchema
>;

export const VotePositionSchema = z.enum(["YES", "NO", "ABSTAIN"]);
export type VotePosition = z.infer<typeof VotePositionSchema>;

export const ReferendumVoteSourceSchema = z.enum(["SELF", "REPRESENTED"]);
export type ReferendumVoteSource = z.infer<typeof ReferendumVoteSourceSchema>;

export const ReferendumStatusSchema = z.enum(["DRAFT", "ACTIVE", "CLOSED"]);
export type ReferendumStatus = z.infer<typeof ReferendumStatusSchema>;

export const ReferendumKindSchema = z.enum([
  "GENERAL",
  "DECLARATION",
  "TREATY",
  "MEMBERSHIP",
  "COURT_CASE",
  "AMENDMENT",
  "BUDGET",
]);
export type ReferendumKind = z.infer<typeof ReferendumKindSchema>;

export const CourtCaseStatusSchema = z.enum([
  "DRAFT",
  "OPEN",
  "VOTING",
  "JUDGED",
  "ARCHIVED",
]);
export type CourtCaseStatus = z.infer<typeof CourtCaseStatusSchema>;

export const CourtCasePartyRoleSchema = z.enum([
  "NOMINAL_PLAINTIFF",
  "NAMED_PLAINTIFF",
  "REPRESENTATIVE_CLASS",
  "RESPONDENT",
  "AMICUS",
  "BENEFICIARY",
]);
export type CourtCasePartyRole = z.infer<typeof CourtCasePartyRoleSchema>;

export const CourtCasePartyCapacitySchema = z.enum([
  "INSTITUTIONAL",
  "OFFICIAL_CAPACITY",
  "PERSONAL_CAPACITY",
  "OVERSIGHT_CAPACITY",
  "CLASS_REPRESENTATIVE",
]);
export type CourtCasePartyCapacity = z.infer<
  typeof CourtCasePartyCapacitySchema
>;

export const CourtCaseItemStatusSchema = z.enum([
  "PROPOSED",
  "ACCEPTED",
  "REJECTED",
  "SUPERSEDED",
]);
export type CourtCaseItemStatus = z.infer<typeof CourtCaseItemStatusSchema>;

export const PointMintStatusSchema = z.enum([
  "PENDING",
  "SUBMITTED",
  "CONFIRMED",
  "FAILED",
]);
export type PointMintStatus = z.infer<typeof PointMintStatusSchema>;

export const ActivityTypeSchema = z.enum([
  "VOTED_REFERENDUM",
  "SUBMITTED_COMPARISON",
  "DEPOSITED_PRIZE",
  "RECRUITED_VOTER",
  "CONTACTED_ASSIGNEE",
  "VERIFIED_PERSONHOOD",
  "TRACKED_MEASUREMENT",
  "UPDATED_PROFILE",
  "EARNED_BADGE",
  "CREATED_SURVEY",
  "COMPLETED_SURVEY",
  "JOINED_ORGANIZATION",
]);
export type ActivityType = z.infer<typeof ActivityTypeSchema>;

export const NotificationTypeSchema = z.enum([
  "REFERRAL_SIGNUP",
  "REFERENDUM_MILESTONE",
  "ALIGNMENT_SCORE_PUBLISHED",
  "DEPOSIT_CONFIRMED",
  "BADGE_EARNED",
  "SURVEY_INVITE",
  "DAILY_CHECKIN_REMINDER",
  "ORGANIZATION_INVITE",
  "SYSTEM_ANNOUNCEMENT",
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationChannelSchema = z.enum([
  "EMAIL",
  "IN_APP",
  "SMS",
  "PUSH",
]);
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

export const OrgTypeSchema = z.enum([
  "UNIVERSITY",
  "RESEARCH_CENTER",
  "NONPROFIT",
  "DAO",
  "GOVERNMENT",
  "GOVERNMENT_AGENCY",
  "HOSPITAL",
  "BIOTECH",
  "COMPANY",
  "FOUNDATION",
  "INTERGOVERNMENTAL",
  "MEDIA",
  "POLITICAL_PARTY",
  "ADVOCACY",
  "OTHER",
]);
export type OrgType = z.infer<typeof OrgTypeSchema>;

export const OrgStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type OrgStatus = z.infer<typeof OrgStatusSchema>;

export const SocialPlatformSchema = z.enum([
  "TWITTER",
  "GITHUB",
  "ETHEREUM",
  "BASE",
  "DISCORD",
  "TELEGRAM",
]);
export type SocialPlatform = z.infer<typeof SocialPlatformSchema>;

export const BadgeTypeSchema = z.enum([
  "FIRST_COMPARISON",
  "HUNDRED_COMPARISONS",
  "FIRST_RECRUIT",
  "TEN_RECRUITS",
  "VERIFIED_HUMAN",
  "EARLY_ADOPTER",
  "DEPOSITOR",
]);
export type BadgeType = z.infer<typeof BadgeTypeSchema>;

export const WishReasonSchema = z.enum([
  "WORLD_ID_VERIFICATION",
  "KYC_COMPLETION",
  "CENSUS_SNAPSHOT",
  "DAILY_CHECKIN",
  "WISHOCRATIC_ALLOCATION",
  "REFERENDUM_VOTE",
  "ALIGNMENT_CHECK",
  "REFERRAL",
  "PRIZE_DEPOSIT",
  "SHARE_REPORT",
  "TASK_COMPLETED",
]);
export type WishReason = z.infer<typeof WishReasonSchema>;

export const TaskCategorySchema = z.enum([
  "ADVOCACY",
  "RESEARCH",
  "COMMUNICATION",
  "ENGINEERING",
  "ORGANIZING",
  "OUTREACH",
  "GOVERNANCE",
  "SCIENCE",
  "LEGAL",
  "CREATIVE",
  "OTHER",
]);
export type TaskCategory = z.infer<typeof TaskCategorySchema>;

export const TaskKindSchema = z.enum([
  "TASK",
  "ROLE_OPENING",
  "PROJECT",
  "BOUNTY",
  "VOLUNTEER_ROLE",
]);
export type TaskKind = z.infer<typeof TaskKindSchema>;

export const TaskEngagementKindSchema = z.enum([
  "ONE_OFF",
  "ONGOING",
  "PART_TIME",
  "FULL_TIME",
  "CONTRACT",
]);
export type TaskEngagementKind = z.infer<typeof TaskEngagementKindSchema>;

export const TaskCompensationKindSchema = z.enum([
  "UNSPECIFIED",
  "VOLUNTEER",
  "PAID",
  "BOUNTY",
  "EQUITY",
  "OTHER",
]);
export type TaskCompensationKind = z.infer<typeof TaskCompensationKindSchema>;

export const TaskCompensationCadenceSchema = z.enum([
  "FIXED",
  "HOURLY",
  "WEEKLY",
  "MONTHLY",
  "ANNUAL",
]);
export type TaskCompensationCadence = z.infer<
  typeof TaskCompensationCadenceSchema
>;

export const TaskRemotePolicySchema = z.enum([
  "UNSPECIFIED",
  "REMOTE",
  "HYBRID",
  "ONSITE",
]);
export type TaskRemotePolicy = z.infer<typeof TaskRemotePolicySchema>;

export const TaskExecutionModeSchema = z.enum([
  "HUMAN_OR_AGENT",
  "HUMAN_ONLY",
  "AGENT_ONLY",
]);
export type TaskExecutionMode = z.infer<typeof TaskExecutionModeSchema>;

export const TaskCandidateKindSchema = z.enum([
  "USER",
  "PERSON",
  "ORGANIZATION",
  "AGENT",
  "EXTERNAL",
]);
export type TaskCandidateKind = z.infer<typeof TaskCandidateKindSchema>;

export const TaskCandidateMatchStatusSchema = z.enum([
  "SUGGESTED",
  "CONTACTED",
  "DECLINED",
  "REJECTED",
]);
export type TaskCandidateMatchStatus = z.infer<
  typeof TaskCandidateMatchStatusSchema
>;

export const TaskExecutionAttemptStatusSchema = z.enum([
  "QUEUED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "REJECTED",
  "CANCELLED",
]);
export type TaskExecutionAttemptStatus = z.infer<
  typeof TaskExecutionAttemptStatusSchema
>;

export const AgentExecutorStatusSchema = z.enum([
  "ACTIVE",
  "PAUSED",
  "RETIRED",
]);
export type AgentExecutorStatus = z.infer<typeof AgentExecutorStatusSchema>;

export const TaskMarketplaceListingKindSchema = z.enum([
  "TASK_POSTING",
  "FEATURED_PLACEMENT",
]);
export type TaskMarketplaceListingKind = z.infer<
  typeof TaskMarketplaceListingKindSchema
>;

export const TaskMarketplaceFeePolicySchema = z.enum([
  "FREE",
  "PAID_POSTING",
  "SUBSCRIPTION",
]);
export type TaskMarketplaceFeePolicy = z.infer<
  typeof TaskMarketplaceFeePolicySchema
>;

export const TaskMarketplaceListingStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "CLOSED",
  "EXPIRED",
  "CANCELLED",
]);
export type TaskMarketplaceListingStatus = z.infer<
  typeof TaskMarketplaceListingStatusSchema
>;

export const TaskDistributionChannelSchema = z.enum([
  "JOB_BOARD",
  "SOCIAL",
  "COMMUNITY",
  "FREELANCE_MARKETPLACE",
  "GRANTS",
  "SEARCH_INDEX",
  "WEBHOOK",
  "TASK_PLATFORM",
  "OTHER",
]);
export type TaskDistributionChannel = z.infer<
  typeof TaskDistributionChannelSchema
>;

export const TaskDistributionOperationSchema = z.enum([
  "CREATE",
  "UPDATE",
  "REMOVE",
  "INDEX",
]);
export type TaskDistributionOperation = z.infer<
  typeof TaskDistributionOperationSchema
>;

export const TaskDistributionTargetStatusSchema = z.enum([
  "ACTIVE",
  "PAUSED",
  "RETIRED",
]);
export type TaskDistributionTargetStatus = z.infer<
  typeof TaskDistributionTargetStatusSchema
>;

export const TaskDistributionAttemptStatusSchema = z.enum([
  "DRAFT",
  "QUEUED",
  "APPROVAL_REQUIRED",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
]);
export type TaskDistributionAttemptStatus = z.infer<
  typeof TaskDistributionAttemptStatusSchema
>;

export const TaskClaimPolicySchema = z.enum([
  "ASSIGNED_ONLY",
  "OPEN_SINGLE",
  "OPEN_MANY",
]);
export type TaskClaimPolicy = z.infer<typeof TaskClaimPolicySchema>;

export const TaskStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "VERIFIED",
  "STALE",
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskDeadlinePolicySchema = z.enum([
  "NONE",
  "SOFT",
  "EXPIRES",
  "REQUIRED",
]);
export type TaskDeadlinePolicy = z.infer<typeof TaskDeadlinePolicySchema>;

export const TaskApplicationPolicySchema = z.enum([
  "CLOSED",
  "OPEN",
  "INVITE_ONLY",
]);
export type TaskApplicationPolicy = z.infer<typeof TaskApplicationPolicySchema>;

export const TaskApplicationStatusSchema = z.enum([
  "APPLIED",
  "INVITED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEWING",
  "OFFERED",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "ARCHIVED",
]);
export type TaskApplicationStatus = z.infer<typeof TaskApplicationStatusSchema>;

export const TaskApplicationEventTypeSchema = z.enum([
  "CREATED",
  "STATUS_CHANGED",
  "REVIEWED",
  "COMMENTED",
  "INVITED",
  "WITHDRAWN",
]);
export type TaskApplicationEventType = z.infer<
  typeof TaskApplicationEventTypeSchema
>;

export const TaskClaimStatusSchema = z.enum([
  "CLAIMED",
  "IN_PROGRESS",
  "COMPLETED",
  "VERIFIED",
  "REJECTED",
  "ABANDONED",
]);
export type TaskClaimStatus = z.infer<typeof TaskClaimStatusSchema>;

export const TaskEdgeTypeSchema = z.enum([
  "DEPENDS_ON",
  "BLOCKS",
  "INCREASES_PROBABILITY_OF",
  "ACCELERATES",
]);
export type TaskEdgeType = z.infer<typeof TaskEdgeTypeSchema>;

export const TaskFundingTargetStatusSchema = z.enum([
  "OPEN",
  "THRESHOLD_MET",
  "EXPIRED",
  "CANCELLED",
]);
export type TaskFundingTargetStatus = z.infer<
  typeof TaskFundingTargetStatusSchema
>;

export const TaskFundingPledgerKindSchema = z.enum(["PERSON", "ORGANIZATION"]);
export type TaskFundingPledgerKind = z.infer<
  typeof TaskFundingPledgerKindSchema
>;

export const TaskFundingPledgeStatusSchema = z.enum([
  "ACTIVE",
  "CANCELLED",
  "EXPIRED",
  "CALLED",
  "FULFILLED",
]);
export type TaskFundingPledgeStatus = z.infer<
  typeof TaskFundingPledgeStatusSchema
>;

export const TaskFundingEventTypeSchema = z.enum([
  "PLEDGE_CREATED",
  "PLEDGE_UPDATED",
  "PLEDGE_CANCELLED",
  "TARGET_UPDATED",
  "THRESHOLD_MET",
  "NOTIFICATION_SENT",
]);
export type TaskFundingEventType = z.infer<typeof TaskFundingEventTypeSchema>;

export const SourceSystemSchema = z.enum([
  "MANUAL",
  "OPG",
  "OBG",
  "PARAMETER_CATALOG",
  "EXTERNAL",
  "CURATED",
  "COMBINED",
]);
export type SourceSystem = z.infer<typeof SourceSystemSchema>;

export const SourceArtifactTypeSchema = z.enum([
  "MANUAL_SECTION",
  "MANUAL_SNAPSHOT",
  "OPG_POLICY_RECOMMENDATION",
  "OPG_POLICY_REPORT",
  "OBG_BUDGET_CATEGORY",
  "OBG_BUDGET_REPORT",
  "PARAMETER_SET",
  "CALCULATION_SOURCE",
  "CALCULATION_RUN",
  "EXTERNAL_SOURCE",
]);
export type SourceArtifactType = z.infer<typeof SourceArtifactTypeSchema>;

export const ParameterSourceTypeSchema = z.enum([
  "EXTERNAL",
  "CALCULATED",
  "DEFINITION",
  "AI_ESTIMATED",
  "CURATED",
]);
export type ParameterSourceType = z.infer<typeof ParameterSourceTypeSchema>;

export const ParameterDistributionTypeSchema = z.enum([
  "FIXED",
  "NORMAL",
  "LOGNORMAL",
  "BETA",
  "GAMMA",
  "TRIANGULAR",
  "UNIFORM",
]);
export type ParameterDistributionType = z.infer<
  typeof ParameterDistributionTypeSchema
>;

export const ModelRevisionStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "SUPERSEDED",
  "REJECTED",
]);
export type ModelRevisionStatus = z.infer<typeof ModelRevisionStatusSchema>;

export const TaskImpactEstimateKindSchema = z.enum([
  "FORECAST",
  "OBSERVED",
  "HYBRID",
]);
export type TaskImpactEstimateKind = z.infer<
  typeof TaskImpactEstimateKindSchema
>;

export const TaskImpactPublicationStatusSchema = z.enum([
  "DRAFT",
  "REVIEWED",
  "PUBLISHED",
  "SUPERSEDED",
]);
export type TaskImpactPublicationStatus = z.infer<
  typeof TaskImpactPublicationStatusSchema
>;

export const TaskImpactFrameKeySchema = z.enum([
  "IMMEDIATE",
  "ONE_YEAR",
  "FIVE_YEAR",
  "TWENTY_YEAR",
  "LIFETIME",
  "CUSTOM",
]);
export type TaskImpactFrameKey = z.infer<typeof TaskImpactFrameKeySchema>;

export const TaskCommunicationAudienceSchema = z.enum([
  "RECIPIENT",
  "SENDER",
  "OBSERVER",
  "ASSIGNEE",
]);
export type TaskCommunicationAudience = z.infer<
  typeof TaskCommunicationAudienceSchema
>;

export const TaskCommunicationPurposeSchema = z.enum([
  "INVITATION",
  "ASSIGNMENT",
  "REMINDER",
  "FOLLOW_UP",
  "EVIDENCE_REQUEST",
  "STATUS_UPDATE",
  "REPLY",
  "SCORECARD",
  "RE_ENGAGEMENT",
  "VOTE_CONFIRMED",
  "RECIPIENT_VOTED",
  "SHARE",
]);
export type TaskCommunicationPurpose = z.infer<
  typeof TaskCommunicationPurposeSchema
>;

export const TaskCommunicationFormatSchema = z.enum([
  "DEFAULT",
  "TASK_NOTIFICATION",
  "SINCERE",
]);
export type TaskCommunicationFormat = z.infer<
  typeof TaskCommunicationFormatSchema
>;

export const TaskCommunicationDirectionSchema = z.enum(["OUTBOUND", "INBOUND"]);
export type TaskCommunicationDirection = z.infer<
  typeof TaskCommunicationDirectionSchema
>;

export const TaskCommunicationChannelSchema = z.enum([
  "EMAIL",
  "IN_APP",
  "SMS",
  "PUSH",
  "EXTERNAL_URL",
  "MAILTO",
  "MANUAL",
]);
export type TaskCommunicationChannel = z.infer<
  typeof TaskCommunicationChannelSchema
>;

export const TaskCommunicationStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "RECEIVED",
  "FAILED",
  "CANCELLED",
]);
export type TaskCommunicationStatus = z.infer<
  typeof TaskCommunicationStatusSchema
>;

export const TaskCommunicationEndpointKindSchema = z.enum([
  "EMAIL",
  "MAILTO",
  "EXTERNAL_URL",
  "FORM_URL",
  "PUBLIC_PROFILE",
  "IN_APP",
  "MANUAL",
]);
export type TaskCommunicationEndpointKind = z.infer<
  typeof TaskCommunicationEndpointKindSchema
>;

export const TaskCommunicationEndpointVerificationStatusSchema = z.enum([
  "UNVERIFIED",
  "VERIFIED",
  "STALE",
  "FAILED",
]);
export type TaskCommunicationEndpointVerificationStatus = z.infer<
  typeof TaskCommunicationEndpointVerificationStatusSchema
>;

export const TaskCommentKindSchema = z.enum([
  "COMMENT",
  "OUTBOUND_MESSAGE",
  "INBOUND_MESSAGE",
  "STATUS_UPDATE",
  "SYSTEM_NOTE",
]);
export type TaskCommentKind = z.infer<typeof TaskCommentKindSchema>;

export const TaskCommentVisibilitySchema = z.enum(["PUBLIC", "INTERNAL"]);
export type TaskCommentVisibility = z.infer<typeof TaskCommentVisibilitySchema>;

export const TaskCommentSourceSchema = z.enum([
  "WEB",
  "AGENT",
  "EMAIL_REPLY",
  "MANUAL_IMPORT",
  "SYSTEM",
]);
export type TaskCommentSource = z.infer<typeof TaskCommentSourceSchema>;

export const McpScopeSchema = z.enum([
  "TASKS_ADMIN",
  "TASKS_PERSONAL",
  "EARTHDATA_WRITE",
  "EARTHDATA_ADMIN",
  "AGENT_RUN",
  "GITHUB",
]);
export type McpScope = z.infer<typeof McpScopeSchema>;

export const McpToolCallStatusSchema = z.enum(["SUCCEEDED", "FAILED"]);
export type McpToolCallStatus = z.infer<typeof McpToolCallStatusSchema>;

export const ContentReportStatusSchema = z.enum([
  "OPEN",
  "RESOLVED",
  "DISMISSED",
]);
export type ContentReportStatus = z.infer<typeof ContentReportStatusSchema>;

export const QuestionTypeSchema = z.enum([
  "MULTIPLE_CHOICE",
  "FREE_TEXT",
  "RATING",
  "BOOLEAN",
  "NUMERIC",
]);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const EmailLogStatusSchema = z.enum([
  "QUEUED",
  "SENT",
  "DELIVERED",
  "OPENED",
  "BOUNCED",
  "FAILED",
]);
export type EmailLogStatus = z.infer<typeof EmailLogStatusSchema>;

export const DatingProfileStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "HIDDEN",
  "MODERATION_HOLD",
  "BANNED",
]);
export type DatingProfileStatus = z.infer<typeof DatingProfileStatusSchema>;

export const DatingRelationshipIntentSchema = z.enum([
  "FRIENDS",
  "DATES",
  "LONG_TERM",
  "LIFE_PARTNER",
  "CASUAL",
  "NON_MONOGAMY",
  "UNSURE",
]);
export type DatingRelationshipIntent = z.infer<
  typeof DatingRelationshipIntentSchema
>;

export const DatingProfilePhotoStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "HIDDEN",
]);
export type DatingProfilePhotoStatus = z.infer<
  typeof DatingProfilePhotoStatusSchema
>;

export const DatingQuestionStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "RETIRED",
]);
export type DatingQuestionStatus = z.infer<typeof DatingQuestionStatusSchema>;

export const DatingQuestionAnswerVisibilitySchema = z.enum([
  "PUBLIC",
  "PRIVATE",
]);
export type DatingQuestionAnswerVisibility = z.infer<
  typeof DatingQuestionAnswerVisibilitySchema
>;

export const DatingQuestionImportanceSchema = z.enum([
  "IRRELEVANT",
  "A_LITTLE",
  "SOMEWHAT",
  "VERY",
  "MANDATORY",
]);
export type DatingQuestionImportance = z.infer<
  typeof DatingQuestionImportanceSchema
>;

export const DatingPreferenceImportanceSchema = z.enum([
  "PREFERENCE",
  "DEALBREAKER",
]);
export type DatingPreferenceImportance = z.infer<
  typeof DatingPreferenceImportanceSchema
>;

export const DatingInteractionKindSchema = z.enum([
  "LIKE",
  "PASS",
  "SUPERLIKE",
  "INTRO",
]);
export type DatingInteractionKind = z.infer<typeof DatingInteractionKindSchema>;

export const DatingInteractionStatusSchema = z.enum([
  "ACTIVE",
  "RETRACTED",
  "MODERATION_HOLD",
]);
export type DatingInteractionStatus = z.infer<
  typeof DatingInteractionStatusSchema
>;

export const DatingMatchStatusSchema = z.enum([
  "ACTIVE",
  "UNMATCHED",
  "BLOCKED",
]);
export type DatingMatchStatus = z.infer<typeof DatingMatchStatusSchema>;

export const DatingConversationStatusSchema = z.enum([
  "ACTIVE",
  "ARCHIVED",
  "MODERATION_HOLD",
]);
export type DatingConversationStatus = z.infer<
  typeof DatingConversationStatusSchema
>;

export const DatingMessageStatusSchema = z.enum([
  "SENT",
  "HIDDEN",
  "DELETED",
  "MODERATION_HOLD",
]);
export type DatingMessageStatus = z.infer<typeof DatingMessageStatusSchema>;

export const DatingDatePlanStatusSchema = z.enum([
  "PROPOSED",
  "ACCEPTED",
  "DECLINED",
  "CANCELED",
  "COMPLETED",
  "NO_SHOW",
]);
export type DatingDatePlanStatus = z.infer<typeof DatingDatePlanStatusSchema>;

export const DatingBlockScopeSchema = z.enum(["DISCOVERY", "MESSAGES", "ALL"]);
export type DatingBlockScope = z.infer<typeof DatingBlockScopeSchema>;

export const DatingSafetyReportStatusSchema = z.enum([
  "OPEN",
  "REVIEWING",
  "RESOLVED",
  "DISMISSED",
]);
export type DatingSafetyReportStatus = z.infer<
  typeof DatingSafetyReportStatusSchema
>;

export const CommerceOfferKindSchema = z.enum([
  "PHYSICAL_GOOD",
  "SPONSORSHIP",
  "SUBSCRIPTION",
  "DIGITAL_ACCESS",
  "SERVICE",
  "DONATION",
]);
export type CommerceOfferKind = z.infer<typeof CommerceOfferKindSchema>;

export const CommerceOfferStatusSchema = z.enum(["DRAFT", "ACTIVE", "RETIRED"]);
export type CommerceOfferStatus = z.infer<typeof CommerceOfferStatusSchema>;

export const CommerceFulfillmentKindSchema = z.enum([
  "NONE",
  "PHYSICAL_GOOD",
  "DIGITAL_ENTITLEMENT",
  "MANUAL_SPONSORSHIP",
]);
export type CommerceFulfillmentKind = z.infer<
  typeof CommerceFulfillmentKindSchema
>;

export const CommercePaymentProviderSchema = z.enum(["STRIPE", "MANUAL"]);
export type CommercePaymentProvider = z.infer<
  typeof CommercePaymentProviderSchema
>;

export const CommerceFulfillmentProviderSchema = z.enum([
  "NONE",
  "CUSTOMCAT",
  "MANUAL",
  "STRIPE",
]);
export type CommerceFulfillmentProvider = z.infer<
  typeof CommerceFulfillmentProviderSchema
>;

export const CommerceOrderStatusSchema = z.enum([
  "PENDING_PAYMENT",
  "PAID",
  "FULFILLING",
  "SUBMITTED",
  "SHIPPED",
  "FAILED",
  "CANCELED",
  "REFUNDED",
]);
export type CommerceOrderStatus = z.infer<typeof CommerceOrderStatusSchema>;

export const CommerceFulfillmentStatusSchema = z.enum([
  "PENDING",
  "SUBMITTED",
  "SHIPPED",
  "DELIVERED",
  "FAILED",
  "CANCELED",
]);
export type CommerceFulfillmentStatus = z.infer<
  typeof CommerceFulfillmentStatusSchema
>;

export const CommerceEntitlementStatusSchema = z.enum([
  "PENDING",
  "ACTIVE",
  "EXPIRED",
  "CANCELED",
  "REVOKED",
]);
export type CommerceEntitlementStatus = z.infer<
  typeof CommerceEntitlementStatusSchema
>;

// ============================================================================
// HELPER: coerce string dates to Date objects
// ============================================================================
const dateSchema = z.coerce.date();
const nullableDateSchema = z.coerce.date().nullable().optional();
const nullableJsonSchema = z.unknown().nullable().optional();
const decimalSchema = z.union([
  z.number(),
  z.string(),
  z.custom<{ toString(): string }>(
    (value) =>
      typeof value === "object" &&
      value !== null &&
      typeof (value as { toString?: unknown }).toString === "function",
  ),
]);
const nullableDecimalSchema = decimalSchema.nullable().optional();

/** Zod schema for the Person model */
export const PersonSchema = z.object({
  id: z.string(),
  handle: z.string().nullable().optional(),
  displayName: z.string(),
  firstName: z.string().nullable().optional(),
  middleName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  image: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  birthDate: nullableDateSchema,
  deathDate: nullableDateSchema,
  links: nullableJsonSchema,
  currentAffiliation: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  headline: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  isPublic: z.boolean().default(false),
  isPublicFigure: z.boolean().default(false),
  lifeStatus: PersonLifeStatusSchema.default("UNKNOWN"),
  createdByUserId: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  sourceRef: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PersonType = z.infer<typeof PersonSchema>;

/** Zod schema for the PersonRelationship model */
export const PersonRelationshipSchema = z.object({
  id: z.string(),
  subjectPersonId: z.string(),
  objectPersonId: z.string(),
  relationshipType: z.string(),
  createdByUserId: z.string().nullable().optional(),
  isPublic: z.boolean().default(true),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PersonRelationshipType = z.infer<typeof PersonRelationshipSchema>;

/** Zod schema for the PersonCondition model */
export const PersonConditionSchema = z.object({
  id: z.string(),
  personId: z.string(),
  conditionName: z.string(),
  conditionCodeSystem: z.string().nullable().optional(),
  conditionCode: z.string().nullable().optional(),
  globalVariableId: z.string().nullable().optional(),
  status: PersonConditionStatusSchema.default("ACTIVE"),
  reportedByUserId: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  isPublic: z.boolean().default(true),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PersonConditionType = z.infer<typeof PersonConditionSchema>;

/** Zod schema for the Conflict model */
export const ConflictSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  startDate: nullableDateSchema,
  endDate: nullableDateSchema,
  primaryJurisdictionId: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type ConflictType = z.infer<typeof ConflictSchema>;

/** Zod schema for the PersonMemorial model */
export const PersonMemorialSchema = z.object({
  id: z.string(),
  personId: z.string(),
  causeCategory: PersonDeathCauseCategorySchema.default("UNKNOWN"),
  primaryPersonConditionId: z.string().nullable().optional(),
  deathCountryCode: z.string().nullable().optional(),
  deathLocation: z.string().nullable().optional(),
  conflictId: z.string().nullable().optional(),
  civilianStatus: PersonCivilianStatusSchema.default("UNKNOWN"),
  wasChild: z.boolean().nullable().optional(),
  circumstances: z.string().nullable().optional(),
  isPublic: z.boolean().default(false),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PersonMemorialType = z.infer<typeof PersonMemorialSchema>;

/** Zod schema for the PersonMemorialSubmission model */
export const PersonMemorialSubmissionSchema = z.object({
  id: z.string(),
  memorialId: z.string(),
  submittedByUserId: z.string().nullable().optional(),
  memorialMessage: z.string().nullable().optional(),
  consentPublicDisplay: z.boolean().default(false),
  consentCourtEvidence: z.boolean().default(false),
  consentPublicDisplayAt: nullableDateSchema,
  consentCourtEvidenceAt: nullableDateSchema,
  isPublic: z.boolean().default(false),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PersonMemorialSubmissionType = z.infer<
  typeof PersonMemorialSubmissionSchema
>;

/** Zod schema for the PersonMemorialResponsibleParty model */
export const PersonMemorialResponsiblePartySchema = z.object({
  id: z.string(),
  memorialId: z.string(),
  jurisdictionId: z.string().nullable().optional(),
  organizationId: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  sourceArtifactId: z.string().nullable().optional(),
  roleSlug: z.string().nullable().optional(),
  isPrimary: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  confidenceScore: z.number().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  privateNotes: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PersonMemorialResponsiblePartyType = z.infer<
  typeof PersonMemorialResponsiblePartySchema
>;

/** Zod schema for the PersonMemorialEvidence model */
export const PersonMemorialEvidenceSchema = z.object({
  id: z.string(),
  memorialId: z.string(),
  submittedByUserId: z.string().nullable().optional(),
  submissionId: z.string().nullable().optional(),
  sourceArtifactId: z.string().nullable().optional(),
  evidenceKind: PersonMemorialEvidenceKindSchema.default("OTHER"),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  isPublic: z.boolean().default(false),
  containsSensitiveData: z.boolean().default(true),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PersonMemorialEvidenceType = z.infer<
  typeof PersonMemorialEvidenceSchema
>;

/** Zod schema for the InterventionApprovalTimeline model */
export const InterventionApprovalTimelineSchema = z.object({
  id: z.string(),
  interventionName: z.string(),
  brandName: z.string().nullable().optional(),
  interventionGlobalVariableId: z.string().nullable().optional(),
  conditionName: z.string(),
  conditionGlobalVariableId: z.string().nullable().optional(),
  jurisdictionId: z.string().nullable().optional(),
  regulatorName: z.string().nullable().optional(),
  firstEvidenceDate: nullableDateSchema,
  firstEvidenceDescription: z.string().nullable().optional(),
  approvalDate: nullableDateSchema,
  approvalDescription: z.string().nullable().optional(),
  efficacyLagDays: z.number().int().nullable().optional(),
  estimatedLivesSavedPerYear: z.number().nullable().optional(),
  estimatedDeathsDuringLag: z.number().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  sourceArtifactId: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type InterventionApprovalTimelineType = z.infer<
  typeof InterventionApprovalTimelineSchema
>;

/** Zod schema for the PersonEfficacyLagEvidence model */
export const PersonEfficacyLagEvidenceSchema = z.object({
  id: z.string(),
  memorialId: z.string(),
  personConditionId: z.string().nullable().optional(),
  interventionApprovalTimelineId: z.string(),
  status: EfficacyLagEvidenceStatusSchema.default("CANDIDATE"),
  diedBeforeApprovalDays: z.number().int().nullable().optional(),
  explanation: z.string().nullable().optional(),
  confidenceScore: z.number().nullable().optional(),
  computedAt: dateSchema,
  reviewedByUserId: z.string().nullable().optional(),
  reviewedAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PersonEfficacyLagEvidenceType = z.infer<
  typeof PersonEfficacyLagEvidenceSchema
>;

// ============================================================================
// AUTH / ACCOUNT MODELS
// ============================================================================

/** Zod schema for the User model */
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string().nullable().optional(),
  referralCode: z.string(),
  emailVerified: nullableDateSchema,
  newsletterSubscribed: z.boolean().default(true),
  timeZone: z.string().nullable().optional(),
  personId: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  regionCode: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  annualHouseholdIncomeUsd: z.number().nullable().optional(),
  annualPersonalIncomeUsd: z.number().nullable().optional(),
  householdSize: z.number().int().nullable().optional(),
  birthYear: z.number().int().nullable().optional(),
  educationLevel: z.string().nullable().optional(),
  employmentStatus: z.string().nullable().optional(),
  genderIdentity: z.string().nullable().optional(),
  censusNotes: z.string().nullable().optional(),
  biologicalSex: z.string().nullable().optional(),
  ethnicityOrRace: z.string().nullable().optional(),
  maritalStatus: z.string().nullable().optional(),
  numberOfDependents: z.number().int().nullable().optional(),
  primaryLanguage: z.string().nullable().optional(),
  healthInsuranceType: z.string().nullable().optional(),
  chronicConditionCount: z.number().int().nullable().optional(),
  disabilityStatus: z.string().nullable().optional(),
  smokingStatus: z.string().nullable().optional(),
  alcoholFrequency: z.string().nullable().optional(),
  heightCm: z.number().nullable().optional(),
  annualTaxesPaidUsd: z.number().nullable().optional(),
  monthlyHousingCostUsd: z.number().nullable().optional(),
  housingStatus: z.string().nullable().optional(),
  hoursWorkedPerWeek: z.number().int().nullable().optional(),
  industryOrSector: z.string().nullable().optional(),
  citizenshipStatus: z.string().nullable().optional(),
  internetAccessType: z.string().nullable().optional(),
  skillTags: z.array(z.string()).default([]),
  credentialTags: z.array(z.string()).default([]),
  interestTags: z.array(z.string()).default([]),
  languageTags: z.array(z.string()).default([]),
  toolTags: z.array(z.string()).default([]),
  accessTags: z.array(z.string()).default([]),
  preferredPaymentRails: z.array(z.string()).default([]),
  workPreferenceTags: z.array(z.string()).default([]),
  preferredTaskTags: z.array(z.string()).default([]),
  unavailableTaskTags: z.array(z.string()).default([]),
  availableHoursPerWeek: z.number().int().nullable().optional(),
  availableFrom: nullableDateSchema,
  availabilityUpdatedAt: nullableDateSchema,
  censusUpdatedAt: nullableDateSchema,
  isAdmin: z.boolean().default(false),
  phoneNumber: z.string().nullable().optional(),
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
  status: PersonhoodVerificationStatusSchema.default("VERIFIED"),
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
export type PersonhoodVerificationType = z.infer<
  typeof PersonhoodVerificationSchema
>;

// ============================================================================
// LAYER 1 — Universal Measurement System Models
// ============================================================================

/** Zod schema for the Unit model */
export const UnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  abbreviatedName: z.string(),
  codeSystem: UnitCodeSystemSchema.default("UCUM"),
  ucumCode: z.string(),
  unitCategoryId: z.string(),
  minimumValue: z.number().nullable().optional(),
  maximumValue: z.number().nullable().optional(),
  fillingType: FillingTypeSchema.default("NONE"),
  scale: MeasurementScaleSchema.default("RATIO"),
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
  combinationOperation: CombinationOperationSchema.default("SUM"),
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
  combinationOperation: CombinationOperationSchema.default("SUM"),
  onsetDelay: z.number().int().nullable().optional(),
  durationOfAction: z.number().int().nullable().optional(),
  fillingType: FillingTypeSchema.default("NONE"),
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
  status: AnalysisStatusSchema.default("WAITING"),
  analysisRequestedAt: nullableDateSchema,
  analysisStartedAt: nullableDateSchema,
  analysisEndedAt: nullableDateSchema,
  imageUrl: z.string().nullable().optional(),
  informationalUrl: z.string().nullable().optional(),
  synonyms: z.string().nullable().optional(),
  valence: ValenceSchema.default("NEUTRAL"),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type GlobalVariableType = z.infer<typeof GlobalVariableSchema>;

/** Zod schema for the GlobalVariableExternalCode model */
export const GlobalVariableExternalCodeSchema = z.object({
  id: z.string(),
  globalVariableId: z.string(),
  codeSystem: z.string(),
  code: z.string(),
  displayName: z.string().nullable().optional(),
  sourceArtifactId: z.string().nullable().optional(),
  metadataJson: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type GlobalVariableExternalCodeType = z.infer<
  typeof GlobalVariableExternalCodeSchema
>;

/** Zod schema for the Subject model */
export const SubjectSchema = z.object({
  id: z.string(),
  subjectType: SubjectTypeSchema.default("USER"),
  externalId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  personId: z.string().nullable().optional(),
  jurisdictionId: z.string().nullable().optional(),
  organizationId: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type SubjectType_ = z.infer<typeof SubjectSchema>;

/** Zod schema for the NOf1Variable model */
export const NOf1VariableSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  globalVariableId: z.string(),
  defaultUnitId: z.string().nullable().optional(),
  onsetDelay: z.number().int().nullable().optional(),
  durationOfAction: z.number().int().nullable().optional(),
  fillingType: FillingTypeSchema.default("NONE"),
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
  status: AnalysisStatusSchema.default("WAITING"),
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
  subjectId: z.string(),
  recordedByUserId: z.string().nullable().optional(),
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

/** Zod schema for the InterventionExperience model */
export const InterventionExperienceSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  reportedByUserId: z.string().nullable().optional(),
  conditionGlobalVariableId: z.string().nullable().optional(),
  interventionGlobalVariableId: z.string(),
  status: InterventionExperienceStatusSchema.default("UNKNOWN"),
  startedAt: nullableDateSchema,
  endedAt: nullableDateSchema,
  doseValue: z.number().nullable().optional(),
  doseUnitId: z.string().nullable().optional(),
  frequencyText: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  sourceArtifactId: z.string().nullable().optional(),
  isPublic: z.boolean().default(false),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type InterventionExperienceType = z.infer<
  typeof InterventionExperienceSchema
>;

/** Zod schema for the InterventionExperienceOutcome model */
export const InterventionExperienceOutcomeSchema = z.object({
  id: z.string(),
  interventionExperienceId: z.string(),
  outcomeGlobalVariableId: z.string(),
  rating: InterventionOutcomeRatingSchema.default("UNKNOWN"),
  value: z.number().nullable().optional(),
  unitId: z.string().nullable().optional(),
  beforeMeasurementId: z.string().nullable().optional(),
  afterMeasurementId: z.string().nullable().optional(),
  publicComment: z.string().nullable().optional(),
  isPublic: z.boolean().default(false),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type InterventionExperienceOutcomeType = z.infer<
  typeof InterventionExperienceOutcomeSchema
>;

/** Zod schema for the InterventionExperienceSideEffect model */
export const InterventionExperienceSideEffectSchema = z.object({
  id: z.string(),
  interventionExperienceId: z.string(),
  sideEffectGlobalVariableId: z.string(),
  severity: InterventionSideEffectSeveritySchema.default("UNKNOWN"),
  onsetAt: nullableDateSchema,
  resolvedAt: nullableDateSchema,
  isSerious: z.boolean().nullable().optional(),
  actionTaken: z.string().nullable().optional(),
  publicComment: z.string().nullable().optional(),
  isPublic: z.boolean().default(false),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type InterventionExperienceSideEffectType = z.infer<
  typeof InterventionExperienceSideEffectSchema
>;

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
  status: NotificationStatusSchema.default("PENDING"),
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

/** Zod schema for the VariableRelationshipEvidenceEstimate model */
export const VariableRelationshipEvidenceEstimateSchema = z.object({
  id: z.string(),
  predictorGlobalVariableId: z.string(),
  outcomeGlobalVariableId: z.string(),
  contextGlobalVariableId: z.string().nullable().optional(),
  metricKind: VariableEvidenceMetricKindSchema,
  sourceType: VariableRelationshipEvidenceSourceTypeSchema.default("OTHER"),
  value: z.number().nullable().optional(),
  unitId: z.string().nullable().optional(),
  confidenceScore: z.number().nullable().optional(),
  evidenceGrade: EvidenceGradeSchema.nullable().optional(),
  participants: z.number().int().nullable().optional(),
  studies: z.number().int().nullable().optional(),
  rationale: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  sourceArtifactId: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type VariableRelationshipEvidenceEstimateType = z.infer<
  typeof VariableRelationshipEvidenceEstimateSchema
>;

/** Zod schema for the InterventionRankingRun model */
export const InterventionRankingRunSchema = z.object({
  id: z.string(),
  conditionGlobalVariableId: z.string().nullable().optional(),
  algorithmKey: z.string(),
  algorithmVersion: z.string().nullable().optional(),
  status: InterventionRankingRunStatusSchema.default("DRAFT"),
  rankedAt: dateSchema,
  sourceArtifactId: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type InterventionRankingRunType = z.infer<
  typeof InterventionRankingRunSchema
>;

/** Zod schema for the RankedIntervention model */
export const RankedInterventionSchema = z.object({
  id: z.string(),
  rankingRunId: z.string(),
  interventionGlobalVariableId: z.string(),
  rank: z.number().int(),
  score: z.number(),
  effectivenessScore: z.number().nullable().optional(),
  safetyScore: z.number().nullable().optional(),
  evidenceScore: z.number().nullable().optional(),
  costScore: z.number().nullable().optional(),
  confidenceScore: z.number().nullable().optional(),
  sourceEvidenceEstimateId: z.string().nullable().optional(),
  rationale: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type RankedInterventionType = z.infer<typeof RankedInterventionSchema>;

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
export type IntegrationConnectionType = z.infer<
  typeof IntegrationConnectionSchema
>;

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
  currency: z.string().default("USD"),
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
export type WishocraticAllocationType = z.infer<
  typeof WishocraticAllocationSchema
>;

/** Zod schema for the WishocraticItemInclusion model */
export const WishocraticItemInclusionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  itemId: z.string(),
  included: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type WishocraticItemInclusionType = z.infer<
  typeof WishocraticItemInclusionSchema
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

/** Zod schema for the WishocraticItemAlignmentScore model */
export const WishocraticItemAlignmentScoreSchema = z.object({
  id: z.string(),
  alignmentScoreId: z.string(),
  itemId: z.string(),
  score: z.number(),
});
export type WishocraticItemAlignmentScoreType = z.infer<
  typeof WishocraticItemAlignmentScoreSchema
>;

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
  updatedAt: dateSchema,
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
  reminderStartTime: z.string().default("09:00"),
  quietHoursStart: z.string().default("21:00"),
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
  algorithm: z.string().default("AES-GCM-256"),
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
  question: z.string(),
  kind: ReferendumKindSchema.default("GENERAL"),
  description: z.string().nullable().optional(),
  bodyMarkdown: z.string().nullable().optional(),
  publishedAt: nullableDateSchema,
  lockedAt: nullableDateSchema,
  contentHash: z.string().nullable().optional(),
  createdByUserId: z.string().nullable().optional(),
  jurisdictionId: z.string().nullable().optional(),
  status: ReferendumStatusSchema.default("ACTIVE"),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type ReferendumType = z.infer<typeof ReferendumSchema>;

/** Zod schema for the ReferendumVote model */
export const ReferendumVoteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  personId: z.string(),
  referendumId: z.string(),
  answer: VotePositionSchema,
  voteSource: ReferendumVoteSourceSchema.default("SELF"),
  referredByUserId: z.string().nullable().optional(),
  organizationId: z.string().nullable().optional(),
  publicComment: z.string().nullable().optional(),
  isPublic: z.boolean().default(true),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
  originUrl: z.string().nullable().optional(),
});
export type ReferendumVoteType = z.infer<typeof ReferendumVoteSchema>;

/** Zod schema for the CourtCase model */
export const CourtCaseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string().nullable().optional(),
  status: CourtCaseStatusSchema.default("DRAFT"),
  isPublic: z.boolean().default(false),
  createdByUserId: z.string().nullable().optional(),
  nominalPlaintiffSubjectId: z.string().nullable().optional(),
  primaryRespondentSubjectId: z.string().nullable().optional(),
  beneficiarySubjectId: z.string().nullable().optional(),
  rootTaskId: z.string().nullable().optional(),
  juryReferendumId: z.string().nullable().optional(),
  metadataJson: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type CourtCaseType = z.infer<typeof CourtCaseSchema>;

/** Zod schema for the CourtCaseParty model */
export const CourtCasePartySchema = z.object({
  id: z.string(),
  caseId: z.string(),
  partyKey: z.string().nullable().optional(),
  subjectId: z.string(),
  role: CourtCasePartyRoleSchema,
  capacity: CourtCasePartyCapacitySchema.nullable().optional(),
  displayNameSnapshot: z.string().nullable().optional(),
  standingTheory: z.string().nullable().optional(),
  powerToRemedyScore: z.number().nullable().optional(),
  blameAttributionScore: z.number().nullable().optional(),
  publicAccountabilityScore: z.number().nullable().optional(),
  sortOrder: z.number().int().default(0),
  isPublic: z.boolean().default(true),
  createdByUserId: z.string().nullable().optional(),
  metadataJson: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type CourtCasePartyType = z.infer<typeof CourtCasePartySchema>;

/** Zod schema for the CourtCaseClaim model */
export const CourtCaseClaimSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  claimKey: z.string().nullable().optional(),
  title: z.string(),
  claimType: z.string().nullable().optional(),
  argumentMarkdown: z.string(),
  requestedFinding: z.string().nullable().optional(),
  status: CourtCaseItemStatusSchema.default("PROPOSED"),
  juryReferendumId: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  isPublic: z.boolean().default(true),
  createdByUserId: z.string().nullable().optional(),
  metadataJson: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type CourtCaseClaimType = z.infer<typeof CourtCaseClaimSchema>;

/** Zod schema for the CourtCaseHarm model */
export const CourtCaseHarmSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  claimId: z.string().nullable().optional(),
  harmKey: z.string().nullable().optional(),
  harmType: z.string().nullable().optional(),
  title: z.string(),
  bodyMarkdown: z.string().nullable().optional(),
  affectedSubjectId: z.string().nullable().optional(),
  globalVariableId: z.string().nullable().optional(),
  parameterName: z.string().nullable().optional(),
  lowValue: z.number().nullable().optional(),
  baseValue: z.number().nullable().optional(),
  highValue: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  confidenceScore: z.number().nullable().optional(),
  sortOrder: z.number().int().default(0),
  isPublic: z.boolean().default(true),
  status: CourtCaseItemStatusSchema.default("PROPOSED"),
  createdByUserId: z.string().nullable().optional(),
  metadataJson: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type CourtCaseHarmType = z.infer<typeof CourtCaseHarmSchema>;

/** Zod schema for the CourtCaseEvidence model */
export const CourtCaseEvidenceSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  claimId: z.string().nullable().optional(),
  harmId: z.string().nullable().optional(),
  evidenceKey: z.string().nullable().optional(),
  evidenceType: z.string().nullable().optional(),
  title: z.string(),
  bodyMarkdown: z.string().nullable().optional(),
  sourceArtifactId: z.string().nullable().optional(),
  personMemorialId: z.string().nullable().optional(),
  globalVariableId: z.string().nullable().optional(),
  parameterName: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  contentHash: z.string().nullable().optional(),
  isPublic: z.boolean().default(true),
  containsSensitiveData: z.boolean().default(false),
  reviewStatus: CourtCaseItemStatusSchema.default("PROPOSED"),
  confidenceScore: z.number().nullable().optional(),
  sortOrder: z.number().int().default(0),
  createdByUserId: z.string().nullable().optional(),
  metadataJson: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type CourtCaseEvidenceType = z.infer<typeof CourtCaseEvidenceSchema>;

/** Zod schema for the CourtCaseRemedy model */
export const CourtCaseRemedySchema = z.object({
  id: z.string(),
  caseId: z.string(),
  claimId: z.string().nullable().optional(),
  targetPartyId: z.string().nullable().optional(),
  remedyKey: z.string().nullable().optional(),
  remedyType: z.string().nullable().optional(),
  title: z.string(),
  bodyMarkdown: z.string(),
  amountUsdLow: z.number().nullable().optional(),
  amountUsdBase: z.number().nullable().optional(),
  amountUsdHigh: z.number().nullable().optional(),
  deadlineAt: nullableDateSchema,
  enforcementTaskId: z.string().nullable().optional(),
  status: CourtCaseItemStatusSchema.default("PROPOSED"),
  sortOrder: z.number().int().default(0),
  isPublic: z.boolean().default(true),
  createdByUserId: z.string().nullable().optional(),
  metadataJson: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type CourtCaseRemedyType = z.infer<typeof CourtCaseRemedySchema>;

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
export type PublicGoodsRecipientType = z.infer<
  typeof PublicGoodsRecipientSchema
>;

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
export type WishocraticDistributionType = z.infer<
  typeof WishocraticDistributionSchema
>;

// ============================================================================
// VOTE TOKEN & VOTER PRIZE TREASURY
// ============================================================================

/** Zod schema for the PointMint model */
export const PointMintSchema = z.object({
  id: z.string(),
  userId: z.string(),
  referendumId: z.string(),
  nullifierHash: z.string(),
  walletAddress: z.string(),
  amount: z.string(),
  txHash: z.string().nullable().optional(),
  chainId: z.number().int(),
  status: PointMintStatusSchema.default("PENDING"),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type PointMintType = z.infer<typeof PointMintSchema>;

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
export type PrizeTreasuryDepositType = z.infer<
  typeof PrizeTreasuryDepositSchema
>;

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
export type NotificationPreferencePerTypeType = z.infer<
  typeof NotificationPreferencePerTypeSchema
>;

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
  status: OrgStatusSchema.default("PENDING"),
  jurisdictionId: z.string().nullable().optional(),
  creatorId: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  squareLogoUrl: z.string().nullable().optional(),
  wordmarkLogoUrl: z.string().nullable().optional(),
  donationUrl: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  sourceRef: z.string().nullable().optional(),
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
  role: z.string().default("member"),
  joinedAt: dateSchema,
});
export type OrganizationMemberType = z.infer<typeof OrganizationMemberSchema>;

// ============================================================================
// TASKS
// ============================================================================

/** Zod schema for the Task model */
export const TaskSchema = z.object({
  id: z.string(),
  jurisdictionId: z.string().nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
  assigneePersonId: z.string().nullable().optional(),
  assigneeOrganizationId: z.string().nullable().optional(),
  ownerOrganizationId: z.string().nullable().optional(),
  verifiedByUserId: z.string().nullable().optional(),
  currentImpactEstimateSetId: z.string().nullable().optional(),
  taskKey: z.string().nullable().optional(),
  title: z.string(),
  description: z.string(),
  impactStatement: z.string().nullable().optional(),
  roleTitle: z.string().nullable().optional(),
  assigneeAffiliationSnapshot: z.string().nullable().optional(),
  category: TaskCategorySchema.default("OTHER"),
  kind: TaskKindSchema.default("TASK"),
  engagementKind: TaskEngagementKindSchema.default("ONE_OFF"),
  estimatedEffortHours: z.number().nullable().optional(),
  actualEffortSeconds: z.number().int().nullable().optional(),
  actualCashCostUsd: z.number().nullable().optional(),
  skillTags: z.array(z.string()).default([]),
  preferredSkillTags: z.array(z.string()).default([]),
  interestTags: z.array(z.string()).default([]),
  requiredCredentialTags: z.array(z.string()).default([]),
  preferredCredentialTags: z.array(z.string()).default([]),
  requiredLanguageTags: z.array(z.string()).default([]),
  preferredLanguageTags: z.array(z.string()).default([]),
  requiredToolTags: z.array(z.string()).default([]),
  preferredToolTags: z.array(z.string()).default([]),
  requiredAccessTags: z.array(z.string()).default([]),
  preferredAccessTags: z.array(z.string()).default([]),
  contextJson: nullableJsonSchema,
  claimPolicy: TaskClaimPolicySchema.default("OPEN_SINGLE"),
  applicationPolicy: TaskApplicationPolicySchema.default("CLOSED"),
  compensationKind: TaskCompensationKindSchema.default("UNSPECIFIED"),
  compensationCadence: TaskCompensationCadenceSchema.nullable().optional(),
  compensationCurrency: z.string().nullable().optional(),
  compensationMinAmountMinorUnits: z.bigint().nullable().optional(),
  compensationMaxAmountMinorUnits: z.bigint().nullable().optional(),
  compensationPaymentRails: z.array(z.string()).default([]),
  estimatedHoursPerWeekMin: z.number().int().nullable().optional(),
  estimatedHoursPerWeekMax: z.number().int().nullable().optional(),
  remotePolicy: TaskRemotePolicySchema.default("UNSPECIFIED"),
  locationText: z.string().nullable().optional(),
  workLocationCountryCode: z.string().nullable().optional(),
  workLocationRegionCode: z.string().nullable().optional(),
  workLocationCity: z.string().nullable().optional(),
  workLocationPostalCode: z.string().nullable().optional(),
  workLocationLatitude: z.number().nullable().optional(),
  workLocationLongitude: z.number().nullable().optional(),
  workLocationRadiusKm: z.number().nullable().optional(),
  workTimeZone: z.string().nullable().optional(),
  applicationQuestionsJson: nullableJsonSchema,
  executionMode: TaskExecutionModeSchema.default("HUMAN_OR_AGENT"),
  maxClaims: z.number().int().nullable().optional(),
  status: TaskStatusSchema.default("ACTIVE"),
  isPublic: z.boolean().default(true),
  completionEvidence: z.string().nullable().optional(),
  availableAt: nullableDateSchema,
  dueAt: nullableDateSchema,
  deadlinePolicy: TaskDeadlinePolicySchema.default("NONE"),
  completedAt: nullableDateSchema,
  verifiedAt: nullableDateSchema,
  sortOrder: z.number().int().default(0),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskType = z.infer<typeof TaskSchema>;

/** Zod schema for the TaskManager model */
export const TaskManagerSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  createdByUserId: z.string().nullable().optional(),
  role: z.string().default("manager"),
  notes: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskManagerType = z.infer<typeof TaskManagerSchema>;

/** Zod schema for the AgentExecutor model */
export const AgentExecutorSchema = z.object({
  id: z.string(),
  jurisdictionId: z.string().nullable().optional(),
  agentKey: z.string(),
  displayName: z.string(),
  provider: z.string().nullable().optional(),
  modelName: z.string().nullable().optional(),
  capabilityTags: z.array(z.string()).default([]),
  toolTags: z.array(z.string()).default([]),
  accessTags: z.array(z.string()).default([]),
  averageCostUsd: z.number().nullable().optional(),
  averageLatencySeconds: z.number().nullable().optional(),
  successRate: z.number().nullable().optional(),
  status: AgentExecutorStatusSchema.default("ACTIVE"),
  metadata: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type AgentExecutorType = z.infer<typeof AgentExecutorSchema>;

/** Zod schema for the TaskCandidateMatch model */
export const TaskCandidateMatchSchema = z.object({
  id: z.string(),
  jurisdictionId: z.string().nullable().optional(),
  taskId: z.string(),
  candidateKind: TaskCandidateKindSchema,
  candidateKey: z.string(),
  candidateUserId: z.string().nullable().optional(),
  candidatePersonId: z.string().nullable().optional(),
  candidateOrganizationId: z.string().nullable().optional(),
  agentExecutorId: z.string().nullable().optional(),
  score: z.number(),
  scoreVersion: z.string(),
  reasonJson: nullableJsonSchema,
  blockersJson: nullableJsonSchema,
  estimatedCostMinorUnits: z.bigint().nullable().optional(),
  estimatedCostCurrency: z.string().nullable().optional(),
  estimatedDurationSeconds: z.number().int().nullable().optional(),
  status: TaskCandidateMatchStatusSchema.default("SUGGESTED"),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskCandidateMatchType = z.infer<typeof TaskCandidateMatchSchema>;

/** Zod schema for the TaskExecutionAttempt model */
export const TaskExecutionAttemptSchema = z.object({
  id: z.string(),
  jurisdictionId: z.string().nullable().optional(),
  taskId: z.string(),
  candidateMatchId: z.string().nullable().optional(),
  executorKind: TaskCandidateKindSchema,
  executorKey: z.string(),
  executorUserId: z.string().nullable().optional(),
  executorPersonId: z.string().nullable().optional(),
  executorOrganizationId: z.string().nullable().optional(),
  agentExecutorId: z.string().nullable().optional(),
  taskApplicationId: z.string().nullable().optional(),
  taskClaimId: z.string().nullable().optional(),
  agentTaskLeaseId: z.string().nullable().optional(),
  status: TaskExecutionAttemptStatusSchema.default("QUEUED"),
  estimatedCostMinorUnits: z.bigint().nullable().optional(),
  estimatedCostCurrency: z.string().nullable().optional(),
  estimatedDurationSeconds: z.number().int().nullable().optional(),
  actualCostMinorUnits: z.bigint().nullable().optional(),
  actualCostCurrency: z.string().nullable().optional(),
  actualDurationSeconds: z.number().int().nullable().optional(),
  confidence: z.number().nullable().optional(),
  startedAt: nullableDateSchema,
  completedAt: nullableDateSchema,
  cancelledAt: nullableDateSchema,
  outputSummary: z.string().nullable().optional(),
  errorSummary: z.string().nullable().optional(),
  metadata: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskExecutionAttemptType = z.infer<
  typeof TaskExecutionAttemptSchema
>;

/** Zod schema for the TaskMarketplaceListing model */
export const TaskMarketplaceListingSchema = z.object({
  id: z.string(),
  jurisdictionId: z.string().nullable().optional(),
  taskId: z.string(),
  posterUserId: z.string().nullable().optional(),
  posterOrganizationId: z.string().nullable().optional(),
  commerceEntitlementId: z.string().nullable().optional(),
  listingKind: TaskMarketplaceListingKindSchema.default("TASK_POSTING"),
  feePolicy: TaskMarketplaceFeePolicySchema.default("FREE"),
  currency: z.string().default("usd"),
  postingFeeMinorUnits: z.bigint().nullable().optional(),
  status: TaskMarketplaceListingStatusSchema.default("DRAFT"),
  activatedAt: nullableDateSchema,
  expiresAt: nullableDateSchema,
  closedAt: nullableDateSchema,
  metadata: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskMarketplaceListingType = z.infer<
  typeof TaskMarketplaceListingSchema
>;

/** Zod schema for the TaskDistributionTarget model */
export const TaskDistributionTargetSchema = z.object({
  id: z.string(),
  integrationProviderId: z.string().nullable().optional(),
  channel: TaskDistributionChannelSchema,
  targetKey: z.string(),
  displayName: z.string(),
  description: z.string().nullable().optional(),
  status: TaskDistributionTargetStatusSchema.default("ACTIVE"),
  requiresManualApproval: z.boolean().default(true),
  defaultCostMinorUnits: z.bigint().nullable().optional(),
  defaultCostCurrency: z.string().nullable().optional(),
  metadata: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskDistributionTargetType = z.infer<
  typeof TaskDistributionTargetSchema
>;

/** Zod schema for the TaskDistributionAttempt model */
export const TaskDistributionAttemptSchema = z.object({
  id: z.string(),
  jurisdictionId: z.string().nullable().optional(),
  taskId: z.string(),
  distributionTargetId: z.string().nullable().optional(),
  integrationProviderId: z.string().nullable().optional(),
  integrationConnectionId: z.string().nullable().optional(),
  requestedByUserId: z.string().nullable().optional(),
  approvedByUserId: z.string().nullable().optional(),
  channel: TaskDistributionChannelSchema,
  operation: TaskDistributionOperationSchema.default("CREATE"),
  status: TaskDistributionAttemptStatusSchema.default("DRAFT"),
  externalObjectId: z.string().nullable().optional(),
  externalUrl: z.string().nullable().optional(),
  externalStatus: z.string().nullable().optional(),
  payloadJson: nullableJsonSchema,
  payloadHash: z.string().nullable().optional(),
  responseJson: nullableJsonSchema,
  errorMessage: z.string().nullable().optional(),
  costMinorUnits: z.bigint().nullable().optional(),
  costCurrency: z.string().nullable().optional(),
  scheduledAt: nullableDateSchema,
  approvedAt: nullableDateSchema,
  expiresAt: nullableDateSchema,
  completedAt: nullableDateSchema,
  failedAt: nullableDateSchema,
  metadata: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskDistributionAttemptType = z.infer<
  typeof TaskDistributionAttemptSchema
>;

/** Zod schema for the TaskFundingTarget model */
export const TaskFundingTargetSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  targetAmountCents: z.bigint(),
  currency: z.string().default("usd"),
  primaryUnitKey: z.string().nullable().optional(),
  primaryUnitTargetQuantity: nullableDecimalSchema,
  status: TaskFundingTargetStatusSchema.default("OPEN"),
  termsVersion: z.string().nullable().optional(),
  expiresAt: nullableDateSchema,
  thresholdMetAt: nullableDateSchema,
  thresholdMetByPledgeId: z.string().nullable().optional(),
  notificationSentAt: nullableDateSchema,
  metadata: nullableJsonSchema,
  createdByUserId: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskFundingTargetType = z.infer<typeof TaskFundingTargetSchema>;

/** Zod schema for the TaskFundingPledge model */
export const TaskFundingPledgeSchema = z.object({
  id: z.string(),
  targetId: z.string(),
  pledgerKind: TaskFundingPledgerKindSchema,
  pledgeActorKey: z.string(),
  pledgedByUserId: z.string().nullable().optional(),
  pledgerPersonId: z.string().nullable().optional(),
  pledgerOrganizationId: z.string().nullable().optional(),
  publicDisplay: z.boolean().default(false),
  publicNameSnapshot: z.string().nullable().optional(),
  unitKey: z.string(),
  unitQuantity: decimalSchema,
  unitAmountCentsSnapshot: z.bigint().nullable().optional(),
  committedAmountCents: z.bigint(),
  currency: z.string().default("usd"),
  conversionVersion: z.string(),
  conversionSource: z.string().nullable().optional(),
  commerceOfferId: z.string().nullable().optional(),
  commerceOfferVariantId: z.string().nullable().optional(),
  termsVersion: z.string().nullable().optional(),
  termsNote: z.string().nullable().optional(),
  status: TaskFundingPledgeStatusSchema.default("ACTIVE"),
  idempotencyKey: z.string().nullable().optional(),
  cancelledAt: nullableDateSchema,
  cancelledByUserId: z.string().nullable().optional(),
  cancellationReason: z.string().nullable().optional(),
  calledAt: nullableDateSchema,
  fulfilledAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskFundingPledgeType = z.infer<typeof TaskFundingPledgeSchema>;

/** Zod schema for the TaskFundingEvent model */
export const TaskFundingEventSchema = z.object({
  id: z.string(),
  targetId: z.string(),
  pledgeId: z.string().nullable().optional(),
  eventType: TaskFundingEventTypeSchema,
  dedupeKey: z.string().nullable().optional(),
  actorUserId: z.string().nullable().optional(),
  beforeJson: nullableJsonSchema,
  afterJson: nullableJsonSchema,
  metadata: nullableJsonSchema,
  createdAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskFundingEventTypeModel = z.infer<typeof TaskFundingEventSchema>;

/** Zod schema for the TaskApplication model */
export const TaskApplicationSchema = z.object({
  id: z.string(),
  jurisdictionId: z.string().nullable().optional(),
  taskId: z.string(),
  applicantUserId: z.string().nullable().optional(),
  applicantPersonId: z.string().nullable().optional(),
  reviewerUserId: z.string().nullable().optional(),
  referralInvitationId: z.string().nullable().optional(),
  shareAttemptId: z.string().nullable().optional(),
  status: TaskApplicationStatusSchema.default("APPLIED"),
  applicationMessage: z.string().nullable().optional(),
  answersJson: nullableJsonSchema,
  applicantNameSnapshot: z.string().nullable().optional(),
  applicantEmailSnapshot: z.string().nullable().optional(),
  reviewScore: z.number().int().nullable().optional(),
  reviewNote: z.string().nullable().optional(),
  metadata: nullableJsonSchema,
  originUrl: z.string().nullable().optional(),
  utmJson: nullableJsonSchema,
  appliedAt: dateSchema,
  reviewedAt: nullableDateSchema,
  offeredAt: nullableDateSchema,
  acceptedAt: nullableDateSchema,
  rejectedAt: nullableDateSchema,
  withdrawnAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskApplicationType = z.infer<typeof TaskApplicationSchema>;

/** Zod schema for the TaskApplicationEvent model */
export const TaskApplicationEventSchema = z.object({
  id: z.string(),
  jurisdictionId: z.string().nullable().optional(),
  applicationId: z.string(),
  eventType: TaskApplicationEventTypeSchema,
  fromStatus: TaskApplicationStatusSchema.nullable().optional(),
  toStatus: TaskApplicationStatusSchema.nullable().optional(),
  actorUserId: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  beforeJson: nullableJsonSchema,
  afterJson: nullableJsonSchema,
  metadata: nullableJsonSchema,
  createdAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskApplicationEventTypeModel = z.infer<
  typeof TaskApplicationEventSchema
>;

/** Zod schema for the TaskClaim model */
export const TaskClaimSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  verifiedByUserId: z.string().nullable().optional(),
  status: TaskClaimStatusSchema.default("CLAIMED"),
  completionEvidence: z.string().nullable().optional(),
  verificationNote: z.string().nullable().optional(),
  actualEffortSeconds: z.number().int().nullable().optional(),
  actualCashCostUsd: z.number().nullable().optional(),
  claimedAt: dateSchema,
  startedAt: nullableDateSchema,
  completedAt: nullableDateSchema,
  verifiedAt: nullableDateSchema,
  abandonedAt: nullableDateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskClaimType = z.infer<typeof TaskClaimSchema>;

/** Zod schema for the SourceArtifact model */
export const SourceArtifactSchema = z.object({
  id: z.string(),
  sourceSystem: SourceSystemSchema,
  artifactType: SourceArtifactTypeSchema,
  sourceKey: z.string(),
  externalKey: z.string().nullable().optional(),
  versionKey: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  sourceRef: z.string().nullable().optional(),
  contentHash: z.string().nullable().optional(),
  payloadJson: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type SourceArtifactTypeModel = z.infer<typeof SourceArtifactSchema>;

/** Zod schema for the ParameterDefinition model */
export const ParameterDefinitionSchema = z.object({
  id: z.string(),
  key: z.string(),
  createdByUserId: z.string().nullable().optional(),
  currentRevisionId: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type ParameterDefinitionType = z.infer<typeof ParameterDefinitionSchema>;

/** Zod schema for the ParameterRevision model */
export const ParameterRevisionSchema = z.object({
  id: z.string(),
  parameterId: z.string(),
  revision: z.number().int(),
  status: ModelRevisionStatusSchema.default("DRAFT"),
  value: z.number(),
  manualRef: z.string().nullable().optional(),
  sourceRef: z.string().nullable().optional(),
  sourceType: ParameterSourceTypeSchema,
  description: z.string(),
  unit: z.string(),
  formulaText: z.string().nullable().optional(),
  formulaLatex: z.string().nullable().optional(),
  calculationCode: z.string().nullable().optional(),
  calculationLanguage: z.string().nullable().optional(),
  confidence: z.string(),
  sourceLastUpdated: z.string().nullable().optional(),
  peerReviewed: z.boolean().default(false),
  conservative: z.boolean().default(false),
  sensitivity: z.number().nullable().optional(),
  displayValue: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  keywords: z.array(z.string()).default([]),
  validationMin: z.number().nullable().optional(),
  validationMax: z.number().nullable().optional(),
  confidenceIntervalLow: z.number().nullable().optional(),
  confidenceIntervalHigh: z.number().nullable().optional(),
  stdError: z.number().nullable().optional(),
  distributionType: ParameterDistributionTypeSchema.nullable().optional(),
  distributionParametersJson: nullableJsonSchema,
  latexSymbol: z.string().nullable().optional(),
  hideConfidenceInterval: z.boolean().default(false),
  summaryStatsJson: nullableJsonSchema,
  rawSourceJson: nullableJsonSchema,
  sourceContentHash: z.string(),
  rationale: z.string().nullable().optional(),
  assumptionsJson: nullableJsonSchema,
  proposedByUserId: z.string().nullable().optional(),
  reviewedByUserId: z.string().nullable().optional(),
  reviewedAt: nullableDateSchema,
  publishedAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type ParameterRevisionType = z.infer<typeof ParameterRevisionSchema>;

/** Zod schema for the ParameterRevisionInput model */
export const ParameterRevisionInputSchema = z.object({
  id: z.string(),
  calculatedRevisionId: z.string(),
  inputRevisionId: z.string(),
  symbol: z.string(),
  position: z.number().int(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type ParameterRevisionInputType = z.infer<
  typeof ParameterRevisionInputSchema
>;

/** Zod schema for the ParameterRevisionSourceArtifact model */
export const ParameterRevisionSourceArtifactSchema = z.object({
  id: z.string(),
  parameterRevisionId: z.string(),
  sourceArtifactId: z.string(),
  isPrimary: z.boolean().default(false),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type ParameterRevisionSourceArtifactType = z.infer<
  typeof ParameterRevisionSourceArtifactSchema
>;

/** Zod schema for an exact parameter revision used by a task-impact estimate */
export const TaskImpactEstimateInputSchema = z.object({
  id: z.string(),
  taskImpactEstimateSetId: z.string(),
  parameterRevisionId: z.string(),
  symbol: z.string(),
  position: z.number().int(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskImpactEstimateInputType = z.infer<
  typeof TaskImpactEstimateInputSchema
>;

/** Zod schema for the TaskCommentAttachment model */
export const TaskCommentAttachmentSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  commentId: z.string().nullable().optional(),
  uploadedByUserId: z.string().nullable().optional(),
  storageKey: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int(),
  checksumSha256: z.string(),
  uploadedAt: nullableDateSchema,
  expiresAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskCommentAttachmentType = z.infer<
  typeof TaskCommentAttachmentSchema
>;

/** Zod schema for the McpToolCallAudit model */
export const McpToolCallAuditSchema = z.object({
  id: z.string(),
  userId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  oauthGrantId: z.string().nullable().optional(),
  agentId: z.string().nullable().optional(),
  runId: z.string().nullable().optional(),
  toolName: z.string(),
  status: McpToolCallStatusSchema,
  inputHash: z.string().nullable().optional(),
  inputSummaryJson: nullableJsonSchema,
  outputSummaryJson: nullableJsonSchema,
  errorSummary: z.string().nullable().optional(),
  createdAt: dateSchema,
  completedAt: nullableDateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type McpToolCallAuditType = z.infer<typeof McpToolCallAuditSchema>;

/** Zod schema for the ContentReport model */
export const ContentReportSchema = z.object({
  id: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  reportedByUserId: z.string().nullable().optional(),
  reasonType: z.string(),
  message: z.string().nullable().optional(),
  correctionJson: nullableJsonSchema,
  sourceUrl: z.string().nullable().optional(),
  status: ContentReportStatusSchema.default("OPEN"),
  reviewedByUserId: z.string().nullable().optional(),
  reviewedAt: nullableDateSchema,
  resolutionNote: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type ContentReportType = z.infer<typeof ContentReportSchema>;

/** Zod schema for the TaskSourceArtifact model */
export const TaskSourceArtifactSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  sourceArtifactId: z.string(),
  isPrimary: z.boolean().default(false),
  createdAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskSourceArtifactType = z.infer<typeof TaskSourceArtifactSchema>;

/** Zod schema for the TaskEdge model */
export const TaskEdgeSchema = z.object({
  id: z.string(),
  fromTaskId: z.string(),
  toTaskId: z.string(),
  edgeType: TaskEdgeTypeSchema,
  probabilityDeltaLow: z.number().nullable().optional(),
  probabilityDeltaBase: z.number().nullable().optional(),
  probabilityDeltaHigh: z.number().nullable().optional(),
  timeDeltaDaysLow: z.number().nullable().optional(),
  timeDeltaDaysBase: z.number().nullable().optional(),
  timeDeltaDaysHigh: z.number().nullable().optional(),
  calculationVersion: z.string().nullable().optional(),
  assumptionsJson: nullableJsonSchema,
  notes: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskEdgeTypeModel = z.infer<typeof TaskEdgeSchema>;

/** Zod schema for the TaskImpactEstimateSet model */
export const TaskImpactEstimateSetSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  isCurrent: z.boolean().default(false),
  estimateKind: TaskImpactEstimateKindSchema,
  publicationStatus: TaskImpactPublicationStatusSchema.default("DRAFT"),
  sourceSystem: SourceSystemSchema,
  calculationVersion: z.string(),
  methodologyKey: z.string(),
  parameterSetHash: z.string(),
  counterfactualKey: z.string(),
  assumptionsJson: nullableJsonSchema,
  formulaText: z.string().nullable().optional(),
  formulaLatex: z.string().nullable().optional(),
  calculationCode: z.string().nullable().optional(),
  calculationLanguage: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskImpactEstimateSetType = z.infer<
  typeof TaskImpactEstimateSetSchema
>;

/** Zod schema for the TaskImpactFrameEstimate model */
export const TaskImpactFrameEstimateSchema = z.object({
  id: z.string(),
  taskImpactEstimateSetId: z.string(),
  frameKey: TaskImpactFrameKeySchema,
  frameSlug: z.string(),
  customFrameLabel: z.string().nullable().optional(),
  evaluationHorizonYears: z.number(),
  timeToImpactStartDays: z.number(),
  adoptionRampYears: z.number(),
  benefitDurationYears: z.number(),
  annualDiscountRate: z.number(),
  summaryStatsJson: nullableJsonSchema,
  successProbabilityLow: z.number().nullable().optional(),
  successProbabilityBase: z.number().nullable().optional(),
  successProbabilityHigh: z.number().nullable().optional(),
  medianIncomeGrowthEffectPpPerYearLow: z.number().nullable().optional(),
  medianIncomeGrowthEffectPpPerYearBase: z.number().nullable().optional(),
  medianIncomeGrowthEffectPpPerYearHigh: z.number().nullable().optional(),
  medianHealthyLifeYearsEffectLow: z.number().nullable().optional(),
  medianHealthyLifeYearsEffectBase: z.number().nullable().optional(),
  medianHealthyLifeYearsEffectHigh: z.number().nullable().optional(),
  expectedDalysAvertedLow: z.number().nullable().optional(),
  expectedDalysAvertedBase: z.number().nullable().optional(),
  expectedDalysAvertedHigh: z.number().nullable().optional(),
  expectedEconomicValueUsdLow: z.number().nullable().optional(),
  expectedEconomicValueUsdBase: z.number().nullable().optional(),
  expectedEconomicValueUsdHigh: z.number().nullable().optional(),
  estimatedCashCostUsdLow: z.number().nullable().optional(),
  estimatedCashCostUsdBase: z.number().nullable().optional(),
  estimatedCashCostUsdHigh: z.number().nullable().optional(),
  estimatedEffortHoursLow: z.number().nullable().optional(),
  estimatedEffortHoursBase: z.number().nullable().optional(),
  estimatedEffortHoursHigh: z.number().nullable().optional(),
  delayDalysLostPerDayLow: z.number().nullable().optional(),
  delayDalysLostPerDayBase: z.number().nullable().optional(),
  delayDalysLostPerDayHigh: z.number().nullable().optional(),
  delayEconomicValueUsdLostPerDayLow: z.number().nullable().optional(),
  delayEconomicValueUsdLostPerDayBase: z.number().nullable().optional(),
  delayEconomicValueUsdLostPerDayHigh: z.number().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskImpactFrameEstimateType = z.infer<
  typeof TaskImpactFrameEstimateSchema
>;

/** Zod schema for the TaskImpactMetric model */
export const TaskImpactMetricSchema = z.object({
  id: z.string(),
  taskImpactFrameEstimateId: z.string(),
  metricKey: z.string(),
  unit: z.string(),
  lowValue: z.number().nullable().optional(),
  baseValue: z.number().nullable().optional(),
  highValue: z.number().nullable().optional(),
  valueJson: nullableJsonSchema,
  summaryStatsJson: nullableJsonSchema,
  displayGroup: z.string().nullable().optional(),
  metadataJson: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskImpactMetricType = z.infer<typeof TaskImpactMetricSchema>;

/** Zod schema for the TaskImpactSourceArtifact model */
export const TaskImpactSourceArtifactSchema = z.object({
  id: z.string(),
  taskImpactEstimateSetId: z.string(),
  sourceArtifactId: z.string(),
  isPrimary: z.boolean().default(false),
  createdAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type TaskImpactSourceArtifactType = z.infer<
  typeof TaskImpactSourceArtifactSchema
>;

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
  deletedAt: nullableDateSchema,
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
  deletedAt: nullableDateSchema,
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
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
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
  deletedAt: nullableDateSchema,
});
export type SocialAccountType = z.infer<typeof SocialAccountSchema>;

/** Zod schema for the EmailLog model */
export const EmailLogSchema = z.object({
  id: z.string(),
  userId: z.string().nullable().optional(),
  toAddress: z.string(),
  subject: z.string(),
  templateId: z.string().nullable().optional(),
  status: EmailLogStatusSchema.default("SENT"),
  sentAt: dateSchema,
  deliveredAt: nullableDateSchema,
  openedAt: nullableDateSchema,
  bouncedAt: nullableDateSchema,
  errorMessage: z.string().nullable().optional(),
  dedupeKey: z.string().nullable().optional(),
  createdAt: dateSchema,
});
export type EmailLogType = z.infer<typeof EmailLogSchema>;

// ── Dating and mission dates ───────────────────────────────────────────────

export const DatingProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: DatingProfileStatusSchema.default("DRAFT"),
  headline: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  lookingForText: z.string().nullable().optional(),
  relationshipIntents: z.array(DatingRelationshipIntentSchema).default([]),
  genderIdentities: z.array(z.string()).default([]),
  orientationIdentities: z.array(z.string()).default([]),
  relationshipStatus: z.string().nullable().optional(),
  preferredMinAge: z.number().int().nullable().optional(),
  preferredMaxAge: z.number().int().nullable().optional(),
  maxDistanceKm: z.number().int().nullable().optional(),
  displayCity: z.string().nullable().optional(),
  displayRegionCode: z.string().nullable().optional(),
  displayCountryCode: z.string().nullable().optional(),
  wantsCampaignDates: z.boolean().default(true),
  campaignDateIdeas: z.array(z.string()).default([]),
  profileCompletedAt: nullableDateSchema,
  lastActiveAt: nullableDateSchema,
  metadata: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type DatingProfileType = z.infer<typeof DatingProfileSchema>;

export const DatingProfilePhotoSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  imageUrl: z.string(),
  storageKey: z.string().nullable().optional(),
  altText: z.string().nullable().optional(),
  blurhash: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  status: DatingProfilePhotoStatusSchema.default("PENDING"),
  moderationReason: z.string().nullable().optional(),
  reviewedByUserId: z.string().nullable().optional(),
  reviewedAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type DatingProfilePhotoType = z.infer<typeof DatingProfilePhotoSchema>;

export const DatingPromptSchema = z.object({
  id: z.string(),
  key: z.string(),
  text: z.string(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
  managed: z.boolean().default(false),
  metadata: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type DatingPromptType = z.infer<typeof DatingPromptSchema>;

export const DatingPromptAnswerSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  promptId: z.string(),
  answer: z.string(),
  sortOrder: z.number().int().default(0),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type DatingPromptAnswerType = z.infer<typeof DatingPromptAnswerSchema>;

export const DatingQuestionSchema = z.object({
  id: z.string(),
  key: z.string(),
  text: z.string(),
  category: z.string().nullable().optional(),
  answerOptions: z.unknown(),
  allowMultiple: z.boolean().default(false),
  status: DatingQuestionStatusSchema.default("ACTIVE"),
  sortOrder: z.number().int().default(0),
  managed: z.boolean().default(false),
  metadata: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type DatingQuestionType = z.infer<typeof DatingQuestionSchema>;

export const DatingQuestionAnswerSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  questionId: z.string(),
  answerValues: z.unknown(),
  acceptableValues: nullableJsonSchema,
  importance: DatingQuestionImportanceSchema.default("SOMEWHAT"),
  visibility: DatingQuestionAnswerVisibilitySchema.default("PUBLIC"),
  explanation: z.string().nullable().optional(),
  answeredAt: dateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type DatingQuestionAnswerType = z.infer<
  typeof DatingQuestionAnswerSchema
>;

export const DatingPreferenceSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  key: z.string(),
  valueJson: z.unknown(),
  importance: DatingPreferenceImportanceSchema.default("PREFERENCE"),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type DatingPreferenceType = z.infer<typeof DatingPreferenceSchema>;

export const DatingMatchScoreSchema = z.object({
  id: z.string(),
  profileAId: z.string(),
  profileBId: z.string(),
  score: z.number().int(),
  questionScore: z.number().int().nullable().optional(),
  preferenceScore: z.number().int().nullable().optional(),
  sharedAnsweredCount: z.number().int().default(0),
  dealbreakerFailed: z.boolean().default(false),
  failedDealbreakerCount: z.number().int().default(0),
  computedAt: dateSchema,
  metadata: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type DatingMatchScoreType = z.infer<typeof DatingMatchScoreSchema>;

export const DatingInteractionSchema = z.object({
  id: z.string(),
  fromProfileId: z.string(),
  toProfileId: z.string(),
  kind: DatingInteractionKindSchema,
  status: DatingInteractionStatusSchema.default("ACTIVE"),
  introMessage: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type DatingInteractionType = z.infer<typeof DatingInteractionSchema>;

export const DatingMatchSchema = z.object({
  id: z.string(),
  profileAId: z.string(),
  profileBId: z.string(),
  status: DatingMatchStatusSchema.default("ACTIVE"),
  matchedAt: dateSchema,
  unmatchedAt: nullableDateSchema,
  lastMessageAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type DatingMatchType = z.infer<typeof DatingMatchSchema>;

export const DatingConversationSchema = z.object({
  id: z.string(),
  matchId: z.string(),
  status: DatingConversationStatusSchema.default("ACTIVE"),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type DatingConversationType = z.infer<typeof DatingConversationSchema>;

export const DatingMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderProfileId: z.string(),
  body: z.string(),
  status: DatingMessageStatusSchema.default("SENT"),
  readAt: nullableDateSchema,
  editedAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type DatingMessageType = z.infer<typeof DatingMessageSchema>;

export const DatingDatePlanSchema = z.object({
  id: z.string(),
  matchId: z.string().nullable().optional(),
  conversationId: z.string().nullable().optional(),
  proposedByProfileId: z.string(),
  acceptedByProfileId: z.string().nullable().optional(),
  status: DatingDatePlanStatusSchema.default("PROPOSED"),
  title: z.string(),
  description: z.string().nullable().optional(),
  startsAt: nullableDateSchema,
  endsAt: nullableDateSchema,
  timeZone: z.string().nullable().optional(),
  locationName: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  isCampaignDate: z.boolean().default(false),
  campaignTaskId: z.string().nullable().optional(),
  campaignNotes: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type DatingDatePlanType = z.infer<typeof DatingDatePlanSchema>;

export const DatingBlockSchema = z.object({
  id: z.string(),
  blockerProfileId: z.string(),
  blockedProfileId: z.string(),
  scope: DatingBlockScopeSchema.default("ALL"),
  reason: z.string().nullable().optional(),
  createdAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type DatingBlockType = z.infer<typeof DatingBlockSchema>;

export const DatingSafetyReportSchema = z.object({
  id: z.string(),
  reporterProfileId: z.string(),
  reportedProfileId: z.string().nullable().optional(),
  messageId: z.string().nullable().optional(),
  datePlanId: z.string().nullable().optional(),
  reason: z.string(),
  description: z.string().nullable().optional(),
  status: DatingSafetyReportStatusSchema.default("OPEN"),
  reviewerUserId: z.string().nullable().optional(),
  resolutionNote: z.string().nullable().optional(),
  resolvedAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type DatingSafetyReportType = z.infer<typeof DatingSafetyReportSchema>;

// ── Commerce catalog, orders, fulfillment, and entitlements ────────────────

export const CommerceOfferSchema = z.object({
  id: z.string(),
  key: z.string(),
  kind: CommerceOfferKindSchema,
  status: CommerceOfferStatusSchema.default("ACTIVE"),
  title: z.string(),
  description: z.string().nullable().optional(),
  currency: z.string().default("usd"),
  defaultUnitAmountCents: z.number().int().nullable().optional(),
  defaultFmvCents: z.number().int().default(0),
  minUnitAmountCents: z.number().int().nullable().optional(),
  maxUnitAmountCents: z.number().int().nullable().optional(),
  allowCustomAmount: z.boolean().default(false),
  isTaxDeductible: z.boolean().default(false),
  taxCode: z.string().nullable().optional(),
  fulfillmentKind: CommerceFulfillmentKindSchema.default("NONE"),
  managed: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  metadata: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type CommerceOfferType = z.infer<typeof CommerceOfferSchema>;

export const CommerceOfferVariantSchema = z.object({
  id: z.string(),
  offerId: z.string(),
  key: z.string(),
  variantKey: z.string(),
  label: z.string(),
  currency: z.string().default("usd"),
  unitAmountCents: z.number().int().nullable().optional(),
  fmvCents: z.number().int().nullable().optional(),
  minUnitAmountCents: z.number().int().nullable().optional(),
  maxUnitAmountCents: z.number().int().nullable().optional(),
  allowCustomAmount: z.boolean().nullable().optional(),
  taxCode: z.string().nullable().optional(),
  fulfillmentKind: CommerceFulfillmentKindSchema.nullable().optional(),
  attributes: nullableJsonSchema,
  fulfillmentMetadata: nullableJsonSchema,
  metadata: nullableJsonSchema,
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type CommerceOfferVariantType = z.infer<
  typeof CommerceOfferVariantSchema
>;

export const CommerceFulfillmentMappingSchema = z.object({
  id: z.string(),
  offerVariantId: z.string(),
  provider: CommerceFulfillmentProviderSchema,
  providerProductId: z.string().nullable().optional(),
  providerVariantId: z.string().nullable().optional(),
  providerCatalogSku: z.string().nullable().optional(),
  providerMetadata: nullableJsonSchema,
  active: z.boolean().default(true),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type CommerceFulfillmentMappingType = z.infer<
  typeof CommerceFulfillmentMappingSchema
>;

export const CommerceOrderSchema = z.object({
  id: z.string(),
  purposeKey: z.string().nullable().optional(),
  status: CommerceOrderStatusSchema.default("PENDING_PAYMENT"),
  paymentProvider: CommercePaymentProviderSchema.default("STRIPE"),
  stripeCheckoutSessionId: z.string().nullable().optional(),
  stripePaymentIntentId: z.string().nullable().optional(),
  stripeCustomerId: z.string().nullable().optional(),
  buyerUserId: z.string().nullable().optional(),
  buyerOrganizationId: z.string().nullable().optional(),
  buyerEmail: z.string().nullable().optional(),
  buyerName: z.string().nullable().optional(),
  buyerPhone: z.string().nullable().optional(),
  shippingName: z.string().nullable().optional(),
  shippingLine1: z.string().nullable().optional(),
  shippingLine2: z.string().nullable().optional(),
  shippingCity: z.string().nullable().optional(),
  shippingState: z.string().nullable().optional(),
  shippingPostalCode: z.string().nullable().optional(),
  shippingCountry: z.string().nullable().optional(),
  currency: z.string().default("usd"),
  subtotalCents: z.number().int().default(0),
  taxCents: z.number().int().default(0),
  shippingCents: z.number().int().default(0),
  discountCents: z.number().int().default(0),
  totalCents: z.number().int().default(0),
  fmvCents: z.number().int().default(0),
  donationCents: z.number().int().default(0),
  metadata: nullableJsonSchema,
  lastError: z.string().nullable().optional(),
  attemptCount: z.number().int().default(0),
  paidAt: nullableDateSchema,
  fulfilledAt: nullableDateSchema,
  shippedAt: nullableDateSchema,
  canceledAt: nullableDateSchema,
  refundedAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type CommerceOrderType = z.infer<typeof CommerceOrderSchema>;

export const CommerceOrderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  offerId: z.string().nullable().optional(),
  offerVariantId: z.string().nullable().optional(),
  offerKey: z.string(),
  offerVariantKey: z.string().nullable().optional(),
  title: z.string(),
  quantity: z.number().int().default(1),
  currency: z.string().default("usd"),
  unitAmountCents: z.number().int().default(0),
  unitFmvCents: z.number().int().default(0),
  unitDonationCents: z.number().int().default(0),
  totalAmountCents: z.number().int().default(0),
  totalFmvCents: z.number().int().default(0),
  totalDonationCents: z.number().int().default(0),
  taxable: z.boolean().default(false),
  taxCode: z.string().nullable().optional(),
  fulfillmentKind: CommerceFulfillmentKindSchema.default("NONE"),
  fulfillmentMetadata: nullableJsonSchema,
  metadata: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type CommerceOrderItemType = z.infer<typeof CommerceOrderItemSchema>;

export const CommerceFulfillmentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  orderItemId: z.string().nullable().optional(),
  provider: CommerceFulfillmentProviderSchema,
  status: CommerceFulfillmentStatusSchema.default("PENDING"),
  externalOrderId: z.string().nullable().optional(),
  providerOrderId: z.string().nullable().optional(),
  providerStatus: z.string().nullable().optional(),
  trackingNumber: z.string().nullable().optional(),
  trackingUrl: z.string().nullable().optional(),
  metadata: nullableJsonSchema,
  lastError: z.string().nullable().optional(),
  attemptCount: z.number().int().default(0),
  submittedAt: nullableDateSchema,
  shippedAt: nullableDateSchema,
  deliveredAt: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type CommerceFulfillmentType = z.infer<typeof CommerceFulfillmentSchema>;

export const CommerceEntitlementSchema = z.object({
  id: z.string(),
  orderId: z.string().nullable().optional(),
  orderItemId: z.string().nullable().optional(),
  offerId: z.string().nullable().optional(),
  offerVariantId: z.string().nullable().optional(),
  entitlementType: z.string(),
  status: CommerceEntitlementStatusSchema.default("PENDING"),
  subjectUserId: z.string().nullable().optional(),
  subjectOrganizationId: z.string().nullable().optional(),
  startsAt: nullableDateSchema,
  endsAt: nullableDateSchema,
  metadata: nullableJsonSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
});
export type CommerceEntitlementType = z.infer<typeof CommerceEntitlementSchema>;
