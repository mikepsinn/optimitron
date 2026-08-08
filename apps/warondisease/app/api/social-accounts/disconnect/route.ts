import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { SocialPlatform, ActivityType } from "@optimitron/db"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const { platform } = await req.json()

    if (!platform) {
      return NextResponse.json({ error: "Platform is required" }, { status: 400 })
    }

    // Validate platform is a valid SocialPlatform enum value
    const socialPlatform = platform.toLowerCase() as SocialPlatform

    // Delete the social account
    await prisma.socialAccount.delete({
      where: {
        userId_platform: {
          userId,
          platform: socialPlatform,
        },
      },
    })

    // Also delete the NextAuth Account record
    await prisma.account.deleteMany({
      where: {
        userId,
        provider: socialPlatform,
      },
    })

    // Create activity record
    await prisma.activity.create({
      data: {
        userId,
        type: ActivityType.PROFILE_UPDATED,
        description: "", // Description will be generated from type and metadata
        metadata: JSON.stringify({ platform }),
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error disconnecting social account:", error)

    // Handle auth errors
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Failed to disconnect account" }, { status: 500 })
  }
}
