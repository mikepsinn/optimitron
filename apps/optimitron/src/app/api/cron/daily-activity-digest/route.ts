import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { publishDailyActivityDigest } from "@/lib/daily-activity-digest.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await publishDailyActivityDigest();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[DAILY ACTIVITY DIGEST CRON] Error:", error);
    return NextResponse.json({ error: "Failed to publish daily activity digest." }, { status: 500 });
  }
}
