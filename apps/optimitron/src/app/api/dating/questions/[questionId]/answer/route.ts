import { DatingQuestionImportance } from "@optimitron/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { answerDatingQuestion } from "@/lib/dating.server";

export const runtime = "nodejs";

const AnswerBodySchema = z.object({
  acceptableValues: z.unknown().optional(),
  answerValues: z.unknown().refine((value) => value !== undefined, {
    message: "answerValues is required",
  }),
  explanation: z.string().max(1000).nullish(),
  importance: z.nativeEnum(DatingQuestionImportance).optional(),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ questionId: string }> },
) {
  try {
    const { userId } = await requireAuth();
    const { questionId } = await context.params;
    const parsed = AnswerBodySchema.parse(await request.json());
    const answer = await answerDatingQuestion(userId, {
      acceptableValues: parsed.acceptableValues,
      answerValues: parsed.answerValues,
      explanation: parsed.explanation,
      importance: parsed.importance,
      questionId,
    });
    return NextResponse.json({ answer, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid dating answer." },
        { status: 400 },
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[dating] Failed to save answer:", error);
    return NextResponse.json(
      { error: "Failed to save dating answer." },
      { status: 500 },
    );
  }
}
