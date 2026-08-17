/** REST v1: the authenticated user's tracked variables. */
import { listTrackingVariablesForUser } from "@optimitron/tracking";
import { NextResponse } from "next/server";

import { requireTrackingAuth } from "@/lib/api/require-auth";
import { queryInput, trackingErrorResponse } from "@/lib/api/request-helpers";

export async function GET(req: Request) {
  const auth = await requireTrackingAuth(req);
  if (auth instanceof Response) return auth;
  try {
    const input = queryInput(new URL(req.url), {
      numbers: ["limit"],
      strings: ["query", "cursor"],
    });
    return NextResponse.json(
      await listTrackingVariablesForUser(input, auth.userId),
    );
  } catch (error) {
    return trackingErrorResponse(error, "GET /api/v1/variables");
  }
}
