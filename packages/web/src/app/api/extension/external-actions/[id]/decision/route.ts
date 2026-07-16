import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import { decideExternalActionRequest } from "@/lib/tasks/external-action.server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth(request, [McpScope.ACTIONS_APPROVE]);
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
