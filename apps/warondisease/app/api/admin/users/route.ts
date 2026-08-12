import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@optimitron/db"
import { requireAdmin } from "@/lib/auth-utils"
import { createLogger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"

const log = createLogger("api:admin:users")

type UserAdminFilter = "ADMINS" | "UNVERIFIED"

export const dynamic = "force-dynamic"

function isUserAdminFilter(value?: string | null): value is UserAdminFilter {
  return value === "ADMINS" || value === "UNVERIFIED"
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const searchParams = request.nextUrl.searchParams
    const filterParam = searchParams.get("filter")
    const filter = isUserAdminFilter(filterParam) ? filterParam : undefined
    const search = searchParams.get("search")?.trim()
    const parsedLimit = Number.parseInt(searchParams.get("limit") || "50", 10)
    const parsedOffset = Number.parseInt(searchParams.get("offset") || "0", 10)
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50
    const offset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    }

    if (filter === "ADMINS") {
      where.isAdmin = true
    }

    if (filter === "UNVERIFIED") {
      where.emailVerified = null
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        {
          person: {
            displayName: { contains: search, mode: "insensitive" },
          },
        },
        {
          person: {
            handle: { contains: search, mode: "insensitive" },
          },
        },
        {
          organizationMemberships: {
            some: {
              organization: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          },
        },
      ]
    }

    const [usersRaw, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          isAdmin: true,
          emailVerified: true,
          newsletterSubscribed: true,
          createdAt: true,
          updatedAt: true,
          person: {
            select: {
              handle: true,
              displayName: true,
              isPublic: true,
            },
          },
          organizationMemberships: {
            select: {
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            take: 1,
          },
          _count: {
            select: {
              createdOrganizations: true,
              socialAccounts: true,
            },
          },
        },
        orderBy: [
          { isAdmin: "desc" },
          { createdAt: "desc" },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ])

    const users = usersRaw.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.person?.displayName ?? null,
      username: u.person?.handle ?? null,
      isAdmin: u.isAdmin,
      emailVerified: u.emailVerified,
      newsletterSubscribed: u.newsletterSubscribed,
      isPublic: u.person?.isPublic ?? false,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      organization: u.organizationMemberships[0]?.organization ?? null,
      _count: u._count,
    }))

    return NextResponse.json({
      users,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error: any) {
    log.error("Error fetching admin users:", error)

    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized - admin access required" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
