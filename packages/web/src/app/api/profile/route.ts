import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { saveProfileSnapshot } from "@/lib/profile.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const data = await saveProfileSnapshot(userId, body);

    return NextResponse.json({ data, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid profile data.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    console.error("[PROFILE] Failed to save profile:", error);
    return NextResponse.json({ error: "Failed to save profile." }, { status: 500 });
  }
}
