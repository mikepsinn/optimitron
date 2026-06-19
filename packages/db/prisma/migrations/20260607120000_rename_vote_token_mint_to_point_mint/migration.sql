ALTER TYPE "VoteTokenMintStatus" RENAME TO "PointMintStatus";

ALTER TABLE "VoteTokenMint" RENAME TO "PointMint";

ALTER TABLE "PointMint" RENAME CONSTRAINT "VoteTokenMint_pkey" TO "PointMint_pkey";
ALTER TABLE "PointMint" RENAME CONSTRAINT "VoteTokenMint_userId_fkey" TO "PointMint_userId_fkey";
ALTER TABLE "PointMint" RENAME CONSTRAINT "VoteTokenMint_referendumId_fkey" TO "PointMint_referendumId_fkey";

ALTER INDEX "VoteTokenMint_userId_idx" RENAME TO "PointMint_userId_idx";
ALTER INDEX "VoteTokenMint_userId_referendumId_idx" RENAME TO "PointMint_userId_referendumId_idx";
ALTER INDEX "VoteTokenMint_referendumId_idx" RENAME TO "PointMint_referendumId_idx";
ALTER INDEX "VoteTokenMint_status_idx" RENAME TO "PointMint_status_idx";
ALTER INDEX "VoteTokenMint_nullifierHash_referendumId_key" RENAME TO "PointMint_nullifierHash_referendumId_key";
