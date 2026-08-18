import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { grantWishes } from "@/lib/wishes.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    let templateLabel: string | undefined;
    try {
      const body = await request.json();
      templateLabel = typeof body.templateLabel === "string" ? body.templateLabel : undefined;
    } catch {
      // Empty body is fine — templateLabel is optional
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: true, tracked: false, wishesEarned: 0 });
    }

    // Grant wish points for sharing (one-time per user)
    let wishesEarned = 0;
    try {
      const wishResult = await grantWishes({
        userId: currentUser.id,
        reason: "SHARE_REPORT",
        amount: 1,
        dedupeKey: "share-" + currentUser.id,
        metadata: templateLabel ? { templateLabel } : undefined,
      });
      if (wishResult) wishesEarned = wishResult.amount;
    } catch (wishError) {
      console.error("[SHARE TRACK] Wish grant error:", wishError);
    }

    return NextResponse.json({ success: true, tracked: true, wishesEarned });
  } catch (error) {
    console.error("[SHARE TRACK] Failed:", error);
    return NextResponse.json({ error: "Failed to track share." }, { status: 500 });
  }
}
