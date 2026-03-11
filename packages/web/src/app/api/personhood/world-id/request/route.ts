import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { createWorldIdRequestPayload, isWorldIdConfigured } from "@/lib/world-id.server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    if (!isWorldIdConfigured()) {
      return NextResponse.json({ error: "World ID is not configured." }, { status: 503 });
    }

    return NextResponse.json(createWorldIdRequestPayload(userId));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("[WORLD ID REQUEST] Error:", error);
    return NextResponse.json({ error: "Failed to create World ID request." }, { status: 500 });
  }
}
