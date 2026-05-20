import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  CommerceFulfillmentKind,
  CommerceOrderStatus,
  CommercePaymentProvider,
  type Prisma,
} from "@optimitron/db";
import { authOptions } from "@/lib/auth";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import type { DonationFrequency } from "@/lib/stripe";
import { createLogger } from "@/lib/logger";
import { serverEnv } from "@/lib/env";
import { WAR_ON_DISEASE_CANONICAL_ORIGIN } from "@/lib/domains";
import { NONPROFIT } from "@/lib/nonprofit-identity";
import {
  getEnabledShirtVariantForCheckout,
  getEnabledStoreOfferForCheckout,
} from "@/lib/commerce-catalog.server";
import { isCustomCatConfigured } from "@/lib/customcat.server";
import { isObjectStorageConfigured } from "@/lib/object-storage.server";
import { prisma } from "@/lib/prisma";
import {
  DONATION_TAX_CODE,
  SHIRT_FMV_CENTS,
  SHIRT_TAX_CODE,
  isShirtCheckoutRequest,
  parseShirtCheckoutRequest,
} from "@/lib/shirt-commerce.server";
import {
  isStoreOfferCheckoutRequest,
  parseStoreOfferCheckoutRequest,
} from "@/lib/store-commerce.server";
import { buildReferralUrl, getBaseUrl } from "@/lib/url";
import { getHandleOrReferralCode } from "@/lib/referral.client";

const log = createLogger("stripe-checkout");

export const runtime = "nodejs";

interface CheckoutRequest {
  amount: number;
  donationType: DonationFrequency;
  name?: string;
  email?: string;
  sourceUrl?: string;
  sourceReferrer?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isShirtCommerceEnabled() {
  return serverEnv.SHIRT_COMMERCE_ENABLED === "1" || serverEnv.SHIRT_COMMERCE_ENABLED === "true";
}

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    log.error("STRIPE_SECRET_KEY not configured");
    return NextResponse.json({ error: "Donations are not configured." }, { status: 503 });
  }

  let body: CheckoutRequest;
  try {
    body = (await req.json()) as CheckoutRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (isShirtCheckoutRequest(body)) {
    return createShirtCheckoutSession(body);
  }
  if (isStoreOfferCheckoutRequest(body)) {
    return createStoreOfferCheckoutSession(body);
  }

  const { amount, donationType, name, email, sourceUrl, sourceReferrer } = body;
  const trimmedName = name?.trim() ?? "";
  const trimmedEmail = email?.trim().toLowerCase() ?? "";

  if (!amount || typeof amount !== "number" || amount < 1) {
    return NextResponse.json({ error: "Amount must be at least $1." }, { status: 400 });
  }
  if (!donationType || !["one-time", "monthly"].includes(donationType)) {
    return NextResponse.json({ error: "donationType must be one-time or monthly." }, { status: 400 });
  }
  if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
    return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
  }

  // Strip query/hash from URLs before storing (avoid PII leaks via query params).
  const cleanUrl = typeof sourceUrl === "string" ? sourceUrl.split(/[?#]/)[0].slice(0, 512) : "";
  const cleanReferrer =
    typeof sourceReferrer === "string" ? sourceReferrer.split(/[?#]/)[0].slice(0, 512) : "";

  const stripe = getStripeClient();
  const baseUrl = getBaseUrl();
  const sessionUser = (await getServerSession(authOptions))?.user;
  const donorEmail = sessionUser?.email?.toLowerCase() ?? trimmedEmail;
  const donorName = sessionUser?.name?.trim() ?? trimmedName;
  const metadata: Record<string, string> = {
    donationType,
    sourceUrl: cleanUrl,
    sourceReferrer: cleanReferrer,
    cause: "earth-optimization-prize-and-ops",
  };

  if (donorName) metadata.donorName = donorName.slice(0, 200);
  if (donorEmail) metadata.donorEmail = donorEmail.slice(0, 200);
  if (sessionUser?.id) metadata.userId = sessionUser.id;

  try {
    // Always use dynamic prices keyed off `unit_amount`. Avoids requiring product/price
    // setup in the Stripe dashboard before launch; donations of any amount work day one.
    const session = await stripe.checkout.sessions.create({
      mode: donationType === "monthly" ? "subscription" : "payment",
      payment_method_types: ["card"],
      ...(donorEmail ? { customer_email: donorEmail } : {}),
      ...(sessionUser?.id ? { client_reference_id: sessionUser.id } : {}),
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount * 100),
            product_data: {
              name:
                donationType === "monthly"
                  ? "1% Treaty Monthly Donation"
                  : "1% Treaty Donation",
              description: `Funds the 1% Treaty campaign: hosting, identity verification, fraud prevention, translation, outreach, and public evidence pages. Tax-deductible via ${NONPROFIT.legalName} (EIN ${NONPROFIT.ein}), a U.S. 501(c)(3) public charity.`,
            },
            ...(donationType === "monthly" ? { recurring: { interval: "month" as const } } : {}),
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/donate?canceled=true`,
      metadata,
    });

    log.info("Checkout session created", { sessionId: session.id, amount, donationType });
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    log.error("Failed to create checkout session", error);
    return NextResponse.json({ error: "Failed to start donation flow." }, { status: 500 });
  }
}

async function createShirtCheckoutSession(body: unknown) {
  let order;
  try {
    order = parseShirtCheckoutRequest(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid shirt order." },
      { status: 400 },
    );
  }

  if (!isShirtCommerceEnabled()) {
    return NextResponse.json({ error: "Shirt checkout is not enabled." }, { status: 503 });
  }
  if (!isCustomCatConfigured()) {
    return NextResponse.json({ error: "Shirt fulfillment is not configured." }, { status: 503 });
  }
  if (!isObjectStorageConfigured()) {
    return NextResponse.json({ error: "Shirt artwork storage is not configured." }, { status: 503 });
  }

  const stripe = getStripeClient();
  const baseUrl = getBaseUrl();
  const sessionUser = (await getServerSession(authOptions))?.user;
  const userHandle = getHandleOrReferralCode(sessionUser);
  const handle = userHandle ?? order.handle;
  const donorEmail = sessionUser?.email?.toLowerCase();
  const donorName = sessionUser?.name?.trim();
  const referralUrl = buildReferralUrl(handle, WAR_ON_DISEASE_CANONICAL_ORIGIN);
  const metadata: Record<string, string> = {
    cause: "earth-optimization-prize-and-ops",
    donation_amount_cents: String(order.donationAmountCents),
    donation_tier: order.donationTier,
    fmv_cents: String(SHIRT_FMV_CENTS),
    handle,
    order_type: "shirt",
    referral_url: referralUrl,
    shirt_color: order.shirtColor,
    shirt_size: order.shirtSize,
    sourceReferrer: order.sourceReferrer,
    sourceUrl: order.sourceUrl,
  };

  if (donorName) metadata.donorName = donorName.slice(0, 200);
  if (donorEmail) metadata.donorEmail = donorEmail.slice(0, 200);
  if (sessionUser?.id) metadata.userId = sessionUser.id;

  let catalog;
  try {
    catalog = await getEnabledShirtVariantForCheckout({
      color: order.shirtColor,
      size: order.shirtSize,
    });
  } catch (error) {
    log.error("Managed shirt catalog is not ready", error);
    return NextResponse.json({ error: "Shirt catalog is not ready." }, { status: 503 });
  }

  const shirtFmvCents = catalog.variant.fmvCents ?? catalog.offer.defaultFmvCents;
  const shirtTaxCode = catalog.variant.taxCode ?? catalog.offer.taxCode ?? SHIRT_TAX_CODE;
  const offerTitle = catalog.offer.title;
  const variantTitle = catalog.variant.label;
  const commerceOrder = await prisma.commerceOrder.create({
    data: {
      buyerEmail: donorEmail,
      buyerName: donorName,
      buyerUserId: sessionUser?.id,
      currency: "usd",
      donationCents: order.donationAmountCents,
      fmvCents: shirtFmvCents,
      metadata: {
        handle,
        referralUrl,
        shirtColor: order.shirtColor,
        shirtSize: order.shirtSize,
        sourceReferrer: order.sourceReferrer,
        sourceUrl: order.sourceUrl,
      } satisfies Prisma.InputJsonValue,
      paymentProvider: CommercePaymentProvider.STRIPE,
      purposeKey: "war-on-disease-shirt",
      status: CommerceOrderStatus.PENDING_PAYMENT,
      subtotalCents: order.totalAmountCents,
      totalCents: order.totalAmountCents,
      items: {
        create: {
          currency: "usd",
          fulfillmentKind: CommerceFulfillmentKind.PHYSICAL_GOOD,
          fulfillmentMetadata: {
            customCatCatalogSku: catalog.catalogSku,
            customCatFulfillmentMappingId: catalog.mapping.id,
            handle,
            referralUrl,
            shirtColor: order.shirtColor,
            shirtSize: order.shirtSize,
          } satisfies Prisma.InputJsonValue,
          offerId: catalog.offer.id,
          offerKey: catalog.offer.key,
          offerVariantId: catalog.variant.id,
          offerVariantKey: catalog.variant.variantKey,
          quantity: 1,
          taxable: true,
          taxCode: shirtTaxCode,
          title: `${offerTitle} - ${variantTitle}`,
          totalAmountCents: order.totalAmountCents,
          totalDonationCents: order.donationAmountCents,
          totalFmvCents: shirtFmvCents,
          unitAmountCents: order.totalAmountCents,
          unitDonationCents: order.donationAmountCents,
          unitFmvCents: shirtFmvCents,
        },
      },
    },
    include: { items: true },
  });
  const commerceOrderItem = commerceOrder.items[0];
  if (!commerceOrderItem) {
    throw new Error("Created shirt commerce order without an item.");
  }
  metadata.commerce_order_id = commerceOrder.id;
  metadata.commerce_order_item_id = commerceOrderItem.id;
  metadata.customcat_catalog_sku = catalog.catalogSku;
  metadata.fmv_cents = String(shirtFmvCents);

  const lineItems = [
    {
      price_data: {
        currency: "usd",
        product_data: {
          description: "Fair market value of the campaign shirt.",
          name: "War on Disease shirt fair market value",
          tax_code: shirtTaxCode,
        },
        tax_behavior: "exclusive" as const,
        unit_amount: shirtFmvCents,
      },
      quantity: 1,
    },
    {
      price_data: {
        currency: "usd",
        product_data: {
          description:
            "Tax-deductible contribution above the shirt fair market value.",
          name: "War on Disease tax-deductible contribution",
          tax_code: DONATION_TAX_CODE,
        },
        tax_behavior: "exclusive" as const,
        unit_amount: order.donationAmountCents,
      },
      quantity: 1,
    },
  ];

  try {
    const session = await stripe.checkout.sessions.create({
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      cancel_url: `${baseUrl}/shirt?canceled=true`,
      client_reference_id: sessionUser?.id ?? undefined,
      customer_email: donorEmail,
      line_items: lineItems,
      metadata,
      mode: "payment",
      payment_method_types: ["card"],
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: ["US"] },
      success_url: `${baseUrl}/shirt?ordered=1&session_id={CHECKOUT_SESSION_ID}`,
    });
    await prisma.commerceOrder.update({
      data: {
        stripeCheckoutSessionId: session.id,
      },
      where: { id: commerceOrder.id },
    });

    log.info("Shirt checkout session created", {
      donationAmountCents: order.donationAmountCents,
      commerceOrderId: commerceOrder.id,
      sessionId: session.id,
      shirtColor: order.shirtColor,
      shirtSize: order.shirtSize,
    });
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    await prisma.commerceOrder.update({
      data: {
        attemptCount: { increment: 1 },
        lastError: error instanceof Error ? error.message : String(error),
        status: CommerceOrderStatus.FAILED,
      },
      where: { id: commerceOrder.id },
    });
    log.error("Failed to create shirt checkout session", error);
    return NextResponse.json({ error: "Failed to start shirt order." }, { status: 500 });
  }
}

async function createStoreOfferCheckoutSession(body: unknown) {
  const bodyRecord = body as Record<string, unknown>;
  const offerKey =
    typeof bodyRecord.offer_key === "string"
      ? bodyRecord.offer_key.trim()
      : typeof bodyRecord.offerKey === "string"
        ? bodyRecord.offerKey.trim()
        : "";
  const variantKey =
    typeof bodyRecord.variant_key === "string"
      ? bodyRecord.variant_key.trim()
      : typeof bodyRecord.variantKey === "string"
        ? bodyRecord.variantKey.trim()
        : undefined;

  let catalog;
  try {
    catalog = await getEnabledStoreOfferForCheckout({ offerKey, variantKey });
  } catch (error) {
    log.error("Managed store catalog is not ready", error);
    return NextResponse.json({ error: "Store catalog is not ready." }, { status: 503 });
  }

  let order;
  try {
    order = parseStoreOfferCheckoutRequest(body, catalog);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid store order." },
      { status: 400 },
    );
  }

  if (order.fulfillmentKind === CommerceFulfillmentKind.PHYSICAL_GOOD) {
    return NextResponse.json(
      { error: "Physical store offers need a product-specific checkout path." },
      { status: 400 },
    );
  }

  const stripe = getStripeClient();
  const baseUrl = getBaseUrl();
  const sessionUser = (await getServerSession(authOptions))?.user;
  const donorEmail = sessionUser?.email?.toLowerCase();
  const donorName = sessionUser?.name?.trim();
  const offerPath = `/store/${encodeURIComponent(catalog.offer.key)}`;
  const metadata: Record<string, string> = {
    cause: "earth-optimization-prize-and-ops",
    donation_amount_cents: String(order.donationAmountCents),
    fmv_cents: String(order.fmvCents),
    offer_key: catalog.offer.key,
    order_type: "store_offer",
    sourceReferrer: order.sourceReferrer,
    sourceUrl: order.sourceUrl,
  };

  if (catalog.variant) metadata.variant_key = catalog.variant.variantKey;
  if (donorName) metadata.donorName = donorName.slice(0, 200);
  if (donorEmail) metadata.donorEmail = donorEmail.slice(0, 200);
  if (sessionUser?.id) metadata.userId = sessionUser.id;

  const commerceOrder = await prisma.commerceOrder.create({
    data: {
      buyerEmail: donorEmail,
      buyerName: donorName,
      buyerUserId: sessionUser?.id,
      currency: catalog.offer.currency,
      donationCents: order.donationAmountCents,
      fmvCents: order.fmvCents,
      metadata: {
        offerKey: catalog.offer.key,
        sourceReferrer: order.sourceReferrer,
        sourceUrl: order.sourceUrl,
        variantKey: catalog.variant?.variantKey,
      } satisfies Prisma.InputJsonValue,
      paymentProvider: CommercePaymentProvider.STRIPE,
      purposeKey: catalog.offer.key,
      status: CommerceOrderStatus.PENDING_PAYMENT,
      subtotalCents: order.totalAmountCents,
      totalCents: order.totalAmountCents,
      items: {
        create: {
          currency: catalog.offer.currency,
          fulfillmentKind: order.fulfillmentKind,
          offerId: catalog.offer.id,
          offerKey: catalog.offer.key,
          offerVariantId: catalog.variant?.id,
          offerVariantKey: catalog.variant?.variantKey,
          quantity: 1,
          taxable: order.fmvCents > 0,
          taxCode: order.taxCode,
          title: order.title,
          totalAmountCents: order.totalAmountCents,
          totalDonationCents: order.donationAmountCents,
          totalFmvCents: order.fmvCents,
          unitAmountCents: order.totalAmountCents,
          unitDonationCents: order.donationAmountCents,
          unitFmvCents: order.fmvCents,
        },
      },
    },
    include: { items: true },
  });
  const commerceOrderItem = commerceOrder.items[0];
  if (!commerceOrderItem) {
    throw new Error("Created store commerce order without an item.");
  }
  metadata.commerce_order_id = commerceOrder.id;
  metadata.commerce_order_item_id = commerceOrderItem.id;

  const productDescription =
    catalog.offer.description ?? "Funds the International Campaign to End War and Disease.";

  try {
    const session = await stripe.checkout.sessions.create({
      billing_address_collection: "auto",
      cancel_url: `${baseUrl}${offerPath}?canceled=true`,
      client_reference_id: sessionUser?.id ?? undefined,
      customer_email: donorEmail,
      line_items: [
        {
          price_data: {
            currency: catalog.offer.currency,
            product_data: {
              description: productDescription,
              name: order.title,
              ...(order.taxCode ? { tax_code: order.taxCode } : {}),
            },
            tax_behavior: order.fmvCents > 0 ? ("exclusive" as const) : undefined,
            unit_amount: order.totalAmountCents,
          },
          quantity: 1,
        },
      ],
      metadata,
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${baseUrl}${offerPath}?ordered=1&session_id={CHECKOUT_SESSION_ID}`,
    });
    await prisma.commerceOrder.update({
      data: {
        stripeCheckoutSessionId: session.id,
      },
      where: { id: commerceOrder.id },
    });

    log.info("Store checkout session created", {
      commerceOrderId: commerceOrder.id,
      offerKey: catalog.offer.key,
      sessionId: session.id,
    });
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    await prisma.commerceOrder.update({
      data: {
        attemptCount: { increment: 1 },
        lastError: error instanceof Error ? error.message : String(error),
        status: CommerceOrderStatus.FAILED,
      },
      where: { id: commerceOrder.id },
    });
    log.error("Failed to create store checkout session", error);
    return NextResponse.json({ error: "Failed to start store checkout." }, { status: 500 });
  }
}
