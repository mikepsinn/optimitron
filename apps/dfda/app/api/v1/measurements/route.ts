/** REST v1: the authenticated user's tracking measurements. */
import {
  listMeasurementsForUser,
  recordTrackingMeasurement,
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
      numbers: ["limit"],
      strings: [
        "globalVariableId",
        "variableName",
        "startTimeAfter",
        "startTimeBefore",
        "cursor",
      ],
    });
    return NextResponse.json(await listMeasurementsForUser(input, auth.userId));
  } catch (error) {
    return trackingErrorResponse(error, "GET /api/v1/measurements");
  }
}

export async function POST(req: Request) {
  const auth = await requireTrackingAuth(req);
  if (auth instanceof Response) return auth;
  try {
    const body = await readJsonObject(req);
    // The core's fallback provenance is "mcp"; measurements recorded through
    // this REST surface must say so instead. An explicit sourceName wins.
    return NextResponse.json(
      {
        result: await recordTrackingMeasurement(
          { ...body, sourceName: body.sourceName ?? "dfda-rest" },
          auth.userId,
        ),
      },
      { status: 201 },
    );
  } catch (error) {
    return trackingErrorResponse(error, "POST /api/v1/measurements");
  }
}
