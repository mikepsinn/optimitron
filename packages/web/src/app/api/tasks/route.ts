import {
  TaskCategory,
  TaskClaimPolicy,
  TaskDifficulty,
  TaskImpactFrameKey,
  TaskStatus,
} from "@optimitron/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { createTask, listTasks } from "@/lib/tasks.server";

export const runtime = "nodejs";

const TASK_VISIBILITY_FILTER = {
  ACCESSIBLE: "accessible",
  CREATED: "created",
  PUBLIC: "public",
} as const;

const CreateTaskBodySchema = z.object({
  assigneeOrganizationId: z.string().nullish(),
  assigneePersonId: z.string().nullish(),
  category: z.nativeEnum(TaskCategory).nullish(),
  claimPolicy: z.nativeEnum(TaskClaimPolicy).nullish(),
  contactLabel: z.string().nullish(),
  contactTemplate: z.string().nullish(),
  contactUrl: z.string().nullish(),
  description: z.string().nullish(),
  difficulty: z.nativeEnum(TaskDifficulty).nullish(),
  dueAt: z.string().datetime().nullish(),
  estimatedEffortHours: z.number().nonnegative().nullish(),
  interestTags: z.array(z.string()).nullish(),
  isPublic: z.boolean().nullish(),
  maxClaims: z.number().int().positive().nullish(),
  parentTaskId: z.string().nullish(),
  roleTitle: z.string().nullish(),
  skillTags: z.array(z.string()).nullish(),
  status: z.nativeEnum(TaskStatus).nullish(),
  title: z.string().min(1),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user.id ?? null;
    const { searchParams } = new URL(request.url);
    const assigneeOrganizationId = searchParams.get("assigneeOrganizationId");
    const assigneePersonId = searchParams.get("assigneePersonId");
    const rawStatus = searchParams.get("status");
    const rawFrameKey = searchParams.get("frameKey");
    const rawVisibility = searchParams.get("visibility");
    const status =
      rawStatus && rawStatus in TaskStatus
        ? TaskStatus[rawStatus as keyof typeof TaskStatus]
        : null;
    const frameKey =
      rawFrameKey && rawFrameKey in TaskImpactFrameKey
        ? TaskImpactFrameKey[rawFrameKey as keyof typeof TaskImpactFrameKey]
        : null;
    const visibility =
      rawVisibility === TASK_VISIBILITY_FILTER.CREATED ||
      rawVisibility === TASK_VISIBILITY_FILTER.ACCESSIBLE
        ? rawVisibility
        : TASK_VISIBILITY_FILTER.PUBLIC;

    const tasks = await listTasks({
      assigneeOrganizationId,
      assigneePersonId,
      frameKey,
      status,
      userId,
      visibility,
    });

    return NextResponse.json({ data: tasks, success: true });
  } catch (error) {
    console.error("[TASKS] Failed to list tasks:", error);
    return NextResponse.json(
      { error: "Failed to list tasks." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const parsed = CreateTaskBodySchema.parse(await request.json());
    const { dueAt, parentTaskId, ...rest } = parsed;

    if (parentTaskId) {
      const parent = await prisma.task.findFirst({
        where: { id: parentTaskId, deletedAt: null },
        select: { id: true, isPublic: true },
      });
      if (!parent) {
        return NextResponse.json(
          { error: "Parent task not found." },
          { status: 404 },
        );
      }
      if (!parent.isPublic) {
        return NextResponse.json(
          { error: "Cannot add a subtask to a private task." },
          { status: 403 },
        );
      }
    }

    // Subtasks created through the public REST API are always private. The
    // parent-task creator promotes them to public via the existing admin
    // disclosure on /tasks/[id]. Honoring a client-supplied `isPublic: true`
    // here would let any caller graft a public subtask onto someone else's
    // tree.
    const task = await createTask(userId, {
      ...rest,
      dueAt: dueAt == null ? null : new Date(dueAt),
      isPublic: parentTaskId ? false : rest.isPublic,
      parentTaskId: parentTaskId ?? null,
    });

    return NextResponse.json({ data: task, success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid task payload." },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("[TASKS] Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task." },
      { status: 500 },
    );
  }
}
