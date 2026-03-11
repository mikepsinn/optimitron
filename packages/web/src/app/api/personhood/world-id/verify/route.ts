import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { isPersonhoodExternalIdConflict } from "@/lib/personhood.server";
import { isWorldIdConfigured, verifyAndSaveWorldIdResult } from "@/lib/world-id.server";
import type { WorldIdVerificationPayload } from "@/lib/world-id";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();

    if (!isWorldIdConfigured()) {
      return NextResponse.json({ error: "World ID is not configured." }, { status: 503 });
    }

    const result = (await request.json()) as WorldIdVerificationPayload;
    const verification = await verifyAndSaveWorldIdResult(userId, result);

    return NextResponse.json({
      success: true,
      verification,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isPersonhoodExternalIdConflict(error)) {
      return NextResponse.json(
        { error: "This proof is already linked to another account." },
        { status: 409 },
      );
    }

    const message = error instanceof Error ? error.message : "Failed to verify World ID proof.";
    console.error("[WORLD ID VERIFY] Error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
