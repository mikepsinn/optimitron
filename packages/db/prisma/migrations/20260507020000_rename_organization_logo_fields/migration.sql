ALTER TABLE "Organization" RENAME COLUMN "logo" TO "squareLogoUrl";

ALTER TABLE "Organization"
  ADD COLUMN "wordmarkLogoUrl" TEXT,
  ADD COLUMN "donationUrl" TEXT;
