import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { saveDailyCheckIn } from "@/lib/profile.server";
import { grantWishes } from "@/lib/wishes.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const data = await saveDailyCheckIn(userId, body);

    // Grant wish points for daily check-in
    let wishesEarned = 0;
    try {
      const wishResult = await grantWishes({
        userId,
        reason: "DAILY_CHECKIN",
        amount: 1,
        dedupeKey: new Date().toISOString().slice(0, 10),
      });
      if (wishResult) wishesEarned = wishResult.amount;
    } catch (wishError) {
      console.error("[DAILY CHECKIN] Wish grant error:", wishError);
    }

    return NextResponse.json({ data, success: true, wishesEarned });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid check-in data.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    console.error("[PROFILE] Failed to save daily check-in:", error);
    return NextResponse.json({ error: "Failed to save daily check-in." }, { status: 500 });
  }
}
