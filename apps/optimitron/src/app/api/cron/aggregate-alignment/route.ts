import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { computeAggregateAlignmentScores } from "@/lib/aggregate-alignment.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await computeAggregateAlignmentScores("US");
    return NextResponse.json(result);
  } catch (error) {
    console.error("[AGGREGATE ALIGNMENT CRON] Error:", error);
    return NextResponse.json(
      { error: "Failed to compute aggregate alignment scores." },
      { status: 500 },
    );
  }
}
