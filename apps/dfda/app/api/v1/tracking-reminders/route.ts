/** REST v1: the authenticated user's tracking reminders. */
import {
  listTrackingRemindersForUser,
  upsertTrackingReminderForUser,
} from "@optimitron/tracking";
import { NextResponse } from "next/server";

import { requireTrackingAuth } from "@/lib/api/require-auth";
import {
  queryInput,
  readJsonObject,
  trackingErrorResponse,
} from "@/lib/api/request-helpers";

export async function GET(req: Request) {
  const auth = await requireTrackingAuth(req);
  if (auth instanceof Response) return auth;
  try {
    const input = queryInput(new URL(req.url), {
      booleans: ["includeInactive"],
    });
    return NextResponse.json({
      reminders: await listTrackingRemindersForUser(input, auth.userId),
    });
  } catch (error) {
    return trackingErrorResponse(error, "GET /api/v1/tracking-reminders");
  }
}

// The upsert result does not distinguish created from updated, so both
// return 200 (matching the MCP tool).
export async function POST(req: Request) {
  const auth = await requireTrackingAuth(req);
  if (auth instanceof Response) return auth;
  try {
    const body = await readJsonObject(req);
    return NextResponse.json({
      result: await upsertTrackingReminderForUser(body, auth.userId),
    });
  } catch (error) {
    return trackingErrorResponse(error, "POST /api/v1/tracking-reminders");
  }
}
