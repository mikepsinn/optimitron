import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { saveDailyCheckIn } from "@/lib/profile.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const data = await saveDailyCheckIn(userId, body);

    return NextResponse.json({ data, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid check-in data.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    console.error("[PROFILE] Failed to save daily check-in:", error);
    return NextResponse.json({ error: "Failed to save daily check-in." }, { status: 500 });
  }
}
