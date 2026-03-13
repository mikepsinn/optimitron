import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

const UnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    const { endpoint } = UnsubscribeSchema.parse(body);

    await prisma.webPushSubscription.updateMany({
      where: { userId, endpoint },
      data: { expired: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[PUSH] Unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe." }, { status: 500 });
  }
}
