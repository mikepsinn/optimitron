import { canManageOrganization, ForbiddenError } from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";

export async function assertCanPledgeForOrganization(
  userId: string,
  organizationId: string,
): Promise<void> {
  const [organization, user, canManage] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        creatorId: true,
        deletedAt: true,
        id: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isAdmin: true,
      },
    }),
    canManageOrganization(userId, organizationId),
  ]);

  if (!organization || organization.deletedAt) {
    throw new Error("Organization not found.");
  }

  if (user?.isAdmin || organization.creatorId === userId || canManage) {
    return;
  }

  throw new ForbiddenError(
    "You do not have permission to pledge for this organization.",
  );
}
