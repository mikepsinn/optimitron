import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { ShareSource } from "@optimitron/db"
import { nanoid } from "nanoid"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const { platform } = await req.json()

    await prisma.shareAttempt.create({
      data: {
        id: nanoid(),
        userId,
        source: ShareSource.IN_APP,
        surface: "share_api",
        channel: typeof platform === "string" ? platform : "unknown",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Failed to log share intent:", error)
    return NextResponse.json({ error: "Failed to log share intent" }, { status: 500 })
  }
}
