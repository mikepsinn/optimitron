import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getStripeConnectStatus } from "@/lib/stripe-connect.server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { userId } = await requireAuth(request);
    const url = new URL(request.url);
    const status = await getStripeConnectStatus(userId, {
      sync: url.searchParams.get("sync") === "1",
    });

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
            : "Failed to load Stripe Connect status.",
      },
      { status: 400 },
    );
  }
}
