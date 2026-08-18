import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { getWeeklyMetricsSnapshot } from "@/lib/weekly-metrics.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Weekly funnel snapshot for the improvement loop. Pulled by the
 * weekly-metrics GitHub Actions workflow (which owns Slack delivery and CI
 * health), not pushed from here — the webhook secret lives in Actions.
 * CRON_SECRET-guarded like every other operational endpoint: these are
 * internal counts, not public scoreboard numbers.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await getWeeklyMetricsSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("[WEEKLY METRICS] Error:", error);
    return NextResponse.json(
      { error: "Failed to compute weekly metrics." },
      { status: 500 },
    );
  }
}
