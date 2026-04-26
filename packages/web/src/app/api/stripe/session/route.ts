import { NextResponse } from "next/server";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { createLogger } from "@/lib/logger";

const log = createLogger("stripe-session");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Donations are not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required." }, { status: 400 });
  }

  try {
    const session = await getStripeClient().checkout.sessions.retrieve(sessionId);
    return NextResponse.json({
      id: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_email ?? session.customer_details?.email ?? null,
      payment_status: session.payment_status,
      mode: session.mode,
      metadata: session.metadata,
    });
  } catch (error) {
    log.error("Failed to retrieve session", error);
    return NextResponse.json({ error: "Failed to retrieve session." }, { status: 500 });
  }
}
