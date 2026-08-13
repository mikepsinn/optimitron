import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { OrgStatus } from "@optimitron/db"

// Force dynamic rendering (uses headers for auth)
export const dynamic = 'force-dynamic'

// GET /api/admin/organizations - List organizations with filters
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin()

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") as OrgStatus | null
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build where clause
    const where: any = {
      deletedAt: null,
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
      ]
    }

    // Fetch organizations
    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          type: true,
          website: true,
          contactEmail: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { status: "asc" }, // PENDING first, then APPROVED, then REJECTED
          { createdAt: "desc" },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.organization.count({ where }),
    ])

    return NextResponse.json({
      organizations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error: any) {
    console.error("Admin API Error:", error)

    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized - admin access required" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    )
  }
}
