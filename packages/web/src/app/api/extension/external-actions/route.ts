import { ExternalActionRequestStatus } from "@optimitron/db";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import { listExternalActionRequestsForHuman } from "@/lib/tasks/external-action.server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { userId } = await requireAuth(request, [McpScope.ACTIONS_APPROVE]);
    const url = new URL(request.url);
    const requestedStatus = url.searchParams.get("status");
    const status = Object.values(ExternalActionRequestStatus).includes(
      requestedStatus as ExternalActionRequestStatus,
    )
      ? (requestedStatus as ExternalActionRequestStatus)
      : ExternalActionRequestStatus.PENDING;
    const requests = await listExternalActionRequestsForHuman({
      actorUserId: userId,
      limit: 100,
      status,
      taskId: url.searchParams.get("taskId"),
    });
    return NextResponse.json({ data: requests });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[EXTENSION] Failed to list external actions:", error);
    return NextResponse.json(
      { error: "Failed to list external actions." },
      { status: 500 },
    );
  }
}
