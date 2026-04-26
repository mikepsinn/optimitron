import { NextResponse } from "next/server";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import type { DonationFrequency } from "@/lib/stripe";
import { createLogger } from "@/lib/logger";
import { getBaseUrl } from "@/lib/url";

const log = createLogger("stripe-checkout");

export const runtime = "nodejs";

interface CheckoutRequest {
  amount: number;
  donationType: DonationFrequency;
  name: string;
  email: string;
  sourceUrl?: string;
  sourceReferrer?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const { amount, donationType, name, email, sourceUrl, sourceReferrer } = body;

  if (!amount || typeof amount !== "number" || amount < 1) {
    return NextResponse.json({ error: "Amount must be at least $1." }, { status: 400 });
  }
  if (!donationType || !["one-time", "monthly"].includes(donationType)) {
    return NextResponse.json({ error: "donationType must be one-time or monthly." }, { status: 400 });
  }
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
  }

  // Strip query/hash from URLs before storing (avoid PII leaks via query params).
  const cleanUrl = typeof sourceUrl === "string" ? sourceUrl.split(/[?#]/)[0]!.slice(0, 512) : "";
  const cleanReferrer =
    typeof sourceReferrer === "string" ? sourceReferrer.split(/[?#]/)[0]!.slice(0, 512) : "";

  const stripe = getStripeClient();
  const baseUrl = getBaseUrl();

  try {
    // Always use dynamic prices keyed off `unit_amount`. Avoids requiring product/price
    // setup in the Stripe dashboard before launch; donations of any amount work day one.
    const session = await stripe.checkout.sessions.create({
      mode: donationType === "monthly" ? "subscription" : "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount * 100),
            product_data: {
              name:
                donationType === "monthly"
                  ? "Monthly donation — global 1% Treaty referendum"
                  : "Donation — global 1% Treaty referendum",
              description:
                "Funds the global 1% Treaty referendum: hosting, identity verification, fraud prevention, translation, outreach, and public evidence pages. Tax-deductible via the Institute for Accelerated Medicine 501(c)(3).",
            },
            ...(donationType === "monthly" ? { recurring: { interval: "month" as const } } : {}),
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/donate?canceled=true`,
      metadata: {
        donorName: name.slice(0, 200),
        donorEmail: email.slice(0, 200),
        donationType,
        sourceUrl: cleanUrl,
        sourceReferrer: cleanReferrer,
        cause: "earth-optimization-prize-and-ops",
      },
    });

    log.info("Checkout session created", { sessionId: session.id, amount, donationType });
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    log.error("Failed to create checkout session", error);
    return NextResponse.json({ error: "Failed to start donation flow." }, { status: 500 });
  }
}
