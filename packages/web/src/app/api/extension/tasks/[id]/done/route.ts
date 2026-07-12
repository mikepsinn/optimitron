import { TaskStatus } from "@optimitron/db";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const DEFAULT_COMPLETION_EVIDENCE = "completed via extension";

/**
 * POST /api/extension/tasks/[id]/done — mark a personal task VERIFIED with
 * completedAt now and completion evidence, mirroring the MCP `updateTask`
 * status=VERIFIED semantics (which the REST PATCH route does not expose).
 * Creator-scoped; public tasks need the admin verify flow instead.
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
      completionEvidence?: unknown;
    } | null;
    const completionEvidence =
      typeof body?.completionEvidence === "string" &&
      body.completionEvidence.trim()
        ? body.completionEvidence.trim()
        : DEFAULT_COMPLETION_EVIDENCE;

    const task = await prisma.task.findFirst({
      select: { id: true, isPublic: true },
      where: { createdByUserId: userId, deletedAt: null, id },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    if (task.isPublic) {
      return NextResponse.json(
        { error: "Public tasks are verified through the review flow." },
        { status: 403 },
      );
    }

    const now = new Date();
    const updated = await prisma.task.update({
      data: {
        completedAt: now,
        completionEvidence,
        status: TaskStatus.VERIFIED,
        verifiedAt: now,
      },
      select: {
        completedAt: true,
        completionEvidence: true,
        id: true,
        status: true,
      },
      where: { id: task.id },
    });

    return NextResponse.json({ data: updated, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("[EXTENSION] Failed to complete task:", error);
    return NextResponse.json(
      { error: "Failed to complete task." },
      { status: 500 },
    );
  }
}
