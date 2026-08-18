import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { sendDatingMessage } from "@/lib/dating.server";

export const runtime = "nodejs";

const MessageBodySchema = z.object({
  body: z.string().trim().min(1).max(4000),
  conversationId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const parsed = MessageBodySchema.parse(await request.json());
    const message = await sendDatingMessage(userId, parsed);
    return NextResponse.json({ message, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid dating message." },
        { status: 400 },
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[dating] Failed to send message:", error);
    return NextResponse.json(
      { error: "Failed to send dating message." },
      { status: 500 },
    );
  }
}
