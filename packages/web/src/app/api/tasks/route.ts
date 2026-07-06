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
import { hasBearerAuthorization, requireAuth } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
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
  assigneePersonIdentifier: z.string().nullish(),
  assigneePersonId: z.string().nullish(),
  assigneePersonInvite: z
    .object({
      currentAffiliation: z.string().trim().nullish(),
      email: z.string().trim().email(),
      firstName: z.string().trim().min(1),
      lastName: z.string().trim().min(1),
    })
    .nullish(),
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
  parentTaskId: z.string().trim().min(1).nullish(),
  roleTitle: z.string().nullish(),
  skillTags: z.array(z.string()).nullish(),
  status: z.nativeEnum(TaskStatus).nullish(),
  title: z.string().min(1),
});

function normalizeAssigneePersonIdentifier(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  try {
    const url = new URL(candidate);
    const segments = url.pathname.split("/").filter(Boolean);
    const peopleIndex = segments.findIndex((segment) => segment === "people");
    candidate =
      peopleIndex >= 0
        ? (segments[peopleIndex + 1] ?? "")
        : (segments[segments.length - 1] ?? "");
  } catch {
    const pathOnly = candidate.split(/[?#]/u, 1)[0] ?? "";
    const segments = pathOnly.split("/").filter(Boolean);
    candidate = segments[segments.length - 1] ?? pathOnly;
  }

  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    // Keep the raw candidate if the user pasted a malformed escape sequence.
  }

  return candidate.replace(/^@/u, "").trim() || null;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function buildDisplayName(input: { firstName: string; lastName: string }) {
  return [input.firstName.trim(), input.lastName.trim()]
    .filter(Boolean)
    .join(" ");
}

async function findOrCreateInvitedAssigneePerson({
  creatorUserId,
  currentAffiliation,
  email,
  firstName,
  lastName,
}: {
  creatorUserId: string;
  currentAffiliation?: string | null;
  email: string;
  firstName: string;
  lastName: string;
}) {
  const normalizedEmail = normalizeEmail(email);
  const displayName = buildDisplayName({ firstName, lastName });

  return prisma.person.upsert({
    create: {
      createdByUserId: creatorUserId,
      currentAffiliation: currentAffiliation?.trim() || null,
      displayName,
      email: normalizedEmail,
      firstName: firstName.trim(),
      isPublic: false,
      isPublicFigure: false,
      lastName: lastName.trim(),
    },
    select: { id: true },
    update: {
      deletedAt: null,
    },
    where: { email: normalizedEmail },
  });
}

export async function GET(request: Request) {
  try {
    let userId: string | null = null;
    if (hasBearerAuthorization(request)) {
      const auth = await requireAuth(request, [
        McpScope.TASKS_PERSONAL,
        McpScope.TASKS_ADMIN,
      ]);
      userId = auth.userId;
    } else {
      const session = await getServerSession(authOptions);
      userId = session?.user.id ?? null;
    }
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
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("[TASKS] Failed to list tasks:", error);
    return NextResponse.json(
      { error: "Failed to list tasks." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth(request, [
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ADMIN,
    ]);
    const parsed = CreateTaskBodySchema.parse(await request.json());
    const {
      assigneePersonIdentifier,
      assigneePersonInvite,
      dueAt,
      parentTaskId,
      ...rest
    } = parsed;
    let assigneePersonId = rest.assigneePersonId ?? null;
    const assigneeTargetCount = [
      rest.assigneeOrganizationId,
      assigneePersonId,
      assigneePersonIdentifier,
      assigneePersonInvite,
    ].filter(Boolean).length;

    if (assigneeTargetCount > 1) {
      return NextResponse.json(
        { error: "Choose one assignee." },
        { status: 400 },
      );
    }

    if (!assigneePersonId && assigneePersonIdentifier) {
      const identifier = normalizeAssigneePersonIdentifier(
        assigneePersonIdentifier,
      );
      if (!identifier) {
        return NextResponse.json(
          { error: "Person handle or URL is required." },
          { status: 400 },
        );
      }

      const person = await prisma.person.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { id: identifier },
            { handle: identifier },
            { handle: identifier.toLowerCase() },
          ],
        },
        select: { id: true },
      });
      if (!person) {
        return NextResponse.json(
          { error: "Person not found." },
          { status: 404 },
        );
      }
      assigneePersonId = person.id;
    }

    if (!assigneePersonId && assigneePersonInvite) {
      const person = await findOrCreateInvitedAssigneePerson({
        creatorUserId: userId,
        currentAffiliation: assigneePersonInvite.currentAffiliation,
        email: assigneePersonInvite.email,
        firstName: assigneePersonInvite.firstName,
        lastName: assigneePersonInvite.lastName,
      });
      assigneePersonId = person.id;
    }

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
      assigneePersonId,
      dueAt: dueAt == null ? null : new Date(dueAt),
      claimPolicy: parentTaskId
        ? TaskClaimPolicy.ASSIGNED_ONLY
        : rest.claimPolicy,
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
