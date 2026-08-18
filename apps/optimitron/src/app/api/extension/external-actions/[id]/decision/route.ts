import { NextResponse } from "next/server";
import { requireTaskRequestAuth } from "@/lib/auth-utils";
import { OUTBOUND_MESSAGE_OPERATION } from "@/lib/email/outbound-message-approval.server";
import { McpScope } from "@/lib/mcp-scopes";
import { decideExternalActionRequest } from "@/lib/tasks/external-action.server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { clientAccessBoundary, userId } = await requireTaskRequestAuth(
      request,
      [McpScope.ACTIONS_APPROVE],
    );
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      decision?: unknown;
    } | null;
    const result = await decideExternalActionRequest(
      {
        decision: body?.decision,
        externalActionRequestId: id,
      },
      userId,
      {
        blockedOperations: [OUTBOUND_MESSAGE_OPERATION],
        clientAccessBoundary,
      },
    );
    return NextResponse.json({ data: result, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (
      error instanceof Error &&
      error.message === "External action request not found"
    ) {
      return NextResponse.json({ error: "Action not found." }, { status: 404 });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid action decision.",
      },
      { status: 400 },
    );
  }
}
