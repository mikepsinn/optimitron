import { ActivityType } from "@optimitron/db"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-utils"
import { createLogger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"

const log = createLogger("api:admin:users:id")

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const body = await request.json()

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const allowedKeys = ["isAdmin"]
    const extraKeys = Object.keys(body).filter((key) => !allowedKeys.includes(key))

    if (extraKeys.length > 0 || typeof body.isAdmin !== "boolean") {
      return NextResponse.json(
        { error: "Only the isAdmin boolean field can be updated" },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        isAdmin: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (targetUser.id === admin.id && body.isAdmin === false) {
      return NextResponse.json(
        { error: "You cannot remove your own admin access" },
        { status: 400 }
      )
    }

    if (targetUser.isAdmin && body.isAdmin === false) {
      const adminCount = await prisma.user.count({
        where: {
          deletedAt: null,
          isAdmin: true,
        },
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "You cannot remove the last remaining admin" },
          { status: 400 }
        )
      }
    }

    if (targetUser.isAdmin === body.isAdmin) {
      return NextResponse.json({
        success: true,
        user: targetUser,
      })
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        isAdmin: body.isAdmin,
      },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        person: {
          select: {
            handle: true,
            displayName: true,
            isPublic: true,
          },
        },
      },
    })

    await prisma.activity.create({
      data: {
        userId: admin.id,
        type: ActivityType.UPDATED_PROFILE,
        description: `Admin ${body.isAdmin ? "granted" : "revoked"} admin access for ${targetUser.email}`,
        metadata: JSON.stringify({
          action: body.isAdmin ? "grant_admin" : "revoke_admin",
          adminId: admin.id,
          targetUserId: targetUser.id,
        }),
      },
    })

    log.info(
      `Admin ${admin.email} ${body.isAdmin ? "granted" : "revoked"} admin access for ${targetUser.email}`
    )

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error: any) {
    log.error("Error updating admin user:", error)

    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized - admin access required" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}
