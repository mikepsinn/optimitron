import {
  TaskExecutionAttemptStatus,
  TaskVerificationMethod,
  TaskVerificationResult,
} from "@optimitron/db";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import { prisma } from "@/lib/prisma";
import {
  startTaskExecution,
  submitTaskArtifact,
  submitTaskForVerification,
} from "@/lib/tasks/execution-lifecycle.server";
import { getTaskAccessWhere } from "@/lib/tasks/task-visibility.server";

export const runtime = "nodejs";

const DEFAULT_COMPLETION_EVIDENCE = "Completed via the Optimitron extension";

/** Submit a private task for verification. This route never verifies a task. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth(request, [McpScope.TASKS_PERSONAL]);
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      actualDurationSeconds?: unknown;
      completionEvidence?: unknown;
      outputSummary?: unknown;
    } | null;
    const actualDurationSeconds = body?.actualDurationSeconds;
    if (
      typeof actualDurationSeconds !== "number" ||
      !Number.isInteger(actualDurationSeconds) ||
      actualDurationSeconds <= 0
    ) {
      return NextResponse.json(
        { error: "actualDurationSeconds must be a positive integer." },
        { status: 400 },
      );
    }

    const completionEvidence =
      typeof body?.completionEvidence === "string" &&
      body.completionEvidence.trim()
        ? body.completionEvidence.trim()
        : DEFAULT_COMPLETION_EVIDENCE;
    const outputSummary =
      typeof body?.outputSummary === "string" && body.outputSummary.trim()
        ? body.outputSummary.trim()
        : completionEvidence;
    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: { personId: true },
    });
    if (!actor) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const taskAccess = getTaskAccessWhere({
      action: "EXECUTE",
      personId: actor.personId,
      userId,
    });
    const existingAttempt = await prisma.taskExecutionAttempt.findFirst({
      where: {
        deletedAt: null,
        executorUserId: userId,
        status: {
          in: [
            TaskExecutionAttemptStatus.RUNNING,
            TaskExecutionAttemptStatus.COMPLETED,
          ],
        },
        task: { deletedAt: null, id, ...taskAccess },
      },
      orderBy: { createdAt: "desc" },
      select: {
        artifacts: {
          where: { deletedAt: null },
          select: { id: true },
          take: 1,
        },
        id: true,
        status: true,
        verifications: {
          where: {
            deletedAt: null,
            result: TaskVerificationResult.PENDING,
          },
          select: { id: true, result: true },
          take: 1,
        },
      },
    });

    if (existingAttempt?.verifications[0]) {
      return NextResponse.json({
        data: {
          taskExecutionAttemptId: existingAttempt.id,
          verification: existingAttempt.verifications[0],
        },
        success: true,
      });
    }

    const continuingAttempt =
      existingAttempt?.status === TaskExecutionAttemptStatus.RUNNING
        ? existingAttempt
        : null;
    const attempt =
      continuingAttempt ?? (await startTaskExecution({ taskId: id }, userId));

    if (!continuingAttempt || continuingAttempt.artifacts.length === 0) {
      await submitTaskArtifact(
        {
          label: "Extension completion evidence",
          structuredResult: { completionEvidence },
          taskExecutionAttemptId: attempt.id,
        },
        userId,
      );
    }

    const submitted = await submitTaskForVerification(
      {
        actualDurationSeconds,
        method: TaskVerificationMethod.REVIEWER,
        outputSummary,
        taskExecutionAttemptId: attempt.id,
      },
      userId,
    );

    return NextResponse.json({ data: submitted, success: true }, { status: 202 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (
      error instanceof Error &&
      (error.message === "Task not found" ||
        error.message === "Task execution attempt not found")
    ) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    console.error("[EXTENSION] Failed to submit task:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit task for verification.",
      },
      { status: 409 },
    );
  }
}
