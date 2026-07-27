import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import {
  assertCanReviewTaskApplications,
  getTaskApplications,
} from "@/lib/task-applications.server";
import { decodeTaskRouteId } from "@/lib/tasks/task-route-id";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth();
    const { id: routeId } = await context.params;
    const id = decodeTaskRouteId(routeId);
    await assertCanReviewTaskApplications(userId, id);

    const applications = await getTaskApplications(id);
    return NextResponse.json({ data: applications, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Task not found") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    console.error("[APPLICATIONS] Failed to fetch applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications." },
      { status: 500 },
    );
  }
}
