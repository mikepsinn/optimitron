import {
  ContentVisibility,
  OrganizationMemberRole as DbOrganizationMemberRole,
  OrgStatus,
} from "@optimitron/db"
import { prisma } from "./prisma"

/**
 * The organizations a user can act on behalf of.
 *
 * Extracted from Optimitron's 989-line organization.server rather than porting
 * that module. The rest of it reaches the task-assignment and outbound-email
 * subsystems, which nothing on the campaign apps needs — following that import
 * edge pulls roughly 16,000 lines of Optimitron into site-kit. This is the only
 * piece /join uses, and it is self-contained.
 */

const MANAGE_ROLES = new Set<DbOrganizationMemberRole>([
  DbOrganizationMemberRole.OWNER,
  DbOrganizationMemberRole.ADMIN,
])

export async function getManageableOrganizationsForUser(
  userId: string,
  options: { publiclyReferenceableOnly?: boolean } = {},
) {
  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId,
      role: { in: Array.from(MANAGE_ROLES) },
      organization: {
        deletedAt: null,
        ...(options.publiclyReferenceableOnly
          ? {
              status: OrgStatus.APPROVED,
              visibility: ContentVisibility.PUBLIC,
            }
          : {}),
      },
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  })

  return memberships.map((membership) => membership.organization)
}
