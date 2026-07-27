import { NextRequest, NextResponse } from "next/server";
import { TaskApplicationStatus } from "@optimitron/db/enums";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  assertCanReviewTaskApplications,
  updateTaskApplication,
  type ApplicationUpdateInput,
} from "@/lib/task-applications.server";
import { decodeTaskRouteId } from "@/lib/tasks/task-route-id";

export const runtime = "nodejs";

const VALID_STATUSES = new Set(Object.values(TaskApplicationStatus));

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; applicationId: string }> },
) {
  try {
    const { userId } = await requireAuth();
    const { applicationId, id: routeId } = await context.params;
    const id = decodeTaskRouteId(routeId);

    await assertCanReviewTaskApplications(userId, id);

    const existing = await prisma.taskApplication.findFirst({
      where: { id: applicationId, taskId: id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const updateData: ApplicationUpdateInput = {
      reviewerUserId: userId,
    };

    if (body.status !== undefined) {
      if (!VALID_STATUSES.has(body.status as TaskApplicationStatus)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = body.status as TaskApplicationStatus;
    }
    if (body.reviewScore !== undefined) {
      const score = body.reviewScore === null ? null : Number(body.reviewScore);
      if (
        score !== null &&
        (score < 0 || score > 100 || !Number.isInteger(score))
      ) {
        return NextResponse.json(
          { error: "reviewScore must be an integer 0-100 or null" },
          { status: 400 },
        );
      }
      updateData.reviewScore = score;
    }
    if (body.reviewNote !== undefined) {
      updateData.reviewNote =
        body.reviewNote === null ? null : String(body.reviewNote);
    }
    if (body.answersJson !== undefined) {
      updateData.answersJson =
        body.answersJson === null
          ? null
          : (body.answersJson as Record<string, unknown>);
    }

    const updated = await updateTaskApplication(applicationId, updateData);
    return NextResponse.json({ data: updated, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (
      error instanceof Error &&
      (error.message === "Application not found" ||
        error.message === "Task not found")
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("[TASK_APPLICATIONS] Failed to update application:", error);
    return NextResponse.json(
      { error: "Failed to update application." },
      { status: 500 },
    );
  }
}
