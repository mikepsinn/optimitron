import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import { completeTaskClaim } from "@/lib/tasks.server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth(request, [
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ADMIN,
    ]);
    const body = (await request.json().catch(() => null)) as
      | {
          actualCashCostUsd?: unknown;
          actualEffortSeconds?: unknown;
          completionEvidence?: unknown;
        }
      | null;
    const completionEvidence =
      typeof body?.completionEvidence === "string" ? body.completionEvidence : "";
    const { id } = await context.params;
    const claim = await completeTaskClaim(id, userId, completionEvidence, {
      actualCashCostUsd:
        typeof body?.actualCashCostUsd === "number" ? body.actualCashCostUsd : null,
      actualEffortSeconds:
        typeof body?.actualEffortSeconds === "number" ? body.actualEffortSeconds : null,
    });

    return NextResponse.json({ data: claim, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("[TASKS] Failed to complete task:", error);
    return NextResponse.json({ error: "Failed to complete task." }, { status: 500 });
  }
}
