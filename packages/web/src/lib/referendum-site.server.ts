import {
  OrganizationReferendumPositionStatus,
  OrgStatus,
  type Prisma,
  VotePosition,
} from "@optimitron/db";
import { getReferendumSiteContent } from "@/content/referendum-sites";
import type { ReferendumSiteContent } from "@/content/referendum-sites";
import { prisma } from "@/lib/prisma";
import type { SiteConfig } from "@/lib/site";

interface ReferendumSiteRecord {
  description: string | null;
  id: string;
  title: string;
}

export interface ReferendumSiteContext {
  content: ReferendumSiteContent;
  referendum: ReferendumSiteRecord;
  site: SiteConfig;
}

export interface ReferendumSiteHomeData extends ReferendumSiteContext {
  individualCount: number;
  organizationCount: number;
}

export type ReferendumSiteSupporterRecord =
  Prisma.OrganizationReferendumPositionGetPayload<{
    include: {
      organization: {
        select: {
          description: true;
          id: true;
          logo: true;
          name: true;
          slug: true;
          website: true;
        };
      };
    };
  }>;

export interface ReferendumSiteSupportersData extends ReferendumSiteContext {
  supporters: ReferendumSiteSupporterRecord[];
}

export function buildApprovedOrganizationPositionWhere(
  referendumId: string,
): Prisma.OrganizationReferendumPositionWhereInput {
  return {
    referendumId,
    position: VotePosition.YES,
    status: OrganizationReferendumPositionStatus.APPROVED,
    deletedAt: null,
    organization: {
      status: OrgStatus.APPROVED,
      deletedAt: null,
    },
  };
}

export async function getReferendumSiteContext(
  site: SiteConfig,
): Promise<ReferendumSiteContext | null> {
  if (!site.primaryReferendumSlug) {
    return null;
  }

  const referendum = await prisma.referendum.findUnique({
    where: { slug: site.primaryReferendumSlug },
    select: { id: true, title: true, description: true },
  });

  if (!referendum) {
    return null;
  }

  return {
    site,
    referendum,
    content: getReferendumSiteContent(site.contentKey),
  };
}

export async function getReferendumSiteHomeData(
  site: SiteConfig,
): Promise<ReferendumSiteHomeData | null> {
  const context = await getReferendumSiteContext(site);
  if (!context) {
    return null;
  }

  const [individualCount, organizationCount] = await Promise.all([
    prisma.referendumVote.count({
      where: {
        referendumId: context.referendum.id,
        deletedAt: null,
        answer: VotePosition.YES,
      },
    }),
    prisma.organizationReferendumPosition.count({
      where: buildApprovedOrganizationPositionWhere(context.referendum.id),
    }),
  ]);

  return {
    ...context,
    individualCount,
    organizationCount,
  };
}

export async function getReferendumSiteSupportersData(
  site: SiteConfig,
): Promise<ReferendumSiteSupportersData | null> {
  const context = await getReferendumSiteContext(site);
  if (!context) {
    return null;
  }

  const supporters = await prisma.organizationReferendumPosition.findMany({
    where: buildApprovedOrganizationPositionWhere(context.referendum.id),
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          website: true,
          logo: true,
          description: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return {
    ...context,
    supporters,
  };
}
