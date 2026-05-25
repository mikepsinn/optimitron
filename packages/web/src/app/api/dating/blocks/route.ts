import { DatingBlockScope } from "@optimitron/db/enums";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { createDatingBlock } from "@/lib/dating.server";

export const runtime = "nodejs";

const BlockBodySchema = z.object({
  blockedProfileId: z.string().min(1).max(120),
  reason: z.string().max(500).nullish(),
  scope: z.nativeEnum(DatingBlockScope).optional(),
});

const CLIENT_SAFE_ERRORS = new Set([
  "Choose a profile to block.",
  "Mission profile not found.",
  "You cannot block yourself.",
]);

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const parsed = BlockBodySchema.parse(await request.json());
    const block = await createDatingBlock(userId, parsed);
    return NextResponse.json({ block, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid dating block." },
        { status: 400 },
      );
    }
    if (error instanceof Error && CLIENT_SAFE_ERRORS.has(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[dating] Failed to block profile:", error);
    return NextResponse.json(
      { error: "Failed to block dating profile." },
      { status: 500 },
    );
  }
}
