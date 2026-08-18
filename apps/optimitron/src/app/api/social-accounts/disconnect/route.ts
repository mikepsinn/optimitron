import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { ActivityType, SocialPlatform } from "@optimitron/db";

const AUTH_ACCOUNT_PROVIDERS = new Set<string>(["google"]);
const SOCIAL_PLATFORMS = new Set<string>(Object.values(SocialPlatform));

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

    const normalizedPlatform = String(platform).trim();
    const upperPlatform = normalizedPlatform.toUpperCase();
    const providerId = normalizedPlatform.toLowerCase();
    const isSocialPlatform = SOCIAL_PLATFORMS.has(upperPlatform);
    const isAuthAccountProvider = AUTH_ACCOUNT_PROVIDERS.has(providerId);

    if (!isSocialPlatform && !isAuthAccountProvider) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 },
      );
    }

    if (isSocialPlatform) {
      await prisma.socialAccount.deleteMany({
        where: {
          userId,
          platform: upperPlatform as SocialPlatform,
        },
      });
    }

    await prisma.account.deleteMany({
      where: {
        userId,
        provider: providerId,
      },
    });

    await prisma.activity.create({
      data: {
        userId,
        type: ActivityType.UPDATED_PROFILE,
        description: "",
        metadata: JSON.stringify({ platform: upperPlatform || providerId.toUpperCase() }),
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
