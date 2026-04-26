-- AlterTable
-- Sync up the renamed-table primary key constraint names that the prior
-- task_communication_system migration renamed via raw SQL but Prisma's
-- introspection didn't pick up. Idempotent renames.
ALTER TABLE "TaskCommunication" RENAME CONSTRAINT "TaskEmailAttempt_pkey" TO "TaskCommunication_pkey";
ALTER TABLE "TaskCommunicationTemplate" RENAME CONSTRAINT "TaskEmailTemplate_pkey" TO "TaskCommunicationTemplate_pkey";
ALTER TABLE "TaskCommunicationVariant" RENAME CONSTRAINT "TaskEmailVariant_pkey" TO "TaskCommunicationVariant_pkey";

-- AlterTable
-- Add isSystem flag to filter system-owned users (e.g. wishonia) out of normal
-- listings, leaderboards, attribution, and human accountability views.
ALTER TABLE "User" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;
