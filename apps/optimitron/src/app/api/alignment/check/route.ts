import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getPersonalAlignmentState } from "@/lib/alignment-report.server";
import { grantWishes } from "@/lib/wishes.server";
import { checkBadgesAfterWish } from "@/lib/badges.server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const { userId } = await requireAuth();
    const state = await getPersonalAlignmentState(userId);

    if (state.status !== "ready") {
      return NextResponse.json(
        { error: "Complete some budget allocations first to generate your alignment report." },
        { status: 400 },
      );
    }

    // Grant wish points for checking alignment (one-time per user)
    let wishesEarned = 0;
    try {
      const wishResult = await grantWishes({
        userId,
        reason: "ALIGNMENT_CHECK",
        amount: 2,
        dedupeKey: "alignment-" + userId,
      });
      if (wishResult) wishesEarned = wishResult.amount;
      void checkBadgesAfterWish(userId, "ALIGNMENT_CHECK");
    } catch (wishError) {
      console.error("[ALIGNMENT CHECK] Wish grant error:", wishError);
    }

    return NextResponse.json({ success: true, wishesEarned });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[ALIGNMENT CHECK] Failed:", error);
    return NextResponse.json({ error: "Failed to check alignment." }, { status: 500 });
  }
}
