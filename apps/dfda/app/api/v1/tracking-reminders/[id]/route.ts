/** REST v1: read or archive one of the user's tracking reminders. */
import {
  getTrackingReminderForUser,
  upsertTrackingReminderForUser,
} from "@optimitron/tracking";
import { NextResponse } from "next/server";

import { requireTrackingAuth } from "@/lib/api/require-auth";
import { trackingErrorResponse } from "@/lib/api/request-helpers";

// GET returns the full reminder, including untruncated instructions; the
// list endpoint returns the compact shape by default.
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireTrackingAuth(req);
  if (auth instanceof Response) return auth;
  try {
    const { id } = await context.params;
    return NextResponse.json(
      await getTrackingReminderForUser({ trackingReminderId: id }, auth.userId),
    );
  } catch (error) {
    return trackingErrorResponse(error, "GET /api/v1/tracking-reminders/[id]");
  }
}

// DELETE archives the reminder (active: false). It does not hard-delete:
// the MCP surface has no hard-delete either, and past notifications and
// measurements keep pointing at the reminder.
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireTrackingAuth(req);
  if (auth instanceof Response) return auth;
  try {
    const { id } = await context.params;
    return NextResponse.json({
      result: await upsertTrackingReminderForUser(
        { active: false, trackingReminderId: id },
        auth.userId,
      ),
    });
  } catch (error) {
    return trackingErrorResponse(error, "DELETE /api/v1/tracking-reminders/[id]");
  }
}
