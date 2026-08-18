import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { ensurePersonForUser } from "@/lib/person.server";
import { markUserTreatyPersonalSignComplete } from "@/lib/tasks/user-treaty-task-progress.server";

export const runtime = "nodejs";

/**
 * Trust-the-user attestation that they publicly signed the 1% Treaty at
 * warondisease.org. Verifies their `signTreatyPersonally` HMT subtask
 * so the gate can evaluate.
 *
 * Mirrors the existing pattern for `phoneScript` and `shareReferralUrl`:
 * the user clicks through, we trust the click, the rest of the tree
 * cascades. A future signature webhook from warondisease.org could
 * replace the trust step with proof; until then this is the contract.
 */
export async function POST() {
  try {
    const { userId } = await requireAuth();
    const person = await ensurePersonForUser(userId);
    const verified = await markUserTreatyPersonalSignComplete({
      personId: person.id,
      userId,
    });
    return NextResponse.json({ success: true, verified });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[user-treaty/sign-personally] Error:", error);
    return NextResponse.json(
      { error: "Failed to record treaty signature." },
      { status: 500 },
    );
  }
}
