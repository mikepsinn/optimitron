import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { ActivityType, SocialPlatform } from "@optimitron/db";

const WALLET_PLATFORMS = new Set<string>([
  SocialPlatform.ETHEREUM,
  SocialPlatform.BASE,
]);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { platform, walletAddress } = (await req.json()) as {
      platform?: string;
      walletAddress?: string;
    };

    if (!platform || !walletAddress) {
      return NextResponse.json(
        { error: "platform and walletAddress are required" },
        { status: 400 },
      );
    }

    const upperPlatform = platform.toUpperCase();
    if (!WALLET_PLATFORMS.has(upperPlatform)) {
      return NextResponse.json(
        { error: "Invalid wallet platform" },
        { status: 400 },
      );
    }

    await prisma.socialAccount.upsert({
      where: {
        userId_platform: {
          userId,
          platform: upperPlatform as SocialPlatform,
        },
      },
      update: { walletAddress },
      create: {
        userId,
        platform: upperPlatform as SocialPlatform,
        walletAddress,
        isPrimary: true,
      },
    });

    await prisma.activity.create({
      data: {
        userId,
        type: ActivityType.UPDATED_PROFILE,
        description: "",
        metadata: JSON.stringify({
          platform: upperPlatform,
          walletAddress,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error connecting wallet:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to connect wallet" },
      { status: 500 },
    );
  }
}
