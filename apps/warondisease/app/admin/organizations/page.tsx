import { requireAdmin } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { AdminOrganizationsClient } from "./admin-organizations-client"
import { OrgStatus } from "@optimitron/db"
import { getSiteConfig } from "@/lib/site-config"

export const metadata = {
  title: `Admin - Organizations | ${getSiteConfig().title}`,
  description: "Manage partner organization applications",
}

async function getOrganizations(status?: OrgStatus) {
  const where: any = {
    deletedAt: null,
  }

  if (status) {
    where.status = status
  }

  const organizations = await prisma.organization.findMany({
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
      { status: "asc" }, // PENDING first
      { createdAt: "desc" },
    ],
  })

  return organizations
}

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: OrgStatus }>
}) {
  // Require admin access
  await requireAdmin()

  const resolvedSearchParams = await searchParams

  // Fetch organizations
  const organizations = await getOrganizations(resolvedSearchParams.status)

  // Count by status
  const [pending, approved, rejected] = await Promise.all([
    prisma.organization.count({
      where: { status: OrgStatus.PENDING, deletedAt: null },
    }),
    prisma.organization.count({
      where: { status: OrgStatus.APPROVED, deletedAt: null },
    }),
    prisma.organization.count({
      where: { status: OrgStatus.REJECTED, deletedAt: null },
    }),
  ])

  return (
    <AdminOrganizationsClient
      organizations={organizations}
      counts={{ pending, approved, rejected }}
      currentFilter={resolvedSearchParams.status}
    />
  )
}
