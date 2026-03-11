import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { processDueReferralSequenceEmails } from "@/lib/referral-email.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueReferralSequenceEmails();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[REFERRAL CRON] Error:", error);
    return NextResponse.json({ error: "Failed to process referral sequence." }, { status: 500 });
  }
}
