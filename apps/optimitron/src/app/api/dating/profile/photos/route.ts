import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { addDatingProfilePhoto } from "@/lib/dating.server";

export const runtime = "nodejs";

const PhotoBodySchema = z.object({
  altText: z.string().max(200).nullish(),
  imageUrl: z.string().url().max(1000),
});

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const parsed = PhotoBodySchema.parse(await request.json());
    const photo = await addDatingProfilePhoto(userId, parsed);
    return NextResponse.json({ photo, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid dating photo." },
        { status: 400 },
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[dating] Failed to add photo:", error);
    return NextResponse.json(
      { error: "Failed to add dating photo." },
      { status: 500 },
    );
  }
}
