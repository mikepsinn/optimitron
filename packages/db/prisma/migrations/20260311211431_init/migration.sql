-- CreateEnum
CREATE TYPE "CombinationOperation" AS ENUM ('SUM', 'MEAN');

-- CreateEnum
CREATE TYPE "FillingType" AS ENUM ('ZERO', 'NONE', 'INTERPOLATION', 'VALUE');

-- CreateEnum
CREATE TYPE "Valence" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "MeasurementScale" AS ENUM ('NOMINAL', 'ORDINAL', 'INTERVAL', 'RATIO');

-- CreateEnum
CREATE TYPE "UnitCodeSystem" AS ENUM ('UCUM');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('WAITING', 'ANALYZING', 'DONE', 'ERROR');

-- CreateEnum
CREATE TYPE "StrengthLevel" AS ENUM ('VERY_STRONG', 'STRONG', 'MODERATE', 'WEAK', 'VERY_WEAK');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "RelationshipDirection" AS ENUM ('POSITIVE', 'NEGATIVE', 'NONE');

-- CreateEnum
CREATE TYPE "EvidenceGrade" AS ENUM ('A', 'B', 'C', 'D', 'F');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'TRACKED', 'SKIPPED', 'SNOOZED');

-- CreateEnum
CREATE TYPE "JurisdictionType" AS ENUM ('CITY', 'COUNTY', 'STATE', 'COUNTRY');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('USER', 'JURISDICTION', 'COHORT', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "VoteAnswer" AS ENUM ('YES', 'NO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "image" TEXT,
    "password" TEXT,
    "referralCode" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "newsletterSubscribed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviatedName" TEXT NOT NULL,
    "codeSystem" "UnitCodeSystem" NOT NULL DEFAULT 'UCUM',
    "ucumCode" TEXT NOT NULL,
    "unitCategoryId" TEXT NOT NULL,
    "minimumValue" DOUBLE PRECISION,
    "maximumValue" DOUBLE PRECISION,
    "fillingType" "FillingType" NOT NULL DEFAULT 'NONE',
    "scale" "MeasurementScale" NOT NULL DEFAULT 'RATIO',
    "conversionSteps" TEXT,
    "advanced" BOOLEAN NOT NULL DEFAULT false,
    "manualTracking" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariableCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultUnitId" TEXT,
    "combinationOperation" "CombinationOperation" NOT NULL DEFAULT 'SUM',
    "onsetDelay" INTEGER NOT NULL DEFAULT 0,
    "durationOfAction" INTEGER NOT NULL DEFAULT 86400,
    "predictorOnly" BOOLEAN NOT NULL DEFAULT false,
    "outcome" BOOLEAN,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VariableCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalVariable" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "variableCategoryId" TEXT NOT NULL,
    "defaultUnitId" TEXT NOT NULL,
    "combinationOperation" "CombinationOperation" NOT NULL DEFAULT 'SUM',
    "onsetDelay" INTEGER,
    "durationOfAction" INTEGER,
    "fillingType" "FillingType" NOT NULL DEFAULT 'NONE',
    "fillingValue" DOUBLE PRECISION,
    "predictorOnly" BOOLEAN NOT NULL DEFAULT false,
    "outcome" BOOLEAN,
    "minimumAllowedValue" DOUBLE PRECISION,
    "maximumAllowedValue" DOUBLE PRECISION,
    "numberOfMeasurements" INTEGER NOT NULL DEFAULT 0,
    "latestMeasurementStartAt" TIMESTAMP(3),
    "earliestMeasurementStartAt" TIMESTAMP(3),
    "mean" DOUBLE PRECISION,
    "median" DOUBLE PRECISION,
    "standardDeviation" DOUBLE PRECISION,
    "variance" DOUBLE PRECISION,
    "kurtosis" DOUBLE PRECISION,
    "skewness" DOUBLE PRECISION,
    "numberOfUniqueValues" INTEGER,
    "mostCommonValue" DOUBLE PRECISION,
    "secondMostCommonValue" DOUBLE PRECISION,
    "minimumRecordedValue" DOUBLE PRECISION,
    "maximumRecordedValue" DOUBLE PRECISION,
    "numberOfNOf1Variables" INTEGER NOT NULL DEFAULT 0,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'WAITING',
    "analysisRequestedAt" TIMESTAMP(3),
    "analysisStartedAt" TIMESTAMP(3),
    "analysisEndedAt" TIMESTAMP(3),
    "imageUrl" TEXT,
    "informationalUrl" TEXT,
    "synonyms" TEXT,
    "valence" "Valence" NOT NULL DEFAULT 'NEUTRAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "GlobalVariable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "subjectType" "SubjectType" NOT NULL DEFAULT 'USER',
    "externalId" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NOf1Variable" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT,
    "globalVariableId" TEXT NOT NULL,
    "defaultUnitId" TEXT,
    "onsetDelay" INTEGER,
    "durationOfAction" INTEGER,
    "fillingType" "FillingType" NOT NULL DEFAULT 'NONE',
    "fillingValue" DOUBLE PRECISION,
    "minimumAllowedValue" DOUBLE PRECISION,
    "maximumAllowedValue" DOUBLE PRECISION,
    "numberOfMeasurements" INTEGER NOT NULL DEFAULT 0,
    "latestMeasurementStartAt" TIMESTAMP(3),
    "earliestMeasurementStartAt" TIMESTAMP(3),
    "mean" DOUBLE PRECISION,
    "median" DOUBLE PRECISION,
    "standardDeviation" DOUBLE PRECISION,
    "variance" DOUBLE PRECISION,
    "kurtosis" DOUBLE PRECISION,
    "skewness" DOUBLE PRECISION,
    "minimumRecordedValue" DOUBLE PRECISION,
    "maximumRecordedValue" DOUBLE PRECISION,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'WAITING',
    "analysisStartedAt" TIMESTAMP(3),
    "analysisEndedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "NOf1Variable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nOf1VariableId" TEXT NOT NULL,
    "globalVariableId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unitId" TEXT NOT NULL,
    "originalValue" DOUBLE PRECISION NOT NULL,
    "originalUnitId" TEXT NOT NULL,
    "duration" INTEGER,
    "note" TEXT,
    "sourceName" TEXT,
    "integrationConnectionId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingReminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nOf1VariableId" TEXT NOT NULL,
    "globalVariableId" TEXT NOT NULL,
    "defaultValue" DOUBLE PRECISION,
    "reminderStartTime" TEXT NOT NULL,
    "reminderEndTime" TEXT,
    "reminderFrequency" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "instructions" TEXT,
    "lastTracked" TIMESTAMP(3),
    "startTrackingDate" TIMESTAMP(3),
    "stopTrackingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TrackingReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingReminderNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackingReminderId" TEXT NOT NULL,
    "notifyAt" TIMESTAMP(3) NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "trackedValue" DOUBLE PRECISION,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TrackingReminderNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NOf1VariableRelationship" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "predictorGlobalVariableId" TEXT NOT NULL,
    "outcomeGlobalVariableId" TEXT NOT NULL,
    "forwardPearsonCorrelation" DOUBLE PRECISION NOT NULL,
    "reversePearsonCorrelation" DOUBLE PRECISION NOT NULL,
    "forwardSpearmanCorrelation" DOUBLE PRECISION,
    "pValue" DOUBLE PRECISION,
    "tValue" DOUBLE PRECISION,
    "criticalTValue" DOUBLE PRECISION,
    "confidenceInterval" DOUBLE PRECISION,
    "statisticalSignificance" DOUBLE PRECISION,
    "zScore" DOUBLE PRECISION,
    "numberOfPairs" INTEGER NOT NULL,
    "numberOfDays" INTEGER,
    "strongestPearsonCorrelation" DOUBLE PRECISION,
    "optimalPearsonProduct" DOUBLE PRECISION,
    "onsetDelay" INTEGER NOT NULL,
    "durationOfAction" INTEGER NOT NULL,
    "onsetDelayWithStrongestCorrelation" INTEGER,
    "valuePredictingHighOutcome" DOUBLE PRECISION,
    "valuePredictingLowOutcome" DOUBLE PRECISION,
    "predictsHighOutcomeChange" INTEGER,
    "predictsLowOutcomeChange" INTEGER,
    "averageOutcome" DOUBLE PRECISION,
    "averageOutcomeFollowingHighPredictor" DOUBLE PRECISION,
    "averageOutcomeFollowingLowPredictor" DOUBLE PRECISION,
    "averageDailyHighPredictor" DOUBLE PRECISION,
    "averageDailyLowPredictor" DOUBLE PRECISION,
    "effectSize" DOUBLE PRECISION,
    "predictorBaselineAveragePerDay" DOUBLE PRECISION,
    "predictorTreatmentAveragePerDay" DOUBLE PRECISION,
    "outcomeBaselineAverage" DOUBLE PRECISION,
    "outcomeBaselineStandardDeviation" DOUBLE PRECISION,
    "outcomeFollowUpAverage" DOUBLE PRECISION,
    "outcomeFollowUpPercentChangeFromBaseline" DOUBLE PRECISION,
    "strengthLevel" "StrengthLevel",
    "confidenceLevel" "ConfidenceLevel",
    "relationship" "RelationshipDirection",
    "predictorImpactScore" DOUBLE PRECISION,
    "evidenceGrade" "EvidenceGrade",
    "predictorChanges" INTEGER,
    "outcomeChanges" INTEGER,
    "trivial" BOOLEAN,
    "outcomeIsGoal" BOOLEAN,
    "predictorIsControllable" BOOLEAN,
    "plausiblyCausal" BOOLEAN,
    "optimalValue" DOUBLE PRECISION,
    "analyzedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "NOf1VariableRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregateVariableRelationship" (
    "id" TEXT NOT NULL,
    "predictorGlobalVariableId" TEXT NOT NULL,
    "outcomeGlobalVariableId" TEXT NOT NULL,
    "forwardPearsonCorrelation" DOUBLE PRECISION NOT NULL,
    "reversePearsonCorrelation" DOUBLE PRECISION NOT NULL,
    "forwardSpearmanCorrelation" DOUBLE PRECISION,
    "pValue" DOUBLE PRECISION,
    "tValue" DOUBLE PRECISION,
    "criticalTValue" DOUBLE PRECISION,
    "confidenceInterval" DOUBLE PRECISION,
    "statisticalSignificance" DOUBLE PRECISION,
    "zScore" DOUBLE PRECISION,
    "numberOfPairs" INTEGER NOT NULL,
    "numberOfDays" INTEGER,
    "strongestPearsonCorrelation" DOUBLE PRECISION,
    "optimalPearsonProduct" DOUBLE PRECISION,
    "onsetDelay" INTEGER NOT NULL,
    "durationOfAction" INTEGER NOT NULL,
    "onsetDelayWithStrongestCorrelation" INTEGER,
    "valuePredictingHighOutcome" DOUBLE PRECISION,
    "valuePredictingLowOutcome" DOUBLE PRECISION,
    "predictsHighOutcomeChange" INTEGER,
    "predictsLowOutcomeChange" INTEGER,
    "averageOutcome" DOUBLE PRECISION,
    "averageOutcomeFollowingHighPredictor" DOUBLE PRECISION,
    "averageOutcomeFollowingLowPredictor" DOUBLE PRECISION,
    "averageDailyHighPredictor" DOUBLE PRECISION,
    "averageDailyLowPredictor" DOUBLE PRECISION,
    "effectSize" DOUBLE PRECISION,
    "predictorBaselineAveragePerDay" DOUBLE PRECISION,
    "predictorTreatmentAveragePerDay" DOUBLE PRECISION,
    "outcomeBaselineAverage" DOUBLE PRECISION,
    "outcomeBaselineStandardDeviation" DOUBLE PRECISION,
    "outcomeFollowUpAverage" DOUBLE PRECISION,
    "outcomeFollowUpPercentChangeFromBaseline" DOUBLE PRECISION,
    "strengthLevel" "StrengthLevel",
    "confidenceLevel" "ConfidenceLevel",
    "relationship" "RelationshipDirection",
    "predictorImpactScore" DOUBLE PRECISION,
    "evidenceGrade" "EvidenceGrade",
    "predictorChanges" INTEGER,
    "outcomeChanges" INTEGER,
    "trivial" BOOLEAN,
    "outcomeIsGoal" BOOLEAN,
    "predictorIsControllable" BOOLEAN,
    "plausiblyCausal" BOOLEAN,
    "optimalValue" DOUBLE PRECISION,
    "numberOfUnits" INTEGER NOT NULL,
    "aggregateQmScore" DOUBLE PRECISION,
    "numberOfUpVotes" INTEGER,
    "numberOfDownVotes" INTEGER,
    "analyzedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AggregateVariableRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationProvider" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "apiBaseUrl" TEXT,
    "authorizationUrl" TEXT,
    "tokenUrl" TEXT,
    "scopes" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "supportsWebhook" BOOLEAN NOT NULL DEFAULT false,
    "supportsPolling" BOOLEAN NOT NULL DEFAULT true,
    "defaultPollIntervalSeconds" INTEGER NOT NULL DEFAULT 3600,
    "dataCategories" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "IntegrationProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "integrationProviderId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "nextSyncAt" TIMESTAMP(3),
    "totalMeasurementsImported" INTEGER NOT NULL DEFAULT 0,
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSyncLog" (
    "id" TEXT NOT NULL,
    "integrationConnectionId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "success" BOOLEAN NOT NULL DEFAULT false,
    "newMeasurements" INTEGER NOT NULL DEFAULT 0,
    "updatedMeasurements" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "IntegrationSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jurisdiction" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "JurisdictionType" NOT NULL,
    "parentJurisdictionId" TEXT,
    "code" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "population" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Jurisdiction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "currentAllocationUsd" DOUBLE PRECISION,
    "currentAllocationPct" DOUBLE PRECISION,
    "sourceUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "externalId" TEXT,
    "ageRange" TEXT,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "answer" "VoteAnswer" NOT NULL,
    "userId" TEXT,
    "referredByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishocraticAllocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryA" TEXT NOT NULL,
    "categoryB" TEXT NOT NULL,
    "allocationA" INTEGER NOT NULL,
    "allocationB" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WishocraticAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishocraticCategorySelection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "selected" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WishocraticCategorySelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PairwiseComparison" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "itemAId" TEXT NOT NULL,
    "itemBId" TEXT NOT NULL,
    "allocationA" DOUBLE PRECISION NOT NULL,
    "responseTimeMs" INTEGER,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PairwiseComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreferenceWeight" (
    "id" TEXT NOT NULL,
    "aggregationRunId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "ciLow" DOUBLE PRECISION,
    "ciHigh" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PreferenceWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregationRun" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "comparisonCount" INTEGER NOT NULL,
    "participantCount" INTEGER NOT NULL,
    "consistencyRatio" DOUBLE PRECISION,
    "categoryFilter" TEXT,
    "regionFilter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AggregationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Politician" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "party" TEXT,
    "title" TEXT,
    "district" TEXT,
    "chamber" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Politician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoliticianVote" (
    "id" TEXT NOT NULL,
    "politicianId" TEXT NOT NULL,
    "itemCategory" TEXT NOT NULL,
    "allocationPct" DOUBLE PRECISION NOT NULL,
    "billId" TEXT,
    "voteDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PoliticianVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlignmentScore" (
    "id" TEXT NOT NULL,
    "politicianId" TEXT NOT NULL,
    "aggregationRunId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "votesCompared" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AlignmentScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_abbreviatedName_key" ON "Unit"("abbreviatedName");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_ucumCode_key" ON "Unit"("ucumCode");

-- CreateIndex
CREATE INDEX "Unit_unitCategoryId_idx" ON "Unit"("unitCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "VariableCategory_name_key" ON "VariableCategory"("name");

-- CreateIndex
CREATE INDEX "VariableCategory_name_idx" ON "VariableCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalVariable_name_key" ON "GlobalVariable"("name");

-- CreateIndex
CREATE INDEX "GlobalVariable_variableCategoryId_idx" ON "GlobalVariable"("variableCategoryId");

-- CreateIndex
CREATE INDEX "GlobalVariable_defaultUnitId_idx" ON "GlobalVariable"("defaultUnitId");

-- CreateIndex
CREATE INDEX "GlobalVariable_name_idx" ON "GlobalVariable"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_externalId_key" ON "Subject"("externalId");

-- CreateIndex
CREATE INDEX "Subject_subjectType_idx" ON "Subject"("subjectType");

-- CreateIndex
CREATE INDEX "NOf1Variable_userId_idx" ON "NOf1Variable"("userId");

-- CreateIndex
CREATE INDEX "NOf1Variable_subjectId_idx" ON "NOf1Variable"("subjectId");

-- CreateIndex
CREATE INDEX "NOf1Variable_globalVariableId_idx" ON "NOf1Variable"("globalVariableId");

-- CreateIndex
CREATE UNIQUE INDEX "NOf1Variable_userId_globalVariableId_key" ON "NOf1Variable"("userId", "globalVariableId");

-- CreateIndex
CREATE INDEX "Measurement_userId_idx" ON "Measurement"("userId");

-- CreateIndex
CREATE INDEX "Measurement_globalVariableId_idx" ON "Measurement"("globalVariableId");

-- CreateIndex
CREATE INDEX "Measurement_nOf1VariableId_idx" ON "Measurement"("nOf1VariableId");

-- CreateIndex
CREATE INDEX "Measurement_startTime_idx" ON "Measurement"("startTime");

-- CreateIndex
CREATE INDEX "Measurement_userId_globalVariableId_startTime_idx" ON "Measurement"("userId", "globalVariableId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "Measurement_userId_globalVariableId_startTime_key" ON "Measurement"("userId", "globalVariableId", "startTime");

-- CreateIndex
CREATE INDEX "TrackingReminder_userId_idx" ON "TrackingReminder"("userId");

-- CreateIndex
CREATE INDEX "TrackingReminder_globalVariableId_idx" ON "TrackingReminder"("globalVariableId");

-- CreateIndex
CREATE INDEX "TrackingReminder_active_idx" ON "TrackingReminder"("active");

-- CreateIndex
CREATE UNIQUE INDEX "TrackingReminder_userId_globalVariableId_reminderStartTime__key" ON "TrackingReminder"("userId", "globalVariableId", "reminderStartTime", "reminderFrequency");

-- CreateIndex
CREATE INDEX "TrackingReminderNotification_userId_status_idx" ON "TrackingReminderNotification"("userId", "status");

-- CreateIndex
CREATE INDEX "TrackingReminderNotification_trackingReminderId_idx" ON "TrackingReminderNotification"("trackingReminderId");

-- CreateIndex
CREATE INDEX "TrackingReminderNotification_notifyAt_idx" ON "TrackingReminderNotification"("notifyAt");

-- CreateIndex
CREATE INDEX "NOf1VariableRelationship_subjectId_idx" ON "NOf1VariableRelationship"("subjectId");

-- CreateIndex
CREATE INDEX "NOf1VariableRelationship_predictorGlobalVariableId_idx" ON "NOf1VariableRelationship"("predictorGlobalVariableId");

-- CreateIndex
CREATE INDEX "NOf1VariableRelationship_outcomeGlobalVariableId_idx" ON "NOf1VariableRelationship"("outcomeGlobalVariableId");

-- CreateIndex
CREATE INDEX "NOf1VariableRelationship_analyzedAt_idx" ON "NOf1VariableRelationship"("analyzedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NOf1VariableRelationship_subjectId_predictorGlobalVariableI_key" ON "NOf1VariableRelationship"("subjectId", "predictorGlobalVariableId", "outcomeGlobalVariableId");

-- CreateIndex
CREATE INDEX "AggregateVariableRelationship_predictorGlobalVariableId_idx" ON "AggregateVariableRelationship"("predictorGlobalVariableId");

-- CreateIndex
CREATE INDEX "AggregateVariableRelationship_outcomeGlobalVariableId_idx" ON "AggregateVariableRelationship"("outcomeGlobalVariableId");

-- CreateIndex
CREATE INDEX "AggregateVariableRelationship_analyzedAt_idx" ON "AggregateVariableRelationship"("analyzedAt");

-- CreateIndex
CREATE INDEX "AggregateVariableRelationship_numberOfUnits_idx" ON "AggregateVariableRelationship"("numberOfUnits");

-- CreateIndex
CREATE UNIQUE INDEX "AggregateVariableRelationship_predictorGlobalVariableId_out_key" ON "AggregateVariableRelationship"("predictorGlobalVariableId", "outcomeGlobalVariableId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationProvider_key_key" ON "IntegrationProvider"("key");

-- CreateIndex
CREATE INDEX "IntegrationProvider_enabled_idx" ON "IntegrationProvider"("enabled");

-- CreateIndex
CREATE INDEX "IntegrationConnection_userId_idx" ON "IntegrationConnection"("userId");

-- CreateIndex
CREATE INDEX "IntegrationConnection_integrationProviderId_idx" ON "IntegrationConnection"("integrationProviderId");

-- CreateIndex
CREATE INDEX "IntegrationConnection_enabled_idx" ON "IntegrationConnection"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_userId_integrationProviderId_key" ON "IntegrationConnection"("userId", "integrationProviderId");

-- CreateIndex
CREATE INDEX "IntegrationSyncLog_integrationConnectionId_idx" ON "IntegrationSyncLog"("integrationConnectionId");

-- CreateIndex
CREATE INDEX "IntegrationSyncLog_startedAt_idx" ON "IntegrationSyncLog"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Jurisdiction_code_key" ON "Jurisdiction"("code");

-- CreateIndex
CREATE INDEX "Jurisdiction_type_idx" ON "Jurisdiction"("type");

-- CreateIndex
CREATE INDEX "Jurisdiction_parentJurisdictionId_idx" ON "Jurisdiction"("parentJurisdictionId");

-- CreateIndex
CREATE INDEX "Item_jurisdictionId_idx" ON "Item"("jurisdictionId");

-- CreateIndex
CREATE INDEX "Item_category_idx" ON "Item"("category");

-- CreateIndex
CREATE INDEX "Item_active_idx" ON "Item"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_externalId_key" ON "Participant"("externalId");

-- CreateIndex
CREATE INDEX "Participant_jurisdictionId_idx" ON "Participant"("jurisdictionId");

-- CreateIndex
CREATE INDEX "Participant_region_idx" ON "Participant"("region");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_key" ON "Vote"("userId");

-- CreateIndex
CREATE INDEX "Vote_userId_idx" ON "Vote"("userId");

-- CreateIndex
CREATE INDEX "Vote_referredByUserId_idx" ON "Vote"("referredByUserId");

-- CreateIndex
CREATE INDEX "Vote_createdAt_idx" ON "Vote"("createdAt");

-- CreateIndex
CREATE INDEX "Vote_deletedAt_idx" ON "Vote"("deletedAt");

-- CreateIndex
CREATE INDEX "WishocraticAllocation_userId_idx" ON "WishocraticAllocation"("userId");

-- CreateIndex
CREATE INDEX "WishocraticAllocation_categoryA_idx" ON "WishocraticAllocation"("categoryA");

-- CreateIndex
CREATE INDEX "WishocraticAllocation_categoryB_idx" ON "WishocraticAllocation"("categoryB");

-- CreateIndex
CREATE INDEX "WishocraticAllocation_createdAt_idx" ON "WishocraticAllocation"("createdAt");

-- CreateIndex
CREATE INDEX "WishocraticAllocation_deletedAt_idx" ON "WishocraticAllocation"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WishocraticAllocation_userId_categoryA_categoryB_key" ON "WishocraticAllocation"("userId", "categoryA", "categoryB");

-- CreateIndex
CREATE INDEX "WishocraticCategorySelection_userId_idx" ON "WishocraticCategorySelection"("userId");

-- CreateIndex
CREATE INDEX "WishocraticCategorySelection_categoryId_idx" ON "WishocraticCategorySelection"("categoryId");

-- CreateIndex
CREATE INDEX "WishocraticCategorySelection_selected_idx" ON "WishocraticCategorySelection"("selected");

-- CreateIndex
CREATE INDEX "WishocraticCategorySelection_createdAt_idx" ON "WishocraticCategorySelection"("createdAt");

-- CreateIndex
CREATE INDEX "WishocraticCategorySelection_deletedAt_idx" ON "WishocraticCategorySelection"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WishocraticCategorySelection_userId_categoryId_key" ON "WishocraticCategorySelection"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "PairwiseComparison_itemAId_itemBId_idx" ON "PairwiseComparison"("itemAId", "itemBId");

-- CreateIndex
CREATE INDEX "PairwiseComparison_participantId_idx" ON "PairwiseComparison"("participantId");

-- CreateIndex
CREATE INDEX "PairwiseComparison_sessionId_idx" ON "PairwiseComparison"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PairwiseComparison_participantId_itemAId_itemBId_key" ON "PairwiseComparison"("participantId", "itemAId", "itemBId");

-- CreateIndex
CREATE INDEX "PreferenceWeight_aggregationRunId_idx" ON "PreferenceWeight"("aggregationRunId");

-- CreateIndex
CREATE UNIQUE INDEX "PreferenceWeight_aggregationRunId_itemId_key" ON "PreferenceWeight"("aggregationRunId", "itemId");

-- CreateIndex
CREATE INDEX "AggregationRun_jurisdictionId_idx" ON "AggregationRun"("jurisdictionId");

-- CreateIndex
CREATE UNIQUE INDEX "Politician_externalId_key" ON "Politician"("externalId");

-- CreateIndex
CREATE INDEX "Politician_jurisdictionId_idx" ON "Politician"("jurisdictionId");

-- CreateIndex
CREATE INDEX "Politician_party_idx" ON "Politician"("party");

-- CreateIndex
CREATE INDEX "PoliticianVote_politicianId_idx" ON "PoliticianVote"("politicianId");

-- CreateIndex
CREATE INDEX "PoliticianVote_itemCategory_idx" ON "PoliticianVote"("itemCategory");

-- CreateIndex
CREATE INDEX "AlignmentScore_score_idx" ON "AlignmentScore"("score");

-- CreateIndex
CREATE UNIQUE INDEX "AlignmentScore_politicianId_aggregationRunId_key" ON "AlignmentScore"("politicianId", "aggregationRunId");

-- AddForeignKey
ALTER TABLE "VariableCategory" ADD CONSTRAINT "VariableCategory_defaultUnitId_fkey" FOREIGN KEY ("defaultUnitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalVariable" ADD CONSTRAINT "GlobalVariable_variableCategoryId_fkey" FOREIGN KEY ("variableCategoryId") REFERENCES "VariableCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalVariable" ADD CONSTRAINT "GlobalVariable_defaultUnitId_fkey" FOREIGN KEY ("defaultUnitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NOf1Variable" ADD CONSTRAINT "NOf1Variable_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NOf1Variable" ADD CONSTRAINT "NOf1Variable_globalVariableId_fkey" FOREIGN KEY ("globalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NOf1Variable" ADD CONSTRAINT "NOf1Variable_defaultUnitId_fkey" FOREIGN KEY ("defaultUnitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_nOf1VariableId_fkey" FOREIGN KEY ("nOf1VariableId") REFERENCES "NOf1Variable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_globalVariableId_fkey" FOREIGN KEY ("globalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_originalUnitId_fkey" FOREIGN KEY ("originalUnitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_integrationConnectionId_fkey" FOREIGN KEY ("integrationConnectionId") REFERENCES "IntegrationConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingReminder" ADD CONSTRAINT "TrackingReminder_nOf1VariableId_fkey" FOREIGN KEY ("nOf1VariableId") REFERENCES "NOf1Variable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingReminder" ADD CONSTRAINT "TrackingReminder_globalVariableId_fkey" FOREIGN KEY ("globalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingReminderNotification" ADD CONSTRAINT "TrackingReminderNotification_trackingReminderId_fkey" FOREIGN KEY ("trackingReminderId") REFERENCES "TrackingReminder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NOf1VariableRelationship" ADD CONSTRAINT "NOf1VariableRelationship_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NOf1VariableRelationship" ADD CONSTRAINT "NOf1VariableRelationship_predictorGlobalVariableId_fkey" FOREIGN KEY ("predictorGlobalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NOf1VariableRelationship" ADD CONSTRAINT "NOf1VariableRelationship_outcomeGlobalVariableId_fkey" FOREIGN KEY ("outcomeGlobalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregateVariableRelationship" ADD CONSTRAINT "AggregateVariableRelationship_predictorGlobalVariableId_fkey" FOREIGN KEY ("predictorGlobalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregateVariableRelationship" ADD CONSTRAINT "AggregateVariableRelationship_outcomeGlobalVariableId_fkey" FOREIGN KEY ("outcomeGlobalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_integrationProviderId_fkey" FOREIGN KEY ("integrationProviderId") REFERENCES "IntegrationProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSyncLog" ADD CONSTRAINT "IntegrationSyncLog_integrationConnectionId_fkey" FOREIGN KEY ("integrationConnectionId") REFERENCES "IntegrationConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jurisdiction" ADD CONSTRAINT "Jurisdiction_parentJurisdictionId_fkey" FOREIGN KEY ("parentJurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishocraticAllocation" ADD CONSTRAINT "WishocraticAllocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishocraticCategorySelection" ADD CONSTRAINT "WishocraticCategorySelection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairwiseComparison" ADD CONSTRAINT "PairwiseComparison_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairwiseComparison" ADD CONSTRAINT "PairwiseComparison_itemAId_fkey" FOREIGN KEY ("itemAId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairwiseComparison" ADD CONSTRAINT "PairwiseComparison_itemBId_fkey" FOREIGN KEY ("itemBId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenceWeight" ADD CONSTRAINT "PreferenceWeight_aggregationRunId_fkey" FOREIGN KEY ("aggregationRunId") REFERENCES "AggregationRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenceWeight" ADD CONSTRAINT "PreferenceWeight_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregationRun" ADD CONSTRAINT "AggregationRun_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Politician" ADD CONSTRAINT "Politician_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliticianVote" ADD CONSTRAINT "PoliticianVote_politicianId_fkey" FOREIGN KEY ("politicianId") REFERENCES "Politician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlignmentScore" ADD CONSTRAINT "AlignmentScore_politicianId_fkey" FOREIGN KEY ("politicianId") REFERENCES "Politician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlignmentScore" ADD CONSTRAINT "AlignmentScore_aggregationRunId_fkey" FOREIGN KEY ("aggregationRunId") REFERENCES "AggregationRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
