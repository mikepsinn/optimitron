import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { runAggregation } from "@/lib/aggregate-relationships.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAggregation();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[AGGREGATE CRON] Error:", error);
    return NextResponse.json(
      { error: "Failed to aggregate relationships." },
      { status: 500 },
    );
  }
}
