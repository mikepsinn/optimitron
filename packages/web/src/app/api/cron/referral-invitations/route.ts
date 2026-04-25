import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { createLogger } from "@/lib/logger";
import { processDueReferralInvitationRecipientEmails } from "@/lib/referral-invitations.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const log = createLogger("referral-invitation-cron");

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueReferralInvitationRecipientEmails();
    return NextResponse.json(result);
  } catch (error) {
    log.error("Failed to process referral invitation sequence", error);
    return NextResponse.json(
      { error: "Failed to process referral invitation sequence." },
      { status: 500 },
    );
  }
}
