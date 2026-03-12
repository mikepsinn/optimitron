-- AlterTable
ALTER TABLE "User" ADD COLUMN     "annualHouseholdIncomeUsd" DOUBLE PRECISION,
ADD COLUMN     "birthYear" INTEGER,
ADD COLUMN     "censusNotes" TEXT,
ADD COLUMN     "censusUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "city" TEXT,
ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "educationLevel" TEXT,
ADD COLUMN     "employmentStatus" TEXT,
ADD COLUMN     "genderIdentity" TEXT,
ADD COLUMN     "householdSize" INTEGER,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "regionCode" TEXT,
ADD COLUMN     "timeZone" TEXT;

-- CreateIndex
CREATE INDEX "User_countryCode_regionCode_idx" ON "User"("countryCode", "regionCode");

-- CreateIndex
CREATE INDEX "User_annualHouseholdIncomeUsd_idx" ON "User"("annualHouseholdIncomeUsd");

-- CreateIndex
CREATE INDEX "User_censusUpdatedAt_idx" ON "User"("censusUpdatedAt");

-- RenameIndex
ALTER INDEX "User_referralEmailSequenceStep_referralEmailSequenceLastSentAt_" RENAME TO "User_referralEmailSequenceStep_referralEmailSequenceLastSen_idx";
