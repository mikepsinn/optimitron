import {
  TaskCategory,
  TaskClaimPolicy,
  TaskStatus,
} from "@optimitron/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getTaskRequestIdentity,
  requireTaskRequestAuth,
} from "@/lib/auth-utils";
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

const MutableTaskStatusSchema = z.enum(["DRAFT", "ACTIVE", "STALE"]);

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
    status: MutableTaskStatusSchema.nullish(),
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
    const { clientAccessBoundary, userId } =
      await getTaskRequestIdentity(_request);
    const { id } = await context.params;
    const data = clientAccessBoundary
      ? await getTaskDetailData(id, userId, { clientAccessBoundary })
      : await getTaskDetailData(id, userId);

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
    const { clientAccessBoundary, userId } =
      await requireTaskRequestAuth(request);
    const { id } = await context.params;
    const parsed = UpdateTaskBodySchema.parse(await request.json());
    const { dueAt, ...rest } = parsed;
    // MCP parity: delegated clients never change publication state; the
    // web app is the only disclosure surface.
    if (clientAccessBoundary && rest.isPublic != null) {
      return NextResponse.json(
        { error: "Publishing tasks requires the web app." },
        { status: 403 },
      );
    }
    const task = await updateTaskCreatedByUser(
      id,
      userId,
      {
        ...rest,
        dueAt: dueAt == null ? dueAt : new Date(dueAt),
      },
      { clientAccessBoundary },
    );

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
    const { clientAccessBoundary, userId } =
      await requireTaskRequestAuth(_request);
    const { id } = await context.params;
    const result = await deleteTaskCreatedByUser(id, userId, {
      clientAccessBoundary,
    });
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
