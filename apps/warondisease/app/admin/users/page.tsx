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
      name: true,
      username: true,
      isAdmin: true,
      emailVerified: true,
      newsletterSubscribed: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
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
  }).then((users) =>
    users.map((u) => ({
      ...u,
      organization: u.organizationMemberships[0]?.organization ?? null,
    })),
  )
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { filter?: string }
}) {
  const admin = await requireAdmin()
  const filter = isUserAdminFilter(searchParams.filter) ? searchParams.filter : undefined

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
