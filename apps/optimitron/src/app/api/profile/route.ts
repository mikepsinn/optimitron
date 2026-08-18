import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import { saveProfileSnapshot } from "@/lib/profile.server";
import { grantWishes } from "@/lib/wishes.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth(request, [McpScope.TASKS_PERSONAL]);
    const body = await request.json();
    const data = await saveProfileSnapshot(userId, body);

    // Grant wish points for census snapshot
    let wishesEarned = 0;
    try {
      const wishResult = await grantWishes({
        userId,
        reason: "CENSUS_SNAPSHOT",
        amount: 5,
        dedupeKey: "census",
      });
      if (wishResult) wishesEarned = wishResult.amount;
    } catch (wishError) {
      console.error("[PROFILE] Wish grant error:", wishError);
    }

    return NextResponse.json({ data, success: true, wishesEarned });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid profile data.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    console.error("[PROFILE] Failed to save profile:", error);
    return NextResponse.json({ error: "Failed to save profile." }, { status: 500 });
  }
}
