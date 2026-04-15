-- CreateEnum
CREATE TYPE "OrganizationReferendumPositionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "OrganizationReferendumPosition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "referendumId" TEXT NOT NULL,
    "position" "VotePosition" NOT NULL,
    "statement" TEXT,
    "submittedByUserId" TEXT,
    "approvedByUserId" TEXT,
    "status" "OrganizationReferendumPositionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OrganizationReferendumPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizationReferendumPosition_organizationId_idx" ON "OrganizationReferendumPosition"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationReferendumPosition_referendumId_idx" ON "OrganizationReferendumPosition"("referendumId");

-- CreateIndex
CREATE INDEX "OrganizationReferendumPosition_status_idx" ON "OrganizationReferendumPosition"("status");

-- CreateIndex
CREATE INDEX "OrganizationReferendumPosition_submittedByUserId_idx" ON "OrganizationReferendumPosition"("submittedByUserId");

-- CreateIndex
CREATE INDEX "OrganizationReferendumPosition_approvedByUserId_idx" ON "OrganizationReferendumPosition"("approvedByUserId");

-- CreateIndex
CREATE INDEX "OrganizationReferendumPosition_deletedAt_idx" ON "OrganizationReferendumPosition"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationReferendumPosition_organizationId_referendumId_key" ON "OrganizationReferendumPosition"("organizationId", "referendumId");

-- AddForeignKey
ALTER TABLE "OrganizationReferendumPosition" ADD CONSTRAINT "OrganizationReferendumPosition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationReferendumPosition" ADD CONSTRAINT "OrganizationReferendumPosition_referendumId_fkey" FOREIGN KEY ("referendumId") REFERENCES "Referendum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationReferendumPosition" ADD CONSTRAINT "OrganizationReferendumPosition_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationReferendumPosition" ADD CONSTRAINT "OrganizationReferendumPosition_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
