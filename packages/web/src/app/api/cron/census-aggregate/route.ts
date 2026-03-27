import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { aggregateCensusData } from "@/lib/census-aggregation.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/cron/census-aggregate
 *
 * Aggregates welfare metrics per jurisdiction from census profile data
 * and daily check-in measurements. Applies k-anonymity (min 5 users).
 * Publishes results to Storacha if configured.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await aggregateCensusData();

    // Publish to Storacha if configured
    let storachaCid: string | undefined;
    if (result.jurisdictions.length > 0) {
      try {
        const { getStorachaClient } = await import("@/lib/storacha");
        const client = await getStorachaClient();

        if (client) {
          const { uploadJson } = await import("@optimitron/storage");
          const snapshot = {
            type: "census-welfare-aggregate" as const,
            timestamp: new Date().toISOString(),
            jurisdictions: result.jurisdictions,
            totalParticipants: result.totalParticipants,
            totalVerified: result.totalVerified,
          };
          storachaCid = await uploadJson(client, snapshot);
        }
      } catch (storachaError) {
        console.error("[CENSUS AGGREGATE] Storacha publish failed:", storachaError);
      }
    }

    return NextResponse.json({ ...result, storachaCid });
  } catch (error) {
    console.error("[CENSUS AGGREGATE] Error:", error);
    return NextResponse.json(
      { error: "Failed to aggregate census data." },
      { status: 500 },
    );
  }
}
