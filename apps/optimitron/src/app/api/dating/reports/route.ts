import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { createDatingSafetyReport } from "@/lib/dating.server";

export const runtime = "nodejs";

const ReportBodySchema = z.object({
  datePlanId: z.string().max(120).nullish(),
  description: z.string().max(2000).nullish(),
  messageId: z.string().max(120).nullish(),
  reason: z.string().trim().min(1).max(200),
  reportedProfileId: z.string().max(120).nullish(),
});

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const parsed = ReportBodySchema.parse(await request.json());
    const report = await createDatingSafetyReport(userId, parsed);
    return NextResponse.json({ report, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid dating report." },
        { status: 400 },
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[dating] Failed to create report:", error);
    return NextResponse.json(
      { error: "Failed to create dating report." },
      { status: 500 },
    );
  }
}
