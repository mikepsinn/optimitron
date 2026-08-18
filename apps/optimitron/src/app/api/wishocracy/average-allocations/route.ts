import { NextResponse } from "next/server";
import { getWishocracyCommunitySummary } from "@/lib/wishocracy-community";

export async function GET() {
  try {
    const summary = await getWishocracyCommunitySummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Failed to calculate average allocations:", error);
    return NextResponse.json(
      { error: "Failed to fetch average allocations." },
      { status: 500 },
    );
  }
}
