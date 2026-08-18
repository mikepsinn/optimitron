import type { Prisma } from "@optimitron/db";
import { TaskDeadlinePolicy } from "@optimitron/db";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_REASON_LENGTH = 500;

/**
 * POST /api/extension/tasks/[id]/skip — record a skip (with optional reason)
 * on a personal task. The skip is appended to `contextJson.skips` and the due
 * date is cleared so the task stops counting as overdue; the task itself
 * stays ACTIVE for rescheduling. Creator-scoped, private tasks only.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth(request, [
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ADMIN,
    ]);
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      reason?: unknown;
    } | null;
    const reason =
      typeof body?.reason === "string" && body.reason.trim()
        ? body.reason.trim().slice(0, MAX_REASON_LENGTH)
        : null;

    const task = await prisma.task.findFirst({
      select: { contextJson: true, dueAt: true, id: true, isPublic: true },
      where: { createdByUserId: userId, deletedAt: null, id },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    if (task.isPublic) {
      return NextResponse.json(
        { error: "Public tasks can't be skipped from the extension." },
        { status: 403 },
      );
    }

    const existingContext =
      task.contextJson !== null &&
      typeof task.contextJson === "object" &&
      !Array.isArray(task.contextJson)
        ? (task.contextJson as Record<string, unknown>)
        : {};
    const existingSkips = Array.isArray(existingContext.skips)
      ? existingContext.skips
      : [];
    const skipRecord = {
      at: new Date().toISOString(),
      skippedDueAt: task.dueAt?.toISOString() ?? null,
      source: "extension",
      ...(reason ? { reason } : {}),
    };
    const nextContext = {
      ...existingContext,
      skips: [...existingSkips, skipRecord],
    } as Prisma.InputJsonValue;

    const updated = await prisma.task.update({
      data: {
        contextJson: nextContext,
        deadlinePolicy: TaskDeadlinePolicy.NONE,
        dueAt: null,
      },
      select: { dueAt: true, id: true, status: true },
      where: { id: task.id },
    });

    return NextResponse.json({ data: updated, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("[EXTENSION] Failed to skip task:", error);
    return NextResponse.json(
      { error: "Failed to skip task." },
      { status: 500 },
    );
  }
}
