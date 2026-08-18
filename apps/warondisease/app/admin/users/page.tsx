import { Prisma } from "@optimitron/db"
import { requireAdmin } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { getSiteConfig } from "@/lib/site-config"
import { AdminUsersClient } from "./admin-users-client"

type UserAdminFilter = "ADMINS" | "UNVERIFIED"

export const metadata = {
  title: `Admin - Users | ${getSiteConfig().title}`,
  description: "Manage user accounts and admin access",
}

function isUserAdminFilter(value?: string): value is UserAdminFilter {
  return value === "ADMINS" || value === "UNVERIFIED"
}

async function getUsers(filter?: UserAdminFilter) {
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
  }

  if (filter === "ADMINS") {
    where.isAdmin = true
  }

  if (filter === "UNVERIFIED") {
    where.emailVerified = null
  }

  return prisma.user.findMany({
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
      { email: "asc" },
    ],
  }).then((users) =>
    users.map((u) => ({
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
    })),
  )
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const admin = await requireAdmin()
  const resolvedSearchParams = await searchParams
  const filter = isUserAdminFilter(resolvedSearchParams.filter)
    ? resolvedSearchParams.filter
    : undefined

  const [users, total, admins, unverified] = await Promise.all([
    getUsers(filter),
    prisma.user.count({
      where: { deletedAt: null },
    }),
    prisma.user.count({
      where: { deletedAt: null, isAdmin: true },
    }),
    prisma.user.count({
      where: { deletedAt: null, emailVerified: null },
    }),
  ])

  return (
    <AdminUsersClient
      users={users}
      counts={{ total, admins, unverified }}
      currentFilter={filter}
      currentAdminId={admin.id}
    />
  )
}
