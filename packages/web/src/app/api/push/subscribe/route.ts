import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    const input = SubscribeSchema.parse(body);

    await prisma.webPushSubscription.upsert({
      where: { endpoint: input.endpoint },
      update: {
        userId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: req.headers.get("user-agent"),
        expired: false,
      },
      create: {
        userId,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: req.headers.get("user-agent"),
      },
    });

    // Create default notification preference if not exists
    await prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid subscription", issues: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[PUSH] Subscribe error:", error);
    return NextResponse.json({ error: "Failed to save subscription." }, { status: 500 });
  }
}
