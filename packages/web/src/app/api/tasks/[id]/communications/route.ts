import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  normalizeTaskCommunicationActionChannel,
  recordTaskCommunication,
} from "@/lib/tasks/task-communications.server";
import { decodeTaskRouteId } from "@/lib/tasks/task-route-id";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const body = (await request.json().catch(() => null)) as {
      channel?: unknown;
      endpointId?: unknown;
      href?: unknown;
      message?: unknown;
      submittedAt?: unknown;
    } | null;
    const currentUser = await getCurrentUser();
    const { id: routeId } = await context.params;
    const id = decodeTaskRouteId(routeId);

    if (currentUser) {
      await recordTaskCommunication({
        channel: normalizeTaskCommunicationActionChannel(body?.channel),
        endpointId:
          typeof body?.endpointId === "string" ? body.endpointId : null,
        href: typeof body?.href === "string" ? body.href : null,
        message: typeof body?.message === "string" ? body.message : null,
        submittedAt:
          typeof body?.submittedAt === "string"
            ? new Date(body.submittedAt)
            : null,
        taskId: id,
        userId: currentUser.id,
      });
    }

    return NextResponse.json({
      success: true,
      tracked: Boolean(currentUser),
    });
  } catch (error) {
    console.error("[TASKS] Failed to record task communication:", error);
    return NextResponse.json(
      { error: "Failed to record task communication." },
      { status: 500 },
    );
  }
}
