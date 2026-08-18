import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const preferences = await prisma.notificationPreference.findMany({
      where: { userId },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { type, channel, enabled } = await req.json();

    if (!type || !channel || typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "type, channel, and enabled are required" },
        { status: 400 },
      );
    }

    await prisma.notificationPreference.upsert({
      where: {
        userId_type_channel: { userId, type, channel },
      },
      update: { enabled },
      create: { userId, type, channel, enabled },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating notification preference:", error);
    return NextResponse.json(
      { error: "Failed to update notification preference" },
      { status: 500 },
    );
  }
}
