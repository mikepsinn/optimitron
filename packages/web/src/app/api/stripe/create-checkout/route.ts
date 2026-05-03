import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import type { DonationFrequency } from "@/lib/stripe";
import { createLogger } from "@/lib/logger";
import { getBaseUrl } from "@/lib/url";

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
  const cleanUrl = typeof sourceUrl === "string" ? sourceUrl.split(/[?#]/)[0]!.slice(0, 512) : "";
  const cleanReferrer =
    typeof sourceReferrer === "string" ? sourceReferrer.split(/[?#]/)[0]!.slice(0, 512) : "";

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
              description:
                "Funds the 1% Treaty campaign: hosting, identity verification, fraud prevention, translation, outreach, and public evidence pages. Tax-deductible via the Institute for Accelerated Medicine, a U.S. 501(c)(3).",
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
