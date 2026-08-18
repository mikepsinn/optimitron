import { TaskStatus } from "@optimitron/db";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import { prisma } from "@/lib/prisma";
import { listTasks } from "@/lib/tasks.server";
import { buildExtensionAgenda } from "./agenda";

export const runtime = "nodejs";

/** Cap the extension payload; the popup shows a day, not a backlog. */
const AGENDA_TASK_LIMIT = 500;

/**
 * GET /api/extension/agenda — the user's day for the Chrome extension popup:
 * `{ nextAction, tasks[], reminders[] }`. Personal visibility (created by the
 * user or assigned to their Person), ACTIVE only. Bearer (MCP OAuth) or
 * session auth via the shared requireAuth pattern.
 */
export async function GET(request: Request) {
  try {
    const { userId } = await requireAuth(request, [
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ADMIN,
    ]);
    const user = await prisma.user.findUnique({
      select: { personId: true },
      where: { id: userId },
    });
    const tasks = await listTasks({
      limit: AGENDA_TASK_LIMIT,
      personId: user?.personId ?? null,
      status: TaskStatus.ACTIVE,
      userId,
      visibility: "personal",
    });

    const agenda = buildExtensionAgenda(tasks, new Date());
    return NextResponse.json({
      ...agenda,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("[EXTENSION] Failed to build agenda:", error);
    return NextResponse.json(
      { error: "Failed to load agenda." },
      { status: 500 },
    );
  }
}
