/** REST v1: answer tracking reminder notifications. */
import {
  respondToTrackingReminderForUser,
  respondToTrackingReminderNotificationsForUser,
} from "@optimitron/tracking";
import { NextResponse } from "next/server";

import { requireTrackingAuth } from "@/lib/api/require-auth";
import {
  readJsonObject,
  trackingErrorResponse,
} from "@/lib/api/request-helpers";

// A top-level trackingReminderId answers one reminder; without it the body
// is a batch (defaultStatus and/or except entries).
export async function POST(req: Request) {
  const auth = await requireTrackingAuth(req);
  if (auth instanceof Response) return auth;
  try {
    const body = await readJsonObject(req);
    if (body.trackingReminderId !== undefined) {
      return NextResponse.json({
        result: await respondToTrackingReminderForUser(body, auth.userId),
      });
    }
    return NextResponse.json(
      await respondToTrackingReminderNotificationsForUser(body, auth.userId),
    );
  } catch (error) {
    return trackingErrorResponse(error, "POST /api/v1/notifications/respond");
  }
}
