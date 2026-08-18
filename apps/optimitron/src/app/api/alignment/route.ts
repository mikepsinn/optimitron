import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getPersonalAlignmentState } from "@/lib/alignment-report.server";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const state = await getPersonalAlignmentState(userId);
    return NextResponse.json(state);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Failed to load personal alignment report:", error);
    return NextResponse.json(
      { error: "Failed to load personal alignment report." },
      { status: 500 },
    );
  }
}
