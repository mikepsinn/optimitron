import { DatingInteractionKind } from "@optimitron/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { createDatingInteraction } from "@/lib/dating.server";

export const runtime = "nodejs";

const InteractionBodySchema = z.object({
  introMessage: z.string().max(500).nullish(),
  kind: z.nativeEnum(DatingInteractionKind),
  toProfileId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const parsed = InteractionBodySchema.parse(await request.json());
    const result = await createDatingInteraction(userId, parsed);
    return NextResponse.json({ ...result, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid dating interaction." },
        { status: 400 },
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[dating] Failed to save interaction:", error);
    return NextResponse.json(
      { error: "Failed to save dating interaction." },
      { status: 500 },
    );
  }
}
