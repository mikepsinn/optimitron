-- CreateEnum
CREATE TYPE "CommerceOfferKind" AS ENUM ('PHYSICAL_GOOD', 'SPONSORSHIP', 'SUBSCRIPTION', 'DIGITAL_ACCESS', 'SERVICE', 'DONATION');

-- CreateEnum
CREATE TYPE "CommerceOfferStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "CommerceFulfillmentKind" AS ENUM ('NONE', 'PHYSICAL_GOOD', 'DIGITAL_ENTITLEMENT', 'MANUAL_SPONSORSHIP');

-- CreateEnum
CREATE TYPE "CommercePaymentProvider" AS ENUM ('STRIPE', 'MANUAL');

-- CreateEnum
CREATE TYPE "CommerceFulfillmentProvider" AS ENUM ('NONE', 'CUSTOMCAT', 'MANUAL', 'STRIPE');

-- CreateEnum
CREATE TYPE "CommerceOrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'FULFILLING', 'SUBMITTED', 'SHIPPED', 'FAILED', 'CANCELED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CommerceFulfillmentStatus" AS ENUM ('PENDING', 'SUBMITTED', 'SHIPPED', 'DELIVERED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CommerceEntitlementStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELED', 'REVOKED');

-- CreateTable
CREATE TABLE "CommerceOffer" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" "CommerceOfferKind" NOT NULL,
    "status" "CommerceOfferStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "defaultUnitAmountCents" INTEGER,
    "defaultFmvCents" INTEGER NOT NULL DEFAULT 0,
    "minUnitAmountCents" INTEGER,
    "maxUnitAmountCents" INTEGER,
    "allowCustomAmount" BOOLEAN NOT NULL DEFAULT false,
    "isTaxDeductible" BOOLEAN NOT NULL DEFAULT false,
    "taxCode" TEXT,
    "fulfillmentKind" "CommerceFulfillmentKind" NOT NULL DEFAULT 'NONE',
    "managed" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CommerceOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceOfferVariant" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "unitAmountCents" INTEGER,
    "fmvCents" INTEGER,
    "minUnitAmountCents" INTEGER,
    "maxUnitAmountCents" INTEGER,
    "allowCustomAmount" BOOLEAN,
    "taxCode" TEXT,
    "fulfillmentKind" "CommerceFulfillmentKind",
    "attributes" JSONB,
    "fulfillmentMetadata" JSONB,
    "metadata" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CommerceOfferVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceFulfillmentMapping" (
    "id" TEXT NOT NULL,
    "offerVariantId" TEXT NOT NULL,
    "provider" "CommerceFulfillmentProvider" NOT NULL,
    "providerProductId" TEXT,
    "providerVariantId" TEXT,
    "providerCatalogSku" TEXT,
    "providerMetadata" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CommerceFulfillmentMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceOrder" (
    "id" TEXT NOT NULL,
    "purposeKey" TEXT,
    "status" "CommerceOrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentProvider" "CommercePaymentProvider" NOT NULL DEFAULT 'STRIPE',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeCustomerId" TEXT,
    "buyerUserId" TEXT,
    "buyerOrganizationId" TEXT,
    "buyerEmail" TEXT,
    "buyerName" TEXT,
    "buyerPhone" TEXT,
    "shippingName" TEXT,
    "shippingLine1" TEXT,
    "shippingLine2" TEXT,
    "shippingCity" TEXT,
    "shippingState" TEXT,
    "shippingPostalCode" TEXT,
    "shippingCountry" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "shippingCents" INTEGER NOT NULL DEFAULT 0,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "fmvCents" INTEGER NOT NULL DEFAULT 0,
    "donationCents" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "lastError" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CommerceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "offerId" TEXT,
    "offerVariantId" TEXT,
    "offerKey" TEXT NOT NULL,
    "offerVariantKey" TEXT,
    "title" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "unitAmountCents" INTEGER NOT NULL DEFAULT 0,
    "unitFmvCents" INTEGER NOT NULL DEFAULT 0,
    "unitDonationCents" INTEGER NOT NULL DEFAULT 0,
    "totalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "totalFmvCents" INTEGER NOT NULL DEFAULT 0,
    "totalDonationCents" INTEGER NOT NULL DEFAULT 0,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "taxCode" TEXT,
    "fulfillmentKind" "CommerceFulfillmentKind" NOT NULL DEFAULT 'NONE',
    "fulfillmentMetadata" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CommerceOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceFulfillment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT,
    "provider" "CommerceFulfillmentProvider" NOT NULL,
    "status" "CommerceFulfillmentStatus" NOT NULL DEFAULT 'PENDING',
    "externalOrderId" TEXT,
    "providerOrderId" TEXT,
    "providerStatus" TEXT,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "metadata" JSONB,
    "lastError" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CommerceFulfillment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceEntitlement" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "orderItemId" TEXT,
    "offerId" TEXT,
    "offerVariantId" TEXT,
    "entitlementType" TEXT NOT NULL,
    "status" "CommerceEntitlementStatus" NOT NULL DEFAULT 'PENDING',
    "subjectUserId" TEXT,
    "subjectOrganizationId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CommerceEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommerceOffer_key_key" ON "CommerceOffer"("key");
CREATE INDEX "CommerceOffer_kind_status_idx" ON "CommerceOffer"("kind", "status");
CREATE INDEX "CommerceOffer_deletedAt_idx" ON "CommerceOffer"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceOfferVariant_key_key" ON "CommerceOfferVariant"("key");
CREATE UNIQUE INDEX "CommerceOfferVariant_offerId_variantKey_key" ON "CommerceOfferVariant"("offerId", "variantKey");
CREATE INDEX "CommerceOfferVariant_offerId_active_idx" ON "CommerceOfferVariant"("offerId", "active");
CREATE INDEX "CommerceOfferVariant_deletedAt_idx" ON "CommerceOfferVariant"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceFulfillmentMapping_offerVariantId_provider_key" ON "CommerceFulfillmentMapping"("offerVariantId", "provider");
CREATE INDEX "CommerceFulfillmentMapping_provider_providerCatalogSku_idx" ON "CommerceFulfillmentMapping"("provider", "providerCatalogSku");
CREATE INDEX "CommerceFulfillmentMapping_deletedAt_idx" ON "CommerceFulfillmentMapping"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceOrder_stripeCheckoutSessionId_key" ON "CommerceOrder"("stripeCheckoutSessionId");
CREATE INDEX "CommerceOrder_buyerUserId_idx" ON "CommerceOrder"("buyerUserId");
CREATE INDEX "CommerceOrder_buyerOrganizationId_idx" ON "CommerceOrder"("buyerOrganizationId");
CREATE INDEX "CommerceOrder_buyerEmail_idx" ON "CommerceOrder"("buyerEmail");
CREATE INDEX "CommerceOrder_status_idx" ON "CommerceOrder"("status");
CREATE INDEX "CommerceOrder_purposeKey_idx" ON "CommerceOrder"("purposeKey");
CREATE INDEX "CommerceOrder_createdAt_idx" ON "CommerceOrder"("createdAt");
CREATE INDEX "CommerceOrder_deletedAt_idx" ON "CommerceOrder"("deletedAt");

-- CreateIndex
CREATE INDEX "CommerceOrderItem_orderId_idx" ON "CommerceOrderItem"("orderId");
CREATE INDEX "CommerceOrderItem_offerId_idx" ON "CommerceOrderItem"("offerId");
CREATE INDEX "CommerceOrderItem_offerVariantId_idx" ON "CommerceOrderItem"("offerVariantId");
CREATE INDEX "CommerceOrderItem_offerKey_idx" ON "CommerceOrderItem"("offerKey");
CREATE INDEX "CommerceOrderItem_deletedAt_idx" ON "CommerceOrderItem"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceFulfillment_provider_externalOrderId_key" ON "CommerceFulfillment"("provider", "externalOrderId");
CREATE INDEX "CommerceFulfillment_orderId_idx" ON "CommerceFulfillment"("orderId");
CREATE INDEX "CommerceFulfillment_orderItemId_idx" ON "CommerceFulfillment"("orderItemId");
CREATE INDEX "CommerceFulfillment_status_idx" ON "CommerceFulfillment"("status");
CREATE INDEX "CommerceFulfillment_providerOrderId_idx" ON "CommerceFulfillment"("providerOrderId");
CREATE INDEX "CommerceFulfillment_deletedAt_idx" ON "CommerceFulfillment"("deletedAt");

-- CreateIndex
CREATE INDEX "CommerceEntitlement_orderId_idx" ON "CommerceEntitlement"("orderId");
CREATE INDEX "CommerceEntitlement_orderItemId_idx" ON "CommerceEntitlement"("orderItemId");
CREATE INDEX "CommerceEntitlement_offerId_idx" ON "CommerceEntitlement"("offerId");
CREATE INDEX "CommerceEntitlement_offerVariantId_idx" ON "CommerceEntitlement"("offerVariantId");
CREATE INDEX "CommerceEntitlement_subjectUserId_idx" ON "CommerceEntitlement"("subjectUserId");
CREATE INDEX "CommerceEntitlement_subjectOrganizationId_idx" ON "CommerceEntitlement"("subjectOrganizationId");
CREATE INDEX "CommerceEntitlement_entitlementType_status_idx" ON "CommerceEntitlement"("entitlementType", "status");
CREATE INDEX "CommerceEntitlement_endsAt_idx" ON "CommerceEntitlement"("endsAt");
CREATE INDEX "CommerceEntitlement_deletedAt_idx" ON "CommerceEntitlement"("deletedAt");

-- AddForeignKey
ALTER TABLE "CommerceOfferVariant" ADD CONSTRAINT "CommerceOfferVariant_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "CommerceOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceFulfillmentMapping" ADD CONSTRAINT "CommerceFulfillmentMapping_offerVariantId_fkey" FOREIGN KEY ("offerVariantId") REFERENCES "CommerceOfferVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceOrderItem" ADD CONSTRAINT "CommerceOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CommerceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommerceOrderItem" ADD CONSTRAINT "CommerceOrderItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "CommerceOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommerceOrderItem" ADD CONSTRAINT "CommerceOrderItem_offerVariantId_fkey" FOREIGN KEY ("offerVariantId") REFERENCES "CommerceOfferVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceFulfillment" ADD CONSTRAINT "CommerceFulfillment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CommerceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommerceFulfillment" ADD CONSTRAINT "CommerceFulfillment_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "CommerceOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceEntitlement" ADD CONSTRAINT "CommerceEntitlement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CommerceOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommerceEntitlement" ADD CONSTRAINT "CommerceEntitlement_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "CommerceOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommerceEntitlement" ADD CONSTRAINT "CommerceEntitlement_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "CommerceOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommerceEntitlement" ADD CONSTRAINT "CommerceEntitlement_offerVariantId_fkey" FOREIGN KEY ("offerVariantId") REFERENCES "CommerceOfferVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
