import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { publishMonthlyChainDigest } from "@/lib/email/monthly-chain-digest.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await publishMonthlyChainDigest();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[MONTHLY CHAIN DIGEST CRON] Error:", error);
    return NextResponse.json(
      { error: "Failed to publish monthly chain digest." },
      { status: 500 },
    );
  }
}
