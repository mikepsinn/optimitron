import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import {
  ActivityType,
  CommerceFulfillmentKind,
  CommerceFulfillmentProvider,
  CommerceFulfillmentStatus,
  CommerceOrderStatus,
  TaskFundingPaymentStatus,
  type Prisma,
} from "@optimitron/db";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { serverEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { fulfillShirtCheckoutSession } from "@/lib/shirt-fulfillment.server";
import {
  handlePledgeSetupSessionCompleted,
  maybeChargeCallablePledges,
  settlePledgeCallPaymentIntent,
  TASK_FUNDING_PLEDGE_SETUP_KIND,
} from "@/lib/task-funding/escrow.server";
import { issuePaidContributionReceipt } from "@/lib/task-funding/contribution-receipts.server";
import {
  recordTaskFundingChargeDisputed,
  recordTaskFundingChargeRefunded,
  recordTaskFundingCheckoutFailed,
  recordTaskFundingCheckoutPaid,
  TASK_FUNDING_ORDER_TYPE,
} from "@/lib/task-funding/payments.server";

const log = createLogger("stripe-webhook");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { message: "Webhook endpoint is ready. Use POST for webhook events." },
    { status: 200 },
  );
}

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  }
  if (!serverEnv.STRIPE_WEBHOOK_SECRET) {
    log.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
  }

  const body = await req.text();
  const signature =
    req.headers.get("stripe-signature") ?? (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(
      body,
      signature,
      serverEnv.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    log.error("Webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  log.info("Webhook event verified", { type: event.type });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (
          session.mode === "setup" &&
          session.metadata?.kind === TASK_FUNDING_PLEDGE_SETUP_KIND
        ) {
          await handlePledgeSetupSessionCompleted(session);
          break;
        }
        if (session.metadata?.order_type === TASK_FUNDING_ORDER_TYPE) {
          await settleTaskFundingCheckoutPaid(session);
          break;
        }
        if (session.metadata?.order_type === "shirt") {
          await fulfillShirtCheckoutSession(session);
          break;
        }
        if (session.metadata?.order_type === "store_offer") {
          await recordStoreOfferPayment(session);
          break;
        }
        if (session.mode === "payment" || session.mode === "subscription") {
          await recordDonationActivity(session);
        }
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.order_type === TASK_FUNDING_ORDER_TYPE) {
          await settleTaskFundingCheckoutPaid(session);
        }
        break;
      }
      case "payment_intent.succeeded":
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Only off-session pledge-call charges carry pledgeId metadata;
        // pay-now checkout intents settle through their checkout.session
        // events instead.
        if (
          paymentIntent.metadata?.order_type === TASK_FUNDING_ORDER_TYPE &&
          paymentIntent.metadata?.pledgeId
        ) {
          await settlePledgeCallPaymentIntent(paymentIntent);
        }
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.order_type === TASK_FUNDING_ORDER_TYPE) {
          await recordTaskFundingCheckoutFailed(
            session,
            TaskFundingPaymentStatus.FAILED,
          );
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.order_type === TASK_FUNDING_ORDER_TYPE) {
          await recordTaskFundingCheckoutFailed(
            session,
            TaskFundingPaymentStatus.CANCELED,
          );
        }
        break;
      }
      case "charge.refunded": {
        await recordTaskFundingChargeRefunded(event.data.object as Stripe.Charge);
        break;
      }
      case "charge.dispute.created": {
        await recordTaskFundingChargeDisputed(
          event.data.object as Stripe.Dispute,
        );
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        log.info("Recurring donation invoice succeeded", {
          customerEmail: invoice.customer_email,
          amount: invoice.amount_paid,
        });
        break;
      }
      default:
        log.debug("Unhandled webhook event", { type: event.type });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    log.error("Webhook handler error", error);
    return NextResponse.json({ error: "Webhook handler error." }, { status: 500 });
  }
}

function getStripeObjectId(value: string | { id?: string | null } | null | undefined) {
  if (typeof value === "string") return value;
  return value?.id ?? undefined;
}

/**
 * Paid checkout money counts toward the fully-funded-for-charging threshold,
 * so a successful pay-now payment may make card-backed pledges callable.
 */
async function settleTaskFundingCheckoutPaid(session: Stripe.Checkout.Session) {
  const payment = await recordTaskFundingCheckoutPaid(session);
  if (payment.status !== TaskFundingPaymentStatus.PAID) return;
  await maybeChargeCallablePledges(payment.targetId);
  await issuePaidContributionReceipt(payment.id);
}

async function recordStoreOfferPayment(session: Stripe.Checkout.Session) {
  const predicates: Prisma.CommerceOrderWhereInput[] = [
    { stripeCheckoutSessionId: session.id },
  ];
  if (session.metadata?.commerce_order_id) {
    predicates.unshift({ id: session.metadata.commerce_order_id });
  }

  const commerceOrder = await prisma.commerceOrder.findFirst({
    include: { items: true },
    where: {
      OR: predicates,
      deletedAt: null,
    },
  });

  if (!commerceOrder) {
    throw new Error(`Missing commerce order for Stripe Checkout session ${session.id}.`);
  }

  const customerEmail =
    session.metadata?.donorEmail ?? session.customer_email ?? session.customer_details?.email ?? null;
  const customerName = session.metadata?.donorName ?? session.customer_details?.name ?? null;

  await prisma.commerceOrder.update({
    data: {
      buyerEmail: commerceOrder.buyerEmail ?? customerEmail,
      buyerName: commerceOrder.buyerName ?? customerName,
      lastError: null,
      paidAt: commerceOrder.paidAt ?? new Date(),
      status: CommerceOrderStatus.PAID,
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: getStripeObjectId(session.customer),
      stripePaymentIntentId: getStripeObjectId(session.payment_intent),
    },
    where: { id: commerceOrder.id },
  });

  const manualItem = commerceOrder.items.find(
    (item) => item.fulfillmentKind === CommerceFulfillmentKind.MANUAL_SPONSORSHIP,
  );
  if (!manualItem) return;

  const existingFulfillment = await prisma.commerceFulfillment.findFirst({
    where: {
      deletedAt: null,
      externalOrderId: session.id,
      provider: CommerceFulfillmentProvider.MANUAL,
    },
  });
  if (existingFulfillment) return;

  await prisma.commerceFulfillment.create({
    data: {
      externalOrderId: session.id,
      metadata: {
        commerceOrderId: commerceOrder.id,
        commerceOrderItemId: manualItem.id,
        offerKey: manualItem.offerKey,
        offerVariantKey: manualItem.offerVariantKey,
        stripeCheckoutSessionId: session.id,
      } satisfies Prisma.InputJsonValue,
      orderId: commerceOrder.id,
      orderItemId: manualItem.id,
      provider: CommerceFulfillmentProvider.MANUAL,
      status: CommerceFulfillmentStatus.PENDING,
    },
  });
}

async function recordDonationActivity(session: Stripe.Checkout.Session) {
  const donorEmail =
    session.metadata?.donorEmail ?? session.customer_email ?? session.customer_details?.email ?? null;
  const donorName = session.metadata?.donorName ?? session.customer_details?.name ?? null;
  const donationType = session.metadata?.donationType ?? "one-time";
  const amountCents = session.amount_total ?? 0;
  const sourceUrl = session.metadata?.sourceUrl ?? null;
  const sourceReferrer = session.metadata?.sourceReferrer ?? null;
  const metadataUserId = session.metadata?.userId ?? null;

  let user = metadataUserId
    ? await prisma.user.findUnique({
        where: { id: metadataUserId },
        select: { id: true },
      })
    : null;

  if (!user && donorEmail) {
    user = await prisma.user.findUnique({
      where: { email: donorEmail.toLowerCase() },
      select: { id: true },
    });
  }

  if (!user) {
    log.info("Donation completed by non-user", {
      donorEmail,
      amountCents,
      donationType,
    });
    return;
  }

  await prisma.activity.create({
    data: {
      userId: user.id,
      type: ActivityType.DONATED,
      description: "",
      entityType: "StripeCheckoutSession",
      entityId: session.id,
      metadata: JSON.stringify({
        amountCents,
        currency: session.currency,
        donationType,
        donorEmail,
        donorName,
        sourceUrl,
        sourceReferrer,
        cause: "earth-optimization-prize-and-ops",
      }),
    },
  });

  log.info("Donation activity recorded", {
    userId: user.id,
    amountCents,
    donationType,
  });
}
