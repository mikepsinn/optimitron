import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { proposeDatingDatePlan } from "@/lib/dating.server";

export const runtime = "nodejs";

const DatePlanBodySchema = z.object({
  campaignNotes: z.string().max(1000).nullish(),
  campaignTaskId: z.string().max(120).nullish(),
  conversationId: z.string().max(120).nullish(),
  isCampaignDate: z.boolean().optional(),
  locationName: z.string().max(200).nullish(),
  matchId: z.string().min(1),
  startsAt: z.string().datetime().nullish(),
  title: z.string().trim().min(1).max(140),
});

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const parsed = DatePlanBodySchema.parse(await request.json());
    const plan = await proposeDatingDatePlan(userId, {
      ...parsed,
      startsAt: parsed.startsAt ? new Date(parsed.startsAt) : null,
    });
    return NextResponse.json({ plan, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid dating date plan." },
        { status: 400 },
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[dating] Failed to propose date:", error);
    return NextResponse.json(
      { error: "Failed to propose dating date." },
      { status: 500 },
    );
  }
}
