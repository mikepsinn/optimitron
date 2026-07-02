import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { retryDueTaskPayouts } from "@/lib/task-payouts.server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await retryDueTaskPayouts();
  return NextResponse.json({ data: result, success: true });
}
