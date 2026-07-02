import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import {
  getOrCreateStripeConnectedAccount,
  getStripeConnectStatus,
} from "@/lib/stripe-connect.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth(request);
    await getOrCreateStripeConnectedAccount(userId);
    const status = await getStripeConnectStatus(userId, { sync: true });
    return NextResponse.json({ data: status, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create Stripe connected account.",
      },
      { status: 400 },
    );
  }
}
