import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { refreshUserDownstreamCache } from "@/lib/jobs/refresh-user-downstream-cache.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Weekly drift-correction audit; primary counts increment on conversion in the referral handler.
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshUserDownstreamCache();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[USER DOWNSTREAM CACHE CRON] Error:", error);
    return NextResponse.json(
      { error: "Failed to refresh user downstream cache." },
      { status: 500 },
    );
  }
}
