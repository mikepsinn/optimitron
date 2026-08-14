/** REST v1: the authenticated user's tracking reminder notification queue. */
import { listTrackingReminderNotificationsForUser } from "@optimitron/tracking";
import { NextResponse } from "next/server";

import { requireTrackingAuth } from "@/lib/api/require-auth";
import { queryInput, trackingErrorResponse } from "@/lib/api/request-helpers";

// compact=true is applied inside listTrackingReminderNotificationsForUser,
// matching the MCP handler for listTrackingReminderNotifications.
export async function GET(req: Request) {
  const auth = await requireTrackingAuth(req);
  if (auth instanceof Response) return auth;
  try {
    const input = queryInput(new URL(req.url), {
      booleans: ["compact", "includeCompleted"],
      strings: [
        "dateKey",
        "startDateKey",
        "endDateKey",
        "status",
        "trackingReminderId",
      ],
    });
    return NextResponse.json(
      await listTrackingReminderNotificationsForUser(input, auth.userId),
    );
  } catch (error) {
    return trackingErrorResponse(error, "GET /api/v1/notifications");
  }
}
