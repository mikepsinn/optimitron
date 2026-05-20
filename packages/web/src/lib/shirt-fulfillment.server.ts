import type Stripe from "stripe";
import {
  ActivityType,
  CommerceFulfillmentProvider,
  CommerceFulfillmentStatus,
  CommerceOrderStatus,
  type Prisma,
} from "@optimitron/db";
import { WAR_ON_DISEASE_CANONICAL_ORIGIN } from "@/lib/domains";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { SHIRT_FMV_CENTS } from "@/lib/shirt-commerce.server";
import { composeAndUploadShirtArtwork } from "@/lib/shirt-back-image.server";
import { submitCustomCatOrder } from "@/lib/customcat.server";
import { buildReferralUrl } from "@/lib/url";

const log = createLogger("shirt-fulfillment");
const TERMINAL_FULFILLMENT_STATUSES = new Set<string>([
  CommerceFulfillmentStatus.SUBMITTED,
  CommerceFulfillmentStatus.SHIPPED,
  CommerceFulfillmentStatus.DELIVERED,
]);

type ShippingDetailsLike = {
  address: Stripe.Address;
  name: string | null;
  phone?: string | null;
};

function splitName(value: string | null | undefined) {
  const parts = value?.trim().split(/\s+/).filter(Boolean) ?? [];
  return {
    firstName: parts[0] ?? "Customer",
    lastName: parts.slice(1).join(" ") || ".",
  };
}

function getSessionEmail(session: Stripe.Checkout.Session) {
  return (
    session.customer_details?.email ??
    session.customer_email ??
    session.metadata?.donorEmail ??
    null
  );
}

function getShipping(session: Stripe.Checkout.Session) {
  const legacyShippingDetails = (session as unknown as {
    shipping_details?: ShippingDetailsLike | null;
  }).shipping_details;
  const shippingDetails =
    legacyShippingDetails ?? session.collected_information?.shipping_details ?? null;
  const address = shippingDetails?.address;
  const email = getSessionEmail(session);

  if (!shippingDetails || !address) {
    throw new Error("Stripe shirt session is missing shipping details.");
  }
  if (address.country !== "US") {
    throw new Error("Shirt orders are limited to US shipping addresses for v1.");
  }
  if (!address.line1 || !address.city || !address.state || !address.postal_code) {
    throw new Error("Stripe shirt session has an incomplete shipping address.");
  }
  if (!email) {
    throw new Error("Stripe shirt session is missing a customer email.");
  }
  const phone =
    ("phone" in shippingDetails ? shippingDetails.phone : null) ??
    session.customer_details?.phone ??
    null;
  if (!phone?.trim()) {
    throw new Error("Stripe shirt session is missing a customer phone.");
  }

  const shippingName = shippingDetails.name ?? session.customer_details?.name ?? null;
  const { firstName, lastName } = splitName(shippingName);

  return {
    city: address.city,
    country: "US" as const,
    email,
    firstName,
    lastName,
    line1: address.line1,
    line2: address.line2,
    phone,
    postalCode: address.postal_code,
    shippingName: shippingName ?? `${firstName} ${lastName}`,
    state: address.state,
  };
}

function getStripeObjectId(value: string | { id?: string | null } | null | undefined) {
  if (typeof value === "string") return value;
  return value?.id ?? undefined;
}

function getMetadataRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function getMetadataString(value: unknown, key: string) {
  const field = getMetadataRecord(value)[key];
  return typeof field === "string" && field.trim() ? field : null;
}

async function findCommerceOrder(session: Stripe.Checkout.Session) {
  const predicates: Prisma.CommerceOrderWhereInput[] = [
    { stripeCheckoutSessionId: session.id },
  ];
  if (session.metadata?.commerce_order_id) {
    predicates.unshift({ id: session.metadata.commerce_order_id });
  }

  return prisma.commerceOrder.findFirst({
    include: { items: true },
    where: {
      OR: predicates,
      deletedAt: null,
    },
  });
}

type CommerceOrderForFulfillment = NonNullable<Awaited<ReturnType<typeof findCommerceOrder>>>;
type CommerceOrderItemForFulfillment = CommerceOrderForFulfillment["items"][number];

function selectShirtOrderItem(
  order: CommerceOrderForFulfillment,
  session: Stripe.Checkout.Session,
): CommerceOrderItemForFulfillment {
  const metadataItemId = session.metadata?.commerce_order_item_id ?? null;
  const item =
    order.items.find((candidate) => candidate.id === metadataItemId) ?? order.items[0] ?? null;
  if (!item) {
    throw new Error(`Commerce order ${order.id} has no shirt item to fulfill.`);
  }
  return item;
}

async function findUserId(
  session: Stripe.Checkout.Session,
  email: string | null,
  buyerUserId: string | null,
) {
  const candidateUserId = buyerUserId ?? session.metadata?.userId ?? null;
  if (candidateUserId) {
    const user = await prisma.user.findUnique({
      select: { id: true },
      where: { id: candidateUserId },
    });
    if (user) return user.id;
  }

  if (!email) return null;
  const user = await prisma.user.findUnique({
    select: { id: true },
    where: { email: email.toLowerCase() },
  });
  return user?.id ?? null;
}

function isTerminalFulfillment(status: string) {
  return TERMINAL_FULFILLMENT_STATUSES.has(status);
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  try {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  } catch {
    return String(value);
  }
}

export async function fulfillShirtCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.metadata?.order_type !== "shirt") {
    return { skipped: true as const };
  }

  const commerceOrder = await findCommerceOrder(session);
  if (!commerceOrder) {
    throw new Error(`Missing commerce order for Stripe Checkout session ${session.id}.`);
  }

  const item = selectShirtOrderItem(commerceOrder, session);
  const existingFulfillment = await prisma.commerceFulfillment.findFirst({
    where: {
      deletedAt: null,
      externalOrderId: session.id,
      provider: CommerceFulfillmentProvider.CUSTOMCAT,
    },
  });

  if (existingFulfillment && isTerminalFulfillment(existingFulfillment.status)) {
    log.info("Duplicate shirt fulfillment webhook skipped", { sessionId: session.id });
    return {
      customCatOrderId: existingFulfillment.providerOrderId,
      duplicate: true as const,
    };
  }

  const shipping = getShipping(session);
  const itemMetadata = getMetadataRecord(item.fulfillmentMetadata);
  const catalogSku = getMetadataString(itemMetadata, "customCatCatalogSku");
  if (!catalogSku) {
    throw new Error(`Commerce order item ${item.id} is missing a CustomCat catalog SKU.`);
  }

  const fulfillment = existingFulfillment
    ? await prisma.commerceFulfillment.update({
        data: {
          attemptCount: { increment: 1 },
          lastError: null,
          metadata: {
            commerceOrderId: commerceOrder.id,
            commerceOrderItemId: item.id,
            retryOfFulfillmentId: existingFulfillment.id,
            stripeCheckoutSessionId: session.id,
          } satisfies Prisma.InputJsonValue,
          orderId: commerceOrder.id,
          orderItemId: item.id,
          status: CommerceFulfillmentStatus.PENDING,
        },
        where: { id: existingFulfillment.id },
      })
    : await prisma.commerceFulfillment.create({
        data: {
          attemptCount: 1,
          externalOrderId: session.id,
          metadata: {
            commerceOrderId: commerceOrder.id,
            commerceOrderItemId: item.id,
            stripeCheckoutSessionId: session.id,
          } satisfies Prisma.InputJsonValue,
          orderId: commerceOrder.id,
          orderItemId: item.id,
          provider: CommerceFulfillmentProvider.CUSTOMCAT,
          status: CommerceFulfillmentStatus.PENDING,
        },
      });

  try {
    await prisma.commerceOrder.update({
      data: {
        buyerEmail: commerceOrder.buyerEmail ?? shipping.email,
        buyerName: commerceOrder.buyerName ?? shipping.shippingName,
        buyerPhone: shipping.phone,
        paidAt: commerceOrder.paidAt ?? new Date(),
        shippingCity: shipping.city,
        shippingCountry: shipping.country,
        shippingLine1: shipping.line1,
        shippingLine2: shipping.line2,
        shippingName: shipping.shippingName,
        shippingPostalCode: shipping.postalCode,
        shippingState: shipping.state,
        status: CommerceOrderStatus.PAID,
        stripeCheckoutSessionId: session.id,
        stripeCustomerId: getStripeObjectId(session.customer),
        stripePaymentIntentId: getStripeObjectId(session.payment_intent),
      },
      where: { id: commerceOrder.id },
    });

    const handle = getMetadataString(itemMetadata, "handle") ?? session.metadata?.handle;
    const referralUrl =
      getMetadataString(itemMetadata, "referralUrl") ??
      session.metadata?.referral_url ??
      buildReferralUrl(handle, WAR_ON_DISEASE_CANONICAL_ORIGIN);
    const visibleTargetUrl = referralUrl.replace(/^https?:\/\//, "");
    const artwork = await composeAndUploadShirtArtwork({
      checkoutSessionId: session.id,
      qrTarget: referralUrl,
      visibleTargetUrl,
    });
    const customCat = await submitCustomCatOrder({
      backDesignUrl: artwork.backDesignUrl,
      catalogSku,
      externalOrderId: session.id,
      frontDesignUrl: artwork.frontDesignUrl,
      shipping,
    });
    const providerOrderId = customCat.customCatOrderId ?? customCat.orderId ?? null;

    await prisma.commerceFulfillment.update({
      data: {
        lastError: null,
        metadata: {
          artwork,
          commerceOrderId: commerceOrder.id,
          commerceOrderItemId: item.id,
          customCatResponse: toInputJsonValue(customCat.response),
          stripeCheckoutSessionId: session.id,
        } satisfies Prisma.InputJsonValue,
        providerOrderId,
        providerStatus: customCat.message,
        status: CommerceFulfillmentStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      where: { id: fulfillment.id },
    });

    await prisma.commerceOrder.update({
      data: {
        lastError: null,
        status: CommerceOrderStatus.SUBMITTED,
      },
      where: { id: commerceOrder.id },
    });

    const userId = await findUserId(session, shipping.email, commerceOrder.buyerUserId);
    if (userId) {
      try {
        await prisma.activity.create({
          data: {
            description: "",
            entityId: session.id,
            entityType: "StripeCheckoutSession",
            metadata: JSON.stringify({
              artwork,
              customCatOrderId: providerOrderId,
              donationAmountCents: commerceOrder.donationCents,
              fmvCents: commerceOrder.fmvCents || SHIRT_FMV_CENTS,
              orderType: "shirt",
              shirtColor:
                getMetadataString(itemMetadata, "shirtColor") ?? session.metadata?.shirt_color,
              shirtSize:
                getMetadataString(itemMetadata, "shirtSize") ?? session.metadata?.shirt_size,
            }),
            type: ActivityType.DONATED,
            userId,
          },
        });
      } catch (error) {
        log.error("Failed to record shirt donation activity", error);
      }
    }

    log.info("Shirt fulfillment submitted to CustomCat", {
      commerceOrderId: commerceOrder.id,
      customCatOrderId: providerOrderId,
      sessionId: session.id,
    });

    return {
      customCatOrderId: providerOrderId,
      duplicate: false as const,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.commerceFulfillment.update({
      data: {
        lastError: message,
        status: CommerceFulfillmentStatus.FAILED,
      },
      where: { id: fulfillment.id },
    });
    await prisma.commerceOrder.update({
      data: {
        attemptCount: { increment: 1 },
        lastError: message,
        status: CommerceOrderStatus.FAILED,
      },
      where: { id: commerceOrder.id },
    });
    throw error;
  }
}
