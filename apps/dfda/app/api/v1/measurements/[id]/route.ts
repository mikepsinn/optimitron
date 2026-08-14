/** REST v1: correct or soft-delete one of the user's measurements by ID. */
import {
  deleteMeasurementForUser,
  updateMeasurementForUser,
} from "@optimitron/tracking";
import { NextResponse } from "next/server";

import { requireTrackingAuth } from "@/lib/api/require-auth";
import {
  readJsonObject,
  trackingErrorResponse,
} from "@/lib/api/request-helpers";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireTrackingAuth(req);
  if (auth instanceof Response) return auth;
  try {
    const { id } = await context.params;
    const body = await readJsonObject(req);
    return NextResponse.json({
      measurement: await updateMeasurementForUser(
        { ...body, measurementId: id },
        auth.userId,
      ),
    });
  } catch (error) {
    return trackingErrorResponse(error, "PATCH /api/v1/measurements/[id]");
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireTrackingAuth(req);
  if (auth instanceof Response) return auth;
  try {
    const { id } = await context.params;
    return NextResponse.json({
      measurement: await deleteMeasurementForUser(
        { measurementId: id },
        auth.userId,
      ),
    });
  } catch (error) {
    return trackingErrorResponse(error, "DELETE /api/v1/measurements/[id]");
  }
}
