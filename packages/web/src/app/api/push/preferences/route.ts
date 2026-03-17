import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

const UpdatePreferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  reminderFrequencyMinutes: z.number().int().min(15).max(10080).optional(),
  reminderStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const prefs = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      return NextResponse.json({
        pushEnabled: false,
        reminderFrequencyMinutes: 1440,
        reminderStartTime: "09:00",
        quietHoursStart: "21:00",
      });
    }

    return NextResponse.json({
      pushEnabled: prefs.pushEnabled,
      reminderFrequencyMinutes: prefs.reminderFrequencyMinutes,
      reminderStartTime: prefs.reminderStartTime,
      quietHoursStart: prefs.quietHoursStart,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[PUSH] Get preferences error:", error);
    return NextResponse.json({ error: "Failed to get preferences." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    const input = UpdatePreferencesSchema.parse(body);

    await prisma.userPreference.upsert({
      where: { userId },
      update: input,
      create: { userId, ...input },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid preferences", issues: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[PUSH] Update preferences error:", error);
    return NextResponse.json({ error: "Failed to update preferences." }, { status: 500 });
  }
}
