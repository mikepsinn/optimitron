import { OrganizationMemberRole, type Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import type { TaskClientAccessBoundary } from "@/lib/tasks/task-visibility.server";

export const SOURCE_ARTIFACT_NOT_FOUND_MESSAGE = "Source artifact not found";

export function getSourceArtifactVisibilityWhere(
  userId?: string | null,
  clientAccessBoundary?: TaskClientAccessBoundary,
): Prisma.SourceArtifactWhereInput {
  const viewerAccess: Prisma.SourceArtifactWhereInput = !userId
    ? { isPublic: true }
    : {
        OR: [
          { isPublic: true },
          { ownerUserId: userId },
          {
            ownerOrganization: {
              members: { some: { userId } },
            },
          },
        ],
      };
  if (!clientAccessBoundary) return viewerAccess;

  const clientAccess: Prisma.SourceArtifactWhereInput[] = [
    { isPublic: true },
  ];
  if (clientAccessBoundary.allowPersonalPrivate) {
    clientAccess.push({ isPublic: false, ownerOrganizationId: null });
  }
  if (clientAccessBoundary.organizationIds === null) {
    clientAccess.push({
      isPublic: false,
      ownerOrganizationId: { not: null },
    });
  } else if (clientAccessBoundary.organizationIds.length > 0) {
    clientAccess.push({
      isPublic: false,
      ownerOrganizationId: {
        in: [...clientAccessBoundary.organizationIds],
      },
    });
  }

  return { AND: [viewerAccess, { OR: clientAccess }] };
}

export function getSourceArtifactManageWhere(
  userId: string,
): Prisma.SourceArtifactWhereInput {
  return {
    OR: [
      { isPublic: false, ownerUserId: userId },
      {
        isPublic: false,
        ownerOrganization: {
          members: {
            some: {
              role: {
                in: [
                  OrganizationMemberRole.OWNER,
                  OrganizationMemberRole.ADMIN,
                ],
              },
              userId,
            },
          },
        },
      },
    ],
  };
}

export async function canUserViewSourceArtifact(
  sourceArtifactId: string,
  userId?: string | null,
) {
  const id = sourceArtifactId.trim();
  if (!id) return false;
  const artifact = await prisma.sourceArtifact.findFirst({
    where: {
      deletedAt: null,
      id,
      ...getSourceArtifactVisibilityWhere(userId),
    },
    select: { id: true },
  });
  return artifact != null;
}

export async function assertUserCanManagePrivateSourceArtifact(
  sourceArtifactId: string,
  userId: string,
) {
  const artifact = await prisma.sourceArtifact.findFirst({
    where: {
      deletedAt: null,
      id: sourceArtifactId,
      ...getSourceArtifactManageWhere(userId),
    },
    select: { id: true },
  });
  if (!artifact) throw new Error(SOURCE_ARTIFACT_NOT_FOUND_MESSAGE);
}
