/** REST v1: per-user settings for one tracked variable. */
import { updateTrackingVariableSettingsForUser } from "@optimitron/tracking";
import { NextResponse } from "next/server";

import { requireTrackingAuth } from "@/lib/api/require-auth";
import {
  readJsonObject,
  trackingErrorResponse,
} from "@/lib/api/request-helpers";

// Updates the user's own NOf1Variable overrides only; the canonical
// GlobalVariable is never modified.
export async function PATCH(
  req: Request,
  context: { params: Promise<{ globalVariableId: string }> },
) {
  const auth = await requireTrackingAuth(req);
  if (auth instanceof Response) return auth;
  try {
    const { globalVariableId } = await context.params;
    const body = await readJsonObject(req);
    return NextResponse.json({
      variable: await updateTrackingVariableSettingsForUser(
        { ...body, globalVariableId },
        auth.userId,
      ),
    });
  } catch (error) {
    return trackingErrorResponse(
      error,
      "PATCH /api/v1/variables/[globalVariableId]",
    );
  }
}
