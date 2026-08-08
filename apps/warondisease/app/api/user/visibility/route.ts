import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

// PATCH /api/user/visibility — toggle the current user's profile publicity.
// Used by the post-vote public-profile prompt (components/landing/treaty-vote-section.tsx).
// Public profiles let the user's recruiter see their name on the Impact Tree.
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireAuth()

    const body = await req.json().catch(() => ({}))
    const { isPublic } = body

    if (typeof isPublic !== "boolean") {
      return NextResponse.json(
        { error: "Body must include isPublic: boolean" },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isPublic },
      select: { id: true, isPublic: true },
    })

    return NextResponse.json({ success: true, user }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : "Failed to update visibility"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
