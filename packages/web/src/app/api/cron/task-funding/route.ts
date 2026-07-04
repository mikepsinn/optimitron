import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import {
  markExpiredTargets,
  refundDeadTargetFunding,
  retryCallableCharges,
} from "@/lib/task-funding/escrow.server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Expire first so freshly-expired targets are swept for refunds in the same
  // pass; charge retries only touch THRESHOLD_MET targets, never dead ones.
  const targetsExpired = await markExpiredTargets();
  const charges = await retryCallableCharges();
  const refunds = await refundDeadTargetFunding();

  return NextResponse.json({
    data: { charges, refunds, targetsExpired },
    success: true,
  });
}
