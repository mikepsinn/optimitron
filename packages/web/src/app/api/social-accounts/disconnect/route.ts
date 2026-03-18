import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { ActivityType, SocialPlatform } from "@optimitron/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { platform } = await req.json();

    if (!platform) {
      return NextResponse.json(
        { error: "Platform is required" },
        { status: 400 },
      );
    }

    // Validate platform is a valid SocialPlatform enum value
    const upperPlatform = platform.toUpperCase() as SocialPlatform;

    await prisma.socialAccount.delete({
      where: {
        userId_platform: {
          userId,
          platform: upperPlatform,
        },
      },
    });

    // Also delete the NextAuth Account record
    await prisma.account.deleteMany({
      where: {
        userId,
        provider: platform.toLowerCase(),
      },
    });

    // Create activity record
    await prisma.activity.create({
      data: {
        userId,
        type: ActivityType.UPDATED_PROFILE,
        description: "",
        metadata: JSON.stringify({ platform: upperPlatform }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting social account:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 500 },
    );
  }
}
