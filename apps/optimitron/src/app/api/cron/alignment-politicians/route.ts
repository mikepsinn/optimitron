import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { syncAlignmentBenchmarkPoliticians } from "@/lib/alignment-politicians.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAlignmentBenchmarkPoliticians();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[ALIGNMENT POLITICIAN CRON] Error:", error);
    return NextResponse.json(
      { error: "Failed to sync alignment politicians." },
      { status: 500 },
    );
  }
}
