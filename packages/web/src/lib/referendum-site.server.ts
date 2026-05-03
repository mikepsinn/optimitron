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

  const requestedPage = Math.max(1, Math.floor(options.signersPage ?? 1));

  const [
    individualCount,
    representedHumanCount,
    memorialVoteCount,
    organizationCount,
    allPublicSigners,
    referrerCounts,
  ] = await Promise.all([
    prisma.referendumVote.count({
      where: buildOfficialReferendumVoteWhere({
        answer: VotePosition.YES,
        referendumId: context.referendum.id,
      }),
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
        ...publicSignersWhere,
        referredByUserId: { not: null },
      },
      _count: { referredByUserId: true },
    }),
  ]);

  const publicSignersTotal = allPublicSigners.length;
  const referredCountByUserId = new Map<string, number>();
  for (const row of referrerCounts) {
    if (row.referredByUserId) {
      referredCountByUserId.set(
        row.referredByUserId,
        row._count.referredByUserId,
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

  const totalPages = Math.max(
    1,
    Math.ceil(publicSignersTotal / PUBLIC_SIGNERS_PAGE_SIZE),
  );
  const page = Math.min(requestedPage, totalPages);
  const skip = (page - 1) * PUBLIC_SIGNERS_PAGE_SIZE;

  const signerRows = ranked.slice(skip, skip + PUBLIC_SIGNERS_PAGE_SIZE);
  const currentUserSigner = options.currentUserId
    ? ranked.find((entry) => entry.user.id === options.currentUserId) ?? null
    : null;

  const treatyParentTask =
    site.key === "onePercentTreaty"
      ? await getTaskDetailData(TREATY_PARENT_TASK_ID, null)
      : null;

  return {
    ...context,
    lateEmployeeProgramTask:
      site.key === "onePercentTreaty"
        ? ((treatyParentTask?.task ?? null) as TaskCardTask | null)
        : null,
    lateEmployeeTasks:
      site.key === "onePercentTreaty"
        ? ((treatyParentTask?.task.childTasks ?? []) as unknown as TaskCardTask[])
        : [],
    fullTasksHref:
      site.key === "onePercentTreaty" ? getTreatyParentTaskHref() : ROUTES.tasks,
    individualCount,
    representedHumanCount,
    memorialVoteCount,
    organizationCount,
    treatyMarkdown:
      site.key === "onePercentTreaty"
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
