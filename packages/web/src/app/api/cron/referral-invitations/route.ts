import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import {
  processDueReferralInvitationRecipientEmails,
  processDueReferralInvitationSenderEmails,
} from "@/lib/email/referral-invitation-emails.server";
import { createLogger } from "@/lib/logger";
import {
  processDueTreatyMonthlyScorecardEmails,
  processDueTreatyNeverSharedReengagementEmails,
} from "@/lib/email/treaty-sender-emails.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const log = createLogger("referral-invitation-cron");

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [recipientEmails, senderEmails, reengagementEmails, monthlyScorecardEmails] = await Promise.all([
      processDueReferralInvitationRecipientEmails(),
      processDueReferralInvitationSenderEmails(),
      processDueTreatyNeverSharedReengagementEmails(),
      processDueTreatyMonthlyScorecardEmails(),
    ]);
    return NextResponse.json({
      recipientEmails,
      senderEmails,
      reengagementEmails,
      monthlyScorecardEmails,
    });
  } catch (error) {
    log.error("Failed to process referral invitation sequence", error);
    return NextResponse.json(
      { error: "Failed to process referral invitation sequence." },
      { status: 500 },
    );
  }
}
