import {
  TaskCategory,
  TaskClaimPolicy,
  TaskStatus,
} from "@optimitron/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { hasBearerAuthorization, requireAuth } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import {
  deleteTaskCreatedByUser,
  getTaskDetailData,
  updateTaskCreatedByUser,
} from "@/lib/tasks.server";
import { normalizeTaskCommunicationEndpointUrl } from "@/lib/tasks/task-communication-endpoints.server";

export const runtime = "nodejs";

const PrimaryEndpointBodySchema = z.object({
  email: z.string().nullish(),
  instructions: z.string().nullish(),
  label: z.string().nullish(),
  sourceUrl: z.string().nullish(),
  url: z
    .string()
    .refine((value) => normalizeTaskCommunicationEndpointUrl(value) !== null, {
      message: "Primary endpoint URL must be http, https, mailto, or an internal path.",
    })
    .nullish(),
});

const UpdateTaskBodySchema = z
  .object({
    category: z.nativeEnum(TaskCategory).nullish(),
    claimPolicy: z.nativeEnum(TaskClaimPolicy).nullish(),
    description: z.string().nullish(),
    dueAt: z.string().datetime().nullish(),
    estimatedEffortHours: z.number().nonnegative().nullish(),
    interestTags: z.array(z.string()).nullish(),
    isPublic: z.boolean().nullish(),
    maxClaims: z.number().int().positive().nullish(),
    primaryEndpoint: PrimaryEndpointBodySchema.nullish(),
    roleTitle: z.string().nullish(),
    skillTags: z.array(z.string()).nullish(),
    status: z.nativeEnum(TaskStatus).nullish(),
    title: z.string().min(1).nullish(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required.",
  });

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    let userId: string | null = null;
    if (hasBearerAuthorization(_request)) {
      const auth = await requireAuth(_request, [
        McpScope.TASKS_PERSONAL,
        McpScope.TASKS_ADMIN,
      ]);
      userId = auth.userId;
    } else {
      const session = await getServerSession(authOptions);
      userId = session?.user.id ?? null;
    }
    const { id } = await context.params;
    const data = await getTaskDetailData(id, userId);

    if (!data) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("[TASKS] Failed to load task detail:", error);
    return NextResponse.json(
      { error: "Failed to load task detail." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth(request, [
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ADMIN,
    ]);
    const { id } = await context.params;
    const parsed = UpdateTaskBodySchema.parse(await request.json());
    const { dueAt, ...rest } = parsed;
    const task = await updateTaskCreatedByUser(id, userId, {
      ...rest,
      dueAt: dueAt == null ? dueAt : new Date(dueAt),
    });

    return NextResponse.json({ data: task, success: true });
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
      const status = error.message === "Task not found." ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("[TASKS] Failed to update task:", error);
    return NextResponse.json(
      { error: "Failed to update task." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth(_request, [
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ADMIN,
    ]);
    const { id } = await context.params;
    const result = await deleteTaskCreatedByUser(id, userId);
    return NextResponse.json({ data: result, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error) {
      const status = error.message === "Task not found." ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("[TASKS] Failed to delete task:", error);
    return NextResponse.json(
      { error: "Failed to delete task." },
      { status: 500 },
    );
  }
}
