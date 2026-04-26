import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { ActivityType } from "@optimitron/db";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { serverEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const log = createLogger("stripe-webhook");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
  const signature = (await headers()).get("stripe-signature");

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
        if (session.mode === "payment" || session.mode === "subscription") {
          await recordDonationActivity(session);
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
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

async function recordDonationActivity(session: Stripe.Checkout.Session) {
  const donorEmail =
    session.metadata?.donorEmail ?? session.customer_email ?? session.customer_details?.email ?? null;
  const donorName = session.metadata?.donorName ?? session.customer_details?.name ?? null;
  const donationType = (session.metadata?.donationType as string | undefined) ?? "one-time";
  const amountCents = session.amount_total ?? 0;
  const sourceUrl = (session.metadata?.sourceUrl as string | undefined) ?? null;
  const sourceReferrer = (session.metadata?.sourceReferrer as string | undefined) ?? null;

  // Attribute to a user account when the donor email matches one.
  const user = donorEmail
    ? await prisma.user.findUnique({
        where: { email: donorEmail.toLowerCase() },
        select: { id: true },
      })
    : null;

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
