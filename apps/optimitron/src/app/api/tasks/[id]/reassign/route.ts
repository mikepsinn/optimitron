import { NextResponse } from "next/server";
import { OrgType } from "@optimitron/db";
import { requireAuth } from "@/lib/auth-utils";
import { reassignTask } from "@/lib/tasks.server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth();
    const body = (await request.json().catch(() => null)) as
      | {
          currentAffiliation?: unknown;
          displayName?: unknown;
          email?: unknown;
          organizationId?: unknown;
          organizationName?: unknown;
          organizationType?: unknown;
          personId?: unknown;
          roleTitle?: unknown;
        }
      | null;
    const { id } = await context.params;
    const task = await reassignTask(id, userId, {
      currentAffiliation:
        typeof body?.currentAffiliation === "string" ? body.currentAffiliation : null,
      displayName: typeof body?.displayName === "string" ? body.displayName : null,
      email: typeof body?.email === "string" ? body.email : null,
      organizationId:
        typeof body?.organizationId === "string" ? body.organizationId : null,
      organizationName:
        typeof body?.organizationName === "string" ? body.organizationName : null,
      organizationType:
        typeof body?.organizationType === "string" &&
        body.organizationType in OrgType
          ? OrgType[body.organizationType as keyof typeof OrgType]
          : null,
      personId: typeof body?.personId === "string" ? body.personId : null,
      roleTitle: typeof body?.roleTitle === "string" ? body.roleTitle : null,
    });

    return NextResponse.json({ data: task, success: true });
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

    console.error("[TASKS] Failed to reassign task:", error);
    return NextResponse.json({ error: "Failed to reassign task." }, { status: 500 });
  }
}
