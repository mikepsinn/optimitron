import {
  OrganizationReferendumPositionStatus,
  OrgStatus,
  type Prisma,
  VotePosition,
} from "@optimitron/db";
import {
  shareableSnippets,
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@optimitron/data/parameters";
import { getReferendumSiteContent } from "@/content/referendum-sites";
import type { ReferendumSiteContent } from "@/content/referendum-sites";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { prisma } from "@/lib/prisma";
import type { SiteConfig } from "@/lib/site";
import { getTaskDetailData } from "@/lib/tasks.server";
import { ROUTES } from "@/lib/routes";
import {
  getTreatyParentTaskHref,
  TREATY_PARENT_TASK_ID,
} from "@/lib/tasks/task-keys";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { userDisplaySelect, type UserForDisplay } from "@/lib/user-display";
import {
  buildMemorialReferendumVoteWhere,
  buildOfficialReferendumVoteWhere,
  buildRepresentedReferendumVoteWhere,
} from "@/lib/referendum-vote-classification.server";

export const PUBLIC_SIGNERS_PAGE_SIZE = 48;

export interface PublicSignerEntry {
  id: string;
  createdAt: Date;
  kind?: "human";
  rank: number;
  referredYesCount: number;
  livesSaved: number;
  hoursPrevented: number;
  user: UserForDisplay;
}

export interface PublicSignersPage {
  currentUserSigner: PublicSignerEntry | null;
  signers: PublicSignerEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PublicHumanSignatoryEntry extends PublicSignerEntry {
  kind: "human";
}

export interface PublicOrganizationSignatoryEntry {
  id: string;
  createdAt: Date;
  kind: "organization";
  rank: number;
  referredYesCount: number;
  livesSaved: number;
  hoursPrevented: number;
  statement: string | null;
  organization: {
    description: string | null;
    id: string;
    name: string;
    slug: string;
    squareLogoUrl: string | null;
    website: string | null;
  };
}

export type PublicSignatoryEntry =
  | PublicHumanSignatoryEntry
  | PublicOrganizationSignatoryEntry;

export interface PublicSignatoriesPage {
  currentUserSigner: PublicHumanSignatoryEntry | null;
  currentUserStatus: PublicSignatoryUserStatus | null;
  signatories: PublicSignatoryEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PublicSignatoryUserStatus {
  hasYesVote: boolean;
  isPublic: boolean;
  listed: boolean;
  rank: number | null;
  referredYesCount: number;
}

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
  lateEmployeeProgramTask: TaskCardTask | null;
  lateEmployeeTasks: TaskCardTask[];
  fullTasksHref: string;
  individualCount: number;
  /** Living-but-couldn't-click-the-button represented votes (PRD Feature 2). */
  representedHumanCount: number;
  /** Memorial votes — deceased people whose representatives spoke for them. */
  memorialVoteCount: number;
  organizationCount: number;
  treatyMarkdown: string;
  publicSigners: PublicSignersPage;
  publicSignatories: PublicSignatoriesPage;
}

export type ReferendumSiteSupporterRecord =
  Prisma.OrganizationReferendumPositionGetPayload<{
    include: {
      organization: {
        select: {
          description: true;
          id: true;
          name: true;
          slug: true;
          squareLogoUrl: true;
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
  if (!site.primaryReferendumSlug || !site.contentKey) {
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
  options: { signersPage?: number; currentUserId?: string | null } = {},
): Promise<ReferendumSiteHomeData | null> {
  const context = await getReferendumSiteContext(site);
  if (!context) {
    return null;
  }

  const publicSignersWhere = buildOfficialReferendumVoteWhere({
    answer: VotePosition.YES,
    publicOnly: true,
    referendumId: context.referendum.id,
  });
  const recruitedVoteWhere = buildOfficialReferendumVoteWhere({
    answer: VotePosition.YES,
    referendumId: context.referendum.id,
  });

  const requestedPage = Math.max(1, Math.floor(options.signersPage ?? 1));

  const [
    individualCount,
    representedHumanCount,
    memorialVoteCount,
    organizationCount,
    allPublicSigners,
    referrerCounts,
    allOrganizationSignatories,
    organizationReferrerCounts,
    currentUserProfile,
  ] = await Promise.all([
    prisma.referendumVote.count({
      where: recruitedVoteWhere,
    }),
    prisma.referendumVote.count({
      where: buildRepresentedReferendumVoteWhere({
        answer: VotePosition.YES,
        publicOnly: true,
        referendumId: context.referendum.id,
      }),
    }),
    prisma.referendumVote.count({
      where: buildMemorialReferendumVoteWhere({
        answer: VotePosition.YES,
        publicOnly: true,
        referendumId: context.referendum.id,
      }),
    }),
    prisma.organizationReferendumPosition.count({
      where: buildApprovedOrganizationPositionWhere(context.referendum.id),
    }),
    prisma.referendumVote.findMany({
      where: publicSignersWhere,
      select: {
        id: true,
        createdAt: true,
        userId: true,
        user: { select: userDisplaySelect },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.referendumVote.groupBy({
      by: ["referredByUserId"],
      where: {
        ...recruitedVoteWhere,
        referredByUserId: { not: null },
      },
      _count: { referredByUserId: true },
    }),
    prisma.organizationReferendumPosition.findMany({
      where: buildApprovedOrganizationPositionWhere(context.referendum.id),
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            website: true,
            squareLogoUrl: true,
            description: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
    prisma.referendumVote.groupBy({
      by: ["organizationId"],
      where: {
        ...recruitedVoteWhere,
        organizationId: { not: null },
      },
      _count: { organizationId: true },
    }),
    options.currentUserId
      ? prisma.user.findUnique({
          where: { id: options.currentUserId },
          select: {
            person: { select: { isPublic: true } },
            referendumVotes: {
              where: recruitedVoteWhere,
              select: { id: true },
              take: 1,
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const referredCountByUserId = new Map<string, number>();
  for (const row of referrerCounts) {
    if (row.referredByUserId) {
      referredCountByUserId.set(
        row.referredByUserId,
        row._count.referredByUserId,
      );
    }
  }
  const referredCountByOrganizationId = new Map<string, number>();
  for (const row of organizationReferrerCounts) {
    if (row.organizationId) {
      referredCountByOrganizationId.set(
        row.organizationId,
        row._count.organizationId,
      );
    }
  }

  // Sort by referral count desc (tiebreak: earliest signup first), then
  // assign global ranks so page 2+ carries the correct #N across pages.
  const ranked: PublicSignerEntry[] = allPublicSigners
    .map((row) => {
      const referredYesCount = referredCountByUserId.get(row.userId) ?? 0;
      const multiplier = 1 + referredYesCount;
      return {
        id: row.id,
        createdAt: row.createdAt,
        kind: "human" as const,
        referredYesCount,
        livesSaved: VOTER_LIVES_SAVED.value * multiplier,
        hoursPrevented: VOTER_SUFFERING_HOURS_PREVENTED.value * multiplier,
        rank: 0,
        user: row.user as UserForDisplay,
      };
    })
    .sort((a, b) => {
      if (b.referredYesCount !== a.referredYesCount) {
        return b.referredYesCount - a.referredYesCount;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const organizationSignatoryEntries: PublicOrganizationSignatoryEntry[] =
    allOrganizationSignatories.map((row) => {
      const referredYesCount =
        referredCountByOrganizationId.get(row.organizationId) ?? 0;
      return {
        id: row.id,
        createdAt: row.createdAt,
        kind: "organization" as const,
        referredYesCount,
        livesSaved: VOTER_LIVES_SAVED.value * referredYesCount,
        hoursPrevented:
          VOTER_SUFFERING_HOURS_PREVENTED.value * referredYesCount,
        rank: 0,
        statement: row.statement,
        organization: row.organization,
      };
    })
    .filter((entry) => entry.referredYesCount > 0);

  const rankedSignatories: PublicSignatoryEntry[] = [
    ...(ranked as PublicHumanSignatoryEntry[]),
    ...organizationSignatoryEntries,
  ]
    .sort((a, b) => {
      if (b.referredYesCount !== a.referredYesCount) {
        return b.referredYesCount - a.referredYesCount;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const publicSignatoriesTotal = rankedSignatories.length;
  const publicSignersTotal = ranked.length;

  const totalPages = Math.max(
    1,
    Math.ceil(publicSignersTotal / PUBLIC_SIGNERS_PAGE_SIZE),
  );
  const page = Math.min(requestedPage, totalPages);
  const skip = (page - 1) * PUBLIC_SIGNERS_PAGE_SIZE;

  const signerRows = ranked.slice(skip, skip + PUBLIC_SIGNERS_PAGE_SIZE);
  const currentUserSigner = options.currentUserId
    ? (ranked.find((entry) => entry.user.id === options.currentUserId) ?? null)
    : null;
  const signatoriesTotalPages = Math.max(
    1,
    Math.ceil(publicSignatoriesTotal / PUBLIC_SIGNERS_PAGE_SIZE),
  );
  const signatoriesPage = Math.min(requestedPage, signatoriesTotalPages);
  const signatoriesSkip = (signatoriesPage - 1) * PUBLIC_SIGNERS_PAGE_SIZE;
  const signatoryRows = rankedSignatories.slice(
    signatoriesSkip,
    signatoriesSkip + PUBLIC_SIGNERS_PAGE_SIZE,
  );
  const currentUserSignatory = options.currentUserId
    ? (rankedSignatories.find(
        (entry): entry is PublicHumanSignatoryEntry =>
          entry.kind === "human" && entry.user.id === options.currentUserId,
      ) ?? null)
    : null;
  const currentUserStatus =
    options.currentUserId && currentUserProfile
      ? {
          hasYesVote: currentUserProfile.referendumVotes.length > 0,
          isPublic: currentUserProfile.person?.isPublic ?? false,
          listed: Boolean(currentUserSignatory),
          rank: currentUserSignatory?.rank ?? null,
          referredYesCount:
            referredCountByUserId.get(options.currentUserId) ?? 0,
        }
      : null;

  const isTreatyCampaignSite =
    site.primaryReferendumSlug === TREATY_REFERENDUM_SLUG;
  const treatyParentTask = isTreatyCampaignSite
    ? await getTaskDetailData(TREATY_PARENT_TASK_ID, null)
    : null;

  return {
    ...context,
    lateEmployeeProgramTask: isTreatyCampaignSite
      ? ((treatyParentTask?.task ?? null) as TaskCardTask | null)
      : null,
    lateEmployeeTasks: isTreatyCampaignSite
      ? ((treatyParentTask?.task.childTasks ?? []) as unknown as TaskCardTask[])
      : [],
    fullTasksHref: isTreatyCampaignSite
      ? getTreatyParentTaskHref()
      : ROUTES.tasks,
    individualCount,
    representedHumanCount,
    memorialVoteCount,
    organizationCount,
    treatyMarkdown: isTreatyCampaignSite
      ? shareableSnippets.onePercentTreatyText.markdown
      : "",
    publicSigners: {
      currentUserSigner,
      signers: signerRows,
      totalCount: publicSignersTotal,
      page,
      pageSize: PUBLIC_SIGNERS_PAGE_SIZE,
      totalPages,
    },
    publicSignatories: {
      currentUserSigner: currentUserSignatory,
      currentUserStatus,
      signatories: signatoryRows,
      totalCount: publicSignatoriesTotal,
      page: signatoriesPage,
      pageSize: PUBLIC_SIGNERS_PAGE_SIZE,
      totalPages: signatoriesTotalPages,
    },
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
          squareLogoUrl: true,
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
