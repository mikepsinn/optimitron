-- Add resource isolation without removing the legacy uniqueness constraint.
-- Existing rows and older application writers remain in the legacy resource.
ALTER TABLE "OAuthAuthCode"
ADD COLUMN "resource" TEXT NOT NULL DEFAULT 'legacy';

ALTER TABLE "OAuthGrant"
ADD COLUMN "resource" TEXT NOT NULL DEFAULT 'legacy';

CREATE UNIQUE INDEX "OAuthGrant_clientId_userId_resource_key"
ON "OAuthGrant"("clientId", "userId", "resource");
