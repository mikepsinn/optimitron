import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { verifyTask } from "@/lib/tasks.server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth();
    const body = (await request.json().catch(() => null)) as
      | {
          actualCashCostUsd?: unknown;
          actualEffortSeconds?: unknown;
          claimId?: unknown;
          completionEvidence?: unknown;
          verificationNote?: unknown;
        }
      | null;
    const { id } = await context.params;
    const result = await verifyTask(id, userId, {
      actualCashCostUsd:
        typeof body?.actualCashCostUsd === "number" ? body.actualCashCostUsd : null,
      actualEffortSeconds:
        typeof body?.actualEffortSeconds === "number" ? body.actualEffortSeconds : null,
      claimId: typeof body?.claimId === "string" ? body.claimId : null,
      completionEvidence:
        typeof body?.completionEvidence === "string" ? body.completionEvidence : null,
      verificationNote:
        typeof body?.verificationNote === "string" ? body.verificationNote : null,
    });

    return NextResponse.json({ data: result, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("[TASKS] Failed to verify task:", error);
    return NextResponse.json({ error: "Failed to verify task." }, { status: 500 });
  }
}
