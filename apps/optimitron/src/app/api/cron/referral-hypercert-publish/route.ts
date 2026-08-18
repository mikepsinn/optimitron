import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { publishReferralHypercerts } from "@/lib/referral-hypercert-publication.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await publishReferralHypercerts();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[REFERRAL HYPERCERT CRON] Error:", error);
    return NextResponse.json({ error: "Failed to publish referral hypercerts." }, { status: 500 });
  }
}
